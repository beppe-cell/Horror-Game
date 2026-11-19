import { describe, expect, it } from 'vitest';
import { newHealth } from '../src/rules/health';
import { ITEMS, ITEM_IDS, applyItemToHealth, pickItem } from '../src/rules/items';
import { NEW_ITEMS } from '../src/rules/newItems';
import { Rng } from '../src/rules/rng';

describe('new items', () => {
  it('are 50, ten per unlock batch, ten per icon sheet', () => {
    const defs = Object.values(NEW_ITEMS);
    expect(defs).toHaveLength(50);
    for (let t = 1; t <= 5; t++) {
      const batch = defs.filter((d) => d.tier === t);
      expect(batch).toHaveLength(10);
      expect(new Set(batch.map((d) => d.frame)).size).toBe(10);
      expect(batch.every((d) => d.sheet === `icons${t}`)).toBe(true);
    }
  });

  it('only drop once unlocked', () => {
    const rng = new Rng(7);
    for (let i = 0; i < 200; i++) expect(ITEMS[pickItem(rng, [])!].tier ?? 0).toBe(0);
    const seen = new Set<number>();
    for (let i = 0; i < 400; i++) seen.add(ITEMS[pickItem(rng, [], 'normal', 2)!].tier ?? 0);
    expect([...seen].sort()).toEqual([0, 1, 2]);
    expect(ITEM_IDS.filter((id) => (ITEMS[id].tier ?? 0) <= 5).length).toBe(ITEM_IDS.length);
  });

  it('taking cells away never kills', () => {
    let h = newHealth(1);
    h = applyItemToHealth(h, 'unstable-core');
    expect(h.max).toBe(2);
    expect(h.hp).toBeGreaterThanOrEqual(1);
  });
});
