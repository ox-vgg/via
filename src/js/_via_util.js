/**
 * Utilities used by VIA default user interface
 *
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 31 Dec. 2018
 *
 */

'use strict'

function _via_util_get_svg_button(id, title, viewbox) {
  var svg_viewbox = viewbox;
  if ( typeof(svg_viewbox) === 'undefined' ) {
    svg_viewbox = '0 0 24 24';
  }

  var el = document.createElementNS(_VIA_SVG_NS, 'svg');
  el.setAttributeNS(null, 'viewbox', svg_viewbox);
  el.innerHTML = '<use xlink:href="#' + id + '"></use><title>' + title + '</title>';
  el.setAttributeNS(null, 'class', 'svg_button');
  return el;
}

function _via_util_get_html_input_element_value(el) {
  switch(el.tagName) {
  case 'TEXTAREA':
    return el.value;

  case 'SELECT':
    return el.options[el.selectedIndex].value;

  case 'INPUT':
    return el.value;
  }
}

function _via_util_get_filename_from_uri(uri) {
  if ( uri.includes('/') ) {
    var tokens = uri.split('/');
    return tokens[ tokens.length - 1 ];
  } else {
    return uri;
  }
}

function _via_util_file_type_to_str(type) {
  switch(type) {
    case _VIA_FILE_TYPE.IMAGE:
      return 'image';
      break;
    case _VIA_FILE_TYPE.VIDEO:
      return 'video';
      break;
    case _VIA_FILE_TYPE.AUDIO:
      return 'audio';
      break;
    default:
      return 'unknown ' + type.toString();
  }
}

function _via_util_file_type_str_to_id(type) {
  switch(type) {
    case 'image':
      return _VIA_FILE_TYPE.IMAGE;
      break;
    case 'video':
      return _VIA_FILE_TYPE.VIDEO;
      break;
    case 'audio':
      return _VIA_FILE_TYPE.AUDIO;
      break;
    default:
      return -1;
  }
}

function _via_util_file_loc_to_str(loc) {
  switch(loc) {
    case _VIA_FILE_TYPE.LOCAL:
      return 'local';
      break;
    case _VIA_FILE_TYPE.URIHTTP:
      return 'http://';
      break;
    case _VIA_FILE_TYPE.URIFILE:
      return 'file://';
      break;
    case _VIA_FILE_TYPE.URIFILE:
      return 'inline';
      break;
    default:
      return 'unknown-type-id=' + type.toString();
  }
}

function _via_util_file_loc_str_to_id(loc) {
  switch(loc) {
    case 'local':
      return _VIA_FILE_TYPE.LOCAL;
      break;
    case 'http://':
      return _VIA_FILE_TYPE.URIHTTP;
      break;
    case 'file://':
      return _VIA_FILE_TYPE.URIFILE;
      break;
    case 'inline':
      return _VIA_FILE_TYPE.URIFILE;
      break;
    default:
      return -1;
  }
}

function _via_util_metadata_target_str(target_id) {
  switch(target_id) {
    case _VIA_WHERE_TARGET.SEGMENT:
      return 'segment';
      break;
    case _VIA_WHERE_TARGET.FRAME:
      return 'frame';
      break;
    case _VIA_WHERE_TARGET.IMAGE:
      return 'image';
      break;
    default:
      return 'unknown';
  }
}

function _via_util_metadata_shape_str(shape_id) {
  switch(shape_id) {
    case _VIA_WHERE_SHAPE.TIME:
      return 'time';
      break;
    case _VIA_WHERE_SHAPE.RECT:
      return 'rect';
      break;
    case _VIA_WHERE_SHAPE.CIRCLE:
      return 'circle';
      break;
    case _VIA_WHERE_SHAPE.ELLIPSE:
      return 'ellipse';
      break;
    case _VIA_WHERE_SHAPE.POINT:
      return 'point';
      break;
    case _VIA_WHERE_SHAPE.POLYLINE:
      return 'polyline';
      break;
    case _VIA_WHERE_SHAPE.POLYGON:
      return 'polygon';
      break;
    default:
      return 'unknown';
  }
}

function _via_util_escape_quote_for_csv(s) {
  return s.replace(/["]/g, '""');
}

function _via_util_load_text_file(text_file, callback_function) {
  if (text_file) {
    var text_reader = new FileReader();

    text_reader.addEventListener( 'error', function() {
      console.log('Error loading data text file :  ' + text_file.name + ' !');
      callback_function('');
    }, false);

    text_reader.addEventListener( 'load', function() {
      callback_function(text_reader.result);
    }, false);
    text_reader.readAsText(text_file, 'utf-8');
  }
}

function _via_util_file_ext(filename) {
  return filename.substr( filename.lastIndexOf('.') + 1 );
}

function _via_util_infer_file_loc_from_filename(filename) {
  if ( filename.startsWith('http://') ) {
    return _VIA_FILE_LOC.URIHTTP;
  } else {
    if ( filename.startsWith('file://') ) {
      return _VIA_FILE_LOC.URIFILE;
    } else {
      return _VIA_FILE_LOC.LOCAL;
    }
  }
}

function _via_util_infer_file_type_from_filename(filename) {
  var ext = _via_util_file_ext(filename);
  switch( ext ) {
  case 'ogv':
  case 'mp4':
  case 'avi':
    return _VIA_FILE_TYPE.VIDEO;
    break;
  case 'jpg':
  case 'png':
  case 'bmp':
    return _VIA_FILE_TYPE.IMAGE;
    break;
  }
}


function _via_util_download_as_file(data, filename) {
  var a      = document.createElement('a');
  a.href     = URL.createObjectURL(data);
  a.download = filename;

  // simulate a mouse click event
  var event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  a.dispatchEvent(event);
}

function _via_util_file_select_local(type, handler, multiple) {
  var fsel = document.createElement('input');
  fsel.setAttribute('type', 'file');
  fsel.setAttribute('name', 'files[]');
  if ( typeof(multiple) === 'undefined' ||
       multiple === true ) {
    fsel.setAttribute('multiple', 'multiple')
  }

  switch(type) {
  case _VIA_FILE_TYPE.IMAGE:
    fsel.accept = 'image/*';
    break;
  case _VIA_FILE_TYPE.VIDEO:
    fsel.accept = 'video/*';
    break;
  case _VIA_FILE_TYPE.AUDIO:
    fsel.accept = 'audio/*';
    break;
  case _VIA_FILE_TYPE.TEXT:
    fsel.accept = '.csv';
    break;
  case _VIA_FILE_TYPE.JSON:
    fsel.accept = '.json';
    break;
  }

  fsel.onchange = handler;
  fsel.click();
}

// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function _via_util_rand_int(min_inclusive, max_exclusive) {
  return Math.floor(Math.random() * (max_exclusive - min_inclusive)) + min_inclusive;
}

function _via_util_show_info_page(page_id) {
  var el = document.getElementById('_via_info_page_container');

  var pages = el.getElementsByClassName('info_page');
  var n = pages.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    if ( pages[i].dataset.pageid === page_id ) {
      pages[i].style.display = 'inline-block';
      el.style.display = 'block';
      el.addEventListener('mousedown', _via_util_hide_info_page);
    } else {
      pages[i].style.display = 'none';
    }
  }
}

function _via_util_hide_info_page() {
  var el = document.getElementById('_via_info_page_container');
  if ( el.style.display === 'block' ) {
    el.removeEventListener('mousedown', _via_util_hide_info_page);
    el.style.display = 'none';
  }
}
