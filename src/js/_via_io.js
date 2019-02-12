/**
 *
 * @class
 * @classdesc VIA data input/output
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 3 Feb. 2019
 *
 */

'use strict';

function _via_io(data) {
  this.d = data;

  // registers on_event(), emit_event(), ... methods from
  // _via_event to let this module listen and emit events
  this.event_prefix = '_via_io_';
  _via_event.call( this );
}

_via_io.prototype.metadata_export_csv = function() {
  var csvd = [];
    csvd.push('file,metadata_target,metadata_shape,metadata_where,metadata_what');

    var findex, fid;
  for ( findex in this.d.fid_list ) {
    fid = this.d.fid_list[findex];
    if ( this.d.metadata_store.hasOwnProperty(fid) ) {
      var mid, where_target, where_target_id, where_shape_id, where_shape, metadata;
      for ( mid in this.d.metadata_store[fid] ) {
        where_target_id = this.d.metadata_store[fid][mid].where_target();
        where_target = _via_util_metadata_target_str(where_target_id);
        where_shape_id = this.d.metadata_store[fid][mid].where_shape();
        where_shape = _via_util_metadata_shape_str(where_shape_id);

        var csvline = [];
        if ( this.d.file_store[fid].loc === _VIA_FILE_LOC.INLINE ||
             this.d.file_store[fid].loc === _VIA_FILE_LOC.LOCAL
           ) {
          csvline.push( '"' + this.d.file_store[fid].filename + '"' );
        } else {
          csvline.push( '"' + this.d.file_store[fid].src + '"' );
        }

        csvline.push('"' + where_target + '"' );
        csvline.push('"' + where_shape + '"' );

        var metadata_where = this.d.metadata_store[fid][mid].where.slice(2);
        var i;
        for ( i = 0; i < metadata_where.length; ++i ) {
          metadata_where[i] = parseFloat(metadata_where[i].toFixed(3));
        }
        csvline.push( '"' + JSON.stringify(metadata_where) + '"' );

        metadata = this._metadata_expand(fid, mid);
        csvline.push( '"' +
                      _via_util_escape_quote_for_csv(JSON.stringify(metadata)) +
                      '"' );
        csvd.push( csvline.join(',') );
      }
    }
  }
  var blob = new Blob( [csvd.join('\n')], {type:'text/csv;charset=utf-8'} );
  _via_util_download_as_file(blob, 'via_metadata.csv');
}

_via_io.prototype._metadata_expand = function(fid, mid) {
  var d = {};
  var aid;
  for ( aid in this.d.metadata_store[fid][mid].what ) {
    d[ this.d.attribute_store[aid].attr_name ] = this.d.metadata_store[fid][mid].what[aid];
  }
  return d;
}

_via_io.prototype.metadata_import_csv = function() {

}
