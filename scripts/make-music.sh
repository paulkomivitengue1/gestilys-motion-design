#!/usr/bin/env bash
# Génère une nappe musicale douce (accords Am – F – C – G) entièrement synthétisée par FFmpeg.
# Créée par ce script : aucun droit d'auteur tiers. Sortie : build/music-generated.wav (~38 s).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build
chord() { # fréquences en Hz -> source de 10 s (sinus + léger désaccord pour l'effet « chœur »)
  local expr="0" f
  for f in "$@"; do expr="${expr}+0.10*sin(2*PI*${f}*t)+0.06*sin(2*PI*${f}*1.004*t)"; done
  echo "aevalsrc=${expr}:d=10:s=48000"
}
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "$(chord 110 220 261.63 329.63)" \
  -f lavfi -i "$(chord 87.31 220 261.63 349.23)" \
  -f lavfi -i "$(chord 130.81 261.63 329.63 392)" \
  -f lavfi -i "$(chord 98 196 246.94 293.66)" \
  -f lavfi -i "$(chord 110 220 261.63 329.63)" \
  -filter_complex "[0][1]acrossfade=d=3[x1];[x1][2]acrossfade=d=3[x2];[x2][3]acrossfade=d=3[x3];[x3][4]acrossfade=d=3[x4];\
[x4]lowpass=f=1400,tremolo=f=0.25:d=0.25,aecho=0.8:0.6:700|1100:0.35|0.25,volume=0.8,afade=t=in:d=2,afade=t=out:st=36:d=2,aformat=channel_layouts=stereo[a]" \
  -map "[a]" -c:a pcm_s16le build/music-generated.wav
ls -l build/music-generated.wav
