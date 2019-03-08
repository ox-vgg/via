/**
 * Builds user interface and control handlers to allow
 * annotation of a file (image, video or audio)

 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 24 Dec. 2018
 *
 */

'use strict';

function _via_annotator(annotator_container, data) {
  // everything will be added to this contained
  this.c = annotator_container;
  this.d = data;

  this.file = {};
  this.region_annotator = {};
  this.file_container = {};

  this.neighbour_preload_promise_list = [];
  this.neighbour_preload_fid_list = {};

  this.PRELOAD_CACHE_SIZE = 3; // keep this many media always ready
  this.PRELOAD_NBD_SIZE = 2;
  this.PRELOAD_NBD_INDEX_LIST = [1, -1, 2, 3, -2, 4, 5, 6]; // 1 => next image, -1 => previous image

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this.event_prefix = '_via_annotator_';
  _via_event.call( this );

  this.on_event('container_resize', this._on_event_container_resize.bind(this));
  this.d.on_event('file_remove', this._on_event_file_remove.bind(this));
  this.d.on_event('attribute_del', this._on_event_attribute_del.bind(this));
  this.d.on_event('attribute_add', this._on_event_attribute_add.bind(this));
  this.d.on_event('metadata_add', this._on_event_metadata_add.bind(this));
  this.d.on_event('metadata_add_bulk', this._on_event_metadata_add_bulk.bind(this));
  this.d.on_event('metadata_del', this._on_event_metadata_del.bind(this));
  this.d.on_event('metadata_update', this._on_event_metadata_update.bind(this));
  this.d.on_event('project_load', this._on_event_project_load.bind(this));
}

_via_annotator.prototype.annotate_fid = function(fid) {
  // check if file has already been loaded
  if ( fid in this.file_container ) {
    if ( this.file.fid ) {
      this._file_container_hide(this.file.fid);
    }

    this.file = this.d.file_store[fid];
    this._file_container_show(fid);
    this.region_annotator[fid]._on_event_show();
    this.emit_event('file_show', this.file);

    // trigger preload of neighbours
    Promise.all(this.neighbour_preload_promise_list).then( function(ok) {
      this._preload_limit_overflow();
      this._preload_neighbours();
    }.bind(this), function(err) {
      this.neighbour_preload_promise_list = [];
      this.neighbour_preload_fid_list = {};
    }.bind(this));
  } else {
    // we first need to preload this file
    this._preload_fid(fid).then( function(ok_fid) {
      this.annotate_fid(ok_fid);
    }.bind(this), function(err_fid) {
      _via_util_msg_show('Failed to preload media');
      // show blank page to allow move to next/prev media
      if ( this.file.fid ) {
        this._file_container_hide(this.file.fid);
      }
      this.file = this.d.file_store[fid];
      this._file_container_show(fid);

      this.emit_event('file_show', this.file);
      console.log('Failed to preload file');
    }.bind(this));
  }
}

_via_annotator.prototype._file_container_init = function(fid) {
  var fc = document.createElement('div');
  fc.classList.add('file_container');
  fc.setAttribute('data-fid', fid);
  return fc;
}

_via_annotator.prototype._file_container_hide = function(fid) {
  if ( this.file_container[fid].classList.contains('file_show') ) {
    this.file_container[fid].classList.remove('file_show');
  }
}

_via_annotator.prototype._file_container_show = function(fid) {
  this.file_container[fid].classList.add('file_show');
  this.file_container[fid].style.height = this.c.clientHeight + 'px';
  this.file_container[fid].style.width = this.c.clientWidth + 'px';

  this.c.appendChild(this.file_container[fid]);
}

//
// Preload
//
_via_annotator.prototype._preload_fid = function(fid) {
  return new Promise( function(ok_callback, err_callback) {
    this.file_container[fid] = this._file_container_init(fid);
    this.c.appendChild(this.file_container[fid]);
    try {
      this.region_annotator[fid] = new _via_region_annotator(this.file_container[fid],
                                                             this.d.file_store[fid],
                                                             this.d
                                                            );
      ok_callback(fid);
    }
    catch(e) {
      err_callback(fid);
    }
  }.bind(this));
}

_via_annotator.prototype._preload_del = function(fid) {
  console.log('_preload_del() : fid=' + fid);
  if ( fid in this.file_container ) {
    if ( this.file_container[fid].classList.contains('file_show') ) {
      this.file_container[fid].classList.remove('file_show');
    }
    delete this.file_container[fid];

    if ( this.region_annotator[fid] ) {
      this.region_annotator[fid]._on_event_destroy();
      delete this.region_annotator[fid];
    }

    // remove node from HTML DOM( i.e. view)
    var child_index;
    for ( child_index in this.c.childNodes ) {
      if ( this.c.childNodes[child_index].dataset.fid === fid ) {
        this.c.removeChild(this.c.childNodes[child_index]);
        break;
      }
    }
  }
}

