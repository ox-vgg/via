# Merge two or more VIA3 projects
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
# Date: 04-March-2021

import json

print('Assumptions:')
print(' - the following properties are same across all projects: project, config, attribute')
print(' - the following identifiers are unique across all projects: file_id, view_id, metadata_id')
print('(when you split a project that will eventually get merged, ensure that the above assumptions are fulfilled')

# add the filename of all VIA3 projects
filename_list = ['via3_project1.json', 'via3_project2.json']
output_filename = 'via3_project_merged.json'

via3_projects = []
for i in range(0, len(filename_list)):
    with open(filename_list[i], 'r') as f:
        via3_projects.append( json.load(f) )

print('Processing %s' % (filename_list[0]))
via3 = via3_projects[0]

for i in range(1, len(filename_list)):
    print('Processing %s' % (filename_list[i]))

    ## copy files
    for file_id in via3_projects[i]['file']:
        via3['file'][file_id] = via3_projects[i]['file'][file_id]
    ## copy all metadata
    for mid in via3_projects[i]['metadata']:
        via3['metadata'][mid] = via3_projects[i]['metadata'][mid]
    ## copy all view
    for vid in via3_projects[i]['view']:
        via3['view'][vid] = via3_projects[i]['view'][vid]
        via3['project']['vid_list'].append(vid) # append new views

with open(output_filename, 'w') as fout:
  json.dump(via3, fout)
print('Written merged project to %s' % (output_filename))
