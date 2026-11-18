/**
 * Hive Queen, boss of floor 2, as a pure state machine. She drags herself
 * after the astronaut, then attacks in turn: a fan of resin blobs, a charge
 * in a straight line, and a call to the swarm that brings in workers.
 * Below half health she gets faster and her attacks get bigger.
 * Distances in tiles, times in ms.
 */
import type { Vec2 } from './input';

export const QUEEN_HP = 220;
export const QUEEN_CONTACT_DAMAGE = 2;
/** Hitbox at her feet, in pixels. */
export const QUEEN_BODY = { w: 44, h: 12 };
export const QUEEN_WAKE_MS = 1400;

const SPEED = 0.8;
const ENRAGED_SPEED = 1.2;
const CRAWL_MS = 2200;
const ENRAGED_CRAWL_MS = 1400;
const SPIT_WINDUP_MS = 750;
export const SPIT_FAN = 5;
export const ENRAGED_SPIT_FAN = 7;
/** Angle between two resin blobs, radians. */
export const SPIT_SPREAD = 0.22;
const CHARGE_WINDUP_MS = 700;
const CHARGE_MS = 650;
export const QUEEN_CHARGE_SPEED = 6;
const SUMMON_WINDUP_MS = 900;
export const SWARM = 2;
export const ENRAGED_SWARM = 3;
/** Never more than this many workers alive at once. */
export const MAX_SWARM = 4;
const RECOVER_MS = 700;

export type QueenAttack = 'spit' | 'charge' | 'summon';
export const QUEEN_ORDER: readonly QueenAttack[] = ['spit', 'charge', 'summon'];

export type QueenPhase = 'wake' | 'crawl' | 'spit' | 'aim' | 'charge' | 'summon' | 'recover';

export interface QueenState {
  phase: QueenPhase;
  until: number;
  since: number;
  attacks: number;
  /** Charge direction, locked when she lowers her horns. */
  dir: Vec2;
}

export interface QueenStep {
  state: QueenState;
  velocity: Vec2;
  anim: 'crawl' | 'spit' | 'summon' | 'charge' | 'idle';
  /** Fire this many resin blobs this step, fanned around `aim`. */
  fan?: number;
  aim?: Vec2;
  /** Call this many workers this step. */
  swarm?: number;
}

export function newQueen(now: number): QueenState {
  return { phase: 'wake', until: now + QUEEN_WAKE_MS, since: now, attacks: 0, dir: { x: 0, y: 0 } };
}

const STILL: Vec2 = { x: 0, y: 0 };

function to(s: QueenState, phase: QueenPhase, now: number, ms: number): QueenState {
  return { ...s, phase, since: now, until: now + ms };
}

/** Next attack, swapping the summon for a spit when the swarm is full. */
export function nextQueenAttack(attacks: number, swarmAlive: number): QueenAttack {
  const a = QUEEN_ORDER[attacks % QUEEN_ORDER.length];
  return a === 'summon' && swarmAlive >= MAX_SWARM ? 'spit' : a;
}

/** Advances the queen. `hpFrac` is her health from 0 to 1, `swarmAlive` the enemies in the room. */
export function stepQueen(s: QueenState, self: Vec2, player: Vec2, now: number, hpFrac: number, swarmAlive: number): QueenStep {
  const enraged = hpFrac < 0.5;
  const dx = player.x - self.x;
  const dy = player.y - self.y;
  const dist = Math.hypot(dx, dy);
  const dir = dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 0, y: 0 };
  const done = now >= s.until;

  switch (s.phase) {
    case 'wake':
      return done ? { state: to(s, 'crawl', now, CRAWL_MS), velocity: STILL, anim: 'crawl' } : { state: s, velocity: STILL, anim: 'idle' };
    case 'crawl': {
      if (!done) {
        const v = enraged ? ENRAGED_SPEED : SPEED;
        return { state: s, velocity: { x: dir.x * v, y: dir.y * v }, anim: 'crawl' };
      }
      const attack = nextQueenAttack(s.attacks, swarmAlive);
      const next = { ...s, attacks: s.attacks + 1 };
      if (attack === 'spit') return { state: to(next, 'spit', now, SPIT_WINDUP_MS), velocity: STILL, anim: 'spit' };
      if (attack === 'charge') return { state: { ...to(next, 'aim', now, CHARGE_WINDUP_MS), dir }, velocity: STILL, anim: 'charge' };
      return { state: to(next, 'summon', now, SUMMON_WINDUP_MS), velocity: STILL, anim: 'summon' };
    }
    case 'spit':
      if (!done) return { state: s, velocity: STILL, anim: 'spit' };
      return { state: to(s, 'recover', now, RECOVER_MS), velocity: STILL, anim: 'spit', fan: enraged ? ENRAGED_SPIT_FAN : SPIT_FAN, aim: dir };
    case 'aim':
      // She keeps turning towards the astronaut until the last moment.
      if (!done) return { state: { ...s, dir }, velocity: STILL, anim: 'charge' };
      return { state: to(s, 'charge', now, CHARGE_MS), velocity: { x: s.dir.x * QUEEN_CHARGE_SPEED, y: s.dir.y * QUEEN_CHARGE_SPEED }, anim: 'charge' };
    case 'charge':
      if (!done) return { state: s, velocity: { x: s.dir.x * QUEEN_CHARGE_SPEED, y: s.dir.y * QUEEN_CHARGE_SPEED }, anim: 'charge' };
      return { state: to(s, 'recover', now, RECOVER_MS + 300), velocity: STILL, anim: 'idle' };
    case 'summon':
      if (!done) return { state: s, velocity: STILL, anim: 'summon' };
      return {
        state: to(s, 'recover', now, RECOVER_MS),
        velocity: STILL,
        anim: 'summon',
        swarm: Math.max(0, Math.min(enraged ? ENRAGED_SWARM : SWARM, MAX_SWARM - swarmAlive)),
      };
    case 'recover':
      if (!done) return { state: s, velocity: STILL, anim: 'idle' };
      return { state: to(s, 'crawl', now, enraged ? ENRAGED_CRAWL_MS : CRAWL_MS), velocity: STILL, anim: 'crawl' };
  }
}
