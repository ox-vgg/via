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

'''
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
'''

# obtained from http://127.0.0.1:5984/_all_dbs
VIA_PROJECT_LIST = ["v1f9f7e66fd0d482a8ae7a38468cd308d","v1ff7175481f942389fcccef82857f9c6","v2c56bb12f48849669e9dce75c9f5929c","v3e79c313d04744eebc5203f9b7f293ec","v42c179d206e042ebbfbb02a6248f9461","v6f75428e279e4a75bca6374718670779","v81c738031f78436da4ef6e67341122f2","v9013cba11e2c40539fc4676c9c65764c","v9036d02214ec439c9eeff6e27ed20dcc","v9f9243bbe3434391a7d6583ff18475b6","vbd28c6ff99d540a9bc07a81dfbf7c3d0","vc33a5ad24b514c7fa943a023572b1aa3","vd9d5f56857c44b52afaf3df3d717ee3a","ve4b6c03af2f9428fa02040f85a8e58cc"];

for project_id in VIA_PROJECT_LIST:
  uri = '/' + project_id
  conn.request('DELETE', uri )
  r = conn.getresponse()
  r.read()
  print('Deleting couchdb database : %d %s' % (r.status, r.reason) )
  
conn.close()
