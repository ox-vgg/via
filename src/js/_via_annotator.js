/**
 * Builds user interface and control handlers to allow
 * annotation of a file (image, video or audio)

 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 24 Dec. 2018
 *
 */

'use strict';

function _via_annotator(container, data) {
  // everything will be added to this contained
  this.c = container;
  this.d = data;

  this.now = {};
  this.now.preload = { 'time':{} };
  this.preload = {};

  this.conf = {};
  this.conf.PRELOAD_CACHE_SIZE = 5;
  this.conf.PRELOAD_NBD_INDEX_LIST = [1, -1, 2]; // for current image, preload previous and next 2 images


  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this.event_prefix = '_via_annotator_';
  _via_event.call( this );

  this.d.on_event('file_remove', this._on_event_file_remove.bind(this));
}

//
// Metadata
//
_via_annotator.prototype.segment_add = function(data, event_payload) {
  var fid = event_payload.fid;
  var t = event_payload.t.slice();
  var what = event_payload.what;
  this.d.segment_add(fid, t, what).then( function(ok) {
    // @todo: do we need to do something here?
  }.bind(this), function(err) {
    console.log(err);
  }.bind(this));
}

//
// File preload cache
//
_via_annotator.prototype._is_preloaded = function(fid) {
  if ( this.preload.hasOwnProperty(fid) ) {
    return true;
  } else {
    return false;
  }
}

_via_annotator.prototype._preload_file_content = function(file) {
  return new Promise( function(ok_callback, err_callback) {
    var fid = file.fid;

    if ( this._is_preloaded(fid) ) {
      ok_callback(file);
      return;
    }

    this.preload[fid] = {};
    this.preload[fid].file = file;

    //// initialize the media annotator
    this.preload[fid].view = document.createElement('div');
    this.preload[fid].view.setAttribute('data-fid', fid);
    this.preload[fid].view.classList.add('hide'); // hidden by default
    this.preload[fid].view.classList.add('file');
    this.c.appendChild( this.preload[fid].view );
    this.preload[fid].media_annotator = new _via_media_annotator(this.preload[fid].view,
                                                                 this.preload[fid].file,
                                                                 this.d
                                                                );
    this.preload[fid].media_annotator.on_event('segment_add', this.segment_add.bind(this));
    this.preload[fid].media_annotator.load_media().then( function(media_ok) {
      this.preload[fid].media_annotator.init_static_content();
      ok_callback(file);
    }.bind(this), function(media_err) {
      console.log('load_media() failed');
      err_callback(file);
    }.bind(this));
  }.bind(this));
}

_via_annotator.prototype._evict_preload_oldest = function(count) {
  var i;
  for ( i = 0; i < count; ++i ) {
    var oldest_fid = this._which_preload_is_oldest();
    this._remove_preload(oldest_fid);
  }
}

_via_annotator.prototype._remove_preload = function(fid) {
  // if file.type = LOCAL, this releases the memory occupied by file object URI
  this.preload[fid].media_annotator._revoke_file_object_url();

  this._remove_from_view(fid);
  delete this.preload[fid];
  delete this.now.preload.time[fid];
}

_via_annotator.prototype._which_preload_is_oldest = function() {
  var fid;
  var oldest_time = Date.now();
  var oldest_fid = -1;
  for ( fid in this.now.preload.time ) {
    if ( this.now.preload.time[fid] < oldest_time ) {
      oldest_time = this.now.preload.time[fid];
      oldest_fid = fid;
    }
  }
  return oldest_fid;
}

_via_annotator.prototype._preload_neighbours = function(anchor_fid) {
  return new Promise( function(ok_callback, err_callback) {
    var load_promise_list = [];
    var nbd_fid_list = this._preload_get_neighbours_fid(anchor_fid);
    var nbd_length = nbd_fid_list.length;
    var i, nbd_file, nbd_fid;
    for ( i = 0; i < nbd_length; ++i ) {
      nbd_fid = nbd_fid_list[i];
      nbd_file = this.d.file_store[nbd_fid];
      load_promise_list.push( this.file_load(nbd_file) );
    }

    Promise.all( load_promise_list ).then( function(all_ok) {
      ok_callback(all_ok);
    }.bind(this), function(some_err) {
      err_callback(some_err);
    }.bind(this));
  }.bind(this));
}

