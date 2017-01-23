/*
  VGG Image Annotator (via)
  www.robots.ox.ac.uk/~vgg/software/via/
  
  Copyright (c) 2016, Abhishek Dutta.
  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

  Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.
  Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.
  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
  POSSIBILITY OF SUCH DAMAGE.
*/

var VIA_VERSION = '0.1';
var VIA_NAME = 'VGG Image Annotator';
var VIA_SHORT_NAME = 'VIA';
var VIA_REGION_SHAPE = { RECT:'rect',
                         CIRCLE:'circle',
                         ELLIPSE:'ellipse',
                         POLYGON:'polygon',
			 POINT:'point'};

var VIA_REGION_EDGE_TOL = 5;
var VIA_REGION_POINT_RADIUS = 3;  // in pixel
var VIA_POLYGON_VERTEX_MATCH_TOL = 5;
var VIA_REGION_MIN_DIM = 3;     // in pixel
var VIA_MOUSE_CLICK_TOL = 2;    // in pixel
var VIA_ELLIPSE_EDGE_TOL = 0.2;
var VIA_THETA_TOL = Math.PI/18; // 10 degrees
var POLYGON_RESIZE_VERTEX_OFFSET = 100;
var VIA_CANVAS_ZOOM_LEVELS = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5];
var VIA_CANVAS_DEFAULT_ZOOM_LEVEL_INDEX = 3;
var VIA_ATTR_PANEL_FONT_SIZE_LEVELS = ['xx-small', 'x-small', 'small',
                                       'medium', 'large', 'x-large', 'xx-large'];

var VIA_THEME_REGION_BOUNDARY_WIDTH = 4;
var VIA_THEME_BOUNDARY_LINE_COLOR = "#1a1a1a";
var VIA_THEME_BOUNDARY_FILL_COLOR = "#aaeeff";
var VIA_THEME_SEL_REGION_FILL_COLOR = "#808080";
var VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR = "#000000";
var VIA_THEME_SEL_REGION_OPACITY = 0.5;
var VIA_THEME_MESSAGE_TIMEOUT_MS = 2500;
var VIA_THEME_ATTRIBUTE_DISP_MIN_CHARS = 'ABCDEF'; // 6 characters
var VIA_THEME_ATTRIBUTE_VALUE_FONT = '10pt Sans';

var VIA_IMPORT_CSV_COMMENT_CHAR = '#';
var VIA_IMPORT_CSV_KEYVAL_SEP_CHAR = '\\;';
var VIA_EXPORT_CSV_ARRAY_SEP_CHAR = ':';
var VIA_CSV_SEP_CHAR = ',';
var VIA_EXPORT_DOUBLE_QUOTE_REPLACEMENT = "\\'";

var _via_img_metadata = {};   // data structure to store loaded images metadata
var _via_img_count = 0;       // count of the loaded images
var _via_canvas_regions = []; // image regions spec. in canvas space
var _via_canvas_scale = 1.0;  // current scale of canvas image

var _via_image_id_list = [];  // array of image id (in original order)
var _via_image_id = '';       // id={filename+length} of current image
var _via_image_index = -1;    // index 

var _via_current_image_filename;
var _via_current_image;

// image canvas
var _via_img_canvas = document.getElementById("image_canvas");
var _via_img_ctx = _via_img_canvas.getContext("2d");
var _via_reg_canvas = document.getElementById("region_canvas");
var _via_reg_ctx = _via_reg_canvas.getContext("2d");

var _via_canvas_width, _via_canvas_height;

// canvas zoom
var _via_canvas_zoom_level_index = VIA_CANVAS_DEFAULT_ZOOM_LEVEL_INDEX; // 1.0
var _via_canvas_scale_without_zoom = 1.0;

// state of the application
var _via_is_user_drawing_region = false;
var _via_current_image_loaded = false;
var _via_is_window_resized = false;
var _via_is_user_resizing_region = false;
var _via_is_user_moving_region = false;
var _via_is_user_drawing_polygon = false;
var _via_is_region_selected = false;
var _via_is_all_region_selected = false;
var _via_is_user_updating_attribute_name = false;
var _via_is_user_updating_attribute_value = false;
var _via_is_user_adding_attribute_name = false;
var _via_is_loaded_img_list_visible = false;
var _via_is_bottom_panel_visible = false;
var _via_is_reg_attr_panel_visible = false;
var _via_is_file_attr_panel_visible = false;
var _via_is_canvas_zoomed = false;
var _via_is_loading_current_image = false;
var _via_is_region_id_visible = true;
var _via_is_region_boundary_visible = true;

// region
var _via_current_shape = VIA_REGION_SHAPE.RECT;
var _via_current_polygon_region_id = -1;
var _via_user_sel_region_id = -1;
var _via_click_x0 = 0; var _via_click_y0 = 0;
var _via_click_x1 = 0; var _via_click_y1 = 0;
var _via_region_edge = [-1, -1];
var _via_region_click_x, _via_region_click_y;
var _via_copied_image_regions = [];
var _via_copied_canvas_regions = [];

// message
var _via_message_clear_timer;

// attributes
var _via_region_attributes = new Set();
var _via_current_update_attribute_name = "";
var _via_current_update_region_id = -1;
var _via_file_attributes = new Set();
var _via_visible_attr_name = '';
var _via_attr_panel_size_index = 3;

// persistence to local storage
var _via_is_local_storage_available = false;
var _via_is_save_ongoing = false;

// image list
var _via_reload_img_table = true;
var _via_loaded_img_fn_list = [];
var _via_loaded_img_region_attr_miss_count = [];
var _via_loaded_img_file_attr_miss_count = [];
var _via_loaded_img_table_html = [];


// UI html elements
var invisible_file_input = document.getElementById("invisible_file_input");

var about_panel = document.getElementById("about_panel");
var via_start_info_panel = document.getElementById("via_start_info_panel");
var getting_started_panel = document.getElementById("getting_started_panel");
var image_panel = document.getElementById("image_panel");
var ui_top_panel = document.getElementById("ui_top_panel");
var canvas_panel = document.getElementById("canvas_panel");

var annotation_list_snippet = document.getElementById("annotation_list_snippet");
var annotation_textarea = document.getElementById("annotation_textarea");    

var loaded_img_list_panel = document.getElementById('loaded_img_list_panel');
var bottom_panel = document.getElementById('bottom_panel');

var BBOX_LINE_WIDTH = 4;
var BBOX_BOUNDARY_FILL_COLOR_ANNOTATED = "#f2f2f2";
var BBOX_BOUNDARY_FILL_COLOR_NEW = "#aaeeff";
var BBOX_BOUNDARY_LINE_COLOR = "#1a1a1a";
var BBOX_SELECTED_FILL_COLOR = "#ffffff";
var BBOX_SELECTED_OPACITY = 0.3;

// debug support
var _via_debug_window;
var _via_is_debug_window_visible = false;
var _via_debug_window_features = 'menubar=yes,location=no,resizable=yes,scrollbars=yes,status=yes,width=800,height=600';

function ImageMetadata(fileref, filename, size) {
    this.filename = filename;
    this.size = size;
    this.fileref = fileref;
    this.file_attributes = new Map(); // image attributes
    this.base64_img_data = '';       // image data stored as base 64
    this.regions = [];
}

function ImageRegion() {
    this.is_user_selected = false;
    this.shape_attributes = new Map();  // region shape attributes
    this.region_attributes = new Map(); // region attributes
}

function clone_image_region(r0) {
    var r1 = new ImageRegion();
    r1.is_user_selected = r0.is_user_selected;

    // copy shape attributes
    for ( var key of r0.shape_attributes.keys() ) {
	var value = r0.shape_attributes.get(key);
	r1.shape_attributes.set(key, value);
    }

    // copy region attributes
    for ( var key of r0.region_attributes.keys() ) {
	var value = r0.region_attributes.get(key);
	r1.region_attributes.set(key, value);
    }
    return r1;
}

function _via_get_image_id(filename, size) {
    if (typeof(size) === 'undefined') {
	return filename;
    } else {
	return filename + size;
    }
}

function _via_init() {
    console.log(VIA_NAME);
    show_message(VIA_NAME + ' (' + VIA_SHORT_NAME + ') version ' + VIA_VERSION + '. Ready !', 2*VIA_THEME_MESSAGE_TIMEOUT_MS);

    show_home_panel();

    _via_is_local_storage_available = check_local_storage();
    if (_via_is_local_storage_available) {
	if (is_via_data_in_localStorage()) {
	    show_localStorage_recovery_options();
	}
    }
    if (typeof start_demo_session === 'function') {
	start_demo_session();
    }
    
    if (typeof _via_load_submodules === 'function') {
	_via_load_submodules();
    }
}

// to be implemented by submodules
//function _via_load_submodules() {}

//
// Handlers for top navigation bar
//
function show_home_panel() {
    if (_via_current_image_loaded) {
	canvas_panel.style.display = "block";
	via_start_info_panel.style.display = "none";
	about_panel.style.display = "none";
	getting_started_panel.style.display = "none";	
    } else {
	via_start_info_panel.innerHTML = '<p>To begin the image annotation process, click <a title="Load images" style="cursor: pointer; color: blue;" onclick="sel_local_images()">Load or Add Images</a> in the Image menu.</p>';
	via_start_info_panel.style.display = "block";
	about_panel.style.display = "none";
	canvas_panel.style.display = "none";
	getting_started_panel.style.display = "none";	
    }
}
function sel_local_images() {
    // source: https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications
    if (invisible_file_input) {
	invisible_file_input.accept='.jpg,.jpeg,.png,.bmp';
	invisible_file_input.onchange = store_local_img_ref;
	invisible_file_input.click();
    }
}
function download_all_region_data(type) {
    var all_region_data = package_region_data(type);
    var all_region_data_blob = new Blob(all_region_data, {type: 'text/'+type+';charset=utf-8'});

    if ( all_region_data_blob.size > (2*1024*1024) &&
	 type == 'csv' ) {
	show_message('CSV file size is ' + (all_region_data_blob.size/(1024*1024)) + ' MB. We advise you to instead download as JSON');
    } else {
	save_data_to_local_file(all_region_data_blob, 'via_region_data.'+type);
    }
}

function sel_local_data_file(type) {
    if (invisible_file_input) {
	invisible_file_input.accept='.csv,.json';
	switch(type) {
	case 'annotations':
	    invisible_file_input.onchange = import_annotations_from_file;
	    break;
	case 'attributes':
	    invisible_file_input.onchange = import_attributes_from_file;
	    break;
	default:
	    return;
	}
	invisible_file_input.click();
    }
}
function save_attributes() {
    if ( _via_region_attributes.size > 0 ) {
	var attr_csvdata = [];
	for (var attribute of _via_region_attributes) {
	    attr_csvdata.push(attribute);
	}
	var attr_blob = new Blob([attr_csvdata.join(',')], {type: 'text/csv;charset=utf-8'});
	save_data_to_local_file(attr_blob, 'via_attributes_data.csv');
    } else {
	show_message("Attributes not defined yet!");
    }
}
function import_attributes() {
    if (_via_current_image_loaded) {
	if (invisible_file_input) {
	    invisible_file_input.accept='.csv,.json';
	    invisible_file_input.onchange = import_region_attributes_from_file;
	    invisible_file_input.click();
	}
    } else {
	show_message("Please load some images first");
    }
}
function show_about_panel() {
    about_panel.style.display = "block";
    canvas_panel.style.display = "none";
    via_start_info_panel.style.display = "none";
    getting_started_panel.style.display = "none";
}
function show_getting_started_panel() {
    getting_started_panel.style.display = "block";
    about_panel.style.display = "none";    
    canvas_panel.style.display = "none";
    via_start_info_panel.style.display = "none";
}

//
// Local file uploaders
//
function store_local_img_ref(event) {
    var user_selected_images = event.target.files;
    var original_image_count = _via_img_count;

    // clear browser cache if user chooses to load new images
    if (original_image_count == 0) {
	localStorage.clear();
    }

    var discarded_file_count = 0;
    for ( var i=0; i<user_selected_images.length; ++i) {
	if (user_selected_images[i].type.includes('image/')) {
	    var filename = user_selected_images[i].name;
	    var size = user_selected_images[i].size;
	    var img_id = _via_get_image_id(filename, size);

	    if (_via_img_metadata.hasOwnProperty(img_id)) {
		if (_via_img_metadata[img_id].fileref) {
		    show_message('Image ' + filename + ' already loaded. Skipping!');
		} else {
		    _via_img_metadata[img_id].fileref = user_selected_images[i];
		    show_message('Regions already exist for file ' + filename + ' !');
		}
	    } else {
		_via_img_metadata[img_id] = new ImageMetadata(user_selected_images[i],
							      filename,
							      size);
		_via_image_id_list.push(img_id);
		_via_img_count += 1;
		_via_reload_img_table = true;
	    }
	} else {
	    discarded_file_count += 1;
	}
    }

    if ( _via_img_metadata ) {
	var status_msg = 'Loaded ' + (_via_img_count - original_image_count) + ' images.';
	if (discarded_file_count) {
	    status_msg += ' ( Discarded ' + discarded_file_count + ' non-image files! )';
	}
	show_message(status_msg);

	if (_via_image_index == -1) {
	    show_image(0);
	} else {
	    show_image( original_image_count );
	}
    } else {
	show_message("Please upload some image files!");
    }
}

//
// Data Importer
//

function import_region_attributes_from_file(event) {
    var selected_files = event.target.files;
    for (var i=0; i<selected_files.length; ++i) {
	var file = selected_files[i];
	switch(file.type) {
	case 'text/csv':
	    load_text_file(file, import_region_attributes_from_csv);
	    break;
	}
    }
}

function import_region_attributes_from_csv(data) {
    data = data.replace(/\n/g, ''); // discard newline \n
    var csvdata = data.split(',');
    var attributes_import_count = 0;
    for (var i=0; i<csvdata.length; ++i) {
	if ( !_via_region_attributes.has(csvdata[i]) ) {
	    _via_region_attributes.add(csvdata[i]);
	    attributes_import_count += 1;
	}
    }

    _via_reload_img_table = true;
    show_message('Imported ' + attributes_import_count + ' attributes from CSV file');
    save_current_data_to_browser_cache();
}

