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

DISCARD_LIST_FILENAME = '/data/datasets/arsha/diarisation/voxceleb/test/test_files_with_0_size.txt'
VIDEO_FILES_PATH = '/data/datasets/arsha/diarisation/videos_TEMP/test/avi/'
VIDEO_URI_PREFIX = 'http://zeus.robots.ox.ac.uk/via/data/voxceleb/test/avi'
discard_list = [];
COUCHDB_IP = '127.0.0.1'
COUCHDB_PORT = '5984'

##
## Define helper methods
##
def init_via_project(project_index):
  d = { 'metadata_store':{}, 'file_store':{}, 'file_mid_store':{}, 'attribute_store':{} }
  d['project_store'] = { 
    'project_id': ('voxceleb_test_737_%.3d' % (project_index)), 
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

def push_via_project_to_couchdb(data):
  uri = baseuri + '/' + data['project_store']['project_id']
  payload = json.dumps(data)
  conn.request('PUT', uri, body=payload)
  r = conn.getresponse()
  r.read()
  print('  %s : %d %s' % (uri, r.status, r.reason))

## load discard list
with open(DISCARD_LIST_FILENAME, 'r') as f:
  discard_data = f.read()
  lines = discard_data.split('\n')
  for line in lines:
    discard_list.append( line )

## create a new database for the via project
conn = http.client.HTTPConnection(COUCHDB_IP, COUCHDB_PORT)
baseuri = '/voxceleb_val_737'
conn.request('PUT', baseuri )
r = conn.getresponse()
r.read()
print('Create couchdb database : %d %s' % (r.status, r.reason) )

project_index = 1;

for dir_path, subdir_list, file_list in os.walk(VIDEO_FILES_PATH):
  for fname in file_list:
    if fname.endswith('.mp4'):
      fid = os.path.join(os.path.relpath(dir_path, VIDEO_FILES_PATH), fname)
      filename = fid
      fsrc = os.path.join(VIDEO_URI_PREFIX, fid)

      d = init_via_project(project_index)

      d['file_store'][fid] = { 'fid':fid, 'filename':filename, 'type':2, 'loc':2, 'src':'http://zeus.robots.ox.ac.uk/via/data/voxceleb/test/avi/' + filename }
      d['fid_list'].append(fid)
      d['file_mid_store'][fid] = []

      push_via_project_to_couchdb(d)
      print('Saved project ' + str(project_index) + ' : ' + filename)
      project_index = project_index + 1
