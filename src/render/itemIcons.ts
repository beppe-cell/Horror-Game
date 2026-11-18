/**
 * Item icon textures. The first 10 items are on the Gemini sheet `items`;
 * the newer ones use `items2`, drawn here as simple stand-ins (a coloured
 * gem on a dark chip) until their Gemini sheet arrives.
 */
import Phaser from 'phaser';
import { ITEMS, ItemId } from '../rules/items';
import { makeLitTexture } from './pixelArt';

export const ITEMS_KEY = 'items';
export const ITEMS2_KEY = 'items2';
const W = 42;
const H = 36;

/** Texture key and frame of an item's icon. */
export function itemTexture(id: ItemId): { key: string; frame: number } {
  const def = ITEMS[id];
  return { key: def.sheet === 'items2' ? ITEMS2_KEY : ITEMS_KEY, frame: def.frame };
}

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

/** Draws the stand-in `items2` sheet (4×4 cells of 42×36) unless it was loaded. */
export function makeItems2(scene: Phaser.Scene): void {
  if (scene.textures.exists(ITEMS2_KEY)) return;
  const defs = Object.values(ITEMS).filter((d) => d.sheet === 'items2');
  makeLitTexture(scene, ITEMS2_KEY, W * 4, H * 4, (ctx) => {
    for (const d of defs) {
      const x = (d.frame % 4) * W + W / 2;
      const y = Math.floor(d.frame / 4) * H + H / 2;
      // Dark metal chip with an outline.
      ctx.fillStyle = '#0b0d14';
      ctx.fillRect(x - 11, y - 11, 22, 22);
      ctx.fillStyle = d.boss ? '#5a3a20' : '#2e3440';
      ctx.fillRect(x - 10, y - 10, 20, 20);
      // A gem in the item's colour; boss items get a gold frame and a bigger gem.
      const r = d.boss ? 7 : 6;
      ctx.fillStyle = '#0b0d14';
      ctx.beginPath();
      ctx.moveTo(x, y - r - 1);
      ctx.lineTo(x + r + 1, y);
      ctx.lineTo(x, y + r + 1);
      ctx.lineTo(x - r - 1, y);
      ctx.fill();
      ctx.fillStyle = hex(d.color);
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r, y);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 2, y - 3, 2, 2);
      if (d.boss) {
        ctx.strokeStyle = '#ffd34d';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 10.5, y - 10.5, 21, 21);
      }
    }
  });
  const tex = scene.textures.get(ITEMS2_KEY);
  for (let i = 0; i < 16; i++) tex.add(i, 0, (i % 4) * W, Math.floor(i / 4) * H, W, H);
}
