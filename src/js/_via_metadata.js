/**
 *
 * @class
 * @classdesc Metadata
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 31 Dec. 2018
 *
 */

'use strict';

const _VIA_WHERE_TARGET = { 'SEGMENT':1, 'FRAME':2, 'IMAGE':3 };
const _VIA_WHERE_SHAPE  = { 'TIME':1, 'RECT':2, 'CIRCLE':3, 'ELLIPSE':4, 'POINT':5, 'POLYLINE':6, 'POLYGON':7 };

function _via_metadata(mid, where, what) {
  this.mid = mid;      // unique metadata id
  this.where = where;  // [target_id, shape_id, where_value0, ..., where_valuen]
  this.what = what;    // {attribute_id, attribute_value}
}

_via_metadata.prototype.where_type_str = function() {
  switch(this.where[0]) {
    case 1:
      return 'Video Segment';
    default:
      return 'Unknown';
  }
}

_via_metadata.prototype.where_target = function() {
  return this.where[0];
}
_via_metadata.prototype.where_shape = function() {
  return this.where[1];
}

