/**
 * Builds user interface and control handlers to allow
 * annotation of a file (image, video or audio)

 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 24 Dec. 2018
 *
 */

'use strict';

const _VIA_VIEW_MODE = {'UNKNOWN':0,
                        'IMAGE1':1, 'IMAGE2':2, 'IMAGEK':3,
                        'VIDEO1':101, 'VIDEO2':102, 'VIDEOK':103,
                        'AUDIO1':201, 'AUDIO2':202, 'AUDIOK':203
                       };
const _VIA_PAGE = {
  'ABOUT':'page_about',
  'SHORTCUT':'page_shortcut',
  'START_INFO':'page_start_info',
};

function _via_view_annotator(data, container ) {
  this.d = data;
  this.c = container;
  this.file_annotator = [];
  this.view_mode = _VIA_VIEW_MODE.UNKNOWN;

  // state variables
  this.region_draw_shape = _VIA_RSHAPE.RECT;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_view_annotator_';
  _via_event.call( this );

  this.d.on_event('metadata_add', this._on_event_metadata_add.bind(this));
  this.d.on_event('metadata_update', this._on_event_metadata_update.bind(this));

  this._init();
}

_via_view_annotator.prototype._init = function() {
  this._view_clear_all_file_annotator();
  this._show_start_info();
  _via_util_msg_show(_VIA_NAME + ' (' + _VIA_NAME_SHORT + ') ' + _VIA_VERSION + ' ready.');
}

_via_view_annotator.prototype._show_start_info = function() {
  this.c.setAttribute('style', 'grid-template-rows:1fr;')
  var via_page = document.createElement('div');
  via_page.setAttribute('id', 'via_start_info');
  via_page.innerHTML = document.getElementById('via_start_info_content').innerHTML;
  this.c.innerHTML = '';
  this.c.appendChild(via_page);
}

_via_view_annotator.prototype.view_show = function(vid) {
  this._view_clear_all_file_annotator();
  this.vid = vid;
  this._view_init(vid);
  this.emit_event( 'view_show', { 'vid':this.vid } );
}

_via_view_annotator.prototype._view_init = function(vid) {
  var file_count = this.d.store.view[vid].fid_list.length;

  switch(file_count) {
  case 1:
    if ( this._view_has_only_image(vid) ) {
      this._view_annotate_single_image(vid);
    } else {
      if ( this._view_has_only_video(vid) ) {
        this._view_annotate_single_video(vid);
      } else {
        if ( this._view_has_only_audio(vid) ) {
          this._view_annotate_single_audio(vid);
        } else {
          console.warn('View mode not supported yet!');
        }
      }
    }
    break;

  case 2:
    if ( this._view_has_only_image(vid) ) {
      this._view_annotate_two_images(vid);
    } else {
      console.warn('View mode not supported yet!');
    }
    break;

  default:
    console.warn('View mode not supported yet!');
  }
}

_via_view_annotator.prototype._view_annotate_single_image = function(vid) {
  this.view_mode = _VIA_VIEW_MODE.IMAGE1;

  this.c.innerHTML = '';
  // for viewing content of a view and definition of metadata.{xy, z, av} for the view
  this.view_content_container = document.createElement('div');
  this.view_content_container.setAttribute('class', 'view_content_container');

  this.c.setAttribute('style', 'grid-template-rows:1fr;')
  this.c.appendChild(this.view_content_container);

  // occupy the full container with single image
  this.file_annotator = [];
  this.file_container = [];
  this.view_content_container.innerHTML = '';
  this._view_split_content_container(this.view_content_container, this.file_container, 1, 1);

  this.file_annotator[0] = [];
  var vid0 = this.d.view_get_file_vid( this.d.store.view[vid].fid_list[0] );
  this.file_annotator[0][0] = new _via_file_annotator(this, this.d, vid0, '', this.file_container[0][0]);
  this.file_annotator[0][0]._file_load().then( function(ok) {
    this.file_annotator[0][0]._rinput_enable();
  }.bind(this));
}

