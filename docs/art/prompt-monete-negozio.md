# Prompt Gemini: monete aliene e negozio

Nel gioco le monete e il negozio hanno per ora una grafica provvisoria. Questo prompt genera la versione definitiva.

Le tre monete sono **la stessa moneta**: stessa forma, stesso glifo, stessa dimensione. Cambia solo il colore. Ogni moneta ha un'animazione di 6 frame in cui gira su se stessa.

| Moneta | Valore | Colore |
|---|---|---|
| Moneta verde | 1 | verde, la più comune |
| Moneta blu | 5 | blu |
| Moneta d'oro | 10 | oro, rara |

## Come usarlo

1. Apri una chat nuova e allega il foglio degli oggetti (`art/raw/items/1-items.jpeg`), così la scala e lo stile restano gli stessi.
2. Carica il risultato come `art/raw/items/coins.png`.

```
Use the attached item sheet as the reference for style, pixel size and palette. Do not copy it; draw new objects.
Pixel art sprite sheet for a top-down 3/4 view sci-fi horror roguelite set in alien caves around a crashed mining ship.

TRUE pixel art: each cell is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14. NO glow halo, NO ground shadow.

LAYOUT: exactly 6 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.

Rows 1-3, ALIEN COINS SPINNING: the SAME coin in all three rows, identical in shape, size, outline, engraving and shading; ONLY the colour changes. A small round alien coin, about 12 pixels wide, with a raised rim and a strange three-pronged alien glyph engraved in the middle, centered in its cell and at the same height in every frame.
Each row is a 6-frame SPIN loop around the vertical axis: frame 1 seen face-on (full circle with the glyph), frame 2 turned a little (wider oval), frame 3 turned more (narrow oval), frame 4 seen edge-on (a thin vertical bar showing the rim), frame 5 narrow oval again (back side, plain), frame 6 wider oval (back side) so it loops back into frame 1. A small white glint moves across the face as it turns.
Row 1: GREEN coin (worth 1): #4dffb0 #1f8a5a, rim #b8ffe0.
Row 2: BLUE coin (worth 5): #39d0ff #2f6fd0, rim #b8f1ff.
Row 3: GOLD coin (worth 10): #ffd34d #b8862a, rim #fff0b0.

Row 4, SHOP:
Cells 1-2 (two cells wide, one object): a broken ship VENDING TERMINAL, about 40 pixels wide and 30 tall: a dark grey metal cabinet #4f5762 #2a3040 with a cracked green screen #4dffb0 showing an alien coin symbol, an orange hazard stripe #ff9a3c, a coin slot and a small tray. It stands on the bottom of its cells.
Cell 3: a SHOP SIGN, a small hanging metal plate with a green alien coin symbol painted on it.
Cells 4-6: empty magenta.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```
