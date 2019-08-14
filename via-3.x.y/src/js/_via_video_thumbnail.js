/**
 * @class
 * @classdesc Extracts thumbnail sized frames from a video
 *
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 5 Feb. 2019
 * @param {_via_file} an instance of _via_file corresponding to a video file
 */

'use strict';

function _via_video_thumbnail(fid, data) {
  this._ID = '_via_video_thumbnail_';
  this.fid = fid;
  this.d = data;
  this.fwidth = 160;
  this.file_object_url = undefined; // file contents are in this the object url
  this.frames = {}; // indexed by second

  if ( this.d.store.file[this.fid].type !== _VIA_FILE_TYPE.VIDEO ) {
    console.log('_via_video_thumbnail() : file type must be ' +
                _VIA_FILE_TYPE.VIDEO + ' (got ' + this.d.store.file[this.fid].type + ')');
    return;
  }

  // state
  this.is_thumbnail_read_ongoing = false;
  this.thumbnail_time = 0;
  this.thumbnail_canvas = document.createElement('canvas');

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  _via_event.call( this );

  this._init();
}

_via_video_thumbnail.prototype._init = function() {
}

_via_video_thumbnail.prototype.load = function() {
  return new Promise( function(ok_callback, err_callback) {
    this._load_video().then( function() {
      this.video.currentTime = 0.0;
      ok_callback();
    }.bind(this), function(load_err) {
      console.log(load_err);
      err_callback();
    }.bind(this));
  }.bind(this));
}

_via_video_thumbnail.prototype._load_video = function() {
  return new Promise( function(ok_callback, err_callback) {
    this.video = document.createElement('video');
    this.video.setAttribute('src', this.d.file_get_src(this.fid));
    //this.video.setAttribute('autoplay', false);
    //this.video.setAttribute('loop', false);
    //this.video.setAttribute('controls', '');
    this.video.setAttribute('preload', 'auto');
    //this.video.setAttribute('crossorigin', 'anonymous');

    this.video.addEventListener('loadeddata', function() {
      this.d.file_free_resources(this.fid);
      var aspect_ratio = this.video.videoHeight / this.video.videoWidth;
      this.fheight = Math.floor(this.fwidth * aspect_ratio);
      this.thumbnail_canvas.width = this.fwidth;
      this.thumbnail_canvas.height = this.fheight;
      this.thumbnail_context = this.thumbnail_canvas.getContext('2d', { alpha:false });
      ok_callback();
    }.bind(this));
    this.video.addEventListener('error', function() {
      this.d.file_free_resources(this.fid);
      console.log('_via_video_thumnnail._load_video() error')
      err_callback('error');
    }.bind(this));
    this.video.addEventListener('abort', function() {
      this.d.file_free_resources(this.fid);
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
  if ( this.is_thumbnail_read_ongoing &&
       this.thumbnail_context
     ) {
    this.is_thumbnail_read_ongoing = false;
    this.thumbnail_context.drawImage(this.video,
                                     0, 0, this.video.videoWidth, this.video.videoHeight,
                                     0, 0, this.fwidth, this.fheight
                                    );
  }
}
