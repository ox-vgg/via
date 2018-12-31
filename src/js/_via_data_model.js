/**
 *
 * @class
 * @classdesc Manages the storage and update of all data (annotations, files, etc. )
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 31 Dec. 2018
 *
 */

function _via_data_model() {
  this.metadata_store = {};
  this.attribute_store = [];
  this.file_store = [];
}

//
// attribute
//
_via_data_model.prototype.attribute_add = function(name, desc, type, options, default_option_id) {
  var aid = this.attribute_store.push( {} ) - 1; // get a slot
  this.attribute_store[aid] = new _via_attribute(aid,
                                                 name,
                                                 desc,
                                                 type,
                                                 options,
                                                 default_option_id);
  return aid;
}

_via_data_model.prototype.attribute = function(aid) {
  return this.attribute_store[aid];
}

//
// file
//
_via_data_model.prototype.file_add = function(uri, type, path) {
  var fid = this.file_store.push( new Object() ) - 1; // get a slot
  this.file_store[fid] = new _via_file(fid, uri, type, path);
  return fid;
}
