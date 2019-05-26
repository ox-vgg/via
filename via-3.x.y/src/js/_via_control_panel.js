/**
 *
 * @class
 * @classdesc VIA Control Panel
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 16 May 2019
 *
 */

function _via_control_panel(control_panel_container, data, view_annotator, view_manager, import_export) {
  this.c = control_panel_container;
  this.d = data;
  this.va = view_annotator;
  this.vm = view_manager;
  this.ie = import_export;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_control_panel_';
  _via_event.call( this );

  this._init();
}

_via_control_panel.prototype._init = function() {
  this.c.innerHTML = '';

  var logo_panel = document.createElement('div');
  logo_panel.setAttribute('class', 'logo');
  logo_panel.innerHTML = '<a href="http://www.robots.ox.ac.uk/~vgg/software/via/" title="VGG Image Annotator (VIA)" target="_blank">VIA</a>'
  this.c.appendChild(logo_panel);

  this.c.appendChild(this.vm.c);
  this._add_view_manager_tools();

  this._add_spacer();

  this._add_project_tools();

  this._add_spacer();

  this._add_region_shape_selector();

  this._add_spacer();

  var editor = _via_util_get_svg_button('micon_insertcomment', 'Show/Hide Attribute Editor');
  editor.addEventListener('click', function() {
    this.emit_event( 'editor_toggle', {});
  }.bind(this));
  this.c.appendChild(editor);

  this._add_spacer();

  this._add_project_share_tools();

  this._add_spacer();

  var keyboard = _via_util_get_svg_button('micon_keyboard', 'Keyboard Shortcuts');
  keyboard.addEventListener('click', function() {
    _via_util_page_show('page_keyboard_shortcut');
  }.bind(this));
  this.c.appendChild(keyboard);

  var help = _via_util_get_svg_button('micon_help', 'About VIA');
  help.addEventListener('click', function() {
    _via_util_page_show('page_about');
  }.bind(this));
  this.c.appendChild(help);
}

_via_control_panel.prototype._add_spacer = function() {
  var spacer = document.createElement('div');
  spacer.setAttribute('class', 'spacer');
  this.c.appendChild(spacer);
}

_via_control_panel.prototype._add_view_manager_tools = function() {
  var prev_view = _via_util_get_svg_button('micon_navigate_prev', 'Show Previous File', 'show_prev');
  prev_view.addEventListener('click', this.vm._on_prev_view.bind(this.vm));
  this.c.appendChild(prev_view);

  var next_view = _via_util_get_svg_button('micon_navigate_next', 'Show Next File', 'show_next');
  next_view.addEventListener('click', this.vm._on_next_view.bind(this.vm));
  this.c.appendChild(next_view);

  var add_media_local = _via_util_get_svg_button('micon_add_circle', 'Add Audio or Video File in Local Computer', 'add_media_local');
  add_media_local.addEventListener('click', this.vm._on_add_media_local.bind(this.vm));
  this.c.appendChild(add_media_local);

  var add_media_remote = _via_util_get_svg_button('micon_add_remote', 'Add Audio or Video File hosted at Remote Servers (e.g. http://)', 'add_media_remote');
  add_media_remote.addEventListener('click', this.vm._on_add_media_remote.bind(this.vm));
  this.c.appendChild(add_media_remote);

  var add_media_bulk = _via_util_get_svg_button('micon_lib_add', 'Bulk add file URI ( e.g. file:///... or http://... ) contained in a local CSV file where each row is a remote or local filename.', 'add_media_bulk');
  add_media_bulk.addEventListener('click', this.vm._on_add_media_bulk.bind(this.vm));
  this.c.appendChild(add_media_bulk);

  var del_view = _via_util_get_svg_button('micon_remove_circle', 'Remove the Current File', 'remove_media');
  del_view.addEventListener('click', this.vm._on_del_view.bind(this.vm));
  this.c.appendChild(del_view);
}

