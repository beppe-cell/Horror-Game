/**
 * Room layout on a fixed grid. First version for M1: seeded rocks that never
 * block the doors. The full floor generator builds on top of this.
 */
import { Rng } from './rng';

export const ROOM_COLS = 13;
export const ROOM_ROWS = 7;

/** Water is shallow: the player can walk through it, shots fly over it. */
export type Cell = 'floor' | 'rock' | 'water';

export interface Door {
  col: number;
  row: number;
}

export interface RoomLayout {
  cells: Cell[][]; // [row][col]
  doors: Door[];
}

/** Door cells in the middle of each wall, just inside the room. */
export const DOOR_CELLS: readonly Door[] = [
  { col: Math.floor(ROOM_COLS / 2), row: 0 },
  { col: Math.floor(ROOM_COLS / 2), row: ROOM_ROWS - 1 },
  { col: 0, row: Math.floor(ROOM_ROWS / 2) },
  { col: ROOM_COLS - 1, row: Math.floor(ROOM_ROWS / 2) },
];

function emptyCells(): Cell[][] {
  return Array.from({ length: ROOM_ROWS }, () => Array<Cell>(ROOM_COLS).fill('floor'));
}

/** True when every given cell can reach every other one through floor cells. */
export function allConnected(cells: Cell[][], targets: readonly Door[]): boolean {
  if (targets.length === 0) return true;
  const seen = new Set<string>();
  const start = targets[0];
  if (cells[start.row][start.col] === 'rock') return false;
  const queue: Door[] = [start];
  seen.add(`${start.col},${start.row}`);
  while (queue.length) {
    const { col, row } = queue.shift()!;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = col + dc;
      const r = row + dr;
      const key = `${c},${r}`;
      if (c < 0 || r < 0 || c >= ROOM_COLS || r >= ROOM_ROWS || seen.has(key)) continue;
      if (cells[r][c] === 'rock') continue;
      seen.add(key);
      queue.push({ col: c, row: r });
    }
  }
  return targets.every((t) => seen.has(`${t.col},${t.row}`));
}

/** Options for one room. */
export interface RoomOptions {
  rockCount: number;
  /** Number of water pools (0 for a dry room). */
  waterPools?: number;
  /** Cells per pool, roughly. */
  poolSize?: number;
}

/** Grows blob-shaped pools of shallow water by a random walk from a seed cell. */
function addWater(cells: Cell[][], rng: Rng, pools: number, size: number): void {
  for (let p = 0; p < pools; p++) {
    let c = rng.int(1, ROOM_COLS - 2);
    let r = rng.int(1, ROOM_ROWS - 2);
    for (let i = 0; i < size; i++) {
      cells[r][c] = 'water';
      const [dc, dr] = rng.pick([[1, 0], [-1, 0], [0, 1], [0, -1]] as const);
      c = Math.min(ROOM_COLS - 1, Math.max(0, c + dc));
      r = Math.min(ROOM_ROWS - 1, Math.max(0, r + dr));
    }
  }
}

/**
 * Places up to `rockCount` rocks. A rock is kept only if all doors and the
 * room centre stay reachable, so a room can never be blocked.
 */
export function generateRoom(rng: Rng, doors: readonly Door[], options: RoomOptions): RoomLayout {
  const { rockCount, waterPools = 0, poolSize = 10 } = options;
  const cells = emptyCells();
  addWater(cells, rng, waterPools, poolSize);
  const centre: Door = { col: Math.floor(ROOM_COLS / 2), row: Math.floor(ROOM_ROWS / 2) };
  const mustReach = [...doors, centre];
  const isReserved = (c: number, r: number) =>
    mustReach.some((d) => Math.abs(d.col - c) + Math.abs(d.row - r) <= 1);

  let placed = 0;
  for (let attempt = 0; attempt < rockCount * 10 && placed < rockCount; attempt++) {
    const c = rng.int(0, ROOM_COLS - 1);
    const r = rng.int(0, ROOM_ROWS - 1);
    if (cells[r][c] !== 'floor' || isReserved(c, r)) continue; // rocks never go in water
    cells[r][c] = 'rock';
    if (allConnected(cells, mustReach)) placed++;
    else cells[r][c] = 'floor';
  }
  return { cells, doors: [...doors] };
}
