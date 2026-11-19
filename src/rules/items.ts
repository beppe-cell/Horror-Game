/**
 * Items: salvaged ship technology and alien fragments. Each one changes
 * stats, the suit, or how shots behave, and adds a visual effect to the
 * astronaut (`aura`), so effects stack instead of needing a sprite per
 * combination. Items are not tied to floors: any of them can turn up
 * anywhere. Boss items are stronger and only drop from bosses.
 * Frames follow the Gemini sheets (`art/raw/items/1-items`, 4x3, and
 * `2-items`, 4x4, reading order).
 */
import type { Health } from './health';
import type { Rng } from './rng';
import type { Modifier } from './stats';
import { NEW_ITEMS, NewItemId } from './newItems';

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
  | 'crystal-shard'
  | 'twin-emitter'
  | 'seeker-chip'
  | 'overclock'
  | 'nano-repair'
  | 'grav-boots'
  | 'dog-tag'
  | 'long-scope'
  | 'alien-heart'
  | 'battery-pack'
  | 'reactive-armor'
  | 'coolant-tank'
  | 'spore-lens'
  | 'brood-heart'
  | 'tri-emitter'
  | 'queen-carapace'
  | 'plasma-overdrive'
  | NewItemId;

/**
 * A visual effect an item adds to the astronaut. All the effects of the
 * items picked up are drawn together on top of the sprite.
 */
export type AuraKind =
  | 'glow' // a coloured light around the astronaut
  | 'sparks' // sparks crackling around the blaster
  | 'trail' // a trail of particles at the feet while moving
  | 'orbit' // small motes circling the astronaut
  | 'halo' // a ring floating over the helmet
  | 'bubble' // a faint shield bubble
  | 'shimmer' // a coloured shimmer over the whole sprite
  | 'drip'; // drops falling from the astronaut

export interface Aura {
  kind: AuraKind;
  color: number;
}

