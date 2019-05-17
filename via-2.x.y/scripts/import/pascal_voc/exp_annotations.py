'''
Script to export PASCAL VOC 2012 annotation data in VIA format

Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
12 Apr. 2018
'''

import xmltodict
import os
import json

base_dir = '/data/datasets/voc2012/VOCdevkit/VOC2012/'
img_dir = os.path.join(base_dir, 'JPEGImages/')
ann_dir = os.path.join(base_dir, 'Annotations')
set_dir = os.path.join(base_dir, 'ImageSets', 'Main')

def get_via_fileid(filename, filesize):
  return filename + str(filesize);

def get_file_size(filename):
  return os.path.getsize(filename)

def get_region_attributes(d):
  ri = {}
  ri['shape_attributes'] = {}
  if 'bndbox' in d:
    x0 = int( float(d['bndbox']['xmin']) )
    y0 = int( float(d['bndbox']['ymin']) )
    x1 = int( float(d['bndbox']['xmax']) )
    y1 = int( float(d['bndbox']['ymax']) )

    ri['shape_attributes']['name'] = 'rect'
    ri['shape_attributes']['x'] = x0
    ri['shape_attributes']['y'] = y0
    ri['shape_attributes']['width'] = x1 - x0
    ri['shape_attributes']['height'] =  y1 - y0

  ri['region_attributes'] = {}
  if 'name' in d:
    ri['region_attributes']['name'] = d['name']
  if 'pose' in d:
    ri['region_attributes']['pose'] = d['pose']
  if 'truncated' in d:
    ri['region_attributes']['truncated'] = d['truncated']
  if 'difficult' in d:
    ri['region_attributes']['difficult'] = d['difficult']
  return ri

def voc_xml_to_json(fn):
  print(fn)
  with open(fn) as f:
    d = xmltodict.parse(f.read())
    d = d['annotation']

    img_fn   = d['filename']
    img_path = os.path.join(img_dir, img_fn)
    img_size = get_file_size(img_path)
    img_id   = get_via_fileid(img_fn, img_size)

    js = {}
    js[img_id] = {}
    js[img_id]['fileref']  = img_path
    js[img_id]['size']     = img_size
    js[img_id]['filename'] = img_fn
    js[img_id]['base64_img_data'] = ''

    fa = {}
    if 'source' in d:
      if 'database' in d['source']:
        fa['database'] = d['source']['database']
      if 'annotation' in d['source']:
        fa['annotation'] = d['source']['annotation']
      if 'image' in d['source']:
        fa['image'] = d['source']['image']
    if 'size' in d:
      if 'width' in d['size']:
        fa['width'] = d['size']['width']
      if 'height' in d['size']:
        fa['height'] = d['size']['height']
      if 'depth' in d['size']:
        fa['depth'] = d['size']['depth']

    if 'segmented' in d:
      fa['segmented'] = d['segmented']

    js[img_id]['file_attributes'] = fa

    js[img_id]['regions'] = []
    if isinstance(d['object'], list):
      region_count = len(d['object'])
      for i in range(0, region_count):
        ri = get_region_attributes( d['object'][i] )
        js[img_id]['regions'].append(ri)
    else:
      r = get_region_attributes( d['object'] )
      js[img_id]['regions'].append(r)

    return js

outjson_fn = '/data/datasets/via/import/pascal_voc/_via_project_pascal_voc2012_import.js'
outjson_f = open(outjson_fn, 'w')
outjson_f.write('var via_project_pascal_voc2012 = \'{"_via_settings":{}, "_via_attributes":{}, "_via_img_metadata":{')
first = True

for file in os.listdir(ann_dir):
  if file.endswith(".xml"):
    file_path = os.path.join(ann_dir, file)
    js = voc_xml_to_json(file_path)
    js_str = json.dumps(js)
    if not first:
      outjson_f.write( "," ) # remove first and last curley braces
    else:
      first = False

    outjson_f.write( js_str[1:-1] ) # remove first and last curley braces

outjson_f.write("}}\';")
outjson_f.close()
print('\nWritten everything to {}'.format(outjson_fn))
