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

COUCHDB_IP = '127.0.0.1'
COUCHDB_PORT = '5984'

conn = http.client.HTTPConnection(COUCHDB_IP, COUCHDB_PORT)

# obtained using
# curl -X GET http://127.0.0.1:5984/_all_dbs
VIA_PROJECT_LIST = ["chimp_2012_2013"];

for project_id in VIA_PROJECT_LIST:
  uri = '/' + project_id
  conn.request('DELETE', uri )
  r = conn.getresponse()
  r.read()
  print('Deleting couchdb database : %d %s' % (r.status, r.reason) )
  
conn.close()
