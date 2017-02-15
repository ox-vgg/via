var FILE_BEGIN_TAG = '########## NEW FILE ##########';
var KEYVAL_SEPERATOR = ':';
var REGION_BEGIN_TAG = 'object';

var VIA_IMPORT_CSV_COMMENT_CHAR = '#';
var VIA_IMPORT_CSV_KEYVAL_SEP_CHAR = ';';
var VIA_EXPORT_CSV_ARRAY_SEP_CHAR = ':';
var VIA_CSV_SEP_CHAR = ',';

var filename_size_map = new Map();

function import_from_local_file(selected_files) {
    show_message(' ', false);

    for (var i=0; i<selected_files.length; ++i) {
        console.log(selected_files[i].type);
        switch(selected_files[i].type) {
        case 'image/jpeg':
            filename_size_map.set(selected_files[i].name, selected_files[i].size);
            break;
        case '':
        case 'text/plain':
            load_text_file(selected_files[i], process_file);
            break;
        }
    }
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


function _via_get_image_id(filename, size) {
    return filename + size;
}

function process_file(data) {
    console.log(data);
    show_message(' ', false);
    var lines = data.split('\n');

    var state_processing_file = false;
    var state_processing_region = false;
    var filename;
    var region_attributes = '';
    var region_shape_attributes = '';
    var csvdata = [];
    var csvline = '';
    var region_id = 0;

    var _via_images_as_obj = {};
    var image_data = {};
    var regioni = {};
    var image_id = '';

    for (var i=0; i<lines.length; ++i) {
        if (lines[i] == FILE_BEGIN_TAG) {

            if (state_processing_file &&
                state_processing_region) {
                // add the collected region info to csv
                if (filename_size_map.has(filename)) {
                    image_data.regions.push(regioni);
                }
            }

            state_processing_file = false;
            state_processing_region = false;
            filename = '';
        } else {
            if (lines[i] == '') { // blank line
                continue;
            }

            console.log('line ' + i + ' = ' + lines[i]);
            var keyval_sep_index = lines[i].indexOf(KEYVAL_SEPERATOR);
            var keyvalue = [lines[i].substring(0, keyval_sep_index),
                            lines[i].substring(keyval_sep_index+1)];

            var key = keyvalue[0].trim();
            var value = keyvalue[1].trim();

            if (key == 'file') {
                filename = value.substring(value.lastIndexOf('/')+1);
                show_message('Processing file ' + filename);
                state_processing_file = true;
                region_id = 0;

                image_data = {};
                image_data.filename = filename;
                image_data.size = filename_size_map.get(filename);
                image_data.regions = [];

                image_id = _via_get_image_id(image_data.filename, image_data.size);
                _via_images_as_obj[image_id] = image_data;
                continue;
            }

            if ( key == 'object' ) {
                if (state_processing_file) {
                    if (state_processing_region) {
                        // add the collected region info to csv
                        if (filename_size_map.has(filename)) {
                            image_data.regions.push(regioni);

                            regioni = {};
                            regioni.shape_attributes = {};
                            regioni.region_attributes = {};
                        }
                    } else {
                        regioni = {};
                        regioni.shape_attributes = {};
                        regioni.region_attributes = {};
                        state_processing_region = true;
                    }
                    continue;
                } else {
                    console.log('Unexpected key encountered! (key,value) = (' + key + ',' + value + ')' + ', filename=' + filename);
                }
            }

            if ( state_processing_file &&
                 state_processing_region ) {
                switch(key) {

                case 'artistic_style':
                case 'creator_of_the_image_and_description_(owners_institution':
                case 'creator_of_the_image_and_description_(scholar)':
                case 'date_that_the_image_was_made':
                case 'folio':
                case 'iconclass':
                case 'internal_number_of_object':
                case 'keywords':
                case 'name':
                case 'state_of_conservation':
                case 'type_of_cut':
                    regioni.region_attributes[key] = replace_special_chars(value);
                    break;

                case 'bbox':
                    var d = value.split(',');
                    regioni.shape_attributes.name = 'rect';
                    regioni.shape_attributes.x = parseInt(d[0]);
                    regioni.shape_attributes.y = parseInt(d[1]);
                    regioni.shape_attributes.width = parseInt(d[2]);
                    regioni.shape_attributes.height = parseInt(d[3]);
                    break;
                }
            }
        }
    }
    console.log(_via_images_as_obj);
/*
    var all_data_blob = new Blob([JSON.stringify(_via_images_as_obj)], {type: 'text/json;charset=utf-8'});
    save_data_to_local_file(all_data_blob, 'annotations.json');
*/
}

function replace_special_chars(data) {
    data = data.replace(/"/g, '\"');
    /*
      data = data.replace(/,/g, '{comma}');
      data = data.replace(/:/g, '{colon}');
      data = data.replace(/;/g, '{scolon}');
      data = data.replace(/=/g, '{eq}');
    */
    return data;
}

function show_message(info, append) {
    if (append)
        document.getElementById('log').innerHTML += info;
    else
        document.getElementById('log').innerHTML = info;
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
