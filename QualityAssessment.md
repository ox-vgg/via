Quality Assessment
==================
This document contains description of tasks devised to ensure the quality of 
VIA application, source code and its documentation.

Code Review
-----------
The aim of code review is to ensure that VIA source code and its documentation 
is accessible to users with a basic understanding of programming in Javascript, 
HTML and CSS. Furthermore, the code review is designed to assess the barrier 
encountered by users who wish to fix a bug or add a new feature to the VIA 
application.

Code reviewers are independent and are not involved in the developement of VIA 
application. The code review should result in a clear answer of the following 
aspects of VIA source code and its documentation:

 * [VIA code documentation](https://gitlab.com/vgg/via/blob/develop/CodeDoc.md) 
   * Which aspects of the code documentation did you find easy to follow and 
which aspects were confusing or difficult to understand?
   * Is there anything missing in the code documentation?
   * Is there a need to change the structure or style of the code documentation?
   * Do you have any advice on how this code documentation can be further improved?
 * [VIA source code](https://gitlab.com/vgg/via/tree/develop)
   * Do the variable and function names convey what they are there for?
   * Are the sparse code comments sufficient or do we need to add more?
   * How difficult is it for a new user to understand overall organization of 
the source code?
   * Do you have any advice on how the source code can be further improved?

Unit Tests
----------
VIA [unit tests](https://gitlab.com/vgg/via/tree/develop/tests) are designed to 
ensure that the underlying Javascript codebase is behaving correctly. Before 
every release, the source code should pass all these tests.

Abhishek Dutta  
Feb. 06, 2017