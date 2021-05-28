/**
 * @class
 * @classdesc Subtitle editor for video and audio
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 21 Sep. 2020
 */
function _via_subtitle_editor(groupby_aid, data, temporal_segmenter, container) {
  this._ID = '_via_subtitle_editor';
  this.groupby_aid = groupby_aid;
  this.d  = data;
  this.ts = temporal_segmenter;
  this.c  = container;

  // state
  this.mid_list = [];
  this.subtitle_track_cue_list = [];
  this.selected_mindex = -1;
  this.subtitle_track = null;
  this.row_index_list = [];

  // initialise event listeners
  this.ts.on_event('metadata_add', this._ID, this.on_event_metadata_add.bind(this));
  this.ts.on_event('metadata_delete', this._ID, this.on_event_metadata_del.bind(this));
  this.ts.on_event('metadata_select', this._ID, this._on_event_metadata_select.bind(this));
  this.ts.on_event('metadata_unselect', this._ID, this._on_event_metadata_unselect.bind(this));
  this.ts.on_event('metadata_update', this._ID, this._on_event_metadata_update.bind(this));
  this.ts.on_event('metadata_editor_focus', this._ID, this._on_event_metadata_editor_focus.bind(this));

  this.init();
}

_via_subtitle_editor.prototype.init = function() {
  this.subtitle_track = this.ts.m.addTextTrack('subtitles', 'English', 'en');
  this.subtitle_track.mode = 'showing';

  this.c.setAttribute('style', 'height:' + this.c.clientHeight + 'px');
  this.c.innerHTML = '';
  this.subtitle_table = document.createElement('table');

  var subtitle_head = document.createElement('thead');
  subtitle_head.innerHTML = '<tr><th>Start</td><th>End</th><th>Subtitle Text</th></tr>';

  this.subtitle_tbody = document.createElement('tbody');
  this.mid_list = Object.keys(this.d.store.metadata);
  this.mid_list.sort( this._compare_mid_by_time.bind(this) );
  var row_index = 1;
  for(var mindex in this.mid_list) {
    var mid = this.mid_list[mindex];
    var row = this.get_subtitle_table_row(row_index, mindex, mid);
    this.subtitle_tbody.appendChild(row);

    this.row_index_list[mindex] = row_index;
    row_index = row_index + 1;

    this.subtitle_track_cue_list[mindex] = new VTTCue(this.d.store.metadata[mid]['z'][0],
                                                      this.d.store.metadata[mid]['z'][1],
                                                      this.d.store.metadata[mid]['av'][this.groupby_aid]);

    this.subtitle_track_cue_list[mindex].id = 'cue_' + mid;
    this.subtitle_track.addCue(this.subtitle_track_cue_list[mindex]);
  }

  //this.subtitle_table.appendChild(subtitle_head);
  this.subtitle_table.appendChild(this.subtitle_tbody);
  this.c.appendChild(this.subtitle_table);
}

_via_subtitle_editor.prototype.get_subtitle_table_row = function(row_index, mindex, mid) {
  var row = document.createElement('tr');
  row.setAttribute('id', 'subtitle_mindex_' + mindex);
  row.addEventListener('click', this.on_click_row.bind(this, parseInt(mindex)));

  var stime = document.createElement('td');
  var start = _via_seconds_to_hh_mm_ss_ms(this.d.store.metadata[mid]['z'][0]);
  stime.innerHTML = '<span class="hhmmss">' + start[0] + ':' + start[1] + ':' + start[2] + '</span><span class="ms">' + start[3] + '</span>';
  var etime = document.createElement('td');
  var end = _via_seconds_to_hh_mm_ss_ms(this.d.store.metadata[mid]['z'][1]);
  etime.innerHTML = '<span class="hhmmss">' + end[0] + ':' + end[1] + ':' + end[2] + '</span><span class="ms">' + end[3] + '</span>';

  var subtitle = document.createElement('td');
  var input = document.createElement('input');
  input.setAttribute('type', 'text');
  //input.setAttribute('disabled', '');
  input.setAttribute('data-mid', mid);
  input.setAttribute('value', this.d.store.metadata[mid]['av'][this.groupby_aid]);
  input.addEventListener('click', this.onclick_subtitle_text.bind(this));
  input.addEventListener('change', this.onchange_subtitle_text.bind(this));
  input.addEventListener('keydown', this.keydown_subtitle_text.bind(this));

  subtitle.appendChild(input);

  var index = document.createElement('td');
  index.innerHTML = row_index;

  row.appendChild(index);
  row.appendChild(stime);
  row.appendChild(etime);
  row.appendChild(subtitle);
  return row;
}

_via_subtitle_editor.prototype.keydown_subtitle_text = function(e) {
  if(e.key === 'Escape') {
    e.target.blur();
  }
}

