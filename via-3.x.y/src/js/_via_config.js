'use strict'

const _VIA_NAME = 'VGG Image Annotator';
const _VIA_NAME_SHORT = 'VIA';
const _VIA_VERSION = '3.0.10';
const _VIA_URL_CODE_REPO = 'https://gitlab.com/vgg/via';
const _VIA_URL_PROJECT_PAGE = 'https://www.robots.ox.ac.uk/~vgg/software/via/';

const _VIA_CONFIG = { MSG_TIMEOUT:3000 };

// VIA Project Server (VPS)
// Use the https://zeus.robots.ox.ac.uk/via/store/3.x.y/ by default
// For older versions, the http://zeus.robots.ox.ac.uk/via/store/3.x.y/ remains available
// to host your own server, see https://gitlab.com/vgg/vps
const _VIA_REMOTE_STORE = 'https://zeus.robots.ox.ac.uk/via/store/3.x.y/';
//const _VIA_REMOTE_STORE = 'http://zeus.robots.ox.ac.uk/via/store/3.x.y/'; // use if http:// only access is required
const _VIA_REMOTE_TIMEOUT = 6000; // in milliseconds
//const _VIA_REMOTE_STORE = 'http://localhost:9669/'; // for debug

const _VIA_DEFAULT_ATTRIBUTE_ANCHOR_ID = '';

var _VIA_FLOAT_FIXED_POINT = 5; // floats are stored as 5 decimal places
var _VIA_SPATIAL_REGION_MOVE_DELTA = 10; // in pixels
var _VIA_SPATIAL_REGION_LABEL_MAXLENGTH = 12; // in characters
var _VIA_SPATIAL_REGION_LABEL_FONT = '12px Sans';
