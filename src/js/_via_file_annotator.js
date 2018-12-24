/**
 * VIA code design and logic follows the Model-View-Controller architecture.
 * _via_file_annotator implements a view to manually annotate contents of
 * an image, a video or an audio file.
 *

 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 24 Dec. 2018
 *
 */
function _via_file_annotator(parent_container) {
  // everything will be added to this contained
  this.parent_container = parent_container;

  this.preload = {};
  this.now = {};

  this.config = {};
  this.config.ui = {}
  this.config.ui.style = {};
  this.config.ui.style['view'] = 'display:none; box-sizing:border-box; width:800px; height:800px; background-color:#212121; padding:10px; margin:0; text-align:center; border:none; ';
  this.config.ui.style['content_annotator'] = 'height:70%; padding:0; margin:0; border:none;margin-bottom:5px;';
  this.config.ui.style['content_preview'] = 'height:10%; padding:0; margin:0; background-color:green;';
  this.config.ui.style['content_scrubber'] = 'height:10%; padding:0; margin:0; background-color: yellow;';
  this.config.ui.style['segment_annotator'] = 'height:10%; padding:0; margin:0; background-color: green;';
  this.config.ui.style['content'] = 'height:100%; padding:0; margin:0; border:1px solid #757575;';

  this.config.panel_name_list = ['content_annotator', 'content_preview', 'content_scrubber', 'segment_annotator'];
}
//
// File preload
//
_via_file_annotator.prototype._preload_video_content = function(file) {
  return new Promise( function(ok_callback, err_callback) {
    console.log('loading video')
    // create all the panels that will be included in view
    this.preload[ file.id() ] = {};
    this.preload[ file.id() ].view = document.createElement('div');
    this.preload[ file.id() ].view.setAttribute('id', file.id());
    this.preload[ file.id() ].view.setAttribute('style', this.config.ui.style['view']);

    for ( var i = 0; i < this.config.panel_name_list.length; ++i ) {
      var panel_name = this.config.panel_name_list[i];
      this.preload[ file.id() ][ panel_name ] = document.createElement('div');
      this.preload[ file.id() ][ panel_name ].setAttribute('style', this.config.ui.style[panel_name]);
      this.preload[ file.id() ].view.appendChild( this.preload[ file.id() ][ panel_name ] );
    }
    this.parent_container.appendChild(this.preload[ file.id() ].view);

    //// load the content
    var el = document.createElement('video');
    this.preload[ file.id() ].content_annotator.appendChild(el);
    el.setAttribute('style', this.config.ui.style['content']);
    el.setAttribute('class', 'content_annotator');
    el.setAttribute('src', file.uri);
    el.setAttribute('autoplay', 'false');
    el.setAttribute('loop', 'false');
    el.setAttribute('controls', '');
    el.setAttribute('preload', 'auto');
    el.addEventListener('canplaythrough', function() {
      console.log('content loaded');
      el.pause(); // debug
      this.preload[ file.id() ].content_natural_width = el.videoWidth;
      this.preload[ file.id() ].content_natural_height = el.videoHeight;
      ok_callback(file);
    }.bind(this));
    el.addEventListener('error', function() {
      err_callback(file);
    }.bind(this));
    el.addEventListener('abort', function() {
      err_callback(file);
    }.bind(this));

    //// load video content also in a back buffer (used to load preview frames)
    this.preload[ file.id() ].content_backbuffer = document.createElement('video');
    this.preload[ file.id() ].content_backbuffer.setAttribute('src', file.uri);
    this.preload[ file.id() ].content_backbuffer.setAttribute('autoplay', 'false');
    this.preload[ file.id() ].content_backbuffer.setAttribute('loop', 'false');
    this.preload[ file.id() ].content_backbuffer.setAttribute('muted', 'true');
    this.preload[ file.id() ].content_backbuffer.setAttribute('preload', 'auto');
    this.preload[ file.id() ].content_backbuffer.addEventListener('canplaythrough', function() {
      this.preload[ file.id() ].content_backbuffer.pause();
      console.log('backbuffer active');
    }.bind(this));
  }.bind(this));
}

_via_file_annotator.prototype._preload_audio_content = function(file) {

}

_via_file_annotator.prototype._preload_image_content = function(file) {

}

//
// Public Interface
// i.e. _via_file_annotator interacts with outside words using these methods
//

_via_file_annotator.prototype.get_view = function() {
  return this.preload[ this.now.file.id() ].view;
}

_via_file_annotator.prototype.file_load_and_show = function(uri) {
  var file = new _via_file(uri);
  this.file_load(file).then( function(ok) {
    this.file_show(file);
  }.bind(this), function(err) {
    console.log('_via_file_annotator.file_load_and_show(): failed for uri [' + uri + ']');
  }.bind(this));
}

_via_file_annotator.prototype.file_show = function(file) {
  this.now.file = file;
  for ( var fid in this.preload ) {
    if ( this.preload[fid].view.style.display === 'none' ) {
      if ( fid === this.now.file.id() ) {
        this.preload[ this.now.file.id() ].view.style.display = 'block';
      }
    } else {
      this.preload[fid].view.style.display = 'none';
    }
  }
}

_via_file_annotator.prototype.file_load = function(file) {
  return new Promise( function(ok_callback, err_callback) {
    // check if the file has already been loaded
    if ( file.id() in this.preload ) {
      ok_callback( file );
    } else {
      this.file_preload(file).then( function(preloaded_file) {
        ok_callback( preloaded_file );
      }.bind(this), function(preload_error) {
        err_callback(preload_error);
      }.bind(this) );
    }
  }.bind(this) );
}

_via_file_annotator.prototype.file_preload = function(file) {
  return new Promise( function(ok_callback, err_callback) {
    console.log('file_preload()'+file.type)
    var file_load_promise;
    switch( file.type ) {
    case _via_file.prototype.FILE_TYPE.VIDEO:
      file_load_promise = this._preload_video_content(file);
      break;
    case _via_file.prototype.FILE_TYPE.AUDIO:
      file_load_promise = this._preload_audio_content(file);
      break;
    case _via_file.prototype.FILE_TYPE.IMAGE:
      file_load_promise = this._preload_image_content(file);
      break;
    default:
      console.log('_via_file_annotator.prototype.file_preload(): ' +
                  'unknown file type ');
      console.log(file);
      err_callback(file);
      return;
    }
    file_load_promise.then( function(ok_file) {
      ok_callback(ok_file);
    }.bind(this), function(err_file) {
      err_callback(err_file);
    }.bind(this));
  }.bind(this));
}

_via_file_annotator.prototype.add_event_listener = function(file) {
}

_via_file_annotator.prototype.remove_event_listener = function(file) {
}

_via_file_annotator.prototype.config = function(key, value) {
}
