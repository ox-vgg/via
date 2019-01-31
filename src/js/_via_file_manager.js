/**
 *
 * @class
 * @classdesc File manager
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 30 Jan. 2019
 *
 */

'use strict';

function _via_file_manager(filelist_element, data, annotator) {
  this.filelist = filelist_element;
  this.d = data;
  this.a = annotator;

  var is_filelist_regex_active = false;
  this.filelist_fid_list = [];

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this.event_prefix = '_via_file_manager_';
  _via_event.call( this );

  // attach event listeners
  this.a.on_event('file_show', this._on_event_file_show.bind(this));
  this.d.on_event('file_remove', this._on_event_file_remove.bind(this));

  this._init();
}

_via_file_manager.prototype._init = function() {
  // trigger update of filelist (for the first time)
  this._filelist_update();
}

_via_file_manager.prototype._filelist_clear = function() {
  this.filelist.innerHTML = '';
  this.filelist_fid_list = [];
}

_via_file_manager.prototype._filelist_html_element = function(findex, fid) {
  var oi = document.createElement('option');
  if ( this.d.has_file(fid) ) {
    var oi = document.createElement('option');
    oi.setAttribute('data-fid', fid);
    oi.setAttribute('value', fid);
    oi.setAttribute('title', this.d.file_store[fid].uri);
    oi.addEventListener('click', this._filelist_switch_to_file.bind(this));
    oi.innerHTML = '[' + (parseInt(findex)+1) + '] ' + this.d.file_store[fid].uri;
  } else {
    console.log('_via_file_manager._filelist_html_element() : not found fid=' + fid);
  }
  return oi;
}

_via_file_manager.prototype._filelist_update = function() {
  if ( this.is_filelist_regex_active ) {
    this._filelist_update_regex();
  } else {
    this._filelist_update_showall();
  }
}

_via_file_manager.prototype._filelist_update_regex = function(regex) {
  if ( regex === '' ||
       typeof(regex) === 'undefined'
     ) {
    _filelist_update_showall();
  } else {
    this._filelist_clear();
    var i, uri;
    var fid, uri;
    var findex;
    for ( findex in this.d.fid_list ) {
      fid = this.d.fid_list[findex];
      uri = this.d.file_store[fid].uri;
      if ( uri.match(regex) !== null ) {
        this.filelist.appendChild( this._filelist_html_element(findex, fid) );
        this.filelist_fid_list.push(fid);
      }
    }
    this.is_filelist_regex_active = true;
  }
}

_via_file_manager.prototype._filelist_update_showall = function() {
  this._filelist_clear();
  var fid;
  var findex;
  for ( findex in this.d.fid_list ) {
    fid = this.d.fid_list[findex];
    this.filelist.appendChild( this._filelist_html_element(findex, fid) );
    this.filelist_fid_list.push(fid);
  }
  this._filelist_set_selected_to_current_file();
  this.is_filelist_regex_active = false;
}

_via_file_manager.prototype._filelist_set_selected_to_current_file = function() {
  if ( typeof(this.a.now.file) !== 'undefined' ) {
    var n = this.filelist.options.length;
    var i;
    for ( i = 0; i < n; ++i ) {
      if ( parseInt(this.filelist.options[i].value) === this.a.now.file.id ) {
        this.filelist.selectedIndex = i;
        this.filelist.title = this.d.file_store[ this.a.now.file.id.toString() ].uri;
      }
    }
  }
}

_via_file_manager.prototype._filelist_switch_to_file = function(el) {
  var fid = el.target.dataset.fid;
  this.a.file_show_fid(fid);
}

_via_file_manager.prototype.on_filelist_regex = function(el) {
  this._filelist_update_regex(el.value);
}

_via_file_manager.prototype.on_file_show_next = function() {
  if ( this.d.fid_list.length &&
       this.filelist_fid_list.length // to account for filelist update made by regex
     ) {
    var index_now = this.filelist_fid_list.indexOf(this.a.now.file.id);
    if ( index_now !== -1 ) {
      var index_next = index_now + 1;
      if ( index_next >= this.filelist_fid_list.length ) {
        index_next = 0;
      }
      this.a.file_show_fid( this.filelist_fid_list[index_next] );
    } else {
      // show the first file in the regex list
      this.a.file_show_fid( this.filelist_fid_list[0] );
    }
  }
}

_via_file_manager.prototype.on_file_show_prev = function() {
  if ( this.d.fid_list.length &&
       this.filelist_fid_list.length // to account for filelist update made by regex
     ) {
    var index_now = this.filelist_fid_list.indexOf(this.a.now.file.id);

    if ( index_now !== -1 ) {
      var index_prev = index_now - 1;
      if ( index_prev < 0 ) {
        index_prev = this.filelist_fid_list.length - 1;
      }
      this.a.file_show_fid( this.filelist_fid_list[index_prev] );
    } else {
      // show the last file in the regex list
      this.a.file_show_fid( this.filelist_fid_list[ this.filelist_fid_list.length - 1 ] );
    }
  }
}

_via_file_manager.prototype.on_file_remove_current = function() {
  if ( this.d.fid_list.length ) {
    var index_now = this.filelist_fid_list.indexOf(this.a.now.file.id);
    if ( index_now !== -1 ) {
      this.d.file_remove( this.filelist_fid_list[index_now] );
    }
  }
}

_via_file_manager.prototype._on_event_file_show = function(data, event_payload) {
  this._filelist_set_selected_to_current_file();
}

_via_file_manager.prototype._on_event_file_remove = function(data, event_payload) {
  var fid = event_payload.fid;
  var index_now = this.filelist_fid_list.indexOf(this.a.now.file.id);
  this._filelist_update();

  if ( fid === this.a.now.file.id ) {
    var move_to = index_now - 1;
    if ( move_to < 0 ) {
      move_to = index_now + 1;
      if ( move_to >= this.filelist_fid_list.length ) {
        // no move possible
        this.a.file_show_none();
      } else {
        var new_fid = this.filelist_fid_list[ move_to ];
        this.a.file_show_fid( new_fid );
      }
    } else {
      var new_fid = this.filelist_fid_list[ move_to ];
      this.a.file_show_fid( new_fid );
    }
  }
}
