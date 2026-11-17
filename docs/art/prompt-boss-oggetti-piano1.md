# Prompt Gemini: boss e oggetti del piano 1

Due generazioni: il boss del sito dello schianto e un foglio con i primi 10 oggetti, più il piedistallo della stanza del tesoro e la ricarica della tuta.

## Come usarli

1. Usa **una chat nuova per ogni foglio**.
2. In ogni chat **allega il foglio modello dell'astronauta** (`art/raw/player/01-reference.jpeg`) e il **foglio degli oggetti del piano 1** (`art/raw/rooms/1-crash-props.jpeg`). Per il boss allega anche il **nuovo foglio dello strisciante** (`art/raw/enemies/1-crawler.png`): il boss è sua madre. Genera prima lo strisciante.
3. Copia il prompt in inglese così com'è.
4. **Carica** il risultato (PNG o JPEG) con questi nomi:

| Foglio | Cartella e nome file |
|---|---|
| Boss: Madre della covata | `art/raw/bosses/1-brood-mother.png` |
| Oggetti, piedistallo, ricarica | `art/raw/items/1-items.png` |

---

## 1. Boss: Madre della covata

La regina delle zecche aliene, cresciuta dentro lo scafo della nave. È enorme, lenta e corazzata di rottami, con un sacco di uova gigante. Ha tre attacchi:
- **pioggia di spore:** un anello di spore attorno a sé;
- **scavo:** sparisce sotto terra e riemerge sotto l'astronauta;
- **covata:** depone 2-3 striscianti.

**Layout del foglio:**

| Riga | Contenuto |
|---|---|
| 1 | Movimento: 6 frame in loop |
| 2 | Pioggia di spore: 6 frame |
| 3 | Scavo: 3 frame in cui si immerge, 3 in cui riemerge |
| 4 | Covata: 3 frame. Poi morte: 3 frame |

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size), the crash-site props (palette and mood) and the crawler tick (this boss is its mother). Do not copy them; draw a new creature.
Pixel art BOSS sprite sheet for a top-down 3/4 view sci-fi horror roguelite.

CREATURE: "Brood Mother", the queen of the alien ticks (the attached crawler is one of her young), grown huge inside the wreck of a crashed mining ship. A bloated body about 80 pixels long and 56 pixels tall, more than twice the astronaut's height. Front: the same eyeless grey-violet chitin shell as the small tick, with huge vertical mandibles around a red mouth. Back: an enormous swollen translucent egg sac, pale yellow-green, full of dark eggs. Eight thick jointed legs, too short for her weight, dragging her forward. Twisted hull plates, a cracked ship panel with an orange hazard stripe and a torn cable are fused into her shell. Heavy, disgusting and threatening.
PALETTE: chitin #5a5470 #7e7896 #a9a3bf, legs #2e2a3a #4a4560, egg sac #c8d08a #9aa860 with eggs #6a7a3a, glowing eggs #d8e04a, mouth #3a0f18 #8a2a3a, hull plates #4f5762 #7d8799, hazard stripe #ff9a3c, wet highlights #e8eef7, outline #0b0d14.

TRUE pixel art: each frame is exactly 96x96 pixels, upscaled 4x with crisp, square, equal-size pixels. Keep the SAME pixel size as the attached astronaut: the boss is bigger because it has more pixels, not bigger pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds lights and shadows).
VIEW: side view facing RIGHT only, seen slightly from above (3/4 top-down). The body rests on the bottom of each cell, on the same baseline in every frame, centered horizontally.

LAYOUT: exactly 6 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers.
Row 1, CRAWL loop, 6 frames: the huge body heaves forward in a slow wave from tail to head, the legs drag, the egg sac wobbles, the mandibles twitch open and shut.
Row 2, SPORE BURST attack, 6 frames: the body swells, the eggs in the sac bulge and glow, she rears up with the mandibles spread wide, the sac pores burst and spray a ring of yellow-green spores outward, she slumps back, back to rest.
Row 3, BURROW, 6 frames: frames 1-3 she lowers her head and digs into the ground until only the hull plates on her back show, then only a mound of dirt; frames 4-6 the ground cracks open and she bursts up out of it with the mandibles spread wide, dirt flying.
Row 4: frames 1-3 LAY BROOD (she arches, the egg sac pulses and drops a wet egg behind her, the egg splits and a small crawler tick scuttles out); frames 4-6 DEATH (the egg sac bursts, yellow-green goo sprays out, the body deflates and collapses under the hull plates, a big puddle of goo remains).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

