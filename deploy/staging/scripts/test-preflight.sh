#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/bin"
cat > "$TMP/bin/kubectl" <<'MOCK'
#!/usr/bin/env bash
case "$*" in
 'config current-context') printf '%s\n' "${MOCK_CONTEXT:-tgm-rke2-onprem}";;
 *'get namespace '*) printf '%s' "${MOCK_UID:-6c7e0e20-655a-47bf-8d0d-cef6cc47c31d}";;
 *'get deployment '*) printf '%s' '{}';;
 *) exit 9;;
esac
MOCK
cat > "$TMP/bin/curl" <<'MOCK'
#!/usr/bin/env bash
[[ ${MOCK_TLS_FAIL:-0} == 0 ]] || exit 22
printf '%s' "${MOCK_HTTP:-200}"
MOCK
chmod +x "$TMP/bin/"*
export PATH="$TMP/bin:$PATH" STAGING_KUBECONFIG="$TMP/kubeconfig"
touch "$STAGING_KUBECONFIG"
bash "$ROOT/deploy/staging/scripts/preflight.sh"
for failure in context uid transport status; do
 case "$failure" in
 context) export MOCK_CONTEXT=wrong;;
 uid) export MOCK_UID=wrong;;
 transport) export MOCK_TLS_FAIL=1;;
 status) export MOCK_HTTP=503;;
 esac
 if bash "$ROOT/deploy/staging/scripts/preflight.sh" >/dev/null 2>&1; then printf 'unexpected pass: %s\n' "$failure"; exit 1; fi
 unset MOCK_CONTEXT MOCK_UID MOCK_TLS_FAIL MOCK_HTTP
done
printf '%s\n' 'preflight positive/negative tests passed'
