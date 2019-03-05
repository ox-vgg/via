/**
 * @class
 * @classdesc Marks time segments of a {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement|HTMLMediaElement}
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 5 Mar. 2019
 * @fires _via_temporal_segmenter#segment_add
 * @fires _via_temporal_segmenter#segment_del
 * @fires _via_temporal_segmenter#segment_edit
 * @param {Element} container HTML container element like <div>
 * @param {HTMLMediaElement} media_element HTML video of audio
 */

'use strict';

function _via_temporal_segmenter(container, file, data, media_element) {
  this.c = container;
  this.file = file;
  this.d = data;
  this.m = media_element;

  this.groupby = false;
  this.groupby_aid = '';
  this.group = {};
  this.gid_list = [];

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_temporal_segmenter_';
  _via_event.call( this );

  if ( ! this.m instanceof HTMLMediaElement ) {
    throw 'media element must be an instance of HTMLMediaElement!';
  }

  // constants
  this.COLOR_LIST = ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7"];
  this.PLAYBACK_MODE = { NORMAL:'1', REVIEW:'2', ANNOTATION:'3' };

  this.current_playback_mode = this.PLAYBACK_MODE.NORMAL;
}

_via_temporal_segmenter.prototype._init = function() {
  try {
    this._group_init('0'); // for debug

    this._thumbview_init();
    this._vtimeline_init();
    this._tmetadata_init();

    // start the animation frame drawing
    this._vtimeline_mark_draw();
  } catch(err) {
    console.log(err)
  }
}

//
// thumbnail viewer
//
_via_temporal_segmenter.prototype._thumbview_init = function() {
  this.thumbnail_container = document.createElement('div');
  this.thumbnail_container.setAttribute('class', 'thumbnail_container');
  this.thumbnail_container.setAttribute('style', 'display:none; position:absolute; top:0; left:0;');
  this.c.appendChild(this.thumbnail_container);

  // initialise thumbnail viewer
  this.thumbnail = new _via_video_thumbnail(this.file);
  this.thumbnail.start();
}

_via_temporal_segmenter.prototype._thumbview_show = function(time, x, y) {
  this.thumbnail_container.innerHTML = '';
  this.thumbnail_container.appendChild(this.thumbnail.get_thumbnail(time));
  this.thumbnail_container.style.display = 'inline-block';

  this.thumbnail_container.style.left = x + this.linehn[2] + 'px';
  this.thumbnail_container.style.top  = y + this.linehn[4] + 'px';
}

_via_temporal_segmenter.prototype._thumbview_hide = function(t) {
  this.thumbnail_container.style.display = 'none';
}

//
// Full video timeline
//
_via_temporal_segmenter.prototype._vtimeline_init = function() {
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
  this.lineh = Math.floor(this.char_width);
  this.linehn = []; // contains multiples of line_height for future ref.
  for ( var i = 0; i < 20; ++i ) {
    this.linehn[i] = i * this.lineh;
  }
  this.linehb2 = Math.floor(this.char_width/2);
  this.vtimelinew = Math.floor(this.vtimeline.width - 2*this.padx);

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
  ctx.lineTo(this.padx + this.vtimelinew, 1);
  ctx.stroke();

  // draw time gratings and corresponding label
  var start = this.padx;
  var time = 0;
  var width_per_tick = 10 * this.char_width;
  var end = this.vtimelinew - width_per_tick;
  var width_per_sec  = this._vtimeline_time2canvas(1);

  ctx.beginPath();
  while ( start <end && time < this.m.duration ) {
    ctx.moveTo(start, 1);
    ctx.lineTo(start, this.lineh - 1);

    time = this._vtimeline_canvas2time(start);
    if ( width_per_sec > width_per_tick ) {
      ctx.fillText(this._vtimeline_time2strms(time), start, this.linehn[2] - 1);
    } else {
      ctx.fillText(this._vtimeline_time2str(time), start, this.linehn[2] - 1);
    }

    start = start + 10*this.char_width;
  }
  ctx.stroke();

  // draw the end mark
  var endx = this._vtimeline_time2canvas(this.m.duration);
  ctx.beginPath();
  ctx.moveTo(endx, 1);
  ctx.lineTo(endx, this.lineh - 1);
  ctx.stroke();
  var tendstr = this._vtimeline_time2strms(this.m.duration);
  var tendstr_width = ctx.measureText(tendstr).width;
  ctx.fillStyle = '#999999';
  ctx.fillText(tendstr, endx - tendstr_width, this.linehn[2] - 1);

  //// timeline mark showing the current video time
  //// and placed just above the full video timeline
  this.vtimeline_mark = document.createElement('canvas');
  this.vtimeline_mark.setAttribute('class', 'video_timeline_mark');
  this.vtimeline_mark_ctx = this.vtimeline_mark.getContext('2d', {alpha:false});
  this.vtimeline_mark.width = this.vtimeline.width;
  this.vtimeline_mark.height = this.linehn[2];

  this.c.appendChild(this.vtimeline_mark);
  this.c.appendChild(this.vtimeline);
}

