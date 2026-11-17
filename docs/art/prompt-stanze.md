# Prompt Gemini: estetica delle stanze

Due generazioni per ognuno dei 5 piani: **tile** (pavimento, muri, porte) e **oggetti** (ostacoli e decorazioni). Sono 10 immagini in tutto. Ogni immagine è una griglia **6×3** di celle da 32×32 pixel, la stessa dei fogli dell'astronauta, così lo stesso script di pulizia funziona anche qui.

## Come usarli

1. Usa **una chat nuova per ogni piano**: le due immagini dello stesso piano devono condividere palette e materiali.
2. **Prima genera il foglio dei tile.** Poi genera il foglio degli oggetti **allegando quello dei tile** come riferimento di stile.
3. In ogni chat **allega anche il foglio modello dell'astronauta** (`art/raw/player/01-reference.jpeg`): serve a mantenere la stessa dimensione dei pixel e lo stesso stile.
4. Copia i prompt in inglese così come sono.
5. **Carica in PNG**, non JPEG: con il JPEG i bordi dei tile si sporcano e i tile si vedono di più quando si ripetono.
6. Metti i file su GitHub in `art/raw/rooms/` con questi nomi:

| Piano | Tile | Oggetti |
|---|---|---|
| 1. Sito dello schianto | `1-crash-tiles.png` | `1-crash-props.png` |
| 2. Alveare | `2-hive-tiles.png` | `2-hive-props.png` |
| 3. Grotte di cristallo | `3-crystal-tiles.png` | `3-crystal-props.png` |
| 4. Laboratorio allagato | `4-lab-tiles.png` | `4-lab-props.png` |
| 5. Nucleo | `5-core-tiles.png` | `5-core-props.png` |

**Perché le stanze sembrano scure di proposito:** il gioco aggiunge da solo luci dinamiche, ombre, acqua e nebbia. I tile vanno disegnati **con luce piatta e neutra**, senza ombre portate né bagliori: altrimenti le luci del gioco si sommano a quelle disegnate e tutto diventa confuso. Le parti luminose (cristalli, spie, glifi) vanno disegnate in colori pieni e saturi: il gioco le fa brillare con il bloom.

---

## Layout dei fogli (uguale per tutti i piani)

**Foglio tile:**

| Riga | Colonne 1-6 |
|---|---|
| 1 | 6 varianti di **pavimento**, tutte ripetibili senza cuciture visibili |
| 2 | **Muro:** cresta superiore, faccia frontale, faccia con crepa, angolo interno, angolo esterno, base del muro dove tocca il pavimento |
| 3 | **Porta** chiusa, **porta** aperta, 2 **decalcomanie** per il pavimento (crepa, macchia), **bordo** pavimento-acqua, pavimento **rotto** con fondo buio |

**Foglio oggetti:** 6 colonne per 3 righe di oggetti singoli. Ognuno è centrato nella sua cella con la base sulla stessa linea, come l'astronauta. Il contenuto di ogni riga è descritto nel prompt del piano.

---

## Blocco di stile comune (già incluso in ogni prompt)

- pixel art vera, 32×32 per cella, ingrandita 8 volte con pixel quadrati e netti;
- vista dall'alto a 3/4, coerente con l'astronauta allegato;
- **luce piatta e neutra**, nessuna ombra portata, nessun bagliore;
- contorno scuro `#0b0d14` solo sugli oggetti, mai sui tile del pavimento;
- sfondo magenta pieno `#FF00FF`, senza griglia, testo o cornici.

---

## Piano 1: sito dello schianto e caverne superficiali

Roccia scura blu-grigia, rottami della nave mineraria, sabbia scura, i primi cristalli verdi. Freddo, polveroso, abbandonato da poco.

### Tile

