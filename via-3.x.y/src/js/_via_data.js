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
  this._init_default_project();

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_data_';
  _via_event.call(this);
}

_via_data.prototype._init_default_project = function() {
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
  this.store['attribute'] = {
    '1': {
      'aname':'_DEFAULT_TIMELINE',
      'anchor_id':'FILE1_Z2_XY0',
      'type':1,
      'desc':'Attribute used for definition of temporal regions in audio and video (added by default)',
      'options':{},
      'default_option_id':'',
    },
  };
  this.store['file'] = {};
  this.store['metadata'] = {};
  this.store['view'] = {};
  this.store['vid_list'] = [];

  this.cache = {};
  this.cache['mid_list'] = {};
  this.cache['attribute_group'] = {};
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

_via_data.prototype.attribute_add = function(name, anchor_id, type, options, default_option_id) {
  return new Promise( function(ok_callback, err_callback) {
    if ( this._attribute_exist(name) ) {
      err_callback('attribute already exists');
      return;
    }

    var aid = this._attribute_get_new_id();
    this.store['attribute'][aid] = new _via_attribute(name,
                                                      anchor_id,
                                                      type,
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

    this.store.metadata[mid].z = z;
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

    this.store.metadata[mid].z[zindex] = zvalue;
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

      var mindex = this.cache.mid_list[vid].indexOf(mid);
      this.cache.mid_list[vid].splice(mindex, 1);
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
    vid = (vid_list[n-1] + 1).toString();
  } else {
    vid = '1';
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

// add view with single file
_via_data.prototype.view_bulk_add_from_filelist = function(filelist) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      var added_fid_list = [];
      var added_vid_list = [];
      for ( var i = 0; i < filelist.length; ++i ) {
        var fid = this._file_get_new_id();
        this.store.file[fid] = new _via_file(fid,
                                             filelist[i].fname,
                                             filelist[i].type,
                                             filelist[i].loc,
                                             filelist[i].src);

        var vid = this._view_get_new_id();
        this.store.view[vid] = new _via_view( [ fid ] ); // view with single file
        this.store.vid_list.push(vid);

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
      var vindex = this.store.vid_list.indexOf(vid);
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
      console.log('vid=' + vid + ', at vindex=' + vindex);
      console.log('before: ' + JSON.stringify(this.store.vid_list))
      this.store.vid_list.splice(vindex, 1);
      console.log('after: ' + JSON.stringify(this.store.vid_list))

      this._cache_update_mid_list();
      this.emit_event( 'view_del', {'vid':vid, 'vindex':vindex} );
      console.log(JSON.stringify(this.store))
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
  this.cache.attribute_group = {};
  var anchor_id;
  for ( var aid in this.store.attribute ) {
    anchor_id = this.store.attribute[aid].anchor_id;
    if ( ! this.cache.attribute_group.hasOwnProperty(anchor_id) ) {
      this.cache.attribute_group[anchor_id] = {};
    }
    this.cache.attribute_group[anchor_id][aid] = this.store.attribute[aid];
  }
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
      filename.push(this.store.project.pid.substr(0,9) + '_');
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
      this.store = JSON.parse(project_data_str);
      this._cache_update();
      this.emit_event( 'project_loaded', { 'pid':this.store.project.pid } );
      console.log('project load done');
      ok_callback();
    }
    catch(err) {
      _via_util_msg_show('Failed to load project! [' + err + ']');
      this._init_default_project();
      console.log('failed to load project')
      this.emit_event( 'project_load', { 'pid':this.store.project.pid } );
      err_callback();
    }
  }.bind(this));
}

_via_data.prototype.project_export_csv = function() {
  return new Promise( function(ok_callback, err_callback) {
    var csv = [];

    var attribute = {}
    for ( var aid in this.store.attribute ) {
      attribute[aid] = this.store.attribute[aid].aname;
    }

    csv.push('# Exported using VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)');
    csv.push('# SHAPE_ID = ' + JSON.stringify(_VIA_RSHAPE));
    csv.push('# FLAG_ID = ' + JSON.stringify(_VIA_METADATA_FLAG));
    csv.push('# ATTRIBUTES = ' + JSON.stringify(attribute));
    csv.push('# CSV_HEADER = metadata_id,file_list,flags,temporal_coordinates,spatial_coordinates,metadata');

    // build file_list for each view_id
    var vid_filesrc_str_list = {};
    var vid, fid;
    for ( var vindex in this.store.vid_list ) {
      vid = this.store.vid_list[vindex];
      var vid_filesrc_list = [];
      for ( var findex in this.store.view[vid].fid_list ) {
        fid = this.store.view[vid].fid_list[findex];
        if ( this.store.file[fid].src instanceof File ||
             this.store.file[fid].loc === _VIA_FILE_LOC.INLINE
           ) {
          vid_filesrc_list.push( this.store.file[fid].fname );
        } else {
          vid_filesrc_list.push( this.store.file[fid].src );
        }
      }
      vid_filesrc_str_list[vid] = _via_util_obj2csv(vid_filesrc_list);
    }

    for ( var mid in this.store.metadata ) {
      var line = [];
      line.push( '"' + mid + '"');
      line.push( vid_filesrc_str_list[ this.store.metadata[mid].vid ] );
      line.push(this.store.metadata[mid].flg);
      line.push( _via_util_obj2csv(this.store.metadata[mid].z) );
      line.push( _via_util_obj2csv(this.store.metadata[mid].xy) );
      line.push( _via_util_obj2csv(this.store.metadata[mid].av) );
      csv.push(line.join(','));
    }

    var data_blob = new Blob( [csv.join('\n')],
                              {type: 'text/csv;charset=utf-8'});
    var filename = [];
    filename.push(this.store.project.pid.substr(0,9) + '_');
    filename.push(_via_util_date_to_filename_str(Date.now()));
    filename.push('_export.csv');
    _via_util_download_as_file(data_blob, filename.join(''));
  }.bind(this));
}
