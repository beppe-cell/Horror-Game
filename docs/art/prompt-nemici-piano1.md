# Prompt Gemini: nemici del piano 1

Tre nemici per il sito dello schianto, uno per generazione. Ogni foglio ha **3 righe da 6 frame**: movimento, attacco, colpito e morte. Basta una sola vista, di lato verso destra: il gioco ottiene la sinistra specchiandola.

## Come usarli

1. Usa **una chat nuova per ogni nemico**.
2. In ogni chat **allega il foglio modello dell'astronauta** (`art/raw/player/01-reference.jpeg`) e il **foglio degli oggetti del piano 1** (`art/raw/rooms/1-crash-props.jpeg`). Servono a mantenere la stessa scala, gli stessi pixel e la stessa palette.
3. Copia il prompt in inglese così com'è.
4. **Carica in PNG** in `art/raw/enemies/` con questi nomi:

| Nemico | Nome file |
|---|---|
| Strisciante | `1-crawler.png` |
| Sputatore | `1-spitter.png` |
| Ex-minatore infetto | `1-miner.png` |

**Layout di ogni foglio:**

| Riga | Contenuto |
|---|---|
| 1 | Movimento (o respiro, per lo sputatore che sta fermo): 6 frame in loop |
| 2 | Attacco: 6 frame |
| 3 | Colpito: 2 frame, poi morte: 4 frame |

---

## 1. Strisciante (larva aliena)

Piccola, veloce, ti insegue strisciando. È il nemico base.

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size) and the crash-site props (palette and mood). Do not copy them; draw a new creature.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

CREATURE: "Crawler", an alien larva from the caves around a crashed mining ship. Pale sickly grey-green segmented body like a fat maggot, about 24 pixels long and 14 pixels tall, three dark slimy segments, a round mouth at the front ringed with tiny teeth, two small black eyes, short twitching bristles. Wet highlights on the back. Disgusting, not cute.
PALETTE: body #a8b29a #7d8a72 #4f5a48, mouth inside #3a0f18 #8a2a3a, slime highlights #d8e8c8, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow, NO ground shadow (the game adds lights and shadows).
VIEW: side view facing RIGHT only, seen slightly from above (3/4 top-down). The creature rests on the bottom of each cell, on the same baseline in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, CRAWL loop, 6 frames: the body contracts and stretches like a caterpillar wave from tail to head, the mouth opens and closes slightly.
Row 2, BITE attack, 6 frames: rears up the front segment, mouth opens wide showing teeth, lunges forward, snaps shut, pulls back, back to rest.
Row 3: frames 1-2 HURT (the whole body flashes almost white, then squashes flat); frames 3-6 DEATH (bursts open, green-grey goo splashes out, the deflated body shrivels, a small puddle of goo remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 2. Sputatore (fungo-creatura)

Fermo, attaccato al suolo, spara spore da lontano. Costringe a muoversi.

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size) and the crash-site props (palette and mood). Do not copy them; draw a new creature.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

CREATURE: "Spitter", a stationary alien fungus that has grown on a piece of ship debris. A bulbous fleshy pod about 26 pixels wide and 30 pixels tall, rooted to the ground with thick tendrils, a puckered vent on top, rows of small glowing yellow-green pustules on its sides, a few metal scraps fused into its base. It never walks.
PALETTE: flesh #5a3a48 #7a4a5a #9a6a78, tendrils #3a2a30, pustules #d8e04a #a0b030 (bright, they will glow in game), metal scraps #4f5762, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow.
VIEW: seen from the side, slightly from above (3/4 top-down). Rooted on the bottom of each cell, same baseline and same position in every frame.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, IDLE breathing loop, 6 frames: the pod slowly swells and shrinks by 1-2 pixels, the pustules pulse brighter and dimmer, the tendrils twitch.
Row 2, SPIT attack, 6 frames: the pod inflates, the top vent puckers, the pod contracts hard and a yellow-green spore ball shoots out of the vent upward-right, the vent stays open, back to rest.
Row 3: frames 1-2 HURT (flashes almost white, then shudders); frames 3-6 DEATH (bursts, spores puff out in a yellow cloud, the pod collapses into a deflated wet heap with the metal scraps showing).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 3. Ex-minatore infetto

Un membro dell'equipaggio di Vega-7, preso dall'infezione. Lento, resistente, carica quando ti avvicini. È il nemico più inquietante del piano.

```
Use the attached images as references for pixel size, palette and style: the astronaut "Vega-7" (scale, pixel size and suit design) and the crash-site props (palette and mood).
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

CREATURE: "Infected Miner", a crew member of the same mining ship as the attached astronaut, taken over by the alien infection. Same chunky proportions and the same kind of off-white work suit as the astronaut, but torn, stained and wrong: the helmet visor is shattered and dark, fleshy grey-green alien growths burst out of the visor, one shoulder and the back, one arm hangs longer and ends in a bony claw, the suit has an orange hazard stripe and a dark number "3" on the chest. Hunched posture, about 30 pixels wide and 40 pixels tall.
PALETTE: suit #c8ccc4 #9aa0a0 #6f7a8f (dirtier than the astronaut's), stains #4a3a30, alien growths #a8b29a #7d8a72 #4f5a48, inside of growths #8a2a3a, broken visor #14202a #2a4a5a, orange stripe #b85a1c, outline #0b0d14.

TRUE pixel art: each frame is exactly 48x48 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow, NO ground shadow.
VIEW: side view facing RIGHT only, seen slightly from above (3/4 top-down). Boots on the same baseline at the bottom of every cell, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, SHAMBLING WALK loop, 6 frames: slow, limping, wrong walk; the head lolls, the long claw arm drags, the growths pulse.
Row 2, CHARGE attack, 6 frames: freezes and twitches (windup), crouches low, lunges forward with the claw raised, claw swipe, stumbles, recovers.
Row 3: frames 1-2 HURT (flashes almost white, then jerks back); frames 3-6 DEATH (drops to the knees, the growths burst in a grey-green spray, falls face down, lies still with the growths deflating).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

---

## Se Gemini non collabora

- **Griglia sbagliata:** aggiungi `The grid MUST be exactly 6 columns and 3 rows, 18 cells in total.` Non è grave: lo script trova i frame anche se la griglia è irregolare, purché l'ordine delle righe sia quello giusto.
- **Pixel sfocati:** aggiungi `Hard pixel edges only, like a 1990s console sprite.`
- **Nemico troppo grande o troppo piccolo rispetto all'astronauta:** riallega il foglio modello e aggiungi `Keep the same pixel size as the attached astronaut.`
- **Il minatore assomiglia troppo all'astronauta:** aggiungi `The infection must be obvious at first glance: broken dark visor, big grey-green growths, one long claw arm.`
