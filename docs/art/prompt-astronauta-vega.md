# Prompt Gemini: animazioni di Vega, la contagiata

Design scelto: proposta **B** (`art/raw/player/concept-b.jpeg`). Vega è la sopravvissuta dello schianto, già toccata dall'infezione aliena:
- **Tuta:** bianca a destra (per chi guarda) e viola-grigia, sporca e macchiata, a sinistra.
- **Cristalli:** verdi luminosi che spuntano dalla spalla, dal braccio e dalla visiera crepata.
- **Testa e spalle:** casco color crema con visiera scura e un mantello strappato di telo termico.
- **Blaster:** compatto, con luci verdi.

Sono **5 generazioni**, come per il vecchio astronauta. Ogni immagine è una **griglia 6×3**. Lo script di pulizia e il gioco restano uguali.

## Come usarli

1. Apri una **nuova chat** di Gemini e usala per tutte e cinque le generazioni, in ordine.
2. **Generazione 1:** allega il **concept** `art/raw/player/concept-b.jpeg`.
3. **Generazioni 2-5:** allega **il risultato della generazione 1** (il foglio modello). È la cosa più importante per avere lo stesso personaggio in tutti i frame.
4. Copia il prompt in inglese così com'è.
5. Se un'immagine esce male (personaggio diverso, griglia sbagliata, sfondo non magenta), rigenerala prima di passare alla successiva.
6. Carica i file in `art/raw/player/` con questi nomi. **Sostituiscono** quelli del vecchio astronauta:

| Generazione | Nome file |
|---|---|
| 1. Foglio modello | `01-reference.jpeg` (o `.png`) |
| 2. Fermo (idle) | `02-idle.jpeg` |
| 3. Camminata | `03-walk.jpeg` |
| 4. Sparo | `04-shoot.jpeg` |
| 5. Colpito e morte | `05-hurt-death.jpeg` |

