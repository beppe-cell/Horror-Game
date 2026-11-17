import { describe, expect, it } from 'vitest';
import { Rng, newSeedString, seedFromString } from '../src/rules/rng';
import { BASE_STATS, STAT_FLOORS, computeStats, fireCooldownMs, shotLifetimeMs } from '../src/rules/stats';
import { ShootKeys, moveVector, stickToDir4, touchSide, virtualStick } from '../src/rules/input';
import { DOOR_CELLS, ROOM_COLS, ROOM_ROWS, allConnected, generateRoom } from '../src/rules/room';
import { normalMapFromRgba } from '../src/rules/normalmap';
import { frameView, pickQuality } from '../src/rules/view';
import { actionFrom, animKey, facingFrom } from '../src/rules/facing';
import { waterMask } from '../src/rules/waterMask';
import { castShadows } from '../src/rules/shadow';

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
    expect(shotLifetimeMs({ ...BASE_STATS, range: 6, shotSpeed: 6 })).toBe(1000);
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

describe('touch sticks', () => {
  it('scales the finger offset by the radius and caps it at 1', () => {
    expect(virtualStick({ x: 100, y: 100 }, { x: 150, y: 100 }, 100)).toEqual({ x: 0.5, y: 0 });
    const far = virtualStick({ x: 0, y: 0 }, { x: 0, y: -500 }, 100);
    expect(far.x).toBeCloseTo(0);
    expect(far.y).toBeCloseTo(-1);
    expect(virtualStick({ x: 5, y: 5 }, { x: 5, y: 5 }, 100)).toEqual({ x: 0, y: 0 });
  });

  it('sends the left half to movement and the right half to shooting', () => {
    expect(touchSide(100, 1920)).toBe('move');
    expect(touchSide(1500, 1920)).toBe('shoot');
  });
});

describe('room generation', () => {
  it('never blocks doors or the centre, across many seeds', () => {
    const centre = { col: Math.floor(ROOM_COLS / 2), row: Math.floor(ROOM_ROWS / 2) };
    for (let seed = 0; seed < 300; seed++) {
      const room = generateRoom(new Rng(seed), DOOR_CELLS, { rockCount: 25, waterPools: 2 });
      expect(allConnected(room.cells, [...DOOR_CELLS, centre])).toBe(true);
    }
  });

  it('gives the same room for the same seed', () => {
    expect(generateRoom(new Rng(9), DOOR_CELLS, { rockCount: 12, waterPools: 1 })).toEqual(generateRoom(new Rng(9), DOOR_CELLS, { rockCount: 12, waterPools: 1 }));
  });

  it('places rocks when asked', () => {
    const room = generateRoom(new Rng(3), DOOR_CELLS, { rockCount: 10 });
    const rocks = room.cells.flat().filter((c) => c === 'rock').length;
    expect(rocks).toBeGreaterThan(0);
  });

  it('adds water pools only when asked', () => {
    const count = (opts: { rockCount: number; waterPools?: number }) =>
      generateRoom(new Rng(5), DOOR_CELLS, opts).cells.flat().filter((c) => c === 'water').length;
    expect(count({ rockCount: 5 })).toBe(0);
    expect(count({ rockCount: 5, waterPools: 2 })).toBeGreaterThan(4);
  });
});

describe('normal maps', () => {
  it('gives a flat surface a normal facing the viewer', () => {
    const flat = new Uint8ClampedArray(4 * 4 * 4).fill(200);
    const n = normalMapFromRgba(flat, 4, 4);
    expect([n[0], n[1], n[2]]).toEqual([128, 128, 255]);
  });

  it('tilts normals away from a bright ridge', () => {
    const w = 5;
    const img = new Uint8ClampedArray(w * w * 4);
    for (let y = 0; y < w; y++) {
      const o = (y * w + 2) * 4;
      img.set([255, 255, 255, 255], o); // bright vertical line in column 2
    }
    const n = normalMapFromRgba(img, w, w);
    const leftOfRidge = n[(2 * w + 1) * 4]; // red channel = x
    const rightOfRidge = n[(2 * w + 3) * 4];
    expect(leftOfRidge).toBeLessThan(128);
    expect(rightOfRidge).toBeGreaterThan(128);
  });
});

