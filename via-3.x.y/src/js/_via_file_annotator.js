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
  this._ID = '_via_file_annotator_';
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

  // last known mouse cursor position
  this.last_cx = 0;
  this.last_cy = 0;

  // constants
  this.conf = {};
  this.conf.CONTROL_POINT_RADIUS = 2;
  this.conf.CONTROL_POINT_COLOR  = 'red';
  this.conf.CONTROL_POINT_CLICK_TOL = 3;
  this.conf.REGION_BOUNDARY_COLOR = 'yellow';
  this.conf.REGION_LINE_WIDTH = 2;
  this.conf.SEL_REGION_BOUNDARY_COLOR = 'black';
  this.conf.SEL_REGION_FILL_COLOR = '#808080';
  this.conf.SEL_REGION_FILL_OPACITY = 0.1;
  this.conf.SEL_REGION_LINE_WIDTH = 2;
  this.conf.REGION_POINT_RADIUS = 3;
  this.conf.FIRST_VERTEX_CLICK_TOL = 3;
  this.conf.FIRST_VERTEX_BOUNDARY_WIDTH = 1;
  this.conf.FIRST_VERTEX_BOUNDARY_COLOR = 'black';
  this.conf.FIRST_VERTEX_FILL_COLOR = 'white';
  this.conf.REGION_SMETADATA_MARGIN = 4; // in pixel
  this.conf.FILE_METADATA_MARGIN = 4; // in pixel
  this.conf.CROSSHAIR_COLOR1 = '#1a1a1a';
  this.conf.CROSSHAIR_COLOR2 = '#e6e6e6';
  this.conf.SPATIAL_REGION_TIME_TOL = 0.02; // in sec

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  _via_event.call( this );

  // register event listeners
  this.d.on_event('metadata_add', this._ID, this._on_event_metadata_add.bind(this));
  this.d.on_event('metadata_update', this._ID, this._on_event_metadata_update.bind(this));
  this.d.on_event('metadata_delete_bulk', this._ID, this._on_event_metadata_delete_bulk.bind(this));
  this.d.on_event('view_update', this._ID, this._on_event_view_update.bind(this));
  this.d.on_event('attribute_update', this._ID, this._on_event_attribute_update.bind(this));
  this.d.on_event('attribute_del', this._ID, this._on_event_attribute_del.bind(this));

  this._init();
}

_via_file_annotator.prototype._init = function() {
  if ( this.d.store.view[this.vid].fid_list.length !== 1 ) {
    console.warn('_via_file_annotator() can only operate on a single file!');
    return;
  }

  if ( ! this.d.store.config.ui.hasOwnProperty('file_metadata_editor_visible') ) {
    this.d.store.config.ui['file_metadata_editor_visible'] = true;
  }
  if ( ! this.d.store.config.ui.hasOwnProperty('spatial_metadata_editor_visible') ) {
    this.d.store.config.ui['spatial_metadata_editor_visible'] = true;
  }

  this.fid = this.d.store.view[this.vid].fid_list[0];
}

_via_file_annotator.prototype._file_load_show_error_page = function() {
  this.c.innerHTML = '';
  var page = document.createElement('div');
  page.setAttribute('class', 'error_page');

  var title = document.createElement('h1');
  title.innerHTML = 'File Not Found!';
  page.appendChild(title);

  var msg = document.createElement('p');
  msg.innerHTML = 'File "<code>' + this.d.file_get_uri(this.fid) + '</code>" not found. ';
  msg.innerHTML += 'VIA application will automatically reload this file when you update one of the properties below.';
  page.appendChild(msg);

  var table = document.createElement('table');
  var filename_row = document.createElement('tr');
  var filename_label = document.createElement('td');
  filename_label.innerHTML = 'Filename';
  var filename_cell = document.createElement('td');
  var filename_input = document.createElement('input');
  filename_input.setAttribute('type', 'text');
  filename_input.setAttribute('value', this.d.store.file[this.fid].fname);
  filename_input.setAttribute('data-pname', 'fname');
  filename_input.addEventListener('change', this._file_on_attribute_update.bind(this));
  filename_cell.appendChild(filename_input);
  filename_row.appendChild(filename_label);
  filename_row.appendChild(filename_cell);
  page.appendChild(filename_row);

  var filetype_row = document.createElement('tr');
  var filetype_label = document.createElement('td');
  filetype_label.innerHTML = 'File Type';
  filetype_row.appendChild(filetype_label);
  var filetype_select = document.createElement('select');
  filetype_select.setAttribute('data-pname', 'type');
  filetype_select.addEventListener('change', this._file_on_attribute_update.bind(this));

  for ( var filetype in _VIA_FILE_TYPE ) {
    var oi = document.createElement('option');
    oi.setAttribute('value', _VIA_FILE_TYPE[filetype]);
    oi.innerHTML = filetype;
    if ( this.d.store.file[this.fid].type === _VIA_FILE_TYPE[filetype] ) {
      oi.setAttribute('selected', '');
    }
    filetype_select.appendChild(oi);
  }
  var filetype_select_cell = document.createElement('td');
  filetype_select_cell.appendChild(filetype_select);
  filetype_row.appendChild(filetype_select_cell);
  page.appendChild(filetype_row);

  var fileloc_row = document.createElement('tr');
  var fileloc_label = document.createElement('td');
  fileloc_label.innerHTML = 'File Location';
  fileloc_row.appendChild(fileloc_label);
  var fileloc_select = document.createElement('select');
  fileloc_select.setAttribute('data-pname', 'loc');
  fileloc_select.addEventListener('change', this._file_on_attribute_update.bind(this));
  for ( var fileloc in _VIA_FILE_LOC ) {
    var oi = document.createElement('option');
    oi.setAttribute('value', _VIA_FILE_LOC[fileloc]);
    oi.innerHTML = fileloc;
    if ( this.d.store.file[this.fid].loc === _VIA_FILE_LOC[fileloc] ) {
      oi.setAttribute('selected', '');
    }
    fileloc_select.appendChild(oi);
  }
  var fileloc_cell = document.createElement('td');
  fileloc_cell.appendChild(fileloc_select);
  if ( this.d.store.file[this.fid].loc !== _VIA_FILE_LOC.LOCAL ) {
    var fileloc = this.d.store.file[this.fid].loc;
    var locprefix_input = document.createElement('input');
    locprefix_input.setAttribute('type', 'text');
    locprefix_input.setAttribute('value', this.d.store.config.file.loc_prefix[fileloc]);
    locprefix_input.setAttribute('data-pname', 'loc_prefix');
    locprefix_input.setAttribute('title', 'Location prefix (or path) that will be automatically added to file locations. For example, if you add "http://www.mysite.com/data/images/" as the location prefix, all your images will be sourced from this site.');
    locprefix_input.addEventListener('change', this._file_on_attribute_update.bind(this));
    fileloc_cell.appendChild(locprefix_input);
  }
  fileloc_row.appendChild(fileloc_cell);
  page.appendChild(fileloc_row);

  var filesrc_row = document.createElement('tr');
  var filesrc_label = document.createElement('td');
  filesrc_label.innerHTML = 'File Source';
  filesrc_row.appendChild(filesrc_label);
  var filesrc_input;
  if ( this.d.store.file[this.fid].loc === _VIA_FILE_LOC.LOCAL ) {
    filesrc_input = document.createElement('input');
    filesrc_input.setAttribute('type', 'file');
    if ( this.d.file_ref[this.fid] ) {
      filesrc_input.setAttribute('files', [ this.d.file_ref[this.fid] ]);
    }
  } else {
    if ( this.d.store.file[this.fid].loc === _VIA_FILE_LOC.INLINE ) {
      filesrc_input = document.createElement('textarea');
      filesrc_input.setAttribute('rows', 5);
      filesrc_input.setAttribute('cols', 100);
      filesrc_input.innerHTML = this.d.store.file[this.fid].src;
    } else {
      filesrc_input = document.createElement('input');
      filesrc_input.setAttribute('type', 'text');
      filesrc_input.setAttribute('value', this.d.store.file[this.fid].src)
    }
  }
  filesrc_input.setAttribute('data-pname', 'src');
  filesrc_input.addEventListener('change', this._file_on_attribute_update.bind(this));
  var filesrc_cell = document.createElement('td');
  filesrc_cell.appendChild(filesrc_input);
  filesrc_row.appendChild(filesrc_cell);
  page.appendChild(filesrc_row);

  // control buttons
  var bpanel = document.createElement('p');
  var reload = document.createElement('button');
  reload.innerHTML = 'Reload File';
  reload.addEventListener('click', function() {
    this.va.view_show(this.vid);
  }.bind(this));
  bpanel.appendChild(reload);
  page.appendChild(bpanel);

  this.c.appendChild(page);
}

