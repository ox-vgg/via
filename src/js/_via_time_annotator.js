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

  // constants
  this.METADATA_COLOR_LIST = ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7"];
  this.PLAYBACK_MODE = { NORMAL:'1', REVIEW:'2', ANNOTATION:'3' };
  this.MODE = { TEMPORAL_SEGMENTATION:'1', METADATA_EDIT:'2' };

  this.DEFAULT_TEMPORAL_SEG_LEN = 1.0; // in sec
  this.EDGE_UPDATE_TIME_DELTA = 1/50;  // in sec

  // state
  this.tseg_timeline_tstart = -1; // boundary of current timeline visible in temporal seg.
  this.tseg_timeline_tend   = -1;
  this.tseg_metadata_mid_list = [];
  this.tseg_metadata_time_list = [];
  this.tseg_metadata_sel_mindex = -1; // metadata index in this.tseg_metadata_mid_list
  this.tseg_metadata_sel_bindex = -1; // 0=>left boundary, 1=>right boundary
  this.tseg_metadata_sel_show_time_bindex = -1;
  this.tseg_metadata_sel_show_aindex = -1;
  this.tseg_is_metadata_resize_ongoing = false;
  this.tseg_is_metadata_selected = false;

  this.current_playback_mode = this.PLAYBACK_MODE.NORMAL;
  this.tseg_current_mode = this.MODE.TEMPORAL_SEGMENTATION;
}

_via_time_annotator.prototype._init = function() {
  try {
    this.thumbnail_container = document.createElement('div');
    this.thumbnail_container.setAttribute('class', 'thumbnail_container');
    this.thumbnail_container.setAttribute('style', 'display:none; position:absolute; top:0; left:0;');
    this.c.appendChild(this.thumbnail_container);

    // by default, show the first attribute's value
    if ( this.d.aid_list.length ) {
      this.tseg_metadata_sel_show_aindex = this.d.aid_list[0];
    }

    try {
      this.thumbnail = new _via_video_thumbnail(this.file);
      this.thumbnail.start();
      this._vtimeline_init();
      this._tseg_init();
      this._toolbar_init();
    } catch(err) {
      console.log(err)
    }
  } catch(err) {
    console.log(err)
  }
}

//
// toolbar
//
_via_time_annotator.prototype._toolbar_init = function() {
  var toolbar_container = document.createElement('div');
  toolbar_container.setAttribute('class', 'toolbar_container');
  toolbar_container.addEventListener('focus', function(e) {
    this.blur();
  });

  var pb_mode_container = document.createElement('div');
  var pb_mode_label = document.createElement('span');
  pb_mode_label.innerHTML = 'Playback Mode:';
  pb_mode_container.appendChild(pb_mode_label);

  var pb_normal = document.createElement('input');
  pb_normal.setAttribute('type', 'radio');
  pb_normal.setAttribute('id', 'playback_mode_normal');
  pb_normal.setAttribute('name', 'via_time_annotator_playback_mode');
  pb_normal.setAttribute('value', this.PLAYBACK_MODE.NORMAL);
  pb_normal.setAttribute('checked', '');
  pb_normal.addEventListener('change', this._toolbar_playback_mode_on_change.bind(this));
  pb_mode_container.appendChild(pb_normal);
  var pb_normal_label = document.createElement('label');
  pb_normal_label.setAttribute('for', 'playback_mode_normal');
  pb_normal_label.innerHTML = 'Normal';
  pb_mode_container.appendChild(pb_normal_label);

  var pb_review = document.createElement('input');
  pb_review.setAttribute('type', 'radio');
  pb_review.setAttribute('id', 'playback_mode_review');
  pb_review.setAttribute('name', 'via_time_annotator_playback_mode');
  pb_review.setAttribute('value', this.PLAYBACK_MODE.REVIEW);
  pb_review.addEventListener('change', this._toolbar_playback_mode_on_change.bind(this));
  pb_mode_container.appendChild(pb_review);
  var pb_review_label = document.createElement('label');
  pb_review_label.setAttribute('for', 'playback_mode_review');
  pb_review_label.innerHTML = 'Review';
  pb_mode_container.appendChild(pb_review_label);

  var pb_annotation = document.createElement('input');
  pb_annotation.setAttribute('type', 'radio');
  pb_annotation.setAttribute('id', 'playback_mode_annotation');
  pb_annotation.setAttribute('name', 'via_time_annotator_playback_mode');
  pb_annotation.setAttribute('value', this.PLAYBACK_MODE.ANNOTATION);
  pb_annotation.addEventListener('change', this._toolbar_playback_mode_on_change.bind(this));
  pb_mode_container.appendChild(pb_annotation);
  var pb_annotation_label = document.createElement('label');
  pb_annotation_label.setAttribute('for', 'playback_mode_annotation');
  pb_annotation_label.innerHTML = 'Annotation';
  pb_mode_container.appendChild(pb_annotation_label);

  toolbar_container.appendChild(pb_mode_container);
  this.c.appendChild(toolbar_container);
}

