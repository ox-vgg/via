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
  this._ID = '_via_view_annotator_';
  this.d = data;
  this.c = container;
  this.file_annotator = [];
  this.view_mode = _VIA_VIEW_MODE.UNKNOWN;

  // constants
  this.GTIMELINE_ROW_DEFAULT_COUNT = '4';
  this.GTIMELINE_ROW_HEIGHT_MAP = { '1':21, '2':24, '3':28, '4':32, '5':37, '6':41, '7':45,'8':49,'9':53,'10':57,'12':65,'14':73,'16':80 };

  // state variables
  this.region_draw_shape = _VIA_RSHAPE.RECTANGLE;
  this.creg_label_aid = '1';

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  _via_event.call( this );

  this.d.on_event('metadata_add', this._ID, this._on_event_metadata_add.bind(this));
  this.d.on_event('metadata_update', this._ID, this._on_event_metadata_update.bind(this));

  this._init();
}

_via_view_annotator.prototype._init = function() {
  this._view_clear_all_file_annotator();
  this._show_start_info();

  if ( ! this.d.store.config.ui.hasOwnProperty('spatial_region_label_attribute_id') ) {
    this.d.store.config.ui['spatial_region_label_attribute_id'] = '';
  }
}

_via_view_annotator.prototype._zoom_toggle = function() {
  for(var i = 0; i < this.file_annotator.length; ++i) {
    for(var j = 0; j < this.file_annotator[i].length; ++j) {
      this.file_annotator[i][j]._zoom_toggle.bind(this.file_annotator[i][j])();
    }
  }
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
  }.bind(this), function(err) {
    // handled by _via_file_annotator._file_load_show_error_page();
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

  if(this.d.store['config']['ui'].hasOwnProperty('gtimeline_container_height')) {
    // fix for pixel height stored by projects created using via-3.0.7
    var via307_fix = { '17':'1','20':'2','24':'3','28':'4','33':'5','37':'6','41':'7','45':'8','49':'9','53':'10','61':'12','69':'14','76':'16','85':'18' };
    if(this.d.store['config']['ui']['gtimeline_container_height'] in via307_fix) {
      this.d.store['config']['ui']['gtimeline_visible_row_count'] = via307_fix[ this.d.store['config']['ui']['gtimeline_container_height'] ];
    }
    delete this.d.store['config']['ui']['gtimeline_container_height'];
  }
  if( !this.d.store['config']['ui'].hasOwnProperty('gtimeline_visible_row_count')) {
    this.d.store['config']['ui']['gtimeline_visible_row_count'] = this.GTIMELINE_ROW_DEFAULT_COUNT;
  }

  var gtimeline_visible_row_count = this.d.store['config']['ui']['gtimeline_visible_row_count'];
  this.gtimeline_container_height = this.GTIMELINE_ROW_HEIGHT_MAP[gtimeline_visible_row_count];
  this.c.setAttribute('style', 'grid-template-rows:1fr ' + this.gtimeline_container_height + 'ch;')
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
    this.temporal_segmenter = new _via_temporal_segmenter(this.file_annotator[0][0],
                                                          this.temporal_segmenter_container,
                                                          vid0,
                                                          this.d,
                                                          this.file_annotator[0][0].file_html_element
                                                         );
    this.temporal_segmenter.on_event('edit_frame_regions', this._ID, this.file_annotator[0][0]._on_event_edit_frame_regions.bind(this.file_annotator[0][0]));
  }.bind(this), function(err) {
    this.c.removeChild(this.view_metadata_container);
    this.c.setAttribute('style', 'grid-template-rows:1fr;')
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

  if(this.d.store['config']['ui'].hasOwnProperty('gtimeline_container_height')) {
    // fix for pixel height stored by projects created using via-3.0.7
    var via307_fix = { '17':'1','20':'2','24':'3','28':'4','33':'5','37':'6','41':'7','45':'8','49':'9','53':'10','61':'12','69':'14','76':'16','85':'18' };
    if(this.d.store['config']['ui']['gtimeline_container_height'] in via307_fix) {
      this.d.store['config']['ui']['gtimeline_visible_row_count'] = via307_fix[ this.d.store['config']['ui']['gtimeline_container_height'] ];
    }
    delete this.d.store['config']['ui']['gtimeline_container_height'];
  }
  if( !this.d.store['config']['ui'].hasOwnProperty('gtimeline_visible_row_count')) {
    this.d.store['config']['ui']['gtimeline_visible_row_count'] = this.GTIMELINE_ROW_DEFAULT_COUNT;
  }

  var gtimeline_visible_row_count = this.d.store['config']['ui']['gtimeline_visible_row_count'];
  this.gtimeline_container_height = this.GTIMELINE_ROW_HEIGHT_MAP[gtimeline_visible_row_count];
  this.c.setAttribute('style', 'grid-template-rows:1fr ' + this.gtimeline_container_height + 'ch;')
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
    this.temporal_segmenter = new _via_temporal_segmenter(this.file_annotator[0][0],
                                                          this.temporal_segmenter_container,
                                                          vid0,
                                                          this.d,
                                                          this.file_annotator[0][0].file_html_element
                                                         );
  }.bind(this), function(err) {
    _via_util_msg_show('Failed to load audio!', true);
  }.bind(this));
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
    case _VIA_RSHAPE.RECTANGLE:
      _via_util_msg_show('Click and drag mouse cursor to define a rectangular region');
      break;
    case _VIA_RSHAPE.EXTREME_RECTANGLE:
      _via_util_msg_show('Click and define the left, top, right and bottom (in any order) extreme points of a rectangular object to define its bounding box.');
      break;
    case _VIA_RSHAPE.CIRCLE:
      _via_util_msg_show('Click and drag mouse cursor to define a circular region');
      break;
    case _VIA_RSHAPE.EXTREME_CIRCLE:
      _via_util_msg_show('Click and define three points on the circumference to define a circular region.');
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
  // _via_file_annotator are attached as events listeners in _via_data
  // we must also remove these events listeners
  this.d.clear_events(this._ID, 'metadata_add' );
  this.d.clear_events(this._ID, 'metadata_update' );

  // cleanup resources acquired by each of this.file_annotator[i][j]
  for ( var i = 0; i < this.file_annotator.length; ++i ) {
    for ( var j = 0; j < this.file_annotator[i].length; ++j ) {
      this.d.clear_events(this.file_annotator[i][j]._ID );
      delete this.file_annotator[i][j];
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
  var mid = e.target.dataset.mid;

  var avalue;
  switch(this.d.store.attribute[aid].type) {
  case _VIA_ATTRIBUTE_TYPE.TEXT:
    avalue = e.target.value;
    break;
  default:
    avalue = e.target.dataset.oid;
  }

  if ( mid ) {
    var mid = e.target.dataset.mid;
    // update existing metadata
    this.d.metadata_update_av(this.vid, mid, aid, avalue).then( function(ok) {
      _via_util_msg_show('Update metadata');
    }.bind(this), function(err) {
      _via_util_msg_show('Failed to update metadata!');
    }.bind(this));
  } else {
    // add new metadata
    var av = {};
    av[aid] = avalue;
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
    if ( mid !== '') {
      el.setAttribute('data-mid', mid);
      if(this.d.store.metadata[mid].av.hasOwnProperty(aid)) {
        el.innerHTML = this.d.store.metadata[mid].av[aid];
      }
    }
    el.setAttribute('data-aid', aid);
    el.addEventListener('change', onchange_handler);
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
  if ( this.view_mode === _VIA_VIEW_MODE.VIDEO1 ) {
    this.file_annotator[0][0]._rinput_keydown_handler(e);
    if ( this.file_annotator[0][0].selected_mid_list.length === 0 ) {
      // no spatial region is selected
      // therefore, the temporal segmenter keyhandler should further handle this event
      if ( this.temporal_segmenter ) {
        this.temporal_segmenter._on_event_keydown(e);
      }
    }
    return;
  }

  if ( this.view_mode === _VIA_VIEW_MODE.AUDIO1 ) {
    this.file_annotator[0][0]._rinput_keydown_handler(e);
    if ( this.temporal_segmenter ) {
      this.temporal_segmenter._on_event_keydown(e);
    }
    return;
  }

  if ( this.view_mode === _VIA_VIEW_MODE.IMAGE1 ||
       this.view_mode === _VIA_VIEW_MODE.IMAGE2
     ) {
    if ( this.view_mode === _VIA_VIEW_MODE.IMAGE1 ) {
      this.file_annotator[0][0]._rinput_keydown_handler(e);
    } else {
      if ( e.key === 'ArrowRight' ) {
        this.emit_event('view_next', {});
      } else {
        this.emit_event('view_prev', {});
      }
    }
    return;
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
