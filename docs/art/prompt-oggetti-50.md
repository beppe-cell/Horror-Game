# Prompt Gemini: 50 oggetti nuovi

50 oggetti in 5 fogli da 10 (5 colonne × 2 righe). Tre tipi:

- **Bonus**: solo vantaggi.
- **Patto**: un vantaggio forte e un prezzo da pagare.
- **Maledetto**: solo svantaggi. Hanno un aspetto inquietante ma non ovvio: si scopre cosa fanno solo raccogliendoli.

Più sotto ci sono anche i prompt dei pezzi che si vedono addosso a Vega. Bagliori, scintille e gocce li aggiunge il gioco.

## Come usarli

1. Usa **una chat nuova per ogni foglio**.
2. Allega il **foglio degli oggetti** (`art/raw/items/1-items.jpeg`) e il **foglio modello dell'astronauta** (`art/raw/player/01-reference.jpeg`).
3. Copia il prompt in inglese così com'è.
4. Carica in `art/raw/items/`. Il nome non importa, li rinomino io.

**Se lo sfondo esce a scacchi:** rispondi `the background must be solid flat magenta #FF00FF, not a checkerboard`.

## Gli oggetti

| # | Nome | Tipo | Effetto |
|---|---|---|---|
| 1 | Cannone sfasato | Patto | Danno ++ · Cadenza −− |
| 2 | Scarponi di piombo | Patto | Danno +, +1 cella · Velocità − |
| 3 | Iniettore di adrenalina | Patto | Velocità ++, Cadenza + · −1 cella |
| 4 | Lente incrinata | Patto | Gittata ++ · Velocità dei colpi − |
| 5 | Batteria a perdere | Patto | Cadenza +++ · Gittata −− |
| 6 | Corno d'osso | Patto | Colpi perforanti, Danno + · Cadenza − |
| 7 | Cuore ricucito | Patto | +2 celle · Velocità − |
| 8 | Moneta maledetta | Patto | +15 monete · Fortuna −− |
| 9 | Guanto scheletrico | Patto | Cadenza + · Danno − |
| 10 | Visore notturno rotto | Patto | Gittata +, colpi cercatori · Danno − |
| 11 | Nucleo instabile | Patto | Danno +++ · −2 celle |
| 12 | Proiettili di cristallo | Patto | Danno ++ · Gittata − |
| 13 | Mantello d'ombra | Patto | Velocità ++ · Gittata − |
| 14 | Valvola di sfogo | Patto | Velocità dei colpi ++ · Danno − |
| 15 | Bobina a impulsi | Patto | Due colpi alla volta · Cadenza −− |
| 16 | Prisma diviso | Patto | Tre colpi a ventaglio · Danno −− |
| 17 | Fiala di spore | Patto | Fortuna ++ · Velocità − |
| 18 | Ancora gravitazionale | Patto | Danno ++, colpi che rimbalzano · Velocità dei colpi −− |
| 19 | Occhio alieno | Patto | Colpi cercatori · Gittata − |
| 20 | Siero rosso | Patto | Danno +, Cadenza + · −1 cella |
| 21 | Guscio di resina | Patto | +2 celle di scudo · Velocità − |
| 22 | Turbina a vapore | Patto | Velocità +, Cadenza + · Fortuna − |
| 23 | Chip pirata | Patto | Fortuna +++ · Danno − |
| 24 | Pistone idraulico | Patto | Velocità dei colpi +, Danno + · Cadenza − |
| 25 | Uovo pulsante | Patto | Quando sei colpito esplode una raffica · −1 cella |
| 26 | Zaino a reazione | Patto | Velocità +++ · Danno − |
| 27 | Tubo di raffreddamento rotto | Patto | Cadenza ++ · Velocità dei colpi − |
| 28 | Kit di pronto soccorso | Bonus | +1 cella, tuta riparata |
| 29 | Mirino laser | Bonus | Gittata +, Velocità dei colpi + |
| 30 | Cristallo di quarzo | Bonus | Danno + |
| 31 | Molla a compressione | Bonus | Velocità + |
| 32 | Ventola di raffreddamento | Bonus | Cadenza + |
| 33 | Trifoglio alieno | Bonus | Fortuna ++ |
| 34 | Piastra di titanio | Bonus | +1 cella, +1 cella di scudo |
| 35 | Munizioni elastiche | Bonus | Colpi che rimbalzano, Gittata + |
| 36 | Lente a fuoco | Bonus | Danno +, Gittata + |
| 37 | Cella al plasma | Bonus | Velocità dei colpi ++ |
| 38 | Antenna radar | Bonus | Colpi cercatori |
| 39 | Ricarica d'emergenza | Bonus | +3 celle di scudo |
| 40 | Medaglione di bordo | Bonus | Fortuna +, Danno + |
| 41 | Stabilizzatore | Bonus | Cadenza +, Velocità + |
| 42 | Frammento di stella | Bonus (raro) | Tutte le statistiche + |
| 43 | Bambola di carne | Maledetto | Velocità −− |
| 44 | Specchio nero | Maledetto | Fortuna −−− |
| 45 | Catena arrugginita | Maledetto | Cadenza −− |
| 46 | Occhio cieco | Maledetto | Gittata −− |
| 47 | Cranio sussurrante | Maledetto | Danno − |
| 48 | Spina nel fianco | Maledetto | −1 cella |
| 49 | Polvere nera | Maledetto | Velocità dei colpi −− |
| 50 | Idolo dell'abisso | Maledetto | Tutte le statistiche − |

