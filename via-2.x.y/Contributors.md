# Contributors to VIA project
We welcome all forms of contributions (code update, documentation, etc) from users. 
These contributions must adhere to the existing [license](LICENSE) of VIA project.
Here is the list of current contributions to VIA project.

* via-2.0.9
  - size of point region shape increases when zoomed in (issue 186 fixed by Srinivasan Sankar @vasan.shrini)
  - fixed missing 'category_id' in COCO export (issue 243 fixed by Srinivasan Sankar @vasan.shrini)
  - fixed incomplete COCO format export (issue 208 fixed by Srinivasan Sankar @vasan.shrini)
  - COCO import distinguishes between rectangle and polygon region (issue 233 fixed by Srinivasan Sankar @vasan.shrini)
  - incorrect ellipse orientation issue in COCO import (issue 215 fixed by Srinivasan Sankar @vasan.shrini)
  - details of ellipse and circle region are shown when selected or are being drawn (issue 211 fixed by Srinivasan Sankar @vasan.shrini)
  - fixed issue with loading filename containing '#' character (issue 254 fixed by Srinivasan Sankar @vasan.shrini)
  - project import is now compatible with older version of VIA which did not implement rotated ellipse (issue 253 fixed by Srinivasan Sankar @vasan.shrini)

* via-2.0.8
  - Richard Droste (@rdroste) contributed code to allow freehand rotation of ellipse regions (merge request 14 merged into VIA source by Srinivasan Sankar @vasan.shrini)
  - Mouse cursor coordinates and region shape description is now shown (feature request 118 was implemented by Srinivasan Sankar @vasan.shrini )
  - fixed issue 185 (by Srinivasan Sankar @vasan.shrini)

* via-2.0.7
  - regions cannot now be moved beyond image boundary (issue 173 fixed by Srinivasan Sankar @vasan.shrini)
  - user's mouse cursor coordinate visible (feature request 172 added by Srinivasan Sankar @vasan.shrini)
  - shortcut 'd' now works even when multiple regions are selected (merge request 15 submitted by Simon Brugman @simon_graphkite)

* Friedrich Beckmann (@fredowski) in via-2.0.4 (https://gitlab.com/vgg/via/merge_requests/12, 08 Dec. 2018)
  * fixed wrong region location for high zoom levels for large images (Closes: #166) 

* Friedrich Beckmann (@fredowski) in via-2.0.4 (https://gitlab.com/vgg/via/merge_requests/11, 24 Nov. 2018)
  * fixed annotation download issue encountered in Safari browser (see https://gitlab.com/vgg/via/issues/162)

* Friedrich Beckmann (@fredowski) in via-2.0.3 (https://gitlab.com/vgg/via/merge_requests/10, 11 Oct. 2018)
  * changed keyboard handling for zoom +/-/= from e.which() to e.key() because e.which() is deprecated


* GYOUNG-YOON RYOO (@rky0930) in via-2.0.2 (https://gitlab.com/vgg/via/merge_requests/8, 02 Oct. 2018)
  * annotations can now be updated using on-image annotation editor
  * more details at https://gitlab.com/vgg/via/issues/147


* Chiu Yue Chun (@BrianOn99) in via-2.0.1 (https://gitlab.com/vgg/via/merge_requests/7, 06 Sep. 2018)
  * fixed display message when an image is removed from VIA project (https://gitlab.com/vgg/via/commit/7b1d4ec02bb4d4bade045c7b0931c389bafb5159)


* Testers of via-2.0.0 preview version (https://gitlab.com/vgg/via/issues/135, May 18, 2018)
  * Carlos Ricolfe Viala
  * Kai Han
  * Ankush Gupta


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
 
