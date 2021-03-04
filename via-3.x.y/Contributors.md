# Contributors to the VIA Open Source Project
We welcome all forms of contributions (code update, documentation, etc) from users. 
These contributions must adhere to the existing [license](LICENSE) of VIA project.
In this document, we keep a list of contributors to the VIA project.

## 3.0.10
* Assaf Urieli @assafurieli corrected a region-id typo in code documentation (merge request 27)
* Charles Carman @cscarman shared code to fix point selection issue (issue 330)
* Prasanna Sridhar @IMG-PRCSNG fixed an issue by which thumbnail view was being removed after initialization 

## 3.0.5
* Achal Dave @achald fixed pack scripts to create target directories if they did not exist (merge request 21)
* Achal Dave @achald implemented the extreme clicking annotation method (merge request 22)
  - user is required to click only the (left, top, right, bottom) extemeties of an object
  - these extremeties are used to define the bounding box of an object
  - the extreme clicking annotation method is described in the following paper: https://arxiv.org/abs/1708.02750
