#!/usr/bin/env python3
"""Extracts every tile and prop from an AI-generated sheet with no fixed grid.

Gemini does not always respect the requested grid: rows get repeated, cells
change size, labels appear. Instead of cutting a grid, this script finds each
piece as a connected region separated by the magenta background, then turns
it into real pixel art the same way clean_sprites.py does (pixel size from
edge spacing, one colour per block, shared palette, no stray pixels).

Output, per sheet NAME:
  OUT/NAME/NN.png      one PNG per piece, in reading order
  OUT/NAME-index.png   contact sheet with the numbers, to pick pieces by eye
  OUT/NAME.json        size and source box of every piece

Usage:
  python3 -I tools/extract_sprites.py OUT_DIR NAME=SHEET.jpeg[@tile32] ...

Add @tile32 to a tileset sheet: Gemini often draws tiles bigger than asked,
so the art pixel size is then chosen to make the square tiles exactly 32
pixels, instead of being measured. Walls keep their proportions.
"""
import json
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from clean_sprites import clean_specks, estimate_pixel_size, fix_fringe, is_magenta, kmeans, magenta_hue, quantize  # noqa: E402

PALETTE_SIZE = 32
MIN_SIDE_PX = 5     # pieces smaller than this many art pixels are labels or noise


def components(mask, step):
    """Bounding boxes of 4-connected True regions, on a mask sampled every `step` px."""
    small = mask[::step, ::step]
    h, w = small.shape
    seen = np.zeros_like(small, dtype=bool)
    boxes = []
    for y in range(h):
        for x in range(w):
            if not small[y, x] or seen[y, x]:
                continue
            q = deque([(y, x)])
            seen[y, x] = True
            y0 = y1 = y
            x0 = x1 = x
            n = 0
            while q:
                cy, cx = q.popleft()
                n += 1
                y0, y1, x0, x1 = min(y0, cy), max(y1, cy), min(x0, cx), max(x1, cx)
                for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                    if 0 <= ny < h and 0 <= nx < w and small[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
            boxes.append((x0 * step, y0 * step, (x1 + 1) * step, (y1 + 1) * step, n))
    return boxes


def sample_piece(crop, s):
    """One colour per art pixel; the grid phase is found from colour edges."""
    gray = crop.mean(axis=2)
    def phase(axis):
        diff = np.abs(np.diff(gray, axis=axis)).sum(axis=1 - axis)
        best = (-1, 0.0)
        for ph in np.arange(0, s, 0.25):
            idx = np.arange(ph, len(diff), s).astype(int)
            idx = idx[idx < len(diff)]
            score = diff[idx].sum() / max(1, len(idx))
            if score > best[0]:
                best = (score, ph)
        return (best[1] + 1) % s
    ox, oy = phase(1), phase(0)
    nx = int((crop.shape[1] - ox) // s)
    ny = int((crop.shape[0] - oy) // s)
    out = np.zeros((ny, nx, 4), dtype=np.uint8)
    m = max(1, int(s * 0.25))
    for j in range(ny):
        for i in range(nx):
            x0 = int(round(ox + i * s))
            y0 = int(round(oy + j * s))
            block = crop[y0 + m: y0 + int(s) - m, x0 + m: x0 + int(s) - m].reshape(-1, 3)
            if block.size == 0 or is_magenta(block).mean() > 0.4:
                continue
            block = block[~is_magenta(block)]
            out[j, i, :3] = np.median(block, axis=0)
            out[j, i, 3] = 255
    return out


def trim(piece):
    a = piece[..., 3] > 0
    if not a.any():
        return piece[:0, :0]
    ys, xs = np.where(a)
    return piece[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1]


def main():
    out_dir = Path(sys.argv[1])
    out_dir.mkdir(parents=True, exist_ok=True)
    for arg in sys.argv[2:]:
        name, path = arg.split('=', 1)
        tile_px = None
        if '@tile' in path:
            path, tile = path.split('@tile')
            tile_px = int(tile)
        img = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
        s = estimate_pixel_size(img)
        fg = ~is_magenta(img)
        boxes = [b for b in components(fg, 2) if (b[2] - b[0]) >= MIN_SIDE_PX * s and (b[3] - b[1]) >= MIN_SIDE_PX * s]
        if tile_px:
            squares = [b[2] - b[0] for b in boxes if abs((b[2] - b[0]) - (b[3] - b[1])) <= 0.08 * (b[2] - b[0])]
            s = float(np.median(squares)) / tile_px
        # Reading order: rows by vertical centre (within half a piece), then left to right.
        boxes.sort(key=lambda b: ((b[1] + b[3]) / 2, b[0]))
        rows, row = [], []
        for b in boxes:
            if row and (b[1] + b[3]) / 2 - (row[0][1] + row[0][3]) / 2 > 0.5 * (row[0][3] - row[0][1]):
                rows.append(sorted(row, key=lambda r: r[0]))
                row = []
            row.append(b)
        if row:
            rows.append(sorted(row, key=lambda r: r[0]))
        ordered = [b for r in rows for b in r]

        pieces = []
        for (x0, y0, x1, y1, _) in ordered:
            crop = img[max(0, y0 - 2): y1 + 2, max(0, x0 - 2): x1 + 2]
            pieces.append(sample_piece(crop, s))
        opaque = np.concatenate([p[p[..., 3] > 0][:, :3] for p in pieces if (p[..., 3] > 0).any()])
        clean = opaque[~magenta_hue(opaque)]
        outline = clean[clean.astype(int).sum(axis=1).argmin()]
        palette = kmeans(clean.astype(float), PALETTE_SIZE)

        sheet_dir = out_dir / name
        sheet_dir.mkdir(parents=True, exist_ok=True)
        meta = {'pixelSize': round(float(s), 2), 'pieces': []}
        thumbs = []
        for k, (p, b) in enumerate(zip(pieces, ordered)):
            p = trim(clean_specks(quantize(fix_fringe(p, outline), palette)))
            if p.size == 0:
                continue
            Image.fromarray(p, 'RGBA').save(sheet_dir / f'{k:02d}.png')
            meta['pieces'].append({'id': k, 'w': int(p.shape[1]), 'h': int(p.shape[0]), 'box': [int(v) for v in b[:4]]})
            thumbs.append((k, p))
        (out_dir / f'{name}.json').write_text(json.dumps(meta, indent=1) + '\n')

        # Contact sheet: every piece at 3x on grey, with its number.
        cell = 3 * max(max(p.shape[0], p.shape[1]) for _, p in thumbs) + 16
        cols = 8
        sheet = Image.new('RGB', (cols * cell, ((len(thumbs) + cols - 1) // cols) * cell), (60, 60, 70))
        draw = ImageDraw.Draw(sheet)
        for n, (k, p) in enumerate(thumbs):
            im = Image.fromarray(p, 'RGBA').resize((p.shape[1] * 3, p.shape[0] * 3), Image.NEAREST)
            cx, cy = (n % cols) * cell, (n // cols) * cell
            sheet.paste(im, (cx + 8, cy + 14), im)
            draw.text((cx + 3, cy + 1), str(k), fill=(255, 255, 0))
        sheet.save(out_dir / f'{name}-index.png')
        print(f'{name}: pixel {s:.2f}, {len(thumbs)} pieces')


if __name__ == '__main__':
    main()
