/**
 * @class
 * @classdesc Visualisation of audio amplitude and spectrogram
 *
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 18 May 2019
 *
 */

'use strict';

function _via_audio_spectrum(file, path) {
  this.file = file;
  this.file_path = path;
  this.file_object_url = undefined; // file contents are in this the object url
  this.frames = {}; // indexed by second

  if ( this.file.type !== _VIA_FILE_TYPE.VIDEO &&
       this.file.type !== _VIA_FILE_TYPE.AUDIO
     ) {
    console.log('_via_audio_spectrum() : file type must be ' +
                _VIA_FILE_TYPE.VIDEO + ' or ' + _VIA_FILE_TYPE.AUDIO +
                ' (got ' + this.file.type + ')');
    return;
  }

  // state
  this.is_spectrum_read_ongoing = false;
  this.thumbnail_time = 0;
  this.thumbnail_canvas = document.createElement('canvas');

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_audio_spectrum_';
  _via_event.call( this );
}

_via_audio_spectrum.prototype._init = function(container, swidth, sheight) {
  console.log(container)
  this.c = container;
  this.swidth = swidth;
  this.sheight = sheight;
  this.scanvas = document.createElement('canvas');
  this.scanvas.width = this.swidth;
  this.scanvas.height = this.sheight;
  this.sctx = this.scanvas.getContext('2d', {alpha:false});
  this.c.appendChild(this.scanvas);
}

_via_audio_spectrum.prototype._update = function(tstart, tend, width_per_sec) {
  if ( this.audio_data_len ) {
    this.tstart = tstart;
    this.tend = tend;
    this.width_per_sec = width_per_sec;
    this.sample_per_pixel = Math.floor(this.sample_rate / this.width_per_sec);
    var start_sample_index = tstart * this.sample_rate;
    var end_sample_index = tend * this.sample_rate;
    var amp_spectrum_len = Math.floor((end_sample_index - start_sample_index) / this.sample_per_pixel);
    console.log(amp_spectrum_len)
    this.current_amp_spectrum = new Float32Array(amp_spectrum_len);

    console.log('this.sample_per_pixel=' + this.sample_per_pixel);
    var index = 0;
    var min_val = +Infinity;
    var max_val = -Infinity;
    for ( var i = start_sample_index; i < end_sample_index; i = i + this.sample_per_pixel ) {
      var avg = 0;
      for ( var j = 0; j < this.sample_per_pixel; ++j ) {
        avg = avg + this.audio_data[i + j];
      }
      this.current_amp_spectrum[index] = Math.round(avg / this.sample_per_pixel);
      if ( this.current_amp_spectrum[index] < min_val ) {
        min_val = this.current_amp_spectrum[index];
      }
      if ( this.current_amp_spectrum[index] > max_val ) {
        max_val = this.current_amp_spectrum[index];
      }
      index = index + 1;
    }

    var mid = Math.round(this.scanvas.height / 2);
    var norm = mid / Math.max(min_val, max_val);
    for ( var i = 0; i < amp_spectrum_len; ++i ) {
      this.current_amp_spectrum[i] = mid - Math.round( this.current_amp_spectrum[i] * norm );
    }

    //console.log('_via_audio_spectrum.prototype._update() : ' + tstart + '->' + tend);
    console.log(this.current_amp_spectrum);
    this._draw();
  }
}

_via_audio_spectrum.prototype._clear = function() {
  this.sctx.fillStyle = '#ffffff';
  this.sctx.fillRect(0, 0, this.scanvas.width, this.scanvas.height);
}

_via_audio_spectrum.prototype._draw = function() {
  this._clear();
  this.sctx.strokeStyle = '#707070';
  this.sctx.lineWidth = this.DRAW_LINE_WIDTH;
  this.sctx.beginPath();
  var n = this.current_amp_spectrum.length;
  var mid = Math.floor( this.scanvas.height / 2 );
  this.sctx.moveTo(0, this.current_amp_spectrum[i]);
  for ( var i = 1; i < n; ++i ) {
    this.sctx.lineTo(i, this.current_amp_spectrum[i]);
    //this.sctx.lineTo(i, Math.log(this.current_amp_spectrum[i]));
  }
  this.sctx.stroke();
}

// WARNING: not invoking this method will result in
// resources being allocated to things that are no longer needed
_via_audio_spectrum.prototype._on_event_destroy = function() {
  if ( typeof(this.file_object_url) !== 'undefined' ) {
    console.log('_via_audio_spectrum(): revoking object uri for fid=' + this.file.fid);
    URL.revokeObjectURL(this.file_object_url);
  }
}

