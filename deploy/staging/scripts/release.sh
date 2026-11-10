#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
NS=foligo-staging
PUBLISH_REGISTRY_HOST=registry.foligo-staging.svc.cluster.local:5000
PUBLISH_REPOSITORY=foligo-staging
PULL_REGISTRY=api-fstg.i.tgm.one/foligo-staging
SHA=${STAGING_SHA:-${GITHUB_SHA:-}}
[[ ${1:-} != deploy || ${STAGING_TEST_MODE:-0} == 1 || -n ${STAGING_KUBECONFIG:-} ]] || { printf '%s\\n' 'REFUSING: STAGING_KUBECONFIG must point to an externally provisioned dedicated least-privilege staging kubeconfig' >&2; exit 2; }
export KUBECONFIG=${STAGING_KUBECONFIG:-$HOME/.kube/config}
fail() { printf 'REFUSING: %s\n' "$*" >&2; exit 2; }
[[ ${1:-} != deploy || ${STAGING_TEST_MODE:-0} == 1 ]] || {
  [[ "$(kubectl config current-context)" == tgm-rke2-onprem ]] || fail 'wrong Kubernetes context'
  kubectl get namespace "$NS" >/dev/null || fail 'staging namespace unavailable'
  [[ "$(kubectl get namespace "$NS" -o jsonpath='{.metadata.labels.tgm\.one/data-classification}')" == production-snapshot-private ]] || fail 'staging namespace identity label missing'
}
[[ $SHA =~ ^[0-9a-f]{40}$ ]] || fail 'STAGING_SHA/GITHUB_SHA must be a full commit SHA'
case ${1:-} in
 publish)
  builder="foligo-staging-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"
  docker buildx create --name "$builder" --driver docker-container --config "$ROOT/deploy/staging/buildkitd.toml" --use >/dev/null
  trap 'docker buildx rm "$builder" >/dev/null 2>&1 || true' EXIT
  docker buildx inspect --bootstrap "$builder" >/dev/null
  for component in api dashboard sites; do
    docker buildx build --builder "$builder" --platform linux/amd64 --push -f "$ROOT/$component/.docker/Dockerfile" -t "$PUBLISH_REGISTRY_HOST/$PUBLISH_REPOSITORY/$component:$SHA" "$ROOT"
    registry_url="http://$PUBLISH_REGISTRY_HOST/v2/$PUBLISH_REPOSITORY/$component/manifests/$SHA"
    digest=$(curl --silent --show-error --fail --head --max-time 20 \
      -H 'Accept: application/vnd.oci.image.index.v1+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.docker.distribution.manifest.v2+json' \
      "$registry_url" | awk 'tolower($1) == "docker-content-digest:" {gsub(sprintf("%c", 13), "", $2); print $2; exit}')
    [[ $digest =~ ^sha256:[0-9a-f]{64}$ ]] || fail "registry readback returned no immutable digest for $component"
    printf '%s=%s\n' "$component" "$digest"
  done
  docker buildx rm "$builder" >/dev/null
  trap - EXIT
  ;;
 deploy)
  [[ ${DB_REFRESH_ACCEPTED:-false} == true ]] || fail 'DB_REFRESH_ACCEPTED=true is required after explicit DB acceptance'
  [[ ${STAGING_DEPLOY_APPROVED:-false} == true ]] || fail 'STAGING_DEPLOY_APPROVED=true is required'
  if [[ ${STAGING_TEST_MODE:-0} != 1 ]]; then
    git -C "$ROOT" fetch --quiet --no-tags origin +refs/heads/staging:refs/remotes/origin/staging
    [[ "$(git -C "$ROOT" rev-parse origin/staging)" == "$SHA" ]] || fail 'release commit is stale relative to origin/staging'
  fi
  images=()
  for component in api dashboard sites; do
    var=STAGING_${component^^}_DIGEST; digest=${!var:-}
    [[ $digest =~ ^sha256:[0-9a-f]{64}$ ]] || fail "missing immutable digest for $component"
    images+=("$component=$PULL_REGISTRY/$component@$digest")
  done
  checkpoint=${STAGING_CHECKPOINT_DIR:-${RUNNER_TEMP:-/tmp}/foligo-staging-$SHA}
  mkdir -p "$checkpoint"
  for component in api dashboard sites; do
    kubectl -n "$NS" get deployment "$component" -o jsonpath='{.spec.template.spec.containers[?(@.name=="'"$component"'")].image}' >"$checkpoint/$component.image"
    [[ -s "$checkpoint/$component.image" ]] || fail "could not capture rollback image for $component"
  done
  rollback() {
    for component in api dashboard sites; do
      old=$(cat "$checkpoint/$component.image")
      kubectl -n "$NS" set image "deployment/$component" "$component=$old" || true
      kubectl -n "$NS" rollout status "deployment/$component" --timeout=180s || true
    done
  }
  trap 'status=$?; if ((status != 0)); then rollback; fi' EXIT
  api_image=${images[0]#api=}
  job="foligo-migrate-${SHA:0:12}"
  kubectl -n "$NS" delete job "$job" --ignore-not-found --wait=true
  python3 - "$job" "$api_image" <<'PY' | kubectl -n "$NS" create -f -
import json, sys
name, image = sys.argv[1:]
print(json.dumps({"apiVersion":"batch/v1","kind":"Job","metadata":{"name":name,"namespace":"foligo-staging","labels":{"app.kubernetes.io/part-of":"foligo-staging"}},"spec":{"backoffLimit":0,"activeDeadlineSeconds":600,"template":{"metadata":{"labels":{"job-name":name}},"spec":{"restartPolicy":"Never","containers":[{"name":"migrate","image":image,"imagePullPolicy":"IfNotPresent","workingDir":"/usr/src/app/api","command":["sh","-lc","npx prisma migrate deploy"],"env":[{"name":"DATABASE_URL","valueFrom":{"secretKeyRef":{"name":"foligo-staging-api","key":"DATABASE_URL"}}}]}]}}}}))
PY
  kubectl -n "$NS" wait --for=condition=complete "job/$job" --timeout=600s
  for assignment in "${images[@]}"; do
    component=${assignment%%=*}; image=${assignment#*=}
    if [[ $component == api ]]; then
      kubectl -n "$NS" patch deployment api --type=strategic --patch-file "$ROOT/deploy/staging/api-runtime-patch.json"
    fi
    kubectl -n "$NS" set image "deployment/$component" "$component=$image"
    kubectl -n "$NS" rollout status "deployment/$component" --timeout=300s
  done
  for url in https://api-fstg.i.tgm.one/health https://app-fstg.i.tgm.one/ https://fstg.i.tgm.one/; do
    code=$(curl --silent --show-error --location --max-time 20 -o /dev/null -w '%{http_code}' "$url")
    [[ $code =~ ^2[0-9][0-9]$ ]] || fail "health check failed for $url (HTTP $code)"
  done
  trap - EXIT
  printf 'release verified; rollback checkpoint: %s\n' "$checkpoint"
  ;;
 *) fail 'usage: release.sh publish|deploy' ;;
esac
