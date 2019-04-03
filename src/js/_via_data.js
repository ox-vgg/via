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
    'project_name':'Default Project',
    'data_format_version':'3.0.0',
    'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
    'created': new Date().toString(),
    'update_history': [],
  };

  // metadata
  this.metadata_store = {};

  // attributes
  this.attribute_store = {};
  this.aid_list = [];        // to maintain ordering of attributes

  // files
  this.file_store = {};
  this.fid_list = [];        // to maintain ordering of files
  this.file_mid_store = {};   // list of all metadata associated with a file

  // data persistence
  this._store_list = {};

  // metadata_store is treated differently
  this.data_key_list = ['project_store',
                        'attribute_store',
                        'aid_list',
                        'file_store',
                        'file_mid_store',
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
  //@todo
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
    //console.log('store transaction: {' + data_key + ',' + action + ', ' + JSON.stringify(param) + '} completed');
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
  return new Promise( function(ok_callback, err_callback) {
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
    ok_callback(added_fid_list);
  }.bind(this));
}

_via_data.prototype.file_remove = function(fid) {
  if ( this.has_file(fid) ) {
    // delete all metadata associated with fid
    var mid, mid_index;
    for ( mid_index in this.file_mid_store[fid] ) {
      mid = this.file_mid_store[fid][mid_index]
      delete this.metadata_store[mid];
    }
    delete this.file_mid_store[fid];

    // delete file entry
    delete this.file_store[fid];
    var findex = this.fid_list.indexOf(fid);
    this.fid_list.splice(findex, 1);
    this._store_transaction('file_store', 'remove', {'fid':fid});
    this._hook_on_data_update();
    this.emit_event( 'file_remove', { 'fid':fid } );
  }
}

_via_data.prototype.file_is_fid_valid = function(fid) {
  if ( this.file_store.hasOwnProperty(fid) ) {
    return true;
  } else {
    return false;
  }
}

_via_data.prototype.file_src2fid = function(src) {
  var fid;
  for ( fid in this.file_store ) {
    if ( this.file_store[fid].src === src ) {
      return fid;
    }
  }
  return '-1';
}

_via_data.prototype.fid2file = function(fid) {
  return this.file_store[fid];
}

//
// Metadata
//

// metadata_list = { 'mid', 'z', 'xy', 'metadata' }
_via_data.prototype.metadata_add_bulk = function(metadata_list) {
  return new Promise( function(ok_callback, err_callback) {
    var n = metadata_list.length;
    var added_mid_list = {};
    var fid, mid;
    var i;
    for ( i = 0; i < n; ++i ) {
      fid = metadata_list[i].fid;

      if ( ! this.file_store.hasOwnProperty(fid) ) {
        err_callback('fid=' + fid + ' does not exist!');
        return;
      }

      mid = this._uuid();
      this.metadata_store[mid] = new _via_metadata(metadata_list[i].z,
                                                   metadata_list[i].xy,
                                                   metadata_list[i].v
                                                  );
      if ( typeof(this.file_mid_store[fid]) === 'undefined' ) {
        this.file_mid_store[fid] = [];
      }
      this.file_mid_store[fid].push(mid);

      if ( typeof(added_mid_list[fid]) === 'undefined' ) {
        added_mid_list[fid] = [];
      }
      added_mid_list[fid].push(mid);
      this._store_transaction('metadata_store', 'add', {'fid':fid, 'mid':mid});
    }

    this._hook_on_data_update();
    this.emit_event( 'metadata_add_bulk', { 'added_mid_list':added_mid_list } );
    ok_callback({'added_mid_list':added_mid_list});
  }.bind(this));
}

_via_data.prototype.metadata_add = function(fid, z, xy, metadata) {
  return new Promise( function(ok_callback, err_callback) {
    if ( typeof(this.file_store[fid]) === 'undefined' ) {
      err_callback({'fid':fid});
      return;
    }

    var mid = this._uuid();
    this.metadata_store[mid] = new _via_metadata(z, xy, metadata);
    if ( typeof(this.file_mid_store[fid]) === 'undefined' ) {
      this.file_mid_store[fid] = [];
    }
    this.file_mid_store[fid].push(mid);
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

    this.metadata_store[mid] = new _via_metadata(z, xy, metadata);
    this._store_transaction('metadata_store', 'update', {'fid':fid, 'mid':mid});
    this._hook_on_data_update();
    this.emit_event( 'metadata_update', { 'fid':fid, 'mid':mid } );
    ok_callback({'fid':fid, 'mid':mid});
  }.bind(this));
}

