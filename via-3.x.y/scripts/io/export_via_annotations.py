# export manual annotations from VIA3 shared project in csv format
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
# 11 Oct. 2019
#
# Execute as: $ python3 export_via_annotations.py
#

import http.client
import string
import os
import json
import sys

VIA_SERVER = 'zeus.robots.ox.ac.uk'
VIA3_PID_LIST = {'e302eadf-aa53-4a5a-b958-11175692c928'} # add more VIA3 shared project-id as comma separated values
CSV_ANNOTATION_EXPORT_FILENAME = './annotations.csv' ## Update this as required

def fetch_via3_shared_project(project_id):
  conn = http.client.HTTPConnection(VIA_SERVER)
  annotation_url = '/via/store/3.x.y/' + project_id
  conn.request('GET', annotation_url)
  response = conn.getresponse()
  if response.status != 200:
    print('Failed to fetch annotations from http://%s%s' % (VIA_SERVER, annotation_url))
    print('HTTP Error: %d %s' % (response.status, response.reason))
    sys.exit(0)

  via_project_data = response.read().decode('utf-8')
  conn.close()
  return via_project_data

with open(CSV_ANNOTATION_EXPORT_FILENAME, 'w') as out:
  out.write('pid,filename,temporal_metadata,spatial_metadata,attribute_value\n')
  for pid in VIA3_PID_LIST:
    d_str = fetch_via3_shared_project(pid)
    d = json.loads(d_str)

    for mid in d['metadata']:
      vid = d['metadata'][mid]['vid']
      fid = d['view'][vid]['fid_list'][0]
      filename = d['file'][str(fid)]['fname']
      z = d['metadata'][mid]['z'] # denotes temporal boundary
      xy = d['metadata'][mid]['xy'] # denotes spatial coordinates
      for aid in d['attribute']:
        if aid in d['metadata'][mid]['av']:
          avalue = d['metadata'][mid]['av'][aid]
          if avalue in d['attribute'][aid]['options']:
            avalue = d['attribute'][aid]['options'][avalue]
          if d['attribute'][aid]['anchor_id'] == 'FILE1_Z2_XY0': # temporal segment
            out.write('%s,"%s","%s","","%s"\n' % (pid, filename, str(z), avalue) )
          if d['attribute'][aid]['anchor_id'] == 'FILE1_Z1_XY1': # spatial region of a video frame
            out.write('%s,"%s","%s","%s","%s"\n' % (pid, filename, str(z), str(xy), avalue) )
