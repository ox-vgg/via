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
  this._VIA_PROJECT_DS_URI = ''
  this.via_container = via_container;

  this.d  = new _via_data();

  // debug code (disabled for release)
  if ( false ) {
    this.d.store = _via_dp[0]['store'];
    this.d._cache_update();

    setTimeout( function() {
      this.va.view_show('1');
      //this.editor.show();
    }.bind(this), 200);
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
  this.cp = new _via_control_panel(this.control_panel_container, this.d, this.va, this.vm);

  // keyboard event handlers
  //this.via_container.focus()
  //this.via_container.addEventListener('keydown', this._keydown_handler.bind(this));
  window.addEventListener('keydown', this._keydown_handler.bind(this)); // @todo: should be attached only to VIA application container

  // update VIA version number
  var el = document.getElementById('via_info_page_container');
  var pages = el.getElementsByClassName('info_page');
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

_via.prototype.save_remote = function(username) {
  if ( ! this.couchdb_id || ! this.couchdb_rev ) {
    _via_util_msg_show('Upload feature not available!', true);
    return;
  }

  var username = document.getElementById('remote_push_username').value;
  username = username.trim();
  if ( username === '' ) {
    _via_util_msg_show('To upload, you must enter your username!', true);
    return;
  }
  var constraint = new RegExp("^([a-z0-9]{5,})$");
  if ( ! constraint.test(username) ) {
    _via_util_msg_show('Username must be 5 characters long and cannot contain spaces or special characters.', true);
    return;
  }

  var commit_msg = [];
  commit_msg.push(username);
  if ( this._store_list.hasOwnProperty('localStorage') ) {
    commit_msg.push( this._store_list['localStorage'].BROWSER_ID_VALUE );
  } else {
    commit_msg.push('unknown');
  }
  commit_msg.push( new Date().toJSON() );
  commit_msg.push(this.couchdb_rev);
  this.project_store['update_history'].push( commit_msg.join(',') );

  var data = {
    'project_store':this.project_store,
    'metadata_store':this.metadata_store,
    'attribute_store':this.attribute_store,
    'aid_list':this.aid_list,
    'file_store':this.file_store,
    'fid_list':this.fid_list,
    'file_mid_store':this.file_mid_store,
  };

  var uri = this._VIA_PROJECT_DS_URI + this.couchdb_id + '?rev=' + this.couchdb_rev;
  var xhr = new XMLHttpRequest();
  xhr.open('PUT', uri);
  xhr.addEventListener('error', function(e) {
    _via_util_msg_show('Failed to upload!', true);
  }.bind(this));
  xhr.addEventListener('abort', function(e) {
    _via_util_msg_show('Upload aborted!', true);
    err_callback(false);
  }.bind(this));
  xhr.addEventListener('load', function(e) {
    switch(xhr.statusText) {
    case 'Created':
    case 'Accepted':
      try {
        var response = JSON.parse(xhr.responseText);
        if ( response.ok ) {
          this.couchdb_rev = response.rev;
          this.couchdb_id = response.id;
          var revision = this.couchdb_rev.split('-')[0];
          _via_util_msg_show('Upload successful (revision = ' + revision + ')', true);
        } else {
          _via_util_msg_show('Upload failed. Please report this: ' + xhr.responseText + ')', true);
        }
      }
      catch(e) {
        _via_util_msg_show('Malformed server response. Please report this: ' + xhr.responseText, true);
      }
      break;
    default:
      _via_util_msg_show('Upload failed with response [' + xhr.statusText + ': ' + xhr.responseText + ']', true);
      break;
    }
  }.bind(this));
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.send( JSON.stringify(data) );
}
