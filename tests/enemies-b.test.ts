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