function import_annotations_from_file(event) {
    var selected_files = event.target.files;

    for (var file of selected_files) {
	_via_debug('import_annotations_from_file() : file type = ' + file.type);
	switch(file.type) {
	case 'text/plain':
	case 'text/csv':
	    load_text_file(file, import_annotations_from_csv);
	    break;
	case 'text/json':
	case 'application/json':
	    load_text_file(file, import_annotations_from_json);
	    break;
	}
    }
}
function import_annotations_from_csv(data) {
    var region_import_count = 0;
    var file_attr_count = 0;
    var image_count = 0;

    try {
	var csvdata = data.split('\n');
	for (var i=0; i<csvdata.length; ++i) {
	    _via_debug('  > ' + csvdata[i]);
	    // ignore blank lines
	    if (csvdata[i].charAt(0) == '\n' ||
		csvdata[i].charAt(0) == '') {
		continue;
	    }

	    if (csvdata[i].charAt(0) == VIA_IMPORT_CSV_COMMENT_CHAR) {
		// parse header
		// #filename,file_size,file_attributes,region_count,region_id,region_shape_attributes,region_attributes
		var d = csvdata[i].substring(1, csvdata[i].length); // remove #
		d = d.split(',');
		var filename_index, size_index, file_attr_index, region_shape_attr_index
		for ( var j=0; j<d.length; ++j) {
		    switch ( d[j] ) {
		    case 'filename':
			filename_index = j;
			break;
		    case 'file_size':
			size_index = j;
			break;
		    case 'file_attributes':
			file_attr_index = j;
			break;
		    case 'region_shape_attributes':
			region_shape_attr_index = j;
			break;
		    case 'region_attributes':
			region_attr_index = j;
			break;
		    }
		}
		continue;
	    } else {
		// ignore comma inside double quotations
		var d = csvdata[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

		var filename = d[filename_index];
		var size = d[size_index];
		var image_id = _via_get_image_id(filename, size);
		if ( _via_img_metadata.hasOwnProperty(image_id) ) {
		    image_count += 1;

		    // copy file attributes
		    if ( d[file_attr_index] != '' ||
			 d[file_attr_index] != '""') {
			var file_attr_str = d[file_attr_index];

			var attr_map = keyval_str_to_map( file_attr_str );
			for( var key of attr_map.keys() ) {
			    var val = attr_map.get(key);
			    _via_img_metadata[image_id].file_attributes.set(key, val);

			    if (!_via_file_attributes.has(key)) {
				_via_file_attributes.add(key);
			    }
			    file_attr_count += 1;
			}
		    }

		    var regioni = new ImageRegion();
		    // copy regions shape attributes
		    if ( d[region_shape_attr_index] != '""' ||
			 d[region_shape_attr_index] != '' ) {
			var region_str = d[region_shape_attr_index];
			var attr_map = keyval_str_to_map( region_str );

			for ( var key of attr_map.keys() ) {
			    var val = attr_map.get(key);
			    if ( key == 'all_points_x' ||
				 key == 'all_points_y' ) {
				val = val.substring(1, val.length-1); // discard the square brackets []
				var valdata = val.split(VIA_EXPORT_CSV_ARRAY_SEP_CHAR);
				var val_as_array = [];
				for (var j=0; j<valdata.length; ++j) {
				    val_as_array.push( parseInt(valdata[j]) );
				}
				regioni.shape_attributes.set(key, val_as_array);
			    } else {
				regioni.shape_attributes.set(key, val);
			    }
			}
		    }

		    // copy region attributes
		    if ( d[region_attr_index] != '""' ||
			 d[region_attr_index] != '' ) {
			var region_attr = d[region_attr_index];
			var region_attr_map = keyval_str_to_map( region_attr );

			for ( var key of region_attr_map.keys() ) {
			    var val = region_attr_map.get(key);
			    var v0 = val;
			    regioni.region_attributes.set(key, val);

			    if (!_via_region_attributes.has(key)) {
				_via_region_attributes.add(key);
			    }
			}
		    }

		    // add regions only if they are present         
		    if (regioni.shape_attributes.size > 0 ||
			regioni.region_attributes.size >0 ) {
			_via_img_metadata[image_id].regions.push(regioni);
			region_import_count += 1;
		    }
		}
	    }
	}
    }
    catch(e) {
	_via_debug('Exception in import_annotations_from_csv() : ' + e);
    }
    show_message('Imported [' + region_import_count + '] regions ' +
		 'and [' + file_attr_count + '] file attributes from ' +
		 image_count + ' lines in CSV file');

    _via_reload_img_table = true;
    show_image(_via_image_index);
    save_current_data_to_browser_cache();
}

function import_annotations_from_json(data) {
    var d = JSON.parse(data);

    var image_count = 0;
    var region_import_count = 0;
    var file_attr_count = 0;
    var skipped_file_attr_count = 0;
    for (image_id in d) {
	if ( _via_img_metadata.hasOwnProperty(image_id) ) {
	    image_count += 1;

	    // copy image attributes
	    for (var key in d[image_id].file_attributes) {
		if (!_via_img_metadata[image_id].file_attributes.get(key)) {
		    _via_img_metadata[image_id].file_attributes.set(key,
								    d[image_id].file_attributes[key]);
		    file_attr_count += 1;
		}
		if (!_via_file_attributes.has(key)) {
		    _via_file_attributes.add(key);
		}
	    }

	    // copy regions
	    var regions = d[image_id].regions;
	    for (var i in regions) {
		var regioni = new ImageRegion();
		for (var key in regions[i].shape_attributes) {
		    regioni.shape_attributes.set(key, regions[i].shape_attributes[key]);
		}
		for (var key in regions[i].region_attributes) {
		    regioni.region_attributes.set(key, regions[i].region_attributes[key]);

		    if (!_via_region_attributes.has(key)) {
			_via_region_attributes.add(key);
		    }
		}

		// add regions only if they are present
		if (regioni.shape_attributes.size > 0 ||
		    regioni.region_attributes.size > 0 ) {
		    _via_img_metadata[image_id].regions.push(regioni);
		    region_import_count += 1;
		}
	    }
	}
    }

    show_message('Imported [' + region_import_count + '] regions and [' + file_attr_count + '] file attributes for ' + image_count + ' images from JSON file', VIA_THEME_MESSAGE_TIMEOUT_MS);

    _via_reload_img_table = true;
    show_image(_via_image_index);
}

// key1=val1\;key2=val2\;...
function keyval_str_to_map(keyval_str) {
    // remove all double quotations
    keyval_str = keyval_str.replace(/["]+/g, '')

    var keyval_map = new Map();
    var d = keyval_str.split(VIA_IMPORT_CSV_KEYVAL_SEP_CHAR);    
    for (var i=0; i<d.length; ++i) {
	var keyval = d[i].split('=');
	if ( keyval.length == 2 ) {
	    keyval_map.set(keyval[0], keyval[1]);
	} else {
	    show_message('Skipping malformed values in the imported file');
	}
    }
    return keyval_map;
}

function load_text_file(text_file, callback_function) {
    if (!text_file) {
	return;
    } else {
	text_reader = new FileReader();
	text_reader.addEventListener( "progress", function(e) {
	    show_message("Loading data from text file : " + text_file.name + " ... ");
	}, false);

	text_reader.addEventListener( "error", function() {
	    show_message("Error loading data from text file :  " + text_file.name + " !");
	    callback_function('');
	}, false);

	text_reader.addEventListener( "load", function() {
	    callback_function(text_reader.result);
	}, false);
	text_reader.readAsText(text_file);
    }
}

//
// Data Exporter
//
function package_region_data(return_type) {
    if( return_type == "csv" ) {
	var csvdata = [];
	var csvheader = "#filename,file_size,file_attributes,region_count,region_id,region_shape_attributes,region_attributes";
	csvdata.push(csvheader);

	for ( var image_id in _via_img_metadata ) {
	    var prefix_str = _via_img_metadata[image_id].filename;
	    prefix_str += "," + _via_img_metadata[image_id].size;
	    prefix_str += "," + attr_map_to_str( _via_img_metadata[image_id].file_attributes );

	    var regions = _via_img_metadata[image_id].regions;

	    if (regions.length !=0) {
		for (var i=0; i<regions.length; ++i) {
		    var region_shape_attr_str = regions.length + ',' + i + ',';
		    region_shape_attr_str += attr_map_to_str( regions[i].shape_attributes );

		    var region_attr_str = attr_map_to_str( regions[i].region_attributes );

		    csvdata.push('\n' + prefix_str + ',' + region_shape_attr_str + ',' + region_attr_str);
		}
	    } else {
		csvdata.push('\n' + prefix_str + ',0,0,"",""');
	    }
	}
	return csvdata;
    } else {
	// JSON.stringify() does not work with Map()
	// hence, we cast everything as objects
	var _via_img_metadata_as_obj = {};
	for (image_id in _via_img_metadata) {
	    var image_data = {};
	    //image_data.fileref = _via_img_metadata[image_id].fileref;
	    image_data.fileref = '';
	    image_data.size = _via_img_metadata[image_id].size;
	    image_data.filename = _via_img_metadata[image_id].filename;
	    image_data.base64_img_data = '';
	    //image_data.base64_img_data = _via_img_metadata[image_id].base64_img_data;

	    // copy file attributes
	    image_data.file_attributes = {};    
	    for ( var key of _via_img_metadata[image_id].file_attributes.keys() ) {
		var value = _via_img_metadata[image_id].file_attributes.get(key);
		image_data.file_attributes[key] = value;
	    }

	    // copy all region shape_attributes
	    image_data.regions = {};
	    for (var i=0; i<_via_img_metadata[image_id].regions.length; ++i) {
		image_data.regions[i] = {};
		image_data.regions[i].shape_attributes = {};
		image_data.regions[i].region_attributes = {};
		// copy region shape_attributes
		for ( var key of _via_img_metadata[image_id].regions[i].shape_attributes.keys()) {
		    var value = _via_img_metadata[image_id].regions[i].shape_attributes.get(key);
		    image_data.regions[i].shape_attributes[key] = value;
		}
		// copy region_attributes
		for ( var key of _via_img_metadata[image_id].regions[i].region_attributes.keys()) {
		    var value = _via_img_metadata[image_id].regions[i].region_attributes.get(key);
		    image_data.regions[i].region_attributes[key] = value;
		}
	    }           
	    _via_img_metadata_as_obj[image_id] = image_data;
	}
	return [JSON.stringify(_via_img_metadata_as_obj)];
    }    
}

function attr_map_to_str(attr) {
    var attr_map_str = [];
    for( var key of attr.keys() ) {
	var value = attr.get(key);
	if ( Array.isArray(value) ) {
	    var value_str='[' + value[0];
	    for (var i=1; i<value.length; ++i) {
		value_str += VIA_EXPORT_CSV_ARRAY_SEP_CHAR + value[i];
	    }
	    value_str += ']';
	    attr_map_str.push(key + '=' + value_str);
	} else {
	    attr_map_str.push(key + '=' + value);
	}
    }
    var str_val = '"' + attr_map_str.join(VIA_IMPORT_CSV_KEYVAL_SEP_CHAR) + '"';
    return str_val;
}

function save_data_to_local_file(data, filename) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(data);
    a.target = '_blank';
    a.download = filename;

    // simulate a mouse click event
    var event = new MouseEvent('click', {
	view: window,
	bubbles: true,
	cancelable: true
    });

    a.dispatchEvent(event);
}

//
// Setup Elements in User Interface
//
function show_image(image_index) {
    if (_via_is_loading_current_image) {
	return;
    }

    var img_id = _via_image_id_list[image_index]
    if (_via_img_metadata.hasOwnProperty(img_id)) {
	var img_filename = _via_img_metadata[img_id].filename;
	var img_reader = new FileReader();
	_via_is_loading_current_image = true;

	img_reader.addEventListener( "loadstart", function(e) {
	    document.getElementById("fileinfo").innerHTML = '<strong>Loading image ...</strong>';
	}, false);

	img_reader.addEventListener( "progress", function(e) {
	}, false);

	img_reader.addEventListener( "error", function() {
	    _via_is_loading_current_image = false;
	    document.getElementById("fileinfo").innerHTML = '<strong>Error loading image !</strong>';
	    show_message("Error loading image " + img_filename + " !");
	}, false);

	img_reader.addEventListener( "abort", function() {
	    _via_is_loading_current_image = false;
	    document.getElementById("fileinfo").innerHTML = '<strong>Image loading aborted !</strong>';
	    show_message("Aborted loading image " + img_filename + " !");
	}, false);

	img_reader.addEventListener( "load", function() {
	    _via_current_image = new Image();

	    _via_current_image.addEventListener( "error", function() {
		_via_is_loading_current_image = false;
		document.getElementById("fileinfo").innerHTML = '<strong>Error loading image !</strong>';
		show_message("Error loading image " + img_filename + " !");
	    }, false);

	    _via_current_image.addEventListener( "abort", function() {
		_via_is_loading_current_image = false;
		document.getElementById("fileinfo").innerHTML = '<strong>Image loading aborted !</strong>';
		show_message("Aborted loading image " + img_filename + " !");
	    }, false);

	    _via_current_image.addEventListener( "load", function() {
		// update the current state of application
		_via_image_id = img_id;
		_via_image_index = image_index;
		_via_current_image_filename = img_filename;
		_via_current_image_loaded = true;
		_via_is_loading_current_image = false;                
		_via_click_x0 = 0; _via_click_y0 = 0;
		_via_click_x1 = 0; _via_click_y1 = 0;
		_via_is_user_drawing_region = false;
		_via_is_window_resized = false;
		_via_is_user_resizing_region = false;
		_via_is_user_moving_region = false;
		_via_is_user_drawing_polygon = false;
		_via_is_region_selected = false;
		_via_user_sel_region_id = -1;

		// set the size of canvas
		// based on the current dimension of browser window
		canvas_panel_width = document.documentElement.clientWidth - 230;
		canvas_panel_height = document.documentElement.clientHeight - 2*ui_top_panel.offsetHeight;               
		_via_canvas_width = _via_current_image.naturalWidth;
		_via_canvas_height = _via_current_image.naturalHeight;
		var scale_width, scale_height;
		if ( _via_canvas_width > canvas_panel_width ) {
		    // resize image to match the panel width
		    var scale_width = canvas_panel_width / _via_current_image.naturalWidth;
		    _via_canvas_width = canvas_panel_width;
		    _via_canvas_height = _via_current_image.naturalHeight * scale_width;
		}
		if ( _via_canvas_height > canvas_panel_height ) {
		    // resize further image if its height is larger than the image panel
		    var scale_height = canvas_panel_height / _via_canvas_height;
		    _via_canvas_height = canvas_panel_height;
		    _via_canvas_width = _via_canvas_width * scale_height;
		}
		_via_canvas_width = Math.round(_via_canvas_width);
		_via_canvas_height = Math.round(_via_canvas_height);
		_via_canvas_scale = _via_current_image.naturalWidth / _via_canvas_width;
		_via_canvas_scale_without_zoom = _via_canvas_scale;
		set_all_canvas_size(_via_canvas_width, _via_canvas_height);
		//set_all_canvas_scale(_via_canvas_scale_without_zoom);

		// ensure that all the canvas are visible
		clear_image_display_area();
		show_all_canvas();

		// we only need to draw the image once in the image_canvas
		_via_img_ctx.clearRect(0, 0, _via_canvas_width, _via_canvas_height);
		_via_img_ctx.drawImage(_via_current_image, 0, 0,
				       _via_canvas_width, _via_canvas_height);

		// update the UI components to reflect newly loaded image
		// refresh the image list
		// @todo: let the height of image list match that of window
		_via_reload_img_table = true;
		var img_list_height = document.documentElement.clientHeight/2 + 'px';
		img_list_panel.setAttribute('style', 'height: ' + img_list_height);
		if (_via_is_loaded_img_list_visible) {
		    show_img_list();
		}

		// refresh the attributes panel
		update_attributes_panel();

		_via_load_canvas_regions(); // image to canvas space transform
		_via_redraw_reg_canvas();
		_via_reg_canvas.focus();

		// update the info panel
		show_filename_info();

		// for DEBUG, remove
		//toggle_reg_attr_panel();
	    });
	    _via_current_image.src = img_reader.result;
	}, false);

	if (_via_img_metadata[img_id].base64_img_data == '') {
	    // load image from file
	    img_reader.readAsDataURL( _via_img_metadata[img_id].fileref );
	} else {
	    // load image from bae64 data
	    img_reader.readAsText( new Blob([_via_img_metadata[img_id].base64_img_data]) );
	}
    }
}

// transform regions in image space to canvas space
function _via_load_canvas_regions() {
    // load all existing annotations into _via_canvas_regions
    var regions = _via_img_metadata[_via_image_id].regions;
    _via_canvas_regions  = [];
    for ( var i=0; i<regions.length; ++i) {
	var regioni = new ImageRegion();
	for ( var key of regions[i].shape_attributes.keys() ) {
	    var value = regions[i].shape_attributes.get(key);
	    regioni.shape_attributes.set(key, value);
	}
	_via_canvas_regions.push(regioni);

	switch(_via_canvas_regions[i].shape_attributes.get('name')) {
	case VIA_REGION_SHAPE.RECT:
	    var x = regions[i].shape_attributes.get('x') / _via_canvas_scale;
	    var y = regions[i].shape_attributes.get('y') / _via_canvas_scale;
	    var width = regions[i].shape_attributes.get('width') / _via_canvas_scale;
	    var height = regions[i].shape_attributes.get('height') / _via_canvas_scale;

	    _via_canvas_regions[i].shape_attributes.set('x', Math.round(x));
	    _via_canvas_regions[i].shape_attributes.set('y', Math.round(y));
	    _via_canvas_regions[i].shape_attributes.set('width', Math.round(width));
	    _via_canvas_regions[i].shape_attributes.set('height', Math.round(height));
	    break;

	case VIA_REGION_SHAPE.CIRCLE:
	    var cx = _via_canvas_regions[i].shape_attributes.get('cx') / _via_canvas_scale;
	    var cy = _via_canvas_regions[i].shape_attributes.get('cy') / _via_canvas_scale;
	    var r = _via_canvas_regions[i].shape_attributes.get('r') / _via_canvas_scale;
	    _via_canvas_regions[i].shape_attributes.set('cx', Math.round(cx));
	    _via_canvas_regions[i].shape_attributes.set('cy', Math.round(cy));
	    _via_canvas_regions[i].shape_attributes.set('r', Math.round(r));
	    break;

	case VIA_REGION_SHAPE.ELLIPSE:
	    var cx = _via_canvas_regions[i].shape_attributes.get('cx') / _via_canvas_scale;
	    var cy = _via_canvas_regions[i].shape_attributes.get('cy') / _via_canvas_scale;
	    var rx = _via_canvas_regions[i].shape_attributes.get('rx') / _via_canvas_scale;
	    var ry = _via_canvas_regions[i].shape_attributes.get('ry') / _via_canvas_scale;
	    _via_canvas_regions[i].shape_attributes.set('cx', Math.round(cx));
	    _via_canvas_regions[i].shape_attributes.set('cy', Math.round(cy));
	    _via_canvas_regions[i].shape_attributes.set('rx', Math.round(rx));
	    _via_canvas_regions[i].shape_attributes.set('ry', Math.round(ry));
	    break;

	case VIA_REGION_SHAPE.POLYGON:
	    var all_points_x = _via_canvas_regions[i].shape_attributes.get('all_points_x').slice(0);
	    var all_points_y = _via_canvas_regions[i].shape_attributes.get('all_points_y').slice(0);
	    for (var j=0; j<all_points_x.length; ++j) {
		all_points_x[j] = Math.round(all_points_x[j] / _via_canvas_scale);
		all_points_y[j] = Math.round(all_points_y[j] / _via_canvas_scale);
	    }
	    _via_canvas_regions[i].shape_attributes.set('all_points_x', all_points_x);
	    _via_canvas_regions[i].shape_attributes.set('all_points_y', all_points_y);
	    break;
	}
    }
}

function clear_image_display_area() {
    hide_all_canvas();
    about_panel.style.display = 'none';
    via_start_info_panel.style.display = 'none';
}

//
// UI Control Elements (buttons, etc)
//

// updates currently selected region shape
function select_region_shape(sel_shape_name) {
    for (var shape_name in VIA_REGION_SHAPE) {
	var ui_element = document.getElementById('region_shape_' + VIA_REGION_SHAPE[shape_name]);
	ui_element.classList.remove('selected');
    }

    _via_current_shape = sel_shape_name;
    var ui_element = document.getElementById('region_shape_' + _via_current_shape);
    ui_element.classList.add('selected');

    if ( _via_current_shape != VIA_REGION_SHAPE.POLYGON ) {
	_via_is_user_drawing_polygon = false;
	_via_current_polygon_region_id = -1;
	show_message('Press single click and drag mouse to draw '
		     + _via_current_shape + ' region');
    } else {
	show_message('Press single click to define polygon vertices. Note: in ' +
		     'Polygon drawing mode, single click cannot be used to un-select regions');
    }
}

//
// Canvas (image + region)
//

function set_all_canvas_size(w, h) {
    _via_img_canvas.height = h;
    _via_img_canvas.width = w;

    _via_reg_canvas.height = h;
    _via_reg_canvas.width = w;

    canvas_panel.style.height = h + 'px';
    canvas_panel.style.width = w + 'px';    
}

function set_all_canvas_scale(s) {
    _via_img_ctx.scale(s, s);
    _via_reg_ctx.scale(s, s);
}

function show_all_canvas() {
    canvas_panel.style.display = 'inline-block';
}

function hide_all_canvas() {
    canvas_panel.style.display = 'none';
}

// enter annotation mode on double click
_via_reg_canvas.addEventListener('dblclick', function(e) {
    _via_click_x0 = e.offsetX; _via_click_y0 = e.offsetY;
    var region_id = is_inside_region(_via_click_x0, _via_click_y0);

    if (region_id != -1) {
	// user clicked inside a region, show attribute panel
	if(!_via_is_reg_attr_panel_visible) {
	    toggle_reg_attr_panel();
	}
    }

}, false);

// user clicks on the canvas
_via_reg_canvas.addEventListener('mousedown', function(e) {
    _via_click_x0 = e.offsetX; _via_click_y0 = e.offsetY;
    _via_region_edge = is_on_region_corner(_via_click_x0, _via_click_y0);
    var region_id = is_inside_region(_via_click_x0, _via_click_y0);

    if ( _via_is_region_selected ) {
	// check if user clicked on the region boundary
	if ( _via_region_edge[1] > 0 ) {
	    if ( !_via_is_user_resizing_region ) {
		// resize region
		if ( _via_region_edge[0] != _via_user_sel_region_id ) {
		    _via_user_sel_region_id = _via_region_edge[0];
		}
		_via_is_user_resizing_region = true;
	    }
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
	    if ( region_id == -1 ) {
		// mousedown on outside any region
		_via_is_user_drawing_region = true;
		// unselect all regions
		_via_is_region_selected = false;
		_via_user_sel_region_id = -1;
		toggle_all_regions_selection(false);
	    }
	}
    } else {
	if ( region_id == -1 ) {
	    // mousedown outside a region
	    if (_via_current_shape != VIA_REGION_SHAPE.POLYGON &&
		_via_current_shape != VIA_REGION_SHAPE.POINT) {
		// this is a bounding box drawing event
		_via_is_user_drawing_region = true;
	    }
	} else {
	    // mousedown inside a region
	    // this could lead to (1) region selection or (2) region drawing
	    _via_is_user_drawing_region = true;
	}
    }
    e.preventDefault();
}, false);

// implements the following functionalities:
//  - new region drawing (including polygon)
//  - moving/resizing/select/unselect existing region
_via_reg_canvas.addEventListener('mouseup', function(e) {
    _via_click_x1 = e.offsetX; _via_click_y1 = e.offsetY;

    var click_dx = Math.abs(_via_click_x1 - _via_click_x0);
    var click_dy = Math.abs(_via_click_y1 - _via_click_y0);

    // indicates that user has finished moving a region
    if ( _via_is_user_moving_region ) {
	_via_is_user_moving_region = false;
	_via_reg_canvas.style.cursor = "default";

	var move_x = Math.round(_via_click_x1 - _via_region_click_x);
	var move_y = Math.round(_via_click_y1 - _via_region_click_y);

	if (Math.abs(move_x) > VIA_MOUSE_CLICK_TOL ||
	    Math.abs(move_y) > VIA_MOUSE_CLICK_TOL) {

	    // @todo: update the region data
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
		var cxnew = image_attr.get('cx') + Math.round(move_x * _via_canvas_scale);
		var cynew = image_attr.get('cy') + Math.round(move_y * _via_canvas_scale);
		image_attr.set('cx', cxnew);
		image_attr.set('cy', cynew);

		var canvas_xnew = canvas_attr.get('cx') + move_x;
		var canvas_ynew = canvas_attr.get('cy') + move_y;
		canvas_attr.set('cx', canvas_xnew);
		canvas_attr.set('cy', canvas_ynew);     
		break;
	    case VIA_REGION_SHAPE.POLYGON:
		var img_px = image_attr.get('all_points_x');
		var img_py = image_attr.get('all_points_y');
		for (var i=0; i<img_px.length; ++i) {
		    img_px[i] = img_px[i] + Math.round(move_x * _via_canvas_scale);
		    img_py[i] = img_py[i] + Math.round(move_y * _via_canvas_scale);
		}

		var canvas_px = canvas_attr.get('all_points_x');
		var canvas_py = canvas_attr.get('all_points_y');
		for (var i=0; i<canvas_px.length; ++i) {
		    canvas_px[i] = canvas_px[i] + move_x;
		    canvas_py[i] = canvas_py[i] + move_y;
		}
		break;
	    }
	} else {
	    // indicates a user click on an already selected region
	    // this could indicate a user's intention to select another
	    // nested region within this region

	    // traverse the canvas regions in alternating ascending
	    // and descending order to solve the issue of nested regions
	    var nested_region_id = is_inside_region(_via_click_x0, _via_click_y0, true);            
	    if (nested_region_id >= 0 &&
		nested_region_id != _via_user_sel_region_id) {
		_via_user_sel_region_id = nested_region_id;
		_via_is_region_selected = true;
		_via_is_user_moving_region = false;
		
		// de-select all other regions if the user has not pressed Shift
		if ( !e.shiftKey ) {
		    toggle_all_regions_selection(false);
		}
		set_region_select_state(nested_region_id, true);
		update_attributes_panel();
	    }
	}
	_via_redraw_reg_canvas();
	_via_reg_canvas.focus();
	save_current_data_to_browser_cache();
	return;
    }

    // indicates that user has finished resizing a region
    if ( _via_is_user_resizing_region ) {
	// _via_click(x0,y0) to _via_click(x1,y1)
	_via_is_user_resizing_region = false;
	_via_reg_canvas.style.cursor = "default";
	
	// update the region
	var region_id = _via_region_edge[0];
	var image_attr = _via_img_metadata[_via_image_id].regions[region_id].shape_attributes;
	var canvas_attr = _via_canvas_regions[region_id].shape_attributes;
	
	switch (canvas_attr.get('name')) {
	case VIA_REGION_SHAPE.RECT:
            var x0 = canvas_attr.get('x');
            var y0 = canvas_attr.get('y');
            var x1 = x0 + canvas_attr.get('width');
            var y1 = y0 + canvas_attr.get('height');

            switch(_via_region_edge[1]) {
            case 1: // top-left
		x0 = _via_current_x;
		y0 = _via_current_y;
		break;
            case 3: // bottom-right
		x1 = _via_current_x;
		y1 = _via_current_y;
		break;
            case 2: // top-right
		x1 = _via_current_x;
		y0 = _via_current_y;
		break;
            case 4: // bottom-left
		x0 = _via_current_x;
		y1 = _via_current_y;
		break;
            }
            var w = Math.abs(x1-x0);
            var h = Math.abs(y1-y0);
            image_attr.set('x', Math.round(x0 * _via_canvas_scale));
            image_attr.set('y', Math.round(y0 * _via_canvas_scale));
            image_attr.set('width', Math.round(w * _via_canvas_scale));
            image_attr.set('height', Math.round(h * _via_canvas_scale));

            canvas_attr.set('x', x0);
            canvas_attr.set('y', y0);
            canvas_attr.set('width', w);
            canvas_attr.set('height', h);
            
            break;

	case VIA_REGION_SHAPE.CIRCLE:
            var dx = Math.abs(canvas_attr.get('cx') - _via_current_x);
            var dy = Math.abs(canvas_attr.get('cy') - _via_current_y);
            var new_r = Math.sqrt( dx*dx + dy*dy );

            canvas_attr.set('r', Math.round(new_r));
            image_attr.set('r', Math.round(new_r * _via_canvas_scale));
            break;

	case VIA_REGION_SHAPE.ELLIPSE:
            var new_rx = canvas_attr.get('rx');
            var new_ry = canvas_attr.get('ry');
            var dx = Math.abs(canvas_attr.get('cx') - _via_current_x);
            var dy = Math.abs(canvas_attr.get('cy') - _via_current_y);
            switch(_via_region_edge[1]) {
            case 5:
		new_ry = dy;
		break;
            case 6:
		new_rx = dx;
		break;
            default:
		new_rx = dx;
		new_ry = dy;
		break;
            }
            
            canvas_attr.set('rx', Math.round(new_rx));
            canvas_attr.set('ry', Math.round(new_ry));
            image_attr.set('rx', Math.round(new_rx * _via_canvas_scale));
            image_attr.set('ry', Math.round(new_ry * _via_canvas_scale));
            break;

	case VIA_REGION_SHAPE.POLYGON:
            var moved_vertex_id = _via_region_edge[1] - POLYGON_RESIZE_VERTEX_OFFSET;

            canvas_attr.get('all_points_x')[moved_vertex_id] = Math.round(_via_current_x);
            canvas_attr.get('all_points_y')[moved_vertex_id] = Math.round(_via_current_y);
            image_attr.get('all_points_x')[moved_vertex_id] = Math.round(_via_current_x * _via_canvas_scale);
            image_attr.get('all_points_y')[moved_vertex_id] = Math.round(_via_current_y * _via_canvas_scale);

            if (moved_vertex_id == 0) {
		// move both first and last vertex because we
		// the initial point at the end to close path
		var n = canvas_attr.get('all_points_x').length;
		canvas_attr.get('all_points_x')[n-1] = Math.round(_via_current_x);
		canvas_attr.get('all_points_y')[n-1] = Math.round(_via_current_y);
		image_attr.get('all_points_x')[n-1] = Math.round(_via_current_x * _via_canvas_scale);
		image_attr.get('all_points_y')[n-1] = Math.round(_via_current_y * _via_canvas_scale);
            }
            break;
	}

	_via_redraw_reg_canvas();
	_via_reg_canvas.focus();
	save_current_data_to_browser_cache();
	return;
    }

    // denotes a single click (= mouse down + mouse up)
    if ( click_dx < VIA_MOUSE_CLICK_TOL ||
	 click_dy < VIA_MOUSE_CLICK_TOL ) {
	// if user is already drawing ploygon, then each click adds a new point
	if ( _via_is_user_drawing_polygon ) {
            var canvas_x0 = Math.round(_via_click_x0);
            var canvas_y0 = Math.round(_via_click_y0);
            
            // check if the clicked point is close to the first point
            var fx0 = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes.get('all_points_x')[0];
            var fy0 = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes.get('all_points_y')[0];
            var dx = (fx0 - canvas_x0);
            var dy = (fy0 - canvas_y0);
            if ( Math.sqrt(dx*dx + dy*dy) <= VIA_POLYGON_VERTEX_MATCH_TOL ) {
		// user clicked on the first polygon point to close the path
		_via_is_user_drawing_polygon = false;

		// add all polygon points stored in _via_canvas_regions[]
		var all_points_x = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes.get('all_points_x').slice(0);
		var all_points_y = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes.get('all_points_y').slice(0);
		var canvas_all_points_x = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes.get('all_points_x');
		var canvas_all_points_y = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes.get('all_points_y');

		// close path
		all_points_x.push(all_points_x[0]);
		all_points_y.push(all_points_y[0]);
		canvas_all_points_x.push(canvas_all_points_x[0]);
		canvas_all_points_y.push(canvas_all_points_y[0]);               
		
		var points_str = '';
		for ( var i=0; i<all_points_x.length; ++i) {
                    all_points_x[i] = Math.round( all_points_x[i] * _via_canvas_scale );
                    all_points_y[i] = Math.round( all_points_y[i] * _via_canvas_scale );
                    
                    points_str += all_points_x[i] + ' ' + all_points_y[i] + ',';
		}
		points_str = points_str.substring(0, points_str.length-1); // remove last comma
		
		var polygon_region = new ImageRegion();
		polygon_region.shape_attributes.set('name', 'polygon');
		//polygon_region.shape_attributes.set('points', points_str);
		polygon_region.shape_attributes.set('all_points_x', all_points_x);
		polygon_region.shape_attributes.set('all_points_y', all_points_y);
		_via_current_polygon_region_id = _via_img_metadata[_via_image_id].regions.length;
		_via_img_metadata[_via_image_id].regions.push(polygon_region);

		// newly drawn region is automatically selected
		select_only_region(_via_current_polygon_region_id);

		_via_current_polygon_region_id = -1;
		update_attributes_panel();
		save_current_data_to_browser_cache();
            } else {
		// user clicked on a new polygon point
		_via_canvas_regions[_via_current_polygon_region_id].shape_attributes.get('all_points_x').push(canvas_x0);
		_via_canvas_regions[_via_current_polygon_region_id].shape_attributes.get('all_points_y').push(canvas_y0);
            }
	} else {
            var region_id = is_inside_region(_via_click_x0, _via_click_y0);
            if ( region_id >= 0 ) {
		// first click selects region
		_via_user_sel_region_id = region_id;
		_via_is_region_selected = true;
		_via_is_user_moving_region = false;
		_via_is_user_drawing_region = false;
		
		// de-select all other regions if the user has not pressed Shift
		if ( !e.shiftKey ) {
                    toggle_all_regions_selection(false);
		}
		set_region_select_state(region_id, true);
		update_attributes_panel();
		//show_message('Click and drag to move or resize the selected region');
            } else {
		if ( _via_is_user_drawing_region ) {
                    // clear all region selection
                    _via_is_user_drawing_region = false;
                    _via_is_region_selected = false;
                    _via_use_sel_region_id = -1;
                    toggle_all_regions_selection(false);
                    
                    update_attributes_panel();
		} else {
		    switch (_via_current_shape) {
		    case VIA_REGION_SHAPE.POLYGON:
			// user has clicked on the first point in a new polygon
			_via_is_user_drawing_polygon = true;

			var canvas_polygon_region = new ImageRegion();
			canvas_polygon_region.shape_attributes.set('name', VIA_REGION_SHAPE.POLYGON);
			canvas_polygon_region.shape_attributes.set('all_points_x', [Math.round(_via_click_x0)]);
			canvas_polygon_region.shape_attributes.set('all_points_y', [Math.round(_via_click_y0)]);
			_via_canvas_regions.push(canvas_polygon_region);
			_via_current_polygon_region_id =_via_canvas_regions.length - 1;
			break;
		    case VIA_REGION_SHAPE.POINT:
			// user has marked a landmark point
			var point_region = new ImageRegion();
			point_region.shape_attributes.set('name', VIA_REGION_SHAPE.POINT);
			point_region.shape_attributes.set('cx', Math.round(_via_click_x0 * _via_canvas_scale));
			point_region.shape_attributes.set('cy', Math.round(_via_click_y0 * _via_canvas_scale));
			_via_img_metadata[_via_image_id].regions.push(point_region);

			var canvas_point_region = new ImageRegion();
			canvas_point_region.shape_attributes.set('name', VIA_REGION_SHAPE.POINT);
			canvas_point_region.shape_attributes.set('cx', Math.round(_via_click_x0));
			canvas_point_region.shape_attributes.set('cy', Math.round(_via_click_y0));
			_via_canvas_regions.push(canvas_point_region);

			update_attributes_panel();
			save_current_data_to_browser_cache();

			break;
		    }
		}                
            }
	}
	_via_redraw_reg_canvas();
	_via_reg_canvas.focus();
	return;
    }

    // indicates that user has finished drawing a new region
    if (_via_is_user_drawing_region) {
	
	_via_is_user_drawing_region = false;
	
	var region_x0, region_y0, region_x1, region_y1;
	// ensure that (x0,y0) is top-left and (x1,y1) is bottom-right
	if ( _via_click_x0 < _via_click_x1 ) {
            region_x0 = _via_click_x0;
            region_x1 = _via_click_x1;
	} else {
            region_x0 = _via_click_x1;
            region_x1 = _via_click_x0;
	}

	if ( _via_click_y0 < _via_click_y1 ) {
            region_y0 = _via_click_y0;
            region_y1 = _via_click_y1;
	} else {
            region_y0 = _via_click_y1;
            region_y1 = _via_click_y0;
	}

	var original_img_region = new ImageRegion();
	var canvas_img_region = new ImageRegion();
	var region_dx = Math.abs(region_x1 - region_x0);
	var region_dy = Math.abs(region_y1 - region_y0);

	// newly drawn region is automatically selected
	toggle_all_regions_selection(false);
	original_img_region.is_user_selected = true;
	canvas_img_region.is_user_selected = true;
	_via_is_region_selected = true;
	_via_user_sel_region_id = _via_canvas_regions.length; // new region's id
	
	if ( region_dx > VIA_REGION_MIN_DIM ||
             region_dy > VIA_REGION_MIN_DIM ) { // avoid regions with 0 dim
		switch(_via_current_shape) {
		case VIA_REGION_SHAPE.RECT:
                    original_img_region.shape_attributes.set('name', 'rect');
                    original_img_region.shape_attributes.set('x', Math.round(region_x0 * _via_canvas_scale));
                    original_img_region.shape_attributes.set('y', Math.round(region_y0 * _via_canvas_scale));
                    original_img_region.shape_attributes.set('width', Math.round(region_dx * _via_canvas_scale));
                    original_img_region.shape_attributes.set('height', Math.round(region_dy * _via_canvas_scale));

                    canvas_img_region.shape_attributes.set('name', 'rect');
                    canvas_img_region.shape_attributes.set('x', Math.round(region_x0));
                    canvas_img_region.shape_attributes.set('y', Math.round(region_y0));
                    canvas_img_region.shape_attributes.set('width', Math.round(region_dx));
                    canvas_img_region.shape_attributes.set('height', Math.round(region_dy));

                    _via_img_metadata[_via_image_id].regions.push(original_img_region);
                    _via_canvas_regions.push(canvas_img_region);

                    break;
		case VIA_REGION_SHAPE.CIRCLE:
                    var circle_radius = Math.round(Math.sqrt( region_dx*region_dx + region_dy*region_dy ));
                    original_img_region.shape_attributes.set('name', 'circle');
                    original_img_region.shape_attributes.set('cx', Math.round(region_x0 * _via_canvas_scale));
                    original_img_region.shape_attributes.set('cy', Math.round(region_y0 * _via_canvas_scale));
                    original_img_region.shape_attributes.set('r', Math.round(circle_radius * _via_canvas_scale));

                    canvas_img_region.shape_attributes.set('name', 'circle');
                    canvas_img_region.shape_attributes.set('cx', Math.round(region_x0));
                    canvas_img_region.shape_attributes.set('cy', Math.round(region_y0));
                    canvas_img_region.shape_attributes.set('r', Math.round(circle_radius));

                    _via_img_metadata[_via_image_id].regions.push(original_img_region);
                    _via_canvas_regions.push(canvas_img_region);

                    break;
		case VIA_REGION_SHAPE.ELLIPSE:
                    original_img_region.shape_attributes.set('name', 'ellipse');
                    original_img_region.shape_attributes.set('cx', Math.round(region_x0 * _via_canvas_scale));
                    original_img_region.shape_attributes.set('cy', Math.round(region_y0 * _via_canvas_scale));
                    original_img_region.shape_attributes.set('rx', Math.round(region_dx * _via_canvas_scale));
                    original_img_region.shape_attributes.set('ry', Math.round(region_dy * _via_canvas_scale));

                    canvas_img_region.shape_attributes.set('name', 'ellipse');
                    canvas_img_region.shape_attributes.set('cx', Math.round(region_x0));
                    canvas_img_region.shape_attributes.set('cy', Math.round(region_y0));
                    canvas_img_region.shape_attributes.set('rx', Math.round(region_dx));
                    canvas_img_region.shape_attributes.set('ry', Math.round(region_dy));

                    _via_img_metadata[_via_image_id].regions.push(original_img_region);
                    _via_canvas_regions.push(canvas_img_region);

                    break;
		case VIA_REGION_SHAPE.POLYGON:
                    // handled by _via_is_user_drawing polygon
                    break;
		}
	} else {
            show_message('Skipped adding a ' + _via_current_shape + ' of nearly 0 dimension', VIA_THEME_MESSAGE_TIMEOUT_MS);
	}
	update_attributes_panel();
	_via_redraw_reg_canvas();
	_via_reg_canvas.focus();

	save_current_data_to_browser_cache();
	return;
    }

});

function toggle_all_regions_selection(is_selected) {
    for (var i=0; i<_via_canvas_regions.length; ++i) {
        _via_canvas_regions[i].is_user_selected = is_selected;
        _via_img_metadata[_via_image_id].regions[i].is_user_selected = is_selected;
    }
    _via_is_all_region_selected = is_selected;
}
function select_only_region(region_id) {
    toggle_all_regions_selection(false);
    set_region_select_state(region_id, true);
    _via_is_region_selected = true;
    _via_user_sel_region_id = region_id;
}
function set_region_select_state(region_id, is_selected) {
    _via_canvas_regions[region_id].is_user_selected = is_selected;
    _via_img_metadata[_via_image_id].regions[region_id].is_user_selected = is_selected;
}

_via_reg_canvas.addEventListener("mouseover", function(e) {
    // change the mouse cursor icon
    _via_redraw_reg_canvas();
    _via_reg_canvas.focus();
});

_via_reg_canvas.addEventListener('mousemove', function(e) {
    if ( !_via_current_image_loaded ) {
        return;
    }
    
    _via_current_x = e.offsetX; _via_current_y = e.offsetY;

    if ( _via_is_region_selected ) {
        if ( !_via_is_user_resizing_region ) {
            // check if user moved mouse cursor to region boundary
            // which indicates an intention to resize the reigon
            
            _via_region_edge = is_on_region_corner(_via_current_x, _via_current_y);

            if ( _via_region_edge[0] == _via_user_sel_region_id ) {
                switch(_via_region_edge[1]) {
                    // rect
                case 1: // top-left corner of rect
                case 3: // bottom-right corner of rect
                    _via_reg_canvas.style.cursor = "nwse-resize";
                    break;
                case 2: // top-right corner of rect
                case 4: // bottom-left corner of rect
                    _via_reg_canvas.style.cursor = "nesw-resize";
                    break;
                    
                    // circle and ellipse
                case 5:
                    _via_reg_canvas.style.cursor = "n-resize";
                    break;
                case 6:
                    _via_reg_canvas.style.cursor = "e-resize";
                    break;

                default:
                    _via_reg_canvas.style.cursor = "default";
                }

                if (_via_region_edge[1] >= POLYGON_RESIZE_VERTEX_OFFSET) {
                    // indicates mouse over polygon vertex
                    _via_reg_canvas.style.cursor = "crosshair";
                }
            } else {
                var yes = is_inside_this_region(_via_current_x,
                                                _via_current_y,
                                                _via_user_sel_region_id);
                if (yes) {
                    _via_reg_canvas.style.cursor = "move";
                } else {
                    _via_reg_canvas.style.cursor = "default";
                }
            }
        }
    }
    
    if(_via_is_user_drawing_region) {
        // draw region as the user drags the mouse cousor
	if (_via_canvas_regions.length) {
	    _via_redraw_reg_canvas(); // clear old intermediate rectangle
	} else {
	    // first region being drawn, just clear the full region canvas
	    _via_reg_ctx.clearRect(0, 0, _via_reg_canvas.width, _via_reg_canvas.height);
	}

        var region_x0, region_y0;

        if ( _via_click_x0 < _via_current_x ) {
            if ( _via_click_y0 < _via_current_y ) {
                region_x0 = _via_click_x0;
                region_y0 = _via_click_y0;
            } else {
                region_x0 = _via_click_x0;
                region_y0 = _via_current_y;
            }
        } else {
            if ( _via_click_y0 < _via_current_y ) {
                region_x0 = _via_current_x;
                region_y0 = _via_click_y0;
            } else {
                region_x0 = _via_current_x;
                region_y0 = _via_current_y;
            }
        }
        var dx = Math.round(Math.abs(_via_current_x - _via_click_x0));
        var dy = Math.round(Math.abs(_via_current_y - _via_click_y0));

        switch (_via_current_shape ) {
        case VIA_REGION_SHAPE.RECT:
            _via_draw_rect_region(region_x0, region_y0,
                                  dx, dy, false);
            break;
        case VIA_REGION_SHAPE.CIRCLE:
            var circle_radius = Math.round(Math.sqrt( dx*dx + dy*dy ));
            _via_draw_circle_region(region_x0, region_y0,
                                    circle_radius, false);
            break;
        case VIA_REGION_SHAPE.ELLIPSE:
            _via_draw_ellipse_region(region_x0, region_y0,
                                     dx, dy, false);
            break;
        case VIA_REGION_SHAPE.POLYGON:
            // this is handled by the if ( _via_is_user_drawing_polygon ) { ... }
            // see below
            break;
        }
        _via_reg_canvas.focus();
    }
    
    if ( _via_is_user_resizing_region ) {
        // user has clicked mouse on bounding box edge and is now moving it
        _via_redraw_reg_canvas(); // clear old intermediate rectangle

        var region_id = _via_region_edge[0];
        var attr = _via_canvas_regions[region_id].shape_attributes;
        switch (attr.get('name')) {
        case VIA_REGION_SHAPE.RECT:
            var x0 = _via_canvas_regions[region_id].shape_attributes.get('x');
            var y0 = _via_canvas_regions[region_id].shape_attributes.get('y');
            var x1 = x0 + _via_canvas_regions[region_id].shape_attributes.get('width');
            var y1 = y0 + _via_canvas_regions[region_id].shape_attributes.get('height');

            switch(_via_region_edge[1]) {
            case 1: // top-left
                x0 = _via_current_x;
                y0 = _via_current_y;
                break;
            case 3: // bottom-right
                x1 = _via_current_x;
                y1 = _via_current_y;
                break;
            case 2: // top-right
                x1 = _via_current_x;
                y0 = _via_current_y;
                break;
            case 4: // bottom-left
                x0 = _via_current_x;
                y1 = _via_current_y;
                break;
            }
            _via_draw_rect_region(x0,
                                  y0,
                                  Math.abs(x1-x0),
                                  Math.abs(y1-y0),
                                  true);
            break;

        case VIA_REGION_SHAPE.CIRCLE:
            var dx = Math.abs(attr.get('cx') - _via_current_x);
            var dy = Math.abs(attr.get('cy') - _via_current_y);
            var new_r = Math.sqrt( dx*dx + dy*dy );
            _via_draw_circle_region(attr.get('cx'),
                                    attr.get('cy'),
                                    new_r,
                                    true);
            break;

        case VIA_REGION_SHAPE.ELLIPSE:
            var new_rx = attr.get('rx');
            var new_ry = attr.get('ry');
            var dx = Math.abs(attr.get('cx') - _via_current_x);
            var dy = Math.abs(attr.get('cy') - _via_current_y);
            switch(_via_region_edge[1]) {
            case 5:
                new_ry = dy;
                break;
            case 6:
                new_rx = dx;
                break;
            default:
                new_rx = dx;
                new_ry = dy;
                break;
            }
            _via_draw_ellipse_region(attr.get('cx'),
                                     attr.get('cy'),
                                     new_rx,
                                     new_ry,
                                     true);
            break;

        case VIA_REGION_SHAPE.POLYGON:
            var moved_all_points_x = attr.get('all_points_x').slice(0);
            var moved_all_points_y = attr.get('all_points_y').slice(0);     
            var moved_vertex_id = _via_region_edge[1] - POLYGON_RESIZE_VERTEX_OFFSET;

            moved_all_points_x[moved_vertex_id] = _via_current_x;
            moved_all_points_y[moved_vertex_id] = _via_current_y;

            if (moved_vertex_id == 0) {
                // move both first and last vertex because we
                // the initial point at the end to close path
                moved_all_points_x[moved_all_points_x.length-1] = _via_current_x;
                moved_all_points_y[moved_all_points_y.length-1] = _via_current_y;
            }

            _via_draw_polygon_region(moved_all_points_x,
                                     moved_all_points_y,
                                     true);
            break;
        }
        _via_reg_canvas.focus();
    }

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
            _via_draw_circle_region(attr.get('cx') + move_x,
                                    attr.get('cy') + move_y,
                                    attr.get('r'),
                                    true);
            break;

        case VIA_REGION_SHAPE.ELLIPSE:
            _via_draw_ellipse_region(attr.get('cx') + move_x,
                                     attr.get('cy') + move_y,
                                     attr.get('rx'),
                                     attr.get('ry'),
                                     true);
            break;

        case VIA_REGION_SHAPE.POLYGON:
            var moved_all_points_x = attr.get('all_points_x').slice(0);
            var moved_all_points_y = attr.get('all_points_y').slice(0);
            for (var i=0; i<moved_all_points_x.length; ++i) {
                moved_all_points_x[i] += move_x;
                moved_all_points_y[i] += move_y;
            }
            _via_draw_polygon_region(moved_all_points_x,
                                     moved_all_points_y,
                                     true);
            break;

        case VIA_REGION_SHAPE.POINT:
            _via_draw_point_region(attr.get('cx') + move_x,
                                   attr.get('cy') + move_y,
                                   true);
            break;

        }
        _via_reg_canvas.focus();    
    }

    if ( _via_is_user_drawing_polygon ) {
        _via_redraw_reg_canvas();
        var attr = _via_canvas_regions[_via_current_polygon_region_id].shape_attributes;
        var all_points_x = attr.get('all_points_x');
        var all_points_y = attr.get('all_points_y');
        var npts = all_points_x.length;

        var line_x = [all_points_x.slice(npts-1), _via_current_x];
        var line_y = [all_points_y.slice(npts-1), _via_current_y];
        _via_draw_polygon_region(line_x, line_y, false);
    }
});

