/**
 * Brood Mother, boss of floor 1, as a pure state machine. She crawls after
 * the astronaut, then attacks in turn: a ring of spores, a burrow that ends
 * under the astronaut, and a brood of crawlers. Below half health she gets
 * faster and her attacks get bigger. Distances in tiles, times in ms.
 */
import type { Vec2 } from './input';

export const BOSS_HP = 160;
export const BOSS_CONTACT_DAMAGE = 2;
/** Hitbox at her feet, in pixels. */
export const BOSS_BODY = { w: 58, h: 18 };

const SPEED = 0.85;
const ENRAGED_SPEED = 1.25;
const CRAWL_MS = 2400;
const ENRAGED_CRAWL_MS = 1500;
const SPORE_WINDUP_MS = 800;
const RECOVER_MS = 700;
const SINK_MS = 600;
const UNDER_SPEED = 3.4;
const UNDER_MIN_MS = 600;
const UNDER_MAX_MS = 1800;
const EMERGE_MS = 600;
const BROOD_WINDUP_MS = 750;
/** Spores in one ring. */
export const RING = 12;
export const ENRAGED_RING = 18;
/** Crawlers laid at once, and the most that may be alive. */
export const BROOD = 2;
export const ENRAGED_BROOD = 3;
export const MAX_BROOD = 4;
/** The astronaut is hurt if within this many tiles when she bursts out. */
export const EMERGE_RADIUS = 1.5;
export const EMERGE_DAMAGE = 2;
/** She waits this long when the room starts. */
export const BOSS_WAKE_MS = 1400;

export type BossAttack = 'spores' | 'burrow' | 'brood';
export const ATTACK_ORDER: readonly BossAttack[] = ['spores', 'burrow', 'brood'];

export type BossPhase = 'wake' | 'crawl' | 'spores' | 'sink' | 'under' | 'emerge' | 'brood' | 'recover';

export interface BossState {
  phase: BossPhase;
  until: number;
  /** Phase started at. */
  since: number;
  /** Attacks done so far; picks the next one from ATTACK_ORDER. */
  attacks: number;
}

export interface BossStep {
  state: BossState;
  /** Desired velocity, tiles per second. */
  velocity: Vec2;
  anim: 'crawl' | 'spores' | 'burrow' | 'brood' | 'idle';
  /** True while under the ground: no body, no hits. */
  hidden: boolean;
  /** Fire a ring of this many spores this step. */
  ring?: number;
  /** Lay this many crawlers this step. */
  brood?: number;
  /** She bursts out of the ground this step. */
  emerge?: boolean;
}

export function newBoss(now: number): BossState {
  return { phase: 'wake', until: now + BOSS_WAKE_MS, since: now, attacks: 0 };
}

const STILL: Vec2 = { x: 0, y: 0 };

function to(s: BossState, phase: BossPhase, now: number, ms: number): BossState {
  return { ...s, phase, since: now, until: now + ms };
}

/** Next attack, swapping the brood for spores when enough crawlers are alive. */
export function nextAttack(attacks: number, broodAlive: number): BossAttack {
  const a = ATTACK_ORDER[attacks % ATTACK_ORDER.length];
  return a === 'brood' && broodAlive >= MAX_BROOD ? 'spores' : a;
}

/**
 * Advances the boss. `hpFrac` is her health from 0 to 1 and `broodAlive`
 * the number of her crawlers still alive.
 */
export function stepBoss(s: BossState, self: Vec2, player: Vec2, now: number, hpFrac: number, broodAlive: number): BossStep {
  const enraged = hpFrac < 0.5;
  const dx = player.x - self.x;
  const dy = player.y - self.y;
  const dist = Math.hypot(dx, dy);
  const dir = dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 0, y: 0 };
  const done = now >= s.until;
  const base = { velocity: STILL, hidden: false };

  switch (s.phase) {
    case 'wake':
      return done ? { ...base, state: to(s, 'crawl', now, CRAWL_MS), anim: 'crawl' } : { ...base, state: s, anim: 'idle' };
    case 'crawl': {
      if (!done) {
        const v = enraged ? ENRAGED_SPEED : SPEED;
        return { ...base, state: s, velocity: { x: dir.x * v, y: dir.y * v }, anim: 'crawl' };
      }
      const attack = nextAttack(s.attacks, broodAlive);
      const next = { ...s, attacks: s.attacks + 1 };
      if (attack === 'spores') return { ...base, state: to(next, 'spores', now, SPORE_WINDUP_MS), anim: 'spores' };
      if (attack === 'burrow') return { ...base, state: to(next, 'sink', now, SINK_MS), anim: 'burrow' };
      return { ...base, state: to(next, 'brood', now, BROOD_WINDUP_MS), anim: 'brood' };
    }
    case 'spores':
      if (!done) return { ...base, state: s, anim: 'spores' };
      return { ...base, state: to(s, 'recover', now, RECOVER_MS), anim: 'spores', ring: enraged ? ENRAGED_RING : RING };
    case 'brood':
      if (!done) return { ...base, state: s, anim: 'brood' };
      return {
        ...base,
        state: to(s, 'recover', now, RECOVER_MS),
        anim: 'brood',
        brood: Math.max(0, Math.min(enraged ? ENRAGED_BROOD : BROOD, MAX_BROOD - broodAlive)),
      };
    case 'sink':
      if (!done) return { ...base, state: s, anim: 'burrow' };
      return { ...base, state: to(s, 'under', now, UNDER_MAX_MS), anim: 'burrow', hidden: true };
    case 'under': {
      const arrived = dist < 0.25 && now - s.since >= UNDER_MIN_MS;
      if (!done && !arrived) {
        const v = Math.min(UNDER_SPEED, dist * 6);
        return { ...base, state: s, velocity: { x: dir.x * v, y: dir.y * v }, anim: 'burrow', hidden: true };
      }
      return { ...base, state: to(s, 'emerge', now, EMERGE_MS), anim: 'burrow', emerge: true, ring: enraged ? 8 : undefined };
    }
    case 'emerge':
    case 'recover':
      if (!done) return { ...base, state: s, anim: s.phase === 'emerge' ? 'burrow' : 'idle' };
      return { ...base, state: to(s, 'crawl', now, enraged ? ENRAGED_CRAWL_MS : CRAWL_MS), anim: 'crawl' };
  }
}
