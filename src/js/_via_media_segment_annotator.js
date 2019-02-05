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

function _via_media_segment_annotator(container, data, media_element, file) {
  this.c = container;
  this.d = data;
  this.m = media_element;
  this.file = file;

  // state
  this.is_mark_move_ongoing = false;
  this.move_mark_id = -1;
  this.move_mark_initial = -1;
  this.timeline_length = -1;

  this.timeline_markid = [ 0, 1];
  this.current_segment_index = 0;
  this.segment_time_list = [];  // an array of [start,end] time (in sec) of segments
  this.segment_mark_list = [];  // an array of [start,end] marks for timeline
  this.segment_input_list = []; // an array of [start,end] html input=text fields

  // segment boundary view (segview)
  this.SEGMENT_COLOR_LIST = ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7"];
  this.segview_boundary_to_mid = {};
  this.SEGMENTER_MODE = { 'EDIT':1, 'CREATE':2 };
  this.segmenter_mode_now = this.SEGMENTER_MODE.CREATE;
  this.segmenter_edit_mid = -1; // not needed in create mode
  this.MAX_LABEL_SIZE = 20;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_media_segment_annotator_';
  _via_event.call( this );

  if ( ! this.m instanceof HTMLMediaElement ) {
    throw 'media element must be an instance of HTMLMediaElement!';
  }

  this._init();
  this._timeline_update();

  this.m.addEventListener('timeupdate', this._on_media_timeupdate.bind(this));
}

_via_media_segment_annotator.prototype._init = function() {
  // initialise timeline segmenter tool
  this.timeline_container = document.createElement('div');
  this.timeline_container.setAttribute('class', 'timeline_container');
  this._timeline_init(this.timeline_container);

  // initialise segment boundary viewer
  this.segview_container = document.createElement('div');
  this.segview_container.setAttribute('class', 'segview_container');
  this._segview_init(this.segview_container);

  // initialise with a single segment spanning the media duration
  this.segmetadata_container = document.createElement('div');
  this.segmetadata_container.setAttribute('class', 'segmetadata_container');
  this._segmetadata_add_default();
  this.segmetadata_table = this._segmetadata_init();
  this._segmetadata_set_current(0);
  this.segmetadata_container.appendChild( this.segmetadata_table );

  this.c.innerHTML = '';
  this.c.appendChild(this.segview_container);
  this.c.appendChild(this.timeline_container);
  this.c.appendChild(this.segmetadata_container);
}

//
// Metadata
//
_via_media_segment_annotator.prototype._segmetadata_init = function() {
  if ( this.segmenter_mode_now === this.SEGMENTER_MODE.EDIT ) {
    // update this.segment_time_list
    var t = this.d.metadata_store[this.file.fid][this.segmenter_edit_mid].where.slice(2);
    this.segment_time_list = [];
    this.segment_mark_list = [];
    var i;
    for ( i = 0; i < t.length; i = i + 2 ) {
      this.segment_time_list.push( [ t[i], t[i+1] ] );
      this.segment_mark_list.push( [ this.time2mark(t[i]),
                                     this.time2mark(t[i+1])
                                   ]
                                 );
    }
  }

  var segmetadata_table = document.createElement('table');
  segmetadata_table.appendChild( this._segmetadata_get_header() );

  // add a single row containing
  // - a list of segments
  // - their attributes
  var tr = document.createElement('tr');

  var button_container = document.createElement('td');
  this.create_segment_button = document.createElement('button');
  this.create_segment_button.innerHTML = 'Create';
  this.create_segment_button.setAttribute('title', 'Create a new metadata');
  this.create_segment_button.addEventListener('click', this._metadata_create.bind(this));
  button_container.appendChild(this.create_segment_button);

  this.update_segment_button = document.createElement('button');
  this.update_segment_button.innerHTML = 'Update';
  this.update_segment_button.setAttribute('title', 'Update this existing metadata');
  this.update_segment_button.addEventListener('click', this._metadata_update.bind(this));
  button_container.appendChild(this.update_segment_button);

  this.del_segment_button = document.createElement('button');
  this.del_segment_button.innerHTML = 'Delete';
  this.del_segment_button.setAttribute('title', 'Delete this existing metadata');
  this.del_segment_button.addEventListener('click', this._metadata_del.bind(this));
  button_container.appendChild(this.del_segment_button);

  if ( this.segmenter_mode_now === this.SEGMENTER_MODE.CREATE ) {
    this.update_segment_button.setAttribute('disabled', 'true');
    this.del_segment_button.setAttribute('disabled', 'true');
  }

  tr.appendChild(button_container);

  var segment_list_container = document.createElement('td');
  this.segment_list_table = document.createElement('table');
  this.segment_list_table.setAttribute('class', 'segment_table');
  this.segment_list_table.appendChild( this._segment_list_get_header() );
  this.segment_list_table.appendChild( this._segment_list_get_body() );

  segment_list_container.appendChild( this.segment_list_table );
  tr.appendChild(segment_list_container);

  var aid;
  for ( aid in this.d.attribute_store ) {
    var td = document.createElement('td');
    td.setAttribute('data-is_attribute', 1);
    var attr_input = this.d.attribute_store[aid].html_element();
    attr_input.setAttribute('data-aid', aid);
    td.appendChild( attr_input );
    tr.appendChild(td);
  }

  var tbody = document.createElement('tbody');
  tbody.appendChild(tr);
  segmetadata_table.appendChild( tbody );
  return segmetadata_table;
}