function toggle_img_list(panel) {
    if (typeof panel === 'undefined') {
        // invoked from accordion in the top navigation toolbar
        panel = document.getElementById('image_list_panel_button');     
    }
    panel.classList.toggle('active');
    
    if (_via_is_loaded_img_list_visible) {
        img_list_panel.style.display = 'none';
        _via_is_loaded_img_list_visible = false;
        return;
    } else {
        _via_is_loaded_img_list_visible = true;
        show_img_list();
    }

}

function show_img_list() {
    if (_via_img_count == 0) {
        show_message("Please load some images first!", VIA_THEME_MESSAGE_TIMEOUT_MS);
        return;
    }

    if(_via_is_loaded_img_list_visible) {
        if ( _via_reload_img_table ) {
            reload_img_table();
            _via_reload_img_table = false;
        }
        img_list_panel.innerHTML = _via_loaded_img_table_html.join('');
        img_list_panel.style.display = 'block';
    }
}

function reload_img_table() {
    _via_loaded_img_fn_list = [];
    _via_loaded_img_region_attr_miss_count = [];
    
    for (var i=0; i<_via_img_count; ++i) {
        img_id = _via_image_id_list[i];
        _via_loaded_img_fn_list[i] = _via_img_metadata[img_id].filename;
        _via_loaded_img_region_attr_miss_count[i] = count_missing_region_attr(img_id);
    }
    
    _via_loaded_img_table_html = [];
    _via_loaded_img_table_html.push('<ul>');
    for (var i=0; i<_via_img_count; ++i) {
        var fni = '';
        if (i == _via_image_index) {
            // highlight the current entry
            fni += '<li style="cursor: default;">';
            fni += '<b>[' + (i+1) + '] ' + _via_loaded_img_fn_list[i] + '</b>';
        } else {
            fni += '<li onclick="jump_to_image(' + (i) + ')">';
            fni += '[' + (i+1) + '] ' + _via_loaded_img_fn_list[i];
        }

        if (_via_loaded_img_region_attr_miss_count[i]) {
            fni += ' (' + '<span style="color: red;">';
            fni += _via_loaded_img_region_attr_miss_count[i] + '</span>' + ')'
        }
        
        fni += '</li>';
        _via_loaded_img_table_html.push(fni);
    }
    _via_loaded_img_table_html.push('</ul>');
}

