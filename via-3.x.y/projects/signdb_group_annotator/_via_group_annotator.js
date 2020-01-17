/**
 * To perform annotation of groups of images, audio and video
 *
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 04 Nov. 2019
 *
 */

'use strict';

function _via_group_annotator(data, container ) {
  this._ID = '_via_group_annotator_';
  this.d = data;
  this.c = container;
  this.g = {};
  this.group_name_list = [];
  this.current_group_name_index = -1;
  this.group_by_aid = '';

  // pagination
  this.file_per_page = 3;
  this.current_page_no = -1;
  this.page_count = -1;
  this.group_file_count = -1;
  this.current_page_vid_list = [];
  this.current_page_mid_list = [];
  this.page_metadata_container = [];
  this.page_video_element_list = [];
  this.page_loop_video = false;
  this.page_tseg = {}; // temporal segment for each video
  this.page_tseg_context = 0.0; // context around each temporal segment (in sec)

  // video scrubber state
  this.is_scrubber_active = false;
  this.scrubber_x0 = -1;
  this.scrubber_y0 = -1;
  this.mousedown_x0 = -1;
  this.mousedown_y0 = -1;
  this.scrubber_canvas = null;
  this.scrubber_ctx = null;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  _via_event.call( this );

  this._init();
}

_via_group_annotator.prototype._init = function() {
  this.c.innerHTML = '';
}

_via_group_annotator.prototype.group_clear_all = function() {
}

_via_group_annotator.prototype.group_clear = function(aid) {
}

_via_group_annotator.prototype.group_by = function(aid, show_group_name, show_page_no) {
  this.group_by_aid = aid;
  this._group_collect_vid();
  this.emit_event('group_by', { 'aid':aid, 'group_name_list':this.group_name_list });
  if (this.group_name_list.length) {
    if( typeof(show_group_name) !== 'undefined' &&
        this.group_name_list.includes(show_group_name) ) {
      this.group_show(show_group_name, show_page_no);
    } else {
      this.group_show(this.group_name_list[0]);
    }
  }
}

_via_group_annotator.prototype._group_collect_vid = function() {
  this.g = {};
  this.group_name_list = [];
  for (var mid in this.d.store.metadata) {
    if (this.d.store.metadata[mid].av.hasOwnProperty(this.group_by_aid)) {
      var avalue = this.d.store.metadata[mid].av[this.group_by_aid];
      if ( !this.g.hasOwnProperty(avalue) ) {
        this.g[avalue] = [];
        this.group_name_list.push(avalue);
      }
      this.g[avalue].push( {'vid':this.d.store.metadata[mid].vid, 'mid':mid} );
    }
  }

  // sort the group_name_list
  this.group_name_list.sort();
}

_via_group_annotator.prototype.group_show = function(group_name, page_no) {
  this.c.innerHTML = '';
  this.scrubber_canvas = document.createElement('canvas');
  this.scrubber_canvas.setAttribute('id', 'scrubber_canvas');
  this.scrubber_canvas.classList.add('hide');
  this.c.appendChild(this.scrubber_canvas);

  this.page_count = Math.ceil(this.g[group_name].length / this.file_per_page);
  this.group_file_count = this.g[group_name].length;

  if ( typeof(page_no) === 'undefined' ||
       page_no === 0 ||
       page_no > (this.page_count - 1) ||
       page_no < 0
     ) {
    this.current_page_no = 0;
  } else {
    this.current_page_no = page_no;
  }

  this.current_group_name_index = this.group_name_list.indexOf(group_name);
  this._group_view_init_toolbar();

  var vindex_start = Math.max(0, this.current_page_no * this.file_per_page);
  var vindex_end = Math.min(vindex_start + this.file_per_page, this.g[group_name].length);

  this.d.file_object_uri_clear_all();
  this.current_page_vid_list = [];
  this.current_page_mid_list = [];
  this.page_metadata_container = [];
  this.page_tseg = {};
  for (var vindex in this.g[group_name]) {
    if(parseInt(vindex) >= vindex_start &&
       parseInt(vindex) < vindex_end) {
      var vid = this.g[group_name][vindex].vid;
      var mid = this.g[group_name][vindex].mid;
      if ( this.d.store.view[vid].fid_list.length === 1 ) {
        var fid = this.d.store.view[vid].fid_list[0];
        var file_container = this._group_view_init_file_container(vindex, fid, vid, mid);
        this.c.appendChild(file_container);
        this.current_page_vid_list.push(vid);
        this.current_page_mid_list.push(mid);
      }
    }
  }
  this.emit_event('group_show', { 'group_name_index':this.current_group_name_index });

  localStorage.setItem('pid', this.d.store.project.pid);
  localStorage.setItem('group_name', group_name);
  localStorage.setItem('page_no', this.current_page_no);
}