_via_time_annotator.prototype._toolbar_playback_mode_on_change = function(e) {
  this.current_playback_mode = e.target.value;
  if ( this.current_playback_mode === this.PLAYBACK_MODE.NORMAL ) {
    this._tseg_set_playback_rate(1);
  }
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

_via_time_annotator.prototype._vtimeline_time2ssms = function(t) {
  var hh = Math.floor(t / 3600);
  var mm = Math.floor( (t - hh * 3600) / 60 );
  var ss = Math.floor( t - hh*3600 - mm*60 );
  var ms = Math.floor( (t - Math.floor(t) ) * 1000 );
  return ss + '.' + ms;
}

_via_time_annotator.prototype._vtimeline_playbackrate2str = function(t) {
  return this.m.playbackRate + 'X';
}

//
// Video Timeline
//
_via_time_annotator.prototype._vtimeline_init = function() {
  //// video timeline
  this.vtimeline = document.createElement('canvas');
  this.vtimeline.setAttribute('class', 'video_timeline');
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
  this.timelinew = Math.floor(this.vtimeline.width - 2*this.padx);

  // clear
  ctx.fillStyle = '#ffffff';
  ctx.clearRect(0, 0, this.vtimeline.width, this.vtimeline.height);
  ctx.fillRect(0, 0, this.vtimeline.width, this.vtimeline.height);

  // draw line
  ctx.strokeStyle = '#999999';
  ctx.fillStyle = '#999999';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(this.padx, 1);
  ctx.lineTo(this.padx + this.timelinew, 1);
  ctx.stroke();

  // draw time gratings and corresponding label
  var start = this.padx;
  var end = this.timelinew - this.padx;
  var time;
  ctx.beginPath();
  for ( ; start <= end; start = start + 10*this.char_width ) {
    ctx.moveTo(start, 1);
    ctx.lineTo(start, this.lineh - 1);

    time = this._vtimeline_canvas2time(start);
    ctx.fillText(this._vtimeline_time2str(time), start, this.lineh2 - 1);
  }
  ctx.stroke();

  //// timeline mark showing the current video time
  this.vtimeline_mark = document.createElement('canvas');
  this.vtimeline_mark.setAttribute('class', 'video_timeline_mark');
  this.vtimeline_mark_ctx = this.vtimeline_mark.getContext('2d', {alpha:false});
  this.vtimeline_mark.width = this.vtimeline.width;
  this.vtimeline_mark.height = this.lineh2;

  this.c.appendChild(this.vtimeline_mark);
  this.c.appendChild(this.vtimeline);

  this._vtimeline_mark_draw();
}

_via_time_annotator.prototype._vtimeline_mark_draw = function() {
  var time = this.m.currentTime;
  var cx = this._vtimeline_time2canvas(time);

  // clear
  this.vtimeline_mark_ctx.font = '16px Mono';
  this.vtimeline_mark_ctx.fillStyle = 'white';
  this.vtimeline_mark_ctx.fillRect(0, 0,
                                   this.vtimeline_mark.width,
                                   this.vtimeline_mark.height);

  // draw arrow
  this.vtimeline_mark_ctx.fillStyle = 'red';
  this.vtimeline_mark_ctx.beginPath();
  this.vtimeline_mark_ctx.moveTo(cx, this.lineh2);
  this.vtimeline_mark_ctx.lineTo(cx - this.linehb2, this.lineh);
  this.vtimeline_mark_ctx.lineTo(cx + this.linehb2, this.lineh);
  this.vtimeline_mark_ctx.moveTo(cx, this.lineh2);
  this.vtimeline_mark_ctx.fill();

  // draw current time
  this.vtimeline_mark_ctx.fillStyle = '#666666';
  var label =  + ' speed=' + this.m.playbackRate + 'X ]';
  this.vtimeline_mark_ctx.fillText(this._vtimeline_time2strms(time),
                                   cx + this.lineh, this.lineh2 - 2);

  // show playback rate
  var rate = this.m.playbackRate.toFixed(1) + 'X';
  this.vtimeline_mark_ctx.fillText(rate,
                                   this.timelinew - this.lineh4, this.lineh2 - 2);


  window.requestAnimationFrame(this._vtimeline_mark_draw.bind(this))
}

_via_time_annotator.prototype._vtimeline_on_mousedown = function(e) {
  var canvas_x = e.offsetX;
  var time = this._vtimeline_canvas2time(canvas_x);
  console.log(canvas_x + ':' + time)
  this.m.currentTime = time;
}

_via_time_annotator.prototype._vtimeline_on_mousemove = function(e) {
  var time = this._vtimeline_canvas2time(e.offsetX);
  this._thumbnail_show(time, e.offsetX, e.offsetY);
}

_via_time_annotator.prototype._vtimeline_on_mouseout = function(e) {
  this._thumbnail_hide();
}

//
// Thumbnail
//
_via_time_annotator.prototype._thumbnail_show = function(time, x, y) {
  this.thumbnail_container.innerHTML = '';
  this.thumbnail_container.appendChild(this.thumbnail.get_thumbnail(time));
  this.thumbnail_container.style.display = 'inline-block';

  this.thumbnail_container.style.left = x + this.lineh2 + 'px';
  this.thumbnail_container.style.top  = y + this.lineh4 + 'px';
}

_via_time_annotator.prototype._thumbnail_hide = function(t) {
  this.thumbnail_container.style.display = 'none';
}

//
// Temporal Segmenter (tseg)
//
_via_time_annotator.prototype._tseg_init = function() {
  this.tseg_container = document.createElement('div');
  this.tseg_container.setAttribute('class', 'tseg_container');
  this.c.appendChild(this.tseg_container);

  this.tseg_container_width = this.tseg_container.clientWidth;
  this.tseg_container_height = Math.floor(this.char_width * 10);

  this.tseg_metadata_panel = document.createElement('div');
  this.tseg_metadata_panel.setAttribute('class', 'metadata_panel');
  this.tseg_metadata_panel.style.display = 'none';
  this.tseg_container.appendChild(this.tseg_metadata_panel);

  this.tseg = document.createElement('canvas');
  this.tseg.addEventListener('mousemove', this._tseg_on_mousemove.bind(this));
  this.tseg.addEventListener('mousedown', this._tseg_on_mousedown.bind(this));
  this.tseg.addEventListener('mouseup', this._tseg_on_mouseup.bind(this));

  var duration = this.m.duration;
  var width_per_sec = this.linehb2;
  this.tseg.width = this.tseg_container_width;
  this.tseg.height = this.tseg_container_height;
  this.tseg_timelinew = Math.floor(this.tseg.width - 2*this.padx);
  this.tseg_timelinewb2 = Math.floor(this.tseg_timelinew/2);
  this.tseg_mid = Math.floor(this.padx + this.tseg_timelinew/2);
  this.tseg_width_per_sec = Math.floor(6*this.char_width);
  this.tsegctx = this.tseg.getContext('2d', { alpha:false });
  this.lineh3 = Math.floor(this.char_width * 3);
  this.lineh4 = Math.floor(this.char_width * 4);
  this.lineh5 = Math.floor(this.char_width * 5);
  this.lineh6 = Math.floor(this.char_width * 6);
  this.lineh7 = Math.floor(this.char_width * 7);
  this.lineh8 = Math.floor(this.char_width * 8);
  this.lineh9 = Math.floor(this.char_width * 9);
  this.lineh10 = Math.floor(this.char_width * 10);
  this.tseg_container.appendChild(this.tseg);

  this._tseg_timeline_update_boundary();
  this._tseg_update();
}

_via_time_annotator.prototype._video_current_time_has_metadata = function() {
  var t = this.m.currentTime;
  var n = this.tseg_metadata_time_list.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    if ( t >= this.tseg_metadata_time_list[i][0] &&
         t <= this.tseg_metadata_time_list[i][1] ) {
      return i;
    }
  }
  return -1;
}