---
## Foglio 1: oggetti 1-10

```
Use the attached images as references: the item sheet (same style, size and palette for every icon) and the character (pixel size). Do not copy the items; draw new ones.
Pixel art ITEM ICON sheet for a top-down 3/4 view sci-fi horror roguelite set in alien caves around a crashed mining ship. Every item is salvaged ship technology, a strange alien relic or a piece of alien flesh. Each one instantly readable at a small size, strong silhouette, one clear accent colour.

TRUE pixel art: each cell is exactly 32x32 pixels and each item fills about 22x22 pixels in the middle of its cell, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds light and a floating bob).
VIEW: seen slightly from above (3/4 top-down), each item centered in its cell.

LAYOUT: exactly 5 columns by 2 rows of equal square cells (10 items), separated only by empty magenta space. No lines, no borders, no labels, no numbers, no text.
Row 1:
1. MISALIGNED CANNON: a bulky blaster barrel bent slightly crooked, gunmetal grey with a hot orange muzzle #ff9a3c.
2. LEAD BOOTS: a pair of heavy dull grey boots #6a7280 covered in rivets, very thick soles.
3. ADRENALINE INJECTOR: an auto-injector syringe with bright red fluid #ff4a5a and a yellow cap.
4. CRACKED LENS: a round monocle lens of pale blue glass #b8f1ff with a big crack across it, brass rim.
5. LEAKING BATTERY: a boxy suit battery #39d0ff dripping a few bright green drops of acid #4dffb0.
Row 2:
6. BONE HORN: a curved pale bone horn #e8dcc8 carved with green alien runes #4dffb0.
7. STITCHED HEART: a dark red heart #8a2a3a sewn together with black stitches, a little grey patch.
8. CURSED COIN: a large rusty coin with a glowing red skull glyph #ff4a5a.
9. SKELETAL GLOVE: a robotic glove with exposed metal finger bones #c8ccc4 and orange joints #ff9a3c.
10. BROKEN NIGHT VISOR: cracked goggles with two green lenses #4dffb0, one lens shattered.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Foglio 2: oggetti 11-20

```
Use the attached images as references: the item sheet (same style, size and palette for every icon) and the character (pixel size). Do not copy the items; draw new ones.
Pixel art ITEM ICON sheet for a top-down 3/4 view sci-fi horror roguelite set in alien caves around a crashed mining ship. Every item is salvaged ship technology, a strange alien relic or a piece of alien flesh. Each one instantly readable at a small size, strong silhouette, one clear accent colour.

