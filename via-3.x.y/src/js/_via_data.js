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
  this._ID = '_via_data_';
  this.store = this._init_default_project();
  this.file_ref = {};        // ref. to files selected using browser's file selector
  this.file_object_uri = {}; // WARNING: cleanup using file_object_url[fid]._destroy_file_object_url()

  this.DATA_FORMAT_VERSION = '3.1.1';

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  _via_event.call(this);
}

_via_data.prototype._init_default_project = function() {
  var p = {};
  p['project'] = {
    'pid': '__VIA_PROJECT_ID__',
    'rev': '__VIA_PROJECT_REV_ID__',
    'rev_timestamp': '__VIA_PROJECT_REV_TIMESTAMP__',
    'pname': 'Unnamed VIA Project',
    'data_format_version': this.DATA_FORMAT_VERSION,
    'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
    'created': Date.now(),
    'vid_list': [],
  }
  p['config'] = {
    'file': {
      'loc_prefix': { '1':'', '2':'', '3':'', '4':'' }, // constants defined in _via_file._VIA_FILE_LOC
    },
    'ui': {
      'file_content_align':'center',
      'file_metadata_editor_visible':true,
      'spatial_metadata_editor_visible':true,
      'spatial_region_label_attribute_id':'',
    },
  };
  p['attribute'] = {};
  p['file'] = {};
  p['metadata'] = {};
  p['view'] = {};

  this.cache = {};
  this.cache['mid_list'] = {};
  this.cache['attribute_group'] = {};

  return p;
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

_via_data.prototype.attribute_add = function(name, anchor_id, type, desc, options, default_option_id) {
  return new Promise( function(ok_callback, err_callback) {
    if ( this._attribute_exist(name) ) {
      err_callback('attribute already exists');
      return;
    }

    var aid = this._attribute_get_new_id();
    var desc = desc || '';
    var options = options || {};
    var default_option_id = default_option_id || '';
    this.store['attribute'][aid] = new _via_attribute(name,
                                                      anchor_id,
                                                      type,
                                                      desc,
                                                      options,
                                                      default_option_id);
    this._cache_update_attribute_group();
    this.emit_event( 'attribute_add', { 'aid':aid } );
    ok_callback(aid);
  }.bind(this));
}

_via_data.prototype.attribute_del = function(aid) {
  return new Promise( function(ok_callback, err_callback) {
    if ( this._attribute_exist(name) ) {
      err_callback('attribute already exists');
      return;
    }

    // delete all metadata entries for aid
    for ( var mid in this.store.metadata ) {
      if ( this.store.metadata[mid].av.hasOwnProperty(aid) ) {
        delete this.store.metadata[mid].av[aid];
      }
    }

    // delete aid
    delete this.store.attribute[aid];
    this._cache_update_attribute_group();
    this.emit_event( 'attribute_del', { 'aid':aid } );
    ok_callback(aid);
  }.bind(this));
}


_via_data.prototype.attribute_update_anchor_id = function(aid, anchor_id) {
  return new Promise( function(ok_callback, err_callback) {
    if ( ! this.store.attribute.hasOwnProperty(aid) ) {
      err_callback('aid does not exist');
      return;
    }
    this.store.attribute[aid].anchor_id = anchor_id;
    this._cache_update_attribute_group();
    this.emit_event( 'attribute_update', { 'aid':aid } );
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

_via_data.prototype.attribute_update_type = function(aid, new_type) {
  return new Promise( function(ok_callback, err_callback) {
    if ( ! this.store.attribute.hasOwnProperty(aid) ) {
      err_callback('aid does not exist');
      return;
    }
    this.store['attribute'][aid]['type'] = new_type;
    this.emit_event( 'attribute_update', { 'aid':aid, 'type':new_type } );
    ok_callback(aid);
  }.bind(this));
}

// option_csv = option1,*default_option,option2,...
_via_data.prototype.attribute_update_options_from_csv = function(aid, options_csv) {
  return new Promise( function(ok_callback, err_callback) {
    if ( ! this.store.attribute.hasOwnProperty(aid) ) {
      err_callback('aid does not exist');
      return;
    }
    options_csv = options_csv.trim();
    this.store['attribute'][aid]['options'] = {};
    this.store['attribute'][aid]['default_option_id'] = '';
    var options = options_csv.split(',');
    for ( var oid = 0; oid < options.length; ++oid ) {
      var oval = options[oid];
      oval = oval.trim();
      if ( oval.startsWith('*') ) {
        this.store['attribute'][aid]['default_option_id'] = oid.toString();
        oval = oval.substring(1); // remove *
      }
      this.store['attribute'][aid]['options'][oid] = oval;
    }
    this.emit_event( 'attribute_update', { 'aid':aid } );
    ok_callback(aid);
  }.bind(this));
}

//
// file
//
_via_data.prototype._file_get_new_id = function() {
  var max_fid = -Infinity;
  var fid;
  for ( var fid_str in this.store.file ) {
    fid = parseInt(fid_str);
    if ( fid > max_fid ) {
      max_fid = fid;
    }
  }
  if ( max_fid === -Infinity ) {
    return '1';
  } else {
    return (max_fid + 1).toString();
  }
}

_via_data.prototype.file_add = function(name, type, loc, src) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      var fid = this._file_get_new_id();
      this.store.file[fid] = new _via_file(fid, name, type, loc, src);
      this.emit_event( 'file_add', { 'fid':fid } );
      ok_callback(fid);
    }
    catch(ex) {
      err_callback(ex);
    }
  }.bind(this));
}


