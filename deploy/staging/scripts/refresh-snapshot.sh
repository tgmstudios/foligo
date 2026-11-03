#!/usr/bin/env bash
# Manual, one-shot refresh of foligo-staging DB from a prod snapshot directory made by snapshot-prod.py. NOT scheduled.
# Usage: refresh-snapshot.sh <snapdir> [--yes]   (snapdir contains foligo-prod.dump + snapshot-meta.json, mode 600, outside git)
# Destructive to STAGING DB only (drops schema public in foligo-staging/postgres-0).
here=$(cd "$(dirname "$0")" && pwd); . "$here/lib.sh"
SNAP=${1:?snapdir}; [ "${2:-}" = "--yes" ] || { echo "pass --yes to wipe+restore staging DB"; exit 3; }
require_staging_destination
[ "$(stat -c %a "$SNAP/foligo-prod.dump")" = 600 ] || { echo "dump must be mode 600" >&2; exit 2; }
sha=$(python3 -c "import json;print(json.load(open('$SNAP/snapshot-meta.json'))['sha256'])")
[ "$(sha256sum "$SNAP/foligo-prod.dump" | cut -d' ' -f1)" = "$sha" ] || { echo "dump checksum mismatch" >&2; exit 2; }
PSQL=(kubectl -n $NS exec -i postgres-0 -- psql -U foligo -d foligo -v ON_ERROR_STOP=1 -At)
for d in api; do kubectl -n $NS scale deploy/$d --replicas=0; done
kubectl -n $NS wait --for=delete pod -l app=api --timeout=120s || true
"${PSQL[@]}" -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
kubectl -n $NS exec -i postgres-0 -- pg_restore -U foligo -d foligo --no-owner --no-privileges --exit-on-error < "$SNAP/foligo-prod.dump"
"${PSQL[@]}" < "$here/../neutralize.sql" >/dev/null
python3 "$here/verify-counts.py" "$SNAP/snapshot-meta.json"
kubectl -n $NS scale deploy/api --replicas=1
kubectl -n $NS rollout status deploy/api --timeout=300s
