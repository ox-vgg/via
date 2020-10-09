/**
 *
 * @class
 * @classdesc VIA Control Panel customized for subtitle annotator
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 9 Oct. 2020
 *
 */

function _via_control_panel(control_panel_container, via) {
  this._ID = '_via_control_panel_';
  this.c   = control_panel_container;
  this.via = via;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  _via_event.call( this );

  this._init();
}

_via_control_panel.prototype._init = function(type) {
  this.c.innerHTML = '';

  var logo_panel = document.createElement('div');
  logo_panel.setAttribute('class', 'logo');
  logo_panel.innerHTML = '<a href="http://www.robots.ox.ac.uk/~vgg/software/via/" title="VGG Image Annotator (VIA)" target="_blank">VIA</a>'
  this.c.appendChild(logo_panel);

  this.c.appendChild(this.via.vm.c);
  this._add_view_manager_tools();

  this._add_spacer();
  var subtitle = _via_util_get_svg_button('micon_subtitle', 'Import Subtitle from a WebVTT file');
  subtitle.addEventListener('click', function() {
    if(this.via.va.view_mode === _VIA_VIEW_MODE.AV_SUBTITLE) {
      _via_util_file_select_local(_VIA_FILE_SELECT_TYPE.WEBVTT, this._subtitle_import_on_local_file_select.bind(this), false);
    } else {
      _via_util_msg_show('Load a video or audio file before importing subtitle from WebVTT file.');
    }
  }.bind(this));
  this.c.appendChild(subtitle);

  this._add_spacer();
  this._add_project_tools();

  this._add_spacer();

  this._add_project_share_tools();

  this._add_spacer();

  var keyboard = _via_util_get_svg_button('micon_keyboard', 'Keyboard Shortcuts');
  keyboard.addEventListener('click', function() {
    _via_util_page_show('page_keyboard_shortcut');
  }.bind(this));
  this.c.appendChild(keyboard);

  var help = _via_util_get_svg_button('micon_help', 'About VIA');
  help.addEventListener('click', function() {
    _via_util_page_show('page_about');
  }.bind(this));
  this.c.appendChild(help);
}

_via_control_panel.prototype._add_spacer = function() {
  var spacer = document.createElement('div');
  spacer.setAttribute('class', 'spacer');
  this.c.appendChild(spacer);
}

_via_control_panel.prototype._add_view_manager_tools = function() {
  var prev_view = _via_util_get_svg_button('micon_navigate_prev', 'Show Previous File', 'show_prev');
  prev_view.addEventListener('click', this.via.vm._on_prev_view.bind(this.via.vm));
  this.c.appendChild(prev_view);

  var next_view = _via_util_get_svg_button('micon_navigate_next', 'Show Next File', 'show_next');
  next_view.addEventListener('click', this.via.vm._on_next_view.bind(this.via.vm));
  this.c.appendChild(next_view);

  var add_media_local = _via_util_get_svg_button('micon_add_circle', 'Add Audio or Video File in Local Computer', 'add_media_local');
  add_media_local.addEventListener('click', this.via.vm._on_add_media_local.bind(this.via.vm));
  this.c.appendChild(add_media_local);

  var add_media_bulk = _via_util_get_svg_button('micon_lib_add', 'Bulk add file URI ( e.g. file:///... or http://... ) contained in a local CSV file where each row is a remote or local filename.', 'add_media_bulk');
  //add_media_bulk.addEventListener('click', this.via.vm._on_add_media_bulk.bind(this.via.vm));
  add_media_bulk.addEventListener('click', function() {
    var action_map = {
      'via_page_fileuri_button_bulk_add':this._page_on_action_fileuri_bulk_add.bind(this),
    }
    _via_util_page_show('page_fileuri_bulk_add', action_map);
  }.bind(this));
  this.c.appendChild(add_media_bulk);

  var del_view = _via_util_get_svg_button('micon_remove_circle', 'Remove the Current File', 'remove_media');
  del_view.addEventListener('click', this.via.vm._on_del_view.bind(this.via.vm));
  this.c.appendChild(del_view);
}

