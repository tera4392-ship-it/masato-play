#!/bin/bash
# 使い方: ./mux.sh out/video.mp4 out/final.mp4   (assets/bgm/ に曲があれば自動でミックス)
set -e
V="$1"; O="$2"; BGM=$(ls assets/bgm/*.{mp3,wav,m4a,ogg} 2>/dev/null | head -1 || true)
if [ -n "$BGM" ]; then
  echo "BGM: $BGM"
  ffmpeg -y -loglevel error -i "$V" -i out/se.wav -i "$BGM" -filter_complex \
   "[2:a]atrim=0:90,afade=t=in:d=1,afade=t=out:st=87:d=3,volume=0.35[b];[1:a]volume=1.0[s];[s][b]amix=inputs=2:duration=first:normalize=0[a]" \
   -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "$O"
else
  ffmpeg -y -loglevel error -i "$V" -i out/se.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "$O"
fi
echo "wrote $O"
