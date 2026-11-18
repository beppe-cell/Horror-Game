# Prompt Gemini: monete aliene e negozio

Nel gioco le monete e il negozio hanno per ora una grafica provvisoria. Questo prompt genera la versione definitiva.

| Moneta | Valore | Aspetto |
|---|---|---|
| Scheggia aliena | 1 | piccola scheggia di cristallo verde, la più comune |
| Gettone alieno | 5 | gettone tondo blu con un glifo |
| Nucleo alieno | 10 | sfera rossa e dorata che pulsa, rara |

## Come usarlo

1. Apri una chat nuova e allega il foglio degli oggetti (`art/raw/items/1-items.jpeg`), così la scala e lo stile restano gli stessi.
2. Carica il risultato come `art/raw/items/coins.png`.

```
Use the attached item sheet as the reference for style, pixel size and palette. Do not copy it; draw new objects.
Pixel art sheet for a top-down 3/4 view sci-fi horror roguelite set in alien caves around a crashed mining ship.

TRUE pixel art: each cell is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14. NO glow halo, NO ground shadow.

LAYOUT: exactly 4 columns by 2 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Row 1, ALIEN COINS, small (about 12 pixels wide), centered in their cells:
1. ALIEN SHARD (worth 1): a small jagged green crystal shard #4dffb0 #1f8a5a.
2. ALIEN TOKEN (worth 5): a round blue alien token #39d0ff #2f6fd0 with a strange engraved glyph.
3. ALIEN CORE (worth 10): a small glowing red-gold orb #ff4a5a #ffd34d in a thin gold setting.
4. empty magenta cell.
Row 2, SHOP:
5-6 (two cells wide, one object): a broken ship VENDING TERMINAL, about 40 pixels wide and 30 tall: a dark grey metal cabinet #4f5762 #2a3040 with a cracked green screen #4dffb0 showing an alien coin symbol, an orange hazard stripe #ff9a3c, a coin slot and a small tray. It stands on the bottom of its cells.
7. A SHOP SIGN: a small hanging metal plate with a green alien coin symbol painted on it.
8. empty magenta cell.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```
