import Phaser from 'phaser';
import { Rng } from '../rules/rng';
import type { GlowKind } from '../rules/glow';
import { TILE, WALL_TILES, attachNormalMap, makeLitTexture } from './pixelArt';

/**
 * Art set of one floor, picked by hand from the pieces that
 * tools/extract_sprites.py cut out of the Gemini sheets (numbers refer to
 * art/processed/rooms/<key>-tiles|props-index.png).
 */
export interface Lamp {
  color: number;
  radius: number;
  intensity: number;
  kind: GlowKind;
}

/**
 * A small looping effect attached to a prop, made by the game (no frames
 * needed): rising crystal sparkles, smoke, flare sparks, steam puffs or a
 * blinking beacon. `fx`/`fy` place it as a fraction of the prop's width and
 * height from its top-left corner.
 */
export interface PropEffect {
  type: 'sparkle' | 'smoke' | 'sparks' | 'steam' | 'beacon';
  fx: number;
  fy: number;
  /** Average milliseconds between emissions (blink period for a beacon). */
  every: number;
}

export interface Biome {
  key: string;
  /** Floor title shown on arrival, e.g. "Piano 1 — Sito dello schianto". */
  title: string;
  /** Floor tile with a hole in it, drawn under the trapdoor to the next floor. */
  hole: number;
  /** Floor tile ids with how often each appears. */
  floors: { id: number; weight: number }[];
  /** Stains and scorch marks painted on the floor. */
  decals: number[];
  /** Wall front faces, shown facing the room on all four sides. */
  wallFaces: number[];
  doorClosed: number;
  /** Top-wall door opening, frames from closed to open (32×32 strip in anim/). */
  doorAnim: { file: string; frames: number[] };
  /** Props that block movement. */
  obstacles: number[];
  /** Small walkable props. */
  decor: number[];
  /** Glowing props that are light sources. */
  crystals: number[];
  /** Props that give off light: colour, reach, strength and how it varies. */
  lamps: Record<number, Lamp>;
  /** Props replaced by a drawn animation strip (in sprites/rooms/<key>/anim/). */
  animated: Record<number, { file: string; frameWidth: number; frameHeight: number; fps: number }>;
  /** Code-made animations on props, by prop id. */
  effects: Record<number, PropEffect[]>;
  /** Walkable props that glow, preferred for half of the small props. */
  litDecor: number[];
  /** Fill colour of solid rock behind the walls. */
  rock: string;
  /** Colours for side and bottom doors, drawn seen from above. */
  door: { metal: string; metalLight: string; dark: string; stripe: string; outline: string };
}

