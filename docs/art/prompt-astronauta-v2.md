# Prompt Gemini: nuovo design dell'astronauta

L'astronauta attuale è troppo generico: tuta bianca, casco tondo, visiera ciano. Qui ci sono **tre proposte** con una silhouette e una storia più forti. Il metodo:

1. Genera **solo il foglio di prova** di ognuna: 3 pose, davanti, di spalle e di lato.
2. Scegli quella che ti piace e carica il foglio come `art/raw/player/concept-a.png`, `concept-b.png` o `concept-c.png`.
3. Ti preparo i 5 prompt delle animazioni con il design scelto. Lo script di pulizia e il gioco restano uguali.

In ogni chat allega il **foglio degli oggetti del piano 1** (`art/raw/rooms/1-crash-props.jpeg`) per palette e atmosfera. **Non** allegare il vecchio astronauta, altrimenti Gemini lo ricopia.

---

## A. Il palombaro: "Ruggine"

Un minatore delle profondità con una **vecchia tuta da palombaro spaziale**: casco di metallo pesante con tre oblò, lampada da minatore sulla fronte, braccio destro sostituito da un **trapano-blaster**. Lento, corazzato, robusto. Ricorda un'archeologia industriale: rame scurito, bulloni, tubi.

**Silhouette:** testa a campana larga e bassa, spalle enormi, braccio destro più grosso del sinistro.

```
Pixel art CHARACTER CONCEPT sheet for a top-down 3/4 view sci-fi horror roguelite set in dark alien caves around a crashed mining ship. Use the attached props only for palette and mood.

CHARACTER: "Rust", a deep-core miner in an old heavy diving-style space suit. A heavy bell-shaped dark bronze helmet with three small round portholes: one big front porthole glowing warm amber, two smaller ones on the sides. A miner's lamp on the forehead of the helmet. Huge riveted shoulder pads. The RIGHT arm is a mechanical drill-blaster: a thick barrel with a spiral drill bit and a cyan energy coil, bigger than the left arm. The left hand is a thick work glove. Thick rubber hoses run from a boxy back tank into the helmet. Patched canvas suit, heavy boots with metal soles. Chunky, slow, armored, memorable at a glance.
PALETTE: bronze #8a5a2e #b8803a #5a3a20, porthole glow #ffb84a #fff0b0, suit canvas #6f6a5a #a39c84 #3f3b30, hoses and boots #2e2a3a #4a4560, drill coil #39d0ff #b8f1ff, rust accents #b85a1c, outline #0b0d14.

TRUE pixel art: each cell is exactly 48x48 pixels, upscaled 6x with crisp, square, equal-size pixels. The character is about 26 pixels wide and 40 pixels tall, feet on the same baseline 3 pixels above the bottom of every cell. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO ground shadow.

LAYOUT: exactly 3 columns by 1 row of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Cell 1: front view (facing the camera). Cell 2: back view. Cell 3: side view facing RIGHT. Same standing idle pose in all three.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent.
```

---

## B. La contagiata: "Vega"

La sopravvissuta dello schianto, ma **l'infezione aliena l'ha già toccata**. Metà della tuta è crepata e coperta di **cristalli verdi luminosi**, che le crescono anche su un braccio e dalla visiera rotta. Sulle spalle porta un mantello fatto con un telo termico strappato. È horror: non sai se sta guarendo o diventando una di loro.

**Silhouette:** asimmetrica. Il lato sinistro è tuta liscia, il destro ha spuntoni di cristallo e il mantello sfilacciato al vento.

```
Pixel art CHARACTER CONCEPT sheet for a top-down 3/4 view sci-fi horror roguelite set in dark alien caves around a crashed mining ship. Use the attached props only for palette and mood.

CHARACTER: "Vega", the lone survivor of the crash, already touched by the alien infection. A slim work suit, dirty white on the left half, cracked and stained on the right half. Glowing green alien crystals grow out of her right shoulder, along her right forearm and through a crack in the visor. The helmet visor is dark smoked glass with the crack glowing green, no face visible. A torn silver thermal blanket is tied around her neck as a ragged short cape. A compact blaster in the left hand, with a green crystal shard fused into the barrel. Lean, haunted, asymmetrical, memorable at a glance.
PALETTE: suit #e8eef7 #aab4c6 #6f7a8f, stains #5a5470, visor #14202a #2e3a48, crystals #4dffb0 #b8ffe0 #1f8a5a, cape #c8ccc4 #7d8799, blaster #3c4252 #7d8799, outline #0b0d14.

TRUE pixel art: each cell is exactly 48x48 pixels, upscaled 6x with crisp, square, equal-size pixels. The character is about 22 pixels wide and 40 pixels tall, feet on the same baseline 3 pixels above the bottom of every cell. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow.

LAYOUT: exactly 3 columns by 1 row of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Cell 1: front view (facing the camera). Cell 2: back view (the cape is clearly visible). Cell 3: side view facing RIGHT. Same standing idle pose in all three.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent.
```

---

## C. Lo spazzino: "Gancio"

Un **recuperatore di rottami** che si è costruito la tuta con pezzi della nave. È pratico e un po' folle. Ha un grosso **zaino-gru** con un braccio meccanico ripiegato sopra la spalla, che porta appesa una lanterna. Il casco è squadrato, da saldatore, con una fessura arancione al posto della visiera. Le piastre non combaciano tra loro e il blaster è un rivettatore.

**Silhouette:** casco squadrato e piccolo, zaino enorme che sporge in alto con il braccio-gru, gambe sottili.

```
Pixel art CHARACTER CONCEPT sheet for a top-down 3/4 view sci-fi horror roguelite set in dark alien caves around a crashed mining ship. Use the attached props only for palette and mood.

CHARACTER: "Hook", a scavenger who built his suit from salvaged ship parts. A small boxy welder-style helmet with a narrow horizontal glowing orange visor slit. Mismatched armor plates: one yellow hazard plate, one grey plate, one bare metal plate, held by straps and rivets. A huge salvage backpack with a small folded mechanical crane arm rising above the right shoulder, a little lantern hanging from its hook. Thin legs in dark work trousers, big magnetic boots. A rivet-gun blaster held at the hip, with a cyan coil. Scrappy, resourceful, a bit crazy, memorable at a glance.
PALETTE: plates #e8b030 #8a90a0 #c8ccc4 #4f5762, visor slit #ff9a3c #ffe0a0, straps and trousers #2e2a3a #4a4560, crane arm #7d8799 #3c4252, lantern #ffd34d, blaster coil #39d0ff, outline #0b0d14.

TRUE pixel art: each cell is exactly 48x48 pixels, upscaled 6x with crisp, square, equal-size pixels. The character is about 24 pixels wide and 42 pixels tall including the crane arm, feet on the same baseline 3 pixels above the bottom of every cell. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline. Flat neutral lighting, NO glow halo, NO ground shadow.

LAYOUT: exactly 3 columns by 1 row of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Cell 1: front view (facing the camera). Cell 2: back view (the crane backpack is clearly visible). Cell 3: side view facing RIGHT. Same standing idle pose in all three.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent.
```
