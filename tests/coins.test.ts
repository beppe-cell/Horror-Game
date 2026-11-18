import { describe, expect, it } from 'vitest';
import { COIN_VALUE, rollCoin } from '../src/rules/coins';
import { rollRoomReward } from '../src/rules/items';

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
