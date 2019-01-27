/**
 * Utilities used by VIA default user interface
 *
 * @author Abhishek Dutta <adutta@robots.ox.ac.uk>
 * @date 31 Dec. 2018
 *
 */

'use strict'

function _via_util_get_svg_button(id, title, viewbox) {
  var svg_viewbox = viewbox;
  if ( typeof(svg_viewbox) === 'undefined' ) {
    svg_viewbox = '0 0 24 24';
  }

  var el = document.createElementNS(_VIA_SVG_NS, 'svg');
  el.setAttributeNS(null, 'viewbox', svg_viewbox);
  el.setAttributeNS(null, 'class', 'svg_button');
  el.innerHTML = '<use xlink:href="#' + id + '"></use><title>' + title + '</title>';
  return el;
}

function _via_util_get_html_input_element_value(el) {
  switch(el.tagName) {
  case 'TEXTAREA':
    return el.value;

  case 'SELECT':
    return el.options[el.selectedIndex].value;

  case 'INPUT':
    return el.value;
  }
}
