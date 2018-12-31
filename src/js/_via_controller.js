/**
 *
 * @class
 * @classdesc Controller
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 31 Dec. 2018
 *
 */

function _via_controller(model, file_annotator) {
  this.m = model;
  this.file_annotator = file_annotator;
}

_via_controller.prototype.file_add = function(uri, type, path='') {
  var fid = this.m.file_add(uri, type, path);
  this.file_annotator.file_load( this.file(fid) );
  return fid;
}

_via_controller.prototype.file_show = function(fid) {
  this.file_annotator.file_show( this.file(fid) );
}

_via_controller.prototype.file = function(fid) {
  return this.m.file_store[fid];
}
