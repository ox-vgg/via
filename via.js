/*
 * VGG Image Annotator (via)
 *
 * Copyright (C) 2016, Abhishek Dutta <adutta@robots.ox.ac.uk>
 * Aug. 31, 2016
 */

var VIA_VERSION = "0.1b";
var image_panel_width, image_panel_height;
var canvas_width, canvas_height;

var user_uploaded_images;
var image_filename_list = [];
var current_image_index = -1;
var current_image_filename;

var current_image;
var current_image_loaded = false;
var prefetched_next_img, prefetched_prev_img;

var user_drawing_bounding_box = false;
var user_entering_annotation = false;
var click_x0 = 0; var click_y0 = 0;
var click_x1 = 0; var click_y1 = 0;

var bounding_box_count = 0;
var annotation_count = 0;
var annotations = new Map();
var current_annotation_bounding_box_id = -1;

// bounding box coordinates in original image space
var x0 = new Map(); var y0 = new Map(); var x1 = new Map(); var y1 = new Map();
// bounding box coordinates in original canvas space
var canvas_x0 = new Map(); var canvas_y0 = new Map();
var canvas_x1 = new Map(); var canvas_y1 = new Map();
var scale_factor = new Map(); // canvas_x0 = x0 * scale_factor

var status_prefix = "";

var image_canvas = document.getElementById("image_canvas");
var image_context = image_canvas.getContext("2d");

var home_button = document.getElementById("home_button");;
var load_images_button = document.getElementById("load_images_button");
var help_button = document.getElementById("help_button");
var home_button = document.getElementById("home_button");
var delete_annotations_button = document.getElementById("delete_annotations_button");

var invisible_file_input = document.getElementById("invisible_file_input");
var json_download_link = document.getElementById("link_download_annotations");
var status_bar = document.getElementById("status_bar");

var image_panel = document.getElementById("image_panel");
var starting_information_panel = document.getElementById("starting_information");
var help_panel = document.getElementById("help_panel");
var container = document.getElementById("container");

var annotation_textbox = document.getElementById("annotation_textbox");    
annotation_textbox.style.visibility = "hidden";

var window_resize_timer;
var is_window_resized = false;

var is_user_resizing_bounding_box = false;
@@@@@@@@@@@@@@@@@@@@@
@todo
@@@@@@@@@@@@@@@@@@@@@
var bounding_box_edge = [-1, -1];
var bounding_box_edge_tol = 5;

function main() {
    console.log('VGG Image Annotator (via)');    
    show_status("VGG Image Annotator (via) version " + VIA_VERSION + ". Ready !", false);

    // hide canvas and show starting information
    image_canvas.style.display = "none";
    starting_information_panel.style.display = "block";
    help_panel.style.display = "none";
}
function update_ui_components() {
    if ( !is_window_resized && current_image_loaded ) {
        show_status("Resizing window ...", false);
        is_window_resized = true;
        load_local_file(current_image_index);
    }
}

home_button.addEventListener("click", function(e) {
    if (current_image_loaded) {
        image_canvas.style.display = "inline";
        starting_information_panel.style.display = "none";
        redraw_image_canvas();

        show_status(current_image_filename +
                    " | " + bounding_box_count + " boxes and " + annotation_count + " annotations" +
                    " | Press <span style='color:red;'>Enter</span> key to annotate, " +
                    " <span style='color:red'>Arrow keys</span> to move to next image.", false);
    } else {
        image_canvas.style.display = "none";
        starting_information_panel.style.display = "block";

        status_prefix = "";
        show_status("VGG Image Annotator (via) version " + VIA_VERSION + ". Ready !", false);
    }

    help_panel.style.display = "none";
    
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

            // convert all coordinates to integer
            var int_x0 = x0[filename].slice(); var int_y0 = y0[filename].slice();
            var int_x1 = x1[filename].slice(); var int_y1 = y1[filename].slice();
            for (var j=0; j<int_x0.length; ++j) {
                int_x0[j] = Math.round(int_x0[j]);
                int_y0[j] = Math.round(int_y0[j]);
                int_x1[j] = Math.round(int_x1[j]);
                int_y1[j] = Math.round(int_y1[j]);
            }
            
            // only write non-empty bounding boxes
            if ( x0[filename].length > 0 ) {    
                var img_annotation_json = {"filename":filename,
                                           "x0":int_x0,
                                           "y0":int_y0,
                                           "x1":int_x1,
                                           "y1":int_y1,
                                           "annotations":annotations[filename]};
                json_str.push( JSON.stringify(img_annotation_json) );
            }
        }
        var json_file = new Blob(json_str, {type : 'text/json'});
        json_download_link.href = URL.createObjectURL(json_file);
        json_download_link.name = "annotations.json";
        json_download_link.title = "annotations.json";
        json_download_link.target = "_new";
    } else {
        show_status("Please do some annotations first.", false);
    }
});

