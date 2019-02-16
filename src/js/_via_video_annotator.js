'use strict'

var data = new _via_data();

data.attribute_add('Keywords',
                _VIA_ATTRIBUTE_TYPE.TEXT);
/*
data.attribute_add('Activity',
                   _VIA_ATTRIBUTE_TYPE.SELECT,
                   {
                     'talk':'Talk',
                     'play':'Play',
                     'eat':'Eat',
                     'sleep':'Sleep',
                     'run':'Run',
                     'walk':'Walk',
                     'none':'None'
                   },
                   'none');
*/

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
  'file:///data/datasets/via/debug_media/bbc_signdb_001.mp4',
  'file:///data/datasets/via/debug_media/bbc_signdb_003.mp4',
];

var i, fid;
for ( i = 0; i < local_uri_list.length; ++i ) {
  fid = data.file_add(_via_util_get_filename_from_uri( local_uri_list[i] ),
                      _VIA_FILE_TYPE.VIDEO,
                      _VIA_FILE_LOC.URIFILE,
                      local_uri_list[i]
                     );
}
/**/

data.metadata_add(fid, [0.567, 3.557], [], {'0':'talk'});
data.metadata_add(fid, [5.032, 13.557], [], {'0':'house'});
data.metadata_add(fid, [15.532, 20], [], {'0':'fire'});
data.metadata_add(fid, [35.532, 40], [], {'0':'jump'});
data.metadata_add(fid, [42.532, 50], [], {'0':'laugh'});
//data.metadata_segment_add(fid, [2.534, 5.751], {'0':'Lorem ipsum dolor sit amet, consectetur adipiscing elit', '1':'talk'});
//data.metadata_segment_add(fid, [3.895, 5.391, 6.241, 8.105], {'0':'segment label 2', '1':'walk'});

//-- debug code end

var annotator_container = document.getElementById('annotator_container');
var annotator = new _via_annotator(annotator_container, data);


//var project_container = document.getElementById('project_container');
//var project = new _via_project(project_container, data, annotator);


var editor_container = document.getElementById('editor_container');
var editor = new _via_editor(editor_container, data, annotator);

var filelist_element = document.getElementById('file_manager_filelist');
var file_manager = new _via_file_manager(filelist_element, data, annotator);

var io = new _via_io(data);

// for debugging, show one of the files
annotator.file_show_fid(fid);

window.addEventListener('keydown', function(e) {
  annotator._on_event_keydown(e);
});

function _via_on_browser_resize() {
  annotator.emit_event('container_resize', {});
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
