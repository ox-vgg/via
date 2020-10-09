/**
 * @class
 * @classdesc Manages video and audio file for subtitle annotator
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 9 Oct. 2020
 */

'use strict';

function _via_file_annotator(view_annotator, data, vid, file_label, container) {
  this._ID = '_via_file_annotator_';
  this.va = view_annotator;
  this.d = data;
  this.vid = vid;
  this.file_label = file_label;
  this.c = container;

  this.last_paused_time = 0.0;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  _via_event.call( this );

  this._init();
}

_via_file_annotator.prototype._init = function() {
  if ( this.d.store.view[this.vid].fid_list.length !== 1 ) {
    console.warn('_via_file_annotator() can only operate on a single file!');
    return;
  }

  if ( ! this.d.store.config.ui.hasOwnProperty('file_metadata_editor_visible') ) {
    this.d.store.config.ui['file_metadata_editor_visible'] = true;
  }
  if ( ! this.d.store.config.ui.hasOwnProperty('spatial_metadata_editor_visible') ) {
    this.d.store.config.ui['spatial_metadata_editor_visible'] = true;
  }

  this.fid = this.d.store.view[this.vid].fid_list[0];
}

_via_file_annotator.prototype._file_load_show_error_page = function() {
  this.c.innerHTML = '';
  var page = document.createElement('div');
  page.setAttribute('class', 'error_page');

  var title = document.createElement('h1');
  title.innerHTML = 'File Not Found!';
  page.appendChild(title);

  var msg = document.createElement('p');
  msg.innerHTML = 'File "<code>' + this.d.file_get_uri(this.fid) + '</code>" not found. ';
  msg.innerHTML += 'VIA application will automatically reload this file when you update one of the properties below.';
  page.appendChild(msg);

  var table = document.createElement('table');
  var filename_row = document.createElement('tr');
  var filename_label = document.createElement('td');
  filename_label.innerHTML = 'Filename';
  var filename_cell = document.createElement('td');
  var filename_input = document.createElement('input');
  filename_input.setAttribute('type', 'text');
  filename_input.setAttribute('value', this.d.store.file[this.fid].fname);
  filename_input.setAttribute('data-pname', 'fname');
  filename_input.addEventListener('change', this._file_on_attribute_update.bind(this));
  filename_cell.appendChild(filename_input);
  filename_row.appendChild(filename_label);
  filename_row.appendChild(filename_cell);
  page.appendChild(filename_row);

  var filetype_row = document.createElement('tr');
  var filetype_label = document.createElement('td');
  filetype_label.innerHTML = 'File Type';
  filetype_row.appendChild(filetype_label);
  var filetype_select = document.createElement('select');
  filetype_select.setAttribute('data-pname', 'type');
  filetype_select.addEventListener('change', this._file_on_attribute_update.bind(this));

  for ( var filetype in _VIA_FILE_TYPE ) {
    var oi = document.createElement('option');
    oi.setAttribute('value', _VIA_FILE_TYPE[filetype]);
    oi.innerHTML = filetype;
    if ( this.d.store.file[this.fid].type === _VIA_FILE_TYPE[filetype] ) {
      oi.setAttribute('selected', '');
    }
    filetype_select.appendChild(oi);
  }
  var filetype_select_cell = document.createElement('td');
  filetype_select_cell.appendChild(filetype_select);
  filetype_row.appendChild(filetype_select_cell);
  page.appendChild(filetype_row);

  var fileloc_row = document.createElement('tr');
  var fileloc_label = document.createElement('td');
  fileloc_label.innerHTML = 'File Location';
  fileloc_row.appendChild(fileloc_label);
  var fileloc_select = document.createElement('select');
  fileloc_select.setAttribute('data-pname', 'loc');
  fileloc_select.addEventListener('change', this._file_on_attribute_update.bind(this));
  for ( var fileloc in _VIA_FILE_LOC ) {
    var oi = document.createElement('option');
    oi.setAttribute('value', _VIA_FILE_LOC[fileloc]);
    oi.innerHTML = fileloc;
    if ( this.d.store.file[this.fid].loc === _VIA_FILE_LOC[fileloc] ) {
      oi.setAttribute('selected', '');
    }
    fileloc_select.appendChild(oi);
  }
  var fileloc_cell = document.createElement('td');
  fileloc_cell.appendChild(fileloc_select);
  if ( this.d.store.file[this.fid].loc !== _VIA_FILE_LOC.LOCAL ) {
    var fileloc = this.d.store.file[this.fid].loc;
    var locprefix_input = document.createElement('input');
    locprefix_input.setAttribute('type', 'text');
    locprefix_input.setAttribute('value', this.d.store.config.file.loc_prefix[fileloc]);
    locprefix_input.setAttribute('data-pname', 'loc_prefix');
    locprefix_input.setAttribute('title', 'Location prefix (or path) that will be automatically added to file locations. For example, if you add "http://www.mysite.com/data/images/" as the location prefix, all your images will be sourced from this site.');
    locprefix_input.addEventListener('change', this._file_on_attribute_update.bind(this));
    fileloc_cell.appendChild(locprefix_input);
  }
  fileloc_row.appendChild(fileloc_cell);
  page.appendChild(fileloc_row);

  var filesrc_row = document.createElement('tr');
  var filesrc_label = document.createElement('td');
  filesrc_label.innerHTML = 'File Source';
  filesrc_row.appendChild(filesrc_label);
  var filesrc_input;
  if ( this.d.store.file[this.fid].loc === _VIA_FILE_LOC.LOCAL ) {
    filesrc_input = document.createElement('input');
    filesrc_input.setAttribute('type', 'file');
    if ( this.d.file_ref[this.fid] ) {
      filesrc_input.setAttribute('files', [ this.d.file_ref[this.fid] ]);
    }
  } else {
    if ( this.d.store.file[this.fid].loc === _VIA_FILE_LOC.INLINE ) {
      filesrc_input = document.createElement('textarea');
      filesrc_input.setAttribute('rows', 5);
      filesrc_input.setAttribute('cols', 100);
      filesrc_input.innerHTML = this.d.store.file[this.fid].src;
    } else {
      filesrc_input = document.createElement('input');
      filesrc_input.setAttribute('type', 'text');
      filesrc_input.setAttribute('value', this.d.store.file[this.fid].src)
    }
  }
  filesrc_input.setAttribute('data-pname', 'src');
  filesrc_input.addEventListener('change', this._file_on_attribute_update.bind(this));
  var filesrc_cell = document.createElement('td');
  filesrc_cell.appendChild(filesrc_input);
  filesrc_row.appendChild(filesrc_cell);
  page.appendChild(filesrc_row);

  // control buttons
  var bpanel = document.createElement('p');
  var reload = document.createElement('button');
  reload.innerHTML = 'Reload File';
  reload.addEventListener('click', function() {
    this.va.view_show(this.vid);
  }.bind(this));
  bpanel.appendChild(reload);
  page.appendChild(bpanel);

  this.c.appendChild(page);
}

