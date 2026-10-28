#!/usr/bin/env bash
# Mixe la voix off et la musique (facultatives) avec la vidéo maître, sans refaire le rendu des images.
#
# Entrées  : out/gestilys-video-sans-audio.mp4                          (obligatoire)
#            audio/voiceover-01.m4a, -02, -03 …  une phrase par fichier   (facultatif, recommandé)
#              placées aux instants audio.voiceoverCues de la config
#            ou audio/voiceover.m4a                un seul fichier        (facultatif)
#              démarre à audio.voiceoverOffsetSeconds
#            audio/music.mp3                                              (facultatif)
#            formats acceptés : m4a mp3 wav aac ogg opus flac 3gp mp4
# Sorties  : out/gestilys-pub-1080x1920.mp4   (qualité maître, piste audio AAC toujours présente)
#            out/gestilys-pub-whatsapp.mp4    (même vidéo, plus légère pour WhatsApp)
#
# Variables : VO_OFFSET     secondes avant le début de la voix (mode fichier unique)
#             GENERATE_MUSIC=1  génère une nappe musicale libre de droits si aucun audio/music.* n'existe
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=${SRC:-out/gestilys-video-sans-audio.mp4}
[ -f "$SRC" ] || { echo "::error::Vidéo maître introuvable : $SRC"; exit 1; }
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")

cfg() { node -e "try{const a=JSON.parse(require('fs').readFileSync('config/video.config.json','utf8')).audio||{};console.log($1)}catch(e){console.log('')}" 2>/dev/null || true; }
if [ -z "${VO_OFFSET:-}" ]; then VO_OFFSET=$(cfg "a.voiceoverOffsetSeconds"); fi
VO_OFFSET=${VO_OFFSET:-0.6}
FADE_START=$(awk -v d="$DUR" 'BEGIN{v=d-2.5; if(v<0)v=0; printf "%.2f", v}')

find_audio() { # $1 = nom de base sans extension
  local ext
  for ext in m4a mp3 wav aac ogg opus flac 3gp mp4; do
    if [ -f "audio/$1.$ext" ]; then echo "audio/$1.$ext"; return 0; fi
  done
  return 1
}

# --- Voix off : une phrase par fichier (voiceover-01…) ou un seul fichier (voiceover) ---
LINES=(); CUES=()
for n in $(seq -w 1 30); do
  f=$(find_audio "voiceover-$n" || true)
  if [ -n "$f" ]; then LINES+=("$f"); fi
done
if [ "${#LINES[@]}" -gt 0 ]; then
  read -r -a CUES <<< "$(cfg "(a.voiceoverCues||[]).join(' ')")"
  if [ "${#CUES[@]}" -lt "${#LINES[@]}" ]; then
    echo "::error::${#LINES[@]} fichiers voiceover-NN trouvés mais seulement ${#CUES[@]} instants dans audio.voiceoverCues (config/video.config.json)"; exit 1
  fi
else
  single=$(find_audio voiceover || true)
  if [ -n "$single" ]; then LINES=("$single"); CUES=("$VO_OFFSET"); fi
fi
NV=${#LINES[@]}

# --- Musique ---
MUS=$(find_audio music || true)
if [ -z "$MUS" ] && [ "${GENERATE_MUSIC:-0}" = "1" ]; then
  bash scripts/make-music.sh
  MUS="build/music-generated.wav"
fi

VO_ARGS=(); VO_FILTER=""
if [ "$NV" -gt 0 ]; then
  labels=""
  for i in "${!LINES[@]}"; do
    ms=$(awk -v o="${CUES[$i]}" 'BEGIN{printf "%d", o*1000}')
    echo "  voix $((i+1))/$NV : ${LINES[$i]} à ${CUES[$i]} s"
    VO_ARGS+=(-i "${LINES[$i]}")
    VO_FILTER+="[${i}:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,adelay=${ms}|${ms}[v${i}];"
    labels+="[v${i}]"
  done
  if [ "$NV" -eq 1 ]; then
    VO_FILTER+="[v0]apad=whole_dur=${DUR}[vomix]"
  else
    VO_FILTER+="${labels}amix=inputs=${NV}:duration=longest:normalize=0,apad=whole_dur=${DUR}[vomix]"
  fi
fi

mkdir -p out
MIX=out/audio-mix.m4a
QUIET="-hide_banner -loglevel error -y"

if [ "$NV" -gt 0 ] && [ -n "$MUS" ]; then
  echo "Audio : voix off ($NV fichier(s)) + musique ($MUS), musique abaissée sous la voix"
  ffmpeg $QUIET "${VO_ARGS[@]}" -stream_loop -1 -t "$DUR" -i "$MUS" -filter_complex \
    "${VO_FILTER};[vomix]asplit=2[vo][sc];\
[${NV}:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-26:TP=-2:LRA=7,aresample=48000,afade=t=in:st=0:d=1.5,afade=t=out:st=${FADE_START}:d=2.5[mu];\
[mu][sc]sidechaincompress=threshold=0.04:ratio=6:attack=20:release=600[duck];\
[vo][duck]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[a]" \
    -map "[a]" -t "$DUR" -c:a aac -b:a 192k "$MIX"
elif [ "$NV" -gt 0 ]; then
  echo "Audio : voix off seule ($NV fichier(s))"
  ffmpeg $QUIET "${VO_ARGS[@]}" -filter_complex "${VO_FILTER};[vomix]alimiter=limit=0.95[a]" -map "[a]" -t "$DUR" -c:a aac -b:a 192k "$MIX"
elif [ -n "$MUS" ]; then
  echo "Audio : musique seule ($MUS)"
  ffmpeg $QUIET -stream_loop -1 -t "$DUR" -i "$MUS" -filter_complex \
    "[0:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-18:TP=-2:LRA=7,aresample=48000,afade=t=in:st=0:d=1.5,afade=t=out:st=${FADE_START}:d=2.5[a]" \
    -map "[a]" -t "$DUR" -c:a aac -b:a 192k "$MIX"
else
  echo "Audio : aucune voix off ni musique trouvée -> piste audio silencieuse (compatibilité réseaux sociaux)"
  ffmpeg $QUIET -f lavfi -t "$DUR" -i "anullsrc=r=48000:cl=stereo" -c:a aac -b:a 192k "$MIX"
fi

COLOR="-colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv"

# Version maître : la vidéo n'est pas ré-encodée
ffmpeg $QUIET -i "$SRC" -i "$MIX" -map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -movflags +faststart -t "$DUR" out/gestilys-pub-1080x1920.mp4

# Version WhatsApp : débit plafonné pour un fichier plus léger
ffmpeg $QUIET -i "$SRC" -i "$MIX" -map 0:v:0 -map 1:a:0 \
  -c:v libx264 -preset slow -crf 24 -maxrate 3500k -bufsize 7000k -profile:v high -level 4.1 -pix_fmt yuv420p $COLOR \
  -c:a copy -movflags +faststart -t "$DUR" out/gestilys-pub-whatsapp.mp4

ls -l out/gestilys-pub-1080x1920.mp4 out/gestilys-pub-whatsapp.mp4
