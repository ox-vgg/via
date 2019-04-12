/**
 * @class
 * @classdesc Manages region draw and view operations on an image or video
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 8 Apr. 2019
 */

'use strict';

var _VIA_RINPUT_STATE = { UNKNOWN:1,
                          IDLE:2,
                          REGION_SELECTED: 3,
                          REGION_SELECT_OR_DRAW_POSSIBLE: 4,
                          SELECT_ALL_INSIDE_AN_AREA_ONGOING: 5,
                          REGION_UNSELECT_ONGOING: 6,
                          REGION_SELECT_TOGGLE_ONGOING: 7,
                          REGION_MOVE_ONGOING: 8,
                          REGION_RESIZE_ONGOING: 9,
                          REGION_DRAW_ONGOING: 10,
                          REGION_DRAW_NCLICK_ONGOING: 11,
                        }

function _via_file_annotator(view_annotator, data, vid, findex, container) {
  this.va = view_annotator;
  this.d = data;
  this.vid = vid;
  this.findex = findex;
  this.c = container;

  // state variables
  this.state_id = this._state_set(_VIA_RINPUT_STATE.UNKNOWN);
  this.user_input_pts = []; // [x0, y0, x1, y1, ..., xk, yk]
  this.last_clicked_mid_list = [];

  // canvas regions
  this.creg = {}; // canvas regions
  this.selected_mid_list = [];

  // constants
  this.conf = {};
  this.conf.CONTROL_POINT_RADIUS = 2;
  this.conf.CONTROL_POINT_COLOR  = 'red';
  this.conf.CONTROL_POINT_CLICK_TOL = 3;
  this.conf.REGION_BOUNDARY_COLOR = 'yellow';
  this.conf.REGION_LINE_WIDTH = 2;
  this.conf.SEL_REGION_BOUNDARY_COLOR = 'black';
  this.conf.SEL_REGION_FILL_COLOR = '#808080';
  this.conf.SEL_REGION_FILL_OPACITY = 0.5;
  this.conf.SEL_REGION_LINE_WIDTH = 2;
  this.conf.REGION_POINT_RADIUS = 3;
  this.conf.FIRST_VERTEX_CLICK_TOL = 3;
  this.conf.FIRST_VERTEX_BOUNDARY_WIDTH = 1;
  this.conf.FIRST_VERTEX_BOUNDARY_COLOR = 'black';
  this.conf.FIRST_VERTEX_FILL_COLOR = 'white';

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_file_annotator_';
  _via_event.call( this );

  // register event listeners
  this.d.on_event('metadata_add', this._on_event_metadata_add.bind(this));

  this._init();
}

_via_file_annotator.prototype._init = function() {
  this.fid = this.d.store.view[this.vid].f[this.findex];
  this.file = this.d.store.file[this.fid];

  this._file_read().then( function(file_src) {
    this.file_html_element = this._file_create_html_element(this.file);
    this.file_html_element.setAttribute('title', this.file.fname);
    this.file_html_element.setAttribute('src', file_src);
    // _file_html_element_ready() will be invoked when load is complete
  }.bind(this), function(err) {
    console.warn('Failed to read file: ' + this.file);
    console.log(err);
  }.bind(this));
}

_via_file_annotator.prototype._file_create_html_element = function(file) {
  var media;
  switch( file.type ) {
  case _VIA_FILE_TYPE.VIDEO:
    media = document.createElement('video');
    media.setAttribute('controls', '');
    // @todo : add subtitle track for video
    media.setAttribute('preload', 'auto');
    media.addEventListener('loadeddata', this._file_html_element_ready.bind(this));
    media.addEventListener('stalled', this._file_html_element_error.bind(this));
    media.addEventListener('suspend', this._file_html_element_error.bind(this));
    break;

  case _VIA_FILE_TYPE.IMAGE:
    media = document.createElement('img');
    media.addEventListener('load', this._file_html_element_ready.bind(this));
    break;

  case _VIA_FILE_TYPE.AUDIO:
    media = document.createElement('audio');
    break;

  default:
    console.warn('unknown file type = ' + this.file.type);
  }
  media.addEventListener('abort', this._file_html_element_error.bind(this));
  media.addEventListener('error', this._file_html_element_error.bind(this));
  return media;
}