_via_data.prototype.file_update = function(fid, name, value) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      if ( this.store.file.hasOwnProperty(fid) ) {
        if ( name === 'src' ) {
          if ( this.store.file[fid].loc === _VIA_FILE_LOC.LOCAL ) {
            this.file_ref[fid] = value;
            this.store.file[fid]['src'] = '';
          } else {
            this.store.file[fid]['src'] = value;
          }
        } else {
          if ( name === 'loc_prefix' ) {
            this.store.config.file.loc_prefix[this.store.file[fid].loc] = value;
          } else {
            this.store.file[fid][name] = value;
          }
        }
        this.emit_event( 'file_update', { 'fid':fid } );
        ok_callback(fid);
      } else {
        err_callback('fid=' + fid + ' does not exist!');
      }
    }
    catch(ex) {
      err_callback(ex);
    }
  }.bind(this));
}

_via_data.prototype.file_get_src = function(fid) {
  var filesrc = ''; // empty value triggers file-not-found error
  if ( this.store.file[fid].loc === _VIA_FILE_LOC.LOCAL ) {
    if ( this.file_ref.hasOwnProperty(fid) ) {
      if ( ! this.file_object_uri.hasOwnProperty(fid) ) {
        this.file_object_uri[fid] = URL.createObjectURL( this.file_ref[fid] );
        // Note: cleanup done by data.file_object_uri_clear_all() method
      }
      filesrc = this.file_object_uri[fid];
    }
  } else {
    var locprefix = this.store.config.file.loc_prefix[ this.store.file[fid].loc ];
    filesrc = locprefix + this.store.file[fid].src;
  }
  return filesrc;
}

_via_data.prototype.file_get_uri = function(fid) {
  var fileuri = '';
  if ( this.store.file[fid].loc === _VIA_FILE_LOC.LOCAL ) {
    fileuri = this.store.file[fid].fname;
  } else {
    var locprefix = this.store.config.file.loc_prefix[ this.store.file[fid].loc ];
    fileuri = locprefix + this.store.file[fid].src;
  }
  return fileuri;
}

_via_data.prototype.file_object_uri_clear_all = function() {
  for ( var fid in this.file_object_uri ) {
    URL.revokeObjectURL( this.file_object_uri[fid] );
  }
  this.file_object_uri = {};
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
      var z_fp = _via_util_float_arr_to_fixed(z, _VIA_FLOAT_FIXED_POINT);
      var xy_fp = _via_util_float_arr_to_fixed(xy, _VIA_FLOAT_FIXED_POINT);
      this.store.metadata[mid] = new _via_metadata(vid, z_fp, xy_fp, av);
      if ( ! this.cache.mid_list.hasOwnProperty(vid) ) {
        this.cache.mid_list[vid] = [];
      }
      this.cache.mid_list[vid].push(mid);

      this.emit_event( 'metadata_add', { 'vid':vid, 'mid':mid } );
      ok_callback( {'vid':vid, 'mid':mid} );
    }
    catch(ex) {
      err_callback(ex);
    }
  }.bind(this));
}

