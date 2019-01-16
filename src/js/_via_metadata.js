/**
 *
 * @class
 * @classdesc Metadata
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 31 Dec. 2018
 *
 */

'use strict';

function _via_metadata(mid, where, what) {
  this.mid = mid;      // unique metadata id
  this.where = where;  // [type_id,shape_id, value0, ..., valuen]
  this.what = what;    // {attribute_id, attribute_value}
}

_via_metadata.prototype.TYPE = {'VSEGMENT':1, 'VFRAME':2, 'IMAGE':3};
_via_metadata.prototype.SHAPE = {'TIME':1, 'INDEX':2, 'RECT':3, 'CIRCLE':4, 'ELLIPSE':5, 'POINT':6, 'POLYLINE':7, 'POLYGON':8};

_via_metadata.prototype.where_type_str = function() {
  switch(this.where[0]) {
    case 1:
      return 'Video Segment';
    default:
      return 'Unknown';
  }
}

_via_metadata.prototype.where_type = function() {
  return this.where[0];
}
_via_metadata.prototype.where_shape = function() {
  return this.where[1];
}

_via_metadata.prototype.type = function(type_id) {
  var type;
  for ( type in _via_metadata.prototype.TYPE ) {
    if ( _via_metadata.prototype.TYPE[type] === type_id ) {
      return type;
    }
  }
}
_via_metadata.prototype.shape = function(shape_id) {
  var shape;
  for ( shape in _via_metadata.prototype.SHAPE ) {
    if ( _via_metadata.prototype.TYPE[shaoe] === shape_id ) {
      return shape;
    }
  }
}
