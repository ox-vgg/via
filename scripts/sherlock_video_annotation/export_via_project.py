# Compute frequency of words
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
# 29 Mar. 2019

import string
import os
import pickle
import json
import uuid
import http.client
import datetime
import csv

COUCHDB_IP = '127.0.0.1'
COUCHDB_PORT = '5984'
VIA_FOLDER = '/data/datasets/arsha/sherlock/maxbain/via_projects'
metadata_fn = '/data/datasets/arsha/sherlock/maxbain/s01_timestamps.csv'
metadata = {}

def init_via_project(project_id, project_name):
  d = { 'metadata_store':{}, 'file_store':{}, 'file_mid_store':{}, 'attribute_store':{} }
  d['project_store'] = { 
    'project_id': project_id, 
    'project_name': ('%s' % (video_id)), 
    'data_format_version':'3.0.0', 
    'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)', 
    'created':datetime.datetime.utcnow().__str__(), 
    'update_history': [],
  }
  d['attribute_store']['0'] = { 'id':'0', 'aname':'Name', 'type':1 }
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

## create a new database for the via project
conn = http.client.HTTPConnection(COUCHDB_IP, COUCHDB_PORT)
baseuri = '/sherlock'
conn.request('PUT', baseuri )
r = conn.getresponse()
r.read()
print('Create couchdb database : %d %s' % (r.status, r.reason) )

with open(metadata_fn, 'r') as f:
  csvreader = csv.reader(f, delimiter=',')
  for row in csvreader:
    video_id = row[1]
    if video_id not in metadata:
      metadata[video_id] = []

    name = row[2]
    tstart = row[3]
    tend = row[4]
    metadata[video_id].append( { 'name':name, 't0':tstart, 't1':tend } )

project_index = 1
fid = 1

video_id_list = list(metadata.keys())
video_id_list.sort();

for video_id in video_id_list:
  tokens = video_id.split('/')
  season = tokens[0]
  episode = tokens[1]
  project_id = 'sherlock_%s_%s' % ( season, episode )
  project_name = 'Sherlock %s' % ( video_id )
  d = init_via_project(project_id, project_name)
  filename = video_id + '.mp4'
  d['file_store'][fid] = { 'fid':fid, 'filename':filename, 'type':2, 'loc':2, 'src':'http://zeus.robots.ox.ac.uk/via/data/sherlock/videos/' + filename }
  #d['file_store'][fid] = { 'fid':fid, 'filename':filename, 'type':2, 'loc':2, 'src':'/data/datasets/arsha/chimp/chimp_annotation/videos/' + filename }

  d['fid_list'].append(fid)
  d['file_mid_store'][fid] = []
  mid = 0
  for file_metadata in metadata[video_id]:
    t0 = float(file_metadata['t0'])
    t1 = float(file_metadata['t1'])
    name = file_metadata['name']
    d['metadata_store'][mid] = { 'z':[t0, t1], 'xy': [], 'v':{'0':name} }
    d['file_mid_store'][fid].append(mid)
    mid = mid + 1

  via_project_filename = os.path.join(VIA_FOLDER, ('%s.json' % (project_id)))
  print( 'Writing %s : %s' % (filename, via_project_filename) )
  #save_via_project(d, via_project_filename)
  push_via_project_to_couchdb(d)

  project_index = project_index + 1
  fid = fid + 1

