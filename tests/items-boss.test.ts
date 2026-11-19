import { describe, expect, it } from 'vitest';
import { Rng } from '../src/rules/rng';
import { ITEMS, ITEM_IDS, applyItemToHealth, energyDropChance, hasEffect, itemModifiers, pickItem } from '../src/rules/items';
import { BASE_STATS, computeStats } from '../src/rules/stats';
import { heal, newHealth } from '../src/rules/health';
import { BossState, ENRAGED_RING, MAX_BROOD, RING, UNDER_MS, newBoss, nextAttack, stepBoss } from '../src/rules/boss';

describe('items', () => {
  it('never offers an item the player has, and keeps boss items for bosses', () => {
    const rng = new Rng(3);
    const normal = ITEM_IDS.filter((id) => !ITEMS[id].boss);
    const owned = normal.slice(0, normal.length - 1);
    for (let i = 0; i < 20; i++) expect(pickItem(rng, owned, 'normal', 5)).toBe(normal[normal.length - 1]);
    expect(pickItem(rng, normal, 'normal', 5)).toBeUndefined();
    for (let i = 0; i < 20; i++) expect(ITEMS[pickItem(rng, [], 'boss')!].boss).toBe(true);
  });

  it('raises stats', () => {
    const s = computeStats(BASE_STATS, itemModifiers(['plasma-core', 'rapid-capacitor', 'leg-servos']));
    expect(s.damage).toBeGreaterThan(BASE_STATS.damage);
    expect(s.fireRate).toBeGreaterThan(BASE_STATS.fireRate);
    expect(s.moveSpeed).toBeGreaterThan(BASE_STATS.moveSpeed);
    expect(s.range).toBe(BASE_STATS.range);
  });

  it('adds a filled suit cell and shield', () => {
    let h = { ...newHealth(3), hp: 3 };
    h = applyItemToHealth(h, 'armor-plate');
    expect(h).toMatchObject({ max: 8, hp: 5 });
    h = applyItemToHealth(h, 'shield-generator');
    expect(h.shield).toBe(4);
    expect(heal(h, 10).hp).toBe(8);
  });

  it('knows shot effects', () => {
    expect(hasEffect(['reflecting-prism'], 'bounce')).toBe(true);
    expect(hasEffect(['reflecting-prism'], 'pierce')).toBe(false);
  });

  it('caps the drop chance', () => {
    expect(energyDropChance(0)).toBeCloseTo(0.22);
    expect(energyDropChance(100)).toBe(0.6);
    expect(energyDropChance(-100)).toBe(0.08);
  });
});

describe('brood mother', () => {
  const run = (s: BossState, t: number, hp = 1, brood = 0, self = { x: 0, y: 0 }, player = { x: 5, y: 0 }) =>
    stepBoss(s, self, player, t, hp, brood);

  it('waits, then crawls towards the player', () => {
    let s = newBoss(0);
    expect(run(s, 100).velocity).toEqual({ x: 0, y: 0 });
    s = run(s, 2000).state;
    expect(s.phase).toBe('crawl');
    expect(run(s, 2100).velocity.x).toBeGreaterThan(0);
  });

  it('attacks in turn and fires a bigger ring when hurt', () => {
    let s: BossState = { phase: 'crawl', until: 0, since: 0, attacks: 0 };
    s = run(s, 1).state;
    expect(s.phase).toBe('spores');
    expect(run(s, 5000).ring).toBe(RING);
    expect(run(s, 5000, 0.4).ring).toBe(ENRAGED_RING);
    expect(nextAttack(1, 0)).toBe('burrow');
    expect(nextAttack(2, 0)).toBe('brood');
    expect(nextAttack(2, MAX_BROOD)).toBe('spores');
  });

  it('burrows to where the player stood, with a warning there, then bursts out', () => {
    let s: BossState = { phase: 'sink', until: 0, since: 0, attacks: 2 };
    let step = run(s, 1, 1, 0, { x: 0, y: 0 }, { x: 5, y: 0 });
    expect(step.hidden).toBe(true);
    expect(step.warning?.at).toEqual({ x: 5, y: 0 });
    s = step.state;
    // The player walks away: the spot stays where it was.
    step = run(s, 400, 1, 0, { x: 0, y: 0 }, { x: 9, y: 3 });
    expect(step.warning?.at).toEqual({ x: 5, y: 0 });
    expect(step.velocity.x).toBeGreaterThan(0);
    expect(step.warning!.progress).toBeGreaterThan(0.2);
    step = run(s, 1 + UNDER_MS, 1, 0, { x: 5, y: 0 }, { x: 9, y: 3 });
    expect(step.emerge).toBe(true);
    expect(step.state.phase).toBe('emerge');
  });

  it('never lays more than the brood cap', () => {
    const s: BossState = { phase: 'brood', until: 0, since: 0, attacks: 3 };
    expect(run(s, 1, 1, MAX_BROOD - 1).brood).toBe(1);
  });
});

describe('room rewards', () => {
  it('gives a rare item, more often an energy cell, sometimes nothing', async () => {
    const { rollRoomReward, itemDropChance } = await import('../src/rules/items');
    expect(rollRoomReward(0, 0)).toBe('item');
    expect(rollRoomReward(itemDropChance(0) + 0.01, 0)).toBe('energy');
    expect(rollRoomReward(0.99, 0)).toBeNull();
    // Luck makes items more likely.
    expect(itemDropChance(5)).toBeGreaterThan(itemDropChance(0));
  });
});
