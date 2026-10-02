#!/usr/bin/env python3
"""Make a labeled contact sheet from screenshots: sheet.py out.png cols width img1 img2 ..."""
import sys
from PIL import Image, ImageDraw, ImageFont
out, cols, W = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
paths = sys.argv[4:]
ims = []
for p in paths:
    im = Image.open(p).convert('RGB')
    h = int(im.height * W / im.width)
    ims.append((p.split('/')[-1], im.resize((W, h))))
rows = [ims[i:i+cols] for i in range(0, len(ims), cols)]
H = sum(max(im.height for _, im in r) + 22 for r in rows)
sheet = Image.new('RGB', (cols * (W + 8), H), 'white')
d = ImageDraw.Draw(sheet)
y = 0
for r in rows:
    rh = max(im.height for _, im in r)
    for i, (name, im) in enumerate(r):
        x = i * (W + 8)
        d.text((x + 4, y + 4), name, fill='black')
        sheet.paste(im, (x, y + 20))
    y += rh + 22
sheet.save(out)
print(out, sheet.size)
