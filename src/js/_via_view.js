/**
 *
 * @class
 * @classdesc A view groups together a set of files and its associated metadata
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 5 Apr. 2019
 *
 */

'use strict'

function _via_view(f, d) {
  this.f = f; // [ fid0, fid1, ... ]
  this.d = d; // { 'mid1': {'z':..., 'xy':..., 'v':...}, 'mid2': {...}, ... }
}