_via_view_annotator.prototype._view_annotate_single_video = function(vid) {
  this.view_mode = _VIA_VIEW_MODE.VIDEO1;

  this.c.innerHTML = '';
  // for viewing content of a view and definition of metadata.{xy, z, av} for the view
  this.view_content_container = document.createElement('div');
  this.view_content_container.setAttribute('class', 'view_content_container');

  // for definition of metadata.{z, v} for a view
  this.view_metadata_container = document.createElement('div');
  this.view_metadata_container.setAttribute('class', 'view_metadata_container');

  this.c.setAttribute('style', 'grid-template-rows:1fr 20ch;')
  this.c.appendChild(this.view_content_container);
  this.c.appendChild(this.view_metadata_container);
  this.view_metadata_container.style.display = 'block';

  // occupy the full container with single image
  this.file_annotator = [];
  this.file_container = [];
  this.view_content_container.innerHTML = '';
  this.view_metadata_container.innerHTML = '';
  this._view_split_content_container(this.view_content_container, this.file_container, 1, 1);

  this.file_annotator[0] = [];
  var fid0 = this.d.store.view[vid].fid_list[0];
  var vid0 = this.d.view_get_file_vid( fid0 );
  this.file_annotator[0][0] = new _via_file_annotator(this, this.d, vid0, '', this.file_container[0][0]);

  this.file_annotator[0][0]._file_load().then( function(ok) {
    this.view_metadata_container.innerHTML = '';
    // setup view metadata editor
    this.temporal_segmenter_container = document.createElement('div');
    this.temporal_segmenter_container.classList.add('temporal_segmenter_container');
    this.view_metadata_container.appendChild(this.temporal_segmenter_container);
    this.temporal_segmenter = new _via_temporal_segmenter(this.temporal_segmenter_container,
                                                          vid0,
                                                          this.d,
                                                          this.file_annotator[0][0].file_html_element
                                                         );
    this.temporal_segmenter.on_event('edit_frame_regions', this.file_annotator[0][0]._on_event_edit_frame_regions.bind(this.file_annotator[0][0]));
  }.bind(this), function(err) {
    _via_util_msg_show('Failed to load video!', true);
  }.bind(this));
}

_via_view_annotator.prototype._view_annotate_single_audio = function(vid) {
  this.view_mode = _VIA_VIEW_MODE.AUDIO1;

  this.c.innerHTML = '';
  // for viewing content of a view and definition of metadata.{xy, z, av} for the view
  this.view_content_container = document.createElement('div');
  this.view_content_container.setAttribute('class', 'view_content_container');

  // for definition of metadata.{z, v} for a view
  this.view_metadata_container = document.createElement('div');
  this.view_metadata_container.setAttribute('class', 'view_metadata_container');

  this.c.setAttribute('style', 'grid-template-rows:5ch 50vh;')
  this.c.appendChild(this.view_content_container);
  this.c.appendChild(this.view_metadata_container);
  this.view_metadata_container.style.display = 'block';

  // occupy the full container with single image
  this.file_annotator = [];
  this.file_container = [];
  this.view_content_container.innerHTML = '';
  this.view_metadata_container.innerHTML = '';
  this._view_split_content_container(this.view_content_container, this.file_container, 1, 1);

  this.file_annotator[0] = [];
  var fid0 = this.d.store.view[vid].fid_list[0];
  var vid0 = this.d.view_get_file_vid( fid0 );
  this.file_annotator[0][0] = new _via_file_annotator(this, this.d, vid0, '', this.file_container[0][0]);

  this.file_annotator[0][0]._file_load().then( function(ok) {
    this.view_metadata_container.innerHTML = '';
    // setup view metadata editor
    this.temporal_segmenter_container = document.createElement('div');
    this.temporal_segmenter_container.classList.add('temporal_segmenter_container');
    this.view_metadata_container.appendChild(this.temporal_segmenter_container);
    this.temporal_segmenter = new _via_temporal_segmenter(this.temporal_segmenter_container,
                                                          vid0,
                                                          this.d,
                                                          this.file_annotator[0][0].file_html_element
                                                         );
    //_via_util_msg_show('Press <span class="key">Space</span> to Play or Pause the video at any time.', true);
  }.bind(this), function(err) {
    _via_util_msg_show('Failed to load video!', true);
  }.bind(this));
  /*
  this._metadata_show(this.view_metadata_container,
                      _VIA_ATTRIBUTE_ANCHOR.FILE1_Z1_XY0);
  */
}

