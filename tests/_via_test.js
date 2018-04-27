/*
  a basic unit testing framework for VIA

  Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
  Date  : Apr. 26, 2018
*/

var _via_test_unit_tests = [];
var _via_test_test_prefix = '_via_test_case_';
var _via_test_ongoing_unit_test_id = 0;

var _via_test_console_window;

// events
var _via_test_unit_test_complete_event = new Event('_via_test_test_done');

function _via_load_submodules() {
  _via_test_init_console();
  _via_test_init_unit_tests();
}

async function _via_test_init_unit_tests() {
  await _via_test_reset_to_initial_state();
  await _via_test_search_unit_tests();

  setTimeout(_via_test_run_unit_tests, 500);
}

async function _via_test_reset_to_initial_state() {
  _via_test_print('_via_test: reset to initial state');
  if ( ! _via_test_assert_test_data_exists() ) {
    _via_test_print('_via_test: test data does not exist!');
    return;
  }
  var i, n;

  // add files
  n = _via_test_img_base64.length;
  for ( i = 0; i < n; ++i ) {
    project_file_add_base64( 'base64_file_' + (i+1) + '.jpg', _via_test_img_base64[i] );
  }
  n = _via_test_img_url.length;
  for ( i = 0; i < n; ++i ) {
    project_file_add_url(_via_test_img_url[i]);
  }
  n = _via_test_img_local.length;
  for ( i = 0; i < n; ++i ) {
    project_file_add_url(_via_test_img_local[i]);
  }
  update_img_fn_list();

  // add attributes
  var ok1 = await _via_test_create_rand_attributes( VIA_ATTRIBUTE_TYPE.CHECKBOX );
  var ok2 = await _via_test_create_rand_attributes( VIA_ATTRIBUTE_TYPE.RADIO );
  var ok3 = await _via_test_create_rand_attributes( VIA_ATTRIBUTE_TYPE.TEXT );
  var ok3 = await _via_test_create_rand_attributes( VIA_ATTRIBUTE_TYPE.DROPDOWN );
  var ok4 = await _via_test_create_rand_attributes( VIA_ATTRIBUTE_TYPE.IMAGE );
}

function _via_test_assert_test_data_exists() {
  var assert1 = ( _via_test_img_url.length > 0 );
  var assert2 = ( _via_test_img_local.length > 0 );
  var assert3 = ( _via_test_option_img_url.length > 0 );
  var assert4 = ( _via_test_img_base64.length > 0 );

  if ( assert1 && assert2 && assert3 && assert4 ) {
    return true;
  } else {
    return false;
  }
}


function _via_test_run_unit_tests() {
  // execute these functions sequentially
  _via_test_print(_via_test_unit_tests[_via_test_ongoing_unit_test_id]);
  eval(_via_test_unit_tests[_via_test_ongoing_unit_test_id]);
  window.addEventListener('_via_test_done', function(e) {
    _via_test_ongoing_unit_test_id += 1;
    _via_test_print(_via_test_unit_tests[_via_test_ongoing_unit_test_id]);
    eval(_via_test_unit_tests[_via_test_ongoing_unit_test_id]);
  }, false);
}

function _via_test_search_unit_tests() {
  // retrive a list of all function names starting with _via_test_*()
  for ( var i in window) {
    if ( typeof window[i] === 'function' ) {
      if ( window[i].name.substr(0, _via_test_test_prefix.length) === _via_test_test_prefix) {
        _via_test_unit_tests.push(window[i].name + '()');
      }
    }
  }
  _via_test_print('found the following test cases: ' + JSON.stringify(_via_test_unit_tests));
}

function _via_run_test(cmd, delay_ms) {
  var caller_name = _via_run_test.caller.name;

  setTimeout( function(cmd, caller_name) {
    for ( var i=0; i<cmd.length; ++i) {
      var result_i = eval(cmd[i]);
      _via_log_test_result(cmd[i], result_i, caller_name);
    }
    window.dispatchEvent(_via_unit_test_complete_event);
  }, delay_ms, cmd, caller_name);
}

function _via_test_simulate_htmlelement_click(html_elements, click_delay_ms) {
  if (typeof(click_delay_ms) === 'undefined') {
    click_delay_ms = 0;
  }

  var e = new MouseEvent('click', {
    'view': window,
    'bubbles': true,
    'cancelable': true
  });

  for (var i=0; i<html_elements.length; ++i) {
    var html_element_i = document.getElementById(html_elements[i])
    if ( click_delay_ms === 0 ) {
      html_element_i.dispatchEvent(e);
    } else {
      setTimeout( function(html_element) {
        html_element.dispatchEvent(e);
      }, click_delay_ms * i, html_element_i);
    }
  }
}

