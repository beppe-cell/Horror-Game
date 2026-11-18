/**
 * Enemies of floors 1 and 2 and their behaviour, as pure state machines so they
 * can be tested without Phaser. Distances are in tiles and times in ms.
 */
import type { Vec2 } from './input';

export type EnemyKind = 'crawler' | 'spitter' | 'miner' | 'drone' | 'lurker' | 'bloater' | 'worker' | 'cocoon' | 'guardian' | 'slime' | 'jelly' | 'hunter' | 'fungus' | 'golem';

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
  drone: { kind: 'drone', hp: 8, speed: 1.7, contactDamage: 1, body: { w: 14, h: 8 } },
  lurker: { kind: 'lurker', hp: 12, speed: 0, contactDamage: 1, body: { w: 22, h: 8 } },
  bloater: { kind: 'bloater', hp: 9, speed: 0.75, contactDamage: 1, body: { w: 18, h: 8 } },
  worker: { kind: 'worker', hp: 6, speed: 2.3, contactDamage: 1, body: { w: 24, h: 14 } },
  cocoon: { kind: 'cocoon', hp: 14, speed: 0, contactDamage: 1, body: { w: 30, h: 12 } },
  guardian: { kind: 'guardian', hp: 20, speed: 0.8, contactDamage: 1, body: { w: 26, h: 12 } },
  slime: { kind: 'slime', hp: 10, speed: 1.2, contactDamage: 1, body: { w: 26, h: 10 } },
  jelly: { kind: 'jelly', hp: 9, speed: 0.8, contactDamage: 1, body: { w: 18, h: 8 } },
  hunter: { kind: 'hunter', hp: 14, speed: 1.6, contactDamage: 1, body: { w: 16, h: 10 } },
  fungus: { kind: 'fungus', hp: 16, speed: 0, contactDamage: 1, body: { w: 24, h: 10 } },
  golem: { kind: 'golem', hp: 30, speed: 0.55, contactDamage: 1, body: { w: 22, h: 10 } },
};

/** Hunter: keeps its distance, sidesteps, then throws a fast spear. */
export const HUNTER_RANGE = 3.2;
export const HUNTER_THROW_EVERY_MS = 2600;
export const HUNTER_WINDUP_MS = 500;
export const SPEAR_SPEED = 7;
/** Fungus: now and then scatters spore mines that sit on the floor for a while. */
export const FUNGUS_EVERY_MS = 3800;
export const FUNGUS_WINDUP_MS = 700;
export const FUNGUS_MINES = 3;
export const MINE_LIFE_MS = 6000;
/** Golem: slow; up close it slams the floor, hurting around it and throwing resin shards. */
export const GOLEM_RANGE = 1.6;
export const GOLEM_WINDUP_MS = 750;
export const GOLEM_RECOVER_MS = 1100;
export const GOLEM_SHARDS = 6;
export const GOLEM_DAMAGE = 2;

/**
 * Slime sizes, from the drop that dies for good (0) to the full blob (2):
 * a killed slime bigger than 0 splits into two of the next size down,
 * smaller and faster.
 */
export const SLIME_SIZES = [
  { hp: 2, speed: 2.4, scale: 0.4 },
  { hp: 5, speed: 1.7, scale: 0.55 },
  { hp: 10, speed: 1.2, scale: 0.75 },
] as const;
export const SLIME_BIG = SLIME_SIZES.length - 1;
/** Slime hop: one squash-and-leap cycle. */
export const SLIME_HOP_MS = 750;
/** Jelly: drifts at this distance, then charges up and sends out an electric ring. */
export const JELLY_RANGE = 2.2;
export const JELLY_PULSE_EVERY_MS = 3400;
export const JELLY_WINDUP_MS = 900;
export const JELLY_PULSE_RADIUS = 1.7;

/** Worker: zig-zags in, then dives at the astronaut from close range. */
export const DIVE_RANGE = 2.4;
export const DIVE_WINDUP_MS = 420;
export const DIVE_MS = 380;
export const DIVE_SPEED = 5.5;
export const DIVE_COOLDOWN_MS = 1100;
/** Cocoon: hatches two larvae now and then, at most this many times. */
export const HATCH_EVERY_MS = 4200;
export const HATCH_WINDUP_MS = 800;
export const HATCH_LARVAE = 2;
export const HATCH_MAX = 2;
/** Guardian: shots from the front bounce off its shield; it bashes from close by. */
export const BASH_RANGE = 1.5;
export const BASH_WINDUP_MS = 550;
export const BASH_RECOVER_MS = 900;
export const BASH_DAMAGE = 2;

