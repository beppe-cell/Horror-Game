import Phaser from 'phaser';
import { Rng } from '../rules/rng';
import { normalMapFromRgba } from '../rules/normalmap';

/** Size of one room tile in world pixels. */
export const TILE = 32;

/** Wall thickness around a room, in tiles. */
export const WALL_TILES = 2;

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

/** Registers the generated textures used by the play scene: cave rock, shadows, shot effects. */
export function makePlaceholderArt(scene: Phaser.Scene): void {
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

  // Shadows are plain (unlit) black shapes with crisp pixel edges.
  makeShadow(scene, 'px-shadow', 30, 9, 0.78, 0.46);
  makeShadow(scene, 'px-shadow-cast', 28, 11, 0.72, 0.42);
  makeShadow(scene, 'px-shadow-shot', 9, 4, 0.6, 0.35);

  if (!scene.textures.exists('px-shot')) {
    const g = scene.add.graphics();
    g.fillStyle(0x7cf7d4).fillRect(1, 1, 6, 6);
    g.fillStyle(0xffffff).fillRect(2, 2, 4, 4);
    g.generateTexture('px-shot', 8, 8).clear();
    g.fillStyle(0xffffff).fillRect(0, 0, 2, 2);
    g.generateTexture('px-spark', 2, 2).clear();
    // Plasma bolt, pointing right (rotated to its velocity): cyan rim, mint
    // body, white-hot core biased towards the nose.
    g.fillStyle(0x1b8fb0).fillRect(2, 1, 10, 6).fillRect(1, 2, 12, 4);
    g.fillStyle(0x7cf7d4).fillRect(3, 2, 9, 4).fillRect(2, 3, 11, 2);
    g.fillStyle(0xffffff).fillRect(6, 3, 6, 2).fillRect(8, 2, 3, 4);
    g.generateTexture('px-bolt', 14, 8).clear();
    // Muzzle flash: a small four-point star.
    g.fillStyle(0x7cf7d4).fillRect(5, 0, 1, 11).fillRect(0, 5, 11, 1);
    g.fillStyle(0xb8fff0).fillRect(4, 3, 3, 5).fillRect(3, 4, 5, 3);
    g.fillStyle(0xffffff).fillRect(4, 4, 3, 3);
    g.generateTexture('px-flash', 11, 11).clear();
    // Impact ring, one pixel thick.
    g.lineStyle(1, 0x9ffcf0).strokeCircle(7, 7, 6);
    g.generateTexture('px-ring', 15, 15).destroy();
  }
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
