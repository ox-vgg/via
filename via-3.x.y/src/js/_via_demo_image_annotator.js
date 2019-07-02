/**
 *
 * @class
 * @classdesc Demo of image annotator
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 30 June 2019
 *
 * Audio 1
 * Video title: The making of Alioli in 2 minutes using standard kitchen equipment
 * Video filename: Alioli_Wikimedia_Wardtmar.mp4
 * Video author: Wardtmar at https://commons.wikimedia.org
 * Video source: https://commons.wikimedia.org/wiki/File:Alioli.ogv
 * Video date: 2018-12-28 22:43:56
 *
 * Video 2
 * Video source: https://commons.wikimedia.org/wiki/File:Grilledcheesesandwich.webm
 */

function _via_load_submodules() {
  console.log('Loading image annotator demo');
  _via_demo_project = { 'store':{} };
  _via_demo_project['store'] = {};
  _via_demo_project['store']['project'] = {
    'pid': '__VIA_PROJECT_ID__',
    'rev': '__VIA_PROJECT_REV_ID__',
    'rev_timestamp': '__VIA_PROJECT_REV_TIMESTAMP__',
    'pname': 'Demo Video Annotation',
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
      'aname':'Name',
      'anchor_id':'FILE1_Z0_XY1',
      'type':1,
      'desc':'Name of Object',
      'options':{},
      'default_option_id':'',
    },
  };
  _via_demo_project['store']['file'] = {
    '1':{
      'fid':1,
      'fname':_via_demo_data['image'][0]['filename'],
      'type':2,
      'loc':4,
      'src':_via_demo_data['image'][0]['src'],
    },
    '2':{
      'fid':2,
      'fname':'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/David_-_The_Death_of_Socrates.jpg/640px-David_-_The_Death_of_Socrates.jpg',
      'type':2,
      'loc':2,
      'src':'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/David_-_The_Death_of_Socrates.jpg/640px-David_-_The_Death_of_Socrates.jpg',
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
    '1-glfwaaX': {
      'vid': '1',
      'flg': 0,
      'z': [],
      'xy': [2, 101, 125, 286, 146],
      'av': {
        '1':'Swan',
      }
    },
    '2_WIpRNLvX': {
      'vid': '2',
      'flg': 0,
      'z': [],
      'xy': [2, 378.921,121.113,84.991,234.435],
      'av': {
        '1':'Socrates',
      }
    },
    '2_eA5CqEPf': {
      'vid': '2',
      'flg': 0,
      'z': [],
      'xy': [2, 198.314,150.152,109.072,238.684],
      'av': {
        '1':'Plato',
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