_via_file_annotator.prototype._file_read = function() {
  return new Promise( function(ok_callback, err_callback) {
    if ( this.file.src instanceof File ) {
      var file_reader = new FileReader();
      file_reader.addEventListener('error', function(e) {
        console.log('_via_file_annotator._file_read() error');
        console.warn(e.target.error)
        err_callback(this.file);
      }.bind(this));
      file_reader.addEventListener('abort', function() {
        console.log('_via_file_annotator._file_read() abort');
        err_callback(this.file)
      }.bind(this));
      file_reader.addEventListener('load', function() {
        var blob = new Blob( [ file_reader.result ],
                             { type: this.file.src.type }
                           );
        // we keep a reference of file object URL so that we can revoke it when not needed
        // WARNING: ensure that this._destroy_file_object_url() gets called when "this" not needed
        this.file_object_url = URL.createObjectURL(blob);
        ok_callback(this.file_object_url);
      }.bind(this));
      file_reader.readAsArrayBuffer( this.d.store.config.file.path + this.file.src );
    } else {
      ok_callback( this.d.store.config.file.path + this.file.src ); // read from URL
    }
  }.bind(this));
}

_via_file_annotator.prototype._destroy_file_object_url = function() {
  if ( typeof(this.file_object_url) !== 'undefined' ) {
    console.log('_via_file_annotator(): revoked file object url for fid=' + this.fid)
    URL.revokeObjectURL(this.file_object_url);
  }
}

_via_file_annotator.prototype._file_html_element_compute_scale = function() {
  var maxh = this.c.clientHeight;
  var maxw = this.c.clientWidth;

  // original size of the content
  var cw0, ch0;
  switch( this.file.type ) {
  case _VIA_FILE_TYPE.VIDEO:
    cw0 = this.file_html_element.videoWidth;
    ch0 = this.file_html_element.videoHeight;
    break;
  case _VIA_FILE_TYPE.IMAGE:
    cw0 = this.file_html_element.naturalWidth;
    ch0 = this.file_html_element.naturalHeight;
    break;
  }
  var ar = cw0/ch0;
  var ch = maxh;
  var cw = Math.floor(ar * ch);
  if ( cw > maxw ) {
    cw = maxw;
    ch = Math.floor(cw/ar);
  }
  this.cwidth = cw;
  this.cheight = ch;
  this.cscale = ch0/ch; // x  = cscale * cx
  this.fscale = ch/ch0; // cx = fscale * x
  this.original_width = cw0;
  this.original_height = ch0;
  this.file_html_element_size_css = 'width:' + cw + 'px;height:' + ch + 'px;';

  switch( this.d.store.config.ui.file_content_align ) {
  case 'center':
    this.left_pad = Math.floor( (maxw - this.cwidth) / 2 );
    this.file_html_element_size_css += 'left:' + this.left_pad + 'px;';
    break;
  case 'right':
    this.left_pad = maxw - this.cwidth;
    this.file_html_element_size_css += 'left:' + this.left_pad + 'px;';
    break;
  default:
    this.file_html_element_size_css += 'left:0px;';
  }
}

//
// event listeners
//
_via_file_annotator.prototype._file_html_element_ready = function() {
  this._file_html_element_compute_scale();
  this.file_html_element.setAttribute('style', this.file_html_element_size_css);
  this.c.appendChild(this.file_html_element);

  // add canvas for region shape
  this.rshape_canvas = document.createElement('canvas');
  this.rshape_canvas.setAttribute('style', this.file_html_element_size_css);
  this.rshape_canvas.setAttribute('id', 'region_shape');
  this.rshape_canvas.width = this.cwidth;
  this.rshape_canvas.height = this.cheight;
  this.rshapectx = this.rshape_canvas.getContext('2d', { alpha:true });
  this.c.appendChild(this.rshape_canvas);

  this.rinput_canvas = document.createElement('canvas');
  this.rinput_canvas.setAttribute('style', this.file_html_element_size_css);
  this.rinput_canvas.setAttribute('id', 'region_input');
  this.rinput_canvas.width = this.cwidth;
  this.rinput_canvas.height = this.cheight;
  this.rinputctx = this.rinput_canvas.getContext('2d', { alpha:true });
  this._rinput_attach_input_handlers();
  this.c.appendChild(this.rinput_canvas);

  this._state_set(_VIA_RINPUT_STATE.IDLE);
}

_via_file_annotator.prototype._file_html_element_error = function() {
  this.c.innerHTML += 'Error'
}

//
// input event listeners
//
_via_file_annotator.prototype._rinput_attach_input_handlers = function() {
  this.rinput_canvas.addEventListener('mousedown', this._rinput_mousedown_handler.bind(this));
  this.rinput_canvas.addEventListener('mouseup', this._rinput_mouseup_handler.bind(this));
  this.rinput_canvas.addEventListener('mousemove', this._rinput_mousemove_handler.bind(this));
}