_via_time_annotator.prototype._tseg_set_playback_rate = function(rate) {
  if ( this.m.playbackRate !== rate ) {
    this.m.playbackRate = rate;
  }
}

_via_time_annotator.prototype._tseg_update = function() {
  // speed up video when inside metadata
  if ( this.current_playback_mode !== this.PLAYBACK_MODE.NORMAL ) {
    var mindex = this._video_current_time_has_metadata();
    if ( mindex !== -1 ) {
      if ( this.current_playback_mode === this.PLAYBACK_MODE.REVIEW ) {
        this._tseg_set_playback_rate(1);
      } else {
        this._tseg_set_playback_rate(10);
      }
    } else {
      if ( this.current_playback_mode === this.PLAYBACK_MODE.ANNOTATION ) {
        this._tseg_set_playback_rate(1);
      } else {
        this._tseg_set_playback_rate(10);
      }
    }
  }

  this._tseg_clear();

  if ( this.m.currentTime < this.tseg_timeline_tstart ||
       this.m.currentTime > this.tseg_timeline_tend
     ) {
    this._tseg_timeline_update_boundary();
    this._tseg_metadata_unselect();
    this._tseg_metadata_panel_hide();
    this._tseg_mode_switch(this.MODE.TEMPORAL_SEGMENTATION);
  }

  if ( this.tseg_is_metadata_selected ) {
    if ( ! this.m.paused ) {
      if ( this.m.currentTime > this.tseg_metadata_time_list[ this.tseg_metadata_sel_mindex ][1] ) {
        this.m.currentTime = this.tseg_metadata_time_list[ this.tseg_metadata_sel_mindex ][0];
      }
      if ( this.m.currentTime < this.tseg_metadata_time_list[ this.tseg_metadata_sel_mindex ][0] ) {
        this.m.currentTime = this.tseg_metadata_time_list[ this.tseg_metadata_sel_mindex ][0];
      }
    }
  }

  this._tseg_timeline_drawtick();
  this._tseg_timeline_drawtime();
  this._tseg_metadata_draw_container();
  this._tseg_metadata_draw_seg();
  this._tseg_marknow_draw();

  window.requestAnimationFrame(this._tseg_update.bind(this));
}

_via_time_annotator.prototype._tseg_timeline_update_boundary = function() {
  this.tseg_timeline_tstart = this.m.currentTime;
  var dt = this.tseg_timelinew / this.tseg_width_per_sec;
  this.tseg_timeline_tend = this.tseg_timeline_tstart + dt;

  this._tseg_timeline_update_metadata();
}

_via_time_annotator.prototype._tseg_timeline_update_metadata = function() {
  // gather all the metadata contained in this time range
  this.tseg_metadata_mid_list = [];
  this.tseg_metadata_time_list = [];
  var fid = this.file.fid;
  var mid, tn, t0, t1;
  for ( mid in this.d.metadata_store[fid] ) {
    tn = this.d.metadata_store[fid][mid].z.length;
    if ( tn ) {
      var i;
      for ( i = 0; i < tn; i = i+2 ) {
        t0 = this.d.metadata_store[fid][mid].z[i];
        t1 = this.d.metadata_store[fid][mid].z[i+1];
        if ( t0 >= this.tseg_timeline_tstart &&
             t1 <= this.tseg_timeline_tend
           ) {
          this.tseg_metadata_mid_list.push(mid);
          this.tseg_metadata_time_list.push([t0, t1]);
        }
      }
    }
  }
}

_via_time_annotator.prototype._tseg_clear = function() {
  this.tsegctx.fillStyle = '#f6f6f6';
  this.tsegctx.clearRect(0, 0, this.tseg.width, this.tseg.height);
  this.tsegctx.fillRect(0, 0, this.tseg.width, this.tseg.height);
}

