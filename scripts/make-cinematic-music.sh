#!/usr/bin/env bash
set -euo pipefail
mkdir -p out
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "sine=frequency=55:duration=55:sample_rate=48000" \
  -f lavfi -i "sine=frequency=110:duration=55:sample_rate=48000" \
  -f lavfi -i "sine=frequency=164.81:duration=55:sample_rate=48000" \
  -f lavfi -i "anoisesrc=color=pink:duration=55:sample_rate=48000" \
  -filter_complex \
  "[0:a]volume=0.16,lowpass=f=100,afade=t=in:st=0:d=3[a0]; \
   [1:a]volume=0.055,tremolo=f=0.12:d=0.18,lowpass=f=500[a1]; \
   [2:a]volume=0.025,tremolo=f=0.10:d=0.22,lowpass=f=1000[a2]; \
   [3:a]lowpass=f=1200,volume=0.008[a3]; \
   [a0][a1][a2][a3]amix=inputs=4:duration=longest:normalize=0,alimiter=limit=0.85,afade=t=in:st=0:d=2,afade=t=out:st=52:d=3[out]" \
  -map "[out]" -t 55 -ar 48000 -c:a pcm_s16le out/cinematic-music.wav
echo "Piste musicale originale générée : 55 s"