_via_file_annotator.prototype._file_on_attribute_update = function(e) {
  var pname = e.target.dataset.pname;
  var pvalue = '';
  switch(pname) {
  case 'loc_prefix':
  case 'fname':
    pvalue = e.target.value;
    break;
  case 'type':
  case 'loc':
    pvalue = parseInt(e.target.options[e.target.selectedIndex].value);
    break;
  case 'src':
    if ( this.d.store.file[this.fid].loc === _VIA_FILE_LOC.LOCAL ) {
      if ( e.target.files.length ) {
        pvalue = e.target.files[0];
      }
    } else {
      if ( this.d.store.file[this.fid].loc === _VIA_FILE_LOC.INLINE ) {
        pvalue = e.target.innerHTML;
      } else {
        pvalue = e.target.value;
      }
    }
    break;
  }

  this.d.file_update(this.fid, pname, pvalue).then( function(ok) {
    this.va.view_show(this.vid);
  }.bind(this), function(err) {
    _via_util_msg_show('Failed to update properties of file: ' + err );
  }.bind(this));
}

_via_file_annotator.prototype._file_load = function() {
  return new Promise( function(ok_callback, err_callback) {
    this.file_html_element = this._file_create_html_element();
    this.file_html_element.setAttribute('title', this.d.store.file[this.fid].fname);
    var file_src = this.d.file_get_src(this.d.store.file[this.fid].fid);
    if ( file_src === '' ) {
      this.d.file_free_resources(this.fid);
      this._file_load_show_error_page();
      err_callback();
      return;
    } else {
      this.file_html_element.setAttribute('src', file_src);
    }

    this.file_html_element.addEventListener('load', function() {
      //console.log('load:' + this.fid + ', now freeing resources')
      this._file_html_element_ready();
      ok_callback();
    }.bind(this));
    this.file_html_element.addEventListener('loadeddata', function() {
      //console.log('loaddata:' + this.fid + ', now freeing resources')
      this._file_html_element_ready();
      ok_callback();
    }.bind(this));
    this.file_html_element.addEventListener('abort', function(e) {
      //console.log('abort:' + this.fid + ', now freeing resources')
      _via_util_msg_show('Failed to load file [' + this.d.store.file[this.fid].fname + '] (' + e + ')' );
      this._file_load_show_error_page();
      err_callback();
    }.bind(this));
    this.file_html_element.addEventListener('stalled', function(e) {
      //console.log('stalled:' + this.fid + ', now freeing resources')
      _via_util_msg_show('Failed to load file [' + this.d.store.file[this.fid].fname + '] (' + e + ')' );
      this._file_load_show_error_page();
      err_callback();
    }.bind(this));
    this.file_html_element.addEventListener('error', function(e) {
      //console.log('error:' + this.fid + ', now freeing resources')
      _via_util_msg_show('Failed to load file [' + this.d.store.file[this.fid].fname + '] (' + e + ')' );
      this._file_load_show_error_page();
      err_callback();
    }.bind(this));
  }.bind(this));
}

_via_file_annotator.prototype._file_create_html_element = function() {
  var media;
  switch( this.d.store.file[this.fid].type ) {
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
      this._smetadata_hide();
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
    console.warn('unknown file type = ' + this.d.store.file[this.fid].type);
  }
  return media;
}

