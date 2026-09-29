"""Tile rendered stills into a labelled contact sheet for quick review.
usage: python3 scripts/contact.py OUT.png COLS SCALE img1.png img2.png ...
"""
import sys, re
from PIL import Image, ImageDraw, ImageFont

out, cols, scale = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
files = sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in files]
w, h = int(ims[0].width * scale), int(ims[0].height * scale)
rows = (len(ims) + cols - 1) // cols
pad, lab = 8, 34
sheet = Image.new('RGB', (cols * (w + pad) + pad, rows * (h + pad + lab) + pad), (40, 40, 40))
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 24)
except Exception:
    font = ImageFont.load_default()
d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    r, c = divmod(i, cols)
    x, y = pad + c * (w + pad), pad + r * (h + pad + lab)
    sheet.paste(im.resize((w, h), Image.LANCZOS), (x, y + lab))
    m = re.search(r't(\d+\.\d+)', f)
    t = float(m.group(1)) if m else 0
    d.text((x + 4, y + 4), f'{t:.2f}s  b{t * 128 / 60:.2f}', fill=(255, 200, 80), font=font)
sheet.save(out)
print(out, sheet.size)
