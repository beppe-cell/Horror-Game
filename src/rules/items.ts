/**
 * Items of floor 1: salvaged ship technology and alien fragments. Each one
 * changes stats, the suit, or how shots behave. Frames follow the Gemini
 * sheet (`art/raw/items/1-items.png`, 4x3, reading order).
 */
import type { Health } from './health';
import type { Rng } from './rng';
import type { Modifier } from './stats';

export type ItemId =
  | 'plasma-core'
  | 'rapid-capacitor'
  | 'extended-barrel'
  | 'leg-servos'
  | 'particle-accelerator'
  | 'captains-coin'
  | 'armor-plate'
  | 'shield-generator'
  | 'reflecting-prism'
  | 'crystal-shard';

export interface ItemDef {
  id: ItemId;
  /** Name shown on pickup. */
  name: string;
  /** One line on what it does. */
  hint: string;
  /** Cell on the item sheet. */
  frame: number;
  /** Accent colour, for the placeholder icon and the pickup glow. */
  color: number;
  modifiers?: Modifier[];
  /** Extra suit cells (in half cells), filled on pickup. */
  maxHealth?: number;
  /** Shield gained on pickup, in half cells. */
  shield?: number;
  /** Shots bounce off walls once. */
  bounce?: boolean;
  /** Shots go through enemies. */
  pierce?: boolean;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  'plasma-core': { id: 'plasma-core', name: 'Nucleo al plasma', hint: 'Danno +', frame: 0, color: 0x39d0ff, modifiers: [{ stat: 'damage', add: 1 }, { stat: 'damage', mul: 1.2 }] },
  'rapid-capacitor': { id: 'rapid-capacitor', name: 'Condensatore rapido', hint: 'Cadenza +', frame: 1, color: 0xffd34d, modifiers: [{ stat: 'fireRate', add: 0.7 }] },
  'extended-barrel': { id: 'extended-barrel', name: 'Canna estesa', hint: 'Gittata +', frame: 2, color: 0x7cf7d4, modifiers: [{ stat: 'range', add: 2.2 }] },
  'leg-servos': { id: 'leg-servos', name: 'Servomotori delle gambe', hint: 'Velocità +', frame: 3, color: 0xff9a3c, modifiers: [{ stat: 'moveSpeed', add: 0.8 }] },
  'particle-accelerator': { id: 'particle-accelerator', name: 'Acceleratore di particelle', hint: 'Velocità dei colpi +', frame: 4, color: 0x4dffb0, modifiers: [{ stat: 'shotSpeed', add: 2.5 }, { stat: 'damage', add: 0.3 }] },
  'captains-coin': { id: 'captains-coin', name: 'Moneta del capitano', hint: 'Fortuna +', frame: 5, color: 0xffd34d, modifiers: [{ stat: 'luck', add: 1 }] },
  'armor-plate': { id: 'armor-plate', name: 'Piastra di blindatura', hint: '+1 cella della tuta', frame: 6, color: 0xff9a3c, maxHealth: 2 },
  'shield-generator': { id: 'shield-generator', name: 'Generatore di scudo', hint: '+2 celle di scudo', frame: 7, color: 0xb8f1ff, shield: 4 },
  'reflecting-prism': { id: 'reflecting-prism', name: 'Prisma riflettente', hint: 'I colpi rimbalzano sui muri', frame: 8, color: 0xa070ff, bounce: true },
  'crystal-shard': { id: 'crystal-shard', name: 'Scheggia di cristallo alieno', hint: 'I colpi perforano i nemici', frame: 9, color: 0x4dffb0, pierce: true },
};

export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];

/** Sheet cells that are not items. */
export const PEDESTAL_FRAME = 10;
export const ENERGY_CELL_FRAME = 11;

/** A random item the player does not have yet, or undefined if they have all. */
export function pickItem(rng: Rng, owned: readonly ItemId[]): ItemId | undefined {
  const left = ITEM_IDS.filter((id) => !owned.includes(id));
  return left.length ? rng.pick(left) : undefined;
}

export function itemModifiers(owned: readonly ItemId[]): Modifier[] {
  return owned.flatMap((id) => ITEMS[id].modifiers ?? []);
}

export function hasEffect(owned: readonly ItemId[], effect: 'bounce' | 'pierce'): boolean {
  return owned.some((id) => ITEMS[id][effect]);
}

/** The suit after picking up an item: more cells (filled) and shield. */
export function applyItemToHealth(h: Health, id: ItemId): Health {
  const def = ITEMS[id];
  const max = h.max + (def.maxHealth ?? 0);
  return { ...h, max, hp: Math.min(max, h.hp + (def.maxHealth ?? 0)), shield: h.shield + (def.shield ?? 0) };
}

/**
 * Chance that a cleared room drops an energy cell. Luck adds 8% per point,
 * capped so it never becomes certain.
 */
export function energyDropChance(luck: number): number {
  return Math.max(0.08, Math.min(0.6, 0.22 + luck * 0.06));
}

/** Chance that a cleared room drops an item instead: rare, a little more with luck. */
export function itemDropChance(luck: number): number {
  return Math.max(0.03, Math.min(0.25, 0.07 + luck * 0.02));
}

/** Half cells an energy cell restores: one whole suit cell. */
export const ENERGY_HEAL = 2;

/**
 * What a cleared room leaves behind, from one roll in [0, 1): a rare item,
 * an energy cell, or nothing.
 */
export function rollRoomReward(roll: number, luck: number): 'item' | 'energy' | null {
  const item = itemDropChance(luck);
  if (roll < item) return 'item';
  if (roll < item + energyDropChance(luck)) return 'energy';
  return null;
}