TRUE pixel art: each cell is exactly 32x32 pixels and each item fills about 22x22 pixels in the middle of its cell, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds light and a floating bob).
VIEW: seen slightly from above (3/4 top-down), each item centered in its cell.

LAYOUT: exactly 5 columns by 2 rows of equal square cells (10 items), separated only by empty magenta space. No lines, no borders, no labels, no numbers, no text.
Row 1:
1. UNSTABLE CORE: a metal sphere cracked open, white-hot energy #fff0b0 leaking out of the cracks.
2. CRYSTAL ROUNDS: three sharp cyan crystal bullets #5af0ff side by side.
3. SHADOW CLOAK: a folded dark cloak #2a2440 with violet edges #a070ff, wisps of shadow.
4. RELEASE VALVE: a red valve wheel #ff4a5a on a short pipe with a puff of white steam.
5. PULSE COIL: a copper coil #c8864a wrapped around a rod with two small cyan sparks #39d0ff.
Row 2:
6. SPLIT PRISM: a triangular glass prism split in three pieces, each casting a coloured edge (red, green, blue).
7. SPORE VIAL: a small glass vial full of glowing yellow-green spores #d8e04a, cork stopper.
8. GRAVITY ANCHOR: a small heavy ship anchor of dark metal #3a4458 with a violet glowing ring #a070ff.
9. ALIEN EYE: a single wet alien eye with a slit pupil, yellow iris #ffd34d, red veins.
10. RED SERUM: a fat ampoule of thick dark red serum #8a1a28 with a warning label stripe.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Foglio 3: oggetti 21-30

```
Use the attached images as references: the item sheet (same style, size and palette for every icon) and the character (pixel size). Do not copy the items; draw new ones.
Pixel art ITEM ICON sheet for a top-down 3/4 view sci-fi horror roguelite set in alien caves around a crashed mining ship. Every item is salvaged ship technology, a strange alien relic or a piece of alien flesh. Each one instantly readable at a small size, strong silhouette, one clear accent colour.

TRUE pixel art: each cell is exactly 32x32 pixels and each item fills about 22x22 pixels in the middle of its cell, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds light and a floating bob).
VIEW: seen slightly from above (3/4 top-down), each item centered in its cell.

LAYOUT: exactly 5 columns by 2 rows of equal square cells (10 items), separated only by empty magenta space. No lines, no borders, no labels, no numbers, no text.
Row 1:
1. RESIN SHELL: a round shield-shaped chunk of amber resin #c8a050 with a dark insect trapped inside.
2. STEAM TURBINE: a small brass turbine #c8a050 with spinning blades and a puff of steam.
3. PIRATE CHIP: a black circuit chip with a white skull and crossbones printed on it.
4. HYDRAULIC PISTON: a chrome piston #c8ccc4 with a yellow-black warning band.
5. PULSING EGG: an alien egg #a85a78 with glowing orange cracks #ff9a3c, about to burst.
Row 2:
6. JET PACK: a compact backpack with two exhaust nozzles and blue flames #39d0ff.
7. BROKEN COOLANT PIPE: a bent pipe snapped in two, frost and ice crystals #b8f1ff at the break.
8. FIRST AID KIT: a white box #e8eef7 with a red cross #ff4a5a and a handle.
9. LASER SIGHT: a small rifle sight shooting a thin red dot line #ff4a5a.
10. QUARTZ CRYSTAL: a clear pointed quartz crystal #e8f8ff with a pink core #ff9ad8.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Foglio 4: oggetti 31-40

```
Use the attached images as references: the item sheet (same style, size and palette for every icon) and the character (pixel size). Do not copy the items; draw new ones.
Pixel art ITEM ICON sheet for a top-down 3/4 view sci-fi horror roguelite set in alien caves around a crashed mining ship. Every item is salvaged ship technology, a strange alien relic or a piece of alien flesh. Each one instantly readable at a small size, strong silhouette, one clear accent colour.

TRUE pixel art: each cell is exactly 32x32 pixels and each item fills about 22x22 pixels in the middle of its cell, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds light and a floating bob).
VIEW: seen slightly from above (3/4 top-down), each item centered in its cell.