_via_time_annotator.prototype._tseg_marknow_draw = function() {
  var tnow = this.m.currentTime;
  var markx = this._tseg_timeline_time2canvas(tnow);

  // draw vertical line indicating current time
  this.tsegctx.strokeStyle = 'red';
  this.tsegctx.lineWidth = 1;
  this.tsegctx.beginPath();
  this.tsegctx.moveTo(markx, 1);
  this.tsegctx.lineTo(markx, this.tseg.height - 1);
  this.tsegctx.stroke();
}

_via_time_annotator.prototype._tseg_timeline_drawtick = function() {
  var tnow = this.m.currentTime;

  // draw line
  this.tsegctx.strokeStyle = '#707070';
  this.tsegctx.fillStyle = '#707070';
  this.tsegctx.lineWidth = 1;
  this.tsegctx.beginPath();
  this.tsegctx.moveTo(this.padx, this.lineh3);
  this.tsegctx.lineTo(this.padx + this.tseg_timelinew, this.lineh3);
  this.tsegctx.stroke();

  // draw ticks
  var start = this.padx;
  var end = start + this.tseg_timelinew;
  if ( this.tseg_timeline_tstart !== 0 ) {
    start = start + this.tseg_width_per_sec;
  }
  var t = this.tseg_timeline_tstart;
  this.tsegctx.strokeStyle = '#707070';
  this.tsegctx.beginPath();
  for ( ; start <= end; start = start + this.tseg_width_per_sec ) {
    this.tsegctx.moveTo(start, this.lineh2);
    this.tsegctx.lineTo(start, this.lineh3);
    t = t + 1;
    if ( t >= this.m.duration ) {
      break;
    }
  }
  this.tsegctx.stroke();
}

_via_time_annotator.prototype._tseg_timeline_drawtime = function() {
  this.tsegctx.fillStyle = '#707070';
  this.tsegctx.font = '10px Sans';
  var t = this.tseg_timeline_tstart;
  var start = this.padx;
  var end = start + this.tseg_timelinew - this.tseg_width_per_sec;
  for ( ; start <= end; start = start + this.tseg_width_per_sec ) {
    this.tsegctx.fillText(this._vtimeline_time2str(t), start, this.lineh2 );
    t = t + 1;
    if ( t > this.m.duration ) {
      break;
    }
  }
}

_via_time_annotator.prototype._tseg_metadata_draw_container = function() {
  // draw line
  this.tsegctx.strokeStyle = '#707070';
  this.tsegctx.fillStyle = '#707070';
  this.tsegctx.lineWidth = 1;
  this.tsegctx.beginPath();
  this.tsegctx.moveTo(this.padx, this.lineh5);
  this.tsegctx.lineTo(this.padx + this.tseg_timelinew, this.lineh5);
  this.tsegctx.lineTo(this.padx + this.tseg_timelinew, this.lineh7);
  this.tsegctx.lineTo(this.padx, this.lineh7);
  this.tsegctx.lineTo(this.padx, this.lineh5);
  this.tsegctx.stroke();
}

_via_time_annotator.prototype._tseg_metadata_draw_seg_i = function(i) {
  var color = this.METADATA_COLOR_LIST[ i % this.METADATA_COLOR_LIST.length ];
  var left  = this._tseg_timeline_time2canvas(this.tseg_metadata_time_list[i][0]);
  var right = this._tseg_timeline_time2canvas(this.tseg_metadata_time_list[i][1]);
  var label = this.tseg_metadata_mid_list[i]

  // fill metadata boundary
  this.tsegctx.beginPath();
  this.tsegctx.moveTo(left, this.lineh5 + 1);
  this.tsegctx.lineTo(right, this.lineh5 + 1);
  this.tsegctx.lineTo(right, this.lineh7 - 1);
  this.tsegctx.lineTo(left, this.lineh7 - 1);
  this.tsegctx.lineTo(left, this.lineh5 + 1);
  this.tsegctx.fillStyle = color;
  this.tsegctx.fill();

  if ( this.tseg_is_metadata_selected &&
       this.tseg_metadata_sel_mindex === i
     ) {
    this.tsegctx.fillStyle = '#000000';
    this.tsegctx.strokeStyle = '#000000';
    this.tsegctx.lineWidth = 1;
    this.tsegctx.beginPath();
    this.tsegctx.moveTo(left, this.lineh6);
    this.tsegctx.lineTo(left + this.linehb2, this.lineh6 - this.linehb2);
    this.tsegctx.lineTo(left + this.linehb2, this.lineh6 + this.linehb2);
    this.tsegctx.lineTo(left, this.lineh6);
    this.tsegctx.lineTo(right, this.lineh6);
    this.tsegctx.lineTo(right - this.linehb2, this.lineh6 - this.linehb2);
    this.tsegctx.lineTo(right - this.linehb2, this.lineh6 + this.linehb2);
    this.tsegctx.lineTo(right, this.lineh6);
    this.tsegctx.stroke();
    this.tsegctx.fill();

    if ( this.tseg_metadata_sel_show_time_bindex !== -1 ) {
      this.tsegctx.font = '10px Sans';
      this.tsegctx.fillStyle = '#707070';
      var bindex = this.tseg_metadata_sel_show_time_bindex;
      var time_str = this._vtimeline_time2ssms(this.tseg_metadata_time_list[i][bindex]);
      if ( bindex === 0 ) {
        this.tsegctx.fillText(time_str, left + 1, this.lineh5 - 2);
      } else {
        var twidth = this.tsegctx.measureText(time_str).width
        this.tsegctx.fillText(time_str, right - twidth, this.lineh5 - 2);
      }
    }
  }

  if ( this.tseg_metadata_sel_show_aindex !== -1 ) {
    var mid = this.tseg_metadata_mid_list[i];
    var aid = this.d.aid_list[ this.tseg_metadata_sel_show_aindex ];
    var label = this.d.metadata_store[this.file.fid][mid].metadata[aid]
    this.tsegctx.fillStyle = '#000000';
    this.tsegctx.fillText(label, left + 1, this.lineh8 + 3);
  }
}

