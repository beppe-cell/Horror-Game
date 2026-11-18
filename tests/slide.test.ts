import { describe, expect, it } from 'vitest';
import { MIN_PUSH, shove, slide } from '../src/rules/slide';

const open = () => false;

describe('sliding pickups', () => {
  it('is pushed away from the boots, at least MIN_PUSH', () => {
    const s = shove({ x: 10, y: 0, vx: 0, vy: 0 }, 0, 0, 0);
    expect(s.vx).toBeCloseTo(MIN_PUSH);
    expect(s.vy).toBe(0);
    expect(shove({ x: 0, y: 5, vx: 0, vy: 0 }, 0, 0, 200).vy).toBeCloseTo(260);
  });

  it('slides and stops by itself', () => {
    let s = { x: 0, y: 0, vx: 100, vy: 0 };
    for (let i = 0; i < 120; i++) s = slide(s, 1 / 60, open);
    expect(s.x).toBeGreaterThan(20);
    expect(s.x).toBeLessThan(40);
    expect(s.vx).toBe(0);
  });

  it('bounces off walls', () => {
    const s = slide({ x: 0, y: 0, vx: 100, vy: 0 }, 0.1, (x) => x > 5);
    expect(s.x).toBe(0);
    expect(s.vx).toBeLessThan(0);
  });
});
