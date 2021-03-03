# Code Documentation for VIA Version 3.x.y

Author: [Abhishek Dutta](mailto:adutta_REMOVE_@robots.ox.ac.uk), Version: 16 May 2019

The full VIA3 software application fits in a single HTML file of size less than 
300 Kilobyte containing nearly 8000 lines of carefully amalgamated HTML, CSS 
and Javascript code. This single HTML file can run as an offline application 
in most modern web browsers to provide the functionality of a fully featured 
manual annotation software application for image, audio and video. In this 
report we explain different aspects of the software code powering the VIA3 
software with the aim of nurturing future code contributors to this open source 
project.

The final VIA3 application (e.g. [via_video_annotator.html](via-3.x.y/dist/via_video_annotator.html)) that is used for
manual annotation is produced by packing together [_via_video_annotator.html](via-3.x.y/src/html/_via_video_annotator.html),
[via_video_annotator.css](via-3.x.y/src/css/via_video_annotator.css) and the 
Javascript modules defined in [src/js](via-3.x.y/src/js) folder using
[pack_via.py](via-3.x.y/scripts/pack_via.py) as described in Section [Packing VIA as a Single HTML File](packing-via-as-a-single-html-file).
In this report, we will start discussion from [_via_video_annotator.html](via-3.x.y/src/html/_via_video_annotator.html)
file because this HTML file binds together both the CSS and Javascript portions 
of VIA3 application. Below, we show a simplified view of [_via_video_annotator.html](via-3.x.y/src/html/_via_video_annotator.html) 
file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>VIA Video Annotator</title>
  <style>
  [CSS style definitions]
  </style>
</head>

<body onresize="via._hook_on_browser_resize()">
  <svg style="display:none;" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    [Definition of SVG icons]
  </svg>
  <div id="via_info_page_container">
    [Definition of information pages (e.g. About, Help, Keyboard Shortcuts, etc)]
  </div>
  <div id="via_start_info_content" class="hide">
    [Definition of usage information shown when VIA start up]
  </div>

  <div class="via_container" id="via_container" tabindex="0">
    [VIA container which is dynamically populated by VIA Javascript codebase]
  </div>

  <script src="../js/_via_util.js"></script>
  <script src="../js/_via_const.js"></script>
  <script src="../js/_via_config.js"></script>
  <script src="../js/_via_event.js"></script>
  <script src="../js/_via_control_panel.js"></script>
  <script src="../js/_via_metadata.js"></script>
  <script src="../js/_via_file.js"></script>
  <script src="../js/_via_attribute.js"></script>
  <script src="../js/_via_view.js"></script>
  <script src="../js/_via_data.js"></script>
  <script src="../js/_via_video_thumbnail.js"></script>
  <script src="../js/_via_file_annotator.js"></script>
  <script src="../js/_via_temporal_segmenter.js"></script>
  <script src="../js/_via_view_annotator.js"></script>
  <script src="../js/_via_view_manager.js"></script>
  <script src="../js/_via_editor.js"></script>
  <script src="../js/_via_debug_project.js"></script>
  <script src="../js/_via.js"></script>

  <script>
    var via_container = document.getElementById('via_container');
    var via = new _via(via_container);
  </script>
</body>
</html>+
```
The HTML and CSS portions of the above code defines the user interface, its
components (e.g. icons, div elements, etc) and style of these components. These 
portions are described in Section [VIA3 HTML and CSS](via3-html-and-css).

The lines starting with `<script src=... </script>` load the different Javscript
modules of VIA3 that are defined in the [src/js](via-3.x.y/src/js) folder. These
Javascript modules power the VIA3 application and are described in Section 
[VIA3 Core Modules](via3-core-modules).

VIA3 Core Modules
-----------------
The main entry point of Javascript modules is defined in module [_via.js](via-3.x.y/src/js/_via.js)
which initialises and manages all the other modules of VIA3. The first task of 
this module is to initialise an instance of [_via_data.js](via-3.x.y/src/js/_via_data.js)
module as shown below (adapted for illustration purpose):
```
var data  = new _via_data();
```

> "Bad programmers worry about the code. Good programmers worry about
> data structures and their relationships."
> [Linus Torvalds](https://lwn.net/Articles/193245/)

This instance of [_via_data.js](via-3.x.y/src/js/_via_data.js) module defines and 
manages the core data of the VIA3 application. All the other modules in VIA3 are 
designed to show or update this data based on
user interactions with the VIA3 application. For example, when a user adds a new
video file by selecting a local file, VIA3 updates the `data` using an instance
of [_via_file.js](via-3.x.y/src/js/_via_file.js) module as follows:
```
var file_id = '1';
var file = new _via_file(file_id,
                         'Alioli.ogv',
                         _VIA_FILE_TYPE.VIDEO,
                         _VIA_FILE_TYPE.URIHTTP,
                         'https://upload.wikimedia.org/wikipedia/commons/4/47/Alioli.ogv'
                        );