export interface ItemDef {
  id: ItemId;
  /** Name shown on pickup. */
  name: string;
  /** One line on what it does. */
  hint: string;
  /** Item sheet the icon is on, and its cell. */
  sheet?: 'items' | 'items2' | 'icons1' | 'icons2' | 'icons3' | 'icons4' | 'icons5';
  frame: number;
  /** Boss items are stronger and only drop from bosses. */
  boss?: boolean;
  /** Effect drawn on the astronaut while carrying it. */
  aura: Aura;
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
  /** Two bolts side by side per shot. */
  double?: boolean;
  /** Three bolts in a fan per shot. */
  spread?: boolean;
  /** Bolts curve towards the nearest enemy. */
  homing?: boolean;
  /** When hurt, a ring of bolts bursts out. */
  retaliate?: boolean;
  /** Heals the suit fully on pickup. */
  fullHeal?: boolean;
  /** Coins given on pickup. */
  coins?: number;
  /** Only bad effects (looks harmless). */
  cursed?: boolean;
  /** Shop quality, 1 to 4 (see itemQuality). */
  quality?: 1 | 2 | 3 | 4;
  /** Unlock batch: available once this many runs have been completed (0 or missing: always). */
  tier?: number;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  'plasma-core': { id: 'plasma-core', name: 'Nucleo al plasma', hint: 'Danno +', frame: 0, color: 0x39d0ff, aura: { kind: 'glow', color: 0x39d0ff }, modifiers: [{ stat: 'damage', add: 1 }, { stat: 'damage', mul: 1.2 }] },
  'rapid-capacitor': { id: 'rapid-capacitor', name: 'Condensatore rapido', hint: 'Cadenza +', frame: 1, color: 0xffd34d, aura: { kind: 'sparks', color: 0xffd34d }, modifiers: [{ stat: 'fireRate', add: 0.7 }] },
  'extended-barrel': { id: 'extended-barrel', name: 'Canna estesa', hint: 'Gittata +', frame: 2, color: 0x7cf7d4, aura: { kind: 'sparks', color: 0x7cf7d4 }, modifiers: [{ stat: 'range', add: 2.2 }] },
  'leg-servos': { id: 'leg-servos', name: 'Servomotori delle gambe', hint: 'Velocità +', frame: 3, color: 0xff9a3c, aura: { kind: 'trail', color: 0xff9a3c }, modifiers: [{ stat: 'moveSpeed', add: 0.8 }] },
  'particle-accelerator': { id: 'particle-accelerator', name: 'Acceleratore di particelle', hint: 'Velocità dei colpi +', frame: 4, color: 0x4dffb0, aura: { kind: 'orbit', color: 0x4dffb0 }, modifiers: [{ stat: 'shotSpeed', add: 2.5 }, { stat: 'damage', add: 0.3 }] },
  'captains-coin': { id: 'captains-coin', name: 'Moneta del capitano', hint: 'Fortuna +', frame: 5, color: 0xffd34d, aura: { kind: 'halo', color: 0xffd34d }, modifiers: [{ stat: 'luck', add: 1 }] },
  'armor-plate': { id: 'armor-plate', name: 'Piastra di blindatura', hint: '+1 cella della tuta', frame: 6, color: 0xff9a3c, aura: { kind: 'shimmer', color: 0xc8ccc4 }, maxHealth: 2 },
  'shield-generator': { id: 'shield-generator', name: 'Generatore di scudo', hint: '+2 celle di scudo', frame: 7, color: 0xb8f1ff, aura: { kind: 'bubble', color: 0xb8f1ff }, shield: 4 },
  'reflecting-prism': { id: 'reflecting-prism', name: 'Prisma riflettente', hint: 'I colpi rimbalzano sui muri', frame: 8, color: 0xa070ff, aura: { kind: 'shimmer', color: 0xa070ff }, bounce: true },
  'crystal-shard': { id: 'crystal-shard', name: 'Scheggia di cristallo alieno', hint: 'I colpi perforano i nemici', frame: 9, color: 0x4dffb0, aura: { kind: 'drip', color: 0x4dffb0 }, pierce: true },
  'twin-emitter': { id: 'twin-emitter', name: 'Emettitore gemello', hint: 'Due colpi alla volta', sheet: 'items2', frame: 0, color: 0x39d0ff, aura: { kind: 'orbit', color: 0x39d0ff }, double: true, modifiers: [{ stat: 'damage', mul: 0.8 }] },
  'seeker-chip': { id: 'seeker-chip', name: 'Chip cercatore', hint: 'I colpi inseguono i nemici', sheet: 'items2', frame: 1, color: 0xff4a5a, aura: { kind: 'halo', color: 0xff4a5a }, homing: true },
  'overclock': { id: 'overclock', name: 'Sovraccarico', hint: 'Cadenza ++, danno -', sheet: 'items2', frame: 2, color: 0xff9a3c, aura: { kind: 'sparks', color: 0xff9a3c }, modifiers: [{ stat: 'fireRate', add: 1.3 }, { stat: 'damage', mul: 0.85 }] },
  'nano-repair': { id: 'nano-repair', name: 'Nanoriparatori', hint: '+1 cella, tuta riparata', sheet: 'items2', frame: 3, color: 0x4dffb0, aura: { kind: 'glow', color: 0x4dffb0 }, maxHealth: 2, fullHeal: true },
  'grav-boots': { id: 'grav-boots', name: 'Stivali gravitazionali', hint: 'Velocità +, gittata +', sheet: 'items2', frame: 4, color: 0xa070ff, aura: { kind: 'trail', color: 0xa070ff }, modifiers: [{ stat: 'moveSpeed', add: 0.5 }, { stat: 'range', add: 1 }] },
  'dog-tag': { id: 'dog-tag', name: 'Piastrina di Vega', hint: 'Fortuna ++', sheet: 'items2', frame: 5, color: 0xc8ccc4, aura: { kind: 'halo', color: 0xc8ccc4 }, modifiers: [{ stat: 'luck', add: 2 }] },
  'long-scope': { id: 'long-scope', name: 'Mirino a lungo raggio', hint: 'Gittata ++, velocità dei colpi +', sheet: 'items2', frame: 6, color: 0xff4a5a, aura: { kind: 'sparks', color: 0xff4a5a }, modifiers: [{ stat: 'range', add: 3 }, { stat: 'shotSpeed', add: 1 }] },
  'alien-heart': { id: 'alien-heart', name: 'Cuore alieno', hint: '+1 cella, danno +', sheet: 'items2', frame: 7, color: 0x8a2a3a, aura: { kind: 'drip', color: 0x8a2a3a }, maxHealth: 2, modifiers: [{ stat: 'damage', add: 0.5 }] },
  'battery-pack': { id: 'battery-pack', name: 'Batteria di riserva', hint: '+1 cella di scudo, cadenza +', sheet: 'items2', frame: 8, color: 0x39d0ff, aura: { kind: 'bubble', color: 0x39d0ff }, shield: 2, modifiers: [{ stat: 'fireRate', add: 0.3 }] },
  'reactive-armor': { id: 'reactive-armor', name: 'Corazza reattiva', hint: 'Quando sei colpito, esplode una raffica', sheet: 'items2', frame: 9, color: 0xff9a3c, aura: { kind: 'shimmer', color: 0xff9a3c }, retaliate: true },
  'coolant-tank': { id: 'coolant-tank', name: 'Serbatoio refrigerante', hint: 'Cadenza +, velocità dei colpi +', sheet: 'items2', frame: 10, color: 0xb8f1ff, aura: { kind: 'drip', color: 0xb8f1ff }, modifiers: [{ stat: 'fireRate', add: 0.4 }, { stat: 'shotSpeed', add: 1.5 }] },
  'spore-lens': { id: 'spore-lens', name: 'Lente di spore', hint: 'Danno +, fortuna +', sheet: 'items2', frame: 11, color: 0xd8e04a, aura: { kind: 'glow', color: 0xd8e04a }, modifiers: [{ stat: 'damage', add: 0.6 }, { stat: 'luck', add: 1 }] },
  'brood-heart': { id: 'brood-heart', name: 'Cuore della covata', hint: 'Danno ++, colpi perforanti', sheet: 'items2', frame: 12, color: 0xd8e04a, boss: true, aura: { kind: 'shimmer', color: 0xd8e04a }, pierce: true, modifiers: [{ stat: 'damage', mul: 1.5 }] },
  'tri-emitter': { id: 'tri-emitter', name: 'Triplo emettitore', hint: 'Tre colpi a ventaglio', sheet: 'items2', frame: 13, color: 0x7cf7d4, boss: true, aura: { kind: 'orbit', color: 0x7cf7d4 }, spread: true, modifiers: [{ stat: 'damage', mul: 0.85 }] },
  'queen-carapace': { id: 'queen-carapace', name: 'Carapace della regina', hint: '+2 celle, +2 celle di scudo', sheet: 'items2', frame: 14, color: 0x7e7896, boss: true, aura: { kind: 'bubble', color: 0xa9a3bf }, maxHealth: 4, shield: 4, fullHeal: true },
  'plasma-overdrive': { id: 'plasma-overdrive', name: 'Plasma in sovraccarico', hint: 'Cadenza ++, colpi cercatori', sheet: 'items2', frame: 15, color: 0x39d0ff, boss: true, aura: { kind: 'glow', color: 0xb8f1ff }, homing: true, modifiers: [{ stat: 'fireRate', mul: 1.5 }, { stat: 'shotSpeed', add: 3 }] },
  ...NEW_ITEMS,
};

