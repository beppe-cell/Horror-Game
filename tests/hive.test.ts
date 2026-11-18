import { describe, expect, it } from 'vitest';
import { HATCH_MAX, HIVE_WEIGHTS, newEnemy, roomRoster, stepEnemy, weightsFor } from '../src/rules/enemies';
import { MAX_SWARM, QUEEN_ORDER, newQueen, nextQueenAttack, stepQueen } from '../src/rules/queen';
import { Rng } from '../src/rules/rng';

describe('hive enemies', () => {
  it('floor 2 rooms use the hive mix', () => {
    expect(weightsFor(1)).not.toBe(HIVE_WEIGHTS);
    expect(weightsFor(2)).toBe(HIVE_WEIGHTS);
    const kinds = new Set(HIVE_WEIGHTS.map(([k]) => k));
    for (let i = 0; i < 30; i++) {
      for (const k of roomRoster(new Rng(i), 5, [], HIVE_WEIGHTS)) expect(kinds.has(k)).toBe(true);
    }
  });

  it('the worker winds up, then dives in a straight line', () => {
    let s = { ...newEnemy('worker', 0, 0.3), phase: 'chase' as const, until: 0 };
    const step = stepEnemy(s, { x: 0, y: 0 }, { x: 2, y: 0 }, 2000);
    expect(step.state.phase).toBe('windup');
    s = step.state as typeof s;
    const dive = stepEnemy(s, { x: 0, y: 0 }, { x: 0, y: 2 }, 3000);
    expect(dive.state.phase).toBe('dash');
    expect(dive.velocity.x).toBeGreaterThan(0);
    expect(dive.velocity.y).toBe(0);
  });

  it('the cocoon hatches larvae a limited number of times', () => {
    let s = newEnemy('cocoon', 0, 0);
    let larvae = 0;
    for (let t = 0; t < 60000; t += 50) {
      const step = stepEnemy(s, { x: 0, y: 0 }, { x: 3, y: 0 }, t);
      larvae += step.hatch ?? 0;
      expect(step.velocity).toEqual({ x: 0, y: 0 });
      s = step.state;
    }
    expect(s.hatched).toBe(HATCH_MAX);
    expect(larvae).toBeGreaterThan(0);
  });

  it('the guardian bashes only after a wind-up', () => {
    let s = { ...newEnemy('guardian', 0, 0), phase: 'chase' as const };
    let step = stepEnemy(s, { x: 0, y: 0 }, { x: 1, y: 0 }, 2000);
    expect(step.bash).toBeFalsy();
    expect(step.state.phase).toBe('windup');
    step = stepEnemy(step.state, { x: 0, y: 0 }, { x: 1, y: 0 }, 2100);
    expect(step.bash).toBeFalsy();
    step = stepEnemy(step.state, { x: 0, y: 0 }, { x: 1, y: 0 }, 3000);
    expect(step.bash).toBe(true);
    s = step.state as typeof s;
  });
});

describe('hive queen', () => {
  it('goes through spit, charge and summon in turn', () => {
    expect(QUEEN_ORDER.map((_, i) => nextQueenAttack(i, 0))).toEqual(['spit', 'charge', 'summon']);
    expect(nextQueenAttack(2, MAX_SWARM)).toBe('spit');
  });

  it('fires a fan, charges straight, and never overfills the swarm', () => {
    let s = newQueen(0);
    let fans = 0;
    let swarm = 0;
    let charged = false;
    for (let t = 0; t < 30000; t += 50) {
      const step = stepQueen(s, { x: 0, y: 0 }, { x: 3, y: 1 }, t, 1, 3);
      if (step.fan) fans++;
      swarm = Math.max(swarm, step.swarm ?? 0);
      if (step.state.phase === 'charge') charged = true;
      s = step.state;
    }
    expect(fans).toBeGreaterThan(0);
    expect(charged).toBe(true);
    expect(swarm).toBeLessThanOrEqual(MAX_SWARM - 3);
  });
});
