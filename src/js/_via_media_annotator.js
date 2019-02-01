/**
 * @class
 * @classdesc Manages region draw and view operations on an image or video frame
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 29 Dec. 2018
 * @param {Element} container HTML container element like <div>
 * @param {Object} an instance of {@link _via_file}
 */

'use strict';

function _via_media_annotator(container, file, data) {
  this.c = container;
  this.file = file;
  this.d = data;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_media_annotator_';
  _via_event.call( this );
}

// the content that needs to be cached
_via_media_annotator.prototype.init_static_content = function() {
  //// content layers
  // inner layer: canvas that will contain all the user drawn regions
  this.regions = document.createElement('canvas');
  this.regions.setAttribute('class', 'regions');
  // top layer: transparent <div> that captures all user interactions with media content
  this.input_handler = document.createElement('div');
  this.input_handler.setAttribute('class', 'input_handler');
  // add all layers to annotation_container
  this.layer_container = document.createElement('div');
  this.layer_container.setAttribute('class', 'layer_container');
  this.layer_container.appendChild(this.media); // loaded using _via_media_annotator.load_media()
  this.layer_container.appendChild(this.regions);
  this.layer_container.appendChild(this.input_handler);
  this.content_container = document.createElement('div');
  this.content_container.setAttribute('class', 'content');
  this.content_container.appendChild(this.layer_container);

  this.segmenter_container = document.createElement('div');
  this.segmenter_container.setAttribute('class', 'segmenter');

  //// add everything to html view
  this.c.innerHTML = '';
  this.c.appendChild(this.content_container);
  this.c.appendChild(this.segmenter_container);
}

_via_media_annotator.prototype.init_dynamic_content = function() {
  try {
    this._init_layers_size();
  } catch(err) {
    console.log(err);
  }
}

// this method ensures that all the layers have same size as that of the content
_via_media_annotator.prototype._init_layers_size = function() {
  try {
    // max. dimension of the container
    // to avoid overflowing window, we artificially reduce the max. size by 1 pixels
    var maxw = this.c.clientWidth - 1;
    var maxh = this.c.clientHeight - 1;
    if ( this.file.type === _VIA_FILE_TYPE.VIDEO ||
         this.file.type === _VIA_FILE_TYPE.AUDIO
       ) {
      // we allocate 1/4th available vertical space to segmenter
      // and remaining 3/4th space to media content
      var segmenter_container_height = Math.floor(this.c.clientHeight/4);
      this.segmenter_container.style.height = segmenter_container_height + 'px';
      maxh = this.c.clientHeight - segmenter_container_height - 1;

      // initialise segmenter
      this.segmenter = new _via_media_segment_annotator(this.segmenter_container,
                                                        this.d,
                                                        this.media
                                                       );
      this.segmenter.on_event('segment_add', function(data, event_payload) {
        var new_payload = Object.assign(event_payload, {'fid':this.file.fid})
        this.emit_event('segment_add', new_payload);
      }.bind(this));
    } else {
      this.segmenter_container.style.height = '0';
    }

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
    this.width = cw;
    this.height = ch;
    this.original_width = cw0;
    this.original_height = ch0;
    this.layer_size_css = 'width:' + cw + 'px;height:' + ch + 'px;';

    this.layer_container.setAttribute('style', this.layer_size_css);
    this.media.setAttribute('style', this.layer_size_css);
    this.regions.setAttribute('style', this.layer_size_css);
    this.regions.width = this.width;
    this.regions.height = this.height;
    this.input_handler.setAttribute('style', this.layer_size_css);
  } catch (err) {
    console.log(err)
  }
}

_via_media_annotator.prototype._read_media_file = function() {
  return new Promise( function(ok_callback, err_callback) {
    var file_reader = new FileReader();
    file_reader.addEventListener('error', function() {
      console.log('_via_media_annotator._read_media_file() error');
      err_callback();
    }.bind(this));
    file_reader.addEventListener('abort', function() {
      console.log('_via_media_annotator._read_media_file() abort');
      err_callback()
    }.bind(this));
    file_reader.addEventListener('load', function() {
      var blob = new Blob( [ file_reader.result ],
                           { type: this.file.src.type }
                         );
      // we keep a reference of file object URL so that we can revoke it when not needed
      // WARNING: ensure that this._destroy_file_object_url() gets called when "this" not needed
      this.file_object_url = URL.createObjectURL(blob);
      console.log('_via_media_annotator._read_media_file() done url=' + this.file_object_url);
      ok_callback(this.file_object_url);
    }.bind(this));
    file_reader.readAsArrayBuffer( this.file.src );
  }.bind(this));
}

_via_media_annotator.prototype._revoke_file_object_url = function() {
  if ( typeof(this.file_object_url) !== 'undefined' ) {
    console.log('Revoking URL ' + this.file_object_url);
    URL.revokeObjectURL(this.file_object_url);
  }
}

_via_media_annotator.prototype._init_media_html = function(src) {
  return new Promise( function(ok_callback, err_callback) {
    switch( this.file.type ) {
    case _VIA_FILE_TYPE.VIDEO:
      this.media = document.createElement('video');
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
        console.log('_via_media_annotator._init_media_html() error')
        err_callback(this.file);
      }.bind(this));
      this.media.addEventListener('abort', function() {
        console.log('_via_media_annotator._init_media_html() abort')
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
        console.log('_via_media_annotator._init_media_html() error')
        err_callback(this.file);
      }.bind(this));
      this.media.addEventListener('abort', function() {
        console.log('_via_media_annotator._init_media_html() abort')
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
        console.log('_via_media_annotator._init_media_html() error')
        err_callback(this.file);
      }.bind(this));
      this.media.addEventListener('abort', function() {
        console.log('_via_media_annotator._init_media_html() abort')
        err_callback(this.file);
      }.bind(this));
      break;

    default:
      console.log('_via_media_annotator._init_media_html() : ' +
                  ' cannot load file of type ' +
                  _via_util_file_type_to_str(this.file.type)
                 );
      err_callback(this.file);
    }
  }.bind(this));
}

_via_media_annotator.prototype.load_media = function() {
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
