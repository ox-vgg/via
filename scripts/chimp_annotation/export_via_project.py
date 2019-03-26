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
import csv

COUCHDB_IP = '127.0.0.1'
COUCHDB_PORT = '5984'
VIA_FOLDER = '/data/datasets/arsha/chimp/chimp_annotation/via_projects'
metadata_fn = '/data/datasets/arsha/chimp/chimp_annotation/initial_metadata/2013.csv'
metadata = {}

def init_via_project(project_index, year):
  d = { 'metadata_store':{}, 'file_store':{}, 'file_mid_store':{}, 'attribute_store':{} }
  d['project_store'] = { 
    'project_id': ('chimp_%s_%.3d' % (year, project_index)), 
    'project_name': ('%s_%.3d' % (year, project_index)), 
    'data_format_version':'3.0.0', 
    'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)', 
    'created':datetime.datetime.utcnow().__str__(), 
    'update_history': [],
  }
  d['attribute_store']['0'] = { 'id':'0', 'aname':'Chimpanzee Name', 'type':1 }
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
baseuri = '/chimp_2012_2013'
conn.request('PUT', baseuri )
r = conn.getresponse()
r.read()
print('Create couchdb database : %d %s' % (r.status, r.reason) )

with open(metadata_fn, 'r') as f:
  csvreader = csv.reader(f, delimiter=',')
  for row in csvreader:
    video_filename = row[1]
    video_filename_tokens = video_filename.split('/')
    video_year = video_filename_tokens[3]
    video_filename = video_filename_tokens[5]
    video_id = video_year + '/' + video_filename
    if video_year not in metadata:
      metadata[video_year] = {}
    if video_id not in metadata[video_year]:
      metadata[video_year][video_id] = []

    chimp_name = row[2]
    tstart = row[3]
    tend = row[4]
    metadata[video_year][video_id].append( { 'filename':video_id, 'chimp_name':chimp_name, 't0':tstart, 't1':tend } )

year_list = list(metadata.keys())
year_list.sort()
filename_project_id_map = {}
for year in year_list:
  project_index = 1
  fid = 1

  filename_list = list(metadata[year].keys())
  filename_list.sort();

  for filename in filename_list:
    d = init_via_project(project_index, year)
    filename_project_id_map[ d['project_store']['project_id'] ] = filename
    d['file_store'][fid] = { 'fid':fid, 'filename':filename, 'type':2, 'loc':2, 'src':'http://zeus.robots.ox.ac.uk/via/data/chimp/videos/' + filename }
    #d['file_store'][fid] = { 'fid':fid, 'filename':filename, 'type':2, 'loc':2, 'src':'/data/datasets/arsha/chimp/chimp_annotation/videos/' + filename }

    d['fid_list'].append(fid)
    d['file_mid_store'][fid] = []
    mid = 0
    for file_metadata in metadata[year][filename]:
      t0 = float(file_metadata['t0'])
      t1 = float(file_metadata['t1'])
      chimp_name = file_metadata['chimp_name']
      d['metadata_store'][mid] = { 'z':[t0, t1], 'xy': [], 'v':{'0':chimp_name} }
      d['file_mid_store'][fid].append(mid)
      mid = mid + 1

    via_project_filename = os.path.join(VIA_FOLDER, ('chimp_%s_%.3d.json' % (year, project_index)))
    print( 'Writing %s : %s' % (filename, via_project_filename) )
    save_via_project(d, via_project_filename)
    #push_via_project_to_couchdb(d)

    project_index = project_index + 1
    fid = fid + 1

filename_project_id_map_fn = os.path.join(VIA_FOLDER, 'filename_project_id_map.json')
with open(filename_project_id_map_fn, 'w') as f:
    json.dump( filename_project_id_map, f, indent=None, separators=(',',':') )