LAYOUT: exactly 5 columns by 2 rows of equal square cells (10 items), separated only by empty magenta space. No lines, no borders, no labels, no numbers, no text.
Row 1:
1. COMPRESSION SPRING: a big shiny steel spring #c8ccc4 with green end caps #4dffb0.
2. COOLING FAN: a small square computer fan with pale blue blades #b8f1ff.
3. ALIEN CLOVER: a four-leaf alien plant with glowing teal leaves #7cf7d4.
4. TITANIUM PLATE: a curved armour plate #a8b0c0 with four bolts and a cyan stripe #39d0ff.
5. ELASTIC ROUNDS: a box of rubbery bouncing bullets, bright orange #ff9a3c.
Row 2:
6. FOCUS LENS: a thick round magnifying lens with a gold rim #ffd34d and a bright white spot.
7. PLASMA CELL: a glass cylinder full of bright cyan plasma #39d0ff, metal caps.
8. RADAR ANTENNA: a small satellite dish with a blinking red tip #ff4a5a.
9. EMERGENCY RECHARGE: a hexagonal power pack with three blue bars #39d0ff and a lightning symbol.
10. SHIP MEDALLION: a round gold medal #ffd34d on a short blue ribbon, with a ship engraved.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Foglio 5: oggetti 41-50

