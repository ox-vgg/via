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
  this.project_store = {
    'project_id':this._uuid(),
    'data_format_version':'3.0.0',
    'created': new Date().toString(),
    'updated': new Date().toString(),
  };

  // metadata
  this.metadata_store = {};

  // attributes
  this.attribute_store = {};
  this.aid_list = [];        // to maintain ordering of attributes

  // files
  this.file_store = {};
  this.fid_list = [];        // to maintain ordering of files
  this.file_mid_list = {};   // list of all metadata associated with a file

  // data persistence
  this._store_list = {};

  // metadata_store is treated differently
  this.data_key_list = ['project_store',
                        'attribute_store',
                        'aid_list',
                        'file_store',
                        'file_mid_list',
                        'fid_list',
                       ];

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_data_';
  _via_event.call(this);
}

_via_data.prototype._init = function() {
}

_via_data.prototype._hook_on_data_update = function() {
  this.project_store.updated = new Date().toString();
}

//
// data persistence
//
_via_data.prototype._store_add = function(id, store) {
  this._store_list[id] = store;
}

_via_data.prototype._store_del = function(store_id) {
  delete this._store_list[id];
}

_via_data.prototype._store_transaction = function(data_key, action, param) {
  var promise_list = [];
  var store_id;
  for ( store_id in this._store_list ) {
    promise_list.push( this._store_list[store_id].transaction(data_key, action, param) );
  }

  Promise.all(promise_list).then( function(ok) {
    console.log('store transaction: {' + data_key + ',' + action + ', ' + JSON.stringify(param) + '} completed');
  }.bind(this), function(err) {
    console.warn('store transaction {' + data_key + ',' + action + ', ' + JSON.stringify(param) + '} failed');
  }.bind(this));
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
    this._store_transaction('attribute_store', 'add', {'aid':aid});
    this._hook_on_data_update();
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
    this._store_transaction('attribute_store', 'del', {'aid':aid});
    this._hook_on_data_update();
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
  this._store_transaction('attribute_store', 'update', {'aid':aid});
  this._hook_on_data_update();
  this.emit_event( 'attribute_update', { 'aid':aid } );
}

_via_data.prototype.attribute_update_type = function(aid, new_type) {
  this.attribute_store[aid].type = parseInt(new_type);
  this._store_transaction('attribute_store', 'update', {'aid':aid});
  this._hook_on_data_update();
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
  this._store_transaction('file_store', 'add', {'fid':fid});
  this._hook_on_data_update();
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
  this._store_transaction('file_store', 'add_bulk', {'fid_list':added_fid_list});
  this._hook_on_data_update();
  this.emit_event( 'file_add_bulk', { 'fid_list':added_fid_list } );
  return added_fid_list;
}

_via_data.prototype.file_remove = function(fid) {
  if ( this.has_file(fid) ) {
    // delete all metadata associated with fid
    var mid, mid_index;
    for ( mid_index in this.file_mid_list[fid] ) {
      mid = this.file_mid_list[fid][mid_index]
      delete this.metadata_store[mid];
    }
    delete this.file_mid_list[fid];

    // delete file entry
    delete this.file_store[fid];
    var findex = this.fid_list.indexOf(fid);
    this.fid_list.splice(findex, 1);
    this._store_transaction('file_store', 'remove', {'fid':fid});
    this._hook_on_data_update();
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
_via_data.prototype.metadata_add = function(fid, z, xy, metadata) {
  return new Promise( function(ok_callback, err_callback) {
    if ( typeof(this.file_store[fid]) === 'undefined' ) {
      err_callback({'fid':fid});
      return;
    }

    var mid = this._uuid();
    this.metadata_store[mid] = new _via_metadata(mid, z, xy, metadata);
    if ( typeof(this.file_mid_list[fid]) === 'undefined' ) {
      this.file_mid_list[fid] = [];
    }
    this.file_mid_list[fid].push(mid);
    this._store_transaction('metadata_store', 'add', {'fid':fid, 'mid':mid});
    this._hook_on_data_update();
    this.emit_event( 'metadata_add', { 'fid':fid, 'mid':mid } );
    ok_callback({'fid':fid, 'mid':mid});
  }.bind(this));
}

_via_data.prototype.metadata_update = function(fid, mid, z, xy, metadata) {
  return new Promise( function(ok_callback, err_callback) {
    if ( typeof(this.file_store[fid]) === 'undefined' ) {
      err_callback('undefined fid=' + fid);
      return;
    }

    if ( typeof(this.metadata_store[mid]) === 'undefined' ) {
      err_callback('undefined mid=' + mid);
    }

    this.metadata_store[mid] = new _via_metadata(fid, mid, z, xy, metadata);
    this._store_transaction('metadata_store', 'update', {'fid':fid, 'mid':mid});
    this._hook_on_data_update();
    this.emit_event( 'metadata_update', { 'fid':fid, 'mid':mid } );
    ok_callback({'fid':fid, 'mid':mid});
  }.bind(this));
}

_via_data.prototype.metadata_update_attribute_value = function(fid, mid, aid, value) {
  // @todo: add checks
  this.metadata_store[mid].metadata[aid] = value;
  this._store_transaction('metadata_store', 'update', {'fid':fid, 'mid':mid});
  this._hook_on_data_update();
  this.emit_event( 'metadata_update', { 'fid':fid, 'mid':mid } );
}

_via_data.prototype.metadata_del = function(fid, mid) {
  return new Promise( function(ok_callback, err_callback) {
    if ( typeof(this.file_store[fid]) === 'undefined' ) {
      err_callback('invalid fid=' + fid);
      return;
    }

    if ( typeof(this.metadata_store[mid]) === 'undefined' ) {
      err_callback('invalid mid=' + mid);
    }
    delete this.metadata_store[mid];

    var mid_index = this.file_mid_list[fid].indexOf(mid);
    this.file_mid_list[fid].splice(mid_index, 1);
    this._store_transaction('metadata_store', 'del', {'fid':fid, 'mid':mid});
    this._hook_on_data_update();
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
        'project_store':this.project_store,
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

_via_data.prototype.on_event_file_show = function() {

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
