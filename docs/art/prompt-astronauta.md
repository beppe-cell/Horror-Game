# Prompt Gemini: astronauta

Cinque generazioni coprono tutte le animazioni dell'astronauta. Ogni immagine è uno **sprite sheet a griglia 6×3**: 18 frame per generazione invece di uno.

## Come usarli

1. Apri una **nuova chat** di Gemini e usala per tutte e cinque le generazioni, in ordine.
2. Dalla generazione 2 in poi, **allega come riferimento l'immagine della generazione 1** (il "foglio modello"). È la cosa più importante per avere lo stesso personaggio in tutti i frame.
3. Copia il prompt in inglese così com'è: Gemini segue meglio le istruzioni tecniche in inglese.
4. Se un'immagine esce male (personaggio diverso, griglia sbagliata, sfondo non magenta), rigenerala prima di passare alla successiva.
5. Carica i file su GitHub in `art/raw/player/` con questi nomi:

| Generazione | Nome file |
|---|---|
| 1. Foglio modello | `01-reference.png` |
| 2. Fermo (idle) | `02-idle.png` |
| 3. Camminata | `03-walk.png` |
| 4. Sparo | `04-shoot.png` |
| 5. Colpito e morte | `05-hurt-death.png` |

Non serve che il risultato sia perfetto: lo script di pulizia riporta i pixel su una griglia vera, riduce i colori alla palette e rimuove il magenta. Serve invece che **forma, colori e proporzioni restino uguali** tra le immagini.

## Layout della griglia (uguale per tutte)

