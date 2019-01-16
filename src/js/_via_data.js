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
  this.metadata_store = {};
  this.attribute_store = [];
  this.file_store = [];

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this.event_prefix = '_via_data_';
  _via_event.call( this );
}

//
// attribute
//
_via_data.prototype.attribute_add = function(name, desc, type, options, default_option_id) {
  var aid = this.attribute_store.push( {} ) - 1; // get a slot
  this.attribute_store[aid] = new _via_attribute(aid,
                                                 name,
                                                 desc,
                                                 type,
                                                 options,
                                                 default_option_id);
  return aid;
}

_via_data.prototype.attribute = function(aid) {
  return this.attribute_store[aid];
}

//
// file
//
_via_data.prototype.file_add = function(uri, type, path) {
  var fid = this.file_store.push( new Object() ) - 1; // get a slot
  this.file_store[fid] = new _via_file(fid, uri, type, path);
  return fid;
}

//
// Metadata
//
_via_data.prototype.seg_add = function(fid, t) {
  return new Promise( function(ok_callback, err_callback) {
    if ( typeof(this.metadata_store[fid]) === 'undefined' ) {
      this.metadata_store[fid] = [];
    }

    // sanity checks
    if ( t.length !== 2 ) {
      err_callback({'fid':fid, 't':t});
      return;
    }
    if ( typeof(this.file_store[fid]) === 'undefined' ) {
      err_callback({'fid':fid, 't':t});
      return;
    }

    var mid = this.metadata_store[fid].push( new Object() ) - 1; // get a slot
    var where = [ _via_metadata.prototype.TYPE.VSEGMENT,
                  _via_metadata.prototype.SHAPE.TIME,
                  t[0], t[1] ];
    var what = {};
    this.metadata_store[fid][mid] = new _via_metadata(mid, where, what);

    this.emit_event( '_via_data_seg_add', { 'fid':fid, 'mid':mid } );
    ok_callback({'fid':fid, 'mid':mid});
  }.bind(this));
}
