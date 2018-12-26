/**
 * Implementation of manual annotator for image, video and audio
 *
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 23 Dec. 2018
 *
 */
function _via_file(uri, type) {
  this.uri = uri;

  if ( typeof(type) === 'undefined' ) {
    this.type = this.infer_file_type(this.uri);
  } else {
    this.type = type;
  }
}

_via_file.prototype.id = function() {
  return this.uri;
}

_via_file.prototype.FILE_TYPE = { IMAGE:'image', VIDEO:'video', AUDIO:'audio' };

_via_file.prototype.infer_file_type = function(uri) {
  uri = uri.toLowerCase();
  if ( uri.endsWith('mp4') ||
       uri.endsWith('avi') ||
       uri.endsWith('ogv') ||
       uri.endsWith('webm') ||
       uri.endsWith('mov')
     ) {
    return this.FILE_TYPE.VIDEO;
  }

  if ( uri.endsWith('jpg') ||
       uri.endsWith('jpeg') ||
       uri.endsWith('png') ||
       uri.endsWith('tif') ||
       uri.endsWith('svg') ||
       uri.endsWith('bmp')
     ) {
    return this.FILE_TYPE.IMAGE;
  }

  if ( uri.endsWith('mp3') ||
       uri.endsWith('wav') ||
       uri.endsWith('aac')
     ) {
    return this.FILE_TYPE.AUDIO;
  }

  console.log('_via_file.infer_file_type(): ' +
              'Failed to infer file type for [' + uri + ']')
}
