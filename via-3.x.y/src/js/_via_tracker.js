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
  constructor(segment_mid = null, mid = null) {
    this.segments = new Map();
    this.order = [];

    if (segment_mid) {
      this.add_segment(segment_mid);
    }

    if (mid) {
      this.add(mid, segment_mid);
    }
  }

  add_segment(segment_mid, mid_list=[]) {
    this.segments.set(segment_mid, mid_list);
    if(!(this.order.includes(segment_mid))) {
      this.order.push(segment_mid);
    }
  }

  add(mid, segment_mid) {
    this.segments.get(segment_mid).push(mid);
  }

  delete_segment(segment_mid) {
    const segment = this.segments.get(segment_mid);
    if (!segment) {
      // Segment doesn't exist / already deleted
      return [];
    }
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

    const midx = segment.indexOf(mid);
    if (midx === -1) {
      return [];
    }
    // Remove box from segment
    return segment.splice(midx, 1);
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

  sort(d) {
    // Sort segment order
    const cmp = (a, b) => {
      const { z: z_a } = d.store.metadata[a];
      const { z: z_b } = d.store.metadata[b];

      let t0 = z_a[0];
      let t1 = z_b[0];

      if ( typeof(t0) === 'string' ) {
        t0 = parseFloat(t0);
      }
      if ( typeof(t1) === 'string' ) {
        t1 = parseFloat(t1);
      }

      if (t0 === t1) {
        return 0;
      }

      return t0 < t1 ? -1 : 1;
    }
    this.order.sort(cmp);

    this.segments.forEach((val) => {
      val.sort(cmp);
    });
  }
};

class TrackingHandler {
  constructor(vid, video, ts, d) {
    this._ID = 'TrackingHandler';
    this.vid = vid;
    this.video = video;
    this.ts = ts;
    this.d  = d;
    this.overlay = document.getElementById('via_overlay');
    this.overlay.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      return false;
    }

    this.delta = 1/25;
    this.tracking = false;

    this.id2name = {};
    this.name2id = {};
    this.OBJECT_ID = 1;

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
    
    this.tracks = {};
    this.init_tracks();
    
    this.d.on_event('metadata_add', this._ID, this.metadata_handler.bind(this), 'metadata_add');
    this.d.on_event('metadata_update', this._ID, this.metadata_handler.bind(this), 'metadata_update');
    this.d.on_event('metadata_delete', this._ID, this.metadata_handler.bind(this), 'metadata_delete');

