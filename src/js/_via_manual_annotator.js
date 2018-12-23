/**
 * Implementation of manual annotator for image, video and audio
 *
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 23 Dec. 2018
 *
 */
function _via_manual_annotator(file, parent_html_element) {

  this.file = file;
  this.parent_container = parent_html_element;

  this.state = {};
  this.state.parent_width  = this.parent_container.clientWidth;
  this.state.parent_height = this.parent_container.clientHeight;
  this.state.content_natural_width = 0;
  this.state.content_natural_height = 0;
  this.state.content_width = 0;
  this.state.content_height = 0;
  this.state.content_scale = 1;
  this.state.content_duration = 0;

  this.config = {};
  this.config.layout = {};
  this.config.layout.content_fraction = 0.6;
  this.config.layout.control_padding = 5; // in pixel
  this.config.style = {};
  this.config.style.container = 'background-color:#212121; margin:0; padding:0; text-align:center;';
  this.config.style.content = 'border:none; margin: 0; padding:0;';
  this.config.style.control = 'border:none; margin: 0; padding:' + this.config.layout.control_padding + 'px;';

  //// initialize the container that will have content panel and control panel
  this.container = this.init_container();
  this.parent_container.appendChild(this.container);

  this.control = {};
  this.content = {};
  this.content_natural_width = 0;
  this.content_natural_height = 0;
  this.content_width = 0;
  this.content_height = 0;

  this.init_via_manual_annotator();
}

_via_manual_annotator.prototype.init_via_manual_annotator = function() {
  this.load_content(this.file).then( function(content_html_element) {
    this.content = content_html_element;

    this.init_control(this.content).then( function(control_html_element) {
      this.control = control_html_element;
      this.container.appendChild( this.content );
      this.container.appendChild( this.control );
    }.bind(this), function(err_status) {
      console.log('Control initialisation ' + err_status);
    }.bind(this));
  }.bind(this), function(err_status) {
    console.log('Content load ' + err_status + ' for uri [' + this.file.uri + ']');
  }.bind(this));
}

_via_manual_annotator.prototype.init_container = function() {
  var p = document.createElement('div');
  p.setAttribute('style', this.config.style.container);
  return p;
}

//
// Content Panel
//
_via_manual_annotator.prototype.load_content = function(file) {
  return new Promise( function(ok_callback, err_callback) {
    var el;
    if ( this.file.type === _via_file.prototype.FILE_TYPE.VIDEO ) {
      el = document.createElement('video');
      el.setAttribute('style', this.config.style.content);
      el.setAttribute('id', 'content');
      el.setAttribute('src', this.file.uri);
      el.setAttribute('autoplay', 'false');
      el.setAttribute('loop', 'false');
      el.setAttribute('controls', '');
      el.addEventListener('canplaythrough', function() {
        el.pause(); // debug
        this.state.content_natural_width = el.videoWidth;
        this.state.content_natural_height = el.videoHeight;
        this.state.content_duration = el.duration;

        var content_max_height = this.config.layout.content_fraction * this.state.parent_height;
        var cr = this.state.content_natural_width / this.state.content_natural_height;
        var ch = Math.floor( this.config.layout.content_fraction * this.state.parent_height );
        var cw = Math.floor( cr * ch );
        if ( cw > this.state.parent_width ) {
          // resize content by width because
          // content does not fit the available content panel
          cw = this.state.parent_width;
          ch = Math.floor( cw / cr );
        }
        this.state.content_width = cw;
        this.state.content_height = ch;
        el.setAttribute('width', this.state.content_width);
        el.setAttribute('height', this.state.content_height);
        ok_callback(el);
      }.bind(this));
      el.addEventListener('error', function() {
        err_callback('error');
      }.bind(this));
      el.addEventListener('abort', function() {
        err_callback('abort');
      }.bind(this));
    }
  }.bind(this));
}

//
// Control Panel
//
_via_manual_annotator.prototype.init_control = function(content) {
  return new Promise( function(ok_callback, err_callback) {
    var c = document.createElement('canvas');
    c.width = this.container.clientWidth - 2*this.config.layout.control_padding;
    c.height = this.state.parent_height - this.state.content_height  - 2*this.config.layout.control_padding;
    c.setAttribute('style', this.config.style.control);

    var ctx = c.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans';

    var char_width = ctx.measureText('M').width;
    var timepanel_x0 = char_width;
    var timepanel_y0 = c.height - 60;
    var timepanel_x1 = c.width - char_width;
    var timepanel_y1 = timepanel_y0;
    var timepanel_width = c.width - 2*char_width;
    var grating_height = char_width;

    // draw horizontal line
    ctx.moveTo(timepanel_x0, timepanel_y0);
    ctx.lineTo(timepanel_x1, timepanel_y1);

    // draw time gratings
    var grating = this.get_timepanel_gratings();
    var N = grating.time_gratings.length;
    var y0 = timepanel_y0;
    var y1 = timepanel_y0 + grating_height;
    for ( var i = 0; i < N; ++i ) {
      var x = Math.floor( timepanel_x0 + ( i * timepanel_width / (N-1) ) );
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
      ctx.fillText( String(grating.time_gratings[i]), x-char_width, y1+2*char_width );
    }
    ctx.fillText( grating.time_unit, timepanel_x0, y1+2*char_width );
    ctx.stroke();

    ok_callback(c);
  }.bind(this));
}

_via_manual_annotator.prototype.get_timepanel_gratings = function() {
  var duration = this.state.content_duration / 60;
  var d = { 'time_gratings':[], 'time_unit':'min' };
  if ( duration >= 30 && duration < 60 ) {
    d.time_gratings = [0,10,20,30,40,50,60];
  }
  if ( duration >= 6 && duration < 30 ) {
    d.time_gratings = [0,5,10,15,20,25,30];
  }
  if ( duration >= 1 && duration < 6 ) {
    d.time_gratings = [0,1,2,3,4,5,6];
  }
  if ( duration >= 0 && duration < 1 ) {
    d.time_gratings = [0,10,20,30,40,50,60];
    d.time_unit = 'sec';
  }
  return d;
}

_via_manual_annotator.prototype.init_time_panel = function(canvas) {

}

_via_manual_annotator.prototype.init_annotation_panel = function() {
}

_via_manual_annotator.prototype.init_toolbar_panel = function() {
}

_via_manual_annotator.prototype.init_preview_panel = function() {
}
