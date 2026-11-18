/**
 * Which boss guards each floor. Bosses are not tied to floors: each run
 * deals them out in its own shuffled order, so every boss can show up on
 * any floor and no two floors of a run share one.
 */
import type { KitDef } from './bossKit';

export type BossKind = 'brood' | 'queen' | 'colossus' | 'oracle' | 'warlord' | 'amalgam' | 'reactor';

export const BOSS_KINDS: readonly BossKind[] = ['brood', 'queen', 'colossus', 'oracle', 'warlord', 'amalgam', 'reactor'];

export const BOSS_NAMES: Record<BossKind, string> = {
  brood: 'Madre della covata',
  queen: "Regina dell'alveare",
  colossus: 'Colosso di rottami',
  oracle: 'Oracolo del vuoto',
  warlord: 'Signore dei cacciatori',
  amalgam: 'Amalgama',
  reactor: 'Stella del reattore',
};

/**
 * The boss of `floor` in a run whose seed gives `roll` in [0, 1): a shuffle
 * of all bosses drawn from the roll, read in order floor by floor.
 */
export function bossFor(roll: number, floor: number): BossKind {
  const order = [...BOSS_KINDS];
  let x = Math.floor(roll * 2 ** 31) || 1;
  for (let i = order.length - 1; i > 0; i--) {
    // Small linear congruential steps: the same roll, the same order.
    x = (x * 1103515245 + 12345) % 2 ** 31;
    const j = x % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order[(Math.max(1, floor) - 1) % order.length];
}

const GREEN = 0x4dffb0;
const VIOLET = 0xc8a0ff;
const AMBER = 0xffb040;
const RED = 0xff5a6a;
const FIRE = 0xffd34d;

/** The bosses made from attack lists (see rules/bossKit.ts). */
export const KIT_BOSSES: Record<'colossus' | 'oracle' | 'warlord' | 'amalgam' | 'reactor', KitDef> = {
  // Walks in, fires its cannon, charges with the drill and then overheats:
  // the moment to shoot it.
  colossus: {
    hp: 260,
    speed: 0.7,
    enragedSpeed: 1.0,
    moveMs: 2200,
    keepAway: 0,
    contactDamage: 2,
    body: { w: 44, h: 14 },
    attacks: [
      { kind: 'burst', shots: 3, every: 260, speed: 4.2, tint: GREEN, windup: 700, anim: 'cannon' },
      { kind: 'charge', ms: 700, speed: 5.5, windup: 650, anim: 'drill', rest: 1600, restAnim: 'overheat' },
      { kind: 'fan', count: 5, spread: 0.25, speed: 3.6, tint: GREEN, windup: 700, anim: 'cannon' },
    ],
  },
  // Keeps away, turns a cross of beams, vanishes and comes back under the astronaut.
  oracle: {
    hp: 220,
    speed: 0.8,
    enragedSpeed: 1.1,
    moveMs: 1800,
    keepAway: 3.5,
    contactDamage: 1,
    body: { w: 30, h: 12 },
    attacks: [
      { kind: 'cross', waves: 4, arms: 4, turn: 0.35, every: 420, speed: 3.4, tint: VIOLET, windup: 800, anim: 'beams' },
      { kind: 'teleport', under: 1300, emerge: 500, inAnim: 'in', radius: 1.3, damage: 1, ring: 8, tint: VIOLET, windup: 400, anim: 'out' },
      { kind: 'ring', count: 12, speed: 3, tint: VIOLET, windup: 700, anim: 'beams' },
    ],
  },
  // Lunges with its glaive, throws spears in a fan and calls its hunters.
  warlord: {
    hp: 240,
    speed: 1.0,
    enragedSpeed: 1.4,
    moveMs: 1800,
    keepAway: 0,
    contactDamage: 2,
    body: { w: 26, h: 12 },
    attacks: [
      { kind: 'charge', ms: 450, speed: 7, windup: 550, anim: 'lunge', rest: 800 },
      { kind: 'fan', count: 3, spread: 0.3, speed: 6.5, tint: GREEN, windup: 600, anim: 'spears' },
      { kind: 'summon', enemy: 'hunter', count: 2, max: 3, windup: 900, anim: 'cry' },
    ],
  },
  // Lashes with spiked tendrils, melts into the floor and rises under the astronaut.
  amalgam: {
    hp: 280,
    speed: 0.6,
    enragedSpeed: 0.9,
    moveMs: 2000,
    keepAway: 0,
    contactDamage: 2,
    body: { w: 50, h: 14 },
    attacks: [
      { kind: 'slam', radius: 2, damage: 2, ring: 10, tint: 0xc8d0e0, speed: 3, windup: 800, anim: 'lash' },
      { kind: 'teleport', under: 1600, emerge: 600, inAnim: 'reform', radius: 1.5, damage: 2, windup: 500, anim: 'melt' },
      { kind: 'burst', shots: 4, every: 300, speed: 3.8, tint: RED, windup: 600, anim: 'lash' },
    ],
  },
  // Floats, bursts in rings of fire, throws lightning and cools down exposed.
  reactor: {
    hp: 240,
    speed: 0.7,
    enragedSpeed: 1.0,
    moveMs: 1800,
    keepAway: 2.5,
    contactDamage: 2,
    body: { w: 34, h: 12 },
    attacks: [
      { kind: 'ring', count: 14, speed: 3.2, tint: FIRE, windup: 900, anim: 'nova' },
      { kind: 'burst', shots: 5, every: 180, speed: 5.5, tint: AMBER, windup: 600, anim: 'arc', rest: 1500, restAnim: 'cool' },
      { kind: 'cross', waves: 5, arms: 6, turn: 0.25, every: 300, speed: 3.4, tint: FIRE, windup: 800, anim: 'nova' },
    ],
  },
};
