# Pack self contained demo of VIA
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
# Date: 16 May 2019

import os
import sys
import argparse

parser = argparse.ArgumentParser(
  description='Create standalone via demos'
)

parser.add_argument(
  'target',
  type=str,
  choices=['image_annotator', 'video_annotator', 'audio_annotator', 'pair_annotator'],
  help='Target that needs to be packaged'
)

parser.add_argument(
  '--enable-tracking',
  action='store_true',
  help='Flag to enable inclusion of tracking module with video_anntoator'
)
args = parser.parse_args()

DIST_PACK_DIR = os.path.dirname(os.path.realpath(__file__))
VIA_SRC_DIR = os.path.join(DIST_PACK_DIR, '..')

TARGET = args.target
TARGET_HTML = os.path.join(VIA_SRC_DIR, 'src', 'html', '_via_' + TARGET + '.html')
DEMO_DIR = os.path.join(VIA_SRC_DIR, 'dist', 'demo',)
OUT_HTML = os.path.join(DEMO_DIR, 'via_' + TARGET + '.html')
if not os.path.exists(DEMO_DIR):
    os.mkdir(DEMO_DIR)

def get_src_file_contents(filename):
  full_filename = os.path.join(VIA_SRC_DIR, 'src', filename)
  with open(full_filename) as f:
    return f.read()

def get_file_contents(filename):
  with open( os.path.join(VIA_SRC_DIR, filename) ) as f:
    return f.read()

with open(OUT_HTML, 'w') as outf:
  with open(TARGET_HTML, 'r') as inf:
    lines = inf.readlines()

    TARGET_DEMO_DATA_FILENAME = [
      'data',
      'demo',
      '_via_' + TARGET
    ]
    TARGET_DEMO_JS_FILENAME = [
      'src',
      'js',
      '_via_demo_' + TARGET
    ]

    if args.target == 'video_annotator':
      if args.enable_tracking:
        lines = [l for l in lines if 'ENABLE_TRACKING' not in l]
        TARGET_DEMO_DATA_FILENAME[-1] += '_with_tracking.js'
        TARGET_DEMO_JS_FILENAME[-1] += '_with_tracking.js'
      else:
        sidx, eidx = tuple(i for i, x in enumerate(lines) if 'ENABLE_TRACKING' in x)
        lines = lines[:sidx] + lines[(eidx+1):]
        TARGET_DEMO_DATA_FILENAME[-1] += '.js'
        TARGET_DEMO_JS_FILENAME[-1] += '.js'
    else:
      TARGET_DEMO_DATA_FILENAME[-1] += '.js'
      TARGET_DEMO_JS_FILENAME[-1] += '.js'

    # fetch demo data and demo script
    TARGET_DEMO_DATA_FILENAME = os.path.join(*TARGET_DEMO_DATA_FILENAME)
    TARGET_DEMO_JS_FILENAME = os.path.join(*TARGET_DEMO_JS_FILENAME)
    TARGET_DEMO_DATA = get_file_contents(TARGET_DEMO_DATA_FILENAME)
    TARGET_DEMO_JS = get_file_contents(TARGET_DEMO_JS_FILENAME)

    for line in lines:
      if 'tensorflow' in line:
        outf.write(line)
        continue

      if '<script src="' in line:
        tok = line.split('"')
        filename = tok[1][3:]
        outf.write('<!-- START: Contents of file: ' + filename + '-->\n')
        outf.write('<script>\n')
        outf.write( get_src_file_contents(filename) )
        outf.write('</script>\n')
        outf.write('<!-- END: Contents of file: ' + filename + '-->\n')
      else:
        if '<link rel="stylesheet" type="text/css"' in line:
          tok = line.split('"')
          filename = tok[5][3:]
          outf.write('<!-- START: Contents of file: ' + filename + '-->\n')
          outf.write('<style>\n')
          outf.write( get_src_file_contents(filename) )
          outf.write('</style>\n')
          outf.write('<!-- END: Contents of file: ' + filename + '-->\n')
        else:
          parsedline = line
          if "//__ENABLED_BY_PACK_SCRIPT__" in line:
            parsedline = line.replace('//__ENABLED_BY_PACK_SCRIPT__', '')
          if "//__ENABLED_BY_DEMO_PACK_SCRIPT__" in line:
            parsedline = line.replace('//__ENABLED_BY_DEMO_PACK_SCRIPT__', '')
          if  "<!-- DEMO SCRIPT AUTOMATICALLY INSERTED BY VIA PACKER SCRIPT -->" in line:
            parsedline  = ''
            parsedline += '<!-- START: Contents of file: ' + TARGET_DEMO_DATA_FILENAME + '-->\n'
            parsedline += '<script>\n'
            parsedline += TARGET_DEMO_DATA
            parsedline += '</script>\n'
            parsedline += '<!-- END: Contents of file: ' + TARGET_DEMO_DATA_FILENAME + '-->\n'
            parsedline += '<!-- START: Contents of file: ' + TARGET_DEMO_JS_FILENAME + '-->\n'
            parsedline += '<script>\n'
            parsedline += TARGET_DEMO_JS
            parsedline += '</script>\n'
            parsedline += '<!-- END: Contents of file: ' + TARGET_DEMO_JS_FILENAME + '-->\n'

          outf.write(parsedline)
print("Written packed file to: " + OUT_HTML)
