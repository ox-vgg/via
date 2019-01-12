var data = new _via_data();

data.attribute_add('keywords',
                'keywords describing the content',
                _via_attribute.prototype.TYPE.TEXT);

var fid = data.file_add('file:///data/svt/videos/Moon_transit_of_sun_large.mp4',
                     _via_file.prototype.TYPE.VIDEO,
                     '');

var annotator_container = document.getElementById('annotator_container');
var annotator = new _via_annotator(annotator_container, data);
var file = data.file_store[fid];
annotator.file_load(file).then( function(ok) {
  annotator.file_show(file);
}.bind(this), function(err) {
  console.log('failed to load file ' + file.uri);
}.bind(this));
