/**
 * @class
 * @classdesc Editor for metadata and attributes
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 14 Jan. 2019
 */
function _via_editor(data, view_annotator, container) {
  this._ID = '_via_editor';
  this.d  = data;
  this.va = view_annotator;
  this.c  = container;

  // initialise event listeners
  this.d.on_event('file_show', this._ID, this.on_event_file_show.bind(this));
  this.d.on_event('metadata_add', this._ID, this.on_event_metadata_add.bind(this));
  this.d.on_event('metadata_del', this._ID, this.on_event_metadata_del.bind(this));
  this.d.on_event('attribute_update', this._ID, this.on_event_attribute_update.bind(this));
  this.d.on_event('attribute_del', this._ID, this.on_event_attribute_del.bind(this));
  this.d.on_event('attribute_add', this._ID, this.on_event_attribute_add.bind(this));
}

_via_editor.prototype.TYPE = { 'METADATA':2, 'ATTRIBUTE':3 };


_via_editor.prototype.toggle = function() {
  if ( this.c.classList.contains('hide') ) {
    this.show();
  } else {
    this.hide();
  }
}

_via_editor.prototype.hide = function() {
  this.c.innerHTML = '';
  this.c.classList.add('hide');
}
_via_editor.prototype.show = function() {
  this.c.classList.remove('hide');

  // top line: editor content selector {metadata, attribute}
  this.editor_content_selector = document.createElement('div');
  this.editor_content_selector.setAttribute('class', 'editor_content_selector');
  var title = document.createElement('span');
  title.innerHTML = 'Show: ';
  this.edit_metadata_checkbox = document.createElement('input');
  this.edit_metadata_checkbox.setAttribute('name', 'metadata');
  this.edit_metadata_checkbox.setAttribute('type', 'checkbox');
  this.edit_metadata_checkbox.addEventListener('change', this.on_editor_content_select.bind(this));
  var edit_metadata_label = document.createElement('label');
  edit_metadata_label.innerHTML = 'Metadata';
  edit_metadata_label.setAttribute('for', 'metadata');
  edit_metadata_label.setAttribute('title', 'Metadata corresponds to values assigned by user for the attributes.');

  this.edit_attribute_checkbox = document.createElement('input');
  this.edit_attribute_checkbox.setAttribute('name', 'attribute');
  this.edit_attribute_checkbox.setAttribute('type', 'checkbox');
  this.edit_attribute_checkbox.addEventListener('change', this.on_editor_content_select.bind(this));
  var edit_attribute_label = document.createElement('label');
  edit_attribute_label.innerHTML = 'Attribute';
  edit_attribute_label.setAttribute('for', 'attribute');
  edit_attribute_label.setAttribute('title', 'Attribute corresponds to fields like name, color, etc. required to describe the region of interest');

  this.editor_content_selector.appendChild(title);
  this.editor_content_selector.appendChild(this.edit_attribute_checkbox);
  this.editor_content_selector.appendChild(edit_attribute_label);
  this.editor_content_selector.appendChild(this.edit_metadata_checkbox);
  this.editor_content_selector.appendChild(edit_metadata_label);

  // toolbar
  var toolbar = document.createElement('div');
  toolbar.setAttribute('class', 'toolbar');
  var close_button = document.createElement('button');
  close_button.setAttribute('class', 'text_button');
  close_button.innerHTML = '&times;';
  close_button.addEventListener('click', this.toggle.bind(this));
  toolbar.appendChild(close_button);

  // metadata
  this.metadata_container = document.createElement('div');
  this.metadata_container.setAttribute('id', 'metadata_container');
  this.metadata_container.setAttribute('class', 'metadata_container');
  this.metadata_view = document.createElement('table');
  var metadata_title = document.createElement('h2');
  metadata_title.innerHTML = 'Metadata';
  this.metadata_container.appendChild( metadata_title );
  this.metadata_container.appendChild( this.metadata_view );

  // attribute
  this.attribute_container = document.createElement('div');
  this.attribute_container.setAttribute('id', 'attribute_container');
  this.attribute_container.setAttribute('class', 'attribute_container');
  this.attribute_view = document.createElement('table');
  var attribute_title = document.createElement('h2');
  attribute_title.innerHTML = 'Attributes';

  this.attribute_container.appendChild( attribute_title );
  this.attribute_container.appendChild( this.get_attribute_name_entry_panel() );
  this.attribute_container.appendChild( this.attribute_view );

  this.content_container = document.createElement('div');
  this.content_container.setAttribute('class', 'content_container');
  this.content_container.appendChild(this.attribute_container);
  this.content_container.appendChild(this.metadata_container);

  // add everything to container
  this.c.appendChild(toolbar);
  //this.c.appendChild(this.editor_content_selector);
  this.c.appendChild(this.content_container);

  this.attributes_update();
  //this.metadata_update();

  // initial state of content
  this.edit_metadata_checkbox.checked = true;
  this.metadata_container.classList.add('hide');
  this.edit_attribute_checkbox.checked = true;
  this.attribute_container.classList.remove('hide');
}