function jump_to_image(image_index) {
    if ( image_index >=0 &&
         image_index < _via_img_count) {
        show_image(image_index);
    }
}

function count_missing_region_attr(img_id) {
    var miss_region_attr_count = 0;
    for( var i=0; i<_via_img_metadata[img_id].regions.length; ++i) {
        miss_region_attr_count += _via_region_attributes.size - _via_img_metadata[img_id].regions[i].region_attributes.size;
    }
    return miss_region_attr_count;
}

function count_missing_file_attr(img_id) {
    return _via_file_attributes.size - _via_img_metadata[img_id].file_attributes.size;
}

//
// Canvas update routines
//
function _via_redraw_img_canvas() {
    if (_via_current_image_loaded) {
        _via_img_ctx.clearRect(0, 0, _via_img_canvas.width, _via_img_canvas.height);
        _via_img_ctx.drawImage(_via_current_image, 0, 0,
                               _via_img_canvas.width, _via_img_canvas.height);
    }
}

function _via_redraw_reg_canvas() {
    if (_via_current_image_loaded) {
        if ( _via_canvas_regions.length > 0 ) {
            _via_reg_ctx.clearRect(0, 0, _via_reg_canvas.width, _via_reg_canvas.height);
	    if (_via_is_region_boundary_visible) {
		draw_all_regions();
	    }

	    if (_via_is_region_id_visible) {
		draw_all_region_id();
	    }
        }
    }
}

