/*
  test region operations (drawing, moving, deleting, etc.)

  Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
  Date  : Apr. 26, 2018
*/


async function _via_test_case_region_create() {
  await _via_show_img(0);
  var added_regions = [];
  console.log('start')
  added_regions.push( await _via_test_draw_rand_region('ellipse') );
  added_regions.push( await _via_test_draw_rand_region('rect') );
  added_regions.push( await _via_test_draw_rand_region('circle') );
  added_regions.push( await _via_test_draw_rand_region('ellipse') );
  added_regions.push( await _via_test_draw_rand_region('rect') );
  added_regions.push( await _via_test_draw_rand_region('circle') );

  added_regions.push( await _via_test_draw_rand_region('point') );
  added_regions.push( await _via_test_draw_rand_region('point') );
  added_regions.push( await _via_test_draw_rand_region('point') );
  added_regions.push( await _via_test_draw_rand_region('point') );
  added_regions.push( await _via_test_draw_rand_region('point') );

  added_regions.push( await _via_test_draw_rand_region('polyline') );
  added_regions.push( await _via_test_draw_rand_region('polygon') );
  added_regions.push( await _via_test_draw_rand_region('polyline') );
  added_regions.push( await _via_test_draw_rand_region('polygon') );
  console.log('done')

}

async function _via_test_cae_region_create() {
  await _via_show_img(0);
  setTimeout( async function() {
    var added_regions = [];
    added_regions.push( await _via_test_draw_rand_region('ellipse') );
    added_regions.push( await _via_test_draw_rand_region('rect') );
    added_regions.push( await _via_test_draw_rand_region('circle') );
    added_regions.push( await _via_test_draw_rand_region('ellipse') );
    added_regions.push( await _via_test_draw_rand_region('rect') );
    added_regions.push( await _via_test_draw_rand_region('circle') );

    added_regions.push( await _via_test_draw_rand_region('point') );
    added_regions.push( await _via_test_draw_rand_region('point') );
    added_regions.push( await _via_test_draw_rand_region('point') );
    added_regions.push( await _via_test_draw_rand_region('point') );
    added_regions.push( await _via_test_draw_rand_region('point') );

    added_regions.push( await _via_test_draw_rand_region('polyline') );
    added_regions.push( await _via_test_draw_rand_region('polygon') );
    added_regions.push( await _via_test_draw_rand_region('polyline') );
    added_regions.push( await _via_test_draw_rand_region('polygon') );

    // assert each region's attribute is set to default value
    var json = JSON.parse( pack_via_metadata('json') );
    var csv  = pack_via_metadata('csv');
    console.log(json);
    console.log(_via_attributes);


    var img_id;
    var rid, n, i;
    var option;
    var x, y;
    var match, options_valid;
    var test_total = 0;
    var test_pass  = 0;
    for ( img_id in json ) {
      n = json[img_id].regions.length;
      for ( i = 0; i < n; ++i ) {
        for ( rid in json[img_id].regions[i].region_attributes ) {
          x = json[img_id].regions[i].region_attributes[rid];
          match = false;
          switch( _via_attributes['region'][rid].type ) {
          case 'text':
            match = ( x === _via_attributes['region'][rid].default_value );
            break;
          case 'radio':
          case 'dropdown':
          case 'image':
            y = Object.keys(_via_attributes['region'][rid].default_options)[0];
            match = ( x === y );
            break;
          case 'checkbox':
            y = _via_attributes['region'][rid].default_options;
            match = ( JSON.stringify(x) === JSON.stringify(y) );
            break;
          }
          test_total += 1;
          if ( match ) {
            test_pass += 1;
          }
        }
      }
    }
  }, 1000);
}
