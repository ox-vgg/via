# Code Documentation for VIA Version 3.x.y
The full VIA software application fits in a single HTML file of size less than 
300 Kilobyte containing nearly 8000 lines of carefully amalgamated HTML, CSS 
and Javascript code. This single HTML file can run as an offline application 
in most modern web browsers to provide the functionality of a fully featured 
manual annotation software application for image, audio and video. In this 
report we explain different aspects of the software code powering the VIA 
software with the aim of nurturing future code contributors to this open source 
project.

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

## Core Data Structure : _via_data.js
> "Bad programmers worry about the code. Good programmers worry about
> data structures and their relationships."
> [Linus Torvalds](https://lwn.net/Articles/193245/)

## Packing VIA as a Single HTML File
All the Javascript modules, CSS style files, HTML code can be packed into a 
single self contained and standalone HTML file as follows:
```
cd scripts
python3 pack_via.py video_annotator
python3 pack_via.py audio_annotator

python3 pack_demo.py video_annotator
python3 pack_demo.py audio_annotator
```

```
Author: Abhishek Dutta
Version: 16 May 2019
```
