/**
 *
 * @class
 * @classdesc VIA MRI Stenosis Annotator
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 24 May 2019
 *
 */

'use strict'

function _via(via_container) {
  console.log('Initializing VGG Image Annotator (VIA) version ' + _VIA_VERSION)
  this._VIA_PROJECT_DS_URI = 'http://zeus.robots.ox.ac.uk/via/ds/mri_stenosis_may2019/'
  this.via_container = via_container;

  this.d  = new _via_data();

  var conf = { 'ENDPOINT': _VIA_REMOTE_STORE };
  this.s  = new _via_share(this.d, conf);

  //var action_map = { 'via_page_button_signin':this._page_on_action_signin.bind(this) };
  //_via_util_page_show('page_mri_stenosis_home', action_map);
  var action_map = { 'via_page_button_open_shared': this._page_on_action_open_shared.bind(this) };
  _via_util_page_show('page_share_open_shared', action_map);

  // debug code (disabled for release)
  if ( typeof(_VIA_DEBUG) === 'undefined' || _VIA_DEBUG === true ) {
    /*
    this.d.store = _via_dp[0]['store'];
    this.d._cache_update();
    setTimeout( function() {
      this.va.view_show('1');
      //this.editor.show();
    }.bind(this), 200);
    */
  }

  //// define the html containers
  this.control_panel_container = document.createElement('div');
  this.control_panel_container.setAttribute('id', 'via_control_panel_container');
  this.via_container.appendChild(this.control_panel_container);

  this.view_container = document.createElement('div');
  this.view_container.setAttribute('id', 'view_container');
  this.via_container.appendChild(this.view_container);

  this.message_container = document.createElement('div');
  this.message_container.setAttribute('id', '_via_message_container');
  this.message_container.setAttribute('class', 'message_container');
  this.message_container.addEventListener('click', _via_util_msg_hide);
  this.message_panel = document.createElement('div');
  this.message_panel.setAttribute('id', '_via_message');
  this.message_container.appendChild(this.message_panel);
  this.via_container.appendChild(this.message_container);

  //// initialise content creators and managers
  this.va = new _via_view_annotator(this.d, this.view_container);

  this.view_manager_container = document.createElement('div');
  this.vm = new _via_view_manager(this.d, this.va, this.view_manager_container);
  this.vm._init();

  // control panel shows the view_manager_container
  this.cp = new _via_control_panel(this.control_panel_container, this);

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
  }
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

_via.prototype._page_on_action_open_shared = function(d) {
  if ( d._action_id === 'via_page_button_open_shared' ) {
    if ( d.via_page_input_pid.length === 36) {
      this.s.pull(d.via_page_input_pid);
    } else {
      _via_util_msg_show('You must enter a valid clinician-id');
    }
  }
}

_via.prototype.prevent_accidental_close = function() {
  // warn user of possible loss of data
  window.onbeforeunload = function (e) {
    e = e || window.event;

    // For IE and Firefox prior to version 4
    if (e) {
      e.returnValue = 'Did you save your annotations?';
    }

    // For Safari
    return 'Did you save your annotations?';
  };
}
