#!/usr/bin/env python3
"""Wait using exact GET requests; never require deployment list/watch RBAC."""
import argparse, json, subprocess, time

def get_deployment(name):
 return json.loads(subprocess.check_output(['kubectl','--request-timeout=10s','-n','foligo-staging','get','deployment',name,'-o','json'],timeout=15))

def ready(d):
 target=d.get('spec',{}).get('replicas',1);s=d.get('status',{})
 return target>0 and s.get('observedGeneration',0)>=d['metadata']['generation'] and all(s.get(k,0)==target for k in ['replicas','updatedReplicas','readyReplicas','availableReplicas'])

def wait(name,timeout=300):
 if name not in ['api','dashboard','sites']:raise ValueError('not an approved staging deployment')
 deadline=time.monotonic()+timeout
 while True:
  d=get_deployment(name)
  if ready(d):print(name+' rollout verified by exact GET');return
  failed=next((c for c in d.get('status',{}).get('conditions',[]) if c.get('type')=='Progressing' and c.get('status')=='False'),None)
  if failed:raise RuntimeError(name+': '+failed.get('reason','rollout failed'))
  if time.monotonic()>=deadline:raise TimeoutError(name+' rollout exceeded deadline')
  time.sleep(min(3,max(0,deadline-time.monotonic())))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('name',choices=['api','dashboard','sites']);p.add_argument('--timeout',type=int,default=300);a=p.parse_args();wait(a.name,a.timeout)
