/*
 * VGG Image Annotator (via)
 *
 * Copyright (C) 2016, Abhishek Dutta <adutta@robots.ox.ac.uk>
 * Aug. 31, 2016
 */

var VIA_VERSION = "0.1b";

var image_panel_width;
var image_panel_height;
var canvas_width;
var canvas_height;
var scale_factor = 0; // preserving aspect ratio

var image;
var image_original_filename;
var image_loaded = false;

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
var help_button = document.getElementById("help_button");
var home_button = document.getElementById("home_button");
var delete_annotations_button = document.getElementById("delete_annotations_button");
var settings_button = document.getElementById("settings_button");

var invisible_file_input = document.getElementById("invisible_file_input");
var json_download_link = document.getElementById("link_download_annotations");
var status_bar = document.getElementById("status_bar");
var bbox_annotation_textbox = document.getElementById("bbox_annotation_textbox");
var image_panel = document.getElementById("image_panel");
var starting_information_panel = document.getElementById("starting_information");
var help_panel = document.getElementById("help_panel");

function main() {
    console.log('VGG Image Annotator (via)');

    bbox_annotation_textbox.style.visibility = "hidden";

    show_status("VGG Image Annotator (via) version " + VIA_VERSION + ". Ready !", false);

    image_panel_width = image_panel.offsetWidth;
    image_panel_height = image_panel.offsetHeight;  

    // hide canvas and show starting information
    image_canvas.style.display = "none";
    starting_information_panel.style.display = "block";
    help_panel.style.display = "none";
}

home_button.addEventListener("click", function(e) {
    if (image_loaded) {
	image_canvas.style.display = "inline";
	starting_information_panel.style.display = "none";
    } else {
	image_canvas.style.display = "none";
	starting_information_panel.style.display = "block";
    }

    help_panel.style.display = "none";
    show_status("", false);
}, false);

open_file_button.addEventListener("click", function(e) {
    // source: https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications
    if (invisible_file_input) {
	invisible_file_input.click();
	
	image_canvas.style.display = "inline";
	starting_information_panel.style.display = "none";
	help_panel.style.display = "none";
    }
    e.preventDefault(); // prevent navigation to "#"
}, false);

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
	show_status("Are you serious? Do some annotations first.", false);
    }
});

delete_annotations_button.addEventListener("click", function(e) {
    if ( bounding_box_count > 0 || annotation_count > 0 ) {
	bounding_box_count = 0;
	annotation_count = 0;
	x0 = []; y0 = [];
	x1 = []; y1 = [];
	annotations = [];
	current_annotation_bounding_box_id = -1;

	show_status("All bounding boxes deleted! I hope this was not a mistake :-)", false);
        redraw_image_canvas();
    } else {
	show_status("Common man! how can I delete something that is not there?", false);
    }
}, false);

settings_button.addEventListener('click', function(e) {
    show_status("Not implemented yet! I am working on it.", false);
}, false);

help_button.addEventListener("click", function(e) {
    // hide canvas and show starting information
    image_canvas.style.display = "none";
    starting_information_panel.style.display = "none";
    help_panel.style.display = "block";

    show_status("", false);
}, false);

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
		bbox_annotation_textbox.style.visibility = "hidden";
		current_annotation_bounding_box_id = -1;
		user_entering_annotation = false;
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
	image_canvas.focus();
    }
});

function draw_all_bounding_box() {
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
}

function draw_all_annotations() {
    image_context.shadowColor = "transparent";
    // draw annotation text
    for (var i=0; i<bounding_box_count; ++i) {
	if ( annotations[i] != "" ) {
	    var w = Math.abs(x1[i] - x0[i]);
	    image_context.font = '12pt Sans';

	    var bgnd_rect_height = 1.8 * image_context.measureText('M').width;
	    var bgnd_rect_width = 2*bgnd_rect_height + image_context.measureText(annotations[i]).width;
	    
	    // draw a background rectangle first
	    image_context.fillStyle = 'black';
	    image_context.globalAlpha=0.5;
	    image_context.fillRect(x0[i],
				   y0[i] - bgnd_rect_height,
				   bgnd_rect_width,
				   bgnd_rect_height);
	    // draw text over this background rectangle
	    image_context.globalAlpha=1.0;
	    image_context.fillStyle = 'yellow';
	    image_context.fillText(annotations[i], x0[i] + bgnd_rect_height, y0[i] - bgnd_rect_height/4);
	}
    }
}

function redraw_image_canvas() {
    if (image_loaded) {
	image_context.drawImage(image, 0, 0, canvas_width, canvas_height);
	draw_all_bounding_box();
	draw_all_annotations();
    }
}