describe('view framing', () => {
  it('frames a 16:9 screen like classic room-based twin-stick games', () => {
    // 13×7 interior of 32 px tiles; character frame 41 px tall.
    const v = frameView(1920, 1080, 416, 224, 32);
    expect(v.orientation).toBe('landscape');
    expect(v.follow).toBe(false);
    expect((416 * v.zoom) / 1920).toBeGreaterThan(0.65);
    expect((416 * v.zoom) / 1920).toBeLessThan(0.75);
    expect((224 * v.zoom) / 1080).toBeCloseTo(2 / 3, 1);
    expect((41 * v.zoom) / 1080).toBeCloseTo(0.12, 1);
  });

  it('follows the player in portrait with about 8 tiles across', () => {
    const v = frameView(1080, 1920, 416, 224, 32);
    expect(v.orientation).toBe('portrait');
    expect(v.follow).toBe(true);
    expect(1080 / v.zoom / 32).toBeCloseTo(8.5);
  });

  it('picks quality from the device unless the URL overrides it', () => {
    expect(pickQuality({ desktop: true })).toBe('high');
    expect(pickQuality({ desktop: false })).toBe('low');
    expect(pickQuality({ desktop: false, override: 'high' })).toBe('high');
    expect(pickQuality({ desktop: true, override: 'nonsense' })).toBe('high');
  });
});

describe('player facing and animation', () => {
  it('faces the shooting direction over the movement direction', () => {
    expect(facingFrom({ x: 1, y: 0 }, 'up', 'down')).toBe('up');
    expect(facingFrom({ x: -0.9, y: 0.2 }, null, 'down')).toBe('left');
    expect(facingFrom({ x: 0, y: 0 }, null, 'right')).toBe('right');
  });

  it('picks the sheet row and flips the side view for left', () => {
    expect(animKey('walk', 'left')).toEqual({ key: 'player-walk-side', flipX: true });
    expect(animKey('idle', 'up')).toEqual({ key: 'player-idle-up', flipX: false });
    expect(actionFrom({ x: 0, y: 0 }, true)).toBe('shoot');
    expect(actionFrom({ x: 0, y: 1 }, false)).toBe('walk');
  });
});

describe('water mask', () => {
  it('is 1 inside a pool, 0 far away and about 0.5 on the shore', () => {
    const water = Array.from({ length: 5 }, (_, r) => Array.from({ length: 9 }, (_, c) => c < 4 && r >= 0));
    const m = waterMask(water, 8, 3);
    const at = (x: number, y: number) => m.data[y * m.width + x];
    expect(at(4, 20)).toBeCloseTo(1, 2); // deep inside (column 0)
    expect(at(m.width - 2, 20)).toBeCloseTo(0, 2); // far dry side
    expect(at(32, 20)).toBeGreaterThan(0.3); // shoreline between cell 3 and 4
    expect(at(32, 20)).toBeLessThan(0.7);
  });
});

describe('cast shadows', () => {
  const lamp = (x: number, y: number) => ({ x, y, radius: 120, intensity: 1 });

  it('points away from the light', () => {
    const [s] = castShadows(100, 100, [lamp(60, 100)]);
    expect(s.angle).toBeCloseTo(0); // light on the left, shadow to the right
    expect(s.alpha).toBeGreaterThan(0);
  });

  it('is longer and fainter when the light is farther away', () => {
    const [near] = castShadows(100, 100, [lamp(100, 70)]);
    const [far] = castShadows(100, 100, [lamp(100, 10)]);
    expect(far.length).toBeGreaterThan(near.length);
    expect(far.alpha).toBeLessThan(near.alpha);
    expect(near.angle).toBeCloseTo(Math.PI / 2); // light above, shadow down the screen
  });

  it('casts one shadow per light, strongest first, up to the limit', () => {
    const shadows = castShadows(100, 100, [lamp(40, 100), lamp(100, 80), lamp(150, 100)], 40, 2);
    expect(shadows).toHaveLength(2);
    expect(shadows[0].angle).toBeCloseTo(Math.PI / 2); // nearest light (above) first
    expect(Math.abs(shadows[1].angle)).toBeCloseTo(Math.PI); // then the one on the right; the far left one is dropped
  });

  it('makes taller objects cast longer shadows', () => {
    const [short] = castShadows(100, 100, [lamp(100, 30)], 20);
    const [tall] = castShadows(100, 100, [lamp(100, 30)], 40);
    expect(tall.length).toBeGreaterThan(short.length);
  });

  it('casts nothing out of range or from a light on the object', () => {
    expect(castShadows(100, 100, [lamp(400, 100)])).toEqual([]);
    expect(castShadows(100, 100, [lamp(101, 96)])).toEqual([]);
  });
});
