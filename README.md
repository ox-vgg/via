# VGG Image Annotator

VGG Image Annotator (VIA) is an open source project developed at the 
[Visual Geometry Group](http://www.robots.ox.ac.uk/~vgg/) and released under 
the BSD-2 clause license. This work is supported by EPSRC programme grant 
Seebibyte: Visual Search for the Era of Big Data ([EP/M013774/1](http://www.seebibyte.org/index.html)).
Visit the [VGG software page](http://www.robots.ox.ac.uk/~vgg/software/via/) for more details.

VGG Face Annotator (VFA) is a fork of VIA adapated for marking and tagging 
facial regions.

## Features:
  * based solely on HTML, CSS and Javascript (no dependecies on any javascript libraries)
  * can be used offline (complete application packaged in a single html file of size < 200KB)
  * requires nothing more than a modern web browser (tested on firefox and chrome)
  * supports following region shapes: rectangle, circle, ellipse, polygon
  * supports multiple attributes for each image region
  * import (and export) of region data from (to) text file in csv and json format
  * hundreds of images can be loaded and annotated with any performance degradation

## Downloads
 * VGG Image Annotator (VIA)
   * [via.html.zip](http://www.robots.ox.ac.uk/~vgg/software/via/downloads/via.html.zip) : the VGG Image Annotator application (< 200KB)
   * [via.html](http://www.robots.ox.ac.uk/~vgg/software/via/downloads/via.html) : online version of the application
 * VGG Face Annotator (VFA)
   * [via_face.html (online version)](http://vgg.gitlab.io/via/via_face.html) : online version of the face annotator 
   * [via_face.html (offline version)](https://gitlab.com/vgg/via/raw/face_annotator/via_face.html) : download and save as html file to run locally in a web browser

## Demo
 * VGG Image Annotator (VIA)
   * [via_demo.html](http://vgg.gitlab.io/via/via_demo.html) : live demo of VIA application with preloaded image
 * VGG Face Annotator (VFA)
   * [via_face_demo_physicist.html](http://vgg.gitlab.io/via/via_face_demo_physicist.html) : live demo with preloaded regions and face images of renowned Physicists
   * [via_face_demo_sherlock.html](http://vgg.gitlab.io/via/via_face_demo_sherlock.html) : live demo with preloaded regions and face images from BBC [Sherlock Series](https://en.wikipedia.org/wiki/Sherlock_(TV_series))

## Docs
 * Getting Started : this can be accessed by pressing F1 key in the VIA application.
 * [VIA Software page @ VGG](http://www.robots.ox.ac.uk/~vgg/software/via/)
 * [VIA Wikipedia page](https://en.wikipedia.org/wiki/VGG_Image_Annotator)

## Developer Resources
For development, [via.js](https://gitlab.com/vgg/via/blob/develop/via.js) 
contains the Javascript source code and 
[index.html](https://gitlab.com/vgg/via/blob/develop/index.html) contains the 
HTML and CSS. The shell script [pack_via.sh](https://gitlab.com/vgg/via/blob/develop/pack_via.sh) 
packs the VIA application into a single and standalone application file 
[via.html](https://gitlab.com/vgg/via/blob/develop/via.html) containing the 
Javascript, HTML and CSS.

 * Source code
   * [VGG Image Annotator @ develop branch](https://gitlab.com/vgg/via/blob/develop)
   * [VGG Face Annotator @ face_annotator branch](https://gitlab.com/vgg/via/tree/face_annotator)
 * [Source code documentation](https://gitlab.com/vgg/via/blob/develop/CodeDoc.md)

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