function load_local_files(files) {
    var img_file = files[0];
    if (!img_file) {
	return;
    } else {
	image_original_filename = img_file.name;
	img_reader = new FileReader();

	img_reader.addEventListener( "progress", function(e) {
	    show_status("Loading image " + image_original_filename + " ... ", false);
	}, false);

	img_reader.addEventListener( "error", function() {
	    show_status("Error loading image " + image_original_filename + " !", false);
	}, false);
	
	img_reader.addEventListener( "load", function() {
	    image = new Image();
	    image.addEventListener( "load", function() {
		canvas_width = image.naturalWidth;
		canvas_height = image.naturalHeight;
		
		if ( canvas_width > image_panel_width ) {
		    // resize image to match the panel width
		    scale_factor = image_panel_width / image.naturalWidth;
		    canvas_width = image_panel_width;
		    canvas_height = image.naturalHeight * scale_factor;		
		}
		// resize image if its height is larger than the image panel
		if ( canvas_height > image_panel_height ) {
		    scale_factor = image_panel_height / canvas_height;
		    canvas_height = image_panel_height;
		    canvas_width = canvas_width * scale_factor;
		}
		// set the canvas size to match that of the image
		image_canvas.height = canvas_height;
		image_canvas.width = canvas_width;
		
		image_context.drawImage(image, 0, 0, canvas_width, canvas_height);

		var img_dim_str = " ( " + this.naturalWidth + " x " + this.naturalHeight;
		var img_size_str = ", " + Math.round(img_file.size/1024) + " KB )";
		show_status("Loaded " +
			    image_original_filename +
			    img_dim_str +
			    img_size_str, false);
		image_loaded = true;
	    });
	    image.src = img_reader.result;
	}, false);
	img_reader.readAsDataURL(img_file);
    }
}

function is_inside_bounding_box(x, y) {
    for (var i=0; i<bounding_box_count; ++i) {
	if ( x > x0[i] && x < x1[i] && y > y0[i] && y < y1[i] ) {
	    return i;
	}
	//console.log("["+i+"] bbox = ("+x0[i]+","+y0[i]+") to ("+x1[i]+","+y1[i]+") : (x,y)=("+x+","+y+")");
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

// when user presses Enter key, the annotation process begins
// automatically with the first bounding box
// a TAB key moves annotation focus to the next bounding box
window.addEventListener("keydown", function(e) {
    //console.log("window: key = " + e.which + ", user_entering_annotation = " + user_entering_annotation);
    
    if ( e.which == 13 ) { // Enter
	if ( !user_entering_annotation && bounding_box_count > 0 ) {
	    // move to first bounding box
	    user_entering_annotation = true;

	    current_annotation_bounding_box_id = -1;
	    // find the un-annotated bounding box
	    for ( var i=0; i<annotations.length; ++i) {
		if ( annotations[i] == "" ) {
		    current_annotation_bounding_box_id = i;
		    break;
		}
	    }
	    // if not found, move to the first bounding box
	    if ( current_annotation_bounding_box_id == -1 ) {
		current_annotation_bounding_box_id = 0;
	    }
	    
	    annotate_bounding_box(current_annotation_bounding_box_id);
	} else {
	    // store current annotation and
	    // if there are more bounding boxes, move to them
	    annotations[current_annotation_bounding_box_id] = bbox_annotation_textbox.value;
	    bbox_annotation_textbox.value = "";
	    bbox_annotation_textbox.style.visibility = "hidden";
	    redraw_image_canvas();
	    
	    show_status("Saved [" + bounding_box_count + "] bounding boxes and [" + annotations.length + "] annotations", false);

	    if ( bounding_box_count > 1 ) {
		if ( current_annotation_bounding_box_id == (bounding_box_count-1) ) {
		    // move to first bounding box
		    current_annotation_bounding_box_id = 0;
		} else {
		    // move to next bounding box
		    current_annotation_bounding_box_id = current_annotation_bounding_box_id + 1;
		}
		user_entering_annotation = true;
		annotate_bounding_box(current_annotation_bounding_box_id);
	    } else {
		user_entering_annotation = false;
		bbox_annotation_textbox.style.visibility = "hidden";
		current_annotation_bounding_box_id = -1;
	    }
	}
	e.preventDefault();
    }
    if ( e.which == 27 ) { // Esc
	bbox_annotation_textbox.style.visibility = "hidden";
	current_annotation_bounding_box_id = -1;
	user_entering_annotation = false;
	redraw_image_canvas();
    }
});
			      
function show_status(msg, append) {
    if(append)
	status_bar.innerHTML = status_bar.innerHTML + msg;
    else
	status_bar.innerHTML = msg;
}
