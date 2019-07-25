var _via_dp = []; // debug project

//
// speaker diarisation : wikimedia video interview
//
_via_dp[0] = {};
_via_dp[0]['store'] = {};
_via_dp[0]['store']['project'] = {
  'pid':     'via063e89ef22e548dd92d781fa9f9d089b',
  'pname':   'VIA Debug Project',
  'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
  'created': Date.now(),
  'data_format_version': '3.1.0',
};
_via_dp[0]['store']['config'] = {
  'file': {
    'path':'/data/datasets/via/via-3.x.y/speaker_diarisation/',
  },
  'ui': {
    'file_content_align':'center'
  }
};
_via_dp[0]['store']['attribute'] = {
  '1': {
    'aname':'speaker-id',
    'anchor_id':'FILE1_Z2_XY0',
    'type':1,
    'desc':'Name of the speaker',
    'options':{},
    'default_option_id':'',
  },
  '2': {
    'aname':'name',
    'anchor_id':'FILE1_Z0_XY1',
    'type':4,
    'desc':'Name of Object in Video Frame',
    'options':{
      '1':'cat',
      '2':'dog',
      '3':'apple',
    },
    'default_option_id':'2',
  },
};
_via_dp[0]['store']['file'] = {
  '1':{
    'fid':1,
    'fname':'Wikimedia_Interview_Romaine.mp4',
    'type':4,
    'loc':1,
    'src':'Wikimedia_Interview_Romaine.mp4',
  },
  '2':{
    'fid':2,
    'fname':'Wikimedia_HelenHillInterview.mp4',
    'type':4,
    'loc':1,
    'src':'Wikimedia_HelenHillInterview.mp4',
  },
  '3':{
    'fid':3,
    'fname':'Wikimedia_Chomsky_On_Obama_budget.mp4',
    'type':4,
    'loc':1,
    'src':'Wikimedia_Chomsky_On_Obama_budget.mp4',
  },
  '4':{
    'fid':4,
    'fname':'Wikimedia_Anne_Gaylor_A_Second_Look_At_Religion.mp4',
    'type':4,
    'loc':1,
    'src':'Wikimedia_Anne_Gaylor_A_Second_Look_At_Religion.mp4',
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
  '4': {
    'fid_list':[4],
  },
};

_via_dp[0]['store']['vid_list'] = ['1','2','3','4'];
_via_dp[0]['store']['metadata'] = {
  '-glfwaaX': {
    'vid': '1',
    'flg': 0,
    'z': [1.343, 10.592],
    'xy': [],
    'av': {
      '1':'spk1'
    }
  },
  '+mHHT-tg': {
    'vid': '1',
    'flg': 0,
    'z': [12.413, 20.592],
    'xy': [],
    'av': {
      '1':'spk1'
    }
  },
  'ed+wsOZZ': {
    'vid': '1',
    'flg': 0,
    'z': [22.872, 24.946],
    'xy': [],
    'av': {
      '1':'spk2'
    }
  },
  'mxCVj1qz': {
    'vid': '1',
    'flg': 0,
    'z': [25.215, 29.132],
    'xy': [],
    'av': {
      '1':'spk2'
    }
  },
'kHRoMie1': {
    'vid': '1',
    'flg': 0,
    'z': [1.564, 5.852],
    'xy': [],
    'av': {
      '1':'spk3'
    }
  },
  'QhKrsZlV': {
    'vid': '1',
    'flg': 0,
    'z': [11.294, 22.217],
    'xy': [],
    'av': {
      '1':'spk4'
    }
  },
  'uzhWgk75': {
    'vid': '1',
    'flg': 0,
    'z': [16.861, 28.410],
    'xy': [],
    'av': {
      '1':'spk5'
    }
  },
  'mZqTKmHy': {
    'vid': '1',
    'flg': 0,
    'z': [1.311, 7.402],
    'xy': [],
    'av': {
      '1':'spk6'
    }
  },
  '6wu+scg2': {
    'vid': '1',
    'flg': 0,
    'z': [17.918, 29.482],
    'xy': [],
    'av': {
      '1':'spk6'
    }
  },
  'HLO-6liP': {
    'vid': '1',
    'flg': 0,
    'z': [9.418, 14.602],
    'xy': [],
    'av': {
      '1':'spk6'
    }
  },
};

//
// speaker diarisation : Drone on final at LAX 	(PRFlyer, atclive)
// source: https://forums.liveatc.net/index.php?action=dlattach;topic=15046.0;attach=10186
// date: 2018-12-28 22:43:56
_via_dp[1] = {};
_via_dp[1]['store'] = {};
_via_dp[1]['store']['project'] = {
  'pid':     'viab4e012ae255940029e48622064a57e0a',
  'pname':   'Audio Annotation',
  'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
  'created': Date.now(),
  'data_format_version': '3.1.0',
};
_via_dp[1]['store']['config'] = {
  'file': {
    'path':'/data/datasets/via/via-3.x.y/speaker_diarisation/',
  },
  'ui': {
    'file_content_align':'center'
  }
};
_via_dp[1]['store']['attribute'] = {
  '1': {
    'aname':'Speaker',
    'anchor_id':'FILE1_Z2_XY0',
    'type':1,
    'desc':'Speaker',
    'options':{},
    'default_option_id':'',
  },
  '2': {
    'aname':'transcription',
    'anchor_id':'FILE1_Z2_XY0',
    'type':1,
    'desc':'Manual Transcription of Audio Conversation',
    'options':{},
    'default_option_id':'',
  },
  '3': {
    'aname':'is_audio_clear',
    'anchor_id':'FILE1_Z2_XY0',
    'type':3,
    'desc':'Is the audio conversation clear to understand?',
    'options':{
      '0':'No',
      '1':'Yes',
    },
    'default_option_id':'1',
  },
};
_via_dp[1]['store']['file'] = {
  '1':{
    'fid':1,
    'fname':'Drone_liveatc_PRFlyer.mp3',
    'type':8,
    'loc':1,
    'src':'Drone_liveatc_PRFlyer.mp3',
  },
  '2':{
    'fid':2,
    'fname':'https://upload.wikimedia.org/wikipedia/commons/c/ce/Interview_Debora_Weber-Wulff_2.oga',
    'type':8,
    'loc':2,
    'src':'https://upload.wikimedia.org/wikipedia/commons/c/ce/Interview_Debora_Weber-Wulff_2.oga',
  },
  '3':{
    'fid':3,
    'fname':'The_ENIAC_Programmers_%28As_Told_By_U.S._Chief_Technology_Officer_Megan_Smith%29.ogg',
    'type':8,
    'loc':2,
    'src':'https://upload.wikimedia.org/wikipedia/commons/1/15/The_ENIAC_Programmers_%28As_Told_By_U.S._Chief_Technology_Officer_Megan_Smith%29.ogg',
  },
  '4':{
    'fid':4,
    'fname':'Calibration.ogg',
    'type':8,
    'loc':2,
    'src':'https://upload.wikimedia.org/wikipedia/commons/8/81/Heart_Monitor_Beep--freesound.org.oga',
  },

};

_via_dp[1]['store']['view'] = {
  '1': {
    'fid_list':[1],
  },
  '2': {
    'fid_list':[2],
  },
  '3': {
    'fid_list':[3],
  },
  '4': {
    'fid_list':[4],
  },
};

_via_dp[1]['store']['vid_list'] = ['1', '2', '3', '4'];
_via_dp[1]['store']['metadata'] = {
  '-glfwaaX': {
    'vid': '1',
    'flg': 0,
    'z': [0, 5.5],
    'xy': [],
    'av': {
      '1':'Pilot',
      '2':'?',
      '3':'0',
    }
  },
  '+mHHT-tg': {
    'vid': '1',
    'flg': 0,
    'z': [6.0, 11.0],
    'xy': [],
    'av': {
      '1':'ATC',
      '2':'Clear to land',
      '3':'1',
    }
  },
  'ed+wsOZZ': {
    'vid': '1',
    'flg': 0,
    'z': [11.0, 18.0],
    'xy': [],
    'av': {
      '1':'Pilot',
      '2':'Tower to PNR 102 ?',
      '3':'0',
    }
  },
  'mxCVj1qz': {
    'vid': '1',
    'flg': 0,
    'z': [18.0, 18.9],
    'xy': [],
    'av': {
      '1':'ATC',
      '2':'?',
      '3':'0',
    }
  },
'kHRoMie1': {
    'vid': '1',
    'flg': 0,
    'z': [19.0, 30.0],
    'xy': [],
    'av': {
      '1':'Pilot',
      '2':'we have a drone on our right approximately ?',
      '3':'1',
    }
  },
  'QhKrsZlV': {
    'vid': '1',
    'flg': 0,
    'z': [32.0, 38.0],
    'xy': [],
    'av': {
      '1':'ATC',
      '2':'? do you have a colour and type',
      '3':'1',
    }
  },
  'uzhWgk75': {
    'vid': '1',
    'flg': 0,
    'z': [38.0, 40.0],
    'xy': [],
    'av': {
      '1':'Pilot',
      '2':'its dark green',
      '3':'1',
    }
  },
  "2_Z+LXp1s8": {
    "vid": "2",
    "flg": 0,
    "z": [
      0,
      1.183
    ],
    "xy": [],
    "av": {
      "1": "Interviewer"
    }
  },
  "2_AG1+bmSA": {
    "vid": "2",
    "flg": 0,
    "z": [
      1.137,
      2.436121
    ],
    "xy": [],
    "av": {
      "1": "Prof. Debora"
    }
  },
  "2_S5L7szM-": {
    "vid": "2",
    "flg": 0,
    "z": [
      2.436,
      3.816733
    ],
    "xy": [],
    "av": {
      "1": "Interviewer"
    }
  },
  "2_cMYHLELJ": {
    "vid": "2",
    "flg": 0,
    "z": [
      4.017,
      5.624805
    ],
    "xy": [],
    "av": {
      "1": "Prof. Debora"
    }
  },
  "2_DaiuIloC": {
    "vid": "2",
    "flg": 0,
    "z": [
      5.921,
      15.101221
    ],
    "xy": [],
    "av": {
      "1": "Interviewer"
    }
  },
  "2_zp-ru14v": {
    "vid": "2",
    "flg": 0,
    "z": [
      15.101,
      41.008681
    ],
    "xy": [],
    "av": {
      "1": "Prof. Debora"
    }
  },
  "2_dIFoc30m": {
    "vid": "2",
    "flg": 0,
    "z": [
      41.147,
      62.644961
    ],
    "xy": [],
    "av": {
      "1": "Interviewer"
    }
  },
  "3_Xp-au12v": {
    "vid": "3",
    "flg": 0,
    "z": [
      2.101,
      6.008681
    ],
    "xy": [],
    "av": {
      "1": "A"
    }
  },
  "3_sIxEc10m": {
    "vid": "3",
    "flg": 0,
    "z": [
      16.147,
      27.644961
    ],
    "xy": [],
    "av": {
      "1": "B"
    }
  },
};

//
// human activity
// source: https://commons.wikimedia.org/wiki/File:Alioli.ogv

_via_dp[2] = {};
_via_dp[2]['store'] = {};
_via_dp[2]['store']['project'] = {
  'pid':     'via81d7a76a8f1d4119abd4766150cdb417',
  'pname':   'Video Annotation Project',
  'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
  'created': Date.now(),
  'data_format_version': '3.1.0',
};
_via_dp[2]['store']['config'] = {
  'file': {
    'path':'/data/datasets/via/via-3.x.y/activity/',
  },
  'ui': {
    'file_content_align':'center'
  }
};
_via_dp[2]['store']['attribute'] = {
  '1': {
    'aname':'Activity',
    'anchor_id':'FILE1_Z2_XY0',
    'type':1,
    'desc':'Activity',
    'options':{},
    'default_option_id':'',
  },
  '5': {
    'aname':'Activity2',
    'anchor_id':'FILE1_Z2_XY0',
    'type':1,
    'desc':'Activity2',
    'options':{},
    'default_option_id':'',
  },
  '2': {
    'aname':'Object',
    'anchor_id':'FILE1_Z1_XY1',
    'type':4,
    'desc':'Name of Object',
    'options':{
      '1':'Egg',
      '2':'Bottle',
      '3':'Mixer',
      '4':'Cup',
      '5':'Garlic',
      '6':'Knife',
      '7':'Tea Bag',
    },
    'default_option_id':'',
  },
  '3': {
    'aname':'Type',
    'anchor_id':'FILE1_Z1_XY1',
    'type':3,
    'desc':'Type of Object',
    'options':{
      '1':'Ingredient',
      '2':'Tool',
      '3':'Unknown',
    },
    'default_option_id':'3',
  },
};
_via_dp[2]['store']['file'] = {
  '1':{
    'fid':1,
    'fname':'Alioli_Wikimedia_Wardtmar.mp4',
    'type':4,
    'loc':1,
    'src':'Alioli_Wikimedia_Wardtmar.mp4',
  },
  '2':{
    'fid':2,
    'fname':'PreparingTea.mp4',
    'type':4,
    'loc':1,
    'src':'PreparingTea.mp4',
  },
  '3':{
    'fid':3,
    'fname':'Tea.mp4',
    'type':4,
    'loc':1,
    'src':'PreparingTea.mp4',
  },
};

_via_dp[2]['store']['view'] = {
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

_via_dp[2]['store']['vid_list'] = ['1', '2', '3'];
_via_dp[2]['store']['metadata'] = {
  '-glfwaaX': {
    'vid': '1',
    'flg': 0,
    'z': [2, 6.5],
    'xy': [],
    'av': {
      '1':'1. break egg',
    }
  },
  '+mHHT-tg': {
    'vid': '1',
    'flg': 0,
    'z': [9, 20],
    'xy': [],
    'av': {
      '1':'2. pour liquid',
    }
  },
  'ed+wsOZZ': {
    'vid': '1',
    'flg': 0,
    'z': [24, 26],
    'xy': [],
    'av': {
      '1':'2. pour liquid',
    }
  },
  'mxCVj1qz': {
    'vid': '1',
    'flg': 0,
    'z': [32, 63],
    'xy': [],
    'av': {
      '1':'3. cut garlic',
    }
  },
  'kHRoMie1': {
    'vid': '1',
    'flg': 0,
    'z': [64, 128],
    'xy': [],
    'av': {
      '1':'4. mix',
    }
  },
  'fH-oMre1': {
    'vid': '1',
    'flg': 0,
    'z': [0.917],
    'xy': [4, 263, 184, 17, 13],
    'av': {
      '2':'1',
      '3':'1',
    }
  },
  'vPao-re8': {
    'vid': '1',
    'flg': 0,
    'z': [0.917],
    'xy': [2, 343, 730, 60, 160],
    'av': {
      '2':'2',
      '3':'1',
    }
  },
  'x-PoM9ea': {
    'vid': '1',
    'flg': 0,
    'z': [0.917],
    'xy': [7, 225, 133, 177, 177, 195, 188, 246, 138],
    'av': {
      '2':'6',
      '3':'2',
    }
  },
  'mR8ks-Aa': {
    'vid': '1',
    'flg': 0,
    'z': [7.208],
    'xy': [4, 328, 110, 25, 21],
    'av': {
      '2':'1',
      '3':'1',
    }
  },
  'Yh7Klow6': {
    'vid': '1',
    'flg': 0,
    'z': [21.52],
    'xy': [2, 315, 52, 80, 155],
    'av': {
      '2':'2',
      '3':'1',
    }
  },
  'A7jfx8PX': {
    'vid': '2',
    'flg': 0,
    'z': [3, 8],
    'xy': [],
    'av': {
      '1':'1. Add water',
    }
  },
  'M8kl0+Xe': {
    'vid': '2',
    'flg': 0,
    'z': [16, 28],
    'xy': [],
    'av': {
      '1':'2. Warm water',
    }
  },
  'yp-X6Hjy': {
    'vid': '2',
    'flg': 0,
    'z': [35, 39],
    'xy': [],
    'av': {
      '1':'3. Add tea bag',
    }
  },
  'jU4+xekA': {
    'vid': '2',
    'flg': 0,
    'z': [35],
    'xy': [2, 265, 124, 92, 120],
    'av': {
      '2':'7',
      '3':'1',
    }
  },
  'Hycx5-Sa': {
    'vid': '2',
    'flg': 0,
    'z': [0.75],
    'xy': [2, 144, 132, 150, 138],
    'av': {
      '2':'4',
      '3':'2',
    }
  },
};

//
// Image Pair Annotation: MRI Stenosis
//
_via_dp[3] = {};
_via_dp[3]['store'] = {};
_via_dp[3]['store']['project'] = {
  'pid':     'via-98785efcfcd44b3cb11a76838b56ac14',
  'pname':   'MRI Stenosis',
  'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
  'created': Date.now(),
  'data_format_version': '3.1.0',
};
_via_dp[3]['store']['config'] = {
  'file': {
    'path':'/data/datasets/via/via-3.x.y/img_pair_annotation/Images/',
  },
  'ui': {
    'file_content_align':'center'
  }
};
_via_dp[3]['store']['attribute'] = {
  '1': {
    'aname': 'central_canal_stenosis',
    'anchor_id':'FILEN_Z0_XY0',
    'type': 3,
    'desc': 'Of the above two images, which has more central canval stenosis?',
    'options': {
      '0': 'Image 1',
      '1': 'Not Sure',
      '2': 'Image 2',
    },
    'default_option_id': '',
  },
};

_via_dp[3]['store']['file'] = {
  '1': {
    'fid': 1,
    'fname': 'Normal-SC0917-L3_L4-D20150420.png',
    'type': 1,
    'loc': 1,
    'src': 'Normal-SC0917-L3_L4-D20150420.png',
  },
  '2': {
    'fid': 2,
    'fname': 'Normal-SC0904-L4_L5-D20090327.png',
    'type': 1,
    'loc': 1,
    'src': 'Normal-SC0904-L4_L5-D20090327.png',
  },
  '3': {
    'fid': 3,
    'fname': 'Normal-SC1111-L4_L5-D20090402.png',
    'type': 1,
    'loc': 1,
    'src': 'Normal-SC1111-L4_L5-D20090402.png',
  },
  '4': {
    'fid': 4,
    'fname': 'Normal-SC1674-L2_L3-D20110913.png',
    'type': 1,
    'loc': 1,
    'src': 'Normal-SC1674-L2_L3-D20110913.png',
  },
  '5': {
    'fid': 5,
    'fname': 'Normal-SC1284-L4_L5-D20080131.png',
    'type': 1,
    'loc': 1,
    'src': 'Normal-SC1284-L4_L5-D20080131.png',
  }
};

_via_dp[3]['store']['view'] = {
  '1': {
    'fid_list': [
      1,
      2,
    ]
  },
  '2': {
    'fid_list': [
      1,
      3
    ]
  },
  '3': {
    'fid_list': [
      1,
      4,
    ]
  },
  '4': {
    'fid_list': [
      1,
      5,
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
  '9': {
    'fid_list': [5],
  },

};
_via_dp[3]['store']['vid_list'] = ['1', '2', '3', '4'];
_via_dp[3]['store']['metadata'] = {};