_via_control_panel.prototype._add_region_shape_selector = function() {
  if ( document.getElementById('shape_point') === null ) {
    return;
  }

  var point = _via_util_get_svg_button('shape_point', 'Point', 'POINT');
  point.addEventListener('click', function() {
    this._set_region_shape('POINT');
  }.bind(this));
  this.c.appendChild(point);

  var rect = _via_util_get_svg_button('shape_rectangle', 'Rectangle', 'RECTANGLE');
  rect.addEventListener('click', function() {
    this._set_region_shape('RECTANGLE');
  }.bind(this));
  this.c.appendChild(rect);

  var circle = _via_util_get_svg_button('shape_circle', 'Circle', 'CIRCLE');
  circle.addEventListener('click', function() {
    this._set_region_shape('CIRCLE');
  }.bind(this));
  this.c.appendChild(circle);

  var ellipse = _via_util_get_svg_button('shape_ellipse', 'Ellipse', 'ELLIPSE');
  ellipse.addEventListener('click', function() {
    this._set_region_shape('ELLIPSE');
  }.bind(this));
  this.c.appendChild(ellipse);

  var line = _via_util_get_svg_button('shape_line', 'Line', 'LINE');
  line.addEventListener('click', function() {
    this._set_region_shape('LINE');
  }.bind(this));
  this.c.appendChild(line);

  var polygon = _via_util_get_svg_button('shape_polygon', 'Polygon', 'POLYGON');
  polygon.addEventListener('click', function() {
    this._set_region_shape('POLYGON');
  }.bind(this));
  this.c.appendChild(polygon);

  var polyline = _via_util_get_svg_button('shape_polyline', 'Polyline', 'POLYLINE');
  polyline.addEventListener('click', function() {
    this._set_region_shape('POLYLINE');
  }.bind(this));

  this.c.appendChild(polyline);
  this.shape_selector_list = { 'POINT':point, 'RECTANGLE':rect, 'CIRCLE':circle, 'ELLIPSE':ellipse, 'LINE':line, 'POLYGON':polygon, 'POLYLINE':polyline };
}

_via_control_panel.prototype._set_region_shape = function(shape) {
  this.emit_event( 'region_shape', {'shape':shape});
  for ( var si in this.shape_selector_list ) {
    if ( si === shape ) {
      this.shape_selector_list[si].classList.add('svg_button_selected');
    } else {
      this.shape_selector_list[si].classList.remove('svg_button_selected');
    }
  }
}

_via_control_panel.prototype._add_project_tools = function() {
  var load = _via_util_get_svg_button('micon_open', 'Open a VIA Project');
  load.addEventListener('click', function() {
    _via_util_file_select_local(_VIA_FILE_TYPE.JSON, this._project_load_on_local_file_select.bind(this), false);
  }.bind(this));
  this.c.appendChild(load);

  var save = _via_util_get_svg_button('micon_save', 'Save current VIA Project');
  save.addEventListener('click', function() {
    this.d.project_save();
  }.bind(this));
  this.c.appendChild(save);

  var import_export_annotation = _via_util_get_svg_button('micon_import_export', 'Import or Export Annotations');
  import_export_annotation.addEventListener('click', this._page_show_import_export.bind(this));
  this.c.appendChild(import_export_annotation);
}

_via_control_panel.prototype._page_show_import_export = function(d) {
  var action_map = { 
                    'via_page_button_import':this._page_on_action_import.bind(this),
                    'via_page_button_export':this._page_on_action_export.bind(this),
                   }
  _via_util_page_show('page_import_export', action_map);
}

_via_control_panel.prototype._page_on_action_import = function(d) {
  if ( d._action_id === 'via_page_button_import' ) {
    if ( via_page_import_file.length ) {
      this.ie.import_from_file(d.via_page_import_format, via_page_import_file);
    } else {
      _via_util_msg_show('To import annotations, you must select a file which contains the annotations');
    }
  }
}

_via_control_panel.prototype._page_on_action_export = function(d) {
  if ( d._action_id === 'via_page_button_export' ) {
    this.ie.export_to_file(d.via_page_export_format);
  }
}

_via_control_panel.prototype._project_load_on_local_file_select = function(e) {
  if ( e.target.files.length === 1 ) {
    _via_util_load_text_file(e.target.files[0], this._project_load_on_local_file_read.bind(this));
  }
}

_via_control_panel.prototype._project_load_on_local_file_read = function(project_data_str) {
  this.d.project_load(project_data_str);
}

_via_control_panel.prototype._add_project_share_tools = function() {
  this.project_share_tools = document.createElement('div');
  this.c.appendChild(this.project_share_tools);
}