- 6 colonne × 3 righe di celle quadrate, senza bordi né linee: solo spazio magenta tra le celle.
- Righe: 1 = vista **frontale** (verso il basso), 2 = vista **di spalle** (verso l'alto), 3 = vista **di lato** rivolta a **destra**.
- Colonne: i 6 frame dell'animazione, da sinistra a destra.
- Il gioco ottiene la vista verso sinistra specchiando quella verso destra, quindi non va generata.

---

## Blocco di stile (già incluso in ogni prompt)

Per riferimento, ecco le regole che ogni prompt ripete:

- pixel art vera, 32×32 pixel per frame, ingrandita 8 volte con pixel quadrati e netti;
- vista dall'alto a 3/4, luce da in alto a sinistra;
- contorno scuro di 1 pixel `#0b0d14`;
- palette limitata: tuta `#e8eef7` e ombra `#aab4c6`, visiera `#39d0ff` e riflesso `#b8f1ff`, zaino `#7d8799`;
- il personaggio occupa circa 14×26 pixel, centrato, con i piedi sempre alla stessa altezza in fondo alla cella;
- sfondo magenta pieno `#FF00FF`, senza ombre a terra, testo, numeri o cornici.

---

## 1. Foglio modello

```
Pixel art sprite sheet of a small astronaut character for a top-down 3/4 view roguelite game.
TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp square pixels, no anti-aliasing, no blur, no gradients, no soft shading. Light comes from the top-left. 1-pixel dark outline in #0b0d14.
Limited palette only: suit white #e8eef7, suit shadow #aab4c6, visor cyan #39d0ff, visor highlight #b8f1ff, backpack grey #7d8799, outline #0b0d14.
Character design: chunky cute astronaut, round helmet with a wide cyan visor, compact white suit, small grey backpack, a small cyan chest light, short legs. The character is about 14 pixels wide and 26 pixels tall inside each 32x32 cell, centered horizontally, feet always on the same baseline near the bottom of the cell.
Layout: a grid of 6 columns by 3 rows of equal square cells, separated only by empty magenta space, no lines, no borders.
Row 1: front view (facing the camera, walking down). Row 2: back view (facing away, walking up). Row 3: side view facing RIGHT.
In this sheet every cell of a row shows the same neutral standing pose, identical across the 6 columns, so it can be used as a character reference.
Background: solid flat magenta #FF00FF everywhere, including between cells. No ground shadow, no text, no numbers, no labels, no frame, no watermark-like decorations.
```

## 2. Fermo (idle), 6 frame

```
Use the attached image as the exact character reference: same astronaut, same proportions, same palette, same pixel size, same outline. Do not redesign the character.
Pixel art sprite sheet, IDLE animation loop, 6 frames.
TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp square pixels, no anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14. Palette only: #e8eef7, #aab4c6, #39d0ff, #b8f1ff, #7d8799, #0b0d14.
Layout: 6 columns by 3 rows of equal square cells separated only by empty magenta space, no lines, no borders. Columns are frames 1 to 6 in order, left to right.
Row 1: front view. Row 2: back view. Row 3: side view facing RIGHT.
Animation: gentle breathing loop. The body and helmet move down by 1 pixel on frames 3 and 4, then back up; the chest light blinks brighter on frame 5. Feet stay planted on the same baseline in every frame. Frame 6 must loop smoothly back into frame 1.
Background: solid flat magenta #FF00FF everywhere. No ground shadow, no text, no numbers, no labels.
```

## 3. Camminata, 6 frame

```
Use the attached image as the exact character reference: same astronaut, same proportions, same palette, same pixel size, same outline. Do not redesign the character.
Pixel art sprite sheet, WALK cycle, 6 frames.
TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp square pixels, no anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14. Palette only: #e8eef7, #aab4c6, #39d0ff, #b8f1ff, #7d8799, #0b0d14.
Layout: 6 columns by 3 rows of equal square cells separated only by empty magenta space, no lines, no borders. Columns are frames 1 to 6 in order, left to right.
Row 1: front view walking toward the camera. Row 2: back view walking away. Row 3: side view walking to the RIGHT.
Animation: a clear, readable walk cycle. Frame 1 contact (left foot forward), frame 2 down (body 1 pixel lower), frame 3 passing, frame 4 contact (right foot forward), frame 5 down, frame 6 passing. Arms swing opposite to the legs. The character stays centered in its cell (walking in place), feet on the same baseline.
Background: solid flat magenta #FF00FF everywhere. No ground shadow, no motion lines, no text, no numbers, no labels.
```

## 4. Sparo, 6 frame

```
Use the attached image as the exact character reference: same astronaut, same proportions, same palette, same pixel size, same outline. Do not redesign the character.
Pixel art sprite sheet, SHOOT animation, 6 frames.
TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp square pixels, no anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14. Palette only: #e8eef7, #aab4c6, #39d0ff, #b8f1ff, #7d8799, #0b0d14, plus a small muzzle flash in #7cf7d4 and #ffffff.
Layout: 6 columns by 3 rows of equal square cells separated only by empty magenta space, no lines, no borders. Columns are frames 1 to 6 in order, left to right.
Row 1: front view shooting DOWN toward the camera. Row 2: back view shooting UP away from the camera. Row 3: side view shooting to the RIGHT.
The astronaut holds a small compact blaster pistol with both hands, pointing in the shooting direction.
Animation: frame 1 aim, frame 2 a tiny bright muzzle flash at the barrel tip (3-4 pixels), frame 3 recoil (body 1 pixel back from the shooting direction), frame 4 recovering, frames 5 and 6 back to aim, ready to loop. Feet stay planted on the same baseline. The flash and the gun stay inside the 32x32 cell.
Background: solid flat magenta #FF00FF everywhere. No ground shadow, no projectile, no text, no numbers, no labels.
```

## 5. Colpito e morte

Questo foglio è diverso: le righe non sono le tre viste, quindi il prompt descrive ogni riga.

```
Use the attached image as the exact character reference: same astronaut, same proportions, same palette, same pixel size, same outline. Do not redesign the character.
Pixel art sprite sheet with two animations, HURT and DEATH.
TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp square pixels, no anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14. Palette only: #e8eef7, #aab4c6, #39d0ff, #b8f1ff, #7d8799, #0b0d14, plus warning red #ff4a5a for cracks and sparks.
Layout: 6 columns by 3 rows of equal square cells separated only by empty magenta space, no lines, no borders.
Row 1: columns 1-3 are HURT in front view, columns 4-6 are HURT in back view.
Row 2: columns 1-3 are HURT in side view facing RIGHT; columns 4-6 are empty magenta.
HURT (3 frames each): frame 1 the whole suit flashes almost white, frame 2 the body is knocked back by 2 pixels with a small red crack spark on the visor, frame 3 recovering to the neutral pose.
Row 3: DEATH in front view, 6 frames left to right: frame 1 hit, frame 2 knees buckle, frame 3 falls to the knees, frame 4 falls forward, frame 5 lying on the ground with a cracked visor and a few red sparks, frame 6 lying still, visor dark grey.
Feet or body stay on the same ground baseline. Everything stays inside its 32x32 cell.
Background: solid flat magenta #FF00FF everywhere. No ground shadow, no text, no numbers, no labels.
```

---

## Se Gemini non collabora

- **Griglia sbagliata (numero di celle diverso):** aggiungi in fondo `The grid MUST be exactly 6 columns and 3 rows, 18 cells in total.`
- **Pixel sfocati o finti:** aggiungi `Hard pixel edges only, like a 1990s console sprite. Every pixel is a perfect square block of identical size.`
- **Personaggio che cambia tra le righe:** rigenera allegando di nuovo il foglio modello, e aggiungi `All 18 frames show the same character with identical colors and proportions.`
- **Sfondo non uniforme o a scacchi:** aggiungi `The background is a single flat color #FF00FF, not a checkerboard, not transparent.`
- **Troppe cose in una volta:** come ripiego, chiedi una riga sola (6 frame, una vista) per immagine. Sono 3 generazioni invece di 1, ma con più controllo.
