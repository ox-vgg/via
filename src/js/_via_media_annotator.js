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

  this.view = document.createElement('div');
  this.container.appendChild( this.view );

  this.state = {};
  this.style = {};
}

_via_media_annotator.prototype.load_media = function() {
  return new Promise( function(ok_callback, err_callback) {
    switch( this.file.type ) {
    case _via_file.prototype.FILE_TYPE.VIDEO:
      this.content = document.createElement('video');
      this.content.setAttribute('src', file.uri);
      this.content.setAttribute('autoplay', 'false');
      this.content.setAttribute('loop', 'false');
      this.content.setAttribute('controls', '');
      this.content.setAttribute('preload', 'auto');
      this.content.addEventListener('canplaythrough', function() {
        console.log('content loaded');
        this.segment_annotator_view = document.createElement('div');
        this.segment_annotator = new _via_segment_annotator(this.segment_annotator_view,
                                                            this.content);

        this.content_view = document.createElement('div');
        this.content_view.appendChild(this.content);

        this.view.appendChild(this.segment_annotator_view);
        this.view.appendChild(this.content_view);
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