_via_time_annotator.prototype._tseg_metadata_draw_seg = function() {
  this.tsegctx.strokeStyle = '#707070';
  this.tsegctx.font = '12px Sans';
  this.tsegctx.lineWidth = 1;

  // first draw all the non-selected temporal segments
  var n = this.tseg_metadata_time_list.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    if ( i !== this.tseg_metadata_sel_mindex ) {
      this._tseg_metadata_draw_seg_i(i);
    }
  }

  // now draw the selected segment (if any)
  if ( this.tseg_is_metadata_selected ) {
    this._tseg_metadata_draw_seg_i( this.tseg_metadata_sel_mindex );
  }
}

//
// tseg input handlers
//
_via_time_annotator.prototype._tseg_timeline_canvas2time = function(x) {
  var T = this.tseg_timeline_tend - this.tseg_timeline_tstart;
  var dx = x - this.padx;
  return this.tseg_timeline_tstart + ((T * dx) / this.tseg_timelinew);
}

_via_time_annotator.prototype._tseg_timeline_time2canvas = function(t) {
  if ( t < this.tseg_timeline_tstart || t > this.tseg_timeline_tend ) {
    return -1;
  }
  var dt = this.tseg_timeline_tend - this.tseg_timeline_tstart;
  return Math.floor(this.padx + (this.tseg_timelinew / dt) * (t - this.tseg_timeline_tstart));
}

_via_time_annotator.prototype._tseg_time_to_metadata_index = function(t) {
  var n = this.tseg_metadata_time_list.length;
  var i, dt0, dt1;
  for ( i = 0; i < n; ++i ) {
    dt0 = Math.abs(t - this.tseg_metadata_time_list[i][0]);
    dt1 = Math.abs(t - this.tseg_metadata_time_list[i][1]);
    if ( dt0 < 0.1 || dt1 < 0.1 ) {
      // on boundary
      if ( dt0 < 0.1 ) {
        return [i, 0]; // left boundary
      } else {
        return [i, 1]; // right boundary
      }
    } else {
      if ( t > this.tseg_metadata_time_list[i][0] &&
           t < this.tseg_metadata_time_list[i][1]
         ) {
        return [i, -1];
      }
    }
  }
  return [-1, -1];
}

_via_time_annotator.prototype._tseg_on_mousemove = function(e) {
  // timeline
  if ( e.offsetY <= this.lineh3 ) {
    this.tseg.style.cursor = 'pointer';
    //var time = this._vtimeline_canvas2time(e.offsetX);
    //this._thumbnail_show(time, e.offsetX, e.offsetY);
    return;
  }

  // metadata
  if ( e.offsetY >= this.lineh5 && e.offsetY <= this.lineh7) {
    var t = this._tseg_timeline_canvas2time(e.offsetX);
    var mindex = this._tseg_time_to_metadata_index(t);
    if ( mindex[0] !== -1 ) {
      if ( mindex[1] !== -1 ) {
        this.tseg.style.cursor = 'ew-resize';
      } else {
        this.tseg.style.cursor = 'pointer';
      }
    } else {
      this.tseg.style.cursor = 'cell';
    }
    return;
  }

  this.tseg.style.cursor = 'default';
}

_via_time_annotator.prototype._tseg_on_mousedown = function(e) {
  var t = this._tseg_timeline_canvas2time(e.offsetX);
  // timeline
  if ( e.offsetY <= this.lineh3 ) {
    this.m.currentTime = t;
    return;
  }

  // metadata
  if ( e.offsetY >= this.lineh5 && e.offsetY <= this.lineh7 ) {
    var mindex = this._tseg_time_to_metadata_index(t);
    // clicked on one of the visible metadata?
    if ( mindex[0] !== -1 ) {
      // clicked on boundary?
      if ( mindex[1] !== -1 ) {
        // resize
        this.tseg_is_metadata_resize_ongoing = true;
        this.tseg_metadata_sel_bindex = mindex[1];
        this.tseg_metadata_sel_mindex = mindex[0];
      } else {
        if ( this.tseg_is_metadata_selected ) {
          if ( this.tseg_metadata_sel_mindex === mindex[0] ) {
            // remove selection
            this._tseg_metadata_unselect();
            this._tseg_metadata_panel_hide();
          } else {
            // update selection
            this._tseg_metadata_select(mindex[0]);
            this._tseg_metadata_panel_show();
          }
        } else {
          // select
          this._tseg_metadata_select(mindex[0]);
          this._tseg_metadata_panel_show();
        }
      }
    } else {
      this._tseg_metadata_add_at_time(t);
    }
    return;
  }

  // clear state if clicked anywhere else
  this._tseg_metadata_unselect();
  this._tseg_metadata_panel_hide();
  this.tseg_is_metadata_resize_ongoing = false;
  this.tseg_metadata_sel_bindex = -1;
}

