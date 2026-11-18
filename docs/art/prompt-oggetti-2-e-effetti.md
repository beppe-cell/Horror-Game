# Prompt Gemini: 16 oggetti nuovi e i pezzi che si vedono addosso a Vega

Due tipi di fogli:

1. **Icone dei 16 oggetti nuovi:** quelle che fluttuano sul piedistallo e compaiono nell'elenco in alto a destra.
2. **Pezzi addosso:** per ogni oggetto, il pezzo che Vega porta su di sé quando lo raccoglie, in **3 viste** (davanti, di spalle, di lato verso destra). Il gioco sceglie la vista in base a dove guarda Vega e sovrappone tutti i pezzi raccolti al suo sprite. Così gli oggetti si sommano senza dover generare una Vega diversa per ogni combinazione. Gli effetti di luce (alone, scintille, scia, sfere che orbitano) li aggiunge già il gioco.

## Come usarli

1. Usa **una chat nuova per ogni foglio**.
2. Allega sempre il **foglio modello di Vega** (`art/raw/player/01-reference.jpeg`). Per le icone allega anche il **primo foglio di oggetti** (`art/raw/items/1-items.jpeg`), così lo stile resta uguale.
3. Copia il prompt in inglese così com'è.
4. Carica in `art/raw/items/` con questi nomi:

| Foglio | Nome file |
|---|---|
| Icone dei 16 oggetti nuovi | `2-items.png` |
| Pezzi addosso, oggetti 1-4 | `overlay-1.png` |
| Pezzi addosso, oggetti 5-8 | `overlay-2.png` |
| Pezzi addosso, oggetti 9-12 | `overlay-3.png` |
| Pezzi addosso, oggetti 13-16 | `overlay-4.png` |
| Pezzi addosso, oggetti 17-20 | `overlay-5.png` |
| Pezzi addosso, oggetti 21-24 | `overlay-6.png` |
| Pezzi addosso, oggetti 25-26 | `overlay-7.png` |

---

## 1. Icone dei 16 oggetti nuovi (4×4)

