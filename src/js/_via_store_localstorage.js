/**
 *
 * @class
 * @classdesc Provided persistence of data using browser's localStorage
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 27 Feb. 2019
 *
 */

'use strict';

function _via_store_localstorage(data) {
  this.d = data;

  this.store = window.localStorage;
  this.store_available = false;

  this.prev_session_available = false;
  this.prev_session_data = {};
  this.prev_session_timestamp = '';
  this.prev_session_timestamp_str = '';

  this.event_prefix = '_via_store_localstorage_';
  _via_event.call( this );
}

_via_store_localstorage.prototype._init = function() {
  if ( this.is_store_available() ) {
    this.store.clear();
    this.store_available = true;

    this._push_all();
    return true;
  } else {
    return false;
  }
}

_via_store_localstorage.prototype.prev_session_data_init = function() {
  return new Promise( function(ok_callback, err_callback) {
    try {
      var existing_project_store_str = this.store.getItem('_via_project_store');
      if ( typeof(existing_project_store_str) !== 'undefined' ) {
        // save a copy of previous session's data
        this.prev_session_data = this._pack_store_data();
        this.prev_session_data_blob = new Blob( [ JSON.stringify(this.prev_session_data) ],
                                                {type:'text/json;charset=utf-8'} );

        console.log(this.prev_session_data)
        this.prev_session_timestamp_str = _via_util_date_to_filename_str(this.prev_session_data.project_store.created);
        this.prev_session_timestamp = new Date(this.prev_session_data.project_store.created);
        this.prev_session_available = true;
        ok_callback();
      } else {
        console.log('_via_store_localstorage.prev_session_data_init() failed');
        err_callback();
      }
    }
    catch(ex) {
      console.log('exception in _via_store_localstorage.prev_session_data_init()');
      console.log(ex)
      err_callback(ex);
    }
  }.bind(this));
}

_via_store_localstorage.prototype.prev_session_is_available = function() {
  return this.prev_session_available;
}

_via_store_localstorage.prototype.prev_session_get_size = function() {
  return this.prev_session_data_blob.size;
}

_via_store_localstorage.prototype.prev_session_get_timestamp = function() {
  return this.prev_session_timestamp.toString();
}

_via_store_localstorage.prototype.prev_session_load = function() {
  if ( this.prev_session_available ) {
    this.d._project_load(this.prev_session_data);
  }
}

_via_store_localstorage.prototype.prev_session_save = function() {
  if ( this.prev_session_available ) {
    _via_util_download_as_file(this.prev_session_data_blob,
                               'via_project_' +
                               this.prev_session_timestamp_str + '.json');
  }
}

_via_store_localstorage.prototype._push_all = function() {
  var data_key, store_key;
  var data_key_index;
  for( data_key_index in this.d.data_key_list ) {
    data_key = this.d.data_key_list[data_key_index];
    this._push_data(data_key);
  }
  this._push_metadata();
}

_via_store_localstorage.prototype._push_data = function(data_key) {
  var store_key = this._datakey_to_storekey(data_key);
  this.store.setItem(store_key, JSON.stringify(this.d[data_key]));
}

_via_store_localstorage.prototype._push_metadata = function() {
  var mid;
  for ( mid in this.d.metadata_store ) {
    this.store.setItem(mid, JSON.stringify(this.d.metadata_store[mid]));
  }
}

_via_store_localstorage.prototype._storekey_to_datakey = function(store_key) {
  if ( store_key.startsWith('_via_') ) {
    return store_key.substring( '_via_'.length ); // remove prefix '_via_'
  } else {
    return store_key;
  }
}

_via_store_localstorage.prototype._datakey_to_storekey = function(data_key) {
  return '_via_' + data_key;
}


_via_store_localstorage.prototype._pack_store_data = function() {
  try {
    var data = { 'metadata_store':{} };
    var store_items = Object.keys(this.store);
    var store_key, store_key_index, data_key;

    for ( store_key_index in Object.keys(this.store) ) {
      store_key = store_items[store_key_index];
      data_key = this._storekey_to_datakey(store_key);
      if ( this.d.data_key_list.includes(data_key) ) {
        data[data_key] = JSON.parse( this.store.getItem(store_key) );
      } else {
        try {
          var metadata_str = this.store.getItem(store_key);
          var metadata = JSON.parse(metadata_str);
          if ( typeof(metadata.mid) !== 'undefined' ) {
            data['metadata_store'][store_key] = metadata;
          } else {
            console.log('malformed metadata : [' + metadata_str + ']');
          }
        } catch(e) {
          console.log('Faied to parse data for store_key=[' + store_key + ']');
          console.log(this.store.getItem(store_key));
        }
      }
    }
    return data;
  } catch(e) {
    err_callback(e);
  }
}

//
// Public methods
//

// source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
_via_store_localstorage.prototype.is_store_available = function() {
  try {
    var storage = window['localStorage'],
        x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  }
  catch(e) {
    return e instanceof DOMException && (
      // everything except Firefox
      e.code === 22 ||
        // Firefox
      e.code === 1014 ||
        // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
        // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
    storage.length !== 0;
  }
}

//
// public interface
//
_via_store_localstorage.prototype.transaction = function(data_key, action, param) {
  return new Promise( function(ok_callback, err_callback) {
    if ( ! this.store_available ) {
      err_callback('store not available');
      return;
    }
    try {
      switch(data_key) {
      case 'metadata_store':
        var fid = param.fid;
        var mid = param.mid;
        this.store.setItem(mid, JSON.stringify(this.d.metadata_store[mid]));
        if ( action !== 'update' ) {
          this._push_data('file_mid_list');
        }
        ok_callback();
        break;
      case 'attribute_store':
        this._push_data('attribute_store');
        this._push_data('aid_list');
        ok_callback();
        break;
      case 'file_store':
        this._push_data('file_store');
        this._push_data('fid_list');
        ok_callback();
        break;
      default:
        err_callback('unknown data_key=' + data_key);
      }
    } catch(e) {
      err_callback(e);
    }

  }.bind(this));
}

//
// Self Test
//
_via_store_localstorage.prototype._self_test = function() {
  var fid1 = this.d.file_add('test123.jpg', _VIA_FILE_TYPE.IMAGE, _VIA_FILE_LOC.LOCAL, '');
  var fid2 = this.d.file_add('testXYZ.jpg', _VIA_FILE_TYPE.IMAGE, _VIA_FILE_LOC.URIHTTP, 'http://somerandurl.com/files/testXYZ.jpg');

  var aid1 = this.d.attribute_add('attribute1', _VIA_ATTRIBUTE_TYPE.TEXT);
  var aid2 = this.d.attribute_add('attribute2', _VIA_ATTRIBUTE_TYPE.TEXT);
  this.d.metadata_add(fid1, [], [ _VIA_SHAPE.RECT, 10, 20, 50, 100 ], { aid1:'value1', aid2:'value2'}).then( function(ok) {
    this._pack_store_data().then( function(d) {
      console.assert( d.file_mid_list[0][0] === Object.keys(d.metadata_store)[0] );
      console.assert( d.fid_list.length === 2 );
      console.assert( d.aid_list.length === 2 );
      console.assert( d.file_store[1].filename === 'testXYZ.jpg' );
      console.assert( d.file_store[0].filename === 'test123.jpg' );
      console.assert( d.attribute_store[0].attr_name === 'attribute1' );
      console.assert( d.attribute_store[1].attr_name === 'attribute2' );
      console.log('_via_store_localstorage : self test done');
    }, function(err) {
      console.error(err)
    });
  }.bind(this), function(err) {
    console.error('failed');
  });
}
