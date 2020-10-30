/**
 * @class
 * @classdesc Marks time segments containing subtitle text of a {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement|HTMLMediaElement}
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 9 Oct. 2020
 * @fires _via_temporal_segmenter#segment_add
 * @fires _via_temporal_segmenter#segment_del
 * @fires _via_temporal_segmenter#segment_edit
 * @param {Element} container HTML container element like <div>
 * @param {HTMLMediaElement} media_element HTML video of audio
 */

'use strict';

function _via_temporal_segmenter(file_annotator, container, vid, groupby_aid, data, media_element) {
  this._ID = '_via_temporal_segmenter_';
  this.fa = file_annotator;
  this.c = container;
  this.vid = vid;
  this.groupby_aid = groupby_aid;
  this.d = data;
  this.m = media_element;

  this.group = {};
  this.gid_list = [];
  this.SUBTITLE_GID = '__video_subtitle__';
  this.selected_gindex = -1;
  this.selected_mindex = -1;
  this.edge_show_time = -1;

  // spatial mid
  this.smid = {};

  this.DRAW_LINE_WIDTH = 2;
  this.EDGE_UPDATE_TIME_DELTA = 1/50;  // in sec
  this.TEMPORAL_SEG_MOVE_OFFSET = 1;   // in sec
  this.DEFAULT_TEMPORAL_SEG_LEN = 1;   // in sec
  this.TEMPORAL_SEG_RADIUS = 1;        // in units of char width
  this.GTIMELINE_HEIGHT = 12;          // units of char width
  this.GTIMELINE_ZOOM_OFFSET = 4;      // in pixels
  this.DEFAULT_WIDTH_PER_SEC = 8;      // units of char width
  this.GID_COL_WIDTH = 15;             // units of char width
  this.METADATA_CONTAINER_HEIGHT = 22; // units of char width
  this.METADATA_EDGE_TOL = 0.1;
  this.TEMPORAL_SEG_EDGE_SNAP_TOL = 0.15; // in sec.
  this.GTIMELINE_REGION_MARKER_MOUSE_TOL = 0.1; // in sec.

  this.PLAYBACK_MODE = { NORMAL:'1', REVIEW_SEGMENT:'2', REVIEW_GAP:'3' };
  this.current_playback_mode = this.PLAYBACK_MODE.NORMAL;

  this.metadata_move_is_ongoing = false;
  this.metadata_resize_is_ongoing = false;
  this.timeline_move_is_ongoing = false;
  this.gtimeline_drag_ongoing = false;
  this.metadata_resize_edge_index = -1;
  this.metadata_ongoing_update_x = [0, 0];
  this.metadata_move_start_x = 0;
  this.metadata_move_dx = 0;
  this.metadata_last_added_mid = '';
  this.tmetadata_last_mousedown_x = -1;

  this.show_audio = false;             // experimental, hence disabled by default
  this.audio_analyser_active = false;

  // start automatic rendering of selected gid when user interaction is ongoing (i.e. mousedown, movemove)
  // and stop when user interaction finishes (ie. mouseup)
  this.auto_render_tmetadata_selected_gid = false;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  _via_event.call( this );
  this.d.on_event('attribute_update', this._ID, this._on_event_attribute_update.bind(this));
  this.d.on_event('metadata_update_bulk', this._ID, this._on_event_metadata_update_bulk.bind(this));
  this.d.on_event('metadata_add_bulk', this._ID, this._on_event_metadata_add_bulk.bind(this));

  if ( ! this.m instanceof HTMLMediaElement ) {
    throw 'media element must be an instance of HTMLMediaElement!';
  }

  // colour
  this.COLOR_LIST = ["#E69F00", "#56B4E9", "#009E73", "#D55E00", "#CC79A7", "#F0E442"];
  this.NCOLOR = this.COLOR_LIST.length;

  this.current_playback_mode = this.PLAYBACK_MODE.NORMAL;

  this._init(this.groupby_aid);
}

_via_temporal_segmenter.prototype._init = function(groupby_aid) {
  try {
    this.fid = this.d.store.view[this.vid].fid_list[0];
    this.file = this.d.store.file[this.fid];

    this._group_init(groupby_aid);

    this.c.innerHTML = '';
    this._init_canvas_settings();
    this._tmetadata_init();

    // trigger the update of animation frames
    this._redraw_all();
    this._redraw_timeline();
  } catch(err) {
    console.log(err);
  }
}

_via_temporal_segmenter.prototype._init_canvas_settings = function() {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d', {alpha:false});
  ctx.font = '10px Sans';
  this.char_width = ctx.measureText('M').width;
  this.padx = 2*this.char_width;
  this.pady = this.char_width;
  this.lineh = Math.floor(this.char_width);
  this.linehn = []; // contains multiples of line_height for future ref.
  for ( var i = 0; i < 40; ++i ) {
    this.linehn[i] = i * this.lineh;
  }
  this.linehb2 = Math.floor(this.char_width/2);
}

//
// All animation frame routines
//
_via_temporal_segmenter.prototype._redraw_all = function() {
  window.requestAnimationFrame(this._redraw_all.bind(this));
  var tnow = this.m.currentTime;
  //console.log('tnow=' + tnow + ', this.tmetadata_gtimeline_tstart=' + this.tmetadata_gtimeline_tstart + ', this.tmetadata_gtimeline_tend=' + this.tmetadata_gtimeline_tend);
  var t_last_paused = this.m.last_paused_time;
  this._update_playback_rate(tnow);

  if ( tnow < this.tmetadata_gtimeline_tstart ||
       tnow > this.tmetadata_gtimeline_tend
     ) {
    if ( ! this.m.paused ) {
      var new_tstart = Math.floor(tnow);
      this._tmetadata_boundary_update(new_tstart)
      this._tmetadata_group_gid_draw_all();
      this._tmetadata_gtimeline_draw();
    } else {
      //this.m.currentTime = this.tmetadata_gtimeline_tstart;
      var new_tstart = Math.floor(tnow);
      this._tmetadata_boundary_update(new_tstart)
      this._tmetadata_group_gid_draw_all();
      this._tmetadata_gtimeline_draw();
    }
  }

  // lock playback in the selected temporal segment
  if ( this.selected_mindex !== -1 ) {
    if ( ! this.m.paused ) {
      var t = this.d.store.metadata[this.selected_mid].z;
      if ( tnow > t[1] ) {
        this.m.currentTime = t[0];
      }
      if ( tnow < t[0] ) {
        this.m.currentTime = t[0];
      }
    }
  }

  //this._redraw_timeline(); // this is not required

  // draw marker to show current time in group timeline and group metadata
  this._tmetadata_draw_currenttime_mark(tnow, this.fa.last_paused_time);

  if(this.show_audio) {
    this._tmetadata_gtimeline_draw_audio();
  }
}

_via_temporal_segmenter.prototype._update_playback_rate = function(t) {
  //console.log(this.current_playback_mode + ':' + t)
  if ( this.current_playback_mode !== this.PLAYBACK_MODE.NORMAL ) {
    var mindex = this._tmetadata_group_gid_metadata_at_time(t);
    if ( mindex !== -1 ) {
      if ( this.current_playback_mode === this.PLAYBACK_MODE.REVIEW_SEGMENT ) {
        this._toolbar_playback_rate_set(1);
      } else {
        this._toolbar_playback_rate_set(10);
      }
    } else {
      if ( this.current_playback_mode === this.PLAYBACK_MODE.REVIEW_GAP ) {
        this._toolbar_playback_rate_set(1);
      } else {
        this._toolbar_playback_rate_set(10);
      }
    }
  } else {
    //this._toolbar_playback_rate_set(1);
  }
}

_via_temporal_segmenter.prototype._redraw_timeline = function() {
  // draw group timeline
  this._tmetadata_gtimeline_draw();
}

//
// Metadata Panel
//
_via_temporal_segmenter.prototype._tmetadata_init = function() {
  this.tmetadata_container = document.createElement('div');
  this.tmetadata_container.setAttribute('class', 'tmetadata_container');

  // group timeline container
  var gheader_container = document.createElement('div');
  gheader_container.setAttribute('class', 'gheader_container');
  var gheader_grid = document.createElement('div');
  gheader_grid.setAttribute('class', 'onecolgrid');

  this.gtimeline_container = document.createElement('div');
  this.gtimeline_container.setAttribute('class', 'gtimeline_container');
  gheader_grid.appendChild(this.gtimeline_container);

  gheader_container.appendChild(gheader_grid);
  this.tmetadata_container.appendChild(gheader_container);
  this.c.appendChild(this.tmetadata_container);

  // initialise the gtimeline (timeline for temporal segmentation, requires width of container)
  this.timeline_container_width = this.gtimeline_container.clientWidth;
  this.timeline_container_height = this.gtimeline_container.clientHeight;
  this.tmetadata_timelinew = this.timeline_container_width - Math.floor(2 * this.padx);
  this.tmetadata_width_per_sec = this.linehn[this.DEFAULT_WIDTH_PER_SEC];
  this._tmetadata_boundary_update(0); // determine the boundary of gtimeline

  this._tmetadata_gtimeline_init(); // initialize gtimeline canvas
  this.gtimeline_container.appendChild(this.gtimeline);

  this.gmetadata_container = document.createElement('div');
  this.gmetadata_container.setAttribute('class', 'gmetadata_container');

  var gtimeline_container_maxheight = this.fa.va.gtimeline_container_height - this.METADATA_CONTAINER_HEIGHT + 5; // 5 is offset obtained using visual inspection
  this.gmetadata_container.setAttribute('style', 'max-height:' + gtimeline_container_maxheight + 'ch;');

  this.gmetadata_grid = document.createElement('div');
  this.gmetadata_grid.setAttribute('class', 'onecolgrid');
  this._tmetadata_gmetadata_update();
  this.gmetadata_container.appendChild(this.gmetadata_grid);
  this.tmetadata_container.appendChild(this.gmetadata_container);
  // Note: this.tmetadata_container has already been added to parent container

  if ( this.gid_list.length ) {
    this._tmetadata_group_gid_sel(0);
  }

  // move boundary so that first subtitle is visible
  if(this.group[this.selected_gid].length) {
    var mid0 = this.group[this.selected_gid][0];
    var t0 = this.d.store.metadata[mid0].z[0];
    var offset = 0;
    if(t0 > 2.0) {
      offset = -2.0;
    }
    this._tmetadata_boundary_move(offset, t0);
  }

  // Finally, draw all the temporal segments associated with all gid
  this._tmetadata_group_gid_draw_all();
}

