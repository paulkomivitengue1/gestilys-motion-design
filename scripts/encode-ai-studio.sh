#!/usr/bin/env bash
# Encode uniquement les images isolées de Gestilys AI Studio.
set -euo pipefail
cd "$(dirname "$0")/.."
CONFIG="out/ai-studio/render-config.json"
FRAME_DIR="out/ai-studio/frames"
OUTPUT="out/ai-studio/gestilys-video-sans-audio.mp4"
[ -f "$CONFIG" ] || { echo "::error::Configuration AI Studio introuvable"; exit 1; }
[ -d "$FRAME_DIR" ] || { echo "::error::Images AI Studio introuvables"; exit 1; }
FPS=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).video.fps)")
WIDTH=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).video.width)")
HEIGHT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).video.height)")
EXPECTED=$(node -e "const s=JSON.parse(require('fs').readFileSync('$CONFIG','utf8')).scenes;console.log(s.problem.duration+s.transition.duration+s.solution.duration+s.signature.duration)")
N=$(find "$FRAME_DIR" -maxdepth 1 -name '*.png' | wc -l)
[ "$N" -ge "$((FPS * EXPECTED - 2))" ] || { echo "::error::Nombre d'images insuffisant ($N)"; exit 1; }
mkdir -p out/ai-studio
ffmpeg -hide_banner -loglevel warning -stats -y -framerate "$FPS" -i "$FRAME_DIR/%05d.png" \
  -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset veryfast -crf 19 -profile:v high -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -movflags +faststart -r "$FPS" "$OUTPUT"
bash scripts/verify-ai-studio.sh "$OUTPUT"
