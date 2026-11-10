#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
[[ -n ${STAGING_KUBECONFIG:-} ]] || { printf '%s\n' 'PREFLIGHT FAILED: dedicated staging kubeconfig required' >&2; exit 2; }
export KUBECONFIG=$STAGING_KUBECONFIG
python3 "$ROOT/deploy/staging/scripts/validate-runtime.py"
[[ $(kubectl config current-context) == tgm-rke2-onprem ]]
uid=$(kubectl --request-timeout=8s get namespace foligo-staging -o jsonpath='{.metadata.uid}')
[[ $uid == 6c7e0e20-655a-47bf-8d0d-cef6cc47c31d ]]
# Runner ingress/egress is independently tested; node TLS is exercised by the pull Job.
code=$(curl --silent --show-error --fail --connect-timeout 5 --max-time 12 -o /dev/null -w '%{http_code}' http://registry.foligo-staging.svc.cluster.local:5000/v2/)
[[ $code == 200 ]]
for component in api dashboard sites; do
  kubectl --request-timeout=8s -n foligo-staging get deployment "$component" -o json >/dev/null
 done
printf '%s\n' 'preflight passed: exact staging identity, runtime config, runner registry connectivity and deployment GET access'
