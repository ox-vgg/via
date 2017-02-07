var _via_unit_tests = [];
var _via_test_prefix = '_via_test_';

function _via_log(log_msg) {
    document.getElementById('unit_tests_log').innerHTML += '<br>' + log_msg;
}

function _via_log_test_result(test_id, test_result, caller_name) {
    if ( !document.getElementById(caller_name) ) {
        var div_block = document.createElement('div');
        div_block.id = caller_name;
        document.getElementById('unit_tests_log').appendChild(div_block);
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

function _via_init_unit_tests() {
    _via_load_test_img();
    _via_search_unit_tests();
    setTimeout(_via_run_unit_tests, 500);
}

function _via_run_unit_tests() {
    var log_div = document.createElement('div');
    log_div.id = 'unit_tests_log';
    log_div.style.fontFamily = 'Mono';
    document.getElementById('display_area').appendChild(log_div);

    // execute these functions sequentially
    for (var i=0; i < _via_unit_tests.length; ++i) {
        eval(_via_unit_tests[i]);
    }
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
        _via_img_count += 1;
        _via_reload_img_table = true;
    }

    _via_image_index = 0;
    show_image(0);
}

function _via_run_test(cmd, delay_ms) {
    var caller_name = _via_run_test.caller.name;

    setTimeout( function() {
        for ( var i=0; i<cmd.length; ++i) {
            var result_i = eval(cmd[i]);
            _via_log_test_result(cmd[i], result_i, caller_name);
        }
    }, delay_ms);
}
