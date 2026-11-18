# Prompt Gemini: nemici e boss del piano 3 (grotte di cristallo)

Il piano 3 sono grotte piene di cristalli azzurri e viola, ghiaccio e vecchie macchine minerarie congelate. Per ora usa un misto dei nemici più duri dei piani sopra. Questi prompt generano i suoi nemici e il suo boss.

| Nemico | Cosa fa | Nome file |
|---|---|---|
| Scheggia vivente | Rotola veloce verso di te; quando muore esplode in schegge che volano tutto intorno | `3-shardling.png` |
| Spettro prismatico | Spirito di cristallo che sparisce e riappare altrove, poi spara un raggio che si divide in tre | `3-wraith.png` |
| Verme di cristallo | Scava sotto il pavimento e fa spuntare una fila di spuntoni verso di te | `3-burrower.png` |
| Boss: il Cuore di cristallo | Enorme creatura di cristallo protetta da cristalli che le girano intorno | `3-heart.png` |

## Come usarli

1. Usa **una chat nuova per ogni foglio**.
2. In ogni chat allega:
   - il **foglio modello dell'astronauta** (`art/raw/player/01-reference.jpeg`);
   - il **foglio degli oggetti delle grotte** (`art/raw/rooms/3-crystal-props.jpeg`);
   - il **guardiano** (`art/raw/enemies/2-guardian.jpeg`), come esempio di stile dei nemici.
3. Copia il prompt in inglese così com'è.
4. Carica il risultato in `art/raw/enemies/` (i nemici) o `art/raw/bosses/` (il boss). Il nome non importa: li rinomino io.

**Layout dei nemici:** 6 colonne × 3 righe (movimento, attacco, colpito + morte).
**Layout del boss:** 6 colonne × 4 righe.

**Se lo sfondo esce a scacchi:** rispondi `the background must be solid flat magenta #FF00FF, not a checkerboard`.
**Se Gemini taglia il foglio del boss:** chiedi `rows 1-2 only`, poi `rows 3-4 only`, e carica due file.

---

## 1. Scheggia vivente

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the crystal cave props (palette and mood) and the armoured alien (enemy style). Do not copy them; draw a new enemy.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

