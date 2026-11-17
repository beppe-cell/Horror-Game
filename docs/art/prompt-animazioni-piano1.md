# Prompt Gemini: animazioni del piano 1

Due generazioni: l'**apertura della porta** frontale (6 frame) e la **fiamma del bengala** (4 frame). Il resto (fumo, scintille, vapore, lucine) lo fa il gioco.

## Come usarli

1. Apri una **nuova chat** di Gemini.
2. **Allega due immagini**:
   - il foglio dei tile del piano 1, `art/raw/rooms/1-crash-tiles.jpeg`, così la porta resta identica a quella già nel gioco;
   - il foglio degli oggetti del piano 1, `art/raw/rooms/1-crash-props.jpeg`, per il bengala.
3. Copia il prompt in inglese così com'è.
4. **Carica in PNG** in `art/raw/rooms/` con questi nomi:

| Animazione | Nome file |
|---|---|
| Porta che si apre | `1-crash-door-open.png` |
| Fiamma del bengala | `1-crash-flare.png` |

I frame vanno **in una sola riga, da sinistra a destra**, separati da spazio magenta. Lo script li trova da solo anche se Gemini cambia un po' le distanze, ma l'ordine deve essere quello.

---

## 1. Porta che si apre, 6 frame

```
Use the attached tileset as the exact reference: animate the CLOSED DOOR tile from it (the heavy rusted ship bulkhead hatch set into dark cave rock, with an orange hazard stripe at the bottom). Same pixel size, same palette, same frame, same rock around it. Do not redesign it.

Pixel art ANIMATION STRIP, 6 frames in ONE ROW, left to right, showing the hatch OPENING.
TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Flat neutral lighting, NO glow, NO cast shadows (the game adds lights).
Front view of a door set into the top wall of a top-down 3/4 view room.

Frame 1: closed, identical to the reference tile.
Frame 2: the hatch unlocks: a thin dark gap appears at its left edge, a tiny puff of dust at the bottom.
Frame 3: the hatch has slid one quarter to the right, revealing a dark passage behind.
Frame 4: the hatch has slid halfway to the right.
Frame 5: the hatch has slid three quarters, almost fully inside the wall.
Frame 6: fully open: only the rusted metal frame remains, with a dark passage in the middle; identical to the OPEN DOOR tile of the reference.
The rock around the frame and the metal frame itself never move. Only the hatch slides.

LAYOUT: 6 frames in a single horizontal row, each separated by empty magenta space. No grid lines, no borders, no numbers, no labels.
BACKGROUND: one solid flat magenta #FF00FF everywhere. Not a checkerboard, not transparent.
```

## 2. Fiamma del bengala, 4 frame

```
Use the attached props sheet as the exact reference: animate the small red EMERGENCY FLARE STICK lying on the ground. Same pixel size, same palette, same stick, same angle. Do not redesign it.

Pixel art ANIMATION STRIP, 4 frames in ONE ROW, left to right, a looping flame.
TRUE pixel art: each frame is exactly 16x24 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients, no glow halo (the game adds the light and bloom).
The flare stick lies at the bottom of every frame, in the same position in all 4 frames. A small bright flame burns at its upper end:
- flame colors only: white core #ffffff, yellow #ffd36a, orange #ff8a3c, red #ff4a3a;
- the flame is 4 to 8 pixels tall and changes shape every frame (taller, leaning left, short and wide, leaning right) so the 4 frames loop smoothly;
- one or two single-pixel sparks above the flame in some frames.

LAYOUT: 4 frames in a single horizontal row, each separated by empty magenta space. No grid lines, no borders, no numbers, no labels.
BACKGROUND: one solid flat magenta #FF00FF everywhere. Not a checkerboard, not transparent.
```

---

## Se Gemini non collabora

- **La porta cambia aspetto tra i frame:** aggiungi `Only the sliding hatch changes between frames. Every other pixel is identical in all 6 frames.`
- **Frame su più righe:** aggiungi `All frames MUST be in one single row.`
- **Bagliori disegnati attorno alla fiamma:** aggiungi `No glow, no light halo, no soft edges. Hard pixel flame only.`
