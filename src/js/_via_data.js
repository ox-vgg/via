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
  this.project = {
    'via_project_id':this._uuid(),
    'via_data_format_version':1,
    'created': new Date().toString(),
  };

  this.metadata_store = {};

  // attributes
  this.attribute_store = {};
  this.aid_list = [];        // to maintain ordering of attributes

  // files
  this.file_store = {};
  this.fid_list = [];        // to maintain ordering of files


  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_data_';
  _via_event.call(this);
}

_via_data.prototype._init = function() {
}

//
// attribute
//
_via_data.prototype._attribute_get_new_id = function() {
  var aid;
  if ( this.aid_list.length ) {
    aid = parseInt(this.aid_list[this.aid_list.length - 1]) + 1;
  } else {
    aid = 0;
  }
  return aid;
}

_via_data.prototype.attribute_is_present = function(name) {
  var aid;
  for ( aid in this.attribute_store ) {
    if ( this.attribute_store[aid].name === name ) {
      return true;
    }
  }
  return false;
}

_via_data.prototype.attribute_add = function(name, type, options, default_option_id) {
  return new Promise( function(ok_callback, err_callback) {
    if ( this.attribute_is_present(name) ) {
      err_callback('attribute already exists');
      return;
    }

    var aid = this._attribute_get_new_id();
    this.attribute_store[aid] = new _via_attribute(aid,
                                                   name,
                                                   type,
                                                   options,
                                                   default_option_id);
    this.aid_list.push(aid);
    this.emit_event( 'attribute_add', { 'aid':aid } );
    ok_callback(aid);
  }.bind(this));
}

_via_data.prototype.attribute_del = function(aid) {
  return new Promise( function(ok_callback, err_callback) {
    if ( ! this.attribute_store.hasOwnProperty(aid) ) {
      err_callback('invalid aid=' + aid);
      return;
    }

    delete this.attribute_store[aid];
    var aindex = this.aid_list.indexOf( parseInt(aid) );
    this.aid_list.splice(aindex, 1);

    // @todo: delete all metadata containing this attribute
    var fid, mid;
    for ( fid in this.metadata_store ) {
      for ( mid in this.metadata_store[fid] ) {
        if ( this.metadata_store[fid][mid].what[aid] !== 'undefined' ) {
          delete this.metadata_store[fid][mid].what[aid];
        }
      }
    }
    this.emit_event( 'attribute_del', { 'aid':aid } );
  }.bind(this));
}

_via_data.prototype.attribute_update_options = function(aid, csv_str) {
  var csv = csv_str.split(',');
  var n = csv.length;
  var i;
  this.attribute_store[aid].options = {};
  for ( i = 0; i < n; ++i ) {
    if ( csv[i].startsWith('*') ) {
      this.attribute_store[aid].default_option_id = i.toString();
      this.attribute_store[aid].options[i] = csv[i].substr(1);
    } else {
      this.attribute_store[aid].options[i] = csv[i];
    }
  }
  this.emit_event( 'attribute_update', { 'aid':aid } );
}

_via_data.prototype.attribute_update_type = function(aid, new_type) {
  this.attribute_store[aid].type = parseInt(new_type);

  this.emit_event( 'attribute_update', { 'aid':aid } );
}

//
// file
//
_via_data.prototype._file_get_new_id = function() {
  var fid;
  if ( this.fid_list.length ) {
    fid = parseInt(this.fid_list[this.fid_list.length - 1]) + 1;
  } else {
    fid = 0;
  }
  return fid;
}

_via_data.prototype.file_add = function(name, type, loc, src) {
  var fid = this._file_get_new_id();
  this.file_store[fid] = new _via_file(fid, name, type, loc, src);
  this.fid_list.push(fid);
  this.emit_event( 'file_add', { 'fid':fid } );
  return fid;
}

_via_data.prototype.file_add_bulk = function(filelist) {
  var n = filelist.length;
  var added_fid_list = [];
  var i, fid;
  for ( i = 0; i < n; ++i ) {
    fid = this._file_get_new_id();
    this.file_store[fid] = new _via_file(fid,
                                         filelist[i].filename,
                                         filelist[i].type,
                                         filelist[i].loc,
                                         filelist[i].src
                                        );
    this.fid_list.push(fid);
    added_fid_list.push(fid);
  }
  this.emit_event( 'file_add_bulk', { 'fid_list':added_fid_list } );
  return added_fid_list;
}

_via_data.prototype.file_remove = function(fid) {
  if ( this.has_file(fid) ) {
    delete this.file_store[fid];
    var findex = this.fid_list.indexOf(fid);
    this.fid_list.splice(findex, 1);
    this.emit_event( 'file_remove', { 'fid':fid } );
  }
}

_via_data.prototype.has_file = function(fid) {
  if ( this.file_store.hasOwnProperty(fid) ) {
    return true;
  } else {
    return false;
  }
}

_via_data.prototype.fid2file = function(fid) {
  return this.file_store[fid];
}

//
// Metadata
//
_via_data.prototype.metadata_del = function(fid, mid) {
  return new Promise( function(ok_callback, err_callback) {
    if ( typeof(this.metadata_store[fid]) === 'undefined' ) {
      err_callback('undefined fid=' + fid);
    }

    if ( typeof(this.file_store[fid]) === 'undefined' ) {
      err_callback('undefined fid=' + fid);
      return;
    }

    if ( typeof(this.metadata_store[fid][mid]) === 'undefined' ) {
      err_callback('for fid=' + fid + ', undefined mid=' + mid);
    }

    delete this.metadata_store[fid][mid];

    this.emit_event( 'metadata_del', { 'fid':fid, 'mid':mid } );
    ok_callback({'fid':fid, 'mid':mid});
  }.bind(this));
}

