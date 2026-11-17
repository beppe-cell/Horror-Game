import { describe, expect, it } from 'vitest';
import { Rng, newSeedString, seedFromString } from '../src/rules/rng';
import { BASE_STATS, STAT_FLOORS, computeStats, fireCooldownMs, shotLifetimeMs } from '../src/rules/stats';
import { ShootKeys, moveVector, stickToDir4 } from '../src/rules/input';
import { DOOR_CELLS, ROOM_COLS, ROOM_ROWS, allConnected, generateRoom } from '../src/rules/room';

describe('Rng', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(Array.from({ length: 5 }, () => b.next()));
  });

  it('keeps int() inside the inclusive range', () => {
    const rng = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng.int(2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(5);
    }
  });

  it('turns seed strings into stable numbers', () => {
    expect(seedFromString('ABCD1234')).toBe(seedFromString('ABCD1234'));
    expect(seedFromString('ABCD1234')).not.toBe(seedFromString('ABCD1235'));
    expect(newSeedString(() => 0)).toHaveLength(8);
  });
});

describe('stats', () => {
  it('applies additions before multipliers', () => {
    const s = computeStats(BASE_STATS, [
      { stat: 'damage', mul: 2 },
      { stat: 'damage', add: 1 },
    ]);
    expect(s.damage).toBeCloseTo((BASE_STATS.damage + 1) * 2);
  });

  it('never goes below the stat floors', () => {
    const s = computeStats(BASE_STATS, [{ stat: 'fireRate', add: -100 }]);
    expect(s.fireRate).toBe(STAT_FLOORS.fireRate);
  });

  it('derives cooldown and shot lifetime', () => {
    expect(fireCooldownMs({ ...BASE_STATS, fireRate: 4 })).toBe(250);
    expect(shotLifetimeMs({ ...BASE_STATS, range: 900, shotSpeed: 900 })).toBe(1000);
  });
});

describe('input', () => {
  it('normalises diagonals and applies the deadzone', () => {
    const v = moveVector(1, 1);
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1);
    expect(moveVector(0.1, 0.05)).toEqual({ x: 0, y: 0 });
  });

  it('snaps sticks to 4 directions', () => {
    expect(stickToDir4(0.9, 0.3)).toBe('right');
    expect(stickToDir4(-0.2, -0.8)).toBe('up');
    expect(stickToDir4(0.1, 0.1)).toBeNull();
  });

  it('fires toward the most recent shoot key still held', () => {
    const keys = new ShootKeys();
    keys.press('left');
    keys.press('up');
    expect(keys.current()).toBe('up');
    keys.release('up');
    expect(keys.current()).toBe('left');
    keys.release('left');
    expect(keys.current()).toBeNull();
  });
});

describe('room generation', () => {
  it('never blocks doors or the centre, across many seeds', () => {
    const centre = { col: Math.floor(ROOM_COLS / 2), row: Math.floor(ROOM_ROWS / 2) };
    for (let seed = 0; seed < 300; seed++) {
      const room = generateRoom(new Rng(seed), DOOR_CELLS, 25);
      expect(allConnected(room.cells, [...DOOR_CELLS, centre])).toBe(true);
    }
  });

  it('gives the same room for the same seed', () => {
    expect(generateRoom(new Rng(9), DOOR_CELLS, 12)).toEqual(generateRoom(new Rng(9), DOOR_CELLS, 12));
  });

  it('places rocks when asked', () => {
    const room = generateRoom(new Rng(3), DOOR_CELLS, 10);
    const rocks = room.cells.flat().filter((c) => c === 'rock').length;
    expect(rocks).toBeGreaterThan(0);
  });
});
