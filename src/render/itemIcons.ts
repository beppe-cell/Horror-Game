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