_via_data.prototype.metadata_add_bulk = function(metadata_list, emit) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      var added_mid_list = [];
      for ( var mindex in metadata_list ) {
        var vid = metadata_list[mindex].vid;
        var mid = this._metadata_get_new_id(vid);
        var z_fp = _via_util_float_arr_to_fixed(metadata_list[mindex].z, _VIA_FLOAT_FIXED_POINT);
        var xy_fp = _via_util_float_arr_to_fixed(metadata_list[mindex].xy, _VIA_FLOAT_FIXED_POINT);
        this.store.metadata[mid] = new _via_metadata(vid, z_fp, xy_fp, metadata_list[mindex].av);
        if ( ! this.cache.mid_list.hasOwnProperty(vid) ) {
          this.cache.mid_list[vid] = [];
        }
        this.cache.mid_list[vid].push(mid);
        added_mid_list.push(mid);
      }
      if ( typeof(emit) !== 'undefined' &&
           emit === true ) {
        this.emit_event( 'metadata_add_bulk', { 'mid_list':added_mid_list } );
      }
      ok_callback( { 'mid_list':added_mid_list } );
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

      var z_fp = _via_util_float_arr_to_fixed(z, _VIA_FLOAT_FIXED_POINT);
      var xy_fp = _via_util_float_arr_to_fixed(xy, _VIA_FLOAT_FIXED_POINT);
      this.store.metadata[mid] = new _via_metadata(vid, z_fp, xy_fp, av);
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
      var xy_fp = _via_util_float_arr_to_fixed(xy, _VIA_FLOAT_FIXED_POINT);
      this.store.metadata[mid].xy = xy_fp;
      this.emit_event( 'metadata_update', { 'vid':vid, 'mid':mid } );
      ok_callback({'vid':vid, 'mid':mid});
    }
    catch(ex) {
      console.log(xy);
      err_callback(ex);
    }
  }.bind(this));
}

_via_data.prototype.metadata_update_av = function(mid, aid, avalue) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      if ( ! this.store.metadata.hasOwnProperty(mid) ) {
        err_callback({'mid':mid});
        return;
      }

      this.store.metadata[mid].av[aid] = avalue;
      var vid = this.store.metadata[mid].vid;
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

_via_data.prototype.metadata_update_z = function(vid, mid, z) {
  return new Promise( function(ok_callback, err_callback) {
    if ( ! this.store.view.hasOwnProperty(vid) ) {
      err_callback({'vid':vid});
      return;
    }
    if ( ! this.store.metadata.hasOwnProperty(mid) ) {
      err_callback({'mid':mid});
      return;
    }

    var z_fp = _via_util_float_arr_to_fixed(z, _VIA_FLOAT_FIXED_POINT);
    this.store.metadata[mid].z = z_fp;
    this.emit_event( 'metadata_update', { 'vid':vid, 'mid':mid } );
    ok_callback({'vid':vid, 'mid':mid});
  }.bind(this));
}

