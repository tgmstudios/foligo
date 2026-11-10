#!/usr/bin/env bash
# Exact-scope reconciliation for staging registry routing; dry-run/check is the default.
set -euo pipefail
NS=foligo-staging
EXPECTED_NS_UID=6c7e0e20-655a-47bf-8d0d-cef6cc47c31d
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
FILES=(
  "$ROOT/deploy/staging/40-registry.yaml"
  "$ROOT/deploy/staging/85-runner-registry-egress.yaml"
  "$ROOT/deploy/staging/91-registry-tls.yaml"
  "$ROOT/deploy/staging/92-registry-node-ingress.yaml"
)
fail() { printf 'REFUSING: %s\n' "$*" >&2; exit 2; }
mode=${1:-check}
[[ $mode == check || $mode == apply ]] || fail 'usage: reconcile-registry.sh [check|apply]'
[[ $(kubectl config current-context) == tgm-rke2-onprem ]] || fail 'wrong Kubernetes context'
uid=$(kubectl --request-timeout=8s get namespace "$NS" -o jsonpath='{.metadata.uid}') || fail 'staging namespace unavailable'
[[ $uid == "$EXPECTED_NS_UID" ]] || fail 'namespace UID mismatch'
if [[ $mode == check ]]; then
  kubectl --request-timeout=8s diff -f "${FILES[0]}" -f "${FILES[1]}" -f "${FILES[2]}" -f "${FILES[3]}" || fail 'registry source/live drift detected; review diff, then explicitly run apply'
  printf '%s\n' 'staging registry objects match source manifests'
  exit 0
fi
[[ ${STAGING_RECONCILE_APPROVED:-false} == true ]] || fail 'set STAGING_RECONCILE_APPROVED=true after coordinating with the active release owner'
kubectl --request-timeout=8s apply -f "${FILES[0]}" -f "${FILES[1]}" -f "${FILES[2]}" -f "${FILES[3]}"
kubectl --request-timeout=8s diff -f "${FILES[0]}" -f "${FILES[1]}" -f "${FILES[2]}" -f "${FILES[3]}" || fail 'post-apply registry parity check failed'
printf '%s\n' 'staging registry objects reconciled and read back against source'
