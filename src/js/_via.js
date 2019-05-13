/**
 *
 * @class
 * @classdesc VIA
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 12 May 2019
 *
 */

'use strict'

function _via(via_container) {
  this.via_container = via_container;

  this.d  = new _via_data();

  if ( false ) { // debug
    this.d.store = _via_dp[2]['store'];
    console.log(this.d.store)
    this.d._cache_update();

    setTimeout( function() {
      this.va.view_show(1);
      this.editor.show();
    }.bind(this), 1000);
  }

  //// define the html containers
  this.control_panel_container = document.createElement('div');
  this.control_panel_container.setAttribute('id', 'via_control_panel_container');
  this.via_container.appendChild(this.control_panel_container);

  this.view_container = document.createElement('div');
  this.view_container.setAttribute('id', 'view_container');
  this.via_container.appendChild(this.view_container);

  this.editor_container = document.createElement('div');
  this.editor_container.setAttribute('id', 'editor_container');
  this.editor_container.classList.add('hide');
  this.via_container.appendChild(this.editor_container);

  this.message_container = document.createElement('div');
  this.message_container.setAttribute('id', '_via_message_container');
  this.message_container.setAttribute('class', 'message_container');
  this.message_container.setAttribute('click', '_via_util_msg_hide()');
  this.message_panel = document.createElement('div');
  this.message_panel.setAttribute('id', '_via_message');
  this.message_container.appendChild(this.message_panel);
  this.via_container.appendChild(this.message_container);

  //// initialise content creators and managers
  this.va = new _via_view_annotator(this.d, this.view_container);
  this.editor = new _via_editor(this.d, this.va, this.editor_container);

  this.cp = new _via_control_panel(this.control_panel_container, this.d);

  // Note: view_manager_container is contained in control panel and therefore initialised by control panel
  this.vm = new _via_view_manager(this.d, this.va, this.cp.view_manager_container);
  this.vm._init();

  // event handlers for buttons in the control panel
  this.cp.on_event('region_shape', function(data, event_payload) {
    this.va.set_region_draw_shape(event_payload.shape);
  }.bind(this));
  this.cp.on_event('editor_toggle', function(data, event_payload) {
    this.editor.toggle();
  }.bind(this));
}

_via.prototype._hook_on_browser_resize = function() {
  this.va.view_show(this.vid);
}