_via_time_annotator.prototype._tseg_on_mouseup = function(e) {
  var t = this._tseg_timeline_canvas2time(e.offsetX);

  if ( this.tseg_is_metadata_resize_ongoing ) {
    this.tseg_is_metadata_resize_ongoing = false;
    var mid = this.tseg_metadata_mid_list[this.tseg_metadata_sel_mindex];
    this._tseg_metadata_update_time(mid, this.tseg_metadata_sel_bindex, t);
    this._tseg_timeline_update_metadata();
  }
}

//
// Metadata Panel
//
_via_time_annotator.prototype._tseg_metadata_move = function(dt) {
  this.tseg_metadata_sel_show_time_bindex = 0; // show both
  var mid = this.tseg_metadata_mid_list[ this.tseg_metadata_sel_mindex ];
  var n = this.d.metadata_store[this.file.fid][mid].z.length;
  var i, t;
  for ( i = 0; i < n; ++i ) {
    t = this.d.metadata_store[this.file.fid][mid].z[i] + dt;
    this._tseg_metadata_update_time(mid, i, t);
  }
  this.m.currentTime = this.d.metadata_store[this.file.fid][mid].z[0];
  this._tseg_timeline_update_metadata();
  this._tseg_metadata_panel_show();
}

_via_time_annotator.prototype._tseg_metadata_update_edge = function(bindex, dt) {
  this.tseg_metadata_sel_show_time_bindex = bindex;
  var mid = this.tseg_metadata_mid_list[ this.tseg_metadata_sel_mindex ];
  var t = this.d.metadata_store[this.file.fid][mid].z[bindex] + dt;
  this.m.currentTime = t;
  this._tseg_metadata_update_time(mid, bindex, t);
  this._tseg_timeline_update_metadata();
  this._tseg_metadata_panel_show();
}

_via_time_annotator.prototype._tseg_metadata_add_at_time = function(t) {
  var z = [ t ];
  z[1] = z[0] + this.DEFAULT_TEMPORAL_SEG_LEN;
  var fid = this.file.fid;
  var xy = [];
  var metadata = {};
  this.d.metadata_add(fid, z, xy, metadata).then( function(ok) {
  }.bind(this), function(err) {
    console.log(err);
  }.bind(this));
}

_via_time_annotator.prototype._tseg_metadata_select = function(mindex) {
  this.tseg_is_metadata_selected = true;
  this.tseg_metadata_sel_mindex = mindex;
  this.m.currentTime = this.tseg_metadata_time_list[ this.tseg_metadata_sel_mindex ][0];
}

_via_time_annotator.prototype._tseg_metadata_select_at_current_time = function(mindex) {
  var mindex = this._video_current_time_has_metadata();
  if ( mindex !== -1 ) {
    this._tseg_metadata_select(mindex);
    this._tseg_metadata_panel_show();
  }
}

_via_time_annotator.prototype._tseg_metadata_select_next = function(mindex) {
  if ( this.tseg_is_metadata_selected ) {
    var next = this.tseg_metadata_sel_mindex + 1;
    if ( next >= this.tseg_metadata_mid_list.length ) {
      next = 0;
    }
    this._tseg_metadata_select(next);
    this._tseg_metadata_panel_show();
  } else {
    if ( this.tseg_metadata_mid_list.length ) {
      this._tseg_metadata_select(0);
      this._tseg_metadata_panel_show();
    } else {
      this._tseg_metadata_panel_hide();
    }
  }
}

_via_time_annotator.prototype._tseg_metadata_select_prev = function(mindex) {
  if ( this.tseg_is_metadata_selected ) {
    var next = this.tseg_metadata_sel_mindex - 1;
    if ( next < 0 ) {
      next = this.tseg_metadata_mid_list.length - 1;
    }
    this._tseg_metadata_select(next);
    this._tseg_metadata_panel_show();
  } else {
    if ( this.tseg_metadata_mid_list.length ) {
      this._tseg_metadata_select( this.tseg_metadata_mid_list.length - 1);
      this._tseg_metadata_panel_show();
    }
  }
}

_via_time_annotator.prototype._tseg_metadata_unselect = function() {
  this.tseg_is_metadata_selected = false;
  this.tseg_metadata_sel_mindex = -1;
  this.tseg_metadata_sel_show_time_bindex = -1;
}

_via_time_annotator.prototype._tseg_metadata_panel_show = function() {
  var mid = this.tseg_metadata_mid_list[ this.tseg_metadata_sel_mindex ];
  var x = this._tseg_timeline_time2canvas( this.tseg_metadata_time_list[this.tseg_metadata_sel_mindex][0] );
  var y = this._tseg_timeline_time2canvas( this.tseg_metadata_time_list[this.tseg_metadata_sel_mindex][1] );

  this.tseg_metadata_panel.style.display = 'inline-block';
  this.tseg_metadata_panel.style.left = (x + 1) + 'px';
  this.tseg_metadata_panel.style.top = (this.lineh7 + 1) + 'px';

  this.tseg_metadata_panel.innerHTML = '';
  this.tseg_metadata_panel.appendChild( this._tseg_metadata_panel_init(mid) );
}

_via_time_annotator.prototype._tseg_metadata_panel_hide = function() {
  this.tseg_metadata_panel.style.display = 'none';
}