_via_media_segment_annotator.prototype._segmetadata_update = function() {
  this.segmetadata_table = this._segmetadata_init();
  this.segmetadata_container.replaceChild(this.segmetadata_table,
                                          this.segmetadata_container.firstChild);
}

_via_media_segment_annotator.prototype._segmetadata_get_header = function() {
  var tr = document.createElement('tr');

  var controls = this._segmetadata_media_controls();
  tr.appendChild(controls);

  var segments = document.createElement('th');
  segments.innerHTML = 'Media Segments';
  tr.appendChild(segments);

  var aid;
  for ( aid in this.d.attribute_store ) {
    var th = document.createElement('th');
    th.innerHTML = this.d.attribute_store[aid].attr_name;
    tr.appendChild(th);
  }

  var thead = document.createElement('thead');
  thead.appendChild(tr);
  return thead;
}

_via_media_segment_annotator.prototype._segmetadata_media_controls = function() {
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

//
// Metadata (create, update, delete)
//
_via_media_segment_annotator.prototype._metadata_del = function() {
  console.log('_metadata_del');
  this.emit_event('metadata_segment_del', {'fid':this.file.fid,
                                           'mid':this.segmenter_edit_mid
                                          }
                 );
  this._segmenter_switch_mode(this.SEGMENTER_MODE.CREATE);
}

_via_media_segment_annotator.prototype._metadata_create = function() {
  var t = [];
  var n = this.segment_time_list.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    t.push( this.segment_time_list[i][0] );
    t.push( this.segment_time_list[i][1] );
  }

  // get all the attribute values
  var what = {}; // value of each attribute
  var tbody = this.segmetadata_table.getElementsByTagName('tbody')[0];
  var td_list = tbody.getElementsByTagName('td');
  var n = td_list.length;
  var i, aid, value;
  for ( i = 0; i < n; ++i ) {
    if ( typeof(td_list[i].dataset.is_attribute) !== 'undefined' ) {
      if ( td_list[i].firstChild &&
           typeof(td_list[i].firstChild.dataset.aid) !== 'undefined'
         ) {
        aid = td_list[i].firstChild.dataset.aid;
        value = _via_util_get_html_input_element_value(td_list[i].firstChild);
        what[aid] = value;
      }
    }
  }

  this.emit_event('metadata_segment_add', { 't':t, 'what':what });
}