    this.d.on_event('metadata_update_bulk', this._ID, this.bulk_metadata_update_segment.bind(this), 'metadata_update_bulk');
    this.d.on_event('metadata_delete_bulk', this._ID, this.bulk_delete_handler.bind(this), 'metadata_delete_bulk');
    this.d.on_event('metadata_delete_all', this._ID, this.bulk_delete_handler.bind(this), 'metadata_delete_all');
  }

  init_tracks() {

    if(!(this.vid in this.d.cache.mid_list)) {
      // Nothing to add
      return;
    }
    // Add all segments and create tracks
    this.d.cache.mid_list[this.vid].filter(_mid => {
      // find readonly segments
      const { xy, z, av: { readonly }} = this.d.store.metadata[_mid];
      if (xy.length === 0 && z.length === 2 && readonly) {
        return true;
      }
      return false;
    }).forEach(mid => {
      // Add them to tracks data structure
      const { root_mid, av } = this.d.store.metadata[mid];
      const { groupby_aid: aid } = this.ts;
      if (!(root_mid in this.tracks)) {
        this.tracks[root_mid] = new Track(mid);
        this.id2name[root_mid] = av[aid];
        this.name2id[av[aid]] = root_mid;
      } else {
        this.tracks[root_mid].add_segment(mid);
      }
    });
    
    // Add all bounding boxes associated to the tracks
    const track_ids = Object.keys(this.tracks);
    this.d.cache.mid_list[this.vid].filter(_mid => {
      // Find the associated box ids
      let { root_mid, segment_mid } = this.d.store.metadata[_mid];
      return ( segment_mid && 
        (track_ids.includes(root_mid)
        || track_ids.includes(_mid)));
    }).forEach(mid => {
      let { root_mid, segment_mid } = this.d.store.metadata[mid];
      if (!root_mid) {
        root_mid = mid;
      }

      this.tracks[root_mid].add(mid, segment_mid);
    });

    // Sort each track segment based on timestamp
    Object.values(this.tracks).forEach(val => {
      val.sort(this.d);
    });
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
        this.overlay.style.display = 'none';
        if (Math.abs(video.duration - video.currentTime) < this.delta) {
          // End of video
          _via_util_msg_show('Reached end of video. Use timeline to seek to point of interest');
        } else {
          _via_util_msg_show('Tracking stopped. Draw / Update box to start / resume tracking', true);
        }
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
          { [aid]: this.id2name[track_mid] },
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
          
          const {av: av_segment} = metadata[segment_mid];
          const { mid: tmid } = await this.d.metadata_add(vid, _t, [], av_segment, {root_mid: track_mid}); 
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
        this.reset_tracker();
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
      
      let object_id = this.OBJECT_ID++;
      let object_name = `Object #${object_id}`;

      if (object_name in this.name2id) {
        // Iterate till we get a non colliding name
        while (!(object_name in this.name2id)) {
          object_id = this.OBJECT_ID++;
          object_name = `Object #${object_id}`;
        }
      }
      const _m = {
        [aid]: object_name,
        readonly: true,
      }

      // Add temporal segment and set the segment_mid of box
      this.d.metadata_add(vid, _t, [], _m, {root_mid: mid}).then(res => {
        this.tracks[mid] = new Track(res.mid, mid)
        this.id2name[mid] = object_name;
        this.name2id[object_name] = mid;
        this.d.store.metadata[mid]['segment_mid'] = res.mid;
        this.d.metadata_update_av(vid, mid, aid, object_name).then(() => {
          // Get frame and box
          this.bctx.drawImage(this.video, 0, 0, this.bcanvas.width, this.bcanvas.height);
          const frame = this.bctx.getImageData(0, 0, this.bcanvas.width, this.bcanvas.height);
          const { xy } = this.d.store.metadata[mid];
          const [ _x, _y, _w, _h ] = xy.slice(1).map(el => Math.floor(this.scale * el));

          Tracker.reset(
            frame.data, 
            { x: _x, y: _y, width: _w, height: _h},
            mid,
            res.mid,
          );
          _via_util_msg_show('Tracking initialised. Press <span class="key">t</span> to continue tracking', true);
        });
      });
    }
  }

  rename_rects_in_segment(mid_list) {
    const { groupby_aid: aid } = this.ts;

    mid_list.forEach(mid => {
      let { root_mid, av } = this.d.store.metadata[mid];
      const new_gid = av[aid];

      if (!(new_gid in this.name2id) && new_gid !== this.id2name[root_mid]){
        const old_gid = this.id2name[root_mid];
        delete this.name2id[old_gid];
        this.name2id[new_gid] = root_mid;
        this.id2name[root_mid] = new_gid;
      }
      const segment = this.tracks[root_mid].segments.get(mid);
      segment.forEach(_mid => {
        this.d.store.metadata[_mid].av[aid] = new_gid;
      });
    });
  }

  move_segment(segment_mid, old_track_id, new_track_id) {
    if (old_track_id === new_track_id) {
      return;
    }
    const { groupby_aid: aid } = this.ts;
    const new_gid = this.id2name[new_track_id];

    // delete the segment in old track
    const segment = this.tracks[old_track_id].delete_segment(segment_mid);
    segment.forEach(_mid => {
      this.d.store.metadata[_mid].av[aid] = new_gid;
      this.d.store.metadata[_mid].root_mid = new_track_id;
    });
    this.d.store.metadata[segment_mid].root_mid = new_track_id;

    // add segment in new track
    this.tracks[new_track_id].add_segment(segment_mid, segment)
    this.tracks[new_track_id].sort(this.d);
  }

  handle_metadata_update_rect(event_payload) {

    // Fired when attribute / xy is updated.
    // TODO - Assumption - assuming this only fires when either
    // xy or attribute is updated. Not handling case where both 
    // of them are updated.

    const { vid, mid } = event_payload;
    let { xy, z, av, root_mid, segment_mid } = this.d.store.metadata[mid];
    let { z: z_segment, av: av_segment } = this.d.store.metadata[segment_mid];

    const { groupby_aid: aid } = this.ts;

    if (!root_mid) {
      // If a user-added box is modified before tracking,
      // root_mid will still be null.
      root_mid = mid;
    }

    // Check if attribute is updated by comparing against
    // id2name lookup table
    if (av[aid] !== this.id2name[root_mid]) {

      // If it doesn't match, move the current segment (and all following segments?)
      // into an existing track if it exists, rename if no track exists
      const old_gid = this.id2name[root_mid];
      const new_gid = av[aid];

      const new_track_id = this.name2id[new_gid];

      if(!new_track_id) {
        // Track doesn't exist - Must be a rename
        delete this.name2id[old_gid];
        this.name2id[new_gid] = root_mid;
        this.id2name[root_mid] = new_gid;

        // Change attributes in all segments and rects
        const segment_list = this.tracks[root_mid].order;
        segment_list.forEach(_segment_mid => {
          this.d.store.metadata[_segment_mid].av[aid] = new_gid;
        });
        this.rename_rects_in_segment(segment_list);

        this.ts._post_tmetadata_group_update_gid(old_gid, new_gid);

      } else {
       
        // Move segment to other track
        this.d.store.metadata[segment_mid].av[aid] = new_gid;
        this.move_segment(segment_mid, root_mid, new_track_id);

        this.ts._post_tmetadata_mid_change_gid(segment_mid, old_gid, new_gid);
        this.ts._tmetadata_group_gid_draw(old_gid);
        this.ts._tmetadata_group_gid_draw(new_gid);
       
        if (
          Tracker.instance
          && Tracker.track_mid === root_mid 
          && Tracker.segment_mid === segment_mid) {
          //Tracker was tracking this segment
          Tracker.track_mid = new_track_id;
        }
      }
      return;
    }
    
    // Handle case where xy is updated
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
        _via_util_msg_show('Tracking initialised. Press <span class="key">t</span> to continue tracking', true);
      });
    } else {
      Tracker.reset(
        frame.data, 
        { x: _x, y: _y, width: _w, height: _h},
        root_mid,
        segment_mid,
      );
      _via_util_msg_show('Tracking initialised. Press <span class="key">t</span> to continue tracking', true);
    }
  }

  handle_metadata_update_segment(event_payload) {
    const { mid } = event_payload;
    let { root_mid, av } = this.d.store.metadata[mid];

    const { groupby_aid: aid } = this.ts;

    const old_gid = this.id2name[root_mid];
    const new_gid = av[aid];

    if (new_gid === old_gid) {
      // Nothing to do.
      return;
    }

    const new_track_id = this.name2id[new_gid];
    this.move_segment(mid, root_mid, new_track_id);
  }

  handle_metadata_delete_rect(event_payload) {
    const { mid } = event_payload;

    if (!(mid in this.d.store.metadata)) {
      // rect already deleted
      return;
    }

    let { root_mid, segment_mid } = this.d.store.metadata[mid];

    if (!root_mid) {
      root_mid = mid;
    }
    this.tracks[root_mid].delete(mid, segment_mid);

    // TODO Update temporal segment based on the remaining mid in segment 
  }

  handle_metadata_delete_segment(event_payload) {
    const { vid, mid } = event_payload;

    if (!(mid in this.d.store.metadata)) {
      // Segment already deleted
      return;
    }
    const { root_mid } = this.d.store.metadata[mid];
    const segment = this.tracks[root_mid].delete_segment(mid);

    this.d.metadata_delete_bulk(vid, segment, true);
  }

  bulk_metadata_update_segment(data, event_payload) {
    const { mid_list, vid } = event_payload;

    if (vid !== this.vid) {
      return;
    }

    if (data !== 'metadata_update_bulk') {
      return;
    }
    
    const filtered_list = mid_list.filter(_mid => {
      const { xy, z, av: { readonly }} = this.d.store.metadata[_mid];
      if (xy.length === 0 && z.length === 2 && readonly) {
        return true;
      }
      return false;
    });

    if (filtered_list.length === 0) {
      // Nothing to do
      return;
    }

    // A bulk update can mean two things
    //  - A rename, where a group doesn't exist and the names are changed
    //  - A move all request, where another group exists and we move all segments
    //    into that
    // We can figure this by checking whether an equivalent track exists

    const segment_mid = filtered_list[0];
    const { root_mid, av } = this.d.store.metadata[segment_mid];
    const { groupby_aid: aid } = this.ts;

    const old_gid = this.id2name[root_mid];
    const new_gid = av[aid];

    if (new_gid === old_gid) {
      // Nothing to do
      return;
    }

    const new_track_id = this.name2id[new_gid];

    if (!new_track_id) {
      // Rename
      this.rename_rects_in_segment(filtered_list);
    } else {
      // Move
      filtered_list.forEach(mid => {
        this.move_segment(mid, root_mid, new_track_id);
      });
    }
  }

  // TODO handle track delete
  bulk_delete_handler(data, event_payload) {
    const { mid_list, vid } = event_payload;
    if (vid !== this.vid) {
      // Ignore metadata added to some other vid
      return;
    }

    if (data === 'metadata_delete_bulk' || data === 'metadata_delete_all') {

      // Handle segments
      mid_list.forEach((mid) => {
        const { xy, z, av: { readonly }} = this.d.store.metadata[mid];

        if (xy.length === 0 && z.length === 2 && readonly) {
          // Delete segment
          this.handle_metadata_delete_segment({vid, mid});
        } else if (xy.length && xy[0] === 2 && z.length === 1) {
          // Delete rect
          this.handle_metadata_delete_rect({vid, mid});
        } else {
          // Ignore
        }
      });
    }
  }
  metadata_handler (data, event_payload) {
    // Ignore metadata added to some other file annotator and segmenter
    const { mid, vid } = event_payload;
    if (vid !== this.vid) {
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
        } else if (xy.length === 0 && z.length === 2) {
          // Timeline segment was updated
          this.handle_metadata_update_segment(event_payload);
        }
        break;
      case 'metadata_delete':
        if (xy.length && xy[0] === 2 && z.length === 1) {
          // Rectangle was deleted
          this.handle_metadata_delete_rect(event_payload);
        } else if (xy.length === 0 && z.length === 2) {
          // Temporal segment was deleted
          this.handle_metadata_delete_segment(event_payload);
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
        _via_util_msg_show('Cannot start tracking without initialisation');
        return false;
      }
      e.preventDefault();
      this.video.addEventListener('seeked', seekListener);
      _via_util_msg_show('Tracking in progress, press <span class="key">Esc</span> to cancel', true);
      this.overlay.style.display = 'block';
      this.video.currentTime += this.delta;
      return false;
    }
    return true;
  }

  clear() {
    this.d.clear_events(this._ID);
    this.reset_tracker();
    this.overlay.style.display = 'none';
  }
}