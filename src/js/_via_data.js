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
    'pid': _via_util_gen_project_id(),
    'pname':'Default Project',
    'data_format_version':'3.1.0',
    'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
    'created': Date.now(),
  }
  this.store['config'] = {
    'file': { 'path':'' },
    'ui': {
      'file_content_align':'center',
    },
  };
  this.store['attribute'] = {};
  this.store['file'] = {};
  this.store['metadata'] = {};
  this.store['view'] = {};
  this.store['vid_list'] = [];

  this.cache = {};
  this.cache['mid_list'] = {};
  this.cache['attribute_group'] = {};

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_data_';
  _via_event.call(this);
}

//
// attribute
//
_via_data.prototype._attribute_get_new_id = function() {
  var aid_list = Object.keys(this.store.attribute).map(Number).sort();
  var n = aid_list.length;
  var aid;
  if ( n ) {
    aid = aid_list[n-1] + 1;
  } else {
    aid = 1;
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

_via_data.prototype.attribute_add = function(name, anchor, type, options, default_option_id) {
  return new Promise( function(ok_callback, err_callback) {
    if ( this._attribute_exist(name) ) {
      err_callback('attribute already exists');
      return;
    }

    var aid = this._attribute_get_new_id();
    this.store['attribute'][aid] = new _via_attribute(name,
                                                      anchor,
                                                      type,
                                                      options,
                                                      default_option_id);
    this.store.aid_list.push(aid);
    this.emit_event( 'attribute_add', { 'aid':aid } );
    ok_callback(aid);
  }.bind(this));
}

_via_data.prototype.attribute_anchor_value_to_name = function(anchor_value) {
  for ( var anchor_name in _VIA_ATTRIBUTE_ANCHOR ) {
    if ( _via_util_array_eq(_VIA_ATTRIBUTE_ANCHOR[anchor_name], anchor_value) ) {
      return anchor_name;
    }
  }
  return '';
}

_via_data.prototype.attribute_update_aname = function(aid, new_aname) {
  return new Promise( function(ok_callback, err_callback) {
    if ( ! this.store.attribute.hasOwnProperty(aid) ) {
      err_callback('aid does not exist');
      return;
    }
    this.store['attribute'][aid]['aname'] = new_aname;
    this.emit_event( 'attribute_update', { 'aid':aid, 'aname':new_aname } );
    ok_callback(aid);
  }.bind(this));
}

//
// file
//
_via_data.prototype._file_get_new_id = function() {
  var fid;
  var fid_list = Object.keys(this.store.file).map(Number).sort();
  var n = fid_list.length;
  if ( n ) {
    fid = fid_list[n-1] + 1;
  } else {
    fid = 1;
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
  return vid + '_' + _via_util_uid6();
}

_via_data.prototype.metadata_add = function(vid, z, xy, av) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      if ( ! this.store['view'].hasOwnProperty(vid) ) {
        err_callback({'vid':vid});
        return;
      }
      var mid = this._metadata_get_new_id(vid);
      this.store.metadata[mid] = new _via_metadata(vid, z, xy, av);
      if ( ! this.cache.mid_list.hasOwnProperty(vid) ) {
        this.cache.mid_list[vid] = {}
      }
      this.cache.mid_list[vid][mid] = 1;

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
      if ( ! this.store.view.hasOwnProperty(vid) ) {
        err_callback({'vid':vid});
        return;
      }

      if ( ! this.store.metadata.hasOwnProperty(mid) ) {
        err_callback({'mid':mid});
        return;
      }

      this.store.metadata[mid] = new _via_metadata(vid, z, xy, av);
      this.emit_event( 'metadata_update', { 'vid':vid, 'mid':mid } );
      ok_callback({'vid':vid, 'mid':mid});
    }
    catch(ex) {
      err_callback(ex);
    }
  }.bind(this));
}

_via_data.prototype.metadata_update_xy = function(vid, mid, xy) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      if ( ! this.store.view.hasOwnProperty(vid) ) {
        err_callback({'vid':vid});
        return;
      }
      if ( ! this.store.metadata.hasOwnProperty(mid) ) {
        err_callback({'mid':mid});
        return;
      }

      this.store.metadata[mid].xy = xy.slice(0);
      this.emit_event( 'metadata_update', { 'vid':vid, 'mid':mid } );
      ok_callback({'vid':vid, 'mid':mid});
    }
    catch(ex) {
      console.log(xy);
      err_callback(ex);
    }
  }.bind(this));
}