_via_control_panel.prototype._add_region_shape_selector = function() {
  if ( document.getElementById('shape_point') === null ) {
    return;
  }

  var rect = _via_util_get_svg_button('shape_rectangle', 'Rectangle', 'RECTANGLE');
  rect.addEventListener('click', function() {
    this._set_region_shape('RECTANGLE');
  }.bind(this));
  this.c.appendChild(rect);

  var extreme_rect = _via_util_get_svg_button('shape_extreme_rectangle', 'Extreme rectangle is defined using four points along the boundary of a rectangular object.', 'EXTREME_RECTANGLE');
  extreme_rect.classList.add('shape_selector');
  extreme_rect.addEventListener('click', function() {
    this._set_region_shape('EXTREME_RECTANGLE');
  }.bind(this));
  this.c.appendChild(extreme_rect);

  var circle = _via_util_get_svg_button('shape_circle', 'Circle', 'CIRCLE');
  circle.addEventListener('click', function() {
    this._set_region_shape('CIRCLE');
  }.bind(this));
  this.c.appendChild(circle);

  var extreme_circle = _via_util_get_svg_button('shape_extreme_circle', 'Extreme circle is defined using any three points along the circumference of a circular object.', 'EXTREME_CIRCLE');
  extreme_circle.addEventListener('click', function() {
    this._set_region_shape('EXTREME_CIRCLE');
  }.bind(this));
  this.c.appendChild(extreme_circle);

  var ellipse = _via_util_get_svg_button('shape_ellipse', 'Ellipse', 'ELLIPSE');
  ellipse.addEventListener('click', function() {
    this._set_region_shape('ELLIPSE');
  }.bind(this));
  this.c.appendChild(ellipse);

  var line = _via_util_get_svg_button('shape_line', 'Line', 'LINE');
  line.addEventListener('click', function() {
    this._set_region_shape('LINE');
  }.bind(this));
  this.c.appendChild(line);

  var polygon = _via_util_get_svg_button('shape_polygon', 'Polygon', 'POLYGON');
  polygon.addEventListener('click', function() {
    this._set_region_shape('POLYGON');
  }.bind(this));
  this.c.appendChild(polygon);

  var polyline = _via_util_get_svg_button('shape_polyline', 'Polyline', 'POLYLINE');
  polyline.addEventListener('click', function() {
    this._set_region_shape('POLYLINE');
  }.bind(this));
  this.c.appendChild(polyline);

  var point = _via_util_get_svg_button('shape_point', 'Point', 'POINT');
  point.addEventListener('click', function() {
    this._set_region_shape('POINT');
  }.bind(this));
  this.c.appendChild(point);

  this.shape_selector_list = { 'POINT':point, 'RECTANGLE':rect, 'EXTREME_RECTANGLE':extreme_rect, 'CIRCLE':circle, 'EXTREME_CIRCLE':extreme_circle, 'ELLIPSE':ellipse, 'LINE':line, 'POLYGON':polygon, 'POLYLINE':polyline };
}

_via_control_panel.prototype._set_region_shape = function(shape) {
  this.emit_event( 'region_shape', {'shape':shape});
  for ( var si in this.shape_selector_list ) {
    if ( si === shape ) {
      this.shape_selector_list[si].classList.add('svg_button_selected');
    } else {
      this.shape_selector_list[si].classList.remove('svg_button_selected');
    }
  }
}

_via_control_panel.prototype._add_project_tools = function() {
  var load = _via_util_get_svg_button('micon_open', 'Open a VIA Project');
  load.addEventListener('click', function() {
    _via_util_file_select_local(_VIA_FILE_SELECT_TYPE.JSON, this._project_load_on_local_file_select.bind(this), false);
  }.bind(this));
  this.c.appendChild(load);

  var save = _via_util_get_svg_button('micon_save', 'Save current VIA Project');
  save.addEventListener('click', function() {
    this.via.d.project_save();
  }.bind(this));
  this.c.appendChild(save);

  var import_export_annotation = _via_util_get_svg_button('micon_import_export', 'Import or Export Annotations');
  import_export_annotation.addEventListener('click', this._page_show_import_export.bind(this));
  this.c.appendChild(import_export_annotation);
}

_via_control_panel.prototype._page_show_import_export = function(d) {
  var action_map = {
    'via_page_button_import':this._page_on_action_import.bind(this),
    'via_page_button_export':this._page_on_action_export.bind(this),
  }
  _via_util_page_show('page_import_export', action_map);
}

