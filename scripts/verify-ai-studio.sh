#!/usr/bin/env bash
# Contrôle le MP4 AI Studio à partir de la configuration isolée.
set -euo pipefail
cd "$(dirname "$0")/.."
F=${1:-out/ai-studio/gestilys-video-sans-audio.mp4}
CONFIG="out/ai-studio/render-config.json"
[ -f "$F" ] || { echo "::error::MP4 AI Studio introuvable"; exit 1; }
[ -f "$CONFIG" ] || { echo "::error::Configuration AI Studio introuvable"; exit 1; }
EXPECTED=$(node -e "const s=JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).scenes;console.log(s.problem.duration+s.transition.duration+s.solution.duration+s.signature.duration)")
VIDEO=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,pix_fmt -of csv=p=0 "$F")
DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F")
echo "Vidéo : $VIDEO"
echo "Durée : $DURATION s (attendue ≈ $EXPECTED s)"
[ "$VIDEO" = "h264,1080,1920,yuv420p" ] || { echo "::error::Format vidéo inattendu"; exit 1; }
awk -v d="$DURATION" -v e="$EXPECTED" 'BEGIN{ if (d < e-0.3 || d > e+0.3) exit 1 }' || { echo "::error::Durée inattendue"; exit 1; }
echo "OK : rendu AI Studio vérifié (vidéo seule, audio à ajouter séparément)."
