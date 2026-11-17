import Phaser from 'phaser';
import { Rng } from '../rules/rng';
import { TILE, WALL_TILES, attachNormalMap, makeLitTexture } from './pixelArt';

/**
 * Art set of one floor, picked by hand from the pieces that
 * tools/extract_sprites.py cut out of the Gemini sheets (numbers refer to
 * art/processed/rooms/<key>-tiles|props-index.png).
 */
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
  /** Other props that give off light, with its colour. */
  lamps: Record<number, number>;
  /** Fill colour of solid rock behind the walls. */
  rock: string;
}

export const CRASH_SITE: Biome = {
  key: '1-crash',
  floors: [
    { id: 0, weight: 10 },
    { id: 1, weight: 4 },
    { id: 3, weight: 3 },
    { id: 2, weight: 2 },
    { id: 4, weight: 1 },
    { id: 5, weight: 1 },
  ],
  decals: [14, 15, 20, 21],
  wallFaces: [6, 6, 7, 11, 8],
  doorClosed: 12,
  obstacles: [0, 0, 1, 1, 3, 4, 5, 13, 16, 21, 23],
  decor: [6, 7, 8, 10, 11, 12, 14, 15, 19, 20],
  crystals: [17, 22, 9],
  lamps: { 11: 0xff5040 },
  rock: '#0e1119',
};

const tileKey = (b: Biome, id: number) => `${b.key}-tile-${id}`;
export const propKey = (b: Biome, id: number) => `${b.key}-prop-${id}`;

function ids(b: Biome): { tiles: number[]; props: number[] } {
  const tiles = new Set([...b.floors.map((f) => f.id), ...b.decals, ...b.wallFaces, b.doorClosed]);
  const props = new Set([...b.obstacles, ...b.decor, ...b.crystals]);
  return { tiles: [...tiles], props: [...props] };
}

export function preloadBiome(scene: Phaser.Scene, b: Biome): void {
  const { tiles, props } = ids(b);
  const pad = (n: number) => String(n).padStart(2, '0');
  for (const id of tiles) scene.load.image(tileKey(b, id), `sprites/rooms/${b.key}/tiles/${pad(id)}.png`);
  for (const id of props) scene.load.image(propKey(b, id), `sprites/rooms/${b.key}/props/${pad(id)}.png`);
}

/** Normal maps so the scene lights shape every prop. */
export function prepareBiome(scene: Phaser.Scene, b: Biome): void {
  for (const id of ids(b).props) attachNormalMap(scene, propKey(b, id));
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
    const decals = rng.int(2, 4);
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
    const pick = (side: 'top' | 'bottom' | 'left' | 'right', i: number) =>
      source(scene, tileKey(b, isDoor(side, i) ? b.doorClosed : rng.pick(b.wallFaces)));
    for (let c = 0; c < cols; c++) {
      const x = (c + k) * TILE + TILE / 2;
      const top = pick('top', c);
      face(top, x, k * TILE - top.height / 2, 0);
      const bottom = pick('bottom', c);
      face(bottom, x, (rows + k) * TILE + bottom.height / 2, Math.PI);
    }
    for (let r = 0; r < rows; r++) {
      const y = (r + k) * TILE + TILE / 2;
      const left = pick('left', r);
      face(left, k * TILE - left.height / 2, y, -Math.PI / 2);
      const right = pick('right', r);
      face(right, (cols + k) * TILE + right.height / 2, y, Math.PI / 2);
    }
  });
}
