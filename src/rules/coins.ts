/**
 * Alien coins, the run's currency. A drop is always one coin; its kind sets
 * its value, so rarer kinds are worth more (like pennies, nickels and dimes).
 * All kinds are the same coin in a different colour: green 1, blue 5, gold 10.
 */
export type CoinKind = 'shard' | 'chip' | 'core';

export const COIN_VALUE: Record<CoinKind, number> = { shard: 1, chip: 5, core: 10 };

/** Display names, for the pickup flash. */
export const COIN_NAME: Record<CoinKind, string> = {
  shard: 'Moneta verde',
  chip: 'Moneta blu',
  core: "Moneta d'oro",
};

/** Which coin drops, from one roll in [0, 1): mostly shards, rarely a core. */
export function rollCoin(roll: number): CoinKind {
  if (roll < 0.05) return 'core';
  if (roll < 0.25) return 'chip';
  return 'shard';
}

/** Chance that a broken prop leaves a coin. */
export const PROP_COIN_CHANCE = 0.25;

/** Base shop price of an item by its quality (1 to 4), in coins. */
export const QUALITY_PRICE = [0, 10, 15, 22, 30] as const;
/** Base price of an energy cell. */
export const ENERGY_PRICE = 3;
/** Each floor down, shop prices go up by this fraction. */
export const PRICE_PER_FLOOR = 0.25;

/** Price of an item of this quality on this floor. */
export function itemPrice(quality: 1 | 2 | 3 | 4, floor: number): number {
  return Math.round(QUALITY_PRICE[quality] * (1 + PRICE_PER_FLOOR * Math.max(0, floor - 1)));
}

/** Price of an energy cell on this floor. */
export function energyPrice(floor: number): number {
  return ENERGY_PRICE + Math.max(0, floor - 1);
}

/** Hits a small prop takes before it breaks. */
export const PROP_HP = 2;