```
Pixel art TILESET for a top-down 3/4 view sci-fi roguelite, matching the pixel size and style of the attached astronaut reference.
SETTING: shallow alien caves around a crashed mining ship. Cold, dusty, recently abandoned. Dark blue-grey rock, dark sand, scattered metal debris.
TRUE pixel art: each cell is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients, flat color shading with 3-4 tones per material.
LIGHTING: flat, neutral, even lighting. NO cast shadows, NO glow, NO light sources drawn: the game adds dynamic lights later. Keep everything fairly dark and desaturated.
PALETTE: rock #151a26 #1c2232 #262d40 #3a4560; sand #2a2622 #3b342c; metal debris #4f5762 #7d8799; rare accents: hazard orange #ff9a3c, crystal green #4dffb0.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels.
Row 1: six FLOOR tiles, each SEAMLESSLY TILEABLE on all four edges: plain rock slab; rock slab with a hairline crack; dark sand over rock; rock with small pebbles; rock with a buried twisted metal shard; rock with a tiny green crystal sprout.
Row 2: six WALL tiles of rough cave rock seen from a 3/4 top-down view: wall top crest (the upper edge of the wall), wall front face, wall front face with a deep crack and a bent metal strut stuck in it, inner corner, outer corner, wall base where the rock meets the floor.
Row 3: DOOR closed (a heavy rusted ship bulkhead hatch set into the rock, with an orange hazard stripe), DOOR open (the same hatch slid aside, dark passage behind), floor decal: scorch mark, floor decal: oil stain, floor-to-water edge tile (rock sloping into dark shallow water on the bottom half), broken floor tile with a dark pit.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text, no numbers, no grid lines.
```

### Oggetti

```
Use the attached tileset as the style and palette reference, and the attached astronaut for scale. Same pixel size, same flat neutral lighting.
Pixel art PROPS sheet for the first floor of a top-down 3/4 view sci-fi roguelite: shallow caves around a crashed mining ship.
TRUE pixel art: each cell is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. 1-pixel dark outline #0b0d14 around every object. Flat neutral lighting, NO cast shadow on the ground (the game draws shadows).
Each object is centered in its cell and stands on the same baseline 2 pixels above the bottom of the cell.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space.
Row 1 (OBSTACLES, about 28x26 pixels, they block movement): round cave boulder; jagged rock; boulder half buried in sand; chunk of ship hull plating with rivets; crushed cargo crate with an orange stripe; tangle of broken pipes.
Row 2 (SMALL DECOR, about 12-20 pixels, walkable): pebbles; dry alien weed tuft; spilled bolts and screws; a cracked helmet visor lying on the ground; a small green crystal cluster (bright saturated #4dffb0, it will glow in game); a sputtering red emergency flare stick.
Row 3 (LARGE DECOR, up to 32x32): ship engine fragment; snapped antenna mast; supply barrel tipped over; stack of two crates; a big green crystal cluster (bright saturated, it will glow); a small burnt-out escape pod hatch.

BACKGROUND: one solid flat magenta #FF00FF everywhere. No ground shadows, no text, no labels.
```

---

## Piano 2: alveare organico

Pareti di resina e chitina, pavimento membranoso, sacche di uova, filamenti. Viola-marrone scuro con accenti giallo-acido. Disgustoso e vivo.

### Tile

```
Pixel art TILESET for a top-down 3/4 view sci-fi roguelite, matching the pixel size and style of the attached astronaut reference.
SETTING: an organic alien HIVE grown inside the caves. Walls of hardened resin and chitin plates, a membranous floor with veins, sticky strands. Disgusting and alive, dark and wet.
TRUE pixel art: each cell is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients, flat color shading with 3-4 tones per material.
LIGHTING: flat, neutral, even lighting. NO cast shadows, NO glow drawn: the game adds dynamic lights later. Keep everything dark.
PALETTE: membrane #1e1420 #2c1d2e #3d2a3f; chitin #2a2420 #45392f #6b5a48; veins #5a2a3a; acid accents #d8e04a #a0b030 (small, bright, they will glow).

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels.
Row 1: six FLOOR tiles, each SEAMLESSLY TILEABLE on all four edges: plain membrane with faint veins; membrane with a thick vein; membrane with small bumps; dried resin crust; membrane with a sticky puddle; membrane with three tiny acid-yellow pores.
Row 2: six WALL tiles of chitin and resin seen from a 3/4 top-down view: wall top crest (curved chitin ridge), wall front face (overlapping chitin plates), front face with a cracked plate oozing resin, inner corner, outer corner, wall base where resin meets the membrane floor.
Row 3: DOOR closed (an organic sphincter of chitin plates, shut), DOOR open (the plates pulled back, dark tunnel), floor decal: resin splatter, floor decal: claw marks, floor-to-water edge tile (membrane dipping into murky liquid on the bottom half), broken floor tile with a dark hole.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text, no numbers, no grid lines.
```

