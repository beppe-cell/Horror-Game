#!/usr/bin/env python3
"""Hand fixes for Gemini sheets before extraction, painted with background
magenta. Coordinates are pixels of the raw sheet.

Usage: python3 -I tools/fix_sheet.py IN OUT OP...
  erase=x0,y0,x1,y1         paint a box with background (a guide drawn in colour)
  move=x0,y0,x1,y1,dx,dy    move a box (a piece drawn in the wrong cell)
  unhelmet                  remove the cream helmet and dark visor Gemini drew
                            as a guide, and anything touching them closely,
                            except the bright colours of the add-ons
"""
import sys

import numpy as np
from PIL import Image, ImageFilter

MAGENTA = (255, 0, 255)


def grow(mask, size):
    img = Image.fromarray((mask * 255).astype(np.uint8))
    return np.asarray(img.filter(ImageFilter.MaxFilter(size))) > 127


def unhelmet(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    cream = (r > 150) & (g > 150) & (g - b > 12) & (abs(r - g) < 30)
    visor = (b - g >= 15) & (b - r >= 35) & (a.max(axis=2) < 150)
    zone = grow(cream | visor, 15)
    bright = (a.max(axis=2) - a.min(axis=2) > 60) & ~visor & ~cream
    a[zone & ~bright] = MAGENTA


def main(src, dst, *ops):
    a = np.asarray(Image.open(src).convert('RGB')).astype(int).copy()
    for op in ops:
        name, _, args = op.partition('=')
        n = [int(v) for v in args.split(',')] if args else []
        if name == 'erase':
            x0, y0, x1, y1 = n
            a[y0:y1, x0:x1] = MAGENTA
        elif name == 'move':
            x0, y0, x1, y1, dx, dy = n
            piece = a[y0:y1, x0:x1].copy()
            a[y0:y1, x0:x1] = MAGENTA
            a[y0 + dy:y1 + dy, x0 + dx:x1 + dx] = piece
        elif name == 'unhelmet':
            unhelmet(a)
        else:
            raise SystemExit(f'unknown op {op}')
    Image.fromarray(a.astype(np.uint8)).save(dst)


if __name__ == '__main__':
    main(*sys.argv[1:])
