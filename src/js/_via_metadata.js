/**
 *
 * @class
 * @classdesc Metadata
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 31 Dec. 2018
 *
 * @param {string} mid a unique metadata identifier
 * @param {Array} z an array of temporal locations (e.g. time, frame index, etc.)
 * @param {Array} xy an array consisting of type and extent of spatial region (e.g. [1, 10, 10, 50, 50] denotes a 50x50 rectangle at (10,10)
 * @param {Object} metadata an associative array mapping attribute-id to its value
 */

'use strict';

const _VIA_SHAPE  = { 'RECT':1, 'CIRCLE':2, 'ELLIPSE':3, 'POINT':4, 'POLYLINE':5, 'POLYGON':6 };

function _via_metadata(fid, mid, z, xy, metadata) {
  this.fid = fid;           // this metadata is attached to this file id
  this.mid = mid;           // unique metadata id
  this.z = z;               // time or frame index
  this.xy = xy;             // [shape_id, shape_coordinates, ...]
  this.metadata = metadata; // {attribute_id, attribute_value}
}