function _via_clear_reg_canvas() {
    _via_reg_ctx.clearRect(0, 0, _via_reg_canvas.width, _via_reg_canvas.height);
}

function draw_all_regions() {
    for (var i=0; i < _via_canvas_regions.length; ++i) {
        var attr = _via_canvas_regions[i].shape_attributes;
        var is_selected = _via_canvas_regions[i].is_user_selected;
        
        switch( attr.get('name') ) {
        case VIA_REGION_SHAPE.RECT:
            _via_draw_rect_region(attr.get('x'),
                                  attr.get('y'),
                                  attr.get('width'),
                                  attr.get('height'),
                                  is_selected);
            break;
        case VIA_REGION_SHAPE.CIRCLE:
            _via_draw_circle_region(attr.get('cx'),
                                    attr.get('cy'),
                                    attr.get('r'),
                                    is_selected);
            break;
        case VIA_REGION_SHAPE.ELLIPSE:
            _via_draw_ellipse_region(attr.get('cx'),
                                     attr.get('cy'),
                                     attr.get('rx'),
                                     attr.get('ry'),
                                     is_selected);
            break;
        case VIA_REGION_SHAPE.POLYGON:
            _via_draw_polygon_region(attr.get('all_points_x'),
                                     attr.get('all_points_y'),
                                     is_selected);
            break;
        case VIA_REGION_SHAPE.POINT:
            _via_draw_point_region(attr.get('cx'),
                                   attr.get('cy'),
                                   is_selected);
            break;    
        }
    }
}

function _via_draw_rect_region(x, y, w, h, is_selected) {
    if (is_selected) {
        _via_draw_rect(x, y, w, h);
        
        _via_reg_ctx.strokeStyle = VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR;
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
        _via_reg_ctx.stroke();

        _via_reg_ctx.fillStyle = VIA_THEME_SEL_REGION_FILL_COLOR;
        _via_reg_ctx.globalAlpha = VIA_THEME_SEL_REGION_OPACITY;
        _via_reg_ctx.fill();
        _via_reg_ctx.globalAlpha = 1.0;
    } else {
        // draw a fill line
        _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_FILL_COLOR;
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
        _via_draw_rect(x, y, w, h);
        _via_reg_ctx.stroke();

        if ( w > VIA_THEME_REGION_BOUNDARY_WIDTH &&
             h > VIA_THEME_REGION_BOUNDARY_WIDTH ) {
            // draw a boundary line on both sides of the fill line
            _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_LINE_COLOR;
            _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH/4;
            _via_draw_rect(x - VIA_THEME_REGION_BOUNDARY_WIDTH/2,
                           y - VIA_THEME_REGION_BOUNDARY_WIDTH/2,
                           w + VIA_THEME_REGION_BOUNDARY_WIDTH,
                           h + VIA_THEME_REGION_BOUNDARY_WIDTH);
            _via_reg_ctx.stroke();

            _via_draw_rect(x + VIA_THEME_REGION_BOUNDARY_WIDTH/2,
                           y + VIA_THEME_REGION_BOUNDARY_WIDTH/2,
                           w - VIA_THEME_REGION_BOUNDARY_WIDTH,
                           h - VIA_THEME_REGION_BOUNDARY_WIDTH);
            _via_reg_ctx.stroke();
        }
    }
}

function _via_draw_rect(x, y, w, h) {
    _via_reg_ctx.beginPath();
    _via_reg_ctx.moveTo(x  , y);
    _via_reg_ctx.lineTo(x+w, y);
    _via_reg_ctx.lineTo(x+w, y+h);
    _via_reg_ctx.lineTo(x  , y+h);
    _via_reg_ctx.closePath();
}

function _via_draw_circle_region(cx, cy, r, is_selected) {
    if (is_selected) {
        _via_draw_circle(cx, cy, r);
        
        _via_reg_ctx.strokeStyle = VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR;
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
        _via_reg_ctx.stroke();

        _via_reg_ctx.fillStyle = VIA_THEME_SEL_REGION_FILL_COLOR;
        _via_reg_ctx.globalAlpha = VIA_THEME_SEL_REGION_OPACITY;
        _via_reg_ctx.fill();
        _via_reg_ctx.globalAlpha = 1.0;
    } else {
        // draw a fill line
        _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_FILL_COLOR;
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
        _via_draw_circle(cx, cy, r);
        _via_reg_ctx.stroke();

        if ( r > VIA_THEME_REGION_BOUNDARY_WIDTH ) {
            // draw a boundary line on both sides of the fill line
            _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_LINE_COLOR;
            _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH/4;
            _via_draw_circle(cx,
                             cy,
                             r - VIA_THEME_REGION_BOUNDARY_WIDTH/2);
            _via_reg_ctx.stroke();
            _via_draw_circle(cx,
                             cy,
                             r + VIA_THEME_REGION_BOUNDARY_WIDTH/2);
            _via_reg_ctx.stroke();
        }
    }
}

function _via_draw_circle(cx, cy, r) {
    _via_reg_ctx.beginPath();
    _via_reg_ctx.arc(cx, cy, r, 0, 2*Math.PI, false);
    _via_reg_ctx.closePath();
}

function _via_draw_ellipse_region(cx, cy, rx, ry, is_selected) {
    if (is_selected) {
        _via_draw_ellipse(cx, cy, rx, ry);
        
        _via_reg_ctx.strokeStyle = VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR;
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
        _via_reg_ctx.stroke();

        _via_reg_ctx.fillStyle = VIA_THEME_SEL_REGION_FILL_COLOR;
        _via_reg_ctx.globalAlpha = VIA_THEME_SEL_REGION_OPACITY;
        _via_reg_ctx.fill();
        _via_reg_ctx.globalAlpha = 1.0;
    } else {
        // draw a fill line
        _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_FILL_COLOR;
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
        _via_draw_ellipse(cx, cy, rx, ry);
        _via_reg_ctx.stroke();

        if ( rx > VIA_THEME_REGION_BOUNDARY_WIDTH &&
             ry > VIA_THEME_REGION_BOUNDARY_WIDTH ) {
            // draw a boundary line on both sides of the fill line
            _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_LINE_COLOR;
            _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH/4;
            _via_draw_ellipse(cx,
                              cy,
                              rx + VIA_THEME_REGION_BOUNDARY_WIDTH/2,
                              ry + VIA_THEME_REGION_BOUNDARY_WIDTH/2);
            _via_reg_ctx.stroke();
            _via_draw_ellipse(cx,
                              cy,
                              rx - VIA_THEME_REGION_BOUNDARY_WIDTH/2,
                              ry - VIA_THEME_REGION_BOUNDARY_WIDTH/2);
            _via_reg_ctx.stroke();  
        }
    }
}

function _via_draw_ellipse(cx, cy, rx, ry) {
    _via_reg_ctx.save();
    
    _via_reg_ctx.beginPath();
    _via_reg_ctx.translate(cx-rx, cy-ry);
    _via_reg_ctx.scale(rx, ry);
    _via_reg_ctx.arc(1, 1, 1, 0, 2 * Math.PI, false);

    _via_reg_ctx.restore(); // restore to original state
    _via_reg_ctx.closePath();

}

function _via_draw_polygon_region(all_points_x, all_points_y, is_selected) {
    if (is_selected) {  
        _via_reg_ctx.beginPath();
        _via_reg_ctx.moveTo(all_points_x[0], all_points_y[0]);      
        for (var i=1; i<all_points_x.length; ++i) {
            _via_reg_ctx.lineTo(all_points_x[i], all_points_y[i]);
        }
        _via_reg_ctx.strokeStyle = VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR;
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
        _via_reg_ctx.stroke();

        _via_reg_ctx.fillStyle = VIA_THEME_SEL_REGION_FILL_COLOR;
        _via_reg_ctx.globalAlpha = VIA_THEME_SEL_REGION_OPACITY;
        _via_reg_ctx.fill();
        _via_reg_ctx.globalAlpha = 1.0;
    } else {
        for (var i=1; i<all_points_x.length; ++i) {
            // draw a fill line
            _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_FILL_COLOR;
            _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
            _via_reg_ctx.beginPath();
            _via_reg_ctx.moveTo(all_points_x[i-1], all_points_y[i-1]);
            _via_reg_ctx.lineTo(all_points_x[i], all_points_y[i]);
            _via_reg_ctx.stroke();

            var slope_i = (all_points_y[i] - all_points_y[i-1]) / (all_points_x[i] - all_points_x[i-1]);
            if (slope_i > 0) {
                // draw a boundary line on both sides
                _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_LINE_COLOR;
                _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH/4;
                _via_reg_ctx.beginPath();
                _via_reg_ctx.moveTo(parseInt(all_points_x[i-1]) - parseInt(VIA_THEME_REGION_BOUNDARY_WIDTH/4),
                                    parseInt(all_points_y[i-1]) + parseInt(VIA_THEME_REGION_BOUNDARY_WIDTH/4));
                _via_reg_ctx.lineTo(parseInt(all_points_x[i]) - parseInt(VIA_THEME_REGION_BOUNDARY_WIDTH/4),
                                    parseInt(all_points_y[i]) + parseInt(VIA_THEME_REGION_BOUNDARY_WIDTH/4));
                _via_reg_ctx.stroke();
                _via_reg_ctx.beginPath();
                _via_reg_ctx.moveTo(parseInt(all_points_x[i-1]) + parseInt(VIA_THEME_REGION_BOUNDARY_WIDTH/4),
                                    parseInt(all_points_y[i-1]) - parseInt(VIA_THEME_REGION_BOUNDARY_WIDTH/4));
                _via_reg_ctx.lineTo(parseInt(all_points_x[i]) + parseInt(VIA_THEME_REGION_BOUNDARY_WIDTH/4),
                                    parseInt(all_points_y[i]) - parseInt(VIA_THEME_REGION_BOUNDARY_WIDTH/4));
                _via_reg_ctx.stroke();
            } else {
                // draw a boundary line on both sides
                _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_LINE_COLOR;
                _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH/4;
                _via_reg_ctx.beginPath();
                _via_reg_ctx.moveTo(parseInt(all_points_x[i-1]) + parseInt(VIA_THEME_REGION_BOUNDARY_WIDTH/4),
                                    parseInt(all_points_y[i-1]) + parseInt(VIA_THEME_REGION_BOUNDARY_WIDTH/4));
                _via_reg_ctx.lineTo(parseInt(all_points_x[i]) + parseInt(VIA_THEME_REGION_BOUNDARY_WIDTH/4),
                                    parseInt(all_points_y[i]) + parseInt(VIA_THEME_REGION_BOUNDARY_WIDTH/4));
                _via_reg_ctx.stroke();
                _via_reg_ctx.beginPath();
                _via_reg_ctx.moveTo(parseInt(all_points_x[i-1]) - parseInt(VIA_THEME_REGION_BOUNDARY_WIDTH/4),
                                    parseInt(all_points_y[i-1]) - parseInt(VIA_THEME_REGION_BOUNDARY_WIDTH/4));
                _via_reg_ctx.lineTo(parseInt(all_points_x[i]) - parseInt(VIA_THEME_REGION_BOUNDARY_WIDTH/4),
                                    parseInt(all_points_y[i]) - parseInt(VIA_THEME_REGION_BOUNDARY_WIDTH/4));
                _via_reg_ctx.stroke();
            }
        }
    }
}

