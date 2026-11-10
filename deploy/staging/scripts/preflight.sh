#!/usr/bin/env bash
# Read-only, bounded gate before building/publishing or mutating staging.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
NS=foligo-staging
HOST=api-fstg.i.tgm.one
REGISTRY="$HOST/foligo-staging"
EXPECTED_NS_UID=6c7e0e20-655a-47bf-8d0d-cef6cc47c31d
fail() { printf 'PREFLIGHT FAILED: %s\n' "$*" >&2; exit 2; }

[[ ${GITHUB_REF:-refs/heads/staging} == refs/heads/staging ]] || fail 'must run against refs/heads/staging'
command -v kubectl >/dev/null || fail 'kubectl missing'
command -v curl >/dev/null || fail 'curl missing'
command -v getent >/dev/null || fail 'getent missing'

# Source-of-truth checks use canonical manifests, Kustomize render, no writes.
rendered=$(kubectl kustomize "$ROOT/deploy/staging") || fail 'kustomize render failed'
grep -Fq "host: $HOST" <<<"$rendered" || fail 'private TLS registry hostname missing from rendered source'
grep -Fq 'name: registry' <<<"$rendered" || fail 'registry Service missing from rendered source'
grep -Fq 'number: 5000' <<<"$rendered" || fail 'registry service port mismatch'
if grep -REn '127\.0\.0\.1:|http://api-fstg|registry\.foligo-staging\.svc\.cluster\.local:5000/foligo-staging/(api|dashboard|sites)' "$ROOT/deploy/staging"/{50-api.yaml,60-dashboard.yaml,70-sites.yaml,scripts/release.sh}; then
  fail 'obsolete node-loopback or runner-Service registry reference in pull/build source'
fi

getent ahostsv4 "$HOST" >/dev/null || fail "runner DNS cannot resolve $HOST"
# HTTPS TLS validation remains enabled. V2 may legitimately return 200 or 401 absent auth.
code=$(curl --silent --show-error --connect-timeout 5 --max-time 12 -o /dev/null -w '%{http_code}' "https://$HOST/v2/") || fail "runner cannot establish validated TLS to $HOST"
[[ $code == 200 || $code == 401 ]] || fail "registry v2 boundary returned HTTP $code (expected 200 or 401)"
for component in api dashboard sites; do
  manifest="$ROOT/deploy/staging/$([[ $component == api ]] && printf 50-api.yaml || ([[ $component == dashboard ]] && printf 60-dashboard.yaml || printf 70-sites.yaml))"
  image=$(awk '$1 == "image:" {print $2; exit}' "$manifest")
  [[ $image =~ ^$HOST/foligo-staging/$component@sha256:([0-9a-f]{64})$ ]] || fail "$component source image has wrong registry/repository/reference"
  image_digest="sha256:${BASH_REMATCH[1]}"
  headers=$(curl --silent --show-error --connect-timeout 5 --max-time 12 --head -H 'Accept: application/vnd.oci.image.index.v1+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.docker.distribution.manifest.v2+json' "https://$HOST/v2/foligo-staging/$component/manifests/$image_digest" -o /dev/null -D -) || fail "$component manifest TLS/HEAD failed"
  grep -Eiq "^Docker-Content-Digest:[[:space:]]*$image_digest" <<<"$headers" || fail "$component manifest digest readback mismatch"
done

context=$(kubectl config current-context 2>/dev/null) || fail 'kubectl context unavailable'
[[ $context == tgm-rke2-onprem ]] || fail "wrong kubectl context: $context"
ns_json=$(kubectl --request-timeout=8s get namespace "$NS" -o json) || fail 'staging namespace read failed'
uid=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["metadata"]["uid"])' <<<"$ns_json")
[[ $uid == "$EXPECTED_NS_UID" ]] || fail "namespace identity mismatch: $uid"
# Refuse to build from stale source when registry topology/policies drift in the live cluster.
kubectl --request-timeout=8s diff -f "$ROOT/deploy/staging/40-registry.yaml" -f "$ROOT/deploy/staging/85-runner-registry-egress.yaml" -f "$ROOT/deploy/staging/91-registry-tls.yaml" -f "$ROOT/deploy/staging/92-registry-node-ingress.yaml" >/dev/null || fail 'live registry objects differ from source manifests (or read access failed); reconcile intentionally before release'
for component in api dashboard sites; do
  deployment=$(kubectl --request-timeout=8s -n "$NS" get deployment "$component" -o json) || fail "deployment $component unavailable"
  python3 -c 'import json,sys; d=json.load(sys.stdin); desired=d.get("spec",{}).get("replicas",1); ready=d.get("status",{}).get("readyReplicas",0); sys.exit(0 if desired > 0 and ready == desired else 1)' <<<"$deployment" || fail "deployment $component is not fully ready"
done
printf 'preflight passed: context=%s namespace=%s uid=%s registry=%s/v2 HTTP=%s; checks are read-only\n' "$context" "$NS" "$uid" "$HOST" "$code"
