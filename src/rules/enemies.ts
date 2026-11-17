/**
 * Enemies of floor 1 and their behaviour, as pure state machines so they
 * can be tested without Phaser. Distances are in tiles and times in ms.
 */
import type { Vec2 } from './input';

export type EnemyKind = 'crawler' | 'spitter' | 'miner';

export interface EnemyDef {
  kind: EnemyKind;
  hp: number;
  /** Walking speed, tiles per second (0 = never moves). */
  speed: number;
  /** Damage on touch, in half cells. */
  contactDamage: number;
  /** Hitbox size in pixels. */
  body: { w: number; h: number };
}

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  crawler: { kind: 'crawler', hp: 7, speed: 2.1, contactDamage: 1, body: { w: 18, h: 10 } },
  spitter: { kind: 'spitter', hp: 10, speed: 0, contactDamage: 1, body: { w: 20, h: 12 } },
  miner: { kind: 'miner', hp: 22, speed: 1.0, contactDamage: 2, body: { w: 16, h: 10 } },
};

/** Spitter: time between spores and spore speed (tiles/s). */
export const SPIT_EVERY_MS = 2200;
export const SPORE_SPEED = 3.2;
/** Miner: starts a charge within this range, winds up, then dashes. */
export const CHARGE_RANGE = 2.6;
export const CHARGE_WINDUP_MS = 550;
export const CHARGE_DASH_MS = 520;
export const CHARGE_SPEED = 4.2;
export const CHARGE_COOLDOWN_MS = 1400;
/** Enemies stay still this long after the room starts, like waking up. */
export const WAKE_MS = 1000;

export type Phase = 'idle' | 'chase' | 'windup' | 'dash' | 'recover';

export interface EnemyState {
  kind: EnemyKind;
  phase: Phase;
  /** When the current phase ends (wake, windup, dash, recover) or the next spit is due. */
  until: number;
  /** Dash direction while charging. */
  dir: Vec2;
  /** Per-enemy random value, 0..1: wobble and timing offsets. */
  seed: number;
}

export function newEnemy(kind: EnemyKind, now: number, seed: number): EnemyState {
  const extra = kind === 'spitter' ? 600 + seed * 900 : 0;
  return { kind, phase: 'idle', until: now + WAKE_MS + extra, dir: { x: 0, y: 0 }, seed };
}

export interface EnemyStep {
  state: EnemyState;
  /** Desired velocity, tiles per second. */
  velocity: Vec2;
  /** Direction to fire a spore in, if one is fired this step. */
  spit?: Vec2;
  /** Which animation fits: moving, attacking or resting. */
  anim: 'move' | 'attack' | 'idle';
}

const STILL: Vec2 = { x: 0, y: 0 };

function toward(from: Vec2, to: Vec2): { dir: Vec2; dist: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  return { dir: dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 0, y: 0 }, dist };
}

function scale(v: Vec2, k: number): Vec2 {
  return { x: v.x * k, y: v.y * k };
}

/** Advances one enemy. Positions are in tiles. */
export function stepEnemy(s: EnemyState, self: Vec2, player: Vec2, now: number): EnemyStep {
  const def = ENEMIES[s.kind];
  const { dir, dist } = toward(self, player);
  if (s.phase === 'idle' && now < s.until && s.kind !== 'spitter') {
    return { state: s, velocity: STILL, anim: 'idle' };
  }

  switch (s.kind) {
    case 'crawler': {
      // Chase with a slow side-to-side wobble, like a worm.
      const wob = Math.sin(now / 260 + s.seed * 6) * 0.45;
      const v = { x: (dir.x - dir.y * wob) * def.speed, y: (dir.y + dir.x * wob) * def.speed };
      return { state: { ...s, phase: 'chase' }, velocity: v, anim: 'move' };
    }
    case 'spitter': {
      if (now < s.until) return { state: s, velocity: STILL, anim: now > s.until - 450 ? 'attack' : 'idle' };
      return { state: { ...s, phase: 'chase', until: now + SPIT_EVERY_MS }, velocity: STILL, spit: dir, anim: 'attack' };
    }
    case 'miner': {
      if (s.phase === 'windup') {
        if (now < s.until) return { state: s, velocity: STILL, anim: 'attack' };
        return { state: { ...s, phase: 'dash', until: now + CHARGE_DASH_MS }, velocity: scale(s.dir, CHARGE_SPEED), anim: 'attack' };
      }
      if (s.phase === 'dash') {
        if (now < s.until) return { state: s, velocity: scale(s.dir, CHARGE_SPEED), anim: 'attack' };
        return { state: { ...s, phase: 'recover', until: now + CHARGE_COOLDOWN_MS }, velocity: STILL, anim: 'idle' };
      }
      const ready = s.phase !== 'recover' || now >= s.until;
      if (ready && dist <= CHARGE_RANGE) {
        return { state: { ...s, phase: 'windup', until: now + CHARGE_WINDUP_MS, dir }, velocity: STILL, anim: 'attack' };
      }
      return { state: { ...s, phase: ready ? 'chase' : 'recover' }, velocity: scale(dir, def.speed), anim: 'move' };
    }
  }
}