_via_file_annotator.prototype._file_html_element_compute_scale = function() {
  var maxh = this.c.clientHeight;
  var maxw = this.c.clientWidth;

  // original size of the content
  var cw0, ch0;
  switch( this.d.store.file[this.fid].type ) {
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
  //_via_util_msg_show('Loaded file [' + this.d.store.file[this.fid].fname + ']' );
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

  // spatial metadata container (i.e. metadata of image or video frame regions)
  this.smetadata_container = document.createElement('div');
  this.smetadata_container.setAttribute('class', 'metadata_container');
  this.smetadata_container.classList.add('hide');
  this.smetadata_container.setAttribute('id', 'smetadata_container');
  this.smetadata_container.innerHTML = '';
  this.c.appendChild(this.smetadata_container);

  // file metadata container (e.g. caption)
  this.fmetadata_container = document.createElement('div');
  this.fmetadata_container.setAttribute('class', 'metadata_container');
  this.fmetadata_container.classList.add('hide');
  this.fmetadata_container.setAttribute('id', 'fmetadata_container');
  this.fmetadata_container.innerHTML = '';
  this.c.appendChild(this.fmetadata_container);
  this._fmetadata_show();

  // draw all existing regions
  this._creg_draw_file_label();
  this._creg_update();
  this._creg_draw_all();

  this._state_set(_VIA_RINPUT_STATE.IDLE);
}

//
// input event listeners
//
_via_file_annotator.prototype._rinput_attach_input_handlers = function(container) {
  container.addEventListener('mousedown', this._rinput_mousedown_handler.bind(this));
  container.addEventListener('mouseup', this._rinput_mouseup_handler.bind(this));
  container.addEventListener('mousemove', this._rinput_mousemove_handler.bind(this));

  container.addEventListener('wheel', this._rinput_wheel_handler.bind(this));

  container.addEventListener('keydown', this._rinput_keydown_handler.bind(this));
}

_via_file_annotator.prototype._rinput_remove_input_handlers = function() {
  // @todo
}

_via_file_annotator.prototype._rinput_keydown_handler = function(e) {
  if ( e.key === 'n' || e.key === 'p' ) {
    e.preventDefault();
    if(e.key === 'n') {
      this.va.emit_event('view_next', {});
    } else {
      this.va.emit_event('view_prev', {});
    }
  }

  if ( e.key === 'Backspace' || e.key === 'Delete' ) {
    if ( this.selected_mid_list.length ) {
      e.preventDefault();
      this._creg_del_sel_regions();
      _via_util_msg_show('Spatial region deleted.');
    }
    return;
  }

  if ( e.key === 'a' ) {
    if ( e.ctrlKey ) {
      e.preventDefault();
      this._creg_select_all();
      this._creg_draw_all();
      _via_util_msg_show('Selected all regions.');
    }
    return;
  }

  if ( e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
       e.key === 'ArrowUp' || e.key === 'ArrowDown'
     ) {
    if ( this.selected_mid_list.length ) {
      e.preventDefault();
      // move selected region
      var cdx = 0;
      var cdy = 0;
      switch(e.key) {
      case 'ArrowLeft':
        cdx = -1;
        break;
      case 'ArrowRight':
        cdx = +1;
        break;
      case 'ArrowUp':
        cdy = -1;
        break;
      case 'ArrowDown':
        cdy = +1;
        break;
      }
      if ( e.shiftKey ) {
        cdx = cdx * _VIA_SPATIAL_REGION_MOVE_DELTA;
        cdy = cdy * _VIA_SPATIAL_REGION_MOVE_DELTA;
      }
      var mid_list = this.selected_mid_list.slice(0);
      this._metadata_move_region(mid_list, cdx, cdy);
    }
    return;
  }

  if ( e.key === 'Escape' ) {
    e.preventDefault();
    if ( this.state_id === _VIA_RINPUT_STATE.REGION_DRAW_NCLICK_ONGOING &&
         this.user_input_pts.length > 2
       ) {
      this._rinput_cancel_last_nclick();
      this._tmpreg_clear();
      var pts = this.user_input_pts.slice(0);
      pts.push(this.last_cx, this.last_cy);
      this._tmpreg_draw_region(this.va.region_draw_shape, pts);
      _via_util_msg_show('Discarded last drawn vertex.');
    } else {
      this._creg_select_none();
      this._smetadata_hide();
      this._tmpreg_clear();
      this.user_input_pts = [];
      this._state_set( _VIA_RINPUT_STATE.IDLE );
      _via_util_msg_show('Reset done.');
    }
    this._creg_draw_all();
    return;
  }

  if ( e.key === 'Enter' ) {
    e.preventDefault();
    // For extreme box, we do not want to allow finishing the drawing unless
    // all 4 extreme points have been marked, at which point we automatically
    // finish the drawing, anyway.
    if ( this.state_id === _VIA_RINPUT_STATE.REGION_DRAW_NCLICK_ONGOING &&
         this.user_input_pts.length > 4 &&
         this.va.region_draw_shape != _VIA_RSHAPE.EXTREME_BOX) {
      this._rinput_region_draw_nclick_done();
      this.user_input_pts = [];
      this._tmpreg_clear();
      this._state_set( _VIA_RINPUT_STATE.IDLE );
      _via_util_msg_show( 'Finished drawing a region shape with multiple vertices.');
    } else {
      if (this.va.region_draw_shape == _VIA_RSHAPE.EXTREME_BOX) {
        _via_util_msg_show('You must define all 4 vertices. Press <span class="key">Esc</span> to cancel last drawn vertex.');
      } else {
        _via_util_msg_show('You must define at least 2 vertices. Press <span class="key">Esc</span> to cancel last drawn vertex.');
      }
    }
  }
}

_via_file_annotator.prototype._rinput_cancel_last_nclick = function() {
  var n = this.user_input_pts.length;
  this.user_input_pts.splice(n-2, 2); // delete last two points
}

_via_file_annotator.prototype._rinput_mousedown_handler = function(e) {
  e.stopPropagation();
  var cx = e.offsetX;
  var cy = e.offsetY;
  //console.log('[vid=' + this.vid + ', state=' + this._state_id2str(this.state_id) + '] : mousedown at (cx,cy) = (' + cx + ',' + cy + ')');

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
    var nclick_done = false;
    switch( this.va.region_draw_shape ) {
    case _VIA_RSHAPE.EXTREME_RECTANGLE:
      this.user_input_pts.push(cx, cy);
      if ( this.user_input_pts.length === 8 ) {
        nclick_done = true;
      }
      break;
    case _VIA_RSHAPE.EXTREME_CIRCLE:
      this.user_input_pts.push(cx, cy);
      if ( this.user_input_pts.length === 6 ) {
        nclick_done = true;
      }
      break;
    case _VIA_RSHAPE.POLYGON:
    case _VIA_RSHAPE.POLYLINE:
      if ( this._rinput_is_near_first_user_input_point(cx, cy) ) {
        nclick_done = true;
      } else {
        this.user_input_pts.push(cx, cy);
      }
      break;
    }
    if ( nclick_done ) {
      this._rinput_region_draw_nclick_done();
      this.user_input_pts = [];
      this._tmpreg_clear();
      this._state_set( _VIA_RINPUT_STATE.IDLE );
      //_via_util_msg_show( 'Finished drawing a region shape with multiple vertices.');
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
  //console.log('[vid=' + this.vid + ', state=' + this._state_id2str(this.state_id) + '] : mouseup at (cx,cy) = (' + cx + ',' + cy + ')');

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_DRAW_ONGOING ) {
    switch ( this.va.region_draw_shape ) {
    case _VIA_RSHAPE.EXTREME_RECTANGLE:
      this._state_set( _VIA_RINPUT_STATE.REGION_DRAW_NCLICK_ONGOING );
      _via_util_msg_show( 'First boundary point added. Now click at three remaining points to mark the boundary of a rectangular object.', true);
      break;
    case _VIA_RSHAPE.EXTREME_CIRCLE:
      this._state_set( _VIA_RINPUT_STATE.REGION_DRAW_NCLICK_ONGOING );
      _via_util_msg_show( 'First point on added. Now click at two remaining points on the circumference to define a circular region.', true);
      break;
    case _VIA_RSHAPE.POLYGON:
    case _VIA_RSHAPE.POLYLINE:
      // region shape requiring more than two points (polygon, polyline)
      this._state_set( _VIA_RINPUT_STATE.REGION_DRAW_NCLICK_ONGOING );
      _via_util_msg_show( 'To finish, click at the first vertex or press <span class="key">Enter</span> key. To discard the last drawn vertex, press <span class="key">Esc</span> key.', true);
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
    this._tmpreg_clear();
    if(this.last_clicked_mid_list.length) {
      this._creg_select( this.last_clicked_mid_list[0] );
    }
    this._smetadata_show();
    this._creg_draw_all();
    this._state_set( _VIA_RINPUT_STATE.REGION_SELECTED );
    _via_util_msg_show('Region selected. Press <span class="key">Backspace</span> key to delete and arrow keys to move selected region. Use mouse wheel to update region label.', true);
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_MOVE_ONGOING ) {
    this.user_input_pts.push(cx, cy);
    // region shape requiring just two points (rectangle, circle, ellipse, etc.)
    if ( this._is_user_input_pts_equal() ) {
      // implies user performed a click operation
      // check if click is on another region
      var clicked_mid_list = this._is_point_inside_existing_regions(cx, cy);
      if(clicked_mid_list.length) {
        if(clicked_mid_list[0] === this.last_clicked_mid_list[0]) {
          this._creg_select_none();
          this.user_input_pts = [];
          this._state_set( _VIA_RINPUT_STATE.IDLE );
        } else {
          // select the new region
          if ( e.shiftKey ) {
            this._creg_select( clicked_mid_list[0] );
          } else {
            this._creg_select_one( clicked_mid_list[0] );
          }
          this._state_set( _VIA_RINPUT_STATE.REGION_SELECTED );
        }
        this._smetadata_show();
        this._creg_draw_all();
      }
      this.user_input_pts = [];
    } else {
      var canvas_input_pts = this.user_input_pts.slice(0);
      var cdx = canvas_input_pts[2] - canvas_input_pts[0];
      var cdy = canvas_input_pts[3] - canvas_input_pts[1];
      var mid_list = this.selected_mid_list.slice(0);
      this._metadata_move_region(mid_list, cdx, cdy);
      this._tmpreg_clear();
      this.user_input_pts = [];
      this._state_set( _VIA_RINPUT_STATE.REGION_SELECTED );
    }
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
    this._smetadata_hide();
    this._creg_draw_all();
    this.user_input_pts = [];
    this._state_set( _VIA_RINPUT_STATE.IDLE );
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.SELECT_ALL_INSIDE_AN_AREA_ONGOING ) {
    // @todo
    this._creg_select_none();
    this._smetadata_hide();
    this._creg_draw_all();
    this.user_input_pts = [];
    this._state_set( _VIA_RINPUT_STATE.IDLE );
    return;
  }

  if ( this.state_id === _VIA_RINPUT_STATE.REGION_SELECT_TOGGLE_ONGOING ) {
    if ( ! e.shiftKey ) {
      this._creg_select_none();
    }
    this._creg_select_toggle( this.last_clicked_mid_list );
    this._smetadata_show();
    this._creg_draw_all();
    this._state_set( _VIA_RINPUT_STATE.REGION_SELECTED );
    return;
  }
}

_via_file_annotator.prototype._rinput_mousemove_handler = function(e) {
  e.stopPropagation();
  var cx = e.offsetX;
  var cy = e.offsetY;
  this.last_cx = cx;
  this.last_cy = cy;

  var pts = this.user_input_pts.slice(0);
  pts.push(cx, cy);

  this._tmpreg_clear();
  if ( this.va.region_draw_shape === _VIA_RSHAPE.EXTREME_RECTANGLE ) {
    if ( this.state_id !== _VIA_RINPUT_STATE.REGION_SELECTED ) {
      this._tmpreg_draw_crosshair(this.last_cx, this.last_cy);
    }
  }

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
      case _VIA_RSHAPE.RECTANGLE:
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
      case _VIA_RSHAPE.EXTREME_RECTANGLE:
      case _VIA_RSHAPE.EXTREME_CIRCLE:
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
    if ( dx <= this.conf.CONTROL_POINT_CLICK_TOL &&
         dy <= this.conf.CONTROL_POINT_CLICK_TOL ) {
      return true;
    }
  }
  return false;
}

_via_file_annotator.prototype._rinput_region_draw_nclick_done = function() {
  var canvas_input_pts = this.user_input_pts.slice(0);
  this._metadata_add(this.va.region_draw_shape, canvas_input_pts);
}

_via_file_annotator.prototype._rinput_wheel_handler = function(e) {
  if ( this.selected_mid_list.length ) {
    e.preventDefault();
    var aid_list = Object.keys(this.d.store.attribute);
    if ( this.d.store.config.ui['spatial_region_label_attribute_id'] === '' ) {
      this.d.store.config.ui['spatial_region_label_attribute_id'] = aid_list[0];
    } else {
      var aid_index = aid_list.indexOf(this.d.store.config.ui['spatial_region_label_attribute_id']);
      if ( aid_index !== -1 ) {
        if (e.deltaY < 0) {
          var next_aid_index = aid_index + 1;
          if ( next_aid_index >= aid_list.length ) {
            this.d.store.config.ui['spatial_region_label_attribute_id'] = '';
          } else {
            this.d.store.config.ui['spatial_region_label_attribute_id'] = aid_list[next_aid_index];
          }
        } else {
          var prev_aid_index = aid_index - 1;
          if ( prev_aid_index < 0 ) {
            this.d.store.config.ui['spatial_region_label_attribute_id'] = '';
          } else {
            this.d.store.config.ui['spatial_region_label_attribute_id'] = aid_list[prev_aid_index];
          }
        }
      } else {
        this.d.store.config.ui['spatial_region_label_attribute_id'] = '';
      }
    }
    this._creg_update();
    this._creg_draw_all();
  }
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
  var mid_edge_dist = [];
  var dist_minmax;
  for ( var mid in this.creg ) {
    if ( this._creg_is_inside(this.creg[mid],
                              cx,
                              cy,
                              this.conf.CONTROL_POINT_CLICK_TOL) ) {

      mid_list.push(mid);
    }
  }

  if(mid_list.length) {
    // if multiple regions, sort mid based on distance on (cx,cy) to its nearest edge
    var dist_minmax;
    for( var mindex in mid_list ) {
      dist_minmax = this._creg_edge_minmax_dist_to_point(this.creg[ mid_list[mindex] ], cx, cy);
      mid_edge_dist.push(dist_minmax[0]);
    }

    mid_list.sort( function(mid1, mid2) {
      if( mid_edge_dist[ mid_list.indexOf(mid1) ] < mid_edge_dist[ mid_list.indexOf(mid2) ] ) {
        return -1;
      } else {
        return 1;
      }
    });
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
      this._smetadata_set_position();
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
    if ( this.d.store.file[this.fid].type === _VIA_FILE_TYPE.VIDEO ) {
      z[0] = this.file_html_element.currentTime;
    }
    // set default attributes
    var av = this._metadata_get_default_attribute_values();

    // if a temporal segment is selected, we add this to the metadata
    if ( this.va.temporal_segmenter ) {
      if ( this.va.temporal_segmenter.selected_gindex !== -1 ) {
        av[ this.va.temporal_segmenter.groupby_aid ] = this.va.temporal_segmenter.selected_gid;
      }
    }

    this.d.metadata_add(this.vid, z, xy, av).then( function(ok) {
      ok_callback(ok.mid);
    }.bind(this), function(err) {
      console.warn(err);
      err_callback();
    }.bind(this));
  }.bind(this));
}

