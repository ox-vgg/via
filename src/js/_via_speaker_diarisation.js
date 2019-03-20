'use strict'

var data = new _via_data();
var io = new _via_io(data);

//_via_restore_deactivate();

var store = new _via_store_localstorage(data);
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
  var project_list = document.getElementById('project_list');
  for ( var i = 1; i < 694; ++i ) {
    var o = document.createElement('option');
    var label = i;
    if ( i > 0 && i < 10 ) {
      label = '00' + i;
    } else {
      if ( i > 9 && i < 100 ) {
        label = '0' + i;
      }
    }
    o.innerHTML = "Load Project: " + label;
    o.setAttribute('value', 'voxceleb_val_693_' + label);
    project_list.appendChild(o);
  }
  _via_project_load_remote('voxceleb_val_693_001'); // default project

  project_list.addEventListener('change', function(e) {
    _via_project_load_remote(e.target.options[e.target.selectedIndex].value);
  }.bind(this));
}

function _via_project_load_remote(project_id) {
  var voxceleb_project_baseuri = '';
  var project_uri = voxceleb_project_baseuri + project_id;
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

if ( false ) {
  var VIA_PROJECT_LIST = ["p1f9f7e66fd0d482a8ae7a38468cd308d","p1ff7175481f942389fcccef82857f9c6","p2c56bb12f48849669e9dce75c9f5929c","p3e79c313d04744eebc5203f9b7f293ec","p42c179d206e042ebbfbb02a6248f9461","p6f75428e279e4a75bca6374718670779","p81c738031f78436da4ef6e67341122f2","p9013cba11e2c40539fc4676c9c65764c","p9036d02214ec439c9eeff6e27ed20dcc","p9f9243bbe3434391a7d6583ff18475b6","pbd28c6ff99d540a9bc07a81dfbf7c3d0","pc33a5ad24b514c7fa943a023572b1aa3","pd9d5f56857c44b52afaf3df3d717ee3a","pe4b6c03af2f9428fa02040f85a8e58cc"];

  //var couchdb_url = 'http://zeus.robots.ox.ac.uk/via/';
  var couchdb_url = 'http://127.0.0.1:5984/';
  var store = new _via_store_couchdb(data, couchdb_url);
  if ( store._init() ) {
    data._store_add(_VIA_STORE_TYPE.COUCHDB, store);
    store._project_pull('v1ff7175481f942389fcccef82857f9c6');
  } else {
    console.warn('Failed to initialise couchdb store at: ' + couchdb_url);
  }
}

if ( false ) {
  var metadata_uri = 'http://zeus.robots.ox.ac.uk/bsl/voxceleb/val/output.max6spk.pad0p10.4col_VIA.txt';
  _via_util_remote_get(metadata_uri).then( function(file_content) {
    try {
      var VIDEO_URI_PREFIX = 'http://zeus.robots.ox.ac.uk/bsl/voxceleb/val/avi/';
      var accept_uri_list = [
        'id10016/hgB5ziAudzU/vid1.mp4',
/**/
        'id10013/fYVXJaLX4dA/vid1.mp4',
        'id10009/AtavJVP4bCk/vid1.mp4',
        'id10011/ujWHD_MTa44/vid1.mp4',
        'id10007/CzQPAaPrC-E/vid1.mp4',
        'id10002/eNc4LrrvV80/vid1.mp4',
        'id10003/5ablueV_1tw/vid1.mp4',
        'id10004/lu_eVSfv3Tg/vid1.mp4',
        'id10017/xH3Pp_5yxOk/vid1.mp4',
//        'id10018/EFFEzbt2k6o/vid1.mp4', // video file size = 0
        'id10019/dCpykP6iJnA/vid1.mp4',
        'id10020/zHAGrIElkDU/vid1.mp4',
//        'id10021/N3FVJ2-J7V8/vid1.mp4', // video file size = 0
        'id10022/y0UFutwJ-ow/vid1.mp4',
        'id10030/a2YPOY64vsA/vid1.mp4',
//        'id10037/2ekOREjUP4k/vid1.mp4', // video file size = 0
        'id10059/60Hs_ADeIWQ/vid1.mp4',
        'id10059/qM5FO3hHEbk/vid1.mp4',
        'id10115/3_JGA5CTRSk/vid1.mp4',
        'id10115/Iso1iWGXrls/vid1.mp4',

      ];

      if ( file_content === '' ) {
        console.warn('Empty metadata');
        return;
      }

      var d = {};
      // create project
      d.project_store = {
        'project_id':this.data._uuid(),
        'project_name':'via_project',
        'data_format_version':'3.0.0',
        'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
        'created': new Date().toString(),
        'updated': new Date().toString(),
      };

      // add attributes
      d.attribute_store = {};
      d.aid_list = [];
      var aid = this.data._attribute_get_new_id();
      d.attribute_store[aid] = new _via_attribute(aid,
                                                  'speaker',
                                                  _VIA_ATTRIBUTE_TYPE.TEXT
                                                 );
      d.aid_list.push(aid);

      // add files
      d.file_store = {};
      d.fid_list = [];
      var filesrc_to_fid_map = {};
      var i, fid, filesrc;
      for ( i = 0; i < accept_uri_list.length; ++i ) {
        fid = i;
        filesrc = VIDEO_URI_PREFIX + accept_uri_list[i];
        d.file_store[fid] = new _via_file(fid,
                                             accept_uri_list[i],
                                             _VIA_FILE_TYPE.VIDEO,
                                             _VIA_FILE_LOC.URIHTTP,
                                             filesrc,
                                            );
        d.fid_list.push(fid);
        filesrc_to_fid_map[filesrc] = fid;
      }

      // add all metadata
      d.metadata_store = {};
      d.file_mid_list = {};

      var line_split_regex = new RegExp('\n|\r|\r\n', 'g');
      var file_content_tokens = file_content.split(line_split_regex);
      var n = file_content_tokens.length;
      var line_tokens, fileuri, speakerid, t0, t1, mid;
      var i;
      var file_metadata = {};
      for ( i = 0; i < n; ++i ) {
        line_tokens = file_content_tokens[i].split(' ');
        if ( line_tokens.length === 4 ) {
          fileuri = VIDEO_URI_PREFIX + line_tokens[0];
          speakerid = line_tokens[1];
          t0 = parseFloat(line_tokens[2]);
          t1 = parseFloat(line_tokens[3]);

          if ( accept_uri_list.includes(line_tokens[0]) ) {
            fid = filesrc_to_fid_map[fileuri];
            mid = this.data._uuid();
            d.metadata_store[mid] = new _via_metadata([t0, t1], [], { '0':speakerid });
            if ( typeof(d.file_mid_list[fid]) === 'undefined' ) {
              d.file_mid_list[fid] = [];
            }
            d.file_mid_list[fid].push(mid);
          }
        }
      }

      this.data._project_load(d);
    }
    catch(err) {
      console.log(err);
    }
  }.bind(this), function(err) {
    console.log(err);
  });
}
