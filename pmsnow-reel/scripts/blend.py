#!/usr/bin/env python3
"""
Average motion-blur sub-frames (in linear light), add soft film grain, and
encode the final Instagram master with the soundtrack.

  python3 scripts/blend.py [--audio out/soundtrack.wav] [--out out/PMSNow_Reel_1080x1920.mp4] [--grain 2.2]
"""
import argparse
import glob
import os
import shutil
import subprocess
import sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, FPS, N = 1080, 1920, 30, 900

ap = argparse.ArgumentParser()
ap.add_argument('--frames', default=os.path.join(ROOT, 'out/frames'))
ap.add_argument('--audio', default=os.path.join(ROOT, 'out/soundtrack.wav'))
ap.add_argument('--out', default=os.path.join(ROOT, 'out/PMSNow_Reel_1080x1920.mp4'))
ap.add_argument('--grain', type=float, default=1.3, help='grain sigma in 8-bit levels (0 = off)')
ap.add_argument('--crf', type=int, default=18)
ap.add_argument('--stills', default=os.path.join(ROOT, 'out/stills'), help='dir for a few blended stills (cover etc.)')
args = ap.parse_args()

# sRGB <-> linear lookup tables
s = np.arange(256) / 255.0
TO_LIN = np.where(s <= 0.04045, s / 12.92, ((s + 0.055) / 1.055) ** 2.4).astype(np.float32)
q = np.linspace(0, 1, 4096)
TO_SRGB = (np.where(q <= 0.0031308, q * 12.92, 1.055 * q ** (1 / 2.4) - 0.055) * 255.0).astype(np.float32)

ffmpeg = shutil.which('ffmpeg') or 'ffmpeg'
cmd = [ffmpeg, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-']
if args.audio and os.path.exists(args.audio):
    cmd += ['-i', args.audio]
cmd += ['-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', str(args.crf), '-profile:v', 'high', '-level:v', '4.2',
        '-x264-params', 'keyint=60:min-keyint=30:aq-mode=3:deblock=-1,-1',
        '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
        '-r', str(FPS)]
if args.audio and os.path.exists(args.audio):
    cmd += ['-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest']
cmd += ['-movflags', '+faststart', args.out]

os.makedirs(os.path.dirname(args.out), exist_ok=True)
os.makedirs(args.stills, exist_ok=True)
proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
STILLS = {0: 'first_frame', 195: 'dashboard', 324: 'frontdesk', 370: 'housekeeping', 430: 'billing', 540: 'guests',
          700: 'cube', 885: 'cover'}

for n in range(N):
    files = sorted(glob.glob(os.path.join(args.frames, f'f{n:04d}_*.jpg')))
    if not files:
        sys.exit(f'missing sub-frames for frame {n}')
    acc = np.zeros((H, W, 3), np.float32)
    for f in files:
        acc += TO_LIN[np.asarray(Image.open(f).convert('RGB'))]
    lin = acc / len(files)
    out = TO_SRGB[np.clip(lin * 4095 + 0.5, 0, 4095).astype(np.int32)]
    if args.grain > 0:
        rng = np.random.default_rng(90210 + n)
        g = rng.standard_normal((H // 2, W // 2)).astype(np.float32)
        g = np.asarray(Image.fromarray(g).resize((W, H), Image.BILINEAR))
        # grain strongest in the mid-tones, gentle in deep blacks and highlights
        luma = out.mean(axis=2) / 255.0
        wgt = 0.55 + 1.8 * luma * (1 - luma)
        out = out + (g * args.grain * 1.4 * wgt)[..., None]
    frame = np.clip(out + 0.5, 0, 255).astype(np.uint8)
    proc.stdin.write(frame.tobytes())
    if n in STILLS:
        Image.fromarray(frame).save(os.path.join(args.stills, f'{STILLS[n]}.jpg'), quality=94)
    if n % 60 == 0:
        print(f'blend {n}/{N}', flush=True)
proc.stdin.close()
if proc.wait() != 0:
    sys.exit('ffmpeg failed')
print('wrote', args.out)
