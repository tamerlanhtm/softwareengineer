#!/usr/bin/env bash
# Master the soundtrack and encode the Instagram deliverables.
#
#   scripts/encode.sh [en|az]    (frames from render/frames or render/frames_<lang>)
#
# Outputs (export/, "_AZ" etc. added for other languages):
#   HMSNow_reel_1080x1920.mp4          full mix: music + sound design
#   HMSNow_reel_1080x1920_sfx-only.mp4 sound design only, for adding Instagram music
#   HMSNow_reel_cover.jpg              cover frame (end card)
set -euo pipefail
cd "$(dirname "$0")/.."
FFMPEG="${FFMPEG:-ffmpeg}"
LANG_CODE="${1:-en}"
if [ "$LANG_CODE" = en ]; then
  FRAMES=render/frames; SUFFIX=""
else
  FRAMES="render/frames_$LANG_CODE"; SUFFIX="_$(echo "$LANG_CODE" | tr '[:lower:]' '[:upper:]')"
fi
mkdir -p export render

# Two-pass EBU R128 loudness normalisation.
normalize() { # in out target_lufs
  local stats
  stats=$("$FFMPEG" -hide_banner -nostats -i "$1" -af "loudnorm=I=$3:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
  local mi mtp mlra mth off
  mi=$(echo "$stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["input_i"])')
  mtp=$(echo "$stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["input_tp"])')
  mlra=$(echo "$stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["input_lra"])')
  mth=$(echo "$stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["input_thresh"])')
  off=$(echo "$stats" | python3 -c 'import json,sys; print(json.load(sys.stdin)["target_offset"])')
  "$FFMPEG" -hide_banner -loglevel error -y -i "$1" \
    -af "loudnorm=I=$3:TP=-1.5:LRA=11:measured_I=$mi:measured_TP=$mtp:measured_LRA=$mlra:measured_thresh=$mth:offset=$off:linear=true" \
    -ar 48000 "$2"
}

python3 audio/soundtrack.py render/music_raw.wav
python3 audio/soundtrack.py render/sfx_raw.wav --sfx-only
normalize render/music_raw.wav render/music.wav -14
normalize render/sfx_raw.wav render/sfx.wav -18

encode() { # audio out
  "$FFMPEG" -hide_banner -loglevel error -y \
    -framerate 30 -i "$FRAMES/f_%05d.png" -i "$1" \
    -map 0:v -map 1:a \
    -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
    -c:v libx264 -preset slow -crf 16 -profile:v high -level:v 4.2 \
    -x264-params "keyint=60:min-keyint=30" \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
    -c:a aac -b:a 256k -ar 48000 \
    -movflags +faststart -shortest "$2"
}

encode render/music.wav "export/HMSNow_reel${SUFFIX}_1080x1920.mp4"
encode render/sfx.wav "export/HMSNow_reel${SUFFIX}_1080x1920_sfx-only.mp4"
"$FFMPEG" -hide_banner -loglevel error -y -i "$FRAMES/f_00885.png" -q:v 2 "export/HMSNow_reel${SUFFIX}_cover.jpg"
ls -lh export
