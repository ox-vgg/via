/**
 * @class
 * @classdesc Marks time segments of a {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement|HTMLMediaElement}
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 28 Dec. 2018
 * @fires _via_segment_annotator#segment_add
 * @fires _via_segment_annotator#segment_del
 * @fires _via_segment_annotator#segment_edit
 * @param {Element} container HTML container element like <div>
 * @param {HTMLMediaElement} media_element HTML video of audio
 */

'use strict';

function _via_segment_annotator(container, media_element) {
  //this.t = [];
  this.t = [1.643, 5.398]; // for DEBUG

  this.container = container;
  this.media_element = media_element;

  this.state = {};
  this.state.is_segment_def_ongoing = false;

  this.style = {};
  this.style.bstart = '';
  this.style.breset = '';
  this.style.bend = '';

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_segment_annotator_';
  _via_event.call( this );

  if ( typeof(container.innerHTML) === 'undefined' ||
       typeof(media_element.duration) === 'undefined'
     ) {
    console.log('throw')
    throw 'invalid html container or media element!';
  }

  this.init();
}

_via_segment_annotator.prototype.is_media_time_valid = function(t) {

  if ( typeof(t) === 'string' ) {
    t = parseFloat(t);
  }
  if ( t >=0 && t < this.media_element.duration ) {
    return true;
  } else {
    return false;
  }
}

_via_segment_annotator.prototype.init = function() {
  this.tstart = document.createElement('input');
  this.tstart.setAttribute('type', 'text');
  this.tstart.setAttribute('id', 'segment_tstart');
  this.tstart.setAttribute('size', '5');
  this.tstart.setAttribute('placeholder', 'start time');
  this.tstart.setAttribute('title', 'Start time for video/audio segment');
  this.tstart.addEventListener('change', function() {
    if ( this.is_media_time_valid( this.tstart.value ) ) {
      this.t[0] = parseFloat(this.tstart.value);
      this.media_element.currentTime = this.t[0];
    }
  }.bind(this));

  this.bstart = document.createElement('button');
  this.bstart.setAttribute('class', 'text_button');
  this.bstart.setAttribute('value', 'segment_tstart');
  this.bstart.innerHTML = '&lsh;';
  this.bstart.setAttribute('title', 'Use current frame time as start time');
  this.bstart.addEventListener('click', function() {
    this.t[0] = this.media_element.currentTime;
    this.tstart.value = this.t[0];
    this.bend.focus();
  }.bind(this));

  var label = document.createElement('span');
  label.innerHTML = '&nbsp;to&nbsp;';

  this.bend = document.createElement('button');
  this.bend.setAttribute('class', 'text_button');
  this.bend.setAttribute('value', 'segment_tend');
  this.bend.setAttribute('title', 'Mark current frame as end of segment');
  this.bend.innerHTML = '&rsh;';
  this.bend.addEventListener('click', function() {
    this.t[1] = this.media_element.currentTime;
    this.tend.value = this.t[1];
  }.bind(this));

  this.tend = document.createElement('input');
  this.tend.setAttribute('type', 'text');
  this.tend.setAttribute('id', 'segment_tend');
  this.tend.setAttribute('size', '5');
  this.tend.setAttribute('placeholder', 'end time');
  this.tend.setAttribute('title', 'End time for video/audio segment');
  this.tend.addEventListener('change', function() {
    if ( this.is_media_time_valid( this.tend.value ) ) {
      this.t[1] = parseFloat(this.tend.value);
      this.media_element.currentTime = this.t[1];
    }
  }.bind(this));

  this.bcreate = document.createElement('button');
  this.bcreate.setAttribute('value', 'segment_create');
  this.bcreate.setAttribute('class', 'spaced_button');
  this.bcreate.innerHTML = 'Create';
  this.bcreate.addEventListener('click', this.on_create.bind(this))

  this.container.innerHTML = '<span>Video segment from time&nbsp;</span>';
  this.container.appendChild(this.tstart);
  this.container.appendChild(this.bstart);
  this.container.appendChild(label);
  this.container.appendChild(this.bend);
  this.container.appendChild(this.tend);
  this.container.appendChild(this.bcreate);
}

_via_segment_annotator.prototype.on_define_start = function() {
  this.t.push( this.media_element.duration );
  this.state.is_segment_def_ongoing = true;
}

_via_segment_annotator.prototype.on_reset = function() {
  this.t = [];
  this.tstart.value = '';
  this.tend.value = '';
}

_via_segment_annotator.prototype.on_create = function() {
  this.emit_event('segment_add', { 't':this.t } );
}


_via_segment_annotator.prototype.load = function(t) {
  this.t = t;
  this.state.is_segment_def_ongoing = false;
}
