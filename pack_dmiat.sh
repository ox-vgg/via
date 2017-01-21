#!/usr/bin/env sh

VIA_JS_FILE=via.js
DMIAT_JS_FILE=dmiat.js
GITHUB_AUTH_JS_FILE=github_auth.js
GOOGLE_ANALYTICS_JS_FILE=google_analytics_via.js
TEMPLATE_HTML_FILE=index.html
TARGET_HTML_FILE=dmiat.html
TMP_FILE1=temp_file1.html
TMP_FILE2=temp_file2.html

# source: http://stackoverflow.com/questions/16811173/bash-inserting-one-files-content-into-another-file-after-the-pattern
rm -f $TMP_FILE1 $TMP_FILE2
sed -e '/<!--AUTO_INSERT_DMIAT_JS_HERE-->/r./'$DMIAT_JS_FILE $TEMPLATE_HTML_FILE > $TMP_FILE1
sed -e '/<!--AUTO_INSERT_VIA_JS_HERE-->/r./'$VIA_JS_FILE $TMP_FILE1 > $TMP_FILE2
sed -e '/<!--AUTO_INSERT_GOOGLE_ANALYTICS_JS_HERE-->/r./'$GOOGLE_ANALYTICS_JS_FILE $TMP_FILE2 > $TMP_FILE1
sed -e '/<!--AUTO_INSERT_GITHUB_AUTH_JS_HERE-->/r./'$GITHUB_AUTH_JS_FILE $TMP_FILE1 > $TARGET_HTML_FILE
rm -f $TMP_FILE1 $TMP_FILE2

echo 'Written html file to '$TARGET_HTML_FILE