_via_time_annotator.prototype._tseg_metadata_panel_init = function(mid) {
  var table = document.createElement('table');
  var fid = this.file.fid;
  var thead = document.createElement('thead');
  var thead_tr = document.createElement('tr');

  var tbody = document.createElement('tbody');
  var tbody_tr = document.createElement('tr');

  var aid;
  for ( aid in this.d.attribute_store ) {
    var head_td = document.createElement('td');
    head_td.innerHTML = this.d.attribute_store[aid].attr_name;
    thead_tr.appendChild(head_td);

    var body_td = document.createElement('td');
    var el = this._tseg_metadata_html_element(fid, mid, aid);
    el.addEventListener('change', this._tseg_metadata_on_change.bind(this));
    body_td.appendChild(el);
    tbody_tr.appendChild(body_td);
  }

  thead.appendChild(thead_tr);
  tbody.appendChild(tbody_tr);
  table.appendChild(thead);
  table.appendChild(tbody);

  return table;
}

_via_time_annotator.prototype._tseg_metadata_html_element = function(fid, mid, aid) {
  var aval  = this.d.metadata_store[fid][mid].metadata[aid];
  var dval  = this.d.attribute_store[aid].default_option_id;
  var atype = this.d.attribute_store[aid].type;
  var el    = this.d.attribute_store[aid].html_element();
  el.setAttribute('data-fid', fid);
  el.setAttribute('data-mid', mid);
  el.setAttribute('data-aid', aid);

  switch(atype) {
  case _VIA_ATTRIBUTE_TYPE.TEXT:
    if ( typeof(aval) === 'undefined' ) {
      aval = dval;
    }
    el.innerHTML = aval;

    break;

  case _VIA_ATTRIBUTE_TYPE.SELECT:
    // set the selected option corresponding to atype
    var n = el.options.length;
    var i;
    if ( typeof(aval) === 'undefined' ) {
      aval = dval;
    }
    for ( i = 0; i < n; ++i ) {
      if ( el.options[i].value === aval ) {
        el.options[i].setAttribute('selected', 'true');
      } else {
        el.options[i].removeAttribute('selected');
      }
    }
    break;

  default:
    console.log('attribute type ' + atype + ' not implemented yet!');
    var el = document.createElement('span');
    el.innerHTML = aval;
    return el;
  }
  return el;
}

_via_time_annotator.prototype._tseg_metadata_del_selected = function() {
  if ( this.tseg_is_metadata_selected ) {
    var mid = this.tseg_metadata_mid_list[ this.tseg_metadata_sel_mindex ];
    this._tseg_metadata_unselect();
    this.d.metadata_del(this.file.fid, mid);
    this._tseg_metadata_select_next();
  }
}

_via_time_annotator.prototype._tseg_metadata_on_change = function(e) {
  var value = e.target.value;
  var fid = e.target.dataset.fid;
  var mid = e.target.dataset.mid;
  var aid = e.target.dataset.aid;

  //console.log('Updating: fid='+fid+',mid='+mid+',aid='+aid+': value='+value);
  this.d.metadata_update_attribute_value(fid, mid, aid, value);
}

_via_time_annotator.prototype._tseg_metadata_update_time = function(mid, bindex, t) {
  this.d.metadata_store[this.file.fid][mid].z[bindex] = t;
}

_via_time_annotator.prototype._on_event_metadata_update = function(fid, mid) {
  if ( fid === this.file.fid ) {
    this._tseg_timeline_update_metadata();
  }
}

_via_time_annotator.prototype._on_event_metadata_add = function(fid, mid) {
  if ( fid === this.file.fid ) {
    this._tseg_timeline_update_metadata();
    var mindex = this.tseg_metadata_mid_list.indexOf(mid);
    if ( mindex !== -1 ) {
      this._tseg_metadata_select(mindex);
      this._tseg_metadata_panel_show();
    }
  }

}

_via_time_annotator.prototype._on_event_metadata_del = function(fid, mid) {
  if ( fid === this.file.fid ) {
    this._tseg_timeline_update_metadata();
  }
}

//
// Mode of temporal segmenter
//
_via_time_annotator.prototype._tseg_mode_switch = function(mode) {
  switch(mode) {
  case this.MODE.TEMPORAL_SEGMENTATION:
    this.tseg_current_mode = this.MODE.TEMPORAL_SEGMENTATION;
    this.tseg_metadata_panel.classList.remove('edit_mode');
    break;
  case this.MODE.METADATA_EDIT:
    this.tseg_current_mode = this.MODE.METADATA_EDIT;
    this.tseg_metadata_panel.classList.add('edit_mode');
    this._tseg_metadata_edit_focus_first_attr();
    break;
  }
}

_via_time_annotator.prototype._tseg_metadata_edit_focus_first_attr = function() {
  var table = this.tseg_metadata_panel.firstChild;
  var attribute_input_list = table.childNodes[1].getElementsByTagName('td');
  var n = attribute_input_list.length;
  if ( n > 0 ) {
    attribute_input_list[0].firstChild.focus();
  }
}

_via_time_annotator.prototype._tseg_metadata_edit_keydown_handler = function(e) {
  // cancel ongoing action or event
  if ( e.key === 'Escape' ) {
    e.preventDefault();
    document.activeElement.blur(); // ensures that updated values are saved
    this._tseg_mode_switch(this.MODE.TEMPORAL_SEGMENTATION);
    return;
  }

  if ( e.key === 'Tab' ) {
  }
}

