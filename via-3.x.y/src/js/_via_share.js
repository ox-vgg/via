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
  this.d = data;
  this.conf = conf;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_share_';
  _via_event.call(this);
}

_via_share.prototype.push = function() {
  console.log('_via_share.push()');
  console.log(this.d.store.project)
  if ( this.d.store.project.pid === _VIA_PROJECT_ID_MARKER &&
       this.d.store.project.rev === _VIA_PROJECT_REV_ID_MARKER &&
       this.d.store.project.rev_timestamp === _VIA_PROJECT_REV_TIMESTAMP_MARKER
     ) {
    // create a new project
    console.log(this.conf)
    this._project_push().then( function(ok) {
      this._project_on_push_ok_response(ok);
    }.bind(this), function(err) {
      this._project_on_push_err_response(err);
    }.bind(this));
  } else {
    // update existing project
    this._project_pull(this.d.store.project.pid).then( function(ok) {
      try {
        var d = JSON.parse(ok);
        if ( d.project.hasOwnProperty('pid') &&
             d.project.hasOwnProperty('rev') &&
             d.project.hasOwnProperty('rev_timestamp')
           ) {
          console.log(this.d.store.project.rev + ':' + typeof(this.d.store.project.rev));
          console.log(d['rev'] + ':' + typeof(d['rev']));
          if ( this.d.store.project.rev === d.project['rev'] ) {
            // push new revision
            var pid = this.d.store.project.pid;
            var rev = this.d.store.project.rev;
            this._project_push(pid, rev).then( function(ok) {
              this._project_on_push_ok_response(ok);
            }.bind(this), function(err) {
              this._project_on_push_err_response(err);
            }.bind(this));
          } else {
            // newer revision exists, pull first
            _via_util_msg_show('You must first pull remote revision first. (local revision=' + this.d.store.project.rev + ', remote rev=' + d['rev'] + ')', true);
            return;
          }
        } else {
          _via_util_msg_show('Malformed response from server: ' + ok);
        }
      }
      catch(e) {
        _via_util_msg_show('Error parsing response from server: ' + e);
      }
    }.bind(this), function(err) {
      _via_util_msg_show('Failed to retrive remote VIA project: ' + err);
    }.bind(this));
  }
}

_via_share.prototype.pull = function(project_id) {
}

_via_share.prototype.exists = function(pid) {
  return new Promise( function(ok_callback, err_callback) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function() {
      console.log(xhr.statusText)
      console.log(xhr.responseText);
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
      _via_util_msg_show('Pushed revision ' + d['rev']);
    } else {
      _via_util_msg_show('Malformed response from server: ' + ok);
    }
  }
  catch(e) {
    _via_util_msg_show('Malformed response from server: ' + ok_response);
  }
  console.log(ok);
}

_via_share.prototype._project_on_push_err_response = function(err_response) {
  _via_util_msg_show('Push failed: ' + err_response);
  console.warn(err_response);
}

_via_share.prototype._project_pull = function(pid) {
  return new Promise( function(ok_callback, err_callback) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function() {
      switch(xhr.statusText) {
      case 'OK':
        console.log(xhr.responseText)
        ok_callback(xhr.responseText);
        break;
      default:
        err_callback(xhr.statusText);
      }
    });
    xhr.addEventListener('timeout', function(e) {
      err_callback(pid, 'timeout');
    });
    xhr.addEventListener('error', function(e) {
      err_callback(pid, 'error')
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
        console.log(xhr.responseText)
        ok_callback(xhr.responseText);
        break;
      default:
        err_callback(xhr.statusText);
      }
    });
    xhr.addEventListener('timeout', function(e) {
      err_callback(pid, 'timeout');
    });
    xhr.addEventListener('error', function(e) {
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
    } else {
      xhr.open('POST', this.conf['ENDPOINT'] + pid + '?rev=' + rev);
    }
    xhr.send(JSON.stringify(payload));
  }.bind(this));
}
