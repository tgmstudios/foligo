#!/usr/bin/env python3
"""Create one bounded release-owned node pull probe before expensive publication."""
import json,os,pathlib,re,subprocess
root=pathlib.Path(__file__).resolve().parents[3]
image=re.search(r'^\s*image: (\S+)',(root/'deploy/staging/50-api.yaml').read_text(),re.M).group(1)
assert image.startswith('api-fstg.i.tgm.one/foligo-staging/api@sha256:')
run=os.environ['GITHUB_RUN_ID'];attempt=os.environ.get('GITHUB_RUN_ATTEMPT','1')
assert run.isdigit() and attempt.isdigit()
name='foligo-pull-'+run+'-'+attempt
job={'apiVersion':'batch/v1','kind':'Job','metadata':{'name':name,'namespace':'foligo-staging','labels':{'app.kubernetes.io/part-of':'foligo-staging'}},'spec':{'backoffLimit':0,'activeDeadlineSeconds':180,'template':{'spec':{'automountServiceAccountToken':False,'restartPolicy':'Never','containers':[{'name':'pull-probe','image':image,'imagePullPolicy':'Always','command':['node','--version']}]}}}}
subprocess.run(['kubectl','--request-timeout=10s','-n','foligo-staging','create','-f','-'],input=json.dumps(job),text=True,check=True)
subprocess.run(['kubectl','--request-timeout=200s','-n','foligo-staging','wait','--for=condition=complete','job/'+name,'--timeout=190s'],check=True,timeout=200)
print('node image pull and runtime execution verified; retained probe '+name)
