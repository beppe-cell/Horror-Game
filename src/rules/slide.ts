/**
 * Loose objects on the floor (a pickup the astronaut cannot take yet) get
 * shoved by the astronaut's boots and slide to a stop. Pure maths in pixels
 * and seconds, so it can be tested without Phaser.
 */
export interface Slider {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Slowest shove, px/s, so even a standing astronaut nudges it. */
export const MIN_PUSH = 70;
/** A shove is this much faster than the astronaut, so it slides ahead of the boots. */
export const PUSH_FACTOR = 1.3;
/** Fraction of speed kept after one second of sliding. */
export const FRICTION = 0.04;
/** Speed kept when bouncing off a wall or a rock. */
export const BOUNCE = 0.5;

/**
 * Velocity after a shove from feet at (fx, fy) moving at `playerSpeed`:
 * away from the feet, never slower than it already slides.
 */
export function shove(s: Slider, fx: number, fy: number, playerSpeed: number): Slider {
  let dx = s.x - fx;
  let dy = s.y - fy;
  const d = Math.hypot(dx, dy);
  if (d < 0.001) {
    dx = 0;
    dy = 1;
  } else {
    dx /= d;
    dy /= d;
  }
  const speed = Math.max(MIN_PUSH, playerSpeed * PUSH_FACTOR, Math.hypot(s.vx, s.vy));
  return { ...s, vx: dx * speed, vy: dy * speed };
}

/**
 * Moves a sliding object for `dt` seconds with friction. `blocked(x, y)` says
 * whether a point is inside a wall or rock: the object then bounces back on
 * that axis, losing half its speed.
 */
export function slide(s: Slider, dt: number, blocked: (x: number, y: number) => boolean): Slider {
  if (s.vx === 0 && s.vy === 0) return s;
  const keep = Math.pow(FRICTION, dt);
  let { x, y, vx, vy } = s;
  if (blocked(x + vx * dt, y)) vx = -vx * BOUNCE;
  else x += vx * dt;
  if (blocked(x, y + vy * dt)) vy = -vy * BOUNCE;
  else y += vy * dt;
  vx *= keep;
  vy *= keep;
  if (Math.hypot(vx, vy) < 4) vx = vy = 0;
  return { x, y, vx, vy };
}
