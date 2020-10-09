# Pack subtitle annotator
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
# Date: 09 Oct. 2020

import string
import os
import sys

DIST_PACK_DIR = os.path.dirname(os.path.realpath(__file__))
VIA_SRC_DIR = os.path.join(DIST_PACK_DIR, '..')

TARGET = "subtitle_annotator"

def get_file_content(basedir, filename):
  full_filename = os.path.join(basedir, filename)
  if os.path.exists(full_filename):
    print( 'Loading %s' % (full_filename) )
    with open(full_filename) as f:
      return f.read()
  else:
    print( 'File Not Found %s' % (full_filename) )
    sys.exit(1)

##
## Pack subtitle annotator application
##
print("\nGenerating subtitle annotator application")
TARGET_HTML = os.path.join(VIA_SRC_DIR, 'projects', TARGET, '_via_' + TARGET + '.html')
OUT_HTML = os.path.join(VIA_SRC_DIR, 'dist', 'via_' + TARGET + '.html')
FILE_BASEDIR = os.path.join(VIA_SRC_DIR, 'projects', TARGET)

with open(OUT_HTML, 'w') as outf:
  with open(TARGET_HTML, 'r') as inf:
    for line in inf:
      if '<script src="' in line:
        tok = line.split('"')
        filename = tok[1]
        outf.write('<!-- START: Contents of file: ' + filename + '-->\n')
        outf.write('<script>\n')
        outf.write( get_file_content(FILE_BASEDIR, filename) )
        outf.write('</script>\n')
        outf.write('<!-- END: Contents of file: ' + filename + '-->\n')
      else:
        if '<link rel="stylesheet" type="text/css"' in line:
          tok = line.split('"')
          filename = tok[5]
          outf.write('<!-- START: Contents of file: ' + filename + '-->\n')
          outf.write('<style>\n')
          outf.write( get_file_content(FILE_BASEDIR, filename) )
          outf.write('</style>\n')
          outf.write('<!-- END: Contents of file: ' + filename + '-->\n')
        else:
          parsedline = line
          if "//__ENABLED_BY_PACK_SCRIPT__" in line:
            parsedline = line.replace('//__ENABLED_BY_PACK_SCRIPT__', '');
          #if "//__ENABLED_BY_DEMO_PACK_SCRIPT__" in line:
          #  parsedline = line.replace('//__ENABLED_BY_DEMO_PACK_SCRIPT__', '');

          outf.write(parsedline)
print("Written packed application file to: " + OUT_HTML)

##
## Pack demo for subtitle annotator
##
print("\nGenerating demo for subtitle annotator")
TARGET_HTML = os.path.join(VIA_SRC_DIR, 'projects', TARGET, '_via_' + TARGET + '.html')
DEMO_DIR = os.path.join(VIA_SRC_DIR, 'dist', 'demo',)
FILE_BASEDIR = os.path.join(VIA_SRC_DIR, 'projects', TARGET)
OUT_HTML = os.path.join(DEMO_DIR, 'via_' + TARGET + '.html')

if not os.path.exists(DEMO_DIR):
    os.mkdir(DEMO_DIR)

# fetch demo data and demo script
TARGET_DEMO_DATA_FILENAME = os.path.join('data', 'demo', '_via_' + TARGET + '.js')
TARGET_DEMO_DATA = get_file_content(VIA_SRC_DIR, TARGET_DEMO_DATA_FILENAME)
TARGET_DEMO_JS_FILENAME = os.path.join('projects', TARGET, '_via_demo_' + TARGET + '.js')
TARGET_DEMO_JS = get_file_content(VIA_SRC_DIR, TARGET_DEMO_JS_FILENAME)

with open(OUT_HTML, 'w') as outf:
  with open(TARGET_HTML, 'r') as inf:
    for line in inf:
      if '<script src="' in line:
        tok = line.split('"')
        filename = tok[1]
        outf.write('<!-- START: Contents of file: ' + filename + '-->\n')
        outf.write('<script>\n')
        outf.write( get_file_content(FILE_BASEDIR, filename) )
        outf.write('</script>\n')
        outf.write('<!-- END: Contents of file: ' + filename + '-->\n')
      else:
        if '<link rel="stylesheet" type="text/css"' in line:
          tok = line.split('"')
          filename = tok[5]

          outf.write('<!-- START: Contents of file: ' + filename + '-->\n')
          outf.write('<style>\n')
          outf.write( get_file_content(FILE_BASEDIR, filename) )
          outf.write('</style>\n')
          outf.write('<!-- END: Contents of file: ' + filename + '-->\n')
        else:
          parsedline = line
          if "//__ENABLED_BY_PACK_SCRIPT__" in line:
            parsedline = line.replace('//__ENABLED_BY_PACK_SCRIPT__', '');
          if "//__ENABLED_BY_DEMO_PACK_SCRIPT__" in line:
            parsedline = line.replace('//__ENABLED_BY_DEMO_PACK_SCRIPT__', '');
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