_via_data.prototype.metadata_update_av = function(vid, mid, aid, avalue) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      if ( ! this.store.view.hasOwnProperty(vid) ) {
        err_callback({'vid':vid});
        return;
      }
      if ( ! this.store.metadata.hasOwnProperty(mid) ) {
        err_callback({'mid':mid});
        return;
      }

      this.store.metadata[mid].av[aid] = avalue;
      this.emit_event( 'metadata_update', { 'vid':vid, 'mid':mid } );
      ok_callback({'vid':vid, 'mid':mid});
    }
    catch(ex) {
      console.log(ex);
      err_callback(ex);
    }
  }.bind(this));
}

_via_data.prototype.metadata_update_av_bulk = function(vid, av_list) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      if ( ! this.store.view.hasOwnProperty(vid) ) {
        err_callback({'vid':vid});
        return;
      }
      var updated_mid_list = [];
      var mid, aid, avalue;
      for ( var i in av_list ) {
        mid = av_list[i].mid;
        aid = av_list[i].aid;
        avalue = av_list[i].avalue;
        this.store.metadata[mid].av[aid] = avalue;
        updated_mid_list.push(mid);
      }
      console.log(this.store.metadata)
      var event_payload = { 'vid':vid, 'mid_list':updated_mid_list };
      this.emit_event('metadata_update_bulk', event_payload);
      ok_callback(event_payload);
    }
    catch(ex) {
      console.log(ex);
      err_callback(ex);
    }
  }.bind(this));
}

_via_data.prototype.metadata_delete = function(vid, mid) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      if ( ! this.store.view.hasOwnProperty(vid) ) {
        err_callback({'vid':vid});
        return;
      }
      if ( ! this.store.metadata.hasOwnProperty(mid) ) {
        err_callback({'mid':mid});
        return;
      }

      this.cache.mid_list[vid][mid] = 0;
      this.store.metadata[mid].flg = _VIA_METADATA_FLAG.DELETED;
      this.emit_event( 'metadata_delete', { 'vid':vid, 'mid':mid } );
      ok_callback({'vid':vid, 'mid':mid});
    }
    catch(ex) {
      console.log(xy);
      err_callback(ex);
    }
  }.bind(this));
}

_via_data.prototype.metadata_delete_bulk = function(vid, mid_list, emit) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      if ( ! this.store.view.hasOwnProperty(vid) ) {
        err_callback({'vid':vid});
        return;
      }
      var deleted_mid_list = [];
      var mid;
      for ( var mindex in mid_list ) {
        mid = mid_list[mindex];
        delete this.cache.mid_list[vid][mid];
        this.store.metadata[mid].flg = _VIA_METADATA_FLAG.DELETED;
        deleted_mid_list.push(mid);
      }
      console.log(deleted_mid_list)
      if ( typeof(emit) !== 'undefined' &&
           emit === true ) {
        this.emit_event( 'metadata_delete_bulk', { 'vid':vid, 'mid_list':deleted_mid_list } );
      }
      ok_callback({'vid':vid, 'mid_list':deleted_mid_list});
    }
    catch(ex) {
      console.log(ex);
      err_callback(ex);
    }
  }.bind(this));
}

//
// View
//
_via_data.prototype._view_get_new_id = function() {
  var vid;
  var vid_list = Object.keys(this.store.view).map(Number).sort();
  var n = vid_list.length;
  if ( n ) {
    vid = vid_list[n-1] + 1;
  } else {
    vid = 1;
  }
  return vid;
}

_via_data.prototype.view_add = function(fid_list) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      var vid = this._view_get_new_id();
      this.store.view[vid] = new _via_view(fid_list);
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

_via_data.prototype.view_get_file_vid = function(fid) {
  for ( var vid in this.store.view ) {
    if ( _via_util_array_eq(this.store.view[vid].fid_list, [fid]) ) {
      return vid;
    }
  }
  return -1;
}

//
// cache
//
_via_data.prototype._cache_update = function() {
  this._cache_update_mid_list();
  this._cache_update_attribute_group();
}

_via_data.prototype._cache_update_mid_list = function() {
  var vid;
  this.cache.mid_list = {};
  for ( var mid in this.store.metadata ) {
    vid = this.store.metadata[mid].vid;
    if ( ! this.cache.mid_list.hasOwnProperty(vid) ) {
      this.cache.mid_list[vid] = [];
    }
    if ( ! (this.store.metadata[mid].flg & _VIA_METADATA_FLAG.DELETED) ) {
      this.cache.mid_list[vid].push(mid);
    }
  }
}

_via_data.prototype._cache_update_attribute_group = function() {
  var anchor_name;
  for ( var aid in this.store.attribute ) {
    anchor_name = this.attribute_anchor_value_to_name(this.store.attribute[aid].anchor);
    if ( ! this.cache.attribute_group.hasOwnProperty(anchor_name) ) {
      this.cache.attribute_group[anchor_name] = {};
    }
    this.cache.attribute_group[anchor_name][aid] = this.store.attribute[aid];
  }
}
