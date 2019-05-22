# Compute frequency of words
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>

import string
import os
import pickle
import json
import uuid
import http.client
import datetime

#VIA_FOLDER = '/data/datasets/arsha/diarisation/voxceleb/via_projects'
#metadata_fn = '/data/datasets/arsha/diarisation/voxceleb/sel_metadata.pkl'

COUCHDB_IP = '127.0.0.1'
COUCHDB_PORT = '5984'
VIA_FOLDER = '/ssd/adutta/data/via/data/voxceleb/val/via_projects'
metadata_fn = '/ssd/adutta/data/via/data/voxceleb/val/sel_metadata.pkl'
metadata = {}

def init_via_project(project_index):
  d = { 'metadata_store':{}, 'file_store':{}, 'file_mid_store':{}, 'attribute_store':{} }
  d['project_store'] = { 
    'project_id': ('voxceleb_val_693_%.3d' % (project_index)), 
    'project_name': ('%.3d' % (project_index)), 
    'data_format_version':'3.0.0', 
    'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)', 
    'created':datetime.datetime.utcnow().__str__(), 
    'update_history': [],
  }
  d['attribute_store']['0'] = { 'id':'0', 'aname':'speaker', 'type':1 }
  d['aid_list'] = ['0'];
  d['fid_list'] = [];
  return d

def get_via_project_rev_from_couchdb(data):
  uri = baseuri + '/' + data['project_store']['project_id']
  conn.request('GET', uri)
  r = conn.getresponse()
  doc_str = r.read()
  doc = json.loads(doc_str.decode('utf-8'))
  print('  %s : %d %s : rev=%s' % (uri, r.status, r.reason, doc['_rev']))
  return doc['_rev']

def push_via_project_to_couchdb(data, rev):
  uri = baseuri + '/' + data['project_store']['project_id'] + '?rev=' + rev
  payload = json.dumps(data)
  conn.request('PUT', uri, body=payload)
  r = conn.getresponse()
  r.read()
  print('  %s : %d %s' % (uri, r.status, r.reason))

with open(metadata_fn, 'rb') as f:
  all_metadata = pickle.load(f)

## create a new database for the via project
conn = http.client.HTTPConnection(COUCHDB_IP, COUCHDB_PORT)
baseuri = '/voxceleb_val_693'
conn.request('GET', baseuri )
r = conn.getresponse()
r.read()
print('Couchdb database status: %d %s' % (r.status, r.reason) )

project_index = 1;
filename_list = list(all_metadata.keys())
filename_list.sort();

# metadata[filename] = { 'speaker':speaker, 't0':t0, 't1':t1 }
for filename in filename_list:
  if project_index < 140:
    project_index = project_index + 1
    continue;

  fid = filename
  d = init_via_project(project_index)

  d['file_store'][fid] = { 'fid':fid, 'filename':filename, 'type':2, 'loc':2, 'src':'http://zeus.robots.ox.ac.uk/via/data/voxceleb/val/avi/' + filename }
  d['fid_list'].append(fid)
  d['file_mid_store'][fid] = []

  via_project_filename = os.path.join(VIA_FOLDER, ('voxceleb_val_693_%.3d.json' % (project_index)))
  print( 'Processing %s : %s' % (filename, via_project_filename) )
  rev = get_via_project_rev_from_couchdb(d)
  print(d)
  push_via_project_to_couchdb(d, rev)
  project_index = project_index + 1