function _via_test_simulate_canvas_mouseevent(eventname, x, y) {
  var canvas_name = 'region_canvas';
  var c = document.getElementById(canvas_name);
  var r = c.getBoundingClientRect();
  var e = new MouseEvent(eventname, {
    'view': window,
    'bubbles': true,
    'cancelable': true,
    'screenX': x + r.left,
    'screenY': y + r.top,
    'clientX': x + r.left,
    'clientY': y + r.top,
    'button': 0
  });
  c.dispatchEvent(e);
}

function _via_test_simulate_canvas_keyevent(eventname) {
  var canvas_name = 'region_canvas';
  var c = document.getElementById(canvas_name);
  var r = c.getBoundingClientRect();
  var e = new KeyboardEvent('keydown', {
    'code':'Enter',
    'key':'Enter',
    'which':13,
    'keyCode':13
  });
  c.dispatchEvent(e);
}

function _via_test_simulate_canvas_mouseup(x, y) {
  _via_test_simulate_canvas_mouseevent('mouseup', x, y);
}

function _via_test_simulate_canvas_mousedown(x, y) {
  _via_test_simulate_canvas_mouseevent('mousedown', x, y);
}

function _via_test_simulate_canvas_mousemove(x, y) {
  _via_test_simulate_canvas_mouseevent('mousemove', x, y);
}

function _via_test_simulate_canvas_click(x, y) {
  _via_test_simulate_canvas_mousedown(x, y);
  _via_test_simulate_canvas_mouseup(x, y);
}

function _via_test_input_text_value(id, value) {
  var p = document.getElementById(id);
  p.value = value;
  return p.value;
}

function _via_test_input_checkbox_checked(id, checked) {
  var p = document.getElementById(id);
  p.checked = checked;
  p.onchange();
}

function _via_test_simulate_button_click(id, delay) {
  setTimeout( function() {
    document.getElementById(id).click();
  }, delay);
}

function _via_test_dropdown_get_index(id, value) {
  var p = document.getElementById(id);
  var i, n;
  n = p.options.length;
  for ( i = 0; i < n; ++i ) {
    if ( p.options[i].value === value ) {
      return i;
    }
  }
}

function _via_test_simulate_dropdown_select(id, value, delay) {
  setTimeout( function() {
    var p = document.getElementById(id);
    p.selectedIndex = _via_test_dropdown_get_index(id, value);
    p.onchange();
  }, delay);
}

function _via_test_simulate_input_text_blur(id) {
  var p = document.getElementById(id);
  p.focus();
  p.blur();
}

// source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function _via_test_rand_int(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function _via_test_rand_int_array(max, n) {
  var i;
  var arr = [];
  for ( i = 0; i < n; ++i ) {
    arr.push( Math.floor(Math.random() * Math.floor(max)) );
  }
  return arr;
}

function _via_test_rand_str() {
  var start  = _via_test_rand_int(_via_test_random_text_n - 2);
  return _via_test_random_text.substr(start);
}

function _via_test_rand_strn() {
  var start  = _via_test_rand_int(_via_test_random_textnum_n - 2);
  return _via_test_random_textnum.substr(start);
}

function _via_test_rand_strs() {
  var start  = _via_test_rand_int(_via_test_random_textspecial_n - 2);
  return _via_test_random_textspecial.substr(start);
}

