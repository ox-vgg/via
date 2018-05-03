/*
  test region operations (drawing, moving, deleting, etc.)

  Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
  Date  : Apr. 26, 2018
*/


function _via_test_case_regions_create() {
  return new Promise( async function(ok_callback, err_callback) {
    var file_count = _via_image_filename_list.length;
    var img_index = _via_test_rand_int(file_count);
    _via_test_show_img(img_index).then( async function(ok_img_index) {
      var added_regions = [];
      var failed_count = 0;
      var i, shape, region;

      //await _via_test_draw_rand_region( 'point' )

      var n = 2 + _via_test_rand_int(10);
      for ( i = 0; i < n; ++i ) {
        for ( shape in VIA_REGION_SHAPE ) {
          await _via_test_draw_rand_region( VIA_REGION_SHAPE[shape] ).then( function(ok_region) {
            added_regions.push(ok_region);
          }, function(err) {
            failed_count += 1;
          });
        }
      }


      if ( failed_count ) {
        err_callback({'has_passed':false,
                      'name':_via_test_case_regions_create.name,
                      'message':'failed to add ' + failed_count + ' regions and could add only ' +
                      added_regions.length + ' regions to image [' +
                      img_index + '] ' + _via_image_filename_list[img_index]
                     });
      } else {
        // assert that the annotations exported by VIA matches the annotations
        console.log(added_regions)
        var img_id = _via_image_id_list[img_index];
        console.log( _via_img_metadata[img_id].regions)
        ok_callback({'has_passed':true,
                     'name':_via_test_case_regions_create.name,
                     'message':'added ' + added_regions.length + ' regions to image [' +
                     img_index + '] ' + _via_image_filename_list[img_index]
                    });
      }
    }, function(err_img_index) {
      err_callback({'has_passed':false,
                     'name':_via_test_case_regions_create.name,
                     'message':'failed to load image [' +
                     img_index + '] ' + _via_image_filename_list[img_index]
                    });
    });
  });
}
