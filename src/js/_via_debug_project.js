var _via_dp = []; // debug project

//
// speaker diarisation : wikimedia video interview
//
_via_dp[0] = {};
_via_dp[0]['store'] = {};
_via_dp[0]['store']['project'] = {
  'pid':     'via-98785efcfcd44b3cb11a76838b56ac14',
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
    'type':2,
    'loc':1,
    'src':'Wikimedia_Interview_Romaine.mp4',
  },
  '2':{
    'fid':2,
    'fname':'Wikimedia_HelenHillInterview.mp4',
    'type':2,
    'loc':1,
    'src':'Wikimedia_HelenHillInterview.mp4',
  },
  '3':{
    'fid':3,
    'fname':'Wikimedia_Chomsky_On_Obama_budget.mp4',
    'type':2,
    'loc':1,
    'src':'Wikimedia_Chomsky_On_Obama_budget.mp4',
  },
  '4':{
    'fid':4,
    'fname':'Wikimedia_Anne_Gaylor_A_Second_Look_At_Religion.mp4',
    'type':2,
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
  'pid':     'via-98785efcfcd44b3cb11a76838b56ac14',
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
    'type':3,
    'loc':1,
    'src':'Drone_liveatc_PRFlyer.mp3',
  },
};

_via_dp[1]['store']['view'] = {
  '1': {
    'fid_list':[1],
  },
};

_via_dp[1]['store']['vid_list'] = ['1'];
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
};

//
// human activity
// source: https://commons.wikimedia.org/wiki/File:Alioli.ogv

_via_dp[2] = {};
_via_dp[2]['store'] = {};
_via_dp[2]['store']['project'] = {
  'pid':     'via-98785efcfcd44b3cb11a76838b56ac14',
  'pname':   'Video Annotation',
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
  '2': {
    'aname':'Object',
    'anchor_id':'FILE1_Z1_XY1',
    'type':4,
    'desc':'Name of Object',
    'options':{
      'egg':'Egg',
      'bottle':'Bottle',
      'mixer':'Mixer',
      'cup':'Cup',
      'garlic':'Garlic',
    },
    'default_option_id':'',
  },
  '3': {
    'aname':'Type',
    'anchor_id':'FILE1_Z1_XY1',
    'type':3,
    'desc':'Type of Object',
    'options':{
      'ingredient':'Ingredient',
      'tool':'Tool',
      'unknown':'Unknown',
    },
    'default_option_id':'unknown',
  },
  '4': {
    'aname':'Processing',
    'anchor_id':'FILE1_Z1_XY1',
    'type':2,
    'desc':'Processing Required',
    'options':{
      'track':'Track',
      'classify':'Classify',
      'segment':'Segment',
    },
    'default_option_id':'unknown',
  },
};
_via_dp[2]['store']['file'] = {
  '1':{
    'fid':1,
    'fname':'Alioli_Wikimedia_Wardtmar.mp4',
    'type':2,
    'loc':1,
    'src':'Alioli_Wikimedia_Wardtmar.mp4',
  },
};

_via_dp[2]['store']['view'] = {
  '1': {
    'fid_list':[1],
  },
};

_via_dp[2]['store']['vid_list'] = ['1'];
_via_dp[2]['store']['metadata'] = {
  '-glfwaaX': {
    'vid': '1',
    'flg': 0,
    'z': [2, 4],
    'xy': [],
    'av': {
      '1':'1. break egg',
    }
  },
  '+mHHT-tg': {
    'vid': '1',
    'flg': 0,
    'z': [8, 10],
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
