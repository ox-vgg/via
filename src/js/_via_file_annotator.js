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
  this.anim = {};

  this.config = {};
  this.config.ui = {}
  this.config.ui.style = {};
  this.config.ui.style['view'] = 'display:none; box-sizing:border-box; width:800px; height:800px; background-color:#212121; padding:10px; margin:0; text-align:center; border:none; ';
  this.config.ui.style['content_annotator'] = 'height:70%; padding:0; margin:0; border:none;margin-bottom:5px;';
  this.config.ui.style['content_preview'] = 'height:10%; padding:0; margin:0; background-color:green;';
  this.config.ui.style['content_scrubber'] = 'height:10%; padding:0; margin:0; background-color: yellow;';
  this.config.ui.style['segment_annotator'] = 'height:10%; padding:0; margin:0; background-color: green;';
  this.config.ui.style['content'] = 'max-height:100%; max-width:100%; height:auto; width:auto; padding:0; margin:0; border:1px solid #757575;';
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
    this.preload[ file.id() ].cref = {}; // reference to each panel container
    this.preload[ file.id() ].ref = {}; // reference to content (i.e. canvas) of each panel

    //// load the content
    this.preload[ file.id() ].ref.content_annotator = document.createElement('video');
    var el = this.preload[ file.id() ].ref.content_annotator; // to avoid typing long var. names
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
      ok_callback(file);
    }.bind(this));
    el.addEventListener('error', function() {
      err_callback(file);
    }.bind(this));
    el.addEventListener('abort', function() {
      err_callback(file);
    }.bind(this));

    //// load video content also in a back buffer (used to load preview frames)
    this.preload[ file.id() ].backbuf = document.createElement('video');
    this.preload[ file.id() ].backbuf.setAttribute('src', file.uri);
    this.preload[ file.id() ].backbuf.setAttribute('autoplay', 'false');
    this.preload[ file.id() ].backbuf.setAttribute('loop', 'false');
    this.preload[ file.id() ].backbuf.setAttribute('muted', 'true');
    this.preload[ file.id() ].backbuf.setAttribute('preload', 'auto');
    this.preload[ file.id() ].backbuf.addEventListener('play', function() {
      this.pause(); // the back buffer should never play
    });

    //// initialize content preview
    this.preload[ file.id() ].ref.content_preview = document.createElement('canvas');

    //// initialize content scrubber
    this.preload[ file.id() ].ref.content_scrubber = document.createElement('canvas');
    this.preload[ file.id() ].ref.content_scrubber.addEventListener('wheel',
                                                                    this._wheel_event_listener.bind(this),
                                                                    false);

    //// initialize segment annotator
    this.preload[ file.id() ].ref.segment_annotator = document.createElement('canvas');

    //// add to view
    this.preload[ file.id() ].view = document.createElement('div');
    this.preload[ file.id() ].view.setAttribute('id', file.id());
    this.preload[ file.id() ].view.setAttribute('style', this.config.ui.style['view']);
    for ( var i = 0; i < this.config.panel_name_list.length; ++i ) {
      var panel_name = this.config.panel_name_list[i];
      this.preload[ file.id() ].cref[ panel_name ] = document.createElement('div');
      this.preload[ file.id() ].cref[ panel_name ].setAttribute('style', this.config.ui.style[panel_name]);
      this.preload[ file.id() ].cref[ panel_name ].setAttribute('class', panel_name)
      this.preload[ file.id() ].cref[ panel_name ].appendChild( this.preload[ file.id() ].ref[ panel_name ] )
      this.preload[ file.id() ].view.appendChild( this.preload[ file.id() ].cref[ panel_name ] );
    }
    this.parent_container.appendChild(this.preload[ file.id() ].view);
  }.bind(this));
}

_via_file_annotator.prototype._preload_audio_content = function(file) {
  // @todo
}

_via_file_annotator.prototype._preload_image_content = function(file) {
  // @todo
}

//
// Panel management
//
_via_file_annotator.prototype._init_all_panels = function() {
  console.log('_init_all_panels(): start');

  this._init_content_scrubber();
  this._init_content_preview();
  //this._init_segment_annotator();
  console.log('_init_all_panels(): end');
}