_via_annotator.prototype._preload_limit_overflow = function(fid) {
  var preload_size = Object.keys(this.file_container).length;
  if ( preload_size > this.PRELOAD_CACHE_SIZE ) {
    console.log('_preload_limit_overflow(): containing overflow ' + preload_size + ':' + this.PRELOAD_CACHE_SIZE);
    var to_remove = preload_size - this.PRELOAD_CACHE_SIZE;
    var i, furthest_fid;
    for ( i = 0; i < to_remove; ++i ) {
      furthest_fid = this._preload_get_furthest_fid();
      this._preload_del(furthest_fid);
    }
  } else {
    //console.log('_preload_limit_overflow(): no overflow yet');
  }
}

_via_annotator.prototype._preload_get_furthest_fid = function() {
  var now_findex = this.d.fid_list.indexOf(this.file.fid);
  var furthest_fid = -1;
  if ( now_findex !== -1 ) {
    var fid, findex, dist, dist1, dist2;
    var max_dist = 0;
    for ( fid in this.file_container ) {
      if ( fid !== this.file.fid ) { // we do not want to remove current file
        findex = this.d.fid_list.indexOf(fid);
        dist1 = Math.abs(findex - now_findex);
        dist2 = this.d.fid_list.length - dist1;
        dist = Math.min(dist1, dist2);

        if ( dist > max_dist ) {
          max_dist = dist;
          furthest_fid = fid;
        }
      }
    }
  }
  return furthest_fid;
}

_via_annotator.prototype._preload_get_neighbours_fid = function(fid) {
  var n = this.d.fid_list.length;
  var findex = this.d.fid_list.indexOf(fid);

  var nbd_fid_list = [];
  var i, nbd_findex, nbd_fid;
  for ( i = 0; i < this.PRELOAD_NBD_SIZE; ++i ) {
    nbd_findex = findex + this.PRELOAD_NBD_INDEX_LIST[i];
    if ( nbd_findex < 0 ||
         nbd_findex >= n ) {
      if ( nbd_findex < 0 ) {
        nbd_findex = n + nbd_findex;
      } else {
        nbd_findex = nbd_findex - n;
      }
    }
    //console.log(i + ':' + nbd_findex+':' + this.d.fid_list[nbd_findex]);
    nbd_fid = this.d.fid_list[nbd_findex];
    nbd_fid_list.push(nbd_fid);
  }
  return nbd_fid_list;
}

_via_annotator.prototype._preload_neighbours = function() {
  this.neighbour_preload_promise_list = [];
  this.neighbour_preload_fid_list = [];
  var fid = this.file.fid;

  var nbd_fid_list = this._preload_get_neighbours_fid(fid);
  var nbd_length = nbd_fid_list.length;
  var i, nbd_fid;
  for ( i = 0; i < nbd_length; ++i ) {
    nbd_fid = nbd_fid_list[i];
    //console.log(nbd_fid + ':' + typeof(nbd_fid) + ':' + (this.file_container.hasOwnProperty(nbd_fid)) + ':' + Object.keys(this.file_container))
    if ( ! (nbd_fid in this.file_container) ) {
      this.neighbour_preload_fid_list.push(nbd_fid);
      this.neighbour_preload_promise_list.push( this._preload_fid(nbd_fid) );
    }
  }
  //console.log('_preload_neighbours() : ' + JSON.stringify(this.neighbour_preload_fid_list));
}

//
// External events
//
_via_annotator.prototype._on_event_project_load = function(data, event_payload) {
  this.annotate_fid( this.d.fid_list[0] );
}

_via_annotator.prototype._on_event_container_resize = function(data, event_payload) {
  if ( this.file.fid ) {
    this.annotate_fid(this.file.fid);
  }
}

_via_annotator.prototype._on_event_file_remove = function(data, event_payload) {
}

_via_annotator.prototype._on_event_attribute_del = function(data, event_payload) {
}

_via_annotator.prototype._on_event_attribute_add = function(data, event_payload) {
}

_via_annotator.prototype._on_event_metadata_add = function(data, event_payload) {
  var fid = event_payload.fid;
  var mid = event_payload.mid;

  if ( this.file.fid ) {
    if ( this.region_annotator[this.file.fid] ) {
      this.region_annotator[this.file.fid]._on_event_metadata_add(fid,mid);
    }
  }
}

_via_annotator.prototype._on_event_metadata_add_bulk = function(data, event_payload) {
}

_via_annotator.prototype._on_event_metadata_del = function(data, event_payload) {
}

_via_annotator.prototype._on_event_metadata_update = function(data, event_payload) {
}

//
// keyboard input handler
//
_via_annotator.prototype._on_event_keydown = function(e) {
  if ( this.file.fid ) {
    if ( this.region_annotator[this.file.fid] ) {
      if ( this.region_annotator[this.file.fid].temporal_segmenter ) {
        this.region_annotator[this.file.fid].temporal_segmenter._on_event_keydown(e);
      }
    }
  }
}
