#!/usr/bin/env bash
# Encode rendered frames + soundtrack into Instagram-ready MP4s.
#   tools/encode.sh [en|az]
#     en (default) -> export/EMSNow-reel.mp4, export/EMSNow-reel-sfx-only.mp4, export/EMSNow-reel-cover.jpg
#     az           -> export/EMSNow-reel-az.mp4, export/EMSNow-reel-az-sfx-only.mp4, export/EMSNow-reel-az-cover.jpg
# (render first: node tools/render.mjs --lang <lang>)
set -euo pipefail
cd "$(dirname "$0")/.."
LANG_CODE=${1:-en}
SUFFIX=$([ "$LANG_CODE" = "en" ] && echo "" || echo "-$LANG_CODE")
FF=${FFMPEG:-$(command -v ffmpeg || python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")}
FRAMES=build/frames$SUFFIX
CUES=build/cues$SUFFIX.json
OUT=export/EMSNow-reel$SUFFIX
mkdir -p export

python3 tools/make_audio.py "$CUES" "build/music$SUFFIX.wav"
python3 tools/make_audio.py "$CUES" "build/sfx$SUFFIX.wav" --no-music --lufs -18

VIDEO=(-framerate 30 -i "$FRAMES/%05d.png")
VOPTS=(-map 0:v -map 1:a
  -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"
  -c:v libx264 -preset slow -crf 17 -maxrate 20M -bufsize 40M
  -profile:v high -level 4.2 -g 60 -bf 2
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv
  -c:a aac -b:a 256k -ar 48000 -ac 2
  -movflags +faststart -shortest)

"$FF" -y -hide_banner -loglevel warning "${VIDEO[@]}" -i "build/music$SUFFIX.wav" "${VOPTS[@]}" "$OUT.mp4"
"$FF" -y -hide_banner -loglevel warning "${VIDEO[@]}" -i "build/sfx$SUFFIX.wav" "${VOPTS[@]}" "$OUT-sfx-only.mp4"

# cover: the finished end card
"$FF" -y -hide_banner -loglevel warning -i "$FRAMES/00870.png" -frames:v 1 -update 1 -q:v 2 "$OUT-cover.jpg"
ls -lh "$OUT"*