### Oggetti

```
Use the attached tileset as the style and palette reference, and the attached astronaut for scale. Same pixel size, same flat neutral lighting.
Pixel art PROPS sheet for the second floor of a top-down 3/4 view sci-fi roguelite: an organic alien hive.
TRUE pixel art: each cell is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. 1-pixel dark outline #0b0d14 around every object. Flat neutral lighting, NO cast shadow on the ground.
Each object is centered in its cell and stands on the same baseline 2 pixels above the bottom of the cell.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space.
Row 1 (OBSTACLES, about 28x26 pixels, they block movement): cluster of three egg sacs; hard resin mound; chitin spike growth; fleshy pod split open (empty); calcified alien carcass; a pillar of fused resin.
Row 2 (SMALL DECOR, about 12-20 pixels, walkable): single small egg; sticky strands across the floor; a shed chitin shell fragment; tiny wriggling larva; acid-yellow glowing pustule (bright, it will glow); a torn piece of a human suit stuck in resin.
Row 3 (LARGE DECOR, up to 32x32): big egg cluster with a faint yellow glow inside; resin cocoon with a vague humanoid shape; hanging fleshy curtain; skeletal alien ribcage; nest of woven fibers; large acid-yellow glowing bulb.

BACKGROUND: one solid flat magenta #FF00FF everywhere. No ground shadows, no text, no labels.
```

---

## Piano 3: grotte di cristallo

Roccia nera e lucida, cristalli enormi ciano e viola, superfici a sfaccettature. Freddo, silenzioso, quasi bello, inquietante.

### Tile

```
Pixel art TILESET for a top-down 3/4 view sci-fi roguelite, matching the pixel size and style of the attached astronaut reference.
SETTING: deep CRYSTAL caves. Glossy black rock, huge faceted cyan and violet crystals growing from floor and walls. Cold, silent, eerie and almost beautiful.
TRUE pixel art: each cell is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients, flat faceted shading with hard tone steps.
LIGHTING: flat, neutral, even lighting. NO cast shadows, NO glow drawn: the game adds dynamic lights and bloom later. Rock stays dark, crystals use bright saturated flat colors.
PALETTE: black rock #0c0e16 #161a26 #232838; crystal cyan #1b849b #31dcf0 #8bf4f9; crystal violet #4a2a7a #8a5ad8 #c8a8ff.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels.
Row 1: six FLOOR tiles, each SEAMLESSLY TILEABLE on all four edges: smooth black rock; black rock with a thin cyan crystal vein; faceted crystal-glass floor; black rock with crystal dust; rock with a tiny violet crystal; cracked crystal-glass floor.
Row 2: six WALL tiles seen from a 3/4 top-down view: wall top crest with small crystal points, wall front face of black rock, front face with a big cyan crystal growing out, inner corner, outer corner, wall base where crystals meet the floor.
Row 3: DOOR closed (a natural arch sealed by a sheet of violet crystal), DOOR open (the crystal sheet shattered, dark passage), floor decal: shattered crystal shards, floor decal: frost pattern, floor-to-water edge tile (rock sloping into still black water on the bottom half), broken floor tile with a dark pit lined with crystals.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text, no numbers, no grid lines.
```

### Oggetti

```
Use the attached tileset as the style and palette reference, and the attached astronaut for scale. Same pixel size, same flat neutral lighting.
Pixel art PROPS sheet for the third floor of a top-down 3/4 view sci-fi roguelite: deep crystal caves.
TRUE pixel art: each cell is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. 1-pixel dark outline #0b0d14 around every object. Flat neutral lighting, NO cast shadow on the ground.
Each object is centered in its cell and stands on the same baseline 2 pixels above the bottom of the cell.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space.
Row 1 (OBSTACLES, about 28x26 pixels, they block movement): tall cyan crystal cluster; violet crystal spire; black boulder with crystal growths; crystal geode cracked open; twin crystals crossed; a frozen chunk of ice with something dark inside.
Row 2 (SMALL DECOR, about 12-20 pixels, walkable): crystal shards; tiny cyan crystal sprout (bright, it will glow); violet crystal sprout (bright); frost patch; an old mining pick stuck in the floor; a dropped scanner device with a cracked screen.
Row 3 (LARGE DECOR, up to 32x32): huge cyan crystal formation; crystal arch fragment; black obelisk-like rock; cluster of glowing violet crystals; a mining drill abandoned in the crystals; a crystal with a fossilized alien creature inside.

BACKGROUND: one solid flat magenta #FF00FF everywhere. No ground shadows, no text, no labels.
```

