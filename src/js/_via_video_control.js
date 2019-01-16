/**
 * @class
 * @classdesc Control panel buttons for video
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 29 Dec. 2018
 */
function _via_video_control(container, media_element) {
  this.container = container;
  this.media_element = media_element;

  if ( typeof(container.innerHTML) === 'undefined' ||
       typeof(media_element.duration) === 'undefined'
     ) {
    throw 'invalid html container or media element!';
  }

  this.init();
}

_via_video_control.prototype.init = function() {
  this.bplay = document.createElement('button');
  if ( this.media_element.paused || this.media_element.ended ) {
    this.bplay.innerHTML = 'Play&nbsp;';
  } else {
    this.bplay.innerHTML = 'Pause';
  }
  this.bplay.addEventListener('click', function() {
    if ( this.media_element.paused || this.media_element.ended ) {
      this.media_element.play();
      this.bplay.innerHTML = 'Pause';
    } else {
      this.media_element.pause();
      this.bplay.innerHTML = 'Play&nbsp;';
    }
  }.bind(this))
  // @fixme: for some reason, 'ended' event does not fire
  this.media_element.addEventListener('ended', function() {
    console.log('ended')
    this.bplay.innerHTML = 'Play&nbsp;';
  }.bind(this));

  this.bspeed = document.createElement('select');
  var o1 = document.createElement('option');
  o1.setAttribute('value', 0.5);
  o1.innerHTML = 'Slow';
  this.bspeed.appendChild(o1);
  var o2 = document.createElement('option');
  o2.setAttribute('value', 1);
  o2.setAttribute('selected', '');
  o2.innerHTML = 'Normal';
  this.bspeed.appendChild(o2);
  var o3 = document.createElement('option');
  o3.setAttribute('value', 2);
  o3.innerHTML = 'Fast';
  this.bspeed.appendChild(o3);
  this.bspeed.addEventListener('change', function() {
    this.media_element.playbackRate = parseFloat(this.bspeed.options[ this.bspeed.selectedIndex ].value);
  }.bind(this));

  this.sleft = document.createElement('button');
  this.sleft.setAttribute('class', 'text_button');
  this.sleft.innerHTML = '&cularr;';
  this.sleft.addEventListener('click', function() {
    if ( this.media_element.currentTime > 0 ) {
      this.media_element.currentTime = this.media_element.currentTime - (1/25);
    }
  }.bind(this));

  this.bjump = document.createElement('input');
  this.bjump.setAttribute('type', 'text');
  this.bjump.setAttribute('size', '5');
  this.bjump.setAttribute('placeholder', 'jump to');
  this.bjump.addEventListener('change', function() {
    this.media_element.pause();
    var new_time = parseFloat(this.bjump.value)
    if ( new_time >= 0 && new_time < this.media_element.duration ) {
      this.media_element.currentTime = parseFloat(this.bjump.value);
    }
  }.bind(this));
  this.media_element.addEventListener('timeupdate', function() {
    this.bjump.value = this.media_element.currentTime.toFixed(2);
  }.bind(this));

  this.sright = document.createElement('button');
  this.sright.setAttribute('class', 'text_button');
  this.sright.innerHTML = '&curarr;';
  this.sright.addEventListener('click', function() {
    if ( this.media_element.currentTime < this.media_element.duration ) {
      this.media_element.currentTime = this.media_element.currentTime + (1/25);
    }
  }.bind(this));

  var annotate_frame_label = document.createElement('label');
  annotate_frame_label.setAttribute('for', 'annotate_frame');
  annotate_frame_label.innerHTML = '&nbsp;Draw Frame Regions';

  this.bring_video_to_top = document.createElement('input');
  this.bring_video_to_top.setAttribute('name', 'annotate_frame');
  this.bring_video_to_top.setAttribute('type', 'checkbox');
  this.bring_video_to_top.addEventListener('change', function() {
    if ( this.bring_video_to_top.checked ) {
      this.media_element.pause();
      this.media_element.style.zIndex = 1; // move video to bottom of layer
    } else {
      this.media_element.style.zIndex = 1000; // move video to top of layer
    }
  }.bind(this));

  this.container.innerHTML = '';
  this.container.appendChild(this.bplay);
  this.container.appendChild(this.sleft);
  this.container.appendChild(this.bjump);
  this.container.appendChild(this.sright);
  this.container.appendChild(this.bspeed);
  this.container.appendChild(annotate_frame_label);
  this.container.appendChild(this.bring_video_to_top);
}