```
Use the attached images as references: the item sheet (same style, size and palette for every icon) and the character (pixel size). Do not copy the items; draw new ones.
Pixel art ITEM ICON sheet for a top-down 3/4 view sci-fi horror roguelite set in alien caves around a crashed mining ship. Every item is salvaged ship technology, a strange alien relic or a piece of alien flesh. Each one instantly readable at a small size, strong silhouette, one clear accent colour.

TRUE pixel art: each cell is exactly 32x32 pixels and each item fills about 22x22 pixels in the middle of its cell, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14. Flat neutral lighting, NO glow halo, NO ground shadow (the game adds light and a floating bob).
VIEW: seen slightly from above (3/4 top-down), each item centered in its cell.

LAYOUT: exactly 5 columns by 2 rows of equal square cells (10 items), separated only by empty magenta space. No lines, no borders, no labels, no numbers, no text.
Row 1:
1. STABILIZER: a gyroscope with two rings around a glowing green centre #4dffb0.
2. STAR FRAGMENT: a rare jagged piece of a fallen star, white-gold #fff0b0 with tiny sparkles, a thin gold rim.
3. FLESH DOLL: a small doll made of stitched grey flesh with button eyes, unsettling.
4. BLACK MIRROR: a small hand mirror with a pitch-black glass #0b0d14 and a cracked dark frame.
5. RUSTY CHAIN: a coiled length of heavy rusty chain #8a4a2a with a broken shackle.
Row 2:
6. BLIND EYE: a milky white eye #e8e0d8 with no pupil, on a tiny stalk.
7. WHISPERING SKULL: a small alien skull #e8dcc8 with faint violet wisps #a070ff coming from the mouth.
8. THORN: a long black thorn #2a1a22 with a drop of dark blood #8a1a28 at the tip.
9. BLACK DUST: a small cloth pouch spilling heavy black dust #1a1e2a with grey glints.
10. ABYSS IDOL: a small squat stone idol #2a3040 with one glowing dark red eye #8a1a28.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

---

# Pezzi addosso all'astronauta

Ogni oggetto raccolto si vede anche su Vega. Due tipi di fogli:

- **Pezzi fermi** (zaino, petto, casco, spalle, cintura, collo, pistola, braccio): 3 viste (davanti, di spalle, di lato), 4 oggetti per foglio. I pezzi sulla **pistola** e sul **braccio** li aggancio io alla pistola fotogramma per fotogramma, così seguono la camminata e lo sparo.
- **Pezzi animati sulle gambe** (stivali, molle, protesi): un foglio per oggetto con tutti i 6 passi della camminata nelle 3 direzioni, così si muovono con le gambe. Ci sono anche le **protesi** e gli **stivali gravitazionali** che erano già nel gioco, ora animati.

**Come usarli:** una chat nuova per foglio. Per i pezzi fermi allega il foglio modello (`art/raw/player/01-reference.jpeg`). Per i pezzi animati allega la camminata (`art/raw/player/03-walk.jpeg`). Carica tutto in `art/raw/items/`, il nome non importa.

## Pezzi fermi 1 (oggetti 1, 3, 4, 5)

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. MISALIGNED CANNON: an oversized crooked gunmetal barrel with a hot orange muzzle #ff9a3c mounted on her blaster, longer than the blaster itself.
Row 2. ADRENALINE INJECTOR: a small auto-injector strapped to her right forearm, a tube of bright red fluid #ff4a5a running into the suit.
Row 3. CRACKED LENS: a brass-rimmed monocle with cracked pale blue glass #b8f1ff clipped over the right side of her visor.
Row 4. LEAKING BATTERY: a boxy cyan battery #39d0ff strapped on her lower back, two green acid drops #4dffb0 dripping from it.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Pezzi fermi 2 (oggetti 6, 7, 8, 9)

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. BONE HORN: a curved pale bone horn #e8dcc8 with green runes #4dffb0 worn as a pauldron on her right shoulder, pointing up and back.
Row 2. STITCHED HEART: a dark red stitched heart #8a2a3a strapped in a small cage on the left of her chest.
Row 3. CURSED COIN: a rusty coin with a red skull glyph #ff4a5a hanging on a cord around her neck.
Row 4. SKELETAL GLOVE: a robotic glove of bare metal finger bones #c8ccc4 with orange joints #ff9a3c over the hand holding the blaster.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Pezzi fermi 3 (oggetti 10, 11, 12, 13)

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. BROKEN NIGHT VISOR: cracked goggles with two green lenses #4dffb0 pushed up on the front of her helmet, one lens shattered.
Row 2. UNSTABLE CORE: a cracked metal sphere embedded in the middle of her chest, white-hot light #fff0b0 leaking from the cracks.
Row 3. CRYSTAL ROUNDS: a small ammo pouch on her right hip with three cyan crystal bullets #5af0ff sticking out.
Row 4. SHADOW CLOAK: a dark cloak #2a2440 with violet edges #a070ff over her shoulders, longer than her own cape, ragged hem.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Pezzi fermi 4 (oggetti 14, 15, 16, 17)

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. RELEASE VALVE: a red valve wheel #ff4a5a on a short pipe sticking out of her left shoulder, a puff of white steam.
Row 2. PULSE COIL: a copper coil #c8864a wrapped around the barrel of her blaster with two cyan sparks #39d0ff.
Row 3. SPLIT PRISM: a small three-piece glass prism fixed at the tip of her blaster, red, green and blue edges.
Row 4. SPORE VIAL: a glass vial of glowing yellow-green spores #d8e04a clipped to her left hip.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Pezzi fermi 5 (oggetti 18, 19, 20, 21)

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. GRAVITY ANCHOR: a small dark metal anchor #3a4458 with a violet ring #a070ff hanging on a short chain from her lower back.
Row 2. ALIEN EYE: a wet alien eye with a yellow slit iris #ffd34d growing out of the suit on her left shoulder, red veins around it.
Row 3. RED SERUM: two thin tubes of dark red serum #8a1a28 running from a small ampoule on her collar into the neck of the suit.
Row 4. RESIN SHELL: a round plate of amber resin #c8a050 with a dark insect inside, strapped on her back like a shield.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Pezzi fermi 6 (oggetti 22, 23, 24, 25)

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. STEAM TURBINE: a small brass turbine #c8a050 mounted on her upper back, blades visible, a puff of steam.
Row 2. PIRATE CHIP: a black chip with a white skull plugged into the left side of her helmet.
Row 3. HYDRAULIC PISTON: a chrome piston #c8ccc4 with a yellow-black band along her right forearm, from elbow to wrist.
Row 4. PULSING EGG: a small alien egg #a85a78 with glowing orange cracks #ff9a3c stuck to her left hip with resin.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Pezzi fermi 7 (oggetti 26, 27, 28, 29)

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. JET PACK: a compact jet pack on her back with two exhaust nozzles pointing down and small blue flames #39d0ff.
Row 2. BROKEN COOLANT PIPE: a bent pipe running from her back over her right shoulder, broken at the end with frost #b8f1ff.
Row 3. FIRST AID KIT: a small white box with a red cross #ff4a5a clipped to her right hip.
Row 4. LASER SIGHT: a small sight mounted on top of her blaster with a thin red dot line #ff4a5a pointing forward.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Pezzi fermi 8 (oggetti 30, 32, 33, 34)

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. QUARTZ CRYSTAL: a clear quartz crystal with a pink core #ff9ad8 set in a metal mount on the left of her chest.
Row 2. COOLING FAN: a small square fan with pale blue blades #b8f1ff mounted on her lower back.
Row 3. ALIEN CLOVER: a small four-leaf alien plant with glowing teal leaves #7cf7d4 sprouting from her left shoulder.
Row 4. TITANIUM PLATE: curved silver armour plates #a8b0c0 with a cyan stripe #39d0ff over her chest and stomach (and back from behind).

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Pezzi fermi 9 (oggetti 35, 36, 37, 38)

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. ELASTIC ROUNDS: a bandolier of bright orange rubbery bullets #ff9a3c across her chest from the right shoulder to the left hip.
Row 2. FOCUS LENS: a thick round lens with a gold rim #ffd34d fixed in front of her blaster muzzle.
Row 3. PLASMA CELL: a glass cylinder of bright cyan plasma #39d0ff mounted upright on her back, poking above the shoulder.
Row 4. RADAR ANTENNA: a tall thin antenna with a small dish and a red tip #ff4a5a rising from her back above the helmet.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Pezzi fermi 10 (oggetti 39, 40, 41, 42)

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. EMERGENCY RECHARGE: a hexagonal power pack with three blue bars #39d0ff on her lower back.
Row 2. SHIP MEDALLION: a round gold medal #ffd34d on a short blue ribbon pinned on her chest.
Row 3. STABILIZER: a small gyroscope with two rings and a green centre #4dffb0 clipped to her left hip.
Row 4. STAR FRAGMENT: a jagged white-gold star fragment #fff0b0 floating just above her helmet like a small crown.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Pezzi fermi 11 (oggetti 43, 44, 45, 46)

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. FLESH DOLL: a small stitched grey flesh doll with button eyes hanging from her belt on the right hip.
Row 2. BLACK MIRROR: a small hand mirror with pitch-black glass strapped on the left of her chest.
Row 3. RUSTY CHAIN: a heavy rusty chain #8a4a2a wrapped twice around her waist, a broken shackle hanging.
Row 4. BLIND EYE: a milky white eye #e8e0d8 on a short stalk growing from the top of her helmet.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Pezzi fermi 12 (oggetti 47, 48, 49, 50)

```
Use the attached image as the exact character reference: the infected astronaut "Vega" (helmet, suit, cape and blaster), her size, pixel size and poses.
Pixel art OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on piece of equipment that Vega wears, drawn exactly where it sits on her body in the reference pose, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: each cell is exactly 32x32 pixels, the same cell size and the same pixel size as the attached character sheet, upscaled 8x with crisp, square, equal-size pixels. Vega's boot soles would be on the baseline 2 pixels above the bottom of each cell, centered. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 3 columns by 4 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels, no text.
Column 1: front view (Vega facing the camera). Column 2: back view (Vega facing away). Column 3: side view (Vega facing RIGHT). Each row is one add-on, the same object seen from the three sides.

