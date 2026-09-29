"""Tile a range of rendered frames (render/<dir>/f_#####.png) for motion review.

usage: python3 scripts/strip.py <frames_dir> <first> <last> <step> <out.png> [cols] [thumb_w]
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

d, a, b, step, out = Path(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
cols = int(sys.argv[6]) if len(sys.argv) > 6 else 10
tw = int(sys.argv[7]) if len(sys.argv) > 7 else 216
th = tw * 16 // 9
idx = list(range(a, b + 1, step))
rows = (len(idx) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (tw + 4) + 4, rows * (th + 22) + 4), (40, 40, 44))
dr = ImageDraw.Draw(sheet)
for i, f in enumerate(idx):
    im = Image.open(d / f"f_{f:05d}.png").convert("RGB").resize((tw, th), Image.LANCZOS)
    x, y = 4 + (i % cols) * (tw + 4), 4 + (i // cols) * (th + 22)
    sheet.paste(im, (x, y + 18))
    dr.text((x + 2, y + 3), f"{f} ({f / 30:.2f}s)", fill=(255, 200, 120))
sheet.save(out)
print(out, sheet.size)
