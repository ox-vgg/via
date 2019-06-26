# Pack self contained VIA application
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
# Date: 13 June 2019

import string
import os
import sys

DIST_PACK_DIR = os.path.dirname(os.path.realpath(__file__))
VIA_SRC_DIR = os.path.join(DIST_PACK_DIR, '..')

SOURCE_HTML = os.path.join(VIA_SRC_DIR, 'src', 'index.html')
OUT_HTML = os.path.join(VIA_SRC_DIR, 'dist', 'via.html')

def get_src_file_contents(filename):
  full_filename = os.path.join(VIA_SRC_DIR, 'src', filename)
  with open(full_filename) as f:
    return f.read()

with open(OUT_HTML, 'w') as outf:
  with open(SOURCE_HTML, 'r') as inf:
    for line in inf:
      if '<script src="' in line:
        tok = line.split('"')
        filename = tok[1]
        outf.write('<!-- START: Contents of file: ' + filename + '-->\n')
        outf.write('<script>\n')
        outf.write( get_src_file_contents(filename) )
        outf.write('</script>\n')
        outf.write('<!-- END: Contents of file: ' + filename + '-->\n')
      else:
        if '<link rel="stylesheet" type="text/css"' in line:
          tok = line.split('"')
          filename = tok[5]
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
