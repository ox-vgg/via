/**
 * @class
 * @classdesc Visualisation of audio amplitude and spectrogram
 *
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 18 May 2019
 *
 */

'use strict';

function _via_audio_spectrum(data, canvas, fid ) {
  this.d = data;
  this.canvas = canvas;
  this.ctx = this.canvas.getContext('2d', { 'alpha':false });

  this.bufcanvas = document.createElement('canvas');
  this.bufcanvas.height = 512;
  this.bufcanvas.width = 5000;
  this.bufctx = this.bufcanvas.getContext('2d');

  this.fid = fid;
  this.fftSize = 1024;

  if ( this.d.store['file'][this.fid].type !== _VIA_FILE_TYPE.VIDEO &&
       this.d.store['file'][this.fid].type !== _VIA_FILE_TYPE.AUDIO
     ) {
    console.log('_via_audio_spectrum() : file type must be ' +
                _VIA_FILE_TYPE.VIDEO + ' or ' + _VIA_FILE_TYPE.AUDIO +
                ' (got ' + this.d.store['file'][this.fid].type + ')');
    return;
  }

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_audio_spectrum_';
  _via_event.call( this );
}

_via_audio_spectrum.prototype.show_spectrogram = function() {
  this.ctx.font = '10px Sans';
  this.char_width = this.ctx.measureText('M').width;
  this.padx = this.char_width;
  this.pady = this.char_width;

  this.ctx.fillStyle = '#ffffff';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  this.load().then( function(ok) {
    console.log('_via_audio_spectrum.show_spectrogram() done');
  }.bind(this), function(err) {
    console.log('_via_audio_spectrum.show_spectrogram: error');
  }.bind(this));
}

_via_audio_spectrum.prototype.load = function() {
  return new Promise( function(ok_callback, err_callback) {
    this._file_read().then( function() {
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

    xhr.open('GET', this.d.file_get_uri(this.fid));
    xhr.responseType = 'arraybuffer';
    xhr.addEventListener('load', function() {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      var actx = new AudioContext();

      actx.decodeAudioData(xhr.response).then( function(buf) {
        this.offline_actx = new OfflineAudioContext(buf.numberOfChannels, buf.length, buf.sampleRate);

        var osrc = this.offline_actx.createBufferSource();
        osrc.buffer = buf;
        osrc.loop = false;

        osrc.connect(this.offline_actx.destination);
        osrc.start();
        this.x = this.padx;
        this.count = 0;
        this.sample_count = buf.length;
        this.sampling_freq = buf.sampleRate;
        this.duration = buf.duration;
        this.dx = 1;
        this.col_count = this.sample_count / this.fftSize;

        this.max_col_count = ((this.canvas.width/2.0) - (2.0*this.padx)) / this.dx;
        if(this.col_count > this.max_col_count) {
          this.col_jump = Math.floor(this.col_count / this.max_col_count);
        } else {
          this.col_jump = 0;
        }

        this.offline_actx.startRendering().then( function(rendered_buf) {
          var audio_ctx = new (window.AudioContext || window.webkitAudioContext)();
          var video_audio = audio_ctx.createBufferSource();
          video_audio.buffer = rendered_buf;
          video_audio.loop = false;
          video_audio.playbackRate.value = 1;

          this.analyser = audio_ctx.createAnalyser();
          this.analyser.fftSize = this.fftSize;

          video_audio.connect(this.analyser);
          //this.analyser.connect(audio_ctx.destination);
          video_audio.start();

          this.iter_count = 0;
          this.bufctx.fillStyle = 'black';
          this.bufctx.fillRect(0, 0, this.bufcanvas.width, this.bufcanvas.height);

          this.save_spectrum();
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
      ok_callback();
    }.bind(this));
    this.video.addEventListener('error', function() {
      console.log('_via_audio_spectrum._load_video() error')
      err_callback('error');
    }.bind(this));
    this.video.addEventListener('abort', function() {
      console.log('_via_audio_spectrum._load_video() abort')
      err_callback('abort');
    }.bind(this));

    this.video.addEventListener('seeked', this._on_seeked.bind(this));
  }.bind(this));
}

_via_audio_spectrum.prototype.save_spectrum = function() {
  var freq = new Uint8Array(this.analyser.frequencyBinCount);
  this.analyser.getByteFrequencyData(freq);

  for (var i = 0; i < freq.length; ++i) {
    var log_index = this.log_scale(i, freq.length);
    var value = freq[log_index];
    var percent = i / freq.length;
    var y = Math.round(percent * this.canvas.height);
    this.bufctx.fillStyle = this.get_full_color(value);
    this.bufctx.fillRect(this.iter_count, this.bufcanvas.height - y, 1, 1);
    if(this.iter_count < (this.canvas.width - 2*this.padx)) {
      this.ctx.fillStyle = this.get_full_color(value);
      this.ctx.fillRect(this.padx + this.iter_count, this.canvas.height - y, 1, 1);
    }
  }
  this.iter_count = this.iter_count + 1;

  var input_is_all_zero = true;
  for(var i=0; i<freq.length; ++i) {
    if(freq[i] !== 0) {
      input_is_all_zero = false;
      break;
    }
  }
  if(input_is_all_zero && this.iter_count > 50) {
    // draw the fill spectrum
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.drawImage(this.bufcanvas,
                       0, 0, this.iter_count, this.bufcanvas.height,
                       this.padx, 0, this.canvas.width - 2*this.padx, this.canvas.height);
  } else {
    requestAnimationFrame(this.save_spectrum.bind(this));

    if(this.iter_count > (this.canvas.width - 2*this.padx)) {
      if(this.iter_count % 10 === 0) {
        this.ctx.drawImage(this.bufcanvas,
                           0, 0, this.iter_count + 20, this.bufcanvas.height,
                           0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }
}

_via_audio_spectrum.prototype.log_scale = function(index, count) {
  var logmax = Math.log(count + 1) / Math.log(2);
  var exp = (logmax * index) / count;
  return Math.round(Math.pow(2, exp) - 1);
}

_via_audio_spectrum.prototype.get_full_color = function(value) {
  var fromH = 62;
  var toH = 0;
  var percent = value / 255;
  var delta = percent * (toH - fromH);
  var hue = fromH + delta;

  return 'hsl(H, 100%, 50%)'.replace(/H/g, hue);
}
