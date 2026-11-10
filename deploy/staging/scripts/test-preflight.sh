#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
PREFLIGHT="$ROOT/deploy/staging/scripts/preflight.sh"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/bin"
cat >"$TMP/bin/kubectl" <<'MOCK'
#!/usr/bin/env bash
case "$*" in
  'kustomize '*) cat "$MANIFEST_RENDER" ;;
  'config current-context') printf '%s\n' "${MOCK_CONTEXT:-tgm-rke2-onprem}" ;;
  *'diff -f '*) [[ ${MOCK_DRIFT:-0} == 1 ]] && exit 1; exit 0 ;;
  *'get namespace foligo-staging -o json') printf '{"metadata":{"uid":"%s"}}\n' "${MOCK_UID:-6c7e0e20-655a-47bf-8d0d-cef6cc47c31d}" ;;
  *'get deployment '*'-o json') printf '{"spec":{"replicas":1},"status":{"readyReplicas":%s}}\n' "${MOCK_READY:-1}" ;;
  *) printf 'unexpected kubectl args: %s\n' "$*" >&2; exit 9 ;;
esac
MOCK
cat >"$TMP/bin/curl" <<'MOCK'
#!/usr/bin/env bash
[[ ${MOCK_TLS_FAIL:-0} == 1 ]] && exit 22
if [[ "$*" == *'--head'* ]]; then
  digest=$(printf '%s' "$*" | grep -oE 'sha256:[0-9a-f]{64}' | tail -1)
  printf 'Docker-Content-Digest: %s\n' "${MOCK_DIGEST:-$digest}"
  exit 0
fi
printf '%s' "${MOCK_HTTP:-401}"
MOCK
cat >"$TMP/bin/getent" <<'MOCK'
#!/usr/bin/env bash
[[ ${MOCK_DNS_FAIL:-0} == 1 ]] && exit 2
printf '192.168.103.30 STREAM api-fstg.i.tgm.one\n'
MOCK
chmod +x "$TMP/bin/"*
cat >"$TMP/rendered.yaml" <<'YAML'
kind: Ingress
spec:
  rules:
    - host: api-fstg.i.tgm.one
      backend: {service: {name: registry, port: {number: 5000}}}
YAML
export PATH="$TMP/bin:$PATH" MANIFEST_RENDER="$TMP/rendered.yaml" GITHUB_REF=refs/heads/staging
bash "$PREFLIGHT"
for case_name in context uid dns tls scheme drift readiness digest; do
  case "$case_name" in
    context) export MOCK_CONTEXT=wrong ;;
    uid) export MOCK_CONTEXT=tgm-rke2-onprem MOCK_UID=wrong ;;
    dns) export MOCK_UID=6c7e0e20-655a-47bf-8d0d-cef6cc47c31d MOCK_DNS_FAIL=1 ;;
    tls) export MOCK_DNS_FAIL=0 MOCK_TLS_FAIL=1 ;;
    scheme) export MOCK_TLS_FAIL=0 MOCK_HTTP=503 ;;
    drift) export MOCK_TLS_FAIL=0 MOCK_DRIFT=1 ;;
    readiness) export MOCK_DRIFT=0 MOCK_READY=0 ;;
    digest) export MOCK_READY=1 MOCK_DIGEST=sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb ;;
  esac
  if bash "$PREFLIGHT" >/dev/null 2>&1; then printf 'unsafe preflight pass for %s\n' "$case_name" >&2; exit 1; fi
  unset MOCK_CONTEXT MOCK_UID MOCK_DNS_FAIL MOCK_TLS_FAIL MOCK_HTTP MOCK_DRIFT MOCK_READY MOCK_DIGEST
done
cat >"$TMP/rendered.yaml" <<'YAML'
kind: Ingress
spec:
  rules:
    - host: wrong-host.invalid
      backend: {service: {name: registry, port: {number: 5000}}}
YAML
if bash "$PREFLIGHT" >/dev/null 2>&1; then printf '%s\n' 'unsafe preflight pass for manifest drift' >&2; exit 1; fi
printf '%s\n' 'staging preflight positive and negative regression checks passed'
