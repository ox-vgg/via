VIA software is developed using HTML, CSS and Javascript and is based solely on 
standard features available in modern web browsers. 
VIA does not depend on any external libraries. These design
decisions has helped us create a very light weight and feature rich manaul
annotation software that can run on most modern web browsers without
requiring any installation or setup. The full VIA software sprouted from an
[early prototype](http://www.robots.ox.ac.uk/~vgg/software/via/via-0.0.1.txt)
of VIA which implemented a minimal -- yet functional -- image annotation tool
using only 40 lines of HTML/CSS/Javascript code that runs as
an offline application in most modern web browsers. This early prototype
provides a springboard for understanding the current codebase of VIA which
is just an extension of the early prototype. The [introductory tutorials](https://developer.mozilla.org/en-US/docs/Web/HTML) 
prepared by Mozilla is also very helpful in understanding the basic concepts of
HTML/CSS/Javascript platform.

The development of VIA software began in August 2016 and the first public
release of Version~1 was made in April 2017. Many new advanced features
for image annotation were introduced in Version~2 which was released in
June 2018. The recently released Version~3 supports annotation of audio and video.
Therefore, the VIA source code repository contains a separate folder for each 
major version of VIA: [via-1.x.y](via-1.x.y/), [via-2.x.y](via-2.x.y/) and [via-3.x.y](via-3.x.y/).
The development of each version is carried out in a separate branch (e.g. [via-2.x.y branch](https://gitlab.com/vgg/via/tree/via-2.x.y).
If you wish to contribute code to VIA (we encourage you to do so), please send 
a pull request to one of the branches. Please do not send pull requests to the 
[master branch](https://gitlab.com/vgg/via/tree/master).

We have prepared the following code documentation for each major version of VIA:
 * [Code Documentation for via-1.x.y](https://gitlab.com/vgg/via/blob/master/via-1.x.y/CodeDoc.md)
 * [Code Documentation for via-2.x.y](https://gitlab.com/vgg/via/blob/master/via-2.x.y/CodeDoc.md)
 * [Code Documentation for via-3.x.y](https://gitlab.com/vgg/via/blob/master/via-3.x.y/CodeDoc.md)

Software bug reports and feature requests should be 
[submitted here](https://gitlab.com/vgg/via/issues/new) (requires a gitlab account).

```
Author: Abhishek Dutta
Version: 20 May 2019
```