//
// Editor content selector
//
_via_editor.prototype.on_editor_content_select = function(selector) {
  var element;
  switch(selector.target.name) {
  case 'metadata':
    element = this.metadata_container;
    break;
  case 'attribute':
    element = this.attribute_container;
    break;
  }

  if ( selector.target.checked ) {
    element.classList.remove('hide');
  } else {
    element.classList.add('hide');
  }
}

//
// metadata
//
_via_editor.prototype.metadata_clear = function() {
  this.metadata_view.innerHTML = '';
}

_via_editor.prototype.metadata_update = function() {
  this.metadata_clear();

  if ( this.va.vid ) {
    // fetch all metadata associated with this.va.vid
    this.d._cache_update_mid_list();
    var metadata_count = this.d.cache.mid_list[this.va.vid].length;
    console.log(metadata_count)
    if ( metadata_count ) {
      // add header
      this.metadata_view.appendChild( this.get_metadata_header() );

      // add each metadata
      var tbody = document.createElement('tbody');
      var metadata_index = 1;
      var mid;
      for ( var mindex in this.d.cache.mid_list[this.va.vid] ) {
        mid = this.d.cache.mid_list[this.va.vid][mindex];
        tbody.appendChild( this.metadata_get(mid, metadata_index) );
        metadata_index = metadata_index + 1;
      }
      this.metadata_view.appendChild(tbody);
    } else {
      this.metadata_view.innerHTML = '<tr><td>No metadata added yet!</td></tr>';
    }
  } else {
    this.metadata_view.innerHTML = '<tr><td><i>No metadata added yet!</i></td></tr>';
  }
}

_via_editor.prototype.metadata_get = function(mid, metadata_index) {
  var tr = document.createElement('tr');
  tr.setAttribute('data-mid', mid);

  // column: the action tools for metadata (like delete)
  var action_tools_container = document.createElement('td');
  this.get_metadata_action_tools(action_tools_container, mid);
  tr.appendChild( action_tools_container );

  // column: index of this metadata
  var metadata_index_container = document.createElement('td');
  metadata_index_container.innerHTML = metadata_index;
  metadata_index_container.setAttribute('title', mid);
  tr.appendChild(metadata_index_container);

  // column: z (temporal coordinate)
  var tcoordinate = document.createElement('td');
  tcoordinate.innerHTML = this.d.store.metadata[mid].z.join(', ');
  tr.appendChild(tcoordinate);

  // column: xy (spatial coordinate)
  var scoordinate = document.createElement('td');
  scoordinate.innerHTML = this.d.store.metadata[mid].xy.join(', ');
  tr.appendChild(scoordinate);

  // subsequent columns: what (i.e. the attributes for this metadata)
  for ( var aid in this.d.store.attribute ) {
    var td = document.createElement('td');
    td.appendChild( this.get_attribute_html_element(mid, aid) );
    tr.appendChild(td);
  }

  return tr;
}