/** Drone: keeps this far from the astronaut, then fires a fan of three bolts. */
export const DRONE_RANGE = 3.5;
export const DRONE_FIRE_EVERY_MS = 2600;
export const DRONE_WINDUP_MS = 600;
export const DRONE_FAN = 0.35;
/** Lurker: rises when the astronaut comes this close, strikes, then sinks. */
export const LURKER_SENSE = 2.4;
export const LURKER_RISE_MS = 450;
export const LURKER_UP_MS = 1400;
export const LURKER_REST_MS = 1600;
export const LURKER_REACH = 1.4;
/** Bloater: puffs a spore at the astronaut now and then; bursts into a ring when it dies. */
export const BLOAT_PUFF_EVERY_MS = 3200;
export const BLOAT_RING = 8;

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

export type Phase = 'idle' | 'chase' | 'windup' | 'dash' | 'recover' | 'hidden' | 'rise' | 'up' | 'sink';

export interface EnemyState {
  kind: EnemyKind;
  phase: Phase;
  /** When the current phase ends (wake, windup, dash, recover) or the next spit is due. */
  until: number;
  /** Dash direction while charging. */
  dir: Vec2;
  /** Per-enemy random value, 0..1: wobble and timing offsets. */
  seed: number;
  /** Times the cocoon has hatched. */
  hatched?: number;
  /** Slime size, 0 (smallest) to SLIME_BIG. */
  size?: number;
}

export function newEnemy(kind: EnemyKind, now: number, seed: number): EnemyState {
  if (kind === 'lurker') return { kind, phase: 'hidden', until: now + WAKE_MS, dir: { x: 0, y: 0 }, seed };
  const extra =
    kind === 'fungus' ? 800 + seed * 1500 : kind === 'hunter' ? 400 + seed * 1200 : kind === 'jelly' ? seed * 1500 : kind === 'spitter' ? 600 + seed * 900 : kind === 'cocoon' ? 1200 + seed * 1500 : kind === 'drone' || kind === 'bloater' ? seed * 1500 : 0;
  return { kind, phase: 'idle', until: now + WAKE_MS + extra, dir: { x: 0, y: 0 }, seed };
}

export interface EnemyStep {
  state: EnemyState;
  /** Desired velocity, tiles per second. */
  velocity: Vec2;
  /** Direction to fire a spore in, if one is fired this step. */
  spit?: Vec2;
  /** Several bolts at once (the drone's fan), as directions. */
  fan?: Vec2[];
  /** Under water: cannot be hit and does not hurt (the lurker). */
  hidden?: boolean;
  /** The lurker lashes out this step: it hurts the astronaut if within reach. */
  strike?: boolean;
  /** The guardian slams its shield down this step: hurts within BASH_RANGE. */
  bash?: boolean;
  /** The cocoon releases this many larvae this step. */
  hatch?: number;
  /** The jelly sends out its electric ring this step: hurts within JELLY_PULSE_RADIUS. */
  pulse?: boolean;
  /** The hunter throws a spear in this direction this step. */
  spear?: Vec2;
  /** The fungus scatters this many spore mines this step. */
  mines?: number;
  /** The golem slams the floor this step. */
  slam?: boolean;
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

function rotate(v: Vec2, a: number): Vec2 {
  return { x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) };
}

