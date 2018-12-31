/**
 *
 * @class
 * @classdesc Attribute
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 31 Dec. 2018
 *
 */

function _via_attribute(id, name, desc, type, options, default_option_id) {
  this.id = id;
  this.attr_name = name;
  this.desc = desc;
  this.type = type;
  if ( typeof(options) === 'undefined' ) {
    this.options = {};
  } else {
    this.options = options;
  }
  if ( typeof(default_option_id) === 'undefined' ) {
    this.default_option_id = '';
  } else {
    this.default_option_id = default_option_id;
  }
}

_via_attribute.prototype.TYPE = { 'TEXT':1, 'CHECKBOX':2, 'RADIO':3, 'DROPDOWN':4, 'IMAGE':5 };

_via_attribute.prototype.option_add = function(option_id, option_value, is_default=false) {
  this.options[option_id] = option_value;
  if ( is_default ) {
    this.default_option_id = option_id;
  }
}

_via_attribute.prototype.html = function() {
  switch(this.type) {
  case this.TYPE.TEXT:
    var el = document.createElement('input');
    el.setAttribute('type', 'text');
    el.setAttribute('name', this.attr_name);
    el.setAttribute('id', this.html_id());
    return el;
    break;

  case this.TYPE.DROPDOWN:
    var el = document.createElement('select');
    el.setAttribute('name', this.attr_name);
    el.setAttribute('id', this.html_id());
    var oid;
    for ( oid in this.options ) {
      var oi = document.createElement('option');
      oi.setAttribute('value', oid);
      oi.innerHTML = this.options[oid];
      el.appendChild(oi);
    }
    return el;
    break;
  }
}

_via_attribute.prototype.html_id = function() {
  return 'at_' + this.id;
}