_via_data.prototype.metadata_update_zi = function(fid, mid, zindex, zvalue) {
  return new Promise( function(ok_callback, err_callback) {
    if ( typeof(this.file_store[fid]) === 'undefined' ) {
      err_callback('undefined fid=' + fid);
      return;
    }

    if ( typeof(this.metadata_store[mid]) === 'undefined' ) {
      err_callback('undefined mid=' + mid);
    }

    this.metadata_store[mid].z[zindex] = zvalue;
    this._store_transaction('metadata_store', 'update', {'fid':fid, 'mid':mid});
    this._hook_on_data_update();
    this.emit_event( 'metadata_update', { 'fid':fid, 'mid':mid } );
    ok_callback({'fid':fid, 'mid':mid});
  }.bind(this));
}

_via_data.prototype.metadata_update_z = function(fid, mid, z) {
  return new Promise( function(ok_callback, err_callback) {
    if ( typeof(this.file_store[fid]) === 'undefined' ) {
      err_callback('undefined fid=' + fid);
      return;
    }

    if ( typeof(this.metadata_store[mid]) === 'undefined' ) {
      err_callback('undefined mid=' + mid);
    }

    this.metadata_store[mid].z = z;
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

_via_data.prototype.metadata_update_attribute_value_bulk = function(fid, value_list) {
  var mid_list = [];
  var i;
  for ( i in value_list ) {
    this.metadata_store[ value_list[i].mid ].metadata[ value_list[i].aid ] = value_list[i].value;
    this._store_transaction('metadata_store', 'update', {'fid':fid, 'mid':value_list[i].mid});
    mid_list.push(value_list[i].mid);
  }
  this._hook_on_data_update();
  this.emit_event( 'metadata_update_bulk', { 'fid':fid, 'mid_list':mid_list } );
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

    var mid_index = this.file_mid_store[fid].indexOf(mid);
    this.file_mid_store[fid].splice(mid_index, 1);
    this._store_transaction('metadata_store', 'del', {'fid':fid, 'mid':mid});
    this._hook_on_data_update();
    this.emit_event( 'metadata_del', { 'fid':fid, 'mid':mid } );
    ok_callback({'fid':fid, 'mid':mid});
  }.bind(this));
}

_via_data.prototype.metadata_del_bulk = function(fid, mid_list) {
  return new Promise( function(ok_callback, err_callback) {
    if ( typeof(this.file_store[fid]) === 'undefined' ) {
      err_callback('invalid fid=' + fid);
      return;
    }
    var mindex, mid, findex;
    for ( mindex in mid_list ) {
      mid = mid_list[mindex];
      delete this.metadata_store[mid];
      findex = this.file_mid_store[fid].indexOf(mid);
      if ( findex !== -1 ) {
        this.file_mid_store[fid].splice(findex, 1);
      }
      this._store_transaction('metadata_store', 'del', {'fid':fid, 'mid':mid});
    }
    this._hook_on_data_update();
    this.emit_event( 'metadata_del_bulk', { 'fid':fid, 'mid_list':mid_list } );
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

  var data = JSON.parse(json_str);
  this._project_load(data);
}

_via_data.prototype._project_load = function(data) {
  // clear everything
  this.project_store = {};
  this.metadata_store = {};
  this.attribute_store = {};
  this.aid_list = [];        // to maintain ordering of attributes
  this.file_store = {};
  this.fid_list = [];        // to maintain ordering of files
  this.file_mid_store = {};   // list of all metadata associated with a file

  // project
  this.project_store = data.project_store;

  // add all files
  var fid;
  for ( fid in data.file_store ) {
    this.file_store[fid] = new _via_file(fid,
                                         data.file_store[fid].filename,
                                         data.file_store[fid].type,
                                         data.file_store[fid].loc,
                                         data.file_store[fid].src
                                        );
  }

  // copy list of file id (fid)
  var findex;
  for ( findex in data.fid_list ) {
    this.fid_list[findex] = data.fid_list[findex].toString(); // fid is always string
  }

  // copy map of mid associated with each fid
  this.file_mid_store = data.file_mid_store;

  // add all attributes
  var aid;
  for ( aid in data.attribute_store ) {
    this.attribute_store[aid] = new _via_attribute(aid,
                                                   data.attribute_store[aid].aname,
                                                   data.attribute_store[aid].type,
                                                   data.attribute_store[aid].options,
                                                   data.attribute_store[aid].default_option_id
                                                  );
  }

  // copy list of attribute id (aid)
  var aindex;
  for ( aindex in data.aid_list ) {
    this.aid_list[aindex] = data.aid_list[aindex].toString(); // aid is always string
  }

  // add all metadata
  var mid;
  for ( mid in data.metadata_store ) {
    this.metadata_store[mid] = new _via_metadata(data.metadata_store[mid].z,
                                                 data.metadata_store[mid].xy,
                                                 data.metadata_store[mid].v
                                                );
  }

  if ( data.hasOwnProperty('_id') && data.hasOwnProperty('_rev') ) {
    this.couchdb_id = data['_id'];
    this.couchdb_rev = data['_rev'];
  }

  // initialise all the stores
  var store_id;
  for ( store_id in this._store_list ) {
    this._store_list[store_id]._init();
  }

  _via_util_msg_show('Loaded project [' + this.project_store['project_name'] + ']');
  this.emit_event( 'project_load', {}  );
}

_via_data.prototype._project_pack_data = function() {
  return new Promise( function(ok_callback, err_callback) {
    try {
      var data = {
        'project_store':this.project_store,
        'metadata_store':this.metadata_store,
        'attribute_store':this.attribute_store,
        'aid_list':this.aid_list,
        'file_store':this.file_store,
        'fid_list':this.fid_list,
        'file_mid_store':this.file_mid_store,
      };

      var data_str = JSON.stringify(data);
      var filename = data.project_store.project_name;
      ok_callback({'project_id':data.project_store.project_id,
                   'project_name':data.project_store.project_name,
                   'data_str':data_str
                  });
    } catch(err) {
      _via_util_msg_show('Failed to convert project data to JSON', true);
      console.log(err)
    }
  }.bind(this));
}

_via_data.prototype.save_local = function() {
  this._project_pack_data().then( function(payload) {
    var blob = new Blob( [payload.data_str], {type:'text/json;charset=utf-8'} );
    var filename = payload.project_name + '.json';
    _via_util_download_as_file(blob, filename);
  }.bind(this), function(err) {
    console.log(err)
  }.bind(this));
}

// temporary method for voxceleb data annotation - Abhishek (20 Mar. 2019)
_via_data.prototype.save_remote = function(username) {
  if ( ! this.couchdb_id || ! this.couchdb_rev ) {
    _via_util_msg_show('Upload feature not available!', true);
    return;
  }

  var username = document.getElementById('remote_push_username').value;
  username = username.trim();
  if ( username === '' ) {
    _via_util_msg_show('To upload, you must enter your username!', true);
    return;
  }
  var constraint = new RegExp("^([a-z0-9]{5,})$");
  if ( ! constraint.test(username) ) {
    _via_util_msg_show('Username must be 5 characters long and cannot contain spaces or special characters.', true);
    return;
  }

  var commit_msg = [];
  commit_msg.push(username);
  if ( this._store_list.hasOwnProperty('localStorage') ) {
    commit_msg.push( this._store_list['localStorage'].BROWSER_ID_VALUE );
  } else {
    commit_msg.push('unknown');
  }
  commit_msg.push( new Date().toJSON() );
  commit_msg.push(this.couchdb_rev);
  this.project_store['update_history'].push( commit_msg.join(',') );

  var data = {
    'project_store':this.project_store,
    'metadata_store':this.metadata_store,
    'attribute_store':this.attribute_store,
    'aid_list':this.aid_list,
    'file_store':this.file_store,
    'fid_list':this.fid_list,
    'file_mid_store':this.file_mid_store,
  };

  var uri = _VIA_PROJECT_DS_URI + this.couchdb_id + '?rev=' + this.couchdb_rev;
  var xhr = new XMLHttpRequest();
  xhr.open('PUT', uri);
  xhr.addEventListener('error', function(e) {
    _via_util_msg_show('Failed to upload!', true);
  }.bind(this));
  xhr.addEventListener('abort', function(e) {
    _via_util_msg_show('Upload aborted!', true);
    err_callback(false);
  }.bind(this));
  xhr.addEventListener('load', function(e) {
    switch(xhr.statusText) {
    case 'Created':
    case 'Accepted':
      try {
        var response = JSON.parse(xhr.responseText);
        if ( response.ok ) {
          this.couchdb_rev = response.rev;
          this.couchdb_id = response.id;
          var revision = this.couchdb_rev.split('-')[0];
          _via_util_msg_show('Upload successful (revision = ' + revision + ')', true);
        } else {
          _via_util_msg_show('Upload failed. Please report this: ' + xhr.responseText + ')', true);
        }
      }
      catch(e) {
        _via_util_msg_show('Malformed server response. Please report this: ' + xhr.responseText, true);
      }
      break;
    default:
      _via_util_msg_show('Upload failed with response [' + xhr.statusText + ']', true);
      break;
    }
  }.bind(this));
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.send( JSON.stringify(data) );
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
  var slash_index = uuid.lastIndexOf('/');
  if ( uuid !== -1 ) {
    // remove any prefix (e.g. blob:null/, blob:www.test.com/, ...)
    uuid = uuid.substr(slash_index + 1);
    uuid = uuid.replace(/-/g, '');
  }
  return uuid;
}
