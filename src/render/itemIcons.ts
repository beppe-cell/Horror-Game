/**
 * Item art: icon sheets (`items`: the first 10 items plus the pedestal and
 * the energy cell; `items2`: the 16 newer items; `icons1`…`icons5`: the 50 of the second wave) and the add-on overlay
 * sheets (`overlay-1`…`overlay-12`), all extracted from Gemini sheets by
 * `npm run items`.
 */
import Phaser from 'phaser';
import { ITEMS, ItemId } from '../rules/items';
import { OVERLAY_BOXES } from './overlayBoxes';

export const ITEMS_KEY = 'items';
export const ITEMS2_KEY = 'items2';
/** Icon sheets of the 50 newer items, 10 per sheet: frame size of each. */
export const ICON_SHEETS = {
  icons1: { w: 38, h: 42 },
  icons2: { w: 40, h: 41 },
  icons3: { w: 41, h: 40 },
  icons4: { w: 37, h: 39 },
  icons5: { w: 41, h: 48 },
} as const;

/** Texture key and frame of an item's icon. */
export function itemTexture(id: ItemId): { key: string; frame: number } {
  const def = ITEMS[id];
  return { key: def.sheet ?? ITEMS_KEY, frame: def.frame };
}

export function preloadItemArt(scene: Phaser.Scene): void {
  scene.load.spritesheet(ITEMS_KEY, 'sprites/items/items.png', { frameWidth: 42, frameHeight: 36 });
  scene.load.spritesheet(ITEMS2_KEY, 'sprites/items/items2.png', { frameWidth: 43, frameHeight: 42 });
  for (const [key, size] of Object.entries(ICON_SHEETS)) {
    scene.load.spritesheet(key, `sprites/items/${key}.png`, { frameWidth: size.w, frameHeight: size.h });
  }
  scene.load.spritesheet(COINS_KEY, 'sprites/items/coins.png', { frameWidth: 21, frameHeight: 19 });
  for (const name of SHOP_PROPS) scene.load.image(`shop-${name}`, `sprites/items/${name}.png`);
  for (const [key, sheet] of Object.entries(OVERLAY_BOXES)) {
    scene.load.spritesheet(key, `sprites/items/${key}.png`, { frameWidth: sheet.w, frameHeight: sheet.h });
  }
}

export const COINS_KEY = 'coins';
/** First frame of each coin's 6-frame spin on the `coins` sheet (rows: green, blue, gold). */
export const COIN_FRAME = { shard: 0, chip: 6, core: 12 } as const;
export const coinSpinKey = (kind: keyof typeof COIN_FRAME) => `coin-spin-${kind}`;

/** Shop furniture: a vending terminal, a dispenser and a hanging sign. */
export const SHOP_PROPS = ['terminal', 'dispenser', 'sign'] as const;

/** Spin animations of the three coins (once per game). */
export function makeCoinAnims(scene: Phaser.Scene): void {
  for (const kind of Object.keys(COIN_FRAME) as (keyof typeof COIN_FRAME)[]) {
    const key = coinSpinKey(kind);
    if (scene.anims.exists(key)) continue;
    const start = COIN_FRAME[kind];
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(COINS_KEY, { start, end: start + 5 }),
      frameRate: 10,
      repeat: -1,
    });
  }
}
