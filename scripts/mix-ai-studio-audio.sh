#!/usr/bin/env bash
# Mixage isolé Gestilys AI Studio. Les voix doivent être enregistrées et autorisées.
set -euo pipefail
cd "$(dirname "$0")/.."
[ "${AI_STUDIO_AUDIO_APPROVED:-0}" = "1" ] || { echo "::error::Mixage bloqué : validation humaine requise (AI_STUDIO_AUDIO_APPROVED=1)."; exit 1; }
PLAN="out/ai-studio/audio-plan.json"
VIDEO="out/ai-studio/gestilys-video-sans-audio.mp4"
AUDIO_DIR="${AI_STUDIO_AUDIO_DIR:-audio/ai-studio}"
OUT="out/ai-studio/gestilys-video-avec-audio.mp4"
[ -s "$PLAN" ] || { echo "::error::Plan audio absent"; exit 1; }
[ -s "$VIDEO" ] || { echo "::error::Vidéo AI Studio sans audio absente"; exit 1; }
DUR=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$PLAN','utf8')).duration_seconds)")
COUNT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$PLAN','utf8')).voice.segments.length)")
FILES=(); CUES=()
for i in $(seq 1 "$COUNT"); do
  ID=$(printf '%02d' "$i")
  FILE=""
  for ext in wav m4a mp3 aac ogg opus flac; do
    if [ -s "$AUDIO_DIR/voiceover-$ID.$ext" ]; then FILE="$AUDIO_DIR/voiceover-$ID.$ext"; break; fi
  done
  [ -n "$FILE" ] || { echo "::error::Voix manquante : voiceover-$ID (wav/m4a/mp3/aac/ogg/opus/flac)"; exit 1; }
  CUE=$(node -e "const p=JSON.parse(require('fs').readFileSync('$PLAN','utf8'));console.log(p.voice.segments[$((i-1))].start_seconds)")
  FILES+=("$FILE"); CUES+=("$CUE")
done
MUSIC=""
for ext in wav mp3 m4a ogg; do
  if [ -s "$AUDIO_DIR/music.$ext" ]; then MUSIC="$AUDIO_DIR/music.$ext"; break; fi
done
if [ -z "$MUSIC" ] && [ "${AI_STUDIO_GENERATE_MUSIC:-0}" = "1" ]; then
  bash scripts/make-music.sh
  MUSIC="build/music-generated.wav"
fi
mkdir -p out/ai-studio
ARGS=(-i "$VIDEO")
FILTER=""
LABELS=""
for i in "${!FILES[@]}"; do
  ARGS+=(-i "${FILES[$i]}")
  MS=$(awk -v x="${CUES[$i]}" 'BEGIN{printf "%d",x*1000}')
  FILTER+="[$((i+1)):a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-16:TP=-1.5:LRA=11,adelay=$MS|$MS[v$i];"
  LABELS+="[v$i]"
done
FILTER+="${LABELS}amix=inputs=${#FILES[@]}:duration=longest:normalize=0,apad=whole_dur=$DUR,atrim=0:$DUR[voice]"
if [ -n "$MUSIC" ]; then
  ARGS+=(-stream_loop -1 -i "$MUSIC")
  MUSIC_INDEX=$(("${#FILES[@]}"+1))
  FILTER+=";[voice]asplit=2[side][vox];[$MUSIC_INDEX:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.16,afade=t=in:d=1.2,afade=t=out:st=$((DUR-3)):d=3[bed];[bed][side]sidechaincompress=threshold=0.035:ratio=5:attack=20:release=500[duck];[duck][vox]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[aout]"
else
  FILTER+=";[voice]alimiter=limit=0.95[aout]"
fi
ffmpeg -hide_banner -loglevel warning -y "${ARGS[@]}" -filter_complex "$FILTER" \
  -map 0:v:0 -map "[aout]" -c:v copy -c:a aac -b:a 192k -t "$DUR" -movflags +faststart "$OUT"
bash scripts/verify-ai-studio-audio.sh "$OUT"