export const CRASH_SITE: Biome = {
  key: '1-crash',
  title: 'Piano 1 — Sito dello schianto',
  hole: 23,
  // Mostly plain slabs; a variant only now and then.
  floors: [
    { id: 0, weight: 60 },
    { id: 1, weight: 5 },
    { id: 3, weight: 3 },
    { id: 4, weight: 1 },
    { id: 5, weight: 1 },
  ],
  decals: [14, 15, 20, 21],
  wallFaces: [6, 6, 7, 11, 8],
  doorClosed: 12,
  // Frames 4 and 6 of the strip are drawn wrong: skip them.
  doorAnim: { file: 'door', frames: [0, 1, 2, 4] },
  obstacles: [0, 0, 1, 1, 3, 4, 5, 13, 16, 21, 23],
  decor: [6, 7, 8, 10, 11, 12, 14, 15, 19, 20],
  crystals: [17, 22, 9],
  lamps: {
    17: { color: 0x4dffb0, radius: 110, intensity: 0.9, kind: 'pulse' }, // big crystal
    22: { color: 0x4dffb0, radius: 110, intensity: 0.9, kind: 'pulse' }, // big crystal
    9: { color: 0x4dffb0, radius: 60, intensity: 0.7, kind: 'pulse' }, // crystal sprout
    11: { color: 0xff5040, radius: 75, intensity: 1.1, kind: 'flicker' }, // emergency flare
    23: { color: 0xff8a3c, radius: 80, intensity: 0.8, kind: 'ember' }, // burnt escape pod
    10: { color: 0x39d0ff, radius: 45, intensity: 0.7, kind: 'dying' }, // cracked visor
  },
  litDecor: [11, 11, 10, 9],
  animated: { 11: { file: 'flare', frameWidth: 12, frameHeight: 16, fps: 9 } },
  effects: {
    17: [{ type: 'sparkle', fx: 0.5, fy: 0.3, every: 450 }],
    22: [{ type: 'sparkle', fx: 0.5, fy: 0.3, every: 450 }],
    9: [{ type: 'sparkle', fx: 0.5, fy: 0.4, every: 900 }],
    23: [{ type: 'smoke', fx: 0.55, fy: 0.15, every: 300 }],
    11: [
      { type: 'sparks', fx: 0.85, fy: 0.1, every: 260 },
      { type: 'smoke', fx: 0.85, fy: 0.15, every: 520 },
    ],
    5: [{ type: 'steam', fx: 0.3, fy: 0.35, every: 1800 }],
    14: [{ type: 'beacon', fx: 0.5, fy: 0.02, every: 1100 }],
    19: [{ type: 'beacon', fx: 0.5, fy: 0.02, every: 1300 }],
  },
  rock: '#0e1119',
  door: { metal: '#4f5762', metalLight: '#7d8799', dark: '#05070b', stripe: '#ff9a3c', outline: '#0b0d14' },
};

/**
 * Floor 2: the hive the larvae built under the wreck. Fleshy stone, resin
 * veins and egg clutches; glowing yellow eggs light it.
 */
export const HIVE: Biome = {
  key: '2-hive',
  title: "Piano 2 — L'alveare",
  hole: 19,
  floors: [
    { id: 0, weight: 50 },
    { id: 1, weight: 6 },
    { id: 2, weight: 4 },
    { id: 5, weight: 3 },
  ],
  decals: [14, 15, 17, 18],
  wallFaces: [6, 6, 7, 11],
  doorClosed: 12,
  doorAnim: { file: 'door', frames: [0, 1] },
  obstacles: [0, 0, 1, 1, 2, 5, 12, 18],
  decor: [4, 6, 7, 8, 9, 11, 15, 16, 21, 22],
  crystals: [17, 23, 10],
  lamps: {
    17: { color: 0xd8e04a, radius: 110, intensity: 0.85, kind: 'pulse' }, // big glowing egg
    23: { color: 0xd8e04a, radius: 110, intensity: 0.85, kind: 'pulse' }, // glowing egg on a nest
    10: { color: 0xd8e04a, radius: 55, intensity: 0.7, kind: 'pulse' }, // small glowing egg
  },
  litDecor: [10, 10],
  animated: {},
  effects: {
    17: [{ type: 'sparkle', fx: 0.5, fy: 0.3, every: 500 }],
    23: [{ type: 'sparkle', fx: 0.5, fy: 0.3, every: 500 }],
  },
  rock: '#140c12',
  door: { metal: '#4a3a40', metalLight: '#7a5a60', dark: '#07040a', stripe: '#d8e04a', outline: '#0b0d14' },
};

