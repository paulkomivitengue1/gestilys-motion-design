#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
F=${1:-out/ai-studio/gestilys-video-avec-audio.mp4}
PLAN="out/ai-studio/audio-plan.json"
[ -s "$F" ] || { echo "::error::MP4 audio absent ou vide"; exit 1; }
[ -s "$PLAN" ] || { echo "::error::Plan audio absent"; exit 1; }
EXPECTED=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$PLAN','utf8')).duration_seconds)")
V=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,pix_fmt -of csv=p=0 "$F")
A=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$F")
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F")
echo "Vidéo : $V"; echo "Audio : $A"; echo "Durée : $D s (attendue $EXPECTED s)"
[ "$V" = "h264,1080,1920,yuv420p" ] || { echo "::error::Flux vidéo invalide"; exit 1; }
[ "$A" = "aac" ] || { echo "::error::Flux audio AAC absent"; exit 1; }
awk -v d="$D" -v e="$EXPECTED" 'BEGIN{if(d<e-0.35||d>e+0.35)exit 1}' || { echo "::error::Durée incorrecte"; exit 1; }
echo "OK : vidéo verticale et piste AAC présentes, durée conforme."