ENEMY: "Shardling", a small living cluster of alien crystal. A round knot of sharp cyan and violet crystal points about 18 pixels wide, with a dark rocky core where two small white eyes glow between the crystals. It has no legs: it rolls along the ground like a spiky ball.
PALETTE: crystals #5af0ff #2fa8c8 #b8f8ff, violet crystals #a060ff #6a3ab8, core rock #2a3040 #14182a, eyes #ffffff, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: seen slightly from above (3/4 top-down). It rests on the bottom of each cell, on the same baseline in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, ROLL loop, 6 frames: it rolls forward, the crystal points turning round its core a sixth of a turn each frame, the eyes staying on top.
Row 2, CHARGE UP attack, 6 frames: it stops, the crystals bristle and grow longer, the core glows brighter, it shivers, it flashes bright cyan, back to rest.
Row 3: frames 1-2 HURT (flashes almost white, then a crystal point cracks off); frames 3-6 DEATH (cracks of light spread through it, it bursts into flying crystal shards, the shards scatter outward, a small ring of broken crystal bits on the floor remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 2. Spettro prismatico

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the crystal cave props (palette and mood) and the armoured alien (enemy style). Do not copy them; draw a new enemy.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

ENEMY: "Prism Wraith", a ghostly alien made of floating crystal pieces. A tall, thin shape about 28 pixels high: a long six-sided crystal for a head with one bright slit of light for a face, a loose cloud of floating crystal shards for a body, and two long crystal blades for arms, none of them touching each other. A faint rainbow shimmer runs through it. It floats about 6 pixels above the ground: leave empty space between it and the bottom of the cell.
PALETTE: crystal #b8f8ff #5af0ff #2fa8c8, violet #c8a0ff #6a3ab8, rainbow edges #ff9ad8 #ffd34d #8affc8, face light #ffffff, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: side view facing RIGHT only, seen slightly from above (3/4 top-down). It floats at the same height in the middle of every cell, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, FLOAT loop, 6 frames: the floating pieces drift slowly around each other, the arms sway, the face light pulses.
Row 2, VANISH and BEAM, 6 frames: frames 1-2 it breaks apart into a spray of glittering shards and is gone (frame 2 only a few sparkles); frame 3 the shards gather again from sparkles; frames 4-6 it raises both crystal arms, the face light flares, a short bright beam stub leaves its face, it lowers the arms.
Row 3: frames 1-2 HURT (flashes almost white, then the pieces scatter a little); frames 3-6 DEATH (the face light goes out, the pieces fall apart and drop, they shatter on the floor, a scatter of dull grey crystal shards remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 3. Verme di cristallo

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the crystal cave props (palette and mood) and the armoured alien (enemy style). Do not copy them; draw a new enemy.
Pixel art ENEMY sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

ENEMY: "Crystal Burrower", a thick alien worm that tunnels through crystal rock. Only its front half shows above the ground: a segmented body about 26 pixels tall rising out of a hole of broken floor tiles, covered in plates of dark rock with cyan crystals growing between them, and a round mouth that opens in four parts with rings of crystal teeth inside. No eyes.
PALETTE: rock plates #2a3040 #4a5568 #14182a, crystals #5af0ff #b8f8ff, mouth #3a0f18 #8a2a3a, teeth #e8f8ff, broken floor #1a2030 #3a4458, outline #0b0d14.

TRUE pixel art: each frame is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: seen slightly from above (3/4 top-down), the worm leaning a little to the RIGHT. The hole rests on the bottom of each cell, on the same baseline in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, SURFACE and DIVE, 6 frames: frames 1-3 it bursts up out of the hole with rock bits flying (frame 1 only cracks in the floor, frame 2 the head, frame 3 fully up); frames 4-6 it sinks back down until only the hole with cracks is left.
Row 2, SPIKE attack, 6 frames: it rears back, the mouth opens wide, it slams its head into the floor, a short line of cyan crystal spikes bursts out of the floor in front of it, the spikes crumble, it rises back.
Row 3: frames 1-2 HURT (flashes almost white, then flinches back); frames 3-6 DEATH (it shrieks with the mouth wide, the crystals crack and fall off, it collapses over the edge of the hole, a still body hanging out of the hole remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

---

## 4. Boss: il Cuore di cristallo

| Riga | Contenuto |
|---|---|
| 1 | Attesa: 6 frame in loop |
| 2 | Pioggia di schegge: 6 frame |
| 3 | Spuntoni dal pavimento: 3 frame. Poi lo scudo si rompe: 3 frame |
| 4 | Colpito: 2 frame. Poi morte: 4 frame |

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the crystal cave props (palette and mood) and the armoured alien (enemy style). Do not copy them; draw a new creature.
Pixel art BOSS sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

CREATURE: "Crystal Heart", the ancient living mind of the crystal caves. A huge crystal formation about 80 pixels wide and 70 pixels tall, much taller than the astronaut, rooted in a mound of dark rock. In its middle a giant six-sided crystal holds a beating heart of light, with a vertical slit like an eye. Around it grow tall cyan and violet crystal spires shaped like a crown, and four long jagged crystal limbs reach out to the sides and claw at the ground. Old mining machines, a broken drill and frozen cables are trapped half inside its crystals. Majestic, cold and alien.
PALETTE: crystal #5af0ff #2fa8c8 #b8f8ff, violet #a060ff #6a3ab8 #c8a0ff, heart and eye light #ffffff #ffd34d, rock base #14182a #2a3040 #4a5568, trapped machines #4f5762 #ff9a3c, outline #0b0d14.

TRUE pixel art: each frame is exactly 96x96 pixels, upscaled 4x with crisp, square, equal-size pixels. Keep the SAME pixel size as the attached astronaut: the boss is bigger because it has more pixels, not bigger pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: seen slightly from above (3/4 top-down), facing the viewer. The rock base rests on the bottom of each cell, on the same baseline in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, IDLE loop, 6 frames: the heart beats (bright, dim), the eye slit opens and closes, the limbs scrape the ground slowly, small sparkles move up the spires.
Row 2, SHARD STORM attack, 6 frames: the spires glow brighter, the limbs rise, the eye opens wide, the spires fire a burst of crystal shards upward and outward, the shards fly away, the glow fades.
Row 3: frames 1-3 SPIKES (the limbs stab down into the ground, the heart flares, cracks of light run across the floor away from it); frames 4-6 SHIELD BREAK (its outer crystal shell cracks, big pieces fall off, the heart is left exposed and pulsing red).
Row 4: frames 1-2 HURT (flashes almost white, then the heart flickers); frames 3-6 DEATH (the heart cracks and bursts in a flash of light, the spires shatter and fall, the limbs collapse, a pile of dull broken crystal on the rock mound remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```