delete_annotations_button.addEventListener("click", function(e) {
    if ( bounding_box_count > 0 || annotation_count > 0 ) {
        bounding_box_count = 0;
        annotation_count = 0;
        x0[current_image_filename] = []; y0[current_image_filename] = [];
        x1[current_image_filename] = []; y1[current_image_filename] = [];
        canvas_x0[current_image_filename] = []; canvas_y0[current_image_filename] = [];
        canvas_x1[current_image_filename] = []; canvas_y1[current_image_filename] = [];

        annotations[current_image_filename] = [];
        current_annotation_bounding_box_id = -1;

        show_status("All bounding boxes deleted! I hope this was not a mistake :-)", false);
        redraw_image_canvas();
    } else {
        show_status("Bounding boxes are not present!", false);
    }
}, false);

help_button.addEventListener("click", function(e) {
    image_canvas.style.display = "none";
    starting_information_panel.style.display = "none";
    help_panel.style.display = "block";

    show_status("VGG Image Annotator (via) version " + VIA_VERSION, false);
}, false);

image_canvas.addEventListener('mousedown', function(e) {
    user_drawing_bounding_box = true;
    click_x0 = e.offsetX; click_y0 = e.offsetY;

    if ( is_user_resizing_bounding_box ) {
	@@@@@@@@@@@@@@@@
	@todo
	@@@@@@@@@@@@@@@
	bounding_box_edge[0] : which bbox id
	bounding_box_edge[1] : which corner
    }
});

image_canvas.addEventListener('mouseup', function(e) {
    click_x1 = e.offsetX; click_y1 = e.offsetY;

    var dx = Math.abs(click_x1 - click_x0);
    var dy = Math.abs(click_y1 - click_y0);
    if ( dx < 10 || dy < 10 ) {
        // a single click - trigger image annotation
        user_drawing_bounding_box = false;
        var bounding_box_id = is_inside_bounding_box(click_x0, click_y0);
        if ( bounding_box_id >= 0 ) {
            user_entering_annotation = true;
            current_annotation_bounding_box_id = bounding_box_id;
            annotate_bounding_box(bounding_box_id);
        } else {
            if ( user_entering_annotation ) {
                annotation_textbox.style.visibility = "hidden";
                current_annotation_bounding_box_id = -1;
                user_entering_annotation = false;
                redraw_image_canvas();
            }
        }
    } else {
        // this was a bounding box drawing event

        // ensure that (x0,y0) is top-left and (x1,y1) is bottom-right
        if ( click_x0 < click_x1 ) {
            if ( click_y0 < click_y1 ) {
                x0[current_image_filename].push(click_x0 * scale_factor[current_image_filename]);
                y0[current_image_filename].push(click_y0 * scale_factor[current_image_filename]);
                x1[current_image_filename].push(click_x1 * scale_factor[current_image_filename]);
                y1[current_image_filename].push(click_y1 * scale_factor[current_image_filename]);

                canvas_x0[current_image_filename].push(click_x0); canvas_y0[current_image_filename].push(click_y0);
                canvas_x1[current_image_filename].push(click_x1); canvas_y1[current_image_filename].push(click_y1);
            } else {
                x0[current_image_filename].push(click_x0 * scale_factor[current_image_filename]);
                y0[current_image_filename].push(click_y1 * scale_factor[current_image_filename]);
                x1[current_image_filename].push(click_x1 * scale_factor[current_image_filename]);
                y1[current_image_filename].push(click_y0 * scale_factor[current_image_filename]);

                canvas_x0[current_image_filename].push(click_x0); canvas_y0[current_image_filename].push(click_y1);
                canvas_x1[current_image_filename].push(click_x1); canvas_y1[current_image_filename].push(click_y0);
            }
        } else {
            if ( click_y0 < click_y1 ) {
                x0[current_image_filename].push(click_x1 * scale_factor[current_image_filename]);
                y0[current_image_filename].push(click_y0 * scale_factor[current_image_filename]);
                x1[current_image_filename].push(click_x0 * scale_factor[current_image_filename]);
                y1[current_image_filename].push(click_y1 * scale_factor[current_image_filename]);

                canvas_x0[current_image_filename].push(click_x1); canvas_y0[current_image_filename].push(click_y0);
                canvas_x1[current_image_filename].push(click_x0); canvas_y1[current_image_filename].push(click_y1);
            } else {
                x0[current_image_filename].push(click_x1 * scale_factor[current_image_filename]);
                y0[current_image_filename].push(click_y1 * scale_factor[current_image_filename]);
                x1[current_image_filename].push(click_x0 * scale_factor[current_image_filename]);
                y1[current_image_filename].push(click_y0 * scale_factor[current_image_filename]);

                canvas_x0[current_image_filename].push(click_x1); canvas_y0[current_image_filename].push(click_y1);
                canvas_x1[current_image_filename].push(click_x0); canvas_y1[current_image_filename].push(click_y0);
            }
        }
        annotations[current_image_filename].push("");
        bounding_box_count = bounding_box_count + 1;

        show_status(current_image_filename +
                    " | " + bounding_box_count + " boxes and " + annotation_count + " annotations" +
                    " | Press <span style='color:red;'>Enter</span> key to annotate, " +
                    " <span style='color:red'>Arrow keys</span> to move to next image.", false);
        user_drawing_bounding_box = false;
        redraw_image_canvas();
    }
});

