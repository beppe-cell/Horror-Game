/** Player statistics and the modifier stack that items apply to them. */
export type StatKey = 'damage' | 'fireRate' | 'range' | 'shotSpeed' | 'moveSpeed' | 'luck';

export type Stats = Record<StatKey, number>;

/** One change to one stat. Additions apply first, then multipliers. */
export interface Modifier {
  stat: StatKey;
  add?: number;
  mul?: number;
}

/**
 * Base astronaut stats. Units: damage per shot, shots per second, pixels of
 * travel, pixels per second, pixels per second, and a unitless luck score.
 */
export const BASE_STATS: Readonly<Stats> = {
  damage: 3.5,
  fireRate: 2.75,
  range: 650,
  shotSpeed: 900,
  moveSpeed: 420,
  luck: 0,
};

/** Lowest value each stat may reach, so stacked penalties never break the game. */
export const STAT_FLOORS: Readonly<Stats> = {
  damage: 0.5,
  fireRate: 0.5,
  range: 150,
  shotSpeed: 300,
  moveSpeed: 180,
  luck: -10,
};

export function computeStats(base: Readonly<Stats>, modifiers: readonly Modifier[]): Stats {
  const result = { ...base };
  for (const m of modifiers) if (m.add) result[m.stat] += m.add;
  for (const m of modifiers) if (m.mul !== undefined) result[m.stat] *= m.mul;
  for (const key of Object.keys(result) as StatKey[]) {
    result[key] = Math.max(STAT_FLOORS[key], result[key]);
  }
  return result;
}

/** Milliseconds between two shots for a given fire rate. */
export function fireCooldownMs(stats: Readonly<Stats>): number {
  return 1000 / stats.fireRate;
}

/** Milliseconds a projectile lives before it reaches its range. */
export function shotLifetimeMs(stats: Readonly<Stats>): number {
  return (stats.range / stats.shotSpeed) * 1000;
}
