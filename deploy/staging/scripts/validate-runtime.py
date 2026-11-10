#!/usr/bin/env python3
"""Offline validation of the canonical API runtime patch; no credentials or cluster access."""
import json,pathlib,re
root=pathlib.Path(__file__).resolve().parents[3]
p=json.loads((root/'deploy/staging/api-runtime-patch.json').read_text())
env=p['spec']['template']['spec']['containers'][0]['env']
assert len({e['name'] for e in env})==len(env),'duplicate runtime env vars'
values={e['name']:e.get('value') for e in env}
plans=json.loads(values['BILLING_PLANS'])
assert {(x['key'],x['monthlyRequests'],x['monthlyCostUsd']) for x in plans}=={('pro',300,2),('max',1500,8)},'paid limits drifted'
assert values['BILLING_FREE_MONTHLY_REQUESTS']=='10' and values['BILLING_FREE_MONTHLY_COST_USD']=='0.10','free limits drifted'
for key in ['STRIPE_SECRET_KEY','STRIPE_PUBLISHABLE_KEY','STRIPE_WEBHOOK_SECRET']:
 e=next(x for x in env if x['name']==key)
 assert e.get('valueFrom',{}).get('secretKeyRef',{}).get('name')=='foligo-staging-api','credential must be a runtime Secret reference'
for name in ['50-api.yaml','60-dashboard.yaml','70-sites.yaml']:
 text=(root/'deploy/staging'/name).read_text()
 assert re.search(r'image: api-fstg\.i\.tgm\.one/foligo-staging/(api|dashboard|sites)@sha256:[a-f0-9]{64}',text),name+' wrong pull registry/digest'
 assert '127.0.0.1:32551' not in text,name+' obsolete loopback registry'
print('canonical runtime configuration and TLS image references validated')
