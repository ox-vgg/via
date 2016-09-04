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

var status_prefix = "";

var user_uploaded_images;
var image_filename_list = [];
var current_image_index = -1;
var current_image_filename;

var current_image;
var current_image_loaded = false;

var user_drawing_bounding_box = false;
var user_entering_annotation = false;
var click_x0 = 0; var click_y0 = 0; // coordinate of user first click
var click_x1 = 0; var click_y1 = 0; // coordinate of user first click

var bounding_box_count = 0;
var annotation_count = 0;
var x0 = new Map(); var y0 = new Map(); // bounding box: top-left corner
var x1 = new Map(); var y1 = new Map(); // bounding box: bottom-right corner
var annotations = new Map(); // annotation text
var current_annotation_bounding_box_id = -1;

// initialize the canvas on which image annotation takes place
var image_canvas = document.getElementById("image_canvas");
var image_context = image_canvas.getContext("2d");

var load_images_button = document.getElementById("load_images_button");
var help_button = document.getElementById("help_button");
var home_button = document.getElementById("home_button");
var delete_annotations_button = document.getElementById("delete_annotations_button");

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

load_images_button.addEventListener("click", function(e) {
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
    if ( image_filename_list.length > 0 ) {
	var json_str = [];
	for ( var i=0; i<image_filename_list.length; ++i) {
	    var filename = image_filename_list[i];

	    // only write non-empty bounding boxes
	    if ( x0[filename].length > 0 ) {
		var img_annotation_json = {"filename":filename,
					   "x0":x0[filename],
					   "y0":y0[filename],
					   "x1":x1[filename],
					   "y1":y1[filename],
					   "annotations":annotations[filename]};
		json_str.push( JSON.stringify(img_annotation_json) );
	    }
	}
	var json_file = new Blob(json_str, {type : 'text/json'});
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
	x0[current_image_filename] = []; y0[current_image_filename] = [];
	x1[current_image_filename] = []; y1[current_image_filename] = [];
	annotations[current_image_filename] = [];
	current_annotation_bounding_box_id = -1;

	show_status("All bounding boxes deleted! I hope this was not a mistake :-)", false);
        redraw_image_canvas();
    } else {
	show_status("Common man! how can I delete something that is not there?", false);
    }
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
	    x0[current_image_filename].push(click_x0); y0[current_image_filename].push(click_y0);
	    x1[current_image_filename].push(click_x1); y1[current_image_filename].push(click_y1);
	} else {
	    x0[current_image_filename].push(click_x1); y0[current_image_filename].push(click_y1);
	    x1[current_image_filename].push(click_x0); y1[current_image_filename].push(click_y0);
	}
	annotations[current_image_filename].push("");
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
	if ( annotations[current_image_filename][i] == "" ) {
	    image_context.setLineDash([9, 3]);
	    image_context.strokeStyle="#FF0000";	    
	} else {
	    image_context.setLineDash([0]);
	    image_context.strokeStyle="#0000FF";	    
	}
	image_context.shadowBlur=3;
	image_context.shadowColor="white";
	image_context.strokeRect(x0[current_image_filename][i],
				 y0[current_image_filename][i],
				 x1[current_image_filename][i]-x0[current_image_filename][i],
				 y1[current_image_filename][i]-y0[current_image_filename][i]);
    }
}

function draw_all_annotations() {
    image_context.shadowColor = "transparent";
    // draw annotation text
    for (var i=0; i<bounding_box_count; ++i) {
	if ( annotations[current_image_filename][i] != "" ) {
	    var w = Math.abs(x1[current_image_filename][i] - x0[current_image_filename][i]);
	    image_context.font = '12pt Sans';

	    var bgnd_rect_height = 1.8 * image_context.measureText('M').width;
	    var bgnd_rect_width = 2*bgnd_rect_height + image_context.measureText(annotations[i]).width;
	    
	    // draw a background rectangle first
	    image_context.fillStyle = 'black';
	    image_context.globalAlpha=0.5;
	    image_context.fillRect(x0[current_image_filename][i],
				   y0[current_image_filename][i] - bgnd_rect_height,
				   bgnd_rect_width,
				   bgnd_rect_height);
	    // draw text over this background rectangle
	    image_context.globalAlpha=1.0;
	    image_context.fillStyle = 'yellow';
	    image_context.fillText(annotations[current_image_filename][i],
				   x0[current_image_filename][i] + bgnd_rect_height,
				   y0[current_image_filename][i] - bgnd_rect_height/4);
	}
    }
}

function redraw_image_canvas() {
    if (current_image_loaded) {
	image_context.drawImage(current_image, 0, 0, canvas_width, canvas_height);
	draw_all_bounding_box();
	draw_all_annotations();
    }
}

