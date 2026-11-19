#!/usr/bin/env python3
"""Removes the guide lines Gemini sometimes draws on overlay sheets.

Asked to draw only an add-on "as if Vega were invisible", Gemini often adds
a thin dark outline of her helmet or body as a guide. Those lines are thin
and dark and lie away from the coloured piece, so they are painted over with
magenta: dark pixels are kept only when they belong to a thick dark area
(a dark piece of gear) or sit right next to a coloured pixel (the piece's
own outline). Grid lines between cells go the same way.

Usage: python3 -I tools/strip_guides.py IN.jpeg OUT.png
"""
import sys

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, __import__('os').path.dirname(__file__))
from clean_sprites import is_magenta  # noqa: E402

DARK = 70      # brightest channel below this: an outline-dark pixel
THICK = 15     # side of the square a dark area must fill to count as gear
NEAR = 13      # dark pixels this close to colour are the piece's outline


def grow(mask, size, op):
    img = Image.fromarray((mask * 255).astype(np.uint8))
    return np.asarray(img.filter(op(size))) > 127


def main(src, dst):
    rgb = np.asarray(Image.open(src).convert('RGB')).astype(int)
    bg = is_magenta(rgb)
    dark = ~bg & (rgb.max(axis=2) < DARK)
    colour = ~bg & ~dark
    # Specks of colour (JPEG noise along a dark line) do not anchor anything.
    colour = grow(grow(colour, 3, ImageFilter.MinFilter), 3, ImageFilter.MaxFilter)
    thick = grow(grow(dark, THICK, ImageFilter.MinFilter), THICK, ImageFilter.MaxFilter)
    keep = grow(colour | thick, NEAR, ImageFilter.MaxFilter)
    out = rgb.copy()
    out[dark & ~keep] = (255, 0, 255)
    Image.fromarray(out.astype(np.uint8)).save(dst)


if __name__ == '__main__':
    main(*sys.argv[1:3])