data.store['file'][file_id] = file;
```

Most manual annotation projects require annotation of a single file (i.e. image,
video or audio). However, there are some use cases which requires the human annotators to
annotate a pair of images. For example, a computer vision researcher working to
understand how humans quantify the quality of images will create a manual 
annotation project in which human annotators are shown a pair of images and are 
required to decide which of the two images has better quality. To address such 
use cases, VIA3 uses a concept of View which can contain any number of files.
For annotation of a single file, each view will contain a single file while for
annotation of a pair of files, each view will contain two files. Views are 
defined using the [_via_view.js](via-3.x.y/src/js/_via_view.js) module as 
follows:
```
var view_id = '1';
var file_id_list = ['1']; // a view containing a single file with file_id = '1'
var view = new _via_view(file_id_list);
data.store['view'][view_id] = view;
```

The sequential ordering of each view is defined by `data.store['vid_list']`. For 
example, if we want the user to first see view id `1`, then `3` and finally view
id `2`, we can defined `vid_list` as follows
```
data.store['vid_list'] = ['1', '3', '2'];
```

VIA3 allows human annotators to define and describe spatial regions
associated with an image or still frame from a video and temporal
segments associated with audio or video. Spatial regions are defined
using standard region shapes such as rectangle, circle, ellipse,
point, polygon, polyline, freehand drawn mask, etc.\ while the temporal
segments are defined by delineating start and end timestamps
(e.g.\ video segment from 3.1 sec. to 9.2 sec.).
Such spatial regions and temporal segments are described using textual
metadata. The module [_via_metadata.js](via-3.x.y/src/js/_via_metadata.js),
shown below, defines the data structure to hold all these variations of metadata:
```
const _VIA_RSHAPE  = { 'POINT':1, 'RECTANGLE':2, 'CIRCLE':3, 'ELLIPSE':4, 'LINE':5, 'POLYLINE':6, 'POLYGON':7, 'EXTREME_RECTANGLE': 8, 'EXTREME_CIRCLE':9 };
const _VIA_METADATA_FLAG = { 'RESERVED_FOR_FUTURE':1 };

function _via_metadata(vid, z, xy, av) {
  this.vid = vid;   // view id (each view contains one of more files)
  this.flg = 0;     // flags reserved for future
  this.z   = z;     // [t0, ..., tn] (temporal coordinate e.g. time or frame index)
  this.xy  = xy;    // [shape_id, shape_coordinates, ...] (i.e. spatial coordinate)
  this.av  = av;    // attribute-value pair e.g. {attribute_id : attribute_value, ...}
}
```
Each metadata is associated with a view and this information is stored in `this.vid`.
The variable `this.z` is an array and stores the temporal coordinates associated 
with a metadata. For example, `this.z = [7.2,11.6]` defines a temporal segment 
from 7.2 sec to 11.6 sec. The spatial coordinates are stored in `this.xy`. For 
example, a rectangular bounding box of size (40,50) located at (10,20)
in an image is denoted by `this.xy = [_VIA_RSHAPE.RECT, 10, 20, 40, 50]`. The
`z` and `xy` variables store the location information about a metadata while
`this.av` stores the textual metadata defined by the user as a (key,value) pair.
For example, if a user defines a rectangular bounding box in a video frame at
time 8.3 sec as containing a white cat, then the metadata is stored as follows:

```
var metadata_id = '1_mR8ks-Aa'; // a unique metadata id
var metadata = new _via_metadata('1',
                                 0,
                                 [7.2, 11.6],
                                 [2, 10, 20, 40, 50],
                                 {
                                   'object':'cat',
                                   'colour':'white',
                                 }
                                );
data.store['metadata'][metadata_id] = metadata;
```

The attributes (e.g. `object` and `colour` in the above example) are defined
using the [_via_attribute.js](via-3.x.y/src/js/_via_attribute.js) module:
```
var attribute_id = '1'
var attribute = new _via_attribute('object',
                                   'FILE1_Z1_XY1',
                                   _VIA_ATTRIBUTE_TYPE.TEXT,
                                   'Name of Object');
