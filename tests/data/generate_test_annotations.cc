/*

To compile this C++ code:
 $ g++ -std=c++11 -o generate_test_annotations generate_test_annotations.cc
*/
#include <iostream>
#include <fstream>
#include <string>
#include <random>

using namespace std;

int main() {
  vector<string> fn_list = {"unit_test_img1.jpg", "unit_test_img2.jpg", "unit_test_img3.jpg"};
  vector<size_t> size_list = {129855, 27894, 62201};
  vector<size_t> width_list = {640, 640, 640};
  vector<size_t> height_list = {480, 480, 427};

  string rand_txt = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

  //test_pattern_qbist.jpg,129855,"{""caption"":""+-08374*&$£*""}",8,0,"{""name"":""ellipse"",""cx"":252,""cy"":190,""rx"":27,""ry"":26}","{""name"":""ellipse \""red\""""}"
  //test_pattern_qbist.jpg,129855,"{""caption"":""+-08374*&$£*""}",8,1,"{""name"":""rect"",""x"":290,""y"":208,""width"":127,""height"":113}","{""name"":""rectangle 'black'""}"
  //test_pattern_qbist.jpg,129855,"{""caption"":""+-08374*&$£*""}",8,2,"{""name"":""point"",""cx"":51,""cy"":37}","{""name"":""red \""dot\""""}"
  //test_pattern_qbist.jpg,129855,"{""caption"":""+-08374*&$£*""}",8,5,"{""name"":""circle"",""cx"":148,""cy"":268,""r"":43}","{}"

  ofstream f("./via_test_annotations.csv");
  f << "#filename,file_size,file_attributes,region_count,region_id,region_shape_attributes,region_attributes" << endl;

  mt19937 generator(9973);
  uniform_int_distribution<> dist(0, rand_txt.length()-1);

  size_t total_region = 0;
  for( size_t i=0; i<fn_list.size(); ++i ) {
    string fn = fn_list[i];
    size_t size = size_list[i];
    size_t w = width_list[i];
    size_t h = height_list[i];
    size_t n = w*h;
    
    size_t rindex = 0;
    for( size_t x=10; x<w; x=x+20 ) {
      for( size_t y=10; y<h; y=y+20 ) {
        f << fn << "," << size << ",";
        f << "\"{\"\"caption\"\":\"\"" << rand_txt.substr(0, dist(generator)) << "\"\"}\",";
        f << "-1" << "," << rindex << ",";
        //f << "-1,-1,";
        f << "\"{\"\"name\"\":\"\"point\"\",\"\"cx\"\":" << x << ",\"\"cy\"\":" << y << "}\",";

        f << "\"{";
        for( size_t ai=0; ai<2; ++ai ) {
          f << "\"\"attr" << ai << "\"\":\"\"" << rand_txt.substr(0, dist(generator)) << "\"\",";
        }
        f << "\"\"attr100\"\":\"\"" << rand_txt.substr(0, dist(generator)) << "\"\"}\"";
        f << endl;
        rindex = rindex + 1;
      }
    }

    for( size_t x=40; x<w; x=x+30 ) {
      for( size_t y=40; y<h; y=y+30 ) {
        f << fn << "," << size << ",";
        f << "\"{\"\"caption\"\":\"\"" << rand_txt.substr(0, dist(generator)) << "\"\"}\",";
        f << "-1" << "," << rindex << ",";
        f << "\"{\"\"name\"\":\"\"rect\"\",\"\"x\"\":" << x << ",\"\"y\"\":" << y << ",\"\"width\"\":20" << ",\"\"height\"\":20" << "}\",";

        f << "\"{";
        for( size_t ai=0; ai<2; ++ai ) {
          f << "\"\"attr" << ai << "\"\":\"\"" << rand_txt.substr(0, dist(generator)) << "\"\",";
        }
        f << "\"\"attr100\"\":\"\"" << rand_txt.substr(0, dist(generator)) << "\"\"}\"";
        f << endl;
        rindex = rindex + 1;
      }
    }
    cout << fn << ": exported regions = " << rindex << endl;
    total_region = total_region + rindex;
  }
  f.close();
  cout << "total exported regions = " << total_region << endl;
}
