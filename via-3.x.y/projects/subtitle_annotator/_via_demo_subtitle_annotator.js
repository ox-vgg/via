/**
 *
 * @class
 * @classdesc Demo of subtitle annotator
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 09 October 2020
 *
 * Video 1
 * Video source: https://commons.wikimedia.org/wiki/File:NASA-_60_Years_in_60_Seconds.webm
 */

function _via_load_submodules() {
  console.log('Loading subtitle annotator demo');
  _via_demo_project = { 'store':{} };
  _via_demo_project['store'] = {};
  _via_demo_project['store']['project'] = {
    'pid': '__VIA_PROJECT_ID__',
    'rev': '__VIA_PROJECT_REV_ID__',
    'rev_timestamp': '__VIA_PROJECT_REV_TIMESTAMP__',
    'pname': 'Demo Subtitle Annotation',
    'pdesc': 'Demo of subtitle annotator using public domain video taken from https://commons.wikimedia.org/wiki/File:NASA-_60_Years_in_60_Seconds.webm',
    'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
    'created': Date.now(),
    'data_format_version': '3.1.2',
    'vid_list':['1'],
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
      'aname':'subtitle',
      'anchor_id':'FILE1_Z2_XY0',
      'type':1,
      'desc':'Subtitle text',
      'options':{},
      'default_option_id':'',
    },
  };
  _via_demo_project['store']['file'] = {
    '1':{
      'fid':1,
      'fname':_via_demo_data['subtitle'][0]['filename'],
      'type':4,
      'loc':4,
      'src':_via_demo_data['subtitle'][0]['src'],
    },
  };

  _via_demo_project['store']['view'] = {
    '1': {
      'fid_list':[1],
    },
  };

  _via_demo_project['store']['metadata'] = {
    "1_nPnQRbyJ": {
      "vid": "1",
      "flg": 0,
      "z": [
        0.029,
        0.889
      ],
      "xy": [],
      "av": {
        "1": "(rock music)"
      }
    },
    "1_uJClRHLQ": {
      "vid": "1",
      "flg": 0,
      "z": [
        0.891,
        2.691
      ],
      "xy": [],
      "av": {
        "1": "- [T. Keith Glennan] We have one of the most challenging "
      }
    },
    "1_Key5m6aC": {
      "vid": "1",
      "flg": 0,
      "z": [
        2.69,
        5.96
      ],
      "xy": [],
      "av": {
        "1": "assignments that has ever been given to modern man."
      }
    },
    "1_xsQwqXUo": {
      "vid": "1",
      "flg": 0,
      "z": [
        5.96,
        9.06
      ],
      "xy": [],
      "av": {
        "1": "Expansion of human knowledge about space."
      }
    },
    "1_1rdLXMfi": {
      "vid": "1",
      "flg": 0,
      "z": [
        9.059,
        10.859
      ],
      "xy": [],
      "av": {
        "1": "- [General John B. Medaris] We've been assigned the mission "
      }
    },
    "1_HKg0IEDY": {
      "vid": "1",
      "flg": 0,
      "z": [
        10.859,
        12.639
      ],
      "xy": [],
      "av": {
        "1": "of launching a scientific Earth satellite."
      }
    },
    "1_MfijXyqz": {
      "vid": "1",
      "flg": 0,
      "z": [
        13.501,
        18.051
      ],
      "xy": [],
      "av": {
        "1": "- [Man] Five, four, three, two, one."
      }
    },
    "1_mXS8z7k7": {
      "vid": "1",
      "flg": 0,
      "z": [
        18.051,
        19.971
      ],
      "xy": [],
      "av": {
        "1": "By command, by command."
      }
    },
    "1_qpVvGSRt": {
      "vid": "1",
      "flg": 0,
      "z": [
        20.744,
        23.164
      ],
      "xy": [],
      "av": {
        "1": "- [T. Keith Glennan] Development and operation of vehicles"
      }
    },
    "1_OyHXhcDa": {
      "vid": "1",
      "flg": 0,
      "z": [
        23.16,
        27.46
      ],
      "xy": [],
      "av": {
        "1": "capable of carrying instruments and man through space."
      }
    },
    "1_uCSEsdPg": {
      "vid": "1",
      "flg": 0,
      "z": [
        27.463,
        29.513
      ],
      "xy": [],
      "av": {
        "1": "- [Neil Armstrong] That's one small step for man,"
      }
    },
    "1_mXEIbT5E": {
      "vid": "1",
      "flg": 0,
      "z": [
        29.511,
        32.251
      ],
      "xy": [],
      "av": {
        "1": "one giant leap for mankind."
      }
    },
    "1_n07weVOX": {
      "vid": "1",
      "flg": 0,
      "z": [
        33.641,
        34.531
      ],
      "xy": [],
      "av": {
        "1": "- [T. Keith Glennan] Long range studies"
      }
    },
    "1_j7uFwd8s": {
      "vid": "1",
      "flg": 0,
      "z": [
        34.53,
        35.77
      ],
      "xy": [],
      "av": {
        "1": "of the benefits of using"
      }
    },
    "1_n5WXMhpN": {
      "vid": "1",
      "flg": 0,
      "z": [
        35.77,
        38.89
      ],
      "xy": [],
      "av": {
        "1": "aeronautical and space activities for peaceful"
      }
    },
    "1_MUyrzYth": {
      "vid": "1",
      "flg": 0,
      "z": [
        38.89,
        40.77
      ],
      "xy": [],
      "av": {
        "1": "and scientific purposes."
      }
    },
    "1_zWNePyZs": {
      "vid": "1",
      "flg": 0,
      "z": [
        40.773,
        42.303
      ],
      "xy": [],
      "av": {
        "1": "(crowd cheering)"
      }
    },
    "1_VTkGhfE7": {
      "vid": "1",
      "flg": 0,
      "z": [
        42.3,
        47.3
      ],
      "xy": [],
      "av": {
        "1": "- [Male] Five, four, three, two, one and liftoff."
      }
    },
    "1_dqXiR3RE": {
      "vid": "1",
      "flg": 0,
      "z": [
        47.41,
        50.79
      ],
      "xy": [],
      "av": {
        "1": "And a new era of American space exploration."
      }
    },
    "1_y9VlfCXz": {
      "vid": "1",
      "flg": 0,
      "z": [
        50.787,
        52.897
      ],
      "xy": [],
      "av": {
        "1": "- [T. Keith Glennan] Preservation of the role"
      }
    },
    "1_cbHXU0kQ": {
      "vid": "1",
      "flg": 0,
      "z": [
        52.897,
        54.937
      ],
      "xy": [],
      "av": {
        "1": "of the United States as a leader in aeronautical"
      }
    },
    "1_SaZWXbfs": {
      "vid": "1",
      "flg": 0,
      "z": [
        54.94,
        57.54
      ],
      "xy": [],
      "av": {
        "1": "and space science and technology."
      }
    },
    "1_F80CEtnj": {
      "vid": "1",
      "flg": 0,
      "z": [
        57.54,
        59.45
      ],
      "xy": [],
      "av": {
        "1": "We have a mighty big job to do."
      }
    }
  };

  this.d.store = _via_demo_project['store'];
  this.d._cache_update();
  this.vm._init();

  setTimeout( function() {
    this.va.view_show('1');
    if ( this.s ) {
      this.s._disable_share();
    }
  }.bind(this), 500);
}
