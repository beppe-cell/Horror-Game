# Prompt Gemini: altri alieni del piano 2 (non insetti)

Gli insetti sono la fauna dell'alveare. Questi sono altri alieni che ci vivono o ci sono finiti dentro.

| Nemico | Cosa fa | Nome file |
|---|---|---|
| Melma divisibile | Colpita si divide in due più piccole, fino a goccioline veloci | `2-slime.png` |
| Medusa del vuoto | Fluttua sopra gli ostacoli, ogni tanto lancia un anello elettrico | `2-jelly.png` |
| Predatore invisibile | Quasi trasparente, si vede solo quando attacca o viene colpito | `2-stalker.png` |
| Cacciatore rivale | Alieno con lancia e armatura: schiva i colpi e lancia la lancia | `2-hunter.png` |
| Osservatore | Occhio fluttuante che ti punta con un raggio | `2-watcher.png` |
| Golem di resina | Lento e duro; colpito perde schegge tutto intorno | `2-golem.png` |
| Fungo parassita | Fermo; semina spore-mine sul pavimento | `2-fungus.png` |

## Come usarli

1. Usa **una chat nuova per ogni nemico**.
2. In ogni chat allega:
   - il **foglio modello dell'astronauta** (`art/raw/player/01-reference.jpeg`);
   - il **foglio degli oggetti dell'alveare** (`art/raw/rooms/2-hive-props.jpeg`);
   - il **guardiano** (`art/raw/enemies/2-guardian.jpeg`), come esempio di stile dei nemici.
3. Copia il prompt in inglese così com'è.
4. Carica il risultato in `art/raw/enemies/`. Il nome non importa: li rinomino io.

**Layout di ogni foglio:** 6 colonne × 3 righe.

| Riga | Contenuto |
|---|---|
| 1 | Movimento (o attesa): 6 frame in loop |
| 2 | Attacco: 6 frame |
| 3 | Colpito: 2 frame, poi morte: 4 frame |

**Se lo sfondo esce a scacchi:** rispondi `the background must be solid flat magenta #FF00FF, not a checkerboard`.

---

## 1. Melma divisibile

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the hive props (palette and mood) and the armoured alien (enemy style). Do not copy them; draw a new enemy.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

