function _via_control_panel(control_panel_container, data, view_annotator) {
  this.c = control_panel_container;
  this.d = data;
  this.va = view_annotator;

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

  this._add_spacer();

  this._add_project_tools();

  this._add_spacer();

  this.view_manager_container = document.createElement('div');
  this.c.appendChild(this.view_manager_container);

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
    _via_util_show_info_page('page_keyboard_shortcut');
  }.bind(this));
  this.c.appendChild(keyboard);

  var help = _via_util_get_svg_button('micon_help', 'About VIA');
  help.addEventListener('click', function() {
    _via_util_show_info_page('page_about');
  }.bind(this));
  this.c.appendChild(help);
}

_via_control_panel.prototype._add_spacer = function() {
  var spacer = document.createElement('div');
  spacer.setAttribute('class', 'spacer');
  this.c.appendChild(spacer);
}

_via_control_panel.prototype._add_region_shape_selector = function() {
  this.shape_selector = document.createElement('div');

  var point = _via_util_get_svg_button('shape_point', 'Point', 'POINT');
  point.addEventListener('click', function() {
    this._set_region_shape('POINT');
  }.bind(this));
  this.shape_selector.appendChild(point);

  var rect = _via_util_get_svg_button('shape_rectangle', 'Rectangle', 'RECTANGLE');
  rect.addEventListener('click', function() {
    this._set_region_shape('RECTANGLE');
  }.bind(this));
  this.shape_selector.appendChild(rect);

  var circle = _via_util_get_svg_button('shape_circle', 'Circle', 'CIRCLE');
  circle.addEventListener('click', function() {
    this._set_region_shape('CIRCLE');
  }.bind(this));
  this.shape_selector.appendChild(circle);

  var ellipse = _via_util_get_svg_button('shape_ellipse', 'Ellipse', 'ELLIPSE');
  ellipse.addEventListener('click', function() {
    this._set_region_shape('ELLIPSE');
  }.bind(this));
  this.shape_selector.appendChild(ellipse);

  var line = _via_util_get_svg_button('shape_line', 'Line', 'LINE');
  line.addEventListener('click', function() {
    this._set_region_shape('LINE');
  }.bind(this));
  this.shape_selector.appendChild(line);

  var polygon = _via_util_get_svg_button('shape_polygon', 'Polygon', 'POLYGON');
  polygon.addEventListener('click', function() {
    this._set_region_shape('POLYGON');
  }.bind(this));
  this.shape_selector.appendChild(polygon);

  var polyline = _via_util_get_svg_button('shape_polyline', 'Polyline', 'POLYLINE');
  polyline.addEventListener('click', function() {
    this._set_region_shape('POLYLINE');
  }.bind(this));
  this.shape_selector.appendChild(polyline);
  this.c.appendChild(this.shape_selector);
}

_via_control_panel.prototype._set_region_shape = function(shape) {
  this.emit_event( 'region_shape', {'shape':shape});
  var shapes = this.shape_selector.getElementsByTagName('svg');
  for ( var si in shapes ) {
    if ( shapes[si].classList.contains('svg_button') ) {
      if ( shapes[si].getAttribute('id') === shape ) {
        shapes[si].classList.add('svg_button_selected');
      } else {
        shapes[si].classList.remove('svg_button_selected');
      }
      console.log(shapes[si])
    }
  }
}

_via_control_panel.prototype._add_project_tools = function() {
  this.project_tools = document.createElement('div');
  var load = _via_util_get_svg_button('micon_open', 'Open a VIA Project');
  load.addEventListener('click', function() {
    _via_util_file_select_local(_VIA_FILE_TYPE.JSON, this._project_load_on_local_file_select.bind(this), false);
  }.bind(this));
  this.project_tools.appendChild(load);

  var save = _via_util_get_svg_button('micon_save', 'Save current VIA Project');
  save.addEventListener('click', function() {
    this.d.project_save();
  }.bind(this));
  this.project_tools.appendChild(save);

  var export_annotation = _via_util_get_svg_button('micon_export', 'Export Annotations (as CSV)');
  export_annotation.addEventListener('click', function() {
    this.d.project_export_csv();
  }.bind(this));
  this.project_tools.appendChild(export_annotation);

  this.c.appendChild(this.project_tools);
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