_via_subtitle_editor.prototype.onclick_subtitle_text = function(e) {
  if(e.target.parentNode.parentNode.classList.contains('sel_row')) {
    // remove selection
    this.remove_subtitle_sel();
    e.target.blur();
    this.inform_temporal_segmenter_of_unselect();
  } else {
    var mid = e.target.dataset.mid;
    var mindex = this.mid_list.indexOf(mid);
    this.remove_subtitle_sel();
    this.subtitle_sel(mindex);
    this.inform_temporal_segmenter_of_select();
  }
}

_via_subtitle_editor.prototype.onchange_subtitle_text = function(e) {
  var mid = e.target.dataset.mid;
  var new_subtitle_text = e.target.value.trim();
  this.d.metadata_update_av(this.ts.vid, mid, this.groupby_aid, new_subtitle_text).then( function(ok) {
    // update subtitle track cue
    var mindex = this.mid_list.indexOf(mid);
    var cue = this.subtitle_track_cue_list[mindex];
    cue.text = this.d.store.metadata[mid]['av'][this.groupby_aid];

    // update temporal segmenter
    this.ts._tmetadata_group_gid_draw(this.ts.selected_gid);
    e.target.blur();
  }.bind(this), function(err) {
    _via_util_msg_show('Failed to update subtitle text.');
  }.bind(this));
}

_via_subtitle_editor.prototype.remove_subtitle_sel = function() {
  if(this.selected_mindex !== -1) {
    // remove existing selection
    var old_row = document.getElementById('subtitle_mindex_' + this.selected_mindex);
    old_row.classList.remove('sel_row');
    this.selected_mindex = -1;
  }
}

_via_subtitle_editor.prototype.subtitle_sel = function(mindex) {
  this.selected_mindex = mindex;
  var new_row = document.getElementById('subtitle_mindex_' + this.selected_mindex);
  new_row.classList.add('sel_row');
  var scrolltop = new_row.parentNode.parentNode.parentNode.scrollTop;
  var vheight = new_row.parentNode.parentNode.parentNode.clientHeight;
  var row_height = new_row.clientHeight;
  var rowtop = new_row.offsetTop;
  if( (rowtop + row_height) < scrolltop ||
      (rowtop + row_height) > (scrolltop + vheight) ) {
    new_row.scrollIntoView();
  }
}

_via_subtitle_editor.prototype.inform_temporal_segmenter_of_select = function() {
  var mid = this.mid_list[this.selected_mindex];
  var tstart = this.d.store.metadata[mid].z[0];
  var ts_mindex = this.ts._tmetadata_get_mindex(mid);
  if(ts_mindex === -1) {
    this.ts._tmetadata_boundary_move(0, tstart);
    this.ts._tmetadata_gtimeline_draw();
    this.ts._tmetadata_group_gid_draw_all();
    ts_mindex = this.ts._tmetadata_get_mindex(mid);
    this.ts._tmetadata_group_gid_sel_metadata(ts_mindex, false);
  } else {
    this.ts._tmetadata_group_gid_sel_metadata(ts_mindex, false);
  }
  this.ts._tmetadata_group_gid_draw_all();
}

_via_subtitle_editor.prototype.inform_temporal_segmenter_of_unselect = function() {
  this.ts._tmetadata_group_gid_remove_mid_sel();
  this.ts._tmetadata_group_gid_draw_all();
}

_via_subtitle_editor.prototype.on_click_row = function(mindex, e) {
  //console.log('clicked ' + mindex + ', target=' + e.target.type)
  if(e.target.type === 'text') {
    return; // handled by onclick_subtitle_text()
  }

  if(mindex === this.selected_mindex) {
    this.remove_subtitle_sel();
    this.inform_temporal_segmenter_of_unselect();
  } else {
    this.remove_subtitle_sel();
    this.subtitle_sel(mindex);
    this.inform_temporal_segmenter_of_select();
  }
}

_via_subtitle_editor.prototype.on_event_metadata_add = function(data, event_payload) {
  // find the appropriate location of new mid in this.mid_list
  var new_mid = event_payload['mid'];
  var new_mindex = -1;
  for(var mindex in this.mid_list) {
    var mid = this.mid_list[mindex];
    if(this.d.store.metadata[mid]['z'][0] > this.d.store.metadata[new_mid]['z'][1]) {
      new_mindex = mindex - 1;
      break;
    }
  }
  if(new_mindex === -1) {
    _via_util_msg_show('Failed to find appropriate location for new metadata');
    return;
  }

  // update internal data structures like
  // this.mid_list, this.subtitle_track, this.subtitle_track_cue_list
  this.mid_list.splice(new_mindex, 0, new_mid);
  var new_mid_cue = new VTTCue(this.d.store.metadata[new_mid]['z'][0],
                               this.d.store.metadata[new_mid]['z'][1],
                               this.d.store.metadata[new_mid]['av'][this.groupby_aid]);
  new_mid_cue.id = 'cue_' + new_mid;
  this.subtitle_track_cue_list.splice(new_mindex, 0, new_mid_cue);
  this.subtitle_track.addCue(this.subtitle_track_cue_list[new_mindex]);

  // recreate the subtitle_tbody as row_index and mindex have been invalidated
  this.subtitle_tbody.innerHTML = '';
  this.row_index_list = [];
  var row_index = 1;
  for(var mindex in this.mid_list) {
    var mid = this.mid_list[mindex];
    var row = this.get_subtitle_table_row(row_index, mindex, mid);
    this.subtitle_tbody.appendChild(row);

    this.row_index_list[mindex] = row_index;
    row_index = row_index + 1;
  }
}

