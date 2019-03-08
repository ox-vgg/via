/**
 * @class
 * @classdesc Manages region draw and view operations on an image or video frame
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 29 Dec. 2018
 * @param {Element} container HTML container element like <div>
 * @param {Object} an instance of {@link _via_file}
 */

'use strict';

function _via_region_annotator(container, file, data) {
  this.c = container;
  this.file = file;
  this.d = data;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_region_annotator_';
  _via_event.call( this );

  this._is_media_element_loaded = false;
  this.media_element_load_msg = '';

  this.VIDEO_ANNOTATOR_HEIGHT = 0.5; // remaining space used by temporal segment
  this._init();
}

_via_region_annotator.prototype._init = function() {
  this.region_annotator_container = document.createElement('div');
  this.region_annotator_container.classList.add('region_annotator_container');

  this.media = this._media_element_init();
  this.layer_region = document.createElement('canvas');
  this.layer_region.setAttribute('class', 'layer_region');

  this.region_annotator_container.appendChild(this.media);
  this.region_annotator_container.appendChild(this.layer_region);
  this.c.appendChild(this.region_annotator_container);

  this._media_element_load_promise = this._media_element_load();
}

_via_region_annotator.prototype._on_event_show = function() {
  this._media_element_load_promise.then( function(ok) {
    this._media_element_show();
  }.bind(this), function(err) {
    console.log(this.media_element_load_msg)
    _via_util_msg_show(this.media_element_load_msg);
  }.bind(this));
}

//
// media element (video, image, audio)
//
_via_region_annotator.prototype._media_element_show = function() {
  var maxw = this.c.clientWidth;
  var region_annotator_height = this.c.clientHeight;
  if ( this.file.type === _VIA_FILE_TYPE.VIDEO ) {
    var temporal_segmenter_height = Math.floor( (1.0 - this.VIDEO_ANNOTATOR_HEIGHT) * region_annotator_height );
    region_annotator_height = region_annotator_height - temporal_segmenter_height;
    this.temporal_segmenter_container = document.createElement('div');
    this.temporal_segmenter_container.classList.add('temporal_segmenter_container');
    this.temporal_segmenter_container.style.height = temporal_segmenter_height + 'px';
    this.c.appendChild(this.temporal_segmenter_container); // must be added to view before initialisation of _via_temporal_segmenter
    this.temporal_segmenter = new _via_temporal_segmenter(this.temporal_segmenter_container,
                                                          this.file,
                                                          this.d,
                                                          this.media);
  }
  this.region_annotator_container.style.height = region_annotator_height + 'px';
  this._media_element_set_size(maxw, region_annotator_height);
}

// this method ensures that all the layers have same size as that of the content
_via_region_annotator.prototype._media_element_set_size = function(maxw, maxh) {
  try {
    // max. dimension of the container
    // to avoid overflowing window, we artificially reduce the max. size by few pixels
    maxw = maxw - 2;
    maxh = maxh - 2;

    // original size of the content
    var cw0, ch0;
    switch( this.file.type ) {
    case _VIA_FILE_TYPE.VIDEO:
      cw0 = this.media.videoWidth;
      ch0 = this.media.videoHeight;
      break;
    case _VIA_FILE_TYPE.IMAGE:
      cw0 = this.media.naturalWidth;
      ch0 = this.media.naturalHeight;
      break;
    }
    var ar = cw0/ch0;
    var ch = maxh;
    var cw = Math.floor(ar * ch);
    if ( cw > maxw ) {
      cw = maxw;
      ch = Math.floor(cw/ar);
    }
    this.cwidth = cw;
    this.cheight = ch;
    this.original_width = cw0;
    this.original_height = ch0;
    this.content_size_css = 'width:' + cw + 'px;height:' + ch + 'px;';
    this.layer_region.width  = this.cwidth;
    this.layer_region.height = this.cheight;
    this.media.setAttribute('style', this.content_size_css);
  } catch (err) {
    console.log(err)
  }
}

