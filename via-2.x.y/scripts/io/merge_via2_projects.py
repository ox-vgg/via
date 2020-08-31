# Merge two or more VIA2 projects
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
# Date: 18 May 2020

import json

# add the filename of all VIA2 projects
# Note: all VIA projects should have same attributes and project settings
filename_list = ['via_project1.json', 'via_project2.json', 'via_project3.json']
output_filename = 'via_project_merged.json'

# copy attributes and other project settings from one of the projects
# assumption: all the projects have same attributes and settings
via2 = {}
with open(filename_list[0], 'r') as f:
  via2 = json.load(f)

if '_via_data_format_version' not in via2:
  via2['_via_data_format_version'] = '2.0.10'
  via2['_via_image_id_list'] = via2['_via_img_metadata'].keys()

discarded_count = 0
for i in range(1, len(filename_list)):
  with open(filename_list[i], 'r') as f:
    pdata_i = json.load(f)
    for metadata_i in pdata_i['_via_img_metadata']:
      # check if a metadata already exists
      if metadata_i not in via2['_via_img_metadata']:
        via2['_via_img_metadata'][metadata_i] = pdata_i['_via_img_metadata'][metadata_i]
        via2['_via_image_id_list'].append(metadata_i)
      else:
        discarded_count = discarded_count + 1

with open(output_filename, 'w') as fout:
  json.dump(via2, fout)
print('Written merged project to %s (discarded %d metadata)' % (output_filename, discarded_count))
