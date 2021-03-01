'use strict'

/**
 * Static Singleton Class for tracking
 * Attaches to the track segment being processed
 */
class Tracker {
    
  // Resets the tracker to zero state
  static reset_tracker() {
    this.track_mid = null;
    this.segment_mid = null;
    this.fail_counter = 0;
    if (this.instance) {
      this.instance.delete();
      this.instance = null;
    }
  }

  // resets and re-initialises tracker to given frame, roi
  // of a given track segment
  static reset(frame, roi, track_mid, segment_mid) {
    this.reset_tracker();
    this.track_mid = track_mid;
    this.segment_mid = segment_mid;    
    this.instance = new Module.Tracker(frame, this.height, roi);
  }

  // performs tracking on the given frame
  // for the attached track segment
  static track(frame) {
    if (!this.instance) {
      throw new Error('Cannot call track without an active tracker');
    }
    // On tracking, update tracking list
    const _roi = this.instance.track_object(frame)

    if (this.instance.status) {
      this.fail_counter = 0;
      return _roi;
    }

    // Delete tracker of failed tracking (draw metadata in different color?)
    if (this.fail_counter > 50) {
      this.reset_tracker();
    } else {
      this.fail_counter += 1;
    }
    return null;
  }
};
Tracker.reset_tracker();
Tracker.height = -1;
Tracker.last_success_time = -1;

// Class to maintain mappings between temporal segments
// and boxes on each frame.
class Track {
  constructor(mid, segment_mid) {
    this.segments = new Map();
    this.segments.set(segment_mid, [mid]);
    this.order = [segment_mid];
  }

  add(mid, segment_mid) {
    this.segments.get(segment_mid).push(mid);
  }

  delete_segment(segment_mid) {
    const segment = this.segments.get(segment_mid);
    this.segments.delete(segment_mid);
    this.order.splice(this.order.indexOf(segment_mid), 1);
    return segment;
  }

  delete(mid, segment_mid) {

    const segment = this.segments.get(segment_mid);

    if(!segment) {
      // Segment already deleted
      return [];
    }

    // Remove box from segment
    return segment.splice(segment.indexOf(mid), 1);
  }

  force_update(segment_mid) {
    // Erase all previous metadata
    const segment = this.segments.get(segment_mid);
    const old_mid_list = segment.slice(1);
    this.segments.set(segment_mid, segment.slice(0, 1));
    return old_mid_list;
  }

  update(mid, segment_mid, new_segment_mid) {

    // Add new mid for manual ordering
    const _sidx = this.order.indexOf(segment_mid) + 1;
    this.order.splice(_sidx, 0, new_segment_mid);

    let segment = this.segments.get(segment_mid);
    const _idx = segment.indexOf(mid);

    // Move all elements from the old segment to the new segment   
    this.segments.set(segment_mid, segment.slice(0, _idx));
    this.segments.set(new_segment_mid, segment.slice(_idx));
  }
};

class TrackingHandler {
  constructor(vid, video, ts, d) {
    this._ID = 'TrackingHandler';
    this.vid = vid;
    this.video = video;
    this.ts = ts;
    this.d  = d;

    this.tracks = {};
    this.delta = 1/25;
    this.tracking = false;

    (async () => {
      await tracking;
    })(); 

    // Canvas for getting video frame
    this.bcanvas = document.createElement('canvas');
    this.bcanvas.style.pointerEvents = 'none';
    this.bcanvas.style.display = 'none';
    
    this.scale = 0.5;
    this.dscale = 1 / this.scale;
    this.bcanvas.width = Math.floor(this.video.videoWidth * this.scale);
    this.bcanvas.height = Math.floor(this.video.videoHeight * this.scale);
    this.bctx = this.bcanvas.getContext('2d');

    Tracker.height = Math.floor(this.video.videoHeight * this.scale);
    
    
    this.d.on_event('metadata_add', this._ID, this.metadata_handler.bind(this), 'metadata_add');
    this.d.on_event('metadata_update', this._ID, this.metadata_handler.bind(this), 'metadata_update');
    this.d.on_event('metadata_delete', this._ID, this.metadata_handler.bind(this), 'metadata_delete');
  }
  reset_tracker(){
    Tracker.reset_tracker();
  }
  
