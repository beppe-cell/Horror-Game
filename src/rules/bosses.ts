/**
 * Which boss guards each floor. Bosses are not tied to floors: each run
 * deals them out in its own order, never the same one twice in a row, so
 * every boss can show up on any floor.
 */
export type BossKind = 'brood' | 'queen';

export const BOSS_KINDS: readonly BossKind[] = ['brood', 'queen'];

export const BOSS_NAMES: Record<BossKind, string> = {
  brood: 'Madre della covata',
  queen: "Regina dell'alveare",
};

/** The boss of `floor` in a run whose seed gives `roll` in [0, 1). */
export function bossFor(roll: number, floor: number): BossKind {
  const start = Math.floor(roll * BOSS_KINDS.length);
  return BOSS_KINDS[(start + Math.max(1, floor) - 1) % BOSS_KINDS.length];
}
