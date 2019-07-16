# Pack self contained VIA application
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
# Date: 16 May 2019

import string
import os
import sys

DIST_PACK_DIR = os.path.dirname(os.path.realpath(__file__))
VIA_SRC_DIR = os.path.join(DIST_PACK_DIR, '..')
if len(sys.argv) != 2:
  print("Usage: python3 pack_via.py target")
  print("e.g.: python3 pack_via.py video_annotator")
  sys.exit()

TARGET = sys.argv[1]
TARGET_HTML = os.path.join(VIA_SRC_DIR, 'src', 'html', '_via_' + TARGET + '.html')
DIST_DIR = os.path.join(VIA_SRC_DIR, 'dist')
OUT_HTML = os.path.join(DIST_DIR, 'via_' + TARGET + '.html')
if not os.path.exists(DIST_DIR):
    os.mkdir(DIST_DIR)

def get_src_file_contents(filename):
  full_filename = os.path.join(VIA_SRC_DIR, 'src', filename)
  with open(full_filename) as f:
    return f.read()

with open(OUT_HTML, 'w') as outf:
  with open(TARGET_HTML, 'r') as inf:
    for line in inf:
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
            parsedline = line.replace('//__ENABLED_BY_PACK_SCRIPT__', '');

          outf.write(parsedline)
print("Written packed file to: " + OUT_HTML)
