#!/usr/bin/env python3
"""Exact per-table row count comparison: prod snapshot meta vs staging DB. Expected deltas: only api_tokens (neutralized -> 0)."""
import json, subprocess, sys
meta = json.load(open(sys.argv[1])); exp = meta["counts"]
EXPECTED_DELTA = {"api_tokens": 0}
out = subprocess.run(["kubectl","-n","foligo-staging","exec","postgres-0","--","psql","-U","foligo","-d","foligo","-At","-c",
  "select tablename from pg_tables where schemaname='public' order by 1"],capture_output=True,text=True,check=True).stdout.split()
got = {}
for t in out:
    got[t] = int(subprocess.run(["kubectl","-n","foligo-staging","exec","postgres-0","--","psql","-U","foligo","-d","foligo","-At","-c",f'select count(*) from public."{t}"'],capture_output=True,text=True,check=True).stdout)
bad = []
for t, n in exp.items():
    want = EXPECTED_DELTA.get(t, n)
    if got.get(t) != want: bad.append((t, n, got.get(t)))
extra = set(got) - set(exp)
res = {"tables_prod": len(exp), "tables_staging": len(got), "rows_prod": sum(exp.values()), "rows_staging": sum(got.values()), "mismatches": bad, "extra_tables": sorted(extra), "expected_neutralization_deltas": {t:(exp[t],got[t]) for t in EXPECTED_DELTA}}
print(json.dumps(res)); sys.exit(1 if bad or extra else 0)
