/**
 *
 * @class
 * @classdesc Demo of pair annotator
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 16 Janurary 2020
 *
 * The following images from Wikimedia Commons have been used in this demo:
 * https://commons.wikimedia.org/wiki/File:Balloon_over_Luxor_-_Egypt_denoised.jpg
 * https://commons.wikimedia.org/wiki/File:Castillo_de_Montuenga,_Montuenga_de_Soria,_Soria,_Espa%C3%B1a,_2017-05-23,_DD_04.jpg
 * https://commons.wikimedia.org/wiki/File:Paradise_shelduck_portrait,_New_Zealand.jpg
 * https://commons.wikimedia.org/wiki/File:Red-billed_oxpecker_(Buphagus_erythrorhynchus)_on_impala_(Aepyceros_melampus).jpg
 */

function _via_load_submodules() {
  console.log('Loading pair annotator demo');
  _via_demo_project = { 'store':{} };
  _via_demo_project['store'] = {};
  _via_demo_project['store']['project'] = {
    'pid': '__VIA_PROJECT_ID__',
    'rev': '__VIA_PROJECT_REV_ID__',
    'rev_timestamp': '__VIA_PROJECT_REV_TIMESTAMP__',
    'pname': 'Demo Pair Annotation',
    'pdesc': 'Demonstration of annotation of an image pair',
    'creator': 'VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)',
    'created': Date.now(),
    'data_format_version': '3.1.2',
    'vid_list':['1', '2', '3', '4'], // views for individual images are not added
  };
  _via_demo_project['store']['config'] = {
    'file': {
      'loc_prefix': { '1':'', '2':'https://upload.wikimedia.org/wikipedia/commons/thumb/', '3':'', '4':'' }, // constants defined in _via_file._VIA_FILE_LOC
    },
    'ui': {
      'file_content_align':'center'
    }
  };
  _via_demo_project['store']['attribute'] = {
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
  _via_demo_project['store']['file'] = {
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

  _via_demo_project['store']['view'] = {
    '1': {
      'fid_list':[1, 2],
    },
    '2': {
      'fid_list':[3, 4],
    },
    '3': {
      'fid_list':[2, 3],
    },
    '4': {
      'fid_list':[4, 1],
    },
    // add a view for each file (needed when individual images are annotated)
    // these views are not visible as they are not present in ['project']['vid_list']
    '5': { 'fid_list': [1] },
    '6': { 'fid_list': [2] },
    '7': { 'fid_list': [3] },
    '8': { 'fid_list': [4] },
  };

  _via_demo_project['store']['metadata'] = {};

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