_via_file_annotator.prototype._metadata_get_default_attribute_values = function() {
  var av = {};
  var aid_list = this.d._cache_get_attribute_group(['FILE1_Z1_XY1',
                                                    'FILE1_Z0_XY1']);

  if ( Object.keys(aid_list).length) {
    for ( var aindex in aid_list ) {
      var aid = aid_list[aindex];
      if ( this.d.store.attribute[aid].hasOwnProperty('default_option_id') ) {
        if ( this.d.store.attribute[aid]['default_option_id'] !== '' ) {
          av[aid] = this.d.store.attribute[aid]['default_option_id'];
        }
      }
    }
  }
  return av;
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
  case _VIA_RSHAPE.RECTANGLE:
  case _VIA_RSHAPE.CIRCLE:
  case _VIA_RSHAPE.ELLIPSE:
    xy[1] = xy[1] + dx;
    xy[2] = xy[2] + dy;
    break;
  case _VIA_RSHAPE.EXTREME_RECTANGLE:
  case _VIA_RSHAPE.EXTREME_CIRCLE:
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
  case _VIA_RSHAPE.RECTANGLE:
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
  case _VIA_RSHAPE.EXTREME_RECTANGLE:
  case _VIA_RSHAPE.EXTREME_CIRCLE:
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
_via_file_annotator.prototype._creg_update = function(vid) {
  var mid;
  for ( var mindex in this.d.cache.mid_list[this.vid] ) {
    mid = this.d.cache.mid_list[this.vid][mindex];
    if ( this.d.store.metadata[mid].z.length === 0 &&
         this.d.store.metadata[mid].xy.length !== 0
       ) {
      this.creg[mid] = this._metadata_xy_to_creg(this.vid, mid);
    }
  }
}

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

  var t = this.file_html_element.currentTime;
  var mid;
  for ( var mindex in this.d.cache.mid_list[vid] ) {
    mid = this.d.cache.mid_list[vid][mindex];
    if ( this.d.store.metadata[mid].xy.length !== 0 ) {
      if ( this.d.store.metadata[mid].z.length === 0 ) {
        this.creg[mid] = this._metadata_xy_to_creg(vid, mid);
      } else {
        if ( Math.abs(this.d.store.metadata[mid].z[0] - t) < this.conf.SPATIAL_REGION_TIME_TOL ) {
          this.creg[mid] = this._metadata_xy_to_creg(vid, mid);
        }
      }
    }
  }
}

