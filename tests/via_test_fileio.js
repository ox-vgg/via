// unit tests to ensure correct functionality of import and export modules
//
// Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
// Feb. 08, 2017

function _via_test_fileio_csv_import() {
    _via_load_test_img();
    var blob = new Blob( [region_data_csv], {type: 'text/csv;charset=utf-8'});

    // simulate a csv file import
    load_text_file(blob, import_annotations_from_csv);

    var tests = []
    tests.push('Object.keys(_via_img_metadata).length === 3');
    tests.push('_via_img_metadata["a_swan_swimming_in_geneve_lake.jpg62201"].regions.length === 1');
    tests.push('_via_img_metadata["sinus_test_pattern.jpg27894"].regions.length === 3');
    tests.push('_via_img_metadata["test_pattern_qbist.jpg129855"].regions.length === 8');

    // run the tests after some delay
    _via_run_test( tests, 100 );

}

function _via_test_fileio_json_import() {
    _via_load_test_img();
    var blob = new Blob( [region_data_json], {type: 'text/json;charset=utf-8'});

    // simulate a json file import
    load_text_file(blob, import_annotations_from_json);

    var tests = []

    tests.push('Object.keys(_via_img_metadata).length === 3');
    tests.push('_via_img_metadata["a_swan_swimming_in_geneve_lake.jpg62201"].regions.length === 1');
    tests.push('_via_img_metadata["sinus_test_pattern.jpg27894"].regions.length === 3');
    tests.push('_via_img_metadata["test_pattern_qbist.jpg129855"].regions.length === 8');

    // run the tests after some delay
    _via_run_test( tests, 100 );
}

function _via_test_fileio_export() {
    _via_load_test_img();

    /*
    setTimeout( function() {
        select_region_shape('point');
        _via_simulate_canvas_mousedown(50, 50);
        _via_simulate_canvas_mouseup(50, 50);
        select_region_shape('rect');
        _via_simulate_canvas_mousedown(50, 50);
        _via_simulate_canvas_mouseup(150, 150);
    }, 200);
    */

    // draw regions, select and move ellipse
    setTimeout( function() {
        select_region_shape('rect');
        _via_simulate_canvas_mousedown(50, 50);
        _via_simulate_canvas_mouseup(150, 150);

        select_region_shape('ellipse');
        _via_simulate_canvas_mousedown(250, 250);
        _via_simulate_canvas_mouseup(300, 280);

        select_region_shape('polygon');
        _via_simulate_canvas_click(425, 83); // to unselect ellipse
        _via_simulate_canvas_click(425, 83);
        _via_simulate_canvas_click(353, 194);
        _via_simulate_canvas_click(552, 148);
        _via_simulate_canvas_click(425, 83);
    } , 100);

    // select one of the regions
    setTimeout( function() {
        _via_simulate_canvas_click(250, 250);
        _via_simulate_canvas_click(250, 250);
    } , 200);

    // move the region
    setTimeout( function() {
        _via_simulate_canvas_mousedown(250, 250);
        _via_simulate_canvas_mouseup(300, 300);
    } , 300);

    // download annotations as csv
    setTimeout( function() {
        var rd = pack_via_metadata('csv');
        var ground_truth = '#filename,file_size,file_attributes,region_count,region_id,region_shape_attributes,region_attributes\ntest_pattern_qbist.jpg,129855,"{}",3,0,"{""name"":""rect"",""x"":50,""y"":50,""width"":100,""height"":100}","{}"\ntest_pattern_qbist.jpg,129855,"{}",3,1,"{""name"":""ellipse"",""cx"":300,""cy"":300,""rx"":50,""ry"":30}","{}"\ntest_pattern_qbist.jpg,129855,"{}",3,2,"{""name"":""polygon"",""all_points_x"":[425,353,552,425],""all_points_y"":[83,194,148,83]}","{}"\na_swan_swimming_in_geneve_lake.jpg,62201,"{}",0,0,"{}","{}"\nsinus_test_pattern.jpg,27894,"{}",0,0,"{}","{}"';

        if (rd.join('') === ground_truth) {
            _via_log_test_result('pack_via_metadata(\'csv\');', true, '_via_test_fileio_export');
        } else {
            _via_log_test_result('pack_via_metadata(\'csv\');', false, '_via_test_fileio_export');
        }
    } , 400);

    // download annotations as json
    setTimeout( function() {
        var rd = pack_via_metadata('json');
        var ground_truth = '{"test_pattern_qbist.jpg129855":{"fileref":"","size":129855,"filename":"test_pattern_qbist.jpg","base64_img_data":"","file_attributes":{},"regions":{"0":{"shape_attributes":{"name":"rect","x":50,"y":50,"width":100,"height":100},"region_attributes":{}},"1":{"shape_attributes":{"name":"ellipse","cx":300,"cy":300,"rx":50,"ry":30},"region_attributes":{}},"2":{"shape_attributes":{"name":"polygon","all_points_x":[425,353,552,425],"all_points_y":[83,194,148,83]},"region_attributes":{}}}},"a_swan_swimming_in_geneve_lake.jpg62201":{"fileref":"","size":62201,"filename":"a_swan_swimming_in_geneve_lake.jpg","base64_img_data":"","file_attributes":{},"regions":{}},"sinus_test_pattern.jpg27894":{"fileref":"","size":27894,"filename":"sinus_test_pattern.jpg","base64_img_data":"","file_attributes":{},"regions":{}}}';

        if (rd.join('') === ground_truth) {
            _via_log_test_result('pack_via_metadata(\'json\');', true, '_via_test_fileio_export');
        } else {
            _via_log_test_result('pack_via_metadata(\'json\');', false, '_via_test_fileio_export');
        }
    } , 1000);

    setTimeout( function() {
        // indicate end of this unit test
        _via_run_test([], 0);
    }, 1200);

}