_via_subtitle_editor.prototype.on_event_metadata_del = function(data, event_payload) {
  var del_mid = event_payload.mid;
  var del_mindex = this.mid_list.indexOf(del_mid);
  this.mid_list.splice(del_mindex, 1);
  this.subtitle_track_cue_list.splice(del_mindex, 1);
  // see https://stackoverflow.com/a/53091426
  this.subtitle_track.mode = 'hidden';
  this.subtitle_track.removeCue(this.subtitle_track.cues.getCueById('cue_' + del_mid));
  this.subtitle_track.mode = 'showing';

  // recreate the subtitle_tbody as row_index and mindex have been invalidated
  this.subtitle_tbody.innerHTML = '';
  this.row_index_list = [];
  var row_index = 1;
  for(var mindex in this.mid_list) {
    var mid = this.mid_list[mindex];
    var row = this.get_subtitle_table_row(row_index, mindex, mid);
    this.subtitle_tbody.appendChild(row);

    this.row_index_list[mindex] = row_index;
    row_index = row_index + 1;
  }
}

_via_subtitle_editor.prototype._on_event_metadata_select = function(data, event_payload) {
  var mid = event_payload.mid;
  var mindex = this.mid_list.indexOf(mid);
  this.remove_subtitle_sel();
  this.subtitle_sel(mindex);
}

_via_subtitle_editor.prototype._on_event_metadata_unselect = function(data, event_payload) {
  this.remove_subtitle_sel();
}

_via_subtitle_editor.prototype._on_event_metadata_editor_focus = function(data, event_payload) {
  var mid = event_payload.mid;
  var mindex = this.mid_list.indexOf(mid);
  // update subtitle list
  var row = document.getElementById('subtitle_mindex_' + mindex);
  row.childNodes[3].firstChild.focus();
  _via_util_msg_show('Update the subtitle text and press <span class="key">Enter</span> or <span class="key">Esc</span> to bring focus back to the temporal segment.');
}

_via_subtitle_editor.prototype._on_event_metadata_update = function(data, event_payload) {
  var mid = event_payload.mid;
  var eindex = event_payload.eindex;
  var mindex = this.mid_list.indexOf(mid);

  // update subtitle list
  var row = document.getElementById('subtitle_mindex_' + mindex);
  var stime = document.createElement('td');
  var start = _via_seconds_to_hh_mm_ss_ms(this.d.store.metadata[mid]['z'][0]);
  row.childNodes[1].innerHTML = '<span class="hhmmss">' + start[0] + ':' + start[1] + ':' + start[2] + '</span><span class="ms">' + start[3] + '</span>';
  var etime = document.createElement('td');
  var end = _via_seconds_to_hh_mm_ss_ms(this.d.store.metadata[mid]['z'][1]);
  row.childNodes[2].innerHTML = '<span class="hhmmss">' + end[0] + ':' + end[1] + ':' + end[2] + '</span><span class="ms">' + end[3] + '</span>';
  row.childNodes[3].firstChild.setAttribute('value', this.d.store.metadata[mid]['av'][this.groupby_aid]);

  // update subtitle track cue
  var cue = this.subtitle_track_cue_list[mindex];
  cue.startTime = this.d.store.metadata[mid]['z'][0];
  cue.endTime = this.d.store.metadata[mid]['z'][1];
  cue.text = this.d.store.metadata[mid]['av'][this.groupby_aid];
}

_via_subtitle_editor.prototype._compare_mid_by_time = function(mid1, mid2) {
  var t00 = this.d.store.metadata[mid1].z[0];
  var t10 = this.d.store.metadata[mid2].z[0];
  var t01 = this.d.store.metadata[mid1].z[1];
  var t11 = this.d.store.metadata[mid2].z[1];

  if ( typeof(t00) === 'string' ||
       typeof(t01) === 'string' ) {
    t00 = parseFloat(t00);
    t01 = parseFloat(t01);
    t10 = parseFloat(t10);
    t11 = parseFloat(t11);
  }

  if ( (t00 === t10) && ( t01 === t11 ) ) {
    return 0;
  }

  if ( ( t00 === t10 ) || ( t01 === t11 ) ) {
    var a,b;
    if ( ( t00 === t10 ) ) {
      // same start time
      a = t01;
      b = t11;
    } else {
      // same end time
      a = t00;
      b = t10;
    }
    if ( a < b ) {
      return -1;
    } else {
      return 1;
    }
  } else {
    if ( (t00 < t10) || ( t01 < t11 ) ) {
      return -1;
    } else {
      return 1;
    }
  }
}