_via_editor.prototype.get_metadata_action_tools = function(container, mid) {
  var del = _via_util_get_svg_button('micon_delete', 'Delete Metadata');
  del.setAttribute('data-mid', mid);
  del.addEventListener('click', this.metadata_del.bind(this));
  container.appendChild(del);

  /*
  var edit = _via_util_get_svg_button('micon_edit', 'Select Metadata for Editing');
  edit.setAttribute('data-fid', fid);
  edit.setAttribute('data-mid', mid);
  edit.addEventListener('click', this.metadata_edit.bind(this));
  container.appendChild(edit);
  */
}

_via_editor.prototype.get_metadata_header = function() {
  var tr = document.createElement('tr');
  tr.appendChild( this.html_element('th', '') );
  tr.appendChild( this.html_element('th', '#') );
  tr.appendChild( this.html_element('th', 'Temporal Coordinate') );
  tr.appendChild( this.html_element('th', 'Spatial Coordinate') );

  for ( var aid in this.d.store.attribute ) {
    tr.appendChild( this.html_element('th',
                                      this.d.store.attribute[aid].aname)
                  );
  }

  var thead = document.createElement('thead');
  thead.appendChild(tr);
  return thead;
}

_via_editor.prototype.html_element = function(name, text) {
  var e = document.createElement(name);
  e.innerHTML = text;
  return e;
}

//
// Metadata preview
//

_via_editor.prototype.jump_to_metadata = function(e) {
  var fid = e.target.dataset.fid;
  var mid = e.target.dataset.mid;
  var where_index = e.target.dataset.where_index;
  if ( this.d.metadata_store[fid][mid].where_target() === _VIA_WHERE_TARGET.SEGMENT &&
       this.d.metadata_store[fid][mid].where_target() === _VIA_WHERE_SHAPE.TIME
     ) {
    this.a.preload[fid].media_annotator.media.currentTime = this.d.metadata_store[fid][mid].where[where_index];
  }
}

//
// attribute
//
_via_editor.prototype.attribute_clear = function() {
  this.attribute_view.innerHTML = '';
}

_via_editor.prototype.attributes_update = function() {
  if ( this.c.classList.contains('hide') ) {
    return;
  }

  this.attribute_clear();

  if ( Object.keys(this.d.store.attribute).length ) {
    this.attribute_view.appendChild( this.get_attribute_header() );

    // add each metadata
    var tbody = document.createElement('tbody');
    for ( var aid in this.d.store.attribute ) {
      tbody.appendChild( this.get_attribute(aid) );
    }
    this.attribute_view.appendChild(tbody);
  }
}

_via_editor.prototype.get_attribute_header = function() {
  var tr = document.createElement('tr');
  tr.appendChild( this.html_element('th', '') );
  tr.appendChild( this.html_element('th', 'Id') );
  tr.appendChild( this.html_element('th', 'Name') );
  tr.appendChild( this.html_element('th', 'Anchor') );
  tr.appendChild( this.html_element('th', 'Input Type') );
  tr.appendChild( this.html_element('th', 'Description') );
  tr.appendChild( this.html_element('th', 'Options') );
  tr.appendChild( this.html_element('th', 'Default Value') );
  tr.appendChild( this.html_element('th', 'Preview') );

  var thead = document.createElement('thead');
  thead.appendChild(tr);
  return thead;
}