_via_group_annotator.prototype._group_view_init_toolbar = function(page_no, page_count) {
  var group_label = document.createElement('div');
  group_label.innerHTML = '';

  this.group_name_selector = document.createElement('select');
  this.group_name_selector.setAttribute('class', 'group_name_selector');
  this.group_name_selector.addEventListener('change', this._on_group_name_update.bind(this));
  for (var group_name_index in this.group_name_list) {
    var oi = document.createElement('option');
    oi.setAttribute('value', group_name_index);
    var group_name = this.group_name_list[group_name_index];
    var file_count = this.g[group_name].length;
    oi.innerHTML = 'Sign: ' + group_name + ' [' + file_count + ']';
    if(parseInt(group_name_index) === this.current_group_name_index) {
      oi.setAttribute('selected', 'selected');
    }
    this.group_name_selector.appendChild(oi);
  }

  var prev_gname = _via_util_get_svg_button('micon_navigate_prev',
                                            'Switch to Previous Group Value',
                                            'show_prev');
  prev_gname.addEventListener('click', this._group_show_prev.bind(this));

  var next_gname = _via_util_get_svg_button('micon_navigate_next',
                                            'Switch to Next Group Value',
                                            'show_next');
  next_gname.addEventListener('click', this._group_show_next.bind(this));
  var group_nav = document.createElement('div');
  group_nav.setAttribute('style', 'padding-left:0.5em;');
  group_nav.appendChild(group_label);
  group_nav.appendChild(prev_gname);
  group_nav.appendChild(this.group_name_selector);
  group_nav.appendChild(next_gname);

  var group_metadata = document.createElement('div');
  group_metadata.setAttribute('class', 'group_metadata');
  var group_metadata_label = document.createElement('div');
  group_metadata_label.innerHTML = 'Set all metadata in this page to:&nbsp;'
  group_metadata.appendChild(group_metadata_label);
  var aid_list = this.d.cache.attribute_group['FILE1_Z0_XY0'];
  var aid;
  for (var aindex in aid_list) {
    aid = aid_list[aindex]
    if (aid !== this.group_by_aid &&
        this.d.store.attribute[aid].type !== 1 ) { // to avoid showing text input
      var el = this._group_metadata_io_html_element(aid, this.current_page_no);
      group_metadata.appendChild(el);
    }
  }

  var pageno_label = document.createElement('div');
  pageno_label.innerHTML = 'Page ' + (this.current_page_no + 1) + ' of ' + this.page_count + '&nbsp;';
  //pageno_label.innerHTML += ' (' + this.group_file_count + ' files)';

  var prev_page_no = this.current_page_no - 1;
  var page_prev = document.createElement('div');
  page_prev.setAttribute('data-group_name', this.group_name_list[this.current_group_name_index]);
  page_prev.setAttribute('data-prev_page_no', prev_page_no);
  page_prev.innerHTML = 'Prev';
  page_prev.setAttribute('class', 'text_button');
  if( prev_page_no >= 0) {
    page_prev.addEventListener('click', function(e) {
      var current_group_name = e.target.dataset.group_name;
      var prev_page_no = parseInt(e.target.dataset.prev_page_no);
      this.group_show(current_group_name, prev_page_no);
    }.bind(this));
  } else {
    page_prev.setAttribute('title', 'End of page, jumps to previous sign keyword');
    page_prev.addEventListener('click', function(e) {
      this._group_show_prev();
    }.bind(this));
  }

  var next_page_no = this.current_page_no + 1;
  var page_next = document.createElement('div');
  page_next.setAttribute('data-group_name', this.group_name_list[this.current_group_name_index]);
  page_next.setAttribute('data-next_page_no', next_page_no);
  page_next.innerHTML = 'Next';
  page_next.setAttribute('class', 'text_button');
  if( next_page_no !== this.page_count) {
    page_next.addEventListener('click', function(e) {
      var current_group_name = e.target.dataset.group_name;
      var next_page_no = parseInt(e.target.dataset.next_page_no);
      this.group_show(current_group_name, next_page_no);
    }.bind(this));
  } else {
    page_next.setAttribute('title', 'End of page, jumps to next sign keyword');
    page_next.addEventListener('click', function(e) {
      this._group_show_next();
    }.bind(this));
  }
  var page_nav_sep = document.createElement('div');
  page_nav_sep.innerHTML = '&nbsp;|&nbsp;';

  var page_nav = document.createElement('div');
  page_nav.setAttribute('style', 'justify-self:end; padding-right:0.5em;');
  page_nav.appendChild(pageno_label);
  page_nav.appendChild(page_nav_sep.cloneNode(true));
  page_nav.appendChild(page_prev);
  page_nav.appendChild(page_nav_sep.cloneNode(true));
  page_nav.appendChild(page_next);

  var file_tools = document.createElement('div');
  var context_input = document.createElement('input');
  context_input.setAttribute('type', 'text');
  context_input.setAttribute('value', this.page_tseg_context);
  context_input.setAttribute('style', 'width:2em; font-size:small;');
  context_input.setAttribute('title', 'Additional time (in seconds) are added to video segments in order to show more context around a video');
  context_input.addEventListener('change', function(e) {
    this.page_tseg_context = parseFloat(e.target.value);
  }.bind(this));
  var context_label1 = document.createElement('span');
  context_label1.innerHTML = 'To show context, move start/end time by&nbsp;';
  var context_label2 = document.createElement('span');
  context_label2.innerHTML = '&nbsp;sec.';

  var checkbox_input = document.createElement('input');
  checkbox_input.setAttribute('type', 'checkbox');
  if(this.page_loop_video) {
    checkbox_input.setAttribute('checked', 'checked');
  }
  checkbox_input.addEventListener('change', function(e) {
    if (e.target.checked) {
      this.page_loop_video = true;
    } else {
      this.page_loop_video = false;
    }
  }.bind(this));
  var checkbox_label = document.createElement('label');
  checkbox_label.innerHTML = '&nbsp;Loop';
  /*
    var play_all = document.createElement('div');
    play_all.setAttribute('class', 'text_button');
    play_all.innerHTML = 'Play All';
    play_all.addEventListener('click', function(e) {
    for(var i in this.page_video_element_list) {
    var fid = this.page_video_element_list[i].dataset.fid;
    this.page_video_element_list[i].currentTime = this.page_tseg[fid][0] - this.page_tseg_context;
    this.page_video_element_list[i].play();
    }
    }.bind(this));

    var pause_all = document.createElement('div');
    pause_all.setAttribute('class', 'text_button');
    pause_all.innerHTML = 'Pause All';
    pause_all.addEventListener('click', function(e) {
    for(var i in this.page_video_element_list) {
    this.page_video_element_list[i].pause();
    }
    }.bind(this));
  */
  file_tools.appendChild(context_label1);
  file_tools.appendChild(context_input);
  file_tools.appendChild(context_label2);
  file_tools.appendChild(page_nav_sep.cloneNode(true));
  file_tools.appendChild(checkbox_label);
  file_tools.appendChild(checkbox_input);
  /*
    file_tools.appendChild(page_nav_sep.cloneNode(true));
    file_tools.appendChild(play_all);
    file_tools.appendChild(page_nav_sep.cloneNode(true));
    file_tools.appendChild(pause_all);
  */

  var toolbar_container = document.createElement('div');
  toolbar_container.setAttribute('class', 'toolbar_container');
  toolbar_container.appendChild(group_nav);
  toolbar_container.appendChild(group_metadata);
  toolbar_container.appendChild(file_tools);
  toolbar_container.appendChild(page_nav);
  this.c.appendChild(toolbar_container);
}

