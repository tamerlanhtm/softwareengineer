#!/usr/bin/env bash
# Full pipeline: cue sheet -> soundtrack -> motion-blurred frames -> Instagram-ready MP4s + covers.
#   bash tools/build.sh            (SUB=6 WORKERS=4 by default; SUB=1 for a fast draft)
#   node tools/render.mjs patch --from A --to B && SKIP_RENDER=1 bash tools/build.sh   (re-render a range only)
set -euo pipefail
cd "$(dirname "$0")/.."
FFMPEG="${FFMPEG:-$(command -v ffmpeg || python3 -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())')}"
export FFMPEG
SUB="${SUB:-6}"
WORKERS="${WORKERS:-4}"
mkdir -p build out

echo "==> cue sheet";   node tools/render.mjs cues
echo "==> soundtrack";  python3 tools/audio.py build/soundtrack.wav
if [ -z "${SKIP_RENDER:-}" ]; then
  echo "==> frames (sub-frames: $SUB, workers: $WORKERS)"
  node tools/render.mjs video --sub "$SUB" --fastsub "${FASTSUB:-12}" --shutter 0.5 --workers "$WORKERS"
fi

# RGB -> BT.709 limited-range 4:2:0, tagged, so phones show the brand orange correctly.
VF="scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p"
X264=(-c:v libx264 -preset slow -crf 17 -maxrate 16M -bufsize 32M -profile:v high -level 4.2
      -x264-params "keyint=60:min-keyint=30:bframes=2:aq-mode=3"
      -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv -movflags +faststart)

echo "==> encode"
"$FFMPEG" -y -v error -i build/video.mkv -i build/soundtrack.wav -map 0:v -map 1:a -vf "$VF" "${X264[@]}" \
  -c:a aac -b:a 256k -ar 48000 -shortest out/ERPNow_Reel_30s.mp4
"$FFMPEG" -y -v error -i build/video.mkv -vf "$VF" "${X264[@]}" -an out/ERPNow_Reel_30s_no-music.mp4
cp build/soundtrack.wav out/ERPNow_Reel_soundtrack.wav

echo "==> covers"
node tools/render.mjs stills 5.9 29.6
cp build/stills/t_5.900.png out/ERPNow_Reel_cover.png
cp build/stills/t_29.600.png out/ERPNow_Reel_endcard.png

ls -lh out/
