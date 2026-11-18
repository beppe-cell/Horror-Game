/**
 * A boss built from a list of attacks, as a pure state machine. Each boss
 * moves for a while, then winds up and does its next attack, rests, and
 * moves again, going through its attacks in turn. Below half health it
 * moves faster, rests less and fires more. Distances in tiles, times in ms.
 *
 * The attacks are the building blocks every new boss is made of: aimed
 * bursts, fans, rings, a turning cross of shots, a straight charge, a
 * vanish-and-reappear under the astronaut, a call for help and a floor slam.
 */
import type { EnemyKind } from './enemies';
import type { Vec2 } from './input';

interface Base {
  /** Wind-up before the attack, ms; the boss pulses red meanwhile. */
  windup: number;
  /** Rest after the attack, ms. */
  rest?: number;
  /** Animation names (see the boss's sheet in Enemies.ts). */
  anim: string;
  restAnim?: string;
}

export type KitAttack = Base &
  (
    | { kind: 'burst'; shots: number; every: number; speed: number; tint: number }
    | { kind: 'fan'; count: number; spread: number; speed: number; tint: number }
    | { kind: 'ring'; count: number; speed: number; tint: number }
    | { kind: 'cross'; waves: number; arms: number; turn: number; every: number; speed: number; tint: number }
    | { kind: 'charge'; ms: number; speed: number }
    | { kind: 'teleport'; under: number; emerge: number; inAnim: string; radius: number; damage: number; ring?: number; tint?: number }
    | { kind: 'summon'; enemy: EnemyKind; count: number; max: number }
    | { kind: 'slam'; radius: number; damage: number; ring?: number; tint?: number; speed?: number }
  );

export interface KitDef {
  hp: number;
  /** Walking speed, tiles per second, and when enraged. */
  speed: number;
  enragedSpeed: number;
  /** Time spent moving between attacks. */
  moveMs: number;
  /** Stays about this far from the astronaut (0 = walks right up). */
  keepAway: number;
  contactDamage: number;
  /** Hitbox at the feet, pixels. */
  body: { w: number; h: number };
  attacks: KitAttack[];
}

export type KitPhase = 'wake' | 'move' | 'windup' | 'act' | 'hidden' | 'emerge' | 'rest';

export interface KitState {
  phase: KitPhase;
  until: number;
  since: number;
  /** Attacks started so far; picks the next from the list. */
  attacks: number;
  /** Shots or waves done in the current attack. */
  done: number;
  /** Aim locked for a charge, or where a teleport ends, in tiles. */
  aim: Vec2;
  target?: Vec2;
}

export interface KitShot {
  /** Unit direction. */
  dir: Vec2;
  /** Tiles per second. */
  speed: number;
  tint: number;
}

export interface KitStep {
  state: KitState;
  velocity: Vec2;
  /** Animation to show. */
  anim: string;
  /** Pulse red: an attack is coming. */
  windup: boolean;
  shots?: KitShot[];
  /** Under the floor or folded away: no body, no hits. */
  hidden?: boolean;
  /** While hidden: where it comes back, and 0..1 of the wait done. */
  warning?: { at: Vec2; progress: number };
  /** It comes back this step, hurting within `radius` tiles. */
  emerge?: { at: Vec2; radius: number; damage: number };
  /** A floor slam around it this step. */
  slam?: { radius: number; damage: number };
  /** Call this many enemies of this kind. */
  summon?: { enemy: EnemyKind; count: number };
}

export const KIT_WAKE_MS = 1400;

export function newKit(now: number): KitState {
  return { phase: 'wake', until: now + KIT_WAKE_MS, since: now, attacks: 0, done: 0, aim: { x: 0, y: 0 } };
}

function to(s: KitState, phase: KitPhase, now: number, ms: number): KitState {
  return { ...s, phase, since: now, until: now + ms };
}

function rotate(v: Vec2, a: number): Vec2 {
  return { x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) };
}

function ring(count: number, speed: number, tint: number, turn = 0): KitShot[] {
  return Array.from({ length: count }, (_, i) => {
    const a = turn + (i / count) * Math.PI * 2;
    return { dir: { x: Math.cos(a), y: Math.sin(a) }, speed, tint };
  });
}

/** Enraged bosses fire half as many shots again. */
const more = (n: number, enraged: boolean) => (enraged ? Math.round(n * 1.5) : n);

/** The attack a boss does next. */
export function currentAttack(def: KitDef, s: KitState): KitAttack {
  return def.attacks[(s.attacks - 1 + def.attacks.length) % def.attacks.length];
}

/**
 * Advances the boss. `hpFrac` is its health from 0 to 1 and `alive` the
 * other enemies in the room (for summons).
 */
