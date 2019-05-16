var _via_unit_tests = [];
var _via_test_prefix = '_via_test_';
var _via_ongoing_unit_test_id = 0;

// events
var _via_unit_test_complete_event = new Event('_via_test_done');

function _via_load_submodules() {
    _via_init_unit_tests();
}

function _via_init_unit_tests() {
    _via_load_test_img();
    _via_search_unit_tests();
    setTimeout(_via_run_unit_tests, 500);
}

function _via_log_test_result(test_id, test_result, caller_name) {
    if ( !document.getElementById(caller_name) ) {
        var div_block = document.createElement('div');
        div_block.id = caller_name;
        document.getElementById('_via_test_log').appendChild(div_block);
        div_block.innerHTML = caller_name + '() : ';
    }

    var hstr = '<br>&nbsp;&nbsp;&gt; ';
    if (test_result) {
        hstr += '<span style="color: green;">' + test_id + '</span>';
    } else {
        hstr += '<span style="color: red;">' + test_id + '</span>';
    }
    document.getElementById(caller_name).innerHTML += hstr;
}

function _via_run_unit_tests() {
    var log_div = document.createElement('div');
    log_div.id = '_via_test_log';
    log_div.style.fontFamily = 'Mono';
    document.getElementById('display_area').appendChild(log_div);

    // execute these functions sequentially
    eval(_via_unit_tests[_via_ongoing_unit_test_id]);
    window.addEventListener('_via_test_done', function(e) {
        _via_ongoing_unit_test_id += 1;
        eval(_via_unit_tests[_via_ongoing_unit_test_id]);
    }, false);
}

function _via_search_unit_tests() {
    // retrive a list of all function names starting with _via_test_*()
    for ( var i in window) {
        if ( typeof window[i] === 'function' ) {
            if ( window[i].name.substr(0, _via_test_prefix.length) === _via_test_prefix) {
                _via_unit_tests.push(window[i].name + '()');
            }
        }
    }
}

function _via_load_test_img() {
    // initial state
    _via_img_metadata = {};
    _via_image_id_list = [];
    _via_loaded_img_fn_list = [];
    _via_img_count = 0;
    _via_reload_img_table = false;

    var _via_test_img_metadata = [];
    _via_test_img_metadata[0] = new ImageMetadata('', 'test_pattern_qbist.jpg', 129855);
    _via_test_img_metadata[1] = new ImageMetadata('', 'a_swan_swimming_in_geneve_lake.jpg', 62201);
    _via_test_img_metadata[2] = new ImageMetadata('', 'sinus_test_pattern.jpg', 27894);

    var img_order = [0, 1, 2];
    for (var i=0; i<_via_test_img_metadata.length; ++i) {
        var idx = img_order[i];
        _via_test_img_metadata[idx].base64_img_data = _via_unit_test_img[idx];

        var filename = _via_test_img_metadata[idx].filename;
        var size = _via_test_img_metadata[idx].size;

        var img_id = _via_get_image_id(filename, size);

        _via_img_metadata[img_id] = _via_test_img_metadata[idx];
        _via_image_id_list.push(img_id);
        _via_loaded_img_fn_list.push(_via_test_img_metadata[i].filename);
        _via_img_count += 1;
        _via_reload_img_table = true;
    }

    _via_image_index = 0;
    show_image(0);
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

function _via_simulate_htmlelement_click(html_elements, click_delay_ms) {
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
        setTimeout( function(html_element) {
            html_element.dispatchEvent(e);
        }, click_delay_ms * i, html_element_i);
    }
}


function _via_simulate_canvas_mouseevent(eventname, x, y) {
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

function _via_simulate_canvas_mouseup(x, y) {
    _via_simulate_canvas_mouseevent('mouseup', x, y);
}

function _via_simulate_canvas_mousedown(x, y) {
    _via_simulate_canvas_mouseevent('mousedown', x, y);
}

function _via_simulate_canvas_mousemove(x, y) {
    _via_simulate_canvas_mouseevent('mousemove', x, y);
}

function _via_simulate_canvas_click(x, y) {
    _via_simulate_canvas_mousedown(x, y);
    _via_simulate_canvas_mouseup(x, y);
}