---

## Piano 4: laboratorio alieno allagato

Pannelli di metallo alieno, glifi spenti, cavi, pozze d'acqua ovunque. È il piano dell'acqua: molte stanze avranno pozze grandi.

### Tile

```
Pixel art TILESET for a top-down 3/4 view sci-fi roguelite, matching the pixel size and style of the attached astronaut reference.
SETTING: a FLOODED ALIEN LABORATORY. Smooth curved panels of unknown dark metal, dead alien glyphs, loose cables, standing water everywhere. Clinical, ancient, drowned.
TRUE pixel art: each cell is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients, flat color shading with 3-4 tones per material.
LIGHTING: flat, neutral, even lighting. NO cast shadows, NO glow drawn, NO water reflections drawn: the game renders water and lights itself. Keep it dark.
PALETTE: alien metal #12181c #1c262c #2a3840 #3e5258; rust-teal stains #2a4a44; dead glyphs #1f3a3a; live glyph accents #39d0ff #ff9a3c (small, they will glow).

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels.
Row 1: six FLOOR tiles, each SEAMLESSLY TILEABLE on all four edges: hexagonal metal floor plate; plate with engraved dead glyphs; grated floor; plate with teal water stains; plate with a cable running across; plate with a small cyan glyph still lit.
Row 2: six WALL tiles seen from a 3/4 top-down view: wall top crest (rounded metal rim), wall front face (curved panels), front face with a broken panel and hanging cables, inner corner, outer corner, wall base with a drainage slit.
Row 3: DOOR closed (an iris door of curved metal blades, shut), DOOR open (the iris dilated, dark corridor), floor decal: algae patch, floor decal: scattered glass from broken vials, floor-to-water edge tile (metal plate ending in a step down into water on the bottom half), broken floor tile with a flooded dark hole.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text, no numbers, no grid lines.
```

### Oggetti

```
Use the attached tileset as the style and palette reference, and the attached astronaut for scale. Same pixel size, same flat neutral lighting.
Pixel art PROPS sheet for the fourth floor of a top-down 3/4 view sci-fi roguelite: a flooded alien laboratory.
TRUE pixel art: each cell is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. 1-pixel dark outline #0b0d14 around every object. Flat neutral lighting, NO cast shadow on the ground, NO water drawn around the objects.
Each object is centered in its cell and stands on the same baseline 2 pixels above the bottom of the cell.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space.
Row 1 (OBSTACLES, about 28x26 pixels, they block movement): alien specimen tank (cracked glass, empty); toppled metal console; cylindrical containment pod; heavy pipe junction; rounded metal sarcophagus; crate of alien design with glyphs.
Row 2 (SMALL DECOR, about 12-20 pixels, walkable): broken vials; coiled cable; floating debris plate; small round drone, dead; a cyan glyph stone (bright, it will glow); a human data pad with a flickering orange screen (bright).
Row 3 (LARGE DECOR, up to 32x32): tall specimen tank with a dark floating shape inside and a cyan glow; operating table of alien design; collapsed ceiling beam; bank of dead monitors; tangled cable pillar; alien statue covered in algae.

BACKGROUND: one solid flat magenta #FF00FF everywhere. No ground shadows, no text, no labels.
```

---

## Piano 5: nucleo della struttura

Il cuore dell'alveare-macchina: metallo e carne fusi insieme, pulsazioni rosse, energia. Il piano più ostile e più "acceso".

### Tile

