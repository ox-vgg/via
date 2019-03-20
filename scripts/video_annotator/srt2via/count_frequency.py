# Compute frequency of words
#
# Author: Abhishek Dutta <adutta@robots.ox.ac.uk>

import string
import os

word_freq = {}
word_loc = {}

def srt_read(filename, video_filename):
  with open(filename, 'r') as f:
    data = f.read()
    block_list = data.split('\n\n');

    #punctuation_remover = str.maketrans('', '', string.punctuation)
    comma_remover = str.maketrans('', '', '!"£$%^&*()-_=+[{]};:@#~,<.>/?0123456789|')
    for block in block_list:
      block_field_list = block.split('\n')
      if len(block_field_list) < 4:
        continue

      if  ' --> ' in block_field_list[1]:
        # this is a valid srt block
        block_id = int(block_field_list[0])
        block_timestamp = block_field_list[1].split(' --> ')
        block_tstart = block_timestamp[0].replace(',', '.')
        block_tend = block_timestamp[1].replace(',', '.')

        block_text = ' '.join(block_field_list[3:len(block_field_list)])
        block_text = block_text.lower()
        block_text = block_text.translate(comma_remover)
        block_text_tokens = block_text.split(' ')
        for token in block_text_tokens:
          if ( token in word_freq ):
            word_freq[token] += 1
          else:
            word_freq[token] = 1
            word_loc[token] = []
          word_loc[token].append( {'vf':video_filename, 'tstart':block_tstart, 'tend':block_tend})

#        print('\n[%d] %s - %s : %s' % (block_id, block_tstart, block_tend, block_text))

VIDEO_BASE_DIR = '/mnt/nfs1/bbcsl/avi/'
SRT_BASE_DIR = '/data/datasets/bsl/bbc_lipreading_db/srt'
STAT_OUT_DIR = '/data/datasets/bsl/bbc_lipreading_db/stat'

for dirpath, dirnames, filenames in os.walk(SRT_BASE_DIR):
  for filename in filenames:
    video_rel_filename = os.path.join(VIDEO_BASE_DIR, os.path.relpath(dirpath, start=SRT_BASE_DIR), 'signhd.avi')
    srt_abs_filename = os.path.join(dirpath, filename)
    print('Processing %s' % (srt_abs_filename ))
    srt_read(srt_abs_filename, video_rel_filename)

# Write everything to a file
word_freq_fn = os.path.join(STAT_OUT_DIR, 'freq.csv')
word_loc_data_dir = os.path.join(STAT_OUT_DIR, 'location')
video_filename_list_fn = os.path.join(STAT_OUT_DIR, 'video_filenames.csv')

if not os.path.isdir(word_loc_data_dir):
  os.mkdir(word_loc_data_dir)

if 0:
  print('\nWriting word frequencies to %s' % (word_freq_fn))
  with open(word_freq_fn, 'w') as word_freq_f:
    word_freq_f.write('word,frequency\n')
    for word in word_freq:
      if word_freq[word] > 20:
        word_freq_f.write('%s,%d\n' % (word, word_freq[word]))

#SEL_WORDS = ['beard', 'bride', 'tongues']
SEL_WORDS = ['beard']
video_filename_list = set()
for word in SEL_WORDS:
  out_fn = os.path.join(word_loc_data_dir, word + '.csv')
  print('\nWriting locations to file %s' % out_fn)
  with open(out_fn, 'w') as outf:
    outf.write('video_filename,start_time,end_time\n');
    for loc in word_loc[word]:
      outf.write('"%s","%s","%s"\n' % (loc['vf'], loc['tstart'], loc['tend']))
      video_filename_list.add(loc['vf'])

print('\nWritten video filename list to %s' % video_filename_list_fn)
with open(video_filename_list_fn, 'w') as video_filename_list_f:
  for fn in video_filename_list:
    video_filename_list_f.write('%s\n' % (fn))