_via_temporal_segmenter.prototype._tmetadata_audio_init = function() {
  try {
    this.audioctx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioctx.createAnalyser();
    this.audiosrc = this.audioctx.createMediaElementSource(this.m);
    this.audiosrc.connect(this.analyser);
    this.analyser.connect(this.audioctx.destination)

    this.analyser.fftSize = 32;
    this.audio_data = new Float32Array(this.analyser.frequencyBinCount);
    this.audio_analyser_active = true;
  } catch(ex) {
    this.audio_analyser_active = false;
  }
}

_via_temporal_segmenter.prototype._tmetadata_gmetadata_update = function() {
  this.gmetadata_grid.innerHTML = '';

  // initialise the gmetadata (temporal segment corresponding to each group)
  this.gcanvas = {}; // contains a list of canvas for each group
  this.gctx = {};    // contains the corresponding drawing context
  var gindex, gid;
  for ( gindex in this.gid_list ) {
    gid = this.gid_list[gindex];

    // column containing temporal segments for this value timeline-id
    this._tmetadata_group_gid_init(gid);
    var gid_metadata_container = document.createElement('div');
    gid_metadata_container.appendChild(this.gcanvas[gid]);
    this.gmetadata_grid.appendChild(gid_metadata_container);
  }
}

_via_temporal_segmenter.prototype._tmetadata_gid_list_reorder = function(gindex_now, gindex_new) {
  var new_loc_gid = this.gid_list[gindex_new];
  this.gid_list[gindex_new] = this.gid_list[gindex_now];
  this.gid_list[gindex_now] = new_loc_gid;
  this._tmetadata_gmetadata_update();
}

_via_temporal_segmenter.prototype._tmetadata_onchange_groupby_aid = function(e) {
  this.group_aname_select.blur(); // remove selection of dropdown
  var new_groupby_aid = e.target.options[e.target.selectedIndex].value;
  this._group_init( new_groupby_aid );
  this._tmetadata_gmetadata_update();
  this._tmetadata_boundary_update(this.tmetadata_gtimeline_tstart)
  this._tmetadata_group_gid_sel(0);
  this._tmetadata_gtimeline_draw();
}

_via_temporal_segmenter.prototype._tmetadata_boundary_move = function(offset, from) {
  if(typeof(from) === 'undefined') {
    var from = this.tmetadata_gtimeline_tstart;
  }

  var new_start = Math.floor(from + offset);;
  if ( new_start >= 0 &&
       new_start < this.m.duration
     ) {
    this._tmetadata_boundary_update(new_start);
    if ( this.m.currentTime < this.tmetadata_gtimeline_tstart ) {
      this.m.currentTime = this.tmetadata_gtimeline_tstart;
    } else {
      if ( this.m.currentTime > this.tmetadata_gtimeline_tend ) {
        this.m.currentTime = this.tmetadata_gtimeline_tend;
      }
    }
  } else {
    _via_util_msg_show('Cannot move beyond the video timeline boundary! offset=' + offset + ', from=' + from);
  }
}

_via_temporal_segmenter.prototype._tmetadata_boundary_update = function(tstart) {
  this.tmetadata_gtimeline_tstart = tstart;
  this.tmetadata_gtimeline_xstart = this.padx;

  var t = this.tmetadata_gtimeline_tstart;
  var tx = this.tmetadata_gtimeline_xstart;
  var endx = tx + this.tmetadata_timelinew;
  this.tmetadata_gtimeline_mark_x = [];
  this.tmetadata_gtimeline_mark_time_str = [];
  while ( tx <= endx && t <= this.m.duration ) {
    this.tmetadata_gtimeline_mark_x.push(tx);
    this.tmetadata_gtimeline_mark_time_str.push( this._time2str(t) );

    t = t + 1;
    tx = tx + this.tmetadata_width_per_sec;
  }
  if ( t >= this.m.duration ) {
    this.tmetadata_gtimeline_tend = this.m.duration;
  } else {
    this.tmetadata_gtimeline_tend = t - 1;
  }
  this.tmetadata_gtimeline_xend = this.tmetadata_gtimeline_xstart + (this.tmetadata_gtimeline_tend - this.tmetadata_gtimeline_tstart) * this.tmetadata_width_per_sec;

  // asynchronously pull out the metadata in the current group timeline boundary
  this.tmetadata_gtimeline_mid = {};
  this._tmetadata_boundary_fetch_all_mid();
  //setTimeout( this._tmetadata_boundary_fetch_all_mid.bind(this), 0);
}

