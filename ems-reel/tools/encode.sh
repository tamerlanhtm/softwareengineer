#!/usr/bin/env bash
# Encode build/frames/*.png + soundtrack into Instagram-ready MP4s.
#   tools/encode.sh            -> export/EMSNow-reel.mp4 (music + SFX)
#                                 export/EMSNow-reel-sfx-only.mp4 (for pairing with an in-app track)
#                                 export/EMSNow-reel-cover.jpg
set -euo pipefail
cd "$(dirname "$0")/.."
FF=${FFMPEG:-$(command -v ffmpeg || python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")}
mkdir -p export

python3 tools/make_audio.py build/cues.json build/music.wav
python3 tools/make_audio.py build/cues.json build/sfx.wav --no-music --lufs -18

VIDEO=(-framerate 30 -i build/frames/%05d.png)
VOPTS=(-map 0:v -map 1:a
  -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"
  -c:v libx264 -preset slow -crf 17 -maxrate 20M -bufsize 40M
  -profile:v high -level 4.2 -g 60 -bf 2
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv
  -c:a aac -b:a 256k -ar 48000 -ac 2
  -movflags +faststart -shortest)

"$FF" -y -hide_banner -loglevel warning "${VIDEO[@]}" -i build/music.wav "${VOPTS[@]}" export/EMSNow-reel.mp4
"$FF" -y -hide_banner -loglevel warning "${VIDEO[@]}" -i build/sfx.wav "${VOPTS[@]}" export/EMSNow-reel-sfx-only.mp4

# cover: the finished end card
"$FF" -y -hide_banner -loglevel warning -i build/frames/00870.png -frames:v 1 -update 1 -q:v 2 export/EMSNow-reel-cover.jpg
ls -lh export