function load_local_file(file_id) {
    current_image_index = file_id;
    var img_file = user_uploaded_images[current_image_index];

    if (!img_file) {
	return;
    } else {
	status_prefix = "[ " + (current_image_index+1) + " of " +
	    user_uploaded_images.length + " images ] : ";
	
	current_image_filename = img_file.name;
	img_reader = new FileReader();

	img_reader.addEventListener( "progress", function(e) {
	    show_status("Loading image " + current_image_filename + " ... ", false);
	}, false);

	img_reader.addEventListener( "error", function() {
	    show_status("Error loading image " + current_image_filename + " !", false);
	}, false);
	
	img_reader.addEventListener( "load", function() {
	    current_image = new Image();
	    current_image.addEventListener( "load", function() {
		canvas_width = current_image.naturalWidth;
		canvas_height = current_image.naturalHeight;
		
		if ( canvas_width > image_panel_width ) {
		    // resize image to match the panel width
		    scale_factor = image_panel_width / current_image.naturalWidth;
		    canvas_width = image_panel_width;
		    canvas_height = current_image.naturalHeight * scale_factor;		
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
		
		
		var img_dim_str = " ( " + this.naturalWidth + " x " + this.naturalHeight;
		var img_size_str = ", " + Math.round(img_file.size/1024) + " KB )";
		show_status("Loaded " +
			    current_image_filename +
			    img_dim_str +
			    img_size_str, false);

		current_image_loaded = true;
		// reset all variable
		bounding_box_count = x0[current_image_filename].length;
		annotation_count = annotations[current_image_filename].length;
		click_x0 = 0; click_y0 = 0;
		click_x1 = 0; click_y1 = 0;
		user_drawing_bounding_box = false;
		user_entering_annotation = false;

		if ( bounding_box_count > 0 ) {
		    redraw_image_canvas();
		} else {
		    image_context.drawImage(current_image, 0, 0, canvas_width, canvas_height);
		}
	    });
	    current_image.src = img_reader.result;
	}, false);
	img_reader.readAsDataURL(img_file);
    }
}

function upload_local_files(user_selected_files) {
    // file input specification only allows selection of images
    user_uploaded_images = user_selected_files;

    // initialize storage for bounding box and annotations
    for ( var i=0; i<user_uploaded_images.length; ++i) {
	var filename = user_uploaded_images[i].name;
	x0[filename] = []; y0[filename] = [];
	x1[filename] = []; y1[filename] = [];
	annotations[filename] = [];
	image_filename_list[i] = filename;
    }
    
    if ( user_uploaded_images.length > 0 ) {
	// start with the first file
	load_local_file(0);
    } else {
	status("Get serious in life. No files were uploaded!", false);
    }
}

function is_inside_bounding_box(x, y) {
    for (var i=0; i<bounding_box_count; ++i) {
	if ( x > x0[current_image_filename][i] &&
	     x < x1[current_image_filename][i] &&
	     y > y0[current_image_filename][i] &&
	     y < y1[current_image_filename][i] ) {
	    return i;
	}
	//console.log("["+i+"] bbox = ("+x0[i]+","+y0[i]+") to ("+x1[i]+","+y1[i]+") : (x,y)=("+x+","+y+")");
    }    
    return -1;
}

function annotate_bounding_box(bounding_box_id) {
    var w = x1[current_image_filename][bounding_box_id] - x0[current_image_filename][bounding_box_id];
    var canvas_x0 = image_canvas.getBoundingClientRect().left;
    var canvas_y0 = image_canvas.getBoundingClientRect().top;
    bbox_annotation_textbox.style.position = "fixed";
    bbox_annotation_textbox.style.top = canvas_y0 + y0[current_image_filename][bounding_box_id];
    bbox_annotation_textbox.style.left = canvas_x0 + x0[current_image_filename][bounding_box_id];
    bbox_annotation_textbox.style.opacity = 0.5;
    bbox_annotation_textbox.value = annotations[current_image_filename][bounding_box_id]; // existing annotation
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
		if ( annotations[current_image_filename][i] == "" ) {
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
	    if ( bounding_box_count > 0 ) {
		// store current annotation and
		// if there are more bounding boxes, move to them
		annotations[current_image_filename][current_annotation_bounding_box_id] = bbox_annotation_textbox.value;
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
	}
	e.preventDefault();
    }
    if ( e.which == 27 ) { // Esc
	bbox_annotation_textbox.style.visibility = "hidden";
	current_annotation_bounding_box_id = -1;
	user_entering_annotation = false;
	redraw_image_canvas();
    }
    if ( e.which == 39 ) { // right arrow
	if ( user_uploaded_images != null ) {

	    if ( user_entering_annotation) {
		user_entering_annotation = false;
		bbox_annotation_textbox.style.visibility = "hidden";
		current_annotation_bounding_box_id = -1;
	    }
	    
	    show_status("Moving to next image ...", false);
	    image_context.clearRect(0, 0, image_canvas.width, image_canvas.height);
	    if ( current_image_index == (user_uploaded_images.length - 1) ) {
		load_local_file(0);
	    } else {
		load_local_file(current_image_index + 1);
	    }
	}
    }
    if ( e.which == 37 ) { // left arrow
	if ( user_uploaded_images != null ) {
	    if ( user_entering_annotation) {
		user_entering_annotation = false;
		bbox_annotation_textbox.style.visibility = "hidden";
		current_annotation_bounding_box_id = -1;
	    }
	    
	    show_status("Moving to previous image ...", false);
	    image_context.clearRect(0, 0, image_canvas.width, image_canvas.height);	
	    if ( current_image_index == 0 ) {
		load_local_file(user_uploaded_images.length - 1);
	    } else {
		load_local_file(current_image_index - 1);
	    }
	}
    }
    if ( e.which == 68 ) {
	print_current_annotations();
    }
});
			      
function show_status(msg, append) {
    if(append)
	status_bar.innerHTML = status_bar.innerHTML + status_prefix + msg;
    else
	status_bar.innerHTML = status_prefix + msg;
}

function print_current_annotations() {    
    for ( var i=0; i<image_filename_list.length; ++i) {
	var fn = image_filename_list[i];
	var logstr = "[" + fn + "] : ";
	logstr = logstr + "x0=" + x0[fn].length + ", ";
	logstr = logstr + "y0=" + y0[fn].length + ", ";
	logstr = logstr + "x1=" + x1[fn].length + ", ";
	logstr = logstr + "y1=" + y1[fn].length + ", ";
	logstr = logstr + "annotations=" + annotations[fn].length + ", ";
	console.log(logstr);
    }
}