_via_group_annotator.prototype._group_view_init_file_container = function(vindex, fid, vid, mid) {
  var file_container = document.createElement('div');
  file_container.setAttribute('class', 'file_container');

  var info_container = document.createElement('div');
  info_container.setAttribute('class', 'info');
  var vid_container = document.createElement('div');
  vid_container.innerHTML = '[' + (parseInt(vindex)+1) + ']';
  vid_container.setAttribute('title', this.d.store.file[fid].fname);
  vid_container.setAttribute('class', 'index');
  info_container.appendChild(vid_container);
  var control_container = document.createElement('div');
  control_container.setAttribute('class', 'control');
  this._init_playback_speed_buttons(fid, control_container);
  info_container.appendChild(control_container);
  file_container.appendChild(info_container);

  var file_element = this._group_view_init_file_element(fid, vid);
  file_element.setAttribute('data-fid', fid);
  file_container.appendChild(file_element);
  this.page_video_element_list.push(file_element);

  var metadata_container = document.createElement('div');
  metadata_container.setAttribute('data-vid', vid);
  metadata_container.setAttribute('data-fid', fid);
  metadata_container.setAttribute('class', 'metadata_container');
  this._group_view_init_file_metadata(metadata_container, vid, fid);
  file_container.appendChild(metadata_container);
  this.page_metadata_container.push(metadata_container);
  return file_container;
}