---

## 2. Oggetti, piedistallo e ricarica della tuta

Ogni oggetto è un pezzo di tecnologia recuperato dal relitto, o un frammento alieno. Si raccoglie su un piedistallo nella stanza del tesoro.

| Cella | Oggetto | Effetto nel gioco |
|---|---|---|
| 1 | Nucleo al plasma | + danno |
| 2 | Condensatore rapido | + cadenza di fuoco |
| 3 | Canna estesa | + gittata |
| 4 | Servomotori delle gambe | + velocità di movimento |
| 5 | Acceleratore di particelle | + velocità dei colpi |
| 6 | Moneta del capitano | + fortuna |
| 7 | Piastra di blindatura | + 1 cella della tuta |
| 8 | Generatore di scudo | + scudo |
| 9 | Prisma riflettente | colpi che rimbalzano sui muri |
| 10 | Scheggia di cristallo alieno | colpi che perforano i nemici |
| 11 | Piedistallo alieno | dove appare l'oggetto |
| 12 | Cella di energia | ricarica mezza cella della tuta |

**Layout del foglio:** 4 colonne per 3 righe, in ordine di lettura da sinistra a destra.

```
Use the attached images as references for pixel size, palette and style: the astronaut (scale and pixel size) and the crash-site props (palette and mood). Do not copy them; draw new objects.
Pixel art ITEM ICON sheet for a top-down 3/4 view sci-fi horror roguelite. Every item is salvaged technology from a crashed mining ship or a fragment of an alien structure. Each one must be instantly readable at a small size, with a strong silhouette and one clear accent colour.

TRUE pixel art: each cell is exactly 32x32 pixels and each item fills about 22x22 pixels in the middle of its cell, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds light and a floating bob).
VIEW: seen slightly from above (3/4 top-down), each item centered in its cell.

LAYOUT: exactly 4 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no numbers, no text.
Row 1:
1. PLASMA CORE: a small cylindrical reactor core in a metal cage, glowing cyan #39d0ff #b8f1ff inside.
2. RAPID CAPACITOR: a chunky battery-like capacitor with copper coils and a yellow lightning mark #ffd34d.
3. EXTENDED BARREL: a long gun barrel attachment with cooling fins, grey metal #4f5762 #7d8799 with a teal tip #7cf7d4.
4. LEG SERVOS: a pair of mechanical knee braces with pistons, off-white #c8ccc4 with orange joints #ff9a3c.
Row 2:
5. PARTICLE ACCELERATOR: a small ring-shaped accelerator with a bright green core #4dffb0.
6. CAPTAIN'S COIN: an old worn golden coin #ffd34d #b8862a with a ship emblem, slightly tilted.
7. ARMOR PLATE: a thick curved suit armor plate, off-white #c8ccc4 with an orange hazard stripe #ff9a3c and rivets.
8. SHIELD GENERATOR: a compact disc-shaped device with a dome of pale blue energy #b8f1ff #e8eef7.
Row 3:
9. REFLECTING PRISM: a sharp triangular glass prism splitting light into a small rainbow edge, mostly clear #e8eef7 with violet #a070ff.
10. ALIEN CRYSTAL SHARD: a jagged needle of alien crystal, green #4dffb0 #1f8a5a, very sharp tip.
11. ALIEN PEDESTAL: a short pedestal of dark alien stone #2a3040 #4a5568 with glowing green runes #4dffb0, flat top, about 26 pixels wide and 20 pixels tall, standing on the bottom of its cell.
12. ENERGY CELL: a small glowing suit battery, cyan #39d0ff with a white plus sign.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

---

## Se Gemini non collabora

- **Griglia sbagliata:** aggiungi `The grid MUST be exactly 6 columns and 4 rows` (boss) o `exactly 4 columns and 3 rows` (oggetti). Lo script trova i pezzi anche se la griglia è irregolare, purché l'ordine sia quello giusto.
- **Pixel sfocati:** aggiungi `Hard pixel edges only, like a 1990s console sprite.`
- **Boss con pixel più grossi dell'astronauta:** riallega il foglio modello e aggiungi `Same pixel size as the attached astronaut. More pixels, not bigger pixels.`
- **Oggetti illeggibili:** aggiungi `Bold simple shapes, at most 4 colours per item.`
- **Gemini taglia il foglio del boss:** chiedi solo due righe per volta (`rows 1-2 only`, poi `rows 3-4 only`) e carica due file, `1-brood-mother-a.png` e `1-brood-mother-b.png`.
