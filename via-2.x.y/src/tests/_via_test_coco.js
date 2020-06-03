/*
  test COCO import/export

  Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
  Date  : June 03, 2020
*/

// source: a portion of MS COCO Dataset 2017
var coco_proj_str = '{"info": {"description": "COCO 2017 Dataset", "url": "http://cocodataset.org", "version": "1.0", "year": 2017, "contributor": "COCO Consortium", "date_created": "2017/09/01"}, "licenses": [{"url": "http://creativecommons.org/licenses/by-nc-sa/2.0/", "id": 1, "name": "Attribution-NonCommercial-ShareAlike License" }, { "url": "http://creativecommons.org/licenses/by-nc/2.0/", "id": 2, "name": "Attribution-NonCommercial License" }], "images": [ { "license": 1, "file_name": "000000397133.jpg", "coco_url": "http://images.cocodataset.org/val2017/000000397133.jpg", "height": 427, "width": 640, "date_captured": "2013-11-14 17:02:52", "flickr_url": "http://farm7.staticflickr.com/6116/6255196340_da26cf2c9e_z.jpg", "id": 397133 }, { "license": 1, "file_name": "000000037777.jpg", "coco_url": "http://images.cocodataset.org/val2017/000000037777.jpg", "height": 230, "width": 352, "date_captured": "2013-11-14 20:55:31", "flickr_url": "http://farm9.staticflickr.com/8429/7839199426_f6d48aa585_z.jpg", "id": 37777 }, { "license": 2, "file_name": "000000087038.jpg", "coco_url": "http://images.cocodataset.org/val2017/000000087038.jpg", "height": 480, "width": 640, "date_captured": "2013-11-14 23:11:37", "flickr_url": "http://farm8.staticflickr.com/7355/8825114508_b0fa4d7168_z.jpg", "id": 87038 }], "annotations": [ {"segmentation":[[224.24,297.18,228.29,297.18,234.91,298.29,243.0,297.55,249.25,296.45,252.19,294.98,256.61,292.4,254.4,264.08,251.83,262.61,241.53,260.04,235.27,259.67,230.49,259.67,233.44,255.25,237.48,250.47,237.85,243.85,237.11,240.54,234.17,242.01,228.65,249.37,224.24,255.62,220.93,262.61,218.36,267.39,217.62,268.5,218.72,295.71,225.34,297.55]], "area": 1481.3806499999994, "iscrowd": 0, "image_id": 397133, "bbox": [217.62,240.54,38.99,57.75], "category_id": 44, "id": 82445 }, {"segmentation": [[110.39,135.78,110.39,127.62,110.01,119.6,106.87,118.47,104.37,120.1,102.49,122.73,103.74,125.49,105.24,128.88,106.87,132.39,107.38,135.78,110.39,135.65]], "area": 88.52115000000006, "iscrowd": 0, "image_id": 37777, "bbox": [102.49,118.47,7.9,17.31], "category_id": 64, "id": 22328 }, { "segmentation": [[230.87,259.72,228.21,259.24,227.97,245.48,228.21,243.06,226.04,240.41,226.28,237.03,227.73,235.34,228.21,233.89,229.66,231.24,230.63,229.31,233.04,230.03,234.01,231.24,234.73,235.58,235.94,238.96,236.9,242.82,236.9,248.13,237.63,255.13,236.42,259.24,233.28,258.75,232.32,254.89,232.07,250.79,230.63,256.1,230.14,258.75]],"area": 232.4970999999999, "iscrowd": 0, "image_id": 87038, "bbox": [226.04,229.31,11.59,30.41], "category_id": 1, "id": 1209135 }], "categories": [ {"supercategory": "person","id": 1,"name": "person"}, {"supercategory": "furniture","id": 64,"name": "potted plant"}, {"supercategory": "kitchen","id": 44,"name": "bottle"}]}';

function _via_test_case_coco_import() {
  return new Promise( async function(ok_callback, err_callback) {
    //console.log(coco_proj_str);
    import_coco_annotations_from_json(coco_proj_str).then(function(ok) {
      if( !_via_attributes['region'].hasOwnProperty('furniture') ||
          !_via_attributes['region'].hasOwnProperty('kitchen') ||
          !_via_attributes['region'].hasOwnProperty('person') ) {
        err_callback({'has_passed':false, 'name':_via_test_case_coco_import.name, 'message':'malformed attributes'});
      }
      if( !_via_attributes['region']['furniture']['options']['64'] === 'potted plant' ||
          !_via_attributes['region']['kitchen']['options']['44'] === 'bottle' ||
          !_via_attributes['region']['person']['options']['1'] === 'person' ) {
        err_callback({'has_passed':false, 'name':_via_test_case_coco_import.name, 'message':'malformed attribute options'});
      }

      if( !_via_img_metadata.hasOwnProperty('37777') ||
          !_via_img_metadata.hasOwnProperty('87038') ||
          !_via_img_metadata.hasOwnProperty('397133') ) {
        err_callback({'has_passed':false, 'name':_via_test_case_coco_import.name, 'message':'image missing'});
      }
      if( !_via_img_metadata['37777']['regions'][0]['region_attributes']['furniture'] === '64' ||
          !_via_img_metadata['87038']['regions'][0]['region_attributes']['person'] === '1' ||
          !_via_img_metadata['397133']['regions'][0]['region_attributes']['kitchen'] === '44' ) {
        err_callback({'has_passed':false, 'name':_via_test_case_coco_import.name, 'message':'region attribute malformed'});
      }
      if( !_via_img_metadata['37777']['regions'][0]['shape_attributes']['all_points_x'].length === 11 ||
          !_via_img_metadata['87038']['regions'][0]['shape_attributes']['all_points_x'].length === 23 ||
          !_via_img_metadata['397133']['regions'][0]['shape_attributes']['all_points_x'].length === 24 ) {
        err_callback({'has_passed':false, 'name':_via_test_case_coco_import.name, 'message':'shape attribute malformed'});
      }
      ok_callback({'has_passed':true, 'name':_via_test_case_coco_import.name, 'message':'coco import done'});
    }, function(err) {
      err_callback({'has_passed':false, 'name':_via_test_case_coco_import.name, 'message':'import_coco_annotations_from_json() failed'});
    });
  });
}
