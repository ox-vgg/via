# Contributors to VIA project
We welcome all forms of contributions (code update, documentation, etc) from users. 
These contributions must adhere to the existing [license](LICENSE) of VIA project.
Here is the list of current contributions to VIA project.

* Stefan Mihaila (@smihaila, 01 Feb. 2018, updates to via-1.0.5)
  01. a patch from Stefan Mihaila which requires polygon shape to have at least 3 points.

* Stefan Mihaila (@smihaila, 15 Jan. 2018, updates to via-1.0.4)
  01. Added "use strict";
  02. Added the "var _via_current_x = 0; var _via_current_y = 0;" global vars.
  03. Replaced any Set() object (_via_region_attributes, _via_file_attributes) with a standard dictionary object.
  04. Replaced any Map() object (ImageMetadata.file_attributes, ImageRegion.shape_attributes and ImageRegion.region_attributes) with a standard dictionary object.
  05. Made most of the switch() statements more readable or even fixing potential bugs caused by unintended "fall-through" (i.e. lack of "break") statements.
  06. Added missing semi-colon (;) expression terminators.
  07. Replaced any use of "for (var key of collection_name.keys()) {}" block (combined with collection_name.get(key) inside the block) with "for (var key in collection_name) {}" (combined with collection_name[key] inside the block).
  08. Gave a more intuitive name to certain local var names.
  09. Commented out unused local vars.
  10. Removed un-necessary intermediary local vars.
  11. Made certain local vars inside functions, to be more sub-scoped / to reflect their exact use.
  12. Added missing "var variable_name" declarations.
  13. Leverage Object.keys(collection_name).length property instead of Map.size and Set.size property.
  14. Replaced "==" and "!=" with their more precise / identity operators (=== and !==).
  15. Simplified some function implementations, using direct "return expression" statements.
  16. Fixed spelling errors in comments, string values, variable names and function names.

* Ernesto Coto (@ecoto, 12 Feb. 2017)
  - carried an independent code review of via-1.0.0 release (https://gitlab.com/vgg/via/issues/54)

* Matilde Malaspina (2016, 2017)
  - Tested early versions of via-1.x.y

* Ankush Gupta (Sep. 2016)
  - Provided feedback about user interface and functionality of the early prototype of VIA ( created in Sep 2016)
  - Tested early prototype and some early versions of via-1.x.y