export function stepKit(def: KitDef, s: KitState, self: Vec2, player: Vec2, now: number, hpFrac: number, alive: number): KitStep {
  const enraged = hpFrac < 0.5;
  const dx = player.x - self.x;
  const dy = player.y - self.y;
  const dist = Math.hypot(dx, dy);
  const dir = dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 1, y: 0 };
  const done = now >= s.until;
  const still = { x: 0, y: 0 };
  const rest = (a: KitAttack): KitStep => ({
    state: to(s, 'rest', now, (a.rest ?? 700) * (enraged ? 0.7 : 1)),
    velocity: still,
    anim: a.restAnim ?? 'move',
    windup: false,
  });

  switch (s.phase) {
    case 'wake':
      if (!done) return { state: s, velocity: still, anim: 'move', windup: false };
      return { state: to(s, 'move', now, def.moveMs), velocity: still, anim: 'move', windup: false };
    case 'move': {
      if (!done) {
        const v = enraged ? def.enragedSpeed : def.speed;
        const away = def.keepAway > 0 ? (dist < def.keepAway - 0.5 ? -1 : dist > def.keepAway + 0.5 ? 1 : 0.2) : 1;
        // Keeping its distance, it also circles a little.
        const side = def.keepAway > 0 ? 0.5 : 0;
        const m = { x: dir.x * away - dir.y * side, y: dir.y * away + dir.x * side };
        const len = Math.hypot(m.x, m.y) || 1;
        return { state: s, velocity: { x: (m.x / len) * v, y: (m.y / len) * v }, anim: 'move', windup: false };
      }
      const next = { ...to(s, 'windup', now, 0), attacks: s.attacks + 1, done: 0, aim: dir };
      const a = currentAttack(def, next);
      return { state: { ...next, until: now + a.windup * (enraged ? 0.8 : 1) }, velocity: still, anim: a.anim, windup: true };
    }
    case 'windup': {
      const a = currentAttack(def, s);
      // Charges keep turning towards the astronaut until the last moment.
      if (!done) return { state: { ...s, aim: dir }, velocity: still, anim: a.anim, windup: true };
      switch (a.kind) {
        case 'fan': {
          const n = more(a.count, enraged);
          const shots = Array.from({ length: n }, (_, i) => ({ dir: rotate(dir, (i - (n - 1) / 2) * a.spread), speed: a.speed, tint: a.tint }));
          return { ...rest(a), shots, anim: a.anim };
        }
        case 'ring':
          return { ...rest(a), shots: ring(more(a.count, enraged), a.speed, a.tint, (now / 997) % (Math.PI * 2)), anim: a.anim };
        case 'summon': {
          const count = Math.max(0, Math.min(a.count, a.max - alive));
          return { ...rest(a), summon: count ? { enemy: a.enemy, count } : undefined, anim: a.anim };
        }
        case 'slam': {
          const shots = a.ring ? ring(more(a.ring, enraged), a.speed ?? 3, a.tint ?? 0xffffff, 0.3) : undefined;
          return { ...rest(a), slam: { radius: a.radius, damage: a.damage }, shots, anim: a.anim };
        }
        case 'teleport': {
          const next = { ...to(s, 'hidden', now, a.under), target: { ...player } };
          return { state: next, velocity: still, anim: a.anim, windup: false, hidden: true, warning: { at: next.target, progress: 0 } };
        }
        default:
          // Bursts, crosses and charges play out over time.
          return { state: { ...to(s, 'act', now, 0), done: 0 }, velocity: still, anim: a.anim, windup: false };
      }
    }
    case 'act': {
      const a = currentAttack(def, s);
      if (a.kind === 'charge') {
        if (s.done === 0) return { state: { ...s, done: 1, until: now + a.ms }, velocity: { x: s.aim.x * a.speed, y: s.aim.y * a.speed }, anim: a.anim, windup: false };
        if (!done) return { state: s, velocity: { x: s.aim.x * a.speed, y: s.aim.y * a.speed }, anim: a.anim, windup: false };
        return rest(a);
      }
      if (!done) return { state: s, velocity: still, anim: a.anim, windup: false };
      if (a.kind === 'burst') {
        const total = more(a.shots, enraged);
        if (s.done >= total) return rest(a);
        return { state: { ...s, done: s.done + 1, until: now + a.every }, velocity: still, anim: a.anim, windup: false, shots: [{ dir, speed: a.speed, tint: a.tint }] };
      }
      if (a.kind === 'cross') {
        if (s.done >= a.waves) return rest(a);
        const shots = ring(more(a.arms, enraged), a.speed, a.tint, s.done * a.turn);
        return { state: { ...s, done: s.done + 1, until: now + a.every }, velocity: still, anim: a.anim, windup: false, shots };
      }
      return rest(a);
    }
    case 'hidden': {
      const a = currentAttack(def, s);
      const target = s.target ?? player;
      if (!done) {
        const progress = Math.min(1, (now - s.since) / Math.max(1, s.until - s.since));
        return { state: s, velocity: still, anim: a.anim, windup: false, hidden: true, warning: { at: target, progress } };
      }
      const radius = a.kind === 'teleport' ? a.radius : 1;
      const damage = a.kind === 'teleport' ? a.damage : 1;
      const shots = a.kind === 'teleport' && a.ring ? ring(more(a.ring, enraged), 3, a.tint ?? 0xffffff, 0.2) : undefined;
      const emergeMs = a.kind === 'teleport' ? a.emerge : 400;
      const inAnim = a.kind === 'teleport' ? a.inAnim : a.anim;
      return {
        state: { ...to(s, 'emerge', now, emergeMs), target: undefined },
        velocity: still,
        anim: inAnim,
        windup: false,
        emerge: { at: target, radius, damage },
        shots,
      };
    }
    case 'emerge': {
      const a = currentAttack(def, s);
      if (!done) return { state: s, velocity: still, anim: a.kind === 'teleport' ? a.inAnim : a.anim, windup: false };
      return rest(a);
    }
    case 'rest': {
      const a = currentAttack(def, s);
      if (!done) return { state: s, velocity: still, anim: a.restAnim ?? 'move', windup: false };
      return { state: to(s, 'move', now, def.moveMs * (enraged ? 0.65 : 1)), velocity: still, anim: 'move', windup: false };
    }
  }
}
