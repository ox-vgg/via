/*
  test region operations (drawing, moving, deleting, etc.)

  Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
  Date  : Apr. 26, 2018
*/


function _via_test_case_regions_create() {
  return new Promise( async function(ok_callback, err_callback) {
    var file_count = _via_image_filename_list.length;
    var img_index = _via_test_rand_int(file_count);
    var img_id = _via_image_id_list[img_index];
    _via_test_show_img(img_index).then( async function(ok_img_index) {
      var added_regions = [];
      var failed_count = 0;
      var i, shape, region;

      //await _via_test_draw_rand_region( 'point' )

      var n = 1 + _via_test_rand_int(0);
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
        ok_callback({'has_passed':false,
                      'name':_via_test_case_regions_create.name,
                      'message':'failed to add ' + failed_count + ' regions and could add only ' +
                      added_regions.length + ' regions to image [' +
                      img_index + '] ' + _via_image_filename_list[img_index]
                     });
      } else {
        // assert that the annotations exported by VIA matches the annotations
        console.log(added_regions);
        console.log( _via_img_metadata[img_id].regions );
        var i, n;
        n = added_regions.length;

        console.log(img_id)
        console.log(n)
        console.log(_via_img_metadata[img_id].regions.length)
        // assert that all added regions were stored
        if ( n === _via_img_metadata[img_id].regions.length ) {
          var all_matched = true;
          var added_shape, stored_shape;
          for ( i = 0; i < n; ++i ) {
            console.log('checking ' + i);
            added_shape  = JSON.stringify(added_regions[i]);
            // we compare image space coordinates
            stored_shape = JSON.stringify(_via_img_metadata[img_id].regions[i].shape_attributes);

            if ( added_shape !== stored_shape ) {
              all_matched = false;
              console.log('mismatched')
              console.log(added_shape)
              console.log(stored_shape)
              console.log(added_regions[i])
              console.log(_via_img_metadata[img_id].regions[i].shape_attributes)
              break;
            }
          }
          if ( all_matched ) {
            ok_callback({'has_passed':true,
                         'name':_via_test_case_regions_create.name,
                         'message':'added ' + added_regions.length + ' regions to image [' +
                         img_index + '] ' + _via_image_filename_list[img_index]
                        });

          } else {
            ok_callback({'has_passed':false,
                          'name':_via_test_case_regions_create.name,
                          'message':'added region ' + i + ' mismatch: added ' +
                          added_shape + ' !== stored ' + stored_shape
                         });
          }
        } else {
          ok_callback({'has_passed':false,
                        'name':_via_test_case_regions_create.name,
                        'message':'number of added regions (' + n + ')' +
                        ' mismatch with the number of regions stored in VIA application (' +
                        _via_img_metadata[img_id].regions.length + ')'
                       });
        }
      }
    }, function(err_img_index) {
      ok_callback({'has_passed':false,
                     'name':_via_test_case_regions_create.name,
                     'message':'failed to load image [' +
                     img_index + '] ' + _via_image_filename_list[img_index]
                    });
    });
  });
}
