#!/usr/bin/env python3
"""Cuts a sheet into horizontal bands, for sheets that mix a grid with
pieces wider than one cell (e.g. coins on top, a two-cell terminal below).

Usage: python3 -I tools/split_rows.py SHEET OUT_DIR ROWS NAME:FROM:TO [...]
  ROWS is the sheet's row count; each band keeps rows FROM..TO (0-based, inclusive).
"""
import sys
from pathlib import Path

from PIL import Image

sheet, out_dir, rows = sys.argv[1], Path(sys.argv[2]), int(sys.argv[3])
img = Image.open(sheet).convert('RGB')
h = img.height / rows
out_dir.mkdir(parents=True, exist_ok=True)
for spec in sys.argv[4:]:
    name, a, b = spec.split(':')
    img.crop((0, round(int(a) * h), img.width, round((int(b) + 1) * h))).save(out_dir / f'{name}.png')
    print(name, int(a), int(b))
