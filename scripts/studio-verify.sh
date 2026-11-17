#!/usr/bin/env bash
# Contrôle du MP4 : codec, taille, cadence, audio, durée, images noires/figées, niveau audio, voix présente dans ses fenêtres.
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
# audio : niveau moyen/crête cohérents, pas de silence prolongé, voix présente dans ses fenêtres
MV=$(ffmpeg -hide_banner -i "$F" -vn -af volumedetect -f null - 2>&1 | grep -oE "mean_volume: -?[0-9.]+" | grep -oE "\-?[0-9.]+$" || echo -99)
PV=$(ffmpeg -hide_banner -i "$F" -vn -af volumedetect -f null - 2>&1 | grep -oE "max_volume: -?[0-9.]+" | grep -oE "\-?[0-9.]+$" || echo 0)
SIL=$(ffmpeg -hide_banner -t 27.2 -i "$F" -vn -af "silencedetect=n=-50dB:d=1.0" -f null - 2>&1 | grep -c silence_start || true)
echo "Audio   : niveau moyen ${MV} dB, crête ${PV} dB, silences > 1 s : $SIL"
awk -v m="$MV" 'BEGIN{ if (m < -26 || m > -9) exit 1 }' || { echo "::error::Niveau audio moyen hors plage (-26 à -9 dB) : $MV"; fail=1; }
awk -v p="$PV" 'BEGIN{ if (p > -0.3) exit 1 }' || { echo "::error::Saturation audio (crête $PV dB)"; fail=1; }
[ "$SIL" = 0 ] || { echo "::error::Silence prolongé détecté dans l'audio"; fail=1; }
if [ -f out/studio-voice/timing.json ]; then
  node -e '
    const t=JSON.parse(require("fs").readFileSync("out/studio-voice/timing.json","utf8"));
    const {spawnSync}=require("child_process"); let bad=0;
    for (const s of t.segments) {
      const r=spawnSync("ffmpeg",["-hide_banner","-ss",String(s.start),"-t",String(s.end-s.start),"-i",process.argv[1],"-vn","-af","volumedetect","-f","null","-"],{encoding:"utf8"});
      const m=/mean_volume:\s*(-?[\d.]+)/.exec(r.stderr||""); const v=m?parseFloat(m[1]):-99;
      console.log("Voix    : "+s.id.padEnd(9)+" "+s.start.toFixed(1)+"→"+s.end.toFixed(1)+" s, niveau "+v+" dB");
      if (v < -35) { console.log("::error::Voix absente ou trop faible : "+s.id); bad++; }
    }
    process.exit(bad?1:0);' "$F" || fail=1
fi
[ "$fail" = 0 ] && echo "OK : le MP4 respecte le cahier des charges" || exit 1
