# Prompt Gemini: nemici e boss del piano 2 (l'alveare)

Il piano 2 è un alveare alieno: pareti di carne e chitina, nidi, uova, bozzoli e sacche luminose giallo-verdi. Per ora usa i nemici del piano 1, resi più resistenti. Questi prompt generano i suoi nemici e il suo boss.

| Nemico | Cosa fa | Come cambia il gioco |
|---|---|---|
| **Operaia** | Insetto alato veloce: vola a zig-zag e si lancia in picchiata contro di te | Veloce e imprevedibile: devi mirare d'anticipo |
| **Bozzolo** | Sacco di carne appeso al soffitto: si apre quando passi e ne escono due larve | Ucciderlo presto evita che la stanza si riempia |
| **Guardiano** | Insetto corazzato: avanza lento dietro una placca frontale, i colpi da davanti rimbalzano | Devi girargli intorno e colpirlo di fianco o da dietro |
| **Boss: la Regina** | Regina dell'alveare con un enorme addome pieno di uova | Chiama le operaie, spara getti di resina, carica |

## Come usarli

1. Usa **una chat nuova per ogni foglio**.
2. In ogni chat allega tre immagini, per scala, pixel e palette:
   - il **foglio modello dell'astronauta** (`art/raw/player/01-reference.jpeg`);
   - il **foglio degli oggetti dell'alveare** (`art/raw/rooms/2-hive-props.jpeg`);
   - lo **strisciante** (`art/raw/enemies/1-crawler.jpeg`), come esempio di stile dei nemici.
3. Copia il prompt in inglese così com'è.
4. Carica il risultato in `art/raw/enemies/` (i nemici) o `art/raw/bosses/` (il boss) con questi nomi:

| Foglio | Nome file |
|---|---|
| Operaia | `2-worker.png` |
| Bozzolo | `2-cocoon.png` |
| Guardiano | `2-guardian.png` |
| Boss: la Regina | `2-queen.png` |

**Layout dei nemici:** 6 colonne × 3 righe.

| Riga | Contenuto |
|---|---|
| 1 | Movimento (o attesa, per il bozzolo): 6 frame in loop |
| 2 | Attacco: 6 frame |
| 3 | Colpito: 2 frame, poi morte: 4 frame |

**Layout del boss:** 6 colonne × 4 righe, come la Madre della covata.

---

## 1. Operaia (insetto volante)

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the hive props (palette and mood) and the alien tick (enemy style). Do not copy them; draw a new enemy.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

