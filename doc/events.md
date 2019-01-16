# Events in VIA3

* _via_segment_annotator.js
  - _via_segment_annotator_seg_add    : a new segment is added by user
  - _via_segment_annotator_seg_update : an existing segment is updated by user
  - _via_segment_annotator_seg_del    : an existing segment is deleted by user

* _via_media_annotator.js
  - _via_media_annotator_seg_add    : a new segment has been added by some external event
  - _via_media_annotator_seg_update : an existing segment has been updated by some external event
  - _via_media_annotator_seg_del    : an existing segment has been deleted by some external event

* _via_annotator.js
  - don't generate events, directly invoke appropriate methods in _via_data.js

* _via_data.js
  - _via_data_seg_add    : a new segment gets added to the via_data by some external event
  - _via_data_seg_update : an existing segment in _via_data gets updated
  - _via_data_seg_del    : an existing segment in _via_data gets deleted
