# VIA Project Data Model

## Requirements
 - annotate video and images
 - compact and readable data structure based on JSON
 - should be possible to map to a version control repository (git, fossil, etc.)

## Data API
```
var data_config = {};
data_config.repo = {};
data_config.repo.origin = 'http://localhost:8080';
data_config.repo.type = 'remote_fossil';
data_config.repo.username = 'tlm';
data_config.repo.password = 'abhishek';
data_config.repo.auto_sync = true;
data_config.core.data_model_version = 1;

var data = new _via_data(data_config);
var fid1 = data.file_add('/home/tlm/dev/via/test/data/unit_test_img1.jpg', _via.FILE_LOC.FILE, _via.FILE_TYP.IMAGE);
var fid2 = data.file_add('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/David_-_The_Death_of_Socrates.jpg/640px-David_-_The_Death_of_Socrates.jpg', _via.FILE_LOC.HTTP, _via.FILE_TYP.IMG);

var fid3 = data.file_add('https://upload.wikimedia.org/wikipedia/commons/9/9d/NASA-solar_eclipse_STEREO-B.ogv', _via.FILE_LOC.HTTP, _via.FILE_TYP.VIDEO);
var fid4 = data.file_add('/home/tlm/Liquidcrash_-_Time-lapse_of_the_total_solar_eclipse.ogv', _via.FILE_LOC.FILE, _via.FILE_TYP.VIDEO);

data.add_region(fid, t, region)
data.add_segment(fid, t0, t1, seg_metadata)
```

## Data Sink API
```
var sink = new _via_sink_fossil(uri, username, passwd);
sink.add_file()
sink.update_file(fid)
sink.update_file_seg(fid, sid, segment_metadata)
sink.update_file_reg(fid, rid, region_metadata)
```

## Class Definition
```
function _via() {
  // constant definitions
  this.FILE_LOC = { FSEL:1, FILE:2, HTTP:3 };
  this.FILE_TYP = { IMAGE:1, VIDEO:2, FRAME:3 };
}
```

