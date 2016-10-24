#!/usr/bin/env sh

VIA_JS_FILE=via.js
TEMPLATE_HTML_FILE=index.html
TARGET_HTML_FILE=via.html

# source: http://stackoverflow.com/questions/16811173/bash-inserting-one-files-content-into-another-file-after-the-pattern
sed -e '/<!--AUTO_INSERT_VIA_JS_HERE-->/r./'$VIA_JS_FILE $TEMPLATE_HTML_FILE > $TARGET_HTML_FILE
echo 'Written html file to '$TARGET_HTML_FILE