data.store['attribute'][attribute_id] = attribute;
```
The `anchor_id` of `FILE1_Z1_XY1` indicates that this attribute will be defined
for a spatial region in a video frame. There are many more anchor types defined 
in [_via_attribute.js](via-3.x.y/src/js/_via_attribute.js) module. By default, 
each attribute is visible as a text box to human annotators. To reduce the 
cognitive load of human annotators, the attribute can be a dropdown, radio or
checkbox. The definition and update of attributes is managed by the [_via_editor.js](via-3.x.y/src/js/_via_editor.js) module.


There are a large number of Javascript modules that work together to power the 
VIA3 application. The dependency of these modules is shown in figure below. For
example, [_via_data.js](via-3.x.y/src/js/_via_data.js) initialises object 
instances of only [_via_file.js](via-3.x.y/src/js/_via_file.js), [_via_metadata.js](via-3.x.y/src/js/_via_metadata.js),
[_via_attribute.js](via-3.x.y/src/js/_via_attribute.js) and [_via_view.js](via-3.x.y/src/js/_via_view.js).
Therefore, [_via_data.js](via-3.x.y/src/js/_via_data.js) does not know about 
existence of any other modules. The aim of VIA3 developers is to reduce the
amount of dependence between modules in order to simplify the VIA3 codebase.
We are always working to reduce the dependence between different modules.

![VIA3 Dependency Map for Javascript Modules](via-3.x.y/doc/via_modules_dependency_map.png)

VIA3 HTML and CSS
-----------------
VIA3 uses [CSS grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout) 
to position different components of its user interface as shown in figure below.

![VIA3 User Interface Components Layout](via-3.x.y/doc/ui_layout.png)

The `#via_control_panel_container` is an HTML `<div>` element which is 
dynamically populated by the [_via_file_annotator.js](via-3.x.y/src/js/_via_file_annotator.js) module.
A list of all views (or, files for single image annotation) is maintained inside `#via_control_panel_container`
and is dynamically populated by [_via_view_manager.js](via-3.x.y/src/js/_via_view_manager.js) module.

The `.view_content_container` shows all the files that are a part of a given view.
For example, a single image annotation application will only containe 1 `file_container` 
to show the single image while an annotation project for image pairs 
will contain two `file_container` placed side-by-side. Each `file_container` is
an HTML `<div>` element and is dynamically populated by [_via_file_annotator.js](via-3.x.y/src/js/_via_file_annotator.js)
module.

The `.temporal_segmenter_container` is active only for views containing audio 
or video files and is maintained and dynamically populated by [_via_file_annotator.js](via-3.x.y/src/js/_via_file_annotator.js)
function. The [_via_video_thumbnail.js](via-3.x.y/src/js/_via_video_thumbnail.js)
function loads a video and dynamically creates a thumbnail of video frame when
the user placed the mouse cursor at a point in the video timeline.

