# Prompt Gemini: 5 boss (né insetti né animali)

Cinque boss nuovi, intercambiabili su tutti i piani come gli altri.

| Boss | Cosa fa | Nome file |
|---|---|---|
| Colosso di rottami | Robot gigante fatto coi pezzi della nave, posseduto da una luce aliena: spara raffiche e carica | `boss-colossus.png` |
| Oracolo del vuoto | Monolito di pietra fluttuante con anelli che gli ruotano intorno: raggi rotanti e teletrasporto | `boss-oracle.png` |
| Signore dei cacciatori | Capo dei cacciatori alieni, armatura d'osso e lama d'energia: affondi e lance a ventaglio | `boss-warlord.png` |
| Amalgama | Massa di metallo liquido nero, cavi e tubi: si scioglie in pozze e si ricompone altrove | `boss-amalgam.png` |
| Stella del reattore | Sfera di plasma chiusa in una gabbia di anelli rotti: anelli di energia e scariche | `boss-reactor.png` |

## Come usarli

1. Usa **una chat nuova per ogni boss**.
2. In ogni chat allega il **foglio modello dell'astronauta** (`art/raw/player/01-reference.jpeg`) e la **Madre della covata** (`art/raw/bosses/1-brood-mother.jpeg`), come esempio di dimensione e stile dei boss.
3. Copia il prompt in inglese così com'è.
4. Carica il risultato in `art/raw/bosses/`. Il nome non importa: li rinomino io.

**Layout di ogni foglio:** 6 colonne × 4 righe, celle da 96×96.

**Se Gemini taglia il foglio:** chiedi `rows 1-2 only`, poi `rows 3-4 only`, e carica due file.
**Se lo sfondo esce a scacchi:** rispondi `the background must be solid flat magenta #FF00FF, not a checkerboard`.

---

## 1. Colosso di rottami

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size) and the boss (boss size and style). Do not copy them; draw a new boss.
Pixel art BOSS sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

BOSS: "Scrap Colossus", a huge walking machine built from the wreck of a crashed mining ship and brought to life by an alien glow. About 70 pixels tall and 70 pixels wide, more than twice the astronaut's height. A heavy hunched torso made of hull plates with an orange hazard stripe, a cracked cockpit window as its head with a single green alien light burning inside, one arm ending in a giant mining drill and the other in a rusty cannon made from an engine nozzle, two thick piston legs. Cables hang between its parts; green alien veins grow through the gaps and glow.
PALETTE: hull #4f5762 #7d8799 #2a3040, rust #8a4a2a #b8642a, hazard stripe #ff9a3c, alien glow #4dffb0 #b8ffe0, cables #1a1e2a, outline #0b0d14.

TRUE pixel art: each frame is exactly 96x96 pixels, upscaled 4x with crisp, square, equal-size pixels. Keep the SAME pixel size as the attached astronaut: the boss is bigger because it has more pixels, not bigger pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: side view facing RIGHT only, seen slightly from above (3/4 top-down). The feet rest on the bottom of each cell, on the same baseline in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, STOMP WALK loop, 6 frames: heavy steps, the torso rocks, the drill and the cannon swing, steam puffs from the joints.
Row 2, CANNON BARRAGE attack, 6 frames: it plants its feet, raises the cannon arm, the nozzle glows green, three recoiling shots (flash at the nozzle each time), smoke from the barrel, it lowers the arm.
Row 3: frames 1-3 DRILL CHARGE (it leans forward with the drill spinning and pointed ahead, sparks flying); frames 4-6 OVERHEAT (it stops, vents blast steam from its back, the green light in the head dims and flickers, it stands still and exposed).
Row 4: frames 1-2 HURT (flashes almost white, then a hull plate breaks off); frames 3-6 DEATH (the green light goes out, it sags, falls to its knees, collapses into a smoking pile of scrap with the drill sticking up).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 2. Oracolo del vuoto

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size) and the boss (boss size and style). Do not copy them; draw a new boss.
Pixel art BOSS sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