/** Biome of each floor, from the first; deeper floors reuse the last one until their art exists. */
export const CRYSTAL: Biome = {
  key: '3-crystal',
  title: 'Piano 3 — Le grotte di cristallo',
  hole: 24,
  floors: [
    { id: 0, weight: 50 },
    { id: 1, weight: 5 },
    { id: 4, weight: 4 },
    { id: 3, weight: 3 },
  ],
  decals: [15, 21, 22],
  wallFaces: [7, 7, 11, 6],
  doorClosed: 12,
  doorAnim: { file: 'door', frames: [0, 1] },
  // Dark crystal-studded rocks, a monolith, frozen blocks, a geode, a dead machine.
  obstacles: [2, 2, 15, 5, 18, 3, 17],
  decor: [1, 4, 6, 7, 10, 11, 12, 8, 9],
  crystals: [0, 13, 16],
  lamps: {
    0: { color: 0x5af0ff, radius: 110, intensity: 0.85, kind: 'pulse' }, // cyan crystal cluster
    13: { color: 0x5af0ff, radius: 120, intensity: 0.9, kind: 'pulse' }, // big cyan crystal
    16: { color: 0xa060ff, radius: 100, intensity: 0.85, kind: 'pulse' }, // violet crystals
    8: { color: 0x5af0ff, radius: 45, intensity: 0.6, kind: 'pulse' }, // small cyan crystal
    9: { color: 0xa060ff, radius: 40, intensity: 0.6, kind: 'pulse' }, // small violet crystal
  },
  litDecor: [8, 9],
  animated: {},
  effects: {
    0: [{ type: 'sparkle', fx: 0.5, fy: 0.3, every: 450 }],
    13: [{ type: 'sparkle', fx: 0.5, fy: 0.25, every: 400 }],
    16: [{ type: 'sparkle', fx: 0.5, fy: 0.3, every: 500 }],
  },
  rock: '#070a12',
  door: { metal: '#3a3450', metalLight: '#6a5a90', dark: '#05060c', stripe: '#5af0ff', outline: '#0b0d14' },
};

/** Floor 4: an abandoned alien research lab, tanks and consoles under emergency light. */
export const LAB: Biome = {
  key: '4-lab',
  title: 'Piano 4 — Il laboratorio',
  hole: 18,
  floors: [
    { id: 0, weight: 50 },
    { id: 4, weight: 6 },
    { id: 3, weight: 4 },
    { id: 2, weight: 3 },
    { id: 1, weight: 2 },
  ],
  decals: [15, 16, 5],
  wallFaces: [11, 11, 11],
  doorClosed: 13,
  doorAnim: { file: 'door', frames: [0, 1] },
  // Broken tanks, consoles, capsules, pods, crates, monitors, the operating table.
  obstacles: [0, 1, 2, 3, 4, 5, 5, 17, 15],
  decor: [6, 7, 9, 10, 11, 12, 13, 16],
  crystals: [14, 8, 19],
  lamps: {
    14: { color: 0x5af0ff, radius: 110, intensity: 0.9, kind: 'pulse' }, // specimen tube
    8: { color: 0x5af0ff, radius: 50, intensity: 0.7, kind: 'pulse' }, // crystal sample
    2: { color: 0x39d0ff, radius: 60, intensity: 0.7, kind: 'dying' }, // capsule light
    0: { color: 0x5af0ff, radius: 70, intensity: 0.7, kind: 'flicker' }, // broken tank
    1: { color: 0x4dffb0, radius: 60, intensity: 0.7, kind: 'flicker' }, // console screens
  },
  litDecor: [8, 8],
  animated: {},
  effects: {
    0: [{ type: 'sparks', fx: 0.5, fy: 0.4, every: 700 }],
    3: [{ type: 'steam', fx: 0.2, fy: 0.3, every: 1600 }],
    14: [{ type: 'sparkle', fx: 0.5, fy: 0.5, every: 700 }],
    1: [{ type: 'beacon', fx: 0.6, fy: 0.2, every: 1200 }],
  },
  rock: '#090c10',
  door: { metal: '#3a4450', metalLight: '#6a7a88', dark: '#05070b', stripe: '#5af0ff', outline: '#0b0d14' },
};

