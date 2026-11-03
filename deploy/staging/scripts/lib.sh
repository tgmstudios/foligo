# Fail-closed destination guard shared by staging scripts.
set -euo pipefail
export KUBECONFIG="${STAGING_KUBECONFIG:-$HOME/.kube/config}"
NS=foligo-staging
require_staging_destination() {
  local ctx server
  ctx=$(kubectl config current-context)
  server=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
  [ "$ctx" = "tgm-rke2-onprem" ] || { echo "REFUSING: context '$ctx' != tgm-rke2-onprem" >&2; exit 2; }
  case "$server" in *c-lx99g*|*oke*|*167.234.216.95*) echo "REFUSING: server looks like production ($server)" >&2; exit 2;; esac
  kubectl get ns "$NS" -o jsonpath='{.metadata.labels.tgm\.one/data-classification}' | grep -q production-snapshot-private || { echo "REFUSING: namespace $NS missing staging label" >&2; exit 2; }
  kubectl -n "$NS" get sts postgres >/dev/null
  # destination DB must not be the prod DB service: its password secret must be the staging one
  kubectl -n "$NS" get secret foligo-staging-db >/dev/null
  [ -z "${KUBERNETES_SERVICE_HOST:-}" ] || true
}