To understand the HTML and CSS portions of the above file, follow this 
[excellent tutorial](https://developer.mozilla.org/en-US/docs/Web/HTML) developed 
by Mozilla.


Packing VIA as a Single HTML File
---------------------------------
All the Javascript modules, CSS style files, HTML code can be packed into a 
single self contained and standalone HTML file as follows:
```
cd via-3.x.y/scripts
python3 pack_via.py video_annotator
python3 pack_via.py audio_annotator

python3 pack_demo.py video_annotator
python3 pack_demo.py audio_annotator
```
The final packaged application files (e.g. via_video_annotator) is placed in 
[via-3.x.y/dist](via-3.x.y/dist) folder and are made available to users.

Structure of VIA Project JSON File
----------------------------------
A VIA project is simply a JSON file containing all the details associated with 
the project. Here is an annotated example of a project JSON file.
```
{
  "project": {                       # ["project"] contains all metadata associated with this VIA project
    "pid": "__VIA_PROJECT_ID__",     # uniquely identifies a shared project (DO NOT CHANGE)
    "rev": "__VIA_PROJECT_REV_ID__", # project version number starting form 1 (DO NOT CHANGE)
    "rev_timestamp": "__VIA_PROJECT_REV_TIMESTAMP__", # commit timestamp for last revision (DO NOT CHANGE)
    "pname": "VIA3 Sample Project",  # Descriptive name of VIA project (shown in top left corner of VIA application)
    "creator": "VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)",
    "created": 1588343615019,        # timestamp recording the creation date/time of this project (not important)
    "vid_list": ["1", "2"]           # selects the views that are visible to the user for manual annotation (see ["view"])
  },
  "config": {           # Configurations and user settings (used to modify behaviour and apperance of VIA application)
    "file": {
      "loc_prefix": {   # a prefix automatically appended to each file 'src' attribute. Leave it blank if you don't understand it. See https://gitlab.com/vgg/via/-/blob/master/via-3.x.y/src/js/_via_file.js
        "1": "",        # appended to files added using browser's file selector (NOT USED YET)
        "2": "",        # appended to remote files (e.g. http://images.google.com/...)
        "3": "",        # appended to local files  (e.g. /home/tlm/data/videos)
        "4": ""         # appended to files added as inline (NOT USED YET)
      }
    },
    "ui": {
      "file_content_align": "center",
      "file_metadata_editor_visible": true,
      "spatial_metadata_editor_visible": true,
      "spatial_region_label_attribute_id": ""
    }
  },
  "attribute": {       # defines the things that a human annotator will describe and define for images, audio and video.
    "1": {                          # attribute-id (unique)
      "aname":"Activity",           # attribute name (shown to the user)
      "anchor_id":"FILE1_Z2_XY0",   # FILE1_Z2_XY0 denotes that this attribute define a temporal segment of a video file. See https://gitlab.com/vgg/via/-/blob/master/via-3.x.y/src/js/_via_attribute.js
      "type":4,                     # attributes's user input type ('TEXT':1, 'CHECKBOX':2, 'RADIO':3, 'SELECT':4, 'IMAGE':5 )
      "desc":"Activity",            # (NOT USED YET)
      "options":{"1":"Break Egg", "2":"Pour Liquid", "3":"Cut Garlic", "4":"Mix"}, # defines KEY:VALUE pairs and VALUE is shown as options of dropdown menu or radio button list
      "default_option_id":""
    },
    "2": {
      "aname":"Object",
      "anchor_id":"FILE1_Z1_XY1",   # FILE1_Z1_XY1 denotes attribute of a spatial region (e.g. rectangular region) in a video frame. See https://gitlab.com/vgg/via/-/blob/master/via-3.x.y/src/js/_via_attribute.js
      "type":1,                     # an attribute with text input
      "desc":"Name of Object",
      "options":{},                 # no options required as it has a text input
      "default_option_id":""
    }
  },
  "file": {                         # define the files (image, audio, video) used in this project
    "1":{                           # unique file identifier
      "fid":1,                      # unique file identifier (same as above)
      "fname":"Alioli.ogv",         # file name (shown to the user, no other use)
      "type":4,                     # file type { IMAGE:2, VIDEO:4, AUDIO:8 }
      "loc":2,                      # file location { LOCAL:1, URIHTTP:2, URIFILE:3, INLINE:4 }
      "src":"https://upload.wikimedia.org/wikipedia/commons/4/47/Alioli.ogv" # file content is fetched from this location (VERY IMPORTANT)
    },
    "2":{
      "fid":2,
      "fname":"mouse.mp4",
      "type":4,
      "loc":3,                      # a file residing in local disk (i.e. file system)
      "src":"/home/tlm/data/svt/mouse.mp4"
    }
  },
  "view": {           # defines views, users see the "view" and not file, each view contains a set of files that is shown to the user
    "1": {            # unique view identifier
      "fid_list":[1]  # this view shows a single file with file-id of 1 (which is the Alioli.ogv video file)
    },
    "2": {
      "fid_list":[2]  # this view also shows a single video file (but a view can contain more than 1 files)
    }
  },
  "metadata": {       # a set of all metadata define using the VIA application
    "-glfwaaX": {     # a unique metadata identifier
      "vid": "1",     # view to which this metadata is attached to
      "flg": 0,       # NOT USED YET
      "z": [2, 6.5],  # z defines temporal location in audio or video, here it records a temporal segment from 2 sec. to 6.5 sec.
      "xy": [],       # xy defines spatial location (e.g. bounding box), here it is empty
      "av": {         # defines the value of each attribute for this (z, xy) combination
        "1":"1"       # the value for attribute-id="1" is one of its option with id "1" (i.e. Activity = Break Egg)
      }
    },
    "+mHHT-tg": {
      "vid": "1",
      "flg": 0,
      "z": [9, 20],
      "xy": [],
      "av": {
        "1":"2"      # the value for attribute-id="1" is one of its option with id "2" (i.e. Activity = Pour Liquid)
      }
    },
    "ed+wsOZZ": {
      "vid": "1",
      "flg": 0,
      "z": [24, 26],
      "xy": [],
      "av": {
        "1":"2"
      }
    },
    "fH-oMre1": {
      "vid": "1",
      "flg": 0,
      "z": [0.917],                # defines the video frame at 0.917 sec.
      "xy": [2, 263, 184, 17, 13], # defines a rectangular region at (263,184) of size (17,13). The first number "2" denotes a rectangular region. Other possible region shapes are: { 'POINT':1, 'RECTANGLE':2, 'CIRCLE':3, 'ELLIPSE':4, 'LINE':5, 'POLYLINE':6, 'POLYGON':7, 'EXTREME_RECTANGLE': 8, 'EXTREME_CIRCLE':9 }
      "av": {
        "2":"Egg"                  # the value of attribute-id "2" is "Egg" (i.e. Object = Egg)
      }
    }
  }
}

```