/** Floor 5: the core, where alien flesh has grown into the machines. Red light. */
export const CORE: Biome = {
  key: '5-core',
  title: 'Piano 5 — Il nucleo',
  hole: 17,
  floors: [
    { id: 0, weight: 60 },
    { id: 3, weight: 3 },
    { id: 5, weight: 2 },
    { id: 1, weight: 2 },
  ],
  decals: [2, 14, 15, 4],
  wallFaces: [6, 6, 7, 11],
  doorClosed: 12,
  doorAnim: { file: 'door', frames: [0, 1] },
  // Flesh-grown machines, wrapped pods, a throne of cables, a giant eye.
  obstacles: [1, 3, 5, 19, 21, 13, 17, 4],
  decor: [6, 7, 9, 10, 11, 12, 14, 15, 16],
  crystals: [20, 2, 0, 8],
  lamps: {
    20: { color: 0xff3a4a, radius: 110, intensity: 0.9, kind: 'pulse' }, // big red crystal
    2: { color: 0xff3a4a, radius: 80, intensity: 0.85, kind: 'pulse' }, // red tube
    0: { color: 0xff3a4a, radius: 70, intensity: 0.8, kind: 'flicker' }, // flesh pillar
    8: { color: 0xff3a4a, radius: 45, intensity: 0.7, kind: 'pulse' }, // red shard
    17: { color: 0xff3a4a, radius: 50, intensity: 0.6, kind: 'pulse' }, // glowing pipe
  },
  litDecor: [8, 8],
  animated: {},
  effects: {
    20: [{ type: 'sparkle', fx: 0.5, fy: 0.3, every: 450 }],
    1: [{ type: 'steam', fx: 0.5, fy: 0.2, every: 1500 }],
    19: [{ type: 'smoke', fx: 0.5, fy: 0.15, every: 600 }],
  },
  rock: '#0c0608',
  door: { metal: '#3a2a2e', metalLight: '#6a4a50', dark: '#050204', stripe: '#ff3a4a', outline: '#0b0d14' },
};

export const BIOMES: readonly Biome[] = [CRASH_SITE, HIVE, CRYSTAL, LAB, CORE];

export const biomeFor = (floor: number): Biome => BIOMES[Math.min(BIOMES.length, Math.max(1, floor)) - 1];

const tileKey = (b: Biome, id: number) => `${b.key}-tile-${id}`;
export const propKey = (b: Biome, id: number) => `${b.key}-prop-${id}`;

function ids(b: Biome): { tiles: number[]; props: number[] } {
  const tiles = new Set([...b.floors.map((f) => f.id), ...b.decals, ...b.wallFaces, b.doorClosed, b.hole]);
  const props = new Set([...b.obstacles, ...b.decor, ...b.crystals]);
  return { tiles: [...tiles], props: [...props] };
}

export const propAnimKey = (b: Biome, id: number) => `${b.key}-anim-${id}`;
export const holeKey = (b: Biome) => tileKey(b, b.hole);
export const doorAnimKey = (b: Biome) => `${b.key}-door`;
/** Closed hatch of a side or bottom door, laid over the open passage. */
export const hatchKey = (b: Biome, side: 'left' | 'right' | 'bottom') => `${b.key}-hatch-${side}`;

export function preloadBiome(scene: Phaser.Scene, b: Biome): void {
  const { tiles, props } = ids(b);
  const pad = (n: number) => String(n).padStart(2, '0');
  for (const [id, a] of Object.entries(b.animated)) {
    scene.load.spritesheet(propAnimKey(b, Number(id)), `sprites/rooms/${b.key}/anim/${a.file}.png`, {
      frameWidth: a.frameWidth,
      frameHeight: a.frameHeight,
    });
  }
  scene.load.spritesheet(doorAnimKey(b), `sprites/rooms/${b.key}/anim/${b.doorAnim.file}.png`, { frameWidth: TILE, frameHeight: TILE });
  for (const id of tiles) scene.load.image(tileKey(b, id), `sprites/rooms/${b.key}/tiles/${pad(id)}.png`);
  for (const id of props) scene.load.image(propKey(b, id), `sprites/rooms/${b.key}/props/${pad(id)}.png`);
}

