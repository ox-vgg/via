/**
 * @class
 * @classdesc Manages region draw and view operations on an image or video
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 8 Apr. 2019
 */

'use strict';

var _VIA_RINPUT_STATE = {
  UNKNOWN: 0,
  SUSPEND: 1,
  IDLE: 2,
  REGION_SELECTED: 3,
  REGION_SELECT_OR_DRAW_POSSIBLE: 4,
  SELECT_ALL_INSIDE_AN_AREA_ONGOING: 5,
  REGION_UNSELECT_ONGOING: 6,
  REGION_SELECT_TOGGLE_ONGOING: 7,
  REGION_MOVE_ONGOING: 8,
  REGION_RESIZE_ONGOING: 9,
  REGION_DRAW_ONGOING: 10,
  REGION_DRAW_NCLICK_ONGOING: 11,
};

function _via_file_annotator(view_annotator, data, vid, file_label, container) {
  this.va = view_annotator;
  this.d = data;
  this.vid = vid;
  this.file_label = file_label;
  this.c = container;

  // state variables
  this.state_id = this._state_set(_VIA_RINPUT_STATE.UNKNOWN);
  this.user_input_pts = []; // [x0, y0, x1, y1, ..., xk, yk]
  this.last_clicked_mid_list = [];
  this.resize_control_point_index = -1;
  this.resize_selected_mid_index = -1;

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
  this.conf.REGION_SMETADATA_MARGIN = 4; // in pixel

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_file_annotator_';
  _via_event.call( this );

  // register event listeners
  this.d.on_event('metadata_add', this._on_event_metadata_add.bind(this));
  this.d.on_event('metadata_update', this._on_event_metadata_update.bind(this));
  this.d.on_event('view_update', this._on_event_view_update.bind(this));

  this._init();
}

_via_file_annotator.prototype._init = function() {
  if ( this.d.store.view[this.vid].fid_list.length !== 1 ) {
    console.warn('_via_file_annotator() can only operate on a single file!');
    return;
  }

  this.fid = this.d.store.view[this.vid].fid_list[0];
  this.file = this.d.store.file[this.fid];
}

_via_file_annotator.prototype._file_load = function() {
  return new Promise( function(ok_callback, err_callback) {
    this._file_read().then( function(file_src) {
      this.file_html_element = this._file_create_html_element(this.file);
      this.file_html_element.setAttribute('title', this.file.fname);
      this.file_html_element.setAttribute('src', file_src);

      this.file_html_element.addEventListener('load', function() {
        this._destroy_file_object_url();
        this._file_html_element_ready();
        ok_callback();
      }.bind(this));
      this.file_html_element.addEventListener('loadeddata', function() {
        this._destroy_file_object_url();
        this._file_html_element_ready();
        ok_callback();
      }.bind(this));
      this.file_html_element.addEventListener('abort', function(e) {
        _via_util_msg_show('Failed to load file [' + this.file.fname + '] (' + e + ')' );
        err_callback();
      }.bind(this));
      this.file_html_element.addEventListener('stalled', function(e) {
        _via_util_msg_show('Failed to load file [' + this.file.fname + '] (' + e + ')' );
        err_callback();
      }.bind(this));
      this.file_html_element.addEventListener('error', function(e) {
        _via_util_msg_show('Failed to load file [' + this.file.fname + '] (' + e + ')' );
        err_callback();
      }.bind(this));
    }.bind(this), function(err) {
      console.warn('Failed to read file: ' + this.file);
      console.log(err);
      err_callback();
    }.bind(this));
  }.bind(this));
}

_via_file_annotator.prototype._file_create_html_element = function(file) {
  var media;
  switch( file.type ) {
  case _VIA_FILE_TYPE.VIDEO:
    media = document.createElement('video');
    media.setAttribute('controls', 'true');
    media.setAttribute('playsinline', 'true');
    media.setAttribute('loop', 'false');
    // @todo : add subtitle track for video
    media.setAttribute('preload', 'auto');
    media.addEventListener('pause', function(e) {
      this._creg_show_current_frame_regions();
      this._rinput_enable();
    }.bind(this));
    media.addEventListener('play', function(e) {
      this._creg_clear();
      this._rinput_disable();
    }.bind(this));
    media.addEventListener('seeked', function(e) {
      this._creg_show_current_frame_regions();
      this._rinput_enable();
    }.bind(this));


    //media.addEventListener('suspend', this._file_html_element_error.bind(this));
    break;

  case _VIA_FILE_TYPE.IMAGE:
    media = document.createElement('img');
    break;

  case _VIA_FILE_TYPE.AUDIO:
    media = document.createElement('audio');
    media.setAttribute('controls', '');
    // @todo : add subtitle track for video
    media.setAttribute('preload', 'auto');
    break;

  default:
    console.warn('unknown file type = ' + this.file.type);
  }
  return media;
}

