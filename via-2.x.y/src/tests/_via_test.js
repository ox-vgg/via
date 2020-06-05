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
  await _via_test_run_regression_tests();
}

async function _via_test_init_regression_tests() {
  await _via_test_search_regression_tests();
}

async function _via_test_run_regression_tests() {
  var test_case_result, test_case_name;
  for( var i = 0; i < _via_test_regression_tests.length; ++i ) {
    _via_test_ongoing_unit_test_id = i;
    test_case_name   = _via_test_regression_tests[_via_test_ongoing_unit_test_id].name;
    test_case_result = await _via_test_regression_tests[_via_test_ongoing_unit_test_id]();
    if ( test_case_result.has_passed ) {
      _via_test_result_passed.push( test_case_result );
      _via_test_log(test_case_name + ' : PASSED ');
    } else {
      _via_test_result_failed.push( test_case_result );
      _via_test_log(test_case_name + ' : FAILED : ' + test_case_result.message);
    }
  }

  /*
  if ( _via_test_result_passed.length ) {
  _via_test_log('_via_test_run_regression_tests(): summary of PASSED test cases');
    _via_test_print_test_result(_via_test_result_passed);
  }

  if ( _via_test_result_failed.length ) {
    _via_test_log('_via_test_run_regression_tests(): summary of FAILED test cases');
    _via_test_print_test_result(_via_test_result_failed);
  }
  */
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
  //_via_test_log('_via_test_search_regression_tests(): test cases count = ' + _via_test_regression_tests.length);
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
