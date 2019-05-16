#!/usr/bin/env sh

VIA_JS_FILE=via.js
VIA_DEMO_JS_FILE=via_demo.js
TEMPLATE_HTML_FILE=index.html
TARGET_HTML_FILE=via_demo.html
GOOGLE_ANALYTICS_JS_FILE=via_google_analytics.js

TMP_FILE1=temp_file1.html
TMP_FILE2=temp_file2.html

# source: http://stackoverflow.com/questions/16811173/bash-inserting-one-files-content-into-another-file-after-the-pattern
rm -f $TMP_FILE
sed -e '/<!--AUTO_INSERT_VIA_JS_HERE-->/r./'$VIA_JS_FILE $TEMPLATE_HTML_FILE > $TMP_FILE1
sed -e '/<!--AUTO_INSERT_VIA_DEMO_JS_HERE-->/r./'$VIA_DEMO_JS_FILE $TMP_FILE1 > $TMP_FILE2
sed -e '/<!--AUTO_INSERT_GOOGLE_ANALYTICS_JS_HERE-->/r./'$GOOGLE_ANALYTICS_JS_FILE $TMP_FILE2 > $TARGET_HTML_FILE
rm -f $TMP_FILE1 $TMP_FILE2

echo 'Written html file to '$TARGET_HTML_FILE
