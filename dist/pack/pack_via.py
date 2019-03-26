# Compute frequency of words
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>

import string
import os


TARGET_HTML = '/ssd/adutta/dev/via/src/html/via_speaker_diarisation.html'
OUT_HTML = '/ssd/adutta/dev/via/dist/via_speaker_diarisation.html'
SRC_DIR='/ssd/adutta/dev/via/src/'

ANALYTICS_JS = '''(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-20555581-2', 'auto');
ga('set', 'page', '/via/3.0.0/via_speaker_diarisation');
ga('send', 'pageview');'''

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
          if '//<!--AUTO_INSERT_GOOGLE_ANALYTICS_JS_HERE-->' in line:
            outf.write(ANALYTICS_JS + '\n')
          else:
            outf.write(line)

