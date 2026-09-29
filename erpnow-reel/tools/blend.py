"""Motion-blur accumulator between the Chromium capture and ffmpeg.

Reads output frames from stdin, each as:  uint32 k, then k x (uint32 length, PNG bytes)
(big-endian), averages the k sub-frames in float32 and pipes the result to ffmpeg as raw
RGB, which writes a lossless FFV1 segment. Decoding the PNGs here (instead of ffmpeg's
image2pipe PNG parser) keeps every sub-frame grouped exactly with its output frame.

Usage: python3 tools/blend.py out.mkv [fps]
"""
import io
import os
import struct
import subprocess
import sys

import numpy as np
from PIL import Image

W, H = 1080, 1920


def read_exact(f, n):
    buf = bytearray()
    while len(buf) < n:
        chunk = f.read(n - len(buf))
        if not chunk:
            return None if not buf else bytes(buf)
        buf += chunk
    return bytes(buf)


def main():
    out = sys.argv[1]
    fps = sys.argv[2] if len(sys.argv) > 2 else '30'
    ff = os.environ.get('FFMPEG', 'ffmpeg')
    enc = subprocess.Popen([ff, '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', fps,
                            '-i', '-', '-c:v', 'ffv1', '-level', '3', '-pix_fmt', 'bgr0', out], stdin=subprocess.PIPE)
    src = sys.stdin.buffer
    acc = np.zeros((H, W, 3), np.float32)
    frames = 0
    while True:
        hdr = read_exact(src, 4)
        if hdr is None:
            break
        (k,) = struct.unpack('>I', hdr)
        acc[:] = 0
        for _ in range(k):
            (ln,) = struct.unpack('>I', read_exact(src, 4))
            data = read_exact(src, ln)
            if data is None or len(data) != ln:
                sys.exit(f'blend: truncated sub-frame in output frame {frames}')
            im = Image.open(io.BytesIO(data)).convert('RGB')
            if im.size != (W, H):
                sys.exit(f'blend: unexpected frame size {im.size}')
            acc += np.asarray(im, dtype=np.float32)
        enc.stdin.write(np.rint(acc / k).astype(np.uint8).tobytes())
        frames += 1
    enc.stdin.close()
    rc = enc.wait()
    print(f'blend: {frames} frames -> {os.path.basename(out)}', file=sys.stderr)
    sys.exit(rc)


if __name__ == '__main__':
    main()