_via_data.prototype.metadata_update_zi = function(vid, mid, zindex, zvalue) {
  return new Promise( function(ok_callback, err_callback) {
    if ( ! this.store.view.hasOwnProperty(vid) ) {
      err_callback({'vid':vid});
      return;
    }
    if ( ! this.store.metadata.hasOwnProperty(mid) ) {
      err_callback({'mid':mid});
      return;
    }

    var zvalue_fp = _via_util_float_to_fixed(zvalue, _VIA_FLOAT_FIXED_POINT);
    this.store.metadata[mid].z[zindex] = zvalue_fp;
    this.emit_event( 'metadata_update', { 'vid':vid, 'mid':mid } );
    ok_callback({'vid':vid, 'mid':mid});
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

      this._cache_mid_list_del(vid, [mid]);
      delete this.store.metadata[mid];
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
      var mid, cindex;
      for ( var mindex in mid_list ) {
        mid = mid_list[mindex];
        delete this.store.metadata[mid];
        deleted_mid_list.push(mid);
      }
      this._cache_mid_list_del(vid, deleted_mid_list);
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
  var max_vid = -Infinity;
  var vid;
  for ( var vid_str in this.store.view ) {
    vid = parseInt(vid_str);
    if ( vid > max_vid ) {
      max_vid = vid;
    }
  }
  if ( max_vid === -Infinity ) {
    return '1';
  } else {
    return (max_vid + 1).toString();
  }
}

_via_data.prototype.view_add = function(fid_list) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      var vid = this._view_get_new_id();
      this.store.view[vid] = new _via_view(fid_list);
      this.store.project.vid_list.push(vid);
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

// add view with single file
_via_data.prototype.view_bulk_add_from_filelist = function(filelist) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      var added_fid_list = [];
      var added_vid_list = [];
      for ( var i = 0; i < filelist.length; ++i ) {
        var fid = this._file_get_new_id();
        if ( filelist[i].loc === _VIA_FILE_LOC.LOCAL ) {
          this.file_ref[fid] = filelist[i].src; // local file ref. stored separately
          filelist[i].src = '';                 // no need to store duplicate of file ref.
        }
        this.store.file[fid] = new _via_file(fid,
                                             filelist[i].fname,
                                             filelist[i].type,
                                             filelist[i].loc,
                                             filelist[i].src);

        var vid = this._view_get_new_id();
        this.store.view[vid] = new _via_view( [ fid ] ); // view with single file
        this.store.project.vid_list.push(vid);

        added_fid_list.push(fid);
        added_vid_list.push(vid);
      }
      var payload = { 'vid_list':added_vid_list, 'fid_list':added_fid_list };
      this.emit_event( 'view_bulk_add', payload );
      ok_callback(payload);
    }
    catch(err) {
      err_callback(err);
    }
  }.bind(this));
}

_via_data.prototype.view_del = function(vid) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      if ( ! this.store.view.hasOwnProperty(vid) ) {
        err_callback();
        return;
      }
      var vindex = this.store.project.vid_list.indexOf(vid);
      if ( vindex === -1 ) {
        err_callback();
        return;
      }

      // delete all metadata
      var mid;
      for ( var mindex in this.cache.mid_list[vid] ) {
        mid = this.cache.mid_list[vid][mindex];
        delete this.store.metadata[mid];
      }
      // delete all files
      var fid;
      for ( var findex in this.store.view[vid].fid_list ) {
        fid = this.store.view[vid].fid_list[findex];
        delete this.store.file[fid];
      }
      // delete view
      delete this.store.view[vid];
      this.store.project.vid_list.splice(vindex, 1);

      this._cache_update_mid_list();
      this.emit_event( 'view_del', {'vid':vid, 'vindex':vindex} );
      ok_callback({'vid':vid, 'vindex':vindex});
    }
    catch(err) {
      err_callback(err);
    }
  }.bind(this));
}

//
// cache
//
_via_data.prototype._cache_update = function() {
  this._cache_update_mid_list();
  this._cache_update_attribute_group();
}

_via_data.prototype._cache_mid_list_del = function(vid, del_mid_list) {
  var mid;
  for ( var mindex in del_mid_list ) {
    mid = del_mid_list[mindex];
    var cindex = this.cache.mid_list[vid].indexOf(mid);
    if ( cindex !== -1 ) {
      this.cache.mid_list[vid].splice(cindex, 1);
    }
  }
}

_via_data.prototype._cache_update_mid_list = function() {
  var vid;
  this.cache.mid_list = {};
  for ( var mid in this.store.metadata ) {
    vid = this.store.metadata[mid].vid;
    if ( ! this.cache.mid_list.hasOwnProperty(vid) ) {
      this.cache.mid_list[vid] = [];
    }
    this.cache.mid_list[vid].push(mid);
  }
}

_via_data.prototype._cache_update_attribute_group = function() {
  this.cache.attribute_group = {};
  var anchor_id;
  for ( var aid in this.store.attribute ) {
    anchor_id = this.store.attribute[aid].anchor_id;
    if ( ! this.cache.attribute_group.hasOwnProperty(anchor_id) ) {
      this.cache.attribute_group[anchor_id] = [];
    }
    this.cache.attribute_group[anchor_id].push(aid);
  }
}

_via_data.prototype._cache_get_attribute_group = function(anchor_id_list) {
  var aid_list = [];
  for ( var i in anchor_id_list ) {
    var anchor_id = anchor_id_list[i];
    if ( this.cache.attribute_group.hasOwnProperty(anchor_id) ) {
      aid_list = aid_list.concat( this.cache.attribute_group[anchor_id] );
    }
  }
  return aid_list;
}