```
Use the attached images as references: the item sheet (same style, size and palette for every icon) and the character (pixel size). Do not copy the items; draw new ones.
Pixel art ITEM ICON sheet for a top-down 3/4 view sci-fi horror roguelite. Every item is salvaged technology from a crashed mining ship or a fragment of an alien creature. Each one instantly readable at a small size, strong silhouette, one clear accent colour.

TRUE pixel art: each cell is exactly 32x32 pixels and each item fills about 22x22 pixels in the middle of its cell, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14. Flat neutral lighting, NO glow halo, NO ground shadow.

LAYOUT: exactly 4 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Row 1:
1. TWIN EMITTER: a blaster attachment with two parallel short barrels, grey metal with cyan tips #39d0ff.
2. SEEKER CHIP: a small circuit chip with a red targeting crosshair glowing on it #ff4a5a.
3. OVERCLOCK: a cracked processor with orange heat lines #ff9a3c and a tiny wisp of smoke.
4. NANO-REPAIR: a small canister of green glowing nanobots #4dffb0 with a white cross.
Row 2:
5. GRAVITY BOOTS: a pair of chunky boots with violet glowing soles #a070ff.
6. VEGA'S DOG TAG: a worn metal military tag on a broken chain, engraved, pale grey #c8ccc4.
7. LONG-RANGE SCOPE: a rifle scope with a red lens #ff4a5a.
8. ALIEN HEART: a dark red pulsing alien organ #8a2a3a with grey-violet veins.
Row 3:
9. BATTERY PACK: a boxy suit battery with a cyan charge bar #39d0ff.
10. REACTIVE ARMOR: an armor plate covered in small orange explosive studs #ff9a3c.
11. COOLANT TANK: a frosty pale blue canister #b8f1ff with ice crystals.
12. SPORE LENS: a round lens made of a yellow-green spore membrane #d8e04a.
Row 4 (rare boss items: make them look precious, with a thin gold rim #ffd34d):
13. BROOD HEART: the Brood Mother's glowing yellow-green egg heart #d8e04a, wet and pulsing.
14. TRI-EMITTER: a blaster attachment with three barrels in a fan, teal #7cf7d4.
15. QUEEN CARAPACE: a piece of the Brood Mother's grey-violet chitin shell #7e7896 #a9a3bf.
16. PLASMA OVERDRIVE: an overloaded plasma core, white-hot cyan #b8f1ff with crackling arcs.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

---

## 2. Pezzi addosso (un foglio ogni 4 oggetti)

Ogni foglio ha **4 righe**, una per oggetto, e **3 colonne**: davanti, di spalle e di lato verso destra. In ogni cella va disegnato **solo il pezzo, senza Vega**, nella posizione esatta in cui starebbe sul suo corpo nel foglio modello. Così il gioco lo appoggia sullo sprite senza spostarlo.

Ogni prompt qui sotto è **già completo**: copialo tutto, così com'è, in una chat nuova insieme al foglio modello di Vega.

### overlay-1.png

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. PLASMA CORE: a small cylindrical cyan reactor core #39d0ff in a metal cage, strapped on her upper back (visible over the shoulder from the front, fully from the back).
Row 2. RAPID CAPACITOR: copper coils with a yellow lightning mark #ffd34d wrapped around her blaster.
Row 3. EXTENDED BARREL: a long finned barrel extension on the tip of her blaster, teal tip #7cf7d4.
Row 4. LEG SERVOS: off-white mechanical braces with orange joints #ff9a3c on both knees.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

### overlay-2.png

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. PARTICLE ACCELERATOR: a small green-glowing ring #4dffb0 clipped to her belt on the hip.
Row 2. CAPTAIN'S COIN: an old golden coin #ffd34d hanging on a thin chain around her neck, on the chest.
Row 3. ARMOR PLATE: a thick off-white chest plate with an orange hazard stripe #ff9a3c over the suit's chest (and a matching back plate seen from behind).
Row 4. SHIELD GENERATOR: a disc-shaped device with a pale blue dome #b8f1ff mounted on her left shoulder.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

### overlay-3.png

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. REFLECTING PRISM: a small triangular violet glass prism #a070ff set into the top of her helmet.
Row 2. ALIEN CRYSTAL SHARD: a long green crystal spike #4dffb0 growing out of her right shoulder.
Row 3. TWIN EMITTER: a second short barrel mounted beside her blaster's barrel, cyan tips #39d0ff.
Row 4. SEEKER CHIP: a small red targeting lens #ff4a5a over the right side of her visor.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

### overlay-4.png

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. OVERCLOCK: a cracked orange-hot processor #ff9a3c bolted to the side of her blaster, with a wisp of smoke.
Row 2. NANO-REPAIR: a small green nanobot canister #4dffb0 on her belt at the back.
Row 3. GRAVITY BOOTS: violet glowing soles and ankle rings #a070ff over her boots.
Row 4. VEGA'S DOG TAG: a pale grey metal tag #c8ccc4 on a chain around her neck.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

### overlay-5.png

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. LONG-RANGE SCOPE: a rifle scope with a red lens #ff4a5a on top of her blaster.
Row 2. ALIEN HEART: a dark red alien organ #8a2a3a fused to the left side of her chest, with grey-violet veins spreading.
Row 3. BATTERY PACK: a boxy battery with a cyan charge bar #39d0ff on her lower back.
Row 4. REACTIVE ARMOR: small orange explosive studs #ff9a3c covering her shoulders and forearms.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

### overlay-6.png

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. COOLANT TANK: a frosty pale blue tank #b8f1ff on her back with a hose to the blaster.
Row 2. SPORE LENS: a round yellow-green spore membrane lens #d8e04a over the left side of her visor.
Row 3. BROOD HEART: the Brood Mother's glowing yellow-green egg heart #d8e04a embedded in the center of her chest, thin gold rim #ffd34d.
Row 4. TRI-EMITTER: three short barrels in a fan on the tip of her blaster, teal #7cf7d4.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

### overlay-7.png

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 2 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. QUEEN CARAPACE: grey-violet chitin plates #7e7896 #a9a3bf from the Brood Mother fused over her shoulders and back like armor.
Row 2. PLASMA OVERDRIVE: a white-hot cyan plasma ring #b8f1ff with small arcs around her blaster arm.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Se Gemini non collabora

- **Disegna anche Vega:** aggiungi `ONLY the add-on, Vega herself is invisible. Empty magenta where her body would be.`
- **Pezzo nel posto sbagliato:** aggiungi `Place each add-on exactly where it sits on the attached reference pose, same position in the cell.`
- **Griglia sbagliata:** aggiungi `The grid MUST be exactly 3 columns and 4 rows.`
