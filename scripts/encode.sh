#!/usr/bin/env bash
# Assemble frames/00001.png … en MP4 H.264 (sans audio) — vidéo maître.
set -euo pipefail
cd "$(dirname "$0")/.."
FPS=$(node -e "console.log(JSON.parse(require('fs').readFileSync('config/video.config.json','utf8')).video.fps)")
mkdir -p out
N=$(ls frames/*.png 2>/dev/null | wc -l)
if [ "$N" -lt 10 ]; then echo "::error::Aucune image à encoder dans frames/ ($N trouvée(s))"; exit 1; fi
echo "Encodage de $N images à ${FPS} i/s"
ffmpeg -hide_banner -loglevel warning -stats -y -framerate "$FPS" -i frames/%05d.png \
  -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 17 -profile:v high -level 4.2 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -movflags +faststart -r "$FPS" out/gestilys-video-sans-audio.mp4
ls -l out/gestilys-video-sans-audio.mp4
