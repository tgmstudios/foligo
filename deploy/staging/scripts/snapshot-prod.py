#!/usr/bin/env python3
"""Read-only consistent snapshot of prod Foligo PostgreSQL (pg_dump + exact counts under ONE exported snapshot).
Requires env KUBECONFIG/OCI env for west (source westenv). Writes dump 0600 into OUTDIR. Never prints data."""
import subprocess, sys, os, json, time, hashlib, datetime, select
OUT = sys.argv[1]
os.makedirs(OUT, mode=0o700, exist_ok=True)
NS, TGT = "foligo", "deploy/postgres"
base = ["kubectl", "-n", NS, "exec", "-i", TGT, "--", "psql", "-U", "foligo", "-d", "foligo", "-At", "-v", "ON_ERROR_STOP=1"]
A = subprocess.Popen(base, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
def send(s): A.stdin.write(s + "\n"); A.stdin.flush()
def readline(): return A.stdout.readline().strip()
send("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;")
send("SELECT 'SNAP:'||pg_export_snapshot();")
send("SELECT 'TS:'||now();")
while True:
    l = readline()
    if l.startswith("SNAP:"): snap = l[5:]
    if l.startswith("TS:"): ts = l[3:]; break
    if not l and A.poll() is not None: sys.exit("psql died: " + A.stderr.read())
send("SELECT 'TBL:'||tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1;")
send("SELECT 'END:';")
tables = []
while True:
    l = readline()
    if l.startswith("TBL:"): tables.append(l[4:])
    if l.startswith("END:"): break
# pg_dump with the same snapshot
dump = os.path.join(OUT, "foligo-prod.dump")
fd = os.open(dump, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, "wb") as f:
    p = subprocess.run(["kubectl","-n",NS,"exec",TGT,"--","pg_dump","-U","foligo","-d","foligo","-Fc","--no-owner","--no-privileges","--snapshot="+snap], stdout=f, stderr=subprocess.PIPE)
if p.returncode: A.kill(); sys.exit("pg_dump failed: "+p.stderr.decode()[:500])
counts = {}
for t in tables:
    send(f"SELECT 'CNT:{t}:'||count(*) FROM public.\"{t}\";")
    l = readline()
    while not l.startswith("CNT:"): l = readline()
    counts[t] = int(l.rsplit(":",1)[1])
send("COMMIT;"); send("\\q"); A.wait(timeout=30)
sha = hashlib.sha256(open(dump,"rb").read()).hexdigest()
meta = {"snapshot_started_utc": ts, "pg_snapshot_id": snap, "dump_file": dump, "dump_bytes": os.path.getsize(dump), "sha256": sha, "counts": counts, "tables": len(tables), "total_rows": sum(counts.values())}
mp = os.path.join(OUT, "snapshot-meta.json")
fd = os.open(mp, os.O_WRONLY|os.O_CREAT|os.O_TRUNC, 0o600)
with os.fdopen(fd,"w") as f: json.dump(meta, f, indent=1)
print(json.dumps({k:v for k,v in meta.items() if k!="counts"}))
