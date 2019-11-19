# Extract image regions defined in a VIA project
#
# Author: Abhishek Dutta <adutta _AT_ robots.ox.ac.uk>
# Date: 19 Nov. 2019
#

import json
import argparse
from PIL import Image
import os

parser = argparse.ArgumentParser()
parser.add_argument("--project", help="location of a VIA 2.x.y project saved as a JSON file")
parser.add_argument("--imdir", help="location of images referenced in the VIA project")
parser.add_argument("--cropdir", help="cropped images are stored in this folder")
parser.add_argument("--cropmeta", help="metadata associated with each cropped image gets saved to this file")
parser.add_argument("--croppad", help="padding (default=0) applied to each cropped image (to provide additional context)", type=int, default=0)
args = parser.parse_args()

via = {}
with open(args.project, 'r') as f:
    via = json.load(f)

cropmeta = open(args.cropmeta, 'w')
cropmeta.write('crop_fn,original_fn,region_metadata\n')
for fid in via['_via_img_metadata']:
    fn = os.path.join(args.imdir, via['_via_img_metadata'][fid]['filename'])
    if not os.path.isfile(fn):
        print('File not found! %s' %(fn))
        continue
    im = Image.open(fn)
    imwidth, imheight = im.size
    rindex = 1
    for region in via['_via_img_metadata'][fid]['regions']:
        if region['shape_attributes']['name'] != 'rect':
            print('extraction of %s regions not yet implemented!' % region['shape_attributes']['name'])
            continue
        x = region['shape_attributes']['x']
        y = region['shape_attributes']['y']
        w = region['shape_attributes']['width']
        h = region['shape_attributes']['height']

        left = max(0, x - args.croppad)
        top = max(0, y - args.croppad)
        right = min(imwidth, x + w + args.croppad)
        bottom = min(imheight, y + h + args.croppad)
        crop = im.crop((left, top, right, bottom))
        extold = os.path.splitext(via['_via_img_metadata'][fid]['filename'])[1]
        extnew = extold.replace('.', '_' + str(rindex) + '.')
        cropname = via['_via_img_metadata'][fid]['filename'].replace(extold, extnew)
        print(cropname)
        cropfn = os.path.join(args.cropdir, cropname)
        crop.save(cropfn)
        cropmeta.write('%s,%s,"%s"\n' %(cropname,
                                      via['_via_img_metadata'][fid]['filename'],
                                      str(region['region_attributes'])))
cropmeta.close()
