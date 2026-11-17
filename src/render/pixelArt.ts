import Phaser from 'phaser';
import { Rng } from '../rules/rng';
import { normalMapFromRgba } from '../rules/normalmap';

/** Size of one room tile in world pixels. */
export const TILE = 32;

/** Palette for the placeholder art; the real art replaces it in M3. */
const PAL = {
  outline: '#0b0d14',
  floorDark: '#151a26',
  floor: '#1c2232',
  floorLight: '#262d40',
  wallDark: '#1e2333',
  wall: '#2b3346',
  wallLight: '#3a4560',
  rockDark: '#2e3242',
  rock: '#4a4f63',
  rockLight: '#6b7189',
  crystal: '#4dffb0',
  crystalDark: '#138a66',
  crystalLight: '#d6ffee',
};

type Painter = (ctx: CanvasRenderingContext2D) => void;

function px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function normalCanvas(img: ImageData): HTMLCanvasElement {
  const normal = document.createElement('canvas');
  normal.width = img.width;
  normal.height = img.height;
  const data = new Uint8ClampedArray(normalMapFromRgba(img.data, img.width, img.height));
  normal.getContext('2d')!.putImageData(new ImageData(data, img.width, img.height), 0, 0);
  return normal;
}

/**
 * Builds a normal map from a loaded texture's own pixels so it responds to
 * the scene lights. Safe to call more than once.
 */
export function attachNormalMap(scene: Phaser.Scene, key: string): void {
  const tex = scene.textures.get(key);
  if (!tex || tex.dataSource.length) return;
  const src = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(src, 0, 0);
  tex.setDataSource(normalCanvas(ctx.getImageData(0, 0, src.width, src.height)));
}

/**
 * Creates a canvas texture, paints it, and attaches a normal map built from
 * its own pixels so it responds to the scene lights.
 */
export function makeLitTexture(scene: Phaser.Scene, key: string, w: number, h: number, paint: Painter): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h)!;
  paint(tex.context);
  tex.refresh();
  tex.setDataSource(normalCanvas(tex.context.getImageData(0, 0, w, h)));
}

/** One 32×32 floor tile, varied by the seed so the floor does not look tiled. */
export function paintFloorTile(ctx: CanvasRenderingContext2D, ox: number, oy: number, rng: Rng): void {
  px(ctx, PAL.floor, ox, oy, TILE, TILE);
  // Stone slabs: a 2×2 grid with dark seams.
  px(ctx, PAL.floorDark, ox, oy + 15, TILE, 2);
  px(ctx, PAL.floorDark, ox + 15 + (rng.int(0, 1) ? 0 : 1), oy, 2, 15);
  px(ctx, PAL.floorDark, ox + 9 + rng.int(0, 10), oy + 17, 2, 15);
  for (let i = 0; i < 14; i++) {
    px(ctx, rng.next() < 0.5 ? PAL.floorLight : PAL.floorDark, ox + rng.int(0, TILE - 1), oy + rng.int(0, TILE - 1));
  }
  // Slab top edges catch the light.
  px(ctx, PAL.floorLight, ox, oy, TILE, 1);
  px(ctx, PAL.floorLight, ox, oy + 17, TILE, 1);
}

function paintWallTile(ctx: CanvasRenderingContext2D, ox: number, oy: number, rng: Rng): void {
  px(ctx, PAL.wall, ox, oy, TILE, TILE);
  for (let row = 0; row < 4; row++) {
    const y = oy + row * 8;
    px(ctx, PAL.wallDark, ox, y + 7, TILE, 1);
    const shift = row % 2 ? 0 : 8;
    for (let x = shift; x < TILE; x += 16) px(ctx, PAL.wallDark, ox + x, y, 1, 7);
    px(ctx, PAL.wallLight, ox, y, TILE, 1);
  }
  for (let i = 0; i < 6; i++) px(ctx, PAL.wallDark, ox + rng.int(0, TILE - 1), oy + rng.int(0, TILE - 1));
}

