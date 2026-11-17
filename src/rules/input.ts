/** Input helpers shared by keyboard and gamepad code. No Phaser import. */
export interface Vec2 {
  x: number;
  y: number;
}

export type Dir4 = 'up' | 'down' | 'left' | 'right';

export const DIR4_VECTORS: Readonly<Record<Dir4, Vec2>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/**
 * Movement vector from an analog or digital input: zero inside the deadzone,
 * otherwise at most length 1, so diagonals are not faster than straight moves.
 */
export function moveVector(x: number, y: number, deadzone = 0.2): Vec2 {
  const len = Math.hypot(x, y);
  if (len < deadzone) return { x: 0, y: 0 };
  const scale = len > 1 ? 1 / len : 1;
  return { x: x * scale, y: y * scale };
}

/** Snaps a stick to one of 4 shooting directions, or null inside the deadzone. */
export function stickToDir4(x: number, y: number, deadzone = 0.35): Dir4 | null {
  if (Math.hypot(x, y) < deadzone) return null;
  if (Math.abs(x) >= Math.abs(y)) return x > 0 ? 'right' : 'left';
  return y > 0 ? 'down' : 'up';
}

/**
 * Tracks held shoot keys. While several are held, the most recently pressed
 * one wins; releasing it falls back to the previous one still held.
 */
export class ShootKeys {
  private held: Dir4[] = [];

  press(dir: Dir4): void {
    this.release(dir);
    this.held.push(dir);
  }

  release(dir: Dir4): void {
    this.held = this.held.filter((d) => d !== dir);
  }

  current(): Dir4 | null {
    return this.held.length ? this.held[this.held.length - 1] : null;
  }

  clear(): void {
    this.held = [];
  }
}

/**
 * Value of a floating virtual stick: the offset of the finger from where it
 * first touched, divided by the stick radius and capped at length 1.
 */
export function virtualStick(origin: Vec2, finger: Vec2, radius: number): Vec2 {
  const dx = finger.x - origin.x;
  const dy = finger.y - origin.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: 0, y: 0 };
  const capped = Math.min(len, radius);
  return { x: (dx / len) * (capped / radius), y: (dy / len) * (capped / radius) };
}

/** Which virtual stick a new touch belongs to: left half moves, right half shoots. */
export function touchSide(x: number, screenWidth: number): 'move' | 'shoot' {
  return x < screenWidth / 2 ? 'move' : 'shoot';
}