  get_seek_listener = (vid) => {
    
    if (!Tracker.instance) {
      return null;
    }
   
    const { groupby_aid: aid } = this.ts;
    const { metadata } = this.d.store;
  
    const current_track = this.tracks[Tracker.track_mid];
    const delete_list = current_track.force_update(Tracker.segment_mid);
    this.d.metadata_delete_bulk(vid, delete_list, true);
    
    // Get boundary ts from next temporal segment
    let boundary_ts = this.video.duration;
    const _oidx = current_track.order.indexOf(Tracker.segment_mid) + 1;
    if (_oidx < current_track.order.length) {
      const next_segment_id = current_track.order[_oidx];
      boundary_ts = metadata[next_segment_id].z[0];
    }
  
    const seekListener = async (ev) => {
      console.time('frame');
      const video = ev.target;
      this.tracking = true;
      if (!Tracker.instance) {
        video.removeEventListener('seeked', seekListener);
        video.currentTime = Tracker.last_success_time;
        Tracker.last_success_time = -1;
        this.tracking = false;
        return;
      }
  
      const { currentTime } = video;
  
      // Get frame.
      this.bctx.drawImage(this.video, 0, 0, this.bcanvas.width, this.bcanvas.height);
      const frame = this.bctx.getImageData(0, 0, this.bcanvas.width, this.bcanvas.height);
   
      // Do tracking for active track
      const fail_counter = Tracker.fail_counter;
      console.time('track')
      const _roi = Tracker.track(frame.data);
      console.timeEnd('track')

      // On successful tracking
      if (_roi) {
        const { track_mid, segment_mid } = Tracker;
        // TODO What about default attributes?
        const { mid } = await this.d.metadata_add(
          vid, 
          [currentTime], 
          [
            _VIA_RSHAPE.RECTANGLE,
            this.dscale * _roi.x,
            this.dscale * _roi.y,
            this.dscale * _roi.width,
            this.dscale * _roi.height
          ],
          { [aid]: track_mid },
          { 
            segment_mid: segment_mid,
            root_mid: track_mid 
          }
        );
        
        // add mid to current_segment
        this.tracks[track_mid].add(mid, segment_mid);
  
        if (!fail_counter) {
          //tracking is continuous, keep extending current segment
          await this.d.metadata_update_zi(
            vid,
            segment_mid,
            1,
            currentTime);
        } else {
          // Tracking failed previously, create new segment
          const _t_mid = currentTime;
        
          let _t = [_t_mid, _t_mid + this.delta ];
          _t = _via_util_float_arr_to_fixed(_t, 3);
          
          const { mid: tmid } = await this.d.metadata_add(vid, _t, [], {[aid]: track_mid}); 
          this.tracks[track_mid].update(
            mid,
            segment_mid,
            tmid
          );
          metadata[mid]['segment_mid'] = tmid;
          Tracker.segment_mid = tmid;
        }
        Tracker.last_success_time = currentTime;
      }
  
      let should_seek = (currentTime + this.delta + 1e-3 < boundary_ts);
      
      if (!should_seek) {
        Tracker.reset_tracker();
        video.currentTime = Tracker.last_success_time;
        return;
      }
      video.currentTime += this.delta;
      console.timeEnd('frame');

    }
  
    return seekListener;
  };
  handle_metadata_add_rect(event_payload) {
    const { vid, mid } = event_payload;
    const { z, root_mid } = this.d.store.metadata[mid];
    if (!root_mid) {
      // Added by user - Create a temporal segment

      // TODO: Infer aid from metadata added, barring default attributes
      const { groupby_aid: aid } = this.ts;

      // Get time of box being added.
      let _t = [ z[0] ];
      _t[1] = _t[0] + this.delta - 1e-3;

      _t = _via_util_float_arr_to_fixed(_t, 3);
      
      const _m = {}
      _m[aid] = mid;

      // Add temporal segment and set the segment_mid of box
      this.d.metadata_add(vid, _t, [], _m, {root_mid: mid}).then(res => {
        this.tracks[mid] = new Track(mid, res.mid)
        this.d.store.metadata[mid]['segment_mid'] = res.mid;
        // Tracker will be reset during the update call
        this.d.metadata_update_av(vid, mid, aid, mid);
      });
    }
  }

