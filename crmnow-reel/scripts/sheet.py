"""Contact sheet: python3 scripts/sheet.py <out.png> <cols> <frames...>"""
import sys, os
from PIL import Image, ImageDraw, ImageFont

out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
tw, th = 360, 640
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (tw + 8) + 8, rows * (th + 40) + 8), (40, 40, 40))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
except OSError:
    font = ImageFont.load_default()
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS)
    x, y = 8 + (i % cols) * (tw + 8), 8 + (i // cols) * (th + 40)
    sheet.paste(im, (x, y + 32))
    d.text((x + 4, y + 4), os.path.basename(f)[2:-4].lstrip('0') or '0', fill=(255, 200, 150), font=font)
sheet.save(out)
print('sheet', out, sheet.size)
