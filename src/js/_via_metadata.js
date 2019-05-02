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

const _VIA_RSHAPE  = { 'POINT':1, 'RECT':2, 'CIRCLE':3, 'ELLIPSE':4, 'LINE':5, 'POLYLINE':6, 'POLYGON':7 };
const _VIA_METADATA_FLAG = { 'VISIBLE':0, 'DELETED':1, 'HIDDEN':2, 'RESERVED1':4, 'RESERVED2':8 }

function _via_metadata(vid, z, xy, av) {
  this.vid = vid;   // view id
  this.flg = 0;     // flags: [deleted, hidden, ...]
  this.z   = z;     // time or frame index
  this.xy  = xy;    // [shape_id, shape_coordinates, ...]
  this.av  = av;    // attribute-value pair e.g. {attribute_id : attribute_value, ...}
}

