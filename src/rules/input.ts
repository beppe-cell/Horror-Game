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

/**
 * Floating stick origin: when the finger drags farther than the radius, the
 * origin follows it, so reversing direction takes a short move instead of
 * dragging all the way back across the old centre.
 */
export function followOrigin(origin: Vec2, finger: Vec2, radius: number): Vec2 {
  const dx = finger.x - origin.x;
  const dy = finger.y - origin.y;
  const len = Math.hypot(dx, dy);
  if (len <= radius) return origin;
  const k = (len - radius) / len;
  return { x: origin.x + dx * k, y: origin.y + dy * k };
}

/** Which virtual stick a new touch belongs to: left half moves, right half shoots. */
export function touchSide(x: number, screenWidth: number): 'move' | 'shoot' {
  return x < screenWidth / 2 ? 'move' : 'shoot';
}

/**
 * Keys held down, by `KeyboardEvent.code`, in the order they were pressed.
 * A key repeat counts as a press, so a key whose first press was missed
 * (it went down while the scene was being rebuilt) is picked up again.
 */
export class HeldKeys {
  private held: string[] = [];

  down(code: string): void {
    if (!this.held.includes(code)) this.held.push(code);
  }

  up(code: string): void {
    this.held = this.held.filter((c) => c !== code);
  }

  clear(): void {
    this.held = [];
  }

  isDown(code: string): boolean {
    return this.held.includes(code);
  }

  /** The most recently pressed of `codes` still held, or null. */
  last(codes: readonly string[]): string | null {
    for (let i = this.held.length - 1; i >= 0; i--) if (codes.includes(this.held[i])) return this.held[i];
    return null;
  }
}
