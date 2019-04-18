# Export file group allocation as VIA view
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
# 16 Apr. 2019

import string
import os
import pickle
import json
import uuid
import http.client
import datetime
import csv

filegroup_fn = '/data/datasets/amir_jamaludin/pair_annotator/sample_dataset/file_group.csv'

filename_list = {}
view_list = {}

def init_via_project(project_index):
  d = { 'store':{} }
  d['store']['project'] = {
    'pid':project_index,
    'pname':'MRI Stenosis ' + ('%.3d' % (project_index)),
    'data_format_version':'3.0.0',
    'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
    'created':datetime.datetime.utcnow().__str__(),
  }
  d['store']['config'] = {
    'file': {
      'path':'/data/datasets/amir_jamaludin/pair_annotator/sample_dataset/Images/',
    },
    'ui': {
      'file_content_align':'center'
    }
  }
  d['store']['attribute'] = {
    '1': {
      'id':1,
      'aname':'central_canal_stenosis',
      'anchor':[-1,0,0],
      'type':3,
      'desc':'Of the above two images, which has more central canval stenosis?',
      'options':{
        '0':'Image 1',
        '1':'Not Sure',
        '2':'Image 2',
      },
      'default_option_id':'',
    },
  }
  d['store']['file'] = {}
  d['store']['metadata'] = {}
  d['store']['view'] = {}
  d['store']['vid_list'] = []
  return d

def save_via_project(json_data, filename):
  with open(filename, 'w') as f:
    json.dump( json_data, f, indent=None, separators=(',',':') )

with open(filegroup_fn, 'r') as f:
  csvreader = csv.DictReader(f, delimiter=',')
  file_id = 1
  for row in csvreader:
    filename = row['filename']
    view_id = row['group_id']
    if filename not in filename_list:
      filename_list[filename] = file_id
      file_id = file_id + 1

    if view_id not in view_list:
      view_list[view_id] = []
    view_list[view_id].append( filename_list[filename] )

d = init_via_project(1)
for filename in filename_list:
  fid = filename_list[filename]
  d['store']['file'][fid] = { 'fid':fid, 'fname':filename, 'type':1, 'loc':1, 'src':filename }

for view_id in view_list:
  fid_list = view_list[view_id]
  d['store']['view'][view_id] = { 'fid_list':fid_list }
  d['store']['vid_list'].append(view_id)

file_view_id = int(view_id) + 1
for filename in filename_list:
  fid = filename_list[filename]
  d['store']['view'][file_view_id] = { 'fid_list':[fid] }
  #d['store']['vid_list'].append(view_id) # we do not add single image views
  file_view_id = file_view_id + 1

#save_via_project(d['store'], '/data/datasets/amir_jamaludin/pair_annotator/via3/via_project.json')

js_var = 'var _via_debug_project_json_str = \'' + json.dumps( d['store'], indent=None, separators=(',',':') ) + '\';'
with open('/home/tlm/dev/via/src/js/_via_debug_data.js', 'w') as f:
  f.write(js_var)
