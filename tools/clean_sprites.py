#!/usr/bin/env python3
"""Turns AI-generated "pixel art" sprite sheets into real pixel art frames.

Input: a sheet laid out as a grid (default 6 columns x 3 rows) on a magenta
background, where every art pixel was drawn as a block of roughly S x S
screen pixels (S is not an integer and JPEG adds noise).

For each sheet it:
  1. finds the art pixel size S by testing which block size makes the image
     most uniform inside blocks;
  2. for each cell, finds the block grid offset, reads one colour per block
     (median of the block centre) and drops magenta blocks;
  3. maps every colour to a palette shared by all sheets of the character
     (k-means), so frames stay consistent;
  4. aligns each frame in a fixed-size canvas: feet on a common baseline,
     helmet centred horizontally;
  5. writes a PNG sprite sheet with the same grid order plus a JSON file.

Usage:
  python3 -I tools/clean_sprites.py OUT_DIR NAME=SHEET.png [NAME=SHEET.png ...]
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

COLS, ROWS = 6, 3
FRAME = 48          # output frame size in art pixels
BASELINE = 46       # row of the lowest opaque pixel in every frame
PALETTE_SIZE = 22   # colours shared across all sheets of one character


def magenta_hue(rgb):
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    return (r - g > 40) & (b - g > 40) & (np.abs(r - b) < 90)


def is_magenta(rgb):
    """Bright background magenta. Dark purple is not background: it is a thin
    dark line (outline, antenna) that JPEG tinted with the background."""
    r, b = rgb[..., 0], rgb[..., 2]
    return magenta_hue(rgb) & (r > 110) & (b > 110)


def fix_fringe(frame, outline):
    """Dark purple pixels are outline pixels tinted by the background."""
    tinted = (frame[..., 3] > 0) & magenta_hue(frame[..., :3])
    frame[tinted, :3] = outline
    return frame


def estimate_pixel_size(img):
    """Art pixel size from the spacing of colour edges (autocorrelation peak)."""
    gray = img.mean(axis=2)
    fg = ~is_magenta(img)
    sig = np.zeros(gray.shape[1] - 1)
    for row in range(gray.shape[0]):
        d = np.abs(np.diff(gray[row])) * (fg[row, 1:] & fg[row, :-1])
        sig += d
    sig -= sig.mean()
    ac = np.correlate(sig, sig, mode='full')[len(sig) - 1:]
    # Sub-pixel search: the best period also lines up with its 2nd..5th multiples.
    best = (-1e18, 6.0)
    for s in np.arange(4.0, 12.01, 0.01):
        score = sum(np.interp(s * k, np.arange(len(ac)), ac) for k in range(1, 6))
        if score > best[0]:
            best = (score, s)
    return best[1]


def grid_offset(cell, s, axis):
    """Phase of the block grid along one axis, from where colour edges fall."""
    gray = cell.mean(axis=2)
    diff = np.abs(np.diff(gray, axis=axis)).sum(axis=1 - axis)
    best = (-1, 0.0)
    for ph in np.arange(0, s, 0.25):
        edges = np.arange(ph, len(diff), s).astype(int)
        edges = edges[edges < len(diff)]
        score = diff[edges].sum() / max(1, len(edges))
        if score > best[0]:
            best = (score, ph)
    return best[1] + 1  # an edge between i and i+1 means a block starts at i+1


def sample_cell(cell, s):
    ox = grid_offset(cell, s, axis=1) % s
    oy = grid_offset(cell, s, axis=0) % s
    nx = int((cell.shape[1] - ox) // s)
    ny = int((cell.shape[0] - oy) // s)
    out = np.zeros((ny, nx, 4), dtype=np.uint8)
    m = max(1, int(s * 0.25))
    for j in range(ny):
        for i in range(nx):
            x0 = int(round(ox + i * s))
            y0 = int(round(oy + j * s))
            block = cell[y0 + m: y0 + int(s) - m, x0 + m: x0 + int(s) - m]
            if block.size == 0:
                continue
            px = block.reshape(-1, 3)
            if is_magenta(px).mean() > 0.4:
                continue
            px = px[~is_magenta(px)]
            out[j, i, :3] = np.median(px, axis=0)
            out[j, i, 3] = 255
    return out


def kmeans(colors, k, iters=30, seed=1):
    rng = np.random.default_rng(seed)
    centers = colors[rng.choice(len(colors), size=k, replace=False)].astype(float)
    for _ in range(iters):
        d = ((colors[:, None, :] - centers[None]) ** 2).sum(axis=2)
        lab = d.argmin(axis=1)
        for c in range(k):
            sel = colors[lab == c]
            if len(sel):
                centers[c] = sel.mean(axis=0)
    return np.round(centers).astype(np.uint8)


def quantize(frame, palette):
    rgb = frame[..., :3].reshape(-1, 3).astype(int)
    d = ((rgb[:, None, :] - palette[None].astype(int)) ** 2).sum(axis=2)
    out = frame.copy()
    out[..., :3] = palette[d.argmin(axis=1)].reshape(frame.shape[:2] + (3,))
    return out


def clean_specks(frame):
    """Drops isolated opaque pixels left by JPEG noise around the sprite."""
    a = frame[..., 3] > 0
    pad = np.pad(a, 1)
    neighbours = sum(np.roll(np.roll(pad, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1))[1:-1, 1:-1] - a
    frame[a & (neighbours <= 1), 3] = 0
    return frame


def place(frame):
    """Puts a frame on the fixed canvas: feet on BASELINE, helmet centred."""
    a = frame[..., 3] > 0
    canvas = np.zeros((FRAME, FRAME, 4), dtype=np.uint8)
    if not a.any():
        return canvas
    ys, xs = np.where(a)
    top, bottom = ys.min(), ys.max()
    head = a[top: top + max(4, (bottom - top) // 3)]
    hx = np.where(head)[1]
    cx = (hx.min() + hx.max()) / 2
    dx = int(round(FRAME / 2 - cx))
    dy = BASELINE - bottom
    for y, x in zip(ys, xs):
        ty, tx = y + dy, x + dx
        if 0 <= ty < FRAME and 0 <= tx < FRAME:
            canvas[ty, tx] = frame[y, x]
    return canvas


def main():
    out_dir = Path(sys.argv[1])
    sheets = dict(arg.split('=', 1) for arg in sys.argv[2:])
    out_dir.mkdir(parents=True, exist_ok=True)

    raw = {}
    for name, path in sheets.items():
        img = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
        s = estimate_pixel_size(img)
        cw, ch = img.shape[1] / COLS, img.shape[0] / ROWS
        frames = []
        for r in range(ROWS):
            for c in range(COLS):
                cell = img[int(r * ch): int((r + 1) * ch), int(c * cw): int((c + 1) * cw)]
                frames.append(sample_cell(cell, s))
        raw[name] = (s, frames)
        print(f'{name}: pixel size {s:.2f}, cell {cw:.0f}x{ch:.0f} -> ~{cw / s:.0f}x{ch / s:.0f} art px')

    opaque = np.concatenate([f[f[..., 3] > 0][:, :3] for _, fr in raw.values() for f in fr])
    clean = opaque[~magenta_hue(opaque)]
    outline = clean[clean.astype(int).sum(axis=1).argmin()]
    palette = kmeans(clean.astype(float), PALETTE_SIZE)
    meta = {'frameWidth': FRAME, 'frameHeight': FRAME, 'columns': COLS, 'rows': ROWS,
            'palette': ['#%02x%02x%02x' % tuple(c) for c in palette], 'sheets': {}}

    for name, (s, frames) in raw.items():
        sheet = np.zeros((ROWS * FRAME, COLS * FRAME, 4), dtype=np.uint8)
        empty = []
        for k, f in enumerate(frames):
            f = place(clean_specks(quantize(fix_fringe(f, outline), palette)))
            if not (f[..., 3] > 0).any():
                empty.append(k)
            r, c = divmod(k, COLS)
            sheet[r * FRAME:(r + 1) * FRAME, c * FRAME:(c + 1) * FRAME] = f
        Image.fromarray(sheet, 'RGBA').save(out_dir / f'{name}.png')
        meta['sheets'][name] = {'pixelSize': round(float(s), 2), 'emptyFrames': empty}
    (out_dir / 'player.json').write_text(json.dumps(meta, indent=2) + '\n')
    print('palette', meta['palette'])


if __name__ == '__main__':
    main()
