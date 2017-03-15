## [1.0] - not released yet
 * A major and stable release of VGG Image Annotator.

## [0.1b] - 2016-10-24
 * This is the first release of VGG Image Annotator.
 * This is a beta release and had only been tested on the latest versions of 
Google Chrome and Mozilla Firefox.
 * It supports the work flow of a basic manual image annotation process.
 * We used semicolon (;) to seperate the key-value pair of 
region and file attributes. For example: [key1=value1;key2=value2;...]. To 
extract the (key,value) pair, we parse this string using semicolon as the 
separator. If the value contains semicolon (;), our parser breaks down. So 
avoid entering special characters (,;:) in the attribute value. However, this 
issue does not exist when using the JSON file format.

