var _via_dp = []; // debug project

//
// Video annotation with spectrogram
//
_via_dp[0] = {};
_via_dp[0]['store'] = {};
_via_dp[0]['store']['project'] = {
  "pid": "__VIA_PROJECT_ID__",
  "rev": "__VIA_PROJECT_REV_ID__",
  "rev_timestamp": "__VIA_PROJECT_REV_TIMESTAMP__",
  "pname": "GuineaBissau Subset 0",
  "pdesc": "source: /scratch/shared/beegfs/maxbain/datasets/GuineaBissau",
  "data_format_version": "3.1.2",
  "creator": "VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)",
  "created": 1585655184.600423,
  "vid_list": [
    "1",
    "2",
    "3",
  ]
};
_via_dp[0]['store']['config'] = {
  "file": {
    "loc_prefix": {
      "1": "",
      "2": "http://zeus.robots.ox.ac.uk/via/vgg_research/GuineaBissau/",
      "3": "",
      "4": ""
    }
  },
  "ui": {
    "file_content_align": "center",
    "file_metadata_editor_visible": true,
    "spatial_metadata_editor_visible": true,
    "spatial_region_label_attribute_id": ""
  }
};

_via_dp[0]['store']['attribute'] = {
    "1": {
      "aname": "Action",
      "anchor_id": "FILE1_Z2_XY0",
      "type": 4,
      "desc": "Action contained in video segment",
      "options": { 'Drum':'Drum', 'Pant Hoot':'Pant Hoot' },
      "default_option_id": ""
    }
};
_via_dp[0]['store']['file'] = {
    "1": {
      "fid": 1,
      "fname": "lautchande/cnpl17-lau-poilon-m.12040029_chimp_ph_drumming.mp4",
      "type": 4,
      "loc": 2,
      "src": "lautchande/cnpl17-lau-poilon-m.12040029_chimp_ph_drumming.mp4"
    },
    "2": {
      "fid": 2,
      "fname": "lautchande/cnpl5-tagara.05160008_chimp_drumming.mp4",
      "type": 4,
      "loc": 2,
      "src": "lautchande/cnpl5-tagara.05160008_chimp_drumming.mp4"
    },
    "3": {
      "fid": 3,
      "fname": "lautchande/cnpl3&10-sacredpoilon.05300042_chimp_drumming.mp4",
      "type": 4,
      "loc": 2,
      "src": "lautchande/cnpl3&10-sacredpoilon.05300042_chimp_drumming.mp4"
    },
};
_via_dp[0]['store']['metadata'] = {};
_via_dp[0]['store']['view'] = {
  "1": {
    "fid_list": [
      "1"
    ]
  },
  "2": {
    "fid_list": [
      "2"
    ]
  },
  "3": {
    "fid_list": [
      "3"
    ]
  },
};