_via_file_annotator.prototype._init_content_preview = function() {
  this.now.state.content_preview = { 'time':[], 'x':[], 'y':[] };
  console.log('_init_content_preview()');
  var c = this.preload[ this.now.file.id() ].ref.content_preview;
  c.width  = this.preload[ this.now.file.id() ].cref.content_preview.clientWidth;
  c.height = this.preload[ this.now.file.id() ].cref.content_preview.clientHeight;
  var ctx = c.getContext('2d', { alpha:false });

  this.now.state.content_preview.char_width = Math.floor(ctx.measureText('M').width);
  this.now.state.content_preview.frame_spacing = this.now.state.content_preview.char_width;
  this.now.state.content_preview.aspect_ratio = this.preload[ this.now.file.id() ].backbuf.videoHeight / this.preload[ this.now.file.id() ].backbuf.videoWidth;;
  this.now.state.content_preview.frame_count = 10;
  this.now.state.content_preview.canvas_width = c.width;
  this.now.state.content_preview.frame_width = Math.floor( (c.width - (this.now.state.content_preview.frame_count - 1) * this.now.state.content_preview.frame_spacing) / this.now.state.content_preview.frame_count );
  this.now.state.content_preview.frame_height = Math.floor( this.now.state.content_preview.frame_width * this.now.state.content_preview.aspect_ratio );
    // @todo: what happens if frame_height > c.height
}

_via_file_annotator.prototype._init_content_scrubber = function() {
  console.log('_init_content_scrubber()');
  this.now.state.content_scrubber = { 'tick':[0, 0.25, 0.5, 0.75, 1],
                                      'unit':'',
                                      'factor':1.0,
                                      'unit_precision':1,
                                      'zoom_step':1/5,
                                      'pan_step':1/5,
                                      't0':0,
                                      't1':this.preload[ this.now.file.id() ].ref.content_annotator.duration
                                    };

  var c = this.preload[ this.now.file.id() ].ref.content_scrubber;
  c.width  = this.preload[ this.now.file.id() ].cref.content_scrubber.clientWidth;
  c.height = this.preload[ this.now.file.id() ].cref.content_scrubber.clientHeight;
}

_via_file_annotator.prototype._update_all_panels = function() {
  console.log('_update_all_panels(): start');

  this._update_content_scrubber();
  //this._update_content_preview();
  //this._update_segment_annotator();
  console.log('_update_all_panels(): end');
}

//
// content preview
//

_via_file_annotator.prototype._update_content_preview = function() {
  if ( this.now.state.content_preview.load_ongoing ) {
    console.log('_update_content_preview() is already ongoing. Cancelling and restarting ...');
    this.now.state.content_preview.load_ongoing = false;
    this.preload[ this.now.file.id() ].backbuf.removeEventListener('seeked', this._backbuf_on_seek_done.bind(this));
  }
  console.log('_update_content_preview()');

  // computer time and coordinates for frame preview
  var frame_width = this.now.state.content_preview.frame_width;
  var frame_height = this.now.state.content_preview.frame_height;
  var frame_spacing = this.now.state.content_preview.frame_spacing;
  var frame_count = this.now.state.content_preview.frame_count;
  var t0 = this.now.state.content_scrubber.t0;
  var t1 = this.now.state.content_scrubber.t1;
  this.now.state.content_preview.time = [];
  this.now.state.content_preview.x = [];
  this.now.state.content_preview.y = [];

  var frame_x, frame_center_x, frame_time;
  for ( var i = 0; i < frame_count; ++i ) {
    frame_x = i * ( this.now.state.content_preview.frame_spacing + this.now.state.content_preview.frame_width );
    frame_center_x = frame_x + (this.now.state.content_preview.frame_width/2);
    frame_time = t0 + (t1 - t0) * (frame_center_x/this.now.state.content_preview.canvas_width);
    if ( (frame_x + this.now.state.content_preview.frame_width) <= this.now.state.content_preview.canvas_width ) {
      this.now.state.content_preview.time[i] = frame_time.toFixed(6);
      this.now.state.content_preview.x[i]    = frame_x;
      this.now.state.content_preview.y[i]    = 0;
    }
  }

  // trigger loading of frame_preview panel
  this.now.state.content_preview.load_ongoing = true;
  this.now.state.content_preview.current_index = 0;
  this.preload[ this.now.file.id() ].backbuf.addEventListener('seeked', this._backbuf_on_seek_done.bind(this));
  this._seqload_content_preview();
}

