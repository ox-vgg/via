/**
 * @class
 * @classdesc Marks time segments of a {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement|HTMLMediaElement}
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 22 Jan. 2019
 * @fires _via_media_segment_annotator#segment_add
 * @fires _via_media_segment_annotator#segment_del
 * @fires _via_media_segment_annotator#segment_edit
 * @param {Element} container HTML container element like <div>
 * @param {HTMLMediaElement} media_element HTML video of audio
 */

'use strict';

function _via_media_segment_annotator(container, data, media_element) {
  this.c = container;
  this.d = data;
  this.m = media_element;

  // state
  this.is_mark_move_ongoing = false;
  this.move_mark_id = -1;
  this.move_mark_initial = -1;

  this.timeline_markid = [ 0,  1];
  this.timeline_mark   = [-1, -1]; // offset along the timeline for the two marks
  this.timeline_length = -1;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_media_segment_annotator_';
  _via_event.call( this );

  if ( ! this.m instanceof HTMLMediaElement ) {
    throw 'media element must be an instance of HTMLMediaElement!';
  }

  this._init();
  this._redraw_all();
}

_via_media_segment_annotator.prototype._init = function() {
  this.timeline_container = document.createElement('div');
  this.timeline_container.setAttribute('class', 'timeline_container');

  this.segment_metadata_container = document.createElement('table');
  this.segment_metadata_container.appendChild( this._segment_metadata_header() );
  this.segment_metadata_container.appendChild( this._segment_metadata() );

  this._init_timeline();
  this.c.innerHTML = '';
  this.c.appendChild(this.timeline_container);
  this.c.appendChild(this.segment_metadata_container);
}

_via_media_segment_annotator.prototype._segment_metadata_header = function() {
  var tr = document.createElement('tr');

  var controls = this._get_media_controls();
  tr.appendChild(controls);

  var start = document.createElement('th');
  start.innerHTML = 'Start Time';
  tr.appendChild(start);

  var end = document.createElement('th');
  end.innerHTML = 'End Time';
  tr.appendChild(end);

  var aid;
  var n = this.d.attribute_store.length;
  for ( aid = 0; aid < n; ++aid ) {
    var th = document.createElement('th');
    th.innerHTML = this.d.attribute_store[aid].attr_name;
    tr.appendChild(th);
  }

  var thead = document.createElement('thead');
  thead.appendChild(tr);
  return thead;
}

_via_media_segment_annotator.prototype._segment_metadata = function() {
  var tr = document.createElement('tr');

  var button_container = document.createElement('td');
  this.create_segment_button = document.createElement('button');
  this.create_segment_button.innerHTML = 'Create Segment';
  button_container.appendChild(this.create_segment_button);
  tr.appendChild(button_container);

  this.mark_input = [];
  this.mark_input[0] = document.createElement('input');
  this.mark_input[0].setAttribute('name', 'start_time');
  this.mark_input[0].setAttribute('type', 'text');
  this.mark_input[0].setAttribute('size', '5');
  this.mark_input[0].setAttribute('placeholder', 'Start time');
  this.mark_input[1] = document.createElement('input');
  this.mark_input[1].setAttribute('name', 'end_time');
  this.mark_input[1].setAttribute('type', 'text');
  this.mark_input[1].setAttribute('size', '5');
  this.mark_input[1].setAttribute('placeholder', 'End time');

  var start = document.createElement('td');
  start.appendChild(this.mark_input[0]);
  tr.appendChild(start);
  var end = document.createElement('td');
  end.appendChild(this.mark_input[1]);
  tr.appendChild(end);

  var aid;
  var n = this.d.attribute_store.length;
  for ( aid = 0; aid < n; ++aid ) {
    var td = document.createElement('td');
    td.appendChild( this.d.attribute_store[aid].html_element() );
    tr.appendChild(td);
  }

  var tbody = document.createElement('tbody');
  tbody.appendChild(tr);
  return tbody;
}