//
// project
//
_via_data.prototype.project_save = function() {
  return new Promise( function(ok_callback, err_callback) {
    try {
      // @todo: decide on whether we want to include the base64 data
      // of inline files (i.e. this.store.file[fid].loc === _VIA_FILE_LOC.INLINE)
      var data_blob = new Blob( [JSON.stringify(this.store)],
                                {type: 'text/json;charset=utf-8'});
      var filename = [];
      if ( this.store.project.pid === _VIA_PROJECT_ID_MARKER ) {
        filename.push('via_project_');
      } else {
        filename.push(this.store.project.pid.substr(0,8) + '_');
      }
      filename.push(_via_util_date_to_filename_str(Date.now()));
      filename.push('.json');
      _via_util_download_as_file(data_blob, filename.join(''));
      ok_callback();
    }
    catch(err) {
      _via_util_msg_show('Failed to save project! [' + err + ']');
      err_callback();
    }
  }.bind(this));
}

_via_data.prototype.project_load = function(project_data_str) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      var project_json_data = JSON.parse(project_data_str);
      this.project_load_json(project_json_data).then( function(ok) {
        ok_callback();
      }.bind(this), function(err) {
        err_callback();
      }.bind(this));
    }
    catch(err) {
      _via_util_msg_show('Failed to load project! [' + err + ']');
      this._init_default_project();
      console.log(err)
      err_callback();
    }
  }.bind(this));
}

_via_data.prototype.project_load_json = function(project_json_data) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      var project_data = Object.assign({}, project_json_data);
      this.store = this.project_store_apply_version_fix(project_data);
      this.store0 = Object.assign({}, this.store); // used to detect project changes
      this._cache_update();
      this.emit_event( 'project_loaded', { 'pid':this.store.project.pid } );
      ok_callback();
    }
    catch(err) {
      _via_util_msg_show('Failed to load project! [' + err + ']');
      this._init_default_project();
      console.warn('failed to load project')
      console.log(err)
      err_callback();
    }
  }.bind(this));
}

_via_data.prototype.project_store_apply_version_fix = function(d) {
  switch(d['project']['data_format_version']) {
  case '3.1.0':
    var local_prefix = d['config']['file']['path'];
    delete d['config']['file']['path'];
    d['config']['file']['loc_prefix'] = { '1':'', '2':'', '3':'', '4':'' };
    d['config']['file']['loc_prefix'][_VIA_FILE_LOC.LOCAL] = local_prefix;
    d['project']['data_format_version'] = this.DATA_FORMAT_VERSION;
    d['project']['vid_list'] = d['vid_list'];
    delete d['vid_list'];
    return d;
    break;
  default:
    return d;
    break;
  }
}

_via_data.prototype.project_is_remote = function() {
  if ( this.store.project.pid === _VIA_PROJECT_ID_MARKER &&
       this.store.project.rev === _VIA_PROJECT_REV_ID_MARKER &&
       this.store.project.rev_timestamp === _VIA_PROJECT_REV_TIMESTAMP_MARKER
     ) {
    return false;
  } else {
    return true;
  }
}

//
// merge
//
_via_data.prototype.project_merge_rev = function(remote, merge_strategy) {
  if ( typeof(merge_strategy) === 'undefined' ) {
    merge_strategy = _VIA_MERGE_STRATEGY.THREE_WAY;
  }

  switch(merge_strategy) {
  case _VIA_MERGE_STRATEGY.THREE_WAY:
    this.project_merge_three_way(remote).then( function(ok) {
      console.log('Merge success');
    }.bind(this), function(err) {
      console.log('Merge failed');
    }.bind(this));
    break;
  default:
    console.log('Unknown merge strategy: ' + merge_strategy);
  }
}

