function _via(html_container) {
  var uri_list = ['file:///data/datasets/via/debug_videos/bbb_sunflower_1080p_60fps_normal.mp4',
                  'file:///data/svt/videos/Moon_transit_of_sun_large.mp4',
                  'file:///data/datasets/via/debug_videos/Blue Planet II  - The Prequel-_38JDGnr0vA.mp4',
                ];
  var file_annotator = new _via_file_annotator(html_container);

  var m = new _via_data_model();
  m.attribute_add('activity',
                  'human activity depicted in video segment',
                  _via_attribute.prototype.TYPE.DROPDOWN,
                  {'walking':'Walking', 'eating':'Eating', 'cycling':'Cycling'}
                 );
  m.attribute_add('keyword',
                  'keywords describing the activity',
                  _via_attribute.prototype.TYPE.TEXT);

  //html_container.appendChild( m.attribute(0).html() );
  //html_container.appendChild( m.attribute(1).html() );

  var c = new _via_controller(m, file_annotator);
  var fid = c.file_add( uri_list[1], _via_file.prototype.TYPE.VIDEO );
  c.file_show(fid);
/*
  c.file_show(fid);
*/

}
