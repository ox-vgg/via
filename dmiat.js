/*
  Distributed Manual Image Annotation Tool (DMIAT)
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

var attributes_list = ['name'];

// source: https://commons.wikimedia.org/wiki/Commons:Quality_images
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
    "https://upload.wikimedia.org/wikipedia/commons/8/8b/Alg%C3%A9rie_-_Arm%C3%A9nie_-_20140531_-_Yacine_Brahimi_%28Alg%29_face_%C3%A0_Taron_Voskanyan_%28Arm%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/7/71/Kunsthistorisches_Museum_Wien_2016_Antikensammlung_r%C3%B6mische_B%C3%BCsten_a.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4d/Prague_07-2016_Zoo_img14_flamingos.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/b/b6/Cologne_Germany_Cologne-Gay-Pride-2016_Parade-030.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/53/Memmingen_-_Wallenstein_2016_-_Scots_Brigade_1_-_Auszug.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/43/Cologne_Germany_Cologne-Gay-Pride-2016_Parade-031.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/c/c3/Wolves_vs_Slavs_2015_G05.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/b/b8/Ole_Amund_Sveen_scora_2-2-m%C3%A5let_mot_Bod%C3%B8-Glimt_24._juli_2016.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/34/Albert_Ramos_-_Masters_de_Madrid_2015_-_01.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/7/72/20151007_UWCL_St._P%C3%B6lten-Spratzern_-_ASD_CF_Verona_4983.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/96/Vicenza_allenamento_precampionato_2015.jpeg",
    "https://upload.wikimedia.org/wikipedia/commons/e/ec/Tournoi_de_rugby_%C3%A0_7_-_20141012_-_Gen%C3%A8ve_-_31.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/67/Foot_US_-_Women_French_Championship_-_Day_2_-_Ours_vs_Argocanes_-_40.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/24/Sandvikens_AIK_vs_V%C3%A4ster%C3%A5s_SK_2015-03-14_19.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/93/PCAPH_vs_CERN_CC_-_20140911_58.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/ab/Je%C5%BAdziec_na_stepie_na_lokalnym_festiwalu_Naadam_%2801%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/33/American_Football_EM_2014_-_AUT-DEU_-_068.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/f/fb/Championnat_de_France_de_cyclisme_handisport_-_20140614_-_Course_en_ligne_cat%C3%A9gorie_B_6.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/a0/Speedway_Extraliiga_22._5._2010_-_Jari_M%C3%A4kinen_ja_er%C3%A4_5.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/b/bc/12-01-21-yog-815.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/e/e0/Dn_nasva_0854.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/b/b0/Oesterreichische-nationalmannschaft-fuszball-2012.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/87/2016_Malakka%2C_Kolorowa_riksza_rowerowa_%2808%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/1d/Cannnondale_Synapse_Carbon_6_105_2014_002.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/82/Monolith_Quarry_04.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/55/Lamps_March_2016-3.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/d2/Gerach-Glocken-060042.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/a7/Washington_October_2016-5.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/15/2015_06_08_001_R%C3%A4der.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/a7/Juist%2C_Liebesschl%C3%B6sser_--_2014_--_3599.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/e/e2/Two_blood_oranges.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/0f/2017_Likier_wi%C5%9Bniowy_Krupnik.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/e/e6/Lemon_and_lime.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/f3/Golden_Delicious%2C_SweeTango%2C_Granny_Smith%2C_and_Gala_apples_3.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/3/3f/%D0%A7%D1%91%D1%80%D0%BD%D1%8B%D0%B9_%D0%BB%D0%B5%D0%B1%D0%B5%D0%B4%D1%8C.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/c/c6/Little_auks_%28Alle_alle%29_on_Fuglesangen%2C_Svalbard_%282%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/82/Three_House_sparrows_in_Norway.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3d/Gal%C3%A1pagos_hawks_01.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/7/7a/Mute_swans_%28Cygnus_olor%29_and_cygnets.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/60/White-backed_stilts_%28Himantopus_melanurus%29.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/e/e7/Orange-winged_parrots_%28Amazona_amazonica_tobagensis%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/16/Mandarin_duck_Aix_galericulata.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/b/b9/Greater_Flamingos%2C_Lido_de_Thau%2C_S%C3%A8te_06.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/b/bd/Oktoberfest_2015_-_Impression_6.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/e/ed/2034537_cow.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/4/43/Suitsu_j%C3%B5gi_Matsalus.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/41/Silos%2C_Acatl%C3%A1n%2C_Hidalgo%2C_M%C3%A9xico%2C_2013-10-11%2C_DD_02.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/1/1d/Penguin_in_Antarctica_jumping_out_of_the_water.jpg"
];

// state of dmiat
var _dmiat_is_deposit_ongoing = false;
var _dmiat_is_pull_ongoing = false;
var _dmiat_last_deposit_failed = false;

var gh = new XMLHttpRequest();
gh.addEventListener('load', responseListener);

var ghurl = 'https://api.github.com/';
var gistid = 'b5174884f056ef54e1c344c226541a77'
var gistfn = 'via_image_metadata.json';

var gist_rawurl = '';
var gist_rawsize = -1;

function init_payload() {
    for (var i=0; i<img_url_list.length; ++i) {
	var url = img_url_list[i];
	var filename = url.substring(url.lastIndexOf('/')+1);

	var img = new ImageMetadata('', url, 0);
	img.base64_img_data = url;
	
	var img_id = _via_get_image_id(url);

	_via_img_metadata[img_id] = img;
	_via_image_id_list.push(img_id);
	_via_img_count += 1;
	_via_reload_img_table = true;
    }

    for (var i=0; i<attributes_list.length; ++i) {
	_via_region_attributes.add('name');
    }

    _via_image_index = get_random_int(0, img_url_list.length);
    show_image(_via_image_index);
    _dmiat_pull_metadata();
}

// returns random interger between [min,max)
function get_random_int(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function _via_load_submodules() {
    init_payload();
}

//
// handle hooks
//

function _via_hook_prev_image(img_index) {
    _dmiat_deposit_metadata();
}

function _via_hook_next_image(img_index) {
    _dmiat_deposit_metadata();
}

function responseListener() {
    if (_dmiat_is_pull_ongoing) {
	_dmiat_is_pull_ongoing = false;
	var r = this.responseText;
	var d = JSON.parse(r);
	var jsonstr = d['files'][gistfn]['content'];
	gist_rawurl = d['files'][gistfn]['raw_url'];
	gist_rawsize = d['files'][gistfn]['size'];

	import_annotations_from_json( JSON.parse(jsonstr) );
	return;
    }

    if (_dmiat_is_deposit_ongoing) {
	_dmiat_is_deposit_ongoing = false;
	var r = this.responseText;
	var d = JSON.parse(r);

	gist_rawurl = d['files'][gistfn]['raw_url'];
	gist_rawsize = d['files'][gistfn]['size'];
	return;
    }
    console.log('Response processed');
}

function _dmiat_pull_metadata() {
    setTimeout(function() {
        if (!_dmiat_is_pull_ongoing) {
            try {
                _dmiat_is_pull_ongoing = true;
		var img_metadata = package_region_data('json');
		var img_metadata_str = JSON.stringify(img_metadata[0]);
		var timenow = new Date().toUTCString();

		var url = ghurl + 'gists/' + gistid + '?access_token=' + PERSONAL_ACCESS_TOKEN;
		
		gh.open('GET', url);
		gh.send();
            } catch(err) {
		_dmiat_is_pull_ongoing = false;
                show_message('Failed to pull metadata.');
                alert('Failed to pull metadata.');
                console.log('Failed to pull metadata.');
                console.log(err.message);
            }
        }
    }, 10);
}

function _dmiat_deposit_metadata() {
    setTimeout(function() {
        if (!_dmiat_is_deposit_ongoing &&
	    _dmiat_is_remote_metadata_updated()) {
            try {
                _dmiat_is_deposit_ongoing = true;
		var img_metadata = package_region_data('json');
		var img_metadata_str = JSON.stringify(img_metadata[0]);
		var timenow = new Date().toUTCString();

		var payload = {};
		payload['description'] = 'Last updated on : ' + timenow;
		payload['files'] = {};
		payload['files'][gistfn] = {};
		payload['files'][gistfn]['content'] = img_metadata_str;
		
		
		var url = ghurl + 'gists/' + gistid + '?access_token=' + PERSONAL_ACCESS_TOKEN;

		console.log('sending to url : ' + url);
		console.log('payload : ' + JSON.stringify(payload));
		console.log('img_metadata (json) : ' + img_metadata);
		console.log('img_metadata (str) : ' + img_metadata_str);
		
		gh.open('PATCH', url);
		gh.send(JSON.stringify(payload));
            } catch(err) {
		_dmiat_is_deposit_ongoing = false;
                show_message('Failed to deposit metadata changes.');
                alert('Failed to deposit metadata changes.');
                console.log('Failed to deposit metadata changes.');
                console.log(err.message);
            }
        }
    }, 100);
}

// compare the size of local img_metadata size with that of remote
function _dmiat_is_remote_metadata_updated() {
    if (gist_rawsize != -1) {
	var img_metadata = package_region_data('json');
	var img_metadata_str = JSON.stringify(img_metadata[0]);

	if (img_metadata_str.length == gist_rawsize) {
	    return false;
	} else {
	    return true;
	}
    } else {
	return true;
    }
}
