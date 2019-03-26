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

def save_via_project(json_data, filename):
  with open(filename, 'w') as f:
    json.dump( json_data, f, indent=None, separators=(',',':') )

def push_via_project_to_couchdb(data):
  uri = baseuri + '/' + data['project_store']['project_id']
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
conn.request('PUT', baseuri )
r = conn.getresponse()
r.read()
print('Create couchdb database : %d %s' % (r.status, r.reason) )

project_index = 1;
filename_list = list(all_metadata.keys())
filename_list.sort();

# metadata[filename] = { 'speaker':speaker, 't0':t0, 't1':t1 }
for filename in filename_list:
  fid = filename
  d = init_via_project(project_index)

  d['file_store'][fid] = { 'fid':fid, 'filename':filename, 'type':2, 'loc':2, 'src':'http://zeus.robots.ox.ac.uk/via/data/voxceleb/val/avi/' + filename }
  d['fid_list'].append(fid)
  d['file_mid_store'][fid] = []
  mid = 0
  for file_metadata in all_metadata[filename]:
    #mid = uuid.uuid4().hex
    t0 = float(file_metadata['t0'])
    t1 = float(file_metadata['t1'])
    speaker_id = file_metadata['speaker']
    d['metadata_store'][mid] = { 'z':[t0, t1], 'xy': [], 'v':{'0':speaker_id} }
    d['file_mid_store'][fid].append(mid)
    mid = mid + 1

  via_project_filename = os.path.join(VIA_FOLDER, ('voxceleb_val_693_%.3d.json' % (project_index)))
  print( 'Writing %s : %s' % (filename, via_project_filename) )
  save_via_project(d, via_project_filename)
  push_via_project_to_couchdb(d)
  project_index = project_index + 1

