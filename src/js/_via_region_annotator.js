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

  this.on_event('container_resize', this._on_event_container_resize.bind(this));
}

_via_region_annotator.prototype._on_event_container_resize = function() {
  console.log('resize container');
  this._update_child_containers_size();
}

// this method ensures that all the layers have same size as that of the content
_via_region_annotator.prototype._update_child_containers_size = function() {
  try {
    // max. dimension of the container
    // to avoid overflowing window, we artificially reduce the max. size by 1 pixels
    if ( this.c.clientWidth === 0 || this.c.clientHeight === 0 ) {
      console.log('_via_region_annotator._update_child_containers_size(): container dimension is 0');
      return;
    }
    var maxw = this.c.clientWidth - 1;
    var maxh = this.c.clientHeight - 1;

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

_via_region_annotator.prototype._init_html_elements = function() {
  this.layer_region = document.createElement('canvas');
  this.layer_region.setAttribute('class', 'layer_region');

  this.c.innerHTML = '';
  this.c.appendChild(this.media);
  this.c.appendChild(this.layer_region);
}

_via_region_annotator.prototype._read_media_file = function() {
  return new Promise( function(ok_callback, err_callback) {
    var file_reader = new FileReader();
    file_reader.addEventListener('error', function() {
      console.log('_via_region_annotator._read_media_file() error');
      err_callback();
    }.bind(this));
    file_reader.addEventListener('abort', function() {
      console.log('_via_region_annotator._read_media_file() abort');
      err_callback()
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
  }.bind(this));
}

_via_region_annotator.prototype._revoke_file_object_url = function() {
  if ( typeof(this.file_object_url) !== 'undefined' ) {
    URL.revokeObjectURL(this.file_object_url);
  }
}

_via_region_annotator.prototype._init_media_html = function(src) {
  return new Promise( function(ok_callback, err_callback) {
    switch( this.file.type ) {
    case _VIA_FILE_TYPE.VIDEO:
      this.media = document.createElement('video');
      this.media.setAttribute('src', src);
      this.media.setAttribute('class', 'media_element');
      // @todo : add subtitle track for video
      //this.media.setAttribute('autoplay', false);
      //this.media.setAttribute('loop', false);
      this.media.setAttribute('controls', '');
      this.media.setAttribute('preload', 'auto');
      this.media.addEventListener('loadeddata', function() {
        this.media.pause();
        ok_callback(this.file);
      }.bind(this));
      this.media.addEventListener('error', function() {
        console.log('_via_region_annotator._init_media_html() error')
        err_callback(this.file);
      }.bind(this));
      this.media.addEventListener('abort', function() {
        console.log('_via_region_annotator._init_media_html() abort')
        err_callback(this.file);
      }.bind(this));

      break;
    case _VIA_FILE_TYPE.IMAGE:
      this.media = document.createElement('img');
      this.media.setAttribute('src', src);
      this.media.setAttribute('class', 'media_element');
      this.media.addEventListener('load', function() {
        ok_callback(this.file);
      }.bind(this));
      this.media.addEventListener('error', function() {
        console.log('_via_region_annotator._init_media_html() error')
        err_callback(this.file);
      }.bind(this));
      this.media.addEventListener('abort', function() {
        console.log('_via_region_annotator._init_media_html() abort')
        err_callback(this.file);
      }.bind(this));
      break;

    case _VIA_FILE_TYPE.AUDIO:
      this.media = document.createElement('audio');
      this.media.setAttribute('src', src);
      this.media.setAttribute('class', 'media_element');
      this.media.setAttribute('autoplay', false);
      this.media.setAttribute('loop', false);
      this.media.setAttribute('controls', '');
      this.media.setAttribute('preload', 'auto');
      this.media.addEventListener('loadeddata', function() {
        this.media.pause();
        ok_callback(this.file);
      }.bind(this));
      this.media.addEventListener('error', function() {
        console.log('_via_region_annotator._init_media_html() error')
        err_callback(this.file);
      }.bind(this));
      this.media.addEventListener('abort', function() {
        console.log('_via_region_annotator._init_media_html() abort')
        err_callback(this.file);
      }.bind(this));
      break;

    default:
      console.log('_via_region_annotator._init_media_html() : ' +
                  ' cannot load file of type ' +
                  _via_util_file_type_to_str(this.file.type)
                 );
      err_callback(this.file);
    }
  }.bind(this));
}

_via_region_annotator.prototype.load_media = function() {
  // check if user has given access to local file using
  // browser's file selector
  if ( this.file.src instanceof File ) {
    return new Promise( function(ok_callback, err_callback) {
      this._read_media_file().then( function(file_src_ok) {
        this._init_media_html(file_src_ok).then( function(file_html_ok) {
          ok_callback(this.file);
        }.bind(this), function(file_html_err) {
          err_callback(this.file);
        }.bind(this));
      }.bind(this), function(file_src_err) {
        err_callback(this.file);
      }.bind(this));
    }.bind(this));
  } else {
    return this._init_media_html(this.file.src);
  }
}

_via_region_annotator.prototype._on_event_attribute_del = function(aid) {
}

_via_region_annotator.prototype._on_event_attribute_add = function(aid) {
}

_via_region_annotator.prototype._on_event_metadata_add = function(fid, mid) {
}

_via_region_annotator.prototype._on_event_metadata_del = function(fid, mid) {
}

_via_region_annotator.prototype._on_event_metadata_update = function(fid, mid) {
}
