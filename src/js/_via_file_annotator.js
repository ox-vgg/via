/**
 * Builds user interface and control handlers to allow
 * annotation of a file (image, video or audio)

 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 24 Dec. 2018
 *
 */
function _via_file_annotator(html_container) {
  // everything will be added to this contained
  this.html_container = html_container;

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
    var fid = file.id();
    this.preload[fid] = {};
    this.preload[fid].file = file;

    //// initialize the media annotator
    this.preload[fid].content_annotator_view = document.createElement('div');

    this.preload[fid].content_annotator = new _via_media_annotator(this.preload[fid].content_annotator_view, this.preload[fid].file);

    this.preload[fid].content_annotator.load_media().then( function(media_ok) {
      //// add assets to html view
      this.preload[fid].view = document.createElement('div');
      this.preload[fid].view.setAttribute('style', 'display:none');
      this.preload[fid].view.setAttribute('id', fid);

      this.preload[fid].view.appendChild(this.preload[fid].content_annotator_view);
      this.html_container.appendChild( this.preload[fid].view );

      ok_callback(file);
    }.bind(this), function(media_err) {
      console.log('load_media() failed')
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
    if ( this.preload[fid].view.style.display === 'none' ) {
      if ( fid === this.now.file.id() ) {
        this.preload[fid].view.style.display = 'block';
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