_via_file_annotator.prototype._rinput_remove_input_handlers = function() {
  // @todo
}

_via_file_annotator.prototype._rinput_mousedown_handler = function(e) {
  e.stopPropagation();
  var cx = e.offsetX;
  var cy = e.offsetY;
  console.log('[vid=' + this.vid + ', findex=' + this.findex + ',state=' + this._state_id2str(this.state_id) + '] : mousedown at (cx,cy) = (' + cx + ',' + cy + ')');

  if ( this.state_id === _VIA_RINPUT_STATE.IDLE ) {
    if ( e.shiftkey ) {
      this.user_input_pts.push(cx, cy);
      this._state_set( _VIA_RINPUT_STATE.SELECT_ALL_INSIDE_AN_AREA_ONGOING );
    } else {
      // is this mousedown inside a region?
      this.last_clicked_mid_list = this._is_point_inside_existing_regions(cx, cy);
      if ( this.last_clicked_mid_list.length ) {
        // two possibilities:
        // 1. Draw region inside an existing region
        // 2. Select the region
        this._state_set( _VIA_RINPUT_STATE.REGION_SELECT_OR_DRAW_POSSIBLE );
      } else {
        // draw region
        this.user_input_pts.push(cx, cy);
        this._state_set( _VIA_RINPUT_STATE.REGION_DRAW_ONGOING );
      }
    }
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_DRAW_NCLICK_ONGOING ) {
    if ( this. _rinput_is_near_first_user_input_point(cx, cy) ) {
      // marks the completion of definition of polygon and polyline shape
      var canvas_input_pts = this.user_input_pts.slice(0);
      this._metadata_add(this.va.region_draw_shape, canvas_input_pts);
      this.user_input_pts = [];
      this._tmpreg_clear();
      this._state_set( _VIA_RINPUT_STATE.IDLE );
      _via_util_msg_show( 'Finished drawing shape with multiple vertices.');
    } else {
      this.user_input_pts.push(cx, cy);
    }
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_SELECTED ) {
    return;
  }
}

_via_file_annotator.prototype._rinput_mouseup_handler = function(e) {
  e.stopPropagation();
  var cx = e.offsetX;
  var cy = e.offsetY;
  console.log('[vid=' + this.vid + ', findex=' + this.findex + ',state=' + this._state_id2str(this.state_id) + '] : mouseup at (cx,cy) = (' + cx + ',' + cy + ')');

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_DRAW_ONGOING ) {
    switch ( this.va.region_draw_shape ) {
    case _VIA_RSHAPE.POLYGON:
    case _VIA_RSHAPE.POLYLINE:
      // region shape requiring more than two points (polygon, polyline)
      this._state_set( _VIA_RINPUT_STATE.REGION_DRAW_NCLICK_ONGOING );
      _via_util_msg_show( 'To finish, click at the first vertex.', true);
      break;

    default:
      // region shape requiring just two points (rectangle, circle, ellipse, etc.)
      this.user_input_pts.push(cx, cy);
      var canvas_input_pts = this.user_input_pts.slice(0);
      this._metadata_add(this.va.region_draw_shape, canvas_input_pts);
      this.user_input_pts = [];
      this._tmpreg_clear();
      this._state_set( _VIA_RINPUT_STATE.IDLE );
    }
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_SELECT_OR_DRAW_POSSIBLE ) {
    if ( ! e.shiftKey ) {
      this._creg_select_none();
    }
    this._creg_select_multiple( this.last_clicked_mid_list );
    this._state_set( _VIA_RINPUT_STATE.REGION_SELECTED );
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_UNSELECT_ONGOING ) {
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_MOVE_ONGOING ) {
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_RESIZE_ONGOING ) {
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.SELECT_ALL_INSIDE_AN_AREA_ONGOING ) {
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_SELECT_TOGGLE_ONGOING ) {
    return;
  }
}