_via_editor.prototype.get_attribute = function(aid) {
  var tr = document.createElement('tr');
  tr.setAttribute('data-aid', aid);

  // column: the action tools for metadata (like delete)
  var action_tools_container = document.createElement('td');
  this.get_attribute_action_tools(action_tools_container, aid);
  tr.appendChild( action_tools_container );

  // column: aid (i.e. attribute id)
  tr.appendChild( this.html_element('td', aid) );

  // column: name
  var aname_container = document.createElement('td');
  var aname = document.createElement('input');
  aname.setAttribute('type', 'text');
  aname.setAttribute('data-aid', aid);
  aname.setAttribute('data-varname', 'aname');
  aname.setAttribute('value', this.d.store.attribute[aid].aname);
  aname.addEventListener('change', this.attribute_on_change.bind(this));
  aname_container.appendChild(aname);
  tr.appendChild(aname_container);

  // column: anchor
  var anchor_select = document.createElement('select');
  anchor_select.setAttribute('data-aid', aid);
  anchor_select.setAttribute('data-varname', 'anchor_id');
  anchor_select.setAttribute('style', 'width:12em;');
  anchor_select.addEventListener('change', this.attribute_on_change.bind(this));
  var option_selected = false;
  for ( var anchor_id in _VIA_ATTRIBUTE_ANCHOR ) {
    if ( _VIA_ATTRIBUTE_ANCHOR[anchor_id] !== '__FUTURE__' ) {
      var oi = document.createElement('option');
      oi.setAttribute('value', anchor_id);
      oi.innerHTML = _VIA_ATTRIBUTE_ANCHOR[anchor_id];

      if ( anchor_id === this.d.store.attribute[aid].anchor_id ) {
        oi.setAttribute('selected', '');
        option_selected = true;
      }
      anchor_select.appendChild(oi);
    }
  }
  var anchor = document.createElement('td');
  anchor.appendChild( anchor_select );
  tr.appendChild( anchor );
  if ( ! option_selected ) {
    anchor_select.selectedIndex = -1;
  }

  // column: input type
  var type_select = document.createElement('select');
  type_select.setAttribute('data-aid', aid);
  type_select.setAttribute('data-varname', 'type');
  type_select.addEventListener('change', this.attribute_update_type.bind(this));
  var type_str;
  for ( type_str in _VIA_ATTRIBUTE_TYPE ) {
    var oi = document.createElement('option');
    oi.setAttribute('value', _VIA_ATTRIBUTE_TYPE[type_str]);
    oi.innerHTML = type_str;

    if ( _VIA_ATTRIBUTE_TYPE[type_str] === this.d.store.attribute[aid].type ) {
      oi.setAttribute('selected', '');
    }
    type_select.appendChild(oi);
  }
  var type = document.createElement('td');
  type.appendChild( type_select );
  tr.appendChild( type );

  // column: description
  var desc_container = document.createElement('td');
  var desc = document.createElement('input');
  desc.setAttribute('type', 'text');
  desc.setAttribute('data-aid', aid);
  desc.setAttribute('data-varname', 'desc');
  desc.setAttribute('value', this.d.store.attribute[aid].desc);
  desc.addEventListener('change', this.attribute_on_change.bind(this));
  desc_container.appendChild(desc);
  tr.appendChild( desc_container );

  // column: options
  if ( this.d.store.attribute[aid].type === _VIA_ATTRIBUTE_TYPE.TEXT ) {
    // text has no defaults
    tr.appendChild( this.html_element('td', '-') );
  } else {
    var option_input = document.createElement('textarea');
    option_input.setAttribute('data-aid', aid);
    option_input.setAttribute('data-varname', 'options');
    option_input.setAttribute('placeholder', 'e.g. a,*b,c,d');
    option_input.setAttribute('title', 'Enter options as comma separated value with the default option prefixed using an *. For example: "a,*b,c"');
    option_input.addEventListener('change', this.attribute_on_change.bind(this));
    option_input.innerHTML = _via_util_obj_to_csv(this.d.store.attribute[aid].options,
                                                  this.d.store.attribute[aid].default_option_id);
    tr.appendChild( option_input );
  }

  // column: default value (only if other than TEXT)
  if ( this.d.store.attribute[aid].type === _VIA_ATTRIBUTE_TYPE.TEXT ) {
    // text has no defaults
    tr.appendChild( this.html_element('td', '-') );
  } else {
    var default_value = this.d.store.attribute[aid].options[ this.d.store.attribute[aid].default_option_id ];
    if ( typeof(default_value) === 'undefined' ) {
      tr.appendChild( this.html_element('td', 'Not Defined') );
    } else {
      tr.appendChild( this.html_element('td', default_value) );
    }
  }

  // column: preview of attribute
  var preview = document.createElement('td');
  preview.appendChild( this.get_attribute_html_element(aid) );
  tr.appendChild(preview);

  return tr;
}