ENEMY: "Hive Worker", a fast flying alien insect from a fleshy alien hive. A thin segmented body about 22 pixels long: a small eyeless head with long hooked mandibles, a narrow thorax with four thin legs tucked under it, and a pointed abdomen with a glowing yellow-green tip. Two pairs of torn, veined, translucent wings, buzzing. It flies about 8 pixels above the ground: leave empty space between it and the bottom of the cell.
PALETTE: chitin #5a3a4a #7e5a68 #a98a94, wings #c8b8c0 #8a7a84 with dark veins #3a2a32, glowing tip #d8e04a #9aa860, mandibles #e8dcc8, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: side view facing RIGHT only, seen slightly from above (3/4 top-down). The insect flies at the same height in the middle of every cell, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, FLY loop, 6 frames: the wings beat fast (up, middle, down, middle, up, middle), the body bobs by 1 pixel, the legs twitch.
Row 2, DIVE attack, 6 frames: it pulls back with the wings raised, the abdomen tip flares bright, it tilts its head down, it lunges forward stretched out with the mandibles open wide, it bites, it pulls back to rest.
Row 3: frames 1-2 HURT (flashes almost white, then spins sideways with a torn wing); frames 3-6 DEATH (the wings crumple, it falls to the ground, curls its legs, a small yellow-green splat remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 2. Bozzolo (sacco che libera larve)

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the hive props (palette and mood) and the alien tick (enemy style). Do not copy them; draw a new enemy.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

ENEMY: "Brood Cocoon", a fleshy alien egg sac rooted in the floor of an alien hive. A swollen, veined, pear-shaped sac about 22 pixels wide and 28 pixels tall, standing on a base of sticky roots and resin. Its skin is thin and wet: the dark shapes of two curled larvae move inside it. A slit at the top glows yellow-green. It does not move from its place.
PALETTE: skin #7e5a68 #a98a94 #5a3a4a, veins #3a1a28, roots and resin #4a3a30 #8a7a5a, larvae shadows #2a1a22, glowing slit #d8e04a #9aa860, wet highlights #e8eef7, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: seen slightly from above (3/4 top-down). The sac stands on the bottom of each cell, on the same baseline in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, IDLE loop, 6 frames: the sac breathes slowly (swells by 1 pixel, shrinks back), the larvae shapes inside shift, the slit glows brighter and dimmer.
Row 2, HATCH attack, 6 frames: the sac swells hard, the slit tears wider, the top splits open like petals, a small pale larva (about 10 pixels long) wriggles out over the edge, a second one follows, the sac sags half-empty.
Row 3: frames 1-2 HURT (flashes almost white, then squirts a little goo); frames 3-6 DEATH (the sac tears down the side, goo pours out, it collapses flat, an empty shrivelled skin on its roots remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 3. Guardiano (insetto corazzato)

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the hive props (palette and mood) and the alien tick (enemy style). Do not copy them; draw a new enemy.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

ENEMY: "Hive Guardian", a heavy armoured alien insect that guards the hive. A low, wide body about 28 pixels long and 22 pixels tall on six thick legs. Its head is hidden behind a huge curved bone-coloured shield plate, cracked and scarred, that covers the whole front of the body like a riot shield. Behind the plate: small yellow-green glowing eyes and short heavy mandibles. Its back has soft, exposed purple flesh between ridged chitin bands: that is its weak spot.
PALETTE: shield plate #e8dcc8 #b8a888 #7a6a58 with dark cracks #3a2a22, chitin #5a3a4a #7e5a68, soft back flesh #a85a78 #d88aa0, legs #2e2030 #4a3a48, eyes #d8e04a, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: side view facing RIGHT only, seen slightly from above (3/4 top-down). The body rests on the bottom of each cell, on the same baseline in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, WALK loop, 6 frames: a slow heavy walk, the legs step in pairs, the shield plate rocks a little, the soft back flesh pulses.
Row 2, SHIELD BASH attack, 6 frames: it lowers the shield, digs its back legs in, rears the front up, slams the shield forward and down with a small cloud of dust, holds it there, lifts it back to rest.
Row 3: frames 1-2 HURT (flashes almost white, then flinches with the shield raised); frames 3-6 DEATH (the shield plate cracks in two and falls off, the legs give way, it rolls onto its side, a still body with the broken shield next to it remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

---

## 4. Boss: la Regina dell'alveare

**Layout del foglio:**

| Riga | Contenuto |
|---|---|
| 1 | Movimento: 6 frame in loop |
| 2 | Getto di resina: 6 frame |
| 3 | Richiamo dello sciame: 3 frame. Poi carica: 3 frame |
| 4 | Colpita: 2 frame. Poi morte: 4 frame |

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the hive props (palette and mood) and the alien tick (enemy style). Do not copy them; draw a new creature.
Pixel art BOSS sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

CREATURE: "Hive Queen", the ruler of a fleshy alien hive. A huge insect queen about 84 pixels long and 60 pixels tall, more than twice the astronaut's height. Front: a tall armoured thorax with a crown of curved bone-coloured horns around an eyeless head, long hooked mandibles, and four thin clawed front arms held up like a mantis. Back: an enormous swollen, veined abdomen dragging on the ground, translucent, full of dark eggs and glowing yellow-green sacs. Two pairs of short torn wings on her back, too small to fly. Strands of resin and nest fibres hang from her body. Regal, heavy and terrifying.
PALETTE: chitin #5a3a4a #7e5a68 #a98a94, horns and claws #e8dcc8 #b8a888 #7a6a58, abdomen #a85a78 #d88aa0 #7e3a58 with dark eggs #3a1a28, glowing sacs #d8e04a #9aa860, resin #c8a050 #8a6a30, wings #c8b8c0 #8a7a84, wet highlights #e8eef7, outline #0b0d14.

TRUE pixel art: each frame is exactly 96x96 pixels, upscaled 4x with crisp, square, equal-size pixels. Keep the SAME pixel size as the attached astronaut: the boss is bigger because it has more pixels, not bigger pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: side view facing RIGHT only, seen slightly from above (3/4 top-down). The body rests on the bottom of each cell, on the same baseline in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, CRAWL loop, 6 frames: she drags herself forward on her legs, the abdomen sways and wobbles behind her, the front arms twitch, the glowing sacs pulse.
Row 2, RESIN SPIT attack, 6 frames: she rears back, her throat swells amber, the mandibles open wide, she spits a thick blob of amber resin forward, strings of resin drip from her mouth, back to rest.
Row 3: frames 1-3 SUMMON SWARM (she raises all four arms and her horn crown, the abdomen flashes bright yellow-green, the small wings buzz and a cloud of tiny flying insects bursts out around her); frames 4-6 CHARGE (she lowers her head with the horns forward, lunges ahead stretched low with the arms spread, slides to a stop).
Row 4: frames 1-2 HURT (flashes almost white, then recoils with the arms pulled in); frames 3-6 DEATH (she screeches with the head thrown back, the abdomen bursts and yellow-green goo and eggs spill out, the arms fold, she collapses, a big puddle of goo with broken horns remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Se qualcosa va storto

- **Gemini taglia il foglio del boss:** chiedi solo due righe per volta (`rows 1-2 only`, poi `rows 3-4 only`) e carica due file, `2-queen-a.png` e `2-queen-b.png`.
- **Sfondo a scacchi invece che magenta:** rispondi `the background must be solid flat magenta #FF00FF, not a checkerboard`.
