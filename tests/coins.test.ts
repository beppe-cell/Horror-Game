import { describe, expect, it } from 'vitest';
import { COIN_VALUE, energyPrice, itemPrice, rollCoin } from '../src/rules/coins';
import { ITEMS, ItemId, itemQuality, rollRoomReward } from '../src/rules/items';

describe('coins', () => {
  it('drops one coin whose kind sets its value, rarer kinds worth more', () => {
    expect(rollCoin(0.9)).toBe('shard');
    expect(rollCoin(0.1)).toBe('chip');
    expect(rollCoin(0.01)).toBe('core');
    expect(COIN_VALUE.shard).toBeLessThan(COIN_VALUE.chip);
    expect(COIN_VALUE.chip).toBeLessThan(COIN_VALUE.core);
  });

  it('cleared rooms leave a coin more often than nothing special', () => {
    let coins = 0;
    for (let i = 0; i < 1000; i++) if (rollRoomReward(i / 1000, 0) === 'coin') coins++;
    expect(coins).toBeGreaterThan(300);
    expect(rollRoomReward(0.999, 0)).toBeNull();
  });
});

describe('shop prices', () => {
  it('better items cost more', () => {
    for (let q = 1; q < 4; q++) expect(itemPrice((q + 1) as 2 | 3 | 4, 1)).toBeGreaterThan(itemPrice(q as 1 | 2 | 3, 1));
  });

  it('everything costs more on deeper floors', () => {
    for (const q of [1, 2, 3, 4] as const) expect(itemPrice(q, 2)).toBeGreaterThan(itemPrice(q, 1));
    expect(energyPrice(2)).toBeGreaterThan(energyPrice(1));
  });

  it('every item has a quality, boss items the highest', () => {
    for (const id of Object.keys(ITEMS) as ItemId[]) {
      const q = itemQuality(id);
      expect(q).toBeGreaterThanOrEqual(1);
      if (ITEMS[id].boss) expect(q).toBe(4);
    }
  });
});