_via_annotator.prototype._preload_get_neighbours_fid = function(anchor_fid) {
  var fid_list = this.d.fid_list;
  var n = fid_list.length;
  var anchor_fid = parseInt(anchor_fid);
  var anchor_findex = fid_list.indexOf(anchor_fid);

  var nbd_fid_list = [];
  var nbd_length = this.conf.PRELOAD_NBD_INDEX_LIST.length;
  var i, nbd_findex, nbd_fid;
  for ( i = 0; i < nbd_length; ++i ) {
    nbd_findex = anchor_findex + this.conf.PRELOAD_NBD_INDEX_LIST[i];
    if ( nbd_findex < 0 ||
         nbd_findex >= n ) {
      if ( nbd_findex < 0 ) {
        nbd_findex = n + nbd_findex;
      } else {
        nbd_findex = nbd_findex - n;
      }
    }
    nbd_fid = fid_list[nbd_findex]
    if ( this.d.has_file(nbd_fid) ) {
      nbd_fid_list.push(nbd_fid);
    }
  }
  return nbd_fid_list;
}

//
// View
//
_via_annotator.prototype._remove_from_view = function(fid) {
  fid = parseInt(fid);
  var n = this.c.childNodes.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    if ( parseInt(this.c.childNodes[i].dataset.fid) === fid ) {
      this.c.removeChild( this.c.childNodes[i] );
      return;
    }
  }
}

_via_annotator.prototype._show_in_view = function(file) {
  var n = this.c.childNodes.length;
  var fid = file.fid.toString();
  var i;
  for ( i = 0; i < n; ++i ) {
    if ( this.c.childNodes[i].dataset.fid === fid ) {
      this.c.childNodes[i].classList.remove('hide');
      this.c.childNodes[i].classList.add('show');
      this.preload[fid].media_annotator.init_dynamic_content();
      this.now.preload.time[fid] = Date.now(); // shown time recorded for cache admin.
    } else {
      if ( this.c.childNodes[i].classList.contains('show') ) {
        this.c.childNodes[i].classList.remove('show');
      }
      if ( ! this.c.childNodes[i].classList.contains('hide') ) {
        this.c.childNodes[i].classList.add('hide');
      }
    }
  }
}

//
// Public Interface
// i.e. _via_annotator interacts with outside words using these methods
//
_via_annotator.prototype.file_show_none = function() {
  var n = this.c.childNodes.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    if ( this.c.childNodes[i].classList.contains('show') ) {
      this.c.childNodes[i].classList.remove('show');
    }
    if ( ! this.c.childNodes[i].classList.contains('hide') ) {
      this.c.childNodes[i].classList.add('hide');
    }
  }
}

_via_annotator.prototype.file_show_fid = function(fid) {
  if ( this.d.has_file(fid) ) {
    var file = this.d.fid2file(fid);
    this.file_show(file);
  }
}

_via_annotator.prototype.file_show = function(file) {
  this.file_load(file).then( function(ok_file) {
    this._show_in_view(ok_file);
    this.now.file = ok_file;
    this.emit_event('file_show', ok_file);
    this._preload_neighbours(this.now.file.fid);
  }.bind(this), function(err_file) {
    console.log('file_show() failed');
    console.log(err_file);
  }.bind(this));
}

_via_annotator.prototype.file_load = function(file) {
  return new Promise( function(ok_callback, err_callback) {
    // check if the file has already been loaded
    if ( file.fid in this.preload ) {
      ok_callback( file );
    } else {
      this.file_preload(file).then( function(preloaded_file) {
        ok_callback( preloaded_file );
      }.bind(this), function(preload_error) {
        console.log('file_preload() failed for file ' + file.src);
        err_callback(preload_error);
      }.bind(this) );
    }
  }.bind(this) );
}

_via_annotator.prototype.file_preload = function(file) {
  return new Promise( function(ok_callback, err_callback) {
    //console.log(file.type + ' file_preload()')

    if ( Object.keys(this.preload).length > this.conf.PRELOAD_CACHE_SIZE ) {
      // create space for preloading neighbours
      this._evict_preload_oldest(this.conf.PRELOAD_NBD_INDEX_LIST.length);
    }

    this._preload_file_content(file).then( function(ok_file) {
      this.now.preload.time[ok_file.fid] = Date.now(); // shown time (until actually shown)
      ok_callback(ok_file);
    }.bind(this), function(err_file) {
      err_callback(err_file);
      console.log('preload failed for fid=' + ok_file.fid);
    }.bind(this));
  }.bind(this));
}

_via_annotator.prototype.add_event_listener = function(file) {
}

_via_annotator.prototype.remove_event_listener = function(file) {
}

_via_annotator.prototype.config = function(key, value) {
}

_via_annotator.prototype.on_browser_resize = function() {
  this.preload[this.now.file.fid].media_annotator.init_dynamic_content();
}

//
// External events
//

_via_annotator.prototype._on_event_file_remove = function(data, event_payload) {
  var fid = event_payload.fid;
  this._remove_preload(fid);
}