/** Normal maps so the scene lights shape every prop. */
export function prepareBiome(scene: Phaser.Scene, b: Biome): void {
  for (const id of ids(b).props) attachNormalMap(scene, propKey(b, id));
  attachNormalMap(scene, doorAnimKey(b));
  if (!scene.anims.exists(doorAnimKey(b))) {
    scene.anims.create({
      key: doorAnimKey(b),
      frames: scene.anims.generateFrameNumbers(doorAnimKey(b), { frames: b.doorAnim.frames }),
      frameRate: 12,
    });
  }
  const k = WALL_TILES * TILE;
  makeLitTexture(scene, hatchKey(b, 'left'), k, TILE, (ctx) => sideDoor(ctx, b, 0, 0, k, TILE, 'left', true));
  makeLitTexture(scene, hatchKey(b, 'right'), k, TILE, (ctx) => sideDoor(ctx, b, 0, 0, k, TILE, 'right', true));
  makeLitTexture(scene, hatchKey(b, 'bottom'), TILE, k, (ctx) => sideDoor(ctx, b, 0, 0, TILE, k, 'bottom', true));
  for (const [id, a] of Object.entries(b.animated)) {
    const key = propAnimKey(b, Number(id));
    attachNormalMap(scene, key);
    if (!scene.anims.exists(key)) {
      scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(key), frameRate: a.fps, repeat: -1 });
    }
  }
}

function source(scene: Phaser.Scene, key: string): HTMLImageElement {
  return scene.textures.get(key).getSourceImage() as HTMLImageElement;
}

function pickWeighted(rng: Rng, items: { id: number; weight: number }[]): number {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rng.next() * total;
  for (const i of items) {
    r -= i.weight;
    if (r < 0) return i.id;
  }
  return items[0].id;
}

/** Paints the room floor from the biome's tiles, plus a few decals. */
export function paintFloor(scene: Phaser.Scene, key: string, b: Biome, cols: number, rows: number, rng: Rng): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  makeLitTexture(scene, key, cols * TILE, rows * TILE, (ctx) => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) ctx.drawImage(source(scene, tileKey(b, pickWeighted(rng, b.floors))), c * TILE, r * TILE);
    }
    const decals = rng.int(0, 2);
    for (let i = 0; i < decals; i++) {
      ctx.drawImage(source(scene, tileKey(b, rng.pick(b.decals))), rng.int(0, cols - 1) * TILE, rng.int(0, rows - 1) * TILE);
    }
  });
}

/**
 * Paints the walls around a room of any shape. `open` says which interior
 * tiles are floor; every edge between floor and wall gets a wall face turned
 * towards the room (the top wall upright, the others rotated), with solid
 * rock behind. Top doors use the closed-door tile; side and bottom doors are
 * painted open, and their hatches are separate images (hatchKey).
 */
export function paintWalls(
  scene: Phaser.Scene,
  key: string,
  b: Biome,
  open: readonly (readonly boolean[])[],
  doors: readonly { col: number; row: number; side: 'up' | 'down' | 'left' | 'right' }[],
  rng: Rng,
): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const k = WALL_TILES;
  const rows = open.length;
  const cols = open[0].length;
  const w = (cols + 2 * k) * TILE;
  const h = (rows + 2 * k) * TILE;
  const floor = (c: number, r: number) => r >= 0 && c >= 0 && r < rows && c < cols && open[r][c];
  const door = (c: number, r: number, side: string) => doors.some((d) => d.col === c && d.row === r && d.side === side);
  makeLitTexture(scene, key, w, h, (ctx) => {
    // Solid rock everywhere but the floor, which stays transparent.
    ctx.fillStyle = b.rock;
    ctx.fillRect(0, 0, w, h);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (open[r][c]) ctx.clearRect((c + k) * TILE, (r + k) * TILE, TILE, TILE);
    // Draws a face so that its bottom edge (the part that touches the floor)
    // lies on the room border, turned by `angle`.
    const face = (img: HTMLImageElement, cx: number, cy: number, angle: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    };
    const wall = () => source(scene, tileKey(b, rng.pick(b.wallFaces)));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!open[r][c]) continue;
        const x0 = (c + k) * TILE;
        const y0 = (r + k) * TILE;
        if (!floor(c, r - 1)) {
          // The top wall faces the camera: its door is the front-view door tile.
          const top = door(c, r, 'up') ? source(scene, tileKey(b, b.doorClosed)) : wall();
          face(top, x0 + TILE / 2, y0 - top.height / 2, 0);
        }
        if (!floor(c, r + 1)) {
          if (door(c, r, 'down')) sideDoor(ctx, b, x0, y0 + TILE, TILE, k * TILE, 'bottom', false);
          else {
            const img = wall();
            face(img, x0 + TILE / 2, y0 + TILE + img.height / 2, Math.PI);
          }
        }
        if (!floor(c - 1, r)) {
          if (door(c, r, 'left')) sideDoor(ctx, b, x0 - k * TILE, y0, k * TILE, TILE, 'left', false);
          else {
            const img = wall();
            face(img, x0 - img.height / 2, y0 + TILE / 2, -Math.PI / 2);
          }
        }
        if (!floor(c + 1, r)) {
          if (door(c, r, 'right')) sideDoor(ctx, b, x0 + TILE, y0, k * TILE, TILE, 'right', false);
          else {
            const img = wall();
            face(img, x0 + TILE + img.height / 2, y0 + TILE / 2, Math.PI / 2);
          }
        }
      }
    }
  });
}

