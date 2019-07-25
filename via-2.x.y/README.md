# VGG Image Annotator

VGG Image Annotator (VIA) is a simple and standalone manual image annotation 
software. VIA runs in a web browser and does not require any installation or setup. 
The complete VIA software fits in a single self-contained HTML page of size 
less than 400 Kilobyte that runs as an offline application in most modern web browsers.

VIA is an [open source](https://gitlab.com/vgg/via) project based solely on 
HTML, Javascript and CSS (no dependency on external libraries). VIA is 
developed at the [Visual Geometry Group](http://www.robots.ox.ac.uk/~vgg/) (VGG) 
and released under the BSD-2 clause [license](https://gitlab.com/vgg/via/blob/master/LICENSE)
which allows it to be useful for both academic projects and commercial applications.

## Screenshots
<img src="via-2.x.y/doc/screenshots/via_demo_screenshot2_via-2.0.2.jpg" alt="Screenshot showing basic image annotation" title="Screenshot showing basic image annotation" height="370">
<img src="via-2.x.y/doc/screenshots/via_face_demo_screenshot4.jpg" alt="Screenshot of VIA being used for face annotation" title="Screenshot of VIA being used for face annotation" height="370">
<img src="via-2.x.y/doc/screenshots/via_face_track_demo_screenshot1.jpg" alt="Screenshot of VIA being used for face track annotation" title="Screenshot of VIA being used for face track annotation" height="370">

## Demo
We have created self contained demo to illustrate the usage of VIA. These demo
have been preloaded with some sample images. Furthermore, we have 
also added some sample manual annotations to these demo. These demo applications 
are very useful to get familiar with the commonly used features of VIA.
  * [Basic Image Annotation Demo](http://www.robots.ox.ac.uk/~vgg/software/via/via_demo.html)
  * [Face Annotation Demo](http://www.robots.ox.ac.uk/~vgg/software/via/via_face_demo.html)
  * [Remote Image Annotation Demo](http://www.robots.ox.ac.uk/~vgg/software/via/via_wikimedia_demo.html)
  * [Face Track Annotation Demo](http://www.robots.ox.ac.uk/~vgg/software/via/docs/face_track_annotation.html)

## Download
Detailed instructions for download of VIA3 are available at http://www.robots.ox.ac.uk/~vgg/software/via/

## Docs
 * User Guide : this can be accessed from the menubar "Help -> Getting Started"
 * [Face Track Annotation](http://www.robots.ox.ac.uk/~vgg/software/via/docs/face_track_annotation.html)
 * [Setting up a project containing remotely hosted images](http://www.robots.ox.ac.uk/~vgg/software/via/docs/via_with_remote_images.html)
 * [A blog post describing VIA and its open source ecosystem.](http://www.robots.ox.ac.uk/~vgg/blog/vgg-image-annotator.html)

## Open Source Ecosystem
The development of VIA software began in August 2016 and the first public
release of version 1 was made in April 2017. Many new advanced features
for image annotation were introduced in version 2 which was released in June 2018. 
Recently released version 3 of VIA software supports annotation of audio and video. 
As of May 2019, the VIA software has been used more than 600,000 times (+150,000 unique pageviews).

We have nurtured a large and thriving open source community which not
only provides feedback but also contributes code to add new features
and improve existing features in the VIA software. The open source
ecosystem of VIA thrives around its [source code repository](https://gitlab.com/vgg/via)
hosted by the Gitlab platform. Most of our users report issues and
request new features for future releases using the [issue portal](https://gitlab.com/vgg/via/issues). 
Many of our users not only submit bug reports but also suggest a potential
fix for these software issues. Some of our users also contribute code
to add new features to the VIA software using the [merge request portal](https://gitlab.com/vgg/via/merge_requests). 

We welcome all forms of contributions (code update, documentation, bug reports, etc) from users. 
Such contributions must must adhere to the existing [license](https://gitlab.com/vgg/via/blob/master/LICENSE) of 
the VIA project.

## Citation
If you use this software, please cite it as shown below and acknowledge the Seebibyte grant as follows: "Development and maintenance of VGG Image Annotator (VIA) is supported by EPSRC programme grant Seebibyte: Visual Search for the Era of Big Data (EP/M013774/1)" 
```
@article{dutta2019vgg,
  title={{The VGG} Image Annotator ({VIA})},
  author={Dutta, Abhishek and Zisserman, Andrew},
  journal={arXiv preprint arXiv:1904.10699},
  year={2019}
}

@misc{ dutta2016via,
  author = "Dutta, A. and Gupta, A. and Zissermann, A.",
  title = "{VGG} Image Annotator ({VIA})",
  year = "2016",  
  howpublished = "http://www.robots.ox.ac.uk/~vgg/software/via/",  
  note = "Version: X.Y.Z, Accessed: INSERT_DATE_HERE" 
}
```

## Developer Resources
**Please send all pull requests for a specific version (e.g. via-2.x.y) to their respective branch (e.g. branch via-2.x.y). All contributions made to VIA code repository will be licensed under the [BSD-2 clause license](https://gitlab.com/vgg/via/blob/master/LICENSE).**

The VIA application is made up of the following three files:
 * [index.html](via-2.x.y/src/index.html) : defines the user interface components 
like menu bar, toolbar, annotation editor, shape selector, file list, etc.
 * [via.css](via-2.x.y/src/via.css) : describes the style (e.g. colour, font size, 
border, etc.) of user interface components defined in [index.html](via-2.x.y/src/index.html).
 * [via.js](via-2.x.y/src/via.js) : Javascript code that manages user interactions 
(e.g. draw regions, select region shape, etc.) and other aspects of the VIA 
application (e.g. load file, import/export annotations, edit metadata, etc.)

The above three files are combined by [pack_via.py](via-2.x.y/scripts/pack_via.py)
script to generate the final VIA application file named [via.html](via-2.x.y/dist/via.html).

More details about the VIA source code is available in the [source code documentation](via-2.x.y/CodeDoc.md)
file. All the files related to the VIA application reside in the [via-2.x.y branch](https://gitlab.com/vgg/via/tree/via-2.x.y/via-2.x.y)
of the source code repository. The [Quality Assessment](via-2.x.y/QualityAssessment.md) 
page describes the guidelines to ensure the quality of VIA application, source 
code and its documentation.

Software bug reports and feature requests should be 
[submitted here](https://gitlab.com/vgg/via/issues/new) (requires gitlab account).

## License
VIA is an open source project released under the 
[BSD-2 clause license](https://gitlab.com/vgg/via/blob/master/LICENSE).

## Contact
Contact [Abhishek Dutta](adutta_remove_me_@robots.ox.ac.uk) for any queries or feedback related to this application.

## Acknowledgements
This work is supported by EPSRC programme grant Seebibyte: Visual Search for the Era of Big Data ( [EP/M013774/1](http://www.seebibyte.org/index.html) )

