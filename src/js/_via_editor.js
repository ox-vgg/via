/**
 * @class
 * @classdesc Editor for metadata and attributes
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @since 14 Jan. 2019
 */
function _via_editor(container, data, annotator) {
  this.c = container;
  this.d = data;
  this.a = annotator;

  if ( typeof(this.c.innerHTML) === 'undefined' ) {
    throw 'invalid html container or media element!';
  }

  this.init();
  this.init_event_listeners();
}

_via_editor.prototype.TYPE = { 'METADATA':2, 'ATTRIBUTE':3 };

_via_editor.prototype.init = function() {
  this.metadata_container = document.createElement('div');
  this.metadata_container.setAttribute('class', 'metadata_container');
  this.metadata_view = document.createElement('table');
  this.metadata_container.appendChild( this.metadata_view );
  this.c.appendChild(this.metadata_container);

  this.update_metadata();
}

_via_editor.prototype.init_event_listeners = function() {
  this.d.on_event('_via_data_seg_add', this.on_seg_add.bind(this));
}

//
// metadata
//
_via_editor.prototype.clear_metadata = function() {
  this.metadata_view.innerHTML = '';
}

_via_editor.prototype.update_metadata = function() {
  this.clear_metadata();

  // add header
  this.metadata_view.appendChild( this.get_metadata_header() );

  if ( this.a.now.file ) {
    // add each metadata
    var tbody = document.createElement('tbody');
    var fid = this.a.now.file.id;
    var mid;
    for ( mid in this.d.metadata_store[fid] ) {
      tbody.appendChild( this.get_metadata(fid, mid) );
    }
    this.metadata_view.appendChild(tbody);
  }
}

_via_editor.prototype.get_metadata = function(fid, mid) {
  var tr = document.createElement('tr');
  tr.setAttribute('data-fid', fid);
  tr.setAttribute('data-mid', mid);

  // first column: the action tools for metadata (like delete)
  var action_tools_container = document.createElement('td');
  this.get_metadata_action_tools(action_tools_container, fid, mid);
  tr.appendChild( action_tools_container );

  // second column: mid (i.e. metadata id)
  tr.appendChild( this.html_element('td', mid) );

  // third column: where (i.e. location of metadata)
  var location = document.createElement('td');
  var where_type = document.createElement('span');
  where_type.innerHTML = this.d.metadata_store[fid][mid].where_type_str();
  location.appendChild(where_type);
  if ( this.d.metadata_store[fid][mid].where_type() === _via_metadata.prototype.TYPE.VSEGMENT &&
       this.d.metadata_store[fid][mid].where_type() === _via_metadata.prototype.SHAPE.TIME
     ) {
    var t1 = document.createElement('button');
    t1.setAttribute('class', 'text_button');
    t1.setAttribute('data-fid', fid);
    t1.setAttribute('data-mid', mid);
    t1.setAttribute('data-where_index', 2);
    t1.innerHTML = this.d.metadata_store[fid][mid].where[2].toFixed(3).toString();
    t1.addEventListener('click', this.jump_to_metadata.bind(this));

    var arrow = document.createElement('span');
    arrow.innerHTML = '&rarr;';

    var t2 = t1.cloneNode();
    t2.setAttribute('data-where_index', 3);
    t2.innerHTML = this.d.metadata_store[fid][mid].where[3].toFixed(3).toString();
    t2.addEventListener('click', this.jump_to_metadata.bind(this));

    location.appendChild(t1);
    location.appendChild(arrow);
    location.appendChild(t2);
  }
  tr.appendChild(location);

  // subsequent columns: what (i.e. the attributes for this metadata)
  for ( aid = 0; aid < this.d.attribute_store.length; ++aid ) {
    var td = document.createElement('td');
    td.setAttribute('data-aid', aid);
    td.appendChild( this.get_attribute_html_element(fid, mid, aid) );
    tr.appendChild(td);
  }

  return tr;
}

_via_editor.prototype.get_metadata_action_tools = function(container, fid, mid) {
  var del = document.createElement('button');
  del.setAttribute('data-fid', fid);
  del.setAttribute('data-mid', mid);
  del.setAttribute('class', 'text_button');
  del.innerHTML = '&times;';
  del.addEventListener('click', this.on_metadata_del.bind(this));

  container.appendChild(del);
}

_via_editor.prototype.get_attribute_html_element = function(fid, mid, aid) {
  var aval  = this.d.metadata_store[fid][mid].what[aid];
  var dval  = this.d.attribute_store[aid].default_option_id;
  var atype = this.d.attribute_store[aid].type;
  var el    = this.d.attribute_store[aid].html_element();
  el.setAttribute('data-fid', fid);
  el.setAttribute('data-mid', mid);
  el.setAttribute('data-aid', aid);

  switch(atype) {
  case _via_attribute.prototype.TYPE.TEXT:
    if ( typeof(aval) === 'undefined' ) {
      aval = dval;
    }
    el.innerHTML = aval;

    break;

  case _via_attribute.prototype.TYPE.SELECT:
    // set the selected option corresponding to atype
    var n = el.options.length;
    var i;
    if ( typeof(aval) === 'undefined' ) {
      aval = dval;
    }
    for ( i = 0; i < n; ++i ) {
      if ( el.options[i].value === aval ) {
        el.options[i].setAttribute('selected', 'true');
      } else {
        el.options[i].removeAttribute('selected');
      }
    }
    break;

  default:
    console.log('attribute type ' + atype + ' not implemented yet!');
    var el = document.createElement('span');
    el.innerHTML = aval;
    return el;
  }
  return el;
}
_via_editor.prototype.get_metadata_header = function() {
  var tr = document.createElement('tr');
  tr.appendChild( this.html_element('th', '') );
  tr.appendChild( this.html_element('th', 'Id') );
  tr.appendChild( this.html_element('th', 'Location') );

  var aid;
  for ( aid = 0; aid < this.d.attribute_store.length; ++aid ) {
    tr.appendChild( this.html_element('th',
                                      this.d.attribute_store[aid].attr_name)
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
  if ( this.d.metadata_store[fid][mid].where_type() === _via_metadata.prototype.TYPE.VSEGMENT &&
       this.d.metadata_store[fid][mid].where_type() === _via_metadata.prototype.SHAPE.TIME
     ) {
    this.a.preload[fid].media_annotator.media.currentTime = this.d.metadata_store[fid][mid].where[where_index];
  }
}

//
// Listeners for data update events
//
_via_editor.prototype.on_metadata_del = function(e) {
  console.log('@todo: deleting metadata: fid=' + e.target.dataset.fid + ', mid=' + e.target.dataset.mid);
}

_via_editor.prototype.on_seg_add = function(data, event_payload) {
  this.update_metadata();
}
