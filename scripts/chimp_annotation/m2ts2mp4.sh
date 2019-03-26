SRC_DIR="/data/datasets/arsha/chimp/chimp_annotation/videos/2012"
DST_DIR="/data/datasets/arsha/chimp/chimp_annotation/videos/2012"

for video_file in $SRC_DIR/*.m2ts
do
  VIDEO_NAME=$(basename --suffix=".m2ts" $video_file)
  TARGET_VIDEO_NAME="${DST_DIR}/${VIDEO_NAME}.mp4"
	if [ ! -f "${TARGET_VIDEO_NAME}" ]; then
    echo "${video_file} -> ${TARGET_VIDEO_NAME}"
    ffmpeg -i $video_file -preset slow -codec:a aac -b:a 128k -codec:v libx264 -pix_fmt yuv420p -b:v 2500k -minrate 1500k -maxrate 4000k -bufsize 5000k -strict experimental $TARGET_VIDEO_NAME
  else
    echo "Skipping ${video_file}"
  fi
done

