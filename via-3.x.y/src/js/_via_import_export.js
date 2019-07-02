/**
 *
 * @class
 * @classdesc Manages import and export of annotations
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 26 May 2019
 *
 */

'use strict';

function _via_import_export(data) {
  this.d = data;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this._EVENT_ID_PREFIX = '_via_import_export_';
  _via_event.call(this);
}

_via_import_export.prototype.import_from_file = function(data_format, file) {
  switch(data_format) {
  case 'coco':
    _via_util_load_text_file(file[0], this.import_from_coco.bind(this));
    break;
  default:
    console.warn('Unknown data format: ' + data_format);
  }
}

_via_import_export.prototype.import_from_coco = function(json_str) {
  try {
    var d = JSON.parse(json_str);
    if ( ! ( d.hasOwnProperty('annotations') &&
             d.hasOwnProperty('categories') &&
             d.hasOwnProperty('images')
           )
       ) {
      _via_util_msg_show('Cannot import annotations from malformed JSON!');
      return;
    }
    var p = this.d._init_default_project();

    // add files
    for ( var i in d.images ) {
      var fid = d.images[i].id;
      var fname = d.images[i].file_name;
      var src = d.images[i].coco_url;
      var type = _VIA_FILE_TYPE.IMAGE;
      var loc = _VIA_FILE_LOC.URIHTTP;
      p.file[fid] = new _via_file(fid, fname, type, loc, src);

      // add a view for each file
      var vid = fid;
      p.view[vid] = new _via_view( [ fid ] ); // view with single file
      p.project.vid_list.push(vid);
    }

    // add attributes
    for ( var i in d.categories ) {
      var aid = d.categories[i].id;
      var aname = d.categories[i].name;
      p.attribute[aid] = new _via_attribute(aname, 'FILE1_Z0_XY1', _VIA_ATTRIBUTE_TYPE.TEXT, {}, {});
/*
      var aid = d.categories[i].supercategory;
      var option_id = d.categories[i].id;
      var option_value = d.categories[i].name;

      if ( p.attribute.hasOwnProperty(aid) ) {
        // add as an option
        p.attribute[aid].options[option_id] = option_value;
      } else {
        var options = {};
        options[option_id] = option_value;
        p.attribute[aid] = new _via_attribute(aid, 'FILE1_Z0_XY1', _VIA_ATTRIBUTE_TYPE.SELECT, options, {});
      }
*/
    }

    // add metadata
    for ( var i in d.annotations ) {
      var mid = d.annotations[i].id;
      var vid = d.annotations[i].image_id;
      if ( p.file.hasOwnProperty(vid) ) {
        var aid = d.annotations[i].category_id;
        var shape = [_VIA_RSHAPE.POLYGON];
        var av = {}
        av[aid] = p.attribute[aid].aname;

        for ( var j = 0; j < d.annotations[i].segmentation[0].length; ++j ) {
          shape.push(d.annotations[i].segmentation[0][j]);
        }

        p.metadata[mid] = new _via_metadata(vid, [], shape, av);
      }
    }

    this.d.project_load_json(p);
  }
  catch(e) {
    _via_util_msg_show('Failed to import annotations: ' + e);
    console.warn(e)
  }
}

_via_import_export.prototype.export_to_file = function(data_format) {
  console.log(data_format)
  switch(data_format) {
    case 'via3_csv':
      this.export_to_via3_csv();
      break;
    default:
      console.warn('Unknown data format: ' + data_format);
  }
}

_via_import_export.prototype.export_to_via3_csv = function() {
  return new Promise( function(ok_callback, err_callback) {
    var csv = [];

    var attribute = {}
    for ( var aid in this.d.store.attribute ) {
      attribute[aid] = this.d.store.attribute[aid].aname;
    }

    csv.push('# Exported using VGG Image Annotator (http://www.robots.ox.ac.uk/~vgg/software/via)');
    csv.push('# Notes:');
    csv.push('# - spatial_coordinates of [2,10,20,50,80] denotes a rectangle (shape_id=2) of size 50x80 placed at (10,20)');
    csv.push('# - temporal coordinate of [1.349,2.741] denotes a temporal segment from time 1.346 sec. to 2.741 sec.');
    csv.push('# - temporal coordinate of [4.633] denotes a still video frame at 4.633 sec.');
    csv.push('# - metadata of {""1"":""3""} indicates attribute with id "1" set to an attribute option with id "3"');

    csv.push('# SHAPE_ID = ' + JSON.stringify(_VIA_RSHAPE));
    csv.push('# FLAG_ID = ' + JSON.stringify(_VIA_METADATA_FLAG));
    csv.push('# ATTRIBUTE = ' + JSON.stringify(this.d.store.attribute));
    csv.push('# CSV_HEADER = metadata_id,file_list,flags,temporal_coordinates,spatial_coordinates,metadata');
    // build file_list for each view_id
    var vid_filesrc_str_list = {};
    var vid, fid;
    for ( var vindex in this.d.store.project.vid_list ) {
      vid = this.d.store.project.vid_list[vindex];
      var vid_filesrc_list = [];
      for ( var findex in this.d.store.view[vid].fid_list ) {
        fid = this.d.store.view[vid].fid_list[findex];
        switch(this.d.store.file[fid].loc) {
        case _VIA_FILE_LOC.LOCAL:
          if ( this.d.file_ref.hasOwnProperty(fid) ) {
            vid_filesrc_list.push( this.d.file_ref[fid].name );
          } else {
            vid_filesrc_list.push( this.d.store.file[fid].fname );
          }
          break;
        case _VIA_FILE_LOC.INLINE:
          vid_filesrc_list.push( this.d.store.file[fid].fname );
          break;
        default:
          vid_filesrc_list.push( this.d.store.file[fid].src );
        }
      }
      vid_filesrc_str_list[vid] = _via_util_obj2csv(vid_filesrc_list);
    }

    for ( var mid in this.d.store.metadata ) {
      var line = [];
      line.push( '"' + mid + '"');
      line.push( vid_filesrc_str_list[ this.d.store.metadata[mid].vid ] );
      line.push(this.d.store.metadata[mid].flg);
      line.push( _via_util_obj2csv(this.d.store.metadata[mid].z) );
      line.push( _via_util_obj2csv(this.d.store.metadata[mid].xy) );
      line.push( _via_util_obj2csv(this.d.store.metadata[mid].av) );
      csv.push(line.join(','));
    }

    var data_blob = new Blob( [csv.join('\n')],
                              {type: 'text/csv;charset=utf-8'});
    var filename = [];
    filename.push(this.d.store.project.pname.replace(' ', '-'));
    filename.push(_via_util_date_to_filename_str(Date.now()));
    filename.push('_export.csv');
    _via_util_download_as_file(data_blob, filename.join(''));
  }.bind(this));
}
