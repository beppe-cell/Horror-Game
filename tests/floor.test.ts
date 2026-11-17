import { describe, expect, it } from 'vitest';
import { Rng } from '../src/rules/rng';
import { OPPOSITE, doorSides, generateFloor, neighbour } from '../src/rules/floor';

describe('floor layout', () => {
  it('is the same for the same seed', () => {
    expect(generateFloor(new Rng(42))).toEqual(generateFloor(new Rng(42)));
  });

  it('has one start, boss and treasure room, all reachable', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const floor = generateFloor(new Rng(seed));
      expect(floor.rooms).toHaveLength(9);
      const kinds = floor.rooms.map((r) => r.kind);
      for (const k of ['start', 'boss', 'treasure'] as const) expect(kinds.filter((x) => x === k)).toHaveLength(1);
      // Walk the doors from the start: every room must be found.
      const seen = new Set([0]);
      const queue = [floor.rooms[0]];
      while (queue.length) {
        const room = queue.shift()!;
        for (const side of doorSides(floor, room)) {
          const next = neighbour(floor, room, side)!;
          expect(neighbour(floor, next, OPPOSITE[side])).toBe(room);
          if (!seen.has(next.id)) {
            seen.add(next.id);
            queue.push(next);
          }
        }
      }
      expect(seen.size).toBe(floor.rooms.length);
    }
  });

  it('puts the boss in the farthest dead end', () => {
    const floor = generateFloor(new Rng(7));
    const boss = floor.rooms.find((r) => r.kind === 'boss')!;
    expect(doorSides(floor, boss)).toHaveLength(1);
    const deadEnds = floor.rooms.filter((r) => r.kind !== 'start' && doorSides(floor, r).length === 1);
    expect(Math.max(...deadEnds.map((r) => r.depth))).toBe(boss.depth);
  });
});