_via_view_annotator.prototype._view_annotate_two_images = function(vid) {
  this.view_mode = _VIA_VIEW_MODE.IMAGE2;

  this.c.innerHTML = '';
  // for viewing content of a view and definition of metadata.{xy, z, av} for the view
  this.view_content_container = document.createElement('div');
  this.view_content_container.setAttribute('class', 'view_content_container');

  // for definition of metadata.{z, v} for a view
  this.view_metadata_container = document.createElement('div');
  this.view_metadata_container.setAttribute('class', 'view_metadata_container');

  this.c.setAttribute('style', 'grid-template-rows:1fr auto;')
  this.c.appendChild(this.view_content_container);
  this.c.appendChild(this.view_metadata_container);
  this.view_metadata_container.style.display = 'block';

  this.file_annotator = [];
  this.file_container = [];
  this.view_content_container.innerHTML = '';
  this._view_split_content_container(this.view_content_container, this.file_container, 1, 2);

  this.file_annotator[0] = [];
  var vid0 = this.d.view_get_file_vid( this.d.store.view[vid].fid_list[0] );
  var vid1 = this.d.view_get_file_vid( this.d.store.view[vid].fid_list[1] );
  this.file_annotator[0][0] = new _via_file_annotator(this, this.d, vid0, 'Image 1', this.file_container[0][0]);
  this.file_annotator[0][1] = new _via_file_annotator(this, this.d, vid1, 'Image 2', this.file_container[0][1]);

  // first setup view metadata editor
  this.img_pair_annotator_container = document.createElement('div');
  this.img_pair_annotator_container.classList.add('img_pair_annotator_container');
  this.view_metadata_container.innerHTML = '';
  this.view_metadata_container.appendChild(this.img_pair_annotator_container);
  this._metadata_update();

  // then load files
  var promise_list = [];
  promise_list.push( this.file_annotator[0][0]._file_load() );
  promise_list.push( this.file_annotator[0][1]._file_load() );
  Promise.all( promise_list ).then( function(ok) {
  }.bind(this), function(err) {
    console.warn('Failed to load images');
    _via_util_msg_show('Failed to load images!');
  }.bind(this));

}

_via_view_annotator.prototype._view_has_only_image = function(vid) {
  var fid;
  for ( var vfindex in this.d.store.view[vid].fid_list ) {
    fid = this.d.store.view[vid].fid_list[vfindex];
    if ( this.d.store.file[fid].type !== _VIA_FILE_TYPE.IMAGE ) {
      return false;
    }
  }
  return true;
}

_via_view_annotator.prototype._view_has_only_video = function(vid) {
  var fid;
  for ( var vfindex in this.d.store.view[vid].fid_list ) {
    fid = this.d.store.view[vid].fid_list[vfindex];
    if ( this.d.store.file[fid].type !== _VIA_FILE_TYPE.VIDEO ) {
      return false;
    }
  }
  return true;
}

_via_view_annotator.prototype._view_has_only_audio = function(vid) {
  var fid;
  for ( var vfindex in this.d.store.view[vid].fid_list ) {
    fid = this.d.store.view[vid].fid_list[vfindex];
    if ( this.d.store.file[fid].type !== _VIA_FILE_TYPE.AUDIO ) {
      return false;
    }
  }
  return true;
}

//
// view container
//
_via_view_annotator.prototype._view_split_content_container = function(container, file_container, nrow, ncol) {
  for ( var i = 0; i < nrow; ++i ) {
    file_container[i] = [];
    for ( var j = 0; j < ncol; ++j ) {
      file_container[i][j] = document.createElement('div');
      file_container[i][j].setAttribute('class', 'file_container');
      file_container[i][j].setAttribute('data-i', i);
      file_container[i][j].setAttribute('data-j', j);
      container.appendChild(file_container[i][j]);
    }
  }
  container.setAttribute('style',
                         'grid-template-columns:repeat(' + ncol + ',1fr);' +
                         'grid-template-rows:repeat(' + nrow + ',1fr);' +
                         'grid-gap:0.5em;');
}

