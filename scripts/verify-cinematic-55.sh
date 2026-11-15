#!/usr/bin/env bash
set -euo pipefail
F="out/gestilys-cinematic-55s.mp4"
if [ "$#" -gt 0 ]; then F="$1"; fi
test -s "$F" || { echo "MP4 manquant"; exit 1; }
V=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,pix_fmt,r_frame_rate -of csv=p=0 "$F")
A=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$F")
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F")
echo "Vidéo : $V"; echo "Audio : $A"; echo "Durée : $D s"
[[ "$V" == "h264,1080,1920,yuv420p,30/1" ]] || { echo "Format vidéo incorrect"; exit 1; }
[[ "$A" == "aac" ]] || { echo "Piste AAC absente"; exit 1; }
awk -v d="$D" 'BEGIN{if(d<54.8 || d>55.2) exit 1}' || { echo "Durée hors cible"; exit 1; }
ffmpeg -v error -i "$F" -f null -
echo "OK : MP4 décodé intégralement, H.264/AAC, 1080×1920, 30 i/s, 55 s."
