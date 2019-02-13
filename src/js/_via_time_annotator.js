/**
 * @class
 * @classdesc Marks time segments of a {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement|HTMLMediaElement}
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 22 Jan. 2019
 * @fires _via_time_annotator#segment_add
 * @fires _via_time_annotator#segment_del
 * @fires _via_time_annotator#segment_edit
 * @param {Element} container HTML container element like <div>
 * @param {HTMLMediaElement} media_element HTML video of audio
 */

'use strict';

function _via_time_annotator(container, file, data, media_element) {
  this.c = container;
  this.file = file;
  this.d = data;
  this.m = media_element;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_time_annotator_';
  _via_event.call( this );

  if ( ! this.m instanceof HTMLMediaElement ) {
    throw 'media element must be an instance of HTMLMediaElement!';
  }
}

_via_time_annotator.prototype._init = function() {
  try {
    this.thumbnail_container = document.createElement('div');
    this.thumbnail_container.setAttribute('id', 'thumbnail_container');
    this.thumbnail_container.setAttribute('style', 'display:none; position:absolute; top:0; left:0;');
    this.c.appendChild(this.thumbnail_container);

    this.thumbnail = new _via_video_thumbnail(this.file);
    this.thumbnail.start();
    this._vtimeline_init();
  } catch(err) {
    console.log(err)
  }
  /*
  this.full_timeline = document.createElement('canvas');
  this.preview_container.classList.add('preview_container');

  this.segmenter_container = document.createElement('div');
  this.segmenter_container.classList.add('segmenter_container');
  this._init_video_timeline(this.segmenter_container);

  this.c.appendChild(this.preview_container);
  this.c.appendChild(this.segmenter_container);
*/
}

//
// full timeline
//
_via_time_annotator.prototype._vtimeline_time2canvas = function(t) {
  return Math.floor( ( ( this.timelinew * t ) / this.m.duration ) + this.padx );
}

_via_time_annotator.prototype._vtimeline_canvas2time = function(x) {
  var t = ( ( x - this.padx ) / this.timelinew ) * this.m.duration;
  return Math.max(0, Math.min(t, this.m.duration) );
}

_via_time_annotator.prototype._vtimeline_time2str = function(t) {
  var hh = Math.floor(t / 3600);
  var mm = Math.floor( (t - hh * 3600) / 60 );
  var ss = Math.round( t - hh*3600 - mm*60 );
  if ( hh < 10 ) {
    hh = '0' + hh;
  }
  if ( mm < 10 ) {
    mm = '0' + mm;
  }
  if ( ss < 10 ) {
    ss = '0' + ss;
  }
  return hh + ':' + mm + ':' + ss;
}

_via_time_annotator.prototype._vtimeline_time2strms = function(t) {
  var hh = Math.floor(t / 3600);
  var mm = Math.floor( (t - hh * 3600) / 60 );
  var ss = Math.floor( t - hh*3600 - mm*60 );
  var ms = Math.floor( (t - Math.floor(t) ) * 1000 );
  if ( hh < 10 ) {
    hh = '0' + hh;
  }
  if ( mm < 10 ) {
    mm = '0' + mm;
  }
  if ( ss < 10 ) {
    ss = '0' + ss;
  }
  if ( ms < 100 ) {
    ms = '0' + ms;
  }
  return hh + ':' + mm + ':' + ss + '.' + ms;
}


