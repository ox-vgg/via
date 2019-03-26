'use strict'

//var _VIA_PROJECT_DS_URI = 'http://zeus.robots.ox.ac.uk/via/ds/chimp_2012_2013/';
var _VIA_PROJECT_DS_URI = 'http://127.0.0.1:5984/chimp_2012_2013/';
var _VIA_GROUP_DEFAULT_GID_LIST = [ "FANA", "FANLE", "FLANLE", "FOAF", "FOTAIU", "JEJE", "JIRE", "JOYA", "JURU", "KAI", "NINA", "NOTSURE", "NTO","PAMA", "PELEY", "PILI", "POKURU", "PONI", "TUA", "VELU", "VUAVUA", "YO", "OLO" ];

var data = new _via_data();
var io = new _via_io(data);

//_via_restore_deactivate();

var store = new _via_store_localstorage(data);
if ( store.is_store_available() ) {
  store.prev_session_data_init().then( function(ok) {
    if ( store.prev_session_is_available() ) {
      _via_restore_activate();
    } else {
      _via_restore_deactivate();
    }
    if ( store._init() ) {
      data._store_add('localStorage', store);
    }
  }.bind(this), function(err) {
    _via_restore_deactivate();
    if ( store._init() ) {
      data._store_add('localStorage', store);
    }
  }.bind(this));
}


function _via_restore_activate() {
  var button_container = document.getElementById('restore');
  var svg_child = button_container.getElementsByTagName('svg');
  var n = svg_child.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    svg_child[i].getElementsByTagName('title')[0].innerHTML += ' [' + store.prev_session_get_size() + ' bytes saved on ' + store.prev_session_get_timestamp() + ']';
  }
}

function _via_restore_deactivate() {
  var button_container = document.getElementById('restore');
  var svg_child = button_container.getElementsByTagName('svg');
  var n = svg_child.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    svg_child[i].classList.add('disabled_button');
    svg_child[i].setAttribute('onclick', '');
    svg_child[i].getElementsByTagName('title')[0].innerHTML = 'Restore feature disabled because your browser does not allow access to localStorage';
  }
}

var annotator_container = document.getElementById('annotator_container');
var annotator = new _via_annotator(annotator_container, data);
window.addEventListener('keydown', function(e) {
  // avoid handling events when text input field is in focus
  if ( e.target.type !== 'text' ) {
    annotator._on_event_keydown(e);
  }
});

var filelist_element = document.getElementById('file_manager_filelist');
var project_name_element = document.getElementById('_via_filemanager_project_name');
var file_manager = new _via_file_manager(data, annotator, filelist_element, project_name_element);
file_manager._init();

function _via_on_browser_resize() {
  annotator.emit_event('container_resize', {});
}

if ( true ) {
  var project_data = { '2013': [1,9] };

  var project_list = document.getElementById('project_list');
  var project_id_list = [];
  for ( var year in project_data ) {
    var start = project_data[year][0];
    var end = project_data[year][1];
    for ( var i = start; i <= end; ++i ) {
      var o = document.createElement('option');
      var project_index = i;
      if ( i > 0 && i < 10 ) {
        project_index = '00' + i;
      } else {
        if ( i > 9 && i < 100 ) {
          project_index = '0' + i;
        }
      }
      var label = year + '_' + project_index;
      var project_id = 'chimp_' + label;
      o.innerHTML = label;
      o.setAttribute('value', project_id);
      project_id_list.push(project_id);
      project_list.appendChild(o);
    }
  }
  _via_project_load_remote(project_id_list[0]); // default project

  project_list.addEventListener('change', function(e) {
    _via_project_load_remote(e.target.options[e.target.selectedIndex].value);
  }.bind(this));
}

function _via_project_load_remote(project_id) {
  var project_uri = _VIA_PROJECT_DS_URI + project_id;
  _via_util_remote_get(project_uri).then( function(file_content) {
    try {
      var project_data = JSON.parse(file_content);
      data._project_load( project_data );
    }
    catch(err) {
      _via_util_msg_show('Failed to load project [' + project_id + '] from malformed json data!', true);
      console.log(err)
    }
  }.bind(this), function(err) {
    _via_util_msg_show('Failed to load project [' + project_id + ']', true);
  }.bind(this));
}
