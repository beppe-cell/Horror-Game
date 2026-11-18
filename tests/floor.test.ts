import { describe, expect, it } from 'vitest';
import { Rng } from '../src/rules/rng';
import { OPPOSITE, doorLinks, generateFloor, roomAt, roomCells } from '../src/rules/floor';
import { generateRoom, doorTile, interiorSize, shapeMask } from '../src/rules/room';

const STEP = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;

describe('floor layout', () => {
  it('is the same for the same seed', () => {
    expect(generateFloor(new Rng(42))).toEqual(generateFloor(new Rng(42)));
  });

  it('has one start, boss and treasure room, all reachable through matching doors', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const floor = generateFloor(new Rng(seed));
      expect(floor.rooms).toHaveLength(9);
      const kinds = floor.rooms.map((r) => r.kind);
      for (const k of ['start', 'boss', 'treasure'] as const) expect(kinds.filter((x) => x === k)).toHaveLength(1);
      // No two rooms share a grid cell.
      const cells = floor.rooms.flatMap((r) => roomCells(r).map((c) => `${c.x},${c.y}`));
      expect(new Set(cells).size).toBe(cells.length);
      // Walk the doors from the start: every room must be found, and each
      // door must meet a door of the other room on the same wall.
      const seen = new Set([0]);
      const queue = [floor.rooms[0]];
      while (queue.length) {
        const room = queue.shift()!;
        for (const link of doorLinks(floor, room)) {
          const next = floor.rooms[link.to];
          const ax = room.gx + link.x + STEP[link.side][0];
          const ay = room.gy + link.y + STEP[link.side][1];
          expect(roomAt(floor, ax, ay)).toBe(next);
          const back = doorLinks(floor, next).find((l) => l.to === room.id)!;
          expect(back.side).toBe(OPPOSITE[link.side]);
          expect([next.gx + back.x, next.gy + back.y]).toEqual([ax, ay]);
          if (!seen.has(next.id)) {
            seen.add(next.id);
            queue.push(next);
          }
        }
      }
      expect(seen.size).toBe(floor.rooms.length);
    }
  });

  it('makes big and L-shaped rooms', () => {
    const sizes = new Set<number>();
    for (let seed = 1; seed <= 50; seed++) for (const r of generateFloor(new Rng(seed)).rooms) sizes.add(r.shape.cells.length);
    expect([...sizes].sort()).toEqual([1, 2, 3, 4]);
  });

  it('puts the boss in the farthest dead end', () => {
    const floor = generateFloor(new Rng(7));
    const boss = floor.rooms.find((r) => r.kind === 'boss')!;
    expect(doorLinks(floor, boss)).toHaveLength(1);
    const deadEnds = floor.rooms.filter((r) => r.kind !== 'start' && doorLinks(floor, r).length === 1);
    expect(Math.max(...deadEnds.map((r) => r.depth))).toBe(boss.depth);
  });
});

describe('room shapes', () => {
  const L = { w: 2, h: 2, cells: [[0, 0], [0, 1], [1, 1]] as [number, number][] };

  it('opens joined cells into one space and walls off the missing corner', () => {
    const mask = shapeMask(L);
    const { cols, rows } = interiorSize(L);
    expect([cols, rows]).toEqual([30, 18]);
    expect(mask[3][14]).toBe(false); // right of the top cell: wall then rock
    expect(mask[3][12]).toBe(true);
    expect(mask[12][16]).toBe(true); // bottom row runs across both cells
    expect(mask[8][14]).toBe(false); // inner corner of the L is wall
    expect(mask[13][16]).toBe(true);
  });

  it('keeps every door reachable in an L room', () => {
    const doors = [doorTile(0, 0, 'up'), doorTile(1, 1, 'right'), doorTile(0, 1, 'down')];
    for (let seed = 1; seed <= 30; seed++) {
      const room = generateRoom(new Rng(seed), doors, { rockCount: 20, waterPools: 2, shape: L });
      for (const d of doors) expect(['floor', 'water']).toContain(room.cells[d.row][d.col]);
    }
  });
});