_via_file_annotator.prototype._seqload_content_preview = function() {
  if ( this.now.state.content_preview.current_index < this.now.state.content_preview.time.length ) {
    this.preload[ this.now.file.id() ].backbuf.currentTime = this.now.state.content_preview.time[this.now.state.content_preview.current_index];
  } else {
    // stop content_preview load process
    this.now.state.content_preview.load_ongoing = false;
    this.preload[ this.now.file.id() ].backbuf.removeEventListener('seeked', this._backbuf_on_seek_done.bind(this));
  }
}

_via_file_annotator.prototype._backbuf_on_seek_done = function() {
  if ( this.now.state.content_preview.load_ongoing ) {
    // draw the frame and trigger another seek
    var ctx = this.preload[ this.now.file.id() ].ref.content_preview.getContext('2d', { alpha:false });
    var fi = this.now.state.content_preview.current_index;

    ctx.drawImage( this.preload[ this.now.file.id() ].backbuf,
                   0, 0,
                   this.preload[ this.now.file.id() ].backbuf.videoWidth,
                   this.preload[ this.now.file.id() ].backbuf.videoHeight,
                   this.now.state.content_preview.x[fi],
                   this.now.state.content_preview.y[fi],
                   this.now.state.content_preview.frame_width,
                   this.now.state.content_preview.frame_height
                 );
    //console.log('0,0,'+this.state.content_width+','+this.state.content_height+' : '+this.state.frame_preview.x[fi]+','+this.state.frame_preview.y[fi]+','+this.state.frame_preview.fw+','+this.state.frame_preview.fh)
    this.now.state.content_preview.current_index = this.now.state.content_preview.current_index + 1;
    this._seqload_content_preview(); // keep loading remaining frames
  }
}

//
// content scrubber
//
_via_file_annotator.prototype._update_content_scrubber = function(t0, t1) {
  if ( typeof(t0) !== 'undefined' && typeof(t1) !== 'undefined' ) {
    this.now.state.content_scrubber.t0 = t0;
    this.now.state.content_scrubber.t1 = t1;
  }

  this._draw_content_scrubber(this.now.state.content_scrubber.t0,
                              this.now.state.content_scrubber.t1);
  this._update_content_preview();
}

_via_file_annotator.prototype._draw_content_scrubber = function(t0, t1) {
  //console.log('_draw_content_scrubber(): t0=' + t0 + ', t1=' + t1);
  var dt = t1 - t0;
  var unit, factor, tick_precision;
  if ( dt < 120 ) {
    unit = 'sec';
    factor = 1;
    tick_precision = 1;
  } else {
    if ( dt >= 120 && dt < 60*60) {
      unit = 'min';
      factor = 1 / 60;
      tick_precision = 2;
    } else {
      unit = 'hrs';
      factor = 1 / (60*60);
      tick_precision = 2;
    }
  }

  var c = this.preload[ this.now.file.id() ].ref.content_scrubber;
  var ctx = c.getContext('2d', { alpha:false });
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.beginPath();
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px sans';
  ctx.lineWidth = 1;

  var char_width = Math.floor(ctx.measureText('M').width);
  var canvas_width = c.width;

  // draw horizontal line
  var line_y = 4*char_width;
  var line_x0 = 0;
  var line_x1 = canvas_width;
  ctx.moveTo(line_x0, line_y);
  ctx.lineTo(line_x1, line_y);

  // draw ticks on horizontal line
  var tick_x, tick_y0, tick_y1, tstr;
  var N = 18;
  var step = canvas_width / N;
  for ( var i = 0; i < N; ++i ) {
    tick_x = Math.floor(i * step);
    tick_time = t0 + dt * (i/N);
    tick_y0 = line_y - 5;
    tick_y1 = line_y + 5;

    ctx.moveTo(tick_x, tick_y0);
    ctx.lineTo(tick_x, tick_y1);

    if ( i % 3 === 0 ) {
      tstr = String( (tick_time*factor).toFixed(tick_precision) );
      ctx.fillText(tstr, tick_x, line_y + 2*char_width);
    }
  }

  t0_str = String( (t0 * factor).toFixed(tick_precision) )
  ctx.fillText( t0_str, 0, line_y + 2*char_width );

  ctx.fillText( unit, 2, line_y - char_width );
  ctx.stroke();
}

