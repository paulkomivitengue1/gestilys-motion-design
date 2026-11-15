#!/usr/bin/env bash
# Contrôle du MP4 : codec, taille, cadence, audio, durée, absence d'images noires/figées en cours de vidéo.
set -euo pipefail
cd "$(dirname "$0")/.."
F=${1:-out/gestilys-studio-1080x1920.mp4}
[ -f "$F" ] || { echo "::error::Fichier introuvable : $F"; exit 1; }
V=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,pix_fmt,r_frame_rate -of csv=p=0 "$F")
A=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$F" || true)
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F")
NF=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$F")
echo "Fichier : $F ($(awk -v s=$(stat -c %s "$F") 'BEGIN{printf "%.1f Mo", s/1048576}'))"
echo "Vidéo   : $V · $NF images"; echo "Audio   : ${A:-AUCUNE}"; echo "Durée   : $DUR s"
fail=0
[ "$V" = "h264,1080,1920,yuv420p,30/1" ] || { echo "::error::Format vidéo inattendu : $V"; fail=1; }
[ "$A" = "aac" ] || { echo "::error::Piste audio AAC absente"; fail=1; }
awk -v d="$DUR" 'BEGIN{ if (d < 27.9 || d > 28.1) exit 1 }' || { echo "::error::Durée inattendue : $DUR s (attendu 28 s)"; fail=1; }
[ "$NF" = "840" ] || { echo "::error::Nombre d'images inattendu : $NF (attendu 840)"; fail=1; }
# images noires ou figées pendant plus de 0,4 s (la toute fin, volontairement sombre, est exclue)
BL=$(ffmpeg -v info -t 27.2 -i "$F" -vf "blackdetect=d=0.4:pix_th=0.12" -an -f null - 2>&1 | grep -c black_start || true)
FZ=$(ffmpeg -v info -t 27.2 -i "$F" -vf "freezedetect=n=-60dB:d=0.4" -an -f null - 2>&1 | grep -c freeze_start || true)
echo "Segments noirs : $BL · segments figés : $FZ"
[ "$BL" = 0 ] || { echo "::error::Image noire détectée"; fail=1; }
[ "$FZ" = 0 ] || { echo "::error::Image figée détectée"; fail=1; }
[ "$fail" = 0 ] && echo "OK : le MP4 respecte le cahier des charges" || exit 1