_via_media_segment_annotator.prototype._metadata_update = function() {
  console.log('_metadata_update()');
  var t = [];
  var n = this.segment_time_list.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    t.push( this.segment_time_list[i][0] );
    t.push( this.segment_time_list[i][1] );
  }

  // get all the attribute values
  var what = {}; // value of each attribute
  var tbody = this.segmetadata_table.getElementsByTagName('tbody')[0];
  var td_list = tbody.getElementsByTagName('td');
  var n = td_list.length;
  var i, aid, value;
  for ( i = 0; i < n; ++i ) {
    if ( typeof(td_list[i].dataset.is_attribute) !== 'undefined' ) {
      if ( td_list[i].firstChild &&
           typeof(td_list[i].firstChild.dataset.aid) !== 'undefined'
         ) {
        aid = td_list[i].firstChild.dataset.aid;
        value = _via_util_get_html_input_element_value(td_list[i].firstChild);
        what[aid] = value;
      }
    }
  }

  this.emit_event('metadata_segment_update', {'fid':this.file.fid,
                                              'mid':this.segmenter_edit_mid,
                                              't':t,
                                              'what':what
                                             }
                 );
}

//
// Segment boundary viewer
//
_via_media_segment_annotator.prototype._segview_init = function(container) {
  this.segview = document.createElement('canvas');
  this.segview.addEventListener('mousemove', this._on_segview_mousemove.bind(this));
  this.segview.addEventListener('mousedown', this._on_segview_mousedown.bind(this));
  this.segview.addEventListener('mouseup', this._on_segview_mouseup.bind(this));

  container.appendChild(this.segview);

  this.segviewctx = this.segview.getContext('2d', { alpha:false } );
  this.segviewctx.font = '10px Sans';

  var char_width = this.segviewctx.measureText('M').width;
  this.sh = Math.floor(char_width * 3);
  this.sw = this.c.clientWidth - 2*char_width;
  this.segview.width  = this.sw;
  this.segview.height = this.sh;
  this.arrow_width = 5;
  this.arrow_height = 6;
  this.arrow_heightby2 = 3;
  this.seg_label_y0 = Math.floor(char_width);
  this.seg_boundary_y0 = Math.floor(char_width + this.arrow_heightby2 );

  this._segview_update();
}

_via_media_segment_annotator.prototype._segview_update = function() {
  this._segview_clear();
  this._segview_draw_all();
}

_via_media_segment_annotator.prototype._segview_clear = function() {
  this.segviewctx.fillStyle = 'white';
  this.segviewctx.fillRect(0, 0, this.segview.width, this.segview.height);
}

_via_media_segment_annotator.prototype._segview_draw_all = function() {
  var fid = this.file.fid;
  var mindex = 0;
  var mid;
  this.segview_boundary_to_mid = {};
  for ( mid in this.d.metadata_store[fid] ) {
    if ( this.d.metadata_store[fid][mid].where[0] === _VIA_WHERE_TARGET.SEGMENT &&
         this.d.metadata_store[fid][mid].where[1] === _VIA_WHERE_SHAPE.TIME
       ) {
      this.segview_boundary_to_mid[mid] = [];
      var color = this.SEGMENT_COLOR_LIST[ mindex % this.SEGMENT_COLOR_LIST.length ];
      var n = this.d.metadata_store[fid][mid].where.length; // [target_id, shape_id, t0, ...]
      var ti, mstart, mend, label, color, linedash;
      if ( mid === this.segmenter_edit_mid ) {
        linedash = [8, 2];
      } else {
        linedash = [];
      }
      for ( ti = 2; ti < n; ti = ti + 2 ) {
        mstart = this.time2mark( this.d.metadata_store[fid][mid].where[ti] );
        mend = this.time2mark( this.d.metadata_store[fid][mid].where[ti+1] );
        label = this.d.metadata_store[fid][mid].what[ this.d.aid_list[0] ];
        this._segview_draw_boundary(mstart, mend, color, linedash);
        this.segview_boundary_to_mid[mid].push([mstart, mend]);
      }
      this._segview_draw_label(mstart, mend, label);
      mindex = mindex + 1;
    }
  }
}

