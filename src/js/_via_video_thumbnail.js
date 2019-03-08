/**
 * @class
 * @classdesc Extracts thumbnail sized frames from a video
 *
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 5 Feb. 2019
 * @param {_via_file} an instance of _via_file corresponding to a video file
 */

'use strict';

function _via_video_thumbnail(file) {
  this.file = file;
  this.fwidth = 160;
  this.file_object_url = undefined; // file contents are in this the object url
  this.frames = {}; // indexed by second

  if ( this.file.type !== _VIA_FILE_TYPE.VIDEO ) {
    console.log('_via_video_thumbnail() : file type must be ' +
                _VIA_FILE_TYPE.VIDEO + ' (got ' + this.file.type + ')');
    return;
  }

  // state
  this.is_thumbnail_read_ongoing = false;
  this.thumbnail_time = 0;
  this.thumbnail_canvas = document.createElement('canvas');

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_video_thumbnail_';
  _via_event.call( this );
}

_via_video_thumbnail.prototype._init = function() {
}

// WARNING: not invoking this method will result in
// resources being allocated to things that are no longer needed
_via_video_thumbnail.prototype._on_event_destroy = function() {
  if ( typeof(this.file_object_url) !== 'undefined' ) {
    console.log('_via_video_thumbnail(): revoking object uri for fid=' + this.file.fid);
    URL.revokeObjectURL(this.file_object_url);
  }
}

_via_video_thumbnail.prototype.start = function() {
  return new Promise( function(ok_callback, err_callback) {
    if ( this.file.src instanceof File ) {
      this._read_file().then( function(file_src_ok) {
        this._load_video(file_src_ok).then( function() {
          this.video.currentTime = 0.0;
          ok_callback();
        }.bind(this), function(err) {
          console.log(err);
          err_callback();
        }.bind(this));
      }.bind(this), function(file_src_err) {
        console.log(file_src_err);
        err_callback();
      }.bind(this));
    } else {
      this._load_video(this.file.src).then( function() {
        this.video.currentTime = 0.0;
        ok_callback();
      }.bind(this), function(err) {
        console.log(err);
        err_callback();
      }.bind(this));
    }
  }.bind(this));
}

_via_video_thumbnail.prototype._read_file = function() {
  return new Promise( function(ok_callback, err_callback) {
    var file_reader = new FileReader();
    file_reader.addEventListener('error', function() {
      console.log('_via_video_thumbnail._read_file() error');
      err_callback('error');
    }.bind(this));
    file_reader.addEventListener('abort', function() {
      console.log('_via_video_thumbnail._read_file() abort');
      err_callback('abort')
    }.bind(this));
    file_reader.addEventListener('load', function() {
      var blob = new Blob( [ file_reader.result ],
                           { type: this.file.src.type }
                         );
      // we keep a reference of file object URL so that we can revoke it when not needed
      // WARNING: ensure that this._destructor() gets called when "this" not needed
      this.file_object_url = URL.createObjectURL(blob);
      console.log(this.file_object_url)
      ok_callback(this.file_object_url);
    }.bind(this));
    console.log(this.file.src)
    file_reader.readAsArrayBuffer( this.file.src );
  }.bind(this));
}

_via_video_thumbnail.prototype._load_video = function(src) {
  return new Promise( function(ok_callback, err_callback) {
    this.video = document.createElement('video');
    this.video.setAttribute('src', src);
    this.video.setAttribute('autoplay', false);
    this.video.setAttribute('loop', false);
    this.video.setAttribute('controls', '');
    this.video.setAttribute('preload', 'auto');
    this.video.addEventListener('loadeddata', function() {
      this.video.pause();
      var aspect_ratio = this.video.videoHeight / this.video.videoWidth;
      this.fheight = Math.floor(this.fwidth * aspect_ratio);
      this.thumbnail_canvas.width = this.fwidth;
      this.thumbnail_canvas.height = this.fheight;
      ok_callback();
    }.bind(this));
    this.video.addEventListener('error', function() {
      console.log('_via_video_thumnnail._load_video() error')
      err_callback('error');
    }.bind(this));
    this.video.addEventListener('abort', function() {
      console.log('_via_video_thumbnail._load_video() abort')
      err_callback('abort');
    }.bind(this));

    this.video.addEventListener('seeked', this._on_seeked.bind(this));
  }.bind(this));
}

_via_video_thumbnail.prototype.get_thumbnail = function(time_float) {
  this.is_thumbnail_read_ongoing = true;
  this.thumbnail_time = parseInt(time_float);
  this.video.currentTime = this.thumbnail_time;
  return this.thumbnail_canvas;
}

_via_video_thumbnail.prototype._on_seeked = function() {
  if ( this.is_thumbnail_read_ongoing ) {
    // skip if we already have this frame
    var ctx = this.thumbnail_canvas.getContext('2d', { alpha:false });
    ctx.drawImage(this.video,
                  0, 0, this.video.videoWidth, this.video.videoHeight,
                  0, 0, this.fwidth, this.fheight
                 );
    this.is_thumbnail_read_ongoing = false;
  }
}
