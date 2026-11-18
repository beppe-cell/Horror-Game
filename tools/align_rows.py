"""
Moves chosen frames of a sprite strip down so their lowest pixel sits on
the same row as the rest of the strip (Gemini sometimes draws one row of a
sheet higher). Usage: align_rows.py IN OUT FRAMES FIRST-LAST
"""
import sys
from PIL import Image

src, dst, count, span = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
first, last = (int(v) for v in span.split('-'))
im = Image.open(src).convert('RGBA')
w, h = im.width // count, im.height
bottoms = [im.crop((i * w, 0, i * w + w, h)).getbbox() for i in range(count)]
others = [b[3] for i, b in enumerate(bottoms) if b and not first <= i <= last]
target = max(set(others), key=others.count)
out = im.copy()
for i in range(first, last + 1):
    cell = im.crop((i * w, 0, i * w + w, h))
    shift = target - bottoms[i][3]
    out.paste((0, 0, 0, 0), (i * w, 0, i * w + w, h))
    out.alpha_composite(cell, (i * w, shift))
out.save(dst)
print(f'{dst}: frames {first}-{last} moved to bottom row {target}')
