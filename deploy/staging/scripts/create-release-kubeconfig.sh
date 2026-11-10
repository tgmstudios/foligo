#!/usr/bin/env bash
set -euo pipefail

SA_DIR=/var/run/secrets/kubernetes.io/serviceaccount
[[ -r "$SA_DIR/token" && -r "$SA_DIR/ca.crt" ]]
[[ -n "$KUBERNETES_API_HOST" ]] || { printf '%s\n' 'KUBERNETES_API_HOST must be an approved RKE2 control-plane endpoint' >&2; exit 2; }
[[ -n "$RUNNER_TEMP" && -n "$GITHUB_RUN_ID" && -n "$GITHUB_RUN_ATTEMPT" ]]
work=$(mktemp -d "$RUNNER_TEMP/foligo-staging-token.XXXXXX")
chmod 700 "$work"
trap 'rm -rf -- "$work"' EXIT

# The runner ServiceAccount credential is used only for TokenRequest. All
# deployment API calls use the short-lived, namespace-scoped release identity.
python3 - "$SA_DIR/token" "$work/curl.conf" <<'PY'
import json, pathlib, sys
raw = pathlib.Path(sys.argv[1]).read_text().strip()
scheme = "Bearer "
pathlib.Path(sys.argv[2]).write_text("header = " + json.dumps("Authorization: " + scheme + raw) + "\n")
pathlib.Path(sys.argv[2]).chmod(0o600)
PY

api="https://$KUBERNETES_API_HOST:6443"
curl --silent --show-error --fail --max-time 15 \
  --cacert "$SA_DIR/ca.crt" --config "$work/curl.conf" \
  -H 'Content-Type: application/json' \
  -X POST \
  --data '{"apiVersion":"authentication.k8s.io/v1","kind":"TokenRequest","spec":{"expirationSeconds":3600}}' \
  "$api/api/v1/namespaces/foligo-staging/serviceaccounts/foligo-staging-release/token" \
  > "$work/token-response.json"

out="$RUNNER_TEMP/foligo-staging-kubeconfig-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
python3 - "$work/token-response.json" "$SA_DIR/ca.crt" "$KUBERNETES_API_HOST" 6443 "$out" <<'PY'
import base64, datetime, json, pathlib, sys
response_path, ca_path, host, port, output = sys.argv[1:]
response = json.loads(pathlib.Path(response_path).read_text())
status = response.get("status", {})
token = status.get("token")
if not token or not status.get("expirationTimestamp"):
    raise SystemExit("TokenRequest did not return a token and expirationTimestamp")
expires = datetime.datetime.fromisoformat(status["expirationTimestamp"].replace("Z", "+00:00"))
if expires <= datetime.datetime.now(datetime.timezone.utc):
    raise SystemExit("TokenRequest returned an expired token")
config = {
    "apiVersion": "v1",
    "kind": "Config",
    "clusters": [{"name": "tgm-rke2-onprem", "cluster": {
        "server": f"https://{host}:{port}",
        "certificate-authority-data": base64.b64encode(pathlib.Path(ca_path).read_bytes()).decode("ascii"),
    }}],
    "users": [{"name": "foligo-staging-release", "user": {"token": token}}],
    "contexts": [{"name": "tgm-rke2-onprem", "context": {
        "cluster": "tgm-rke2-onprem", "user": "foligo-staging-release", "namespace": "foligo-staging",
    }}],
    "current-context": "tgm-rke2-onprem",
}
path = pathlib.Path(output)
path.write_text(json.dumps(config))
path.chmod(0o600)
print("Created short-lived staging release kubeconfig; token is not logged.")
PY

printf 'STAGING_KUBECONFIG=%s\n' "$out" >> "$GITHUB_ENV"
