#!/bin/bash

set -e
set -u

VIA_JS_FILE=via.js
TEMPLATE_HTML_FILE=index.html
TARGET_HTML_FILE=via_test.html
GOOGLE_ANALYTICS_JS_FILE=via_google_analytics.js

TMP_FILE1=temp_file1.html
TMP_FILE2=temp_file2.html

VIA_BASEDIR=`pwd`
VIA_TEST_FILE="tmp_via_all_tests.js"
# concatenate all unit test javascript files
(cd "${VIA_BASEDIR}/tests/";
cat $(ls -tpa | grep -v / ) > "../${VIA_TEST_FILE}"
)

# source: http://stackoverflow.com/questions/16811173/bash-inserting-one-files-content-into-another-file-after-the-pattern
sed -e '/<!--AUTO_INSERT_VIA_JS_HERE-->/r./'$VIA_JS_FILE $TEMPLATE_HTML_FILE > $TMP_FILE1
sed -e '/<!--AUTO_INSERT_VIA_TEST_JS_HERE-->/r./'$VIA_TEST_FILE $TMP_FILE1 > $TMP_FILE2
sed -e '/<!--AUTO_INSERT_GOOGLE_ANALYTICS_JS_HERE-->/r./'$GOOGLE_ANALYTICS_JS_FILE $TMP_FILE2 > $TARGET_HTML_FILE
rm -f $TMP_FILE1 $TMP_FILE2 $VIA_TEST_FILE

echo 'Written html file to '$TARGET_HTML_FILE