_via_file_annotator.prototype._rinput_mousemove_handler = function(e) {
  e.stopPropagation();
  var cx = e.offsetX;
  var cy = e.offsetY;

  var pts = this.user_input_pts.slice(0);
  pts.push(cx, cy);
  if ( this.state_id === _VIA_RINPUT_STATE.REGION_DRAW_ONGOING ||
       this.state_id === _VIA_RINPUT_STATE.REGION_DRAW_NCLICK_ONGOING
     ) {
    this._tmpreg_draw_region(this.va.region_draw_shape, pts);
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_SELECTED ) {
    // iterate through each selected region
    var n = this.selected_mid_list.length;
    var mid, shape_id;
    for ( var i = 0; i < n; ++i ) {
      mid = this.selected_mid_list[i];
      var cp_index = this._creg_is_on_control_point(this.creg[mid],
                                                    cx, cy,
                                                    this.conf.CONTROL_POINT_CLICK_TOL);
      if ( cp_index !== -1 ) {
        shape_id = this.creg[mid][0];
        switch(shape_id) {
        case _VIA_RSHAPE.RECT:
        case _VIA_RSHAPE.CIRCLE:
        case _VIA_RSHAPE.ELLIPSE:
          switch(cp_index) {
          case 1: // top center
          case 3: // bottom center
            this.rinput_canvas.style.cursor = 'row-resize';
            break;
          case 2: // right center
          case 4: // left center
            this.rinput_canvas.style.cursor = 'col-resize';
            break;
          case 5: // corner top-right
          case 7: // corner bottom-left
            this.rinput_canvas.style.cursor = 'nesw-resize';
            break;
          case 6: // corner bottom-right
          case 7: // corner top-left
            this.rinput_canvas.style.cursor = 'nwse-resize';
            break;
          }
          break;
        case _VIA_RSHAPE.POINT:
        case _VIA_RSHAPE.LINE:
        case _VIA_RSHAPE.POLYGON:
        case _VIA_RSHAPE.POLYLINE:
          this.rinput_canvas.style.cursor = 'cell';
          break;
        }
      } else {
        this.rinput_canvas.style.cursor = 'default';
      }
    }
    return;
  }
}

_via_file_annotator.prototype._rinput_pts_canvas_to_file = function(canvas_input_pts) {
  var file_input_pts = canvas_input_pts.slice(0);
  var n = canvas_input_pts.length;
  var x, y;
  for ( var i = 0; i < n; ++i ) {
    file_input_pts[i] = Math.floor( canvas_input_pts[i] * this.cscale );
  }
  return file_input_pts;
}

_via_file_annotator.prototype._rinput_is_near_last_user_input_point = function(cx, cy) {
  var n = this.user_input_pts.length;
  if ( n >= 2 ) {
    var dx = Math.abs(cx - this.user_input_pts[n-2]);
    var dy = Math.abs(cy - this.user_input_pts[n-1]);
    if ( dx <= this.conf.CONTROL_POINT_CLICK_TOL &&
         dy <= this.conf.CONTROL_POINT_CLICK_TOL ) {
      return true;
    }
  }
  return false;
}

_via_file_annotator.prototype._rinput_is_near_first_user_input_point = function(cx, cy) {
  var n = this.user_input_pts.length;
  if ( n >= 2 ) {
    var dx = Math.abs(cx - this.user_input_pts[0]);
    var dy = Math.abs(cy - this.user_input_pts[1]);
    if ( dx <= this.conf.CONTROL_POINT_CLICK_TOL ||
         dy <= this.conf.CONTROL_POINT_CLICK_TOL ) {
      return true;
    }
  }
  return false;
}

//
// user input state
//
_via_file_annotator.prototype._state_set = function(state_id) {
  this.state_id = state_id;
  console.log('[vid=' + this.vid + ', findex=' + this.findex + '] State = ' + this._state_id2str(this.state_id));
}

_via_file_annotator.prototype._state_id2str = function(state_id) {
  for ( var state in _VIA_RINPUT_STATE ) {
    if ( _VIA_RINPUT_STATE[state] === state_id ) {
      return state;
    }
  }
  return '';
}

_via_file_annotator.prototype._state_str2id = function(state) {
  if ( _VIA_RINPUT_STATE.hasOwnProperty(state) ) {
    return _VIA_RINPUT_STATE[state];
  } else {
    return -1;
  }
}

//
// region probes
//
_via_file_annotator.prototype._is_point_inside_existing_regions = function(cx, cy) {
  var mid_list = [];
  for ( var mid in this.creg ) {
    if ( this._creg_is_inside(this.creg[mid],
                              cx,
                              cy,
                              this.conf.CONTROL_POINT_CLICK_TOL) ) {
      mid_list.push(mid);
    }
  }
  return mid_list;
}

_via_file_annotator.prototype._is_point_on_region_edge = function(cx, cy) {
  for ( var mid in this.creg ) {
    if ( this._creg_is_on_edge(this.creg[mid],
                              cx,
                              cy,
                              this.conf.CONTROL_POINT_CLICK_TOL) ) {
      return true;
    }
  }
  return false;
}

_via_file_annotator.prototype._is_point_inside_these_regions = function(mid_list, cx, cy) {
  // @todo
  return false;
}

