close all; clear; clc;

infn = '/data/datasets/arsha/sherlock/facetracks/s01_from_RCNN/e01/tracks_FRCNN_remove.mat';
load(infn);

outfn = '/data/datasets/arsha/sherlock/facetracks/s01_from_RCNN/e01/tracks_FRCNN_remove_full_path_10.csv';
outf = fopen(outfn, 'w');
fprintf(outf, 'filename,file_size,file_attributes,region_count,region_id,region_shape_attributes,region_attributes\n');
%for i = 1:size(facedets,2)
for i = 1:10
  x      = int32(facedets(i).rect(1));
  y      = int32(facedets(i).rect(2));
  width  = int32(facedets(i).rect(3) - x);
  height = int32(facedets(i).rect(4) - y);
  
  track = facedets(i).track;
  trackconf = facedets(i).trackconf;
  tracklength = facedets(i).tracklength;
  
  fprintf(outf, '/data/datasets/arsha/sherlock/frames/e01/%0.8d.jpg,-1,', facedets(i).frame);
  fprintf(outf, '"{""shot"":%d}",', facedets(i).shot);
  fprintf(outf, '1,0,"{""name"":""rect"",""x"":%d,""y"":%d,""width"":%d,""height"":%d}",',x, y, width, height);
  fprintf(outf, '"{""track"":%d,""trackconf"":%.4f,""tracklength"":%d}"\n',track, trackconf, tracklength);
end

fclose(outf);