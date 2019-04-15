'use strict'

var data = new _via_data();

if ( true ) {
  var apromiselist = [];
  apromiselist.push( data.attribute_add('keypoint', _VIA_ATTRIBUTE_TYPE.TEXT) );

  var file_list = ['Oswestry-G30151-D20130123-T1-S1-08.png',
                   'Oswestry-G30151-D20130123-T1-S2-08.png',
                   'Oswestry-G30151-D20130123-T2-S1-08.png',
                   'Oswestry-G30282-D20111220-T1-S2-09.png',
                   'Oswestry-G30282-D20111220-T2-S2-38.png',
                   'Oswestry-G30282-D20111220-T2-S3-09.png',
                   'Oxford-G10072-D20100306-T2-S1-09.png',
                   'SC1015-D20151104-T2-S1-08.png',
                   'SC1387-D20150514-T2-S1-07.png',
                   'SC2528-D20150810-T1-S1-09.png',
                   'SC2528-D20150810-TIRM-S1-09.png',
                  ];
  data.store.config.file.path = '/data/datasets/amir_jamaludin/GenoOSCLMRIC-mid/'
  var fpromiselist = [];
  for ( var i = 0; i < file_list.length; ++i ) {
    fpromiselist.push( data.file_add(file_list[i], _VIA_FILE_TYPE.IMAGE, _VIA_FILE_LOC.LOCAL, file_list[i]) );
  }
  Promise.all( fpromiselist ).then( function(ok) {
    var vpromiselist = [];
    var fid;
    vpromiselist.push( data.view_add( [ ok[8], ok[9] ], {} ) );
    for ( var i = 0; i < ok.length; ++i ) {
      fid = ok[i];
      var sample_metadata = {};
      sample_metadata['0'] = new _via_metadata([], [2,100,100,200,200], {});
      sample_metadata['1'] = new _via_metadata([], [2,150,400,200,150], {});
      vpromiselist.push( data.view_add( [fid], sample_metadata ) );
    }

    Promise.all(vpromiselist).then( function(ok) {
      console.log(data.store)
      console.log(ok);
      view_manager._init();
      view_annotator.view_show(1);
    }.bind(this), function(err) {
      console.warn(err);
    }.bind(this));
  }.bind(this), function(err) {
    console.warn(err);
  }.bind(this));
}

var view_annotator_container = document.getElementById('view_container');
var view_annotator = new _via_view_annotator(data, view_annotator_container);
/*
window.addEventListener('keydown', function(e) {
  // avoid handling events when text input field is in focus
  if ( e.target.type !== 'text' ) {
    annotator._on_event_keydown(e);
  }
});
*/

var view_manager_container = document.getElementById('view_manager_container');
var view_manager = new _via_view_manager(data, view_annotator, view_manager_container);

_via_set_region_draw_shape(document.getElementById('RECT'));

/*
var filelist_element = document.getElementById('file_manager_filelist');
var project_name_input = document.getElementById('_via_project_name_input');
var file_manager = new _via_file_manager(data, annotator, filelist_element, project_name_input);
file_manager._init();
*/

function _via_on_browser_resize() {
  //annotator.emit_event('container_resize', {});
}

function _via_set_region_draw_shape(e) {
  var shape = e.getAttribute('id');
  view_annotator.set_region_draw_shape(shape);

  var region_shape_selector = document.getElementById('region_shape_selector');
  var nodes = region_shape_selector.getElementsByTagName('svg');
  var n = nodes.length;
  for ( var i = 0; i < n; ++i ) {
    if ( nodes[i].id === shape ) {
      nodes[i].classList.add('svg_button_selected');
    } else {
      nodes[i].classList.remove('svg_button_selected');
    }
  }
}