_via_file_annotator.prototype._creg_add = function(vid, mid) {
  this.creg[mid] = this._metadata_xy_to_creg(vid, mid);
}

_via_file_annotator.prototype._creg_clear = function() {
  this.rshapectx.clearRect(0, 0, this.rshape_canvas.width, this.rshape_canvas.height);
}

_via_file_annotator.prototype._creg_draw_all = function() {
  this._creg_clear();

  if ( this.d.store.config.ui['spatial_region_label_attribute_id'] === '' ) {
    for ( var mid in this.creg ) {
      this._creg_draw(mid);
    }
  } else {
    for ( var mid in this.creg ) {
      this._creg_draw(mid);
      this._creg_draw_label(mid);
    }
  }

  // file label: used for image pair annotation
  if ( this.file_label.length !== 0 ) {
    this._creg_draw_file_label();
  }
}

_via_file_annotator.prototype._creg_draw_file_label = function() {
  this.rshapectx.fillStyle = 'yellow';
  this.rshapectx.font = '16px mono';
  var label_width = this.rshapectx.measureText(this.file_label).width;
  this.rshapectx.fillText(this.file_label, this.rshape_canvas.width/2 - label_width/2, 20);
}

_via_file_annotator.prototype._creg_draw = function(mid) {
  var is_selected = this.selected_mid_list.includes(mid);
  this._draw(this.rshapectx, this.creg[mid], is_selected)
}

