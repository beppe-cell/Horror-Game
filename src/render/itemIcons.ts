/**
 * Item art: icon sheets (`items`: the first 10 items plus the pedestal and
 * the energy cell; `items2`: the 16 newer items) and the add-on overlay
 * sheets (`overlay-1`…`overlay-7`), all extracted from Gemini sheets by
 * `npm run items`.
 */
import Phaser from 'phaser';
import { ITEMS, ItemId } from '../rules/items';
import { OVERLAY_BOXES } from './overlayBoxes';

export const ITEMS_KEY = 'items';
export const ITEMS2_KEY = 'items2';

/** Texture key and frame of an item's icon. */
export function itemTexture(id: ItemId): { key: string; frame: number } {
  const def = ITEMS[id];
  return { key: def.sheet === 'items2' ? ITEMS2_KEY : ITEMS_KEY, frame: def.frame };
}

export function preloadItemArt(scene: Phaser.Scene): void {
  scene.load.spritesheet(ITEMS_KEY, 'sprites/items/items.png', { frameWidth: 42, frameHeight: 36 });
  scene.load.spritesheet(ITEMS2_KEY, 'sprites/items/items2.png', { frameWidth: 43, frameHeight: 42 });
  for (const [key, sheet] of Object.entries(OVERLAY_BOXES)) {
    scene.load.spritesheet(key, `sprites/items/${key}.png`, { frameWidth: sheet.w, frameHeight: sheet.h });
  }
}

export const COINS_KEY = 'coins';
/** Frame of each coin kind on the `coins` sheet. */
export const COIN_FRAME = { shard: 0, chip: 1, core: 2 } as const;

/**
 * Stand-in coin art (16×16 frames) until the Gemini sheet arrives: a green
 * crystal shard (1), a blue alien token (5), a glowing red-gold core (10).
 */
export function makeCoinArt(scene: Phaser.Scene): void {
  if (scene.textures.exists(COINS_KEY)) return;
  const canvas = scene.textures.createCanvas(COINS_KEY, 48, 16)!;
  const ctx = canvas.context;
  const px = (c: string, x: number, y: number, w = 1, h = 1) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  // Shard: a small green crystal.
  px('#0b0d14', 6, 3, 4, 11);
  px('#1f8a5a', 7, 4, 2, 9);
  px('#4dffb0', 7, 4, 1, 6);
  px('#0b0d14', 5, 6, 6, 5);
  px('#1f8a5a', 6, 7, 4, 3);
  px('#b8ffe0', 7, 5, 1, 2);
  // Chip: a round blue token with a glyph.
  const o = 16;
  px('#0b0d14', o + 4, 3, 8, 10);
  px('#0b0d14', o + 3, 4, 10, 8);
  px('#2f6fd0', o + 4, 4, 8, 8);
  px('#39d0ff', o + 5, 5, 6, 6);
  px('#0b0d14', o + 7, 6, 2, 4);
  px('#b8f1ff', o + 5, 5, 2, 1);
  // Core: a red-gold orb.
  const q = 32;
  px('#0b0d14', q + 4, 2, 8, 12);
  px('#0b0d14', q + 3, 3, 10, 10);
  px('#b8862a', q + 4, 3, 8, 10);
  px('#ffd34d', q + 5, 4, 6, 8);
  px('#ff4a5a', q + 6, 6, 4, 4);
  px('#ffffff', q + 6, 5, 2, 1);
  canvas.refresh();
  for (let i = 0; i < 3; i++) canvas.add(i, 0, i * 16, 0, 16, 16);
}
