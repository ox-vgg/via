/**
 *
 * @class
 * @classdesc View manager
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 5 Apr. 2019
 *
 */

'use strict';

function _via_view_manager(data, view_annotator, container) {
  this.d = data;
  this.va = view_annotator;
  this.c = container;

  this.view_selector_vid_list = [];
  var is_view_filtered_by_regex = false;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_view_manager_';
  _via_event.call( this );

  this.d.on_event('project_loaded', this._on_event_project_loaded.bind(this));
  this.d.on_event('view_bulk_add', this._on_event_view_bulk_add.bind(this));
  this.d.on_event('view_del', this._on_event_view_del.bind(this));
  this.va.on_event('view_show', this._on_event_view_show.bind(this));
  this.va.on_event('view_next', this._on_event_view_next.bind(this));
  this.va.on_event('view_prev', this._on_event_view_prev.bind(this));

  this._init_ui_elements();
}

_via_view_manager.prototype._init = function() {
  this._init_ui_elements();
  this._view_selector_update();
}

_via_view_manager.prototype._init_ui_elements = function() {
  this.pname = document.createElement('input');
  this.pname.setAttribute('type', 'text');
  this.pname.setAttribute('id', 'via_project_name_input');
  this.pname.setAttribute('value', this.d.store.project.pname);
  this.pname.setAttribute('title', 'Project Name (click to update)');
  this.pname.addEventListener('change', this._on_pname_change.bind(this));

  this.view_selector = document.createElement('select');
  this.view_selector.setAttribute('class', 'view_selector');
  this.view_selector.setAttribute('title', 'Select a file for annotation');
  this.view_selector.addEventListener('change', this._on_view_selector_change.bind(this));

  this.view_filter_regex = document.createElement('input');
  this.view_filter_regex.setAttribute('type', 'text');
  this.view_filter_regex.setAttribute('class', 'view_filter_regex');
  this.view_filter_regex.setAttribute('title', 'Filter file list');
  this.view_filter_regex.setAttribute('placeholder', 'Search');
  this.view_filter_regex.addEventListener('input', this._on_view_filter_regex_change.bind(this));

  this.c.innerHTML = '';
  this.c.appendChild(this.pname);
  this.c.appendChild(this.view_selector);
  //this.c.appendChild(this.view_filter_regex);
}

//
// UI elements change listeners
//
_via_view_manager.prototype._on_pname_change = function() {
  this.d.store.project.pname = this.pname.getAttribute('value').trim();
}

_via_view_manager.prototype._on_view_selector_change = function(e) {
  var vid = e.target.options[e.target.selectedIndex].value;
  if ( vid !== this.va.vid ) {
    this.va.view_show(vid);
  }
}

_via_view_manager.prototype._on_next_view = function() {
  if ( this.view_selector.options.length ) {
    var vid = this.view_selector.options[this.view_selector.selectedIndex].value;
    var vindex = this.d.store.vid_list.indexOf(vid);
    if ( vindex !== -1 ) {
      var next_vindex = vindex + 1;
      if ( next_vindex < this.d.store.vid_list.length ) {
        this.va.view_show( this.d.store.vid_list[next_vindex] );
      } else {
        _via_util_msg_show('Reached end of the list!');
      }
    } else {
      _via_util_msg_show('Cannot move to next view!');
    }
  }
}

_via_view_manager.prototype._on_prev_view = function() {
  if ( this.view_selector.options.length ) {
    var vid = this.view_selector.options[this.view_selector.selectedIndex].value;
    var vindex = this.d.store.vid_list.indexOf(vid);
    if ( vindex !== -1 ) {
      var prev_vindex = vindex - 1;
      if ( prev_vindex >= 0 ) {
        this.va.view_show( this.d.store.vid_list[prev_vindex] );
      } else {
        _via_util_msg_show('Reached beginning of the list!');
      }
    } else {
      _via_util_msg_show('Cannot move to next view!');
    }
  }
}

_via_view_manager.prototype._on_event_view_show = function(data, event_payload) {
  var vid = event_payload.vid.toString();
  this.view_selector.selectedIndex = -1;

  // ensure that the view selector shows the view being displayed
  var n = this.view_selector.options.length;
  for ( var i = 0; i < n; ++i ) {
    if ( this.view_selector.options[i].value === vid ) {
      this.view_selector.selectedIndex = i;
      break;
    }
  }
}

