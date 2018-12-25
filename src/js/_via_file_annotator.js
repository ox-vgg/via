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
    this.preload[ file.id() ].backbuf.addEventListener('canplaythrough', function() {
      this.preload[ file.id() ].backbuf.pause();
      console.log('backbuffer active');
    }.bind(this));

    //// initialize content preview
    this.preload[ file.id() ].ref.content_preview = document.createElement('canvas');

    //// initialize content scrubber
    this.preload[ file.id() ].ref.content_scrubber = document.createElement('canvas');

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
  this._reset_panel_content_range();

  console.log('_init_all_panels()');
  this._init_content_preview();
  console.log('_init_all_panels() end0');
  //this._init_content_scrubber();
  //this._init_segment_annotator();
  console.log('_init_all_panels() end1');
  console.log('_init_all_panels() end2');
}

_via_file_annotator.prototype._init_content_preview = function() {
  this.now.state.content_preview = { 'time':[], 'x':[], 'y':[] };
  console.log('_init_content_preview()');
  var c = this.preload[ this.now.file.id() ].ref.content_preview;
  c.width  = this.preload[ this.now.file.id() ].cref.content_preview.clientWidth;
  c.height = this.preload[ this.now.file.id() ].cref.content_preview.clientHeight;
  var ctx = c.getContext('2d', { alpha:false });
  ctx.beginPath();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;

  var char_width = Math.floor(ctx.measureText('M').width);
  var frame_spacing = char_width;
  var aspect_ratio = this.preload[ this.now.file.id() ].backbuf.videoHeight / this.preload[ this.now.file.id() ].backbuf.videoWidth;
  var frame_count = 10;
  var canvas_width = c.width;
  var frame_width  = Math.floor( (canvas_width - (frame_count - 1) * frame_spacing) / frame_count );
  var frame_height = Math.floor( frame_width * aspect_ratio );
  // @todo: what happens if frame_height > c.height

  var frame_y = 0;
  var frame_x, frame_center_x, frame_time;
  for ( var i = 0; i < frame_count; ++i ) {
    frame_x = i * ( frame_spacing + frame_width );
    frame_center_x = frame_x + (frame_width/2);
    frame_time = Number.parseFloat(this.now.state.tend * frame_center_x / c.width).toFixed(6);
    if ( (frame_x + frame_width) <= canvas_width ) {
      this.now.state.content_preview.time[i] = frame_time;
      this.now.state.content_preview.x[i]    = frame_x;
      this.now.state.content_preview.y[i]    = frame_y;
      console.log(frame_x+','+frame_y+','+frame_width+','+frame_height)
      ctx.rect(frame_x, frame_y, frame_width, frame_height);
    } else {
      break;
    }
  }
  this.now.state.content_preview.frame_width  = frame_width;
  this.now.state.content_preview.frame_height = frame_height;
  ctx.stroke();
}

_via_file_annotator.prototype._update_all_panels = function() {
  console.log('_update_all_panels()');
  this._update_content_preview();
  //this._update_content_scrubber();
  //this._update_segment_annotator();
}

_via_file_annotator.prototype._reset_panel_content_range = function() {
  switch( this.now.file.type ) {
  case _via_file.prototype.FILE_TYPE.VIDEO:
    var duration = this.preload[ this.now.file.id() ].ref.content_annotator.duration;
    if ( isNaN(duration) || !Number.isFinite(duration) ) {
      console.log('_via_file_annotator._reset_panel_content_range() : ' +
                  'Unable to determine duration of video at ' +
                  '[' + this.now.file.uri + ']');
      return;
    }
    this.now.state.tstart = 0;
    this.now.state.tend = duration;
    break;
  case _via_file.prototype.FILE_TYPE.AUDIO:
    console.log('_via_file_annotator._reset_panel_content_range() : ' +
                'not implemented');
    break;
  case _via_file.prototype.FILE_TYPE.IMAGE:
    console.log('_via_file_annotator._reset_panel_content_range() : ' +
                'not implemented');
    break;
  default:
    return;
  }
}

_via_file_annotator.prototype._set_panel_content_range = function(start, end) {
  this.now.state = { 'tstart':start, 'tend':end };

}

//
// content preview
//

_via_file_annotator.prototype._update_content_preview = function() {
  console.log('_update_content_preview()');
  // trigger loading of frame_preview panel
  this.now.state.content_preview.load_ongoing = true;
  this.now.state.content_preview.current_index = 0;
  this.preload[ this.now.file.id() ].backbuf.addEventListener('seeked', this._backbuf_on_seek_done.bind(this));
  this._seqload_content_preview();
}

_via_file_annotator.prototype._seqload_content_preview = function() {
  console.log('_seqload_content_preview');
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
_via_file_annotator.prototype._update_content_scrubber = function(file) {
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
        console.log('a')
        this._init_all_panels();
        console.log('b')
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