BOSS: "Void Oracle", an ancient alien artefact that thinks. A tall floating monolith of black stone about 40 pixels wide and 70 pixels tall, carved with glowing violet glyphs, with a smooth mask-like face near the top: no mouth, two narrow slits of white light for eyes. Three thin broken stone rings orbit around it at different angles. It floats about 10 pixels above the ground: leave empty space between it and the bottom of the cell. Small stone fragments hover around it.
PALETTE: stone #14182a #2a3040 #4a5568, glyphs #a060ff #c8a0ff, eye light #ffffff #b8f1ff, rings #3a4458 #6a7a90 with violet edges #a060ff, outline #0b0d14.

TRUE pixel art: each frame is exactly 96x96 pixels, upscaled 4x with crisp, square, equal-size pixels. Keep the SAME pixel size as the attached astronaut: the boss is bigger because it has more pixels, not bigger pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: seen slightly from above (3/4 top-down), facing the viewer. It floats at the same height in the middle of every cell, centered horizontally.

LAYOUT: exactly 6 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, HOVER loop, 6 frames: it bobs slowly, the three rings turn around it, the glyphs pulse in a wave from bottom to top, the eye slits narrow and widen.
Row 2, SWEEPING BEAMS attack, 6 frames: the rings line up flat around it, the glyphs blaze, the eye slits flare, four short beam stubs shoot out from the rings in a cross, the cross turns a little each frame, the glow fades.
Row 3: frames 1-3 TELEPORT OUT (it folds into a thin vertical line of violet light, then a few sparks, then nothing but a fading sparkle); frames 4-6 TELEPORT IN (sparks gather, a thin vertical line of light, it unfolds back to full size).
Row 4: frames 1-2 HURT (flashes almost white, then a ring cracks); frames 3-6 DEATH (cracks of light run across the stone, the rings fall and shatter, the monolith splits in two, the pieces fall to the ground and the glyphs go dark).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 3. Signore dei cacciatori

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size) and the boss (boss size and style). Do not copy them; draw a new boss.
Pixel art BOSS sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

BOSS: "Hunter Warlord", the leader of a clan of alien hunters, a tall humanoid alien about 64 pixels tall, twice the astronaut's height. Long thin limbs with backward-bent legs, grey-blue skin, a long head with four glowing green eyes and a crown of trophies made of alien skulls and horns. Heavy armour of pale bone plates and dark metal, a torn red cloak, and a long glaive with a blade of green energy held in both hands. Spare throwing spears are strapped across its back.
PALETTE: skin #5a6a88 #3a4a68 #8a9ab8, eyes #4dffb0, bone armour #e8dcc8 #b8a888 #7a6a58, dark metal #2a3040 #4a5568, cloak #8a2a3a #5a1a28, energy blade #4dffb0 #b8ffe0, outline #0b0d14.

TRUE pixel art: each frame is exactly 96x96 pixels, upscaled 4x with crisp, square, equal-size pixels. Keep the SAME pixel size as the attached astronaut: the boss is bigger because it has more pixels, not bigger pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: side view facing RIGHT only, seen slightly from above (3/4 top-down). The feet rest on the bottom of each cell, on the same baseline in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, STALK loop, 6 frames: a slow, confident walk with the glaive held low, the cloak trailing, the head turning to watch.
Row 2, LUNGE attack, 6 frames: it crouches, pulls the glaive back, leaps forward in a long thrust with the energy blade first, the blade leaves a short green arc, it lands, it recovers its stance.
Row 3: frames 1-3 SPEAR VOLLEY (it pulls three spears from its back, raises them, throws them in a fan); frames 4-6 WAR CRY (it raises the glaive over its head, the eyes and blade flare bright, it roars with the head thrown back).
Row 4: frames 1-2 HURT (flashes almost white, then staggers with a cracked armour plate); frames 3-6 DEATH (it drops the glaive, falls to one knee, plants the dead glaive in the ground and slumps against it, a still kneeling body remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 4. Amalgama

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size) and the boss (boss size and style). Do not copy them; draw a new boss.
Pixel art BOSS sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