image_canvas.addEventListener("mouseover", function(e) {
    redraw_image_canvas();
});

image_canvas.addEventListener('mousemove', function(e) {
    if(user_drawing_bounding_box) {
        // draw rectangle as the user drags the mouse cousor
        redraw_image_canvas(); // clear old intermediate rectangle
        
        current_x = e.offsetX; current_y = e.offsetY;
        var w = Math.abs(current_x - click_x0);
        var h = Math.abs(current_y - click_y0);
        var top_left_x, top_left_y;

        if ( click_x0 < current_x ) {
            if ( click_y0 < current_y ) {
                top_left_x = click_x0;
                top_left_y = click_y0;
            } else {
                top_left_x = click_x0;
                top_left_y = current_y;
            }
        } else {
            if ( click_y0 < current_y ) {
                top_left_x = current_x;
                top_left_y = click_y0;
            } else {
                top_left_x = current_x;
                top_left_y = current_y;
            }
        }
        
        image_context.strokeStyle="#FF0000";
        image_context.shadowBlur=5;
        image_context.shadowColor="white";
        image_context.strokeRect(top_left_x, top_left_y, w, h);
        image_canvas.focus();
    } else {
	current_x = e.offsetX; current_y = e.offsetY;
	bounding_box_edge = is_on_bounding_box_corner(current_x, current_y, bounding_box_edge_tol);
	if ( bounding_box_edge[1] > 0 ) {
	    is_user_resizing_bounding_box = true;
	    resizing_bounding_box_id = bounding_box_edge[0];
	    switch(bounding_box_edge[1]) {
	    case 1: // top-left
	    case 3: // bottom-right
		image_canvas.style.cursor = "nwse-resize";
		break;
	    case 2: // top-right
	    case 4: // bottom-left		
		image_canvas.style.cursor = "nesw-resize";
		break;
	    default:
		image_canvas.style.cursor = "default";
	    }
	} else {
	    is_user_resizing_bounding_box = true;
	    image_canvas.style.cursor = "default";
	}
    }
    /* @todo: implement settings -> show guide
       else {
       redraw_image_canvas();
       current_x = e.offsetX; current_y = e.offsetY;
       image_context.strokeStyle="#ffffff";
       image_context.setLineDash([0]);
       image_context.strokeRect(0, current_y, canvas_width, 1);
       image_context.strokeRect(current_x, 0, 1, canvas_height);
       image_canvas.focus();
       }
    */
});