/** Advances one enemy. Positions are in tiles. */
export function stepEnemy(s: EnemyState, self: Vec2, player: Vec2, now: number): EnemyStep {
  const def = ENEMIES[s.kind];
  const { dir, dist } = toward(self, player);
  if (s.phase === 'idle' && now < s.until && s.kind !== 'spitter' && s.kind !== 'drone' && s.kind !== 'bloater' && s.kind !== 'cocoon' && s.kind !== 'jelly' && s.kind !== 'fungus') {
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
    case 'drone': {
      // Drifts to keep its distance, circling a little, then stops and fires.
      if (s.phase === 'windup') {
        if (now < s.until) return { state: s, velocity: STILL, anim: 'attack' };
        const fan = [-DRONE_FAN, 0, DRONE_FAN].map((a) => rotate(dir, a));
        return { state: { ...s, phase: 'chase', until: now + DRONE_FIRE_EVERY_MS }, velocity: STILL, fan, anim: 'attack' };
      }
      if (s.phase !== 'idle' && now >= s.until) {
        return { state: { ...s, phase: 'windup', until: now + DRONE_WINDUP_MS }, velocity: STILL, anim: 'attack' };
      }
      const away = dist < DRONE_RANGE - 0.5 ? -1 : dist > DRONE_RANGE + 0.5 ? 1 : 0;
      const orbit = Math.sin(now / 900 + s.seed * 6) > 0 ? 1 : -1;
      const v = { x: dir.x * away - dir.y * orbit * 0.6, y: dir.y * away + dir.x * orbit * 0.6 };
      const len = Math.hypot(v.x, v.y) || 1;
      const phase = s.phase === 'idle' && now >= s.until ? 'chase' : s.phase;
      const until = phase !== s.phase ? now + DRONE_FIRE_EVERY_MS * 0.5 : s.until;
      return { state: { ...s, phase, until }, velocity: scale({ x: v.x / len, y: v.y / len }, def.speed), anim: 'move' };
    }
    case 'lurker': {
      // Hidden in its pool until the astronaut comes close; rises, lashes out once, sinks back.
      if (s.phase === 'hidden') {
        if (now >= s.until && dist <= LURKER_SENSE) return { state: { ...s, phase: 'rise', until: now + LURKER_RISE_MS }, velocity: STILL, anim: 'attack' };
        return { state: s, velocity: STILL, anim: 'idle', hidden: true };
      }
      if (s.phase === 'rise') {
        if (now < s.until) return { state: s, velocity: STILL, anim: 'attack' };
        return { state: { ...s, phase: 'up', until: now + LURKER_UP_MS }, velocity: STILL, anim: 'attack', strike: dist <= LURKER_REACH };
      }
      if (now < s.until) return { state: s, velocity: STILL, anim: 'attack' };
      return { state: { ...s, phase: 'hidden', until: now + LURKER_REST_MS }, velocity: STILL, anim: 'idle', hidden: true };
    }
    case 'bloater': {
      // Floats slowly after the astronaut and puffs a spore now and then.
      if (s.phase === 'idle' && now < s.until) return { state: s, velocity: scale(dir, def.speed * 0.5), anim: 'move' };
      if (now >= s.until) {
        return { state: { ...s, phase: 'chase', until: now + BLOAT_PUFF_EVERY_MS }, velocity: STILL, spit: dir, anim: 'attack' };
      }
      return { state: { ...s, phase: 'chase' }, velocity: scale(dir, def.speed), anim: now > s.until - 500 ? 'attack' : 'move' };
    }
    case 'worker': {
      // Zig-zags in fast; close by it stops, rears up and dives in a straight line.
      if (s.phase === 'windup') {
        if (now < s.until) return { state: s, velocity: scale(s.dir, -0.4), anim: 'attack' };
        return { state: { ...s, phase: 'dash', until: now + DIVE_MS }, velocity: scale(s.dir, DIVE_SPEED), anim: 'attack' };
      }
      if (s.phase === 'dash') {
        if (now < s.until) return { state: s, velocity: scale(s.dir, DIVE_SPEED), anim: 'attack' };
        return { state: { ...s, phase: 'recover', until: now + DIVE_COOLDOWN_MS }, velocity: STILL, anim: 'move' };
      }
      const ready = s.phase !== 'recover' || now >= s.until;
      if (ready && dist <= DIVE_RANGE) {
        return { state: { ...s, phase: 'windup', until: now + DIVE_WINDUP_MS, dir }, velocity: STILL, anim: 'attack' };
      }
      const zig = Math.sin(now / 160 + s.seed * 6) * 1.1;
      const v = { x: dir.x - dir.y * zig, y: dir.y + dir.x * zig };
      const len = Math.hypot(v.x, v.y) || 1;
      const k = ready ? def.speed : def.speed * 0.6;
      return { state: { ...s, phase: ready ? 'chase' : 'recover' }, velocity: { x: (v.x / len) * k, y: (v.y / len) * k }, anim: 'move' };
    }
    case 'cocoon': {
      // Rooted; swells and splits open to release larvae, a couple of times.
      const hatched = s.hatched ?? 0;
      if (s.phase === 'windup') {
        if (now < s.until) return { state: s, velocity: STILL, anim: 'attack' };
        return {
          state: { ...s, phase: 'chase', until: now + HATCH_EVERY_MS, hatched: hatched + 1 },
          velocity: STILL,
          hatch: HATCH_LARVAE,
          anim: 'attack',
        };
      }
      if (now >= s.until && hatched < HATCH_MAX) {
        return { state: { ...s, phase: 'windup', until: now + HATCH_WINDUP_MS }, velocity: STILL, anim: 'attack' };
      }
      return { state: s, velocity: STILL, anim: 'idle' };
    }
    case 'guardian': {
      // Walks in behind its shield; close by it winds up and slams it down.
      if (s.phase === 'windup') {
        if (now < s.until) return { state: s, velocity: STILL, anim: 'attack' };
        return { state: { ...s, phase: 'recover', until: now + BASH_RECOVER_MS }, velocity: STILL, anim: 'attack', bash: true };
      }
      const ready = s.phase !== 'recover' || now >= s.until;
      if (ready && dist <= BASH_RANGE) {
        return { state: { ...s, phase: 'windup', until: now + BASH_WINDUP_MS, dir }, velocity: STILL, anim: 'attack' };
      }
      if (!ready) return { state: s, velocity: STILL, anim: 'idle' };
      return { state: { ...s, phase: 'chase' }, velocity: scale(dir, def.speed), anim: 'move' };
    }
    case 'slime': {
      // Hops after the astronaut: moves only in the leap part of each squash-and-leap.
      const size = SLIME_SIZES[s.size ?? SLIME_BIG];
      const t = ((now / SLIME_HOP_MS + s.seed) % 1 + 1) % 1;
      const leap = t > 0.3 && t < 0.75 ? 1.8 : 0.15;
      return { state: { ...s, phase: 'chase' }, velocity: scale(dir, size.speed * leap), anim: 'move' };
    }
    case 'jelly': {
      // Drifts near the astronaut, glows brighter, then sends out an electric ring.
      if (s.phase === 'windup') {
        if (now < s.until) return { state: s, velocity: STILL, anim: 'attack' };
        return { state: { ...s, phase: 'chase', until: now + JELLY_PULSE_EVERY_MS }, velocity: STILL, anim: 'attack', pulse: true };
      }
      if (s.phase !== 'idle' && now >= s.until) {
        return { state: { ...s, phase: 'windup', until: now + JELLY_WINDUP_MS }, velocity: STILL, anim: 'attack' };
      }
      const away = dist < JELLY_RANGE - 0.4 ? -0.5 : dist > JELLY_RANGE + 0.4 ? 1 : 0;
      const sway = Math.sin(now / 700 + s.seed * 6) * 0.5;
      const v = { x: dir.x * away - dir.y * sway, y: dir.y * away + dir.x * sway };
      const phase = s.phase === 'idle' && now >= s.until ? 'chase' : s.phase;
      const until = phase !== s.phase ? now + JELLY_PULSE_EVERY_MS * 0.6 : s.until;
      return { state: { ...s, phase, until }, velocity: scale(v, def.speed), anim: 'move' };
    }
    case 'hunter': {
      // Keeps its distance and sidesteps; stops, draws back and throws a spear.
      if (s.phase === 'windup') {
        if (now < s.until) return { state: s, velocity: STILL, anim: 'attack' };
        return { state: { ...s, phase: 'chase', until: now + HUNTER_THROW_EVERY_MS }, velocity: STILL, anim: 'attack', spear: dir };
      }
      if (now >= s.until) return { state: { ...s, phase: 'windup', until: now + HUNTER_WINDUP_MS }, velocity: STILL, anim: 'attack' };
      const away = dist < HUNTER_RANGE - 0.6 ? -1 : dist > HUNTER_RANGE + 0.6 ? 1 : 0;
      // Sidesteps change side every second or so, like dodging.
      const side = Math.floor(now / 1100 + s.seed * 4) % 2 === 0 ? 1 : -1;
      const v = { x: dir.x * away - dir.y * side * 0.8, y: dir.y * away + dir.x * side * 0.8 };
      const len = Math.hypot(v.x, v.y) || 1;
      return { state: { ...s, phase: 'chase' }, velocity: { x: (v.x / len) * def.speed, y: (v.y / len) * def.speed }, anim: 'move' };
    }
    case 'fungus': {
      if (s.phase === 'windup') {
        if (now < s.until) return { state: s, velocity: STILL, anim: 'attack' };
        return { state: { ...s, phase: 'chase', until: now + FUNGUS_EVERY_MS }, velocity: STILL, anim: 'attack', mines: FUNGUS_MINES };
      }
      if (now >= s.until) return { state: { ...s, phase: 'windup', until: now + FUNGUS_WINDUP_MS }, velocity: STILL, anim: 'attack' };
      return { state: s, velocity: STILL, anim: 'idle' };
    }
    case 'golem': {
      if (s.phase === 'windup') {
        if (now < s.until) return { state: s, velocity: STILL, anim: 'attack' };
        return { state: { ...s, phase: 'recover', until: now + GOLEM_RECOVER_MS }, velocity: STILL, anim: 'attack', slam: true };
      }
      const ready = s.phase !== 'recover' || now >= s.until;
      if (ready && dist <= GOLEM_RANGE) return { state: { ...s, phase: 'windup', until: now + GOLEM_WINDUP_MS }, velocity: STILL, anim: 'attack' };
      if (!ready) return { state: s, velocity: STILL, anim: 'idle' };
      return { state: { ...s, phase: 'chase' }, velocity: scale(dir, def.speed), anim: 'move' };
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

/** How often each kind is picked for a room's roster, by floor. */
export const SPAWN_WEIGHTS: readonly [EnemyKind, number][] = [
  ['crawler', 3],
  ['spitter', 1],
  ['drone', 1],
  ['bloater', 1],
  ['miner', 1],
];
/** The hive: only its own enemies. */
export const HIVE_WEIGHTS: readonly [EnemyKind, number][] = [
  ['worker', 3],
  ['guardian', 2],
  ['cocoon', 2],
  ['slime', 2],
  ['jelly', 2],
  ['hunter', 2],
  ['fungus', 1],
  ['golem', 1],
];
/** Every kind a room can be dealt (the lurker only comes in pools). */
export const ALL_KINDS: readonly EnemyKind[] = [
  'crawler',
  'spitter',
  'drone',
  'bloater',
  'miner',
  'worker',
  'guardian',
  'cocoon',
  'slime',
  'jelly',
  'hunter',
  'fungus',
  'golem',
];

/**
 * Enemies are not tied to floors: any kind can turn up anywhere. The first
 * two floors mostly hold their own kinds with the others mixed in now and
 * then; deeper floors deal every kind evenly.
 */
export function weightsFor(floor: number): readonly [EnemyKind, number][] {
  const home = floor === 1 ? SPAWN_WEIGHTS : floor === 2 ? HIVE_WEIGHTS : [];
  return ALL_KINDS.map((k) => {
    const own = home.find(([h]) => h === k);
    return [k, own ? own[1] * 3 : home.length ? 0.6 : 1] as [EnemyKind, number];
  });
}

/**
 * Most of one kind in a room: small, weak enemies come in groups, big ones
 * at most in pairs.
 */
export const MAX_PER_ROOM: Record<EnemyKind, number> = {
  crawler: 4,
  drone: 4,
  bloater: 2,
  spitter: 2,
  miner: 2,
  lurker: 1,
  worker: 4,
  guardian: 2,
  cocoon: 2,
  slime: 2,
  jelly: 3,
  hunter: 2,
  fungus: 2,
  golem: 1,
};

interface RosterRng {
  next(): number;
  int(min: number, max: number): number;
}

/**
 * Which enemies a room holds: at most two kinds (`taken` kinds, like a
 * lurker already in a pool, count towards the two), each up to its cap.
 * Aims for `target` enemies, but big kinds may leave the room with fewer.
 */
export function roomRoster(
  rng: RosterRng,
  target: number,
  taken: readonly EnemyKind[] = [],
  weights: readonly [EnemyKind, number][] = SPAWN_WEIGHTS,
): EnemyKind[] {
  const kinds: EnemyKind[] = [];
  // Two kinds most of the time, one otherwise; always at least one besides what is already there.
  const free = Math.max(1, 2 - taken.length);
  const want = free >= 2 && rng.next() < 0.7 ? 2 : 1;
  for (let i = 0; i < want; i++) {
    const pool = weights.filter(([k]) => !kinds.includes(k));
    const total = pool.reduce((s, [, w]) => s + w, 0);
    let roll = rng.next() * total;
    kinds.push(pool.find(([, w]) => (roll -= w) < 0)?.[0] ?? pool[0][0]);
  }
  const roster: EnemyKind[] = [];
  const count = new Map<EnemyKind, number>();
  // Deal the enemies out in turn until the target is met or every kind is full.
  for (let i = 0; roster.length < target; i++) {
    const open = kinds.filter((k) => (count.get(k) ?? 0) < MAX_PER_ROOM[k]);
    if (!open.length) break;
    const k = open[i % open.length];
    count.set(k, (count.get(k) ?? 0) + 1);
    roster.push(k);
  }
  return roster;
}
