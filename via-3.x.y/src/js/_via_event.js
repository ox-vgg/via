/**
 * @class
 * @classdesc Implements a basic event emitter and event listener
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 15 Jan. 2019
 */

'use strict';

function _via_event() {
  this.on_event       = _via_event.prototype.on_event;
  this.emit_event     = _via_event.prototype.emit_event;
  this.disable_events = _via_event.prototype.disable;
  this.enable_events  = _via_event.prototype.enable;
  this.clear_events   = _via_event.prototype.clear;
  this.delete_listener  = _via_event.prototype.delete_listener;

  this._event = { 'enabled':true, 'targets':{} };
}

_via_event.prototype.on_event = function(event_id, listener_name, listener_method, listener_param) {
  // initialise event handlers data structure (if not exist)
  if ( typeof(this._event.targets[event_id]) === 'undefined' ) {
    this._event.targets[event_id] = { 'listener_name_list':[],
                                      'listener_method_list':[],
                                      'listener_param_list':[] };
  }

  this._event.targets[event_id].listener_name_list.push( listener_name );
  this._event.targets[event_id].listener_method_list.push( listener_method );
  if ( typeof(listener_param) === 'undefined' ) {
    this._event.targets[event_id].listener_param_list.push( {} );
  } else {
    this._event.targets[event_id].listener_param_list.push( listener_param );
  }
}

_via_event.prototype.emit_event = function(event_id, event_payload) {
  if ( this._event.enabled ) {
    if ( typeof(this._event.targets[event_id]) !== 'undefined' ) {
      for ( var i = 0; i < this._event.targets[event_id].listener_name_list.length; ++i ) {
        this._event.targets[event_id].listener_method_list[i].call(this, this._event.targets[event_id].listener_param_list[i], event_payload);
      }
    }
  }
}

_via_event.prototype.disable = function() {
  this._event.enabled = false;
}

_via_event.prototype.enable = function() {
  this._event.enabled = true;
}

_via_event.prototype.clear = function(listener_name, event_id) {
  if ( typeof(listener_name) === 'undefined' ) {
    if ( typeof(event_id) === 'undefined' ) {
      this._event.targets = {}; // clear all listeners
    } else {
      // clear based on event_id
      this._event.targets[event_id] = { 'listener_name_list':[],
                                        'listener_method_list':[],
                                        'listener_param_list':[] };
    }
  } else {
    if ( typeof(event_id) === 'undefined' ) {
      // clear based on listener_name
      for ( var event_id in this._event.targets ) {
        var delete_index_list = [];
        for ( var i = 0; i < this._event.targets[event_id].listener_name_list.length; ++i ) {
          if ( this._event.targets[event_id].listener_name_list[i] === listener_name ) {
            delete_index_list.push(i);
          }
        }
        if ( delete_index_list.length ) {
          for ( var i = 0; i < delete_index_list.length; ++i ) {
            this.delete_listener(event_id, delete_index_list[i]);
          }
        }
      }
    } else {
      // clear based on both listener_name and event_id
      var delete_index = -1
      for ( var i = 0; i < this._event.targets[event_id].listener_name_list.length; ++i ) {
        if ( this._event.targets[event_id].listener_name_list[i] === listener_name ) {
          delete_index = i;
          break;
        }
      }
      this.delete_listener(event_id, delete_index);
    }
  }
}

_via_event.prototype.delete_listener = function(event_id, listener_index) {
  this._event.targets[event_id].listener_name_list.splice(listener_index, 1);
  this._event.targets[event_id].listener_method_list.splice(listener_index, 1);
  this._event.targets[event_id].listener_param_list.splice(listener_index, 1);
}