## Data Model Definition
```
var d = {};

// information about the VIA project
d.info = {};
d.info.name = "";
d.info.desc = "";
d.info.author_name  = "";
d.info.author_email = "";

// metadata describing the symbols used in annotation data
d.metadata = {};
d.metadata.project_encoding = "utf-8";
d.metadata.project_lang = "en";
d.metadata.region_shape_list = {};
d.metadata.region_shape_list['1'] = { 'name':'point', 'data_format':'[shape_id, x, y]' };
d.metadata.region_shape_list['2'] = { 'name':'rect', 'data_format':'[shape_id, x, y, width, height]' };
d.metadata.region_shape_list['3'] = { 'name':'circle', 'data_format':'[shape_id, center_x, center_y, radius]' };
d.metadata.region_shape_list['4'] = { 'name':'ellipse', 'data_format':'[shape_id, center_x, center_y, radius_x, radius_y]' };
d.metadata.region_shape_list['5'] = { 'name':'polygon', 'data_format':'[shape_id, x0, y0, x1, y1, ...,  xk, yk]' };
d.metadata.region_shape_list['6'] = { 'name':'polyline', 'data_format':'[shape_id, x0, y0, x1, y1, ...,  xk, yk]' };
d.metadata.region_shape_list['7'] = { 'name':'line', 'data_format':'[shape_id, x0, y1, x1, y1]' };
d.metadata.region_shape_list['8'] = { 'name':'rellipse', 'data_format':'[shape_id, center_x, center_y, radius_x, radius_y, theta]' };
d.metadata.filelist_base_uri = '/data/voc2012/images/';
d.metadata.file_type_list = {};
d.metadata.file_type_list['1'] = "image";
d.metadata.file_type_list['2'] = "video";
d.metadata.file_type_list['3'] = "frame";
d.metadata.file_loc_list = {};
d.metadata.file_loc_list['1'] = "fsel";
d.metadata.file_loc_list['1'] = "file";
d.metadata.file_loc_list['2'] = "http";

d.metadata.filelist = {};
d.metadata.filelist['1'] = {};
d.metadata.filelist['1'].type = 3;
d.metadata.filelist['1'].uri = [];
d.metadata.filelist['1'].uri[0] = 'frames/001/000001.jpg';
d.metadata.filelist['1'].uri[1] = 'frames/001/000002.jpg';
d.metadata.filelist['1'].uri[2] = 'frames/001/000003.jpg';
d.metadata.filelist['1'].uri[3] = 'frames/001/000004.jpg';
d.metadata.filelist['1'].uri[4] = 'frames/001/000005.jpg';
d.metadata.filelist['1'].uri[5] = 'frames/001/000006.jpg';
d.metadata.filelist['2'] = {};
d.metadata.filelist['2'].type = 2;
d.metadata.filelist['2'].uri = 'video/002/dsc0005.mp4';
d.metadata.filelist['3'] = {};
d.metadata.filelist['3'].type = 1;
d.metadata.filelist['3'].uri = 'img-2182.jpg';
d.metadata.filelist['4'] = {};
d.metadata.filelist['4'].type = 2;
d.metadata.filelist['4'].uri = 'video/003/dsc0034.mp4';
d.metadata.filelist['5'] = {};
d.metadata.filelist['5'].type = 1;
d.metadata.filelist['5'].uri = 'img-8892.png';
d.metadata.segment_attr_list = [];
d.metadata.segment_attr_list[0] = {};
d.metadata.segment_attr_list[0].id = '1';
d.metadata.segment_attr_list[0].name = 'activity';
d.metadata.segment_attr_list[0].type = 'text';
d.metadata.segment_attr_list[0].default_value = '';
d.metadata.segment_attr_list[0].options = {};
d.metadata.segment_attr_list[0].options['1'] = 'walking';
d.metadata.segment_attr_list[0].options['2'] = 'singing';
d.metadata.segment_attr_list[0].options['3'] = 'eating';
d.metadata.segment_attr_list[0].options['4'] = 'running';
d.metadata.segment_attr_list[1] = {};
d.metadata.segment_attr_list[1].id = '2';
d.metadata.segment_attr_list[1].name = 'is_good';
d.metadata.segment_attr_list[1].type = 'radio';
d.metadata.segment_attr_list[1].default_value = 'yes';
d.metadata.segment_attr_list[1].options = {};
d.metadata.segment_attr_list[1].options['1'] = 'yes';
d.metadata.segment_attr_list[1].options['2'] = 'no';
d.metadata.region_attr_list = [];
d.metadata.region_attr_list[0] = {};
d.metadata.region_attr_list[0].id = '1';
d.metadata.region_attr_list[0].name = 'name';
d.metadata.region_attr_list[0].type = 'text';
d.metadata.region_attr_list[0].default_value = '';
d.metadata.region_attr_list[1] = {};
d.metadata.region_attr_list[1].id = '2';
d.metadata.region_attr_list[1].name = 'type';
d.metadata.region_attr_list[1].type = 'dropdown';
d.metadata.region_attr_list[1].default_value = 'bird';
d.metadata.region_attr_list[1].options = {};
d.metadata.region_attr_list[1].options['1'] = 'bird';
d.metadata.region_attr_list[1].options['2'] = 'animal';
d.metadata.region_attr_list[1].options['3'] = 'fish';
d.metadata.region_attr_list[1].options['4'] = 'insect';
d.metadata.file_attr_list = [];
d.metadata.file_attr_list[0] = {};
d.metadata.file_attr_list[0].id = '1';
d.metadata.file_attr_list[0].name = 'caption';
d.metadata.file_attr_list[0].type = 'text';
d.metadata.file_attr_list[0].default_value = '';
d.metadata.file_attr_list[1] = {};
d.metadata.file_attr_list[1].id = '2';
d.metadata.file_attr_list[1].name = 'file properties';
d.metadata.file_attr_list[1].type = 'checkbox';
d.metadata.file_attr_list[1].default_value = '';
d.metadata.file_attr_list[1].options = {};
d.metadata.file_attr_list[1].options['1'] = 'public domain';
d.metadata.file_attr_list[1].options['2'] = 'high resolution';
d.metadata.file_attr_list[1].options['3'] = 'poor illumination';
d.metadata.file_attr_list[1].options['4'] = 'blurred';
d.metadata.object_list = [];
d.metadata.object_list[0] = { 'id':'1', 'name':'dog' };
d.metadata.object_list[1] = { 'id':'2', 'name':'suspect1' };

// configuration of the VIA application
d.config = {};
d.config.repo = {};
d.config.repo.origin = '';
d.config.repo.type = '';
d.config.repo.username = '';
d.config.repo.password = '';
d.config.repo.auto_sync = false;
d.config.ui = {};
d.config.core = {};
d.config.core.data_model_version = 1;
// data corresponding to manual annotation of all the 
// files listed in metadata['filelist']
d.data = {};
d.data['1'] = {};
d.data['1'].seg = [];
d.data['1'].seg[0] = {};
d.data['1'].seg[0].t = [3,5];
d.data['1'].seg[0].sattr = {};
d.data['1'].seg[0].sattr['1'] = '3';
d.data['1'].seg[0].sattr['2'] = '1';
d.data['1'].seg[1] = {};
d.data['1'].seg[1].t = [0,2]
d.data['1'].seg[1].sattr = {};
d.data['1'].seg[1].sattr['1'] = '4';
d.data['1'].seg[1].sattr['2'] = '1';
d.data['1'].reg = [];
d.data['1'].reg[0] = {};
d.data['1'].reg[0].oid = '1';
d.data['1'].reg[0].t = '1';
d.data['1'].reg[0].shp = [1,293,100,89,60];
d.data['1'].reg[0].atr = { '1':'duck', '2':'1' };
d.data['1'].reg[1] = {};
d.data['1'].reg[1].oid = '1';
d.data['1'].reg[1].t = 2;
d.data['1'].reg[1].shp = [1,292,101,88,60];
d.data['1'].reg[1].atr = { '1':'duck', '2':'1' };
d.data['2'] = {};
d.data['2'].seg = [];
d.data['2'].seg[0] = {};
d.data['2'].seg[0].t = [1.632,2.456,8.982,12,677];
d.data['2'].seg[0].sattr = { '1':'3', '2':'1' };
d.data['2'].seg[1] = {};
d.data['2'].seg[1].t = [21.622,23.756,38.592,42,767];
d.data['2'].seg[1].sattr = { '1':'4', '2':'1' };
d.data['2'].reg = [];
d.data['2'].reg[0] = {};
d.data['2'].reg[0].oid = '1';
d.data['2'].reg[0].t = 1.784;
d.data['2'].reg[0].shp = [1,88,61,120,110];
d.data['2'].reg[0].atr = { '1':'duck', '2':'1' };
d.data['2'].reg[1] = {};
d.data['2'].reg[1].oid = '1';
d.data['2'].reg[1].t = 7.322;
d.data['2'].reg[1].shp = [1,9,12,50,61];
d.data['2'].reg[1].atr = { '1':'duck', '2':'1' };
d.data['3'] = {};
d.data['3'].reg = [];
d.data['3'].reg[0] = {};
d.data['3'].reg[0].oid = '2';
d.data['3'].reg[0].shp = [1,77,81,30,25];
d.data['3'].reg[0].atr = { '1':'tiger', '2':'2' };

```
