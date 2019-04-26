/**
 *
 * @class
 * @classdesc Attribute
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 31 Dec. 2018
 *
 */

'use strict'

const _VIA_ATTRIBUTE_TYPE = { 'TEXT':1, 'CHECKBOX':2, 'RADIO':3, 'SELECT':4, 'IMAGE':5 };

const _VIA_ATTRIBUTE_ANCHOR = {
  'FILE1_Z0_XY0':[ 1, 0, 0],   // File attribute (e.g. image caption)
  'FILE1_Z0_XY1':[ 1, 0, 1],   // File region attribute (e.g. object name)
  'FILE1_Z0_XYN':[ 1, 0,-1],   // File region composed of multiple disconnected regions
  'FILE1_Z1_XY0':[ 1, 1, 0],   // Time marker in video or audio (e.g tongue clicks, speaker diarisation)
  'FILE1_Z1_XY1':[ 1, 1, 1],   // A video frame region
  'FILE1_Z1_XYN':[ 1, 1,-1],   // A video frame region composed of multiple disconnected regions
  'FILE1_Z2_XY0':[ 1, 2, 0],   // Temporal segment (start-time, end-time) in video or audio
  'FILE1_Z2_XY1':[ 1, 2, 1],   // A region defined over a temporal segment
  'FILE1_Z2_XYN':[ 1, 2,-1],   // A temporal segment with regions defined for start and end frames
  'FILE1_ZN_XY0':[ 1,-1, 0],   // ? (a possible future use case)
  'FILE1_ZN_XY1':[ 1,-1, 1],   // ? (a possible future use case)
  'FILE1_ZN_XYN':[ 1,-1,-1],   // ? (a possible future use case)
  'FILEN_Z0_XY0':[-1, 0, 0],   // Attribute of a group of files (e.g. distance between two images)
  'FILEN_Z0_XY1':[-1, 0, 1],   // ? (a possible future use case)
  'FILEN_Z0_XYN':[-1, 0,-1],   // one region defined for each file (e.g. an object in multiple views)
  'FILEN_Z1_XY0':[-1, 0, 0],   // ? (a possible future use case)
  'FILEN_Z1_XY1':[-1, 0, 1],   // ? (a possible future use case)
  'FILEN_Z1_XYN':[-1, 0,-1],   // ? (a possible future use case)
  'FILEN_Z2_XY0':[-1, 0, 0],   // ? (a possible future use case)
  'FILEN_Z2_XY1':[-1, 0, 1],   // ? (a possible future use case)
  'FILEN_Z2_XYN':[-1, 0,-1],   // ? (a possible future use case)
  'FILEN_ZN_XY0':[-1, 0, 0],   // one timestamp for each video or audio file (e.g. for alignment)
  'FILEN_ZN_XY1':[-1, 0, 1],   // ? (a possible future use case)
  'FILEN_ZN_XYN':[-1, 0,-1],   // a region defined in a video frame of each video
};

function _via_attribute(name, anchor, type, desc, options, default_option_id) {
  this.aname = name;
  this.anchor = anchor;
  this.type = type;
  this.desc = desc;
  this.options = options;
  this.default_option_id = default_option_id;
}

