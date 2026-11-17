# Prompt Gemini: astronauta

Cinque generazioni coprono tutte le animazioni dell'astronauta. Ogni immagine è uno **sprite sheet a griglia 6×3**: 18 frame per generazione invece di uno.

## Il personaggio

**Nome in codice:** Vega-7. Tecnica di manutenzione di una nave mineraria, unica sopravvissuta allo schianto. Non è una soldatessa: è pratica, prudente e testarda. La tuta è da lavoro, non da combattimento: vecchia, rattoppata, piena di segni d'uso. Il blaster è un attrezzo da cantiere modificato.

Tratti che devono leggersi anche a 32×32 pixel:

| Elemento | Dettaglio |
|---|---|
| Casco | Rotondo e grande (circa metà dell'altezza), visiera ciano larga con un graffio diagonale chiaro, piccola antenna corta sul lato destro con punta arancione |
| Tuta | Bianco sporco, con una striscia di pericolo arancione su una spalla e un numero "7" scuro sul petto |
| Usura | Toppa grigia sul ginocchio sinistro, segni di bruciatura scuri sugli stivali |
| Zaino | Bombola grigia con due piccoli tubi che vanno al casco, una spia verde |
| Cintura | Cintura scura con una piccola torcia arancione appesa al fianco |
| Polso | Display da polso ciano sul braccio sinistro |
| Stivali | Grossi e pesanti, grigio scuro |
| Blaster | Compatto, grigio con bobina ciano, impugnato a due mani |

**Palette (13 colori):**

| Uso | Colore |
|---|---|
| Contorno | `#0b0d14` |
| Tuta | `#e8eef7` · ombra `#aab4c6` · ombra profonda `#6f7a8f` |
| Visiera | `#39d0ff` · riflesso `#b8f1ff` · scura `#14506a` |
| Accento arancione | `#ff9a3c` · scuro `#b85a1c` |
| Zaino, stivali, cintura | `#7d8799` · `#3c4252` |
| Spia e cristalli | `#4dffb0` |
| Danno | `#ff4a5a` |

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

## Layout della griglia (uguale per tutte, tranne la 5)

- 6 colonne × 3 righe di celle quadrate, senza bordi né linee: solo spazio magenta tra le celle.
- Righe: 1 = vista **frontale** (verso il basso), 2 = vista **di spalle** (verso l'alto), 3 = vista **di lato** rivolta a **destra**.
- Colonne: i 6 frame dell'animazione, da sinistra a destra.
- Il gioco ottiene la vista verso sinistra specchiando quella verso destra, quindi non va generata. Per questo l'antenna e la striscia arancione possono cambiare lato nella vista specchiata: va bene.

---

## 1. Foglio modello

```
Pixel art character sprite sheet for a top-down 3/4 view sci-fi roguelite set in dark alien caves.

CHARACTER: "Vega-7", a small, chunky, slightly worn-out maintenance astronaut, the lone survivor of a mining ship crash. Practical and cautious, not a soldier. Cute but tough proportions: the helmet is big and round, about half of the total height.
- Helmet: round off-white helmet, wide cyan visor with a light diagonal scratch across it, a short antenna on the right side of the helmet with an orange tip.
- Suit: off-white work suit, an orange hazard stripe on the left shoulder, a dark number "7" on the chest, a grey patch on the left knee, dark scorch marks on the boots.
- Backpack: grey oxygen tank with two small hoses curving into the helmet and one tiny green status light.
- Belt: dark belt with a small orange flashlight hanging on the right hip.
- Left wrist: a small glowing cyan wrist display.
- Boots: big heavy dark grey boots.
- Hands empty in this sheet.

PIXEL ART RULES: TRUE pixel art. Each frame is exactly 32x32 pixels, upscaled 8x with perfectly square, crisp, equal-size pixels. No anti-aliasing, no blur, no gradients, no soft airbrush shading: shading uses flat color steps only. Light comes from the top-left. Clean 1-pixel dark outline #0b0d14 around the whole silhouette. Details must be bold enough to read at 32x32: one or two pixels each.
PALETTE (use only these colors): outline #0b0d14; suit #e8eef7, #aab4c6, #6f7a8f; visor #39d0ff, #b8f1ff, #14506a; orange accent #ff9a3c, #b85a1c; gear and boots #7d8799, #3c4252; status light #4dffb0.
SIZE: the character is about 16 pixels wide and 27 pixels tall inside each 32x32 cell, centered horizontally, with the soles of the boots on the same baseline 2 pixels above the bottom of every cell.

LAYOUT: a grid of exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no frames.
Row 1: front view, facing the camera (walking down the screen).
Row 2: back view, facing away (walking up the screen); the backpack, hoses and green light are clearly visible.
Row 3: side view facing RIGHT; the visor profile, backpack and antenna are clearly visible.
In this sheet every cell of a row shows the same neutral standing pose, identical in all 6 columns, so it can be used as a character reference for later animations.

BACKGROUND: one solid flat magenta color #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No ground shadow, no text, no numbers or letters outside the suit, no labels, no logo, no watermark.
```

## 2. Fermo (idle), 6 frame

```
Use the attached image as the exact character reference: the same astronaut "Vega-7" with the same proportions, palette, pixel size, outline, scratched visor, antenna, orange hazard stripe, number 7, knee patch, backpack hoses, belt flashlight and wrist display. Do not redesign or simplify the character.

Pixel art sprite sheet, IDLE animation loop, 6 frames. The character is alone in a dark alien cave, alert and a little nervous.
PIXEL ART RULES: TRUE pixel art, each frame exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients, flat color shading only. Light from the top-left. 1-pixel outline #0b0d14.
PALETTE (only these): #0b0d14, #e8eef7, #aab4c6, #6f7a8f, #39d0ff, #b8f1ff, #14506a, #ff9a3c, #b85a1c, #7d8799, #3c4252, #4dffb0.
SIZE: about 16x27 pixels inside each cell, centered, boot soles on the same baseline in every frame.

LAYOUT: exactly 6 columns by 3 rows of equal square cells separated only by empty magenta space, no lines, no borders. Columns are frames 1 to 6, left to right.
Row 1: front view. Row 2: back view. Row 3: side view facing RIGHT.

ANIMATION, same timing in every row:
- Frames 1-2: neutral stance, breathing in; the helmet rises 1 pixel on frame 2.
- Frame 3: the helmet turns slightly to one side, looking around warily; the visor highlight shifts.
- Frame 4: breathing out, the body sinks back down 1 pixel.
- Frame 5: the character glances at the left wrist display, which glows brighter; the green backpack light blinks on.
- Frame 6: back to the neutral stance so it loops smoothly into frame 1.
Boots stay planted on the baseline in all frames. Movements are small (1-2 pixels) and readable.

BACKGROUND: one solid flat magenta #FF00FF everywhere. No ground shadow, no text, no labels.
```

## 3. Camminata, 6 frame

```
Use the attached image as the exact character reference: the same astronaut "Vega-7" with the same proportions, palette, pixel size, outline, scratched visor, antenna, orange hazard stripe, number 7, knee patch, backpack hoses, belt flashlight and wrist display. Do not redesign or simplify the character.

Pixel art sprite sheet, WALK cycle, 6 frames. The character walks with heavy boots in low gravity: a sturdy, slightly bouncy, determined step.
PIXEL ART RULES: TRUE pixel art, each frame exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients, flat color shading only. Light from the top-left. 1-pixel outline #0b0d14.
PALETTE (only these): #0b0d14, #e8eef7, #aab4c6, #6f7a8f, #39d0ff, #b8f1ff, #14506a, #ff9a3c, #b85a1c, #7d8799, #3c4252, #4dffb0.
SIZE: about 16x27 pixels inside each cell, centered, walking in place (the character does not travel across the cell).

LAYOUT: exactly 6 columns by 3 rows of equal square cells separated only by empty magenta space, no lines, no borders. Columns are frames 1 to 6, left to right.
Row 1: front view, walking toward the camera. Row 2: back view, walking away. Row 3: side view, walking to the RIGHT.

ANIMATION, same timing in every row:
- Frame 1: contact, left boot forward, right arm forward.
- Frame 2: down, the whole body 1 pixel lower, knees bent.
- Frame 3: passing, the right leg swings past, the body back up.
- Frame 4: contact, right boot forward, left arm forward.
- Frame 5: down, the body 1 pixel lower.
- Frame 6: passing, ready to loop into frame 1.
The backpack hoses and the belt flashlight bounce 1 pixel out of phase with the body. In the side view the antenna sways slightly. Arms swing opposite to the legs.

BACKGROUND: one solid flat magenta #FF00FF everywhere. No ground shadow, no dust, no motion lines, no text, no labels.
```

## 4. Sparo, 6 frame

```
Use the attached image as the exact character reference: the same astronaut "Vega-7" with the same proportions, palette, pixel size, outline, scratched visor, antenna, orange hazard stripe, number 7, knee patch, backpack hoses, belt flashlight and wrist display. Do not redesign or simplify the character.

Pixel art sprite sheet, SHOOT animation, 6 frames. The character is not a trained soldier: the stance is braced and a bit improvised, both hands on the tool, shoulders tense.
WEAPON: a compact blaster made from a modified mining tool, held with both hands. Grey body #7d8799 with dark details #3c4252, an orange grip stripe #ff9a3c and a small glowing cyan coil #39d0ff near the barrel. About 8 pixels long.
PIXEL ART RULES: TRUE pixel art, each frame exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients, flat color shading only. Light from the top-left. 1-pixel outline #0b0d14.
PALETTE (only these): #0b0d14, #e8eef7, #aab4c6, #6f7a8f, #39d0ff, #b8f1ff, #14506a, #ff9a3c, #b85a1c, #7d8799, #3c4252, #4dffb0, plus muzzle flash #7cf7d4 and #ffffff.
SIZE: about 16x27 pixels for the body inside each cell, centered; the blaster and the flash must stay inside the 32x32 cell.

LAYOUT: exactly 6 columns by 3 rows of equal square cells separated only by empty magenta space, no lines, no borders. Columns are frames 1 to 6, left to right.
Row 1: front view, shooting DOWN toward the camera (the blaster points at the viewer, foreshortened).
Row 2: back view, shooting UP away from the camera (the blaster is raised, mostly hidden by the helmet, the flash appears above the helmet).
Row 3: side view, shooting to the RIGHT (the blaster fully visible in profile).

ANIMATION, same timing in every row:
- Frame 1: aiming, the coil glows softly.
- Frame 2: FIRE, a bright 4-pixel star-shaped muzzle flash in #ffffff and #7cf7d4 at the barrel tip, the coil glows white.
- Frame 3: recoil, the arms and helmet pushed 1-2 pixels back, away from the shooting direction; a small cyan wisp of heat on the coil.
- Frame 4: recovering, halfway back.
- Frame 5: back to aim, the coil dimmer.
- Frame 6: aiming, identical to frame 1 so it loops.
The boots stay planted on the baseline in every frame.

BACKGROUND: one solid flat magenta #FF00FF everywhere. No ground shadow, no projectile, no smoke cloud, no text, no labels.
```

## 5. Colpito e morte

Questo foglio è diverso: le righe non sono le tre viste, quindi il prompt descrive ogni riga.

```
Use the attached image as the exact character reference: the same astronaut "Vega-7" with the same proportions, palette, pixel size, outline, scratched visor, antenna, orange hazard stripe, number 7, knee patch, backpack hoses, belt flashlight and wrist display. Do not redesign or simplify the character.

Pixel art sprite sheet with two animations, HURT and DEATH.
PIXEL ART RULES: TRUE pixel art, each frame exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients, flat color shading only. Light from the top-left. 1-pixel outline #0b0d14.
PALETTE (only these): #0b0d14, #e8eef7, #aab4c6, #6f7a8f, #39d0ff, #b8f1ff, #14506a, #ff9a3c, #b85a1c, #7d8799, #3c4252, #4dffb0, plus damage red #ff4a5a.
SIZE: about 16x27 pixels standing, inside each cell, centered; everything stays inside its 32x32 cell.

LAYOUT: exactly 6 columns by 3 rows of equal square cells separated only by empty magenta space, no lines, no borders.
Row 1: columns 1-3 are HURT in front view; columns 4-6 are HURT in back view.
Row 2: columns 1-3 are HURT in side view facing RIGHT; columns 4-6 are empty magenta cells.
Row 3: DEATH in front view, 6 frames, left to right.

HURT (3 frames for each view):
- Frame 1: impact, the whole suit flashes almost pure white #e8eef7 with a red #ff4a5a outline instead of the dark one.
- Frame 2: knocked back 2 pixels away from the camera, the helmet tilted, a small red crack spark on the visor, the backpack light turns red.
- Frame 3: recovering to the neutral standing pose, the backpack light back to green.

DEATH (front view):
- Frame 1: hit, white flash, red outline.
- Frame 2: knees buckle, the arms drop, the visor flickers dark #14506a.
- Frame 3: falls onto the knees, the helmet bowed.
- Frame 4: tips forward, one hand reaching out.
- Frame 5: lying face down on the ground, a few red sparks from the backpack, a crack across the visor.
- Frame 6: lying still, the visor completely dark, the backpack light off, one last tiny spark.
The body always rests on the same ground baseline as the standing frames.

BACKGROUND: one solid flat magenta #FF00FF everywhere. No ground shadow, no blood, no text, no labels.
```

---

## Se Gemini non collabora

- **Griglia sbagliata (numero di celle diverso):** aggiungi in fondo `The grid MUST be exactly 6 columns and 3 rows, 18 cells in total.`
- **Pixel sfocati o finti:** aggiungi `Hard pixel edges only, like a 1990s console sprite. Every pixel is a perfect square block of identical size.`
- **Troppi dettagli impastati:** aggiungi `Keep only the details that read at 32x32: helmet, scratched visor, antenna, orange shoulder stripe, number 7, backpack. Drop anything smaller.`
- **Personaggio che cambia tra le righe:** rigenera allegando di nuovo il foglio modello, e aggiungi `All 18 frames show the same character with identical colors, details and proportions.`
- **Sfondo non uniforme o a scacchi:** aggiungi `The background is a single flat color #FF00FF, not a checkerboard, not transparent.`
- **Troppe cose in una volta:** come ripiego, chiedi una riga sola (6 frame, una vista) per immagine. Sono 3 generazioni invece di 1, ma con più controllo.