//
// misc
//
_via_view_annotator.prototype.set_region_draw_shape = function(shape) {
  if ( _VIA_RSHAPE.hasOwnProperty(shape) ) {
    this.region_draw_shape = _VIA_RSHAPE[shape];
    switch(this.region_draw_shape) {
    case _VIA_RSHAPE.POINT:
      _via_util_msg_show('Click to define feature points');
      break;
    case _VIA_RSHAPE.RECT:
      _via_util_msg_show('Click and drag mouse cursor to define a rectangular region');
      break;
    case _VIA_RSHAPE.CIRCLE:
      _via_util_msg_show('Click and drag mouse cursor to define a circular region');
      break;
    case _VIA_RSHAPE.ELLIPSE:
      _via_util_msg_show('Click and drag mouse cursor to define a elliptical region');
      break;
    case _VIA_RSHAPE.LINE:
      _via_util_msg_show('Click and drag mouse cursor to define a line region');
      break;
    case _VIA_RSHAPE.POLYLINE:
      _via_util_msg_show('Click to define vertices of polyline and to finish click at the last vertex.');
      break;
    case _VIA_RSHAPE.POLYGON:
      _via_util_msg_show('Click to define vertices of polygon and to finish click at the last vertex.');
      break;
    }
  }
}

//
// cleanup
//
_via_view_annotator.prototype._view_clear_all_file_annotator = function() {
  for ( var i = 0; i < this.file_annotator.length; ++i ) {
    for ( var j = 0; j < this.file_annotator[i].length; ++j ) {
      this.file_annotator[i][j]._destroy_file_object_url();
    }
  }
}

//
// view metadata editor
//
_via_view_annotator.prototype._metadata_update = function() {
  var anchor_id = 'FILEN_Z0_XY0';
  var table = document.createElement('table');
  // this view has no metadata
  for ( var aindex in this.d.cache.attribute_group[anchor_id] ) {
    var mid = '';
    var aid = this.d.cache.attribute_group[anchor_id][aindex];
    if ( this.d.cache.mid_list.hasOwnProperty(this.vid) ) {
      mid = this.d.cache.mid_list[this.vid][0];
    }
    table.appendChild( this._metadata_table_row(aid, mid) );
  }

  this.img_pair_annotator_container.innerHTML = '';
  this.img_pair_annotator_container.appendChild(table);
}

_via_view_annotator.prototype._metadata_table_row = function(aid, mid) {
  var tr = document.createElement('tr');

  var adesc_col = document.createElement('td');
  adesc_col.innerHTML = this.d.store.attribute[aid].desc;
  tr.appendChild(adesc_col);

  var aopt_col = document.createElement('td');
  aopt_col.appendChild(this._attribute_html_element(aid, this._metadata_on_update.bind(this), mid));
  tr.appendChild(aopt_col);
  return tr;
}

_via_view_annotator.prototype._metadata_on_update = function(e) {
  var aid = e.target.dataset.aid;
  var oid = e.target.dataset.oid;
  var mid = e.target.dataset.mid;
  if ( mid ) {
    var mid = e.target.dataset.mid;
    // update existing metadata
    this.d.metadata_update_av(this.vid, mid, aid, oid).then( function(ok) {
      _via_util_msg_show('Update metadata');
    }.bind(this), function(err) {
      _via_util_msg_show('Failed to update metadata!');
    }.bind(this));
  } else {
    // add new metadata
    var av = {};
    av[aid] = oid;
    this.d.metadata_add(this.vid, [], [], av).then( function(ok) {
      _via_util_msg_show('Created metadata');
      this._metadata_update();
    }.bind(this), function(err) {
      _via_util_msg_show('Failed to update metadata!');
    }.bind(this));
  }

}