_via_editor.prototype.get_attribute_html_element = function(aid) {
  var dval  = this.d.store.attribute[aid].default_option_id;
  var atype = this.d.store.attribute[aid].type;
  var el;

  switch(atype) {
  case _VIA_ATTRIBUTE_TYPE.TEXT:
    el = document.createElement('textarea');
    break;

  case _VIA_ATTRIBUTE_TYPE.SELECT:
    el = document.createElement('select');

    for ( var oid in this.d.store.attribute[aid].options ) {
      var oi = document.createElement('option');
      oi.setAttribute('value', oid);
      oi.innerHTML = this.d.store.attribute[aid].options[oid];
      if ( oid === this.d.store.attribute[aid].default_option_id ) {
        oi.setAttribute('selected', 'true');
      }
      el.appendChild(oi);
    }
    break;

  case _VIA_ATTRIBUTE_TYPE.RADIO:
    el = document.createElement('div');

    for ( var oid in this.d.store.attribute[aid].options ) {
      var radio = document.createElement('input');
      radio.setAttribute('type', 'radio');
      radio.setAttribute('value', oid);
      radio.setAttribute('data-aid', aid);
      radio.setAttribute('name', this.d.store.attribute[aid].aname);
      if ( oid === this.d.store.attribute[aid].default_option_id ) {
        radio.setAttribute('checked', 'true');
      }

      var label = document.createElement('label');
      label.innerHTML = this.d.store.attribute[aid].options[oid];

      var br = document.createElement('br');
      el.appendChild(radio);
      el.appendChild(label);
      el.appendChild(br);
    }
    break;

  case _VIA_ATTRIBUTE_TYPE.CHECKBOX:
    el = document.createElement('div');

    for ( var oid in this.d.store.attribute[aid].options ) {
      var checkbox = document.createElement('input');
      checkbox.setAttribute('type', 'checkbox');
      checkbox.setAttribute('value', oid);
      checkbox.setAttribute('data-aid', aid);
      checkbox.setAttribute('name', this.d.store.attribute[aid].aname);
      if ( oid === this.d.store.attribute[aid].default_option_id ) {
        checkbox.setAttribute('checked', 'true');
      }

      var label = document.createElement('label');
      label.innerHTML = this.d.store.attribute[aid].options[oid];

      var br = document.createElement('br');
      el.appendChild(checkbox);
      el.appendChild(label);
      el.appendChild(br);
    }
    break;

  default:
    console.log('attribute type ' + atype + ' not implemented yet!');
    var el = document.createElement('span');
    el.innerHTML = aval;
  }
  el.setAttribute('data-aid', aid);
  return el;
}

_via_editor.prototype.get_attribute_name_entry_panel = function() {
  var c = document.createElement('div');
  c.setAttribute('class', 'attribute_entry');

  this.new_attribute_name_input = document.createElement('input');
  this.new_attribute_name_input.setAttribute('type', 'text');
  this.new_attribute_name_input.setAttribute('placeholder', 'name of new attribute');
  c.appendChild(this.new_attribute_name_input);

  var add = document.createElement('button');
  add.setAttribute('class', 'text-button');
  add.innerHTML = 'Create';
  add.addEventListener('click', this.on_attribute_create.bind(this));
  c.appendChild(add);

  return c;
}

_via_editor.prototype.get_attribute_action_tools = function(container, aid) {
  var del = _via_util_get_svg_button('micon_delete', 'Delete Attribute');
  del.setAttribute('data-aid', aid);
  del.addEventListener('click', this.attribute_del.bind(this));
  container.appendChild(del);
}