_via_media_segment_annotator.prototype._segview_draw_boundary = function(mstart, mend, color, linedash) {
  this.segviewctx.lineWidth = 1;
  this.segviewctx.strokeStyle = color;
  this.segviewctx.fillStyle = color;
  this.segviewctx.setLineDash([]);

  this.segviewctx.beginPath();
  // draw start arrow
  this.segviewctx.moveTo(this.timelinex + mstart, this.seg_boundary_y0);
  this.segviewctx.lineTo(this.timelinex + mstart + this.arrow_width, this.seg_boundary_y0 - this.arrow_heightby2);
  this.segviewctx.lineTo(this.timelinex + mstart + this.arrow_width, this.seg_boundary_y0 + this.arrow_heightby2);
  this.segviewctx.lineTo(this.timelinex + mstart, this.seg_boundary_y0);
  // draw end arrow
  this.segviewctx.moveTo(this.timelinex + mend, this.seg_boundary_y0);
  this.segviewctx.lineTo(this.timelinex + mend - this.arrow_width, this.seg_boundary_y0 - this.arrow_heightby2);
  this.segviewctx.lineTo(this.timelinex + mend - this.arrow_width, this.seg_boundary_y0 + this.arrow_heightby2);
  this.segviewctx.lineTo(this.timelinex + mend, this.seg_boundary_y0);
  this.segviewctx.fill();

  // draw line
  this.segviewctx.setLineDash(linedash);
  this.segviewctx.beginPath();
  this.segviewctx.moveTo(this.timelinex + mstart, this.seg_boundary_y0);
  this.segviewctx.lineTo(this.timelinex + mend, this.seg_boundary_y0);
  this.segviewctx.stroke();
}

_via_media_segment_annotator.prototype._segview_draw_label = function(mstart, mend, label) {
  this.segviewctx.font = '10px Mono';
  if ( label.length > this.MAX_LABEL_SIZE ) {
    label = label.substr(0, this.MAX_LABEL_SIZE) + '.';
  }

  var char_width = this.segviewctx.measureText(label[0]).width;
  var label_width = this.segviewctx.measureText(label).width;
  var label_drawn = label;
  var seg_width = mend - mstart;
  if (label_width > seg_width ) {
    var max_label_size = Math.floor(seg_width / char_width) - 1;
    label_drawn = label.substr(0, max_label_size) + '.';
    label_width = this.segviewctx.measureText(label_drawn).width;
  }

  this.segviewctx.fillStyle = 'white';
  this.segviewctx.fillRect(mstart, 0, label_width + this.seg_label_y0, this.seg_label_y0);
  this.segviewctx.fillStyle = '#808080';
  this.segviewctx.fillText(label,
                           this.timelinex + mstart,
                           this.seg_label_y0);
}

_via_media_segment_annotator.prototype._on_segview_mousemove = function(e) {
  var x_timeline = this._canvas2timeline(e.offsetX)
  var mid = this._segview_which_mid( x_timeline );
  if ( mid === -1 ) {
    this.segview.style.cursor = 'default';
  } else {
    this.segview.style.cursor = 'pointer';
  }
}

_via_media_segment_annotator.prototype._on_segview_mousedown = function(e) {
}

_via_media_segment_annotator.prototype._on_segview_mouseup = function(e) {
  var x_timeline = this._canvas2timeline(e.offsetX)
  var mid_info = this._segview_which_mid( x_timeline );
  if ( mid_info.mid !== -1 ) {
    console.log('Editing mid=' + mid_info.mid);
    this._segmenter_switch_mode( this.SEGMENTER_MODE.EDIT, mid_info.mid, mid_info.segment_index );
  } else {
    this._segmenter_switch_mode( this.SEGMENTER_MODE.CREATE );
  }
}

_via_media_segment_annotator.prototype._segview_which_mid = function(markx) {
  var fid = this.file.fid;
  var mid, i;
  for ( mid in this.d.metadata_store[fid] ) {
    for ( i = 0; i < this.segview_boundary_to_mid[mid].length; ++i ) {
      if ( markx >= this.segview_boundary_to_mid[mid][i][0] &&
           markx <  this.segview_boundary_to_mid[mid][i][1]
         ) {
        return {'mid':mid, 'segment_index':i};
      }
    }
  }
  return {'mid':-1};
}