function _via_draw_point_region(cx, cy, is_selected) {
    if (is_selected) {
        _via_draw_point(cx, cy, VIA_REGION_POINT_RADIUS);
        
        _via_reg_ctx.strokeStyle = VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR;
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
        _via_reg_ctx.stroke();

        _via_reg_ctx.fillStyle = VIA_THEME_SEL_REGION_FILL_COLOR;
        _via_reg_ctx.globalAlpha = VIA_THEME_SEL_REGION_OPACITY;
        _via_reg_ctx.fill();
        _via_reg_ctx.globalAlpha = 1.0;
    } else {
        // draw a fill line
        _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_FILL_COLOR;
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH/2;
        _via_draw_point(cx, cy, VIA_REGION_POINT_RADIUS);
        _via_reg_ctx.stroke();

        // draw a boundary line on both sides of the fill line
        _via_reg_ctx.strokeStyle = VIA_THEME_BOUNDARY_LINE_COLOR;
        _via_reg_ctx.lineWidth = VIA_THEME_REGION_BOUNDARY_WIDTH/4;
        _via_draw_point(cx,
                        cy,
                        VIA_REGION_POINT_RADIUS - VIA_THEME_REGION_BOUNDARY_WIDTH/2);
        _via_reg_ctx.stroke();
        _via_draw_point(cx,
                        cy,
                        VIA_REGION_POINT_RADIUS + VIA_THEME_REGION_BOUNDARY_WIDTH/2);
        _via_reg_ctx.stroke();
    }
}

function _via_draw_point(cx, cy, r) {
    _via_reg_ctx.beginPath();
    _via_reg_ctx.arc(cx, cy, r, 0, 2*Math.PI, false);
    _via_reg_ctx.closePath();
}

function draw_all_region_id() { 
    _via_reg_ctx.shadowColor = "transparent";
    for (var i=0; i < _via_img_metadata[_via_image_id].regions.length; ++i) {
        var bbox = get_canvas_region_bounding_box(i);
        var x = bbox[0];
        var y = bbox[1];
        var w = Math.abs(bbox[2] - bbox[0]);
        var h = Math.abs(bbox[3] - bbox[1]);
        _via_reg_ctx.font = VIA_THEME_ATTRIBUTE_VALUE_FONT;

        var spc_dot = _via_reg_ctx.measureText('.').width
        var bgnd_rect_height = 1.8 * _via_reg_ctx.measureText('M').width;

	var annotation_str = (i+1);
	var bgnd_rect_width = _via_reg_ctx.measureText(annotation_str).width * 2;
	
	var r = _via_img_metadata[_via_image_id].regions[i].region_attributes;
	if (r.size == 1) {
	    // if there is a single attribute, display the attribute instead of region-id
	    for (var key of r.keys()) {
		annotation_str = r.get(key);
	    }
	    var strw = _via_reg_ctx.measureText(annotation_str).width;
	    if (strw > w) {
		// if text overflows, crop it
		var str_max = Math.floor((w * annotation_str.length) / strw);
		annotation_str = annotation_str.substr(0, str_max-1) + '.';
	    }
	    bgnd_rect_width = _via_reg_ctx.measureText(annotation_str).width * 1.25;	    
	}
	// center the label
	x = x - (bgnd_rect_width/2 - w/2);
	
        // first, draw a background rectangle first
        _via_reg_ctx.fillStyle = 'black';
        _via_reg_ctx.globalAlpha=0.8;
        _via_reg_ctx.fillRect(x,
                              y - 1.1*bgnd_rect_height,
                              bgnd_rect_width,
                              bgnd_rect_height);
        
        // then, draw text over this background rectangle
        _via_reg_ctx.globalAlpha=1.0;
        _via_reg_ctx.fillStyle = 'yellow';
        _via_reg_ctx.fillText(annotation_str, x+spc_dot, y-1.8*spc_dot);

    }
}

function get_canvas_region_bounding_box(region_id) {
    var bbox = new Array(4);
    var d = _via_canvas_regions[region_id].shape_attributes;
    switch( d.get('name') ) {
    case 'rect':
        bbox[0] = d.get('x');
        bbox[1] = d.get('y');
        bbox[2] = d.get('x') + d.get('width');
        bbox[3] = d.get('y') + d.get('height');;
        break;
        
    case 'circle':
        bbox[0] = d.get('cx') - d.get('r');
        bbox[1] = d.get('cy') - d.get('r');
        bbox[2] = d.get('cx') + d.get('r');
        bbox[3] = d.get('cy') + d.get('r');
        break;
        
    case 'ellipse':
        bbox[0] = d.get('cx') - d.get('rx');
        bbox[1] = d.get('cy') - d.get('ry');
        bbox[2] = d.get('cx') + d.get('rx');
        bbox[3] = d.get('cy') + d.get('ry');
        break;
        
    case 'polygon':
        var all_points_x = d.get('all_points_x');
        var all_points_y = d.get('all_points_y');

        var minx=Number.MAX_SAFE_INTEGER;
        var miny=Number.MAX_SAFE_INTEGER;
        var maxx=0;
        var maxy=0;
        for (var i=0; i<all_points_x.length; ++i) {
            if (all_points_x[i] < minx) {
                minx = all_points_x[i];
            }
            if (all_points_x[i] > maxx) {
                maxx = all_points_x[i];
            }
            if (all_points_y[i] < miny) {
                miny = all_points_y[i];
            }
            if (all_points_y[i] > maxy) {
                maxy = all_points_y[i];
            }
        }
        bbox[0] = minx;
        bbox[1] = miny;
        bbox[2] = maxx;
        bbox[3] = maxy;

        // place the region id box at any random vertex
        bbox[0] = all_points_x[0];
        bbox[1] = all_points_y[0];
        break;  

    case 'point':
        bbox[0] = d.get('cx') - VIA_REGION_POINT_RADIUS;
        bbox[1] = d.get('cy') - VIA_REGION_POINT_RADIUS;
        bbox[2] = d.get('cx') + VIA_REGION_POINT_RADIUS;
        bbox[3] = d.get('cy') + VIA_REGION_POINT_RADIUS;
        break;    
    }
    return bbox;
}

//
// Region collision routines
//
function is_inside_region(px, py, descending_order) {
    var N = _via_canvas_regions.length;
    if (N == 0) {
        return -1;
    }
    var start, end, del;
    // traverse the canvas regions in alternating ascending
    // and descending order to solve the issue of nested regions
    if (descending_order) {
        start = N - 1;
        end = -1;
        del = -1;
    } else {
        start = 0;
        end = N;
        del = 1;
    }

    var i = start;
    while (i != end) {
        var yes = is_inside_this_region(px, py, i);
        if (yes) {
            return i;
        }
        i = i + del;
    }
    return -1;
}

function is_inside_this_region(px, py, region_id) {
    var attr = _via_canvas_regions[region_id].shape_attributes;
    var result = false;
    switch ( attr.get('name') ) {
    case VIA_REGION_SHAPE.RECT:
        result = is_inside_rect(attr.get('x'),
                                attr.get('y'),
                                attr.get('width'),
                                attr.get('height'),
                                px, py);
        break;
    case VIA_REGION_SHAPE.CIRCLE:
        result = is_inside_circle(attr.get('cx'),
                                  attr.get('cy'),
                                  attr.get('r'),
                                  px, py);
        break;

    case VIA_REGION_SHAPE.ELLIPSE:
        result = is_inside_ellipse(attr.get('cx'),
                                   attr.get('cy'),
                                   attr.get('rx'),
                                   attr.get('ry'),
                                   px, py);
        break;

    case VIA_REGION_SHAPE.POLYGON:      
        result = is_inside_polygon(attr.get('all_points_x'),
                                   attr.get('all_points_y'),
                                   px, py);
        break;

    case VIA_REGION_SHAPE.POINT:
        result = is_inside_point(attr.get('cx'),
                                 attr.get('cy'),
                                 px, py);
        break;
    }
    return result;
}

function is_inside_circle(cx, cy, r, px, py) {
    var dx = px - cx;
    var dy = py - cy;
    if ((dx*dx + dy*dy) < r*r ) {
        return true;
    } else {
        return false;
    }
}

function is_inside_rect(x, y, w, h, px, py) {
    if ( px > x &&
         px < (x+w) &&
         py > y &&
         py < (y+h) ) {
        return true;
    } else {
        return false;
    }
}

function is_inside_ellipse(cx, cy, rx, ry, px, py) {
    var dx = (cx - px);
    var dy = (cy - py);
    if ( (((dx*dx)/(rx*rx)) + ((dy*dy)/(ry*ry))) < 1 ) {
        return true;
    } else {
        return false;
    }
}

// returns 0 when (px,py) is outside the polygon
// source: http://geomalgorithms.com/a03-_inclusion.html
function is_inside_polygon(all_points_x, all_points_y, px, py) {
    var wn = 0;    // the  winding number counter
    
    // loop through all edges of the polygon
    for (var i=0; i<all_points_x.length-1; ++i) {   // edge from V[i] to  V[i+1]
        var is_left_value = is_left( all_points_x[i], all_points_y[i],
                                     all_points_x[i+1], all_points_y[i+1],
                                     px, py);

        if (all_points_y[i] <= py) {
            if (all_points_y[i+1]  > py &&
                is_left_value > 0) {
                ++wn;
            }
        }
        else {
            if (all_points_y[i+1]  <= py &&
                is_left_value < 0) {
                --wn;
            }
        }
    }
    if ( wn == 0 ) {
        return 0;
    }
    else {
        return 1;
    }
}

function is_inside_point(cx, cy, px, py) {
    var dx = px - cx;
    var dy = py - cy;
    var r2 = VIA_POLYGON_VERTEX_MATCH_TOL * VIA_POLYGON_VERTEX_MATCH_TOL;
    if ((dx*dx + dy*dy) < r2 ) {
        return true;
    } else {
        return false;
    }
}

// returns
// >0 if (x2,y2) lies on the left side of line joining (x0,y0) and (x1,y1)
// =0 if (x2,y2) lies on the line joining (x0,y0) and (x1,y1)
// >0 if (x2,y2) lies on the right side of line joining (x0,y0) and (x1,y1)
// source: http://geomalgorithms.com/a03-_inclusion.html
function is_left(x0, y0, x1, y1, x2, y2) {
    return ( ((x1 - x0) * (y2 - y0))  - ((x2 -  x0) * (y1 - y0)) );
}

function is_on_region_corner(px, py) {
    var _via_region_edge = [-1, -1]; // region_id, corner_id [top-left=1,top-right=2,bottom-right=3,bottom-left=4]
    
    for (var i=0; i < _via_canvas_regions.length; ++i) {
        var attr = _via_canvas_regions[i].shape_attributes;
        var result = false;
        _via_region_edge[0] = i;
        
        switch ( attr.get('name') ) {
        case VIA_REGION_SHAPE.RECT:
            result = is_on_rect_edge(attr.get('x'),
                                     attr.get('y'),
                                     attr.get('width'),
                                     attr.get('height'),
                                     px, py);
            break;
        case VIA_REGION_SHAPE.CIRCLE:
            result = is_on_circle_edge(attr.get('cx'),
                                       attr.get('cy'),
                                       attr.get('r'),
                                       px, py);
            break;

        case VIA_REGION_SHAPE.ELLIPSE:
            result = is_on_ellipse_edge(attr.get('cx'),
                                        attr.get('cy'),
                                        attr.get('rx'),
                                        attr.get('ry'),
                                        px, py);
            break;

        case VIA_REGION_SHAPE.POLYGON:      
            result = is_on_polygon_vertex(attr.get('all_points_x'),
                                          attr.get('all_points_y'),
                                          px, py);
            break;
        case VIA_REGION_SHAPE.POINT:
	    // since there are no edges of a point
	    result = 0;
        }

        if (result > 0) {
            _via_region_edge[1] = result;
            return _via_region_edge;
        }
    }
    _via_region_edge[0] = -1;
    return _via_region_edge;
}

function is_on_rect_edge(x, y, w, h, px, py) {
    var dx0 = Math.abs(x - px);
    var dy0 = Math.abs(y - py);
    var dx1 = Math.abs(x + w - px);
    var dy1 = Math.abs(y + h - py);

    //[top-left=1,top-right=2,bottom-right=3,bottom-left=4]
    if ( dx0 < VIA_REGION_EDGE_TOL &&
         dy0 < VIA_REGION_EDGE_TOL ) {
        return 1;
    }
    if ( dx1 < VIA_REGION_EDGE_TOL &&
         dy0 < VIA_REGION_EDGE_TOL ) {
        return 2;
    }
    if ( dx1 < VIA_REGION_EDGE_TOL &&
         dy1 < VIA_REGION_EDGE_TOL ) {
        return 3;
    }

    if ( dx0 < VIA_REGION_EDGE_TOL &&
         dy1 < VIA_REGION_EDGE_TOL ) {
        return 4;
    }
    return 0;
}

function is_on_circle_edge(cx, cy, r, px, py) {
    var dx = cx - px;
    var dy = cy - py;
    if ( Math.abs(Math.sqrt( dx*dx + dy*dy ) - r) < VIA_REGION_EDGE_TOL ) {
        var theta = Math.atan2( py - cy, px - cx );
        if ( Math.abs(theta - (Math.PI/2)) < VIA_THETA_TOL ||
             Math.abs(theta + (Math.PI/2)) < VIA_THETA_TOL) {
            return 5;
        }
        if ( Math.abs(theta) < VIA_THETA_TOL ||
             Math.abs(Math.abs(theta) - Math.PI) < VIA_THETA_TOL) {
            return 6;
        }
        
        if ( theta >0 && theta < (Math.PI/2) ) {
            return 1;
        }
        if ( theta > (Math.PI/2) && theta < (Math.PI) ) {
            return 4;
        }
        if ( theta <0 && theta > -(Math.PI/2) ) {
            return 2;
        }
        if ( theta < -(Math.PI/2) && theta > -Math.PI ) {
            return 3;
        }
    } else {
        return 0;
    }
}

function is_on_ellipse_edge(cx, cy, rx, ry, px, py) {
    var dx = (cx - px)/rx;
    var dy = (cy - py)/ry;

    if ( Math.abs(Math.sqrt( dx*dx + dy*dy ) - 1) < VIA_ELLIPSE_EDGE_TOL ) {
        var theta = Math.atan2( py - cy, px - cx );
        if ( Math.abs(theta - (Math.PI/2)) < VIA_THETA_TOL ||
             Math.abs(theta + (Math.PI/2)) < VIA_THETA_TOL) {
            return 5;
        }
        if ( Math.abs(theta) < VIA_THETA_TOL ||
             Math.abs(Math.abs(theta) - Math.PI) < VIA_THETA_TOL) {
            return 6;
        }
        
        if ( theta >0 && theta < (Math.PI/2) ) {
            return 1;
        }
        if ( theta > (Math.PI/2) && theta < (Math.PI) ) {
            return 4;
        }
        if ( theta <0 && theta > -(Math.PI/2) ) {
            return 2;
        }
        if ( theta < -(Math.PI/2) && theta > -Math.PI ) {
            return 3;
        }
    } else {
        return 0;
    }
}

