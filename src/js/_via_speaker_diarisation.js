'use strict'

var data = new _via_data();
var io = new _via_io(data);

_via_restore_deactivate();
/*
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
*/

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
var file_manager = new _via_file_manager(filelist_element, data, annotator);
file_manager._init();

function _via_on_browser_resize() {
  annotator.emit_event('container_resize', {});
}

if ( true ) {
  var metadata_uri = 'http://zeus.robots.ox.ac.uk/bsl/voxceleb/val/output.max6spk.pad0p10.4col_VIA.txt';
  _via_util_remote_get(metadata_uri).then( function(file_content) {
    try {
      var VIDEO_URI_PREFIX = 'http://zeus.robots.ox.ac.uk/bsl/voxceleb/val/avi/';
      var accept_uri_list = [
        'id10016/hgB5ziAudzU/vid1.mp4',
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
            d.metadata_store[mid] = new _via_metadata(mid, [t0, t1], [], { '0':speakerid });
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