function draw_all_bounding_box() {
    for (var i=0; i<bounding_box_count; ++i) {
        if ( annotations[current_image_filename][i] == "" ) {
            image_context.setLineDash([9, 3]);
            image_context.strokeStyle="#FF0000";            
        } else {
            image_context.setLineDash([0]);
            image_context.strokeStyle="#0000FF";            
        }
        image_context.shadowBlur=3;
        image_context.shadowColor="white";
        image_context.strokeRect(canvas_x0[current_image_filename][i],
                                 canvas_y0[current_image_filename][i],
                                 canvas_x1[current_image_filename][i] - canvas_x0[current_image_filename][i],
                                 canvas_y1[current_image_filename][i] - canvas_y0[current_image_filename][i]);
    }
}

function draw_all_annotations() {
    image_context.shadowColor = "transparent";
    for (var i=0; i<bounding_box_count; ++i) {
        if ( annotations[current_image_filename][i] != "" ) {
            var w = Math.abs(canvas_x1[current_image_filename][i] - canvas_x0[current_image_filename][i]);
            image_context.font = '12pt Sans';

            var bgnd_rect_height = 1.8 * image_context.measureText('M').width;
            var bgnd_rect_width = 2*bgnd_rect_height + image_context.measureText(annotations[i]).width;
            
            // first, draw a background rectangle first
            image_context.fillStyle = 'black';
            image_context.globalAlpha=0.5;          
            image_context.fillRect(canvas_x0[current_image_filename][i],
                                   canvas_y0[current_image_filename][i] - bgnd_rect_height,
                                   bgnd_rect_width,
                                   bgnd_rect_height);
            // then, draw text over this background rectangle
            image_context.globalAlpha=1.0;
            image_context.fillStyle = 'yellow';
            image_context.fillText(annotations[current_image_filename][i],
                                   canvas_x0[current_image_filename][i] + bgnd_rect_height,
                                   canvas_y0[current_image_filename][i] - bgnd_rect_height/4);
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
        status_prefix = "(" + (current_image_index+1) + "/" +
            user_uploaded_images.length + ") ";
        
        current_image_filename = image_filename_list[current_image_index];
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
                // retrive image panel dim. to stretch image_canvas to fit panel
                image_panel_width = image_panel.offsetWidth;
                image_panel_height = image_panel.offsetHeight;
                
                canvas_width = current_image.naturalWidth;
                canvas_height = current_image.naturalHeight;

                var scale_width, scale_height;
                if ( canvas_width > image_panel_width ) {
                    // resize image to match the panel width
                    scale_width = image_panel_width / current_image.naturalWidth;
                    canvas_width = image_panel_width;
                    canvas_height = current_image.naturalHeight * scale_width;
                }
                // resize image if its height is larger than the image panel
                if ( canvas_height > image_panel_height ) {
                    scale_height = image_panel_height / canvas_height;
                    canvas_height = image_panel_height;
                    canvas_width = canvas_width * scale_height;
                }

                canvas_width = Math.round(canvas_width);
                canvas_height = Math.round(canvas_height);
                
                scale_factor[current_image_filename] = current_image.naturalWidth / canvas_width;
                
                // set the canvas size to match that of the image
                image_canvas.height = canvas_height;
                image_canvas.width = canvas_width;

                current_image_loaded = true;
                bounding_box_count = x0[current_image_filename].length;
                annotation_count = 0;
                for ( var i=0; i<annotations[current_image_filename].length; ++i) {
                    if ( annotations[current_image_filename][i] != "" ) {
                        annotation_count = annotation_count + 1;
                    }
                }
                
                click_x0 = 0; click_y0 = 0;
                click_x1 = 0; click_y1 = 0;
                user_drawing_bounding_box = false;
                user_entering_annotation = false;
                is_window_resized = false;

                if ( bounding_box_count > 0 ) {
                    // update the canvas image space coordinates
                    var fn = current_image_filename;
                    for ( var j=0; j<x0[current_image_filename].length; ++j ) {
                        canvas_x0[fn][j] = x0[fn][j] / scale_factor[fn];
                        canvas_y0[fn][j] = y0[fn][j] / scale_factor[fn];
                        canvas_x1[fn][j] = x1[fn][j] / scale_factor[fn];
                        canvas_y1[fn][j] = y1[fn][j] / scale_factor[fn];
                    }

                    redraw_image_canvas();
                } else {
                    image_context.drawImage(current_image, 0, 0, canvas_width, canvas_height);
                }

                image_canvas.style.display = "inline";
                starting_information_panel.style.display = "none";
                help_panel.style.display = "none";

                show_status(current_image_filename +
                            " | " + bounding_box_count + " boxes and " + annotation_count + " annotations" +
                            " | Press <span style='color:red;'>Enter</span> key to annotate, " +
                            " <span style='color:red'>Arrow keys</span> to move to next image.", false);
            });
            current_image.src = img_reader.result;
        }, false);
        img_reader.readAsDataURL(img_file);
    }
}

