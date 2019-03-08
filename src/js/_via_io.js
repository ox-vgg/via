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

_via_io.prototype.speaker_diarisation_export_csv = function() {
  var csvd = [];
  csvd.push('file,speaker,tstart,tend');

  var fid, mindex, mid, filename, avalue, t0, t1;
  for ( fid in this.d.file_mid_list ) {
    filename = this.d.file_store[fid].filename;
    for ( mindex in this.d.file_mid_list[fid] ) {
      mid = this.d.file_mid_list[fid][mindex];
      avalue = this.d.metadata_store[mid].metadata['0'];
      t0 = this.d.metadata_store[mid].z[0];
      t1 = this.d.metadata_store[mid].z[1];
      csvd.push( filename + ',' + avalue + ',' + t0 + ',' + t1);
    }
  }

  var blob = new Blob( [csvd.join('\n')], {type:'text/csv;charset=utf-8'} );
  _via_util_download_as_file(blob, 'via_speaker_diarisation_' + this.d.project_store.project_id + '.csv');
}
