#!/usr/bin/env bash
# Runs migrate-minio-to-s3.js inside deploy/api of the WEST cluster. Requires KUBECONFIG already pointing at
# the native OCI west kubeconfig (source tgm-us-oke-cloud/source.sh us-west-1) - verified below.
# Source creds: the pod's own MINIO_* env. Destination creds: k8s secret foligo-oci-objectstorage, piped via stdin.
set -euo pipefail
NS=${NS:-foligo}
[ "${TGM_TENANT:-}" = "us-west-1" ] || { echo "TGM_TENANT must be us-west-1" >&2; exit 1; }
kubectl get namespace "$NS" >/dev/null
DIR=$(cd "$(dirname "$0")" && pwd)
kubectl exec -i -n "$NS" deploy/api -- sh -c 'cat > /tmp/migrate-minio-to-s3.js' < "$DIR/migrate-minio-to-s3.js"
python3 - "$NS" <<'PY'
import json,subprocess,base64,sys
ns=sys.argv[1]
d=json.loads(subprocess.check_output(['kubectl','get','secret','foligo-oci-objectstorage','-n',ns,'-o','json']))['data']
a=base64.b64decode(d['ACCESS_KEY']).decode(); s=base64.b64decode(d['SECRET_KEY']).decode()
script='''read -r DA; read -r DS
export SRC_ENDPOINT=minio SRC_PORT=9000 SRC_SSL=false SRC_ACCESS_KEY="$MINIO_ACCESS_KEY" SRC_SECRET_KEY="$MINIO_SECRET_KEY" SRC_BUCKET=foligo
export DST_ENDPOINT=${DST_ENDPOINT:-axuelmiwsqx4.compat.objectstorage.us-sanjose-1.oraclecloud.com} DST_PORT=443 DST_SSL=true DST_ACCESS_KEY="$DA" DST_SECRET_KEY="$DS" DST_BUCKET=foligo DST_REGION=us-sanjose-1
export MINIO_MODULE=/usr/src/app/api/node_modules/minio
node /tmp/migrate-minio-to-s3.js'''
r=subprocess.run(['kubectl','exec','-i','-n',ns,'deploy/api','--','sh','-c',script],input=a+'\n'+s+'\n',text=True)
sys.exit(r.returncode)
PY
