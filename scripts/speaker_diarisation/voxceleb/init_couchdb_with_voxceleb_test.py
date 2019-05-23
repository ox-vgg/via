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

VIA_PROJECT_ID_LIST = { '1':'p1ff7175481f942389fcccef82857f9c6', 
                        '2':'p9036d02214ec439c9eeff6e27ed20dcc',
                        '3':'p42c179d206e042ebbfbb02a6248f9461',
                        '4':'pc33a5ad24b514c7fa943a023572b1aa3',
                        '5':'p3e79c313d04744eebc5203f9b7f293ec',
                        '6':'p9013cba11e2c40539fc4676c9c65764c',
                        '7':'p6f75428e279e4a75bca6374718670779',
                        '8':'p81c738031f78436da4ef6e67341122f2',
                        '9':'p2c56bb12f48849669e9dce75c9f5929c',
                        '10':'p1f9f7e66fd0d482a8ae7a38468cd308d',
                        '11':'pd9d5f56857c44b52afaf3df3d717ee3a',
                        '12':'pbd28c6ff99d540a9bc07a81dfbf7c3d0',
                        '13':'pe4b6c03af2f9428fa02040f85a8e58cc',
                        '14':'p9f9243bbe3434391a7d6583ff18475b6',
                      }

VIA_FOLDER = '/data/datasets/arsha/diarisation/voxceleb/couchdb_store'
VIDEO_PER_PROJECT = 50
COUCHDB_IP = '127.0.0.1'
COUCHDB_PORT = '5984'

metadata_fn = '/data/datasets/arsha/diarisation/voxceleb/sel_metadata.pkl'
metadata = {}

def init_via_project(project_index):
  project_id = VIA_PROJECT_ID_LIST[ str(project_index) ]
  d = { 'metadata_store':{}, 'file_store':{}, 'file_mid_store':{}, 'attribute_store':{} }
  #d['project_store'] = { 'project_id': 'p'+uuid.uuid4().hex, 'project_name': ('voxceleb_val_set_%.2d' % (project_index)), 'data_format_version':'3.0.0', 'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)', 'created':datetime.datetime.utcnow().__str__(), 'updated':datetime.datetime.utcnow().__str__() }
  d['project_store'] = { 'project_id': project_id, 'project_name': ('Set%.2d_voxceleb_val' % (project_index)), 'data_format_version':'3.0.0', 'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)', 'created':datetime.datetime.utcnow().__str__(), 'updated':datetime.datetime.utcnow().__str__() }
  d['attribute_store']['0'] = { 'id':'0', 'aname':'speaker', 'type':1 }
  d['id_store'] = { 'fid_list':[], 'aid_list':['0'] }
  return d

def push_via_project_to_couchdb():
  conn = http.client.HTTPConnection(COUCHDB_IP, COUCHDB_PORT)

  ## create a new database for the via project
  baseuri = '/' + d['project_store']['project_id']
  conn.request('PUT', baseuri )
  r = conn.getresponse()
  r.read()
  #print('Creating couchdb database : %d %s' % (r.status, r.reason) )

  ## push all data except the metadata
  for store_name in d:
    if store_name != 'metadata_store':
      uri = baseuri + '/' + store_name
      payload = json.dumps(d[store_name])
      conn.request('PUT', uri, body=payload)
      r = conn.getresponse()
      r.read()
      #print('%s : %d %s' % (uri, r.status, r.reason))

  # push all metadata
  payload = { 'docs':[] }
  for mid in d['metadata_store']:
    d['metadata_store'][mid]['_id'] = str(mid)
    payload['docs'].append( d['metadata_store'][mid] )

  payload_str = json.dumps(payload)
  uri = baseuri + '/_bulk_docs'
  conn.request('POST', uri, body=payload_str, headers={'Content-Type':'application/json'})
  r = conn.getresponse()
  r.read()
  #print('%s : %d %s' % (uri, r.status, r.reason))

  #print('To delete')
  #print('curl -X DELETE http://%s:%s%s' % (COUCHDB_IP, COUCHDB_PORT, baseuri) )

def save_via_project(json_data, filename):
  with open(filename, 'w') as f:
    json.dump( json_data, f, indent=None, separators=(',',':') )

with open(metadata_fn, 'rb') as f:
  all_metadata = pickle.load(f)

filename_list = list(all_metadata.keys())

project_index = 1
file_count = 0
mid = 0

d = init_via_project(project_index)

index_fn = os.path.join(VIA_FOLDER, 'index.csv');
html_fn = os.path.join(VIA_FOLDER, 'options.html');
with open(index_fn, 'w') as f:
  with open(html_fn, 'w') as h:
    f.write('project_filename,project_id,set,file_count\n')
    # metadata[filename] = { 'speaker':speaker, 't0':t0, 't1':t1 }
    for filename in all_metadata:
      if file_count >= VIDEO_PER_PROJECT:
        via_project_filename = os.path.join(VIA_FOLDER, ('Set%.2d_voxceleb_val.json' % (project_index)))
        save_via_project(d, via_project_filename)
        print( 'Saved set=%2d, project_id=%s, file_count=%d to : %s' % (project_index, d['project_store']['project_id'], file_count, via_project_filename) )
        push_via_project_to_couchdb()
        f.write('%s,%s,%d,%d\n' % (via_project_filename, d['project_store']['project_id'], project_index, file_count))
        h.write('<option value="%s">%s</option>\n' % (d['project_store']['project_id'], ('%.2d_voxceleb_val.json' % (project_index))))

        project_index = project_index + 1
        file_count = 0
        mid = 0
        d = init_via_project(project_index)

      file_count += 1
      fid = file_count
      d['file_store'][fid] = { 'fid':file_count, 'filename':filename, 'type':2, 'loc':2, 'src':'http://zeus.robots.ox.ac.uk/via/d/voxceleb/val/avi/' + filename }
      d['id_store']['fid_list'].append(fid)
      d['file_mid_store'][fid] = []
      for file_metadata in all_metadata[filename]:
        #mid = uuid.uuid4().hex
        t0 = float(file_metadata['t0'])
        t1 = float(file_metadata['t1'])
        speaker_id = file_metadata['speaker']
        d['metadata_store'][mid] = { 'z':[t0, t1], 'xy': [], 'v':{'0':speaker_id} }
        d['file_mid_store'][fid].append(mid)
        mid = mid + 1

    ## Write the last file
    via_project_filename = os.path.join(VIA_FOLDER, ('Set%.2d_voxceleb_val.json' % (project_index)))
    save_via_project(d, via_project_filename)
    print( 'Saved set=%2d, project_id=%s, file_count=%d to : %s' % (project_index, d['project_store']['project_id'], file_count, via_project_filename) )
    push_via_project_to_couchdb()
    f.write('%s,%s,%d,%d\n' % (via_project_filename, d['project_store']['project_id'], project_index, file_count))
    h.write('<option value="%s">%s</option>\n' % (d['project_store']['project_id'], ('%.2d_voxceleb_val.json' % (project_index))))
