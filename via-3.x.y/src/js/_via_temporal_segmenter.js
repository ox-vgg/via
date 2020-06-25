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

function _via_temporal_segmenter(file_annotator, container, vid, data, media_element) {
  this._ID = '_via_temporal_segmenter_';
  this.fa = file_annotator;
  this.c = container;
  this.vid = vid;
  this.d = data;
  this.m = media_element;

  this.groupby = false;
  this.groupby_aid = '';
  this.group = {};
  this.gid_list = [];
  this.selected_gindex = -1;
  this.selected_mindex = -1;
  this.edge_show_time = -1;

  // spatial mid
  this.smid = {};

  this.DRAW_LINE_WIDTH = 2;
  this.EDGE_UPDATE_TIME_DELTA = 1/50;  // in sec
  this.TEMPORAL_SEG_MOVE_OFFSET = 1;   // in sec
  this.DEFAULT_TEMPORAL_SEG_LEN = 1;   // in sec
  this.GTIMELINE_HEIGHT = 8;           // units of char width
  this.GTIMELINE_ZOOM_OFFSET = 4;      // in pixels
  this.DEFAULT_WIDTH_PER_SEC = 6;      // units of char width
  this.GID_COL_WIDTH = 15;             // units of char width
  this.METADATA_CONTAINER_HEIGHT = 22; // units of char width
  this.METADATA_EDGE_TOL = 0.1;
  this.GTIMELINE_REGION_MARKER_MOUSE_TOL = 0.1; // in sec.

  this.PLAYBACK_MODE = { NORMAL:'1', REVIEW_SEGMENT:'2', REVIEW_GAP:'3' };
  this.current_playback_mode = this.PLAYBACK_MODE.NORMAL;

  this.metadata_move_is_ongoing = false;
  this.metadata_resize_is_ongoing = false;
  this.metadata_resize_edge_index = -1;
  this.metadata_ongoing_update_x = [0, 0];
  this.metadata_move_start_x = 0;
  this.metadata_move_dx = 0;
  this.metadata_last_added_mid = '';

  this.audio_analyser_active = false;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  _via_event.call( this );
  this.d.on_event('attribute_update', this._ID, this._on_event_attribute_update.bind(this));
  this.d.on_event('metadata_update_bulk', this._ID, this._on_event_metadata_update_bulk.bind(this));

  if ( ! this.m instanceof HTMLMediaElement ) {
    throw 'media element must be an instance of HTMLMediaElement!';
  }

  // colour
  this.COLOR_LIST = ["#E69F00", "#56B4E9", "#009E73", "#0072B2", "#D55E00", "#CC79A7", "#F0E442"];
  this.NCOLOR = this.COLOR_LIST.length;

  this.current_playback_mode = this.PLAYBACK_MODE.NORMAL;

  this._init();
}

_via_temporal_segmenter.prototype._init = function() {
  this.group_aid_candidate_list = [];
  if ( this.d.cache.attribute_group.hasOwnProperty('FILE1_Z2_XY0') ) {
    for ( var aindex in this.d.cache.attribute_group['FILE1_Z2_XY0'] ) {
      this.group_aid_candidate_list.push( this.d.cache.attribute_group['FILE1_Z2_XY0'][aindex] );
    }
  }
  if ( this.d.cache.attribute_group.hasOwnProperty('FILE1_ZN_XYN') ) {
    for ( var aindex in this.d.cache.attribute_group['FILE1_ZN_XYN'] ) {
      this.group_aid_candidate_list.push( this.d.cache.attribute_group['FILE1_ZN_XYN'][aindex] );
    }
  }

  if ( this.group_aid_candidate_list.length ) {
    this._init_on_success(this.group_aid_candidate_list[0]);
  } else {
    this._init_on_fail();
  }
}

_via_temporal_segmenter.prototype._init_on_fail = function() {
  this.c.innerHTML = '<p>You must define an attribute with anchor "Temporal Segment in Video or Audio" in order to define temporal segments in this file. Click&nbsp;<svg class="svg_icon" viewbox="0 0 24 24"><use xlink:href="#micon_insertcomment"></use></svg>&nbsp;button to define such attributes using attribute editor.</p><p>After defining the attribute, <span class="text_button" onclick="via.va.view_show(via.va.vid);">reload this file</span>.' ;
}

_via_temporal_segmenter.prototype._init_on_success = function(groupby_aid) {
  try {
    this.fid = this.d.store.view[this.vid].fid_list[0];
    this.file = this.d.store.file[this.fid];

    this._group_init(groupby_aid);
    if ( this.d.store.file[this.fid].type === _VIA_FILE_TYPE.VIDEO ) {
      this._thumbview_init();
    }

    this.c.innerHTML = '';
    this._vtimeline_init();
    this._tmetadata_init();
    this._toolbar_init();

    // trigger the update of animation frames
    this._redraw_all();
    this._redraw_timeline();
  } catch(err) {
    console.log(err);
  }
}

