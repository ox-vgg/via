# Compute frequency of words
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>

import string
import os


TARGET_HTML = '/home/tlm/dev/via/src/html/chimp_video_annotation.html'
OUT_HTML = '/home/tlm/dev/via/dist/chimp_video_annotation.html'
SRC_DIR='/home/tlm/dev/via/src/'

def get_file_contents(filename):
  full_filename = os.path.join(SRC_DIR, filename)
  with open(full_filename) as f:
    return f.read()

with open(OUT_HTML, 'w') as outf:
  with open(TARGET_HTML, 'r') as inf:
    for line in inf:
      if '<script src="' in line:
        tok = line.split('"')
        filename = tok[1][3:]
        outf.write('<!-- Start of file: ' + filename + '-->\n')
        outf.write('<script>\n')
        outf.write( get_file_contents(filename) )
        outf.write('</script>\n')
        outf.write('<!-- End of file: ' + filename + '-->\n')
      else:
        if '<link rel="stylesheet" type="text/css"' in line:
          tok = line.split('"')
          filename = tok[5][3:]
          outf.write('<!-- Start of file: ' + filename + '-->\n')
          outf.write('<style>\n')
          outf.write( get_file_contents(filename) )
          outf.write('</style>\n')
          outf.write('<!-- End of file: ' + filename + '-->\n')
        else:
          outf.write(line)