_via_temporal_segmenter.prototype._vtimeline_time2canvas = function(t) {
  return Math.floor( ( ( this.vtimelinew * t ) / this.m.duration ) + this.padx );
}

_via_temporal_segmenter.prototype._vtimeline_canvas2time = function(x) {
  var t = ( ( x - this.padx ) / this.vtimelinew ) * this.m.duration;
  return Math.max(0, Math.min(t, this.m.duration) );
}

_via_temporal_segmenter.prototype._vtimeline_time2str = function(t) {
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

_via_temporal_segmenter.prototype._vtimeline_time2strms = function(t) {
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

_via_temporal_segmenter.prototype._vtimeline_time2ssms = function(t) {
  var hh = Math.floor(t / 3600);
  var mm = Math.floor( (t - hh * 3600) / 60 );
  var ss = Math.floor( t - hh*3600 - mm*60 );
  var ms = Math.floor( (t - Math.floor(t) ) * 1000 );
  return ss + '.' + ms;
}

_via_temporal_segmenter.prototype._vtimeline_playbackrate2str = function(t) {
  return this.m.playbackRate + 'X';
}

_via_temporal_segmenter.prototype._vtimeline_mark_draw = function() {
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
  this.vtimeline_mark_ctx.moveTo(cx, this.linehn[2]);
  this.vtimeline_mark_ctx.lineTo(cx - this.linehb2, this.lineh);
  this.vtimeline_mark_ctx.lineTo(cx + this.linehb2, this.lineh);
  this.vtimeline_mark_ctx.moveTo(cx, this.linehn[2]);
  this.vtimeline_mark_ctx.fill();

  // draw current time
  this.vtimeline_mark_ctx.fillStyle = '#666666';
  var tstr = this._vtimeline_time2strms(time);
  var twidth = this.vtimeline_mark_ctx.measureText(tstr).width;
  var tx = cx + this.lineh;
  if ( cx + twidth > this.vtimelinew ) {
    tx = tx - twidth - this.linehn[2];
  }
  this.vtimeline_mark_ctx.fillText(tstr, tx, this.linehn[2] - 2);

  // show playback rate
  var rate = this.m.playbackRate.toFixed(1) + 'X';
  this.vtimeline_mark_ctx.fillText(rate,
                                   this.vtimelinew - this.lineh4, this.linehn[2] - 2);


  window.requestAnimationFrame(this._vtimeline_mark_draw.bind(this))
}

_via_temporal_segmenter.prototype._vtimeline_on_mousedown = function(e) {
  var canvas_x = e.offsetX;
  var time = this._vtimeline_canvas2time(canvas_x);
  this.m.currentTime = time;
}

_via_temporal_segmenter.prototype._vtimeline_on_mousemove = function(e) {
  var time = this._vtimeline_canvas2time(e.offsetX);
  this._thumbview_show(time, e.offsetX, e.offsetY);
}

_via_temporal_segmenter.prototype._vtimeline_on_mouseout = function(e) {
  this._thumbview_hide();
}


//
// Metadata Panel
//
_via_temporal_segmenter.prototype._tmetadata_init = function(e) {
  this.tmetadata_container = document.createElement('div');
  this.tmetadata_container.setAttribute('class', 'tmetadata_container');

  var cw = this.c.clientWidth;
  this.gid_width = this.linehn[15];
  this.gtimeline_width = cw - this.gid_width - this.linehn[2];

  // header
  var header_container = document.createElement('div');
  header_container.setAttribute('class', 'header_container');
  var header = document.createElement('table');
  var hrow = document.createElement('tr');
  var groupvar_col = document.createElement('td');
  groupvar_col.setAttribute('style', 'width:' + this.gid_width + 'px;');
  groupvar_col.innerHTML = '<select><option>Group = None</option><option>Group = speaker</option></select>';

  var mtimeline_col = document.createElement('td');
  mtimeline_col.setAttribute('style', 'width:' + this.gtimeline_width + 'px;');
  mtimeline_col.innerHTML = 'Timeline';
  hrow.appendChild(groupvar_col);
  hrow.appendChild(mtimeline_col);
  header.appendChild(hrow);
  header_container.appendChild(header);
  this.tmetadata_container.appendChild(header_container);

  // metadata
  var metadata_container = document.createElement('div');
  metadata_container.setAttribute('class', 'metadata_container');
  metadata_container.setAttribute('style', 'display:inline-block; height:' + this.linehn[15] + 'px; width:100%; overflow:auto;');
  var metadata_table = document.createElement('table');
  var tbody = document.createElement('tbody');

  var gindex, gid;
  for ( gindex in this.gid_list ) {
    gid = this.gid_list[gindex];
    tbody.appendChild( this._tmetadata_group_get_gid_html(gid) );
  }

  metadata_table.appendChild(tbody);
  metadata_container.appendChild(metadata_table);
  this.tmetadata_container.appendChild(metadata_container);

  this.c.appendChild(this.tmetadata_container);
}

_via_temporal_segmenter.prototype._tmetadata_group_get_gid_html = function(gid) {
  var tr = document.createElement('tr');
  tr.setAttribute('data-gid', gid);
  var gid_col = document.createElement('td');
  gid_col.setAttribute('style', 'width:' + this.gid_width + 'px;');
  var gid_label = document.createElement('input');
  gid_label.setAttribute('type', 'text');
  gid_label.setAttribute('value', gid);
  gid_col.appendChild(gid_label);
  tr.appendChild(gid_col);

  var gtimeline = document.createElement('td');
  gtimeline.setAttribute('style', 'width:' + this.gtimeline_width + 'px;');
  gtimeline.innerHTML = 'Group Timeline for gid=' + gid;
  tr.appendChild(gtimeline);
  return tr;
}

//
// keyboard input handler
//
_via_temporal_segmenter.prototype._on_event_keydown = function(e) {
  var fid = this.file.fid;

  // play/pause
  if ( e.key === ' ' ) {
    e.preventDefault();
    if ( this.m.paused ) {
      this.m.play();
      _via_util_msg_show('Playing ...');
    } else {
      this.m.pause();
      _via_util_msg_show('Paused. Press <span class="key">a</span> to add a temporal segment, ' +
                         '<span class="key">Backspace</span> to delete and ' +
                         '<span class="key">Tab</span> to select.', true);
    }
  }

  // jump 1,...,9 seconds forward or backward
  if ( ['1','2','3','4','5','6','7','8','9'].includes( e.key ) ) {
    if ( e.altKey ) {
      return; // Alt + Num is used to navigated browser tabs
    }
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

  if ( e.key === 's' || e.key === 'S' ) {
    e.preventDefault();
    this.m.pause();
    if ( e.key === 's' ) {
      if ( this.tseg_is_metadata_selected ) {
        this.m.currentTime = this.tseg_metadata_time_list[ this.tseg_metadata_sel_mindex ][0];
      } else {
        this.m.currentTime = this.tseg_timeline_tstart;
      }
    } else {
      this.m.currentTime = 0;
    }
    return;
  }

  if ( e.key === 'e' || e.key === 'E' ) {
    e.preventDefault();
    this.m.pause();
    if ( e.key === 'e' ) {
      if ( this.tseg_is_metadata_selected ) {
        this.m.currentTime = this.tseg_metadata_time_list[ this.tseg_metadata_sel_mindex ][1];
      } else {
        this.m.currentTime = this.tseg_timeline_tend;
      }
    } else {
      this.m.currentTime = this.m.duration - 3;
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

  if ( e.key === 'a' ) {
    e.preventDefault();
    var t = this.m.currentTime;
    this._tseg_metadata_add_at_time(t);
    return;
  }

  if ( e.key === 'Backspace' ) {
    e.preventDefault();
    this._tseg_metadata_del_selected();
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
    e.preventDefault();
    if ( this.tseg_is_metadata_selected ) {
      // resize left edge of selected temporal segment
      if ( e.key === 'l' ) {
        this._tseg_metadata_update_edge(0, -this.EDGE_UPDATE_TIME_DELTA);
      } else {
        this._tseg_metadata_update_edge(0, this.EDGE_UPDATE_TIME_DELTA);
      }
      return;
    } else {
      if ( e.key === 'l' ) {
        this.m.currentTime = this.m.currentTime - this.EDGE_UPDATE_TIME_DELTA;
      } else {
        this.m.currentTime = this.m.currentTime - 2*this.EDGE_UPDATE_TIME_DELTA;
      }
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
    } else {
      if ( e.key === 'r' ) {
        this.m.currentTime = this.m.currentTime + this.EDGE_UPDATE_TIME_DELTA;
      } else {
        this.m.currentTime = this.m.currentTime + 2*this.EDGE_UPDATE_TIME_DELTA;
      }
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
    if ( this.tseg_is_metadata_selected ) {
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
    } else {
      // @todo move to next speaker during diarisation
    }
  }

  if ( e.key === 'ArrowLeft' || e.key === 'ArrowRight' ) {
    e.preventDefault();
    if ( this.tseg_is_metadata_selected ) {
      // move selected temporal segment
      if ( e.key === 'ArrowLeft' ) {
        this._tseg_metadata_move(-this.EDGE_UPDATE_TIME_DELTA);
      } else {
        this._tseg_metadata_move(this.EDGE_UPDATE_TIME_DELTA);
      }
    } else {
      // move temporal seg. timeline
      var tstart_new;
      if ( e.key === 'ArrowLeft' ) {
        this._tseg_move_left();
      }
      if ( e.key === 'ArrowRight' ) {
        this._tseg_move_right();
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
// group by
//

_via_temporal_segmenter.prototype._group_init = function(aid) {
  this.group = {};
  this.groupby_aid = aid;

  var mid, mindex, avalue;
  for ( mindex in this.d.file_mid_list[this.file.fid] ) {
    mid = this.d.file_mid_list[this.file.fid][mindex];
    avalue = this.d.metadata_store[mid].metadata[aid];
    if ( ! this.group.hasOwnProperty(avalue) ) {
      this.group[avalue] = [];
    }
    this.group[avalue].push(mid);
  }
  this.gid_list = Object.keys(this.group).sort();
}

//
// External events
//