//
// metadata
//
_via_file_annotator.prototype._metadata_add = function(region_shape, canvas_input_pts) {
  return new Promise( function(ok_callback, err_callback) {
    var file_input_pts = this._rinput_pts_canvas_to_file(canvas_input_pts);
    var xy = this._metadata_pts_to_xy(region_shape, file_input_pts);

    this.d.metadata_add(this.vid, [], xy, {}).then( function(ok) {
      ok_callback(ok.mid);
    }.bind(this), function(err) {
      console.warn(err);
      err_callback();
    }.bind(this));
  }.bind(this));
}

_via_file_annotator.prototype._metadata_xy_to_creg = function(vid, mid) {
  var cxy = this.d.store.view[vid].d[mid].xy.slice(0);
  var n = cxy.length;
  for ( var i = 1; i < n; ++i ) {
    cxy[i] = Math.floor( cxy[i] * this.fscale );
  }
  return cxy;
}

_via_file_annotator.prototype._metadata_pts_to_xy = function(shape_id, pts) {
  var xy = [shape_id];
  switch(shape_id) {
  case _VIA_RSHAPE.POINT:
    xy.push( pts[0], pts[1] );
    break;
  case _VIA_RSHAPE.RECT:
    var d = this._metadata_pts_to_xy_rect(pts);
    xy.push( d[0], d[1], d[2], d[3] );
    break;
  case _VIA_RSHAPE.CIRCLE:
    xy.push( pts[0], pts[1] );
    var dx = pts[2] - pts[0];
    var dy = pts[3] - pts[1];
    var r = Math.sqrt( dx*dx + dy*dy ); // radius
    xy.push(r);
    break;
  case _VIA_RSHAPE.ELLIPSE:
    xy.push( pts[0], pts[1] );
    xy.push( Math.abs(pts[2] - pts[0]) ); // rx
    xy.push( Math.abs(pts[3] - pts[1]) ); // ry
    break;
  case _VIA_RSHAPE.LINE:
    xy.push( pts[0], pts[1], pts[2], pts[3] );
    break;
  case _VIA_RSHAPE.POLYLINE:
  case _VIA_RSHAPE.POLYGON:
    var n = pts.length;
    for ( var i = 0; i < n; ++i ) {
      xy.push( pts[i] );
    }
    break;
  case _VIA_RSHAPE.FILE:
    break;
  }
  return xy;
}

_via_file_annotator.prototype._metadata_pts_to_xy_rect = function(pts) {
  var d = [];
  var x2, y2;
  if ( pts[0] < pts[2] ) {
    d[0] = pts[0];
    x2   = pts[2];
  } else {
    d[0] = pts[2];
    x2   = pts[0];
  }
  if ( pts[1] < pts[3] ) {
    d[1] = pts[1];
    y2   = pts[3];
  } else {
    d[1] = pts[3];
    y2   = pts[1];
  }
  d[2] = x2 - d[0]; // width
  d[3] = y2 - d[1]; // height
  return d;
}

//
// canvas region maintainers
//
_via_file_annotator.prototype._creg_add = function(vid, mid) {
  this.creg[mid] = this._metadata_xy_to_creg(vid, mid);
}

_via_file_annotator.prototype._creg_clear = function() {
  this.rshapectx.clearRect(0, 0, this.rshape_canvas.width, this.rshape_canvas.height);
}

_via_file_annotator.prototype._creg_draw_all = function() {
  this._creg_clear();
  for ( var mid in this.creg ) {
    this._creg_draw(mid);
  }
}

_via_file_annotator.prototype._creg_draw = function(mid) {
  var is_selected = this.selected_mid_list.includes(mid);
  this._draw(this.rshapectx, this.creg[mid], is_selected)
}

