# Pack self contained demo of VIA
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
# Date: 16 May 2019

import string
import os
import sys

DIST_PACK_DIR = os.path.dirname(os.path.realpath(__file__))
VIA_SRC_DIR = os.path.join(DIST_PACK_DIR, '..')
if len(sys.argv) != 2:
  print("Usage: python3 pack_demo.py target")
  print("e.g.: python3 pack_demo.py video_annotator")
  sys.exit()

TARGET = sys.argv[1]
TARGET_HTML = os.path.join(VIA_SRC_DIR, 'src', 'html', '_via_' + TARGET + '.html')
OUT_HTML = os.path.join(VIA_SRC_DIR, 'dist', 'demo', 'via_' + TARGET + '.html')

def get_src_file_contents(filename):
  full_filename = os.path.join(VIA_SRC_DIR, 'src', filename)
  with open(full_filename) as f:
    return f.read()

def get_file_contents(filename):
  with open( os.path.join(VIA_SRC_DIR, filename) ) as f:
    return f.read()

# fetch demo data and demo script
TARGET_DEMO_DATA_FILENAME = os.path.join('data', 'demo', '_via_' + TARGET + '.js')
TARGET_DEMO_DATA = get_file_contents(TARGET_DEMO_DATA_FILENAME)
TARGET_DEMO_JS_FILENAME = os.path.join('src', 'js', '_via_demo_' + TARGET + '.js')
TARGET_DEMO_JS = get_file_contents(TARGET_DEMO_JS_FILENAME)

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
          if "//_ENABLED_BY_PACK_SCRIPT" in line:
            parsedline = line.replace('//__ENABLED_BY_PACK_SCRIPT__', '');
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
print("Written packed file to: " + TARGET_HTML)
