/*
 * VGG Image Annotator (via)
 *
 * Copyright (C) 2016, Abhishek Dutta <adutta@robots.ox.ac.uk>
 * Aug. 31, 2016
 */

var VIA_VERSION = "0.1";

var image_panel_width;
var image_panel_height;
var canvas_width;
var canvas_height;
var scale_factor = 0; // preserving aspect ratio

var image = new Image();
var image_original_filename;

var user_drawing_bounding_box = false;
var user_entering_annotation = false;
var click_x0 = 0; var click_y0 = 0; // coordinate of user first click
var click_x1 = 0; var click_y1 = 0; // coordinate of user first click

var bounding_box_count = 0;
var annotation_count = 0;
var x0 = []; var y0 = []; // bounding box: top-left corner
var x1 = []; var y1 = []; // bounding box: bottom-right corner
var annotations = []; // annotation text
var current_annotation_bounding_box_id = -1;

// initialize the canvas on which image annotation takes place
var image_canvas = document.getElementById("image_canvas");
var image_context = image_canvas.getContext("2d");

var open_file_button = document.getElementById("open_file_button");
var help_button = document.getElementById('help_button');
var home_button = document.getElementById('home_button');

var invisible_file_input = document.getElementById("invisible_file_input");
var json_download_link = document.getElementById("link_download_annotations");
var status_bar = document.getElementById("status_bar");
var bbox_annotation_textbox = document.getElementById("bbox_annotation_textbox");
var image_panel = document.getElementById('image_panel');
var starting_information_panel = document.getElementById('starting_information');
var help_panel = document.getElementById('help_panel');

function main() {
    console.log('VGG Image Annotator (via)');

    // Handler for toolbar buttons
    home_button.addEventListener("click", function(e) {
	image_canvas.style.display = "none";
	starting_information_panel.style.display = "block";
	help_panel.style.display = "none";
    }, false);

    open_file_button.addEventListener("click", function(e) {
	// source: https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications
	if (invisible_file_input) {
	    invisible_file_input.click();
	}
	e.preventDefault(); // prevent navigation to "#"
    }, false);

    help_button.addEventListener("click", function(e) {
	// hide canvas and show starting information
	image_canvas.style.display = "none";
	starting_information_panel.style.display = "none";
	help_panel.style.display = "block";
    }, false);

    bbox_annotation_textbox.style.visibility = "hidden";

    show_status("VGG Image Annotator (via) version " + VIA_VERSION + ". Ready !", false);

    image_panel_width = image_panel.offsetWidth;
    image_panel_height = image_panel.offsetHeight;  
    //console.log("image panel (w,h) = (" + image_panel_width + "," + image_panel_height + ")");

    // hide canvas and show starting information
    image_canvas.style.display = "none";
    starting_information_panel.style.display = "block";
}