_via_file_annotator.prototype._creg_is_inside = function(xy, cx, cy, tolerance) {
  var shape_id = xy[0];
  var is_inside = false;
  switch( shape_id ) {
  case _VIA_RSHAPE.POINT:
    var dx = Math.abs(xy[1] - cx);
    var dy = Math.abs(xy[2] - cy);
    if ( dx <= tolerance || dy <= tolerance ) {
      is_inside = true;
    }
    break;
  case _VIA_RSHAPE.RECT:
    if ( cx > xy[1] && cx < (xy[1] + xy[3]) ) {
      if ( cy > xy[2] && cy < (xy[2] + xy[4]) ) {
        is_inside = true;
      }
    }
    break;
  case _VIA_RSHAPE.CIRCLE:
    var dx = Math.abs(xy[1] - cx);
    var dy = Math.abs(xy[2] - cy);
    if ( ((dx * dx) + (dy * dy)) < xy[3] ) {
      is_inside = true;
    }
    break;
  case _VIA_RSHAPE.ELLIPSE:
    var dx = Math.abs(xy[1] - cx);
    var dy = Math.abs(xy[2] - cy);
    var inv_rx = 1 / xy[3];
    var inv_ry = 1 / xy[4];
    if ( ( ( dx * dx * inv_rx ) + ( dy * dy * inv_ry ) ) < 1 ) {
      is_inside = true;
    }
    break;
  case _VIA_RSHAPE.LINE:
  case _VIA_RSHAPE.POLYGON:
  case _VIA_RSHAPE.POLYLINE:
    var dx = Math.abs(xy[1] - cx);
    var dy = Math.abs(xy[2] - cy);
    if ( dx <= this.conf.FIRST_VERTEX_CLICK_TOL &&
         dy <= this.conf.FIRST_VERTEX_CLICK_TOL ) {
      is_inside = true;
    }
    break;
  default:
    console.warn('_via_file_annotator._draw() : shape_id=' + shape_id + ' not implemented');
  }
  return is_inside;
}

_via_file_annotator.prototype._creg_get_control_points = function(xy) {
  var shape_id = xy[0];
  switch( shape_id ) {
  case _VIA_RSHAPE.POINT:
    return xy;
    break;
  case _VIA_RSHAPE.RECT:
    return [
      shape_id,
      xy[1]+xy[3]/2, xy[2],
      xy[1]+xy[3]  , xy[2]+xy[4]/2,
      xy[1]+xy[3]/2, xy[2]+xy[4],
      xy[1]        , xy[2]+xy[4]/2,
      xy[1]+xy[3]  , xy[2],
      xy[1]+xy[3]  , xy[2]+xy[4],
      xy[1]        , xy[2]+xy[4],
      xy[1]        , xy[2],
    ];
    break;
  case _VIA_RSHAPE.CIRCLE:
    return [
      shape_id,
      xy[1]        , xy[2] - xy[3],
      xy[1] + xy[3], xy[2],
    ]
    break;
  case _VIA_RSHAPE.ELLIPSE:
    return [
      shape_id,
      xy[1]        , xy[2] - xy[4],
      xy[1] + xy[3], xy[2],
    ]
    break;
  case _VIA_RSHAPE.LINE:
  case _VIA_RSHAPE.POLYGON:
  case _VIA_RSHAPE.POLYLINE:
    return xy;
    break;
  }
  return [];
}

_via_file_annotator.prototype._creg_is_near_a_point = function(px, py, x, y, tolerance) {
  var dx = Math.abs(x - px);
  var dy = Math.abs(y - py);
  if ( dx <= tolerance && dy <= tolerance ) {
    return true;
  } else {
    return false;
  }
}

_via_file_annotator.prototype._creg_is_on_control_point = function(xy, cx, cy, tolerance) {
  var cp = this._creg_get_control_points(xy); // cp[0] = shape_id
  var n = cp.length;
  for ( var i = 1; i < n; i = i + 2 ) {
    if ( this._creg_is_near_a_point(cp[i], cp[i+1], cx, cy, tolerance) ) {
      return (i+1)/2; // to convert xy index to control point index
    }
  }
  return -1;
}

_via_file_annotator.prototype._creg_select_one = function(mid) {
  this.selected_mid_list = [mid];
  this._creg_draw_all();
}

_via_file_annotator.prototype._creg_select = function(mid) {
  this.selected_mid_list.push(mid);
  this._creg_draw(mid);
}
_via_file_annotator.prototype._creg_select_multiple = function(mid_list) {
  var n = mid_list.length;
  if ( n > 0 ) {
    for ( var i = 0; i < n; ++i ) {
      this.selected_mid_list.push( mid_list[i] );
    }
    this._creg_draw_all();
  }
}

_via_file_annotator.prototype._creg_select_none = function() {
  this.selected_mid_list = [];
  this._creg_draw_all();
}

_via_file_annotator.prototype._creg_select_all = function() {
  this.selected_mid_list = Object.keys(this.creg);
  this._creg_draw_all();
}

//
// external event listener
//
_via_file_annotator.prototype._on_event_metadata_add = function(data, event_payload) {
  console.log('[vid=' + this.vid + ', findex=' + this.findex + ',state=' + this._state_id2str(this.state_id) + '] : _on_event_metadata_add');
  var vid = event_payload.vid;
  var mid = event_payload.mid;
  this._creg_add(vid, mid);
  this._creg_draw_all();
}

