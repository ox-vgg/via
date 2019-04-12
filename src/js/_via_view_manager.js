/**
 *
 * @class
 * @classdesc View manager
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 5 Apr. 2019
 *
 */

'use strict';

function _via_view_manager(data, view_annotator, container) {
  this.d = data;
  this.va = view_annotator;
  this.c = container;

  this.view_selector_vid_list = [];
  var is_view_filtered_by_regex = false;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this.event_prefix = '_via_view_manager_';
  _via_event.call( this );

  this.va.on_event('view_show', this._on_event_view_show.bind(this));

  this._init_ui_elements();
}

_via_view_manager.prototype._init = function() {
  this._view_selector_update();
}

_via_view_manager.prototype._init_ui_elements = function() {
  this.pname = document.createElement('input');
  this.pname.setAttribute('type', 'text');
  this.pname.setAttribute('class', 'pname');
  this.pname.setAttribute('value', this.d.store.project.pname);
  this.pname.setAttribute('title', 'Project Name (click to update)');
  this.pname.addEventListener('change', this._on_pname_change.bind(this));

  this.view_selector = document.createElement('select');
  this.view_selector.setAttribute('class', 'view_selector');
  this.view_selector.setAttribute('title', 'Select a file for annotation');
  this.view_selector.addEventListener('change', this._on_view_selector_change.bind(this));

  this.view_filter_regex = document.createElement('input');
  this.view_filter_regex.setAttribute('type', 'text');
  this.view_filter_regex.setAttribute('class', 'view_filter_regex');
  this.view_filter_regex.setAttribute('title', 'Filter file list');
  this.view_filter_regex.setAttribute('placeholder', 'Search');
  this.pname.addEventListener('change', this._on_view_filter_regex_change.bind(this));

  this.next_view = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  this.next_view.setAttributeNS(null, 'class', 'svg_button');
  this.next_view.setAttributeNS(null, 'viewBox', '0 0 24 24');
  var next_view_use_element = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  next_view_use_element.setAttributeNS(null, 'href', '#micon_navigate_next');
  this.next_view.appendChild(next_view_use_element);
  var next_view_title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
  next_view_title.innerHTML = 'Show Next File';
  this.next_view.appendChild(next_view_title);
  this.next_view.addEventListener('click', this._on_next_view.bind(this));

  this.prev_view = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  this.prev_view.setAttributeNS(null, 'class', 'svg_button');
  this.prev_view.setAttributeNS(null, 'viewBox', '0 0 24 24');
  var prev_view_use_element = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  prev_view_use_element.setAttributeNS(null, 'href', '#micon_navigate_prev');
  this.prev_view.appendChild(prev_view_use_element);
  var prev_view_title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
  prev_view_title.innerHTML = 'Show Prev File';
  this.prev_view.appendChild(prev_view_title);
  this.prev_view.addEventListener('click', this._on_prev_view.bind(this));

  this.c.innerHTML = '';
  this.c.appendChild(this.pname);
  this.c.appendChild(this.view_selector);
  this.c.appendChild(this.view_filter_regex);
  this.c.appendChild(this.prev_view);
  this.c.appendChild(this.next_view);
}

//
// UI elements change listeners
//
_via_view_manager.prototype._on_pname_change = function() {
  this.d.store.project.pname = this.pname.getAttribute('value').trim();
}

_via_view_manager.prototype._on_view_selector_change = function(e) {
  var vid = e.target.options[e.target.selectedIndex].value;
  this.va.view_show(vid)
}

_via_view_manager.prototype._on_view_filter_regex_change = function() {
}

_via_view_manager.prototype._on_next_view = function() {
  console.log('next')
}

_via_view_manager.prototype._on_prev_view = function() {
  console.log('prev')
}

_via_view_manager.prototype._on_event_view_show = function(data, event_payload) {
  var vid = event_payload.vid.toString();
  var view_selector_vid = this.view_selector.options[this.view_selector.selectedIndex].value;
  if ( vid !== view_selector_vid ) {
    // ensure that the view selector shows the view being displayed
    var n = this.view_selector.options.length;
    for ( var i = 0; i < n; ++i ) {
      if ( this.view_selector.options[i].value === vid ) {
        this.view_selector.selectedIndex = i;
        break;
      }
    }
  }
}

//
// View Selector
//
_via_view_manager.prototype._view_selector_clear = function() {
  this.view_selector.innerHTML = '';
  this.vid_list = [];
}

_via_view_manager.prototype._view_selector_option_html = function(vindex, vid) {
  var file_count = this.d.store.view[vid].f.length;
  var filename_list = [];
  var fid;
  for ( var i = 0; i < file_count; ++i ) {
    fid = this.d.store.view[vid].f[i];
    filename_list.push(this.d.store.file[fid].fname);
  }
  var view_name = filename_list.join(', ');

  var oi = document.createElement('option');
  oi.setAttribute('value', vid);
  oi.innerHTML = '[' + (parseInt(vindex)+1) + '] ' + decodeURI(view_name);
  return oi;
}

_via_view_manager.prototype._view_selector_update = function() {
  if ( this.is_view_filtered_by_regex ) {
    this._view_selector_update_regex();
  } else {
    this._view_selector_update_showall();
  }
}

_via_view_manager.prototype._view_selector_update_regex = function(regex) {
  if ( regex === '' ||
       typeof(regex) === 'undefined'
     ) {
    this._view_selector_update_showall();
  } else {
    this._view_selector_clear();
    var i, uri;
    var fid, uri, src;
    var findex;
    for ( findex in this.d.fid_list ) {
      fid = this.d.fid_list[findex];
      src = this.d.file_store[fid].src;
      if ( src.match(regex) !== null ) {
        this.view_selector.appendChild( this._view_selector_html_element(findex, fid) );
        this.view_selector_fid_list.push(fid);
      }
    }
    this.is_view_selector_regex_active = true;
  }
}

_via_view_manager.prototype._view_selector_update_showall = function() {
  this._view_selector_clear();
  console.log(this.d.store)
  console.log(this.d.store.vid_list);
  console.log(this.d.store.fid_list);
  console.log(this.d.store.aid_list);

  var vid;
  var vindex;
  for ( vindex in this.d.store.vid_list ) {
    vid = this.d.store.vid_list[vindex];
    this.view_selector.appendChild( this._view_selector_option_html(vindex, vid) );
    this.view_selector_vid_list.push(vid);
  }

  this.is_view_filtered_by_regex = false;
}
