/**
 *
 * @class
 * @classdesc VIA Project
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 18 Jan. 2019
 *
 */

'use strict';

function _via_project(container, data, annotator) {
  this.c = container;
  this.d = data;
  this.a = annotator;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this.event_prefix = '_via_project_';
  _via_event.call( this );

  // attach event listeners
  this.a.on_event('file_show', this._on_file_show.bind(this));

  this._init();
}

_via_project.prototype._init = function() {
  this.info = document.createElement('table');
  var tbody = document.createElement('tbody');
  this.info.appendChild(tbody);

  var tr_name = document.createElement('tr');
  var td_name_label = document.createElement('td');
  var label = document.createElement('label');
  label.setAttribute('for', 'project_name');
  label.innerHTML = 'Project';
  td_name_label.appendChild(label);

  var td_name_input = document.createElement('td');
  this.input_project_name = document.createElement('input');
  this.input_project_name.setAttribute('name', 'project_name');
  this.input_project_name.setAttribute('type', 'text');
  this.input_project_name.setAttribute('placeholder', 'Enter name of this project');
  td_name_input.appendChild(this.input_project_name);
  tr_name.appendChild(td_name_label);
  tr_name.appendChild(td_name_input);
  tbody.appendChild(tr_name);

  this.filelist = document.createElement('ol');
  this.filelist_container = document.createElement('div');
  this.filelist_container.setAttribute('class', 'filelist_container');
  this.filelist_regex = document.createElement('input');
  this.filelist_regex.setAttribute('placeholder', 'Filter file list');
  this.filelist_regex.addEventListener('input', this.on_filelist_regex.bind(this));

  this.filelist_container.appendChild(this.filelist_regex);
  this.filelist_container.appendChild(this.filelist);

  this.tools = document.createElement('div');
  this.tools.setAttribute('class', 'tools');
  var addbtn1 = document.createElement('button');
  addbtn1.setAttribute('class', 'text_button');
  addbtn1.innerHTML = 'Add URL';
  var addbtn2 = document.createElement('button');
  addbtn2.setAttribute('class', 'text_button');
  addbtn2.innerHTML = 'Add Local';
  var delbtn = document.createElement('button');
  delbtn.setAttribute('class', 'text_button');
  delbtn.innerHTML = 'Delete';
  this.tools.appendChild(addbtn1);
  this.tools.appendChild(addbtn2);
  this.tools.appendChild(delbtn);

  this.project = document.createElement('div');
  this.project.setAttribute('class', 'project');
  this.project.appendChild(this.info);
  //this.project.appendChild(this.filter);
  this.project.appendChild(this.filelist_container);
  this.project.appendChild(this.tools);
  this.c.appendChild(this.project);

  // trigger update of filelist (for the first time)
  this._update_filelist();
}

_via_project.prototype._clear_filelist = function() {
  this.filelist.innerHTML = '';
}

_via_project.prototype._filelist_html_element = function(fid) {
  var li = document.createElement('li');
  li.setAttribute('data-fid', fid);
  li.setAttribute('title', this.d.file_store[fid].uri);
  li.addEventListener('click', this._switch_to_file.bind(this));
  if ( this.d.has_file(fid) ) {
    li.innerHTML = '[' + (fid+1) + '] ' + this.d.file_store[fid].uri;
  }

  if ( typeof(this.a.now.file) !== 'undefined' ) {
    if ( this.a.now.file.id === fid ) {
      li.classList.add('sel');
    }
  }

  return li;
}

_via_project.prototype._update_filelist_regex = function(regex) {
  this._clear_filelist();
  var i, uri;
  for ( i = 0; i < this.d.file_store.length; ++i ) {
    uri = this.d.file_store[i].uri;
    if ( uri.match(regex) !== null ) {
      this.filelist.appendChild( this._filelist_html_element(i) );
    }
  }
}

_via_project.prototype._update_filelist = function() {
  this._clear_filelist();
  this.filelist_regex.value = '';
  var i;
  for ( i = 0; i < this.d.file_store.length; ++i ) {
    this.filelist.appendChild( this._filelist_html_element(i) );
  }
}

_via_project.prototype._switch_to_file = function(el) {
  var fid = el.target.dataset.fid;
  this.a.file_show_fid(fid);
}

_via_project.prototype._on_file_show = function(data, event_payload) {
  /*
  var current_fid = event_payload.id.toString();
  var n = this.filelist.childNodes.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    if ( this.filelist.childNodes[i].dataset.fid === current_fid ) {
      this.filelist.childNodes[i].classList.add('current_file');
      console.log('added to ')
      console.log(this.filelist.childNodes[i])
    } else {
      if ( this.filelist.childNodes[i].classList.contains('current_file') ) {
        this.filelist.childNodes[i].classList.remove('current_file');
      }
    }
  }
  */
  // @todo: recompute is not need when you know the current_fid!
  this._update_filelist();
}

_via_project.prototype.on_filelist_regex = function(el) {
  this._update_filelist_regex(el.target.value);
}
