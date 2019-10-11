var _via_dp = []; // debug project

//
// Image Pair Annotation: MRI Stenosis
//
_via_dp[0] = {};
_via_dp[0]['store'] = {};
_via_dp[0]['store']['project'] = {
  'pid': '__VIA_PROJECT_ID__',
  'rev': '__VIA_PROJECT_REV_ID__',
  'rev_timestamp': '__VIA_PROJECT_REV_TIMESTAMP__',
  'pname': 'Debug MRI Stenosis',
  'data_format_version': '3.1.1',
  'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
  'created': Date.now(),
  'vid_list': ['1', '2', '3', '4'],
};

_via_dp[0]['store']['config'] = {
  'file': {
    'loc_prefix': { '1':'',
                    '2':'',
                    '3':'file:///data/datasets/via/via-3.x.y/img_pair_annotation/PairwiseStenosis20190507/images/',
                    '4':'' }, // constants defined in _via_file._VIA_FILE_LOC
  },

  'ui': {
    'file_content_align':'center',
    'file_metadata_editor_visible':true,
    'spatial_metadata_editor_visible':true,
    'spatial_region_label_attribute_id':'',
  },
};

_via_dp[0]['store']['attribute'] = {
  "1": {
    "aname": "spinal_stenosis",
    "anchor_id": "FILEN_Z0_XY0",
    "type": 3,
    "desc": "Overall, which image shows more spinal stenosis?",
    "options": {
      "0": "Image 1",
      "1": "Not Sure",
      "2": "Image 2"
    },
    "default_option_id": ""
  },
  "2": {
    "aname": "bony_spinal_stenosis",
    "anchor_id": "FILEN_Z0_XY0",
    "type": 3,
    "desc": "Which image shows more 'bony' spinal stenosis?",
    "options": {
      "0": "Image 1",
      "1": "Not Sure",
      "2": "Image 2"
    },
    "default_option_id": ""
  },
  "3": {
    "aname": "thecal_dural_spinal_stenosis",
    "anchor_id": "FILEN_Z0_XY0",
    "type": 3,
    "desc": "Which image shows more 'thecal sac/dural sac' spinal stenosis?",
    "options": {
      "0": "Image 1",
      "1": "Not Sure",
      "2": "Image 2"
    },
    "default_option_id": ""
  },
};

_via_dp[0]['store']['file'] = {
  "1": {
    "fid": 1,
    "fname": "0-G00007-D20100825-T2-L5S1.png",
    "type": 2,
    "loc": 3,
    "src": "0-G00007-D20100825-T2-L5S1.png"
  },
  "2": {
    "fid": 2,
    "fname": "0-G00067-D20101126-T2-L5S1.png",
    "type": 2,
    "loc": 3,
    "src": "0-G00067-D20101126-T2-L5S1.png"
  },
  "3": {
    "fid": 3,
    "fname": "0-G00187-D20110903-T2-L1L2.png",
    "type": 2,
    "loc": 3,
    "src": "0-G00187-D20110903-T2-L1L2.png"
  },
  "4": {
    "fid": 4,
    "fname": "1-SC1521-D20151211-T2-L5S1.png",
    "type": 2,
    "loc": 3,
    "src": "1-SC1521-D20151211-T2-L5S1.png"
  },
};

_via_dp[0]['store']['view'] = {
  "1": {
    "fid_list": [
      1,
      2
    ]
  },
  "2": {
    "fid_list": [
      1,
      3
    ]
  },
  "3": {
    "fid_list": [
      2,
      3
    ]
  },
  "4": {
    "fid_list": [
      1,
      4
    ]
  },
  '5': {
    'fid_list': [1],
  },
  '6': {
    'fid_list': [2],
  },
  '7': {
    'fid_list': [3],
  },
  '8': {
    'fid_list': [4],
  },
};
_via_dp[0]['store']['metadata'] = {

  '+mHHT-tg': {
    'vid': '2',
    'flg': 0,
    'z': [],
    'xy': [],
    'av': {
      '1':'0',
      '3':'2',
    },
  },
  'ed+wsOZZ': {
    'vid': '3',
    'flg': 0,
    'z': [],
    'xy': [],
    'av': {},
  },
};