_via_control_panel.prototype._page_on_action_import = function(d) {
  if ( d._action_id === 'via_page_button_import' ) {
    if ( d.via_page_import_pid !== '' ) {
      this.via.s._project_pull(d.via_page_import_pid).then( function(remote_rev) {
        try {
          var project = JSON.parse(remote_rev);
          // clear remote project identifiers
          project.project.pid = _VIA_PROJECT_ID_MARKER;
          project.project.rev = _VIA_PROJECT_REV_ID_MARKER;
          project.project.rev_timestamp = _VIA_PROJECT_REV_TIMESTAMP_MARKER;
          this.via.d.project_load_json(project);
        }
        catch(e) {
          _via_util_msg_show('Malformed response from server: ' + e);
        }
      }.bind(this), function(err) {
        _via_util_msg_show(err + ': ' + d.via_page_import_pid);
      }.bind(this));
      return;
    }

    if ( d.via_page_import_via2_project_json.length === 1 ) {
      _via_util_load_text_file(d.via_page_import_via2_project_json[0],
                               this._project_import_via2_on_local_file_read.bind(this)
                              );
      return;
    }
    _via_util_msg_show('To import an existing shared project, you must enter its project-id.');
  }
}

_via_control_panel.prototype._page_on_action_export = function(d) {
  if ( d._action_id === 'via_page_button_export' ) {
    this.via.ie.export_to_file(d.via_page_export_format);
  }
}

_via_control_panel.prototype._project_load_on_local_file_select = function(e) {
  if ( e.target.files.length === 1 ) {
    _via_util_load_text_file(e.target.files[0], this._project_load_on_local_file_read.bind(this));
  }
}

_via_control_panel.prototype._project_load_on_local_file_read = function(project_data_str) {
  this.via.d.project_load(project_data_str);
}

_via_control_panel.prototype._project_import_via2_on_local_file_read = function(project_data_str) {
  this.via.d.project_import_via2_json(project_data_str);
}

_via_control_panel.prototype._add_project_share_tools = function() {
  if ( this.via.s ) {
    var share = _via_util_get_svg_button('micon_share', 'Information about sharing this VIA project with others for collaborative annotation');
    share.addEventListener('click', function() {
      this._share_show_info();
    }.bind(this));
    var push = _via_util_get_svg_button('micon_upload', 'Push (i.e. share this project or share your updates made to this project)');
    push.addEventListener('click', function() {
      this.via.s.push();
    }.bind(this));

    var pull = _via_util_get_svg_button('micon_download', 'Pull (i.e. open a shared project or fetch updates for the current project)');
    pull.addEventListener('click', function() {
      this._share_show_pull();
    }.bind(this));

    this.c.appendChild(share);
    this.c.appendChild(push);
    this.c.appendChild(pull);
  }
}

_via_control_panel.prototype._share_show_info = function() {
  if ( this.via.d.project_is_remote() ) {
    this.via.s.exists(this.via.d.store.project.pid).then( function() {
      this.via.s._project_pull(this.via.d.store.project.pid).then( function(ok) {
        try {
          var d = JSON.parse(ok);
          var remote_rev_timestamp = new Date( parseInt(d.project.rev_timestamp) );
          var local_rev_timestamp = new Date( parseInt(this.via.d.store.project.rev_timestamp) );

          var pinfo = '<table>';
          pinfo += '<tr><td>Project Id</td><td>' + d.project.pid + '</td></tr>';
          pinfo += '<tr><td>Remote Revision</td><td>' + d.project.rev + ' (' + remote_rev_timestamp.toUTCString() + ')</td></tr>';
          pinfo += '<tr><td>Local Revision</td><td>' + this.via.d.store.project.rev + ' (' + local_rev_timestamp.toUTCString() + ')</td></tr>';
          pinfo += '</table>';
          if ( d.project.rev !== this.via.d.store.project.rev ) {
            pinfo += '<p>Your version of this project is <span style="color:red;">old</span>. Press <svg class="svg_icon" onclick="" viewbox="0 0 24 24"><use xlink:href="#micon_download"></use></svg> to fetch the most recent version of this project.</p>';
          } else {
            pinfo += '<p>You already have the <span style="color:blue;">latest</span> revision of this project.</p>';
          }

          document.getElementById('via_page_share_project_info').innerHTML = pinfo;
          document.getElementById('via_page_share_project_id').innerHTML = d.project.pid;
          _via_util_page_show('page_share_already_shared');
        }
        catch(e) {
          console.log(e)
          _via_util_msg_show('Malformed server response.' + e);
        }
      }.bind(this), function(pull_err) {
        _via_util_msg_show('Failed to pull project.');
        console.warn(pull_err);
      }.bind(this));
    }.bind(this), function(exists_err) {
      _via_util_page_show('page_share_not_shared_yet');
      console.warn(exists_err);
    }.bind(this));
  } else {
    _via_util_page_show('page_share_not_shared_yet');
  }
}

