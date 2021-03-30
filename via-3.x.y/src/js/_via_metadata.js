/**
 *
 * @class
 * @classdesc Metadata
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 31 Dec. 2018
 *
 * @param {Array} z an array of temporal locations (e.g. time, frame index, etc.)
 * @param {Array} xy an array consisting of type and extent of spatial region (e.g. [1, 10, 10, 50, 50] denotes a 50x50 rectangle at (10,10) )
 * @param {Object} an associative array mapping attribute-id to its value
 */

'use strict';

const _VIA_RSHAPE  = { 'POINT':1, 'RECTANGLE':2, 'CIRCLE':3, 'ELLIPSE':4, 'LINE':5, 'POLYLINE':6, 'POLYGON':7, 'EXTREME_RECTANGLE': 8, 'EXTREME_CIRCLE':9 };
const _VIA_METADATA_FLAG = { 'RESERVED_FOR_FUTURE':1 };

function _via_metadata(vid, z, xy, av) {
  this.vid = vid;   // view id
  this.flg = 0;     // flags reserved for future
  this.z   = z;     // [t0, ..., tn] (temporal coordinate e.g. time or frame index)
  this.xy  = xy;    // [shape_id, shape_coordinates, ...] (i.e. spatial coordinate)
  this.av  = av;    // attribute-value pair e.g. {attribute_id : attribute_value, ...}
}