function is_on_polygon_vertex(all_points_x, all_points_y, px, py) {
    var n = all_points_x.length;
    for (var i=0; i<n; ++i) {
        if ( Math.abs(all_points_x[i] - px) < VIA_POLYGON_VERTEX_MATCH_TOL &&
             Math.abs(all_points_y[i] - py) < VIA_POLYGON_VERTEX_MATCH_TOL ) {
            return (POLYGON_RESIZE_VERTEX_OFFSET+i);
        }
    }
    return 0;
}

function _via_update_ui_components() {
    if ( !_via_is_window_resized && _via_current_image_loaded ) {
        show_message("Resizing window ...", VIA_THEME_MESSAGE_TIMEOUT_MS);
	canvas_panel.style.display = "block";
	via_start_info_panel.style.display = "none";
	about_panel.style.display = "none";
	getting_started_panel.style.display = "none";	
	
        _via_is_window_resized = true;
        show_image(_via_image_index);

        if (_via_is_canvas_zoomed) {
            reset_zoom_level();
        }
    }
}


window.addEventListener("keydown", function(e) {
    if (_via_is_user_updating_attribute_value ||
        _via_is_user_updating_attribute_name ||
        _via_is_user_adding_attribute_name) {
        
        return;
    }
    
    // user commands
    if ( e.ctrlKey ) {
        if ( e.which == 83 ) { // Ctrl + s
            download_all_region_data('csv');
            e.preventDefault();
            return;
        }

        if ( e.which == 65 ) { // Ctrl + a
            sel_all_regions();
            e.preventDefault();
            return;
        }

        if ( e.which == 67 ) { // Ctrl + c
            copy_sel_regions();
            e.preventDefault();
            return;
        }

        if ( e.which == 86 ) { // Ctrl + v
            paste_sel_regions();
            e.preventDefault();
            return;
        }
    }

    if( e.which == 46 || e.which == 8) { // Del or Backspace
        del_sel_regions();
        e.preventDefault();
    }    
    if (e.which == 78 || e.which == 39) { // n or right arrow
        move_to_next_image();
        e.preventDefault();
        return;
    }
    if (e.which == 80 || e.which == 37) { // n or right arrow
        move_to_prev_image();
        e.preventDefault();
        return;
    }
    if (e.which == 82 && _via_current_image_loaded) { // r
        //toggle_reg_attr_panel();
	toggle_region_boundary_visibility();
        return;
    }
    if (e.which == 73 && _via_current_image_loaded) { // f
        //toggle_file_attr_panel();
	toggle_region_id_visibility();
        return;
    }
    if (e.which == 32 && _via_current_image_loaded) { // Space
        toggle_img_list();
        return;
    }

    // zoom
    if (e.shiftKey && _via_current_image_loaded) {
        if (e.which == 61) { // + for zoom in
            zoom_in();
	    return;
        }
    }
    if (e.which == 173 && _via_current_image_loaded) { // - for zoom out
        zoom_out();
	return;
    }
    if (e.which == 61 && _via_current_image_loaded) { // = for zoom reset
        reset_zoom_level();
	return;
    }

    if ( e.which == 27 ) { // Esc
        if (_via_is_user_updating_attribute_value ||
            _via_is_user_updating_attribute_name ||
            _via_is_user_adding_attribute_name) {
            
            _via_is_user_updating_attribute_value = false;
            _via_is_user_updating_attribute_name = false;
            _via_is_user_adding_attribute_name = false;
            update_attributes_panel();
        }
        
        if ( _via_is_user_resizing_region ) {
            // cancel region resizing action
            _via_is_user_resizing_region = false;
        }
        
        if ( _via_is_region_selected ) {
            // clear all region selections
            _via_is_region_selected = false;
            _via_user_sel_region_id = -1;
            toggle_all_regions_selection(false);
        }

        if ( _via_is_user_drawing_polygon ) {
            _via_is_user_drawing_polygon = false;
            _via_canvas_regions.splice(_via_current_polygon_region_id, 1);
        }

        if ( _via_is_user_drawing_region ) {
            _via_is_user_drawing_region = false;
        }

        if ( _via_is_user_resizing_region ) {
            _via_is_user_resizing_region = false
        }

        if ( _via_is_user_updating_attribute_name ||
             _via_is_user_updating_attribute_value) {
            _via_is_user_updating_attribute_name = false;
            _via_is_user_updating_attribute_value = false;

        }

        if ( _via_is_user_moving_region ) {
            _via_is_user_moving_region = false
        }
        
        e.preventDefault();
        _via_redraw_reg_canvas();
	return;
    }
    if (e.which == 112) { // F1 for help
	show_getting_started_panel();
	e.preventDefault();
	return;
    }
    if (e.which == 113) { // F2 for about
        show_about_panel();
        e.preventDefault();
	return;
    }
    if (e.which == 121) { // F10 for debugging
	//toggle_debug_window();
	print_current_state_vars();
	print_current_image_data();
	return;
    }
});

//
// Shortcut key handlers
//
function del_sel_regions() {
    if (!_via_current_image_loaded) {
        show_message('First load some images!');
        return;
    }

    var del_region_count = 0;
    if (_via_is_all_region_selected) {
        del_region_count = _via_canvas_regions.length;  
        _via_canvas_regions.splice(0);
        _via_img_metadata[_via_image_id].regions.splice(0);
    } else {
        var sorted_sel_reg_id = [];
        for (var i=0; i<_via_canvas_regions.length; ++i) {
            if (_via_canvas_regions[i].is_user_selected) {
                sorted_sel_reg_id.push(i);
            }
        }       
        sorted_sel_reg_id.sort( function(a,b) {
            return (b-a);
        });
        for (var i=0; i<sorted_sel_reg_id.length; ++i) {
            _via_canvas_regions.splice( sorted_sel_reg_id[i], 1);
            _via_img_metadata[_via_image_id].regions.splice( sorted_sel_reg_id[i], 1);
            del_region_count += 1;
        }
    }

    _via_is_all_region_selected = false;
    _via_is_region_selected = false;
    _via_user_sel_region_id = -1;

    if (_via_canvas_regions.length == 0) {
        // all regions were deleted, hence clear region canvas
        _via_clear_reg_canvas();
    } else {
        _via_redraw_reg_canvas();
    }
    _via_reg_canvas.focus();
    update_attributes_panel();
    save_current_data_to_browser_cache();
    
    show_message('Deleted ' + del_region_count + ' selected regions');
}

function sel_all_regions() {
    if (!_via_current_image_loaded) {
        show_message('First load some images!');
        return;
    }

    toggle_all_regions_selection(true);
    _via_is_all_region_selected = true;
    _via_redraw_reg_canvas();
}

function copy_sel_regions() {
    if (!_via_current_image_loaded) {
        show_message('First load some images!');
        return;
    }

    if (_via_is_region_selected ||
        _via_is_region_selected) {
        _via_copied_image_regions.splice(0);
        _via_copied_canvas_regions.splice(0);
        for (var i=0; i<_via_img_metadata[_via_image_id].regions.length; ++i) {
            var img_region = _via_img_metadata[_via_image_id].regions[i];
            var canvas_region = _via_canvas_regions[i];
            if (canvas_region.is_user_selected) {
                _via_copied_image_regions.push( clone_image_region(img_region) );
                _via_copied_canvas_regions.push( clone_image_region(canvas_region) );
            }
        }
        show_message('Copied ' + _via_copied_image_regions.length +
                     ' selected regions. Press Ctrl + v to paste');
    } else {
        show_message('Select a region first!');
    }
}

function paste_sel_regions() {
    if (!_via_current_image_loaded) {
        show_message('First load some images!');
        return;
    }

    if (_via_copied_image_regions.length) {
        for (var i=0; i<_via_copied_image_regions.length; ++i) {
            _via_img_metadata[_via_image_id].regions.push( _via_copied_image_regions[i] );
            _via_canvas_regions.push( _via_copied_canvas_regions[i] );
        }
        show_message('Pasted ' + _via_copied_image_regions.length + ' regions');
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
    } else {
        show_message('To paste a region, you first need to select a region and copy it!');
    }
}

function move_to_prev_image() {
    if (_via_img_count > 0) {
        _via_is_region_selected = false;
        _via_user_sel_region_id = -1;
        
        _via_current_sel_region_id = -1;

	if (_via_is_canvas_zoomed) {
	    reset_zoom_level();
	}
	
        var current_img_index = _via_image_index;
        if ( _via_image_index == 0 ) {   
            show_image(_via_img_count - 1);
        } else {
            show_image(_via_image_index - 1);
        }

	if (typeof _via_hook_prev_image === 'function') {
	    _via_hook_prev_image(current_img_index);
	}
    }    
}

function move_to_next_image() {
    if (_via_img_count > 0) {
        _via_is_region_selected = false;
        _via_user_sel_region_id = -1;

        _via_current_sel_region_id = -1;

	if (_via_is_canvas_zoomed) {
	    reset_zoom_level();
	}
	
        var current_img_index = _via_image_index;
        if ( _via_image_index == (_via_img_count-1) ) {   
            show_image(0);
        } else {
            show_image(_via_image_index + 1);
        }

	if (typeof _via_hook_next_image === 'function') {
	    _via_hook_next_image(current_img_index);
	}
    }
}

function reset_zoom_level() {
    if (!_via_current_image_loaded) {
        show_message('First load some images!');
        return;
    }
    if (_via_is_canvas_zoomed) {
        _via_is_canvas_zoomed = false;
        _via_canvas_zoom_level_index = VIA_CANVAS_DEFAULT_ZOOM_LEVEL_INDEX

        var zoom_scale = VIA_CANVAS_ZOOM_LEVELS[_via_canvas_zoom_level_index];
        set_all_canvas_scale(zoom_scale);
        set_all_canvas_size(_via_canvas_width, _via_canvas_height);
        _via_canvas_scale = _via_canvas_scale_without_zoom;
        
        _via_load_canvas_regions(); // image to canvas space transform
        _via_redraw_img_canvas();       
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
        show_message('Zoom reset');
    } else {
        show_message('Cannot reset zoom because image zoom has not been applied!');
    }
}

function zoom_in() {
    if (!_via_current_image_loaded) {
        show_message('First load some images!');
        return;
    }

    if (_via_canvas_zoom_level_index == (VIA_CANVAS_ZOOM_LEVELS.length-1)) {
        show_message('Further zoom-in not possible', VIA_THEME_MESSAGE_TIMEOUT_MS);
    } else {
        _via_canvas_zoom_level_index += 1;
        
        _via_is_canvas_zoomed = true;
        var zoom_scale = VIA_CANVAS_ZOOM_LEVELS[_via_canvas_zoom_level_index];
        set_all_canvas_scale(zoom_scale);
        set_all_canvas_size(_via_canvas_width * zoom_scale,
                            _via_canvas_height * zoom_scale);
        _via_canvas_scale = _via_canvas_scale_without_zoom / zoom_scale;

        _via_load_canvas_regions(); // image to canvas space transform
        _via_redraw_img_canvas();
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
        show_message('Zoomed in to level ' + zoom_scale + 'X', VIA_THEME_MESSAGE_TIMEOUT_MS);
    }
}

function zoom_out() {
    if (!_via_current_image_loaded) {
        show_message('First load some images!');
        return;
    }

    if (_via_canvas_zoom_level_index == 0) {
        show_message('Further zoom-out not possible', VIA_THEME_MESSAGE_TIMEOUT_MS);
    } else {
        _via_canvas_zoom_level_index -= 1;
        
        _via_is_canvas_zoomed = true;
        var zoom_scale = VIA_CANVAS_ZOOM_LEVELS[_via_canvas_zoom_level_index];
        set_all_canvas_scale(zoom_scale);
        set_all_canvas_size(_via_canvas_width * zoom_scale,
                            _via_canvas_height * zoom_scale);
        _via_canvas_scale = _via_canvas_scale_without_zoom / zoom_scale;

        _via_load_canvas_regions(); // image to canvas space transform
        _via_redraw_img_canvas();
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
        show_message('Zoomed out to level ' + zoom_scale + 'X', VIA_THEME_MESSAGE_TIMEOUT_MS);
    }
}

function toggle_region_boundary_visibility() {
    _via_is_region_boundary_visible = !_via_is_region_boundary_visible;
    _via_redraw_reg_canvas();
    _via_reg_canvas.focus();
}

function toggle_region_id_visibility() {
    _via_is_region_id_visible = !_via_is_region_id_visible;
    _via_redraw_reg_canvas();
    _via_reg_canvas.focus();
}

//
// Update of user interface elements
// Communication from javascript to UI
//
function show_message(msg, t) {
    if ( _via_message_clear_timer ) {
        clearTimeout(_via_message_clear_timer); // stop any previous timeouts
    }
    var timeout = t;
    if (typeof t === 'undefined') {
        timeout = VIA_THEME_MESSAGE_TIMEOUT_MS;
    }
    document.getElementById('message_panel').innerHTML = msg;
    _via_message_clear_timer = setTimeout( function() {
        document.getElementById('message_panel').innerHTML = ' ';
    }, timeout);    
}

function show_filename_info() {
    if ( _via_current_image_loaded ) {
        var fileinfo = "(" + (_via_image_index+1) + " of " + _via_img_count + ") ";
        fileinfo += _via_current_image_filename;
        document.getElementById("fileinfo").innerHTML = fileinfo;
	document.getElementById("fileinfo").title = _via_current_image_filename;
    } else {
        document.getElementById("fileinfo").innerHTML = '';
    }
}

//
// Persistence of annotation data in localStorage
//

function check_local_storage() {
    // https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
    try {
        var x = '__storage_test__';
        localStorage.setItem(x, x);
        localStorage.removeItem(x);
        return true;
    }
    catch(e) {
        return false;
    }
}

function responseListener() {
    console.log(this.responseText);
}

function save_current_data_to_browser_cache() {
    setTimeout(function() {
        if ( _via_is_local_storage_available &&
             ! _via_is_save_ongoing) {
            try {
                _via_is_save_ongoing = true;
		var img_metadata = package_region_data('json');
		var timenow = new Date().toUTCString();
                localStorage.setItem('_via_timestamp', timenow);
                localStorage.setItem('_via_img_metadata', img_metadata);

		/* 
		// @todo: write code to push changes to github gistfile

		// push to web
		var d = new XMLHttpRequest();
		var str = '{"description": "' + timenow + '","files": {"via_region.txt": {"content":"' + JSON.stringify(img_metadata) +'"}}}';
		d.addEventListener('load', responseListener);
		d.open('PATCH', 'https://api.github.com/gists/d4220f5eaaf16bcb40a3e019ae6add8d?access_token=' + PERSONAL_ACCESS_TOKEN);
		d.send(str);
		console.log(str);
		*/
                // save attributes
                var attr = [];
                for (var attribute of _via_region_attributes) {
                    attr.push(attribute);
                }
                localStorage.setItem('_via_region_attributes', JSON.stringify(attr));
                _via_is_save_ongoing = false;
            } catch(err) {
                _via_is_save_ongoing = false;
                _via_is_local_storage_available = false;
                show_message('Failed to save data to browser cache. Please download the annotation data.');
                alert('Failed to save data to browser cache. Please download the annotation data.');
                console.log('Failed to save data to browser cache');
                console.log(err.message);
            }
        }
    }, 1000);
}

function is_via_data_in_localStorage() {
    if (localStorage.getItem('_via_timestamp')) {
        return true;
    } else {
        return false;
    }
}

function clear_localStorage() {
    localStorage.clear();
    show_home_panel();
}

function show_localStorage_recovery_options() {
    var hstr = [];
    var date_of_saved_data = new Date( parseInt(localStorage.getItem('_via_timestamp')) );
    
    hstr.push('<div style="padding: 1em; border: 1px solid #cccccc;">');
    hstr.push('<h3 style="border-bottom: 1px solid #5599FF">Data Recovery from Browser Cache</h3>');
    hstr.push('<ul><li>Data saved on : ' + date_of_saved_data);
    hstr.push('<br/><span class="action_text_link" onclick="download_localStorage_data(\'csv\')" title="Recover annotation data">[Save as CSV]</span>');
    hstr.push(' | ');
    hstr.push('<span class="action_text_link" onclick="download_localStorage_data(\'json\')" title="Recover annotation data">[Save as JSON]</span>');
    hstr.push(' | ');
    hstr.push('<span class="action_text_link" onclick="clear_localStorage()" title="Discard annotation data">[Discard Data]</span>');
    hstr.push('</li></ul>');
    
    hstr.push('<p><b>If you continue, the cached data will be discarded!</b></p></div>');
    via_start_info_panel.innerHTML += hstr.join('');
}

