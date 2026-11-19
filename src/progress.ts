/**
 * What the player has unlocked across runs, kept in the browser. Each run
 * completed (out of the trapdoor below the last floor) unlocks the next ten
 * new items. `?unlock=N` in the URL pretends N runs were completed, to try
 * the items without playing them all.
 */
const KEY = 'deepcore-runs-won';
/** Unlock batches of new items (ten items each). */
export const UNLOCK_BATCHES = 5;
export const ITEMS_PER_BATCH = 10;

/** Runs completed so far (capped at the number of batches). */
export function runsWon(): number {
  const param = Number(new URLSearchParams(window.location.search).get('unlock'));
  if (Number.isFinite(param) && param > 0) return Math.min(UNLOCK_BATCHES, Math.floor(param));
  try {
    const n = Number(window.localStorage.getItem(KEY));
    return Number.isFinite(n) ? Math.max(0, Math.min(UNLOCK_BATCHES, Math.floor(n))) : 0;
  } catch {
    return 0;
  }
}

/** Records a completed run; returns how many new items it unlocked (0 once all are). */
export function recordRunWon(): number {
  const before = runsWon();
  if (before >= UNLOCK_BATCHES) return 0;
  try {
    window.localStorage.setItem(KEY, String(before + 1));
  } catch {
    // Private mode: the unlock lasts only for this session.
  }
  return ITEMS_PER_BATCH;
}
