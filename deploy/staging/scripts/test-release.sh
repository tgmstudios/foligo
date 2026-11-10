#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
TMP=$(mktemp -d)
trap 'status=$?; rm -rf "$TMP"; exit "$status"' EXIT
mkdir -p "$TMP/bin"
cat >"$TMP/bin/docker" <<'MOCK'
#!/usr/bin/env bash
printf 'docker %s\n' "$*" >>"$CALLS"
case "$1 $2" in
  'buildx create'|'buildx inspect'|'buildx rm') exit 0;;
  'buildx build') exit 0;;
  'buildx imagetools') printf 'Name: test\nDigest: sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n';;
  *) exit 9;;
esac
MOCK
cat >"$TMP/bin/kubectl" <<'MOCK'
#!/usr/bin/env bash
printf 'kubectl %s\n' "$*" >>"$CALLS"
if [[ "$*" == *'create -f -'* ]]; then cat >>"$CALLS"; fi
case "$*" in
  *'get deployment api '*|*'get deployment dashboard '*|*'get deployment sites '*) printf '%s\n' '127.0.0.1:32551/foligo-staging/api@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';;
  *'get job '*) exit 1;;
  *'get deployment '*) printf '%s\n' 'ok';;
  *'set image '*|*'rollout status '*|*'rollout undo '*|*'wait '*|*'delete job '*) exit 0;;
  *) exit 0;;
esac
MOCK
cat >"$TMP/bin/curl" <<'MOCK'
#!/usr/bin/env bash
printf 'curl %s\n' "$*" >>"$CALLS"
if [[ "$*" == *'--head'* ]]; then printf '%s\n' 'Docker-Content-Digest: sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'; exit 0; fi
if [[ ${CURL_FAIL:-0} == 1 ]]; then printf '503'; else printf '200'; fi
MOCK
chmod +x "$TMP/bin/"*
export CALLS="$TMP/calls" PATH="$TMP/bin:$PATH" KUBECONFIG="$TMP/kubeconfig" STAGING_KUBECONFIG="$TMP/kubeconfig"
export STAGING_TEST_MODE=1 STAGING_SHA=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
export STAGING_API_DIGEST=sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
export STAGING_DASHBOARD_DIGEST=$STAGING_API_DIGEST STAGING_SITES_DIGEST=$STAGING_API_DIGEST
export DB_REFRESH_ACCEPTED=true STAGING_DEPLOY_APPROVED=true
: >"$CALLS"
export DB_REFRESH_ACCEPTED=false
if bash "$ROOT/deploy/staging/scripts/release.sh" deploy >/dev/null 2>&1; then
  printf '%s\n' 'unsafe: deploy passed without DB acceptance' >&2; exit 1
fi
test ! -s "$CALLS"
export DB_REFRESH_ACCEPTED=true
bash "$ROOT/deploy/staging/scripts/release.sh" publish
# Verify the runner uses the scoped Service DNS endpoint and explicit HTTP BuildKit config.
grep -q 'buildx create .*--config .*deploy/staging/buildkitd.toml' "$CALLS"
grep -q 'registry.foligo-staging.svc.cluster.local:5000/foligo-staging' "$CALLS"
grep -q 'http://registry.foligo-staging.svc.cluster.local:5000/foligo-staging/v2/foligo-staging/api/manifests/' "$CALLS"
bash "$ROOT/deploy/staging/scripts/release.sh" deploy
! grep -q 'db push\|migrate resolve' "$CALLS"
grep -q 'migrate deploy' "$CALLS"
grep -q 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' "$CALLS"
grep -q 'create -f -' "$CALLS"
: >"$CALLS"
export CURL_FAIL=1
if bash "$ROOT/deploy/staging/scripts/release.sh" deploy >/dev/null 2>&1; then
  printf '%s\n' 'unsafe: failed health check was accepted' >&2; exit 1
fi
rollback_count=$(grep -c 'kubectl .*set image deployment/' "$CALLS")
test "$rollback_count" -eq 6
printf '%s\n' 'release mock boundary and rollback tests passed'