function upload_local_files(user_selected_files) {
    user_uploaded_images = user_selected_files;
    for ( var i=0; i<user_uploaded_images.length; ++i) {
        var filename = user_uploaded_images[i].name;
        x0[filename] = []; y0[filename] = [];
        x1[filename] = []; y1[filename] = [];
        canvas_x0[filename] = []; canvas_y0[filename] = [];
        canvas_x1[filename] = []; canvas_y1[filename] = [];
        annotations[filename] = [];
        image_filename_list[i] = filename;
        scale_factor[filename] = 1.0;
    }
    
    if ( user_uploaded_images.length > 0 ) {
        load_local_file(0);
    } else {
        status("Please upload some files!", false);
    }
}

function is_inside_bounding_box(x, y) {
    for (var i=0; i<bounding_box_count; ++i) {
        if ( x > canvas_x0[current_image_filename][i] &&
             x < canvas_x1[current_image_filename][i] &&
             y > canvas_y0[current_image_filename][i] &&
             y < canvas_y1[current_image_filename][i] ) {
            return i;
        }
    }    
    return -1;
}

function is_on_bounding_box_corner(x, y, tolerance) {
    var cx0, cy0, cx1, cy1;
    var bounding_box_edge = [-1, -1]; // bounding_box_id, corner_id [top-left=1,top-right=2,bottom-right=3,bottom-left=4]
    
    for (var i=0; i<bounding_box_count; ++i) {
	dx0 = Math.abs( canvas_x0[current_image_filename][i] - x );
	dy0 = Math.abs( canvas_y0[current_image_filename][i] - y );
	dx1 = Math.abs( canvas_x1[current_image_filename][i] - x );
	dy1 = Math.abs( canvas_y1[current_image_filename][i] - y );
	
	bounding_box_edge[0] = i;
        if ( dx0 < tolerance && dy0 < tolerance ) {
	    bounding_box_edge[1] = 1;
	    return bounding_box_edge;
	} else {
	    if ( dx1 < tolerance && dy0 < tolerance ) {
		bounding_box_edge[1] = 2;
		return bounding_box_edge;
	    } else {
		if ( dx1 < tolerance && dy1 < tolerance ) {
		    bounding_box_edge[1] = 3;
		    return bounding_box_edge;
		} else {
		    if ( dx0 < tolerance && dy1 < tolerance ) {
			bounding_box_edge[1] = 4;
			return bounding_box_edge;
		    }
		}
	    }
	}
    }
    return bounding_box_edge;
}

function annotate_bounding_box(bounding_box_id) {
    var w = x1[current_image_filename][bounding_box_id] - x0[current_image_filename][bounding_box_id];
    var canvas_origin_x0 = image_canvas.getBoundingClientRect().left;
    var canvas_origin_y0 = image_canvas.getBoundingClientRect().top;
    var annotation_textbox_y = canvas_origin_y0 + canvas_y0[current_image_filename][bounding_box_id];
    var annotation_textbox_x = canvas_origin_x0 + canvas_x0[current_image_filename][bounding_box_id];

    annotation_textbox.style.position = "fixed";
    annotation_textbox.style.top = annotation_textbox_y.toString() + "px";
    annotation_textbox.style.left = annotation_textbox_x.toString() + "px";
    annotation_textbox.style.opacity = 0.5;
    annotation_textbox.value = annotations[current_image_filename][bounding_box_id];
    annotation_textbox.style.visibility = "visible";
    annotation_textbox.style.width = Math.min(canvas_width/4, w - w/4).toString() + "px";
    annotation_textbox.style.height = "1.5em";
    annotation_textbox.focus();
}