_via_group_annotator.prototype._group_view_init_file_metadata = function(container, vid, fid) {
  var file_mid = '';
  for ( var mindex in this.d.cache.mid_list[vid] ) {
    var mid = this.d.cache.mid_list[vid][mindex];
    if ( this.d.store.metadata[mid].z.length === 2 &&
         this.d.store.metadata[mid].xy.length === 0
       ) {
      file_mid = mid;
      break;
    }
  }

  if ( file_mid === '' ) {
    // create a new metadata
    this.d.metadata_add(vid, [], [], {}).then( function(ok) {
      this._fmetadata_init(ok.mid, container);
    }.bind(this), function(err) {
      console.log('failed to show file metadata!');
      console.log(err);
    }.bind(this));
  } else {
    this._fmetadata_init(file_mid, container);
  }
}

_via_group_annotator.prototype._fmetadata_init = function(mid, container) {
  container.innerHTML = '';
  var aid_list = this.d.cache.attribute_group['FILE1_Z0_XY0'];
  var aid;
  for (var aindex in aid_list) {
    aid = aid_list[aindex]
    if (aid !== this.group_by_aid) {
      var el = this._metadata_attribute_io_html_element(aid, mid);
      container.appendChild(el);
    }

    if(aid === '2') {
      switch(this.d.store.metadata[mid].av[aid]) {
      case 'n': // No
        container.setAttribute('style', 'background-color:#ff2a2a;');
        break;
      case 'y': // Yes
        container.setAttribute('style', 'background-color:#00aa00;');
        break;
      case '0':
        container.setAttribute('style', 'background-color:#ffcc00;');
        break;
      default:
        container.setAttribute('style', 'background-color:#ffffff;');
      }
    }
  }
}

