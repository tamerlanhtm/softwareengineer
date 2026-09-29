#!/usr/bin/env bash
# Encode rendered frames (+ soundtrack) into Instagram-ready MP4s.
#   scripts/encode.sh [path/to/audio.wav]
# Produces:
#   out/bmsnow-reel.mp4          1080x1920 30fps H.264 High + AAC 48 kHz (with soundtrack)
#   out/bmsnow-reel-silent.mp4   same picture, no audio (for adding Instagram library music)
#   out/cover.jpg                cover frame for the Reel / profile grid
set -euo pipefail
cd "$(dirname "$0")/.."

FRAMES="out/frames/f_%05d.png"
AUDIO="${1:-out/audio.wav}"
[ -f out/frames/f_00000.png ] || { echo "no frames: run node scripts/render.mjs first" >&2; exit 1; }

# RGB PNG -> BT.709 limited-range 4:2:0, tagged so players/Instagram keep the brand orange exact.
VF="scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p"
VIDEO=(-c:v libx264 -preset slow -crf 15 -profile:v high -level 4.2 -pix_fmt yuv420p -vf "$VF"
       -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv
       -g 60 -bf 2 -movflags +faststart)

ffmpeg -hide_banner -loglevel warning -y -framerate 30 -i "$FRAMES" "${VIDEO[@]}" -an out/bmsnow-reel-silent.mp4

if [ -f "$AUDIO" ]; then
  ffmpeg -hide_banner -loglevel warning -y -framerate 30 -i "$FRAMES" -i "$AUDIO" "${VIDEO[@]}" \
    -c:a aac -b:a 256k -ar 48000 -ac 2 -shortest out/bmsnow-reel.mp4
else
  echo "warning: $AUDIO not found, skipping the version with sound" >&2
fi

# cover: end card (logo + tagline + URL); survives the 3:4 profile-grid crop
ffmpeg -hide_banner -loglevel warning -y -i out/frames/f_00890.png -q:v 2 out/cover.jpg
ls -lh out/*.mp4 out/cover.jpg