_via_file_annotator.prototype._file_read = function() {
  return new Promise( function(ok_callback, err_callback) {
    if ( this.file.src instanceof File ) {
      // we keep a reference of file object URL so that we can revoke it when not needed
      // WARNING: ensure that this._destroy_file_object_url() gets called when "this" not needed
      this.file_object_url = URL.createObjectURL(this.file.src);
      ok_callback(this.file_object_url);

    } else {
      if ( this.file.loc === _VIA_FILE_LOC.LOCAL ) {
        ok_callback( this.d.store.config.file.path + this.file.src ); // read local file
      } else {
        ok_callback( this.file.src ); // read remote file
      }
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

  case _VIA_FILE_TYPE.AUDIO:
    this.left_pad = 0;
    this.file_html_element_size_css = '';
    return;
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
  this.fscale = 1 / this.cscale; // cx = fscale * x
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
  _via_util_msg_show('Loaded file [' + this.file.fname + ']' );
  this._file_html_element_compute_scale();
  this.file_html_element.setAttribute('style', this.file_html_element_size_css);
  this.file_html_element.setAttribute('id', 'file_content');
  this.c.appendChild(this.file_html_element);

  // add canvas for region shape
  this.rshape_canvas = document.createElement('canvas');
  this.rshape_canvas.setAttribute('style', this.file_html_element_size_css);
  this.rshape_canvas.setAttribute('id', 'region_shape');
  this.rshape_canvas.style.pointerEvents = 'none';
  this.rshape_canvas.width = this.cwidth;
  this.rshape_canvas.height = this.cheight;
  this.rshapectx = this.rshape_canvas.getContext('2d', { alpha:true });
  this.c.appendChild(this.rshape_canvas);

  this.tempr_canvas = document.createElement('canvas');
  this.tempr_canvas.setAttribute('style', this.file_html_element_size_css);
  this.tempr_canvas.setAttribute('id', 'region_input');
  this.tempr_canvas.style.pointerEvents = 'none';
  this.tempr_canvas.width = this.cwidth;
  this.tempr_canvas.height = this.cheight;
  this.temprctx = this.tempr_canvas.getContext('2d', { alpha:true });
  this.c.appendChild(this.tempr_canvas);

  this.input = document.createElement('div');
  this.input.setAttribute('style', this.file_html_element_size_css);
  this.input.setAttribute('id', 'input');
  this.input.style.pointerEvents = 'none';
  this._rinput_attach_input_handlers(this.input);
  this.c.appendChild(this.input);

  this.smetadata_container = document.createElement('div');
  this.smetadata_container.setAttribute('class', 'smetadata_container');
  this.smetadata_container.classList.add('hide');
  this.smetadata_container.setAttribute('id', 'smetadata_container');
  this.smetadata_container.innerHTML = 'Spatial Metadata Editor @todo';
  this.c.appendChild(this.smetadata_container);

  // draw all existing regions
  this._creg_clear();

  this._state_set(_VIA_RINPUT_STATE.IDLE);
}

//
// input event listeners
//
_via_file_annotator.prototype._rinput_attach_input_handlers = function(container) {
  container.addEventListener('mousedown', this._rinput_mousedown_handler.bind(this));
  container.addEventListener('mouseup', this._rinput_mouseup_handler.bind(this));
  container.addEventListener('mousemove', this._rinput_mousemove_handler.bind(this));

  container.addEventListener('keydown', this._rinput_keydown_handler.bind(this));
}

_via_file_annotator.prototype._rinput_remove_input_handlers = function() {
  // @todo
}

_via_file_annotator.prototype._rinput_keydown_handler = function(e) {
  console.log(e.key)
  if ( e.key === 'Backspace' ) {
    e.preventDefault();
    if ( this.selected_mid_list.length ) {
      this._creg_del_sel_regions();
      _via_util_msg_show('Deleted selected regions.');
    } else {
      _via_util_msg_show('Select a region to delete it.');
    }
    return;
  }

  if ( e.key === 'a' ) {
    e.preventDefault();
    if ( e.ctrlKey ) {
      this._creg_select_all();
      _via_util_msg_show('Selected all regions.');
    }
  }
}

_via_file_annotator.prototype._rinput_mousedown_handler = function(e) {
  e.stopPropagation();
  var cx = e.offsetX;
  var cy = e.offsetY;
  console.log('[vid=' + this.vid + ', state=' + this._state_id2str(this.state_id) + '] : mousedown at (cx,cy) = (' + cx + ',' + cy + ')');

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
    var sel_region_cp = this._creg_is_on_sel_region_cp(cx, cy,
                                                       this.conf.CONTROL_POINT_CLICK_TOL);
    if ( sel_region_cp[0] !== -1 ) {
      // mousedown was on control point of one of the selected regions
      this.resize_selected_mid_index = sel_region_cp[0];
      this.resize_control_point_index = sel_region_cp[1];
      this._state_set( _VIA_RINPUT_STATE.REGION_RESIZE_ONGOING );
    } else {
      // mousedown was not on a control point, two possibilities:
      // - inside an already selected region
      // - outside a selected region
      //   * inside another unselected region
      //   * outside any region
      var mid_list = this._is_point_inside_existing_regions(cx, cy);
      if ( e.shiftKey ) { // used to select multiple regions or unselect one of existing regions
        if ( mid_list.length === 0 ) {
          // outside a region, hence it could be to select regions inside a user drawn area
          this.user_input_pts.push(cx, cy);
          this._state_set( _VIA_RINPUT_STATE.SELECT_ALL_INSIDE_AN_AREA_ONGOING );
        } else {
          // inside a region, hence toggle selection
          this.last_clicked_mid_list = mid_list;
          this._state_set( _VIA_RINPUT_STATE.REGION_SELECT_TOGGLE_ONGOING );
        }
      } else {
        if ( mid_list.length === 0 ) {
          this._state_set( _VIA_RINPUT_STATE.REGION_UNSELECT_ONGOING );
        } else {
          var sel_mindex = this._is_point_inside_sel_regions(cx, cy);
          if ( sel_mindex === -1 ) {
            this.last_clicked_mid_list = mid_list;
            this._state_set( _VIA_RINPUT_STATE.REGION_SELECT_OR_DRAW_POSSIBLE );
          } else {
            this.user_input_pts.push(cx, cy);
            this._state_set( _VIA_RINPUT_STATE.REGION_MOVE_ONGOING );
          }
        }
      }
    }
    return;
  }
}

_via_file_annotator.prototype._rinput_mouseup_handler = function(e) {
  e.stopPropagation();
  var cx = e.offsetX;
  var cy = e.offsetY;
  console.log('[vid=' + this.vid + ', state=' + this._state_id2str(this.state_id) + '] : mouseup at (cx,cy) = (' + cx + ',' + cy + ')');

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
      if ( this._is_user_input_pts_equal() ) {
        if ( this.va.region_draw_shape !== _VIA_RSHAPE.POINT ) {
          _via_util_msg_show('Discarded degenerate region. Press <span class="key">Space</span> key to play or pause video.');
        } else {
          var canvas_input_pts = this.user_input_pts.slice(0);
          this._metadata_add(this.va.region_draw_shape, canvas_input_pts);
        }
      } else {
        var canvas_input_pts = this.user_input_pts.slice(0);
        this._metadata_add(this.va.region_draw_shape, canvas_input_pts);
      }
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

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_MOVE_ONGOING ) {
    this.user_input_pts.push(cx, cy);
    var canvas_input_pts = this.user_input_pts.slice(0);
    var cdx = canvas_input_pts[2] - canvas_input_pts[0];
    var cdy = canvas_input_pts[3] - canvas_input_pts[1];
    var mid_list = this.selected_mid_list.slice(0);
    this._metadata_move_region(mid_list, cdx, cdy);
    this._tmpreg_clear();
    this.user_input_pts = [];
    this._state_set( _VIA_RINPUT_STATE.REGION_SELECTED );
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_RESIZE_ONGOING ) {
    this._metadata_resize_region(this.resize_selected_mid_index,
                                 this.resize_control_point_index,
                                 cx, cy);
    this._tmpreg_clear();
    this.user_input_pts = [];
    this._state_set( _VIA_RINPUT_STATE.REGION_SELECTED );
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_UNSELECT_ONGOING ) {
    this._creg_select_none();
    this.user_input_pts = [];
    this._state_set( _VIA_RINPUT_STATE.IDLE );
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.SELECT_ALL_INSIDE_AN_AREA_ONGOING ) {
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_SELECT_TOGGLE_ONGOING ) {
    if ( ! e.shiftKey ) {
      this._creg_select_none();
    }
    this._creg_select_toggle( this.last_clicked_mid_list );
    this._state_set( _VIA_RINPUT_STATE.REGION_SELECTED );
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
    var sel_region_cp = this._creg_is_on_sel_region_cp(cx, cy,
                                                       this.conf.CONTROL_POINT_CLICK_TOL);

    if ( sel_region_cp[0] !== -1 && sel_region_cp[1] !== -1 ) {
      var mindex = sel_region_cp[0];
      var mid = this.selected_mid_list[mindex];
      var cp_index = sel_region_cp[1];
      var shape_id = this.creg[mid][0];

      switch(shape_id) {
      case _VIA_RSHAPE.RECT:
      case _VIA_RSHAPE.CIRCLE:
      case _VIA_RSHAPE.ELLIPSE:
        switch(cp_index) {
        case 1: // top center
        case 3: // bottom center
          this.input.style.cursor = 'row-resize';
          break;
        case 2: // right center
        case 4: // left center
          this.input.style.cursor = 'col-resize';
          break;
        case 5: // corner top-right
        case 7: // corner bottom-left
          this.input.style.cursor = 'nesw-resize';
          break;
        case 6: // corner bottom-right
        case 8: // corner top-left
          this.input.style.cursor = 'nwse-resize';
          break;
        }
        break;
      case _VIA_RSHAPE.POINT:
      case _VIA_RSHAPE.LINE:
      case _VIA_RSHAPE.POLYGON:
      case _VIA_RSHAPE.POLYLINE:
        this.input.style.cursor = 'cell';
        break;
      }
    } else {
      this.input.style.cursor = 'default';
    }
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_MOVE_ONGOING ) {
    this._tmpreg_clear();
    var dx = cx - this.user_input_pts[0];
    var dy = cy - this.user_input_pts[1];
    this._tmpreg_move_sel_regions(dx, dy);
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_RESIZE_ONGOING ) {
    this._tmpreg_clear();
    this._tmpreg_move_sel_region_cp(this.resize_selected_mid_index,
                                 this.resize_control_point_index,
                                 cx, cy);
    return;
  }
}

_via_file_annotator.prototype._rinput_pts_canvas_to_file = function(canvas_input_pts) {
  var file_input_pts = canvas_input_pts.slice(0);
  var n = canvas_input_pts.length;
  var x, y;
  for ( var i = 0; i < n; ++i ) {
    file_input_pts[i] = parseFloat((canvas_input_pts[i] * this.cscale).toFixed(3));
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
  //console.log('[vid=' + this.vid + '] State = ' + this._state_id2str(this.state_id));
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
_via_file_annotator.prototype._is_user_input_pts_equal = function() {
  var n = this.user_input_pts.length;
  if ( n >= 4 ) {
    if ( this.user_input_pts[0] === this.user_input_pts[2] &&
         this.user_input_pts[1] === this.user_input_pts[3]
       ) {
      return true;
    }
  }
  return false;
}

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

_via_file_annotator.prototype._is_point_inside_sel_regions = function(cx, cy) {
  var mid, mindex;
  for ( mindex in this.selected_mid_list ) {
    mid = this.selected_mid_list[mindex];
    if ( this._creg_is_inside(this.creg[mid],
                              cx,
                              cy,
                              this.conf.CONTROL_POINT_CLICK_TOL) ) {
      return mindex;
    }
  }
  return -1;
}

//
// metadata
//
_via_file_annotator.prototype._metadata_resize_region = function(mindex, cpindex, cx, cy) {
  return new Promise( function(ok_callback, err_callback) {
    var mid = this.selected_mid_list[mindex];
    var x = cx * this.cscale;
    var y = cy * this.cscale;
    var moved_xy = this._creg_move_control_point(this.d.store.metadata[mid].xy,
                                                 cpindex, x, y);
    this.d.metadata_update_xy(this.vid, mid, moved_xy).then( function(ok) {
      this._creg_draw_all();
      ok_callback(ok.mid);
    }.bind(this), function(err) {
      console.warn(err);
      err_callback();
    }.bind(this));
  }.bind(this));
}

_via_file_annotator.prototype._metadata_move_region = function(mid_list, cdx, cdy) {
  return new Promise( function(ok_callback, err_callback) {
    var mid, shape_id;
    var dx = cdx * this.cscale;
    var dy = cdy * this.cscale;
    var promise_list = [];
    var n = mid_list.length;
    for ( var i = 0; i < n; ++i ) {
      mid = mid_list[i];
      var new_xy  = this._metadata_move_xy(this.d.store.metadata[mid].xy, dx, dy);
      promise_list.push( this.d.metadata_update_xy(this.vid, mid, new_xy) );
    }

    Promise.all( promise_list ).then( function(ok) {
      this._creg_draw_all();
      ok_callback();
    }.bind(this), function(err) {
      console.log(err)
      err_callback();
    }.bind(this));
  }.bind(this));
}

_via_file_annotator.prototype._metadata_add = function(region_shape, canvas_input_pts) {
  return new Promise( function(ok_callback, err_callback) {
    var file_input_pts = this._rinput_pts_canvas_to_file(canvas_input_pts);
    var xy = this._metadata_pts_to_xy(region_shape, file_input_pts);
    var z = [];
    if ( this.file.type === _VIA_FILE_TYPE.VIDEO ) {
      z = _via_util_float_to_fixed(this.file_html_element.currentTime, 3);
    }
    this.d.metadata_add(this.vid, z, xy, {}).then( function(ok) {
      console.log('z=' + this.d.store.metadata[ok.mid].z + ', xy=' + this.d.store.metadata[ok.mid].xy)
      this._creg_add(this.vid, ok.mid);
      this._creg_draw(ok.mid);
      ok_callback(ok.mid);
    }.bind(this), function(err) {
      console.warn(err);
      err_callback();
    }.bind(this));
  }.bind(this));
}

_via_file_annotator.prototype._metadata_xy_to_creg = function(vid, mid) {
  var cxy = this.d.store.metadata[mid].xy.slice(0);
  var n = cxy.length;
  for ( var i = 1; i < n; ++i ) {
    cxy[i] = this.d.store.metadata[mid].xy[i] * this.fscale;
  }
  return cxy;
}

_via_file_annotator.prototype._metadata_move_xy = function(xy0, dx, dy) {
  var xy = xy0.slice(0);
  var shape_id = xy[0];
  switch(shape_id) {
  case _VIA_RSHAPE.POINT:
  case _VIA_RSHAPE.RECT:
  case _VIA_RSHAPE.CIRCLE:
  case _VIA_RSHAPE.ELLIPSE:
    xy[1] = xy[1] + dx;
    xy[2] = xy[2] + dy;
    break;
  case _VIA_RSHAPE.LINE:
  case _VIA_RSHAPE.POLYLINE:
  case _VIA_RSHAPE.POLYGON:
    var n = xy.length;
    for ( var i = 1; i < n; i = i+2 ) {
      xy[i]   = xy[i]   + dx;
      xy[i+1] = xy[i+1] + dy;
    }
    break;
  case _VIA_RSHAPE.FILE:
    break;
  }
  return xy;
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
_via_file_annotator.prototype._on_event_edit_current_frame_regions = function(data, event_payload) {
  this._creg_show_current_frame_regions();
}

_via_file_annotator.prototype._on_event_edit_frame_regions = function(data, event_payload) {
  this.creg = {};
  var mid;
  for ( var mindex in event_payload.mid_list ) {
    mid = event_payload.mid_list[mindex];
    this.creg[mid] = this._metadata_xy_to_creg(this.vid, mid);
  }
  this._creg_draw_all();
}

_via_file_annotator.prototype._creg_show_current_frame_regions = function() {
  this._creg_add_current_frame_regions(this.vid);
  this._creg_draw_all();
}

_via_file_annotator.prototype._creg_add_current_frame_regions = function(vid) {
  this.creg = {};
  if ( ! this.file_html_element.paused ) {
    return;
  }
  var t = this.file_html_element.currentTime;
  var mid;
  for ( var mindex in this.d.cache.mid_list[vid] ) {
    mid = this.d.cache.mid_list[vid][mindex];
    if ( this.d.store.metadata[mid].z.length === 1 &&
         this.d.store.metadata[mid].xy.length !== 0
       ) {
      if ( Math.abs(this.d.store.metadata[mid].z[0] - t) < 0.1 ) {
        this.creg[mid] = this._metadata_xy_to_creg(vid, mid);
      }
    }
  }
}

_via_file_annotator.prototype._creg_add = function(vid, mid) {
  this.creg[mid] = this._metadata_xy_to_creg(vid, mid);
}

_via_file_annotator.prototype._creg_clear = function() {
  this.rshapectx.clearRect(0, 0, this.rshape_canvas.width, this.rshape_canvas.height);
  this._smetadata_hide();
}

_via_file_annotator.prototype._creg_draw_all = function() {
  this._creg_clear();
  for ( var mid in this.creg ) {
    this._creg_draw(mid);
  }

  // add file label (if any)
  if ( this.file_label.length !== 0 ) {
    this.rshapectx.fillStyle = 'yellow';
    this.rshapectx.font = '16px mono';
    var label_width = this.rshapectx.measureText(this.file_label).width;
    this.rshapectx.fillText(this.file_label, this.rshape_canvas.width/2 - label_width/2, 20);
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
    var inv_rx2 = 1 / ( xy[3] * xy[3] );
    var inv_ry2 = 1 / ( xy[4] * xy[4] );
    if ( ( ( dx * dx * inv_rx2 ) + ( dy * dy * inv_ry2 ) ) < 1 ) {
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
    } else {
      if ( this._creg_is_inside_polygon(xy, cx, cy) !== 0 ) {
        is_inside = true;
      }
    }
    break;
  default:
    console.warn('_via_file_annotator._draw() : shape_id=' + shape_id + ' not implemented');
  }
  return is_inside;
}

// returns 0 when (px,py) is outside the polygon
// source: http://geomalgorithms.com/a03-_inclusion.html
_via_file_annotator.prototype._creg_is_inside_polygon = function (xy_pts, px, py) {
  var xy = xy_pts.slice(0);
  if ( xy.length === 0 || xy.length === 1 ) {
    return 0;
  }
  xy.push(xy[1], xy[2]); // close the loop

  var wn = 0;    // the  winding number counter
  // loop through all edges of the polygon
  for ( var i = 1; i < xy.length; i = i + 2 ) {   // edge from V[i] to  V[i+1]
    var is_left_value = this._creg_is_left( xy[i], xy[i+1],
                                            xy[i+2], xy[i+3],
                                            px, py);

    if (xy[i + 1] <= py) {
      if (xy[i+3]  > py && is_left_value > 0) {
        ++wn;
      }
    }
    else {
      if (xy[i+3]  <= py && is_left_value < 0) {
        --wn;
      }
    }
  }
  if ( wn === 0 ) {
    return 0;
  }
  else {
    return 1;
  }
}

// >0 if (x2,y2) lies on the left side of line joining (x0,y0) and (x1,y1)
// =0 if (x2,y2) lies on the line joining (x0,y0) and (x1,y1)
// >0 if (x2,y2) lies on the right side of line joining (x0,y0) and (x1,y1)
 // source: http://geomalgorithms.com/a03-_inclusion.html
_via_file_annotator.prototype._creg_is_left = function (x0, y0, x1, y1, x2, y2) {
  return ( ((x1 - x0) * (y2 - y0))  - ((x2 -  x0) * (y1 - y0)) );
}

_via_file_annotator.prototype._creg_move_control_point = function(xy0, cpindex, new_x, new_y) {
  var xy = xy0.slice(0);
  var shape_id = xy[0];
  switch( shape_id ) {
  case _VIA_RSHAPE.POINT:
    break;
  case _VIA_RSHAPE.RECT:
    switch(cpindex) {
    case 1:
      xy[2] = new_y;
      xy[4] = xy0[4] + xy0[2] - new_y;
      break;
    case 2:
      xy[3] = new_x - xy0[1];
      break;
    case 3:
      xy[4] = new_y - xy0[2];
      break;
    case 4:
      xy[1] = new_x;
      xy[3] = xy0[3] + xy0[1] - new_x;
      break;
    case 5:
      xy[2] = new_y;
      xy[3] = new_x - xy0[1];
      xy[4] = xy0[4] + xy0[2] - new_y;
      break;
    case 6:
      xy[3] = new_x - xy0[1];
      xy[4] = new_y - xy0[2];
      break;
    case 7:
      xy[1] = new_x;
      xy[3] = xy0[3] + xy0[1] - new_x;
      xy[4] = new_y - xy0[2];
      break;
    case 8:
      xy[3] = xy0[3] + xy0[1] - new_x;
      xy[4] = xy0[4] + xy0[2] - new_y;
      xy[1] = new_x;
      xy[2] = new_y;
      break;
    }
    break;
  case _VIA_RSHAPE.CIRCLE:
    var new_dx = new_x - xy0[1];
    var new_dy = new_y - xy0[2];
    xy[3] = Math.sqrt( new_dx*new_dx + new_dy*new_dy );
    break;
  case _VIA_RSHAPE.ELLIPSE:
    switch(cpindex) {
    case 1:
      xy[4] = Math.abs(new_y - xy0[2]);
      break;
    case 2:
      xy[3] = Math.abs(new_x - xy0[1]);
      break;
    }
    break;
  case _VIA_RSHAPE.LINE:
  case _VIA_RSHAPE.POLYGON:
  case _VIA_RSHAPE.POLYLINE:
    xy[ 2*cpindex - 1 ] = new_x;
    xy[ 2*cpindex ]     = new_y;
    break;
  }
  return xy;
}

_via_file_annotator.prototype._creg_get_control_points = function(xy) {
  var shape_id = xy[0];
  switch( shape_id ) {
  case _VIA_RSHAPE.POINT:
    return [ xy[0] ];
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
      xy[1], xy[2] - xy[3],
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

_via_file_annotator.prototype._creg_is_on_sel_region_cp = function(cx, cy, tolerance) {
  var n = this.selected_mid_list.length;
  var mid, shape_id;
  var sel_region_cp = [-1, -1];
  for ( var i = 0; i < n; ++i ) {
    mid = this.selected_mid_list[i];
    var cp_index = this._creg_is_on_control_point(this.creg[mid], cx, cy, tolerance);
    // is mousedown on region control point?
    if ( cp_index !== -1 ) {
      sel_region_cp = [i, cp_index];
      break;
    }
  }
  return sel_region_cp;
}

_via_file_annotator.prototype._creg_select_one = function(mid) {
  this.selected_mid_list = [mid];
  this._creg_draw_all();
  this._smetadata_show();
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
    if ( this.selected_mid_list.length === 1 ) {
      this._smetadata_show();
    }
  }
}

_via_file_annotator.prototype._creg_select_toggle = function(mid_list) {
  var n = mid_list.length;
  if ( n > 0 ) {
    var mindex;
    for ( var i = 0; i < n; ++i ) {
      mindex = this.selected_mid_list.indexOf( mid_list[i] );
      if ( mindex === -1 ) {
        // add to selection
        this.selected_mid_list.push( mid_list[i] );
      } else {
        // remove from selection
        this.selected_mid_list.splice(mindex, 1 );
      }
    }
    this._creg_draw_all();
  }
}

_via_file_annotator.prototype._creg_select_none = function() {
  this.selected_mid_list = [];
  this._creg_draw_all();
  this._smetadata_hide();
}

_via_file_annotator.prototype._creg_select_all = function() {
  this.selected_mid_list = Object.keys(this.creg);
  this._creg_draw_all();
}

_via_file_annotator.prototype._creg_del_sel_regions = function() {
  this.d.metadata_delete_bulk( this.vid, this.selected_mid_list ).then( function(ok) {
    this._creg_select_none();
    this.user_input_pts = [];
    this._state_set( _VIA_RINPUT_STATE.IDLE );
  }.bind(this), function(err) {
    console.log(err);
  }.bind(this));
}

//
// external event listener
//
_via_file_annotator.prototype._on_event_metadata_add = function(data, event_payload) {
  console.log('[vid=' + this.vid + ',state=' + this._state_id2str(this.state_id) + '] : _on_event_metadata_add');
  var vid = event_payload.vid;
  var mid = event_payload.mid;
  if ( this.vid === vid) {
    this._creg_add(vid, mid);
    //this._creg_draw_all();
  }
}

_via_file_annotator.prototype._on_event_metadata_update = function(data, event_payload) {
  var vid = event_payload.vid;
  var mid = event_payload.mid;
  if ( this.vid === vid) {
    this._creg_add(vid, mid);
    //this._creg_draw_all();
  }
}

_via_file_annotator.prototype._on_event_view_update = function(data, event_payload) {
  var vid = event_payload.vid;

  if ( this.vid === vid ) {
    this._creg_reload();
  }
}

//
// temp. regions
//
_via_file_annotator.prototype._tmpreg_draw_region = function(shape_id, pts) {
  var xy = this._metadata_pts_to_xy(shape_id, pts);
  this._tmpreg_clear();
  this._draw(this.temprctx, xy);
}

_via_file_annotator.prototype._tmpreg_move_sel_regions = function(dx, dy) {
  var mid, mindex;
  for ( mindex in this.selected_mid_list ) {
    mid = this.selected_mid_list[mindex];
    var new_cxy = this._metadata_move_xy(this.creg[mid], dx, dy);
    this._draw(this.temprctx, new_cxy, false);
  }
}

_via_file_annotator.prototype._tmpreg_move_sel_region_cp = function(mindex, cpindex, cx, cy) {
  var mid = this.selected_mid_list[mindex];
  var moved_cxy = this._creg_move_control_point(this.creg[mid], cpindex, cx, cy);
  this._draw(this.temprctx, moved_cxy, false);
}

_via_file_annotator.prototype._tmpreg_clear = function() {
  this.temprctx.clearRect(0, 0, this.tempr_canvas.width, this.tempr_canvas.height);
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
    this._draw_point(ctx, cx, cy, this.conf.REGION_POINT_RADIUS);
    ctx.stroke();
    ctx.strokeStyle = 'white';
    this._draw_point(ctx, cx, cy, this.conf.REGION_POINT_RADIUS + 2);
    ctx.stroke();

    ctx.fillStyle   = this.conf.SEL_REGION_FILL_COLOR;
    ctx.globalAlpha = this.conf.SEL_REGION_FILL_OPACITY;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  } else {
    ctx.strokeStyle = this.conf.REGION_BOUNDARY_COLOR;
    ctx.lineWidth   = this.conf.REGION_LINE_WIDTH;
    this._draw_point(ctx, cx, cy, this.conf.REGION_POINT_RADIUS);
    ctx.stroke();
  }
}

_via_file_annotator.prototype._draw_point = function(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2*Math.PI, false);
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


//
// region draw enable/disable
//
_via_file_annotator.prototype._rinput_enable = function() {
  this._state_set(_VIA_RINPUT_STATE.IDLE);
  this.input.style.pointerEvents = 'auto';
  this.input.classList.add('rinput_enabled');
  if ( this.file.type === _VIA_FILE_TYPE.VIDEO ||
       this.file.type === _VIA_FILE_TYPE.AUDIO
     ) {
    if ( this.file.type === _VIA_FILE_TYPE.VIDEO ) {
      this.file_html_element.removeAttribute('controls');
    }
    // _via_util_msg_show('At any time, press <span class="key">Space</span> to play or pause the video.');
  }
}

_via_file_annotator.prototype._rinput_disable = function() {
  this._state_set(_VIA_RINPUT_STATE.SUSPEND);
  this.input.style.pointerEvents = 'none';
  this.input.classList.remove('rinput_enabled');
  if ( this.file.type === _VIA_FILE_TYPE.VIDEO ||
       this.file.type === _VIA_FILE_TYPE.AUDIO
     ) {
    this.file_html_element.setAttribute('controls', 'true');
    //_via_util_msg_show('At any time, press <span class="key">Space</span> to play or pause the video.', true);
  }
}

//
// on-screen spatial metadata editor
//
_via_file_annotator.prototype._smetadata_hide = function() {
  this.smetadata_container.classList.add('hide');
}

_via_file_annotator.prototype._smetadata_set_position = function() {
  var mid = this.selected_mid_list[0];
  var x = this.left_pad + this.creg[mid][1];
  var y = this.conf.REGION_SMETADATA_MARGIN + this.creg[mid][2];
  var shape_id = this.creg[mid][0];
  switch(shape_id) {
  case _VIA_RSHAPE.RECT:
    y = y + this.creg[mid][4];
    break;
  case _VIA_RSHAPE.CIRCLE:
  case _VIA_RSHAPE.ELLIPSE:
    y = y + this.creg[mid][3];
    break;
  }
  this.smetadata_container.style.left = x + 'px';
  this.smetadata_container.style.top  = y + 'px';
}

_via_file_annotator.prototype._smetadata_show = function() {
  if ( this.selected_mid_list.length === 1 ) {
    this._smetadata_update();
    this._smetadata_set_position();
    this.smetadata_container.classList.remove('hide');
  }
}

_via_file_annotator.prototype._smetadata_update = function() {
  var mid = this.selected_mid_list[0];
  var table = document.createElement('table');
  table.appendChild( this._smetadata_header_html() );

  // show value of each attribute
  var tbody = document.createElement('tbody');
  var tr = document.createElement('tr');
  tr.setAttribute('data-mid', mid);
  for ( var aid in this.d.cache.attribute_group['FILE1_Z1_XY1'] ) {
    var td = document.createElement('td');
    td.setAttribute('data-aid', aid);
    td.appendChild( this._smetadata_attribute_io_html_element(mid, aid) );
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
  table.appendChild(tbody);

  this.smetadata_container.innerHTML = '';
  this.smetadata_container.appendChild(table);
}

_via_file_annotator.prototype._smetadata_header_html = function() {
  var tr = document.createElement('tr');
  for ( var aid in this.d.cache.attribute_group['FILE1_Z1_XY1'] ) {
    var th = document.createElement('th');
    th.innerHTML = this.d.store.attribute[aid].aname;
    tr.appendChild(th);
  }
  return tr;
}

_via_file_annotator.prototype._smetadata_on_change = function(e) {
  var mid = e.target.dataset.mid;
  var aid = e.target.dataset.aid;
  var aval = e.target.value;
  if ( e.target.type === 'checkbox' &&
       this.d.store.metadata[mid].av.hasOwnProperty(aid)
     ) {
    var values = this.d.store.metadata[mid].av[aid].split(',');
    if ( this.d.store.metadata[mid].av[aid] !== '' ) {
      var vindex = values.indexOf(e.target.value);
      if ( e.target.checked ) {
        // add this value
        if ( vindex === -1 ) {
          values.push(e.target.value);
        }
      } else {
        // remove this value
        var vindex = values.indexOf(aval);
        if ( vindex !== -1 ) {
          values.splice(vindex, 1);
        }
      }
      aval = values.join(',');
    }
  }

  this.d.metadata_update_av(this.vid, mid, aid, aval).then( function(ok) {
    console.log( JSON.stringify(this.d.store.metadata[ok.mid].av) );
  }.bind(this));
}

_via_file_annotator.prototype._smetadata_attribute_io_html_element = function(mid, aid) {
  var aval  = this.d.store.metadata[mid].av[aid];
  var dval  = this.d.store.attribute[aid].default_option_id;
  var atype = this.d.store.attribute[aid].type;
  var el;

  switch(atype) {
  case _VIA_ATTRIBUTE_TYPE.TEXT:
    if ( typeof(aval) === 'undefined' ) {
      aval = dval;
    }
    el = document.createElement('textarea');
    el.addEventListener('change', this._smetadata_on_change.bind(this));
    el.innerHTML = aval;
    break;

  case _VIA_ATTRIBUTE_TYPE.SELECT:
    el = document.createElement('select');
    if ( typeof(aval) === 'undefined' ) {
      aval = dval;
    }

    for ( var oid in this.d.store.attribute[aid].options ) {
      var oi = document.createElement('option');
      oi.setAttribute('value', oid);
      oi.innerHTML = this.d.store.attribute[aid].options[oid];
      if ( oid === aval ) {
        oi.setAttribute('selected', 'true');
      }
      el.appendChild(oi);
    }
    el.addEventListener('change', this._smetadata_on_change.bind(this));
    break;

  case _VIA_ATTRIBUTE_TYPE.RADIO:
    el = document.createElement('div');

    if ( typeof(aval) === 'undefined' ) {
      aval = dval;
    }

    for ( var oid in this.d.store.attribute[aid].options ) {
      var radio = document.createElement('input');
      radio.setAttribute('type', 'radio');
      radio.setAttribute('value', oid);
      radio.setAttribute('data-mid', mid);
      radio.setAttribute('data-aid', aid);
      radio.setAttribute('name', this.d.store.attribute[aid].aname);
      if ( oid === aval ) {
        radio.setAttribute('checked', true);
      }
      radio.addEventListener('change', this._smetadata_on_change.bind(this));
      var label = document.createElement('label');
      label.innerHTML = this.d.store.attribute[aid].options[oid];

      var br = document.createElement('br');
      el.appendChild(radio);
      el.appendChild(label);
      el.appendChild(br);
    }
    break;

  case _VIA_ATTRIBUTE_TYPE.CHECKBOX:
    el = document.createElement('div');

    if ( typeof(aval) === 'undefined' ) {
      aval = dval;
    }
    var values = aval.split(',');
    for ( var oid in this.d.store.attribute[aid].options ) {
      var checkbox = document.createElement('input');
      checkbox.setAttribute('type', 'checkbox');
      checkbox.setAttribute('value', oid);
      checkbox.setAttribute('data-mid', mid);
      checkbox.setAttribute('data-aid', aid);
      checkbox.setAttribute('name', this.d.store.attribute[aid].aname);

      if ( values.indexOf(oid) !== -1 ) {
        checkbox.setAttribute('checked', true);
      }
      checkbox.addEventListener('change', this._smetadata_on_change.bind(this));
      var label = document.createElement('label');
      label.innerHTML = this.d.store.attribute[aid].options[oid];

      var br = document.createElement('br');
      el.appendChild(checkbox);
      el.appendChild(label);
      el.appendChild(br);
    }
    break;

  default:
    console.log('attribute type ' + atype + ' not implemented yet!');
    var el = document.createElement('span');
    el.innerHTML = aval;
  }
  el.setAttribute('data-mid', mid);
  el.setAttribute('data-aid', aid);
  return el;
}