_via_file_annotator.prototype._wheel_event_listener = function(e) {
  e.preventDefault();

  // perform zoom
  if ( e.shiftKey ) {
    if (e.deltaY < 0) {
      console.log('pan right');
      this.content_scrubber_pan_right();
    } else {
      console.log('pan left');
      this.content_scrubber_pan_left();
    }
  } else {
    var mouse_norm_x = e.offsetX / e.target.clientWidth;
    if (e.deltaY < 0) {
      console.log('zoom in');
      this.content_scrubber_zoom_in(mouse_norm_x);
    } else {
      console.log('zoom out');
      this.content_scrubber_zoom_out(mouse_norm_x);
    }
  }
}

_via_file_annotator.prototype.content_scrubber_pan_left = function() {
  if ( this.now.state.content_scrubber.t0 <= 0 ) {
    return;
  }
  var total_time = this.now.state.content_scrubber.t1 - this.now.state.content_scrubber.t0;
  var new_t0 = this.now.state.content_scrubber.t0 - total_time/6;
  var new_t1 = this.now.state.content_scrubber.t1 - total_time/6;
  if ( new_t0 < 0 ) {
    new_t0 = 0;
  }
  this._update_content_scrubber(new_t0, new_t1);
}

_via_file_annotator.prototype.content_scrubber_pan_right = function() {
  if ( this.now.state.content_scrubber.t1 >= this.preload[ this.now.file.id() ].ref.content_annotator.duration ) {
    return;
  }
  var total_time = this.now.state.content_scrubber.t1 - this.now.state.content_scrubber.t0;
  var new_t0 = this.now.state.content_scrubber.t0 + total_time/6;
  var new_t1 = this.now.state.content_scrubber.t1 + total_time/6;
  console.log('new: ' + new_t0 + ',' + new_t1)
  if ( new_t1 > this.preload[ this.now.file.id() ].ref.content_annotator.duration ) {
    new_t1 = this.preload[ this.now.file.id() ].ref.content_annotator.duration;
  }
  this._update_content_scrubber(new_t0, new_t1);
}

_via_file_annotator.prototype.content_scrubber_zoom_in = function(mouse_norm_x) {
  var total_time = this.now.state.content_scrubber.t1 - this.now.state.content_scrubber.t0;
  var anchor_time = this.now.state.content_scrubber.t0 + (mouse_norm_x * total_time);
  var dt = Math.min( mouse_norm_x, 1.0 - mouse_norm_x) * total_time;

  var new_t0 = anchor_time - dt;
  var new_t1 = anchor_time + dt;
  var new_total_time = (new_t1 - new_t0);
  if ( new_total_time <= 5 ) {
    console.log('Further zoom in not possible');
    return;
  }
  this._update_content_scrubber(new_t0, new_t1);
}

_via_file_annotator.prototype.content_scrubber_zoom_out = function(mouse_norm_x) {
  var total_time = this.now.state.content_scrubber.t1 - this.now.state.content_scrubber.t0;
  var anchor_time = this.now.state.content_scrubber.t0 + (mouse_norm_x * total_time);
  var dt = Math.max( mouse_norm_x, 1.0 - mouse_norm_x) * total_time;

  var new_t0 = anchor_time - total_time;
  var new_t1 = anchor_time + total_time;

  if ( new_t0 < 0 ) {
    new_t0 = 0;
  }
  if ( new_t1 > this.preload[ this.now.file.id() ].ref.content_annotator.duration ) {
    new_t1 = this.preload[ this.now.file.id() ].ref.content_annotator.duration;
  }

  this._update_content_scrubber(new_t0, new_t1);
}

//
// content segment annotator
//
_via_file_annotator.prototype._update_segment_annotator = function(file) {
}

//
// Public Interface
// i.e. _via_file_annotator interacts with outside words using these methods
//

_via_file_annotator.prototype.get_current_view = function() {
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
  this.now.panel = {};
  this.now.state = {};
  for ( var fid in this.preload ) {
    if ( this.preload[fid].view.style.display === 'none' ) {
      if ( fid === this.now.file.id() ) {
        this.preload[ this.now.file.id() ].view.style.display = 'block';
        this._init_all_panels();
        this._update_all_panels();
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
