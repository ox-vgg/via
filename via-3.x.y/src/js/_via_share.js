/**
 *
 * @class
 * @classdesc Manages communication with VIA project server to allow sharing of VIA projects.
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 24 June 2019
 *
 */

'use strict';

function _via_share(data, conf) {
  this._ID = '_via_share_';
  this.d = data;
  this.conf = conf;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  _via_event.call(this);
}

_via_share.prototype._disable_share = function() {
  this.push   = this._disabled_info;
  this.pull   = this._disabled_info;
  this.exists = this._disabled_info;
}

_via_share.prototype._disabled_info = function() {
  _via_util_msg_show('Share feature has been disabled in demo applications!');
}

_via_share.prototype.push = function() {
  if ( this.d.store.project.pid === _VIA_PROJECT_ID_MARKER &&
       this.d.store.project.rev === _VIA_PROJECT_REV_ID_MARKER &&
       this.d.store.project.rev_timestamp === _VIA_PROJECT_REV_TIMESTAMP_MARKER
     ) {
    // avoid pushing empty projects
    if ( Object.keys(this.d.store.file).length === 0 ||
         Object.keys(this.d.store.view).length === 0
       ) {
      _via_util_msg_show('Cannot push empty project');
      return;
    }

    // create a new project
    _via_util_msg_show('Initializing new shared project ...', true);
    this._project_push().then( function(ok) {
      this._project_on_push_ok_response(ok);
    }.bind(this), function(err) {
      this._project_on_push_err_response(err);
    }.bind(this));
  } else {
    // update existing project
    _via_util_msg_show('Checking for updates to remote project ...', true);
    this._project_pull(this.d.store.project.pid).then( function(remote_rev) {
      this.d.project_is_different(remote_rev).then( function(yes) {
        _via_util_msg_show('Checking for updates to remote project ...', true);
        try {
          var d = JSON.parse(yes);
          if ( this.d.store.project.rev === d.project.rev ) {
            // push new revision
            var pid = this.d.store.project.pid;
            var rev = this.d.store.project.rev;
            _via_util_msg_show('Pushing project ...', true);
            this._project_push(pid, rev).then( function(ok) {
              this._project_on_push_ok_response(ok);
            }.bind(this), function(err) {
              this._project_on_push_err_response(err);
            }.bind(this));
          } else {
            // newer revision exists, pull first
            _via_util_msg_show('You must first pull remote revision first. (local revision=' + this.d.store.project.rev + ', remote rev=' + d['project']['rev'] + ')', true);
            return;
          }
        }
        catch(e) {
          _via_util_msg_show('Error parsing response from server: ' + e);
        }
      }.bind(this), function(no) {
        _via_util_msg_show('There are no new changes to push!');
      }.bind(this));
    }.bind(this), function(err) {
      _via_util_msg_show('Failed to retrive remote VIA project: ' + err);
    }.bind(this));
  }
}

_via_share.prototype.pull = function(pid) {
  this._project_pull(pid).then( function(remote_rev) {
    this.d.project_load(remote_rev).then( function() {
      _via_util_msg_show('Loaded shared project ' + pid);
    }.bind(this), function(err) {
      console.warn(err)
      _via_util_msg_show('Failed to load shared project: ' + err);
    }.bind(this));
  }.bind(this), function(err_msg) {
    _via_util_msg_show(err_msg + ' fetching remote shared project: ' + pid);
  }.bind(this));
}

_via_share.prototype.exists = function(pid) {
  return new Promise( function(ok_callback, err_callback) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function() {
      switch(xhr.statusText) {
      case 'OK':
        ok_callback(pid);
        break;
      default:
        err_callback(pid, xhr.statusText);
      }
    });
    xhr.addEventListener('timeout', function(e) {
      err_callback(pid, 'timeout');
    });
    xhr.addEventListener('error', function(e) {
      err_callback(pid, 'error')
    });
    xhr.open('HEAD', this.conf['ENDPOINT'] + pid);
    xhr.send();
  }.bind(this));
}

_via_share.prototype._project_on_push_ok_response = function(ok_response) {
  try {
    var d = JSON.parse(ok_response);
    if ( d.hasOwnProperty('pid') &&
         d.hasOwnProperty('rev') &&
         d.hasOwnProperty('rev_timestamp')
       ) {
      this.d.store.project.pid = d['pid'];
      this.d.store.project.rev = d['rev'];
      this.d.store.project.rev_timestamp = d['rev_timestamp'];
      this.d.store0 = JSON.parse(JSON.stringify(this.d.store)); // helps keep track of local changes
      _via_util_msg_show('Pushed revision ' + d['rev']);
    } else {
      _via_util_msg_show('Malformed response from server: ' + ok);
    }
  }
  catch(e) {
    _via_util_msg_show('Malformed response from server: ' + ok_response);
  }
}

_via_share.prototype._project_on_push_err_response = function(reason, err_msg) {
  _via_util_msg_show('Push failed: ' + reason + ' ' + err_msg);
  console.warn(err_response);
}

_via_share.prototype._project_pull = function(pid) {
  return new Promise( function(ok_callback, err_callback) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function() {
      switch(xhr.statusText) {
      case 'OK':
        ok_callback(xhr.responseText);
        break;
      default:
        err_callback(xhr.statusText);
      }
    });
    xhr.addEventListener('timeout', function(e) {
      err_callback('Timeout');
    });
    xhr.addEventListener('error', function(e) {
      err_callback('Error' )
    });
    xhr.open('GET', this.conf['ENDPOINT'] + pid);
    xhr.send();
  }.bind(this));
}

_via_share.prototype._project_push = function(pid, rev) {
  return new Promise( function(ok_callback, err_callback) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function() {
      switch(xhr.statusText) {
      case 'OK':
        ok_callback(xhr.responseText);
        break;
      default:
        err_callback(xhr.statusText);
      }
    });
    xhr.addEventListener('timeout', function(e) {
      console.log('timeout');
      err_callback(pid, 'timeout');
    });
    xhr.addEventListener('error', function(e) {
      console.log(e.target)
      err_callback(pid, 'error')
    });

    var payload = JSON.parse(JSON.stringify(this.d.store));
    payload.project.rev = _VIA_PROJECT_REV_ID_MARKER;
    payload.project.rev_timestamp = _VIA_PROJECT_REV_TIMESTAMP_MARKER;
    if ( typeof(pid) === 'undefined' &&
         typeof(rev) === 'undefined'
       ) {
      payload.project.pid = _VIA_PROJECT_ID_MARKER;
      xhr.open('POST', this.conf['ENDPOINT']);
      console.log('POST ' + this.conf['ENDPOINT'])
    } else {
      xhr.open('POST', this.conf['ENDPOINT'] + pid + '?rev=' + rev);
    }
    xhr.timeout = _VIA_REMOTE_TIMEOUT;
    xhr.send(JSON.stringify(payload));
  }.bind(this));
}
