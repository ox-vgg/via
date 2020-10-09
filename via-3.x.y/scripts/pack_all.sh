#!/bin/sh
python3 pack_via.py image_annotator
python3 pack_via.py audio_annotator
python3 pack_via.py video_annotator

python3 pack_demo.py image_annotator
python3 pack_demo.py audio_annotator
python3 pack_demo.py video_annotator
python3 pack_demo.py pair_annotator

python3 pack_subtitle_annotator.py
