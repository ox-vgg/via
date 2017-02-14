Code Documentation for VGG Image Annotator 1.0
==============================================

Author: [Abhishek Dutta](mailto:adutta_REMOVE_@robots.ox.ac.uk)

VGG Image Annotator (VIA) application is contained in a single html file
with definitions of CSS style and Javascript code blocks.

The VIA application code [`via.html`](https://gitlab.com/vgg/via/blob/develop/via.html) 
has the following structure:

```html
<!DOCTYPE html> 
<html lang="en"> 
<head> 
  [source code license declaration] 
  [html meta tags definition] 
  [css definition] 
</head> 
<body onload="_via_init()" onresize="_via_update_ui_components()" > 
  [html content definition] 
  [javascript definition] 
</body> 
</html>
```

The `_via_init()` function is the main entry point to the javascript
code. When the browser window is resized, we have to recompute the image
canvas dimensions. Therefore, the function `_via_update_ui_components()`
is tied to `onresize` event which is fired when browser window is
resized.

Nearly 3000 lines of javascript source code is required to support all
the functionalities provided by the VIA image annotator. A majority of
this javascript is needed to support an interactive user interface. Only
a small portion of this javascript code is needed to support the
drawing, selection, resizing, deletion, etc. of image regions of varying
shapes -- rectangle, circle, ellipse and polygon.

Now we describe how some of the core actions (like loading images,
drawing regions, etc) are facilitated by the javascript codebase.

## Table of Contents
 * [Core Data Structures](#core-data-structures)
 * [Loading Images](#loading-images)
 * [Displaying Image](#displaying-image)
 * [Moving to Next/Previous Images](#moving-to-nextprevious-images)
 * [Capturing User's Mouse Interactions](#capturing-users-mouse-interactions)
 * [Rendering Regions](#rendering-regions)
 * [Moving and Resizing Regions](#moving-and-resizing-regions)
 * [Updating Attribute Value](#updating-attribute-value)
 * [Adding New Attributes](#adding-new-attributes)
 * [Download Annotations](#download-annotations)
 * [Importing Annotations](#importing-annotations)
 * [Building Applications using VIA as a Module](#building-applications-using-via-as-a-module)
 * [Source Code License](#source-code-license)


Core Data Structures
--------------------

> "Bad programmers worry about the code. Good programmers worry about
> data structures and their relationships."
> [Linus Torvalds](https://lwn.net/Articles/193245/)

The function `_via_get_image_id()` generates a unique `image_id` for
each image by combining the image filename and image size in bytes. For
example, the file `photo.jpg` of size `16454` bytes will
get assigned an image-id `photo.jpg16454`.

The annotation data corresponding to each image is stored in the object
`_via_img_metadata` indexed by its unqiue `image_id`. Each such entry in
`_via_img_metadata` is another object of type `ImageMetadata()` having
the following properties:

 * `fileref` : a reference to the local file uploaded by user
 * `base64_img_data` : contains either the image URL or image data represented 
in base64 format
 * `file_attributes` : a [Map()](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Map) 
of image file's attributes. For example, image captions can be represented by 
file attributes as 

```
Map { 'caption': 'a white football flying over a red car' }
```

 * `regions` : an array of `ImageRegion()` objects   

Each image can have multiple regions of varying shape and attributes.
Therefore, each array entry in `ImageMetadata.regions[]` contains an object of
type `ImageRegion()` with the following properties corresponding to each 
region (rectangular, circular, polygon, etc) defined in the image:

 * `shape_attributes` : a [Map()](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Map) 
of attributes defining the shape of the region. For example, a rectangular 
region has the following shape attributes 

```
Map {'name': 'rect', 'x': '115', 'y': '210', 'width': '100', 'height': '200' }
```

 * `region_attributes` : a [Map()](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Map) 
of attributes corresponding to the region. For example, an image region 
containing a red car can have the following attributes

```
Map { 'object\_name': 'car', 'object\_color': 'red' }
```

 * `is_user_selected` : a state variable indicating if this region has been 
selected by the user

Here is an example of how VIA would store file attribute and two region
annotations for a file `photo.jpg` in `_via_img_metadata` object:

```javascript
var img_id = _via_get_image_id('photo.jpg', 16454);
var _via_img_metadata = {};
_via_img_metadata[img_id] = new ImageMetadata('', 'photo.jpg', 16454);

_via_img_metadata[img_id].file_attributes.set('caption', 'a white football flying over a red car');

_via_img_metadata[img_id].regions[0] = new ImageRegion();
_via_img_metadata[img_id].regions[0].shape_attributes.set('name', 'rect');
_via_img_metadata[img_id].regions[0].shape_attributes.set('x', '115');
_via_img_metadata[img_id].regions[0].shape_attributes.set('y', '210');
_via_img_metadata[img_id].regions[0].shape_attributes.set('width', '100');
_via_img_metadata[img_id].regions[0].shape_attributes.set('height', '200');
_via_img_metadata[img_id].regions[0].region_attributes.set('object_name', 'car');
_via_img_metadata[img_id].regions[0].region_attributes.set('object_color', 'red');

_via_img_metadata[img_id].regions[1] = new ImageRegion();
_via_img_metadata[img_id].regions[1].shape_attributes.set('name', 'circle');
_via_img_metadata[img_id].regions[1].shape_attributes.set('cx', '50');
_via_img_metadata[img_id].regions[1].shape_attributes.set('cy', '90');
_via_img_metadata[img_id].regions[1].shape_attributes.set('r', '20');
_via_img_metadata[img_id].regions[1].region_attributes.set('object_name', 'football');
_via_img_metadata[img_id].regions[1].region_attributes.set('object_color', 'white');
```

For the current image, we keep a copy of all region's coordinates in the
canvas space inside the object `_via_canvas_regions`. Recall that the
canvas space is related to the original image space by
`_via_canvas_scale` (which is a scaling factor determined by the current
browser window size and zoom level). In other words, 
```
x_image_space = x_canvas_space * _via_canvas_scale.
```
Maintaining such a data structure avoids unnecessary re-computation of region 
coordinates in canvas space. Therefore, you will notice that
`_via_canvas_regions[i].shape_attributes` is used when rendering region
boundaries.

VIA uses the [canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) 
to render image, region boundaries and region labels. The image currently
being displayed is rendered by `_via_img_canvas` while the region
boundaries and region labels are rendered by the canvas
`_via_reg_canvas`. These two canvas are overlaid with `_via_reg_canvas`
being on the top.

The [Set()](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Set)
of image region attributes is stored in the variable `_via_region_attributes`. 
These attributes form the keys of the map
`_via_img_metadata[img_id].regions[i].region_attributes`.

A set of variables are used to maintain the state of the VIA application. These 
state variable form a crucial component of user interactions. For 
example, `_via_is_user_drawing_region` is `true` when the user is drawing a region.

Loading Images
--------------

Loading (or adding) an image into VIA is initiated by
`sel_local_images()`. Therefore, this function is attached to the
`onclick` event of the menu entry **Load or Add Images**. The
function `sel_local_images()` invokes [local file
selector](https://developer.mozilla.org/en/docs/Using_files_from_web_applications)
called `invisible_file_input` which is configured to triggers the
function `store_local_img_ref()` when the user finishes selecting local
files. The function `store_local_img_ref()` performs the following
tasks:

1. Computes the `img_id` using the function `_via_get_image_id()`.
2. Inserts an object of type `ImageMetadata()` in
   `_via_img_metadata[img_id]`. The `_via_img_metadata[img_id].fileref`
   property of this object containts a reference to the local file
   selected by the user.
3. Triggers `show_image()` (further discussed in [Displaying
    Image](#displaying-image) section) to display the newly loaded image.

Displaying Image
----------------

The VIA application displays one of the pre-loaded images using
`show_image()`. This function uses
[FileReader()](https://developer.mozilla.org/en/docs/Web/API/FileReader)
to load a local image using the file reference stored in
`_via_img_metadata[img_id].fileref` (see [Loading
Images](#loading_images) section).

When image loading is complete, the image is scaled by
`_via_canvas_scale` to fit the canvas display area in browser window. A
reference to current
[Image()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/Image)
is stored in `_via_current_image`. The 2D drawing context of the canvas
`_via_image_canvas` is stored in `_via_img_ctx`. Rendering of the
`_via_current_image` is handled by `drawImage()` method of this 2D
context.

The `base64_img_data` property of object `ImageMetadata()` can store:
(a) raw image data represented in [base64](https://www.base64-image.de/)
format, (b) URL of the image. The `base64_img_data` property is used
when the images to be annotated are hosted in a publicly accessible
server or the image data is embedded in the VIA application code. If
`_via_img_metadata[img_id].base64_img_data` is available, the image is
loaded from this resource, otherwise the image is loaded from
`_via_img_metadata[img_id].fileref`.

Moving to Next/Previous Images
------------------------------

The methods `move_to_next_image()` and `move_to_prev_image()` handle the
user requests to switch display to next or previous image. This boils
down to invoking `show_image()` (see [Displaying Image](#displaying-image)
section) with appropriate `image_index`.

Capturing User's Mouse Interactions
-----------------------------------

The following event listeners attached to `via_reg_canvas` handles user
interactions using a mouse:

 * `_via_reg_canvas.addEventListener('dblclick', function(e) { ... }` :   A 
double click on an image region displays the region attribute panel at the 
bottom to allow the user to add or update region attribute values.

 * `_via_reg_canvas.addEventListener('mousedown', function(e) { ... }` : Handles 
user interactions involving the following mouse gesture: mouse cursor is dragged 
while pressing the mouse button. This corresponds to actions such as drawing a 
region boundary (except polygon), resizing or moving regions. Furthermore, a 
`mousedown` may also indicate a prelude to other events like a region 
select/unselect.

 * `_via_reg_canvas.addEventListener('mouseup', function(e) { ... }` :
   - The `mouseup` event may indicate that the user has finished 
drawing a region, moving a region, resizing a region, etc.
   - A combination of `mousedown` and `mouseup` events within a small region 
indicates a single mouse click which indicates the user's intention to 
select/unselect a region, define a vertex of polygon, or define a point.

 * `_via_reg_canvas.addEventListener('mouseover, function(e) { ... }` : Forces 
re-rendering of region boundaries and labels.

 * `_via_reg_canvas.addEventListener('mousemove', function(e) { ... }` :
   - When user is drawing, moving or resizing a region, a `mousemove` event 
renders the region at new positions as the mouse cursor moves to give 
interactive feedback to the user.
   - When mouse cursor is moved over the region edge, this methods changes the 
mouse cursor style to indicate region resize mode.
   - In the polygon region shape mode, this function draws a temporary edge 
from last defined polygon vertex to current user position.

Each region draw, resize, move or select/unselect triggers re-rendering
of region boundaries and labels using `_via_redraw_reg_canvas()` (see
[Rendering Regions](#rendering-regions) section).

Rendering Regions
-----------------

`_via_redraw_img_canvas()` renders images onto the canvas
`_via_img_canvas` using [drawImage()](https://developer.mozilla.org/en/docs/Web/API/CanvasRenderingContext2D/drawImage). 
Image is re-rendered only when the user zoom's in/out.

Rendering of region boundaries is performed by `_via_redraw_reg_canvas`.
For example, rectangular and circular regions are drawn using the 2D
context `_via_reg_ctx` as follows:

```javascript
function _via_draw_rect(x, y, w, h) {
    _via_reg_ctx.beginPath();
    _via_reg_ctx.moveTo(x  , y);
    _via_reg_ctx.lineTo(x+w, y);
    _via_reg_ctx.lineTo(x+w, y+h);
    _via_reg_ctx.lineTo(x  , y+h);
    _via_reg_ctx.closePath();
}

function _via_draw_circle(cx, cy, r) {
    _via_reg_ctx.beginPath();
    _via_reg_ctx.arc(cx, cy, r, 0, 2*Math.PI, false);
    _via_reg_ctx.closePath();
}
```

Moving and Resizing Regions
---------------------------

A region has to be selected before it can be moved or resized. A single
click inside a region sets the state variable
`_via_is_region_selected = true;` as follows:

```javascript
_via_reg_canvas.addEventListener('mousedown', function(e) {
    _via_click_x0 = e.offsetX; _via_click_y0 = e.offsetY;
    ...
}
_via_reg_canvas.addEventListener('mouseup', function(e) {
    _via_click_x1 = e.offsetX; _via_click_y1 = e.offsetY;

    var click_dx = Math.abs(_via_click_x1 - _via_click_x0);
    var click_dy = Math.abs(_via_click_y1 - _via_click_y0);
    ...

    // denotes a single click (= mouse down + mouse up)
    if ( click_dx &lt; VIA_MOUSE_CLICK_TOL ||
         click_dy &lt; VIA_MOUSE_CLICK_TOL ) {
	...
        var region_id = is_inside_region(_via_click_x0, _via_click_y0);
        if ( region_id >= 0 ) {
            // first click selects region
            _via_user_sel_region_id = region_id;
            _via_is_region_selected = true;
           ...
        }
    }
}
```

Recall that a click event is detected by checking if the mouse cursor
position during the `mousedown` and `mouseup` events are
close to each other. Furthermore, the function `is_inside_region()`
checks if the mouse cursor position is inside a pre-defined region.

Once a region has been selected, it can be moved around by clicking the
mouse button, dragging the cursor around and finally releasing the mouse
click when desired new location is reached. This mouse gesture is
captured by `mousedown`, `mousemove` and `mouseup` events. First, the 
`mousedown` event sets the state variable `_via_is_user_moving_region = true;` 
as follows:

```javascript
_via_reg_canvas.addEventListener('mousedown', function(e) {
    _via_click_x0 = e.offsetX; _via_click_y0 = e.offsetY;
    _via_region_edge = is_on_region_corner(_via_click_x0, _via_click_y0);
    var region_id = is_inside_region(_via_click_x0, _via_click_y0);

    if ( _via_is_region_selected ) {
        // check if user clicked on the region boundary
        if ( _via_region_edge[1] > 0 ) {
            ...
        } else {
            var yes = is_inside_this_region(_via_click_x0,
                                            _via_click_y0,
                                            _via_user_sel_region_id);
            if (yes) {
                if( !_via_is_user_moving_region ) {     
                    _via_is_user_moving_region = true;
                    _via_region_click_x = _via_click_x0;
                    _via_region_click_y = _via_click_y0;
                }
            }
            ...
    }
}
```

Next, the `mousemove` event draws intermediate regions -- to aid
with visualization -- as the user moves the mouse cursor towards the
final destination as shown by the code snippet below:

```javascript
_via_reg_canvas.addEventListener('mousemove', function(e) {
    _via_current_x = e.offsetX; _via_current_y = e.offsetY;
    ...

    if ( _via_is_user_moving_region ) {
        _via_redraw_reg_canvas();
        
        var move_x = (_via_current_x - _via_region_click_x);
        var move_y = (_via_current_y - _via_region_click_y);
        var attr = _via_canvas_regions[_via_user_sel_region_id].shape_attributes;

        switch (attr.get('name')) {
        case VIA_REGION_SHAPE.RECT:
            _via_draw_rect_region(attr.get('x') + move_x,
                                  attr.get('y') + move_y,
                                  attr.get('width'),
                                  attr.get('height'),
                                  true);
            break;

        case VIA_REGION_SHAPE.CIRCLE:
            ...
        case VIA_REGION_SHAPE.POLYGON:
            ...

        case VIA_REGION_SHAPE.POINT:
            ...
        }
        _via_reg_canvas.focus();    
    }
    ...
}
```

Finally, the `mouseup` event moves the selected region to a new
location as follows:

```javascript
_via_reg_canvas.addEventListener('mouseup', function(e) {
    _via_click_x1 = e.offsetX; _via_click_y1 = e.offsetY;

    var click_dx = Math.abs(_via_click_x1 - _via_click_x0);
    var click_dy = Math.abs(_via_click_y1 - _via_click_y0);

    // indicates that user has finished moving a region
    if ( _via_is_user_moving_region ) {
        _via_is_user_moving_region = false;
        _via_reg_canvas.style.cursor = 'default';

        var move_x = Math.round(_via_click_x1 - _via_region_click_x);
        var move_y = Math.round(_via_click_y1 - _via_region_click_y);

        if (Math.abs(move_x) > VIA_MOUSE_CLICK_TOL ||
            Math.abs(move_y) > VIA_MOUSE_CLICK_TOL) {

            var image_attr = _via_img_metadata[_via_image_id].regions[_via_user_sel_region_id].shape_attributes;
            var canvas_attr = _via_canvas_regions[_via_user_sel_region_id].shape_attributes;

            switch( canvas_attr.get('name') ) {
            case VIA_REGION_SHAPE.RECT:
                var xnew = image_attr.get('x') + Math.round(move_x * _via_canvas_scale);
                var ynew = image_attr.get('y') + Math.round(move_y * _via_canvas_scale);
                image_attr.set('x', xnew);
                image_attr.set('y', ynew);

                var canvas_xnew = canvas_attr.get('x') + move_x;
                var canvas_ynew = canvas_attr.get('y') + move_y;
                canvas_attr.set('x', canvas_xnew);
                canvas_attr.set('y', canvas_ynew);
                break;
            case VIA_REGION_SHAPE.CIRCLE:
            case VIA_REGION_SHAPE.ELLIPSE:
            case VIA_REGION_SHAPE.POINT:
                ...
            case VIA_REGION_SHAPE.POLYGON:
                ...
            }
        } else {
            // indicates a user click on an already selected region
            // this could indicate a user's intention to select another
            // nested region within this region
            ...
        }
        _via_redraw_reg_canvas();
        ...
        return;
    }
    ...
}
```

Some notes:

-   `_via_canvas_regions` contains the region coordinates in the canvas
    space and therefore needs scaling by `_via_canvas_scale` to convert
    it to the original image space coordinates stored in
    `_via_img_metadata` (see [Core Data
    Structures](#core_data_structures) section).
-   Moving circular, elliptical and point regions is conceptually
    similar -- move their center coordinates -- and hence are handled by
    a single code.
-   The same user mouse interactions occur for nested regions -- one
    smaller region placed inside a larger region. Therefore, before
    moving regions, we check if the movement of user cursor is beyond
    certain tolerance. If it is below that level, we consider this as a
    gesture to select other nested region.

Updating Attribute Value
------------------------

The update of region attributes is triggered by the function
`toggle_reg_attr_panel()` toggles the region attribute panel in the
bottom of the browser window. The spreashsheet like input environment
for each region (along the rows) and each attribute (along the columns)
is generated by `update_region_attributes_input_panel()`. In a similar
way, the update of file attributes are handled by
`toggle_file_attr_panel()` and `update_file_attributes_input_panel()`.

The spreadsheet like editing environment is setup and handled by the
function `init_spreadsheet_input()`.

Adding New Attributes
---------------------

This is handled by the function `add_new_attribute()`.

Download Annotations
--------------------

This action is initiated by the function `download_all_region_data()`.
The conversion from `_via_img_metadata` object to a user requested
format ([CSV](https://en.wikipedia.org/wiki/Comma-separated_values) or
[JSON](https://en.wikipedia.org/wiki/JSON)) is done by the function
`pack_via_metadata()` while the function `save_data_to_local_file()`
triggers the browser action to download this file to local disk.

By default, the CSV export uses comma "," as the separating character.

Importing Annotations
---------------------

Importing existing annotation data (in CSV or JSON format) to VIA
application is initiated by the function `sel_local_data_file()` which
allows the user to select a local file. Once a local file has been
selected, the function `import_annotations_from_file()` is triggered to
import annotation and insert the valid ones into the `_via_img_metadata`
object.

Note: the CSV file containing annotation data should have comma "," as the 
separating character.

Building Applications using VIA as a Module
-------------------------------------------
At the end of application initialization, VIA application invokes the function 
`_via_load_submodules()` if it is defined in the Javascript global namespace. 
This behaviour can be used to build a lot of interesting tools that rely on VIA 
for the core functionality of image annotation. See the following for examples:
 * [via_demo.js](via_demo.js) : VIA application packaged together with some 
images and their annotations for demonstration of VIA features.
 * [DMIAT](https://gitlab.com/vgg/via/tree/dmiat/) : Distributed Manual Image 
Annotation Tool (DMIAT) is built on top of VIA and isolates the image annotators 
from the technical details of loading images and saving/sending annotations. 
   * images to be annotated are predefined in the form of http-image-url
   * the annotations are automatically pushed to git repository

Source Code License
-------------------

VIA is an open source project actively maintained by the [Visual
Geometry Group (VGG)](http://www.robots.ox.ac.uk/~vgg/). Its source code
is a distributed under the [BSD-2 clause
license](https://en.wikipedia.org/wiki/BSD_licenses#2-clause_license_.28.22Simplified_BSD_License.22_or_.22FreeBSD_License.22.29).

```
Copyright (c) 2016-2017, Abhishek Dutta. 
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met: 

Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

Last Updated: Jan. 2017