_via_time_annotator.prototype._vtimeline_init = function() {
  //// video timeline
  this.vtimeline = document.createElement('canvas');
  this.vtimeline.setAttribute('id', 'video_timeline');
  this.vtimeline.style.cursor = 'pointer';
  this.vtimeline.addEventListener('mousedown', this._vtimeline_on_mousedown.bind(this));
  this.vtimeline.addEventListener('mousemove', this._vtimeline_on_mousemove.bind(this));
  this.vtimeline.addEventListener('mouseout', this._vtimeline_on_mouseout.bind(this));

  var ctx = this.vtimeline.getContext('2d', {alpha:false});
  ctx.font = '10px Sans';
  this.char_width = ctx.measureText('M').width;
  this.vtimeline.width = this.c.clientWidth;
  this.vtimeline.height = Math.floor(2*this.char_width);
  this.padx = this.char_width;
  this.pady = this.char_width;
  this.lineh = this.char_width;
  this.lineh2 = Math.floor(2*this.char_width);
  this.linehb2 = Math.floor(this.char_width/2);
  this.timelinew = Math.floor(this.vtimeline.width - this.padx);

  // clear
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, this.vtimeline.width, this.vtimeline.height);

  // draw line
  ctx.strokeStyle = '#707070';
  ctx.fillStyle = '#909090';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(this.padx, this.lineh2 - 1);
  ctx.lineTo(this.timelinew, this.lineh2 - 1);
  ctx.stroke();

  // draw time gratings and corresponding label
  var start = this.padx;
  var end = this.timelinew - this.padx;
  var time;
  ctx.beginPath();
  for ( ; start <= end; start = start + 10*this.char_width ) {
    ctx.moveTo(start, this.lineh+2);
    ctx.lineTo(start, this.lineh2);

    time = this._vtimeline_canvas2time(start);
    ctx.fillText(this._vtimeline_time2str(time), start, this.lineh);
  }
  ctx.stroke();

  //// timeline mark showing the current video time
  this.vtimeline_mark = document.createElement('canvas');
  this.vtimeline_mark.setAttribute('id', 'video_timeline_mark');
  this.vtimeline_mark_ctx = this.vtimeline_mark.getContext('2d', {alpha:false});
  this.vtimeline_mark.width = this.vtimeline.width;
  this.vtimeline_mark.height = this.lineh2;

  this.c.appendChild(this.vtimeline);
  this.c.appendChild(this.vtimeline_mark);

  this._vtimeline_mark_draw();
}

_via_time_annotator.prototype._vtimeline_mark_draw = function() {
  var time = this.m.currentTime;
  var cx = this._vtimeline_time2canvas(time);

  // clear
  this.vtimeline_mark_ctx.font = '12px Sans';
  this.vtimeline_mark_ctx.fillStyle = '#ffffff';
  this.vtimeline_mark_ctx.fillRect(0, 0,
                                   this.vtimeline_mark.width,
                                   this.vtimeline_mark.height);

  // draw arrow
  this.vtimeline_mark_ctx.fillStyle = 'red';
  this.vtimeline_mark_ctx.beginPath();
  this.vtimeline_mark_ctx.moveTo(cx, 0);
  this.vtimeline_mark_ctx.lineTo(cx - this.linehb2, this.lineh);
  this.vtimeline_mark_ctx.lineTo(cx + this.linehb2, this.lineh);
  this.vtimeline_mark_ctx.moveTo(cx, 0);
  this.vtimeline_mark_ctx.fill();

  // draw current time
  this.vtimeline_mark_ctx.fillText(this._vtimeline_time2strms(time),
                                   cx + this.lineh, this.lineh + 2);

  window.requestAnimationFrame(this._vtimeline_mark_draw.bind(this))
}

_via_time_annotator.prototype._vtimeline_on_mousedown = function(e) {
  var canvas_x = e.offsetX;
  var time = this._vtimeline_canvas2time(canvas_x);
  this.m.currentTime = time;
}

_via_time_annotator.prototype._vtimeline_on_mousemove = function(e) {
  var canvas_x = e.offsetX;
  var time = this._vtimeline_canvas2time(canvas_x);
  this.thumbnail_container.innerHTML = '';
  this.thumbnail_container.appendChild(this.thumbnail.get_thumbnail(time));
  this.thumbnail_container.style.display = 'inline-block';
  this.thumbnail_container.style.left = e.offsetX + 'px';
  this.thumbnail_container.style.top  = e.offsetY + this.lineh2 + 'px';
}

_via_time_annotator.prototype._vtimeline_on_mouseout = function(e) {
  this.thumbnail_container.style.display = 'none';
}