_via_group_annotator.prototype._group_view_init_file_element = function(fid, vid) {
  // the temporal segment defined in metadata constrains
  // the playback timeline for this video
  var file_src = this.d.file_get_src(fid);
  var group_by_aid_value = this.group_name_list[this.current_group_name_index];
  for ( var mindex in this.d.cache.mid_list[vid] ) {
    var mid = this.d.cache.mid_list[vid][mindex];
    if ( this.d.store.metadata[mid].z.length !== 0 &&
         this.d.store.metadata[mid].xy.length === 0
       ) {
      // check if group_by constraint matches
      if(this.d.store.metadata[mid].av.hasOwnProperty(this.group_by_aid)) {
        if(this.d.store.metadata[mid].av[this.group_by_aid] === this.group_name_list[this.current_group_name_index] ) {
          file_src += '#t=' + this.d.store.metadata[mid].z[0].toFixed(3) + ',' + this.d.store.metadata[mid].z[1].toFixed(3);
          this.page_tseg[fid] = this.d.store.metadata[mid].z;
          break;
        }
      }
    }
  }

  var el;
  switch(this.d.store.file[fid].type) {
  case _VIA_FILE_TYPE.IMAGE:
    el = document.createElement('img');
    el.setAttribute('src', file_src);
    break;
  case _VIA_FILE_TYPE.VIDEO:
    el = document.createElement('video');
    // Note: setting preload=auto causes issue when a page contains
    // a large number of videos as chrome automatically limits
    // pre-fetch to a few videos
    el.setAttribute('preload', 'auto');
    //el.setAttribute('controls', 'controls');
    el.setAttribute('controlslist', 'nodownload nofullscreen');
    el.setAttribute('disablePictureInPicture', 'true');
    el.setAttribute('muted', 'true');
    el.setAttribute('playsinline', 'true');
    el.setAttribute('src', file_src);
    el.setAttribute('data-t0', this.page_tseg[fid][0].toFixed(3));
    el.setAttribute('data-t1', this.page_tseg[fid][1].toFixed(3));
    /*
      el.addEventListener('mousemove', this._scrubber_on_mousemove.bind(this));
      el.addEventListener('mouseout', this._scrubber_on_mouseout.bind(this));
      el.addEventListener('mousedown', this._scrubber_on_mousedown.bind(this));
      el.addEventListener('mouseup', this._scrubber_on_mouseup.bind(this));
    */
    el.addEventListener('timeupdate', function(e) {
      var t = e.target.currentTime;
      var is_paused = e.target.paused;
      var t0 = parseFloat(e.target.dataset.t0) - this.page_tseg_context;
      var t1 = parseFloat(e.target.dataset.t1) + this.page_tseg_context;
      var DEL = 0.2;

      //console.log('src=' + e.target.src + ' : t0=' + e.target.dataset.t0 + '/' + t0 + ', t1=' + e.target.dataset.t1 + '/' + t1);
      if(this.page_loop_video) {
        if(t > (t1 - DEL)) {
          e.target.currentTime = t0;
        } else {
          if(t < t0) {
            e.target.currentTime = t0;
          }
        }
      } else {
        if(t > (t1 - DEL)) {
          e.target.pause();
          //e.target.currentTime = t1;
        } else {
          if(t < t0) {
            e.target.pause();
            //e.target.currentTime = t0;
          }
        }
      }
      //console.log('src=' + e.target.src + ' : old t=' + t+ ', new t=' + e.target.currentTime);
    }.bind(this));

    break;
  default:
    el = document.createElement('span');
    el.innerHTML = 'N/A';
  }
  //el.setAttribute('title', this.d.store.file[fid].fname);
  return el;
}

//
// video scrubber
//
_via_group_annotator.prototype._scrubber_on_mousemove = function(e) {
  if (!this.is_scrubber_active) {
    return;
  }

  var x = e.offsetX;
  var y = e.offsetY;
  if (Math.abs(x-this.scrubber_x0) > 2) {
    if ( x < this.scrubber_x0 ) {
      if (e.target.currentTime > 0.0) {
        e.target.currentTime = e.target.currentTime - 0.04;
        e.target.style.cursor = 'grab';
      } else {
        e.target.style.cursor = 'w-resize';
      }
    } else {
      if (e.target.currentTime < e.target.duration) {
        e.target.currentTime = e.target.currentTime + 0.04;
        e.target.style.cursor = 'grab';
      } else {
        e.target.style.cursor = 'e-resize';
      }
    }
    this.scrubber_x0 = e.offsetX;
    this.scrubber_y0 = e.offsetY;
  }
}

_via_group_annotator.prototype._scrubber_on_mousedown = function(e) {
  this.scrubber_x0 = e.offsetX;
  this.scrubber_y0 = e.offsetY;
  //this.mousedown_x0 = e.offsetX;
  //this.mousedown_y0 = e.offsetY;

  this.is_scrubber_active = true;
  e.target.style.cursor = 'grab';
}

_via_group_annotator.prototype._scrubber_on_mouseup = function(e) {
  /*
    if ( Math.abs(e.offsetX - this.mousedown_x0) < 5 ||
    Math.abs(e.offsetY - this.mousedown_y0) < 5 ) {
    if (e.target.paused) {
    e.target.play();
    } else {
    e.target.pause();
    }
    }
  */
  if (this.is_scrubber_active) {
    this.is_scrubber_active = false;
    e.target.style.cursor = 'default';
  }
}

_via_group_annotator.prototype._scrubber_on_mouseout = function(e) {
  this.is_scrubber_active = false;
  e.target.style.cursor = 'default';
}

