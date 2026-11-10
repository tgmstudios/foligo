#!/usr/bin/env python3
import sys
sys.dont_write_bytecode = True
import importlib.util, pathlib, unittest
from unittest.mock import patch
p=pathlib.Path(__file__).with_name('wait-rollout.py')
s=importlib.util.spec_from_file_location('wait_rollout',p)
class RolloutTests(unittest.TestCase):
 def load(self):
  m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
 def test_only_exact_get_and_ready_generation(self):
  m=self.load()
  d={'metadata':{'generation':3},'spec':{'replicas':1},'status':{'observedGeneration':3,'replicas':1,'updatedReplicas':1,'readyReplicas':1,'availableReplicas':1}}
  with patch.object(m,'get_deployment',return_value=d) as get:
   m.wait('api',timeout=1);get.assert_called_with('api')
  self.assertTrue(m.ready(d));d['status']['observedGeneration']=2;self.assertFalse(m.ready(d))
 def test_old_replicas_not_ready(self):
  m=self.load();self.assertFalse(m.ready({'metadata':{'generation':3},'spec':{'replicas':1},'status':{'observedGeneration':3,'replicas':2,'updatedReplicas':1,'readyReplicas':1,'availableReplicas':1}}))
 def test_get_command_does_not_list_watch(self):
  m=self.load()
  with patch.object(m.subprocess,'check_output',return_value=b'{}') as call:
   m.get_deployment('api')
   args=call.call_args.args[0]
   self.assertIn('get',args);self.assertIn('api',args);self.assertNotIn('list',args);self.assertNotIn('--watch',args)
if __name__=='__main__':unittest.main()