function _via_test_create_rand_attributes(type) {
  return new Promise( function(ok_callback, err_callback) {
    if ( document.getElementById('attributes_editor_panel_title').classList.contains('active') ) {
      _via_test_simulate_htmlelement_click( ['button_show_region_attributes',
                                             'user_input_attribute_id'
                                            ], 2);
    } else {
      _via_test_simulate_htmlelement_click( ['attributes_editor_panel_title',
                                             'button_show_region_attributes',
                                             'user_input_attribute_id'
                                            ], 2);
    }

    var attr_id = _via_test_input_text_value('user_input_attribute_id', _via_test_rand_strn());
    _via_test_simulate_htmlelement_click( ['button_add_new_attribute'] );
    _via_test_simulate_dropdown_select('attribute_type', type, 1);

    setTimeout( function() {
      var attr_desc    = _via_test_input_text_value('attribute_description', _via_test_rand_str());
      _via_test_simulate_input_text_blur('attribute_description');

      switch(type) {
      default: // fallback
      case VIA_ATTRIBUTE_TYPE.TEXT:
        var attr_default = _via_test_input_text_value('attribute_default_value', _via_test_rand_str());
        _via_test_simulate_input_text_blur('attribute_default_value');

        ok_callback({'attr_id':attr_id, 'attr_desc':attr_desc, 'attr_default':attr_default});
        break;

      case VIA_ATTRIBUTE_TYPE.RADIO:    // fallback
      case VIA_ATTRIBUTE_TYPE.IMAGE:    // fallback
      case VIA_ATTRIBUTE_TYPE.DROPDOWN: // fallback
      case VIA_ATTRIBUTE_TYPE.CHECKBOX: // fallback
        setTimeout( function() {
          var i, n;
          var option_id_list = [];
          var promises = [];
          n = 2 + _via_test_rand_int(4);
          for ( i = 0; i < n; ++i ) {
            var oi_id = _via_test_input_text_value('_via_attribute_new_option_id', _via_test_rand_strn());
            _via_test_simulate_input_text_blur('_via_attribute_new_option_id');
            option_id_list.push(oi_id);

            var oi_desc_id = '_via_attribute_option_description_' + oi_id;
            var oi_desc;
            //var oi_desc = _via_test_input_text_value(oi_desc_id, _via_test_rand_str());
            if ( type === VIA_ATTRIBUTE_TYPE.IMAGE ) {
              var url = _via_test_option_img_url[ _via_test_rand_int(_via_test_option_img_url.length) ];
              oi_desc = _via_test_input_text_value(oi_desc_id, url);
            }
            _via_test_simulate_input_text_blur(oi_desc_id);

            if ( _via_test_rand_int(2) ) {
              // add this as default option
              var oi_default_id = '_via_attribute_option_default_' + oi_id;
              _via_test_input_checkbox_checked(oi_default_id, true);
            }
          }
          ok_callback({'attr_id':attr_id, 'attr_desc':attr_desc, 'attr_type':type, 'option_id_list':option_id_list});
        }, 10);
        break;
      }
    });
  }, 10);
}

function _via_test_set_attributes_rand_default(attr_type, option_id_list) {
  var i, n, oi_id;
  n = option_id_list.length;
  for ( i = 0; i < n; ++i ) {
    if ( _via_test_rand_int(2) ) {
      // add this as default option
      oi_id = option_id_list[i];
      var oi_default_id = '_via_attribute_option_default_' + oi_id;
      _via_test_input_checkbox_checked(oi_default_id, true);
    }
  }
}

function _via_test_del_attributes(attr_id) {
  return new Promise( function(ok_callback, err_callback) {
    _via_test_simulate_htmlelement_click( ['attributes_editor_panel_title',
                                           'button_show_region_attributes'
                                          ], 5);
    _via_test_simulate_dropdown_select('attribute_name_list', attr_id, 10);
    _via_test_simulate_htmlelement_click( ['button_del_attribute'], 20 );
    _via_test_input_checkbox_checked('confirm', true, 30);
    _via_test_simulate_button_click( 'user_input_ok_button', 40 );
    ok_callback(attr_id);
  });
}

//
// unit test console
//
function _via_test_init_console() {
  var window_features = 'toolbar=no,menubar=no,location=no,resizable=yes,scrollbars=yes,status=no';
  window_features += ',width=800,height=1080';
  _via_test_console_window = window.open('', 'Annotations (preview) ', window_features);
  _via_test_console_window.document.body.innerHTML = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>VIA Unit Tests</title></head><body><h1>VIA Unit Tests Result</h1><pre id="_via_test_console"></pre></body></html>';
}

function _via_test_print(data, is_new_line) {
  if ( typeof(is_new_line) === 'undefined' || is_new_line === true ) {
    _via_test_console_window.document.getElementById('_via_test_console').innerHTML += '\n' + Date.now() + ' : ' + data;
  } else {
    _via_test_console_window.document.getElementById('_via_test_console').innerHTML += data;
  }
}

function _via_test_console_clear() {
  _via_test_console_window.document.getElementById('_via_test_console').innerHTML = '';
}
