# Compute frequency of words
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>

import string
import os

discard_fn = '/data/datasets/arsha/diarisation/voxceleb/videos_with_0_size.txt'
metadata_fn = '/data/datasets/arsha/diarisation/voxceleb/metadata.txt'
file_metadata = {};

with open(metadata_fn, 'r') as f:
  metadata = f.read()
  lines = metadata.split('\n')
  for line in lines:
    tokens = line.split(' ')
    if len(tokens) == 4:
      filename = tokens[0]
      speakerid = tokens[1]
      t0 = tokens[2]
      t1 = tokens[3]

      if filename not in file_metadata:
        file_metadata[filename] = []
      file_metadata[filename].append( { 'filename':filename, 'speakerid':speakerid, 't0':t0, 't1':t1 } )

PROJECT_FILE_COUNT = 50
via_project_list = {};

for filename in file_metadata:
  d = {}
  d.project_store = {}
print('\nnumber of files = %d' % len(file_metadata))