_via_time_annotator.prototype._tseg_keydown_handler = function(e) {
  var fid = this.file.fid;

  // play/pause
  if ( e.key === ' ' ) {
    e.preventDefault();
    if ( this.m.paused ) {
      this.m.play();
    } else {
      this.m.pause();
    }
    return;
  }

  // jump 1,...,9 seconds forward or backward
  if ( ['1','2','3','4','5','6','7','8','9'].includes( e.key ) ) {
    e.preventDefault();
    var t = this.m.currentTime;
    if ( e.ctrlKey ) {
      t += parseInt(e.key);
    } else {
      t -= parseInt(e.key);
    }
    // clamp
    t = Math.max(0, Math.min(t, this.m.duration));
    this.m.pause();
    this.m.currentTime = t;
    return;
  }

  if ( e.key === 'Home' ) {
    e.preventDefault();
    this.m.pause();
    if ( this.tseg_is_metadata_selected ) {
      this.m.currentTime = this.tseg_metadata_time_list[ this.tseg_metadata_sel_mindex ][0];
    } else {
      this.m.currentTime = 0;
    }
    return;
  }

  if ( e.key === 'End' ) {
    e.preventDefault();
    this.m.pause();
    if ( this.tseg_is_metadata_selected ) {
      this.m.currentTime = this.tseg_metadata_time_list[ this.tseg_metadata_sel_mindex ][1];
    } else {
      this.m.currentTime = this.m.duration - 5;
    }
    return;
  }

  // change playback rate
  if ( e.key === '0' ) {
    e.preventDefault();
    this.m.playbackRate = 1;
    return;
  }
  if ( e.key === '+' ) {
    e.preventDefault();
    this.m.playbackRate = this.m.playbackRate + 0.1;
    return;
  }
  if ( e.key === '-' ) {
    e.preventDefault();
    if ( this.m.playbackRate > 0.1 ) {
      this.m.playbackRate = this.m.playbackRate - 0.1;
    }
    return;
  }

  // add temporal segment at current timeline
  if ( e.key === 'a' ) {
    e.preventDefault();
    var t = this.m.currentTime;
    this._tseg_metadata_add_at_time(t);
    return;
  }

  if ( e.key === 'd' ) {
    e.preventDefault();
    this._tseg_metadata_del_selected();
    // add temporal sdegment at current timeline
    return;
  }

  if ( e.key === 'm' ) {
    e.preventDefault();
    if ( this.m.muted ) {
      this.m.muted = false;
    } else {
      this.m.muted = true;
    }
    return;
  }

  if ( e.key === 'l' || e.key === 'L') {
    if ( this.tseg_is_metadata_selected ) {
      // resize left edge of selected temporal segment
      e.preventDefault();
      if ( e.key === 'l' ) {
        this._tseg_metadata_update_edge(0, -this.EDGE_UPDATE_TIME_DELTA);
      } else {
        this._tseg_metadata_update_edge(0, this.EDGE_UPDATE_TIME_DELTA);
      }
      return;
    }
  }

  if ( e.key === 'r' || e.key === 'R') {
    if ( this.tseg_is_metadata_selected ) {
      // resize left edge of selected temporal segment
      e.preventDefault();
      if ( e.key === 'r' ) {
        this._tseg_metadata_update_edge(1, this.EDGE_UPDATE_TIME_DELTA);
      } else {
        this._tseg_metadata_update_edge(1, -this.EDGE_UPDATE_TIME_DELTA);
      }
      return;
    }
  }

  // cancel ongoing action or event
  if ( e.key === 'Escape' ) {
    e.preventDefault();

    // time annotator
    this._tseg_metadata_unselect();
    this._tseg_metadata_panel_hide();

    // hide info panel
    _via_util_hide_info_page();

    return;
  }

  // select temporal segments
  if ( e.key === 'Tab' ) {
    e.preventDefault();

    if ( e.shiftKey ) {
      this._tseg_metadata_select_prev();
    } else {
      this._tseg_metadata_select_next();
    }
    return;
  }

  if ( e.key === 'Enter' ) {
    e.preventDefault();
    if ( this.tseg_is_metadata_selected ) {
      if ( this.tseg_current_mode === this.MODE.TEMPORAL_SEGMENTATION ) {
        // enter edit mode
        this._tseg_mode_switch(this.MODE.METADATA_EDIT);
      }
    } else {
      this._tseg_metadata_select_at_current_time();
    }
    return;
  }

  if ( e.key === 'ArrowDown' || e.key === 'ArrowUp' ) {
    // update the attribute being shown below each temporal segment
    e.preventDefault();
    var next_aindex;
    if ( e.key === 'ArrowDown' ) {
      next_aindex = this.tseg_metadata_sel_show_aindex + 1;
      if ( next_aindex >= this.d.aid_list.length ) {
        next_aindex = 0;
      }
    } else {
      next_aindex = this.tseg_metadata_sel_show_aindex - 1;
      if ( next_aindex < 0 ) {
        next_aindex = this.d.aid_list.length - 1;
      }
    }
    this.tseg_metadata_sel_show_aindex = next_aindex;
  }

  if ( e.key === 'ArrowLeft' || e.key === 'ArrowRight' ) {
    // move selected temporal segment
    e.preventDefault();
    if ( this.tseg_is_metadata_selected ) {
      if ( e.key === 'ArrowLeft' ) {
        this._tseg_metadata_move(-this.EDGE_UPDATE_TIME_DELTA);
      } else {
        this._tseg_metadata_move(this.EDGE_UPDATE_TIME_DELTA);
      }
    }
  }

  if ( e.key === 'F2' ) {
    e.preventDefault();
    _via_util_show_info_page('keyboard_shortcuts');
    return;
  }
}

//
// keyboard input handler
//
_via_time_annotator.prototype._on_event_keydown = function(e) {
  switch(this.tseg_current_mode) {
  case this.MODE.TEMPORAL_SEGMENTATION:
    this._tseg_keydown_handler(e);
    break;
  case this.MODE.METADATA_EDIT:
    this._tseg_metadata_edit_keydown_handler(e);
    break;
  }
}
