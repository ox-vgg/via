/*
  VGG Image Annotator (via)
  www.robots.ox.ac.uk/~vgg/software/via/
  
  Copyright (c) 2016, Abhishek Dutta.
  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

  Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.
  Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.
  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
  POSSIBILITY OF SUCH DAMAGE.
*/

var img_url_list = [
    "https://upload.wikimedia.org/wikipedia/commons/6/62/Farmer_in_Tamil_Nadu_1993.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/c/cb/Rescue_exercise_RCA_2012.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/99/Four_pears.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/df/Mycteria_leucocephala_-_Pak_Thale.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4d/Rock_Pigeon_Columba_livia.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/96/Pair_of_Merops_apiaster_feeding.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/b/b8/James_Flamingos_MC.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/10/Zebras_Ngorongoro_Crater.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/42/Begegnung-01.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/5b/Serengeti_Elefantenherde1.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/80/Athene_cunicularia_20110524_02.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/0e/Adelie_penguins_in_the_South_Shetland_Islands.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/44/Healey_Silverstone_%2817.06.2007%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/49/Mandarin_Oranges_%28Citrus_Reticulata%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/9a/Flickr_-_Government_Press_Office_%28GPO%29_-_THE_NOBEL_PEACE_PRIZE_LAUREATES_FOR_1994_IN_OSLO..jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/40/Speedway_Extraliiga_22._5._2010_-_Joni_Keskinen_er%C3%A4ss%C3%A4_4.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/8b/Alg%C3%A9rie_-_Arm%C3%A9nie_-_20140531_-_Yacine_Brahimi_%28Alg%29_face_%C3%A0_Taron_Voskanyan_%28Arm%29.jpg"
];

function init_payload() {
    for (var i=0; i<img_url_list.length; ++i) {
	var url = img_url_list[i];
	var filename = url.substring(url.lastIndexOf('/')+1);

	var img = new ImageMetadata('', url, 0);
	img.base64_img_data = url;
	
	var img_id = _via_get_image_id(url, 0);
	_via_img_metadata[img_id] = img;
	_via_image_id_list.push(img_id);
	_via_img_count += 1;
	_via_reload_img_table = true;
    }
    
    _via_image_index = 0;
    var img_index = get_random_int(0, img_url_list.length);
    show_image(img_index);
}

// returns random interger between [min,max)
function get_random_int(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
