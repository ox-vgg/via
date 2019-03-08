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

  this.now = {};
  this.now.preload = { 'time':{} };

  this.preload = {};
  this.preload_promise_list = {};
  this.preload_fid_list = {};
  this.is_preload_ongoing = false;
  this.neighbour_preload_promise_list = [];
  this.neighbour_preload_fid_list = [];
  this.PRELOAD_STATE = { 'STARTED':1, 'DONE':2, 'ERROR':3 };
  this.preload_state = {};

  this.conf = {};
  this.conf.PRELOAD_CACHE_SIZE = 3;
  this.conf.PRELOAD_NBD_SIZE = 2;
  this.conf.PRELOAD_NBD_INDEX_LIST = [1, -1, 2, 3, -2, 4, 5, 6]; // 1 => next image, -1 => previous image
  this.conf.MEDIA_HEIGHT = 0.5;

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
  console.log('annotate_fid(): fid='+fid);
  if ( this.file.fid ) {
    this._file_container_del(this.file.fid);
  }

  this.file = this.d.file_store[fid];

  this.file_container[fid] = this._file_container_init(fid);
  this.region_annotator[fid] = new _via_region_annotator(this.file_container[fid],
                                                         this.d.file_store[fid],
                                                         this.d
                                                        );
  this._file_container_show(fid);
  this.region_annotator[fid]._on_event_show();
  this.emit_event('file_show', this.file);
}

_via_annotator.prototype._file_container_init = function(fid) {
  var fc = document.createElement('div');
  fc.classList.add('file_container');
  fc.setAttribute('data-fid', fid);
  return fc;
}

_via_annotator.prototype._file_container_del = function(fid) {
  if ( this.file_container[fid].classList.contains('file_show') ) {
    this.file_container[fid].classList.remove('file_show');
  }

  this.region_annotator[fid]._on_event_destroy();
  delete this.file_container[fid];
  delete this.region_annotator[fid];
  this.c.removeChild(this.c.firstChild);
}

_via_annotator.prototype._file_container_show = function(fid) {
  this.file_container[fid].classList.add('file_show');
  this.file_container[fid].style.height = this.c.clientHeight + 'px';
  this.file_container[fid].style.width = this.c.clientWidth + 'px';

  this.c.appendChild(this.file_container[fid]);
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