function download_localStorage_data(type) {
    switch(type) {
    case 'csv':
        var d = JSON.parse( localStorage.getItem('_via_img_metadata') );

        var csvdata = [];
        var csvheader = "#filename,file_size,file_attributes,region_count,region_id,region_shape_attributes,region_attributes";
        csvdata.push(csvheader);

        for (var image_id in d) {
            // copy file attributes
            var file_attr_map = new Map();
            for (var key in d[image_id].file_attributes) {
                file_attr_map.set(key, d[image_id].file_attributes[key]);
            }

            var prefix_str = d[image_id].filename;
            prefix_str += "," + d[image_id].size;
            prefix_str += "," + attr_map_to_str( file_attr_map );

            // copy regions
            var regions = d[image_id].regions;
            var region_count = 0;
            for (var i in regions) {
                region_count += 1;
            }
            
            for (var i in regions) {
                var region_shape_attr_str = region_count + ',' + i + ',';
                
                var regioni = new ImageRegion();
                for (var key in regions[i].shape_attributes) {
                    regioni.shape_attributes.set(key, regions[i].shape_attributes[key]);
                }
                for (var key in regions[i].region_attributes) {
                    regioni.region_attributes.set(key, regions[i].region_attributes[key]);
                }
                region_shape_attr_str += attr_map_to_str( regioni.shape_attributes );
                var region_attr_str = attr_map_to_str( regioni.region_attributes );
                console.log('\n' + prefix_str + ',' + region_shape_attr_str + ',' + region_attr_str);
                csvdata.push('\n' + prefix_str + ',' + region_shape_attr_str + ',' + region_attr_str);
            }
        }

        var localStorage_data_blob = new Blob( csvdata,
                                               {type: 'text/csv;charset=utf-8'});

        save_data_to_local_file(localStorage_data_blob, 'via_region_data.csv');

        break;
    case 'json':
        var localStorage_data_blob = new Blob( [localStorage.getItem('_via_img_metadata')],
                                               {type: 'text/json;charset=utf-8'});

        save_data_to_local_file(localStorage_data_blob, 'via_region_data.json');
        break;
    }
    
}

//
// Handlers for attributes input panel (spreadsheet like user input panel)
//
function attr_input_focus(i) {
    select_only_region(i);
    _via_redraw_reg_canvas();
    _via_is_user_updating_attribute_value=true;
}

function attr_input_blur(i) {
    set_region_select_state(i, false);
    _via_is_user_updating_attribute_value=false;
    _via_redraw_reg_canvas();
}

// header is a Set()
// data is an array of Map() objects
function init_spreadsheet_input(type, col_headers, data, row_names) {
    
    if (typeof row_names === 'undefined') {
        var row_names = [];
        for (var i=0; i<data.length; ++i) {
            row_names[i] = i+1;
        }
    }
    var attrname = '';
    switch(type) {
    case 'region_attributes':
        attrname = 'Region Attributes';
        break;
    case 'file_attributes':
        attrname = 'File Attributes';
        break;
    }
    
    var hstr = '<div style="display: inline-block;" class="title">';
    hstr += attrname + '</div>';
    hstr += '<table id="' + type + '"></table>';  

    var attrtable = document.createElement('TABLE');   
    var firstrow = attrtable.insertRow(0);

    // top-left cell
    var topleft_cell = firstrow.insertCell(0);
    topleft_cell.innerHTML = '';
    topleft_cell.style.border = 'none';

    for (var col_header of col_headers) {
        firstrow.insertCell(-1).innerHTML = '<b>' + col_header + '</b>';
    }
    // allow adding new attributes
    firstrow.insertCell(-1).innerHTML = '<input type="text"' +
        ' onchange="add_new_attribute(\'' + type[0] + '\', this.value)"' +
        ' value = "[ Add New ]"' +
        ' onblur="_via_is_user_adding_attribute_name=false; this.value = \'\';"' +
        ' onfocus="_via_is_user_adding_attribute_name=true; this.value = \'\';" />';

    // if multiple regions are selected, show the selected regions first
    var sel_reg_list = [];
    var remaining_reg_list = [];
    var all_reg_list = [];
    var region_travesal_order = [];
    if (type == 'region_attributes') {
        // count number of selected regions
        for (var i=0; i<data.length; ++i) {
            all_reg_list.push(i);
            if (data[i].is_user_selected) {
                sel_reg_list.push(i);
            } else {
                remaining_reg_list.push(i);
            }           
        }
        if (sel_reg_list.length > 1) {
            region_traversal_order = sel_reg_list.concat(remaining_reg_list);
        } else {
            region_traversal_order = all_reg_list;
        }
    }
    
    var sel_rows = [];
    for (var i=0; i<data.length; ++i) {
        var rowi = i;

        // if multiple regions are selected, show the selected regions first
        var di;
        if (type == 'region_attributes') {
            if (sel_reg_list.length) {
                rowi = region_traversal_order[rowi];
            }
            di = data[rowi].region_attributes;
        } else {
            di = data[rowi];
        }
        
        var row = attrtable.insertRow(-1);
        var region_id_cell = row.insertCell(0);
        region_id_cell.innerHTML = '' + row_names[rowi] + '';
        region_id_cell.style.fontWeight = 'bold';       
        region_id_cell.style.width = '2em';

        if (data[rowi].is_user_selected) {
            region_id_cell.style.backgroundColor = '#5599FF';
            sel_rows.push(row);
        }

        for (var key of col_headers) {
            var input_id = type[0] + '#' + key + '#' + rowi;

            if ( di.has(key) ) {
                var ip_val = di.get(key);
                if (ip_val.length > 30) {
                    row.insertCell(-1).innerHTML = '<textarea ' +
                        ' rows="' + (Math.floor(ip_val.length/30)-1) + '"' +
                        ' cols="30"' +
                        ' id="' +   input_id + '"' +
                        ' autocomplete="on"' +
                        ' onchange="update_attribute_value(\'' + input_id + '\', this.value)"' +
                        ' onblur="attr_input_blur(' + rowi + ')"' + 
                        ' onfocus="attr_input_focus(' + rowi + ');"' +
                        ' >' + ip_val + '</textarea>';
                } else {
                    row.insertCell(-1).innerHTML = '<input type="text"' +
                        ' id="' +   input_id + '"' +
                        ' value="' + ip_val + '"' +
                        ' autocomplete="on"' +
                        ' onchange="update_attribute_value(\'' + input_id + '\', this.value)"' +
                        ' onblur="attr_input_blur(' + rowi + ')"' + 
                        ' onfocus="attr_input_focus(' + rowi + ');" />';
                }
            } else {
                row.insertCell(-1).innerHTML = '<input type="text"' +
                    ' id="' + input_id + '"' +
                    ' onchange="update_attribute_value(\'' + input_id + '\', this.value)" ' +
                    ' onblur="attr_input_blur(' + rowi + ')"' + 
                    ' onfocus="attr_input_focus(' + rowi + ');" />';
            }
        }
    }

    document.getElementById('attributes_panel').innerHTML = '';
    document.getElementById('attributes_panel').appendChild(attrtable);
    document.getElementById('attributes_panel').focus();

    // move vertical scrollbar automatically to show the selected region (if any)
    if (sel_rows.length == 1) {
        var panelHeight = bottom_panel.offsetHeight;
        var sel_row_bottom = sel_rows[0].offsetTop + sel_rows[0].clientHeight
        if (sel_row_bottom > panelHeight) {
            bottom_panel.scrollTop = sel_rows[0].offsetTop;
        } else {
            bottom_panel.scrollTop = 0;
        }
    } else {
        bottom_panel.scrollTop = 0;
    }
}

function update_attributes_panel(type) {
    if (_via_current_image_loaded &&
        _via_is_bottom_panel_visible) {
        if (_via_is_reg_attr_panel_visible) {
            update_region_attributes_input_panel();
        }

        if (_via_is_file_attr_panel_visible) {
            update_file_attributes_input_panel();
        }
    }
}

function update_region_attributes_input_panel() {
    init_spreadsheet_input('region_attributes',
                           _via_region_attributes,
                           _via_img_metadata[_via_image_id].regions);

}

function update_file_attributes_input_panel() {
    init_spreadsheet_input('file_attributes',
                           _via_file_attributes,
                           [_via_img_metadata[_via_image_id].file_attributes],
                           [_via_current_image_filename]);
}

function toggle_reg_attr_panel() {
    if (_via_current_image_loaded) {
        var panel = document.getElementById('reg_attr_panel_button');
        panel.classList.toggle('active');
        if (_via_is_bottom_panel_visible) {
            if(_via_is_reg_attr_panel_visible) {
                bottom_panel.style.display = 'none';
                _via_is_bottom_panel_visible = false;
                _via_is_reg_attr_panel_visible = false;
		_via_reg_canvas.focus();
            } else {
                update_region_attributes_input_panel();
                _via_is_reg_attr_panel_visible = true;
                _via_is_file_attr_panel_visible = false;
                // de-activate the file-attr accordion panel
                var panel = document.getElementById('file_attr_panel_button');
                panel.classList.toggle('active');

		bottom_panel.focus();
            }
        } else {
            _via_is_bottom_panel_visible = true;
            update_region_attributes_input_panel();
            _via_is_reg_attr_panel_visible = true;
            bottom_panel.style.display = 'block';
	    bottom_panel.focus();
        }
    } else {
        show_message('Please load some images first');
    }
}

function toggle_file_attr_panel() {
    if (_via_current_image_loaded) {
        var panel = document.getElementById('file_attr_panel_button');
        panel.classList.toggle('active');
        if (_via_is_bottom_panel_visible) {
            if(_via_is_file_attr_panel_visible) {
                bottom_panel.style.display = 'none';
                _via_is_bottom_panel_visible = false;
                _via_is_file_attr_panel_visible = false;
            } else {
                update_file_attributes_input_panel();
                _via_is_file_attr_panel_visible = true;
                _via_is_reg_attr_panel_visible = false;

                // de-activate the reg-attr accordion panel
                var panel = document.getElementById('reg_attr_panel_button');
                panel.classList.toggle('active');
            }
        } else {
            _via_is_bottom_panel_visible = true;
            update_file_attributes_input_panel();
            _via_is_file_attr_panel_visible = true;
            bottom_panel.style.display = 'block';
        }
    } else {
        show_message('Please load some images first');
    }
}

function update_attribute_value(attr_id, value) {
    var attr_id_split = attr_id.split('#');
    var type = attr_id_split[0];
    var attribute_name = attr_id_split[1];
    var region_id = attr_id_split[2];

    // replace all double-quotation with a single quotation
    value = value.replace(/'/g, VIA_EXPORT_DOUBLE_QUOTE_REPLACEMENT);
    value = value.replace(/"/g, VIA_EXPORT_DOUBLE_QUOTE_REPLACEMENT);
    
    switch(type) {
    case 'r':
        var region = _via_img_metadata[_via_image_id].regions[region_id];
        region.region_attributes.set(attribute_name, value);
        update_region_attributes_input_panel();
        break;
    case 'f':
        _via_img_metadata[_via_image_id].file_attributes.set(attribute_name, value);
        update_file_attributes_input_panel();
        break;
    }
    set_region_select_state(region_id, false);
    _via_is_user_updating_attribute_value = false;
    
    if (_via_is_region_id_visible) {
	draw_all_region_id();
    }
}

function add_new_attribute(type, attribute_name) {
    switch(type) {
    case 'r':
        if (!_via_region_attributes.has(attribute_name)) {
            _via_region_attributes.add(attribute_name);
        }
        update_region_attributes_input_panel(); 
        break;
    case 'f':
        if (!_via_file_attributes.has(attribute_name)) {
            _via_file_attributes.add(attribute_name);
            /*
            // add this attribute to all images
            for (image_id in _via_img_metadata) {
            _via_img_metadata[image_id].file_attributes.set(attribute_name, '');
            }
	    */
        }
        update_file_attributes_input_panel();
        break;
    }
    _via_is_user_adding_attribute_name = false;
}

function toggle_accordion_panel(e) {
    e.classList.toggle('active');
    e.nextElementSibling.classList.toggle('show');
}

//
// hooks for sub-modules
// implemented by sub-modules
//
//function _via_hook_next_image() {}
//function _via_hook_prev_image() {}

//
// debug
//
function toggle_debug_window() {
    if (_via_is_debug_window_visible) {
	_via_is_debug_window_visible = false;
	_via_debug_window.close();
    } else {
	_via_debug_window = window.open("",
					"Debug messages : VGG Image Annotator",
					_via_debug_window_features);
	_via_is_debug_window_visible = true;	
	_via_debug_window.document.write(VIA_NAME + ' (' +
					 VIA_SHORT_NAME + ') version ' + VIA_VERSION +
					 ' (' + new Date().toUTCString()+ ')');
	var wn = window.navigator;
	platform = wn.platform.toString();
	userAgent = wn.userAgent;
	_via_debug('Platform : ' + platform);
	_via_debug('User agent : ' + userAgent);
    }
}

function _via_debug(s) {
    if(_via_is_debug_window_visible) {
	_via_debug_window.document.write('<br/>' + s);
    }
}

function print_current_state_vars() {
    //console.log(localStorage);
    console.log('\n_via_is_user_drawing_region'+_via_is_user_drawing_region+
                '\n_via_current_image_loaded'+_via_current_image_loaded+
                '\n_via_is_window_resized'+_via_is_window_resized+
                '\n_via_is_user_resizing_region'+_via_is_user_resizing_region+
                '\n_via_is_user_moving_region'+_via_is_user_moving_region+
                '\n_via_is_user_drawing_polygon'+_via_is_user_drawing_polygon+
                '\n_via_is_region_selected'+_via_is_region_selected+
                '\n_via_is_user_updating_attribute_name'+_via_is_user_updating_attribute_name+
                '\n_via_is_user_updating_attribute_value'+_via_is_user_updating_attribute_value+
               '\n_via_is_user_adding_attribute_name'+_via_is_user_adding_attribute_name);
}

function print_current_image_data() {
    console.log(_via_img_metadata);
    for ( var image_id in _via_img_metadata) {
        console.log(fn);
        var fn = _via_img_metadata[image_id].filename;
        var logstr = [];
        logstr.push("[" + fn + "] : ");

        var img_regions = _via_img_metadata[image_id].regions;
        for ( var i=0; i<img_regions.length; ++i) {
            var attr = img_regions[i].shape_attributes;
            var img_region_str = '\n\t_via_img_metadata[i].regions.shape_attributes = [';
            for ( var key of attr.keys() ) {
                img_region_str += key + ':' + attr.get(key) + ';';
            }
            logstr.push(img_region_str + ']');

            var attr = img_regions[i].region_attributes;
            var img_region_str = '\n\t_via_img_metadata[i].regions.region_attributes = [';
            for ( var key of attr.keys() ) {
                img_region_str += key + ':' + attr.get(key) + ';';
            }
            logstr.push(img_region_str + ']');
        }

        if ( _via_image_id == image_id ) {
            for ( var i=0; i<_via_canvas_regions.length; ++i) {
                var canvas_region_str = '\n\t_via_canvas_regions = [';
                for ( var key of _via_canvas_regions[i].shape_attributes.keys() ) {
                    var value = _via_canvas_regions[i].shape_attributes.get(key);
                    canvas_region_str += key + ':' + value + ';';
                }
                logstr.push(canvas_region_str + ']');
            }
        }
        //console.log(logstr.join(''));
    }
}
