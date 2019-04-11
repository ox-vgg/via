/**
 *
 * @class
 * @classdesc Manages the storage and update of all data (annotations, files, etc. )
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 31 Dec. 2018
 *
 */

'use strict';

function _via_data() {
  this.store = {};
  this.store['project'] = {
    '_id':this._uuid(),
    '_rev':'',
    'pname':'Default Project',
    'data_format_version':'3.1.0',
    'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
    'created': new Date().toString(),
  }
  this.store['config'] = {
    'file': { 'path':'' },
    'ui': {
      'file_content_align':'center',
    },
  };
  this.store['attribute'] = {};
  this.store['file'] = {};
  this.store['view'] = {};
  this.store['vid_list'] = [];
  this.store['aid_list'] = [];
  this.store['fid_list'] = [];

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_data_';
  _via_event.call(this);
}

//
// attribute
//
_via_data.prototype._attribute_get_new_id = function() {
  var aid_list = this.store.aid_list.map(Number).sort();
  var n = aid_list.length;
  var aid;
  if ( n ) {
    aid = aid_list[n-1] + 1;
  } else {
    aid = 0;
  }
  return aid;
}

_via_data.prototype._attribute_exist = function(aname) {
  var aid;
  for ( aid in this.store['attribute'] ) {
    if ( this.store['attribute'][aid].aname === aname ) {
      return true;
    }
  }
  return false;
}

_via_data.prototype.attribute_add = function(name, type, options, default_option_id) {
  return new Promise( function(ok_callback, err_callback) {
    if ( this._attribute_exist(name) ) {
      err_callback('attribute already exists');
      return;
    }

    var aid = this._attribute_get_new_id();
    this.store['attribute'][aid] = new _via_attribute(aid,
                                                   name,
                                                   type,
                                                   options,
                                                      default_option_id);
    this.store.aid_list.push(aid);
    this.emit_event( 'attribute_add', { 'aid':aid } );
    ok_callback(aid);
  }.bind(this));
}

//
// file
//
_via_data.prototype._file_get_new_id = function() {
  var fid;
  var fid_list = this.store.fid_list.map(Number).sort();
  var n = fid_list.length;
  if ( n ) {
    fid = parseInt(fid_list[n-1]) + 1;
  } else {
    fid = 0;
  }
  return fid;
}

_via_data.prototype.file_add = function(name, type, loc, src) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      var fid = this._file_get_new_id();
      this.store.file[fid] = new _via_file(fid, name, type, loc, src);
      this.store.fid_list.push(fid);
      this.emit_event( 'file_add', { 'fid':fid } );
      ok_callback(fid);
    }
    catch(ex) {
      err_callback(ex);
    }
  }.bind(this));
}

//
// Metadata
//
_via_data.prototype._metadata_get_new_id = function(vid) {
  var mid;
  var mid_list = Object.keys(this.store.view[vid].d).map(Number).sort();
  var n = mid_list.length;
  if ( n ) {
    mid = parseInt(mid_list[n-1]) + 1;
  } else {
    mid = 0;
  }
  return mid;
}

_via_data.prototype.metadata_add = function(vid, z, xy, v) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      if ( ! this.store['view'].hasOwnProperty(vid) ) {
        err_callback({'vid':vid});
        return;
      }
      var mid = this._metadata_get_new_id(vid);
      this.store.view[vid].d[mid] = new _via_metadata(z, xy, v);
      this.emit_event( 'metadata_add', { 'vid':vid, 'mid':mid } );
      ok_callback( {'vid':vid, 'mid':mid} );
    }
    catch(ex) {
      err_callback(ex);
    }
  }.bind(this));
}

_via_data.prototype.metadata_update = function(vid, mid, z, xy, v) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      if ( ! this.store['view'].hasOwnProperty(vid) ) {
        err_callback({'vid':vid});
        return;
      }

      this.store.view[vid].d[mid] = new _via_metadata(z, xy, v);
      this.emit_event( 'metadata_update', { 'vid':vid, 'mid':mid } );
      ok_callback({'vid':vid, 'mid':mid});
    }
    catch(ex) {
      err_callback(ex);
    }
  }.bind(this));
}

//
// View
//
_via_data.prototype._view_get_new_id = function() {
  var vid;
  var vid_list = this.store.vid_list.map(Number).sort();
  var n = vid_list.length;
  if ( n ) {
    vid = parseInt(vid_list[n-1]) + 1;
  } else {
    vid = 0;
  }
  return vid;
}

_via_data.prototype.view_add = function(fid_list, metadata_list) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      var vid = this._view_get_new_id();
      this.store.view[vid] = new _via_view(fid_list, metadata_list);
      this.store.vid_list.push(vid);
      this.emit_event( 'view_add', { 'vid':vid } );
      ok_callback(vid);
    }
    catch(ex) {
      console.log(ex)
      err_callback(ex);
    }
  }.bind(this));
}

//
// Unique Id
//

// URL.createObjectURL() produces a unique id every time it is invoked.
// We use this functionality to generate unique id required by VIA
// @todo: Replace with a true UUID generator if it can be efficiently generated
// using pure JS (no dependencies)
_via_data.prototype._uuid = function() {
  var temp_url = URL.createObjectURL(new Blob())
  var uuid = temp_url.toString();
  URL.revokeObjectURL(temp_url);
  var slash_index = uuid.lastIndexOf('/');
  if ( uuid !== -1 ) {
    // remove any prefix (e.g. blob:null/, blob:www.test.com/, ...)
    uuid = uuid.substr(slash_index + 1);
    uuid = uuid.replace(/-/g, '');
  }
  uuid = 'v' + uuid; // ensure that uuid always starts with a character (couchdb requirement)
  return uuid;
}
