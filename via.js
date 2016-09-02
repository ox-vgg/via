/*
 * VGG Image Annotator (via)
 *
 * Copyright (C) 2016, Abhishek Dutta <adutta@robots.ox.ac.uk>
 * Aug. 31, 2016
 */

var VIA_VERSION = "0.1";
var image_canvas;
var image_context;

var image_panel_width;
var image_panel_height;
var canvas_width;
var canvas_height;
var scale_factor_width = 0;
var scale_factor_height = 0;

var local_file_selector;
var image;
var image_original_filename;

var annotation_ongoing = false;
var annotation_completed = false;
var click_x = 0; var click_y = 0; // coordinate of user first click

var annotation_bbox_count = 0;
var x0 = []; var y0 = []; // bounding box: top-left corner
var x1 = []; var y1 = []; // bounding box: bottom-right corner

var json_download_link = document.getElementById("link_download_annotation");
var status_bar = document.getElementById("status_bar");

// initialize the canvas on which image annotation takes place
image_canvas = document.getElementById("image_canvas");
image_context = image_canvas.getContext("2d");

// Let users download the annotations as a CSV file
json_download_link.addEventListener('click', function(e) {
    if (annotation_bbox_count>0) {
	x0_json = JSON.stringify(x0);
	y0_json = JSON.stringify(y0);
	x1_json = JSON.stringify(x1);
	y1_json = JSON.stringify(y1);
	bbox_json = {"filename":image_original_filename,
		     "x0":x0,
		     "y0":y0,
		     "x1":x1,
		     "y1":y1};
	var json_file = new Blob([JSON.stringify(bbox_json)], {type : 'text/json'});
	json_download_link.href = URL.createObjectURL(json_file);
	json_download_link.name = "annotations.json";
	json_download_link.target = "_new";
    } else {
	json_download_link.href="javascript:void(0)";
    }
});
				   
// A click on canvas indicates annotation of an object in image
image_canvas.addEventListener('mousedown', function(e) {
    annotation_ongoing = true;
    click_x = e.offsetX; click_y = e.offsetY;
});

// A click on canvas indicates annotation of an object in image
image_canvas.addEventListener('mouseup', function(e) {
    // store bbox coordinates
    x0.push(click_x); y0.push(click_y);
    x1.push(e.offsetX); y1.push(e.offsetY);
    annotation_bbox_count = annotation_bbox_count + 1;

    status("Saved [" + annotation_bbox_count + "] annotations");
    
    annotation_ongoing = false;
    
    redraw_image_canvas();
});

// highlight existing annotations
image_canvas.addEventListener("mouseover", function(e) {
    redraw_image_canvas();
});

// draw rectangle as the user drags the mouse cousor
image_canvas.addEventListener('mousemove', function(e) {
    if(annotation_ongoing) {
	// clear the previously drawn rectangle
	redraw_image_canvas();
	
	current_x = e.offsetX; current_y = e.offsetY;
	var w = current_x - click_x;
	var h = current_y - click_y;
	image_context.strokeStyle="#FF0000";
	image_context.shadowBlur=5;
	image_context.shadowColor="white";
	if (w<0 || h <0) {
	    // rectangle is not drawn towards positive x and y quadrant
	    image_context.strokeRect(current_x, current_y, Math.abs(w), Math.abs(h));
	} else {
	    image_context.strokeRect(click_x, click_y, w, h);
	}
    }
});

function draw_all_bbox() {
    for (var i=0; i<annotation_bbox_count; ++i) {
	image_context.strokeStyle="#0000FF";
	image_context.strokeRect(x0[i], y0[i], x1[i]-x0[i], y1[i]-y0[i]);
    }
}

function redraw_image_canvas() {
    if (image != null) {
	image_context.drawImage(image, 0, 0, canvas_width, canvas_height);
	draw_all_bbox();
    }
}

function main() {
    console.log('VGG Image Annotator (via)');

    local_file_selector = document.getElementById("invisible_file_input");
    local_file_selector.addEventListener("change", load_local_file, false);

    // get the width of image_panel
    var image_panel = document.getElementById('image_panel');
    image_panel_width = image_panel.clientWidth;
    image_panel_height = image_panel.clientHeight;

    status("VGG Image Annotator (via) version " + VIA_VERSION + ". Ready !");

    // debug
    console.log("image panel (w,h) = (" + image_panel_width + "," + image_panel_height + ")");
}

function load_local_file(d) {
    var img_file = d.target.files[0];
    if (!img_file) {
	return;
    } else {
	image_original_filename = d.target.files[0].name;
	status("Loading image " + image_original_filename + " ... ");
	img_reader = new FileReader();
	img_reader.onload = function(d) {
	    image = new Image();
	    image.src = img_reader.result;

	    scale_factor_height = image_panel_height/image.naturalHeight;
	    canvas_width = image.naturalWidth * scale_factor_height;
	    if (canvas_width > image_panel_width) {
		scale_factor_width = image_panel_width/canvas_width;
		canvas_height = image_panel_height * scale_factor_width;
	    } else {
		canvas_height = image_panel_height;
	    }

	    // set the canvas size to match that of the image
	    image_canvas.height = Math.round(canvas_height);
	    image_canvas.width = Math.round(canvas_width);
	    
	    image_context.drawImage(image, 0, 0, canvas_width, canvas_height);
	    status("done", true);

	    // debug
	    console.log("image panel (w,h) = (" + image_panel_width + "," + image_panel_height + ")");
	    console.log("canvas (w,h) = (" + canvas_width + "," + canvas_height + ")");
	    console.log("image (w,h) = (" + image.naturalWidth + "," + image.naturalHeight + ")");
	};
	img_reader.readAsDataURL(img_file);
    }
}

function status(msg, append=false) {
    if(append)
	status_bar.innerHTML = status_bar.innerHTML + msg;
    else
	status_bar.innerHTML = msg;
}
