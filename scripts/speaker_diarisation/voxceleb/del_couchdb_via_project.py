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

VIA_FOLDER = '/data/datasets/arsha/diarisation/voxceleb/couchdb_store'
COUCHDB_IP = '127.0.0.1'
COUCHDB_PORT = '5984'
csv_header = 'project_filename,project_id,set,file_count'

conn = http.client.HTTPConnection(COUCHDB_IP, COUCHDB_PORT)

index_fn = os.path.join(VIA_FOLDER, 'index.csv');
with open(index_fn, 'r') as f:
  all_lines_str = f.read()
  #print(all_lines_str)
  all_lines = all_lines_str.split('\n');
  all_lines.remove(csv_header)

  for line_index in all_lines:
    tokens = line_index.split(',')
    if len(tokens) == 4:
      project_id = tokens[1]
      uri = '/' + project_id
      conn.request('DELETE', uri )
      r = conn.getresponse()
      r.read()
      print('Deleting couchdb database : %d %s' % (r.status, r.reason) )

# obtained from http://127.0.0.1:5984/_all_dbs
VIA_PROJECT_LIST = [];

for project_id in VIA_PROJECT_LIST:
  uri = '/' + project_id
  conn.request('DELETE', uri )
  r = conn.getresponse()
  r.read()
  print('Deleting couchdb database : %d %s' % (r.status, r.reason) )
  
conn.close()
