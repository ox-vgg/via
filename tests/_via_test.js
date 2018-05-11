/*
  a basic unit testing framework for VIA

  Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
  Date  : Apr. 26, 2018
*/

var _via_test_regression_tests = [];
var _via_test_case_prefix = '_via_test_case_';
var _via_test_ongoing_unit_test_id = 0;
var _via_test_log_data = [];
var _via_test_console_window;
var _via_test_result_passed = [];
var _via_test_result_failed = [];

// events
var _via_test_unit_test_complete_event = new Event('_via_test_test_done');

async function _via_load_submodules() {
  _via_test_log_init();
  await _via_test_init_regression_tests();
  //await _via_test_run_regression_tests();
}

async function _via_test_init_regression_tests() {
  await _via_test_reset_to_initial_state();
  await _via_test_search_regression_tests();
}

async function _via_test_reset_to_initial_state() {
  if ( ! _via_test_assert_test_data_exists() ) {
    _via_test_log('_via_test_reset_to_initial_state(): test data set does not exist!');
    return;
  }

  // add files
  var i, n;
  var file_count = 0;
  n = _via_test_img_base64.length;
  for ( i = 0; i < n; ++i ) {
    project_file_add_base64( 'base64_file_' + (i+1) + '.jpg', _via_test_img_base64[i] );
    file_count += 1;
  }
  n = _via_test_img_url.length;
  for ( i = 0; i < n; ++i ) {
    project_file_add_url(_via_test_img_url[i]);
    file_count += 1;
  }
  n = _via_test_img_local.length;
  for ( i = 0; i < n; ++i ) {
    project_file_add_url(_via_test_img_local[i]);
    file_count += 1;
  }
  update_img_fn_list();
  _via_test_log('_via_test_reset_to_initial_state(): added ' + file_count + ' files to project');

  // add attributes
  var i, attr_input_type;
  var added_attributes = { 'region':{}, 'file':{} };
  var d;
  for ( i = 0; i < 3; ++i ) {
    for ( attr_input_type in VIA_ATTRIBUTE_TYPE ) {
      d = await _via_test_create_rand_attributes( 'region', VIA_ATTRIBUTE_TYPE[attr_input_type] );
      if ( d ) {
        added_attributes['region'][d.attr_id] = d.attr_data;
      } else {
        console.log('Error adding attribute region:' + VIA_ATTRIBUTE_TYPE[attr_input_type] + ':' + i);
      }

      d = await _via_test_create_rand_attributes( 'file', VIA_ATTRIBUTE_TYPE[attr_input_type] );
      if ( d ) {
        added_attributes['file'][d.attr_id] = d.attr_data;
      } else {
        console.log('Error adding attribute file:' + VIA_ATTRIBUTE_TYPE[attr_input_type] + ':' + i);
      }
    }
  }
  var rattr = Object.keys(added_attributes['region']).length;
  var fattr = Object.keys(added_attributes['file']).length;
  _via_test_log('_via_test_reset_to_initial_state(): added ' + rattr + ' region attributes and ' + fattr + ' file attributes');
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


async function _via_test_run_regression_tests() {
  var i, n;
  n = _via_test_regression_tests.length;
  var test_case_result, test_case_name;
  for ( i = 0; i < n; ++i ) {
    _via_test_ongoing_unit_test_id = i;
    test_case_name   = _via_test_regression_tests[_via_test_ongoing_unit_test_id].name;
    test_case_result = await _via_test_regression_tests[_via_test_ongoing_unit_test_id]();
    console.log(test_case_result)
    if ( test_case_result.has_passed ) {
      _via_test_result_passed.push( test_case_result );
      _via_test_log(test_case_name + ' : PASSED ');
    } else {
      _via_test_result_failed.push( test_case_result );
      _via_test_log(test_case_name + ' : FAILED ************************************');
    }
  }

  if ( _via_test_result_passed.length ) {
  _via_test_log('_via_test_run_regression_tests(): summary of PASSED test cases');
    _via_test_print_test_result(_via_test_result_passed);
    console.log(_via_test_result_passed)
  }

  if ( _via_test_result_failed.length ) {
    _via_test_log('_via_test_run_regression_tests(): summary of FAILED test cases');
    _via_test_print_test_result(_via_test_result_failed);
    console.log(_via_test_result_failed)
  }
}

function _via_test_print_test_result(results) {
  var result;
  var status;
  var i, n;
  n = results.length;
  for ( i = 0; i < n; ++i ) {
    result = results[i];
    if ( result.has_passed ) {
      status = 'PASSED';
    } else {
      status = 'FAILED';
    }
    _via_test_log(status + ':' + result.name);
  }
}

function _via_test_search_regression_tests() {
  // retrive a list of all function names starting with _via_test_*()
  for ( var i in window) {
    if ( typeof window[i] === 'function' ) {
      if ( window[i].name.substr(0, _via_test_case_prefix.length) === _via_test_case_prefix) {
        _via_test_regression_tests.push(window[i]);
      }
    }
  }
  _via_test_log('_via_test_search_regression_tests(): test cases count = ' + _via_test_regression_tests.length);
}

function _via_test_simulate_htmlelement_click(html_element) {
  return new Promise( function(ok_callback, err_callback) {
    var e = new MouseEvent('click', {
      'view': window,
      'bubbles': true,
      'cancelable': true
    });

    var p = document.getElementById(html_element);
    if ( p ) {
      p.dispatchEvent(e);
      ok_callback(0);
    } else {
      err_callback(1);
    }
  });
}

function _via_test_simulate_canvas_mouseevent(eventname, x, y) {
  return new Promise( function(ok_callback, err_callback) {
    var canvas_name = 'region_canvas';
    var c = document.getElementById(canvas_name);
    if ( c ) {
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
      if ( e ) {
        c.dispatchEvent(e);
        //console.log('_via_test_simulate_canvas_mouseevent() ' + eventname + ': (' + x + ',' + y + ')');
        ok_callback(0);
      } else {
        err_callback(1);
      }
    } else {
      err_callback(1);
    }
  });
}

function _via_test_simulate_canvas_keyevent_enter() {
  return new Promise( function(ok_callback, err_callback) {
    var canvas_name = 'region_canvas';
    var c = document.getElementById(canvas_name);
    if ( c ) {
      var r = c.getBoundingClientRect();
      var e = new KeyboardEvent('keydown', {
        'code':'Enter',
        'key':'Enter',
        'which':13,
        'keyCode':13
      });
      if ( e ) {
        c.dispatchEvent(e);
        ok_callback(0);
      } else {
        err_callback(1);
      }
    } else {
      err_callback(1);
    }
  });
}

function _via_test_simulate_canvas_mouseup(x, y) {
  return _via_test_simulate_canvas_mouseevent('mouseup', x, y);
}

function _via_test_simulate_canvas_mousedown(x, y) {
  return _via_test_simulate_canvas_mouseevent('mousedown', x, y);
}

function _via_test_simulate_canvas_mousemove(x, y) {
  return _via_test_simulate_canvas_mouseevent('mousemove', x, y);
}

function _via_test_simulate_canvas_click(x, y) {
  return new Promise( async function(ok_callback, err_callback) {
    var e1 = await _via_test_simulate_canvas_mousedown(x, y);
    if ( e1 ) {
      err_callback(1);
    } else {
      var e2 = await _via_test_simulate_canvas_mouseup(x, y);
      if ( e2 ) {
        err_callback(1);
      } else {
        //console.log('_via_test_simulate_canvas_click(): click at (' + x + ',' + y + ')');
        ok_callback(0);
      }
    }
  });
}

function _via_test_input_checkbox_checked(id, checked) {
  return new Promise( function(ok_callback, err_callback) {
    var p = document.getElementById(id);
    if ( p ) {
      p.checked = checked;
      p.onchange();
      ok_callback(0);
    } else {
      err_callback(1);
    }
  });
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

function _via_test_simulate_dropdown_select(id, value) {
  return new Promise( function(ok_callback, err_callback) {
    var p = document.getElementById(id);
    if ( p && p.options.length) {
      var i = _via_test_dropdown_get_index(id, value);
      if ( i >= 0 && i < p.options.length ) {
        p.selectedIndex = i;
        p.onchange();
        ok_callback(0);
      } else {
        err_callback(1);
      }
    } else {
      err_callback(1);
    }
  });
}


function _via_test_input_text_value(id, value, attr_id) {
  return new Promise( function(ok_callback, err_callback) {
    var p = document.getElementById(id);
    if ( p ) {
      p.setAttribute('value', value);
      var set_value = p.getAttribute('value');
      ok_callback( set_value );
    } else {
      console.log('_via_test_input_text_value() ' + attr_id + ':' + id + ':[' + value.substr(0,50) + '] not available!');
      err_callback();
    }
  });
}

function _via_test_simulate_input_text_onchange(id, attr_id) {
  return new Promise( function(ok_callback, err_callback) {
    var p = document.getElementById(id);
    if ( p && p.onchange ) {
      p.onchange();
      ok_callback(0);
    } else {
      console.log('_via_test_simulate_input_text_onchange() ' + attr_id + ':' + id + ' not available!');
      err_callback(1);
    }
  });
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

function _via_test_is_inside_any_region(x, y) {
  var region_id = is_inside_region(x, y);
  if ( region_id >= 0 ) {
    return true;
  } else {
    return false;
  }
}

function _via_test_rand_str() {
  var start  = _via_test_rand_int(_via_test_random_text_n - 5);
  return _via_test_random_text.substr(start);
}

function _via_test_rand_strn() {
  var start  = _via_test_rand_int(_via_test_random_textnum_n - 5);
  return _via_test_random_textnum.substr(start, 8);
}

function _via_test_rand_strs() {
  var start  = _via_test_rand_int(_via_test_random_textspecial_n - 5);
  return _via_test_random_textspecial.substr(start);
}

function _via_test_create_rand_attributes(attr_type, attr_input_type) {
  return new Promise( async function(ok_callback, err_callback) {
    if ( ! document.getElementById('attributes_editor_panel_title').classList.contains('active') ) {
      var r = await _via_test_simulate_htmlelement_click('attributes_editor_panel_title');
      if ( r ) {
        err_callback();
        return;
      }
    }
    var r = await _via_test_simulate_htmlelement_click('button_show_' + attr_type + '_attributes');
    if ( r ) {
      err_callback();
      return;
    }

    var attr_id = _via_test_rand_strn();
    while ( attribute_property_id_exists(attr_id) ) {
      var attr_id = _via_test_rand_strn();
    }

    //console.log('adding attribute ' + attr_type + ':' + attr_input_type + ':' + attr_id)

    var r = await _via_test_input_text_value('user_input_attribute_id', attr_id, attr_id);
    if ( r !== attr_id ) {
      err_callback();
      return;
    }

    var r = await _via_test_simulate_htmlelement_click('button_add_new_attribute');
    if ( r ) {
      err_callback();
      return;
    }

    var attr_desc = _via_test_rand_str();
    var r = await _via_test_input_text_value('attribute_description', attr_desc, attr_id);
    if ( r !== attr_desc) {
      err_callback();
      return;
    }

    var r = await _via_test_simulate_input_text_onchange('attribute_description', attr_id);
    if ( r ) {
      err_callback();
      return;
    }

    var r = await _via_test_simulate_dropdown_select('attribute_type', attr_input_type);
    if ( r ) {
      err_callback();
      return;
    }

    switch(attr_input_type) {
    default: // fallback
    case VIA_ATTRIBUTE_TYPE.TEXT:
      var attr_default_value = _via_test_rand_str();
      var r = await _via_test_input_text_value('attribute_default_value', attr_default_value, attr_id);
      if ( r !== attr_default_value ) {
        err_callback();
        return;
      }
      var r = await _via_test_simulate_input_text_onchange('attribute_default_value', attr_id);
      if ( r ) {
        err_callback();
        return;
      }

      ok_callback( { 'attr_id':attr_id, 'attr_data':{'type':attr_input_type, 'description':attr_desc, 'default_value':attr_default_value} } );
      break;

    case VIA_ATTRIBUTE_TYPE.RADIO:    // fallback
    case VIA_ATTRIBUTE_TYPE.IMAGE:    // fallback
    case VIA_ATTRIBUTE_TYPE.DROPDOWN: // fallback
    case VIA_ATTRIBUTE_TYPE.CHECKBOX: // fallback
      var i, n;
      var option_id_list = [];
      var options = {};
      var option_defaults = {};

      n = 2 + _via_test_rand_int(4);
      //n = 1;
      for ( i = 0; i < n; ++i ) {
        var option_id = _via_test_rand_strn();
        var option_id_test = attribute_property_option_id_is_valid(attr_id, option_id);
        // ensure that a unique option_id is obtained
        while ( ! option_id_test.is_valid ) {
          option_id = _via_test_rand_strn();
          option_id_test = attribute_property_option_id_is_valid(attr_id, option_id);
        }

        var r = await _via_test_input_text_value('_via_attribute_new_option_id', option_id, attr_id);
        if ( r !== option_id ) {
          err_callback();
          return;
        }

        var r = await _via_test_simulate_input_text_onchange('_via_attribute_new_option_id', attr_id);
        if ( r ) {
          err_callback();
          return;
        }

        option_id_list.push(option_id);

        var option_desc_id = '_via_attribute_option_description_' + option_id;
        var option_desc_value;
        //var oi_desc = _via_test_input_text_value(oi_desc_id, _via_test_rand_str());
        if ( attr_input_type === VIA_ATTRIBUTE_TYPE.IMAGE ) {
          option_desc_value = _via_test_option_img_url[ _via_test_rand_int(_via_test_option_img_url.length) ];
        } else {
          option_desc_value = _via_test_rand_str();
        }
        var r = await _via_test_input_text_value(option_desc_id, option_desc_value, attr_id);
        if ( r !== option_desc_value ) {
          err_callback();
          return;
        }
        var r = await _via_test_simulate_input_text_onchange(option_desc_id);
        if ( r ) {
          err_callback();
          return;
        }

        options[option_id] = option_desc_value;

        if ( _via_test_rand_int(2) ) {
          // add this as default option
          var option_default_id = '_via_attribute_option_default_' + option_id;
          var r = await _via_test_input_checkbox_checked(option_default_id, true);
          if ( r ) {
            err_callback();
            return;
          }

          if ( attr_input_type !== VIA_ATTRIBUTE_TYPE.CHECKBOX ) {
            option_defaults = {};
          }
          option_defaults[option_id] = true;
        }
      }
      ok_callback( { 'attr_id':attr_id, 'attr_data':{'type':attr_input_type, 'description':attr_desc, 'options':options, 'default_options':option_defaults} } );
      break;
    }

    // assert that attribute was added successfully
    if ( ! _via_attributes[attr_type].hasOwnProperty(attr_id) ) {
      err_callback();
      return;
    }
  });
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


function _via_test_draw_rand_region(shape) {
  return new Promise( async function(ok_callback, err_callback) {
    //console.log('---------------------------[ drawing region ' + shape + ' ]---------------------------------');

    var region_shape_id = 'region_shape_' + shape;
    var r = await _via_test_simulate_htmlelement_click(region_shape_id);
    if ( r ) {
      err_callback();
      return;
    }

    var rc = document.getElementById('region_canvas');
    if ( ! rc ) {
      err_callback();
      return;
    }

    var w = rc.width;
    var h = rc.height;
    if ( w === 1 && h === 1 ) {
      err_callback();
      return;
    }

    var rshape = { 'name':shape };

    switch(shape) {
    case VIA_REGION_SHAPE.RECT:
    case VIA_REGION_SHAPE.CIRCLE:
    case VIA_REGION_SHAPE.ELLIPSE:
      var x = _via_test_rand_int_array(w, 2);
      var y = _via_test_rand_int_array(h, 2);

      if ( _via_is_region_selected ) {
        await _via_test_click_region_until_all_unselect(x[0], y[0]);
      }

      var dx = x[1] - x[0];
      var dy = y[1] - y[0];
      if ( dx <= VIA_REGION_MIN_DIM || dy <= VIA_REGION_MIN_DIM ) {
        x[1] = x[0] + 2*VIA_REGION_MIN_DIM + _via_test_rand_int(30);
        y[1] = y[0] + 2*VIA_REGION_MIN_DIM + _via_test_rand_int(20);
      }
      var e = await _via_test_simulate_canvas_mousedown(x[0], y[0]);
      if ( e ) {
        err_callback();
        return;
      }

      var e = await _via_test_simulate_canvas_mouseup(x[1], y[1]);
      if ( e ) {
        err_callback();
        return;
      }

      switch(shape) {
      case VIA_REGION_SHAPE.RECT:
        // we must add the canvas coordinates in the same way as VIA does
        var x0, y0, x1, y1;
        // ensure that (x0,y0) is top-left and (x1,y1) is bottom-right
        if ( x[0] < x[1] ) {
          x0 = x[0];
          x1 = x[1];
        } else {
          x0 = x[1];
          x1 = x[0];
        }
        if ( y[0] < y[1] ) {
          y0 = y[0];
          y1 = y[1];
        } else {
          y0 = y[1];
          y1 = y[0];
        }
        var dx = x1 - x0;
        var dy = y1 - y0;

        rshape.x = Math.round(x0 * _via_canvas_scale);
        rshape.y = Math.round(y0 * _via_canvas_scale);
        rshape.width  = Math.round(dx * _via_canvas_scale);
        rshape.height = Math.round(dy * _via_canvas_scale);
        break;
      case VIA_REGION_SHAPE.CIRCLE:
        var dx = x[1] - x[0];
        var dy = y[1] - y[0];

        rshape.cx = Math.round(x[0] * _via_canvas_scale);
        rshape.cy = Math.round(y[0] * _via_canvas_scale);
        rshape.r  = Math.round( Math.sqrt(dx*dx + dy*dy) * _via_canvas_scale );
        break;

      case VIA_REGION_SHAPE.ELLIPSE:
        var dx = x[1] - x[0];
        var dy = y[1] - y[0];

        rshape.cx = Math.round(x[0] * _via_canvas_scale);
        rshape.cy = Math.round(y[0] * _via_canvas_scale);
        rshape.rx = Math.round(dx * _via_canvas_scale);
        rshape.ry = Math.round(dy * _via_canvas_scale);
        break;
      }
      break;

    case VIA_REGION_SHAPE.POINT:
      var x = _via_test_rand_int(w);
      var y = _via_test_rand_int(h);
      var e = await _via_test_click_region_first_point(x, y);
      if ( e ) {
        err_callback();
        return;
      }

      rshape.cx = Math.round(x * _via_canvas_scale);;
      rshape.cy = Math.round(y * _via_canvas_scale);
      break;

    case VIA_REGION_SHAPE.POLYGON:
    case VIA_REGION_SHAPE.POLYLINE:
      var n = 3 + _via_test_rand_int(10);
      //var n = 3;
      var x = _via_test_rand_int_array(w, n);
      var y = _via_test_rand_int_array(h, n);
      var all_points_x = [];
      var all_points_y = [];
      var d = [];

      var e = await _via_test_click_region_first_point(x[0], y[0]);
      if ( e ) {
        err_callback();
        return;
      }
      all_points_x.push(x[0]);
      all_points_y.push(y[0]);

      var i;
      for ( i = 1; i < n; ++i ) {
        // keep clicking to add vertices
        var e = await _via_test_simulate_canvas_click(x[i], y[i]);
        if ( e ) {
          err_callback();
          return;
        }
        all_points_x.push(x[i]);
        all_points_y.push(y[i]);
      }

      // signal end of polygon/polyline drawing by pressing Enter key
      var e = await _via_test_simulate_canvas_keyevent_enter();
      if ( e ) {
        err_callback();
        return;
      }

      var i, n;
      n = all_points_x.length;
      rshape.all_points_x = [];
      rshape.all_points_y = [];
      for ( i = 0; i < n; ++i ) {
        rshape.all_points_x[i] = Math.round( all_points_x[i] * _via_canvas_scale );
        rshape.all_points_y[i] = Math.round( all_points_y[i] * _via_canvas_scale );
      }
      break;
    }
    console.log(JSON.stringify(rshape))
    ok_callback(rshape)
  });
}

function _via_test_show_img(img_index) {
  return new Promise( function(ok_callback, err_callback) {
    if ( _via_buffer_img_index_list.includes(img_index) ) {
      _via_show_img_from_buffer(img_index).then( function(ok_img_index) {
        ok_callback(ok_img_index);
      }, function(err_img_index) {
        err_callback(err_img_index);
      });
    } else {
      // first, add image to buffer then show image
      _via_img_buffer_add_image(img_index).then( function(ok_buffer_img_index) {
        // now show image from buffer
        _via_show_img_from_buffer(ok_buffer_img_index).then( function(ok_img_index) {
          ok_callback(ok_img_index);
        }, function(err_img_index) {
          err_callback(err_img_index);
        });
      }, function(err_buffer_img_index) {
        err_callback(err_buffer_img_index)
      });
    }
  });
}

//
// unit test console
//
function _via_test_log_init() {
  _via_test_log_data = [];
}

function _via_test_log(msg) {
  var ts = Date.now();
  _via_test_log_data.push({'timestamp':ts, 'message':msg});
  console.log( ts + ':' + msg );
}

async function _via_test_sleep(ms) {
  return new Promise( function(ok_callback, err_callback) {
    setTimeout( function() {
      ok_callback();
    }, ms);
  });
}

function _via_test_click_region_until_all_unselect(x, y) {
  return new Promise( async function(ok_callback, err_callback) {
    while ( _via_is_region_selected ) {
      //console.log('clicking (' + x +','+y+') until _via_is_region_selected='+_via_is_region_selected);
      var e = await _via_test_simulate_canvas_click(x, y);
      if ( e ) {
        err_callback();
        return;
      }
      await _via_test_sleep(5);
      // for some reason, this mousemove event is sometimes needed
      // to break the never ending loop
      await _via_test_simulate_canvas_mousemove(x,y);
    }
    ok_callback();
  });
}

function _via_test_click_region_first_point(x, y) {
  return new Promise( async function(ok_callback, err_callback) {
    //
    // @todo: avoid clicking on region edge if region is selected
    // as this will trigger region resize
    //

    // first click
    // Note: it is important to simulate first click in exactly the same manner as
    // a user would perform when manually defining regions.
    if ( _via_is_region_selected ) {
      // check if we are going to click inside an existing region
      var region_id = is_inside_region(x, y);

      if ( region_id >= 0 ) {
        //console.log('******************* _via_user_sel_region_id='+_via_user_sel_region_id+', region_id='+region_id)
        if ( _via_user_sel_region_id === region_id) {
          // click inside selected region

          // sometimes, a click inside nested region results in selection
          // of another nested region. Therefore, we need to keep clicking
          // until all regions get unselected.
          if ( _via_is_region_selected ) {
            await _via_test_click_region_until_all_unselect(x, y);
          }
        } else {
          // click inside non-selected region
          // we need to do two clicks:
          // first click to unselect existing selected region
          // second click to actually define the vertex of new region

          // first click
          var e = await _via_test_simulate_canvas_click(x, y);
          if ( e ) {
            err_callback(1);
            return;
          }


          // sometimes, a click inside nested region results in selection
          // of another nested region. Therefore, we need to keep clicking
          // until all regions get unselected.
          if ( _via_is_region_selected ) {
            await _via_test_click_region_until_all_unselect(x, y);
          } else {
            // second click
            var e = await _via_test_simulate_canvas_click(x, y);
            if ( e ) {
              err_callback(1);
              return;
            }
          }
        }
      } else {
        // click outside any selected regions
        // again, we need to do two clicks:
        // first click to unselect existing selected region
        // second click to actually define the vertex of new region

        // first click
        var e = await _via_test_simulate_canvas_click(x, y);
        if ( e ) {
          err_callback(1);
          return;
        }

        // sometimes, a click inside nested region results in selection
        // of another nested region. Therefore, we need to keep clicking
        // until all regions get unselected.
        if ( _via_is_region_selected ) {
          await _via_test_click_region_until_all_unselect(x, y);
        } else {
          // second click
          var e = await _via_test_simulate_canvas_click(x, y);
          if ( e ) {
            err_callback(1);
            return;
          }
        }
      }
    } else {
      // check if the point we are about to click falls inside any existing region
      var region_id = is_inside_region(x, y);
      if ( region_id >= 0 ) {
        // we are about to click inside an existing region, so we need two clicks
        // first click to select existing region
        // second click to unselect the region and define the vertex of new region

        // first click
        var e = await _via_test_simulate_canvas_click(x, y);
        if ( e ) {
          err_callback(1);
          return;
        }
        // second click
        var e = await _via_test_simulate_canvas_click(x, y);
        if ( e ) {
          err_callback(1);
          return;
        }

        // sometimes, a click inside nested region results in selection
        // of another nested region. Therefore, we need to keep clicking
        // until all regions get unselected.
        if ( _via_is_region_selected ) {
          await _via_test_click_region_until_all_unselect(x, y);
        }
      } else {
        var e = await _via_test_simulate_canvas_click(x, y);
        if ( e ) {
          err_callback(1);
          return;
        }
      }
    }
    ok_callback(0);
  });
}