_via_group_annotator.prototype._group_metadata_io_html_element = function(aid, page_no) {
  var dval  = this.d.store.attribute[aid].default_option_id;
  var atype = this.d.store.attribute[aid].type;
  var el;

  switch(atype) {
  case _VIA_ATTRIBUTE_TYPE.TEXT:
    el = document.createElement('input');
    el.setAttribute('type', 'text');
    el.addEventListener('change', this._group_metadata_on_change.bind(this));
    break;

  case _VIA_ATTRIBUTE_TYPE.SELECT:
    el = document.createElement('select');

    for ( var oid in this.d.store.attribute[aid].options ) {
      var oi = document.createElement('option');
      oi.setAttribute('value', oid);
      oi.innerHTML = this.d.store.attribute[aid].options[oid];
      if ( oid === aval ) {
        oi.setAttribute('selected', 'true');
      }
      el.appendChild(oi);
    }
    el.addEventListener('change', this._group_metadata_on_change.bind(this));
    break;

  case _VIA_ATTRIBUTE_TYPE.RADIO:
    el = document.createElement('div');
    for ( var oid in this.d.store.attribute[aid].options ) {
      var radio = document.createElement('input');
      radio.setAttribute('type', 'radio');
      radio.setAttribute('value', oid);
      radio.setAttribute('data-aid', aid);
      radio.setAttribute('name', this.d.store.attribute[aid].aname);
      radio.addEventListener('change', this._group_metadata_on_change.bind(this));

      var label = document.createElement('label');
      label.innerHTML = this.d.store.attribute[aid].options[oid];
      el.appendChild(radio);
      el.appendChild(label);
    }
    break;

  case _VIA_ATTRIBUTE_TYPE.CHECKBOX:
    el = document.createElement('div');
    for ( var oid in this.d.store.attribute[aid].options ) {
      var checkbox = document.createElement('input');
      checkbox.setAttribute('type', 'checkbox');
      checkbox.setAttribute('value', oid);
      checkbox.setAttribute('data-aid', aid);
      checkbox.setAttribute('name', this.d.store.attribute[aid].aname);

      checkbox.addEventListener('change', this._group_metadata_on_change.bind(this));
      var label = document.createElement('label');
      label.innerHTML = this.d.store.attribute[aid].options[oid];

      var br = document.createElement('br');
      el.appendChild(checkbox);
      el.appendChild(label);
      el.appendChild(br);
    }
    break;

  default:
    console.log('attribute type ' + atype + ' not implemented yet!');
    var el = document.createElement('span');
    el.innerHTML = aval;
  }
  el.setAttribute('data-aid', aid);
  el.setAttribute('data-page_no', page_no);
  return el;
}

_via_group_annotator.prototype._group_metadata_on_change = function(e) {
  var aid = e.target.dataset.aid;
  var aval = e.target.value;

  var page_no = parseInt(e.target.dataset.page_no);
  var promise_list = [];
  for ( var mindex in this.current_page_mid_list ) {
    var mid = this.current_page_mid_list[mindex];
    promise_list.push( this.d.metadata_update_av(mid, aid, aval) );
  }
  Promise.all(promise_list).then( function(ok) {
    _via_util_msg_show('Updated metadata of ' + ok.length + ' files.');
    for(var i in this.page_metadata_container) {
      this.page_metadata_container[i].innerHTML = '';
      var vid = this.page_metadata_container[i].dataset.vid;
      var fid = this.page_metadata_container[i].dataset.fid;
      this._group_view_init_file_metadata(this.page_metadata_container[i], vid, fid);
    }
  }.bind(this));
}

_via_group_annotator.prototype._group_show_prev = function(data, event_payload) {
  var prev_group_name_index = this.current_group_name_index - 1;
  if ( prev_group_name_index < 0 ) {
    prev_group_name_index = this.group_name_list.length - 1;
  }
  this.group_show( this.group_name_list[prev_group_name_index] );
}

_via_group_annotator.prototype._group_show_next = function(data, event_payload) {
  var next_group_name_index = this.current_group_name_index + 1;
  if ( next_group_name_index >= this.group_name_list.length ) {
    next_group_name_index = 0;
  }
  this.group_show( this.group_name_list[next_group_name_index] );
}

