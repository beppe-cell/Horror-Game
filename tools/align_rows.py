"""
Moves frames of a sprite strip up or down so they stand on the same row
(Gemini sometimes draws one row of a sheet higher or lower than another).

  align_rows.py IN OUT FRAMES FIRST-LAST
      moves frames FIRST..LAST so their lowest pixel matches the most common
      lowest row of the other frames.
  align_rows.py IN OUT FRAMES I:DY [I:DY ...]
      moves frame I down by DY pixels (up if negative).
"""
import sys
from PIL import Image

src, dst, count = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert('RGBA')
w, h = im.width // count, im.height
shifts: dict[int, int] = {}
if ':' in sys.argv[4]:
    for arg in sys.argv[4:]:
        i, dy = arg.split(':')
        shifts[int(i)] = int(dy)
else:
    first, last = (int(v) for v in sys.argv[4].split('-'))
    boxes = [im.crop((i * w, 0, i * w + w, h)).getbbox() for i in range(count)]
    others = [b[3] for i, b in enumerate(boxes) if b and not first <= i <= last]
    target = max(set(others), key=others.count)
    shifts = {i: target - boxes[i][3] for i in range(first, last + 1)}
out = im.copy()
for i, dy in shifts.items():
    cell = im.crop((i * w, 0, i * w + w, h))
    out.paste((0, 0, 0, 0), (i * w, 0, i * w + w, h))
    out.alpha_composite(cell.crop((0, max(0, -dy), w, h - max(0, dy))), (i * w, max(0, dy)))
out.save(dst)
print(f'{dst}: moved frames {sorted(shifts)}')
