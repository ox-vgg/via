# VGG Image Annotator

VGG Image Annotator (VIA) is an image annotation tool that can be used to define 
regions in an image and create textual descriptions of those regions. VIA is an 
open source project developed at the [Visual Geometry Group](http://www.robots.ox.ac.uk/~vgg/) 
and released under the BSD-2 clause license. This work is supported by EPSRC programme grant 
Seebibyte: Visual Search for the Era of Big Data ([EP/M013774/1](http://www.seebibyte.org/index.html)).
Visit the [VGG software page](http://www.robots.ox.ac.uk/~vgg/software/via/) for more details.


## Features:
  * based solely on HTML, CSS and Javascript (no external javascript libraries)
  * can be used off-line (full application in a single html file of size &lt; 400KB)
  * requires nothing more than a modern web browser (tested on Firefox, Chrome and Safari)
  * supported region shapes: rectangle, circle, ellipse, polygon and point
  * import/export of region data in csv and json file format
  * quick update of annotations using on-image annotation editor

## Downloads
See http://www.robots.ox.ac.uk/~vgg/software/via/

## Docs
 * User Guide : this can be accessed from the menubar "Help -> Getting Started"
 * [VIA Software page @ VGG](http://www.robots.ox.ac.uk/~vgg/software/via/)
 * [VIA Wikipedia page](https://en.wikipedia.org/wiki/VGG_Image_Annotator)

## Developer Resources
**Please send all pull requests to `develop` branch. All contributions made to VIA code repository will be licensed under the [BSD-2 clause license](https://gitlab.com/vgg/via/blob/master/LICENSE).**

For development, [via.js](https://gitlab.com/vgg/via/blob/develop/via.js) 
contains the Javascript source code and 
[index.html](https://gitlab.com/vgg/via/blob/develop/index.html) contains the 
HTML and CSS. The shell script [scripts/pack_via.sh](scripts/pack_via.sh) 
packs the VIA application into a single and standalone application file 
[via.html](https://gitlab.com/vgg/via/blob/develop/via.html) containing the 
Javascript, HTML and CSS.

 * Source code: [VGG Image Annotator @ develop branch](https://gitlab.com/vgg/via/blob/develop)
 * [Source code documentation](https://gitlab.com/vgg/via/blob/develop/CodeDoc.md)
 * Unit Tests : see files inside `tests/` folder

The [Quality Assessment](https://gitlab.com/vgg/via/blob/develop/QualityAssessment.md) 
page describes the guidelines to ensure the quality of VIA application, source 
code and its documentation.

Software bug reports and feature requests should be 
[submitted here](https://gitlab.com/vgg/via/issues/new) (requires gitlab account).
For all other queries, please contact [Abhishek Dutta](mailto:adutta@robots.ox.ac.uk).

## License
VIA is an open source project released under the 
[BSD-2 clause license](https://gitlab.com/vgg/via/blob/master/LICENSE).

## Author
[Abhishek Dutta](mailto:adutta@robots.ox.ac.uk)  
Aug. 31, 2016
