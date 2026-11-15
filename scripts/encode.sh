#!/usr/bin/env bash
# Assemble frames/00001.png … en MP4 H.264, vidéo maître sans audio.
set -euo pipefail
cd "$(dirname "$0")/.."
FPS=$(node -e "console.log(JSON.parse(require('fs').readFileSync('config/video.config.json','utf8')).video.fps)")
mkdir -p out
N=$(find frames -maxdepth 1 -name '*.png' -type f 2>/dev/null | wc -l)
if [ "$N" -ne 840 ]; then echo "::error::Le rendu doit fournir 840 images pour 28 s à 30 i/s (trouvé : $N)"; exit 1; fi
FFMPEG=${FFMPEG_BIN:-ffmpeg}
echo "Encodage de $N images à ${FPS} i/s"
"$FFMPEG" -hide_banner -loglevel warning -stats -y -framerate "$FPS" -start_number 1 -i frames/%05d.png \
  -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 17 -profile:v high -level 4.2 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -movflags +faststart -r "$FPS" out/gestilys-video-sans-audio.mp4
ls -lh out/gestilys-video-sans-audio.mp4