BOSS: "Amalgam", a living mass of black liquid metal that has absorbed machines. A shapeless dripping mound about 80 pixels wide and 56 pixels tall, glossy black with bright silver highlights, with half-swallowed objects sticking out of it: ship pipes, cables, a broken monitor, a robotic arm, valve wheels. Several small round red lights blink inside it like eyes. Thick tendrils of liquid metal rise from it and drip back down.
PALETTE: liquid metal #0b0d14 #1a1e2a #3a4458, highlights #c8d0e0 #ffffff, swallowed machines #4f5762 #7d8799 #ff9a3c, red lights #ff4a5a #8a1a28, outline #0b0d14.

TRUE pixel art: each frame is exactly 96x96 pixels, upscaled 4x with crisp, square, equal-size pixels. Keep the SAME pixel size as the attached astronaut: the boss is bigger because it has more pixels, not bigger pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: seen slightly from above (3/4 top-down), leaning a little to the RIGHT. The mass rests on the bottom of each cell, on the same baseline in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, OOZE loop, 6 frames: it rolls forward like a slow wave, the surface ripples, the swallowed objects bob in and out, the red lights blink.
Row 2, TENDRIL LASH attack, 6 frames: three tendrils rise high, harden into sharp spikes, lash forward and down, splash on the ground, melt back into the mass.
Row 3: frames 1-3 MELT (it sinks and spreads into a flat glossy puddle with only the red lights showing); frames 4-6 REFORM (the puddle bulges, rises and pulls itself back into the mound shape).
Row 4: frames 1-2 HURT (flashes almost white, then ripples hard with a splash); frames 3-6 DEATH (the red lights go out one by one, the metal turns dull and grey, it collapses into a spreading puddle, a dull grey puddle with the swallowed objects lying in it remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## 5. Stella del reattore

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size) and the boss (boss size and style). Do not copy them; draw a new boss.
Pixel art BOSS sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

BOSS: "Reactor Star", the alien energy that lived in the ship's reactor core and broke free. A floating sphere of boiling plasma about 44 pixels wide, white-hot in the middle and orange and red at its edges, with dark spots that move across it like sunspots. Around it, a broken cage of three heavy metal reactor rings with warning stripes and torn cables, kept turning by the energy. It floats about 12 pixels above the ground: leave empty space between the lowest ring and the bottom of the cell.
PALETTE: plasma core #ffffff #fff0b0 #ffd34d, plasma edge #ff9a3c #ff4a2a #8a1a10, sunspots #5a1a10, rings #4f5762 #7d8799 #2a3040, warning stripes #ffd34d #0b0d14, outline #0b0d14.

TRUE pixel art: each frame is exactly 96x96 pixels, upscaled 4x with crisp, square, equal-size pixels. Keep the SAME pixel size as the attached astronaut: the boss is bigger because it has more pixels, not bigger pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: seen slightly from above (3/4 top-down). It floats at the same height in the middle of every cell, centered horizontally.

LAYOUT: exactly 6 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, PULSE loop, 6 frames: the plasma boils (its edge shifts), the sunspots drift, the rings turn around it at different speeds.
Row 2, NOVA RING attack, 6 frames: the plasma shrinks and grows brighter, the rings stop and line up flat, it flares wide with flames licking out between the rings, a burst of flame shoots outward in all directions, it shrinks back.
Row 3: frames 1-3 ARC DISCHARGE (bolts of orange lightning crackle from the plasma to the rings, then one long bolt stub shoots down to the ground); frames 4-6 COOLDOWN (the plasma darkens to deep red, the rings droop and slow down, steam rises off the metal).
Row 4: frames 1-2 HURT (flashes almost white, then flickers); frames 3-6 DEATH (it swells and cracks with white light, explodes in a ring of flame, the rings fall and clatter to the ground, a scorched crater with three broken glowing rings remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```
