/**
 *
 * @class
 * @classdesc Metadata
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 31 Dec. 2018
 *
 * @param {Array} z an array of temporal locations (e.g. time, frame index, etc.)
 * @param {Array} xy an array consisting of type and extent of spatial region (e.g. [1, 10, 10, 50, 50] denotes a 50x50 rectangle at (10,10)
 * @param {Object} metadata an associative array mapping attribute-id to its value
 */

'use strict';

const _VIA_RSHAPE  = { 'POINT':1, 'RECT':2, 'CIRCLE':3, 'ELLIPSE':4, 'LINE':5, 'POLYLINE':6, 'POLYGON':7, 'FILE':8 };

function _via_metadata(z, xy, v) {
  this.z  = z;  // time or frame index
  this.xy = xy; // [shape_id, shape_coordinates, ...]
  this.v  = v;  // attribute-value pair e.g. {attribute_id : attribute_value, ...}
}

