/**
 *
 * @class
 * @classdesc Implementation of manual annotator for image, video and audio
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 23 Dec. 2018
 *
 * @param {number} id a globally unique identifier
 * @param {string} uri URI of the file
 * @param {number} type the file type as defined by _VIA_FILE_TYPE in _via.js
 * @param {string} path prefix added to uri to form the complete URI
 */

'use strict'

function _via_file(id, uri, type, path='') {
  this.id = id;
  this.uri = uri;
  this.type = type;
  this.path = path;
}

