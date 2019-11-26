/**
 *
 * @class
 * @classdesc View manager
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 5 Apr. 2019
 *
 */

'use strict';

function _via_group_manager(data, group_annotator, container) {
  this._ID = '_via_group_manager_';
  this.d = data;
  this.ga = group_annotator;
  this.c = container;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  _via_event.call( this );

  this.d.on_event('project_loaded', this._ID, this._on_event_project_loaded.bind(this));
  this.d.on_event('project_updated', this._ID, this._on_event_project_updated.bind(this));

  this.ga.on_event('group_show', this._ID, this._on_event_group_show.bind(this));
  this.ga.on_event('group_by', this._ID, this._on_event_group_by.bind(this));
  this._init_ui_elements();
}

_via_group_manager.prototype._init = function() {
  this._init_ui_elements();
}

_via_group_manager.prototype._init_ui_elements = function() {
  this.pname = document.createElement('input');
  this.pname.setAttribute('type', 'text');
  this.pname.setAttribute('id', 'via_project_name_input');
  this.pname.setAttribute('value', this.d.store.project.pname);
  this.pname.setAttribute('title', 'Project Name (click to update)');
  this.pname.addEventListener('change', this._on_pname_change.bind(this));

  var group_values_label = document.createElement('span');
  group_values_label.innerHTML = '&nbsp;&nbsp;Video group&nbsp;';

  var prev_gname = _via_util_get_svg_button('micon_navigate_prev', 'Switch to Previous Group Value', 'show_prev');
  prev_gname.addEventListener('click', this._group_show_prev.bind(this));

  var next_gname = _via_util_get_svg_button('micon_navigate_next', 'Switch to Next Group Value', 'show_next');
  next_gname.addEventListener('click', this._group_show_next.bind(this));
  this.group_name_selector = document.createElement('select');
  this.group_name_selector.setAttribute('class', 'group_name_selector');
  this.group_name_selector.addEventListener('change', this._on_group_name_update.bind(this));
  this.c.innerHTML = '';
  this.c.appendChild(this.pname);
  this.c.appendChild(group_values_label);
  this.c.appendChild(this.group_name_selector);
  this.c.appendChild(prev_gname);
  this.c.appendChild(next_gname);
}

//
// UI elements change listeners
//
_via_group_manager.prototype._on_pname_change = function(e) {
  this.d.store.project.pname = e.target.value.trim();
}

_via_group_manager.prototype._on_group_selector_change = function(e) {
  var group_by_aid = e.target.options[e.target.selectedIndex].value;
  this.ga.group_by(group_by_aid);
}

_via_group_manager.prototype._on_event_project_loaded = function(data, event_payload) {
  this._init_ui_elements();
}

_via_group_manager.prototype._on_event_project_updated = function(data, event_payload) {
}

_via_group_manager.prototype._on_event_group_by = function(data, event_payload) {
  this.group_name_selector.innerHTML = '';
  for (var group_name_index in this.ga.group_name_list) {
    var oi = document.createElement('option');
    oi.setAttribute('value', group_name_index);
    oi.innerHTML = this.ga.group_name_list[group_name_index];
    this.group_name_selector.appendChild(oi);
  }
}

_via_group_manager.prototype._on_event_group_show = function(data, event_payload) {
  this.group_name_selector.selectedIndex = event_payload.group_name_index;
}

_via_group_manager.prototype._group_show_prev = function(data, event_payload) {
  var prev_group_name_index = this.ga.current_group_name_index - 1;
  if ( prev_group_name_index < 0 ) {
    prev_group_name_index = this.ga.group_name_list.length - 1;
  }
  this.ga.group_show( this.ga.group_name_list[prev_group_name_index] );
}

_via_group_manager.prototype._group_show_next = function(data, event_payload) {
  var next_group_name_index = this.ga.current_group_name_index + 1;
  if ( next_group_name_index >= this.ga.group_name_list.length ) {
    next_group_name_index = 0;
  }
  this.ga.group_show( this.ga.group_name_list[next_group_name_index] );
}

_via_group_manager.prototype._on_group_name_update = function() {
  var new_group_name_index = this.group_name_selector.selectedIndex;
  this.ga.group_show( this.ga.group_name_list[new_group_name_index] );
}
