#!/usr/bin/env bash
# Assemble le MP4 final du studio : images (out/studio-frames) + musique originale → H.264/AAC 1080×1920 30 i/s.
set -euo pipefail
cd "$(dirname "$0")/.."
[ -d out/studio-frames ] || { echo "::error::Aucune image : lancez d'abord scripts/studio-render.mjs"; exit 1; }
node scripts/studio-music.mjs out/studio-music.wav
FR=$(ls out/studio-frames | wc -l); echo "Images : $FR"
ffmpeg -y -v error -framerate 30 -i out/studio-frames/%05d.jpg -i out/studio-music.wav \
  -c:v libx264 -preset ${X264_PRESET:-slow} -crf 16 -profile:v high -level 4.2 -pix_fmt yuv420p -r 30 -g 60 \
  -c:a aac -b:a 192k -movflags +faststart -t 28 out/gestilys-studio-1080x1920.mp4
ffmpeg -y -v error -i out/gestilys-studio-1080x1920.mp4 -c:v libx264 -preset ${X264_PRESET:-slow} -crf 24 -maxrate 6M -bufsize 12M -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart out/gestilys-studio-whatsapp.mp4
ls -lh out/gestilys-studio-*.mp4