window.addEventListener("keydown", function(e) {
    if ( e.which == 13 ) { // Enter
        // when user presses Enter key, enter bounding box annotation mode
        if ( !user_entering_annotation && bounding_box_count > 0 ) {
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
                // Enter key pressed after user updates annotations in textbox
                annotations[current_image_filename][current_annotation_bounding_box_id] = annotation_textbox.value;
                annotation_count = annotation_count + 1;
                annotation_textbox.value = "";
                annotation_textbox.style.visibility = "hidden";
                redraw_image_canvas();

                if ( bounding_box_count > 1 && (current_annotation_bounding_box_id != (bounding_box_count-1)) ) {
                    // move to next bounding box
                    current_annotation_bounding_box_id = current_annotation_bounding_box_id + 1;
                    user_entering_annotation = true;
                    annotate_bounding_box(current_annotation_bounding_box_id);
                } else {
                    // exist bounding box annotation mode
                    user_entering_annotation = false;
                    annotation_textbox.style.visibility = "hidden";
                    current_annotation_bounding_box_id = -1;
                }

                show_status(current_image_filename +
                            " | " + bounding_box_count + " boxes and " + annotation_count + " annotations" +
                            " | Press <span style='color:red;'>Enter</span> key to annotate, <span style='color:red'>Arrow keys</span> to move to next image.", false);
            }
        }
        e.preventDefault();
    }
    if ( e.which == 27 ) { // Esc
        // exit bounding box annotation model
        annotation_textbox.style.visibility = "hidden";
        current_annotation_bounding_box_id = -1;
        user_entering_annotation = false;
        redraw_image_canvas();
    }
    if ( e.which == 39 ) { // right arrow
        move_to_next_image();
    }
    if ( e.which == 37 ) { // left arrow
        move_to_prev_image();
    }
    if ( e.which == 121 ) { // F10 key used for debugging
        print_current_annotations();
    }
});

function move_to_prev_image() {
    if ( user_uploaded_images != null ) {
        if ( user_entering_annotation) {
            user_entering_annotation = false;
            annotation_textbox.style.visibility = "hidden";
            current_annotation_bounding_box_id = -1;
        }
        image_canvas.style.display = "none";
        image_context.clearRect(0, 0, image_canvas.width, image_canvas.height);
        
        if ( current_image_index == 0 ) {
            load_local_file(user_uploaded_images.length - 1);
        } else {
            load_local_file(current_image_index - 1);
        }
    }    
}

function move_to_next_image() {
    if ( user_uploaded_images != null ) {

        if ( user_entering_annotation) {
            user_entering_annotation = false;
            annotation_textbox.style.visibility = "hidden";
            current_annotation_bounding_box_id = -1;
        }
        image_canvas.style.display = "none";

        image_context.clearRect(0, 0, image_canvas.width, image_canvas.height);
        if ( current_image_index == (user_uploaded_images.length - 1) ) {
            load_local_file(0);
        } else {
            load_local_file(current_image_index + 1);
        }
    }
}

function show_status(msg, append) {
    if(append)
        status_bar.innerHTML = status_bar.innerHTML + status_prefix + msg;
    else
        status_bar.innerHTML = status_prefix + msg;
}

function print_current_annotations() {    
    for ( var i=0; i<image_filename_list.length; ++i) {
        var fn = image_filename_list[i];
        
        var logstr = "Showing annotations for file [" + fn + "] : ";
        logstr = logstr + "scale_factor=" + scale_factor[fn] + ", ";
        
        logstr = logstr + "x0/canvas_x0=[";
        for (var j=0; j<x0[fn].length; ++j) {
            logstr = logstr + Math.round(x0[fn][j]) + "/" + Math.round(canvas_x0[fn][j]) + ","
        }
        logstr = logstr + "] ";

        logstr = logstr + "y0=[";
        for (var j=0; j<y0[fn].length; ++j) {
            logstr = logstr + Math.round(y0[fn][j]) + "/" + Math.round(canvas_y0[fn][j]) + ","
        }
        logstr = logstr + "] ";
        
        logstr = logstr + "x1=[";
        for (var j=0; j<x1[fn].length; ++j) {
            logstr = logstr + Math.round(x1[fn][j]) + "/" + Math.round(canvas_x1[fn][j]) + ","
        }
        logstr = logstr + "] ";

        logstr = logstr + "y1=[";
        for (var j=0; j<y1[fn].length; ++j) {
            logstr = logstr + Math.round(y1[fn][j]) + "/" + Math.round(canvas_y1[fn][j]) + ","
        }
        logstr = logstr + "] ";
        
        logstr = logstr + "annotations=[";
        for (var j=0; j<annotations[fn].length; ++j) {
            logstr = logstr + annotations[fn][j] + ","
        }
        logstr = logstr + "]";
        
        console.log(logstr);
    }
}
