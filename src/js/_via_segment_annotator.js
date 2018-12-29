/**
 * @class
 * @classdesc Marks time segments of a {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement|HTMLMediaElement}
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 28 Dec. 2018
 * @fires _via_segment_annotator#seg_add
 * @fires _via_segment_annotator#seg_del
 * @fires _via_segment_annotator#seg_edit
 * @param {Element} container HTML container element like <div>
 * @param {HTMLMediaElement} media_element HTML video of audio
 */
function _via_segment_annotator(container, media_element) {
  this.t = [];
  this.container = container;
  this.media_element = media_element;

  this.state = {};
  this.state.is_segment_def_ongoing = false;

  this.style = {};
  this.style.bstart = '';
  this.style.breset = '';
  this.style.bend = '';
  if ( typeof(container.innerHTML) === 'undefined' ||
       typeof(media_element.duration) === 'undefined'
     ) {
    console.log('throw')
    throw 'invalid html container or media element!';
  }
}

_via_segment_annotator.prototype.init = function() {
  this.bstart = document.createElement('button');
  this.bstart.setAttribute('value', 'segment_start');
  this.bstart.innerHTML = 'Mark Current Frame as Start of Segment';
  this.bstart.addEventListener('click', this.on_define_start.bind(this))

  this.breset = document.createElement('button');
  this.breset.setAttribute('value', 'segment_reset');
  this.breset.innerHTML = 'Reset';
  this.bstart.addEventListener('click', this.on_reset.bind(this))

  this.bend = document.createElement('button');
  this.bend.setAttribute('value', 'segment_end');
  this.bend.innerHTML = 'Mark Current Frame as End of Segment';
  this.bend.addEventListener('click', this.on_define_end.bind(this))

  this.container.innerHTML = '';
  this.container.appendChild(this.bstart);
  this.container.appendChild(this.breset);
  this.container.appendChild(this.bend);
}

_via_segment_annotator.prototype.on_define_start = function() {
  this.t.push( this.media_element.duration );
  this.state.is_segment_def_ongoing = true;
}

_via_segment_annotator.prototype.on_reset = function() {
  this.t = [];
  this.state.is_segment_def_ongoing = false;
}

_via_segment_annotator.prototype.on_define_end = function() {
  this.t.push( this.media_element.duration );
  // @todo: fire event 'seg_add'
  this.state.is_segment_def_ongoing = false;
}

_via_segment_annotator.prototype.load = function(t) {
  this.t = t;
  this.state.is_segment_def_ongoing = false;
}
