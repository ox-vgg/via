/**
 *
 * @class
 * @classdesc Implementation of manual annotator for image, video and audio
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 23 Dec. 2018
 *
 * @param {number} fid a globally unique identifier
 * @param {string} filename filename
 * @param {number} type the file type as defined by _VIA_FILE_TYPE in file _via_const.js
 * @param {string} loc location of file as defined by _VIA_FILE_LOC in file _via_const.js
 * @param {string} src URI of the file or base64 data
 */

'use strict'

function _via_file(fid, filename, type, loc, src) {
  this.fid      = fid;
  this.filename = filename;
  this.type     = type;
  this.loc      = loc;
  this.src      = src;
}

