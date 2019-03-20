# Compute frequency of words
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>

import string
import os
import csv
import pickle

discard_list_fn = '/data/datasets/arsha/diarisation/voxceleb/videos_with_0_size.txt'
metadata_fn = '/data/datasets/arsha/diarisation/voxceleb/metadata.txt'
pkl_fn = '/data/datasets/arsha/diarisation/voxceleb/sel_metadata.pkl'

file_metadata = {};

discard_list = [];

with open(discard_list_fn, 'r') as f:
  discard_data = f.read()
  lines = discard_data.split('\n')
  for line in lines:
    discard_list.append( line )

with open(metadata_fn, 'r') as f:
  metadata = f.read()
  lines = metadata.split('\n')
  for line in lines:
    tokens = line.split(' ')
    if len(tokens) == 4:
      filename = tokens[0]
      speaker = tokens[1]
      t0 = tokens[2]
      t1 = tokens[3]

      if filename not in discard_list:
        if filename not in file_metadata:
          file_metadata[filename] = []
        file_metadata[filename].append( { 'speaker':speaker, 't0':t0, 't1':t1 } )

with open(pkl_fn, 'wb') as f:
  pickle.dump(file_metadata, f)