_via_control_panel.prototype._share_show_pull = function() {
  if ( this.via.d.project_is_remote() ) {
    // check if remote project has newer version
    this.via.s._project_pull(this.via.d.store.project.pid).then( function(ok) {
      try {
        var d = JSON.parse(ok);
        if ( d.project.rev === this.via.d.store.project.rev ) {
          _via_util_msg_show('You already have the latest revision of this project');
          return;
        } else {
          this.via.d.project_merge_rev(d);
        }
      }
      catch(e) {
        _via_util_msg_show('Malformed response from server.');
        console.warn(e);
      }
    }.bind(this), function(err) {
      _via_util_msg_show('Failed to pull project.');
      console.warn(err);
    }.bind(this));
  } else {
    var action_map = {
      'via_page_button_open_shared':this._page_on_action_open_shared.bind(this),
    }
    _via_util_page_show('page_share_open_shared', action_map);
  }
}

_via_control_panel.prototype._page_on_action_open_shared = function(d) {
  if ( d._action_id === 'via_page_button_open_shared' ) {
    this.via.s.pull(d.via_page_input_pid);
  }
}

_via_control_panel.prototype._page_on_action_fileuri_bulk_add = function(d) {
  if ( d.via_page_fileuri_urilist.length ) {
    this.fileuri_bulk_add_from_url_list(d.via_page_fileuri_urilist);
  }

  if ( d.via_page_fileuri_importfile.length === 1 ) {
    switch( parseInt(d.via_page_fileuri_filetype) ) {
    case _VIA_FILE_TYPE.IMAGE:
      _via_util_load_text_file(d.via_page_fileuri_importfile[0], this.fileuri_bulk_add_image_from_file.bind(this));
      break;
    case _VIA_FILE_TYPE.AUDIO:
      _via_util_load_text_file(d.via_page_fileuri_importfile[0], this.fileuri_bulk_add_audio_from_file.bind(this));
      break;
    case _VIA_FILE_TYPE.VIDEO:
      _via_util_load_text_file(d.via_page_fileuri_importfile[0], this.fileuri_bulk_add_video_from_file.bind(this));
      break;
    default:
      _via_util_load_text_file(d.via_page_fileuri_importfile[0], this.fileuri_bulk_add_auto_from_file.bind(this));
    }

  }
}

_via_control_panel.prototype.fileuri_bulk_add_image_from_file = function(uri_list_str) {
  this.fileuri_bulk_add_from_url_list(uri_list_str, _VIA_FILE_TYPE.IMAGE);
}

_via_control_panel.prototype.fileuri_bulk_add_audio_from_file = function(uri_list_str) {
  this.fileuri_bulk_add_from_url_list(uri_list_str, _VIA_FILE_TYPE.AUDIO);
}

_via_control_panel.prototype.fileuri_bulk_add_video_from_file = function(uri_list_str) {
  this.fileuri_bulk_add_from_url_list(uri_list_str, _VIA_FILE_TYPE.VIDEO);
}

_via_control_panel.prototype.fileuri_bulk_add_auto_from_file = function(uri_list_str) {
  this.fileuri_bulk_add_from_url_list(uri_list_str, 0);
}

_via_control_panel.prototype.fileuri_bulk_add_from_url_list = function(uri_list_str, type) {
  var uri_list = uri_list_str.split('\n');
  if ( uri_list.length ) {
    var filelist = [];
    for ( var i = 0; i < uri_list.length; ++i ) {
      if ( uri_list[i] === '' ||
           uri_list[i] === ' ' ||
           uri_list[i] === '\n'
         ) {
        continue; // skip
      }
      var filetype;
      if ( type === 0 || typeof(type) === 'undefined' ) {
        filetype = _via_util_infer_file_type_from_filename(uri_list[i]);
      } else {
        filetype = type;
      }

      filelist.push({ 'fname':uri_list[i],
                      'type':filetype,
                      'loc':_via_util_infer_file_loc_from_filename(uri_list[i]),
                      'src':uri_list[i],
                    });
    }
    this.via.vm._file_add_from_filelist(filelist);
  }
}

//
// subtitle import
//
_via_control_panel.prototype._subtitle_import_on_local_file_select = function(e) {
  if ( e.target.files.length === 1 ) {
    _via_util_load_text_file(e.target.files[0], this._subtitle_import_on_local_file_read.bind(this));
  }
}

_via_control_panel.prototype._subtitle_import_on_local_file_read = function(webvtt_str) {
  this.via.ie.import_from_webvtt(webvtt_str, this.via.va.vid, this.via.SUBTITLE_AID).then( function(ok) {
  }.bind(this), function(err) {
  }.bind(this));
}
