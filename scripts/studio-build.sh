#!/usr/bin/env bash
# Assemble le MP4 final du studio : images (out/studio-frames) + audio (musique, ou voix + musique) → H.264/AAC 1080×1920 30 i/s.
set -euo pipefail
cd "$(dirname "$0")/.."
[ -d out/studio-frames ] || { echo "::error::Aucune image : lancez d'abord scripts/studio-render.mjs"; exit 1; }
node scripts/studio-music.mjs out/studio-music.wav
AUDIO=out/studio-music.wav
if [ -f out/studio-voice/voice.wav ]; then
  echo "Mixage voix + musique (la musique baisse sous la voix)"
  ffmpeg -y -v error -i out/studio-music.wav -i out/studio-voice/voice.wav -filter_complex \
    "[0:a]volume=0.7[m];[1:a]asplit=2[v1][v2];[m][v1]sidechaincompress=threshold=0.03:ratio=10:attack=8:release=380:makeup=1[duck];[duck][v2]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=9[a]" \
    -map "[a]" -ar 44100 -t 28 out/studio-mix.wav
  AUDIO=out/studio-mix.wav
fi
FR=$(ls out/studio-frames | wc -l); echo "Images : $FR"
ffmpeg -y -v error -framerate 30 -i out/studio-frames/%05d.jpg -i $AUDIO \
  -c:v libx264 -preset ${X264_PRESET:-slow} -crf 16 -profile:v high -level 4.2 -pix_fmt yuv420p -r 30 -g 60 \
  -c:a aac -b:a 192k -movflags +faststart -t 28 out/gestilys-studio-1080x1920.mp4
ffmpeg -y -v error -i out/gestilys-studio-1080x1920.mp4 -c:v libx264 -preset ${X264_PRESET:-slow} -crf 24 -maxrate 6M -bufsize 12M -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart out/gestilys-studio-whatsapp.mp4
ls -lh out/gestilys-studio-*.mp4
