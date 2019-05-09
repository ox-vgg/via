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

function _via_view_annotator(data, container ) {
  this.d = data;
  this.c = container;
  this.file_annotator = [];
  this.view_mode = _VIA_VIEW_MODE.UNKNOWN;

  // state variables
  this.region_draw_shape = _VIA_RSHAPE.RECT;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this.event_prefix = '_via_view_annotator_';
  _via_event.call( this );

  this._init();
}

_via_view_annotator.prototype._init = function() {
  // for viewing content of a view and definition of metadata.{xy, z, av} for the view
  this.view_content_container = document.createElement('div');
  this.view_content_container.setAttribute('class', 'view_content_container');
  // for definition of metadata.{z, v} for a view
  this.view_metadata_container = document.createElement('div');
  this.view_metadata_container.setAttribute('class', 'view_metadata_container');

  this.c.appendChild(this.view_content_container);
  this.c.appendChild(this.view_metadata_container);
}

_via_view_annotator.prototype.view_show = function(vid) {
  this._view_clear_all_file_annotator();
  this._view_init(vid);
  this.vid = vid;

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
          console.warn('Not supported yet!');
        }
      }
    }
    break;

  case 2:
    if ( this._view_has_only_image(vid) ) {
      this._view_annotate_two_images(vid);
    } else {
      console.warn('Not supported yet!');
    }
    break;

  default:
    console.warn('Not supported yet!');
  }
}

_via_view_annotator.prototype._view_annotate_single_image = function(vid) {
  console.log('annotate a image');
  this.view_mode = _VIA_VIEW_MODE.IMAGE1;
  this.c.setAttribute('style', 'grid-template-rows:1fr 0fr;')
  this.view_metadata_container.style.display = 'none';

  // occupy the full container with single image
  this.file_annotator = [];
  this.file_container = [];
  this.view_content_container.innerHTML = '';
  this.view_metadata_container.innerHTML = '';
  this._view_split_content_container(this.view_content_container, this.file_container, 1, 1);

  this.file_annotator[0] = [];
  var vid0 = this.d.view_get_file_vid( this.d.store.view[vid].fid_list[0] );
  this.file_annotator[0][0] = new _via_file_annotator(this, this.d, vid0, this.file_container[0][0]);
}

_via_view_annotator.prototype._view_annotate_single_video = function(vid) {
  console.log('annotate a video');
  this.view_mode = _VIA_VIEW_MODE.VIDEO1;
  this.c.setAttribute('style', 'grid-template-rows:1fr 20ch;')
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

_via_view_annotator.prototype._view_annotate_single_audio = function(vid) {
  console.log('annotate an audio');
  this.view_mode = _VIA_VIEW_MODE.VIDEO1;
  this.c.setAttribute('style', 'grid-template-rows:1fr 20ch;')
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
  console.log('annotate an image pair');
  this.view_mode = _VIA_VIEW_MODE.IMAGE2;
  this.c.setAttribute('style', 'grid-template-rows:10fr 2fr;')
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

  var promise_list = [];
  promise_list.push( this.file_annotator[0][0]._file_load() );
  promise_list.push( this.file_annotator[0][1]._file_load() );
  Promise.all( promise_list ).then( function(ok) {
    // setup view metadata editor
    this.img_pair_annotator_container = document.createElement('div');
    this.img_pair_annotator_container.classList.add('img_pair_annotator_container');
    this.view_metadata_container.innerHTML = '';
    this.view_metadata_container.appendChild(this.img_pair_annotator_container);

    this._metadata_show(this.img_pair_annotator_container,
                        'FILEN_Z0_XY0');
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
                         'grid-gap:0;');
}

//
// misc
//
_via_view_annotator.prototype.set_region_draw_shape = function(shape) {
  if ( _VIA_RSHAPE.hasOwnProperty(shape) ) {
    this.region_draw_shape = _VIA_RSHAPE[shape];
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
_via_view_annotator.prototype._metadata_show = function(c, anchor_id) {
  var table = document.createElement('table');
  for ( var aid in this.d.cache.attribute_group[anchor_id] ) {
    table.appendChild( this._metadata_table_row(aid) );
  }
  c.appendChild(table);
}

_via_view_annotator.prototype._metadata_table_row = function(aid) {
  var tr = document.createElement('tr');
  var adesc_col = document.createElement('td');
  adesc_col.innerHTML = this.d.store.attribute[aid].desc;
  tr.appendChild(adesc_col);

  var aopt_col = document.createElement('td');
  aopt_col.appendChild(this._attribute_html_element(aid, this._metadata_on_update.bind(this)));
  tr.appendChild(aopt_col);
  return tr;
}

_via_view_annotator.prototype._metadata_on_update = function(e) {
  console.log(e.target.value)
  var aid = e.target.name;
  var oid = e.target.id;
  var mid = e.target.parentNode.dataset.mid;

  if ( mid ) {
    // update existing metadata
    this.d.metadata_update_av(this.vid, mid, aid, oid).then( function(ok) {
    }.bind(this), function(err) {
      _via_util_msg_show('Failed to update metadata!');
    }.bind(this));
  } else {
    // add new metadata
    var av = {};
    av[aid] = oid;
    this.d.metadata_add(this.vid, [], [], av).then( function(ok) {
      e.target.parentNode.setAttribute('data-mid', ok.mid);
    }.bind(this), function(err) {
      _via_util_msg_show('Failed to update metadata!');
    }.bind(this));
  }

}

//
// attribute helper methods
//
_via_view_annotator.prototype._attribute_html_element = function(aid, onchange_handler) {
  var el;
  switch(this.d.store.attribute[aid].type) {
  case _VIA_ATTRIBUTE_TYPE.TEXT:
    el = document.createElement('textarea');
    break;

  case _VIA_ATTRIBUTE_TYPE.SELECT:
    //@todo
    break;

  case _VIA_ATTRIBUTE_TYPE.RADIO:
    el = document.createElement('div');
    var oid;
    for ( oid in this.d.store.attribute[aid].options ) {
      var inp = document.createElement('input');
      inp.setAttribute('type', 'radio');
      inp.setAttribute('value', oid);
      inp.setAttribute('id', oid);
      inp.setAttribute('name', aid);
      inp.addEventListener('change', onchange_handler);

      var label = document.createElement('label');
      label.setAttribute('for', oid);
      label.innerHTML = this.d.store.attribute[aid].options[oid];
      el.appendChild(inp);
      el.appendChild(label);
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
  console.log(e.key)
  if ( e.key === ' ' ) {
    if ( this.view_mode === _VIA_VIEW_MODE.VIDEO1 ) {
      e.preventDefault();
      if ( this.file_annotator[0][0].file_html_element.paused ) {
        this.file_annotator[0][0].file_html_element.play();
      } else {
        this.file_annotator[0][0].file_html_element.pause();
      }
    }
    return;
  }

  this.temporal_segmenter._on_event_keydown(e);

}
