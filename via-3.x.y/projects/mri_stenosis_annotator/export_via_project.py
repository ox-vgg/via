# MRI Stenosis : export VIA project for each clinician
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
# 28 May 2019

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
#COUCHDB_IP = 'zeus.robots.ox.ac.uk'
#COUCHDB_PORT = ''
COUCHDB_DB_NAME = '/mri_stenosis_may2019'

file_group_filename = '/data/datasets/via/via-3.x.y/img_pair_annotation/PairwiseStenosis20190507/file_group.csv'
clinician_assignment_filename = '/data/datasets/via/via-3.x.y/img_pair_annotation/PairwiseStenosis20190507/clinician_assignment.csv'

file_group = {}
clinician_assignment = {}

def save_json(json_data, filename):
  with open(filename, 'w') as f:
    json.dump( json_data, f, indent=None, separators=(',',':') )

def create_couchdb_via_project(project_data):
  uri = COUCHDB_DB_NAME + '/' + d['store']['project']['pid']
  payload = json.dumps(project_data)
  conn.request('PUT', uri, body=payload)
  r = conn.getresponse()
  r.read()
  print('  %s : %d %s' % (uri, r.status, r.reason))


def init_via_project(clinician_id):
  d = { 'store':{} }
  d['store']['project'] = {
    'pid': 'clinician' + clinician_id,
    'pname': 'Clinician ' + clinician_id + ' (MRI Stenosis, May 2019)',
    'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
    'created': datetime.datetime.utcnow().__str__(),
    'data_format_version': '3.1.0',
  };
  d['store']['config'] = {
    'file': {
      'path':'http://__USERNAME__:__PASSWORD__@zeus.robots.ox.ac.uk/via/mri_stenosis/may2019/images/',
    },
    'ui': {
      'file_content_align':'center'
    },
  };
  d['store']['attribute'] = {
    "1": {
      "aname": "structural_central_canal_stenosis",
      "anchor_id": "FILEN_Z0_XY0",
      "type": 3,
      "desc": "Of the above two images, which has more structural central canal stenosis?",
      "options": {
        "0": "Image 1",
        "1": "Not Sure",
        "2": "Image 2"
      },
      "default_option_id": ""
    },
    "2": {
      "aname": "soft_tissue_encroachment",
      "anchor_id": "FILEN_Z0_XY0",
      "type": 3,
      "desc": "Of the above two images, which has more soft tissue encroachment (disc herniation and/or synovial cyst)?",
      "options": {
        "0": "Image 1",
        "1": "Not Sure",
        "2": "Image 2"
      },
      "default_option_id": ""
    },
    "3": {
      "aname": "crowding_cauda_equina_rootlets",
      "anchor_id": "FILEN_Z0_XY0",
      "type": 3,
      "desc": "Of the above two images, which has more crowding of cauda equina rootlets?",
      "options": {
        "0": "Image 1",
        "1": "Not Sure",
        "2": "Image 2"
      },
      "default_option_id": ""
    },
  };

  d['store']['file'] = {};
  d['store']['view'] = {};
  d['store']['vid_list'] = [];
  d['store']['metadata'] = {};
  return d


## load file group
with open(file_group_filename, 'r') as f:
  csvreader = csv.reader(f, delimiter=',')
  for row in csvreader:
    if row[0] == 'filename' and row[1] == 'group_id':
      continue # skip header
    img_filename = row[0]
    img_group = row[1]
    if img_group not in file_group:
      file_group[img_group] = []
    file_group[img_group].append(img_filename)


## load file group
with open(clinician_assignment_filename, 'r') as f:
  csvreader = csv.reader(f, delimiter=',')
  for row in csvreader:
    if row[0] == 'clinician_id' and row[1] == 'group_id':
      continue # skip header
    clinician_id = row[0]
    group_id = row[1]
    if clinician_id not in clinician_assignment:
      clinician_assignment[clinician_id] = []
    clinician_assignment[clinician_id].append(group_id)

## add a fictitious clinician (for demonstration purpose)
clinician_assignment['demo'] = ['1', '263', '312', '410', '460', '490']

## create couchdb database
conn = http.client.HTTPConnection(COUCHDB_IP, COUCHDB_PORT)
conn.request('PUT', COUCHDB_DB_NAME )
r = conn.getresponse()
response = r.read()
print('couchdb database %s : %d %s' % (COUCHDB_DB_NAME, r.status, r.reason) )

for clinician_id in clinician_assignment:
  d = init_via_project(clinician_id)
  project_files = {}

  fid = 1
  vid = 1
  for group_id in clinician_assignment[clinician_id]:
    ## add all files for this group
    fid_list = [];
    for filename in file_group[group_id]:
      if filename not in project_files:
        project_files[filename] = fid;
        d['store']['file'][fid] = {
          'fid':str(fid),
          'fname':filename,
          'type':2,
          'loc':2,
          'src':filename,
        }
        fid = fid + 1
      else:
        fid = project_files[filename]
      fid_list.append( str(fid) )
    ## create a view for this group
    d['store']['view'][vid] = {
      'fid_list': fid_list,
    }
    d['store']['vid_list'].append( str(vid) )
    vid = vid + 1

  #save_json(d, './tmp.json')
  print( 'Writing %s ...' % (d['store']['project']['pname']) )
  create_couchdb_via_project(d)

conn.close()
