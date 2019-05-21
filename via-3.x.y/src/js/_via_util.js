/**
 * Utilities used by VIA default user interface
 *
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 31 Dec. 2018
 *
 */

'use strict'

var _via_msg_clear_timer; // holds a reference to current message timoout

function _via_util_get_svg_button(icon_id, title, id) {
  var el = document.createElementNS(_VIA_SVG_NS, 'svg');
  el.setAttributeNS(null, 'viewBox', '0 0 24 24');
  el.innerHTML = '<use xlink:href="#' + icon_id + '"></use><title>' + title + '</title>';
  el.setAttributeNS(null, 'class', 'svg_button');
  if ( typeof(id) !== 'undefined' ) {
    el.setAttributeNS(null, 'id', id);
  }
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
      return 'unknown ' + type;
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
  if ( filename.startsWith('http://') || filename.startsWith('https://') ) {
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
  switch( ext.toLowerCase() ) {
  case 'ogv':
  case 'mp4':
  case 'avi':
  case 'webm':
    return _VIA_FILE_TYPE.VIDEO;
    break;
  case 'jpg':
  case 'jpeg':
  case 'png':
  case 'bmp':
    return _VIA_FILE_TYPE.IMAGE;
    break;
  case 'mp3':
  case 'wav':
  case 'oga':
    return _VIA_FILE_TYPE.AUDIO;
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
    fsel.accept = '.csv,.txt';
    break;
  case _VIA_FILE_TYPE.JSON:
    fsel.accept = '.json';
    break;
  case _VIA_FILE_TYPE.VIDEO | _VIA_FILE_TYPE.AUDIO:
    fsel.accept = 'video/*,audio/*';
    break;
  case _VIA_FILE_TYPE.VIDEO | _VIA_FILE_TYPE.AUDIO | _VIA_FILE_TYPE.IMAGE:
    fsel.accept = 'video/*,audio/*,image/*';
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
  var el = document.getElementById('via_info_page_container');

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
  var el = document.getElementById('via_info_page_container');
  if ( el.style.display === 'block' ) {
    el.removeEventListener('mousedown', _via_util_hide_info_page);
    el.style.display = 'none';
  }
}

function _via_util_msg_show(msg, sticky) {
  var container = document.getElementById('_via_message_container');
  var content = document.getElementById('_via_message');
  if ( container && content ) {
    if ( _via_msg_clear_timer ) {
      clearTimeout(_via_msg_clear_timer);
    }
    if ( typeof(sticky) === 'undefined' ||
         sticky === false
       ) {
      _via_msg_clear_timer = setTimeout( function() {
        document.getElementById('_via_message_container').style.display = 'none';
      }, _VIA_CONFIG.MSG_TIMEOUT);
    }

    content.innerHTML = msg + '<span class="message_panel_close_button">&times;</span>';
    container.style.display = 'block';
  }
}

function _via_util_msg_hide() {
  document.getElementById('_via_message_container').style.display = 'none';
  if ( _via_msg_clear_timer ) {
    clearTimeout(_via_msg_clear_timer);
  }
}

function _via_util_pad10(x) {
  if ( x < 10 ) {
    return '0' + x.toString();
  } else {
    return x;
  }
}

function _via_util_date_to_filename_str(date_str) {
  var t = new Date(date_str);
  var month_list = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return _via_util_pad10(t.getDate()) + month_list[t.getMonth()] + t.getFullYear() + '_' + _via_util_pad10(t.getHours()) + 'h' + _via_util_pad10(t.getMinutes()) + 'm' + _via_util_pad10(t.getSeconds())+'s';
}

function _via_util_remote_get(uri) {
  return new Promise( function(ok_callback, err_callback) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function() {
      ok_callback(xhr.responseText);
    });
    xhr.addEventListener('error', function(e) {
      err_callback(e)
    });
    xhr.open('GET', uri);
    xhr.send();
  });
}

function _via_util_float_arr_to_fixed(arr, fixed) {
  for ( var i in arr ) {
    arr[i] = parseFloat( arr[i].toFixed(fixed) );
  }
  return arr;
}

function _via_util_float_to_fixed(value, fixed) {
  return parseFloat( value.toFixed(fixed) );
}


//
// Unique Id
//

// URL.createObjectURL() produces a unique id every time it is invoked.
// We use this functionality to generate unique id required by VIA
// @todo: Replace with a true UUID generator if it can be efficiently generated
// using pure JS (no dependencies)
function _via_util_uuid() {
  var temp_url = URL.createObjectURL(new Blob())
  var uuid = temp_url.toString();
  URL.revokeObjectURL(temp_url);
  var slash_index = uuid.lastIndexOf('/');
  if ( uuid !== -1 ) {
    // remove any prefix (e.g. blob:null/, blob:www.test.com/, ...)
    uuid = uuid.substr(slash_index + 1);
    uuid = uuid.replace(/-/g, '');
  }
  return uuid;
}

function _via_util_gen_project_id() {
  return 'via' + _via_util_uuid();
}

function _via_util_uid6() {
  var temp_url = URL.createObjectURL(new Blob());
  var uuid = temp_url.toString();
  URL.revokeObjectURL(temp_url);
  var n = uuid.length;
  // remove any prefix (e.g. blob:null/, blob:www.test.com/, ...)
  var uuid_suffix_str = '';
  for ( var i = n - 12; i < n; i = i + 2 ) {
    uuid_suffix_str += String.fromCharCode( parseInt(uuid.substr(i, 2), 16) );
  }
  var uid = btoa(uuid_suffix_str).replace('/', '-');
  return uid;
}

function _via_util_array_eq(a, b) {
  if ( a == null || b == null ) {
    return false;
  }
  if ( a.length != b.length ) {
    return false;
  }
  var n = a.length;
  for ( var i = 0; i < n; ++i ) {
    if ( a[i] !== b[i] ) {
      return false;
    }
  }
  return true;
}

function _via_util_obj_to_csv(obj, default_key) {
  var csv = [];
  for ( var oid in obj ) {
    if ( oid === default_key ) {
      csv.push( '*' + obj[oid] );
    } else {
      csv.push( obj[oid] );
    }
  }
  return csv.join(',');
}

function _via_util_attribute_to_html_element(attr) {
  var el;
  switch(attr.type) {
  case _VIA_ATTRIBUTE_TYPE.TEXT:
    el = document.createElement('textarea');
    break;

  case _VIA_ATTRIBUTE_TYPE.SELECT:
    el = document.createElement('select');
    var oid;
    for ( oid in attr.options ) {
      var oi = document.createElement('option');
      oi.setAttribute('value', oid);
      oi.innerHTML = attr.options[oid];
      if ( oid == attr.default_option_id ) {
        oi.setAttribute('selected', '');
      }
      el.appendChild(oi);
    }
    break;

  case _VIA_ATTRIBUTE_TYPE.RADIO:
    el = document.createElement('table');
    for ( var oid in attr.options ) {
      var oi = document.createElement('input');
      oi.setAttribute('name', attr.aname);
      oi.setAttribute('type', 'radio');
      var label = document.createElement('label');
      label.innerHTML = attr.options[oid];
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      td.appendChild(oi);
      td.appendChild(label);
      tr.appendChild(td);
      el.appendChild(tr);
    }
    break;

  default:
    el = document.createElement('span');
    el.innerHTML = 'UNKNOWN';
  }
  return el;
}

// ensure the exported json string conforms to RFC 4180
// see: https://en.wikipedia.org/wiki/Comma-separated_values
function _via_util_obj2csv(d) {
  return '"{' + JSON.stringify(d).replace(/["]/g, '""') + '}"';
}