/** Registers every placeholder texture used by the play scene. */
export function makePlaceholderArt(scene: Phaser.Scene): void {
  makeLitTexture(scene, 'px-wall', TILE, TILE, (ctx) => paintWallTile(ctx, 0, 0, new Rng(11)));

  makeLitTexture(scene, 'px-cave', 64, 64, (ctx) => {
    const rng = new Rng(77);
    px(ctx, '#0d1018', 0, 0, 64, 64);
    for (let i = 0; i < 40; i++) {
      const x = rng.int(0, 60);
      const y = rng.int(0, 60);
      px(ctx, '#161b28', x, y, rng.int(2, 6), rng.int(2, 4));
      px(ctx, '#1f2535', x, y, rng.int(1, 4), 1);
    }
  });

  makeLitTexture(scene, 'px-rock', TILE, TILE, (ctx) => {
    // A rounded boulder, lighter towards the top-left.
    for (let y = 3; y < 30; y++) {
      for (let x = 3; x < 30; x++) {
        const dx = (x - 16) / 13;
        const dy = (y - 17) / 12;
        const d = dx * dx + dy * dy;
        if (d > 1) continue;
        const light = -dx * 0.5 - dy * 0.7 + (1 - d) * 0.4;
        px(ctx, light > 0.45 ? PAL.rockLight : light > -0.1 ? PAL.rock : PAL.rockDark, x, y);
      }
    }
    const rng = new Rng(5);
    for (let i = 0; i < 6; i++) px(ctx, PAL.rockDark, rng.int(8, 24), rng.int(9, 26), 2, 1);
  });

  makeLitTexture(scene, 'px-crystal', 16, 24, (ctx) => {
    px(ctx, PAL.crystalDark, 6, 2, 4, 21);
    px(ctx, PAL.crystal, 7, 3, 2, 19);
    px(ctx, PAL.crystalDark, 1, 10, 4, 13);
    px(ctx, PAL.crystal, 2, 11, 2, 11);
    px(ctx, PAL.crystalDark, 11, 8, 4, 15);
    px(ctx, PAL.crystal, 12, 9, 2, 13);
    px(ctx, PAL.crystalLight, 7, 4, 1, 6);
    px(ctx, PAL.crystalLight, 12, 10, 1, 4);
  });

  // Shadows are plain (unlit) black shapes with crisp pixel edges.
  makeShadow(scene, 'px-shadow', 30, 9, 0.78, 0.46);
  makeShadow(scene, 'px-shadow-cast', 28, 11, 0.72, 0.42);

  if (!scene.textures.exists('px-shot')) {
    const g = scene.add.graphics();
    g.fillStyle(0x7cf7d4).fillRect(1, 1, 6, 6);
    g.fillStyle(0xffffff).fillRect(2, 2, 4, 4);
    g.generateTexture('px-shot', 8, 8).clear();
    g.fillStyle(0xffffff).fillRect(0, 0, 2, 2);
    g.generateTexture('px-spark', 2, 2).destroy();
  }
}

/** Paints the floor of a whole room into one lit texture (also sampled by the water). */
export function makeRoomFloor(scene: Phaser.Scene, key: string, cols: number, rows: number, seed: number): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  makeLitTexture(scene, key, cols * TILE, rows * TILE, (ctx) => {
    const rng = new Rng(seed);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) paintFloorTile(ctx, c * TILE, r * TILE, rng);
  });
}

/** Wall thickness around a room, in tiles. */
export const WALL_TILES = 2;

/**
 * Paints the thick wall ring around a room into one texture. The inner row
 * of the top wall is drawn as a lit face, so the room reads as seen from
 * above at an angle; doors are dark passages through the whole thickness.
 */
export function makeRoomWalls(
  scene: Phaser.Scene,
  key: string,
  cols: number,
  rows: number,
  doors: readonly { col: number; row: number }[],
): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const k = WALL_TILES;
  const w = (cols + 2 * k) * TILE;
  const h = (rows + 2 * k) * TILE;
  makeLitTexture(scene, key, w, h, (ctx) => {
    const rng = new Rng(3);
    for (let r = 0; r < rows + 2 * k; r++) {
      for (let c = 0; c < cols + 2 * k; c++) {
        if (r >= k && r < rows + k && c >= k && c < cols + k) continue;
        paintWallTile(ctx, c * TILE, r * TILE, rng);
      }
    }
    // Top wall face: the row just above the floor catches the light.
    px(ctx, PAL.wallLight, k * TILE, (k - 1) * TILE + TILE - 3, cols * TILE, 3);
    // Inner rim all around, where the wall meets the floor.
    px(ctx, PAL.outline, k * TILE - 2, k * TILE - 2, cols * TILE + 4, 2);
    px(ctx, PAL.outline, k * TILE - 2, (rows + k) * TILE, cols * TILE + 4, 2);
    px(ctx, PAL.outline, k * TILE - 2, k * TILE, 2, rows * TILE);
    px(ctx, PAL.outline, (cols + k) * TILE, k * TILE, 2, rows * TILE);
    for (const d of doors) {
      const top = d.row === 0;
      const bottom = d.row === rows - 1;
      const left = d.col === 0 && !top && !bottom;
      if (top || bottom) {
        const x = (d.col + k) * TILE;
        const y = top ? 0 : (rows + k) * TILE;
        px(ctx, PAL.outline, x - 4, y, TILE + 8, k * TILE);
        px(ctx, '#2f8fa0', x - 2, y, 2, k * TILE);
        px(ctx, '#2f8fa0', x + TILE, y, 2, k * TILE);
      } else {
        const x = left ? 0 : (cols + k) * TILE;
        const y = (d.row + k) * TILE;
        px(ctx, PAL.outline, x, y - 4, k * TILE, TILE + 8);
        px(ctx, '#2f8fa0', x, y - 2, k * TILE, 2);
        px(ctx, '#2f8fa0', x, y + TILE, k * TILE, 2);
      }
    }
  });
}

/**
 * Pixel ellipse shadow: a darker core and a lighter rim, alpha baked in, so
 * it reads as soft while keeping hard pixel edges.
 */
function makeShadow(scene: Phaser.Scene, key: string, w: number, h: number, core: number, rim: number): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h)!;
  const ctx = tex.context;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - w / 2) / (w / 2);
      const dy = (y + 0.5 - h / 2) / (h / 2);
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      ctx.fillStyle = `rgba(0, 0, 0, ${d < 0.45 ? core : rim})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  tex.refresh();
}
