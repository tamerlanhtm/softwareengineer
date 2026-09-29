#!/usr/bin/env bash
# Full pipeline: frames (motion blurred) -> soundtrack -> loudness -> MP4 deliverables.
set -euo pipefail
cd "$(dirname "$0")/.."
FRAMES=${FRAMES:-build/frames}
OUT=${OUT:-out}
mkdir -p "$OUT" build

if [ "${SKIP_FRAMES:-0}" != "1" ]; then
  rm -rf "$FRAMES"
  node scripts/render.mjs --out "$FRAMES" --sub 6 --subhi 24 --thresh 2.5 --workers "${WORKERS:-4}"
fi

python3 scripts/audio.py build/soundtrack_raw.wav
# two-pass loudness normalisation to -12 LUFS / -1 dBTP (linear gain, no pumping)
M=$(ffmpeg -hide_banner -nostats -i build/soundtrack_raw.wav -af loudnorm=I=-12:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$M" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -y -hide_banner -loglevel error -i build/soundtrack_raw.wav \
  -af "loudnorm=I=-12:TP=-1:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000" \
  -c:a pcm_s24le build/soundtrack.wav

VF="scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p,noise=c0s=2:c0f=t"
COLOR="-colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv"
X264="-c:v libx264 -preset slow -crf 16 -profile:v high -level 4.2 -g 60 -bf 2 -maxrate 24M -bufsize 36M"

ffmpeg -y -hide_banner -loglevel error -framerate 30 -i "$FRAMES/f_%05d.png" -i build/soundtrack.wav \
  -vf "$VF" $X264 $COLOR -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$OUT/psanow-reel.mp4"
ffmpeg -y -hide_banner -loglevel error -framerate 30 -i "$FRAMES/f_%05d.png" \
  -vf "$VF" $X264 $COLOR -an -movflags +faststart "$OUT/psanow-reel-no-music.mp4"
cp build/soundtrack.wav "$OUT/psanow-soundtrack.wav"

# reel cover options (1080x1920)
cp "$FRAMES/f_00897.png" "$OUT/cover-lockup.png"
cp "$FRAMES/f_00159.png" "$OUT/cover-logo.png"
cp "$FRAMES/f_00480.png" "$OUT/cover-modules.png"
ls -la "$OUT"