//
// temp. regions
//
_via_file_annotator.prototype._tmpreg_draw_region = function(shape_id, pts) {
  var xy = this._metadata_pts_to_xy(shape_id, pts);
  this._tmpreg_clear();
  this._draw(this.rinputctx, xy);
}

_via_file_annotator.prototype._tmpreg_clear = function() {
  this.rinputctx.clearRect(0, 0, this.rinput_canvas.width, this.rinput_canvas.height);
}

//
// region draw routines
//
// Note: xy = [shape_id, x0, y0, x1, y1, ..., xk, yk]
_via_file_annotator.prototype._draw = function(ctx, xy, is_selected) {
  var shape_id = xy[0];
  switch( shape_id ) {
  case _VIA_RSHAPE.POINT:
    this._draw_point_region(ctx, xy[1], xy[2], is_selected );
    break;
  case _VIA_RSHAPE.RECT:
    this._draw_rect_region(ctx, xy[1], xy[2], xy[3], xy[4], is_selected );
    break;
  case _VIA_RSHAPE.CIRCLE:
    this._draw_circle_region(ctx, xy[1], xy[2], xy[3], is_selected );
    break;
  case _VIA_RSHAPE.ELLIPSE:
    this._draw_ellipse_region(ctx, xy[1], xy[2], xy[3], xy[4], is_selected );
    break;
  case _VIA_RSHAPE.LINE:
  case _VIA_RSHAPE.POLYGON:
  case _VIA_RSHAPE.POLYLINE:
    this._draw_polygon_region(ctx, xy, is_selected, shape_id);
    break;
  default:
    console.warn('_via_file_annotator._draw() : shape_id=' + shape_id + ' not implemented');
  }

  if ( is_selected ) {
    var cp = this._creg_get_control_points(xy); // cp[0] = shape_id
    var n = cp.length;
    for ( var i = 1; i < n; i = i + 2 ) {
      this._draw_control_point(ctx, cp[i], cp[i+1]);
    }
  }
}

_via_file_annotator.prototype._draw_point_region = function(ctx, cx, cy, is_selected) {
  if ( is_selected ) {
    ctx.strokeStyle = this.conf.SEL_REGION_BOUNDARY_COLOR;
    ctx.lineWidth   = this.conf.SEL_REGION_LINE_WIDTH;
    this._draw_point(ctx, cx, cy);
    ctx.stroke();

    ctx.fillStyle   = this.conf.SEL_REGION_FILL_COLOR;
    ctx.globalAlpha = this.conf.SEL_REGION_FILL_OPACITY;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  } else {
    ctx.strokeStyle = this.conf.REGION_BOUNDARY_COLOR;
    ctx.lineWidth   = this.conf.REGION_LINE_WIDTH;
    this._draw_point(ctx, cx, cy);
    ctx.stroke();
  }
}

_via_file_annotator.prototype._draw_point = function(ctx, cx, cy) {
  ctx.beginPath();
  ctx.arc(cx, cy, this.conf.REGION_POINT_RADIUS, 0, 2*Math.PI, false);
  ctx.closePath();
}

_via_file_annotator.prototype._draw_rect_region = function(ctx, x, y, w, h, is_selected) {
  if (is_selected) {
    ctx.strokeStyle = this.conf.SEL_REGION_BOUNDARY_COLOR;
    ctx.lineWidth   = this.conf.SEL_REGION_LINE_WIDTH;
    this._draw_rect(ctx, x, y, w, h);
    ctx.stroke();

    ctx.fillStyle   = this.conf.SEL_REGION_FILL_COLOR;
    ctx.globalAlpha = this.conf.SEL_REGION_FILL_OPACITY;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  } else {
    ctx.strokeStyle = this.conf.REGION_BOUNDARY_COLOR;
    ctx.lineWidth   = this.conf.REGION_LINE_WIDTH;
    this._draw_rect(ctx, x, y, w, h);
    ctx.stroke();
  }
}

_via_file_annotator.prototype._draw_rect = function(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x  , y);
  ctx.lineTo(x+w, y);
  ctx.lineTo(x+w, y+h);
  ctx.lineTo(x  , y+h);
  ctx.closePath();
}