//
// Timline
//
_via_media_segment_annotator.prototype._timeline_init = function(container) {
  this.tmark = document.createElement('canvas');
  this.tmark.addEventListener('mousemove', this._on_timeline_mousemove.bind(this));
  this.tmark.addEventListener('mousedown', this._on_timeline_mousedown.bind(this));
  this.tmark.addEventListener('mouseup', this._on_timeline_mouseup.bind(this));

  container.appendChild(this.tmark);

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

_via_media_segment_annotator.prototype._timeline_update = function() {
  this._draw_timeline();
  this._fill_between_marks();
  this._draw_marks();
  this._draw_current_time();
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
  var mark0 = this.segment_mark_list[this.current_segment_index][0];
  this.tmarkctx.beginPath();
  this.tmarkctx.moveTo(this.timelinex + mark0 + this.markw, this.marky0);
  this.tmarkctx.lineTo(this.timelinex + mark0, this.marky0);
  this.tmarkctx.lineTo(this.timelinex + mark0, this.marky1);
  this.tmarkctx.lineTo(this.timelinex + mark0 + this.markw, this.marky1);
  this.tmarkctx.stroke();

  // draw end mark
  var mark1 = this.segment_mark_list[this.current_segment_index][1];
  this.tmarkctx.beginPath();
  this.tmarkctx.moveTo(this.timelinex + mark1 - this.markw, this.marky0);
  this.tmarkctx.lineTo(this.timelinex + mark1, this.marky0);
  this.tmarkctx.lineTo(this.timelinex + mark1, this.marky1);
  this.tmarkctx.lineTo(this.timelinex + mark1 - this.markw, this.marky1);
  this.tmarkctx.stroke();
}

_via_media_segment_annotator.prototype._fill_between_marks = function() {
  var mark0 = this.segment_mark_list[this.current_segment_index][0];
  var mark1 = this.segment_mark_list[this.current_segment_index][1];

  this.tmarkctx.fillStyle = '#cfcfcf';
  this.tmarkctx.fillRect(this.timelinex + mark0 + this.markw2f,
                         this.timeliney,
                         mark1 - mark0 - this.markw,
                         this.timelineh)
}

_via_media_segment_annotator.prototype._draw_current_time = function() {
  this.tmarkctx.font = '12px Mono';
  this.tmarkctx.fillStyle = 'black';
  var timestr;
  if ( this.m.currentTime > 59 ) {
    timestr = (this.m.currentTime / 60).toFixed(3).toString() + ' min';
  } else {
    timestr = this.m.currentTime.toFixed(3).toString() + ' sec';;
  }
  this.tmarkctx.fillText(timestr,
                         Math.floor(this.timeline_length/2),
                         Math.floor(1.25 * this.timelineh)
                        );
}

//
// Segment Metadata
//
_via_media_segment_annotator.prototype._segmetadata_add_default = function() {
  this.segment_time_list.push( [0, this.m.duration] );
  var new_segment_index = this.segment_time_list.length - 1;

  this.segment_mark_list[ new_segment_index ] = [0,
                                                 this.time2mark(this.m.duration)
                                                ];
  return new_segment_index;
}

_via_media_segment_annotator.prototype._segmetadata_set_current = function(sindex, markid) {
  this.current_segment_index = sindex;
  if ( typeof(markid) === 'undefined' ) {
    this.m.currentTime = this.segment_time_list[this.current_segment_index][0];
  } else {
    this.m.currentTime = this.segment_time_list[this.current_segment_index][markid];
  }
  this._segment_list_highlight_current();
}

_via_media_segment_annotator.prototype._segment_list_highlight_current = function() {
  var tbody = this.segment_list_table.getElementsByTagName('tbody')[0];
  var n = tbody.childNodes.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    if ( typeof(tbody.childNodes[i].dataset.segment_index) !== 'undefined' ) {
      if ( parseInt(tbody.childNodes[i].dataset.segment_index) === this.current_segment_index ) {
        tbody.childNodes[i].classList.add('current');
        //tbody.childNodes[i].scrollIntoView();
      } else {
        tbody.childNodes[i].classList.remove('current');
      }
    }
  }
}

_via_media_segment_annotator.prototype._segment_delete = function(e) {
  var del_segment_index = parseInt(e.target.dataset.segment_index);
  var old_segment_time_list = this.segment_time_list.slice(0);
  var old_segment_mark_list = this.segment_mark_list.slice(0);
  this.segment_time_list = [];
  this.segment_mark_list = [];
  var n = old_segment_time_list.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    if ( i !== del_segment_index ) {
      this.segment_time_list.push( old_segment_time_list[i] );
      this.segment_mark_list.push( old_segment_mark_list[i] );
    }
  }

  this._segment_list_update();
  if ( this.segment_time_list.length ) {
    this._segmetadata_set_current(0);
  }
}

