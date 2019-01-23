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

// the content that is created dynamically and hence should not be cached
_via_media_annotator.prototype.clear_dynamic_content = function() {
  this.input_handler.innerHTML = '';

  // clear canvas
  var c = this.regions;
  var ctx = c.getContext('2d', {alpha:false});
  ctx.clearRect(0, 0, c.width, c.height);
}

_via_media_annotator.prototype.init_dynamic_content = function() {
  try {
    this.init_layers_size();
  } catch(err) {
    console.log(err);
  }
}

// this method ensures that all the layers have same size as that of the content
_via_media_annotator.prototype.init_layers_size = function() {
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

_via_media_annotator.prototype.load_media = function() {
  return new Promise( function(ok_callback, err_callback) {
    switch( this.file.type ) {
    case _VIA_FILE_TYPE.VIDEO:
      //// a number of layers are added above the image or video
      //// so that user interactions with this visual content
      //// can be translated to user drawn regions
      // bottom layer: the media content
      this.media = document.createElement('video');
      this.media.setAttribute('src', this.file.path + this.file.uri);
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
        console.log('error')
        err_callback(this.file);
      }.bind(this));
      this.media.addEventListener('abort', function() {
        console.log('abort')
        err_callback(this.file);
      }.bind(this));

      break;
    case _VIA_FILE_TYPE.IMAGE:
      this.media = document.createElement('img');
      this.media.setAttribute('src', this.file.path + this.file.uri);
      this.media.setAttribute('class', 'media_element');
      this.media.addEventListener('load', function() {
        ok_callback(this.file);
      }.bind(this));
      this.media.addEventListener('error', function() {
        console.log('error')
        err_callback(this.file);
      }.bind(this));
      this.media.addEventListener('abort', function() {
        console.log('abort')
        err_callback(this.file);
      }.bind(this));
      break;

    default:
    }
  }.bind(this));
}
