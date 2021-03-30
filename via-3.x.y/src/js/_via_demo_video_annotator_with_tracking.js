/**
 *
 * @class
 * @classdesc Demo of video annotator with tracking
 * @author Prasanna Sridhar <prasanna@robots.ox.ac.uk>
 * @date 30 Mar 2021
 *
 * Select the video based on URLParameters
 */

 function _via_load_submodules() {
    console.log('Loading video annotator demo');
    const urlParams = new URLSearchParams(window.location.search);
    const filenames = _via_demo_data['video'].filter(el => el.src)
    let idx = 0;
    if (urlParams.has('video')
        && filenames.includes(urlParams.get('video'))){
        idx = filenames.indexOf(urlParams.get('video'))
    }

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
      'vid_list':['1'],
    };
    _via_demo_project['store']['config'] = {
      'file': {
        'loc_prefix': { '1':'', '2':'https://vgg.gitlab.io/via/assets/', '3':'', '4':'' }, // constants defined in _via_file._VIA_FILE_LOC
      },
      'ui': {
        'file_content_align':'center',
        'file_metadata_editor_visible': false,
        'spatial_metadata_editor_visible': false,
        "spatial_region_label_attribute_id": "",
        "gtimeline_visible_row_count": "2",
      },
    };
    _via_demo_project['store']['attribute'] = {
      '1': {
        'aname':'Tracks',
        'anchor_id':'FILE1_Z2_XY0',
        'type':1,
        'desc':'Tracks',
        'options':{},
        'default_option_id':'',
      },
    };
    _via_demo_project['store']['file'] = {
      '1':{
        'fid':1,
        'fname':_via_demo_data['video'][idx]['filename'],
        'type':4,
        'loc':2,
        'src':_via_demo_data['video'][idx]['src'],
      },
    };
  
    _via_demo_project['store']['view'] = {
      '1': {
        'fid_list':[1],
      },
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
  