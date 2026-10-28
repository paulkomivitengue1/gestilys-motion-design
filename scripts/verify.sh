#!/usr/bin/env bash
# Vérifie qu'un MP4 final respecte le cahier des charges (1080×1920, H.264, AAC, durée attendue).
set -euo pipefail
cd "$(dirname "$0")/.."
F=${1:-out/gestilys-pub-1080x1920.mp4}
[ -f "$F" ] || { echo "::error::Fichier introuvable : $F"; exit 1; }
EXPECTED=$(node -e "const s=JSON.parse(require('fs').readFileSync('config/video.config.json','utf8')).scenes;console.log(s.problem.duration+s.transition.duration+s.solution.duration+s.signature.duration)")
V=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,pix_fmt -of csv=p=0 "$F")
A=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$F" || true)
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F")
SIZE=$(stat -c %s "$F")
echo "Fichier  : $F ($(awk -v s="$SIZE" 'BEGIN{printf "%.1f Mo", s/1048576}'))"
echo "Vidéo    : $V"
echo "Audio    : ${A:-AUCUNE}"
echo "Durée    : $DUR s (attendue ≈ $EXPECTED s)"
fail=0
[ "$V" = "h264,1080,1920,yuv420p" ] || { echo "::error::Format vidéo inattendu : $V"; fail=1; }
[ "$A" = "aac" ] || { echo "::error::Piste audio AAC absente"; fail=1; }
awk -v d="$DUR" -v e="$EXPECTED" 'BEGIN{ if (d < e-0.3 || d > e+0.3) exit 1 }' || { echo "::error::Durée inattendue : $DUR s au lieu de $EXPECTED s"; fail=1; }
[ "$fail" = 0 ] && echo "OK : le MP4 respecte le cahier des charges" || exit 1