_via_group_annotator.prototype._on_group_name_update = function() {
  var new_group_name_index = this.group_name_selector.selectedIndex;
  this.group_show( this.group_name_list[new_group_name_index] );
}

_via_group_annotator.prototype._metadata_attribute_io_html_element = function(aid, mid) {
  var dval  = this.d.store.attribute[aid].default_option_id;
  var atype = this.d.store.attribute[aid].type;
  var aval  = this.d.store.metadata[mid].av[aid];
  var el;

  switch(atype) {
  case _VIA_ATTRIBUTE_TYPE.TEXT:
    if ( typeof(aval) === 'undefined' ) {
      aval = dval;
    }
    //el = document.createElement('textarea');
    el = document.createElement('input');
    el.setAttribute('type', 'text');
    if(this.d.store.attribute[aid].aname === 'remarks') {
      el.setAttribute('placeholder', 'enter true sign (if incorrect)');
      el.setAttribute('title', 'Enter the keyword describing the true sign shown in this video');
    }
    el.addEventListener('change', this._metadata_on_change.bind(this));
    el.setAttribute('value', aval);
    break;

  case _VIA_ATTRIBUTE_TYPE.SELECT:
    el = document.createElement('select');
    if ( typeof(aval) === 'undefined' ) {
      aval = dval;
    }

    for ( var oid in this.d.store.attribute[aid].options ) {
      var oi = document.createElement('option');
      oi.setAttribute('value', oid);
      oi.innerHTML = this.d.store.attribute[aid].options[oid];
      if ( oid === aval ) {
        oi.setAttribute('selected', 'true');
      }
      el.appendChild(oi);
    }
    el.addEventListener('change', this._metadata_on_change.bind(this));
    break;

  case _VIA_ATTRIBUTE_TYPE.RADIO:
    el = document.createElement('div');

    if ( typeof(aval) === 'undefined' ) {
      aval = dval;
    }

    for ( var oid in this.d.store.attribute[aid].options ) {
      var radio = document.createElement('input');
      radio.setAttribute('type', 'radio');
      radio.setAttribute('value', oid);
      radio.setAttribute('data-mid', mid);
      radio.setAttribute('data-aid', aid);
      radio.setAttribute('name', this.d.store.attribute[aid].aname + '_' + mid);
      if ( oid === aval ) {
        radio.setAttribute('checked', 'checked');
      }
      radio.addEventListener('change', this._metadata_on_change.bind(this));

      var label = document.createElement('label');
      label.innerHTML = this.d.store.attribute[aid].options[oid];

      //var br = document.createElement('br');
      el.appendChild(radio);
      el.appendChild(label);
      //el.appendChild(br);
    }
    break;

  case _VIA_ATTRIBUTE_TYPE.CHECKBOX:
    el = document.createElement('div');

    console.log(dval)
    console.log(aval)
    if ( typeof(aval) === 'undefined' ) {
      aval = dval;
    }
    var values = aval.split(',');
    for ( var oid in this.d.store.attribute[aid].options ) {
      var checkbox = document.createElement('input');
      checkbox.setAttribute('type', 'checkbox');
      checkbox.setAttribute('value', oid);
      checkbox.setAttribute('data-mid', mid);
      checkbox.setAttribute('data-aid', aid);
      checkbox.setAttribute('name', this.d.store.attribute[aid].aname + '_' + mid);

      if ( values.indexOf(oid) !== -1 ) {
        checkbox.setAttribute('checked', true);
      }
      checkbox.addEventListener('change', this._metadata_on_change.bind(this));
      var label = document.createElement('label');
      label.innerHTML = this.d.store.attribute[aid].options[oid];

      var br = document.createElement('br');
      el.appendChild(checkbox);
      el.appendChild(label);
      el.appendChild(br);
    }
    break;

  default:
    console.log('attribute type ' + atype + ' not implemented yet!');
    var el = document.createElement('span');
    el.innerHTML = aval;
  }
  el.setAttribute('data-mid', mid);
  el.setAttribute('data-aid', aid);
  return el;
}

