close all; clear; clc;

infn = '/data/datasets/arsha/sherlock/facetracks/s01_from_RCNN/e01/tracks_FRCNN_remove.mat';
load(infn);

outfn = '/data/datasets/arsha/sherlock/facetracks/s01_from_RCNN/e01/tracks_FRCNN_remove_full_path_50000.json';
outf = fopen(outfn, 'w');
fprintf(outf, 'var sherlock_annotations_json = ''{');
%for i = 1:size(facedets,2)
endi = 50000;
for i = 1:endi
  x      = int32(facedets(i).rect(1));
  y      = int32(facedets(i).rect(2));
  width  = int32(facedets(i).rect(3) - x);
  height = int32(facedets(i).rect(4) - y);
  
  track       = facedets(i).track;
  trackconf   = facedets(i).trackconf;
  tracklength = facedets(i).tracklength;
  
  filename = sprintf('/data/datasets/arsha/sherlock/frames/e01/%0.8d.jpg', facedets(i).frame);
  fileinfo = dir(filename);
  size     = fileinfo.bytes;
  fileid   = strcat(filename, num2str(size));
  file_attributes   = sprintf('{"shot":%d}', facedets(i).shot);
  shape_attributes  = sprintf('{"name":"rect","x":%d,"y":%d,"width":%d,"height":%d}', x, y, width, height);
  region_attributes = sprintf('{"track":%d,"trackconf":%.4f,"tracklength":%d}', track, trackconf, tracklength);
  regions = sprintf('{"0":{"region_attributes":%s,"shape_attributes":%s}}', region_attributes, shape_attributes);
  fprintf(outf, '"%s":{"filename":"%s","size":%d,"file_attributes":%s,"regions":%s}',fileid, filename, size, file_attributes, regions);
  if ( i ~= endi )
    fprintf(outf, ',');
  end
end
fprintf(outf, '}'';');
fclose(outf);