_via_data.prototype.project_merge_three_way = function(remote) {
  return new Promise( function(ok_callback, err_callback) {
    // see https://en.wikipedia.org/wiki/Merge_(version_control)
    // merge using the three way merge algorithm, where
    // common ancestor = this.store0 (i.e. the last revision)
    // remote          = the latest revision pulled from server
    // local           = this.store (i.e. local version of project with some revisions)

    if ( this.store.project.pid !== remote.project.pid ) {
      err_callback('pid mismatch');
      return;
    }

    try {
      // merge project
      this.store.project['pname'] = this.merge_3way(this.store0.project['pname'],
                                                    remote.project['pname'],
                                                    this.store.project['pname']);
      this.store.project['vid_list'] = this.merge_3way(this.store0.project['vid_list'],
                                                       remote.project['vid_list'],
                                                       this.store.project['vid_list']);

      // merge remote attribute, file, view and metadata
      var property_list = [ 'config', 'attribute', 'file', 'view', 'metadata' ];
      for ( var pindex in property_list ) {
        var property = property_list[pindex]
        for ( var id in remote[property] ) {
          if ( this.store[property].hasOwnProperty(id) ) {
            for ( var afield in this.store[property][id] ) {
              this.store[property][id][afield] = this.merge_3way(this.store[property][id][afield],
                                                                 remote[property][id][afield],
                                                                 this.store0[property][id][afield]);
            }
          } else {
            // add new attribute
            this.store[property][id] = remote[property][id];
          }
        }
      }

      // check for data that was deleted in remote
      for ( var pindex in property_list ) {
        var property = property_list[pindex]
        for ( var id in this.store[property] ) {
          if ( ! remote[property].hasOwnProperty(id) ) {
            // something was deleted in remote, therefore we remove it from local version
            delete this.store[property][id];
          }
        }
      }

      this.store.project.rev = remote.project.rev;
      this.store.project.rev_timestamp = remote.project.rev_timestamp;
      this.project_merge_on_success();
    }
    catch (e) {
      _via_util_msg_show('Merge failed: ' + e, true);
      console.warn(e);
      err_callback(e);
    }
  }.bind(this));
}

_via_data.prototype.merge_3way = function(common_ancestor, remote, local) {
  if ( typeof(common_ancestor) === 'object' ) {
    if ( Array.isArray(common_ancestor) ) {
      // use array comparison
      if ( _via_util_array_eq(remote, local) ) {
        return local;
      } else {
        if ( _via_util_array_eq(common_ancestor, local) ) {
          return remote;
        } else {
          return local; // for conflicts, preserve my local updates
        }
      }
    } else {
      // use object comparison
      if ( JSON.stringify(remote) === JSON.stringify(local) ) {
        return local;
      } else {
        if ( JSON.stringify(common_ancestor) === JSON.stringify(local) ) {
          return remote;
        } else {
          return local; // for conflicts, preserve my local updates
        }
      }
    }
  } else {
    if ( remote === local ) {
      return local;
    } else {
      if ( common_ancestor === local ) {
        return remote;
      } else {
        return local; // for conflicts, preserve my local updates
      }
    }
  }
}

_via_data.prototype.project_merge_on_success = function() {
  this._cache_update();
  this.emit_event( 'project_updated', { 'pid':this.store.project.pid } );

  _via_util_msg_show('Successfully merged with revision ' + this.store.project.rev, true);
}

// is there any difference between local project and remote project?
_via_data.prototype.project_is_different = function(others_str) {
  return new Promise( function(ok_callback, err_callback) {
    var ours_str = JSON.stringify(this.store);
    if ( ours_str === others_str ) {
      err_callback();
    } else {
      ok_callback(others_str);
    }
  }.bind(this));
}

