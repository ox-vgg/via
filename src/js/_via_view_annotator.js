/**
 * Builds user interface and control handlers to allow
 * annotation of a file (image, video or audio)

 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 24 Dec. 2018
 *
 */

'use strict';

function _via_view_annotator(data, container ) {
  this.d = data;
  this.c = container;
  this.file_annotator = [];

  // state variables
  this.region_draw_shape = _VIA_RSHAPE.RECT;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this.event_prefix = '_via_view_annotator_';
  _via_event.call( this );

  this._init();
}
_via_view_annotator.prototype._init = function() {
  // for viewing content of a view and definition of metadata.{xy, z, v} for the view
  this.view_content_container = document.createElement('div');
  this.view_content_container.setAttribute('class', 'view_content_container');
  // for definition of metadata.{z, v} for a view
  this.view_metadata_container = document.createElement('div');
  this.view_metadata_container.setAttribute('class', 'view_metadata_container');

  this.c.appendChild(this.view_content_container);
  this.c.appendChild(this.view_metadata_container);
}

_via_view_annotator.prototype.view_show = function(vid) {
  this._view_clear_all_file_annotator();
  this._view_init(vid);
  this.vid = vid;

  this.emit_event( 'view_show', { 'vid':this.vid } );
}

_via_view_annotator.prototype._view_init = function(vid) {
  var file_count = this.d.store.view[vid].f.length;

  switch(file_count) {
  case 1:
    if ( this._view_has_only_image(vid) ) {
      this._view_annotate_single_image(vid);
    } else {
      if ( this._view_has_only_video(vid) ) {
        this._view_annotate_single_video(vid);
      } else {
        console.warn('Not supported yet!');
      }
    }
    break;

  case 2:
    if ( this._view_has_only_image(vid) ) {
      this._view_annotate_two_images(vid);
    } else {
      console.warn('Not supported yet!');
    }
    break;

  default:
    console.warn('Not supported yet!');
  }
}

_via_view_annotator.prototype._view_annotate_single_image = function(vid) {
  console.log('annotate a image');

  // occupy the full container with single image
  this.file_annotator = [];
  this.file_container = [];
  this.view_content_container.innerHTML = '';
  this.view_metadata_container.innerHTML = '';
  this._view_split_content_container(this.view_content_container, this.file_container, 1, 1);

  this.file_annotator[0] = [];
  this.file_annotator[0][0] = new _via_file_annotator(this, this.d, vid, 0, this.file_container[0][0]);
}

_via_view_annotator.prototype._view_annotate_single_video = function(vid) {
  console.log('annotate a video');
}

_via_view_annotator.prototype._view_annotate_two_images = function(vid) {
  console.log('annotate an image pair');

  this.file_annotator = [];
  this.file_container = [];
  this.view_content_container.innerHTML = '';
  this.view_metadata_container.innerHTML = '';
  this._view_split_content_container(this.view_content_container, this.file_container, 1, 2);

  this.file_annotator[0] = [];
  this.file_annotator[0][0] = new _via_file_annotator(this, this.d, vid, 0, this.file_container[0][0]);
  this.file_annotator[0][1] = new _via_file_annotator(this, this.d, vid, 1, this.file_container[0][1]);
}

_via_view_annotator.prototype._view_has_only_image = function(vid) {
  var fid;
  for ( var vfindex in this.d.store.view[vid].f ) {
    fid = this.d.store.view[vid].f[vfindex];
    if ( this.d.store.file[fid].type !== _VIA_FILE_TYPE.IMAGE ) {
      return false;
    }
  }
  return true;
}

_via_view_annotator.prototype._view_has_only_video = function(vid) {
  var fid;
  for ( var vfindex in this.d.store.view[vid].f ) {
    fid = this.d.store.view[vid].f[vfindex];
    if ( this.d.store.file[fid].type !== _VIA_FILE_TYPE.VIDEO ) {
      return false;
    }
  }
  return true;
}

//
// view container
//
_via_view_annotator.prototype._view_split_content_container = function(container, file_container, nrow, ncol) {
  for ( var i = 0; i < nrow; ++i ) {
    file_container[i] = [];
    for ( var j = 0; j < ncol; ++j ) {
      file_container[i][j] = document.createElement('div');
      file_container[i][j].setAttribute('class', 'file_container');
      file_container[i][j].setAttribute('data-i', i);
      file_container[i][j].setAttribute('data-j', j);
      container.appendChild(file_container[i][j]);
    }
  }
  container.setAttribute('style',
                         'grid-template-columns:repeat(' + ncol + ',1fr);' +
                         'grid-template-rows:repeat(' + nrow + ',1fr);' +
                         'grid-gap:0;');
}

//
// misc
//
_via_view_annotator.prototype.set_region_draw_shape = function(shape) {
  if ( _VIA_RSHAPE.hasOwnProperty(shape) ) {
    this.region_draw_shape = _VIA_RSHAPE[shape];
  }
}

//
// cleanup
//
_via_view_annotator.prototype._view_clear_all_file_annotator = function() {
  for ( var i = 0; i < this.file_annotator.length; ++i ) {
    for ( var j = 0; j < this.file_annotator[i].length; ++j ) {
      this.file_annotator[i][j]._destroy_file_object_url();
    }
  }
}