```
Pixel art TILESET for a top-down 3/4 view sci-fi roguelite, matching the pixel size and style of the attached astronaut reference.
SETTING: the CORE of the alien structure, where machine and flesh have fused. Dark metal plates overgrown with sinew, pulsing red energy conduits, ancient and hostile. The final floor.
TRUE pixel art: each cell is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients, flat color shading with 3-4 tones per material.
LIGHTING: flat, neutral, even lighting. NO cast shadows, NO glow drawn: the game adds dynamic lights and bloom later. Keep everything very dark except the energy lines.
PALETTE: dark metal #0e0c12 #1a1620 #2a2432; sinew #3a1418 #5a2028 #7a2a30; energy red #ff4a5a #ff8a6a (bright, flat, they will glow); rare cyan #31dcf0.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space. No lines, no borders, no labels.
Row 1: six FLOOR tiles, each SEAMLESSLY TILEABLE on all four edges: dark metal plate; plate with a thin red energy line; sinew-covered plate; plate with circular engravings; plate with a red pulsing node; plate cracked with sinew growing through.
Row 2: six WALL tiles seen from a 3/4 top-down view: wall top crest (metal rim with sinew), wall front face (fused metal and muscle), front face with a red energy conduit, inner corner, outer corner, wall base with roots of sinew.
Row 3: DOOR closed (a massive circular seal with a red energy lock), DOOR open (the seal rolled aside, red-lit corridor), floor decal: burn marks, floor decal: sinew strands, floor-to-water edge tile (metal edge falling into thick dark fluid on the bottom half), broken floor tile with a dark pit and red glow deep inside.

BACKGROUND: one solid flat magenta #FF00FF everywhere, including between cells. Not a checkerboard, not transparent. No text, no numbers, no grid lines.
```

### Oggetti

```
Use the attached tileset as the style and palette reference, and the attached astronaut for scale. Same pixel size, same flat neutral lighting.
Pixel art PROPS sheet for the final floor of a top-down 3/4 view sci-fi roguelite: the core of the alien structure, machine and flesh fused.
TRUE pixel art: each cell is exactly 32x32 pixels, upscaled 8x with crisp, square, equal-size pixels. No anti-aliasing, no blur, no gradients. 1-pixel dark outline #0b0d14 around every object. Flat neutral lighting, NO cast shadow on the ground.
Each object is centered in its cell and stands on the same baseline 2 pixels above the bottom of the cell.

LAYOUT: exactly 6 columns by 3 rows of equal square cells, separated only by empty magenta space.
Row 1 (OBSTACLES, about 28x26 pixels, they block movement): biomechanical pillar; pulsing flesh node with metal clamps; energy capacitor with red core; fused machine-heart lump; spiked sinew mass; a sealed metal pod wrapped in muscle.
Row 2 (SMALL DECOR, about 12-20 pixels, walkable): loose sinew strands; small red energy crystal (bright, it will glow); twitching cable; scattered bone-like metal shards; a puddle of dark fluid; a dead astronaut's helmet from an earlier expedition, visor cracked.
Row 3 (LARGE DECOR, up to 32x32): big pulsing red conduit pipe; ribbed biomechanical arch fragment; an alien throne-like console; cluster of red energy crystals; a giant eye-like sensor, closed; an earlier expedition's crashed drone embedded in flesh.

BACKGROUND: one solid flat magenta #FF00FF everywhere. No ground shadows, no text, no labels.
```

---

## Se Gemini non collabora

- **Tile con cuciture visibili quando si ripetono:** aggiungi `Each floor tile must tile seamlessly: its left edge continues its right edge, and its top edge continues its bottom edge.`
- **Ombre o bagliori disegnati:** aggiungi `Absolutely no shadows, no light rays, no glow halos, no ambient occlusion. Flat lighting only.`
- **Griglia sbagliata:** aggiungi `The grid MUST be exactly 6 columns and 3 rows, 18 cells in total.`
- **Pixel sfocati o finti:** aggiungi `Hard pixel edges only, like a 1990s console sprite. Every pixel is a perfect square block of identical size.`
- **Scala diversa dall'astronauta:** riallega il foglio modello dell'astronauta e aggiungi `The astronaut reference is exactly 1.3 cells tall; draw the tiles and props at the same pixel scale.`
