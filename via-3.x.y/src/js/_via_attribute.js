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
  'FILE1_Z0_XY0':'Attribute of a File (e.g. image caption)',
  'FILE1_Z0_XY1':'Spatial Region in an Image (e.g. bounding box of an object)',
  'FILE1_Z0_XYN':'__FUTURE__',   // File region composed of multiple disconnected regions
  'FILE1_Z1_XY0':'__FUTURE__',   // Time marker in video or audio (e.g tongue clicks, speaker diarisation)
  'FILE1_Z1_XY1':'Spatial Region in a Video Frame (e.g. bounding box of an object)',
  'FILE1_Z1_XYN':'__FUTURE__',   // A video frame region composed of multiple disconnected regions
  'FILE1_Z2_XY0':'Temporal Segment in Video or Audio (e.g. video segment containing an actor)',
  'FILE1_Z2_XY1':'__FUTURE__',   // A region defined over a temporal segment
  'FILE1_Z2_XYN':'__FUTURE__',   // A temporal segment with regions defined for start and end frames
  'FILE1_ZN_XY0':'__FUTURE__',   // ? (a possible future use case)
  'FILE1_ZN_XY1':'__FUTURE__',   // ? (a possible future use case)
  'FILE1_ZN_XYN':'__FUTURE__',   // ? (a possible future use case)
  'FILEN_Z0_XY0':'Attribute of a Group of Files (e.g. given two images, which is more sharp?)',
  'FILEN_Z0_XY1':'__FUTURE__',   // ? (a possible future use case)
  'FILEN_Z0_XYN':'__FUTURE__',   // one region defined for each file (e.g. an object in multiple views)
  'FILEN_Z1_XY0':'__FUTURE__',   // ? (a possible future use case)
  'FILEN_Z1_XY1':'__FUTURE__',   // ? (a possible future use case)
  'FILEN_Z1_XYN':'__FUTURE__',   // ? (a possible future use case)
  'FILEN_Z2_XY0':'__FUTURE__',   // ? (a possible future use case)
  'FILEN_Z2_XY1':'__FUTURE__',   // ? (a possible future use case)
  'FILEN_Z2_XYN':'__FUTURE__',   // ? (a possible future use case)
  'FILEN_ZN_XY0':'__FUTURE__',   // one timestamp for each video or audio file (e.g. for alignment)
  'FILEN_ZN_XY1':'__FUTURE__',   // ? (a possible future use case)
  'FILEN_ZN_XYN':'__FUTURE__',   // a region defined in a video frame of each video
};

function _via_attribute(name, anchor_id, type, desc, options, default_option_id) {
  this.aname     = name;
  this.anchor_id = anchor_id;
  this.type      = type;
  this.desc      = desc;
  this.options   = options;
  this.default_option_id = default_option_id;
}

