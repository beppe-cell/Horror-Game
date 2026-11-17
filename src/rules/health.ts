/**
 * Suit integrity of the astronaut, counted in half cells (one cell = 2).
 * Temporary shield cells absorb damage first. After a hit the suit is
 * briefly invulnerable, so one contact does not drain several cells.
 */
export interface Health {
  /** Current integrity, in half cells. */
  hp: number;
  /** Maximum integrity, in half cells (always even). */
  max: number;
  /** Temporary shield, in half cells. */
  shield: number;
  /** Time (ms) until which further hits are ignored. */
  invulnerableUntil: number;
}

/** Invulnerability after a hit, in milliseconds. */
export const HURT_INVULNERABLE_MS = 1000;

export function newHealth(cells: number): Health {
  return { hp: cells * 2, max: cells * 2, shield: 0, invulnerableUntil: 0 };
}

export interface HitResult {
  health: Health;
  /** False when the hit was ignored (invulnerable or already dead). */
  took: boolean;
  dead: boolean;
}

export function applyDamage(h: Health, amount: number, now: number): HitResult {
  if (h.hp <= 0 || now < h.invulnerableUntil) return { health: h, took: false, dead: h.hp <= 0 };
  const fromShield = Math.min(h.shield, amount);
  const hp = Math.max(0, h.hp - (amount - fromShield));
  const health = { ...h, hp, shield: h.shield - fromShield, invulnerableUntil: now + HURT_INVULNERABLE_MS };
  return { health, took: true, dead: hp === 0 };
}

/** Half cells to draw for each cell icon: 2 full, 1 half, 0 empty. */
export function cellIcons(h: Health): number[] {
  const icons: number[] = [];
  for (let i = 0; i < h.max / 2; i++) icons.push(Math.max(0, Math.min(2, h.hp - i * 2)));
  return icons;
}