_via_view_manager.prototype._on_event_view_next = function(data, event_payload) {
  this._on_next_view();
}

_via_view_manager.prototype._on_event_view_prev = function(data, event_payload) {
  this._on_prev_view();
}

_via_view_manager.prototype._on_event_project_loaded = function(data, event_payload) {
  this._init_ui_elements();
  this._view_selector_update();
  if ( this.d.store.vid_list.length ) {
    // show first view by default
    this.va.view_show( this.d.store.vid_list[0] );
  }
}

//
// View Selector
//
_via_view_manager.prototype._view_selector_clear = function() {
  this.view_selector.innerHTML = '';
  this.view_selector_vid_list = [];
}

_via_view_manager.prototype._view_selector_option_html = function(vindex, vid) {
  var oi = document.createElement('option');
  oi.setAttribute('value', vid);

  var file_count = this.d.store.view[vid].fid_list.length;
  var view_name;
  if ( file_count === 1 ) {
    var fid = this.d.store.view[vid].fid_list[0];
    view_name = this.d.store.file[fid].fname;
    oi.innerHTML = '[' + (parseInt(vindex)+1) + '] ' + decodeURI(view_name);
  } else {
    oi.innerHTML = '[' + (parseInt(vindex)+1) + ']';
  }
  return oi;
}

_via_view_manager.prototype._view_selector_update = function() {
  if ( this.is_view_filtered_by_regex ) {
    this._view_selector_update_regex();
  } else {
    this._view_selector_update_showall();
  }
}

_via_view_manager.prototype._view_selector_update_regex = function(regex) {
  if ( regex === '' ||
       typeof(regex) === 'undefined'
     ) {
    this._view_selector_update_showall();
  } else {
    var existing_vid = this.view_selector.options[this.view_selector.selectedIndex].value;
    this._view_selector_clear();
    var vid, fid;
    for ( var vindex in this.d.store.vid_list ) {
      vid = this.d.store.vid_list[vindex];
      for ( var findex in this.d.store.view[vid].fid_list ) {
        fid = this.d.store.view[vid].fid_list[findex];
        if ( this.d.store.file[fid].fname.match(regex) !== null ) {
          this.view_selector.appendChild( this._view_selector_option_html(vindex, vid) );
          this.view_selector_vid_list.push(vid);
          break;
        }
      }
    }
    this.is_view_selector_regex_active = true;
    var existing_vid_index = this.view_selector_vid_list.indexOf(existing_vid);
    console.log(existing_vid +','+existing_vid_index)
    if ( existing_vid_index === -1 ) {
      this.view_selector.selectedIndex = -1;
    } else {
      this.view_selector.selectedIndex = existing_vid_index;
    }
    console.log(this.view_selector.selectedIndex);
  }
}

_via_view_manager.prototype._view_selector_update_showall = function() {
  var existing_selectedIndex = this.view_selector.selectedIndex;
  var existing_vid;
  if ( existing_selectedIndex !== -1 ) {
    existing_vid = this.view_selector.options[existing_selectedIndex].value;
  }
  this._view_selector_clear();

  var vid;
  for ( var vindex in this.d.store.vid_list ) {
    vid = this.d.store.vid_list[vindex];
    this.view_selector.appendChild( this._view_selector_option_html(vindex, vid) );
    this.view_selector_vid_list.push(vid);
  }
  this.is_view_filtered_by_regex = false;
  if ( existing_selectedIndex !== -1 ) {
    var existing_vid_index = this.view_selector_vid_list.indexOf(existing_vid);
    if ( existing_vid_index === -1 ) {
      this.view_selector.selectedIndex = -1;
    } else {
      this.view_selector.selectedIndex = existing_vid_index;
    }
  }
}

_via_view_manager.prototype._on_view_filter_regex_change = function() {
  var regex = this.view_filter_regex.value;
  console.log(regex)
  this._view_selector_update_regex(regex);
}

