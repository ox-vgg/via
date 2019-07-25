close all; clear; clc;

OUT_FMT = 'csv'; % {json, csv, js}

OUT_BASEDIR = '/home/tlm/dev/vgg_software/via/docs/data/face_track_annotation';
OUT_IMGDIR = fullfile(OUT_BASEDIR, 'images');
OUT_DATDIR = fullfile(OUT_BASEDIR, 'data');
delete( fullfile(OUT_IMGDIR, '*.jpg') );

infn = '/data/datasets/arsha/sherlock/facetracks/s01_from_RCNN/e01/tracks_FRCNN_remove.mat';
load(infn);

outfn = fullfile(OUT_DATDIR, strcat('sherlock_ep01_tracks_FRCNN.', OUT_FMT));
outf = fopen(outfn, 'w');

switch OUT_FMT
  case 'js'
    fprintf(outf, 'var sherlock_e01_face_tracks_json = ''{');
    
  case 'json'
    fprintf(outf, '{');

  case 'csv'
    fprintf(outf, 'filename,file_size,file_attributes,region_count,region_id,region_shape_attributes,region_attributes\n');
end

first = true;

endi = 11000;
for i = 10000:endi
  x      = int32(facedets(i).rect(1));
  y      = int32(facedets(i).rect(2));
  width  = int32(facedets(i).rect(3) - x);
  height = int32(facedets(i).rect(4) - y);
  
  frame       = facedets(i).frame;
  shot        = facedets(i).shot;
  track       = facedets(i).track;
  trackconf   = facedets(i).trackconf;
  tracklength = facedets(i).tracklength;
  if ( tracklength > 10 )
    %if ( shot == 122 || shot == 123 || shot == 124)
    if ( shot == 123 || shot == 124)
    %if ( shot == 123 )
      src_filename = sprintf('/data/datasets/arsha/sherlock/frames/e01/%0.8d.jpg', frame);
      filename_relative = sprintf('./images/%0.8d.jpg', frame);
      filename = sprintf('%0.8d.jpg', frame);
      fileinfo = dir(src_filename);
      size     = fileinfo.bytes;
      fileid   = strcat(filename_relative, num2str(size));

      if ( strcmp(OUT_FMT, 'csv') )
        fprintf(outf, '%s,%d,', filename_relative, size);
        fprintf(outf, '"{""shot"":%d}",', shot);
        fprintf(outf, '1,0,"{""name"":""rect"",""x"":%d,""y"":%d,""width"":%d,""height"":%d}",',x, y, width, height);
        fprintf(outf, '"{""track"":%d}"\n', track);
      end
% cannot handle if a single frame contains more than 1 track      
%       if ( strcmp(OUT_FMT, 'js') || strcmp(OUT_FMT, 'json') )
%         file_attributes   = sprintf('{"shot":%d}', shot);
%         shape_attributes  = sprintf('{"name":"rect","x":%d,"y":%d,"width":%d,"height":%d}', x, y, width, height);
%         region_attributes = sprintf('{"track":%d,"trackconf":%.4f,"is_good_track":"y","name":""}', track, trackconf);
%         regions = sprintf('{"0":{"region_attributes":%s,"shape_attributes":%s}}', region_attributes, shape_attributes);
% 
%         if first
%           fprintf(outf, '"%s":{"filename":"%s","size":%d,"file_attributes":%s,"regions":%s}',fileid, filename_relative, size, file_attributes, regions);
%           first = false;
%         else
%           fprintf(outf, ',"%s":{"filename":"%s","size":%d,"file_attributes":%s,"regions":%s}',fileid, filename_relative, size, file_attributes, regions);
%         end
%       end
      
      % copy file
      copyfile(src_filename, fullfile(OUT_IMGDIR, sprintf('%0.8d.jpg', facedets(i).frame)) );
    end
  end
end
% switch OUT_FMT
%   case 'js'
%     fprintf(outf, '}'';');
%     
%   case 'json'
%     fprintf(outf, '}');
% end

fclose(outf);