// Let users download the annotations as a CSV file
json_download_link.addEventListener('click', function(e) {
    if ( bounding_box_count > 0 ) {
	x0_json = JSON.stringify(x0);
	y0_json = JSON.stringify(y0);
	x1_json = JSON.stringify(x1);
	y1_json = JSON.stringify(y1);
	bbox_json = {"filename":image_original_filename,
		     "x0":x0,
		     "y0":y0,
		     "x1":x1,
		     "y1":y1,
		     "annotations":annotations};
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
    user_drawing_bounding_box = true;
    click_x0 = e.offsetX; click_y0 = e.offsetY;
    //console.log("mouse click (x,y) = (" + click_x0 + "," + click_y0 + ")");
});

// A click on canvas indicates annotation of an object in image
image_canvas.addEventListener('mouseup', function(e) {
    // store bbox coordinates
    click_x1 = e.offsetX; click_y1 = e.offsetY;

    var dx = Math.abs(click_x1 - click_x0);
    var dy = Math.abs(click_y1 - click_y0);
    //console.log("d(x,y) = (" + dx + "," + dy + ")");
    if ( dx < 10 || dy < 10 ) {	
	// this was a single click event which triggers image annotation
	user_drawing_bounding_box = false;
	var bounding_box_id = is_inside_bounding_box(click_x0, click_y0);
	if ( bounding_box_id >= 0 ) {
	    user_entering_annotation = true;
	    current_annotation_bounding_box_id = bounding_box_id;
	    annotate_bounding_box(bounding_box_id);
	} else {
	    if ( user_entering_annotation ) {
		bbox_annotation_textbox.focus();
	    } else {
		redraw_image_canvas();
	    }
	}
    } else {
	// this was a bounding box drawing event

	// ensure that (x0,y0) is top-left and (x1,y1) is bottom-right
	if ( click_x0 < click_x1 ) {
	    x0.push(click_x0); y0.push(click_y0);
	    x1.push(click_x1); y1.push(click_y1);
	} else {
	    x0.push(click_x1); y0.push(click_y1);
	    x1.push(click_x0); y1.push(click_y0);
	}
	annotations.push("");
	bounding_box_count = bounding_box_count + 1;

	show_status("Saved [" + bounding_box_count + "] bounding boxes and [" + annotation_count + "] annotations", false);
	user_drawing_bounding_box = false;
        redraw_image_canvas();
    }
});
					 
// highlight existing annotations
image_canvas.addEventListener("mouseover", function(e) {
    redraw_image_canvas();
});

// draw rectangle as the user drags the mouse cousor
image_canvas.addEventListener('mousemove', function(e) {
    if(user_drawing_bounding_box) {
	// clear the previously drawn rectangle
	redraw_image_canvas();
	
	current_x = e.offsetX; current_y = e.offsetY;
	var w = current_x - click_x0;
	var h = current_y - click_y0;
	image_context.strokeStyle="#FF0000";
	image_context.shadowBlur=5;
	image_context.shadowColor="white";
	if (w<0 || h <0) {
	    // rectangle is not drawn towards positive x and y quadrant
	    image_context.strokeRect(current_x, current_y, Math.abs(w), Math.abs(h));
	} else {
	    image_context.strokeRect(click_x0, click_y0, w, h);
	}
    }
});

function draw_all_bbox() {
    image_context.save();

    // draw bounding boxes
    for (var i=0; i<bounding_box_count; ++i) {
	// draw bounding box
	if ( annotations[i] == "" ) {
	    image_context.setLineDash([9, 3]);
	    image_context.strokeStyle="#FF0000";	    
	} else {
	    image_context.setLineDash([0]);
	    image_context.strokeStyle="#0000FF";	    
	}
	image_context.shadowBlur=3;
	image_context.shadowColor="white";
	image_context.strokeRect(x0[i], y0[i], x1[i]-x0[i], y1[i]-y0[i]);
    }

    image_context.shadowColor = "transparent";
    // draw annotation text
    for (var i=0; i<bounding_box_count; ++i) {
	if ( annotations[i] != "" ) {
	    var w = Math.abs(x1[i] - x0[i]);
	    image_context.font = '12pt Sans';

	    // draw the annotation
	    image_context.fillStyle = 'black';
	    image_context.fillText(annotations[i], x0[i], y0[i]);
	}
    }
}

function redraw_image_canvas() {
    if (image != null) {
	image_context.drawImage(image, 0, 0, canvas_width, canvas_height);
	draw_all_bbox();
    }
}

function load_local_files(files) {
    // hide canvas and show starting information
    image_canvas.style.display = "";
    starting_information_panel.style.display = "none";

    var img_file = files[0];
    if (!img_file) {
	return;
    } else {
	image_original_filename = files[0].name;
	try {
	    img_reader = new FileReader();

	    img_reader.addEventListener( "progress", function(e) {
		show_status("Loading image " + image_original_filename + " ... ", false);
	    }, false);

	    img_reader.addEventListener( "error", function() {
		show_status("Error loading image " + image_original_filename + " !", false);
	    }, false);
	    
	    img_reader.addEventListener( "load", function() {
		image.src = img_reader.result;

		//console.log("image (w,h) = (" + image.naturalWidth + "," + image.naturalHeight + ")");
		
		canvas_width = image.naturalWidth;
		canvas_height = image.naturalHeight;
		
		if ( canvas_width > image_panel_width ) {
		    // resize image to match the panel width
		    scale_factor = image_panel_width / image.naturalWidth;
		    canvas_width = image_panel_width;
		    canvas_height = image.naturalHeight * scale_factor;		
		}
		if ( canvas_height > image_panel_height ) {
		    scale_factor = image_panel_height / canvas_height;
		    canvas_height = image_panel_height;
		    canvas_width = canvas_width * scale_factor;
		}
		//console.log("computed canvas (w,h) = (" + canvas_width + "," + canvas_height + ")");
		
		// set the canvas size to match that of the image
		image_canvas.height = canvas_height;
		image_canvas.width = canvas_width;
		
		image_context.drawImage(image, 0, 0, canvas_width, canvas_height);
		show_status("Loaded " + image_original_filename, false);

		/*
		// debug
		console.log("image panel (w,h) = (" + image_panel_width + "," + image_panel_height + ")");
		console.log("canvas (w,h) = (" + image_canvas.width + "," + image_canvas.height + ")");
		console.log("image (w,h) = (" + image.naturalWidth + "," + image.naturalHeight + ")");
		console.log("scale factor = " + scale_factor);
		*/
	    }, false);
	    
	    img_reader.readAsDataURL(img_file);
	} catch (e) {
	    console.log("Exception : " + e.message);
	}
    }
}

function is_inside_bounding_box(x, y) {
    for (var i=0; i<bounding_box_count; ++i) {
	if ( x > x0[i] && x < x1[i] && y > y0[i] && y < y1[i] ) {
	    return i;
	}
	console.log("["+i+"] bbox = ("+x0[i]+","+y0[i]+") to ("+x1[i]+","+y1[i]+") : (x,y)=("+x+","+y+")");
    }    
    return -1;
}

function annotate_bounding_box(bounding_box_id) {
    var w = x1[bounding_box_id] - x0[bounding_box_id];
    var canvas_x0 = image_canvas.getBoundingClientRect().left;
    var canvas_y0 = image_canvas.getBoundingClientRect().top;
    bbox_annotation_textbox.style.position = "fixed";
    bbox_annotation_textbox.style.top = canvas_y0 + y0[bounding_box_id];
    bbox_annotation_textbox.style.left = canvas_x0 + x0[bounding_box_id];
    bbox_annotation_textbox.style.opacity = 0.5;
    bbox_annotation_textbox.value = annotations[bounding_box_id]; // existing annotation
        bbox_annotation_textbox.style.visibility = "visible";
    //bbox_annotation_textbox.style.display = "inline";
    bbox_annotation_textbox.style.width = Math.max(10, w - w/4);
    bbox_annotation_textbox.style.height = "1.5em";
    bbox_annotation_textbox.focus();
}

// when the user types annotation text and presses the Enter key
bbox_annotation_textbox.addEventListener("keydown", function(e) {
    if ( e.which == 13 ) { // Enter
	annotations[current_annotation_bounding_box_id] = bbox_annotation_textbox.value;
	annotation_count = annotation_count + 1;
	bbox_annotation_textbox.value = "";
	//bbox_annotation_textbox.style.display = "none";
	bbox_annotation_textbox.style.visibility = "hidden";
	user_entering_annotation = false;

	show_status("Saved [" + bounding_box_count + "] bounding boxes and [" + annotation_count + "] annotations", false);
	redraw_image_canvas();
    }
    if ( e.which == 27 ) { // Esc
	//bbox_annotation_textbox.style.display = "none";
	bbox_annotation_textbox.style.visibility = "hidden";
	current_annotation_bounding_box_id = -1;
	user_entering_annotation = false;
    }
});


function show_status(msg, append) {
    if(append)
	status_bar.innerHTML = status_bar.innerHTML + msg;
    else
	status_bar.innerHTML = msg;
}
