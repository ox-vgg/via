/**
 * @class
 * @classdesc Implements a basic event emitter and event listener
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 15 Jan. 2019
 */

'use strict';

function _via_event() {
  this.on_event       = _via_event.prototype.on;
  this.emit_event     = _via_event.prototype.emit;
  this.disable_events = _via_event.prototype.disable;
  this.enable_events  = _via_event.prototype.enable;
  this.clear_events   = _via_event.prototype.clear;

  this._event = { 'enabled':true, 'targets':{} };
}

_via_event.prototype.on = function(event_id, listener_method, listener_param) {
  // initialise event handlers data structure (if not exist)
  if ( typeof(this._event.targets[event_id]) === 'undefined' ) {
    this._event.targets[event_id] = { 'listener_list':[], 'listener_param_list':[] };
  }

  this._event.targets[event_id].listener_list.push( listener_method );
  if ( typeof(listener_param) === 'undefined' ) {
    this._event.targets[event_id].listener_param_list.push( {} );
  } else {
    this._event.targets[event_id].listener_param_list.push( listener_param );
  }
}

_via_event.prototype.emit = function(event_id, event_payload) {
  if ( this._event.enabled ) {
    if ( typeof(this._event.targets[event_id]) !== 'undefined' ) {
      var i;
      for ( i = 0; i < this._event.targets[event_id].listener_list.length; ++i ) {
        this._event.targets[event_id].listener_list[i].call(this, this._event.targets[event_id].listener_param_list[i], event_payload);
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

_via_event.prototype.clear = function() {
  this._event.targets = {};
}