//
// attribute helper methods
//
_via_view_annotator.prototype._attribute_html_element = function(aid, onchange_handler, mid) {
  var el;
  switch(this.d.store.attribute[aid].type) {
  case _VIA_ATTRIBUTE_TYPE.TEXT:
    el = document.createElement('textarea');
    if ( mid !== '' &&
         this.d.store.metadata[mid].av.hasOwnProperty(aid)
       ) {
      el.innerHTML = this.d.store.metadata[mid].av[aid];
    }
    break;

  case _VIA_ATTRIBUTE_TYPE.SELECT:
    el = document.createElement('select');
    var selected_oid = '';
    if ( mid!== '' &&
         this.d.store.metadata[mid].av.hasOwnProperty(aid)
       ) {
      selected_oid = this.d.store.metadata[mid].av[aid];
    }

    var oid;
    for ( oid in this.d.store.attribute[aid].options ) {
      var oi = document.createElement('option');
      oi.setAttribute('value', oid);
      oi.setAttribute('data-oid', oid);
      oi.setAttribute('data-aid', aid);
      if ( mid !== '' ) {
        oi.setAttribute('data-mid', mid);
      }
      if ( selected_oid === oid ) {
        oi.setAttribute('selected', 'true');
      }
      oi.setAttribute('name', this.d.store.attribute[aid].options[oid]);
      oi.addEventListener('change', onchange_handler);
      el.appendChild(oi);
    }
    break;

  case _VIA_ATTRIBUTE_TYPE.RADIO:
    el = document.createElement('div');
    var selected_oid = '';
    if ( mid!== '' &&
         this.d.store.metadata[mid].av.hasOwnProperty(aid)
       ) {
      selected_oid = this.d.store.metadata[mid].av[aid];
    }

    var oid;
    for ( oid in this.d.store.attribute[aid].options ) {
      var container = document.createElement('span');
      container.setAttribute('class', 'nobreak');
      var inp = document.createElement('input');
      inp.setAttribute('type', 'radio');
      inp.setAttribute('value', oid);
      inp.setAttribute('data-oid', oid);
      inp.setAttribute('data-aid', aid);
      if ( mid !== '' ) {
        inp.setAttribute('data-mid', mid);
      }

      inp.setAttribute('name', this.d.store.attribute[aid].aname);
      inp.addEventListener('change', onchange_handler);
      if ( selected_oid === oid ) {
        inp.checked = true;
      } else {
        inp.checked = false;
      }

      var label = document.createElement('label');
      label.setAttribute('for', oid);
      label.innerHTML = this.d.store.attribute[aid].options[oid];
      container.appendChild(inp);
      container.appendChild(label);
      el.appendChild(container);
    }
    break;

  default:
    console.warn('undefined attribute type = ' + this.type);
  }
  return el;
}

//
// keyboard handler
//
_via_view_annotator.prototype._on_event_keydown = function(e) {
  if ( e.key === ' ' ) {
    if ( this.view_mode === _VIA_VIEW_MODE.VIDEO1 ||
         this.view_mode === _VIA_VIEW_MODE.AUDIO1
       ) {
      e.preventDefault();
      if ( this.file_annotator[0][0].file_html_element.paused ) {
        this.file_annotator[0][0].file_html_element.play();
      } else {
        this.file_annotator[0][0].file_html_element.pause();
      }
    }
    return;
  }

  if ( e.key === 'ArrowLeft' || e.key === 'ArrowRight' ) {
    if ( this.view_mode === _VIA_VIEW_MODE.IMAGE2 ) {
      e.preventDefault();
      if ( e.key === 'ArrowRight' ) {
        this.emit_event('view_next', {});
      } else {
        this.emit_event('view_prev', {});
      }
      return;
    }
  }

  if ( this.temporal_segmenter ) {
    this.temporal_segmenter._on_event_keydown(e);
  }
}

//
// external events
//
_via_view_annotator.prototype._on_event_metadata_add = function(data, event_payload) {
  var vid = event_payload.vid;
  var mid = event_payload.mid;

  if ( typeof(this.temporal_segmenter) !== 'undefined' ) {
    this.temporal_segmenter._on_event_metadata_add(vid, mid);
  }
}

_via_view_annotator.prototype._on_event_metadata_update = function(data, event_payload) {
  var vid = event_payload.vid;
  var mid = event_payload.mid;

  if ( typeof(this.temporal_segmenter) !== 'undefined' ) {
    this.temporal_segmenter._on_event_metadata_update(vid, mid);
  }
}
