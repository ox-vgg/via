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
  var conf = { 'ENDPOINT': _VIA_REMOTE_STORE };
  this.s  = new _via_share(this.d, conf);

  if ( typeof(_VIA_DEBUG) === 'undefined' || _VIA_DEBUG === true ) {
    // ADD DEBUG CODE HERE (IF NEEDED)
  }

  //// define the html containers
  this.control_panel_container = document.createElement('div');
  this.control_panel_container.setAttribute('id', 'via_control_panel_container');
  this.via_container.appendChild(this.control_panel_container);

  this.group_container = document.createElement('div');
  this.group_container.setAttribute('id', 'group_container');
  this.via_container.appendChild(this.group_container);

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

  this.ga = new _via_group_annotator(this.d, this.group_container);

  this.group_manager_container = document.createElement('div');
  this.gm = new _via_group_manager(this.d, this.ga, this.group_manager_container);
  this.gm._init();

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
  } else {
    // debug code (disabled for release)
    if ( typeof(_VIA_DEBUG) === 'undefined' || _VIA_DEBUG === true ) {
      this.d.project_load_json(_via_dp[0]['store']); // group annotation
      setTimeout( function() {
        this.ga.group_by('1');
      }.bind(this), 200);
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
    console.log('_via._keydown_handler(): @todo');
  }
}
