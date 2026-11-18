import { describe, expect, it } from 'vitest';
import { HURT_INVULNERABLE_MS, applyDamage, cellIcons, newHealth } from '../src/rules/health';
import { CHARGE_SPEED, WAKE_MS, newEnemy, stepEnemy } from '../src/rules/enemies';

describe('suit health', () => {
  it('takes damage, then ignores hits while invulnerable', () => {
    let r = applyDamage(newHealth(3), 1, 0);
    expect(r.took).toBe(true);
    expect(r.health.hp).toBe(5);
    r = applyDamage(r.health, 1, 500);
    expect(r.took).toBe(false);
    // Still immune just before the window ends, hurt again right after.
    r = applyDamage(r.health, 1, HURT_INVULNERABLE_MS - 1);
    expect(r.took).toBe(false);
    r = applyDamage(r.health, 2, HURT_INVULNERABLE_MS + 1);
    expect(r.health.hp).toBe(3);
    expect(cellIcons(r.health)).toEqual([2, 1, 0]);
  });

  it('uses the shield first and reports death', () => {
    let r = applyDamage({ ...newHealth(1), shield: 1 }, 2, 0);
    expect(r.health.shield).toBe(0);
    expect(r.health.hp).toBe(1);
    r = applyDamage(r.health, 5, 2000);
    expect(r.dead).toBe(true);
    expect(r.health.hp).toBe(0);
  });
});

describe('enemy behaviour', () => {
  const at = (x: number, y: number) => ({ x, y });

  it('stays still while waking up, then crawlers chase', () => {
    const s = newEnemy('crawler', 0, 0.3);
    expect(stepEnemy(s, at(0, 0), at(5, 0), 500).velocity).toEqual({ x: 0, y: 0 });
    expect(stepEnemy(s, at(0, 0), at(5, 0), WAKE_MS + 10).velocity.x).toBeGreaterThan(0);
  });

  it('makes spitters fire at the player on a cooldown, never moving', () => {
    let s = newEnemy('spitter', 0, 0);
    let fired = 0;
    for (let t = 0; t < 10000; t += 50) {
      const step = stepEnemy(s, at(0, 0), at(0, 4), t);
      if (step.spit) {
        fired++;
        expect(step.spit.y).toBeCloseTo(1);
      }
      expect(step.velocity).toEqual({ x: 0, y: 0 });
      s = step.state;
    }
    expect(fired).toBeGreaterThanOrEqual(3);
    expect(fired).toBeLessThanOrEqual(5);
  });

  it('makes miners wind up, dash at the player, then recover', () => {
    let s = newEnemy('miner', 0, 0);
    const phases: string[] = [];
    for (let t = WAKE_MS; t < WAKE_MS + 2500; t += 20) {
      const step = stepEnemy(s, at(0, 0), at(2, 0), t);
      if (phases[phases.length - 1] !== step.state.phase) phases.push(step.state.phase);
      if (step.state.phase === 'dash') expect(step.velocity.x).toBeCloseTo(CHARGE_SPEED);
      s = step.state;
    }
    expect(phases.slice(0, 3)).toEqual(['windup', 'dash', 'recover']);
  });
});
