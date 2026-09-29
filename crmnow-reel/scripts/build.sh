#!/usr/bin/env bash
# Full pipeline: frames (with motion blur) -> soundtrack -> Instagram-ready MP4 + cover.
#   bash scripts/build.sh            (uses `ffmpeg` from PATH, or FFMPEG=/path/to/ffmpeg)
set -euo pipefail
cd "$(dirname "$0")/.."
FFMPEG="${FFMPEG:-ffmpeg}"

node scripts/render.mjs --workers="${WORKERS:-4}" --out=out/video.mkv      # also writes out/cues.json
python3 scripts/soundtrack.py out/cues.json out/soundtrack.wav

# sRGB capture -> BT.709 limited-range 4:2:0 H.264, light luma dither against banding, AAC 256k
"$FFMPEG" -y -loglevel error -i out/video.mkv -i out/soundtrack.wav \
  -filter_complex "[0:v]scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p,noise=c0s=2:c0f=t+u[v]" \
  -map "[v]" -map 1:a \
  -c:v libx264 -preset slow -crf 17 -maxrate 18M -bufsize 36M -profile:v high -level 4.2 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -g 60 -r 30 \
  -c:a aac -b:a 256k -ar 48000 -ac 2 -movflags +faststart -shortest out/crmnow-reel.mp4

node scripts/shots.mjs out/.cover 29.2 && mv out/.cover/*.png out/cover.png && rm -rf out/.cover
echo "done: out/crmnow-reel.mp4, out/cover.png"
