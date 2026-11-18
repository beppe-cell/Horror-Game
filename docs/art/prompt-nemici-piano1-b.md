# Prompt Gemini: altri 3 nemici del piano 1

Tre nemici nuovi per il sito dello schianto. Ognuno costringe a giocare in modo diverso:

| Nemico | Cosa fa | Come cambia il gioco |
|---|---|---|
| **Sentinella guasta** | Drone di manutenzione della nave impazzito: vola, si ferma e spara tre raggi a ventaglio | Vola sopra rocce e acqua: niente ripari sicuri |
| **Annegato** | Massa di tentacoli nascosta nelle pozze d'acqua: emerge quando ti avvicini e ti afferra | L'acqua, finora innocua, diventa pericolosa |
| **Sacca gonfia** | Vescica di gas che fluttua lenta verso di te e, se muore vicino, esplode in un anello di spore | Va uccisa da lontano, non a bruciapelo |

## Come usarli

1. Usa **una chat nuova per ogni nemico**.
2. In ogni chat **allega il foglio modello dell'astronauta** (`art/raw/player/01-reference.jpeg`), il **foglio degli oggetti del piano 1** (`art/raw/rooms/1-crash-props.jpeg`) e il **nuovo strisciante** (`art/raw/enemies/1-crawler.jpeg`): servono per scala, pixel e palette.
3. Copia il prompt in inglese così com'è.
4. Carica il risultato (PNG o JPEG) in `art/raw/enemies/` con questi nomi:

| Nemico | Nome file |
|---|---|
| Sentinella guasta | `1-drone.png` |
| Annegato | `1-lurker.png` |
| Sacca gonfia | `1-bloater.png` |

**Layout di ogni foglio:** 6 colonne × 3 righe, come gli altri nemici.

| Riga | Contenuto |
|---|---|
| 1 | Movimento (o attesa, per l'annegato): 6 frame in loop |
| 2 | Attacco: 6 frame |
| 3 | Colpito: 2 frame, poi morte: 4 frame |

---

## 1. Sentinella guasta (drone impazzito)

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the crash-site props (palette and mood) and the alien tick (enemy style). Do not copy them; draw a new enemy.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

ENEMY: "Rogue Sentinel", a small maintenance drone from the crashed mining ship, now broken and hostile. A round hovering body about 22 pixels wide and 18 pixels tall: a cracked off-white shell with an orange hazard stripe, one big red camera eye in the middle with a cracked lens, two small stubby thrusters underneath glowing faint cyan, a bent antenna on top, and a torn cable dangling below it. Alien grey-green growth has started to creep over one side of the shell. It hovers about 8 pixels above the ground: leave empty space between it and the bottom of the cell.
PALETTE: shell #c8ccc4 #8a90a0 #4f5762, hazard stripe #ff9a3c, eye #ff4a5a #8a1a28 with a white glint, thrusters #39d0ff #b8f1ff, alien growth #7d8a72 #4f5a48, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: side view facing RIGHT only, seen slightly from above (3/4 top-down). The drone floats at the same height in the middle of every cell, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, HOVER loop, 6 frames: bobs up and down by 1-2 pixels, the thrusters flicker, the cable sways, the eye twitches left and right.
Row 2, FIRE attack, 6 frames: the eye shrinks to a tiny bright dot, the shell tilts forward, the eye flares wide and bright red, recoil backwards, sparks from the antenna, back to rest.
Row 3: frames 1-2 HURT (flashes almost white, then tilts with sparks); frames 3-6 DEATH (the eye cracks and goes dark, the thrusters sputter, it drops to the ground with a puff of smoke, a broken shell with the cable lies on the floor).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 2. Annegato (tentacoli nell'acqua)

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the crash-site props (palette and mood) and the alien tick (enemy style). Do not copy them; draw a new enemy.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

ENEMY: "Lurker", an alien mass that hides under shallow dark water. A cluster of pale grey-violet tentacles around a round sucker mouth ringed with tiny teeth, and three black eyes on stalks. When hidden, only a ring of ripples and two eye stalks show above a small dark water puddle. When attacking it rises up out of the puddle, about 24 pixels wide and 28 pixels tall, tentacles spread wide. The dark water puddle (about 24x8 pixels, deep blue-black with a light rim) stays at the bottom of every cell, under the creature.
PALETTE: flesh #7e7896 #5a5470 #a9a3bf, suckers and mouth #8a2a3a #3a0f18, eyes #0b0d14 with #e8eef7 glint, water #10202a #1f3a48 with ripples #6fa8b8, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow.
VIEW: side view facing RIGHT only, seen slightly from above (3/4 top-down). The puddle sits on the bottom of each cell, same place in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, HIDDEN loop, 6 frames: only the puddle with slow spreading ripples and two eye stalks peeking out, the stalks turn slowly.
Row 2, GRAB attack, 6 frames: bubbles, it bursts up out of the water with a splash, tentacles spread wide, the mouth opens, the tentacles whip forward to the right, it sinks back down into the puddle.
Row 3: frames 1-2 HURT (flashes almost white, then flinches back); frames 3-6 DEATH (the tentacles go limp and flop over the puddle, the eyes close, dark purple goo spreads in the water, only limp tentacles in a stained puddle remain).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 3. Sacca gonfia (vescica di gas)

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the crash-site props (palette and mood) and the alien tick (enemy style). Do not copy them; draw a new enemy.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

ENEMY: "Bloater", a floating alien gas bladder. A swollen translucent sac about 24 pixels wide and 22 pixels tall, pale yellow-green, with glowing spores swirling inside and dark veins across its skin. A small puckered vent on top, and a few short dangling tendrils underneath that drag along the ground. It floats low, about 4 pixels above the ground: leave a small gap between the sac and the bottom of the cell, only the tendril tips touch it.
PALETTE: sac #c8d08a #9aa860 #6a7a3a, spores inside #d8e04a, veins #4f5a48, tendrils #5a3a48 #7a4a5a, vent #8a2a3a, wet highlights #e8eef7, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow.
VIEW: side view facing RIGHT only, seen slightly from above (3/4 top-down). The sac floats at the same height in every cell, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, FLOAT loop, 6 frames: the sac slowly pulses bigger and smaller by 1-2 pixels like breathing, the spores inside swirl, the tendrils sway.
Row 2, PUFF attack, 6 frames: the sac swells tight, the vent puckers, a small puff of yellow-green spores bursts out of the vent, the sac shrinks a little, back to rest.
Row 3: frames 1-2 HURT (flashes almost white, then wobbles); frames 3-6 DEATH (swells huge and tight, bursts into a big round cloud of yellow-green spores, the cloud spreads, only a torn deflated skin on the ground remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Se Gemini non collabora

- **Griglia sbagliata:** aggiungi `The grid MUST be exactly 6 columns and 3 rows.`
- **Pixel sfocati:** aggiungi `Hard pixel edges only, like a 1990s console sprite.`
- **Il drone tocca terra:** aggiungi `It FLOATS: at least 8 empty pixels between the drone and the bottom of the cell.`
- **L'annegato senza pozza:** aggiungi `The dark water puddle is ALWAYS visible at the bottom of every cell.`
