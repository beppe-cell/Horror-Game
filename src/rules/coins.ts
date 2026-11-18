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

/** Shop prices, in coins. */
export const PRICE = { item: 15, energy: 3 };

/** Hits a small prop takes before it breaks. */
export const PROP_HP = 2;