_via_file_annotator.prototype._draw_circle_region = function(ctx, cx, cy, r, is_selected) {
  if (is_selected) {
    ctx.strokeStyle = this.conf.SEL_REGION_BOUNDARY_COLOR;
    ctx.lineWidth   = this.conf.SEL_REGION_LINE_WIDTH;
    this._draw_circle(ctx, cx, cy, r);
    ctx.stroke();

    ctx.fillStyle   = this.conf.SEL_REGION_FILL_COLOR;
    ctx.globalAlpha = this.conf.SEL_REGION_FILL_OPACITY;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    _via_draw_control_point(cx + r, cy);
  } else {
    ctx.strokeStyle = this.conf.REGION_BOUNDARY_COLOR;
    ctx.lineWidth   = this.conf.REGION_LINE_WIDTH;
    this._draw_circle(ctx, cx, cy, r);
    ctx.stroke();
  }
}

_via_file_annotator.prototype._draw_circle = function(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2*Math.PI, false);
  ctx.closePath();
}

_via_file_annotator.prototype._draw_ellipse_region = function(ctx, cx, cy, rx, ry, is_selected) {
  if (is_selected) {
    ctx.strokeStyle = this.conf.SEL_REGION_BOUNDARY_COLOR;
    ctx.lineWidth   = this.conf.SEL_REGION_LINE_WIDTH;
    this._draw_ellipse(ctx, cx, cy, rx, ry);
    ctx.stroke();

    ctx.fillStyle   = this.conf.SEL_REGION_FILL_COLOR;
    ctx.globalAlpha = this.conf.SEL_REGION_FILL_OPACITY;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  } else {
    ctx.strokeStyle = this.conf.REGION_BOUNDARY_COLOR;
    ctx.lineWidth   = this.conf.REGION_LINE_WIDTH;
    this._draw_ellipse(ctx, cx, cy, rx, ry);
    ctx.stroke();
  }
}

_via_file_annotator.prototype._draw_ellipse = function(ctx, cx, cy, rx, ry) {
  ctx.save();
  ctx.beginPath();
  ctx.translate(cx-rx, cy-ry);
  ctx.scale(rx, ry);
  ctx.arc(1, 1, 1, 0, 2 * Math.PI, false);
  ctx.restore(); // restore to original state
  ctx.closePath();
}

_via_file_annotator.prototype._draw_polygon_region = function(ctx, pts, is_selected, shape_id) {
  if ( is_selected ) {
    ctx.strokeStyle = this.conf.SEL_REGION_BOUNDARY_COLOR;
    ctx.lineWidth   = this.conf.SEL_REGION_LINE_WIDTH;
    this._draw_polygon(ctx, pts);
    if ( shape_id === _VIA_RSHAPE.POLYGON ) {
      ctx.closePath();
    }
    ctx.stroke();

    ctx.fillStyle   = this.conf.SEL_REGION_FILL_COLOR;
    ctx.globalAlpha = this.conf.SEL_REGION_FILL_OPACITY;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  } else {
    ctx.strokeStyle = this.conf.REGION_BOUNDARY_COLOR;
    ctx.lineWidth   = this.conf.REGION_LINE_WIDTH;
    this._draw_polygon(ctx, pts);
    if ( shape_id === _VIA_RSHAPE.POLYGON ) {
      ctx.closePath();
    }
    ctx.stroke();

    // draw a control box around first point
    ctx.strokeStyle = this.conf.FIRST_VERTEX_BOUNDARY_COLOR;
    ctx.fillStyle = this.conf.FIRST_VERTEX_FILL_COLOR;
    ctx.lineWidth   = this.conf.FIRST_VERTEX_BOUNDARY_WIDTH;
    this._draw_rect(ctx,
                    pts[1] - this.conf.FIRST_VERTEX_CLICK_TOL,
                    pts[2] - this.conf.FIRST_VERTEX_CLICK_TOL,
                    2*this.conf.FIRST_VERTEX_CLICK_TOL,
                    2*this.conf.FIRST_VERTEX_CLICK_TOL);
    ctx.stroke();
    ctx.fill();
  }
}

// note: pts[0] should contain shape-id
_via_file_annotator.prototype._draw_polygon = function(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[1], pts[2]);
  var n = pts.length;
  for ( var i = 3; i < n; i = i + 2 ) {
    ctx.lineTo(pts[i], pts[i+1]);
  }
}

// control point for resize of region boundaries
_via_file_annotator.prototype._draw_control_point = function(ctx, cx, cy) {
  ctx.beginPath();
  ctx.arc(cx, cy, this.conf.CONTROL_POINT_RADIUS, 0, 2*Math.PI, false);
  ctx.closePath();

  ctx.fillStyle = this.conf.CONTROL_POINT_COLOR;
  ctx.globalAlpha = 1.0;
  ctx.fill();
}
