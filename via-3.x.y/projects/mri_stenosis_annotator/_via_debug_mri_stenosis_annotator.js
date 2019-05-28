var _via_dp = []; // debug project

//
// Image Pair Annotation: MRI Stenosis
//
_via_dp[0] = {};
_via_dp[0]['store'] = {};
_via_dp[0]['store']['project'] = {
  'pid':     'via-98785efcfcd44b3cb11a76838b56ac14',
  'pname':   'MRI Stenosis',
  'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
  'created': Date.now(),
  'data_format_version': '3.1.0',
};
_via_dp[0]['store']['config'] = {
  'file': {
    'path':'/data/datasets/via/via-3.x.y/img_pair_annotation/PairwiseStenosis20190507/images/',
  },
  'ui': {
    'file_content_align':'center'
  }
};
_via_dp[0]['store']['attribute'] = {
  "1": {
    "aname": "structural_central_canal_stenosis",
    "anchor_id": "FILEN_Z0_XY0",
    "type": 3,
    "desc": "Of the above two images, which has more structural central canal stenosis?",
    "options": {
      "0": "Image 1",
      "1": "Not Sure",
      "2": "Image 2"
    },
    "default_option_id": ""
  },
  "2": {
    "aname": "soft_tissue_encroachment",
    "anchor_id": "FILEN_Z0_XY0",
    "type": 3,
    "desc": "Of the above two images, which has more soft tissue encroachment (disc herniation and/or synovial cyst)?",
    "options": {
      "0": "Image 1",
      "1": "Not Sure",
      "2": "Image 2"
    },
    "default_option_id": ""
  },
  "3": {
    "aname": "crowding_cauda_equina_rootlets",
    "anchor_id": "FILEN_Z0_XY0",
    "type": 3,
    "desc": "Of the above two images, which has more crowding of cauda equina rootlets?",
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
    "fname": "0-SC0001-D20140108-T2-L5S1.png",
    "type": 2,
    "loc": 1,
    "src": "0-SC0001-D20140108-T2-L5S1.png"
  },
  "2": {
    "fid": 2,
    "fname": "0-SC1692-D20090204-T2-L5S1.png",
    "type": 2,
    "loc": 1,
    "src": "0-SC1692-D20090204-T2-L5S1.png"
  },
  "3": {
    "fid": 3,
    "fname": "1-SC1417-D20150411-T2-L5S1.png",
    "type": 2,
    "loc": 1,
    "src": "1-SC1417-D20150411-T2-L5S1.png"
  },
  "4": {
    "fid": 4,
    "fname": "1-SC1521-D20151211-T2-L5S1.png",
    "type": 2,
    "loc": 1,
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
_via_dp[0]['store']['vid_list'] = ['1', '2', '3', '4'];
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
