'use strict'

var data = new _via_data();

data.attribute_add('keywords',
                'keywords describing the video segment',
                _via_attribute.prototype.TYPE.TEXT);
data.attribute_add('activity',
                   'Activity represented in video segment',
                   _via_attribute.prototype.TYPE.SELECT,
                   {
                     'walk':'Walk',
                     'eat':'Eat',
                     'run':'Run',
                     'sleep':'Sleep',
                     'none':'None'
                   },
                   'none');

var fid = data.file_add('file:///data/svt/videos/Moon_transit_of_sun_large.mp4',
                     _via_file.prototype.TYPE.VIDEO,
                     '');

var annotator_container = document.getElementById('annotator_container');
var annotator = new _via_annotator(annotator_container, data);

var editor_container = document.getElementById('editor_container');
var editor = new _via_editor(editor_container, data, annotator);

var file = data.file_store[fid];
annotator.file_load(file).then( function(ok) {
  annotator.file_show(file);
}.bind(this), function(err) {
  console.log('failed to load file ' + file.uri);
}.bind(this));
