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
  this._ID = '_via';

  console.log('Initializing VGG Image Annotator (VIA) version ' + _VIA_VERSION)
  this.via_container = via_container;

  this.d  = new _via_data();
  this.SUBTITLE_AID = '1';
  // add new attribute for subtitle
  this.d['store']['attribute'][this.SUBTITLE_AID] = {'aname':'subtitle', 'anchor_id':'FILE1_Z2_XY0', 'type':1, 'desc':'Subtitle text', 'options':{}, 'default_option_id':'' };

  var conf = { 'ENDPOINT': _VIA_REMOTE_STORE };
  this.s  = new _via_share(this.d, conf);

  if ( typeof(_VIA_DEBUG) === 'undefined' || _VIA_DEBUG === true ) {
    // ADD DEBUG CODE HERE (IF NEEDED)
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
  this.message_container.addEventListener('click', _via_util_msg_hide);
  this.message_panel = document.createElement('div');
  this.message_panel.setAttribute('id', '_via_message');
  this.message_container.appendChild(this.message_panel);
  this.via_container.appendChild(this.message_container);

  //// initialise content creators and managers
  this.ie = new _via_import_export(this.d);

  this.va = new _via_view_annotator(this.d, this.view_container);
  this.editor = new _via_editor(this.d, this.va, this.editor_container);

  this.view_manager_container = document.createElement('div');
  this.vm = new _via_view_manager(this.d, this.va, this.view_manager_container);
  this.vm._init();

  // control panel shows the view_manager_container
  this.cp = new _via_control_panel(this.control_panel_container, this);
  this.cp._set_region_shape('RECTANGLE');

  // event handlers for buttons in the control panel
  this.cp.on_event('region_shape', this._ID, function(data, event_payload) {
    this.va.set_region_draw_shape(event_payload.shape);
  }.bind(this));
  this.cp.on_event('editor_toggle', this._ID, function(data, event_payload) {
    this.editor.toggle();
  }.bind(this));

  // keyboard event handlers
  //this.via_container.focus()
  //this.via_container.addEventListener('keydown', this._keydown_handler.bind(this));
  window.addEventListener('keydown', this._keydown_handler.bind(this)); // @todo: should be attached only to VIA application container

  // update VIA version number
  var el = document.getElementById('via_page_container');
  var pages = el.getElementsByClassName('via_page');
  var n = pages.length;
  for ( var i = 0; i < n; ++i ) {
    if ( pages[i].dataset.pageid === 'page_about' ) {
      var content0 = pages[i].innerHTML;
      pages[i].innerHTML = content0.replace('__VIA_VERSION__', _VIA_VERSION);
    }
  }

  // load any external modules (e.g. demo) which should be defined as follows
  // function _via_load_submodules()
  if (typeof _via_load_submodules === 'function') {
    console.log('VIA submodule detected, invoking _via_load_submodules()');
    this._load_submodule = new Promise( function(ok_callback, err_callback) {
      try {
        _via_load_submodules.call(this);
      }
      catch(err) {
        console.warn('VIA submodule load failed: ' + err);
        err_callback(err);
      }
    }.bind(this));
  } else {
    // debug code (disabled for release)
    if ( typeof(_VIA_DEBUG) === 'undefined' || _VIA_DEBUG === true ) {
      //this.s.pull(''); // load shared project
    }
  }

  // ready
  _via_util_msg_show(_VIA_NAME + ' (' + _VIA_NAME_SHORT + ') ' + _VIA_VERSION + ' ready.');
}

_via.prototype._hook_on_browser_resize = function() {
  if ( typeof(this.va.vid) !== 'undefined' ) {
    this.va.view_show(this.va.vid);
  }
}

_via.prototype._keydown_handler = function(e) {
  // avoid handling events when text input field is in focus
  if ( e.target.type !== 'text' &&
       e.target.type !== 'textarea'
     ) {
    this.va._on_event_keydown(e);
  }
}