_via_media_segment_annotator.prototype._segment_input_set_to_current_mark = function(sindex, markid) {
  var time = this.segment_time_list[sindex][markid].toFixed(3);
  this.segment_input_list[sindex][markid].setAttribute('value', time);
}

_via_media_segment_annotator.prototype._segment_input_on_focus = function(e) {
  var sindex = parseInt(e.target.dataset.segment_index);
  var markid = parseInt(e.target.dataset.markid);
  this._segmetadata_set_current(sindex, markid);
  this._timeline_update();
}

_via_media_segment_annotator.prototype._segment_input_on_change = function(e) {
  var sindex = parseInt(e.target.dataset.segment_index);
  var markid = parseInt(e.target.dataset.markid);
  var time = parseFloat(e.target.value);
  this._segment_update_time(sindex, markid, time);
}

_via_media_segment_annotator.prototype._segment_update_time = function(sindex, markid, time) {
  this.segment_time_list[sindex][markid] = time;
  this._segment_on_update(sindex, markid);
}

_via_media_segment_annotator.prototype._segment_on_update = function(sindex, markid) {
  var time = this.segment_time_list[sindex][markid];
  this.segment_mark_list[this.current_segment_index][markid] = this.time2mark(time);
  this.m.currentTime = time;
  this._timeline_update();
}

_via_media_segment_annotator.prototype._segment_list_update = function() {
  this.segment_list_table.replaceChild( this._segment_list_get_body(),
                                        this.segment_list_table.getElementsByTagName('tbody')[0]
                                      );
}

_via_media_segment_annotator.prototype._segment_list_get_header = function() {
  var head = document.createElement('thead');
  var head_tr = document.createElement('tr');
  var actions_head = document.createElement('th');
  actions_head.innerHTML = '&nbsp;';
  head_tr.appendChild(actions_head);
  var start_head = document.createElement('th');
  start_head.innerHTML = 'Start Time';
  head_tr.appendChild(start_head);
  var end_head = document.createElement('th');
  end_head.innerHTML = 'End Time';
  head_tr.appendChild(end_head);
  head.appendChild(head_tr);
  return head;
}

_via_media_segment_annotator.prototype._segment_list_get_body = function() {
  // segment list
  var body = document.createElement('tbody');
  var segment_count = this.segment_time_list.length;
  var i;
  for ( i = 0; i < segment_count; ++i ) {
    // actions
    var td_action = document.createElement('td');
    var action = document.createElement('button');
    action.setAttribute('class', 'text_button');
    action.setAttribute('data-segment_index', i);
    action.innerHTML = '&times;';
    action.addEventListener('click', this._segment_delete.bind(this));
    td_action.appendChild(action);

    // start
    this.segment_input_list[i] = [];
    var td_start = document.createElement('td');
    this.segment_input_list[i][0] = document.createElement('input');
    this.segment_input_list[i][0].setAttribute('type', 'text');
    this.segment_input_list[i][0].setAttribute('size', '4');
    this.segment_input_list[i][0].setAttribute('data-segment_index', i);
    this.segment_input_list[i][0].setAttribute('data-markid', 0);
    this.segment_input_list[i][0].addEventListener('focus',
                                                   this._segment_input_on_focus.bind(this));
    this.segment_input_list[i][0].addEventListener('change',
                                                   this._segment_input_on_change.bind(this));
    this._segment_input_set_to_current_mark(i, 0);
    td_start.appendChild(this.segment_input_list[i][0]);

    // end
    var td_end = document.createElement('td');
    this.segment_input_list[i][1] = document.createElement('input');
    this.segment_input_list[i][1].setAttribute('type', 'text');
    this.segment_input_list[i][1].setAttribute('size', '4');
    this.segment_input_list[i][1].setAttribute('data-segment_index', i);
    this.segment_input_list[i][1].setAttribute('data-markid', 1);
    this.segment_input_list[i][1].addEventListener('focus', this._segment_input_on_focus.bind(this));
    this.segment_input_list[i][1].addEventListener('change', this._segment_input_on_change.bind(this));
    this._segment_input_set_to_current_mark(i, 1);
    td_end.appendChild(this.segment_input_list[i][1]);

    var tr = document.createElement('tr');
    tr.setAttribute('data-segment_index', i);
    tr.appendChild(td_action);
    tr.appendChild(td_start);
    tr.appendChild(td_end);
    body.appendChild(tr);
  }

  // always add an extra row for adding new segments actions
  var td_action = document.createElement('td');
  td_action.setAttribute('colspan', '3');
  var action = document.createElement('button');
  action.setAttribute('class', 'text_button');
  action.innerHTML = 'Add More Segments';
  action.addEventListener('click', function(e) {
    var sindex = this._segmetadata_add_default();
    this._segment_list_update();
    this._segmetadata_set_current(sindex);
    this._timeline_update();
  }.bind(this));
  td_action.appendChild(action);
  var tr = document.createElement('tr');
  tr.appendChild(td_action);
  body.appendChild(tr);
  return body;
}