ROWS:
Row 1. WHISPERING SKULL: a small alien skull #e8dcc8 tied to her right shoulder with violet wisps #a070ff from its mouth.
Row 2. THORN: a long black thorn #2a1a22 piercing through her left forearm, a drop of dark blood #8a1a28.
Row 3. BLACK DUST: a small cloth pouch spilling black dust #1a1e2a tied to her belt on the left hip.
Row 4. ABYSS IDOL: a small squat stone idol #2a3040 with a red eye #8a1a28 hanging on a chain around her neck.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Pezzi animati 1: Lead Boots (oggetto 2)

```
Use the attached image as the exact animation reference: the WALK sprite sheet of the infected astronaut "Vega", 6 frames per row; row 1 walking towards the camera, row 2 walking away, row 3 walking to the RIGHT.
Pixel art ANIMATED OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on that Vega wears on her legs, drawn exactly where her legs and feet are in the SAME cell of the reference walk sheet, so it moves with every step, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: the same grid, cell size and pixel size as the attached walk sheet, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, matching the reference walk sheet frame by frame, separated only by empty magenta space. No lines, no borders, no labels, no text.
Row 1: walking towards the camera, frames 1-6. Row 2: walking away, frames 1-6. Row 3: walking to the RIGHT, frames 1-6.

ADD-ON:
LEAD BOOTS: heavy dull grey boots #6a7280 with rivets and very thick soles, worn over her boots.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Pezzi animati 2: Compression Spring (oggetto 31)

```
Use the attached image as the exact animation reference: the WALK sprite sheet of the infected astronaut "Vega", 6 frames per row; row 1 walking towards the camera, row 2 walking away, row 3 walking to the RIGHT.
Pixel art ANIMATED OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on that Vega wears on her legs, drawn exactly where her legs and feet are in the SAME cell of the reference walk sheet, so it moves with every step, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: the same grid, cell size and pixel size as the attached walk sheet, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, matching the reference walk sheet frame by frame, separated only by empty magenta space. No lines, no borders, no labels, no text.
Row 1: walking towards the camera, frames 1-6. Row 2: walking away, frames 1-6. Row 3: walking to the RIGHT, frames 1-6.

