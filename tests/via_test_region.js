// unit tests for region update
//
// Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
// Feb. 08, 2017

function _via_test_region_delete_all() {
    _via_load_test_img();
    var blob = new Blob( [region_data_json], {type: 'text/json;charset=utf-8'});
    load_text_file(blob, import_annotations_from_json);

    setTimeout( function() {
        _via_simulate_htmlelement_click(
            ['toolbar_sel_all_region', 'toolbar_del_region'],
            10);
    } , 100);

    var tests = []
    tests.push('_via_img_metadata[_via_image_id].regions.length === 0');

    // run the tests after some delay
    _via_run_test( tests, 200 );

}

function _via_test_region_delete_one() {
    _via_load_test_img();
    var blob = new Blob( [region_data_json], {type: 'text/json;charset=utf-8'});
    load_text_file(blob, import_annotations_from_json);

    // move to third test image
    setTimeout( function() {
        _via_simulate_htmlelement_click(
            ['toolbar_next_img', 'toolbar_next_img'],
            500);
    } , 100);

    // select the ellipse centered at (300,223)
    setTimeout( function() {
        _via_simulate_canvas_click(300, 223);
    } , 700);

    // delete the selected region
    setTimeout( function() {
        _via_simulate_htmlelement_click(['toolbar_del_region'], 0);
    } , 800);

    var tests = []
    tests.push('_via_img_metadata[_via_image_id].regions.length === 2');

    // run the tests after some delay
    _via_run_test( tests, 1000 );
}