_via_group_annotator.prototype._metadata_on_change = function(e) {
  var mid = e.target.dataset.mid;
  var aid = e.target.dataset.aid;
  var aval = e.target.value;

  if ( e.target.type === 'checkbox' &&
       this.d.store.metadata[mid].av.hasOwnProperty(aid)
     ) {
    var values = this.d.store.metadata[mid].av[aid].split(',');
    if ( this.d.store.metadata[mid].av[aid] !== '' ) {
      var vindex = values.indexOf(e.target.value);
      if ( e.target.checked ) {
        // add this value
        if ( vindex === -1 ) {
          values.push(e.target.value);
        }
      } else {
        // remove this value
        var vindex = values.indexOf(aval);
        if ( vindex !== -1 ) {
          values.splice(vindex, 1);
        }
      }
      aval = values.join(',');
    }
  }

  this.d.metadata_update_av(mid, aid, aval).then( function(ok) {
    _via_util_msg_show('Updated metadata');
    for(var i in this.page_metadata_container) {
      var vid = this.page_metadata_container[i].dataset.vid;
      var fid = this.page_metadata_container[i].dataset.fid;
      if(parseInt(vid) == ok.vid) {
        this.page_metadata_container[i].innerHTML = '';
        this._group_view_init_file_metadata(this.page_metadata_container[i], vid, fid);
        break;
      }
    }
  }.bind(this));
}

_via_group_annotator.prototype._init_playback_speed_buttons = function(fid, c) {
  c.innerHTML = '';
  var label = document.createElement('span');
  label.innerHTML = 'Play/Replay:&nbsp;';
  c.appendChild(label);

  var speed_list = [0.25, 0.5, 1];
  var speed_list_html = ['&frac14;', '&frac12;', '1'];
  for (var speed_index in speed_list) {
    var speed = speed_list[speed_index];
    var el = document.createElement('span');
    el.setAttribute('class', 'text_button');
    el.setAttribute('data-fid', fid);
    el.setAttribute('title', 'Playback video at speed ' + speed + 'x');
    el.setAttribute('onclick', 'via.ga.playback_video(' + fid + ',' + speed + ')');
    el.innerHTML = speed_list_html[speed_index] + 'x';
    c.appendChild(el);
    var space = document.createElement('span');
    space.innerHTML = '&nbsp;&nbsp;';
    c.appendChild(space);
  }

  var extvideo = document.createElement('img');
  extvideo.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAQElEQVR42qXKwQkAIAxDUUdxtO6/RBQkQZvSi8I/pL4BoGw/XPkh4XigPmsUgh0626AjRsgxHTkUThsG2T/sIlzdTsp52kSS1wAAAABJRU5ErkJggg==';
  extvideo.setAttribute('style', 'margin: 0px 3px 0px 5px; width:12px; height:12px;');
  extvideo.setAttribute('class', 'text_button');
  extvideo.setAttribute('title', 'If the video does not play, click this button to play video in a new browser tab');
  extvideo.setAttribute('data-fid', fid);
  extvideo.addEventListener('click', function(e) {
    var fid = e.target.dataset.fid;
    for ( var i in this.page_video_element_list ) {
      var fidi = this.page_video_element_list[i].dataset.fid;
      if(fidi == fid) {
        var video = this.page_video_element_list[i];
        console.log(video.width + 'x' + video.height);
        console.log(video.videoWidth + 'x' + video.videoHeight);
        var winparam = "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes,width=" + video.videoWidth + ',height=' + video.videoHeight + ',centerscreen=yes,chrome=yes,toolbar=yes';

        window.open(video.src, 'SignDB Video Preview', winparam );
        break;
      }
    }
  }.bind(this));
  c.appendChild(extvideo);
}

_via_group_annotator.prototype.playback_video = function(fid, speed) {
  for ( var i in this.page_video_element_list ) {
    var fidi = this.page_video_element_list[i].dataset.fid;
    if(fidi == fid) {
      var video = this.page_video_element_list[i];
      //console.log('playing fid=' + fid + ' at speed=' + speed + ': src=' + video.src + ' : readyState=' + video.readyState);
      if(video.readyState >= 3) {
        video.currentTime = this.page_tseg[fid][0] - this.page_tseg_context;
        video.playbackRate = speed;
        video.play();
      } else {
        _via_util_msg_show('Please wait, video is still downloading ... ' +
                           '[readyState=' + video.readyState + ']');
      }
      break;
    }
  }

}