_via_temporal_segmenter.prototype._tmetadata_boundary_fetch_all_mid = function() {
  // gather all temporal mid
  for ( var gindex in this.gid_list ) {
    this._tmetadata_boundary_fetch_gid_mid( this.gid_list[gindex] );
  }
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_draw_all = function() {
  for ( var gindex in this.gid_list ) {
    this._tmetadata_group_gid_draw( this.gid_list[gindex] );
  }
}

_via_temporal_segmenter.prototype._tmetadata_boundary_fetch_gid_mid = function(gid) {
  this.tmetadata_gtimeline_mid[gid] = [];
  var mid_list = [];
  var mindex, mid, t0, t1;
  for ( mindex in this.group[gid] ) {
    mid = this.group[gid][mindex];
    if ( this.d.store.metadata[mid].z.length === 2 &&
         this.d.store.metadata[mid].xy.length === 0
       ) {
      t0 = this.d.store.metadata[mid].z[0];
      t1 = this.d.store.metadata[mid].z[1];

      if ( (t0 >= this.tmetadata_gtimeline_tstart &&
            t0 <= this.tmetadata_gtimeline_tend) ||
           (t1 >= this.tmetadata_gtimeline_tstart &&
            t1 <= this.tmetadata_gtimeline_tend) ||
           (t0 <= this.tmetadata_gtimeline_tstart &&
            t1 >= this.tmetadata_gtimeline_tend)
         ) {
        this.tmetadata_gtimeline_mid[gid].push(mid);
      }
    }
  }
  this.tmetadata_gtimeline_mid[gid].sort( this._compare_mid_by_time.bind(this) );
}

//
// group timeline (common to all group-id and shown at top)
//
_via_temporal_segmenter.prototype._tmetadata_gtimeline_init = function() {
  this.gtimeline = document.createElement('canvas');
  this.gtimeline.setAttribute('class', 'gtimeline');
  this.gtimeline.addEventListener('mousedown', this._tmetadata_gtimeline_mousedown.bind(this));
  this.gtimeline.addEventListener('mouseup', this._tmetadata_gtimeline_mouseup.bind(this));
  this.gtimeline.addEventListener('mousemove', this._tmetadata_gtimeline_mousemove.bind(this));
  this.gtimeline.addEventListener('mouseout', this._tmetadata_gtimeline_mouseout.bind(this));

  this.gtimeline.width = this.timeline_container_width;
  this.gtimeline.height = this.linehn[this.GTIMELINE_HEIGHT];
  this.gtimelinectx = this.gtimeline.getContext('2d', {alpha:false});

  this.gtimeline.addEventListener('wheel', this._tmetadata_gtimeline_wheel_listener.bind(this));
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_wheel_listener = function(e) {
  var offset = this.TEMPORAL_SEG_MOVE_OFFSET;
  if(e.shiftKey) {
    offset = offset * 60;
  }
  // pan temporal segment horizontally
  if (e.deltaY < 0) {
    if( (this.m.currentTime + offset) > this.m.duration) {
      offset = this.m.duration - this.m.currentTime;
    }
    this._tmetadata_boundary_move(offset);
  } else {
    if( (this.m.currentTime - offset) < 0.0) {
      offset = this.m.currentTime;
    }
    this._tmetadata_boundary_move(-offset);
  }
  this._tmetadata_gtimeline_draw();
  this._tmetadata_group_gid_draw_all();

  e.preventDefault();
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_zoomin = function() {
  var wps = this.tmetadata_width_per_sec + this.GTIMELINE_ZOOM_OFFSET;
  if ( wps < this.gtimeline.width ) {
    this.tmetadata_width_per_sec = wps;
    this._tmetadata_boundary_update(this.tmetadata_gtimeline_tstart);
    this._redraw_timeline();
    this._redraw_all();
  }
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_zoomout = function() {
  var wps = this.tmetadata_width_per_sec - this.GTIMELINE_ZOOM_OFFSET;
  if ( wps > 1 ) {
    this.tmetadata_width_per_sec = wps;
    this._tmetadata_boundary_update(this.tmetadata_gtimeline_tstart);
    this._redraw_timeline();
    this._redraw_all();
  }
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_clear = function() {
  this.gtimelinectx.fillStyle = '#ffffff';
  this.gtimelinectx.fillRect(0, 0, this.gtimeline.width, this.gtimeline.height);
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_draw = function() {
  this._tmetadata_gtimeline_clear();

  // draw line
  this.gtimelinectx.strokeStyle = '#707070';
  this.gtimelinectx.fillStyle = '#707070';
  this.gtimelinectx.lineWidth = this.DRAW_LINE_WIDTH;
  this.gtimelinectx.beginPath();
  this.gtimelinectx.moveTo(this.tmetadata_gtimeline_xstart, this.linehn[3]);
  this.gtimelinectx.lineTo(this.tmetadata_gtimeline_xend, this.linehn[3]);
  this.gtimelinectx.stroke();

  // draw arrows at the end to indicate that more timeline is available
  if(Math.abs(this.tmetadata_gtimeline_tstart - 0.0) > 0.001) {
    // left arrow
    this.gtimelinectx.beginPath();
    this.gtimelinectx.moveTo(this.tmetadata_gtimeline_xstart, this.linehn[3]);
    this.gtimelinectx.lineTo(1, this.linehn[3]);
    this.gtimelinectx.lineTo(this.linehb2, this.linehn[3] - this.linehb2);
    this.gtimelinectx.lineTo(this.linehb2, this.linehn[3] + this.linehb2);
    this.gtimelinectx.lineTo(1, this.linehn[3]);
    this.gtimelinectx.stroke();
    this.gtimelinectx.fill();
  }
  if(Math.abs(this.tmetadata_gtimeline_tend - this.m.duration) > 0.001) {
    // right arrow
    this.gtimelinectx.beginPath();
    this.gtimelinectx.moveTo(this.tmetadata_gtimeline_xend, this.linehn[3]);
    this.gtimelinectx.lineTo(this.timeline_container_width - 1, this.linehn[3]);
    this.gtimelinectx.lineTo(this.timeline_container_width - this.linehb2 - 1, this.linehn[3] - this.linehb2);
    this.gtimelinectx.lineTo(this.timeline_container_width - this.linehb2 - 1, this.linehn[3] + this.linehb2);
    this.gtimelinectx.lineTo(this.timeline_container_width - 1, this.linehn[3]);
    this.gtimelinectx.stroke();
    this.gtimelinectx.fill();
  }

  if ( this.tmetadata_gtimeline_mark_x.length ) {
    // draw tick labels
    this.gtimelinectx.fillStyle = '#666666';
    this.gtimelinectx.font = '11px Sans';
    var last_mark_x = this.tmetadata_gtimeline_mark_x[0];
    var tick_width = this.gtimelinectx.measureText(this.tmetadata_gtimeline_mark_time_str[0]).width;
    var dx;
    this.gtimelinectx.beginPath();
    for ( var i = 0; i < this.tmetadata_gtimeline_mark_x.length; ++i ) {
      dx = this.tmetadata_gtimeline_mark_x[i] - last_mark_x;
      if ( i === 0 || dx > tick_width ) {
        // draw tick
        this.gtimelinectx.moveTo(this.tmetadata_gtimeline_mark_x[i], this.linehn[3]);
        this.gtimelinectx.lineTo(this.tmetadata_gtimeline_mark_x[i], this.linehn[4]);

        // draw label
        this.gtimelinectx.fillText(this.tmetadata_gtimeline_mark_time_str[i],
                                   this.tmetadata_gtimeline_mark_x[i], this.linehn[5] );
        last_mark_x = this.tmetadata_gtimeline_mark_x[i];
      } else {
        // avoid crowding of labels
        continue;
      }
    }
    // draw mark at the end
    this.gtimelinectx.moveTo(this.tmetadata_gtimeline_xend, this.linehn[3]);
    this.gtimelinectx.lineTo(this.tmetadata_gtimeline_xend, this.linehn[4]);

    this.gtimelinectx.stroke();
  }

  // the remaining vertical space (at the bottom) is used to draw audio channel amplitude
  // drawing of audio visualization is triggered by _tmetadata_init() which in
  // turn continually triggers the _tmetadata_gtimeline_draw_audio() method
  // in _redraw_all()
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_draw_audio = function() {
  if(!this.m.paused && this.audio_analyser_active) {
    var x = this._tmetadata_gtimeline_time2canvas(this.m.currentTime);
    this.analyser.getFloatTimeDomainData(this.audio_data);
    var avg = 0.0;
    for(var i=0; i<this.audio_data.length; ++i) {
      avg += Math.abs(this.audio_data[i]);
    }
    avg = avg / this.audio_data.length;

    var max_height = (this.linehn[20] - this.linehn[4]);
    var y = Math.round( avg * max_height );
    this.gtimelinectx.fillStyle = '#4d4d4d';
    this.gtimelinectx.lineWidth = this.DRAW_LINE_WIDTH;
    this.gtimelinectx.fillRect(x, Math.max(this.linehn[10], this.linehn[16] - y), 2, 2*y);
  }
}

_via_temporal_segmenter.prototype._tmetadata_draw_currenttime_mark = function(tnow, t_last_paused) {
  // clear previous mark
  this.gtimelinectx.fillStyle = '#ffffff';
  this.gtimelinectx.fillRect(this.tmetadata_gtimeline_xstart - 1, 0, this.tmetadata_timelinew, this.linehn[3] - 1);
  this.gtimelinectx.fillRect(this.tmetadata_gtimeline_xstart - 1, this.linehn[5] + 1, this.tmetadata_timelinew, this.linehn[12]);
  if ( tnow >= this.tmetadata_gtimeline_tstart &&
       tnow <= this.tmetadata_gtimeline_tend ) {
    // draw marker for video time corresponding to last paused time
    this._tmetadata_draw_time_mark(t_last_paused, this.gtimelinectx, '#cccccc', false);
    // draw marker for video time corresponding to current video frame
    this._tmetadata_draw_time_mark(tnow, this.gtimelinectx, 'black', true);
  }
}

_via_temporal_segmenter.prototype._tmetadata_draw_time_mark = function(t, ctx, color, showtime) {
  // draw vertical line video time
  var markx = this._tmetadata_gtimeline_time2canvas(t);
  this.gtimelinectx.strokeStyle = color;
  this.gtimelinectx.beginPath();
  this.gtimelinectx.moveTo(markx, 0);
  this.gtimelinectx.lineTo(markx, this.linehn[3]);
  this.gtimelinectx.moveTo(markx, this.linehn[5] + 1);
  this.gtimelinectx.lineTo(markx, this.gtimeline.height);
  this.gtimelinectx.stroke();

  if(showtime) {
    // draw current time : HH:MM:SS
    this.gtimelinectx.font = '24px Sans';
    this.gtimelinectx.fillStyle = color;
    var hhmmss = this._time2hhmmss(t);
    var hhmmss_width = this.gtimelinectx.measureText(hhmmss).width;
    var ms = this._time2ms(t);
    var ms_width = this.gtimelinectx.measureText(ms).width;

    var x_hhmmss = markx + this.linehn[1];
    var x_ms = x_hhmmss + hhmmss_width + 2;
    var total_width = hhmmss_width + ms_width + 2;
    if( (markx + total_width) > this.tmetadata_gtimeline_xend) {
      x_hhmmss = markx - total_width - this.linehn[1];
      x_ms = x_hhmmss + hhmmss_width + 2;
    }
    this.gtimelinectx.fillText(hhmmss, x_hhmmss, this.linehn[3] - this.linehb2 - 2);
    this.gtimelinectx.font = '12px Sans';
    this.gtimelinectx.fillText(ms, x_ms, this.linehn[3] - this.linehb2 - 2);
  }
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_canvas2time = function(x) {
  var T = this.tmetadata_gtimeline_tend - this.tmetadata_gtimeline_tstart;
  var W = this.tmetadata_gtimeline_xend - this.tmetadata_gtimeline_xstart;
  var dx = x - this.padx;
  return this.tmetadata_gtimeline_tstart + ((T * dx) / W);
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_time2canvas = function(t) {
  var canvas_x;
  if ( t < this.tmetadata_gtimeline_tstart ||
       t > this.tmetadata_gtimeline_tend ) {
    // clamp to canvas boundary
    if ( t < this.tmetadata_gtimeline_tstart ) {
      canvas_x = this.tmetadata_gtimeline_xstart;
    } else {
      canvas_x = this.tmetadata_gtimeline_xend;
    }
  } else {
    var sec = Math.floor(t);
    var sec_mark_index = sec - this.tmetadata_gtimeline_tstart;
    var ms = t - sec;
    var ms_x = Math.ceil(ms * this.tmetadata_width_per_sec);
    canvas_x = this.tmetadata_gtimeline_mark_x[sec_mark_index] + ms_x;
  }
  return canvas_x;
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_mousemove= function(e) {
  if(this.gtimeline_drag_ongoing) {
    var t = this._tmetadata_gtimeline_canvas2time(e.offsetX);
    this.m.currentTime = t;
  }
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_mousedown = function(e) {
  this.gtimeline_drag_ongoing = true;
  var t = this._tmetadata_gtimeline_canvas2time(e.offsetX);
  this.m.currentTime = t;
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_mouseup = function(e) {
  this.gtimeline_drag_ongoing = false;
  _via_util_msg_show('Press <span class="key">a</span> to add a new temporal segment at current time.');
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_mouseout = function(e) {
  this.gtimeline_drag_ongoing = false;
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_is_on_smark = function(t) {
  var smark_time;
  for ( var smark_time_str in this.smid ) {
    smark_time = parseFloat(smark_time_str);
    if ( Math.abs(smark_time - t) <= this.GTIMELINE_REGION_MARKER_MOUSE_TOL ) {
      return smark_time_str;
    }
  }
  return '';
}

//
// metadata for a given group-id
//
_via_temporal_segmenter.prototype._tmetadata_group_update_gid = function(e) {
  var old_gid = e.target.dataset.gid;
  var new_gid = e.target.value.trim();
  var mindex, mid;
  var av_update_list = [];
  for ( mindex in this.group[old_gid] ) {
    mid = this.group[old_gid][mindex]
    av_update_list.push( {'mid':mid,
                          'aid':this.groupby_aid,
                          'avalue':new_gid,
                         } );
  }

  this.d.metadata_update_av_bulk(this.vid, av_update_list).then( function(ok) {
    this.group[new_gid] = this.group[old_gid];
    delete this.group[old_gid];
    var gindex = this.gid_list.indexOf(old_gid);
    this.gid_list[gindex] = new_gid;

    this._tmetadata_gmetadata_update();
    delete this.tmetadata_gtimeline_mid[old_gid];
    this._tmetadata_boundary_fetch_gid_mid(new_gid);
    this._tmetadata_group_gid_draw(new_gid);

    // update selection to new_gid
    if ( this.selected_gid === old_gid ) {
      var new_gindex = this.gid_list.indexOf(new_gid);
      this._tmetadata_group_gid_sel(new_gindex);
    }
  }.bind(this), function(err) {
    console.warn('_via_data.metadata_update_av_bulk() failed');
  }.bind(this));
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_init = function(gid) {
  this.gcanvas[gid] = document.createElement('canvas');
  this.gcanvas[gid].setAttribute('data-gid', gid);
  this.gcanvas[gid].setAttribute('data-gindex', this.gid_list.indexOf(gid));
  this.gcanvas[gid].width = this.timeline_container_width;
  this.gcanvas[gid].height = this.linehn[12];
  this.gctx[gid] = this.gcanvas[gid].getContext('2d', {alpha:false});

  this.gcanvas[gid].addEventListener('mousemove', this._tmetadata_group_gid_mousemove.bind(this));
  this.gcanvas[gid].addEventListener('mousedown', this._tmetadata_group_gid_mousedown.bind(this));
  this.gcanvas[gid].addEventListener('mouseup', this._tmetadata_group_gid_mouseup.bind(this));
  this.gcanvas[gid].addEventListener('wheel', this._tmetadata_gtimeline_wheel_listener.bind(this));

  this._tmetadata_group_gid_draw(gid);
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_clear = function(gid) {
  this.gctx[gid].fillStyle = '#ffffff';
  this.gctx[gid].fillRect(0, 0, this.gcanvas[gid].width, this.gcanvas[gid].height);
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_draw = function(gid, debug) {
  this._tmetadata_group_gid_clear(gid);
  this._tmetadata_group_gid_draw_boundary(gid);
  this._tmetadata_group_gid_draw_metadata(gid);
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_draw_boundary = function(gid) {
  this.gctx[gid].strokeStyle = '#000000';
  this.gctx[gid].fillStyle = '#000000';
  this.gctx[gid].lineWidth = this.DRAW_LINE_WIDTH;

  // draw boundary marker
  this.gctx[gid].fillRect(1, 1, this.tmetadata_gtimeline_xstart - 2, this.linehn[12] - 1);
  this.gctx[gid].fillRect(this.tmetadata_gtimeline_xstart + this.tmetadata_timelinew,
                          1, this.padx - 1, this.linehn[12] - 1);

  this.gctx[gid].fillStyle = '#ffffff';
  if(Math.abs(this.tmetadata_gtimeline_tstart - 0.0) > 0.001) {
    // draw arrows to indicate that more timeline is available
    var x0 = this.linehb2;
    this.gctx[gid].beginPath();
    for(var dy = this.linehn[1]; dy < this.linehn[12]; dy = dy + this.linehn[2]) {
      this.gctx[gid].moveTo(x0 + 2, dy);
      this.gctx[gid].lineTo(x0 + this.linehb2 + 2, - this.linehb2 + dy);
      this.gctx[gid].lineTo(x0 + this.linehb2 + 2, this.linehb2 + dy);
      this.gctx[gid].lineTo(x0 + 2, dy);
    }
    this.gctx[gid].fill();
  }

  if(Math.abs(this.tmetadata_gtimeline_tend - this.m.duration) > 0.001) {
    // draw arrows to indicate that more timeline is available
    var x0 = this.tmetadata_gtimeline_xstart + this.tmetadata_timelinew + this.linehn[1] + this.linehb2;
    this.gctx[gid].beginPath();
    for(var dy = this.linehn[1]; dy < this.linehn[12]; dy = dy + this.linehn[2]) {
      this.gctx[gid].moveTo(x0 - 2, dy);
      this.gctx[gid].lineTo(x0 - this.linehb2 - 2, -this.linehb2 + dy);
      this.gctx[gid].lineTo(x0 - this.linehb2 - 2, this.linehb2 + dy);
      this.gctx[gid].lineTo(x0 - 2, dy);
    }
    this.gctx[gid].fill();
  }
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_mark_selected = function() {
  var gid = this.selected_gid;
  var mid = this.selected_mid;
  var t0, t1, x0, x1;
  t0 = this.d.store.metadata[mid].z[0];
  t1 = this.d.store.metadata[mid].z[1];
  x0 = this._tmetadata_gtimeline_time2canvas(t0);
  x1 = this._tmetadata_gtimeline_time2canvas(t1);

  // draw arrow extending to the edges of temporal segment
  this.gctx[gid].fillStyle = '#808080';
  this.gctx[gid].strokeStyle = '#808080';

  this.gctx[gid].lineWidth = this.DRAW_LINE_WIDTH;
  this.gctx[gid].beginPath();
  this.gctx[gid].moveTo(x0 + 2, this.linehn[2]);
  this.gctx[gid].lineTo(x0 + this.linehb2 + 2, this.linehn[2] - this.linehb2);
  this.gctx[gid].lineTo(x0 + this.linehb2 + 2, this.linehn[2] + this.linehb2);
  this.gctx[gid].lineTo(x0 + 2, this.linehn[2]);
  this.gctx[gid].lineTo(x1 - 1, this.linehn[2]);
  this.gctx[gid].lineTo(x1 - this.linehb2 - 1, this.linehn[2] - this.linehb2);
  this.gctx[gid].lineTo(x1 - this.linehb2 - 1, this.linehn[2] + this.linehb2);
  this.gctx[gid].lineTo(x1 - 1, this.linehn[2]);
  this.gctx[gid].stroke();
  this.gctx[gid].fill();

  // draw edge time if an edge is being updated
  if ( this.edge_show_time !== -1 ) {
    this.gctx[gid].font = '10px Sans';
    this.gctx[gid].fillStyle = '#000000';

    var time_str = this.d.store.metadata[this.selected_mid].z[this.edge_show_time].toFixed(3);
    if ( this.edge_show_time === 0 ) {
      this.gctx[gid].fillText(time_str, x0 + this.char_width, this.linehn[1]);
    } else {
      var twidth = this.gctx[gid].measureText(time_str).width;
      this.gctx[gid].fillText(time_str, x1 - twidth, this.linehn[1]);
    }
  }
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_draw_metadata = function(gid) {
  if ( this.tmetadata_gtimeline_mid.hasOwnProperty(gid) ) {
    for ( var mindex in this.tmetadata_gtimeline_mid[gid] ) {
      var mid = this.tmetadata_gtimeline_mid[gid][mindex];
      if(mid !== this.selected_mid) {
        this._tmetadata_group_gid_draw_mid(gid, mid);
      }
    }
    // draw selected region again (so that it appears on top)
    if ( this.selected_gid === gid &&
         this.selected_mindex !== -1
       ) {
      this._tmetadata_group_gid_draw_mid(gid, this.selected_mid);
      this._tmetadata_group_gid_mark_selected();
    }
  }
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_draw_mid = function(gid, mid) {
  var t0, t1, x0, x1;
  t0 = this.d.store.metadata[mid].z[0];
  t1 = this.d.store.metadata[mid].z[1];
  x0 = this._tmetadata_gtimeline_time2canvas(t0);
  x1 = this._tmetadata_gtimeline_time2canvas(t1);

  // draw metadata block
  if ( gid === this.selected_gid &&
       mid === this.selected_mid ) {
    this.gctx[gid].fillStyle = '#4d4d4d';
    if ( this.metadata_resize_is_ongoing || this.metadata_move_is_ongoing ) {
      if ( this.metadata_resize_is_ongoing ) {
        x0 = this.metadata_ongoing_update_x[0];
        x1 = this.metadata_ongoing_update_x[1];
      } else {
        x0 = this.metadata_ongoing_update_x[0] + this.metadata_move_dx;
        x1 = this.metadata_ongoing_update_x[1] + this.metadata_move_dx;
      }
    }
  } else {
    var gindex = this.gid_list.indexOf(gid);
    var mindex = this.tmetadata_gtimeline_mid[gid].indexOf(mid);
    var bcolor = this.COLOR_LIST[ mindex % this.NCOLOR ];
    this.gctx[gid].fillStyle = bcolor;
  }

  var metadata_block_width = x1 - x0;
  var r = this.TEMPORAL_SEG_RADIUS * this.char_width;

  if(metadata_block_width < 2*r) {
    // draw a simple marker
    this.gctx[gid].fillRect(x0, this.linehn[1] + 1, x1 - x0, this.linehn[12] - 1);
    return;
  }

  // draw rounded rect
  this.gctx[gid].beginPath();
  this.gctx[gid].moveTo(x0 + r, this.linehn[1] + 1); // top line
  this.gctx[gid].lineTo(x1 - r, this.linehn[1] + 1);
  this.gctx[gid].arcTo(x1, this.linehn[1] + 1, x1, this.linehn[1] + 1 + r, r); // top-right curve
  this.gctx[gid].lineTo(x1, this.linehn[12] - 1 - r);
  this.gctx[gid].arcTo(x1, this.linehn[12] - 1, x1 - r, this.linehn[12] - 1, r); // bottom-right curve
  this.gctx[gid].lineTo(x0 + r, this.linehn[12] - 1);
  this.gctx[gid].arcTo(x0, this.linehn[12] - 1, x0, this.linehn[12] - 1 - r, r); // bottom-left curve
  this.gctx[gid].lineTo(x0, this.linehn[1] - r);
  this.gctx[gid].lineTo(x0 + r, this.linehn[1] + 1);
  this.gctx[gid].fill();

  if(metadata_block_width < 50) {
    return;
  }

  // draw the subtitle text
  this.gctx[gid].font = '12px Sans';
  if ( gid === this.selected_gid &&
       mid === this.selected_mid ) {
    this.gctx[gid].fillStyle = 'white';
  } else {
    this.gctx[gid].fillStyle = 'black';
  }

  var lineheight = 16;
  var subtitle = this.d.store.metadata[mid]['av'][this.groupby_aid];
  var words = subtitle.split(' ');
  var line = '';
  var y = this.linehn[4];

  for(var i = 0; i < words.length; i++) {
    var testLine = line + words[i] + ' ';
    var metrics = this.gctx[gid].measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > (metadata_block_width - this.char_width)  && i > 0) {
      this.gctx[gid].fillText(line, x0 + this.char_width, y);
      line = words[i] + ' ';
      y += lineheight;
      if(y >= this.linehn[12]) {
        break; // no more vertical space left to draw
      }
    } else {
      line = testLine;
    }
  }
  if(y < this.linehn[12]) {
    this.gctx[gid].fillText(line, x0 + this.char_width, y);
  }
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_sel = function(gindex) {
  var old_selected_gindex = this.selected_gindex;

  this.selected_gindex = gindex;
  this.selected_gid = this.gid_list[this.selected_gindex];
  this.selected_mindex = -1;
  this.selected_mid = '';

  this.edge_show_time = -1;
  this._tmetadata_group_gid_draw(this.selected_gid);
  this.gcanvas[this.selected_gid].scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});

  // update old selection
  if ( old_selected_gindex !== -1 ) {
    if ( this.gid_list.hasOwnProperty(old_selected_gindex) ) {
      var old_selected_gid = this.gid_list[old_selected_gindex];
      this._tmetadata_group_gid_draw(old_selected_gid);
    }
  }
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_sel_metadata = function(mindex, emit_event) {
  if(typeof(emit_event) === 'undefined') {
    var emit_event = true;
  }

  var old_selected_mindex = this.selected_mindex;
  this.selected_mindex = mindex;
  this.selected_mid = this.tmetadata_gtimeline_mid[this.selected_gid][mindex];
  if(this.metadata_resize_is_ongoing) {
    var edge_index = this.metadata_resize_edge_index;
    this.m.currentTime = this.d.store.metadata[this.selected_mid].z[edge_index];
  } else {
    this.m.currentTime = this.d.store.metadata[this.selected_mid].z[0];
  }
  //this._tmetadata_group_gid_draw(this.selected_gid);
  _via_util_msg_show('Metadata selected. ' +
                     'Use <span class="key">l</span> or <span class="key">r</span> to expand and ' +
                     '<span class="key">L</span> or <span class="key">R</span> to reduce segment. ' +
                     'Press <span class="key">&larr;</span>&nbsp;<span class="key">&rarr;</span> to move (combine with <span class="key">Shift</span> to merge segments), ' +
                     '<span class="key">Backspace</span> to delete and ' +
                     '<span class="key">Esc</span> to unselect.', true);
  if(emit_event) {
    this.emit_event('metadata_select', { 'mid':this.selected_mid });
  }
}

_via_temporal_segmenter.prototype._tmetadata_sel_metadata_edge_snap_nbd = function(zi) {
  var nbd_zi = [+Infinity, -1]; // [edge_distance, edge_time]
  for(var mindex = 0; mindex < this.tmetadata_gtimeline_mid[this.selected_gid].length; ++mindex) {
    if(mindex !== this.selected_mindex) {
      var mid = this.tmetadata_gtimeline_mid[this.selected_gid][mindex];
      var dt0 = Math.abs(this.d.store.metadata[mid].z[0] - zi);
      var dt1 = Math.abs(this.d.store.metadata[mid].z[1] - zi);
      var dt = Math.min(dt0, dt1);
      if(dt < nbd_zi[0]) {
        nbd_zi[0] = dt;
        if(dt0 < dt1) {
          nbd_zi[1] = this.d.store.metadata[mid].z[0];
        } else {
          nbd_zi[1] = this.d.store.metadata[mid].z[1];
        }
      }
    }
  }

  // check if the edge is closer to time markers in video timeline (start and end times are marked by default)
  var timeline_marks = [0.0, this.fa.last_paused_time, this.m.duration];
  for(var i in timeline_marks) {
    var zmark = timeline_marks[i];
    var dt = Math.abs(zmark - zi);
    if(dt < nbd_zi[0]) {
      nbd_zi[0] = dt;
      nbd_zi[1] = zmark;
    }
  }
  return nbd_zi;
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_remove_mid_sel = function(mindex) {
  var unselected_mid = this.selected_mid;
  this.selected_mindex = -1;
  this.selected_mid = '';
  this.edge_show_time = -1;
  //this._tmetadata_group_gid_draw(this.selected_gid);

  _via_util_msg_show('Use <span class="key">a</span> to add a new temporal segment', true);

  this.emit_event('metadata_unselect', { 'mid':unselected_mid });
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_sel_metadata_at_time = function() {
  var t = this.m.currentTime;
  var mindex = this._tmetadata_group_gid_metadata_at_time(t);
  if ( mindex !== -1 ) {
    this._tmetadata_group_gid_sel_metadata(mindex);
  }
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_metadata_at_time = function(t) {
  var mindex, mid;
  for ( mindex in this.tmetadata_gtimeline_mid[this.selected_gid] ) {
    mid = this.tmetadata_gtimeline_mid[this.selected_gid][mindex];
    if ( t >= this.d.store.metadata[mid].z[0] &&
         t <= this.d.store.metadata[mid].z[1]
       ) {
      return parseInt(mindex);
    }
  }
  return -1;
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_sel_next_metadata = function() {
  var sgid = this.gid_list[this.selected_gindex];
  if ( this.selected_mindex === -1 ) {
    if ( this.tmetadata_gtimeline_mid.hasOwnProperty(sgid) ) {
      if ( this.tmetadata_gtimeline_mid[sgid].length ) {
        // select first mid
        this._tmetadata_group_gid_sel_metadata(0);
      }
    }
  } else {
    var next_mindex = this.selected_mindex + 1;
    if ( next_mindex >= this.tmetadata_gtimeline_mid[sgid].length ) {
      next_mindex = 0;
    }
    this._tmetadata_group_gid_sel_metadata(next_mindex);
  }
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_sel_prev_metadata = function() {
  var sgid = this.gid_list[this.selected_gindex];
  if ( this.selected_mindex === -1 ) {
    if ( this.tmetadata_gtimeline_mid.hasOwnProperty(sgid) ) {
      if ( this.tmetadata_gtimeline_mid[sgid].length ) {
        this._tmetadata_group_gid_sel_metadata(this.tmetadata_gtimeline_mid[sgid].length - 1);
      }
    }
  } else {
    var prev_mindex = this.selected_mindex - 1;
    if ( prev_mindex < 0 ) {
      prev_mindex =  this.tmetadata_gtimeline_mid[sgid].length - 1;
    }
    this._tmetadata_group_gid_sel_metadata(prev_mindex);
  }
}

_via_temporal_segmenter.prototype._tmetadata_mid_update_edge = function(eindex, dz) {
  this.edge_show_time = eindex;
  // to ensure only 3 decimal values are stored for time
  var new_value = this.d.store.metadata[this.selected_mid].z[eindex] + dz;
  new_value = _via_util_float_to_fixed(new_value, 3);

  // consistency check
  if ( eindex === 0 ) {
    if ( new_value >= this.d.store.metadata[this.selected_mid].z[1] ) {
      _via_util_msg_show('Cannot update left edge!');
      return;
    }
  } else {
    if ( new_value <= this.d.store.metadata[this.selected_mid].z[0] ) {
      _via_util_msg_show('Cannot update right edge!');
      return;
    }
  }
  if ( new_value < 0.0 || new_value > this.m.duration ) {
    _via_util_msg_show('Cannot update edge beyond the boundary!');
    return;
  }

  this.d.metadata_update_zi(this.file.fid,
                            this.selected_mid,
                            eindex,
                            new_value
                           );
  this.m.currentTime = new_value;
  this.emit_event('metadata_update', {'mid':this.selected_mid, 'eindex':eindex})
}

_via_temporal_segmenter.prototype._tmetadata_mid_move = function(dt) {
  var n = this.d.store.metadata[this.selected_mid].z.length;
  var newz = this.d.store.metadata[this.selected_mid].z.slice();
  for ( var i = 0; i < n; ++i ) {
    newz[i] = parseFloat((parseFloat(newz[i]) + dt).toFixed(3));
    if ( newz[i] < 0 || newz[i] > this.m.duration ) {
      _via_util_msg_show('Cannot move temporal segment beyond the boundary!');
      return;
    }
  }
  this.d.metadata_update_z(this.vid, this.selected_mid, newz).then( function(ok) {
    this.m.currentTime = this.d.store.metadata[this.selected_mid].z[0];

    // the move operation may have changed the sequential order of mid
    this._tmetadata_boundary_fetch_gid_mid(this.selected_gid);

    // check if we need to shift timeline to show the recently moved metadata
    if ( newz[0] <= this.tmetadata_gtimeline_tstart ||
         newz[1] >= this.tmetadata_gtimeline_tend ) {
      var new_tstart = this.tmetadata_gtimeline_tstart - 1;
      if ( newz[1] >= this.tmetadata_gtimeline_tend ) {
        new_tstart = this.tmetadata_gtimeline_tstart + 1;
      }
      if ( new_tstart >= 0 ) {
        this._tmetadata_boundary_update(new_tstart)
        this._tmetadata_gtimeline_draw();
      }
    } else {
      //this._tmetadata_group_gid_draw(this.selected_gid);
    }
    this.emit_event('metadata_update', {'mid':this.selected_mid, 'eindex':-1});
  }.bind(this));
}

_via_temporal_segmenter.prototype._tmetadata_mid_del_sel = function(mid) {
  this._tmetadata_mid_del(this.selected_mid);
  this._tmetadata_group_gid_remove_mid_sel();
  _via_util_msg_show('Temporal segment deleted.');
}

_via_temporal_segmenter.prototype._tmetadata_get_mindex = function(mid) {
  return this.tmetadata_gtimeline_mid[this.selected_gid].indexOf(mid);
}

_via_temporal_segmenter.prototype._tmetadata_mid_del = function(mid) {
  var mindex = this.tmetadata_gtimeline_mid[this.selected_gid].indexOf(mid);
  if ( mindex !== -1 ) {
    this.tmetadata_gtimeline_mid[this.selected_gid].splice(mindex, 1);

    this._group_gid_del_mid(this.selected_gid, mid);
    this._tmetadata_group_gid_draw(this.selected_gid);
    this.d.metadata_delete(this.vid, mid);
    this.emit_event('metadata_delete', {'mid':this.selected_mid, 'eindex':-1});
  }
}

_via_temporal_segmenter.prototype._tmetadata_mid_split_sel = function() {
  this._tmetadata_mid_split(this.selected_mid);
  _via_util_msg_show('Temporal segment split into two.');
}

_via_temporal_segmenter.prototype._tmetadata_mid_split = function(mid) {
  var mindex = this.tmetadata_gtimeline_mid[this.selected_gid].indexOf(mid);
  if ( mindex !== -1 ) {
    var tnow = this.m.currentTime;
    if(tnow < this.d.store.metadata[mid].z[0] ||
       tnow > this.d.store.metadata[mid].z[1]) {
      _via_util_msg_show('To perform split operation, you must position current playback time within the boundary of selected temporal segment.');
      return;

    }
    var new_right_edge_t = _via_util_float_to_fixed(tnow, 3);

    var new_z = [new_right_edge_t, this.d.store.metadata[mid].z[1] ];
    var new_av = this.d.store.metadata[mid].av; // duplicate subtitle
    this.d.metadata_add(this.vid, new_z, [], new_av).then( function(ok) {
      this.d.metadata_update_zi(this.file.fid, mid, 1, new_right_edge_t);
      this.metadata_last_added_mid = ok.mid;
      this._tmetadata_group_gid_draw(this.selected_gid);
      this.emit_event('metadata_add', {'mid':ok.mid, 'eindex':-1});
    }.bind(this), function(err) {
      _via_util_msg_show('Failed to add metadata!');
      console.log(err);
    }.bind(this));
  }
}

_via_temporal_segmenter.prototype._tmetadata_mid_update_last_added_end_edge_to_time = function(t) {
  if ( this.d.store.metadata.hasOwnProperty(this.metadata_last_added_mid) ) {
    var z_now = this.d.store.metadata[this.metadata_last_added_mid].z;
    var update_edge_index;
    if ( t > z_now[1] ) {
      update_edge_index = 1;
    } else {
      if ( t < z_now[0] ) {
        update_edge_index = 0;
      } else {
        var dt0 = Math.abs(z_now[0] - t);
        var dt1 = Math.abs(z_now[1] - t);
        if ( dt0 < dt1 ) {
          update_edge_index = 0;
        } else {
          update_edge_index = 1;
        }
      }
    }

    // to avoid malformed entried
    this.d.metadata_update_zi(this.file.fid,
                              this.metadata_last_added_mid,
                              update_edge_index,
                              t
                             );
    this._tmetadata_boundary_fetch_gid_mid(this.selected_gid);
    this._tmetadata_group_gid_draw(this.selected_gid);
  }
}

_via_temporal_segmenter.prototype._tmetadata_mid_add_at_time = function(t) {
  var z = [ t ];
  if ( z[0] < 0 ) {
    z[0] = 0.0;
  }

  z[1] = z[0] + this.DEFAULT_TEMPORAL_SEG_LEN;
  if ( z[1] > this.m.duration ) {
    z[1] = this.m.duration;
  }

  z = _via_util_float_arr_to_fixed(z, 3);
  // avoid adding same overlapping segments
  if ( this.d.store.metadata.hasOwnProperty(this.metadata_last_added_mid) ) {
    var z0 = this.d.store.metadata[this.metadata_last_added_mid].z;
    if ( z0[0] === z[0] && z0[1] === z[1] ) {
      _via_util_msg_show('A temporal segment of same size already exists.');
      return;
    }
  }
  var xy = [];
  var metadata = {};
  metadata[ this.groupby_aid ] = "";
  this.d.metadata_add(this.vid, z, xy, metadata).then( function(ok) {
    this.metadata_last_added_mid = ok.mid;
    this._tmetadata_group_gid_draw(this.selected_gid);
    this.emit_event('metadata_add', {'mid':ok.mid, 'eindex':-1});
    _via_util_msg_show('Temporal segment added. Press <span class="key">Enter</span> to select temporal at current position or press <span class="key">Shift</span> + <span class="key">Enter</span> to select temporal segment and edit its subtitle text.');
  }.bind(this), function(err) {
    _via_util_msg_show('Failed to add metadata!');
    console.log(err);
  }.bind(this));
}

_via_temporal_segmenter.prototype._tmetadata_mid_merge = function(eindex) {
  var merge_mid;
  if ( eindex === 0 ) {
    var left_mindex = parseInt(this.selected_mindex) - 1;
    if ( left_mindex >= 0 ) {
      merge_mid = this.tmetadata_gtimeline_mid[this.selected_gid][left_mindex];
    }
  } else {
    var right_mindex = parseInt(this.selected_mindex) + 1;
    if (right_mindex < this.tmetadata_gtimeline_mid[this.selected_gid].length ) {
      merge_mid = this.tmetadata_gtimeline_mid[this.selected_gid][right_mindex];
    }
  }

  if ( typeof(merge_mid) !== 'undefined' ) {
    var new_z = this.d.store.metadata[this.selected_mid].z;
    if ( new_z[0] > this.d.store.metadata[merge_mid].z[0] ) {
      new_z[0] = this.d.store.metadata[merge_mid].z[0];
    }
    if ( new_z[1] < this.d.store.metadata[merge_mid].z[1] ) {
      new_z[1] = this.d.store.metadata[merge_mid].z[1];
    }

    var new_av = {};
    Object.assign(new_av, this.d.store.metadata[this.selected_mid]['av']);
    for(var key in this.d.store.metadata[merge_mid]['av']) {
      if(key in new_av) {
        var old_val1 = new_av[key];
        var old_val2 = this.d.store.metadata[merge_mid]['av'][key];
        if ( eindex === 0 ) {
          new_av[key] = old_val2 + ' ' + old_val1;
        } else {
          new_av[key] = old_val1 + ' ' + old_val2;
        }
      } else {
        new_av[key] = this.d.store.metadata[merge_mid]['av'][key];
      }
    }
    this._tmetadata_mid_del(merge_mid);
    // while selected mid remains consistent, mindex changes due to deletion
    this.selected_mindex = this.tmetadata_gtimeline_mid[this.selected_gid].indexOf(this.selected_mid);
    this.d.metadata_update(this.file.fid, this.selected_mid, new_z, [], new_av);
    this._tmetadata_group_gid_draw(this.selected_gid);
    if ( eindex === 0 ) {
      this.m.currentTime = new_z[0];
    } else {
      this.m.currentTime = new_z[1];
    }
    this.emit_event('metadata_update', {'mid':this.selected_mid, 'eindex':-1});
    _via_util_msg_show('Temporal segments merged.');
  } else {
    _via_util_msg_show('Merge is not possible without temporal segments in the neighbourhood');
  }
}

_via_temporal_segmenter.prototype._tmetadata_mid_change_gid = function(from_gindex,
                                                                       to_gindex) {
  var from_gid = this.gid_list[from_gindex];
  var to_gid = this.gid_list[to_gindex];
  var mid_to_move = this.tmetadata_gtimeline_mid[from_gid][this.selected_mindex];
  var mindex_to_move = this.selected_mindex;

  // update metadata
  this.d.store.metadata[mid_to_move].av[this.groupby_aid] = to_gid;

  this._tmetadata_group_gid_remove_mid_sel(mindex_to_move);
  this.tmetadata_gtimeline_mid[from_gid].splice(mindex_to_move, 1);
  var from_group_mindex = this.group[from_gid].indexOf(mid_to_move);
  this.group[from_gid].splice(from_group_mindex, 1);
  this.group[to_gid].push(mid_to_move);

  this.tmetadata_gtimeline_mid[to_gid].push(mid_to_move);
  this.tmetadata_gtimeline_mid[to_gid].sort( this._compare_mid_by_time.bind(this) );
  var moved_mindex = this.tmetadata_gtimeline_mid[to_gid].indexOf(mid_to_move);

  this._tmetadata_group_gid_sel(to_gindex);
  this._tmetadata_group_gid_sel_metadata(moved_mindex);
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_is_at_boundary_marker = function(x) {
  if( (x < (this.tmetadata_gtimeline_xstart - 2)) || (x > (this.tmetadata_gtimeline_xstart + this.tmetadata_timelinew + 2)) ) {
    if( x < (this.tmetadata_gtimeline_xstart - 2)) {
      return 1;
    } else {
      return 2;
    }
  } else {
    return 0;
  }
}

_via_temporal_segmenter.prototype._tmetadata_selected_gid_render = function(e) {
  if(this.auto_render_tmetadata_selected_gid) {
    window.requestAnimationFrame(this._tmetadata_selected_gid_render.bind(this));
  }

  this._tmetadata_group_gid_draw(this.selected_gid, '_tmetadata_selected_gid_render');
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_mousedown = function(e) {
  e.preventDefault();

  // start rendering automatically when user interaction begins (e.g. mousedown)
  // this stops when user interaction stops (e.g. mouseup)
  this.auto_render_tmetadata_selected_gid = true;
  window.requestAnimationFrame(this._tmetadata_selected_gid_render.bind(this));

  this.tmetadata_last_mousedown_x = e.offsetX;
  var x = e.offsetX;
  var gid = e.target.dataset.gid;
  var gindex = e.target.dataset.gindex;
  var t = this._tmetadata_gtimeline_canvas2time(x);

  if ( gindex !== this.selected_gindex ) {
    // select this gid
    this._tmetadata_group_gid_sel(gindex);
  }

  if( this._tmetadata_group_gid_is_at_boundary_marker(x) ) {
    this.timeline_move_is_ongoing = true;
    return;
  }

  if(this.selected_mindex !== -1) {
    // a temporal segment is already selected,
    // move and resize operation can happen only on this temporal segment
    var edge_id = this._tmetadata_group_gid_is_on_edge_of_selection(gid, t);
    if(edge_id === -1) {
      // click was not on the edge of selected segment
      // it could be a move operation
      if ( t >= this.d.store.metadata[this.selected_mid].z[0] &&
           t <= this.d.store.metadata[this.selected_mid].z[1]
         ) {
        this.metadata_move_start_x = x;
        this.metadata_move_dx = 0;
        var z = this.d.store.metadata[this.selected_mid].z;
        this.metadata_ongoing_update_x = [ this._tmetadata_gtimeline_time2canvas(z[0]),
                                           this._tmetadata_gtimeline_time2canvas(z[1])
                                         ];
        this.metadata_move_is_ongoing = true;
      } else {
        // user clicked on a different region
        var new_mindex = this._tmetadata_group_gid_get_mindex_at_time(gid, t);
        if(new_mindex === -1) {
          // clicked on empty region, so remove selection
          this._tmetadata_group_gid_remove_mid_sel(this.selected_mindex);
        } else {
          // remove selection of existing segment and select a new segment
          this._tmetadata_group_gid_sel_metadata(new_mindex);
        }
      }
    } else {
      // an edge of selected segment was clicked
      this.metadata_resize_edge_index = edge_id;
      var z = this.d.store.metadata[this.selected_mid].z;
      this.metadata_ongoing_update_x = [ this._tmetadata_gtimeline_time2canvas(z[0]),
                                         this._tmetadata_gtimeline_time2canvas(z[1])
                                       ];
      this.metadata_resize_is_ongoing = true;
    }
  } else {
    // if click was over an existing temporal segment, select that segment
    // if click was over an empty area, removed selection of an existing segment (if exists)
    var new_mindex = this._tmetadata_group_gid_get_mindex_at_time(gid, t);
    if(new_mindex !== -1) {
      // perform selection
      this._tmetadata_group_gid_sel_metadata(new_mindex);
    }
  }
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_mousemove = function(e) {
  e.preventDefault();
  var x = e.offsetX;
  var gid = e.target.dataset.gid;
  var t = this._tmetadata_gtimeline_canvas2time(x);
  if ( this.metadata_resize_is_ongoing ) {
    var nbd_zi = this._tmetadata_sel_metadata_edge_snap_nbd(t);
    if(nbd_zi[0] < this.TEMPORAL_SEG_EDGE_SNAP_TOL) {
      var x_nbd = this._tmetadata_gtimeline_time2canvas(nbd_zi[1]);
      this.metadata_ongoing_update_x[ this.metadata_resize_edge_index ] = x_nbd;
      this.m.currentTime = nbd_zi[1];
    } else {
      this.metadata_ongoing_update_x[ this.metadata_resize_edge_index ] = x;
      this.m.currentTime = t;
    }
    return;
  }

  if ( this.metadata_move_is_ongoing ) {
    // what lies in the neighbourhood of the edges of the metadata that is being moved?
    var dx = x - this.metadata_move_start_x;
    var new_x_list = [ this.metadata_ongoing_update_x[0] + dx,
                       this.metadata_ongoing_update_x[1] + dx];
    var did_snap_happen = false;
    for(var i in new_x_list) {
      var xi = new_x_list[i];
      var zi = this._tmetadata_gtimeline_canvas2time(xi);
      var nbd_zi = this._tmetadata_sel_metadata_edge_snap_nbd(zi);
      if(nbd_zi[0] < this.TEMPORAL_SEG_EDGE_SNAP_TOL) {
        did_snap_happen = true;
        var x_nbd = this._tmetadata_gtimeline_time2canvas(nbd_zi[1]);
        this.metadata_move_dx = x_nbd - this.metadata_ongoing_update_x[i];
        this.m.currentTime = nbd_zi[1];
        break;
      }
    }
    if(!did_snap_happen) {
      this.metadata_move_dx = x - this.metadata_move_start_x;
      var new_time = this._tmetadata_gtimeline_canvas2time(this.metadata_ongoing_update_x[0] + this.metadata_move_dx);
      this.m.currentTime = new_time;
    }
    return;
  }

  if(this.selected_mindex !== -1 &&
     this._tmetadata_group_gid_is_on_edge_of_selection(gid, t) !== -1) {
    this.gcanvas[gid].style.cursor = 'ew-resize';
  } else {
    this.gcanvas[gid].style.cursor = 'default';
  }

  var mindex = this._tmetadata_group_gid_get_mindex_at_time(gid, t);
  if(mindex !== -1) {
    if(this.selected_mindex === mindex) {
      this.gcanvas[gid].style.cursor = 'grab';
    }
  }
  if( this._tmetadata_group_gid_is_at_boundary_marker(x) ) {
    this.gcanvas[gid].style.cursor = 'pointer';
  }
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_mouseup = function(e) {
  e.preventDefault();
  this.auto_render_tmetadata_selected_gid = false;

  var x = e.offsetX;
  var t = this._tmetadata_gtimeline_canvas2time(e.offsetX);
  if ( this.metadata_resize_is_ongoing ) {
    var dz = t - this.d.store.metadata[this.selected_mid].z[this.metadata_resize_edge_index];
    var nbd_zi = this._tmetadata_sel_metadata_edge_snap_nbd(t);
    if(nbd_zi[0] < this.TEMPORAL_SEG_EDGE_SNAP_TOL) {
      var x_nbd = this._tmetadata_gtimeline_time2canvas(nbd_zi[1]);
      dz = nbd_zi[1] - this.d.store.metadata[this.selected_mid].z[this.metadata_resize_edge_index];
    }
    this._tmetadata_mid_update_edge(this.metadata_resize_edge_index, dz);
    this._tmetadata_group_gid_draw(this.selected_gid);

    this.metadata_resize_is_ongoing = false;
    this.metadata_resize_edge_index = -1;
    this.metadata_ongoing_update_x = [0, 0];
    return;
  }

  if ( this.metadata_move_is_ongoing ) {
    var dx = x - this.metadata_move_start_x;
    var new_x_list = [ this.metadata_ongoing_update_x[0] + dx,
                       this.metadata_ongoing_update_x[1] + dx ];
    for(var i in new_x_list) {
      var xi = new_x_list[i];
      var zi = this._tmetadata_gtimeline_canvas2time(xi);
      var nbd_zi = this._tmetadata_sel_metadata_edge_snap_nbd(zi);
      if(nbd_zi[0] < this.TEMPORAL_SEG_EDGE_SNAP_TOL) {
        var x_nbd = this._tmetadata_gtimeline_time2canvas(nbd_zi[1]);
        dx = x_nbd - this.metadata_ongoing_update_x[i];
        break;
      }
    }

    if ( Math.abs(dx) > this.DRAW_LINE_WIDTH ) {
      var dt = dx / this.tmetadata_width_per_sec;
      this._tmetadata_mid_move(dt);
    } else {
      // remove selection
      this._tmetadata_group_gid_remove_mid_sel(this.selected_mindex);
    }
    this.metadata_move_is_ongoing = false;
    this.metadata_ongoing_update_x = [0, 0];
    this._tmetadata_group_gid_draw(this.selected_gid);
    return;
  }

  if(this.timeline_move_is_ongoing) {
    var offset;
    var boundary_type = this._tmetadata_group_gid_is_at_boundary_marker(x);
    if(boundary_type !== 0) {
      if(boundary_type === 1) {
        // move to left
        offset = -1;
      } else {
        offset = 1;
      }
      this._tmetadata_boundary_move(offset);
      this._tmetadata_gtimeline_draw();
      this._tmetadata_group_gid_draw_all();
    }
    return;
  }
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_is_on_edge_of_selection = function(gid, t) {
  var mid = this.tmetadata_gtimeline_mid[gid][this.selected_mindex];
  if ( Math.abs(t - this.d.store.metadata[mid].z[0]) < this.METADATA_EDGE_TOL ) {
    return 0;
  } else {
    if ( Math.abs(t - this.d.store.metadata[mid].z[1]) < this.METADATA_EDGE_TOL ) {
      return 1;
    }
  }
  return -1;
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_get_mindex_at_time = function(gid, t) {
  var mindex, mid;
  for ( mindex in this.tmetadata_gtimeline_mid[gid] ) {
    mid = this.tmetadata_gtimeline_mid[gid][mindex];
    if ( t >= this.d.store.metadata[mid].z[0] &&
         t <= this.d.store.metadata[mid].z[1]
       ) {
      return parseInt(mindex);
    }
  }
  return -1;
}

//
// keyboard input handler
//
_via_temporal_segmenter.prototype._on_event_keydown = function(e) {
  var fid = this.file.fid;

  // play/pause
  if ( e.key === ' ' ) {
    e.preventDefault();
    if( this.show_audio && !this.audio_analyser_active) {
      this._tmetadata_audio_init();
    }
    if ( this.m.paused ) {
      this.m.play();
      if(this.selected_mindex === -1) {
        _via_util_msg_show('Playing ...');
      } else {
        _via_util_msg_show('Playing video within selected temporal segment. Press <span class="key">Esc</span> to remove selection and unlock playback.', true);
      }
    } else {
      this.m.pause();
      _via_util_msg_show('Paused. Press <span class="key">a</span> to add a temporal segment, ' +
                         '<span class="key">Tab</span> to select temporal segment, ' +
                         '<span class="key">Esc</span> to remove selection.', true);
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

  if ( e.key === 'n' || e.key === 'N' || e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    if ( ! this.m.paused ) {
      return;
    }

    var t = this.m.currentTime;
    var delt = this.EDGE_UPDATE_TIME_DELTA;
    if ( e.key === 'N' || e.key === 'P' ) {
      delt = delt * 5;
    }
    if ( e.key === 'n' || e.key === 'N') {
      t += delt;
    } else {
      t -= delt;
    }
    // clamp
    t = Math.max(0, Math.min(t, this.m.duration));
    this.m.currentTime = t;
  }

  if ( e.key === 's' || e.key === 'S' ) {
    e.preventDefault();
    this.m.pause();
    if ( e.key === 's' ) {
      if ( this.selected_mindex !== -1 ) {
        this.m.currentTime = this.d.store.metadata[this.selected_mid].z[0];
      } else {
        this.m.currentTime = this.tmetadata_gtimeline_tstart;
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
      if ( this.selected_mindex !== -1 ) {
        this.m.currentTime = this.d.store.metadata[this.selected_mid].z[1];
      } else {
        this.m.currentTime = this.tmetadata_gtimeline_tend;
      }
    } else {
      this.m.currentTime = this.m.duration - 1;
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
    if ( ! e.ctrlKey ) {
      e.preventDefault();
      this.m.playbackRate = this.m.playbackRate + 0.1;
    }
    return;
  }
  if ( e.key === '-' ) {
    if ( ! e.ctrlKey ) {
      e.preventDefault();
      if ( this.m.playbackRate > 0.1 ) {
        this.m.playbackRate = this.m.playbackRate - 0.1;
      }
    }
    return;
  }

  if ( (e.key === 'a' || e.key === 'A') && ! e.ctrlKey ) {
    e.preventDefault();
    var t = this.m.currentTime;
    if ( e.key === 'a' ) {
      this._tmetadata_mid_add_at_time(t);
    } else {
      if ( e.key === 'A' && e.shiftKey ) {
        this._tmetadata_mid_update_last_added_end_edge_to_time(t);
      }
    }
    this._tmetadata_group_gid_draw(this.selected_gid);
    return;
  }

  if ( e.key === 'Backspace' ) {
    e.preventDefault();
    if ( this.selected_mindex !== -1 ) {
      var user_confirmed = window.confirm("Confirm that you want to delete the selected temporal segment");
      if(user_confirmed) {
        this._tmetadata_mid_del_sel();
        this._tmetadata_group_gid_draw(this.selected_gid);
      } else {
        _via_util_msg_show('Discarded temporal segment delete operation');
      }
    }
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
    if ( this.selected_mindex !== -1 ) {
      // resize left edge of selected temporal segment
      var delta = this.EDGE_UPDATE_TIME_DELTA;
      if ( e.ctrlKey ) {
        delta = 1;
      }
      if ( e.key === 'l' ) {
        this._tmetadata_mid_update_edge(0, -delta);
      } else {
        this._tmetadata_mid_update_edge(0, delta);
      }
    } else {
      if ( e.key === 'l' ) {
        this.m.currentTime = this.m.currentTime - this.EDGE_UPDATE_TIME_DELTA;
      } else {
        this.m.currentTime = this.m.currentTime - 2*this.EDGE_UPDATE_TIME_DELTA;
      }
    }
    this._tmetadata_group_gid_draw(this.selected_gid);
    return;
  }

  if ( e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    if ( this.selected_mindex !== -1 ) {
      // resize left edge of selected temporal segment
      var delta = this.EDGE_UPDATE_TIME_DELTA;
      if ( e.ctrlKey ) {
        delta = 1;
      }

      if ( e.key === 'r' ) {
        this._tmetadata_mid_update_edge(1, delta);
      } else {
        this._tmetadata_mid_update_edge(1, -delta);
      }
    } else {
      if ( e.key === 'r' ) {
        this.m.currentTime = this.m.currentTime + this.EDGE_UPDATE_TIME_DELTA;
      } else {
        this.m.currentTime = this.m.currentTime + 2*this.EDGE_UPDATE_TIME_DELTA;
      }
    }
    this._tmetadata_group_gid_draw(this.selected_gid);
    return;
  }

  // cancel ongoing action or event
  if ( e.key === 'Escape' ) {
    e.preventDefault();
    this._tmetadata_group_gid_remove_mid_sel();
    this._tmetadata_group_gid_draw(this.selected_gid);
    return;
  }

  // select temporal segments
  if ( e.key === 'Tab' ) {
    e.preventDefault();

    if ( e.shiftKey ) {
      this._tmetadata_group_gid_sel_prev_metadata();
    } else {
      this._tmetadata_group_gid_sel_next_metadata();
    }
    this._tmetadata_group_gid_draw(this.selected_gid);
    return;
  }

  if ( e.key === 'Enter' ) {
    e.preventDefault();
    this.m.pause();
    this._tmetadata_group_gid_sel_metadata_at_time();
    this._tmetadata_group_gid_draw(this.selected_gid);

    if(e.shiftKey) {
      // focus the subtitle text input element in subtitle editor
      this.emit_event('metadata_editor_focus', { 'mid':this.selected_mid });
    }
    return;
  }

  if ( e.key === 'ArrowDown' || e.key === 'ArrowUp' ) {
    e.preventDefault();
  }

  if ( e.key === 'ArrowLeft' || e.key === 'ArrowRight' ) {
    e.preventDefault();
    if ( this.selected_mindex !== -1 ) {
      if ( e.shiftKey ) {
        // merge current region with left or right metadata
        if ( e.key === 'ArrowLeft' ) {
          this._tmetadata_mid_merge(0);
        } else {
          this._tmetadata_mid_merge(1);
        }
      } else {
        // move selected temporal segment
        var delta = this.EDGE_UPDATE_TIME_DELTA;
        if ( e.ctrlKey ) {
          delta = 1.0;
        }
        if ( e.key === 'ArrowLeft' ) {
          this._tmetadata_mid_move(-delta);
        } else {
          this._tmetadata_mid_move(delta);
        }
      }
    } else {
      // move temporal seg. timeline
      var tstart_new;
      if ( e.key === 'ArrowLeft' ) {
        if ( e.shiftKey ) {
          this._tmetadata_boundary_move(-60*this.TEMPORAL_SEG_MOVE_OFFSET);
        } else {
          this._tmetadata_boundary_move(-this.TEMPORAL_SEG_MOVE_OFFSET);
        }
      } else {
        if ( e.shiftKey ) {
          this._tmetadata_boundary_move(60*this.TEMPORAL_SEG_MOVE_OFFSET);
        } else {
          this._tmetadata_boundary_move(this.TEMPORAL_SEG_MOVE_OFFSET);
        }
      }
    }
    this._tmetadata_group_gid_draw(this.selected_gid);
    return;
  }

  if ( e.key === 'x' ) {
    if(this.selected_mindex === -1) {
      _via_util_msg_show('First select the temporal segment that you wish to split into two');
      return;
    }
    this._tmetadata_mid_split_sel();
    return;
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
  this.group[this.SUBTITLE_GID] = [];
  this.groupby_aid = aid;

  var mid, avalue;
  for ( var mindex in this.d.cache.mid_list[this.vid] ) {
    mid = this.d.cache.mid_list[this.vid][mindex];
    if ( this.d.store.metadata[mid].z.length >= 2 &&
         this.d.store.metadata[mid].xy.length === 0
       ) {
      if ( this.d.store.metadata[mid].av.hasOwnProperty(this.groupby_aid) ) {
        this.group[this.SUBTITLE_GID].push(mid);
      }
    }
  }

  // add possible values for the group variable
  this.gid_list = [ this.SUBTITLE_GID ];

  // sort each group elements based on time
  var gid;
  for ( gid in this.group ) {
    this.group[gid].sort( this._compare_mid_by_time.bind(this) );
  }
}

_via_temporal_segmenter.prototype._compare_gid = function(gid1_str, gid2_str) {
  var gid1 = parseInt(gid1_str);
  var gid2 = parseInt(gid2_str);
  if(isNaN(gid1) || isNaN(gid2)) {
    // gid are not numbers and therefore sort them as string
    if(gid1_str < gid2_str) {
      return -1;
    } else {
      return 1;
    }
  } else {
    // gid are numbers and therefore sort them numerically
    if(gid1 < gid2) {
      return -1;
    } else {
      return 1;
    }
  }
}

_via_temporal_segmenter.prototype._compare_mid_by_time = function(mid1, mid2) {
  var t00 = this.d.store.metadata[mid1].z[0];
  var t10 = this.d.store.metadata[mid2].z[0];
  var t01 = this.d.store.metadata[mid1].z[1];
  var t11 = this.d.store.metadata[mid2].z[1];

  if ( typeof(t00) === 'string' ||
       typeof(t01) === 'string' ) {
    t00 = parseFloat(t00);
    t01 = parseFloat(t01);
    t10 = parseFloat(t10);
    t11 = parseFloat(t11);
  }

  if ( (t00 === t10) && ( t01 === t11 ) ) {
    return 0;
  }

  if ( ( t00 === t10 ) || ( t01 === t11 ) ) {
    var a,b;
    if ( ( t00 === t10 ) ) {
      // same start time
      a = t01;
      b = t11;
    } else {
      // same end time
      a = t00;
      b = t10;
    }
    if ( a < b ) {
      return -1;
    } else {
      return 1;
    }
  } else {
    if ( (t00 < t10) || ( t01 < t11 ) ) {
      return -1;
    } else {
      return 1;
    }
  }
}

_via_temporal_segmenter.prototype._group_gid_add_mid = function(gid, new_mid) {
  // find the best location
  var i, mindex, mid;
  for ( mindex in this.group[gid] ) {
    mid = this.group[gid][mindex];
    if ( this.d.store.metadata[new_mid].z[0] < this.d.store.metadata[mid].z[0] ) {
      this.group[gid].splice(mindex, 0, new_mid); // insert at correct location
      return;
    }
  }

  // if the insertion was not possible, simply push at the end
  this.group[gid].push(new_mid);
  this._tmetadata_group_gid_draw(gid);
}

_via_temporal_segmenter.prototype._group_gid_del_mid = function(gid, mid) {
  var mindex = this.group[gid].indexOf(mid);
  if ( mindex !== -1 ) {
    this.group[gid].splice(mindex, 1);
  }
  this._tmetadata_group_gid_draw(gid);
}

_via_temporal_segmenter.prototype._group_del_gid = function(gid_list) {
  return new Promise( function(ok_callback, err_callback) {
    try {
      var del_mid_list = [];
      var gid;
      for ( var i in gid_list ) {
        gid = gid_list[i];
        for ( var mindex in this.group[gid] ) {
          del_mid_list.push(this.group[gid][mindex]);
        }
        delete this.group[gid];
        delete this.tmetadata_gtimeline_mid[gid];
        var gindex = this.gid_list.indexOf(gid);
        this.gid_list.splice(gindex, 1);
        delete this.gctx[gid];
        delete this.gcanvas[gid];
      }
      ok_callback(del_mid_list);
    }
    catch(ex) {
      err_callback(ex);
    }
  }.bind(this));
}

_via_temporal_segmenter.prototype._group_add_gid = function(gid) {
  if ( this.group.hasOwnProperty(gid) ) {
    _via_util_msg_show(this.d.attribute_store[this.groupby_aid].aname +
                       ' [' + gid + '] already exists!');
  } else {
    this.group[gid] = [];
    this.gid_list.push(gid);
    this.metadata_tbody.appendChild( this._tmetadata_group_gid_html(gid) );
    this.new_group_id_input.value = ''; // clear input field
    _via_util_msg_show('Add ' + this.d.attribute_store[this.groupby_aid].aname +
                       ' [' + gid + ']');
  }
}

//
// Utility functions
//
_via_temporal_segmenter.prototype._time2str = function(t) {
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

_via_temporal_segmenter.prototype._time2strms = function(t) {
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

_via_temporal_segmenter.prototype._time2hhmmss = function(t) {
  var hh = Math.floor(t / 3600);
  var mm = Math.floor( (t - hh * 3600) / 60 );
  var ss = Math.floor( t - hh*3600 - mm*60 );
  if ( hh < 10 ) {
    hh = '0' + hh.toString();
  }
  if ( mm < 10 ) {
    mm = '0' + mm.toString();
  }
  if ( ss < 10 ) {
    ss = '0' + ss.toString();
  }
  return hh + ':' + mm + ':' + ss;
}

_via_temporal_segmenter.prototype._time2ms = function(t) {
  var ms = Math.floor( (t - Math.floor(t) ) * 1000 );
  if ( ms < 100 ) {
    if(ms < 10) {
      ms = '00' + ms.toString();
    } else {
      ms = '0' + ms.toString();
    }
  }
  return ms;
}

_via_temporal_segmenter.prototype._time2ssms = function(t) {
  var hh = Math.floor(t / 3600);
  var mm = Math.floor( (t - hh * 3600) / 60 );
  var ss = Math.floor( t - hh*3600 - mm*60 );
  var ms = Math.floor( (t - Math.floor(t) ) * 1000 );
  return ss + ':' + ms;
}

_via_temporal_segmenter.prototype._vtimeline_playbackrate2str = function(t) {
  return this.m.playbackRate + 'X';
}

//
// external events
//
_via_temporal_segmenter.prototype._on_event_metadata_del = function(vid, mid) {
  _via_util_msg_show('Metadata deleted');
}

_via_temporal_segmenter.prototype._on_event_metadata_add = function(vid, mid) {
  if ( this.vid === vid &&
       this.d.store.metadata[mid].z.length === 2 &&
       this.d.store.metadata[mid].xy.length === 0
     ) {
    this._group_gid_add_mid(this.selected_gid, mid); // add at correct location
    this._tmetadata_boundary_fetch_gid_mid(this.selected_gid);
    _via_util_msg_show('Metadata added');
  }
}

_via_temporal_segmenter.prototype._on_event_metadata_update = function(vid, mid) {
  _via_util_msg_show('Metadata updated');
}

//
// external events
//
_via_temporal_segmenter.prototype._on_event_attribute_update = function(data, event_payload) {
  var aid = event_payload.aid;
  if ( this.groupby_aid === aid ) {
    _via_util_msg_show('Attribute [' + this.d.store['attribute'][aid]['aname'] + '] updated.');
    this._init();
  }
}

_via_temporal_segmenter.prototype._on_event_metadata_update_bulk = function(data, event_payload) {
  if ( this.vid === event_payload.vid ) {
    _via_util_msg_show('Updated ' + event_payload.mid_list.length + ' metadata');
  }
}

_via_temporal_segmenter.prototype._on_event_metadata_add_bulk = function(data, event_payload) {
  _via_util_msg_show('Added ' + event_payload.mid_list.length + ' metadata');
  this._init(this.groupby_aid);
  this.emit_event('metadata_add', { 'mid_list':event_payload['mid_list'] });
}
