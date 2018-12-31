/**
 * @class
 * @classdesc Manages region draw and view operations on an image or video frame
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 29 Dec. 2018
 * @param {Element} container HTML container element like <div>
 * @param {Object} an instance of {@link _via_file}
 */
function _via_media_annotator(container, file) {
  this.container = container;
  this.file = file;
}

// the content that needs to be cached
_via_media_annotator.prototype.init_static_content = function() {
  console.log('init_static_content()');

  //// segment annotator
  this.segment_annotator_view = document.createElement('div');
  this.segment_annotator_view.setAttribute('class', 'segment_annotator');

  //// content layers
  // inner layer: canvas that will contain all the user drawn regions
  this.regions = document.createElement('canvas');
  this.regions.setAttribute('class', 'regions');
  // top layer: transparent <div> that captures all user interactions with media content
  this.input_handler = document.createElement('div');
  this.input_handler.setAttribute('class', 'input_handler');
  // add all layers to annotation_container
  this.annotator_container_view = document.createElement('div');
  this.annotator_container_view.setAttribute('class', 'annotator_container');
  this.layer_container = document.createElement('div');
  this.layer_container.setAttribute('class', 'layer_container');
  this.layer_container.appendChild(this.media); // loaded using _via_media_annotator.load_media()
  this.layer_container.appendChild(this.regions);
  this.layer_container.appendChild(this.input_handler);
  this.annotator_container_view.appendChild(this.layer_container);

  //// video control panel
  this.video_control_view = document.createElement('div');
  this.video_control_view.setAttribute('class', 'video_control');

  //// annotation editor
  this.annotation_editor_view = document.createElement('div');
  this.annotation_editor_view.setAttribute('class', 'annotation_editor');

  //// add everything to html view
  this.container.innerHTML = '';
  this.container.appendChild(this.segment_annotator_view);
  this.container.appendChild(this.annotator_container_view);
  this.container.appendChild(this.video_control_view);
  this.container.appendChild(this.annotation_editor_view);
}

// the content that is created dynamically and hence should not be cached
_via_media_annotator.prototype.clear_dynamic_content = function() {
  this.segment_annotator_view.innerHTML = '';
  this.input_handler.innerHTML = '';
  this.video_control_view.innerHTML = '';
  this.annotation_editor_view.innerHTML = '';

  // clear canvas
  var c = this.regions;
  var ctx = c.getContext('2d', {alpha:false});
  ctx.clearRect(0, 0, c.width, c.height);
}

_via_media_annotator.prototype.init_dynamic_content = function() {
  this.init_layers_size();
  this.segment_annotator = new _via_segment_annotator(this.segment_annotator_view,
                                                      this.media);
  //// video control panel
  this.video_control = new _via_video_control(this.video_control_view,
                                              this.media);

  //// annotation editor
  var metadata = {};
  this.annotation_editor = new _via_annotation_editor();
  // @todo: create spreadsheet like editor for all annotations
}

// this method ensures that all the layers have same size as that of the content
_via_media_annotator.prototype.init_layers_size = function() {
  // max. dimension of the container
  var maxw = this.annotator_container_view.clientWidth;
  var maxh = this.annotator_container_view.clientHeight;

  // original size of the content
  var cw0, ch0;
  switch( this.file.type ) {
  case _via_file.prototype.TYPE.VIDEO:
    cw0 = this.media.videoWidth;
    ch0 = this.media.videoHeight;
    break;
  case _via_file.prototype.TYPE.IMAGE:
    cw0 = this.media.naturalWidth;
    ch0 = this.media.naturalHeight;
    break;
  }
  var ar = cw0/ch0;
  ch = maxh;
  cw = Math.floor(ar * ch);
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
}

_via_media_annotator.prototype.load_media = function() {
  return new Promise( function(ok_callback, err_callback) {
    switch( this.file.type ) {
    case _via_file.prototype.TYPE.VIDEO:
      //// a number of layers are added above the image or video
      //// so that user interactions with this visual content
      //// can be translated to user drawn regions
      // bottom layer: the media content
      this.media = document.createElement('video');
      this.media.setAttribute('src', this.file.path + this.file.uri);
      this.media.setAttribute('class', 'media');
      this.media.setAttribute('autoplay', false);
      this.media.setAttribute('loop', false);
      this.media.setAttribute('controls', '');
      this.media.setAttribute('preload', 'auto');
      this.media.addEventListener('canplay', function() {
        console.log('content loaded');
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
    case _via_file.prototype.TYPE.IMAGE:
      console.log('@todo: handle image');
      err_callback(this.file);
      break;

    default:
    }
  }.bind(this));
}
