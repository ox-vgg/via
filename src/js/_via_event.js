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

  this._event = { 'enabled':true, 'targets':{} };
  if ( typeof(this._EVENT_ID_PREFIX) === 'undefined' ) {
    this._EVENT_ID_PREFIX = '';
  }
}

_via_event.prototype.on_event = function(event_id_suffix, listener_method, listener_param) {
  // initialise event handlers data structure (if not exist)
  var event_id = this.EVENT_ID_PREFIX + event_id_suffix;
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

_via_event.prototype.emit_event = function(event_id_suffix, event_payload) {
  if ( this._event.enabled ) {
    var event_id = this.EVENT_ID_PREFIX + event_id_suffix;
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
