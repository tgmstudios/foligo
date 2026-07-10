#!/bin/bash
# Deploy to Rancher — called from GitHub Actions
set -e

TOKEN="$1"
CLUSTER="${2:-c-lx99g}"
RANCHER="${3:-https://rancher.tgm.one}"
NS="${4:-foligo}"

if [ -z "$TOKEN" ]; then
  echo "Usage: deploy.sh <rancher-token> [cluster] [rancher-url] [namespace]"
  exit 1
fi

TS=$(date -u +%s)

deploy() {
  local app=$1
  local image="registry.tgm.one/foligo/${app}:latest"

  echo "[${app}] Updating to ${image}..."

  HTTP_CODE=$(curl -s -o /tmp/deploy_resp.txt -w "%{http_code}" \
    -X PATCH \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/strategic-merge-patch+json" \
    -d "{\"spec\":{\"template\":{\"metadata\":{\"labels\":{\"deployed-at\":\"${TS}\"}},\"spec\":{\"containers\":[{\"name\":\"${app}\",\"image\":\"${image}\",\"imagePullPolicy\":\"Always\"}]}}}}" \
    "${RANCHER}/k8s/clusters/${CLUSTER}/v1/apps.deployments/${NS}/${app}")

  if [ "$HTTP_CODE" = "200" ]; then
    echo "[${app}] OK"
  else
    echo "[${app}] FAIL (HTTP ${HTTP_CODE})"
    cat /tmp/deploy_resp.txt
    return 1
  fi
}

deploy "api"
deploy "dashboard"
deploy "sites"
