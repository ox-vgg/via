/**
 * Builds user interface and control handlers to allow
 * subtitle annotation of a video or audio file.

 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 9 Oct. 2020
 *
 */

'use strict';

const _VIA_VIEW_MODE = {'UNKNOWN':0,
                        'IMAGE1':1, 'IMAGE2':2, 'IMAGEK':3,
                        'VIDEO1':101, 'VIDEO2':102, 'VIDEOK':103,
                        'AUDIO1':201, 'AUDIO2':202, 'AUDIOK':203,
                        'AV_SUBTITLE':301,
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
  if( file_count === 1 &&
      (this._view_has_only_video(vid) || this._view_has_only_audio(vid))
    ) {
      this._view_annotate_single_audio_or_video_subtitle(vid);
  } else {
    console.warn('View mode not supported yet!');
    _via_util_msg_show('Subtitle editor only supports annotation of single video or audio');
  }
}

_via_view_annotator.prototype._view_annotate_single_audio_or_video_subtitle = function(vid) {
  this.group_aid_candidate_list = [];
  if ( this.d.cache.attribute_group.hasOwnProperty('FILE1_Z2_XY0') ) {
    for ( var aindex in this.d.cache.attribute_group['FILE1_Z2_XY0'] ) {
      this.group_aid_candidate_list.push( this.d.cache.attribute_group['FILE1_Z2_XY0'][aindex] );
    }
  }
  if(this.group_aid_candidate_list.length) {
    this.groupby_aid = this.group_aid_candidate_list[0];
    this.view_mode = _VIA_VIEW_MODE.AV_SUBTITLE;
  } else {
    this.c.innerHTML = '<p>You must define an attribute with anchor "Temporal Segment in Video or Audio" in order to define temporal segments in this file. Click&nbsp;<svg class="svg_icon" viewbox="0 0 24 24"><use xlink:href="#micon_insertcomment"></use></svg>&nbsp;button to define such attributes using attribute editor.</p><p>After defining the attribute, <span class="text_button" onclick="via.va.view_show(via.va.vid);">reload this file</span></p>.';
    this.view_mode = _VIA_VIEW_MODE.UNKNOWN;
    return;
  }

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
  this._view_split_content_container(this.view_content_container, this.file_container, 1, 2);

  this.file_annotator[0] = [];
  var fid0 = this.d.store.view[vid].fid_list[0];
  var vid0 = this.d.view_get_file_vid( fid0 );
  this.file_annotator[0][0] = new _via_file_annotator(this, this.d, vid0, '', this.file_container[0][1]);

  this.file_annotator[0][0]._file_load().then( function(ok) {
    this.view_metadata_container.innerHTML = '';

    // setup view metadata editor
    this.temporal_segmenter_container = document.createElement('div');
    this.temporal_segmenter_container.classList.add('temporal_segmenter_container');
    this.view_metadata_container.appendChild(this.temporal_segmenter_container);
    this.temporal_segmenter = new _via_temporal_segmenter(this.file_annotator[0][0],
                                                          this.temporal_segmenter_container,
                                                          vid0,
                                                          this.groupby_aid,
                                                          this.d,
                                                          this.file_annotator[0][0].file_html_element
                                                         );
    this.subtitle_editor_container = this.file_container[0][0];
    this.subtitle_editor_container.setAttribute('id', 'subtitle_editor');
    this.subtitle_editor_container.setAttribute('class', '');
    this.subtitle_editor = new _via_subtitle_editor(this.groupby_aid, this.d, this.temporal_segmenter, this.subtitle_editor_container);
  }.bind(this), function(err) {
    this.c.removeChild(this.view_metadata_container);
    this.c.setAttribute('style', 'grid-template-rows:1fr;')
  }.bind(this));
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
// cleanup
//
_via_view_annotator.prototype._view_clear_all_file_annotator = function() {
  // _via_file_annotator are attached as events listeners in _via_data
  // we must also remove these events listeners
  // cleanup resources acquired by each of this.file_annotator[i][j]
  for ( var i = 0; i < this.file_annotator.length; ++i ) {
    for ( var j = 0; j < this.file_annotator[i].length; ++j ) {
      this.d.clear_events(this.file_annotator[i][j]._ID );
      delete this.file_annotator[i][j];
    }
  }
}

//
// keyboard handler
//
_via_view_annotator.prototype._on_event_keydown = function(e) {
  if(this.temporal_segmenter) {
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
