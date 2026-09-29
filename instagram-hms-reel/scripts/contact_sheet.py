"""Tile rendered stills into one labelled contact sheet for quick review.

usage: python3 scripts/contact_sheet.py <stills_dir> <out.png> [cols] [thumb_width]
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

src = Path(sys.argv[1])
out = Path(sys.argv[2])
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 5
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 360
th = tw * 16 // 9

files = sorted(src.glob("t*.png"))
rows = (len(files) + cols - 1) // cols
pad = 8
sheet = Image.new("RGB", (cols * (tw + pad) + pad, rows * (th + pad + 26) + pad), (40, 40, 44))
draw = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((tw, th), Image.LANCZOS)
    x = pad + (i % cols) * (tw + pad)
    y = pad + (i // cols) * (th + pad + 26)
    sheet.paste(im, (x, y + 26))
    draw.text((x + 4, y + 6), f.stem[1:].lstrip("0") or "0", fill=(255, 200, 120))
sheet.save(out)
print(out, sheet.size)