_via_editor.prototype.update_attribute_for = function(aid) {
  var tbody = this.attribute_view.getElementsByTagName('tbody')[0];
  var n = tbody.childNodes.length;
  var i;
  for ( i = 0; i < n; ++i ) {
    if ( tbody.childNodes[i].dataset.aid === aid ) {
      var new_attribute = this.get_attribute(aid);
      tbody.replaceChild( new_attribute, tbody.childNodes[i] );
      break;
    }
  }
}

_via_editor.prototype.attribute_on_change = function(e) {
  var varname = e.target.dataset.varname;
  var vartype = e.target.type;
  var aid = e.target.dataset.aid;

  switch(vartype) {
  case 'text':
    this.d.store.attribute[aid][varname] = e.target.value;
    break;
  case 'textarea':
    if ( varname === 'options' ) {
      var options_csv = e.target.value;
      this.d.attribute_update_options_from_csv(aid, options_csv).then(function(ok) {
      }.bind(this));
    }
    break;
  case 'select':
  case 'select-one':
    if ( varname === 'anchor_id' ) {
      var new_anchor_id = e.target.options[e.target.selectedIndex].value;
      this.d.attribute_update_anchor_id(aid, new_anchor_id);
    }
    break;
  default:
    console.warn('Unknown varname=' + varname + ', vartype=' + vartype);
  }

  this.attributes_update();
}

//
// Listeners for data update events
//
_via_editor.prototype.metadata_del = function(e) {
  var fid = e.currentTarget.dataset.fid;
  var mid = e.currentTarget.dataset.mid;
  this.d.metadata_del(fid, mid).then( function(ok) {
    // we don't need to do anything when metadata delete is successful
  }.bind(this), function(err) {
    console.log(err)
  }.bind(this));
}

_via_editor.prototype.metadata_edit = function(e) {
  var fid = e.target.parentNode.dataset.fid;
  var mid = e.target.parentNode.dataset.mid;
  console.log('@todo: edit metadata: fid=' + fid + ', mid=' + mid);
}

_via_editor.prototype.on_attribute_create = function(e) {
  var new_attribute_name = this.new_attribute_name_input.value;
  this.d.attribute_add(new_attribute_name,
                       _VIA_DEFAULT_ATTRIBUTE_ANCHOR_ID,
                       _VIA_ATTRIBUTE_TYPE.TEXT).then( function(ok) {
    this.attributes_update();
    // attribute was added
  }.bind(this), function(err) {
    console.log(err);
  }.bind(this));
}

_via_editor.prototype.attribute_del = function(e) {
  var aid = e.currentTarget.dataset.aid;
  this.d.attribute_del(aid).then( function(ok) {
    // we don't need to do anything when attribute delete is successful
  }.bind(this), function(err) {
    console.log(err)
  }.bind(this));
}

_via_editor.prototype.attribute_update_options = function(e) {
  var aid = e.target.dataset.aid;
  var new_options_csv = e.target.value;
  this.d.attribute_update_options(aid, new_options_csv);
}

_via_editor.prototype.attribute_update_type = function(e) {
  var aid = e.target.dataset.aid;
  var new_type = parseInt(e.target.options[ e.target.selectedIndex ].value);
  this.d.attribute_update_type(aid, new_type);
}

_via_editor.prototype.on_event_attribute_update = function(data, event_payload) {
  this.attributes_update();
}

_via_editor.prototype.on_event_attribute_del = function(data, event_payload) {
  this.attributes_update();
}

_via_editor.prototype.on_event_attribute_add = function(data, event_payload) {
  this.attributes_update();
}

_via_editor.prototype.on_event_metadata_add = function(data, event_payload) {
  //this.metadata_update();
}

_via_editor.prototype.on_event_metadata_del = function(data, event_payload) {
  //this.metadata_update();
}

_via_editor.prototype.on_event_file_show = function(data, event_payload) {
  //this.metadata_update();
}
