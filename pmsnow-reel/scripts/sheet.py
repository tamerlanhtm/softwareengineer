"""Contact sheet of preview PNGs:  python3 scripts/sheet.py preview sheet.jpg [cols] [thumb_w]"""
import sys, glob, os
from PIL import Image, ImageDraw, ImageFont

src, dst = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 270
files = sorted(glob.glob(os.path.join(src, '*.png')))
th = int(tw * 1920 / 1080)
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (tw + 8) + 8, rows * (th + 36) + 8), (40, 40, 46))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
except OSError:
    font = ImageFont.load_default()
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS)
    x, y = 8 + (i % cols) * (tw + 8), 8 + (i // cols) * (th + 36)
    sheet.paste(im, (x, y + 28))
    d.text((x + 2, y + 2), os.path.basename(f)[1:-4].lstrip('0') or '0', fill=(255, 200, 120), font=font)
sheet.save(dst, quality=88)
print(dst, sheet.size)