//
// All animation frame routines
//
_via_temporal_segmenter.prototype._redraw_all = function() {
  window.requestAnimationFrame(this._redraw_all.bind(this));
  var tnow = this.m.currentTime;
  this._update_playback_rate(tnow);

  if ( tnow < this.tmetadata_gtimeline_tstart ||
       tnow > this.tmetadata_gtimeline_tend
     ) {
    if ( ! this.m.paused ) {
      var new_tstart = Math.floor(tnow);
      this._tmetadata_boundary_update(new_tstart)
      this._tmetadata_gtimeline_draw();
    } else {
      //this.m.currentTime = this.tmetadata_gtimeline_tstart;
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
  this._tmetadata_draw_currenttime_mark(tnow);

  this._tmetadata_gtimeline_draw_audio();
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
  // draw the full video timeline (on the top)
  this._vtimeline_mark_draw();
  // draw group timeline
  this._tmetadata_gtimeline_draw();
}

//
// thumbnail viewer
//
_via_temporal_segmenter.prototype._thumbview_init = function() {
  if ( this.d.store.file[this.fid].type === _VIA_FILE_TYPE.VIDEO ) {
    this.thumbnail_container = document.createElement('div');
    this.thumbnail_container.setAttribute('class', 'thumbnail_container');
    this.thumbnail_container.setAttribute('style', 'display:none; position:absolute; top:0; left:0;');
    this.c.appendChild(this.thumbnail_container);

    // initialise thumbnail viewer
    this.thumbnail = new _via_video_thumbnail(this.fid, this.d);
    this.thumbnail.load();
  }
}

_via_temporal_segmenter.prototype._thumbview_show = function(time, x, y) {
  if ( this.d.store.file[this.fid].type === _VIA_FILE_TYPE.VIDEO ) {
    this.thumbnail_container.innerHTML = '';
    this.thumbnail_container.appendChild(this.thumbnail.get_thumbnail(time));
    this.thumbnail_container.style.display = 'inline-block';

    this.thumbnail_container.style.left = x + this.linehn[2] + 'px';
    this.thumbnail_container.style.top  = y + this.linehn[4] + 'px';
  }
}

_via_temporal_segmenter.prototype._thumbview_hide = function(t) {
  if ( this.d.store.file[this.fid].type === _VIA_FILE_TYPE.VIDEO ) {
    this.thumbnail_container.style.display = 'none';
  }
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
  ctx.fillRect(0, 0, this.vtimeline.width, this.vtimeline.height);

  // draw line
  ctx.strokeStyle = '#999999';
  ctx.fillStyle = '#999999';
  ctx.lineWidth = this.DRAW_LINE_WIDTH;
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
    ctx.fillText(this._time2strms(time), start, this.linehn[2] - 1);

    start = start + 10*this.char_width;
  }
  ctx.stroke();

  // draw the end mark
  var endx = this._vtimeline_time2canvas(this.m.duration);
  ctx.beginPath();
  ctx.moveTo(endx, 1);
  ctx.lineTo(endx, this.lineh - 1);
  ctx.stroke();
  var tendstr = this._time2strms(this.m.duration);
  var tendstr_width = ctx.measureText(tendstr).width;
  ctx.fillStyle = '#999999';
  ctx.fillText(tendstr, endx - tendstr_width, this.linehn[2] - 1);

  //// timeline mark showing the current video time
  //// and placed just above the full video timeline
  this.vtimeline_mark = document.createElement('canvas');
  this.vtimeline_mark.setAttribute('class', 'video_timeline_mark');
  this.vtimeline_mark_ctx = this.vtimeline_mark.getContext('2d', { alpha:false });
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
  this.vtimeline_mark_ctx.fillStyle = 'black';
  this.vtimeline_mark_ctx.beginPath();
  this.vtimeline_mark_ctx.moveTo(cx, this.linehn[2]);
  this.vtimeline_mark_ctx.lineTo(cx - this.linehb2, this.lineh);
  this.vtimeline_mark_ctx.lineTo(cx + this.linehb2, this.lineh);
  this.vtimeline_mark_ctx.moveTo(cx, this.linehn[2]);
  this.vtimeline_mark_ctx.fill();

  // draw current time
  this.vtimeline_mark_ctx.fillStyle = '#666666';
  var tstr = this._time2strms(time);
  var twidth = this.vtimeline_mark_ctx.measureText(tstr).width;
  var tx = cx + this.lineh;
  if ( cx + twidth > this.vtimelinew ) {
    tx = tx - twidth - this.linehn[2];
  }
  this.vtimeline_mark_ctx.fillText(tstr, tx, this.linehn[2] - 2);
}

_via_temporal_segmenter.prototype._vtimeline_on_mousedown = function(e) {
  var canvas_x = e.offsetX;
  var time = this._vtimeline_canvas2time(canvas_x);
  this.m.currentTime = time;

  var new_tstart = Math.floor(time);
  this._tmetadata_boundary_update(new_tstart)
  this._tmetadata_gtimeline_draw();
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
_via_temporal_segmenter.prototype._tmetadata_init = function() {
  this.tmetadata_container = document.createElement('div');
  this.tmetadata_container.setAttribute('class', 'tmetadata_container');

  // group timeline container
  var gheader_container = document.createElement('div');
  gheader_container.setAttribute('class', 'gheader_container');
  var gheader_grid = document.createElement('div');
  gheader_grid.setAttribute('class', 'twocolgrid');
  var group_aname_container = document.createElement('div');
  group_aname_container.setAttribute('class', 'gidcol');

  // group variable selector
  if ( this.group_aid_candidate_list.length ) {
    this.group_aname_select = document.createElement('select');
    this.group_aname_select.setAttribute('title', 'Select the variable name that should be used for temporal segmentation. These variables can be edited using the the attribute editor.');
    this.group_aname_select.addEventListener('change', this._tmetadata_onchange_groupby_aid.bind(this));

    for ( var aindex in this.group_aid_candidate_list ) {
      var aid = this.group_aid_candidate_list[aindex];
      var oi = document.createElement('option');
      oi.innerHTML = this.d.store.attribute[aid].aname;
      oi.setAttribute('value', aid);
      if ( aid === this.groupby_aid ) {
        oi.setAttribute('selected', '');
      }
      this.group_aname_select.appendChild(oi);
    }
    group_aname_container.appendChild(this.group_aname_select);
  }

  this.gtimeline_container = document.createElement('div');
  this.gtimeline_container.setAttribute('class', 'gtimeline_container');
  gheader_grid.appendChild(group_aname_container);
  gheader_grid.appendChild(this.gtimeline_container);

  gheader_container.appendChild(gheader_grid);
  this.tmetadata_container.appendChild(gheader_container);
  this.c.appendChild(this.tmetadata_container);

  // initialise the gtimeline (timeline for temporal segmentation, requires width of container)
  this.timeline_container_width = this.gtimeline_container.clientWidth - Math.floor(2 * this.padx);
  this.tmetadata_timelinew = this.timeline_container_width - Math.floor(2 * this.padx);
  this.tmetadata_width_per_sec = this.linehn[this.DEFAULT_WIDTH_PER_SEC];
  this._tmetadata_boundary_update(0); // determine the boundary of gtimeline

  this._tmetadata_gtimeline_init();
  this.gtimeline_container.appendChild(this.gtimeline);

  this.gmetadata_container = document.createElement('div');
  this.gmetadata_container.setAttribute('class', 'gmetadata_container');

  var gtimeline_container_maxheight = this.fa.va.gtimeline_container_height - this.METADATA_CONTAINER_HEIGHT + 5; // 5 is offset obtained using visual inspection
  this.gmetadata_container.setAttribute('style', 'max-height:' + gtimeline_container_maxheight + 'ch;');

  this.gmetadata_grid = document.createElement('div');
  this.gmetadata_grid.setAttribute('class', 'twocolgrid');
  this._tmetadata_gmetadata_update();
  this.gmetadata_container.appendChild(this.gmetadata_grid);
  this.tmetadata_container.appendChild(this.gmetadata_container);
  // Note: this.tmetadata_container has already been added to parent container

  if ( this.gid_list.length ) {
    this._tmetadata_group_gid_sel(0);
  }
}

_via_temporal_segmenter.prototype._tmetadata_audio_init = function() {
  try {
    this.audioctx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioctx.createAnalyser();
    var audiosrc = this.audioctx.createMediaElementSource(this.m);
    audiosrc.connect(this.analyser);
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

    // column containing value of timeline-id
    var gid_container = document.createElement('div');
    gid_container.setAttribute('class', 'gidcol');
    var gid_input = document.createElement('input');
    gid_input.setAttribute('type', 'text');
    if ( this.d.store.attribute[this.groupby_aid].type === _VIA_ATTRIBUTE_TYPE.SELECT &&
         this.d.store.attribute[this.groupby_aid].options.hasOwnProperty(gid)
       ) {
      gid_input.setAttribute('value', this.d.store.attribute[this.groupby_aid].options[gid]);
    } else {
      gid_input.setAttribute('value', gid);
    }

    gid_input.setAttribute('title', this.d.store.attribute[this.groupby_aid].aname +
                           ' = ' + gid);
    gid_input.setAttribute('data-gid', gid);
    gid_input.addEventListener('change', this._tmetadata_group_update_gid.bind(this));
    gid_container.appendChild(gid_input);

    // column containing temporal segments for this value timeline-id
    this._tmetadata_group_gid_init(gid);
    var gid_metadata_container = document.createElement('div');
    gid_metadata_container.appendChild(this.gcanvas[gid]);

    this.gmetadata_grid.appendChild(gid_container);
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

_via_temporal_segmenter.prototype._tmetadata_boundary_move = function(dt) {
  var new_start = Math.floor(this.tmetadata_gtimeline_tstart + dt);
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
    _via_util_msg_show('Cannot move beyond the video timeline boundary!');
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
  setTimeout( this._tmetadata_boundary_fetch_all_mid.bind(this), 0);
}

_via_temporal_segmenter.prototype._tmetadata_boundary_fetch_all_mid = function() {
  var gindex;
  var t0, t1;

  // gather all temporal mid
  for ( gindex in this.gid_list ) {
    this._tmetadata_boundary_fetch_gid_mid( this.gid_list[gindex] );
    this._tmetadata_group_gid_draw( this.gid_list[gindex] );
  }

  // gather all spatial mid
  this._tmetadata_boundary_fetch_spatial_mid();
}

_via_temporal_segmenter.prototype._tmetadata_boundary_fetch_spatial_mid = function() {
  var mid, avalue, time;
  this.smid = {};
  for ( var mindex in this.d.cache.mid_list[this.vid] ) {
    mid = this.d.cache.mid_list[this.vid][mindex];
    if ( this.d.store.metadata[mid].z.length === 1 &&
         this.d.store.metadata[mid].xy.length !== 0
       ) {
      time = this.d.store.metadata[mid].z[0].toString();
      if ( time >= this.tmetadata_gtimeline_tstart &&
           time <= this.tmetadata_gtimeline_tend ) {
        if ( ! this.smid.hasOwnProperty(time) ) {
          this.smid[time] = [];
        }
        this.smid[time].push(mid);
      }
    }
  }
}

_via_temporal_segmenter.prototype._tmetadata_boundary_add_spatial_mid = function(mid) {
  if ( this.d.store.metadata[mid].z.length === 1 &&
       this.d.store.metadata[mid].xy.length !== 0
     ) {
    var time = this.d.store.metadata[mid].z[0].toString();
    if ( time >= this.tmetadata_gtimeline_tstart &&
         time <= this.tmetadata_gtimeline_tend ) {
      if ( ! this.smid.hasOwnProperty(time) ) {
        this.smid[time] = [];
      }
      this.smid[time].push(mid);
    }
  }
}

_via_temporal_segmenter.prototype._tmetadata_boundary_del_spatial_mid = function(mid) {
  for ( var time in this.smid ) {
    if ( this.smid[time].length ) {
      var mindex = this.smid[time].indexOf(mid);
      if ( mindex !== -1 ) {
        this.smid[time].splice(mindex, 1);
        return;
      }
    }
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

  this.gtimeline.width = this.timeline_container_width;
  this.gtimeline.height = this.linehn[this.GTIMELINE_HEIGHT];
  this.gtimelinectx = this.gtimeline.getContext('2d', {alpha:false});

  this.gtimeline.addEventListener('wheel', this._tmetadata_gtimeline_wheel_listener.bind(this));
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_wheel_listener = function(e) {
  if ( e.shiftKey ) {
    // pan temporal segment horizontally
    if (e.deltaY < 0) {
      this._tmetadata_boundary_move(this.TEMPORAL_SEG_MOVE_OFFSET);
    } else {
      this._tmetadata_boundary_move(-this.TEMPORAL_SEG_MOVE_OFFSET);
    }
  } else {
    // zoom temporal segment
    if (e.deltaY < 0) {
      this._tmetadata_gtimeline_zoomin();
    } else {
      this._tmetadata_gtimeline_zoomout();
    }
  }
  e.preventDefault();
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_zoomin = function() {
  var wps = this.tmetadata_width_per_sec + this.GTIMELINE_ZOOM_OFFSET;
  if ( wps < this.gtimeline.width ) {
    this.tmetadata_width_per_sec = wps;
    this._tmetadata_boundary_update(this.tmetadata_gtimeline_tstart);
    this._redraw_all();
  }
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_zoomout = function() {
  var wps = this.tmetadata_width_per_sec - this.GTIMELINE_ZOOM_OFFSET;
  if ( wps > 1 ) {
    this.tmetadata_width_per_sec = wps;
    this._tmetadata_boundary_update(this.tmetadata_gtimeline_tstart);
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
  this.gtimelinectx.moveTo(this.tmetadata_gtimeline_xstart, this.linehn[2]);
  this.gtimelinectx.lineTo(this.tmetadata_gtimeline_xend, this.linehn[2]);
  this.gtimelinectx.stroke();

  if ( this.tmetadata_gtimeline_mark_x.length ) {
    // draw tick labels
    this.gtimelinectx.fillStyle = '#666666';
    this.gtimelinectx.font = '9px Sans';
    var last_mark_x = this.tmetadata_gtimeline_mark_x[0];
    var tick_width = this.gtimelinectx.measureText(this.tmetadata_gtimeline_mark_time_str[0]).width;
    var dx;
    this.gtimelinectx.beginPath();
    for ( var i = 0; i < this.tmetadata_gtimeline_mark_x.length; ++i ) {
      dx = this.tmetadata_gtimeline_mark_x[i] - last_mark_x;
      if ( i === 0 || dx > tick_width ) {
        // draw tick
        this.gtimelinectx.moveTo(this.tmetadata_gtimeline_mark_x[i], this.linehn[2]);
        this.gtimelinectx.lineTo(this.tmetadata_gtimeline_mark_x[i], this.linehn[3]);

        // draw label
        this.gtimelinectx.fillText(this.tmetadata_gtimeline_mark_time_str[i],
                                   this.tmetadata_gtimeline_mark_x[i], this.linehn[4] );
        last_mark_x = this.tmetadata_gtimeline_mark_x[i];
      } else {
        // avoid crowding of labels
        continue;
      }
    }
    this.gtimelinectx.stroke();

    // draw marker for frames containing spatial regions
    this.gtimelinectx.fillStyle = 'black';
    this.gtimelinectx.beginPath();
    for ( var time in this.smid ) {
      if ( this.smid[time].length ) {
        var smarkx = this._tmetadata_gtimeline_time2canvas( parseFloat(time) );
        this.gtimelinectx.arc(smarkx, this.linehn[2] + 4, 4, 0, 2*Math.PI);
      }
    }
    this.gtimelinectx.fill();
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

    var max_height = (this.linehn[8] - this.linehn[4]);
    var y = Math.round( avg * 3 * max_height );
    this.gtimelinectx.fillStyle = '#4d4d4d';
    this.gtimelinectx.lineWidth = this.DRAW_LINE_WIDTH;
    this.gtimelinectx.fillRect(x, Math.max(this.linehn[4], this.linehn[6] - y), 2, 2*y);
  }
}

_via_temporal_segmenter.prototype._tmetadata_draw_currenttime_mark = function(tnow) {
  // clear previous mark
  this.gtimelinectx.fillStyle = '#ffffff';
  this.gtimelinectx.fillRect(0, 0, this.gtimeline.width, this.linehn[2] - 1);

  var markx = this._tmetadata_gtimeline_time2canvas(tnow);

  this.gtimelinectx.fillStyle = 'black';
  this.gtimelinectx.beginPath();
  this.gtimelinectx.moveTo(markx, this.linehn[2]);
  this.gtimelinectx.lineTo(markx - this.linehb2, this.linehn[1]);
  this.gtimelinectx.lineTo(markx + this.linehb2, this.linehn[1]);
  this.gtimelinectx.moveTo(markx, this.linehn[2]);
  this.gtimelinectx.fill();

  // show playback rate
  this.gtimelinectx.font = '10px Sans';
  var rate = this.m.playbackRate.toFixed(1) + 'X';
  this.gtimelinectx.fillText(rate, this.tmetadata_gtimeline_xend - this.linehn[2], this.linehn[2] - 2);
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
  var t = this._tmetadata_gtimeline_canvas2time(e.offsetX);
  var smark_time_str = this._tmetadata_gtimeline_is_on_smark(t);
  if ( smark_time_str !== '' ) {
    this.gtimeline.style.cursor = 'pointer';
    var suffix = this.smid[smark_time_str].length + ' region';
    if ( this.smid[smark_time_str].length > 1 ) {
      suffix += 's';
    }
    this.gtimeline.setAttribute('title',
                                'Click to jump to this video frame containing ' + suffix);
  } else {
    this.gtimeline.style.cursor = 'default';
  }
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_mousedown = function(e) {
  var t = this._tmetadata_gtimeline_canvas2time(e.offsetX);
  var smark_time_str = this._tmetadata_gtimeline_is_on_smark(t);
  if ( smark_time_str !== '' ) {
    // draw all regions associated with this frame
    this.m.currentTime = parseFloat(smark_time_str);
    this.emit_event('edit_frame_regions', { 't': parseFloat(smark_time_str),
                                            'mid_list': this.smid[smark_time_str],
                                          });
  } else {
    this.m.currentTime = t;
  }
}

_via_temporal_segmenter.prototype._tmetadata_gtimeline_mouseup = function(e) {
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
  this.gcanvas[gid].height = this.linehn[4];
  this.gctx[gid] = this.gcanvas[gid].getContext('2d', {alpha:false});

  this.gcanvas[gid].addEventListener('mousemove', this._tmetadata_group_gid_mousemove.bind(this));
  this.gcanvas[gid].addEventListener('mousedown', this._tmetadata_group_gid_mousedown.bind(this));
  this.gcanvas[gid].addEventListener('mouseup', this._tmetadata_group_gid_mouseup.bind(this));
  this._tmetadata_group_gid_draw(gid);
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_clear = function(gid) {
  if ( gid === this.selected_gid ) {
    this.gctx[gid].fillStyle = '#e6e6e6';
  } else {
    this.gctx[gid].fillStyle = '#ffffff';
  }
  this.gctx[gid].fillRect(0, 0, this.gcanvas[gid].width, this.gcanvas[gid].height);
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_draw = function(gid) {
  this._tmetadata_group_gid_clear(gid);
  this._tmetadata_group_gid_draw_boundary(gid);
  this._tmetadata_group_gid_draw_metadata(gid);
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_draw_boundary = function(gid) {
  var gindex = this.gid_list.indexOf(gid);
  var bcolor = this.COLOR_LIST[ gindex % this.NCOLOR ];
  // draw line
  this.gctx[gid].strokeStyle = bcolor;
  this.gctx[gid].fillStyle = '#ffffff';
  this.gctx[gid].lineWidth = this.DRAW_LINE_WIDTH;

  this.gctx[gid].beginPath();
  this.gctx[gid].moveTo(this.tmetadata_gtimeline_xstart, this.linehn[1]);
  this.gctx[gid].lineTo(this.tmetadata_gtimeline_xend, this.linehn[1]);
  this.gctx[gid].lineTo(this.tmetadata_gtimeline_xend, this.linehn[3]);
  this.gctx[gid].lineTo(this.tmetadata_gtimeline_xstart, this.linehn[3]);
  this.gctx[gid].lineTo(this.tmetadata_gtimeline_xstart, this.linehn[1]);
  this.gctx[gid].stroke();
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
  this.gctx[gid].fillStyle = '#f2f2f2';
  this.gctx[gid].strokeStyle = '#e6e6e6';

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
      this.gctx[gid].fillText(time_str, x0 + 1, this.linehn[4]);
    } else {
      var twidth = this.gctx[gid].measureText(time_str).width;
      this.gctx[gid].fillText(time_str, x1 - twidth, this.linehn[4]);
    }
  }
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_draw_metadata = function(gid) {
  if ( this.tmetadata_gtimeline_mid.hasOwnProperty(gid) ) {
    var mindex, mid;
    for ( mindex in this.tmetadata_gtimeline_mid[gid] ) {
      mid = this.tmetadata_gtimeline_mid[gid][mindex];
      this._tmetadata_group_gid_draw_mid(gid, mid);
    }

    if ( this.selected_gid === gid &&
         this.selected_mindex !== -1
       ) {
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
    this.gctx[gid].fillStyle = '#333333';
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
    var bcolor = this.COLOR_LIST[ gindex % this.NCOLOR ];
    this.gctx[gid].fillStyle = bcolor;
    //this.gctx[gid].fillStyle = '#808080';
  }

  this.gctx[gid].beginPath();
  this.gctx[gid].moveTo(x0, this.linehn[1] + 1);
  this.gctx[gid].lineTo(x1, this.linehn[1] + 1);
  this.gctx[gid].lineTo(x1, this.linehn[3] - 1);
  this.gctx[gid].lineTo(x0, this.linehn[3] - 1);
  this.gctx[gid].lineTo(x0, this.linehn[1] + 1);
  this.gctx[gid].fill();

  // vertical lines for edge ref.
  this.gctx[gid].strokeStyle = '#000000';
  this.gctx[gid].beginPath();
  this.gctx[gid].moveTo(x0 + 2, this.linehn[1] - 2);
  this.gctx[gid].lineTo(x0, this.linehn[1] - 2);
  this.gctx[gid].lineTo(x0, this.linehn[3] + 2);
  this.gctx[gid].lineTo(x0+2, this.linehn[3] + 2);
  this.gctx[gid].moveTo(x1 - 2, this.linehn[1] - 2);
  this.gctx[gid].lineTo(x1, this.linehn[1] - 2);
  this.gctx[gid].lineTo(x1, this.linehn[3] + 2);
  this.gctx[gid].lineTo(x1 - 2, this.linehn[3] + 2);
  this.gctx[gid].stroke();
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

_via_temporal_segmenter.prototype._tmetadata_group_gid_sel_metadata = function(mindex) {
  var old_selected_mindex = this.selected_mindex;
  this.selected_mindex = mindex;
  this.selected_mid = this.tmetadata_gtimeline_mid[this.selected_gid][mindex];
  this.m.currentTime = this.d.store.metadata[this.selected_mid].z[0];
  this._tmetadata_group_gid_draw(this.selected_gid);
  _via_util_msg_show('Metadata selected. ' +
                     'Use <span class="key">l</span> or <span class="key">r</span> to expand and ' +
                     '<span class="key">L</span> or <span class="key">R</span> to reduce segment. ' +
                     'Press <span class="key">&larr;</span>&nbsp;<span class="key">&rarr;</span> to move, ' +
                     '<span class="key">Backspace</span> to delete and ' +
                     '<span class="key">Esc</span> to unselect.', true);
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_remove_mid_sel = function(mindex) {
  this.selected_mindex = -1;
  this.selected_mid = '';
  this.edge_show_time = -1;
  this._tmetadata_group_gid_draw(this.selected_gid);
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
  this._tmetadata_group_gid_draw(this.selected_gid);

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
      this._tmetadata_group_gid_draw(this.selected_gid);
    }
  }.bind(this));
}

_via_temporal_segmenter.prototype._tmetadata_mid_del_sel = function(mid) {
  this._tmetadata_mid_del(this.selected_mid);
  this._tmetadata_group_gid_remove_mid_sel();
  _via_util_msg_show('Temporal segment deleted.');
}

_via_temporal_segmenter.prototype._tmetadata_mid_del = function(mid) {
  var mindex = this.tmetadata_gtimeline_mid[this.selected_gid].indexOf(mid);
  if ( mindex !== -1 ) {
    this.tmetadata_gtimeline_mid[this.selected_gid].splice(mindex, 1);

    this._group_gid_del_mid(this.selected_gid, mid);
    this._tmetadata_group_gid_draw(this.selected_gid);
    this.d.metadata_delete(this.vid, mid);
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
  metadata[ this.groupby_aid ] = this.selected_gid;
  this.d.metadata_add(this.vid, z, xy, metadata).then( function(ok) {
    this.metadata_last_added_mid = ok.mid;
    this._tmetadata_group_gid_draw(this.selected_gid);
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

    this._tmetadata_mid_del(merge_mid);
    // while selected mid remains consistent, mindex changes due to deletion
    this.selected_mindex = this.tmetadata_gtimeline_mid[this.selected_gid].indexOf(this.selected_mid);
    this.d.metadata_update_z(this.file.fid, this.selected_mid, new_z);
    this._tmetadata_group_gid_draw(this.selected_gid);
    if ( eindex === 0 ) {
      this.m.currentTime = new_z[0];
    } else {
      this.m.currentTime = new_z[1];
    }
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

_via_temporal_segmenter.prototype._tmetadata_group_gid_mousemove = function(e) {
  var x = e.offsetX;
  var gid = e.target.dataset.gid;
  var t = this._tmetadata_gtimeline_canvas2time(x);
  if ( this.metadata_resize_is_ongoing ) {
    this.m.currentTime = t;
    // @todo: shown thumbnail
    //this._thumbview_show(t, 0, 0);
    this.metadata_ongoing_update_x[ this.metadata_resize_edge_index ] = x;
    this._tmetadata_group_gid_draw(gid);
    return;
  }

  if ( this.metadata_move_is_ongoing ) {
    this.metadata_move_dx = x - this.metadata_move_start_x;
    this._tmetadata_group_gid_draw(gid);
    return;
  }


  var check = this._tmetadata_group_gid_is_on_edge(gid, t);
  if ( check[0] !== -1 ) {
    this.gcanvas[gid].style.cursor = 'ew-resize';
  } else {
    this.gcanvas[gid].style.cursor = 'default';
  }
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_mousedown = function(e) {
  var x = e.offsetX;
  var gid = e.target.dataset.gid;
  var gindex = e.target.dataset.gindex;
  var t = this._tmetadata_gtimeline_canvas2time(x);

  if ( gindex !== this.selected_gindex ) {
    // select this gid
    this._tmetadata_group_gid_sel(gindex);
  }

  var edge = this._tmetadata_group_gid_is_on_edge(gid, t);
  if ( edge[0] !== -1 ) {
    // mousedown was at the edge
    this.metadata_resize_is_ongoing = true;
    this._tmetadata_group_gid_sel_metadata(edge[0]);
    this.metadata_resize_edge_index = edge[1];
    var z = this.d.store.metadata[this.selected_mid].z;
    this.metadata_ongoing_update_x = [ this._tmetadata_gtimeline_time2canvas(z[0]),
                                       this._tmetadata_gtimeline_time2canvas(z[1])
                                     ];
  } else {
    var mindex = this._tmetadata_group_gid_get_mindex_at_time(gid, t);
    if ( mindex !== -1 ) {
      // clicked on a metadata
      if ( this.selected_mindex !== -1 &&
           mindex === this.selected_mindex
         ) {
        // clicked on an already selected metadata
        // hence, start moving
        this.metadata_move_start_x = x;
        this.metadata_move_is_ongoing = true;
        var z = this.d.store.metadata[this.selected_mid].z;
        this.metadata_ongoing_update_x = [ this._tmetadata_gtimeline_time2canvas(z[0]),
                                           this._tmetadata_gtimeline_time2canvas(z[1])
                                         ];
      } else {
        // else, select metadata
        this._tmetadata_group_gid_sel_metadata(mindex);
      }
    } else {
      if ( this.selected_mindex !== -1 ) {
        // remove metadata selection
        this._tmetadata_group_gid_remove_mid_sel(this.selected_mindex);
      }
    }
  }
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_mouseup = function(e) {
  var x = e.offsetX;
  if ( this.metadata_resize_is_ongoing ) {
    // resize metadata
    var t = this._tmetadata_gtimeline_canvas2time(e.offsetX);
    var dz = t - this.d.store.metadata[this.selected_mid].z[this.metadata_resize_edge_index];
    this._tmetadata_mid_update_edge(this.metadata_resize_edge_index, dz);
    this.metadata_resize_is_ongoing = false;
    this.metadata_resize_edge_index = -1;
    this.metadata_ongoing_update_x = [0, 0];
    return;
  }

  if ( this.metadata_move_is_ongoing ) {
    var dx = x - this.metadata_move_start_x;
    if ( Math.abs(dx) > this.DRAW_LINE_WIDTH ) {
      var dt = dx / this.tmetadata_width_per_sec;
      this._tmetadata_mid_move(dt);
    }
    this.metadata_move_is_ongoing = false;
    this.metadata_ongoing_update_x = [0, 0];
    this._tmetadata_group_gid_draw(this.selected_gid);
    return;
  }
}

_via_temporal_segmenter.prototype._tmetadata_group_gid_is_on_edge = function(gid, t) {
  var mindex, mid;
  for ( mindex in this.tmetadata_gtimeline_mid[gid] ) {
    mid = this.tmetadata_gtimeline_mid[gid][mindex];
    if ( Math.abs(t - this.d.store.metadata[mid].z[0]) < this.METADATA_EDGE_TOL ) {
      return [parseInt(mindex), 0];
    } else {
      if ( Math.abs(t - this.d.store.metadata[mid].z[1]) < this.METADATA_EDGE_TOL ) {
        return [parseInt(mindex), 1];
      }
    }
  }
  return [-1, -1];
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
    if( !this.audio_analyser_active) {
      this._tmetadata_audio_init();
    }
    if ( this.m.paused ) {
      this.m.play();
      _via_util_msg_show('Playing ...');
    } else {
      this.m.pause();
      _via_util_msg_show('Paused. Press <span class="key">a</span> to add a temporal segment, ' +
                         '<span class="key">Tab</span> to select and ' +
                         '<span class="key">&uarr;</span>&nbsp;<span class="key">&darr;</span> to select another temporal segment timeline.', true);
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
    return;
  }

  if ( e.key === 'Backspace' ) {
    e.preventDefault();
    if ( this.selected_mindex !== -1 ) {
      this._tmetadata_mid_del_sel();
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
    this._tmetadata_group_gid_remove_mid_sel();
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
    return;
  }

  if ( e.key === 'Enter' ) {
    e.preventDefault();
    this.m.pause();
    this._tmetadata_group_gid_sel_metadata_at_time();
    return;
  }

  if ( e.key === 'ArrowDown' || e.key === 'ArrowUp' ) {
    e.preventDefault();

    // determine the current and new gid
    var selected_gindex = this.gid_list.indexOf(this.selected_gid);
    var next_gindex;
    if ( e.key === 'ArrowDown' ) {
      next_gindex = selected_gindex + 1;
      if ( next_gindex >= this.gid_list.length ) {
        next_gindex = 0;
      }
    } else {
      next_gindex = selected_gindex - 1;
      if ( next_gindex < 0 ) {
        next_gindex = this.gid_list.length - 1;
      }
    }

    if(e.ctrlKey) {
      // change the order of timeline entries by moving a timeline
      // to the position of next/prev timeline
      this._tmetadata_gid_list_reorder(selected_gindex, next_gindex);
    } else {
      // select next/prev timeline or move selected segment to next/prev timeline

      if(this.selected_mindex !== -1 && this.selected_mid !== '') {
        // move selected temporal segment to the timeline present above/below the current timeline
        var from_gindex = selected_gindex;
        var to_gindex = next_gindex;
        this._tmetadata_mid_change_gid(from_gindex, to_gindex);
      } else {
        // selected the group above/below the current group in the timeline list
        this._tmetadata_group_gid_sel(next_gindex);
        _via_util_msg_show('Selected group "' + this.selected_gid + '"');
        return;
      }
    }
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
  this.groupby_aid = aid;

  var mid, avalue;
  for ( var mindex in this.d.cache.mid_list[this.vid] ) {
    mid = this.d.cache.mid_list[this.vid][mindex];
    if ( this.d.store.metadata[mid].z.length >= 2 &&
         this.d.store.metadata[mid].xy.length === 0
       ) {
      if ( this.d.store.metadata[mid].av.hasOwnProperty(this.groupby_aid) ) {
        avalue = this.d.store.metadata[mid].av[this.groupby_aid];
        if ( ! this.group.hasOwnProperty(avalue) ) {
          this.group[avalue] = [];
        }
        this.group[avalue].push(mid);
      }
    }
  }

  // add possible values for the group variable
  this.gid_list = [];
  // if attribute type is select, then add gid from the attribute's options
  if ( this.d.store.attribute[aid].type === _VIA_ATTRIBUTE_TYPE.SELECT &&
       Object.keys(this.d.store.attribute[aid].options).length !== 0
     ) {
    for ( var gid in this.d.store.attribute[aid].options ) {
      if ( ! this.group.hasOwnProperty(gid) ) {
        this.group[gid] = [];
        this.gid_list.push(gid);
      }
    }
  }

  // add groups contained in metadata
  for ( var gid in this.group ) {
    if ( ! this.gid_list.includes(gid) ) {
      this.gid_list.push(gid);
    }
  }

  // for clarity, ensure that there is at least one group
  if ( this.gid_list.length === 0 ) {
    var default_gid = '_DEFAULT';
    this.group[default_gid] = [];
    this.gid_list.push(default_gid);
  }
  this.gid_list.sort(this._compare_gid.bind(this)); // sort by group-id

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
// Toolbar
//
_via_temporal_segmenter.prototype._toolbar_init = function() {
  this.toolbar_container = document.createElement('div');
  this.toolbar_container.setAttribute('class', 'toolbar_container');

  var pb_mode_container = document.createElement('div');
  var pb_mode_select = document.createElement('select');
  pb_mode_select.setAttribute('style', 'width:11em;');
  pb_mode_select.setAttribute('title', 'Normal playback shows media in the normal 1X speed. To review existing segments, use the Segment Review playback mode to speed up playback in the gap areas and normal playback in the segments.');
  pb_mode_select.addEventListener('change', this._toolbar_playback_mode_on_change.bind(this));
  var pb_mode_option_list = {'Normal':this.PLAYBACK_MODE.NORMAL,
                             'Segments Review':this.PLAYBACK_MODE.REVIEW_SEGMENT,
                             'Gaps Review':this.PLAYBACK_MODE.REVIEW_GAP
                            };
  for ( var pb_mode_name in pb_mode_option_list ) {
    var oi = document.createElement('option');
    oi.setAttribute('value', pb_mode_option_list[pb_mode_name]);
    oi.innerHTML = 'Playback: ' + pb_mode_name;
    pb_mode_select.appendChild(oi);
  }
  pb_mode_container.appendChild(pb_mode_select);

  var gtimeline_row_count_select = document.createElement('select');
  gtimeline_row_count_select.setAttribute('title', 'Number of timeline entries visible to the user at any time.');
  for(var row_count in this.fa.va.GTIMELINE_ROW_HEIGHT_MAP) {
    var option = document.createElement('option');
    option.setAttribute('value', row_count);
    if(row_count === this.d.store['config']['ui']['gtimeline_visible_row_count']) {
      option.setAttribute('selected', '');
    }
    option.innerHTML = row_count;
    gtimeline_row_count_select.appendChild(option);
  }
  gtimeline_row_count_select.addEventListener('change', function(e) {
    this.d.store['config']['ui']['gtimeline_visible_row_count'] = e.target.options[e.target.selectedIndex].value;
    this.fa.va.view_show(this.vid);
  }.bind(this));
  var gtimeline_height_container = document.createElement('div');
  gtimeline_height_container.appendChild(gtimeline_row_count_select);

  var keyboard_shortcut = document.createElement('span');
  keyboard_shortcut.setAttribute('class', 'text_button');
  keyboard_shortcut.innerHTML = 'Keyboard Shortcuts';
  keyboard_shortcut.addEventListener('click', function() {
    _via_util_page_show('page_keyboard_shortcut');
  });

  // tool to add/delete timeline
  var attrupdate_container = document.createElement('div');
  var add = document.createElement('button');
  add.innerHTML = 'Add';
  add.setAttribute('title', 'Add a new timeline');
  add.addEventListener('click', this._toolbar_gid_add.bind(this));

  var del = document.createElement('button');
  del.innerHTML = 'Del';
  del.setAttribute('title', 'Delete an existing timeline');
  del.addEventListener('click', this._toolbar_gid_del.bind(this));

  var attrval = document.createElement('input');
  attrval.setAttribute('class', 'newgid');
  attrval.setAttribute('id', 'gid_add_del_input');
  attrval.setAttribute('type', 'text');
  attrval.setAttribute('title', 'Name of timeline to add or delete');
  attrval.setAttribute('placeholder', 'add/del ' + this.d.store.attribute[this.groupby_aid].aname);
  attrupdate_container.appendChild(attrval)
  attrupdate_container.appendChild(add)
  attrupdate_container.appendChild(del)

  this.toolbar_container.appendChild(attrupdate_container);
  this.toolbar_container.appendChild(gtimeline_height_container);
  this.toolbar_container.appendChild(pb_mode_container);
  this.toolbar_container.appendChild(keyboard_shortcut);

  this.c.appendChild(this.toolbar_container);
}

_via_temporal_segmenter.prototype._toolbar_playback_mode_on_change = function(e) {
  this.current_playback_mode = e.target.value;
  if ( this.current_playback_mode === this.PLAYBACK_MODE.NORMAL ) {
    this._toolbar_playback_rate_set(1);
  }
}

_via_temporal_segmenter.prototype._toolbar_playback_rate_set = function(rate) {
  if ( this.m.playbackRate !== rate ) {
    this.m.playbackRate = rate;
  }
}

_via_temporal_segmenter.prototype._toolbar_gid_add = function() {
  var new_gid = document.getElementById('gid_add_del_input').value.trim();
  if(new_gid === '') {
    _via_util_msg_show('Name of new timeline cannot be empty. Enter the name of new timeline in the input panel.');
    return;
  }
  if ( this.group.hasOwnProperty(new_gid) ) {
    _via_util_msg_show('Timeline [' + new_gid + '] already exists!');
    return;
  }

  this.group[new_gid] = [];
  this.gid_list.push(new_gid);
  this._tmetadata_gmetadata_update();
  document.getElementById('gid_add_del_input').value = '';
}

_via_temporal_segmenter.prototype._toolbar_gid_del = function() {
  var del_gid = document.getElementById('gid_add_del_input').value.trim();
  if(del_gid === '') {
    _via_util_msg_show('To delete, you must provide the name of an existing timeline.');
    return;
  }

  if(!this.gid_list.includes(del_gid)) {
    _via_util_msg_show('Timeline [' + del_gid + '] does not exist and therefore deletion is not possible');
    return;
  }

  var del_gid_list = [del_gid];
  this._group_del_gid(del_gid_list).then( function(del_mid_list) {
    this.d.metadata_delete_bulk(this.vid, del_mid_list, false).then( function(ok) {
      this._tmetadata_gmetadata_update();
      document.getElementById('gid_add_del_input').value = '';
      _via_util_msg_show('Deleted timeline ' + JSON.stringify(del_gid_list) + ' and ' + del_mid_list.length + ' metadata associated with this timeline.');
    }.bind(this), function(err) {
      _via_util_msg_show('Failed to delete ' + del_mid_list.length + ' metadata associated with timeline ' + JSON.stringify(del_gid_list));
    }.bind(this));
  }.bind(this), function(err) {
    _via_util_msg_show('Failed to delete timeline ' + JSON.stringify(del_gid_list));
  }.bind(this));
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