_via_data.prototype.metadata_add = function(fid, z, xy, metadata) {
  return new Promise( function(ok_callback, err_callback) {
    if ( typeof(this.metadata_store[fid]) === 'undefined' ) {
      this.metadata_store[fid] = {};
    }

    if ( typeof(this.file_store[fid]) === 'undefined' ) {
      err_callback({'fid':fid, 't':t});
      return;
    }

    var mid = this._uuid();
    this.metadata_store[fid][mid] = new _via_metadata(mid, z, xy, metadata);

    this.emit_event( 'metadata_add', { 'fid':fid, 'mid':mid } );
    ok_callback({'fid':fid, 'mid':mid});
  }.bind(this));
}

_via_data.prototype.metadata_update = function(fid, mid, z, xy, metadata) {
  return new Promise( function(ok_callback, err_callback) {
    if ( typeof(this.metadata_store[fid]) === 'undefined' ) {
      err_callback('undefined fid=' + fid);
    }

    if ( typeof(this.file_store[fid]) === 'undefined' ) {
      err_callback('undefined fid=' + fid);
      return;
    }

    if ( typeof(this.metadata_store[fid][mid]) === 'undefined' ) {
      err_callback('for fid=' + fid + ', undefined mid=' + mid);
    }

    this.metadata_store[fid][mid] = new _via_metadata(mid, z, xy, metadata);

    this.emit_event( 'metadata_update', { 'fid':fid, 'mid':mid } );
    ok_callback({'fid':fid, 'mid':mid});
  }.bind(this));
}

_via_data.prototype.metadata_del = function(fid, mid) {
  return new Promise( function(ok_callback, err_callback) {
    if ( typeof(this.metadata_store[fid]) === 'undefined' ) {
      err_callback('invalid fid=' + fid);
      console.log(this.metadata_store)
      return;
    }

    if ( typeof(this.metadata_store[fid][mid]) === 'undefined' ) {
      err_callback('invalid mid=' + mid);
      console.log(this.metadata_store[fid])
    }
    delete this.metadata_store[fid][mid];
    this.emit_event( 'metadata_del', { 'fid':fid, 'mid':mid } );
    ok_callback({'fid':fid, 'mid':mid});
  }.bind(this));
}

//
// Project
//
_via_data.prototype._project_load_json = function(e) {
  _via_util_load_text_file(e.target.files[0], this._project_import_from_json.bind(this));
}

_via_data.prototype._project_import_from_json = function(json_str) {
  if ( json_str === '' || typeof(json_str) === 'undefined') {
    console.log('_via_data._project_import_from_json() failed as json_str=' + json_str);
    return;
  }

  var json = JSON.parse(json_str);
  this.project = json.project;

  // add all files
  var fid;
  for ( fid in json.file_store ) {
    this.file_store[fid] = new _via_file(fid,
                                         json.file_store[fid].filename,
                                         json.file_store[fid].type,
                                         json.file_store[fid].loc,
                                         json.file_store[fid].src
                                        );
    this.fid_list.push(fid);
  }

  // add all attributes
  var aid;
  for ( aid in json.attribute_store ) {
    this.attribute_store[aid] = new _via_attribute(aid,
                                                   json.attribute_store[aid].attr_name,
                                                   json.attribute_store[aid].type,
                                                   json.attribute_store[aid].options,
                                                   json.attribute_store[aid].default_option_id
                                                  );
    this.aid_list.push(aid);
  }

  // add all metadata
  var mid;
  for ( fid in json.metadata_store ) {
    if ( ! this.metadata_store.hasOwnProperty(fid) ) {
      this.metadata_store[fid] = {};
    }

    for ( mid in json.metadata_store[fid] ) {
      this.metadata_store[fid][mid] = new _via_metadata(mid,
                                                        json.metadata_store[fid][mid].where,
                                                        json.metadata_store[fid][mid].what
                                                       );
    }
  }
  this.emit_event( 'file_add_bulk', { 'fid_list':this.fid_list } );
}

_via_data.prototype._project_save = function() {
  return new Promise( function(ok_callback, err_callback) {
    try {
      var d = {
        'project':this.project,
        'metadata_store':this.metadata_store,
        'attribute_store':this.attribute_store,
        'aid_list':this.aid_list,
        'file_store':this.file_store,
        'fid_list':this.fid_list,
      };

      var data_json = JSON.stringify(d);
      console.log(data_json)
      ok_callback(data_json);
    } catch(err) {
      err_callback('failed to convert to json');
    }
  }.bind(this));
}

_via_data.prototype.save_local = function() {
  this._project_save().then( function(data) {
    console.log(data)
    var blob = new Blob( [data], {type:'text/json;charset=utf-8'} );
    _via_util_download_as_file(blob, 'via_project.json');
  }.bind(this), function(err) {
    console.log(err)
  }.bind(this));
}

_via_data.prototype.load_local = function() {
  _via_util_file_select_local(_VIA_FILE_TYPE.JSON, this._project_load_json.bind(this), false);
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
  if ( uuid.startsWith('blob:null/') ) {
    uuid = uuid.substr(10);
  }
  return uuid;
}