**Layout (uguale per tutte, tranne la 5):**
- 6 colonne × 3 righe.
- Riga 1 = vista **frontale** (verso il basso), riga 2 = **di spalle** (verso l'alto), riga 3 = **di lato verso destra**.
- Il gioco ottiene la sinistra specchiando la destra, quindi i cristalli cambiano lato nella vista specchiata: va bene.

**Il blocco "CHARACTER" è lo stesso in tutti i prompt:** non toglierlo, serve a tenere fermo il personaggio.

---

## 1. Foglio modello

```
Use the attached image as the design reference: redraw exactly this character, "Vega", as small game sprites. Keep her design, colors and asymmetry.
Pixel art character sprite sheet for a top-down 3/4 view sci-fi horror roguelite set in dark alien caves.

CHARACTER: "Vega", the lone survivor of a mining ship crash, already touched by the alien infection. Slim, haunted, asymmetrical.
- Helmet: big round cream-colored helmet (about 40% of her height) with a dark smoked-glass visor; no face visible. A crack across the visor with small glowing green crystals growing through it.
- Suit: the half on her LEFT side (viewer's right in front view) is dark grey-violet, cracked and stained brown; the other half is dirty white. Glowing green crystal spikes grow out of her LEFT shoulder and along her LEFT forearm.
- Cape: a torn pale-grey thermal blanket tied around her neck as a short ragged cape, hanging to the waist, clearly visible from the back and the side.
- Blaster: a compact dark grey blaster held low in her RIGHT hand, with small green lights.
- Boots: heavy grey boots with brown stains.

PIXEL ART RULES: TRUE pixel art. Each frame is exactly 32x32 pixels, upscaled 8x with perfectly square, crisp, equal-size pixels. No anti-aliasing, no blur, no gradients: flat color steps only. Light from the top-left. Clean 1-pixel dark outline #0b0d14. Details must read at 32x32: one or two pixels each.
PALETTE (only these): outline #0b0d14; white suit #e8eef7 #aab4c6 #6f7a8f; infected suit #5a5470 #3f3a50; stains #6b4a3a; helmet #e0dcc0 #b8b498; visor #14202a #2e3a48 #4a5568; crystals #4dffb0 #b8ffe0 #1f8a5a; cape #c8ccc4 #9aa0a8; boots and blaster #7d8799 #4f5762 #3c4252.
SIZE: about 16 pixels wide and 27 pixels tall inside each 32x32 cell, centered horizontally, boot soles on the same baseline 2 pixels above the bottom of every cell.

LAYOUT: a grid of exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no frames.
Row 1: front view, facing the camera (walking down the screen).
Row 2: back view, facing away (walking up the screen); the ragged cape and the shoulder crystals are clearly visible.
Row 3: side view facing RIGHT; the visor profile, cape and blaster are clearly visible.
In this sheet every cell of a row shows the same neutral standing pose, identical in all 6 columns, so it can be used as a character reference for later animations.

BACKGROUND: one solid flat magenta color #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No ground shadow, no text, no labels, no logo, no watermark.
```

## 2. Fermo (idle), 6 frame

```
Use the attached image as the exact character reference: the same "Vega" with the same proportions, palette, pixel size, outline, cracked visor with crystals, half-infected suit, shoulder and arm crystals, ragged cape and blaster. Do not redesign or simplify the character.

Pixel art sprite sheet, IDLE animation loop, 6 frames. She is alone in a dark alien cave, tense, and the infection inside her is alive.
PIXEL ART RULES: TRUE pixel art, each frame exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients, flat color shading only. Light from the top-left. 1-pixel outline #0b0d14.
PALETTE (only these): #0b0d14, #e8eef7, #aab4c6, #6f7a8f, #5a5470, #3f3a50, #6b4a3a, #e0dcc0, #b8b498, #14202a, #2e3a48, #4a5568, #4dffb0, #b8ffe0, #1f8a5a, #c8ccc4, #9aa0a8, #7d8799, #4f5762, #3c4252.
SIZE: about 16x27 pixels inside each cell, centered, boot soles on the same baseline in every frame.

LAYOUT: exactly 6 columns by 3 rows of equal square cells separated only by empty magenta space, no lines, no borders. Columns are frames 1 to 6, left to right.
Row 1: front view. Row 2: back view. Row 3: side view facing RIGHT.

ANIMATION, same timing in every row:
- Frames 1-2: breathing in, the helmet rises 1 pixel on frame 2; the cape hem lifts 1 pixel.
- Frame 3: the crystals pulse brighter (#b8ffe0), the infected arm twitches 1 pixel.
- Frame 4: breathing out, the body sinks back down 1 pixel; the crystals dim.
- Frame 5: the helmet turns slightly, looking around warily; the cape sways.
- Frame 6: back to the neutral stance so it loops smoothly into frame 1.
Boots stay planted on the baseline in all frames. Movements are small (1-2 pixels) and readable.

BACKGROUND: one solid flat magenta #FF00FF everywhere. No ground shadow, no text, no labels.
```

## 3. Camminata, 6 frame

```
Use the attached image as the exact character reference: the same "Vega" with the same proportions, palette, pixel size, outline, cracked visor with crystals, half-infected suit, shoulder and arm crystals, ragged cape and blaster. Do not redesign or simplify the character.

Pixel art sprite sheet, WALK cycle, 6 frames. She walks with a light, wary, slightly uneven step: the infected left side is a little stiffer than the right.
PIXEL ART RULES: TRUE pixel art, each frame exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients, flat color shading only. Light from the top-left. 1-pixel outline #0b0d14.
PALETTE (only these): #0b0d14, #e8eef7, #aab4c6, #6f7a8f, #5a5470, #3f3a50, #6b4a3a, #e0dcc0, #b8b498, #14202a, #2e3a48, #4a5568, #4dffb0, #b8ffe0, #1f8a5a, #c8ccc4, #9aa0a8, #7d8799, #4f5762, #3c4252.
SIZE: about 16x27 pixels inside each cell, centered, walking in place (she does not travel across the cell).

LAYOUT: exactly 6 columns by 3 rows of equal square cells separated only by empty magenta space, no lines, no borders. Columns are frames 1 to 6, left to right.
Row 1: front view, walking toward the camera. Row 2: back view, walking away. Row 3: side view, walking to the RIGHT.

ANIMATION, same timing in every row:
- Frame 1: contact, left boot forward, right arm (with the blaster) forward.
- Frame 2: down, the whole body 1 pixel lower, knees bent.
- Frame 3: passing, the right leg swings past, the body back up.
- Frame 4: contact, right boot forward, left (crystal) arm forward but swinging less.
- Frame 5: down, the body 1 pixel lower.
- Frame 6: passing, ready to loop into frame 1.
The ragged cape flutters 1-2 pixels behind her, out of phase with the body.

BACKGROUND: one solid flat magenta #FF00FF everywhere. No ground shadow, no dust, no motion lines, no text, no labels.
```

## 4. Sparo, 6 frame

```
Use the attached image as the exact character reference: the same "Vega" with the same proportions, palette, pixel size, outline, cracked visor with crystals, half-infected suit, shoulder and arm crystals, ragged cape and blaster. Do not redesign or simplify the character.

Pixel art sprite sheet, SHOOT animation, 6 frames. She is not a soldier: she braces the blaster with both hands, and the crystals on her arm flare with every shot, as if the infection feeds the weapon.
WEAPON: her compact dark grey blaster #3c4252 #7d8799 with a green crystal shard #4dffb0 fused into the barrel, about 8 pixels long.
PIXEL ART RULES: TRUE pixel art, each frame exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients, flat color shading only. Light from the top-left. 1-pixel outline #0b0d14.
PALETTE (only these): #0b0d14, #e8eef7, #aab4c6, #6f7a8f, #5a5470, #3f3a50, #6b4a3a, #e0dcc0, #b8b498, #14202a, #2e3a48, #4a5568, #4dffb0, #b8ffe0, #1f8a5a, #c8ccc4, #9aa0a8, #7d8799, #4f5762, #3c4252, plus muzzle flash #ffffff.
SIZE: about 16x27 pixels for the body inside each cell, centered; the blaster and the flash stay inside the 32x32 cell.

LAYOUT: exactly 6 columns by 3 rows of equal square cells separated only by empty magenta space, no lines, no borders. Columns are frames 1 to 6, left to right.
Row 1: front view, shooting DOWN toward the camera (the blaster points at the viewer, foreshortened).
Row 2: back view, shooting UP away from the camera (the blaster raised, mostly hidden by the helmet; the flash appears above the helmet).
Row 3: side view, shooting to the RIGHT (the blaster fully visible in profile).

ANIMATION, same timing in every row:
- Frame 1: aiming, the barrel crystal glows softly.
- Frame 2: FIRE, a bright 4-pixel star-shaped muzzle flash in #ffffff and #4dffb0 at the barrel tip; the arm and shoulder crystals flare #b8ffe0.
- Frame 3: recoil, the arms and helmet pushed 1-2 pixels back, away from the shooting direction; the cape kicks back.
- Frame 4: recovering, halfway back, the crystals dimming.
- Frame 5: back to aim.
- Frame 6: aiming, identical to frame 1 so it loops.
The boots stay planted on the baseline in every frame.

BACKGROUND: one solid flat magenta #FF00FF everywhere. No ground shadow, no projectile, no smoke cloud, no text, no labels.
```

## 5. Colpito e morte

Questo foglio è diverso: le righe non sono le tre viste, quindi il prompt descrive ogni riga. Nella morte l'infezione **la prende del tutto**: i cristalli le crescono addosso.

```
Use the attached image as the exact character reference: the same "Vega" with the same proportions, palette, pixel size, outline, cracked visor with crystals, half-infected suit, shoulder and arm crystals, ragged cape and blaster. Do not redesign or simplify the character.

Pixel art sprite sheet with two animations, HURT and DEATH.
PIXEL ART RULES: TRUE pixel art, each frame exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients, flat color shading only. Light from the top-left. 1-pixel outline #0b0d14.
PALETTE (only these): #0b0d14, #e8eef7, #aab4c6, #6f7a8f, #5a5470, #3f3a50, #6b4a3a, #e0dcc0, #b8b498, #14202a, #2e3a48, #4a5568, #4dffb0, #b8ffe0, #1f8a5a, #c8ccc4, #9aa0a8, #7d8799, #4f5762, #3c4252, plus damage red #ff4a5a.
SIZE: about 16x27 pixels standing, inside each cell, centered; everything stays inside its 32x32 cell.

LAYOUT: exactly 6 columns by 3 rows of equal square cells separated only by empty magenta space, no lines, no borders.
Row 1: columns 1-3 are HURT in front view; columns 4-6 are HURT in back view.
Row 2: columns 1-3 are HURT in side view facing RIGHT; columns 4-6 are empty magenta cells.
Row 3: DEATH in front view, 6 frames, left to right.

HURT (3 frames for each view):
- Frame 1: impact, the whole body flashes almost pure white with a red #ff4a5a outline instead of the dark one.
- Frame 2: knocked back 2 pixels away from the camera, the helmet tilted, the crystals flicker red, the cape whips.
- Frame 3: recovering to the neutral standing pose, the crystals green again.

DEATH (front view):
- Frame 1: hit, white flash, red outline.
- Frame 2: she clutches her infected arm, knees buckling; the crystals blaze #b8ffe0.
- Frame 3: falls onto her knees, the helmet bowed; new small crystals sprout from her back and helmet.
- Frame 4: collapses forward; crystals spread over the white half of the suit.
- Frame 5: lying face down, almost covered in green crystals, the cape draped over her.
- Frame 6: lying still, a small cluster of glowing crystals where she fell, only the cream helmet and a corner of the cape showing.
The body always rests on the same ground baseline as the standing frames.

BACKGROUND: one solid flat magenta #FF00FF everywhere. No ground shadow, no blood, no text, no labels.
```

---

## Se Gemini non collabora

- **Griglia sbagliata:** aggiungi `The grid MUST be exactly 6 columns and 3 rows, 18 cells in total.`
- **Pixel sfocati:** aggiungi `Hard pixel edges only, like a 1990s console sprite. Every pixel is a perfect square block of identical size.`
- **Il casco diventa troppo grande o troppo piccolo:** aggiungi `The helmet is about 40% of her height, like in the reference.`
- **I cristalli cambiano lato tra le righe:** aggiungi `The crystals are ALWAYS on her LEFT shoulder and LEFT forearm (viewer's right in front view, viewer's left in back view).`
- **Il mantello sparisce:** aggiungi `The ragged cape is always visible behind her back and over her shoulders.`
- **Personaggio che cambia tra le righe:** rigenera riallegando il foglio modello, e aggiungi `All 18 frames show the same character with identical colors, details and proportions.`
