"""Contact sheet: python3 tools/sheet.py out.png cols frame1.png frame2.png ...
Thumbnails are labelled with the time parsed from t_<seconds>.png."""
import os, re, sys
from PIL import Image, ImageDraw, ImageFont

out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
tw, th, pad, lab = 270, 480, 10, 28
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (tw + pad) + pad, rows * (th + lab + pad) + pad), (40, 40, 44))
draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 20)
except OSError:
    font = ImageFont.load_default()
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS)
    x, y = pad + (i % cols) * (tw + pad), pad + (i // cols) * (th + lab + pad)
    sheet.paste(im, (x, y + lab))
    m = re.search(r't_([\d.]+)\.png', os.path.basename(f))
    draw.text((x + 4, y + 3), (m.group(1) + 's') if m else os.path.basename(f), fill=(255, 255, 255), font=font)
sheet.save(out)