_via_file_annotator.prototype._file_on_attribute_update = function(e) {
  var pname = e.target.dataset.pname;
  var pvalue = '';
  switch(pname) {
  case 'loc_prefix':
  case 'fname':
    pvalue = e.target.value;
    break;
  case 'type':
  case 'loc':
    pvalue = parseInt(e.target.options[e.target.selectedIndex].value);
    break;
  case 'src':
    if ( this.d.store.file[this.fid].loc === _VIA_FILE_LOC.LOCAL ) {
      if ( e.target.files.length ) {
        pvalue = e.target.files[0];
      }
    } else {
      if ( this.d.store.file[this.fid].loc === _VIA_FILE_LOC.INLINE ) {
        pvalue = e.target.innerHTML;
      } else {
        pvalue = e.target.value;
      }
    }
    break;
  }

  this.d.file_update(this.fid, pname, pvalue).then( function(ok) {
    this.va.view_show(this.vid);
  }.bind(this), function(err) {
    _via_util_msg_show('Failed to update properties of file: ' + err );
  }.bind(this));
}

_via_file_annotator.prototype._file_load = function() {
  return new Promise( function(ok_callback, err_callback) {
    this.file_html_element = this._file_create_html_element();
    this.file_html_element.setAttribute('title', this.d.store.file[this.fid].fname);
    var file_src = this.d.file_get_src(this.d.store.file[this.fid].fid);
    if ( file_src === '' ) {
      this.d.file_free_resources(this.fid);
      this._file_load_show_error_page();
      err_callback();
      return;
    } else {
      this.file_html_element.setAttribute('src', file_src);
    }

    this.file_html_element.addEventListener('load', function() {
      //console.log('load:' + this.fid + ', now freeing resources')
      this._file_html_element_ready();
      ok_callback();
    }.bind(this));
    this.file_html_element.addEventListener('loadeddata', function() {
      //console.log('loaddata:' + this.fid + ', now freeing resources')
      this._file_html_element_ready();
      ok_callback();
    }.bind(this));
    this.file_html_element.addEventListener('abort', function(e) {
      //console.log('abort:' + this.fid + ', now freeing resources')
      _via_util_msg_show('Failed to load file [' + this.d.store.file[this.fid].fname + '] (' + e + ')' );
      this._file_load_show_error_page();
      err_callback();
    }.bind(this));
    this.file_html_element.addEventListener('stalled', function(e) {
      //console.log('stalled:' + this.fid + ', now freeing resources')
      _via_util_msg_show('Failed to load file [' + this.d.store.file[this.fid].fname + '] (' + e + ')' );
      this._file_load_show_error_page();
      err_callback();
    }.bind(this));
    this.file_html_element.addEventListener('error', function(e) {
      //console.log('error:' + this.fid + ', now freeing resources')
      _via_util_msg_show('Failed to load file [' + this.d.store.file[this.fid].fname + '] (' + e + ')' );
      this._file_load_show_error_page();
      err_callback();
    }.bind(this));
  }.bind(this));
}

