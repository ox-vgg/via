/**
 *
 * @class
 * @classdesc Demo of audio annotator
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 16 May 2019
 *
 * Audio 1
 * Audio title: Drone on final at LAX
 * Audio filename: Drone_liveatc_PRFlyer.mp3
 * Audio author: PRFlyer at https://www.liveatc.net
 * Audio source: https://forums.liveatc.net/index.php?action=dlattach;topic=15046.0;attach=10186
 * Audio date: 2018-12-28 22:43:56
 *
 * Audio 2
 * Audio source: https://commons.wikimedia.org/wiki/File:Interview_Debora_Weber-Wulff_2.oga
 */

function _via_load_submodules() {
  console.log('Loading audio annotator demo');
  _via_demo_project = { 'store':{} };
  _via_demo_project['store']['project'] = {
    'pid': '__VIA_PROJECT_ID__',
    'rev': '__VIA_PROJECT_REV_ID__',
    'rev_timestamp': '__VIA_PROJECT_REV_TIMESTAMP__',
    'pname': 'Demo Audio Annotation',
    'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
    'created': Date.now(),
    'data_format_version': '3.1.1',
    'vid_list':['1', '2'],
  };
  _via_demo_project['store']['config'] = {
    'file': {
      'loc_prefix': { '1':'', '2':'', '3':'', '4':'' }, // constants defined in _via_file._VIA_FILE_LOC
    },
    'ui': {
      'file_content_align':'center'
    }
  };
  _via_demo_project['store']['attribute'] = {
    '1': {
      'aname':'Speaker',
      'anchor_id':'FILE1_Z2_XY0',
      'type':1,
      'desc':'Speaker',
      'options':{},
      'default_option_id':'',
    },
  };
  _via_demo_project['store']['file'] = {
    '1':{
      'fid':1,
      'fname':_via_demo_data['audio'][0]['filename'],
      'type':8,
      'loc':4,
      'src':_via_demo_data['audio'][0]['src'],
    },
    '2':{
      'fid':2,
      'fname':'https://upload.wikimedia.org/wikipedia/commons/c/ce/Interview_Debora_Weber-Wulff_2.oga',
      'type':8,
      'loc':2,
      'src':'https://upload.wikimedia.org/wikipedia/commons/c/ce/Interview_Debora_Weber-Wulff_2.oga',
    },
  };

  _via_demo_project['store']['view'] = {
    '1': {
      'fid_list':[1],
    },
    '2': {
      'fid_list':[2],
    },
  };

  _via_demo_project['store']['metadata'] = {
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
  };
  this.d.store = _via_demo_project['store'];
  this.d._cache_update();
  this.vm._init();

  setTimeout( function() {
    this.va.view_show('1');
    if ( this.s ) {
      this.s._disable_share();
    }
    //this.editor.show();
  }.bind(this), 500);
}
