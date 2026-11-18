/**
 * Room layout on a fixed grid. First version for M1: seeded rocks that never
 * block the doors. The full floor generator builds on top of this.
 */
import { Rng } from './rng';

export const ROOM_COLS = 13;
export const ROOM_ROWS = 7;

/**
 * Water is shallow: the player can walk through it, shots fly over it.
 * `void` is solid rock inside the bounding box of an L-shaped room.
 */
export type Cell = 'floor' | 'rock' | 'water' | 'void';

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

/** Thickness of the wall around a room, in tiles. */
export const WALL = 2;
/** One floor-grid cell spans this many tiles, walls included. */
export const CELL_COLS = ROOM_COLS + 2 * WALL;
export const CELL_ROWS = ROOM_ROWS + 2 * WALL;

/** Shape of a room on the floor grid: which cells of its w×h box it fills. */
export interface RoomShape {
  w: number;
  h: number;
  /** Filled cells, as [x, y] inside the box. */
  cells: readonly (readonly [number, number])[];
}

export const SINGLE: RoomShape = { w: 1, h: 1, cells: [[0, 0]] };

/** Interior size in tiles of a room shape (its bounding box, walls excluded). */
export function interiorSize(shape: RoomShape): { cols: number; rows: number } {
  return { cols: shape.w * CELL_COLS - 2 * WALL, rows: shape.h * CELL_ROWS - 2 * WALL };
}

/**
 * Which interior tiles are floor. A tile is floor when every tile within
 * WALL of it (on the full frame, walls included) lies in a filled cell: the
 * outer walls and the inner corner of an L both end up WALL tiles thick, and
 * two joined cells open into one space.
 */
export function shapeMask(shape: RoomShape): boolean[][] {
  const { cols, rows } = interiorSize(shape);
  const filled = (fx: number, fy: number) =>
    fx >= 0 && fy >= 0 && shape.cells.some(([x, y]) => x === Math.floor(fx / CELL_COLS) && y === Math.floor(fy / CELL_ROWS));
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      for (let dy = -WALL; dy <= WALL; dy++) {
        for (let dx = -WALL; dx <= WALL; dx++) if (!filled(c + WALL + dx, r + WALL + dy)) return false;
      }
      return true;
    }),
  );
}

/** Interior tile of the door on `side` of the shape's cell (x, y). */
export function doorTile(x: number, y: number, side: 'up' | 'down' | 'left' | 'right'): Door {
  const d = DOOR_CELLS[{ up: 0, down: 1, left: 2, right: 3 }[side]];
  return { col: x * CELL_COLS + d.col, row: y * CELL_ROWS + d.row };
}

/** Centre tile of the shape's first cell: always floor, kept clear of rocks. */
export function centreTile(shape: RoomShape): Door {
  const [x, y] = shape.cells[0];
  return { col: x * CELL_COLS + Math.floor(ROOM_COLS / 2), row: y * CELL_ROWS + Math.floor(ROOM_ROWS / 2) };
}

/** True when every given cell can reach every other one through floor or water. */
export function allConnected(cells: Cell[][], targets: readonly Door[]): boolean {
  if (targets.length === 0) return true;
  const rows = cells.length;
  const cols = cells[0].length;
  const blocked = (c: number, r: number) => cells[r][c] === 'rock' || cells[r][c] === 'void';
  const seen = new Set<string>();
  const start = targets[0];
  if (blocked(start.col, start.row)) return false;
  const queue: Door[] = [start];
  seen.add(`${start.col},${start.row}`);
  while (queue.length) {
    const { col, row } = queue.shift()!;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = col + dc;
      const r = row + dr;
      const key = `${c},${r}`;
      if (c < 0 || r < 0 || c >= cols || r >= rows || seen.has(key)) continue;
      if (blocked(c, r)) continue;
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
  /** Room shape; a single 13×7 room when left out. */
  shape?: RoomShape;
}

/** Grows blob-shaped pools of shallow water by a random walk from a seed cell. */
function addWater(cells: Cell[][], rng: Rng, pools: number, size: number): void {
  const rows = cells.length;
  const cols = cells[0].length;
  for (let p = 0; p < pools; p++) {
    let c = rng.int(1, cols - 2);
    let r = rng.int(1, rows - 2);
    for (let i = 0; i < size; i++) {
      if (cells[r][c] !== 'void') cells[r][c] = 'water';
      const [dc, dr] = rng.pick([[1, 0], [-1, 0], [0, 1], [0, -1]] as const);
      c = Math.min(cols - 1, Math.max(0, c + dc));
      r = Math.min(rows - 1, Math.max(0, r + dr));
    }
  }
}

/**
 * Places up to `rockCount` rocks. A rock is kept only if all doors and the
 * room centre stay reachable, so a room can never be blocked.
 */
export function generateRoom(rng: Rng, doors: readonly Door[], options: RoomOptions): RoomLayout {
  const { rockCount, waterPools = 0, poolSize = 10, shape = SINGLE } = options;
  const mask = shapeMask(shape);
  const rows = mask.length;
  const cols = mask[0].length;
  const cells: Cell[][] = mask.map((row) => row.map((open) => (open ? 'floor' : 'void')));
  addWater(cells, rng, waterPools, poolSize);
  const centre = centreTile(shape);
  const mustReach = [...doors, centre];
  const isReserved = (c: number, r: number) =>
    mustReach.some((d) => Math.abs(d.col - c) + Math.abs(d.row - r) <= 1);

  let placed = 0;
  for (let attempt = 0; attempt < rockCount * 10 && placed < rockCount; attempt++) {
    const c = rng.int(0, cols - 1);
    const r = rng.int(0, rows - 1);
    if (cells[r][c] !== 'floor' || isReserved(c, r)) continue; // rocks never go in water
    cells[r][c] = 'rock';
    if (allConnected(cells, mustReach)) placed++;
    else cells[r][c] = 'floor';
  }
  return { cells, doors: [...doors] };
}
