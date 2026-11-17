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
  /** Floor tile ids with how often each appears. */
  floors: { id: number; weight: number }[];
  /** Stains and scorch marks painted on the floor. */
  decals: number[];
  /** Wall front faces, shown facing the room on all four sides. */
  wallFaces: number[];
  doorClosed: number;
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

const tileKey = (b: Biome, id: number) => `${b.key}-tile-${id}`;
export const propKey = (b: Biome, id: number) => `${b.key}-prop-${id}`;

function ids(b: Biome): { tiles: number[]; props: number[] } {
  const tiles = new Set([...b.floors.map((f) => f.id), ...b.decals, ...b.wallFaces, b.doorClosed]);
  const props = new Set([...b.obstacles, ...b.decor, ...b.crystals]);
  return { tiles: [...tiles], props: [...props] };
}

export const propAnimKey = (b: Biome, id: number) => `${b.key}-anim-${id}`;

export function preloadBiome(scene: Phaser.Scene, b: Biome): void {
  const { tiles, props } = ids(b);
  const pad = (n: number) => String(n).padStart(2, '0');
  for (const [id, a] of Object.entries(b.animated)) {
    scene.load.spritesheet(propAnimKey(b, Number(id)), `sprites/rooms/${b.key}/anim/${a.file}.png`, {
      frameWidth: a.frameWidth,
      frameHeight: a.frameHeight,
    });
  }
  for (const id of tiles) scene.load.image(tileKey(b, id), `sprites/rooms/${b.key}/tiles/${pad(id)}.png`);
  for (const id of props) scene.load.image(propKey(b, id), `sprites/rooms/${b.key}/props/${pad(id)}.png`);
}

/** Normal maps so the scene lights shape every prop. */
export function prepareBiome(scene: Phaser.Scene, b: Biome): void {
  for (const id of ids(b).props) attachNormalMap(scene, propKey(b, id));
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
 * Paints the 2-tile wall ring. Every side shows a wall face turned towards
 * the room (the top wall upright, the others rotated), with solid rock
 * behind. Doors use the closed-door tile, turned the same way.
 */
export function paintWalls(
  scene: Phaser.Scene,
  key: string,
  b: Biome,
  cols: number,
  rows: number,
  doors: readonly { col: number; row: number }[],
  rng: Rng,
): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const k = WALL_TILES;
  const w = (cols + 2 * k) * TILE;
  const h = (rows + 2 * k) * TILE;
  const isDoor = (side: 'top' | 'bottom' | 'left' | 'right', i: number) =>
    doors.some((d) =>
      side === 'top' ? d.row === 0 && d.col === i :
      side === 'bottom' ? d.row === rows - 1 && d.col === i :
      side === 'left' ? d.col === 0 && d.row === i :
      d.col === cols - 1 && d.row === i,
    );
  makeLitTexture(scene, key, w, h, (ctx) => {
    // Solid rock fills the ring only: the room interior stays transparent.
    ctx.fillStyle = b.rock;
    ctx.fillRect(0, 0, w, h);
    ctx.clearRect(k * TILE, k * TILE, cols * TILE, rows * TILE);
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
    for (let c = 0; c < cols; c++) {
      const x = (c + k) * TILE + TILE / 2;
      // The top wall faces the camera: its door is the front-view door tile.
      const top = isDoor('top', c) ? source(scene, tileKey(b, b.doorClosed)) : wall();
      face(top, x, k * TILE - top.height / 2, 0);
      if (isDoor('bottom', c)) {
        sideDoor(ctx, b, (c + k) * TILE, (rows + k) * TILE, TILE, k * TILE, 'bottom');
      } else {
        const bottom = wall();
        face(bottom, x, (rows + k) * TILE + bottom.height / 2, Math.PI);
      }
    }
    for (let r = 0; r < rows; r++) {
      const y = (r + k) * TILE + TILE / 2;
      if (isDoor('left', r)) {
        sideDoor(ctx, b, 0, (r + k) * TILE, k * TILE, TILE, 'left');
      } else {
        const left = wall();
        face(left, k * TILE - left.height / 2, y, -Math.PI / 2);
      }
      if (isDoor('right', r)) {
        sideDoor(ctx, b, (cols + k) * TILE, (r + k) * TILE, k * TILE, TILE, 'right');
      } else {
        const right = wall();
        face(right, (cols + k) * TILE + right.height / 2, y, Math.PI / 2);
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
  // Hatch seen edge-on, just inside the wall, with hazard marks.
  const hx = roomEdge + dir * 6 - (side === 'left' ? 6 : 0);
  rect(c.outline, hx - 1, y + 5, 8, h - 7);
  rect(c.metal, hx, y + 6, 6, h - 9);
  rect(c.metalLight, side === 'left' ? hx + 5 : hx, y + 6, 1, h - 9);
  for (let sy = y + 9; sy < y + h - 5; sy += 6) rect(c.stripe, hx + 1, sy, 4, 3);
}
