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
  'pname':   'VIA Debug Project',
  'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
  'created': Date.now(),
  'data_format_version': '3.1.0',
};
_via_dp[0]['store']['config'] = {
  'file': {
    'loc_prefix': {
      '1':'/data/datasets/via/via-3.x.y/speaker_diarisation/',
      '2':'',
      '3':'',
      '4':'',
    },
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
  'pid': '__VIA_PROJECT_ID__',
  'rev': '__VIA_PROJECT_REV_ID__',
  'rev_timestamp': '__VIA_PROJECT_REV_TIMESTAMP__',
  'pname':   'Audio Annotation',
  'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
  'created': Date.now(),
  'data_format_version': '3.1.1',
  'vid_list': ['1', '2', '3', '4'],
};

_via_dp[1]['store']['config'] = {
  'file': {
    'loc_prefix': {
      '1':'',
      '2':'',
      '3':'file:///home/tlm/code/via3/via/via-3.x.y/data/sample_audio/',
      '4':'',
    },
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
    'loc':3,
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
//  'pid': '__VIA_PROJECT_ID__',
//  'rev': '__VIA_PROJECT_REV_ID__',
  //  'rev_timestamp': '__VIA_PROJECT_REV_TIMESTAMP__',
  "pid":"71578187-3cd3-45d0-8198-7c441fbc06af",
  "rev":"1",
  "rev_timestamp":"1561373349251",
  'pname':   'Video Annotation Project',
  'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
  'created': Date.now(),
  'data_format_version': '3.1.1',
  'vid_list': ['1', '2', '3'],
};
_via_dp[2]['store']['config'] = {
  'file': {
    'loc_prefix': {
      '1':'',
      '2':'',
      '3':'file:///home/tlm/data/via/debug/',
      '4':'',
    },
  },
  'ui': {
    'file_content_align':'center'
  }
};
_via_dp[2]['store']['attribute'] = {
  '1': {
    'aname':'Activity',
    'anchor_id':'FILE1_Z2_XY0',
    'type':4,
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
    'default_option_id':'3'
  }
};
_via_dp[2]['store']['file'] = {
  '1':{
    'fid':1,
    'fname':'Alioli_Wikimedia_Wardtmar.mp4',
    'type':4,
    'loc':3,
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
    'z': [32, 44.3],
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
  'pid': '__VIA_PROJECT_ID__',
  'rev': '__VIA_PROJECT_REV_ID__',
  'rev_timestamp': '__VIA_PROJECT_REV_TIMESTAMP__',
  'pname': 'Demo Pair Annotation',
  'pdesc': 'Demonstration of annotation of an image pair',
  'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
  'created': Date.now(),
  'data_format_version': '3.1.1',
  'vid_list': ['1', '2', '3', '4'],
};
_via_dp[3]['store']['config'] = {
  'file': {
    'loc_prefix': {
      '1':'',
      '2':'https://upload.wikimedia.org/wikipedia/commons/thumb/',
      '3':'',
      '4':'',
    },
  },
  'ui': {
    'file_content_align':'center'
  }
};
_via_dp[3]['store']['attribute'] = {
  '1': {
    'aname':'beautiful',
    'anchor_id':'FILEN_Z0_XY0',
    'type':3,
    'desc':'In your opinion, which image is more beautiful?',
    'options':{
      '1': 'Image 1',
      '2': 'Image 2',
      '0': 'Not Sure',
    },
    'default_option_id':'',
  },
  '2': {
    'aname':'why',
    'anchor_id':'FILEN_Z0_XY0',
    'type':1,
    'desc':'In few words, explain your response',
    'options':{},
    'default_option_id':'',
  },
};

_via_dp[3]['store']['file'] = {
  '1':{
    'fid':1,
    'fname':'Red-billed oxpecker (Buphagus erythrorhynchus) on impala (Aepyceros melampus).jpg',
    'type':2,
    'loc':2,
    'src':'d/d5/Red-billed_oxpecker_(Buphagus_erythrorhynchus)_on_impala_(Aepyceros_melampus).jpg/320px-Red-billed_oxpecker_(Buphagus_erythrorhynchus)_on_impala_(Aepyceros_melampus).jpg',
  },
  '2':{
    'fid':2,
    'fname':'Balloon over Luxor - Egypt denoised.jpg',
    'type':2,
    'loc':2,
    'src':'4/41/Balloon_over_Luxor_-_Egypt_denoised.jpg/320px-Balloon_over_Luxor_-_Egypt_denoised.jpg',
  },
  '3':{
    'fid':3,
    'fname':'Castillo de Montuenga, Montuenga de Soria, Soria, España, 2017-05-23, DD 04.jpg',
    'type':2,
    'loc':2,
    'src':'d/d6/Castillo_de_Montuenga%2C_Montuenga_de_Soria%2C_Soria%2C_España%2C_2017-05-23%2C_DD_04.jpg/320px-Castillo_de_Montuenga%2C_Montuenga_de_Soria%2C_Soria%2C_España%2C_2017-05-23%2C_DD_04.jpg',
  },
  '4':{
    'fid':4,
    'fname':'Paradise shelduck portrait, New Zealand.jpg',
    'type':2,
    'loc':2,
    'src':'a/ad/Paradise_shelduck_portrait%2C_New_Zealand.jpg/320px-Paradise_shelduck_portrait%2C_New_Zealand.jpg',
  },
};

_via_dp[3]['store']['view'] = {
  '1': {
    'fid_list': [ 1, 2 ]
  },
  '2': {
    'fid_list': [ 3, 4 ]
  },
  '3': {
    'fid_list': [ 2, 3 ]
  },
  '4': {
    'fid_list': [ 1, 4 ]
  },
  // add a view for each file (needed when individual images are annotated)
  // these views are not visible as they are not present in ['project']['vid_list']
  '5': { 'fid_list': [1] },
  '6': { 'fid_list': [2] },
  '7': { 'fid_list': [3] },
  '8': { 'fid_list': [4] },
};
_via_dp[3]['store']['metadata'] = {};

//
// Image Annotations
//
_via_dp[4] = {};
_via_dp[4]['store'] = {};
_via_dp[4]['store']['project'] = {
  'pid': '__VIA_PROJECT_ID__',
  'rev': '__VIA_PROJECT_REV_ID__',
  'rev_timestamp': '__VIA_PROJECT_REV_TIMESTAMP__',
  'pname':   'Image Annotation',
  'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
  'created': Date.now(),
  'data_format_version': '3.1.1',
  'vid_list':['1', '2'],
};
_via_dp[4]['store']['config'] = {
  'file': {
    'loc_prefix': {
      '1':'',
      '2':'',
      '3':'../../data/sample_img/',
      '4':'',
    },
  },
  'ui': {
    'file_content_align':'center'
  }
};
_via_dp[4]['store']['attribute'] = {
  '1':{
    'aname':'name',
    'anchor_id':'FILE1_Z0_XY1',
    'type': 3,
    'desc': 'Name of Object',
    'options': {
      '0': 'Swan',
      '1': 'Human',
      '2': 'Unknown',
    },
    'default_option_id': ''
  },
  '2': {
    'aname':'Caption',
    'anchor_id':'FILE1_Z0_XY0',
    'type':3,
    'desc':'Image Caption',
    'options':{ '1':'a', '2':'b', '3':'c' },
    'default_option_id':'',
  },
};

_via_dp[4]['store']['file'] = {
  '1': {
    'fid': 1,
    'fname': 'adutta_swan.jpg',
    'type': 2,
    'loc': 3,
    'src': 'adutta_swan.jpg',
  },
  '2': {
    'fid': 2,
    'fname': 'wikimedia_death_of_socrates.jpg',
    'type': 2,
    'loc': 3,
    'src': 'wikimedia_death_of_socrates.jpg',
  },
};

_via_dp[4]['store']['view'] = {
  '1': {
    'fid_list': [
      1,
    ]
  },
  '2': {
    'fid_list': [
      2,
    ]
  },
};
_via_dp[4]['store']['metadata'] = {
  '1_rozl5hQT':{
    'vid':'1',
    'flg':0,
    'z':[],
    'xy':[2,104.553,119.393,319.056,154.469],
    'av':{
      '1':'0',
    },
  },
  '1_n8iiCJ6Y':{
    'vid':'1',
    'flg':0,
    'z':[],
    'xy':[],
    'av':{
      '2':'A white swan in Geneva lake.',
    },
  },
};