_via_audio_spectrum.prototype.load = function() {
  return new Promise( function(ok_callback, err_callback) {
    this._file_read().then( function() {
      console.log('file read done');
      ok_callback();
    }.bind(this), function(file_src_err) {
      console.log(file_src_err);
      err_callback();
    }.bind(this));
  }.bind(this));
}

_via_audio_spectrum.prototype._file_read = function() {
  return new Promise( function(ok_callback, err_callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', this.file.src);
    xhr.responseType = 'arraybuffer';
    xhr.addEventListener('load', function() {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      var actx = new AudioContext();

      actx.decodeAudioData(xhr.response).then( function(buf) {
        var oactx = new OfflineAudioContext(1, buf.length, buf.sampleRate);
        var osrc = oactx.createBufferSource();
        osrc.buffer = buf;
        osrc.connect(oactx.destination);
        osrc.start();
        oactx.startRendering().then( function(rendered_buf) {
          var fdata = rendered_buf.getChannelData(0);
          // downsample audio data
          var in_sample_rate = buf.sampleRate;
          var out_sample_rate = 882;
          //var out_sample_rate = 11025;

          var sample_ratio = in_sample_rate / out_sample_rate;
          var downsample_buf_len = Math.round(fdata.length / sample_ratio);
          var in_offset = 0;
          var out_offset = 0;
          this.audio_data = new Int16Array( downsample_buf_len );
          var min_val = +Infinity;
          var max_val = -Infinity;
          while ( in_offset < fdata.length ) {
            var next_offset = Math.round( (out_offset + 1) * sample_ratio );
            var avg = 0;
            var count = 0;
            for ( var i = in_offset; i < next_offset && i < buf.length; ++i ) {
              avg = avg + fdata[i];
              count = count + 1;
            }

            //this.audio_data[out_offset] = Math.min(1, avg/count) * 0x7FFF; // 0x7FFF = 11...11
            this.audio_data[out_offset] = (avg/count) * 0x7FFF; // 0x7FFF = 11...11
            if ( this.audio_data[out_offset] > max_val ) {
              max_val = this.audio_data[out_offset];
            }
            if ( this.audio_data[out_offset] < min_val ) {
              min_val = this.audio_data[out_offset];
            }

            out_offset = out_offset + 1;
            in_offset = next_offset;
          }

          this.sample_rate = out_sample_rate;
          this.duration = buf.duration;
          this.audio_data_len = this.audio_data.length;
          console.log(this.audio_data);
          console.log(this.sample_rate);
          ok_callback();
        }.bind(this));
      }.bind(this), function(err) {
        console.log(err);
        err_callback();
      });
    }.bind(this));
    xhr.send();
  }.bind(this));
}

_via_audio_spectrum.prototype._load_video = function(src) {
  return new Promise( function(ok_callback, err_callback) {
    this.video = document.createElement('video');
    this.video.setAttribute('src', src);
    //this.video.setAttribute('autoplay', false);
    //this.video.setAttribute('loop', false);
    //this.video.setAttribute('controls', '');
    this.video.setAttribute('preload', 'auto');
    //this.video.setAttribute('crossorigin', 'anonymous');

    this.video.addEventListener('loadeddata', function() {
      this._on_event_destroy(); // no longer needed
      var aspect_ratio = this.video.videoHeight / this.video.videoWidth;
      this.fheight = Math.floor(this.fwidth * aspect_ratio);
      this.thumbnail_canvas.width = this.fwidth;
      this.thumbnail_canvas.height = this.fheight;
      this.thumbnail_context = this.thumbnail_canvas.getContext('2d', { alpha:false });
      ok_callback();
    }.bind(this));
    this.video.addEventListener('error', function() {
      console.log('_via_video_thumnnail._load_video() error')
      err_callback('error');
    }.bind(this));
    this.video.addEventListener('abort', function() {
      console.log('_via_audio_spectrum._load_video() abort')
      err_callback('abort');
    }.bind(this));

    this.video.addEventListener('seeked', this._on_seeked.bind(this));
  }.bind(this));
}

_via_audio_spectrum.prototype.get_thumbnail = function(time_float) {
  this.is_thumbnail_read_ongoing = true;
  this.thumbnail_time = parseInt(time_float);
  this.video.currentTime = this.thumbnail_time;
  return this.thumbnail_canvas;
}

_via_audio_spectrum.prototype._on_seeked = function() {
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

_via_audio_spectrum.prototype._downsample = function(buffer, in_sample_rate, out_sample_rate) {

}