_via_media_segment_annotator.prototype._get_media_controls = function() {
  var th = document.createElement('th');

  var play  = _via_util_get_svg_button('micon_play', 'Play Media');
  play.addEventListener('click', function(e) {
    this.m.play();
  }.bind(this));

  var pause = _via_util_get_svg_button('micon_pause', 'Pause Media');
  pause.addEventListener('click', function(e) {
    this.m.pause();
  }.bind(this));

  var mark_start = _via_util_get_svg_button('micon_mark_start', 'Set segment start to current time');
  mark_start.addEventListener('click', function(e) {
    this._update_timeline_mark_from_currentime(0);
  }.bind(this));

  var mark_end = _via_util_get_svg_button('micon_mark_end', 'Set segment end to current time');
  mark_end.addEventListener('click', function(e) {
    this._update_timeline_mark_from_currentime(1);
  }.bind(this));

  th.appendChild(mark_start);
  th.appendChild(play);
  th.appendChild(pause);
  th.appendChild(mark_end);
  return th;
}

_via_media_segment_annotator.prototype._init_timeline = function() {

  this.tmark = document.createElement('canvas');
  this.tmark.addEventListener('mousemove', this._on_timeline_mousemove.bind(this));
  this.tmark.addEventListener('mousedown', this._on_timeline_mousedown.bind(this));
  this.tmark.addEventListener('mouseup', this._on_timeline_mouseup.bind(this));

  this.timeline_container.appendChild(this.tmark);

  this.tmarkctx = this.tmark.getContext('2d', { alpha:false } );
  var char_width = this.tmarkctx.measureText('M').width;
  this.ch = Math.floor(char_width * 4);
  this.cw = this.c.clientWidth - 2*char_width;
  this.tmark.width  = this.cw;
  this.tmark.height = this.ch;

  this.padx = char_width;
  this.pady = Math.floor(this.ch/4);
  this.markw = this.pady;

  this.timelinex = this.padx;
  this.timeliney = this.pady;
  this.timeline_length = Math.floor(this.cw - 2*this.padx);
  this.timelineh = Math.floor(this.ch/2);

  this.markw = Math.floor(char_width/2);
  this.markw2 = Math.floor(2 * this.markw)
  this.markw2f = Math.floor(this.markw/2)
  this.timeline_mark = [ 0, this.timeline_length ];
  this.marky0 = this.markw;
  this.marky1 = this.ch - this.markw;
}

//
// Draw routines
//

_via_media_segment_annotator.prototype._redraw_all = function() {
  this._draw_timeline();
  this._draw_marks();
  this._fill_between_marks();
  //this._draw_current_time();
}

_via_media_segment_annotator.prototype._draw_timeline = function() {
  this.tmarkctx.fillStyle = 'white';
  this.tmarkctx.fillRect(0, 0, this.tmark.width, this.tmark.height);

  this.tmarkctx.lineWidth = 1;
  this.tmarkctx.strokeStyle = '#808080';
  this.tmarkctx.strokeRect(this.timelinex, this.timeliney,
                           this.timeline_length, this.timelineh);

}

_via_media_segment_annotator.prototype._draw_marks = function() {
  this.tmarkctx.strokeStyle = 'black';
  this.tmarkctx.lineWidth = this.markw;

  // draw start mark
  this.tmarkctx.beginPath();
  this.tmarkctx.moveTo(this.timelinex + this.timeline_mark[0] + this.markw, this.marky0);
  this.tmarkctx.lineTo(this.timelinex + this.timeline_mark[0], this.marky0);
  this.tmarkctx.lineTo(this.timelinex + this.timeline_mark[0], this.marky1);
  this.tmarkctx.lineTo(this.timelinex + this.timeline_mark[0] + this.markw, this.marky1);
  this.tmarkctx.stroke();

  // draw end mark
  this.tmarkctx.beginPath();
  this.tmarkctx.moveTo(this.timelinex + this.timeline_mark[1] - this.markw, this.marky0);
  this.tmarkctx.lineTo(this.timelinex + this.timeline_mark[1], this.marky0);
  this.tmarkctx.lineTo(this.timelinex + this.timeline_mark[1], this.marky1);
  this.tmarkctx.lineTo(this.timelinex + this.timeline_mark[1] - this.markw, this.marky1);
  this.tmarkctx.stroke();
}

_via_media_segment_annotator.prototype._fill_between_marks = function() {
  this.tmarkctx.fillStyle = '#cfcfcf';
  this.tmarkctx.fillRect(this.timelinex + this.timeline_mark[0] + this.markw2f,
                         this.timeliney,
                         this.timeline_mark[1] - this.timeline_mark[0] - this.markw,
                         this.timelineh)
}

