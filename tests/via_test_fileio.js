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
