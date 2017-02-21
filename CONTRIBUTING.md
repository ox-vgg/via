 # Contribution Guidelines
 * Try to write a code that does not need any further explanation to a person
literate in computer programming.
 * Code comment should be used sparsely because **the code should speak for itself**.
 * There are limitations of what you can achieve using a HTML,CSS and plain Javascript. 
Don't try to achieve what you can easily do in other languages or platforms.
 * The following javascript code style is recommended: https://github.com/bevacqua/js
 * VIA application can be generated using the [pack_via.sh](https://gitlab.com/vgg/via/blob/develop/pack_via.sh) script:
```
$ ./pack_via.sh
```
 * The final via application html file should pass the [W3C Markup Validation](https://validator.w3.org/).
 
# Naming convention
 * NoCamelCase, use underscore instead for variable and function names
```
var image_panel = document.getElementById("image_panel");
...
function download_all_region_data(type) {
  ...
}
```
 * A name of a variable responsible for maintaining the state of VIA application 
should have start with `_via_`. For example, `_via_img_metadata` variable stores 
all the image metadata.
 * Constants are ALL_CAPITAL_LETTERS
 
