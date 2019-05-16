'use strict'

var data = new _via_data();

if ( typeof(mri_stenosis_clinician_payload) !== 'undefined' ) {
  data.store = JSON.parse(mri_stenosis_clinician_payload);
  console.log(data.store)
  data._cache_update();
}

var view_annotator_container = document.getElementById('view_container');
var view_annotator = new _via_view_annotator(data, view_annotator_container);

var via_container = document.getElementById('via_container');
via_container.focus()
via_container.addEventListener('keydown', function(e) {
  // avoid handling events when text input field is in focus
  if ( e.target.type !== 'text' &&
       e.target.type !== 'textarea'
     ) {
    view_annotator._on_event_keydown(e);
  }
});

/*
var editor_container = document.getElementById('editor_container');
var editor = new _via_editor(data, view_annotator, editor_container);
setTimeout( function() {
  //editor.show();
}, 100);
*/

var view_manager_container = document.getElementById('view_manager_container');
var view_manager = new _via_view_manager(data, view_annotator, view_manager_container);

view_manager._init();
view_annotator.view_show(1);

function _via_on_browser_resize() {
  view_annotator.view_show(view_annotator.vid);
}