_via_file_annotator.prototype._file_create_html_element = function() {
  var media;
  switch( this.d.store.file[this.fid].type ) {
  case _VIA_FILE_TYPE.VIDEO:
    media = document.createElement('video');
    media.setAttribute('controls', 'true');
    media.setAttribute('playsinline', 'true');
    media.setAttribute('loop', 'false');
    //media.setAttribute('crossorigin', 'anonymous');
    // @todo : add subtitle track for video
    media.setAttribute('preload', 'auto');
    //media.addEventListener('suspend', this._file_html_element_error.bind(this));
    media.addEventListener('pause', function(e) {
      this.last_paused_time = media.currentTime;
    }.bind(this));
    break;

  case _VIA_FILE_TYPE.IMAGE:
    media = document.createElement('img');
    break;

  case _VIA_FILE_TYPE.AUDIO:
    media = document.createElement('audio');
    media.setAttribute('controls', '');
    // @todo : add subtitle track for video
    media.setAttribute('preload', 'auto');
    break;

  default:
    console.warn('unknown file type = ' + this.d.store.file[this.fid].type);
  }
  return media;
}

_via_file_annotator.prototype._file_html_element_compute_scale = function() {
  var maxh = this.c.clientHeight;
  var maxw = this.c.clientWidth;

  // original size of the content
  var cw0, ch0;
  switch( this.d.store.file[this.fid].type ) {
  case _VIA_FILE_TYPE.VIDEO:
    cw0 = this.file_html_element.videoWidth;
    ch0 = this.file_html_element.videoHeight;
    break;
  case _VIA_FILE_TYPE.IMAGE:
    cw0 = this.file_html_element.naturalWidth;
    ch0 = this.file_html_element.naturalHeight;
    break;

  case _VIA_FILE_TYPE.AUDIO:
    this.left_pad = 0;
    this.file_html_element_size_css = '';
    return;
    break;
  }

  var ar = cw0/ch0;
  var ch = maxh;
  var cw = Math.floor(ar * ch);
  if ( cw > maxw ) {
    cw = maxw;
    ch = Math.floor(cw/ar);
  }
  this.cwidth = cw;
  this.cheight = ch;
  this.cscale = ch0/ch; // x  = cscale * cx
  this.fscale = 1 / this.cscale; // cx = fscale * x
  this.original_width = cw0;
  this.original_height = ch0;
  this.file_html_element_size_css = 'width:' + cw + 'px;height:' + ch + 'px;';

  switch( this.d.store.config.ui.file_content_align ) {
  case 'center':
    this.left_pad = Math.floor( (maxw - this.cwidth) / 2 );
    this.file_html_element_size_css += 'left:' + this.left_pad + 'px;';
    break;
  case 'right':
    this.left_pad = maxw - this.cwidth;
    this.file_html_element_size_css += 'left:' + this.left_pad + 'px;';
    break;
  default:
    this.file_html_element_size_css += 'left:0px;';
  }
}

//
// event listeners
//
_via_file_annotator.prototype._file_html_element_ready = function() {
  //_via_util_msg_show('Loaded file [' + this.d.store.file[this.fid].fname + ']' );
  this._file_html_element_compute_scale();
  this.file_html_element.setAttribute('style', this.file_html_element_size_css);
  this.file_html_element.setAttribute('id', 'file_content');
  this.c.appendChild(this.file_html_element);
}
