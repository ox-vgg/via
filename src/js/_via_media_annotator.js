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

  this.state = {};
}

// this method ensures that all the layers have same size as that of the content
_via_media_annotator.prototype.update_layer_size = function() {
  // max. dimension of the container
  var maxw = this.annotator_container.clientWidth;
  var maxh = this.annotator_container.clientHeight;

  // original size of the content
  var cw0, ch0;
  switch( this.file.type ) {
  case _via_file.prototype.FILE_TYPE.VIDEO:
    cw0 = this.content.videoWidth;
    ch0 = this.content.videoHeight;
    break;
  case _via_file.prototype.FILE_TYPE.IMAGE:
    cw0 = this.content.naturalWidth;
    ch0 = this.content.naturalHeight;
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
  this.content.setAttribute('style', this.layer_size_css);
  this.regions.setAttribute('style', this.layer_size_css);
  this.regions.width = this.width;
  this.regions.height = this.height;
  this.input_handler.setAttribute('style', this.layer_size_css);
}

_via_media_annotator.prototype.load_media = function() {
  return new Promise( function(ok_callback, err_callback) {
    switch( this.file.type ) {
    case _via_file.prototype.FILE_TYPE.VIDEO:
      //// a number of layers are added above the image or video
      //// so that user interactions with this visual content
      //// can be translated to user drawn regions
      // bottom layer: the media content
      this.content = document.createElement('video');
      this.content.setAttribute('src', file.uri);
      this.content.setAttribute('class', 'content');
      this.content.setAttribute('autoplay', false);
      this.content.setAttribute('loop', false);
      this.content.setAttribute('controls', '');
      this.content.setAttribute('preload', 'auto');
      this.content.addEventListener('canplay', function() {
        console.log('content loaded');
        this.content.pause();
        ok_callback(this.file);
      }.bind(this));
      this.content.addEventListener('error', function() {
        console.log('error')
        err_callback(this.file);
      }.bind(this));
      this.content.addEventListener('abort', function() {
        console.log('abort')
        err_callback(this.file);
      }.bind(this));
      // inner layer: canvas that will contain all the user drawn regions
      this.regions = document.createElement('canvas');
      this.regions.setAttribute('class', 'regions');
      // top layer: transparent <div> that captures all user interactions with media content
      this.input_handler = document.createElement('div');
      this.input_handler.setAttribute('class', 'input_handler');

      // add all layers to annotation_container
      this.annotator_container = document.createElement('div');
      this.annotator_container.setAttribute('class', 'annotator_container');
      this.layer_container = document.createElement('div');
      this.layer_container.setAttribute('class', 'layer_container');
      this.layer_container.appendChild(this.content);
      this.layer_container.appendChild(this.regions);
      this.layer_container.appendChild(this.input_handler);
      this.annotator_container.appendChild(this.layer_container);

      //// segment annotator (on top)
      this.segment_annotator_view = document.createElement('div');
      this.segment_annotator_view.setAttribute('class', 'segment_annotator');
      this.segment_annotator = new _via_segment_annotator(this.segment_annotator_view,
                                                          this.content);
      //// video control panel
      this.video_control_view = document.createElement('div');
      this.video_control_view.setAttribute('class', 'video_control');
      this.video_control = new _via_video_control(this.video_control_view,
                                                  this.content);

      //// annotation editor
      this.annotation_editor_view = document.createElement('div');
      this.annotation_editor_view.setAttribute('class', 'annotation_editor');
      var metadata = {};
      this.annotation_editor = new _via_annotation_editor();
      // @todo: create spreadsheet like editor for all annotations

      //// add everything to html view
      this.container.appendChild(this.segment_annotator_view);
      this.container.appendChild(this.annotator_container);
      this.container.appendChild(this.video_control_view);
      this.container.appendChild(this.annotation_editor_view);
      break;

    case _via_file.prototype.FILE_TYPE.IMAGE:
      this.content = document.createElement('img');
      this.content.setAttribute('src', file.uri);
      this.content.addEventListener('load', function() {
        console.log('content loaded');
        this.content_view = document.createElement('div');
        this.content_view.appendChild(this.content);
        this.view.appendChild(this.content_view);
        ok_callback(this.file);
      }.bind(this));
      this.content.addEventListener('error', function() {
        err_callback(this.file);
      }.bind(this));
      this.content.addEventListener('abort', function() {
        err_callback(this.file);
      }.bind(this));
      break;

    default:
      console.log('init() not defined for file type ' + this.file.type);
      err_callback(this.file);
      return;
    }
  }.bind(this));
}
