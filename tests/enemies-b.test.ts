import { describe, expect, it } from 'vitest';
import { DRONE_FIRE_EVERY_MS, DRONE_WINDUP_MS, LURKER_RISE_MS, LURKER_SENSE, newEnemy, stepEnemy } from '../src/rules/enemies';

describe('rogue sentinel drone', () => {
  it('keeps its distance, then fires a fan of three', () => {
    let s = newEnemy('drone', 0, 0);
    // Too close: backs away.
    const near = stepEnemy({ ...s, phase: 'chase', until: 1e9 }, { x: 0, y: 0 }, { x: 1, y: 0 }, 10);
    expect(near.velocity.x).toBeLessThan(0);
    s = { ...s, phase: 'chase', until: 100 };
    const wind = stepEnemy(s, { x: 0, y: 0 }, { x: 5, y: 0 }, 200);
    expect(wind.state.phase).toBe('windup');
    const fire = stepEnemy(wind.state, { x: 0, y: 0 }, { x: 5, y: 0 }, 200 + DRONE_WINDUP_MS);
    expect(fire.fan).toHaveLength(3);
    expect(fire.fan![1].x).toBeCloseTo(1);
    expect(fire.state.until).toBe(200 + DRONE_WINDUP_MS + DRONE_FIRE_EVERY_MS);
  });
});

describe('lurker', () => {
  it('stays hidden until the astronaut comes close, then rises and strikes', () => {
    const s = newEnemy('lurker', 0, 0);
    const far = stepEnemy(s, { x: 0, y: 0 }, { x: LURKER_SENSE + 1, y: 0 }, 5000);
    expect(far.hidden).toBe(true);
    const rise = stepEnemy(s, { x: 0, y: 0 }, { x: 1, y: 0 }, 5000);
    expect(rise.state.phase).toBe('rise');
    expect(rise.hidden).toBeFalsy();
    const hit = stepEnemy(rise.state, { x: 0, y: 0 }, { x: 1, y: 0 }, 5000 + LURKER_RISE_MS);
    expect(hit.strike).toBe(true);
    const miss = stepEnemy(rise.state, { x: 0, y: 0 }, { x: 3, y: 0 }, 5000 + LURKER_RISE_MS);
    expect(miss.strike).toBe(false);
  });
});

describe('bloater', () => {
  it('drifts towards the astronaut and puffs a spore', () => {
    const s = { ...newEnemy('bloater', 0, 0), phase: 'chase' as const, until: 1e9 };
    expect(stepEnemy(s, { x: 0, y: 0 }, { x: 4, y: 0 }, 10).velocity.x).toBeGreaterThan(0);
    const puff = stepEnemy({ ...s, until: 5 }, { x: 0, y: 0 }, { x: 4, y: 0 }, 10);
    expect(puff.spit).toEqual({ x: 1, y: 0 });
  });
});

describe('room roster', () => {
  it('uses at most two kinds and respects each cap', async () => {
    const { roomRoster, MAX_PER_ROOM } = await import('../src/rules/enemies');
    const { Rng } = await import('../src/rules/rng');
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const roster = roomRoster(rng, rng.int(3, 9));
      const kinds = new Set(roster);
      expect(kinds.size).toBeGreaterThanOrEqual(1);
      expect(kinds.size).toBeLessThanOrEqual(2);
      for (const k of kinds) expect(roster.filter((x) => x === k).length).toBeLessThanOrEqual(MAX_PER_ROOM[k]);
    }
  });

  it('with a lurker already there, adds only one more kind', async () => {
    const { roomRoster } = await import('../src/rules/enemies');
    const { Rng } = await import('../src/rules/rng');
    for (let seed = 1; seed <= 100; seed++) expect(new Set(roomRoster(new Rng(seed), 5, ['lurker'])).size).toBe(1);
  });

  it('fills small kinds up to four', async () => {
    const { roomRoster } = await import('../src/rules/enemies');
    // First roll 0.99: one kind only; then a low roll picks the crawler.
    let calls = 0;
    const rng = { next: () => (calls++ === 0 ? 0.99 : 0.01), int: () => 4 };
    expect(roomRoster(rng, 6)).toEqual(['crawler', 'crawler', 'crawler', 'crawler']);
  });
});
