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
  this.state.content_aspect_ratio = 1;
  this.state.content_duration = 0;
  this.state.frame_preview = {'load_ongoing':false};

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
  console.log('loading ...')
  this.load_content(this.file).then( function(content_html_element) {
    this.content = content_html_element;
    console.log('load done')

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
  console.log(file)
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
        this.state.content_aspect_ratio = ch/cw;
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

    var ctx = c.getContext('2d', { alpha: false });
    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans';
    ctx.lineWidth = 1;

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
    var Ng = grating.time_gratings.length;
    var y0 = timepanel_y0;
    var y1 = timepanel_y0 + grating_height;
    for ( var i = 0; i < Ng; ++i ) {
      var x = Math.floor( timepanel_x0 + ( i * timepanel_width / (Ng-1) ) );
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
      ctx.fillText( String(grating.time_gratings[i]), x-char_width, y1+2*char_width );
    }
    ctx.fillText( grating.time_unit, timepanel_x0, y1+2*char_width );

    // draw frame preview
    var N = 10;
    var df = char_width;
    var fw = Math.floor( ( timepanel_width - (N - 1) * df ) / N );
    var fh = Math.floor(fw * this.state.content_aspect_ratio);
    console.log('N='+N+', df='+df+', fw='+fw+', fh='+fh);

    var frame_y0 = c.height - 120;
    var frame_y1 = frame_y0 + fh;
    this.state.frame_preview = { 'time':[], 'x':[], 'y':[], 'fw':fw, 'fh':fh, 'now':0 };
    for ( var i = 0; i < N; ++i ) {
      var xfmid = Math.floor(fw/2) + i*(df + fw);
      var ftime = Number.parseFloat(this.state.content_duration * xfmid / timepanel_width).toFixed(6);
      var fx0 = timepanel_x0 + xfmid - fw/2;
      var fy0 = frame_y0 - fh;
      ctx.moveTo(timepanel_x0 + xfmid, frame_y0);
      ctx.lineTo(timepanel_x0 + xfmid, frame_y1);
      ctx.rect(fx0, fy0, fw, fh);
      console.log('fx0='+fx0+', fy0='+fy0+', fw='+fw+', fh='+fh+', xfmid='+xfmid);
      this.state.frame_preview.time[i] = ftime;this.state.frame_preview.time[this.state.frame_preview.now]
      this.state.frame_preview.x[i]    = fx0;
      this.state.frame_preview.y[i]    = fy0;
    }
    ctx.stroke();

    // trigger loading of frame_preview panel
    this.state.frame_preview.load_ongoing = true;
    this.state.frame_preview.now = 0;
    this.content.pause();
    this.content.addEventListener('seeked', this.on_video_seek_done.bind(this));
    this.load_frame_preview();

    ok_callback(c);
  }.bind(this));
}

_via_manual_annotator.prototype.load_frame_preview = function() {
  if ( this.state.frame_preview.now < this.state.frame_preview.time.length ) {
    //this.content.pause();
    this.content.currentTime = this.state.frame_preview.time[this.state.frame_preview.now];
  } else {
    // stop frame_preview load process
    this.state.frame_preview.load_ongoing = false;
    this.content.removeEventListener('seeked', this.on_video_seek_done.bind(this));
  }
}

_via_manual_annotator.prototype.on_video_seek_done = function() {
  if ( this.state.frame_preview.load_ongoing ) {
    // draw the frame and trigger another seek
    var ctx = this.control.getContext('2d', { alpha: false });
    var fi = this.state.frame_preview.now;

    ctx.drawImage( this.content,
                   0, 0,
                   this.state.content_natural_width,
                   this.state.content_natural_height,
                   this.state.frame_preview.x[fi],
                   this.state.frame_preview.y[fi],
                   this.state.frame_preview.fw,
                   this.state.frame_preview.fh
                 );
    console.log('0,0,'+this.state.content_width+','+this.state.content_height+' : '+this.state.frame_preview.x[fi]+','+this.state.frame_preview.y[fi]+','+this.state.frame_preview.fw+','+this.state.frame_preview.fh)
    this.state.frame_preview.now = this.state.frame_preview.now + 1;
    this.load_frame_preview(); // keep loading remaining frames
  }
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
