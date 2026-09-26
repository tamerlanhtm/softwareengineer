#!/usr/bin/env bash
# Full pipeline: frames (motion-blur sub-frames) → soundtrack → blended, graded master + variants.
#   ./build.sh            full quality (~15 min on 4 cores)
#   ./build.sh --workers 2
set -euo pipefail
cd "$(dirname "$0")"

command -v ffmpeg >/dev/null || { echo "ffmpeg (with libx264) is required — e.g. pip install imageio-ffmpeg && ln -s \$(python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())') /usr/local/bin/ffmpeg"; exit 1; }
[ -d node_modules ] || npm install --no-audit --no-fund
python3 -c "import numpy, scipy, PIL" 2>/dev/null || pip3 install numpy scipy pillow pyloudnorm

mkdir -p out deliverables
node scripts/render.mjs "$@"                                   # → out/frames/*.jpg + out/cues.json
python3 audio/soundtrack.py out/cues.json out/soundtrack.wav   # music + sound design, synced to cues
python3 audio/soundtrack.py out/cues.json out/sfx_only.wav --no-music
python3 scripts/blend.py --out deliverables/PMSNow_Reel_1080x1920.mp4 --grain 1.3 --crf 19

# variant with sound effects only (lay a trending Instagram track underneath)
ffmpeg -y -loglevel error -i deliverables/PMSNow_Reel_1080x1920.mp4 -i out/sfx_only.wav -map 0:v -map 1:a \
  -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart deliverables/PMSNow_Reel_1080x1920_sfx-only.mp4
cp out/stills/cover.jpg deliverables/PMSNow_Reel_cover.jpg
ls -lh deliverables