_via_region_annotator.prototype._media_element_init = function() {
  var media;
  switch( this.file.type ) {
  case _VIA_FILE_TYPE.VIDEO:
    media = document.createElement('video');
    //media.setAttribute('src', src); // set by _media_element_load() method
    media.setAttribute('class', 'media_element');
    // @todo : add subtitle track for video
    media.setAttribute('preload', 'auto');
    break;

  case _VIA_FILE_TYPE.IMAGE:
    media = document.createElement('image');
    console.warn('@todo');
    break;

  case _VIA_FILE_TYPE.AUDIO:
    media = document.createElement('audio');
    console.warn('@todo');
    break;

  default:
    console.warn('unknown file type = ' + this.file.type);
  }
  return media;
}

_via_region_annotator.prototype._media_element_load = function() {
  return new Promise( function(ok_callback, err_callback) {
    this._media_element_read_file().then( function(file_ok_src) {
      this.media.addEventListener('loadeddata', function() {
        this._is_media_element_loaded = true;
        this.media_element_load_msg = 'Media loaded';
        ok_callback();
      }.bind(this));
      this.media.addEventListener('error', function() {
        console.log('_via_region_annotator._media_element_load() error')
        this._is_media_element_loaded = false;
        this.media_element_load_msg = 'Error loading media';
        err_callback();
      }.bind(this));
      this.media.addEventListener('stalled', function() {
        console.log('_via_region_annotator._media_element_load() stalled')
        this._is_media_element_loaded = false;
        this.media_element_load_msg = 'Error loading media.';
        err_callback();
      }.bind(this));
      this.media.addEventListener('suspend', function() {
        //console.log('_via_region_annotator._media_element_load() suspend')
      }.bind(this));
      this.media.addEventListener('abort', function() {
        console.log('_via_region_annotator._media_element_load() abort')
        this._is_media_element_loaded = false;
        this.media_element_load_msg = 'Error loading media.';
        err_callback();
      }.bind(this));
      this.media.setAttribute('src', file_ok_src);
    }.bind(this), function(file_err) {
      this.media.setAttribute('src', '');
      this._is_media_element_loaded = false;
      this.media_element_load_msg = 'Error loading media.';
      err_callback();
    }.bind(this));
  }.bind(this));
}

_via_region_annotator.prototype._media_element_read_file = function() {
  return new Promise( function(ok_callback, err_callback) {
    if ( this.file.src instanceof File ) {
      var file_reader = new FileReader();
      file_reader.addEventListener('error', function(e) {
        console.log('_via_region_annotator._read_media_file() error');
        console.warn(e.target.error)
        err_callback(this.file);
      }.bind(this));
      file_reader.addEventListener('abort', function() {
        console.log('_via_region_annotator._read_media_file() abort');
        err_callback(this.file)
      }.bind(this));
      file_reader.addEventListener('load', function() {
        var blob = new Blob( [ file_reader.result ],
                             { type: this.file.src.type }
                           );
        // we keep a reference of file object URL so that we can revoke it when not needed
        // WARNING: ensure that this._destroy_file_object_url() gets called when "this" not needed
        this.file_object_url = URL.createObjectURL(blob);
        ok_callback(this.file_object_url);
      }.bind(this));
      file_reader.readAsArrayBuffer( this.file.src );
    } else {
      ok_callback(this.file.src); // read from URL
    }
  }.bind(this));
}

_via_region_annotator.prototype._on_event_destroy = function() {
  if ( typeof(this.file_object_url) !== 'undefined' ) {
    console.log('_via_region_annotator(): revoked file object url for fid=' + this.file.fid)
    URL.revokeObjectURL(this.file_object_url);
  }

  if ( this.temporal_segmenter ) {
    if ( this.temporal_segmenter.thumbnail ) {
        this.temporal_segmenter.thumbnail._on_event_destroy();
    }
  }
}

//
// external events
//
_via_region_annotator.prototype._on_event_attribute_del = function(aid) {
}

_via_region_annotator.prototype._on_event_attribute_add = function(aid) {
}

_via_region_annotator.prototype._on_event_metadata_add = function(fid, mid) {
  if ( this.temporal_segmenter ) {
    this.temporal_segmenter._on_event_metadata_add(fid,mid);
  }
}

_via_region_annotator.prototype._on_event_metadata_del = function(fid, mid) {
}

_via_region_annotator.prototype._on_event_metadata_update = function(fid, mid) {
}