_via_view_manager.prototype._file_add_from_filelist = function(filelist) {
  this.d.view_bulk_add_from_filelist(filelist).then( function(ok) {
    var filetype_summary = {};
    var fid, ftype_str;
    for ( var findex in ok.fid_list ) {
      fid = ok.fid_list[findex];
      ftype_str = _via_util_file_type_to_str( this.d.store.file[fid].type );
      if ( ! filetype_summary.hasOwnProperty(ftype_str) ) {
        filetype_summary[ftype_str] = 0;
      }
      filetype_summary[ftype_str] = filetype_summary[ftype_str] + 1;
    }
    _via_util_msg_show('Added ' + ok.fid_list.length + ' files. ' + JSON.stringify(filetype_summary));
  }.bind(this), function(err) {
    _via_util_msg_show('Failed to add files! [' + err + ']');
    console.warn(err);
  }.bind(this));
}

_via_view_manager.prototype._on_add_media_local = function() {
  _via_util_file_select_local(_VIA_FILE_TYPE.VIDEO | _VIA_FILE_TYPE.AUDIO | _VIA_FILE_TYPE.IMAGE,
                              this._file_add_local.bind(this),
                              true);
}

_via_view_manager.prototype._file_add_local = function(e) {
  var files = e.target.files;
  var filelist = [];
  for ( var findex = 0; findex < files.length; ++findex ) {
    filelist.push({ 'fname':files[findex].name,
                    'type':_via_util_infer_file_type_from_filename(files[findex].name),
                    'loc':_VIA_FILE_LOC.LOCAL,
                    'src':files[findex],
                  });
  }
  this._file_add_from_filelist(filelist);
}

_via_view_manager.prototype._on_event_view_bulk_add = function(data, event_payload) {
  this._view_selector_update();
  this.d._cache_update();
  if ( event_payload.vid_list.length ) {
    this.va.view_show( event_payload.vid_list[0] );
  }
}

_via_view_manager.prototype._on_add_media_remote = function() {
  var url = window.prompt('Enter URL of an image, audio or video (e.g. http://www....)',
                          '');
  var filelist = [ {'fname':url,
                    'type':_via_util_infer_file_type_from_filename(url),
                    'loc':_VIA_FILE_LOC.URIHTTP,
                    'src':url,
                   }
                 ];

  this._file_add_from_filelist(filelist);
}

_via_view_manager.prototype._on_add_media_bulk = function() {
  _via_util_file_select_local(_VIA_FILE_TYPE.TEXT,
                              this._on_add_media_bulk_file_selected.bind(this), false);
}

_via_view_manager.prototype._on_add_media_bulk_file_selected = function(e) {
  if ( e.target.files.length ) {
    _via_util_load_text_file(e.target.files[0], this._on_add_media_bulk_file_load.bind(this));
  }
}

_via_view_manager.prototype._on_add_media_bulk_file_load = function(file_data) {
  var url_list = file_data.split('\n');
  if ( url_list.length ) {
    var filelist = [];
    for ( var i = 0; i < url_list.length; ++i ) {
      if ( url_list[i] === '' ||
           url_list[i] === ' ' ||
           url_list[i] === '\n'
         ) {
        continue; // skip
      }
      filelist.push({ 'fname':url_list[i],
                      'type':_via_util_infer_file_type_from_filename(url_list[i]),
                      'loc':_via_util_infer_file_loc_from_filename(url_list[i]),
                      'src':url_list[i],
                    });
    }
    this._file_add_from_filelist(filelist);
  }
}

_via_view_manager.prototype._on_del_view = function() {
  console.log('del vid=' + this.va.vid + ', var type=' + typeof(this.va.vid));
  this.d.view_del(this.va.vid).then( function(ok) {
    console.log(ok);
  }.bind(this), function(err) {
    console.warn(err);
  }.bind(this));
}

_via_view_manager.prototype._on_event_view_del = function(data, event_payload) {
  this._view_selector_update();
  var vindex = event_payload.vindex;
  if ( this.d.store.vid_list.length ) {
    if ( vindex < this.d.store.vid_list.length ) {
      this.va.view_show( this.d.store.vid_list[vindex] );
    } else {
      this.va.view_show( this.d.store.vid_list[ this.d.store.vid_list.length - 1 ] );
    }
  } else {
    this.va._init();
  }
}
