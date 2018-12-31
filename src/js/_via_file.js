/**
 *
 * @class
 * @classdesc Implementation of manual annotator for image, video and audio
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 23 Dec. 2018
 *
 */
function _via_file(id, uri, type, path='') {
  this.id = id;
  this.uri = uri;
  this.type = type;
  this.path = path;
}

_via_file.prototype.TYPE = { IMAGE:1, VIDEO:2, AUDIO:3, VFRAMES:4 };

