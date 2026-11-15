#!/usr/bin/env bash
# Vérifie les dimensions, H.264, 30 i/s, AAC et la durée de la campagne complète.
set -euo pipefail
cd "$(dirname "$0")/.."
F=${1:-out/gestilys-pub-1080x1920.mp4}
[ -f "$F" ] || { echo "::error::Fichier introuvable : $F"; exit 1; }
EXPECTED=$(node -e "const s=JSON.parse(require('fs').readFileSync('config/video.config.json','utf8')).scenes;console.log(s.problem.duration+s.transition.duration+s.solution.duration+s.signature.duration+s.close.duration)")
FFPROBE=${FFPROBE_BIN:-ffprobe}
V=$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=codec_name,width,height,pix_fmt,r_frame_rate -of csv=p=0 "$F")
A=$("$FFPROBE" -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$F" || true)
DUR=$("$FFPROBE" -v error -show_entries format=duration -of csv=p=0 "$F")
SIZE=$(stat -c %s "$F")
echo "Fichier  : $F ($(awk -v s="$SIZE" 'BEGIN{printf "%.1f Mo", s/1048576}'))"
echo "Vidéo    : $V"
echo "Audio    : ${A:-AUCUNE}"
echo "Durée    : $DUR s (attendue ≈ $EXPECTED s)"
fail=0
[[ "$V" == h264,1080,1920,yuv420p,30/1 ]] || { echo "::error::Format vidéo inattendu : $V"; fail=1; }
[ "$A" = "aac" ] || { echo "::error::Piste audio AAC absente"; fail=1; }
awk -v d="$DUR" -v e="$EXPECTED" 'BEGIN{ if (d < e-0.1 || d > e+0.1) exit 1 }' || { echo "::error::Durée inattendue : $DUR s au lieu de $EXPECTED s"; fail=1; }
[ "$fail" = 0 ] && echo "OK : MP4 H.264/AAC vertical 1080×1920, 30 i/s, ${EXPECTED} s." || exit 1