_via_file_annotator.prototype._creg_draw_label = function(mid) {
  if ( this.d.store.metadata[mid].av.hasOwnProperty(this.d.store.config.ui['spatial_region_label_attribute_id']) ) {
    var lx = this.creg[mid][1];
    var ly = this.creg[mid][2];

    var label = '';
    switch(this.d.store.attribute[this.d.store.config.ui['spatial_region_label_attribute_id']].type) {
    case _VIA_ATTRIBUTE_TYPE.RADIO:
    case _VIA_ATTRIBUTE_TYPE.SELECT:
    case _VIA_ATTRIBUTE_TYPE.CHECKBOX:
      var option_id = this.d.store.metadata[mid].av[this.d.store.config.ui['spatial_region_label_attribute_id']];
      label = this.d.store.attribute[this.d.store.config.ui['spatial_region_label_attribute_id']].options[option_id];
      break;
    case _VIA_ATTRIBUTE_TYPE.TEXT:
      label = this.d.store.metadata[mid].av[this.d.store.config.ui['spatial_region_label_attribute_id']];
      break;
    }

    if ( label === '' ) {
      return;
    }
    if ( label.length > _VIA_SPATIAL_REGION_LABEL_MAXLENGTH ) {
      label = label.substr(0, _VIA_SPATIAL_REGION_LABEL_MAXLENGTH) + '.';
    }

    //this.rshapectx.shadowColor = 'transparent';
    this.rshapectx.font = _VIA_SPATIAL_REGION_LABEL_FONT;
    var cw = this.rshapectx.measureText('M').width;
    var ch = 1.8 * cw;
    var bgnd_rect_width = cw * (label.length);
    if ( label.length === 1 ) {
      bgnd_rect_width = 2*bgnd_rect_width;
    }

    // draw background rectangle
    this.rshapectx.fillStyle = 'black';
    this.rshapectx.fillRect(Math.floor(lx),
                            Math.floor(ly - 1.1*ch),
                            Math.floor(bgnd_rect_width),
                            Math.floor(ch));
    // then, draw text over this background rectangle
    this.rshapectx.fillStyle = 'yellow';
    this.rshapectx.fillText(label,
                            Math.floor(lx + 0.5*cw),
                            Math.floor(ly - 0.35*ch));
  }
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
  case _VIA_RSHAPE.RECTANGLE:
    if ( cx > xy[1] && cx < (xy[1] + xy[3]) ) {
      if ( cy > xy[2] && cy < (xy[2] + xy[4]) ) {
        is_inside = true;
      }
    }
    break;
  case _VIA_RSHAPE.EXTREME_RECTANGLE:
    var rshape = this._extreme_to_rshape(xy, shape_id);
    if ( cx > rshape[1] && cx < (rshape[1] + rshape[3]) ) {
      if ( cy > rshape[2] && cy < (rshape[2] + rshape[4]) ) {
        is_inside = true;
      }
    }
    break;
  case _VIA_RSHAPE.CIRCLE:
    var dx = Math.abs(xy[1] - cx);
    var dy = Math.abs(xy[2] - cy);
    if ( Math.sqrt((dx * dx) + (dy * dy)) < xy[3] ) {
      is_inside = true;
    }
    break;
  case _VIA_RSHAPE.EXTREME_CIRCLE:
    var rshape = this._extreme_to_rshape(xy, shape_id);
    var dx = Math.abs(rshape[1] - cx);
    var dy = Math.abs(rshape[2] - cy);
    if ( Math.sqrt((dx * dx) + (dy * dy)) < rshape[3] ) {
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
  case _VIA_RSHAPE.RECTANGLE:
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
  case _VIA_RSHAPE.EXTREME_RECTANGLE:
  case _VIA_RSHAPE.EXTREME_CIRCLE:
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
  case _VIA_RSHAPE.RECTANGLE:
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
  case _VIA_RSHAPE.EXTREME_RECTANGLE:
  case _VIA_RSHAPE.EXTREME_CIRCLE:
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
}

_via_file_annotator.prototype._creg_select = function(mid) {
  this.selected_mid_list.push(mid);
}

_via_file_annotator.prototype._creg_select_multiple = function(mid_list) {
  var n = mid_list.length;
  if ( n > 0 ) {
    for ( var i = 0; i < n; ++i ) {
      this.selected_mid_list.push( mid_list[i] );
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
  }
}

_via_file_annotator.prototype._creg_select_none = function() {
  this.selected_mid_list = [];
}

_via_file_annotator.prototype._creg_select_all = function() {
  this.selected_mid_list = Object.keys(this.creg);
}

_via_file_annotator.prototype._creg_del_sel_regions = function() {
  this.d.metadata_delete_bulk( this.vid, this.selected_mid_list, true ).then( function(ok) {
    this._creg_select_none();
    this._smetadata_hide();
    this.user_input_pts = [];
    this._state_set( _VIA_RINPUT_STATE.IDLE );
  }.bind(this), function(err) {
    console.log(err);
  }.bind(this));
}

_via_file_annotator.prototype._creg_edge_minmax_dist_to_point = function(xy, px, py) {
  var shape_id = xy[0];
  var edge_pts = [];
  switch( shape_id ) {
  case _VIA_RSHAPE.POINT:
    edge_pts = [ xy[0], xy[1] ];
    break;
  case _VIA_RSHAPE.RECTANGLE:
    var w2 = xy[3] / 2.0;
    var h2 = xy[4] / 2.0;
    edge_pts = [xy[1], xy[2], xy[1] + w2, xy[2], xy[1] + xy[3], xy[2],
                xy[1] + xy[3], xy[2] + h2, xy[1] + xy[3], xy[2] + xy[4],
                xy[1] + w2, xy[2] + xy[4], xy[1], xy[2] + xy[4], xy[1], xy[2] + h2 ];
    break;
  case _VIA_RSHAPE.EXTREME_RECTANGLE:
    var exy = this._extreme_to_rshape(xy, shape_id);
    var w2 = exy[3] / 2.0;
    var h2 = exy[4] / 2.0;
    edge_pts = [exy[1], exy[2], exy[1] + w2, exy[2], exy[1] + exy[3], exy[2],
                exy[1] + exy[3], exy[2] + h2, exy[1] + exy[3], exy[2] + exy[4],
                exy[1] + w2, exy[2] + h2, exy[1], exy[2] + exy[4], exy[1], exy[2] + h2 ];
    break;
  case _VIA_RSHAPE.CIRCLE:
    edge_pts = [xy[1] + xy[3], xy[2], xy[1], xy[2] - xy[3],
                xy[1] - xy[3], xy[2], xy[1], xy[2] + xy[3] ]
    break;
  case _VIA_RSHAPE.EXTREME_CIRCLE:
    var exy = this._extreme_to_rshape(xy, shape_id);
    edge_pts = [exy[1] + exy[3], exy[2], exy[1], exy[2] - exy[3],
                exy[1] - exy[3], exy[2], exy[1], exy[2] + exy[3] ]
    break;
  case _VIA_RSHAPE.ELLIPSE:
    edge_pts = [xy[1] + xy[3], xy[2], xy[1], xy[2] - xy[4],
                xy[1] - xy[3], xy[2] - xy[4], xy[1], xy[2] + xy[4] ];
    break;
  case _VIA_RSHAPE.LINE:
    var w2 = (xy[3] + xy[1]) / 2.0;
    var h2 = (xy[4] + xy[2]) / 2.0;
    edge_pts = [ xy[1], xy[2], xy[1] + w2, xy[2] + h2, xy[3], xy[4] ];
    break;
  case _VIA_RSHAPE.POLYGON:
  case _VIA_RSHAPE.POLYLINE:
    edge_pts = xy.slice(1); // discard shape_id;
    break;
  default:
    console.warn('_via_file_annotator._draw() : shape_id=' + shape_id + ' not implemented');
  }
  var dist_minmax = [+Infinity, -Infinity];
  var dist, dx, dy;
  for(var i=0; i<edge_pts.length; i=i+2) {
    dx = Math.abs(edge_pts[i] - px);
    dy = Math.abs(edge_pts[i+1] - py);
    dist = Math.sqrt(dx*dx + dy*dy);
    if(dist < dist_minmax[0]) {
      dist_minmax[0] = dist;
    }
    if(dist > dist_minmax[1]) {
      dist_minmax[1] = dist;
    }
  }
  return dist_minmax;
}

//
// external event listener
//
_via_file_annotator.prototype._on_event_metadata_add = function(data, event_payload) {
  var vid = event_payload.vid;
  var mid = event_payload.mid;
  if ( this.vid === vid &&
       this.d.store.metadata[mid].xy.length !== 0 ) {
    // spatial region was added, but added to what?
    if ( this.d.store.metadata[mid].z.length === 1 ) {
      // spatial region in a video frame was added
      this.va.temporal_segmenter._tmetadata_boundary_add_spatial_mid(mid);
      this._creg_add(vid, mid);
      this._creg_draw_all();
    } else {
      // spatial region in an image was added
      this._creg_add(vid, mid);
      this._creg_draw_all();
    }
  }
}

_via_file_annotator.prototype._on_event_metadata_delete_bulk = function(data, event_payload) {
  var vid = event_payload.vid;
  var mid_list = event_payload.mid_list;
  for ( var mindex in mid_list ) {
    var mid = mid_list[mindex];
    if ( this.vid === vid && this.va.temporal_segmenter ) {
      this.va.temporal_segmenter._tmetadata_boundary_del_spatial_mid(mid);
    }
  }
  this._creg_add_current_frame_regions(this.vid);
  this._creg_draw_all();
}

_via_file_annotator.prototype._on_event_metadata_update = function(data, event_payload) {
  var vid = event_payload.vid;
  var mid = event_payload.mid;
  if ( this.vid === vid &&
       this.d.store.metadata[mid].xy.length
     ) {
    this._creg_add(vid, mid);
    this._creg_draw_all();
  }
}

_via_file_annotator.prototype._on_event_view_update = function(data, event_payload) {
  var vid = event_payload.vid;

  if ( this.vid === vid ) {
    this._creg_reload();
  }
}

_via_file_annotator.prototype._on_event_attribute_update = function(data, event_payload) {
  this._fmetadata_show();
}

_via_file_annotator.prototype._on_event_attribute_del = function(data, event_payload) {
  this._fmetadata_show();
}

//
// temp. regions
//
_via_file_annotator.prototype._tmpreg_draw_region = function(shape_id, pts) {
  var xy = this._metadata_pts_to_xy(shape_id, pts);

  this._draw(this.temprctx, xy);
}

_via_file_annotator.prototype._tmpreg_draw_crosshair = function(cx, cy) {
  // draw cross hair in complementary colours
  this.temprctx.lineWidth = 1;
  this.temprctx.strokeStyle = this.conf.CROSSHAIR_COLOR1;
  this.temprctx.beginPath();
  this.temprctx.moveTo(0, cy - 0.5);
  this.temprctx.lineTo(this.tempr_canvas.width, cy - 0.5);
  this.temprctx.moveTo(cx - 0.5, 0);
  this.temprctx.lineTo(cx - 0.5, this.tempr_canvas.height);
  this.temprctx.stroke();

  this.temprctx.strokeStyle = this.conf.CROSSHAIR_COLOR2;
  this.temprctx.beginPath();
  this.temprctx.moveTo(0, cy + 0.5);
  this.temprctx.lineTo(this.tempr_canvas.width, cy + 0.5);
  this.temprctx.moveTo(cx + 0.5, 0);
  this.temprctx.lineTo(cx + 0.5, this.tempr_canvas.height);
  this.temprctx.stroke();
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
  case _VIA_RSHAPE.RECTANGLE:
    this._draw_rect_region(ctx, xy[1], xy[2], xy[3], xy[4], is_selected );
    break;
  case _VIA_RSHAPE.EXTREME_RECTANGLE:
    this._draw_extreme_rectangle_region(ctx, xy, is_selected );
    break;
  case _VIA_RSHAPE.CIRCLE:
    this._draw_circle_region(ctx, xy[1], xy[2], xy[3], is_selected );
    break;
  case _VIA_RSHAPE.EXTREME_CIRCLE:
    this._draw_extreme_circle_region(ctx, xy, is_selected );
    break;
  case _VIA_RSHAPE.ELLIPSE:
    this._draw_ellipse_region(ctx, xy[1], xy[2], xy[3], xy[4], is_selected );
    break;
  case _VIA_RSHAPE.EXTREME_BOX:
    this._draw_extreme_box_region(ctx, xy, is_selected);
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

_via_file_annotator.prototype._extreme_to_rshape = function(xy, shape_id) {
  var n = xy.length;
  switch(shape_id) {
  case _VIA_RSHAPE.EXTREME_RECTANGLE:
    var x0 = xy[1];
    var y0 = xy[2];
    var x1 = xy[1];
    var y1 = xy[2];
    for ( var i = 3; i < n; i = i + 2 ) {
      if ( xy[i] < x0 ) {
        x0 = xy[i];
      }
      if ( xy[i] > x1 ) {
        x1 = xy[i];
      }
      if ( xy[i+1] < y0 ) {
        y0 = xy[i+1];
      }
      if ( xy[i+1] > y1 ) {
        y1 = xy[i+1];
      }
    }
    //console.log(JSON.stringify(xy) + ' : ' + JSON.stringify([x0,x1,y0,y1]));
    return [shape_id, x0, y0, (x1-x0), (y1-y0)];
    break;
  case _VIA_RSHAPE.EXTREME_CIRCLE:
    // let (cx,cy) be center of circle and r be the radius
    // assuming xy[x1,y1,x2,y2,x3,y3] contains three non-collinear points (x1,y1), (x2,y2) and (x3,y3)
    // distance between center and 1st point = d1 = (cx - xy[0])^2 + (cy - xy[1])^2
    // distance between center and 2nd point = d2 = (cx - xy[2])^2 + (cy - xy[3])^2
    // distance between center and 3rd point = d3 = (cx - xy[4])^2 + (cy - xy[5])^2
    // we solve for (cx,cy) using the equations: d1 = d2 = d3
    var xy2 = [0, Math.pow(xy[1],2), Math.pow(xy[2],2), Math.pow(xy[3],2), Math.pow(xy[4],2), Math.pow(xy[5],2), Math.pow(xy[6],2) ];
    var cy = ( ( ( xy2[3] + xy2[4] - xy2[1] - xy2[2]) * (xy[1] - xy[5]) ) - ( (xy2[1] + xy2[2] - xy2[5] - xy2[6]) * (xy[3] - xy[1]) ) ) / ( 2 * ( ( (xy[4] - xy[2]) * (xy[1] - xy[5]) ) - ( (xy[2] - xy[6]) * (xy[3] - xy[1]) ) ) );
    var cx = ( (xy2[1] + xy2[2] - xy2[5] - xy2[6]) - 2 * cy * (xy[2] - xy[6]) ) / ( 2 * (xy[1] - xy[5]) );
    var r = Math.sqrt( Math.pow(cx - xy[1], 2) + Math.pow(cy - xy[2], 2) );
    return [shape_id, cx, cy, r];
  default:
    return [];
  }
}

_via_file_annotator.prototype._draw_extreme_rectangle_region = function(ctx, xy, is_selected) {
  var n = xy.length;
  var ebox = this._extreme_to_rshape(xy, _VIA_RSHAPE.EXTREME_RECTANGLE);

  if ( is_selected ) {
    ctx.strokeStyle = this.conf.SEL_REGION_BOUNDARY_COLOR;
    ctx.lineWidth   = this.conf.SEL_REGION_LINE_WIDTH;
    this._draw_rect(ctx, ebox[1], ebox[2], ebox[3], ebox[4]);
    ctx.stroke();

    ctx.fillStyle   = this.conf.SEL_REGION_FILL_COLOR;
    ctx.globalAlpha = this.conf.SEL_REGION_FILL_OPACITY;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  } else {
    ctx.strokeStyle = this.conf.REGION_BOUNDARY_COLOR;
    ctx.lineWidth   = this.conf.REGION_LINE_WIDTH;
    this._draw_rect(ctx, ebox[1], ebox[2], ebox[3], ebox[4]);
    ctx.stroke();
  }

  // draw control points
  var cp = this._creg_get_control_points(xy); // cp[0] = shape_id
  var n = cp.length;
  for ( var i = 1; i < n; i = i + 2 ) {
    this._draw_control_point(ctx, cp[i], cp[i+1]);
  }
}

_via_file_annotator.prototype._draw_extreme_circle_region = function(ctx, xy, is_selected) {
  var n = xy.length;
  if ( n === 7 ) {
  var ebox = this._extreme_to_rshape(xy, _VIA_RSHAPE.EXTREME_CIRCLE);
    if ( is_selected ) {
      ctx.strokeStyle = this.conf.SEL_REGION_BOUNDARY_COLOR;
      ctx.lineWidth   = this.conf.SEL_REGION_LINE_WIDTH;
      this._draw_circle(ctx, ebox[1], ebox[2], ebox[3]);
      ctx.stroke();

      ctx.fillStyle   = this.conf.SEL_REGION_FILL_COLOR;
      ctx.globalAlpha = this.conf.SEL_REGION_FILL_OPACITY;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    } else {
      ctx.strokeStyle = this.conf.REGION_BOUNDARY_COLOR;
      ctx.lineWidth   = this.conf.REGION_LINE_WIDTH;
      this._draw_circle(ctx, ebox[1], ebox[2], ebox[3]);
      ctx.stroke();
    }
  }

  // draw control points
  var cp = this._creg_get_control_points(xy); // cp[0] = shape_id
  var n = cp.length;
  for ( var i = 1; i < n; i = i + 2 ) {
    this._draw_control_point(ctx, cp[i], cp[i+1]);
  }
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
  if ( this.d.store.file[this.fid].type === _VIA_FILE_TYPE.VIDEO ||
       this.d.store.file[this.fid].type === _VIA_FILE_TYPE.AUDIO
     ) {
    if ( this.d.store.file[this.fid].type === _VIA_FILE_TYPE.VIDEO ) {
      this.file_html_element.removeAttribute('controls');
    }
    // _via_util_msg_show('At any time, press <span class="key">Space</span> to play or pause the video.');
  }
}

_via_file_annotator.prototype._rinput_disable = function() {
  this._state_set(_VIA_RINPUT_STATE.SUSPEND);
  this.input.style.pointerEvents = 'none';
  this.input.classList.remove('rinput_enabled');
  if ( this.d.store.file[this.fid].type === _VIA_FILE_TYPE.VIDEO ||
       this.d.store.file[this.fid].type === _VIA_FILE_TYPE.AUDIO
     ) {
    this.file_html_element.setAttribute('controls', 'true');
    //_via_util_msg_show('At any time, press <span class="key">Space</span> to play or pause the video.', true);
  }
}

//
// on-screen file metadata editor
//
_via_file_annotator.prototype._fmetadata_hide = function() {
  this.fmetadata_container.classList.add('hide');
}

_via_file_annotator.prototype._fmetadata_set_position = function() {
  var x = this.left_pad + this.conf.FILE_METADATA_MARGIN;
  var y = this.conf.FILE_METADATA_MARGIN;

  this.fmetadata_container.style.left = Math.round(x) + 'px';
  this.fmetadata_container.style.top  = Math.round(y) + 'px';
}

_via_file_annotator.prototype._fmetadata_toggle = function() {
  this.d.store.config.ui['file_metadata_editor_visible'] = ! this.d.store.config.ui['file_metadata_editor_visible'];
  this._fmetadata_show();
}

_via_file_annotator.prototype._fmetadata_show = function() {
  if ( ! this.d.cache.attribute_group.hasOwnProperty('FILE1_Z0_XY0') ) {
    this.fmetadata_container.innerHTML = '';
    this._fmetadata_hide();
    return;
  }

  var aid_list = this.d.cache.attribute_group['FILE1_Z0_XY0'];
  if ( Object.keys(aid_list).length === 0 ) {
    this.fmetadata_container.innerHTML = '';
    this._fmetadata_hide();
  } else {
    this.fmetadata_container.classList.remove('hide');
    if ( this.d.store.config.ui['file_metadata_editor_visible'] ) {
      var mid_list = this.d.cache.mid_list[this.vid];
      var file_mid = '';
      for ( var mindex in this.d.cache.mid_list[this.vid] ) {
        var mid = this.d.cache.mid_list[this.vid][mindex];
        if ( this.d.store.metadata[mid].z.length === 0 &&
             this.d.store.metadata[mid].xy.length === 0
           ) {
          file_mid = mid;
          break;
        }
      }

      if ( file_mid === '' ) {
        // create a new metadata
        this.d.metadata_add(this.vid, [], [], {}).then( function(ok) {
          this._fmetadata_update(ok.mid);
        }.bind(this), function(err) {
          console.log('failed to show file metadata!');
          console.log(err);
        }.bind(this));
      } else {
        this._fmetadata_update(file_mid);
      }
    } else {
      this.fmetadata_container.innerHTML = '';
      this.fmetadata_container.appendChild(this._fmetadata_toggle_button());
    }

    this._fmetadata_set_position();
  }
}

_via_file_annotator.prototype._fmetadata_toggle_button = function() {
  var span = document.createElement('span');
  span.setAttribute('class', 'text_button');
  if ( this.d.store.config.ui['file_metadata_editor_visible'] ) {
    span.innerHTML = '&larr;';
    span.setAttribute('title', 'Hide (i.e. minimise) file metadata editor');
  } else {
    span.innerHTML = '&rarr;';
    span.setAttribute('title', 'Show file metadata editor (to edit properties of a file like caption, author, etc.)');
  }
  span.addEventListener('click', this._fmetadata_toggle.bind(this));
  return span;
}

_via_file_annotator.prototype._fmetadata_update = function(mid) {
  var aid_list = this.d.cache.attribute_group['FILE1_Z0_XY0'];
  var table = document.createElement('table');
  var header = this._metadata_header_html(aid_list);
  var th = document.createElement('th');
  th.setAttribute('rowspan', '2');
  th.appendChild(this._fmetadata_toggle_button());
  header.appendChild(th)
  table.appendChild(header);

  // show value of each attribute
  var tbody = document.createElement('tbody');
  var tr = document.createElement('tr');
  tr.setAttribute('data-mid', mid);

  var aid;
  for ( var aindex in aid_list ) {
    aid = aid_list[aindex];
    var td = document.createElement('td');
    td.setAttribute('data-aid', aid);
    td.appendChild( this._metadata_attribute_io_html_element(mid, aid) );
    tr.appendChild(td);
  }
  var td = document.createElement('td');
  tr.appendChild(td); // empty row for control buttons

  tbody.appendChild(tr);
  table.appendChild(tbody);

  this.fmetadata_container.innerHTML = '';
  this.fmetadata_container.appendChild(table);
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
  case _VIA_RSHAPE.CIRCLE:
    y = y + this.creg[mid][3];
    break;
  case _VIA_RSHAPE.RECTANGLE:
  case _VIA_RSHAPE.ELLIPSE:
    y = y + this.creg[mid][4];
    break;
  case _VIA_RSHAPE.POLYGON:
  case _VIA_RSHAPE.POLYLINE:
  case _VIA_RSHAPE.EXTREME_RECTANGLE:
  case _VIA_RSHAPE.EXTREME_CIRCLE:
  case _VIA_RSHAPE.LINE:
    var ymax_x = this.creg[mid][1];
    var ymax = this.creg[mid][2];
    var n = this.creg[mid].length;
    for ( var i = 4; i < n; i = i + 2 ) {
      if ( this.creg[mid][i] > ymax ) {
        ymax = this.creg[mid][i];
        ymax_x = this.creg[mid][i-1];
      }
    }
    y = ymax + this.conf.REGION_SMETADATA_MARGIN;
    x = ymax_x + this.conf.REGION_SMETADATA_MARGIN;
    break;
  }
  this.smetadata_container.style.left = Math.round(x) + 'px';
  this.smetadata_container.style.top  = Math.round(y) + 'px';
}

_via_file_annotator.prototype._smetadata_toggle = function() {
  this.d.store.config.ui['spatial_metadata_editor_visible'] = ! this.d.store.config.ui['spatial_metadata_editor_visible'];
  this._smetadata_show();
}

_via_file_annotator.prototype._smetadata_toggle_button = function() {
  var span = document.createElement('span');
  span.setAttribute('class', 'text_button');
  if ( this.d.store.config.ui['spatial_metadata_editor_visible'] ) {
    span.innerHTML = '&larr;';
    span.setAttribute('title', 'Hide (i.e. minimise) spatial metadata editor');
  } else {
    span.innerHTML = '&rarr;';
    span.setAttribute('title', 'Show spatial metadata editor (to edit properties of a spatial region)');
  }
  span.addEventListener('click', this._smetadata_toggle.bind(this));
  return span;
}

_via_file_annotator.prototype._smetadata_show = function() {
  if ( this.selected_mid_list.length === 1 ) {
    this.smetadata_container.classList.remove('hide');
    this._smetadata_update();
    this._smetadata_set_position();
  } else {
    this._smetadata_hide();
  }
}

_via_file_annotator.prototype._smetadata_update = function() {
  var aid_list = this.d._cache_get_attribute_group(['FILE1_Z1_XY1',
                                                    'FILE1_Z0_XY1',
                                                    'FILE1_Z2_XY0']);
  if ( Object.keys(aid_list).length === 0 ) {
    // no attributes to display
    this.smetadata_container.innerHTML = '';
    this._smetadata_hide();
    return;
  }

  if ( this.d.store.config.ui['spatial_metadata_editor_visible'] ) {
    var table = document.createElement('table');
    var header = this._metadata_header_html(aid_list);
    var th = document.createElement('th');
    th.setAttribute('rowspan', '2');
    th.appendChild(this._smetadata_toggle_button());
    header.appendChild(th)
    table.appendChild(header);

    // show value of each attribute
    var tbody = document.createElement('tbody');
    var tr = document.createElement('tr');
    tr.setAttribute('data-mid', mid);

    var mid = this.selected_mid_list[0];
    var aid;
    for ( var aindex in aid_list ) {
      aid = aid_list[aindex];
      var td = document.createElement('td');
      td.setAttribute('data-aid', aid);
      td.appendChild( this._metadata_attribute_io_html_element(mid, aid) );
      tr.appendChild(td);
    }
    var td = document.createElement('td');
    tr.appendChild(td); // empty row for control buttons

    tbody.appendChild(tr);
    table.appendChild(tbody);

    this.smetadata_container.innerHTML = '';
    this.smetadata_container.appendChild(table);
  } else {
    this.smetadata_container.innerHTML = '';
    this.smetadata_container.appendChild(this._smetadata_toggle_button());
  }
}

_via_file_annotator.prototype._metadata_header_html = function(aid_list) {
  var tr = document.createElement('tr');
  var aid;
  for ( var aindex in aid_list ) {
    aid = aid_list[aindex];
    var th = document.createElement('th');
    th.innerHTML = this.d.store.attribute[aid].aname;
    tr.appendChild(th);
  }
  return tr;
}

_via_file_annotator.prototype._metadata_on_change = function(e) {
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
    //console.log( JSON.stringify(this.d.store.metadata[ok.mid].av) );
  }.bind(this));
}

_via_file_annotator.prototype._metadata_attribute_io_html_element = function(mid, aid) {
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
    el.addEventListener('change', this._metadata_on_change.bind(this));
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
    el.addEventListener('change', this._metadata_on_change.bind(this));
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
      radio.addEventListener('change', this._metadata_on_change.bind(this));
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

    console.log(dval)
    console.log(aval)
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
      checkbox.addEventListener('change', this._metadata_on_change.bind(this));
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
