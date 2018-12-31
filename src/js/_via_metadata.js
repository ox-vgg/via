/**
 *
 * @class
 * @classdesc Metadata
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 31 Dec. 2018
 *
 */

function _via_metadata(id, fid, offset, region, annotation) {
  this.id = id;                 // unique metadata id
  this.fid = fid;
  this.offset = offset;         // [time0, ...] or [uri_index, ...]
  this.region = region;         // [shape_id, x0, y0, ..., xn, yn]
  this.annotation = annotation; // {attribute_id, attribute_value}
}

