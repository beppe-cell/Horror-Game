/**
 * How a light-emitting object varies over time. Pure functions of time so
 * every lamp in a room behaves differently and the result is testable.
 */
export type GlowKind = 'pulse' | 'flicker' | 'ember' | 'dying';

/**
 * Intensity at `time` (ms) for a light whose resting intensity is `base`.
 * - pulse: slow breathing, for bioluminescent crystals.
 * - flicker: nervous fast jitter with short sputters, for flares and fire.
 * - ember: slow uneven swell and fade, for burnt-out wreckage.
 * - dying: an electronic glow that keeps cutting out, for broken devices.
 */
export function glowIntensity(kind: GlowKind, base: number, time: number, phase: number): number {
  switch (kind) {
    case 'pulse':
      return base * (1 + 0.25 * Math.sin(time / 700 + phase));
    case 'flicker': {
      const jitter = 0.8 + 0.12 * Math.sin(time / 37 + phase) + 0.08 * Math.sin(time / 91 + phase * 2);
      const sputter = Math.sin(time / 530 + phase) > 0.93 ? 0.35 : 1;
      return base * jitter * sputter;
    }
    case 'ember': {
      const swell = 0.5 + 0.5 * Math.sin(time / 1300 + phase);
      return base * (0.55 + 0.45 * swell) * (0.9 + 0.1 * Math.sin(time / 170 + phase));
    }
    case 'dying': {
      const on = Math.sin(time / 900 + phase) + 0.4 * Math.sin(time / 230 + phase * 3) > 0.1;
      return on ? base * (0.85 + 0.15 * Math.sin(time / 23 + phase)) : base * 0.12;
    }
  }
}