export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];

/** Sheet cells that are not items. */
export const PEDESTAL_FRAME = 10;
export const ENERGY_CELL_FRAME = 11;

/**
 * A random item the player does not have yet, from the normal pool or (for
 * a boss reward) the boss pool, among those unlocked by `unlocked` completed
 * runs; undefined when the pool is used up.
 */
export function pickItem(rng: Rng, owned: readonly ItemId[], pool: 'normal' | 'boss' = 'normal', unlocked = 0): ItemId | undefined {
  const left = ITEM_IDS.filter((id) => !owned.includes(id) && !!ITEMS[id].boss === (pool === 'boss') && (ITEMS[id].tier ?? 0) <= unlocked);
  return left.length ? rng.pick(left) : undefined;
}

export function itemModifiers(owned: readonly ItemId[]): Modifier[] {
  return owned.flatMap((id) => ITEMS[id].modifiers ?? []);
}

export function hasEffect(owned: readonly ItemId[], effect: 'bounce' | 'pierce' | 'double' | 'spread' | 'homing' | 'retaliate'): boolean {
  return owned.some((id) => ITEMS[id][effect]);
}

/**
 * The suit after picking up an item: more cells (filled) and shield. An item
 * that takes cells away never leaves less than one cell, and never kills.
 */
export function applyItemToHealth(h: Health, id: ItemId): Health {
  const def = ITEMS[id];
  const max = Math.max(2, h.max + (def.maxHealth ?? 0));
  const hp = def.fullHeal ? max : Math.max(1, Math.min(max, h.hp + (def.maxHealth ?? 0)));
  return { ...h, max, hp, shield: h.shield + (def.shield ?? 0) };
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
 * an energy cell, a coin, or nothing.
 */
export function rollRoomReward(roll: number, luck: number): 'item' | 'energy' | 'coin' | null {
  const item = itemDropChance(luck);
  if (roll < item) return 'item';
  if (roll < item + energyDropChance(luck)) return 'energy';
  if (roll < item + energyDropChance(luck) + COIN_DROP_CHANCE) return 'coin';
  return null;
}

/** Chance (after items and energy) that a cleared room leaves a coin. */
export const COIN_DROP_CHANCE = 0.4;

/**
 * Item quality, 1 (basic) to 4 (exceptional): sets the shop price.
 * Boss items are always 4.
 */
const QUALITY: Partial<Record<ItemId, 1 | 2 | 3 | 4>> = {
  'extended-barrel': 1,
  'leg-servos': 1,
  'particle-accelerator': 1,
  'captains-coin': 1,
  'armor-plate': 1,
  'plasma-core': 2,
  'rapid-capacitor': 2,
  'shield-generator': 2,
  overclock: 2,
  'grav-boots': 2,
  'dog-tag': 2,
  'battery-pack': 2,
  'coolant-tank': 2,
  'reflecting-prism': 3,
  'crystal-shard': 3,
  'nano-repair': 3,
  'long-scope': 3,
  'alien-heart': 3,
  'spore-lens': 3,
  'reactive-armor': 3,
  'twin-emitter': 4,
  'seeker-chip': 4,
};

export function itemQuality(id: ItemId): 1 | 2 | 3 | 4 {
  return ITEMS[id].boss ? 4 : (ITEMS[id].quality ?? QUALITY[id] ?? 2);
}
