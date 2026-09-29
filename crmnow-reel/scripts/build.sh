#!/usr/bin/env bash
# Full pipeline per language: frames (with motion blur) -> soundtrack -> Instagram-ready MP4 + cover.
#   bash scripts/build.sh              English + Azerbaijani
#   LANGS=az bash scripts/build.sh     a single language
# Uses `ffmpeg` from PATH (or FFMPEG=/path/to/ffmpeg).
set -euo pipefail
cd "$(dirname "$0")/.."
FFMPEG="${FFMPEG:-ffmpeg}"

for CODE in ${LANGS:-en az}; do
  SUFFIX=""
  [ "$CODE" != "en" ] && SUFFIX="-$CODE"

  node scripts/render.mjs --lang="$CODE" --workers="${WORKERS:-4}" --out="out/video$SUFFIX.mkv"   # + out/cues$SUFFIX.json
  python3 scripts/soundtrack.py "out/cues$SUFFIX.json" "out/soundtrack$SUFFIX.wav"

  # sRGB capture -> BT.709 limited-range 4:2:0 H.264, light luma dither against banding, AAC 256k
  "$FFMPEG" -y -loglevel error -i "out/video$SUFFIX.mkv" -i "out/soundtrack$SUFFIX.wav" \
    -filter_complex "[0:v]scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p,noise=c0s=2:c0f=t+u[v]" \
    -map "[v]" -map 1:a \
    -c:v libx264 -preset slow -crf 17 -maxrate 18M -bufsize 36M -profile:v high -level 4.2 \
    -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -g 60 -r 30 \
    -c:a aac -b:a 256k -ar 48000 -ac 2 -movflags +faststart -shortest "out/crmnow-reel$SUFFIX.mp4"

  node scripts/shots.mjs --lang="$CODE" out/.cover 29.2 && mv out/.cover/*.png "out/cover$SUFFIX.png" && rm -rf out/.cover
  echo "done [$CODE]: out/crmnow-reel$SUFFIX.mp4, out/cover$SUFFIX.png"
done
