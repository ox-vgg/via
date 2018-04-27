/*
  test region operations (drawing, moving, deleting, etc.)

  Author: Abhishek Dutta <adutta@robots.ox.ac.uk>
  Date  : Apr. 26, 2018
*/


async function _via_test_case_region_create() {
  await _via_show_img(0);
  setTimeout( async function() {
    await _via_test_draw_rand_region('ellipse');
    await _via_test_draw_rand_region('rect');
    await _via_test_draw_rand_region('circle');
    await _via_test_draw_rand_region('point');
    await _via_test_draw_rand_region('polyline');
    await _via_test_draw_rand_region('polygon');
  }, 1000);
}

function _via_test_draw_rand_region(shape) {
  return new Promise( function(ok_callback, err_callback) {
    _via_test_simulate_htmlelement_click(['region_shape_' + shape], 0);
    var rc = document.getElementById('region_canvas');
    var w = rc.width;
    var h = rc.height;
    var r;

    switch(shape) {
    case VIA_REGION_SHAPE.RECT:
    case VIA_REGION_SHAPE.CIRCLE:
    case VIA_REGION_SHAPE.ELLIPSE:
      var x = _via_test_rand_int_array(w, 2);
      var y = _via_test_rand_int_array(h, 2);

      _via_test_simulate_canvas_mousedown(x[0], y[0]);
      _via_test_simulate_canvas_mouseup(x[1], y[1]);

      r = new _via_region(shape, '', [ x[0], y[0], x[1], y[1] ], 1, 0, 0);
      break;

    case VIA_REGION_SHAPE.POINT:
      var x = _via_test_rand_int(w);
      var y = _via_test_rand_int(h);
      _via_test_simulate_canvas_click(x, y);

      r = new _via_region(shape, '', [ x, y ], 1, 0, 0);
      break;

    case VIA_REGION_SHAPE.POLYGON:
    case VIA_REGION_SHAPE.POLYLINE:
      var n = 3 + _via_test_rand_int(10);
      var x = _via_test_rand_int_array(w, n);
      var y = _via_test_rand_int_array(h, n);
      var d = [];
      var i;
      for ( i = 0; i < n; ++i ) {
        _via_test_simulate_canvas_click(x[i], y[i]);
        d.push(x[i]);
        d.push(y[i]);
      }
      _via_test_simulate_canvas_keyevent('keydown')
      r = new _via_region(shape, '', d, 1, 0, 0);
      break;
    }

    var rshape = { 'name':shape };
    var i, n, attr;
    n = r.svg_attributes.length;
    for ( i = 0; i < n; ++i ) {
      attr = r.svg_attributes[i];
      rshape[attr] = r[attr];
    }
    ok_callback(rshape)
  });
}