//
// Marks
//
_via_media_segment_annotator.prototype._is_valid_timeline_mark = function(markid, new_mark) {
  // ensure that timeline mark is valid (i.e. start_time < end_time)
  if ( markid == 0 &&
       new_mark > this.segment_mark_list[this.current_segment_index][1]
     ) {
    return false;
  }
  if ( markid == 1 &&
       new_mark < this.segment_mark_list[this.current_segment_index][0]
     ) {
    return false;
  }
  return true;
}

_via_media_segment_annotator.prototype._update_timeline_mark = function(markid, new_mark) {
  var time = this.mark2time(new_mark);
  this._segment_update_time(this.current_segment_index, markid, time);

  // set segment [start,end] time input fields to updated value
  this._segment_input_set_to_current_mark(this.current_segment_index, markid);
}

_via_media_segment_annotator.prototype._update_timeline_mark_from_currentime = function(markid) {
  var time = this.m.currentTime;
  var mark = this.time2mark(time);
  if ( this._is_valid_timeline_mark(markid, mark) ) {
    this._segment_update_time(this.current_segment_index, markid, time);
    this._segment_input_set_to_current_mark(this.current_segment_index, markid);
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
  var d0 = x - this.segment_mark_list[this.current_segment_index][0];
  var d1 = this.segment_mark_list[this.current_segment_index][1] - x;

  if ( d0 < d1 ) {
    return 0;
  } else {
    return 1;
  }
}

_via_media_segment_annotator.prototype._which_marker = function(x) {
  var i;
  for ( i = 0; i < this.timeline_markid.length; ++i ) {
    if ( Math.abs( x - this.segment_mark_list[this.current_segment_index][i] ) < this.markw2 ) {
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
    this.move_mark_initial = this.segment_mark_list[this.current_segment_index][markid];
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

//
// Attribute events
//
_via_media_segment_annotator.prototype._on_event_attribute_del = function(aid) {
  this._metadata_update();
}

_via_media_segment_annotator.prototype._on_event_attribute_add = function(aid) {
  this._metadata_update();
}

//
// Metadata events
//
_via_media_segment_annotator.prototype._on_event_metadata_add = function(fid, mid) {
  this._segview_update();
}

_via_media_segment_annotator.prototype._on_event_metadata_del = function(fid, mid) {
  this._segview_update();
}

_via_media_segment_annotator.prototype._on_event_metadata_update = function(fid, mid) {
  this._segview_update();
}

//
// Media Events
//
_via_media_segment_annotator.prototype._on_media_timeupdate = function() {
  // @todo: it may be not necessary to re-draw everything! Just update the time.
  this._timeline_update();
}

//
// Segmenter mode
//
_via_media_segment_annotator.prototype._segmenter_switch_mode = function(mode, mid, sindex) {
  this.segmenter_mode_now = mode;
  this.segmenter_edit_mid = mid;

  if ( this.segmenter_mode_now === this.SEGMENTER_MODE.CREATE ) {
  }

  this._segmetadata_update();
  if ( this.segmenter_mode_now === this.SEGMENTER_MODE.EDIT ) {
    this._segmetadata_set_current(sindex);
  }

  this._segview_update();
  this._timeline_update();
}