_via_media_segment_annotator.prototype._draw_current_time = function() {
  if ( this.is_mark_move_ongoing ) {
    this.tmarkctx.font = '10px Mono';
    this.tmarkctx.fillStyle = 'black';
    var timestr = this.m.currentTime.toFixed(3).toString();
    this.tmarkctx.fillText(timestr, Math.floor(this.timeline_length/2), this.timelineh);
  }
}

//
// Marks
//
_via_media_segment_annotator.prototype._is_valid_timeline_mark = function(markid, new_mark) {
  // ensure that timeline mark is valid (i.e. start_time < end_time)
  if ( markid == 0 &&
       new_mark > this.timeline_mark[1]
     ) {
    return false;
  }
  if ( markid == 1 &&
       new_mark < this.timeline_mark[0]
     ) {
    return false;
  }
  return true;
}

_via_media_segment_annotator.prototype._update_timeline_mark = function(markid, new_mark) {
  this.timeline_mark[markid] = new_mark;
  var time =this.mark2time(new_mark);
  this.mark_input[markid].value = time.toFixed(3);
  this.m.currentTime = time;
  this._redraw_all();
}

_via_media_segment_annotator.prototype._update_timeline_mark_from_currentime = function(markid) {
  var time = this.m.currentTime;
  var mark = this.time2mark(time);
  if ( this._is_valid_timeline_mark(markid, mark) ) {
    this.mark_input[markid].value = time.toFixed(3);
    this.timeline_mark[markid] = mark;
    this._redraw_all();
  }
}

_via_media_segment_annotator.prototype.mark2time = function(mark_offset) {
  return (this.m.duration/this.timeline_length) * mark_offset;
}
_via_media_segment_annotator.prototype.time2mark = function(time) {
  return ( time / this.m.duration ) * this.timeline_length;
}

//
// Timeline
//
_via_media_segment_annotator.prototype._canvas2timeline = function(x_canvas) {
  // clamp values between [0, timeline_length]
  return Math.max(0, Math.min(this.timeline_length, x_canvas - this.timelinex));
}

_via_media_segment_annotator.prototype._nearest_marker = function(x) {
  var d0 = x - this.timeline_mark[0];
  var d1 = this.timeline_mark[1] - x;

  if ( d0 < d1 ) {
    return 0;
  } else {
    return 1;
  }
}

_via_media_segment_annotator.prototype._which_marker = function(x) {
  var i;
  for ( i = 0; i < this.timeline_mark.length; ++i ) {
    if ( Math.abs( x - this.timeline_mark[i] ) < this.markw2 ) {
      return i;
    }
  }
  return -1;
}

_via_media_segment_annotator.prototype._on_timeline_mousemove = function(e) {
  var x_timeline = this._canvas2timeline(e.offsetX)
  if ( this.is_mark_move_ongoing ) {
    this._update_timeline_mark(this.move_markid, x_timeline);
  } else {
    var markid = this._which_marker( x_timeline );
    if ( markid === -1 ) {
      this.tmark.style.cursor = 'pointer';
    } else {
      this.tmark.style.cursor = 'ew-resize';
    }
  }
}

_via_media_segment_annotator.prototype._on_timeline_mousedown = function(e) {
  var x = e.offsetX;
  var y = e.offsetY;

  var x_timeline = this._canvas2timeline(x)
  var markid = this._which_marker( x_timeline );
  if ( markid !== -1 ) {
    // mousedown was on a marker
    this.is_mark_move_ongoing = true;
    this.move_markid = markid;
    this.move_mark_initial = this.timeline_mark[markid];
  }
}

_via_media_segment_annotator.prototype._on_timeline_mouseup = function(e) {
  var x_timeline = this._canvas2timeline(e.offsetX);
  if ( this.is_mark_move_ongoing ) {
    if ( this._is_valid_timeline_mark(this.move_markid, x_timeline) ) {
      this._update_timeline_mark(this.move_markid, x_timeline);
      this.is_mark_move_ongoing = false;
      this.move_markid = -1;
    } else {
      this._update_timeline_mark(this.move_markid, this.move_mark_initial);
      this.is_mark_move_ongoing = false;
      this.move_markid = -1;
    }
  } else {
    // user clicked on the timeline
    // move the closest marker to the clicked position
    var nearest_markid = this._nearest_marker(x_timeline);
    if ( nearest_markid !== -1 ) {
      this._update_timeline_mark(nearest_markid, x_timeline);
    }
  }
}
