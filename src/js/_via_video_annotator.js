'use strict'

var data = new _via_data();

data.attribute_add('Keywords',
                _VIA_ATTRIBUTE_TYPE.TEXT);
data.attribute_add('Activity',
                   _VIA_ATTRIBUTE_TYPE.SELECT,
                   {
                     'walk':'Walk',
                     'eat':'Eat',
                     'run':'Run',
                     'sleep':'Sleep',
                     'none':'None'
                   },
                   'none');

//-- debug code start
var remote_uri_list = [
  'https://upload.wikimedia.org/wikipedia/commons/b/bd/US-WA-Olympia-NisquallyWildlifeRefuge-Heron.webm',
  'https://upload.wikimedia.org/wikipedia/commons/a/a7/Wood_mouse_%28Apodemus_sylvaticus%29.webm',
  'https://upload.wikimedia.org/wikipedia/commons/3/37/Flock_of_birds_near_Padilla_Bay.webm',
  'https://upload.wikimedia.org/wikipedia/commons/7/7b/Mud_volcano_Paclele_mici.webm',
  'https://upload.wikimedia.org/wikipedia/commons/6/68/A_Trip_Down_Market_Street_%28High_Res%29.webm',
  'https://upload.wikimedia.org/wikipedia/commons/c/ce/Pedestrians_in_Buchanan_Street%2C_Glasgow.webm',
];

var local_uri_list = [
  'file:///data/svt/videos/Moon_transit_of_sun_large.mp4',
  'file:///data/svt/videos/Alex_Ovechkin_swing_and_a_miss_-NHLAllStar_-365.mp4',
  'file:///data/svt/videos/mouse.mp4',
  'file:///data/svt/videos/svt_demo_fish_25fps.mp4',
  'file:///data/svt/videos/US-WA-Olympia-NisquallyWildlifeRefuge-Heron.mp4',
  'file:///data/svt/videos/Wood_cleaving_-_2016.mp4',
];

var i, fid;
for ( i = 0; i < local_uri_list.length; ++i ) {
  fid = data.file_add(_via_util_get_filename_from_uri( local_uri_list[i] ),
                      _VIA_FILE_TYPE.VIDEO,
                      _VIA_FILE_LOC.URIFILE,
                      local_uri_list[i]
                     );
}

//-- debug code end

var annotator_container = document.getElementById('annotator_container');
var segmenter_container = document.getElementById('segmenter_container');
var annotator = new _via_annotator(annotator_container, segmenter_container, data);

//var project_container = document.getElementById('project_container');
//var project = new _via_project(project_container, data, annotator);

var editor_container = document.getElementById('editor_container');
var editor = new _via_editor(editor_container, data, annotator);

var filelist_element = document.getElementById('file_manager_filelist');
var file_manager = new _via_file_manager(filelist_element, data, annotator);

// for debugging, show one of the files
annotator.file_show_fid(fid);

function _via_on_browser_resize() {
  annotator.on_browser_resize();
}

function _via_toggle_metadata_and_attribute_editor() {
  if ( editor_container.classList.contains('hide') ) {
    document.getElementById('annotator_container').style.height = '65vh';
    document.getElementById('editor_container').style.height = '30vh';
    editor_container.classList.remove('hide');
  } else {
    document.getElementById('annotator_container').style.height = '95vh';
    editor_container.classList.add('hide');
  }
  annotator.on_browser_resize();
}