ADD-ON:
COMPRESSION SPRING: big shiny steel springs #c8ccc4 with green caps #4dffb0 under the heels of both boots.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Pezzi animati 3: Leg Servos (oggetto già nel gioco)

```
Use the attached image as the exact animation reference: the WALK sprite sheet of the infected astronaut "Vega", 6 frames per row; row 1 walking towards the camera, row 2 walking away, row 3 walking to the RIGHT.
Pixel art ANIMATED OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on that Vega wears on her legs, drawn exactly where her legs and feet are in the SAME cell of the reference walk sheet, so it moves with every step, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: the same grid, cell size and pixel size as the attached walk sheet, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, matching the reference walk sheet frame by frame, separated only by empty magenta space. No lines, no borders, no labels, no text.
Row 1: walking towards the camera, frames 1-6. Row 2: walking away, frames 1-6. Row 3: walking to the RIGHT, frames 1-6.

ADD-ON:
LEG SERVOS: off-white mechanical braces with orange joints #ff9a3c on both knees.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```

## Pezzi animati 4: Gravity Boots (oggetto già nel gioco)

```
Use the attached image as the exact animation reference: the WALK sprite sheet of the infected astronaut "Vega", 6 frames per row; row 1 walking towards the camera, row 2 walking away, row 3 walking to the RIGHT.
Pixel art ANIMATED OVERLAY sheet for a top-down 3/4 view sci-fi horror roguelite. Each cell shows ONLY an add-on that Vega wears on her legs, drawn exactly where her legs and feet are in the SAME cell of the reference walk sheet, so it moves with every step, as if Vega were invisible. Do NOT draw Vega herself: no helmet, no suit, no body, only the add-on.

TRUE pixel art: the same grid, cell size and pixel size as the attached walk sheet, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. Light from the top-left. 1-pixel dark outline #0b0d14 around each piece. NO glow halo, NO shadow.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, matching the reference walk sheet frame by frame, separated only by empty magenta space. No lines, no borders, no labels, no text.
Row 1: walking towards the camera, frames 1-6. Row 2: walking away, frames 1-6. Row 3: walking to the RIGHT, frames 1-6.

ADD-ON:
GRAVITY BOOTS: chunky boots with violet glowing soles #a070ff worn over her boots.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text.
```
