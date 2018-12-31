/**
 * Builds user interface and control handlers to allow
 * annotation of a file (image, video or audio)

 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 24 Dec. 2018
 *
 */

'use strict';

function _via_file_annotator(container) {
  // everything will be added to this contained
  this.container = container;

  this.now = {};
  this.preload = {};
}

//
// File preload
//
_via_file_annotator.prototype._preload_video_content = function(file) {
  return new Promise( function(ok_callback, err_callback) {
    console.log('loading video')
    // create all the panels that will be included in view
    var fid = file.id;
    this.preload[fid] = {};
    this.preload[fid].file = file;

    //// initialize the media annotator
    this.preload[fid].view = document.createElement('div');
    this.preload[fid].view.setAttribute('id', 'fa_' + fid);
    this.preload[fid].view.classList.add('file_annotator');
    this.preload[fid].view.classList.add('hide'); // hidden by default
    this.container.appendChild( this.preload[fid].view );

    this.preload[fid].media_annotator = new _via_media_annotator(this.preload[fid].view,
                                                                 this.preload[fid].file);

    this.preload[fid].media_annotator.load_media().then( function(media_ok) {
      this.preload[fid].media_annotator.init_static_content();
      ok_callback(file);
    }.bind(this), function(media_err) {
      console.log('load_media() failed');
      err_callback(file);
    }.bind(this));
  }.bind(this));
}

_via_file_annotator.prototype._preload_audio_content = function(file) {
  // @todo
}

_via_file_annotator.prototype._preload_image_content = function(file) {
  // @todo
}

//
// Public Interface
// i.e. _via_file_annotator interacts with outside words using these methods
//

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
    if ( parseInt(fid) === this.now.file.id ) {
      if ( this.preload[fid].view.classList.contains('hide') ) {
        this.preload[fid].view.classList.remove('hide');
        this.preload[fid].view.classList.add('show');
        // @todo: automatically trigger init_dynamic_content() when
        // the html view for this file is visible
        setTimeout( this.preload[fid].media_annotator.init_dynamic_content.bind(this.preload[fid].media_annotator), 100);
      }
    } else {
      if ( this.preload[fid].view.classList.contains('show') ) {
        this.preload[fid].view.classList.remove('show');
      }
      if ( !this.preload[fid].view.classList.contains('hide') ) {
        this.preload[fid].view.classList.add('hide');
      }
    }
  }
}

_via_file_annotator.prototype.file_load = function(file) {
  return new Promise( function(ok_callback, err_callback) {
    // check if the file has already been loaded
    if ( file.id in this.preload ) {
      ok_callback( file );
    } else {
      this.file_preload(file).then( function(preloaded_file) {
        ok_callback( preloaded_file );
      }.bind(this), function(preload_error) {
        console.log('file_preload() failed for file ' + file.uri);
        err_callback(preload_error);
      }.bind(this) );
    }
  }.bind(this) );
}

_via_file_annotator.prototype.file_preload = function(file) {
  return new Promise( function(ok_callback, err_callback) {
    console.log(file.type + ' file_preload()')
    var file_load_promise;
    switch( file.type ) {
    case _via_file.prototype.TYPE.VIDEO:
      file_load_promise = this._preload_video_content(file);
      break;
    case _via_file.prototype.TYPE.AUDIO:
      file_load_promise = this._preload_audio_content(file);
      break;
    case _via_file.prototype.TYPE.IMAGE:
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
