/**
 *
 * @class
 * @classdesc VIA Control Panel
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 16 May 2019
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

  this._add_spacer();

  var prev_view = _via_util_get_svg_button('micon_navigate_prev', 'Show Prev Image Pair (or, press left arrow key)', 'show_prev');
  prev_view.addEventListener('click', this.via.vm._on_prev_view.bind(this.via.vm));
  this.c.appendChild(prev_view);

  this._add_spacer();

  var next_view = _via_util_get_svg_button('micon_navigate_next', 'Show Next Image Pair (or, press right arrow key)', 'show_next');
  next_view.addEventListener('click', this.via.vm._on_next_view.bind(this.via.vm));
  this.c.appendChild(next_view);

  this._add_spacer();

  var share = _via_util_get_svg_button('micon_share', 'Information about this shared VIA project');
  share.addEventListener('click', function() {
    this._share_show_info();
  }.bind(this));
  this.c.appendChild(share);

  var save = _via_util_get_svg_button('micon_save', 'Save Annotations');
  save.addEventListener('click', function() {
    this.via.s.push();
  }.bind(this));
  this.c.appendChild(save);

  this._add_spacer();
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
          //document.getElementById('via_page_share_project_id').innerHTML = d.project.pid;
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
}

_via_control_panel.prototype._project_load_on_local_file_select = function(e) {
  if ( e.target.files.length === 1 ) {
    _via_util_load_text_file(e.target.files[0], this._project_load_on_local_file_read.bind(this));
  }
}

_via_control_panel.prototype._project_load_on_local_file_read = function(project_data_str) {
  this.via.d.project_load(project_data_str);
}
