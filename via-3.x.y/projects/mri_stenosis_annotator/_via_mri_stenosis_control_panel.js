/**
 *
 * @class
 * @classdesc VIA Control Panel
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 16 May 2019
 *
 */

function _via_control_panel(control_panel_container, data, view_annotator, view_manager, via) {
  this.c = control_panel_container;
  this.d = data;
  this.va = view_annotator;
  this.vm = view_manager;
  this.via = via;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_control_panel_';
  _via_event.call( this );

  this._init();
}

_via_control_panel.prototype._init = function(type) {
  this.c.innerHTML = '';

  var logo_panel = document.createElement('div');
  logo_panel.setAttribute('class', 'logo');
  logo_panel.innerHTML = '<a href="http://www.robots.ox.ac.uk/~vgg/software/via/" title="VGG Image Annotator (VIA)" target="_blank">VIA</a>'
  this.c.appendChild(logo_panel);

  this.c.appendChild(this.vm.c);
  this._add_spacer();

  this._add_view_manager_tools();

  this._add_spacer();
  var save = _via_util_get_svg_button('micon_save', 'Save Annotations');
  save.addEventListener('click', function() {
    this.via.save_remote();
  }.bind(this));
  this.c.appendChild(save);

  this._add_spacer();
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
  var prev_view = _via_util_get_svg_button('micon_navigate_prev', 'Show Prev Image Pair (or, press left arrow key)', 'show_prev');
  prev_view.addEventListener('click', this.vm._on_prev_view.bind(this.vm));
  this.c.appendChild(prev_view);

  this._add_spacer();

  var next_view = _via_util_get_svg_button('micon_navigate_next', 'Show Next Image Pair (or, press right arrow key)', 'show_next');
  next_view.addEventListener('click', this.vm._on_next_view.bind(this.vm));
  this.c.appendChild(next_view);
}