/**
 * A closed door in a side or bottom wall, seen from above at the 3/4 angle
 * instead of the front-view tile turned on its side: a dark passage through
 * the wall, metal jambs along it, and the hatch seen edge-on near the room.
 * For side doors the jamb nearer the top of the screen is drawn thicker,
 * because the camera sees its face; the bottom door's hatch shows its front.
 */
function sideDoor(
  ctx: CanvasRenderingContext2D,
  b: Biome,
  x: number,
  y: number,
  w: number,
  h: number,
  side: 'left' | 'right' | 'bottom',
  hatch: boolean,
): void {
  const c = b.door;
  const rect = (color: string, rx: number, ry: number, rw: number, rh: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(rx, ry, rw, rh);
  };
  // Passage floor, a little lighter near the room.
  rect(c.dark, x, y, w, h);
  if (side === 'bottom') {
    rect('#0d1118', x + 4, y, w - 8, 10);
    // Jambs along both sides of the passage.
    for (const jx of [x, x + w - 4]) {
      rect(c.outline, jx, y, 4, h);
      rect(c.metal, jx + 1, y, 2, h);
    }
    if (!hatch) return;
    // Hatch seen from above: thin top edge, then its front face towards the camera.
    const hy = y + 3;
    rect(c.outline, x + 3, hy - 1, w - 6, 10);
    rect(c.metalLight, x + 4, hy, w - 8, 2);
    rect(c.metal, x + 4, hy + 2, w - 8, 6);
    for (let sx = x + 6; sx < x + w - 6; sx += 6) rect(c.stripe, sx, hy + 3, 3, 3);
    return;
  }
  const roomEdge = side === 'left' ? x + w : x;
  const dir = side === 'left' ? -1 : 1; // from the room outwards
  // Lighter strip of passage right next to the room.
  rect('#0d1118', side === 'left' ? roomEdge - 12 : roomEdge, y + 6, 12, h - 8);
  // Upper jamb: the camera sees its face, so it is taller.
  rect(c.outline, x, y - 1, w, 8);
  rect(c.metal, x, y, w, 5);
  rect(c.metalLight, x, y, w, 1);
  // Lower jamb: only its top edge shows.
  rect(c.outline, x, y + h - 3, w, 3);
  rect(c.metal, x, y + h - 2, w, 1);
  if (!hatch) return;
  // Hatch seen edge-on, just inside the wall, with hazard marks.
  const hx = roomEdge + dir * 6 - (side === 'left' ? 6 : 0);
  rect(c.outline, hx - 1, y + 5, 8, h - 7);
  rect(c.metal, hx, y + 6, 6, h - 9);
  rect(c.metalLight, side === 'left' ? hx + 5 : hx, y + 6, 1, h - 9);
  for (let sy = y + 9; sy < y + h - 5; sy += 6) rect(c.stripe, hx + 1, sy, 4, 3);
}