ENEMY: "Splitting Slime", a wobbling blob of translucent alien jelly living in the damp corners of an alien hive. A round, sagging dome about 26 pixels wide and 20 pixels tall, sitting on the ground. Inside its see-through body float a dark nucleus, a few bubbles, a small bone and a swallowed bolt. It has no eyes, no mouth and no limbs: it moves by squashing and stretching.
PALETTE: jelly #5ad8a0 #2f9a78 #1f5a50, highlights #c8ffe8, nucleus #1a2a28, swallowed bone #e8dcc8, bubbles #b8ffe0, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: seen slightly from above (3/4 top-down). The blob rests on the bottom of each cell, on the same baseline in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, HOP loop, 6 frames: it squashes flat, stretches up tall, leans forward, lands and wobbles, settles back round; the nucleus lags behind the movement.
Row 2, SPLIT, 6 frames: it bulges, a crease forms down the middle, the crease deepens, it pinches into two blobs still joined by a thin strand, the strand snaps, two smaller blobs side by side.
Row 3: frames 1-2 HURT (flashes almost white, then jiggles hard with a ripple); frames 3-6 DEATH (it bursts, jelly splashes outward, it collapses into a flat puddle, a small puddle with the nucleus remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 2. Medusa del vuoto

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the hive props (palette and mood) and the armoured alien (enemy style). Do not copy them; draw a new enemy.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

ENEMY: "Void Jelly", a floating alien jellyfish that drifts through the air of an alien hive. A translucent bell-shaped dome about 22 pixels wide and 14 pixels tall, with glowing violet veins and a bright core, and six long thin trailing tentacles below it that crackle with tiny electric sparks. It floats about 6 pixels above the ground: leave empty space between the tentacle tips and the bottom of the cell.
PALETTE: bell #8a7ad8 #5a4aa8 #3a2a78, highlights #d8ccff, veins and core #c8a0ff #ffffff, tentacles #6a5ab8 #a090e8, sparks #a0f0ff #ffffff, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: seen slightly from above (3/4 top-down). It floats at the same height in the middle of every cell, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, DRIFT loop, 6 frames: the bell slowly contracts and opens like a jellyfish swimming, the tentacles trail and curl, the core pulses.
Row 2, PULSE attack, 6 frames: the bell squeezes tight, the core and veins glow brighter and brighter, sparks gather on the tentacles, the tentacles flare straight out in all directions with a burst of sparks, the glow fades, back to rest.
Row 3: frames 1-2 HURT (flashes almost white, then shudders with crooked tentacles); frames 3-6 DEATH (the core flickers out, the bell deflates and tears, it sinks to the ground, a limp transparent sheet with tangled tentacles remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 3. Predatore invisibile

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the hive props (palette and mood) and the armoured alien (enemy style). Do not copy them; draw a new enemy.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

ENEMY: "Stalker", a lean alien reptile that hunts by camouflage. A low, long body about 30 pixels long and 16 pixels tall on four bent, clawed legs, a long whip tail, and a narrow head with a jaw that splits open in three parts. Its skin is a pattern of small scales that shift colour to match the ground. In rows 1 and 3 it is shown fully visible; the game makes it transparent itself.
PALETTE: scales #4a5a58 #6a7a70 #2a3432, camouflage spots #5a4a52 #7e5a68, belly #a8b0a0, jaw inside #8a2a3a #3a0f18, eyes #ffd34d, claws #e8dcc8, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: side view facing RIGHT only, seen slightly from above (3/4 top-down). The body rests on the bottom of each cell, on the same baseline in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, PROWL loop, 6 frames: a low, slinking walk, the legs move in diagonal pairs, the tail sways, the head stays level.
Row 2, POUNCE attack, 6 frames: it crouches low, the tail lifts, the three-part jaw splits open wide, it leaps forward stretched out with the claws first, it bites, it lands and pulls back.
Row 3: frames 1-2 HURT (flashes almost white, then recoils with the jaw open); frames 3-6 DEATH (it rears up hissing, falls on its side, the legs curl, a still body with dull grey scales remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 4. Cacciatore rivale

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the hive props (palette and mood) and the armoured alien (enemy style). Do not copy them; draw a new enemy.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

ENEMY: "Rival Hunter", a humanoid alien from another species that came to the hive to hunt, about the same height as the astronaut (about 30 pixels tall). Tall and thin, with long arms and backward-bent legs, grey-blue skin, and a long head with four small glowing eyes. It wears patched armour made of scavenged shell plates and bones tied with cords, carries hunting trophies (small insect skulls) on its belt, and holds a long bone spear with a glowing crystal tip.
PALETTE: skin #5a6a88 #3a4a68 #8a9ab8, eyes #4dffb0, armour plates #e8dcc8 #b8a888 #7a6a58, cords and belt #6a4a30 #4a3020, spear shaft #c8b898, crystal tip #39d0ff #b8f1ff, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: side view facing RIGHT only, seen slightly from above (3/4 top-down). The feet rest on the bottom of each cell, on the same baseline in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, STALK loop, 6 frames: a careful, crouched walk with the spear held low in both hands, the head turning slightly as it watches.
Row 2, SPEAR THROW attack, 6 frames: it steps back, raises the spear over its shoulder, leans back, throws with the whole body, the empty hand stretched forward, then a new spear is pulled from its back.
Row 3: frames 1-2 HURT (flashes almost white, then staggers back holding its side); frames 3-6 DEATH (it drops to one knee, the spear falls, it collapses forward, a still body with broken armour and the spear next to it remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 5. Osservatore

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the hive props (palette and mood) and the armoured alien (enemy style). Do not copy them; draw a new enemy.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

ENEMY: "Watcher", a big floating alien eye. A round fleshy ball about 22 pixels wide with one huge eye taking most of its front: a pale veined eyeball with a red iris and a slit pupil, wet eyelids that blink. A crown of short tentacles grows around the eye, and three long thin tentacles hang below it. It floats about 6 pixels above the ground: leave empty space between the tentacle tips and the bottom of the cell.
PALETTE: flesh #7e5a68 #a85a78 #5a3a4a, eyeball #e8e0d8 #c8b8b0 with red veins #a82a3a, iris #ff4a5a #8a1a28, pupil #0b0d14, tentacles #6a3a4a #a86a7a, wet highlights #ffffff, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: seen slightly from above (3/4 top-down), the eye looking towards the viewer and a little to the RIGHT. It floats at the same height in the middle of every cell, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, FLOAT loop, 6 frames: it bobs by 1 pixel, the tentacles sway, the pupil looks left, centre, right, and it blinks once.
Row 2, BEAM attack, 6 frames: the pupil narrows to a thin line, the iris glows brighter red, the eyelids open very wide, the iris blazes white-red at the centre (a short stub of red beam leaving the pupil), it holds, the glow fades and it blinks.
Row 3: frames 1-2 HURT (flashes almost white, then squeezes the eye shut); frames 3-6 DEATH (the eye bursts with a splash, the tentacles go limp, it drops to the ground, a deflated fleshy sack remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 6. Golem di resina

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the hive props (palette and mood) and the armoured alien (enemy style). Do not copy them; draw a new enemy.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

ENEMY: "Resin Golem", a slow, heavy alien made of hardened amber resin that has swallowed everything around it. A hunched, bulky body about 30 pixels wide and 30 pixels tall with two thick arms that drag on the ground and two short legs. Stuck inside its amber body you can see bones, a broken ship panel with an orange hazard stripe, a cable and an insect wing. A small glowing heart beats deep in its chest. No real face: two dark hollows where eyes should be.
PALETTE: resin #c8a050 #8a6a30 #5a4020, highlights #ffe0a0, things inside #e8dcc8 #4f5762 #ff9a3c, heart #ff6a3a #ffd34d, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: side view facing RIGHT only, seen slightly from above (3/4 top-down). The feet rest on the bottom of each cell, on the same baseline in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, LUMBER loop, 6 frames: a slow, heavy step, the body rocks from side to side, the arms drag, the heart pulses.
Row 2, SLAM attack, 6 frames: it raises both arms high, the heart glows bright, it slams both fists into the ground, resin shards fly up around the fists, it holds, it straightens back up.
Row 3: frames 1-2 HURT (flashes almost white, then a chunk of resin cracks off its shoulder); frames 3-6 DEATH (cracks spread over the whole body, the heart goes out, it crumbles into big amber chunks, a pile of resin chunks with a bone sticking out remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 7. Fungo parassita

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the hive props (palette and mood) and the armoured alien (enemy style). Do not copy them; draw a new enemy.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

ENEMY: "Parasite Fungus", an alien fungus colony rooted in the hive floor. A cluster of five tall, thin mushroom stalks with bulbous caps, the tallest about 26 pixels high, growing from a lumpy pulsing mass about 24 pixels wide. In the middle of the mass a soft glowing "heart" beats under a thin skin. Pale threads spread out from the base over the ground. The caps have small pores on top.
PALETTE: stalks #d8c8b8 #a89888, caps #6a3a8a #9a5ab8 #c88ae8, pores #2a1a32, base mass #7e5a68 #5a3a4a, heart #4dffb0 #b8ffe0, threads #e8dcc8, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: seen slightly from above (3/4 top-down). The base rests on the bottom of each cell, on the same baseline in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, IDLE loop, 6 frames: the heart beats (bright, dim), the caps sway a little, the threads twitch.
Row 2, SPORE attack, 6 frames: the caps swell, the heart glows bright, the caps shake, puffs of glowing green spores burst out of the pores, the spores drift up, the caps shrink back.
Row 3: frames 1-2 HURT (flashes almost white, then the stalks bend away); frames 3-6 DEATH (the heart bursts, the stalks wilt and topple one by one, the caps rot dark, a flat grey stain with fallen stalks remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```