//
// Import
//
_via_data.prototype.project_import_via2_json = function(via2_project_json) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      var via2 = JSON.parse(via2_project_json);
      this.store = this._init_default_project();

      // add project data
      if ( via2.hasOwnProperty('_via_settings') ) {
        this.store.project.pname = via2['_via_settings']['project']['name'];
        this.store.config.file.loc_prefix[_VIA_FILE_LOC.LOCAL] = via2['_via_settings']['core']['default_filepath'];
      }

      // add attributes
      var metadata_type_anchor_id_map = { 'region':'FILE1_Z0_XY1', 'file':'FILE1_Z0_XY0' };
      var via2_aid_to_via3_aid_map = {};
      for ( var metadata_type in metadata_type_anchor_id_map ) {
        var anchor_id = metadata_type_anchor_id_map[metadata_type];
        for ( var aid in via2['_via_attributes'][metadata_type] ) {
          var options = via2['_via_attributes'][metadata_type][aid]['options'];
          var default_option_id = [];
          for ( var default_oid in via2['_via_attributes'][metadata_type][aid]['default_options'] ) {
            default_option_id.push(default_oid);
          }
          var via3_aid = this._attribute_get_new_id();
          var atype_text = via2['_via_attributes'][metadata_type][aid]['type'].toUpperCase();
          if ( atype_text === 'DROPDOWN' ) {
            atype_text = 'SELECT';
          }
          var atype = _VIA_ATTRIBUTE_TYPE[atype_text];
          this.store['attribute'][via3_aid] = new _via_attribute(aid,
                                                                  anchor_id,
                                                                  atype,
                                                                  via2['_via_attributes'][metadata_type][aid]['description'],
                                                                  options,
                                                                 default_option_id.join(',')
                                                                 );
          via2_aid_to_via3_aid_map[aid] = via3_aid;
        }
      }

      // add file, view and metadata
      for ( var fid in via2['_via_img_metadata'] ) {
        var fname = via2['_via_img_metadata'][fid]['filename'];
        var floc = _via_util_infer_file_loc_from_filename(fname);
        var ftype = _via_util_infer_file_type_from_filename(fname);
        var via3_fid = this._file_get_new_id();
        this.store.file[via3_fid] = new _via_file(via3_fid, fname, ftype, floc, fname);

        var vid = this._view_get_new_id();
        this.store.view[vid] = new _via_view([via3_fid]);
        this.store.project.vid_list.push(vid);

        // import region metadata
        for ( var rid in via2['_via_img_metadata'][fid]['regions'] ) {
          var shape = via2['_via_img_metadata'][fid]['regions'][rid]['shape_attributes'];
          var z = [];
          var xy = [];
          var av = {};
          switch(shape['name']) {
          case 'rect':
            xy = [ _VIA_RSHAPE.RECTANGLE, shape['x'], shape['y'], shape['width'], shape['height'] ];
            break;
          case 'circle':
            xy = [ _VIA_RSHAPE.CIRCLE, shape['cx'], shape['cy'], shape['r'] ];
            break;
          case 'ellipse':
            xy = [ _VIA_RSHAPE.ELLIPSE, shape['cx'], shape['cy'], shape['rx'], shape['ry'] ];
            break;
          case 'point':
            xy = [ _VIA_RSHAPE.POINT, shape['cx'], shape['cy'] ];
            break;
          case 'polygon':
          case 'polyline':
            if ( shape['name'] === 'polygon' ) {
              xy[0] = _VIA_RSHAPE.POLYGON;
            } else {
              xy[0] = _VIA_RSHAPE.POLYLINE;
            }
            var n = shape['all_points_x'].length;
            for ( var i = 0; i < n; ++i ) {
              xy.push(shape['all_points_x'][i], shape['all_points_y'][i]);
            }
            break;
          default:
            console.log('Unknown shape ' + shape['name'] + ' in input file!');
          }

          var region = via2['_via_img_metadata'][fid]['regions'][rid]['region_attributes'];
          for ( var via2_aid in via2['_via_img_metadata'][fid]['regions'][rid]['region_attributes'] ) {
            var via3_aid = via2_aid_to_via3_aid_map[via2_aid];
            var avalue = via2['_via_img_metadata'][fid]['regions'][rid]['region_attributes'][via2_aid];

            if ( typeof(avalue) === 'object' ) {
              avalue = Object.keys(avalue).join(',');
            }

            av[via3_aid] = avalue;
          }

          var mid = this._metadata_get_new_id(vid);
          this.store.metadata[mid] = new _via_metadata(vid, z, xy, av);
        }

        // import file metadata
        var file_av = {};
        for ( var via2_aid in via2['_via_img_metadata'][fid]['file_attributes'] ) {
          var via3_aid = via2_aid_to_via3_aid_map[via2_aid];
          var avalue = via2['_via_img_metadata'][fid]['file_attributes'][via2_aid];

          if ( typeof(avalue) === 'object' ) {
            avalue = Object.keys(avalue).join(',');
          }

          file_av[via3_aid] = avalue;
        }
        var mid = this._metadata_get_new_id(vid);
        this.store.metadata[mid] = new _via_metadata(vid, [], [], file_av);
      }
      _via_util_msg_show('Project import successful');
      this._cache_update();
      this.emit_event( 'project_loaded', {} );
      ok_callback();
    }
    catch(ex) {
      console.log(ex)
      _via_util_msg_show('Failed to import project');
      err_callback(ex);
    }
  }.bind(this));
}
