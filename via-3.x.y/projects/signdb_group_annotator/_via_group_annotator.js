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

  // video scrubber state
  this.is_scrubber_active = false;
  this.scrubber_x0 = -1;
  this.scrubber_y0 = -1;
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

_via_group_annotator.prototype.group_by = function(aid) {
  this.group_by_aid = aid;
  this._group_collect_vid();
  this.emit_event('group_by', { 'aid':aid, 'group_name_list':this.group_name_list });
  if (this.group_name_list.length) {
    this.group_show(this.group_name_list[2])
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
}

_via_group_annotator.prototype.group_show = function(group_name) {
  this.c.innerHTML = '';
  this.scrubber_canvas = document.createElement('canvas');
  this.scrubber_canvas.setAttribute('id', 'scrubber_canvas');
  this.scrubber_canvas.classList.add('hide');
  this.c.appendChild(this.scrubber_canvas);

  this.d.file_object_uri_clear_all();
  for (var vindex in this.g[group_name]) {
    var vid = this.g[group_name][vindex].vid;
    var mid = this.g[group_name][vindex].mid;
    if ( this.d.store.view[vid].fid_list.length === 1 ) {
      var fid = this.d.store.view[vid].fid_list[0];
      var file_container = this._group_view_init_file_container(vindex, fid, vid, mid);
      this.c.appendChild(file_container);
    }
  }
  this.current_group_name_index = this.group_name_list.indexOf(group_name);
  this.emit_event('group_show', { 'group_name_index':this.current_group_name_index });
}

_via_group_annotator.prototype._group_view_init_file_container = function(vindex, fid, vid, mid) {
  var file_container = document.createElement('div');
  file_container.setAttribute('class', 'file_container');

  var info_container = document.createElement('div');
  info_container.setAttribute('class', 'info');
  var vid_container = document.createElement('div');
  vid_container.innerHTML = '[' + vindex + ']';
  vid_container.setAttribute('title', this.d.store.file[fid].fname);
  vid_container.setAttribute('class', 'index');
  info_container.appendChild(vid_container);
  var control_container = document.createElement('div');
  control_container.setAttribute('class', 'control');
  this._init_playback_speed_buttons(fid, control_container);
  info_container.appendChild(control_container);
  file_container.appendChild(info_container);

  var file_element = this._group_view_init_file_element(fid);
  file_element.setAttribute('id', 'fid-' + fid);
  file_container.appendChild(file_element);

  var metadata_container = document.createElement('div');
  metadata_container.setAttribute('class', 'metadata_container');
  this._group_view_init_file_metadata(metadata_container, vid, fid);
  file_container.appendChild(metadata_container);
  return file_container;
}

_via_group_annotator.prototype._group_view_init_file_metadata = function(container, vid, fid) {
  var file_mid = '';
  for ( var mindex in this.d.cache.mid_list[vid] ) {
    var mid = this.d.cache.mid_list[vid][mindex];
    if ( this.d.store.metadata[mid].z.length === 0 &&
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
      var el = this._metadata_attribute_io_html_element(mid, aid);
      container.appendChild(el);
    }
  }
}

_via_group_annotator.prototype._group_view_init_file_element = function(fid) {
  var el;
  switch(this.d.store.file[fid].type) {
  case _VIA_FILE_TYPE.IMAGE:
    el = document.createElement('img');
    el.setAttribute('src', this.d.file_get_src(fid));
    break;
  case _VIA_FILE_TYPE.VIDEO:
    el = document.createElement('video');
    el.setAttribute('preload', 'auto');
    el.setAttribute('src', this.d.file_get_src(fid));
    el.addEventListener('mousemove', this._scrubber_on_mousemove.bind(this));
    el.addEventListener('mouseout', this._scrubber_on_mouseout.bind(this));
    el.addEventListener('mousedown', this._scrubber_on_mousedown.bind(this));
    el.addEventListener('mouseup', this._scrubber_on_mouseup.bind(this));
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
  if ( x < this.scrubber_x0 ) {
    if (e.target.currentTime > 0.0) {
      e.target.currentTime = e.target.currentTime - 0.04;
    }
  } else {
    if (e.target.currentTime < e.target.duration) {
      e.target.currentTime = e.target.currentTime + 0.04;
    }
  }
}

_via_group_annotator.prototype._scrubber_on_mousedown = function(e) {
  this.scrubber_x0 = e.offsetX;
  this.scrubber_y0 = e.offsetY;
  this.is_scrubber_active = true;
}

_via_group_annotator.prototype._scrubber_on_mouseup = function(e) {
  if ( Math.abs(e.offsetX - this.scrubber_x0) < 5 ||
       Math.abs(e.offsetY - this.scrubber_y0) < 5 ) {
    if (e.target.paused) {
      e.target.play();
    } else {
      e.target.pause();
    }
  }
  if (this.is_scrubber_active) {
    this.is_scrubber_active = false;
  }
}

_via_group_annotator.prototype._scrubber_on_mouseout = function(e) {
  this.is_scrubber_active = false;
}

_via_group_annotator.prototype._metadata_attribute_io_html_element = function(mid, aid) {
  var aval  = this.d.store.metadata[mid].av[aid];
  var dval  = this.d.store.attribute[aid].default_option_id;
  var atype = this.d.store.attribute[aid].type;
  var el;

  switch(atype) {
  case _VIA_ATTRIBUTE_TYPE.TEXT:
    if ( typeof(aval) === 'undefined' ) {
      aval = dval;
    }
    //el = document.createElement('textarea');
    el = document.createElement('input');
    el.setAttribute('type', 'text');
    el.addEventListener('change', this._metadata_on_change.bind(this));
    el.innerHTML = aval;
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
      radio.setAttribute('name', this.d.store.attribute[aid].aname);
      if ( oid === aval ) {
        radio.setAttribute('checked', true);
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
      checkbox.setAttribute('name', this.d.store.attribute[aid].aname);

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
  console.log('mid='+mid+ ', aid=' + aid + ', aval='+aval);
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
    console.log( JSON.stringify(this.d.store.metadata[ok.mid].av) );
  }.bind(this));
}

_via_group_annotator.prototype._init_playback_speed_buttons = function(fid, c) {
  var speed_list = [0.25, 0.5, 1, 2];
  var speed_list_html = ['&frac14;', '&frac12;', '1', '2'];
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
    space.innerHTML = '&nbsp;';
    c.appendChild(space);
  }
}

_via_group_annotator.prototype.playback_video = function(fid, speed) {
  console.log('playing fid=' + fid + ' at speed=' + speed);
  var video = document.getElementById('fid-' + fid);
  video.playbackRate = speed;
  video.currentTime = 0.0;
  video.play();
}
