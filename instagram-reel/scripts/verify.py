"""Sanity-checks a delivered reel: stream specs, duration, loudness, and that
the big audio hits land on the visual beats (A/V sync).

  python3 scripts/verify.py deliverables/TOSNow_Reel_1080x1920.mp4
"""
import re
import subprocess
import sys

import numpy as np

FF = 'ffmpeg'
path = sys.argv[1]
info = subprocess.run([FF, '-hide_banner', '-i', path], capture_output=True, text=True).stderr
print('\n'.join(l.strip() for l in info.splitlines() if re.search(r'Duration|Stream #', l)))

# Loudness
err = subprocess.run([FF, '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                     capture_output=True, text=True).stderr
s = err[err.rfind('Summary:'):]
print('loudness', re.search(r'I:\s+(-?[\d.]+) LUFS', s).group(1), 'LUFS, true peak',
      re.search(r'Peak:\s+(-?[\d.]+) dBFS', s).group(1), 'dBTP')

# A/V sync: onset of the logo impact (beat 8 = 3.75 s) and the CTA impact (beat 56 = 26.25 s)
raw = subprocess.run([FF, '-v', 'error', '-i', path, '-ac', '1', '-ar', '48000', '-f', 's16le', '-'],
                     capture_output=True).stdout
x = np.frombuffer(raw, dtype='<i2').astype(float) / 32768
if len(x):
    env = np.sqrt(np.convolve(x ** 2, np.ones(240) / 240, mode='same'))
    for name, t in (('logo impact', 3.75), ('CTA impact', 26.25), ('"Now." slam', 27.1875)):
        a, b = int((t - 0.15) * 48000), int((t + 0.15) * 48000)
        seg = env[a:b]
        rise = np.argmax(np.diff(seg))
        onset = (a + rise) / 48000
        print(f'{name:12s} expected {t:.3f}s  audio onset {onset:.3f}s  Δ {1000 * (onset - t):+.0f} ms')
