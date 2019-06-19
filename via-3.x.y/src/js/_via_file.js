/**
 *
 * @class
 * @classdesc Implementation of manual annotator for image, video and audio
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 23 Dec. 2018
 *
 * @param {number} fid a globally unique identifier
 * @param {string} fname filename
 * @param {number} type the file type as defined by _VIA_FILE_TYPE
 * @param {string} loc location of file as defined by _VIA_FILE_LOC
 * @param {string} src URI of the file or base64 data
 */

'use strict'

const _VIA_FILE_TYPE = { IMAGE:2, VIDEO:4, AUDIO:8 };
const _VIA_FILE_LOC  = { LOCAL:1, URIHTTP:2, URIFILE:3, INLINE:4 };

function _via_file(fid, fname, type, loc, src) {
  this.fid      = fid;
  this.fname    = fname;
  this.type     = type;
  this.loc      = loc;
  this.src      = src;
}

