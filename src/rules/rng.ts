/**
 * Seeded pseudo-random generator (mulberry32). Every random choice in a run
 * goes through an Rng so the same seed always produces the same run.
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max], both inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick on an empty list');
    return items[this.int(0, items.length - 1)];
  }
}

/** Turns a human-readable seed such as "ABCD1234" into a 32-bit number. */
export function seedFromString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const SEED_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Random 8-character seed for a new run, drawn from a non-seeded source. */
export function newSeedString(random: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 8; i++) s += SEED_ALPHABET[Math.floor(random() * SEED_ALPHABET.length)];
  return s;
}
