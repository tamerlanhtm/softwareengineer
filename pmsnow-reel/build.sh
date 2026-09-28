#!/usr/bin/env bash
# Full pipeline: frames (motion-blur sub-frames) → soundtrack → blended, graded master + variants.
#   ./build.sh                 English  (≈20 min on 4 cores)
#   ./build.sh az              Azerbaijani
#   ./build.sh az --workers 2  extra args go to scripts/render.mjs
set -euo pipefail
cd "$(dirname "$0")"

LC=en
if [[ "${1:-}" =~ ^[a-z]{2}$ ]]; then LC=$1; shift; fi
if [ "$LC" = en ]; then SUF=""; FRAMES=out/frames; CUES=out/cues.json
else SUF="_${LC^^}"; FRAMES=out/frames_$LC; CUES=out/cues_$LC.json; fi
OUT="deliverables/PMSNow_Reel${SUF}_1080x1920"

command -v ffmpeg >/dev/null || { echo "ffmpeg (with libx264) is required — e.g. pip install imageio-ffmpeg && ln -s \$(python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())') /usr/local/bin/ffmpeg"; exit 1; }
[ -d node_modules ] || npm install --no-audit --no-fund
python3 -c "import numpy, scipy, PIL" 2>/dev/null || pip3 install numpy scipy pillow pyloudnorm

mkdir -p out deliverables
node scripts/render.mjs --lang "$LC" "$@"                                  # → $FRAMES/*.jpg + $CUES
python3 audio/soundtrack.py "$CUES" "out/soundtrack$SUF.wav"               # music + sound design, synced to cues
python3 audio/soundtrack.py "$CUES" "out/sfx_only$SUF.wav" --no-music
python3 scripts/blend.py --frames "$FRAMES" --audio "out/soundtrack$SUF.wav" --stills "out/stills$SUF" --out "$OUT.mp4" --grain 1.3 --crf 19

# variant with sound effects only (lay a trending Instagram track underneath)
ffmpeg -y -loglevel error -i "$OUT.mp4" -i "out/sfx_only$SUF.wav" -map 0:v -map 1:a \
  -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart "${OUT}_sfx-only.mp4"
cp "out/stills$SUF/cover.jpg" "deliverables/PMSNow_Reel${SUF}_cover.jpg"
ls -lh deliverables
