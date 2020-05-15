var _via_dp = []; // debug project

//
// speaker diarisation : wikimedia video interview
//
_via_dp[0] = {};
_via_dp[0]['store'] = {};
_via_dp[0]['store']['project'] = {
  'pid': '__VIA_PROJECT_ID__',
  'rev': '__VIA_PROJECT_REV_ID__',
  'rev_timestamp': '__VIA_PROJECT_REV_TIMESTAMP__',
  'pname': 'Scholiosis Annotation Project',
  'data_format_version': '3.1.1',
  'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
  'created': Date.now(),
  'vid_list': [],
};
_via_dp[0]['store']['config'] = {
  'file': {
    'loc_prefix': {
      '1':'',
      '2':'',
      '3':'/home/tlm/data/scoliosis/ukbiobankdxa/apr2020/images/',
      '4':'',
    },
  },
  'ui': {
    'file_content_align':'center'
  }
};
_via_dp[0]['store']['attribute'] = {
  "1": {
    "aname": "Artefact affecting spine",
    "anchor_id": "FILE1_Z0_XY0",
    "type": 3,
    "desc": "",
    "options": {
      "0": "No",
      "1": "Yes but spine measured",
      "2": "Yes and spine not measured"
    },
    "default_option_id": "0"
  },
  "2": {
    "aname": "Is the spine straight?",
    "anchor_id": "FILE1_Z0_XY0",
    "type": 3,
    "desc": "",
    "options": {
      "0": "No",
      "1": "Yes"
    },
    "default_option_id": "1"
  },
  "3": {
    "aname": "Is there clear positioning error?",
    "anchor_id": "FILE1_Z0_XY0",
    "type": 3,
    "desc": "",
    "options": {
      "0": "No",
      "1": "Yes"
    },
    "default_option_id": "0"
  },
  "4": {
    "aname": "Do I think this person has scoliosis?",
    "anchor_id": "FILE1_Z0_XY0",
    "type": 3,
    "desc": "",
    "options": {
      "0": "No",
      "1": "Yes"
    },
    "default_option_id": "0"
  },
  "5": {
    "aname": "I need help",
    "anchor_id": "FILE1_Z0_XY0",
    "type": 2,
    "desc": "",
    "options": {
      "1": "Yes"
    },
    "default_option_id": ""
  },
  "6": {
    "aname": "Here you can add free text notes",
    "anchor_id": "FILE1_Z0_XY0",
    "type": 1,
    "desc": "",
    "options": {},
    "default_option_id": ""
  },
  "7": {
    "aname": "Number of curves",
    "anchor_id": "FILE1_Z0_XY0",
    "type": 3,
    "desc": "",
    "options": {
      "0": "0",
      "1": "1",
      "2": "2"
    },
    "default_option_id": "0"
  },
  "8": {
    "aname": "Curve 1 (largest curve): direction",
    "anchor_id": "FILE1_Z0_XY0",
    "type": 2,
    "desc": "",
    "options": {
      "0": "right",
      "1": "left"
    },
    "default_option_id": ""
  },
  "9": {
    "aname": "Curve 1 (largest curve)",
    "anchor_id": "FILE1_Z0_XY0",
    "type": 2,
    "desc": "",
    "options": {
      "0": "cervical (apex at C1-C6/7)",
      "1": "cervico-thoracic (apex at C7, T1)",
      "2": "thoracic (apex at T2-T11)",
      "3": "thoracolumbar (apex at T12-L1)",
      "4": "lumbar (apex at L1/2-L4)",
      "5": "lumbrosacral (apex at or below L5)"
    },
    "default_option_id": ""
  },
  "10": {
    "aname": "Angle of spine line (Normal Spine Line)",
    "anchor_id": "FILE1_Z0_XY0",
    "type": 1,
    "desc": "",
    "options": {},
    "default_option_id": ""
  }
};

_via_dp[0]['store']['file'] = {
  "0": {
    "fid": 0,
    "fname": "8jpy4o4icz.png",
    "type": 2,
    "loc": 3,
    "src": "8jpy4o4icz.png"
  },
  "1": {
    "fid": 1,
    "fname": "q5zzip4icz.png",
    "type": 2,
    "loc": 3,
    "src": "q5zzip4icz.png"
  },
  "2": {
    "fid": 2,
    "fname": "z7ikjo4icz.png",
    "type": 2,
    "loc": 3,
    "src": "z7ikjo4icz.png"
  },
  "3": {
    "fid": 3,
    "fname": "9zvi7o4icz.png",
    "type": 2,
    "loc": 3,
    "src": "9zvi7o4icz.png"
  },
};

_via_dp[0]['store']['view'] = {
  '1': {
    'fid_list':[1],
  },
  '2': {
    'fid_list':[2],
  },
  '3': {
    'fid_list':[3],
  },
};

_via_dp[0]['store']['project']['vid_list'] = ['1','2','3'];
_via_dp[0]['store']['metadata'] = {};
_via_dp[0]['store']['metadata']["1_U3XO8pmL"] = {
  "vid": "1",
  "flg": 0,
  "z": [],
  "xy": [
    51,
    143.82,
    161.003,
    142.172,
    412.865,
    76.029,
    173.008,
    210.434,
    176.539,
    90.858,
    361.08,
    191.368,
    359.668,
    144.055,
    231.854,
    142.408,
    336.6,
    135.346,
    294.937
  ],
  "av": {}
};