  handle_metadata_update_rect(event_payload) {
    const { vid, mid } = event_payload;
    let { xy, z, root_mid, segment_mid } = this.d.store.metadata[mid];
    let { z: z_segment, av: av_segment } = this.d.store.metadata[segment_mid];

    if (!root_mid) {
      // If a user-added box is modified before tracking,
      // root_mid will still be null.
      root_mid = mid;
    }

    // Get timestamps of segment and box
    let _t = z_segment.slice(0);
    const _t_mid = z[0];

    // Get frame and box
    this.bctx.drawImage(this.video, 0, 0, this.bcanvas.width, this.bcanvas.height);
    const frame = this.bctx.getImageData(0, 0, this.bcanvas.width, this.bcanvas.height);
   
    const [ _x, _y, _w, _h ] = xy.slice(1).map(el => Math.floor(this.scale * el));

    // Update tracks
    if (_t[0] !== _t_mid) {
      // Update segment
      this.d.metadata_update_zi( 
        vid,
        segment_mid,
        1,
        _t_mid - this.delta
      );
    
      _t[0] = _t_mid;
      _t = _via_util_float_arr_to_fixed(_t, 3);
    
      this.d.metadata_add(vid, _t, [], av_segment,{root_mid}).then((res) => {
        this.tracks[root_mid].update(
          mid,
          segment_mid,
          res.mid
        );
        this.d.store.metadata[mid]['segment_mid'] = res.mid;
        Tracker.reset(
          frame.data,
          { x: _x, y: _y, width: _w, height: _h},
          root_mid,
          res.mid,
        );
      });
    } else {
      Tracker.reset(
        frame.data, 
        { x: _x, y: _y, width: _w, height: _h},
        root_mid,
        segment_mid,
      );
    }
  }

  handle_metadata_delete_rect(event_payload) {
    const { mid, val } = event_payload;

    const { root_mid, segment_mid } = val;
    this.tracks[root_mid].delete(mid, segment_mid);

    // TODO Update temporal segment based on the remaining mid in segment 
  }

  handle_metadata_delete_segment(event_payload) {
    const { vid, mid, val } = event_payload;

    const { root_mid } = val;
    const segment = this.tracks[root_mid].delete_segment(mid);

    this.d.metadata_delete_bulk(vid, segment, true);
  }

  // TODO handle track delete

  metadata_handler (data, event_payload) {
    // Ignore metadata added to some other file annotator and segmenter
    const { mid, vid } = event_payload;
    if (vid !== this.vid) {
      return;
    }

    if (data === 'metadata_delete') {
      const { xy, z } = event_payload.val;
      if (xy.length && xy[0] === 2 && z.length === 1) {
        // Rectangle was deleted
        this.handle_metadata_delete_rect(event_payload);
      } else if (xy.length === 0 && z.length === 2) {
        // Temporal segment was deleted
        this.handle_metadata_delete_segment(event_payload);
      }    
      return;  
    }

    const { xy, z } = this.d.store.metadata[mid];
    switch (data) {
      case 'metadata_add':
        if (xy.length && xy[0] === 2 && z.length === 1) {
          // Rectangle was added
          this.handle_metadata_add_rect(event_payload);
        }
        break;
      case 'metadata_update':
        if (xy.length && xy[0] === 2 && z.length === 1) {
          // Rectangle was updated
          this.handle_metadata_update_rect(event_payload);
        }
        break;
      default:
        console.log(data);
    }    
  }

  keydown_handler (e) {
    if (this.tracking) {
      if (e.key !== 'Escape') {
        return false;
      }
      // Escape is pressed when tracking is in progress - reset the tracker
      this.reset_tracker();
      return false;
    }

    if (e.key === 't') {
      const seekListener = this.get_seek_listener(this.vid);
      if (!seekListener) {
        _via_util_msg_show('cannot start tracking without initialisation');
        return false;
      }
      e.preventDefault();
      this.video.addEventListener('seeked', seekListener);
      this.video.currentTime += this.delta;
      return false;
    }
    return true;
  }
}