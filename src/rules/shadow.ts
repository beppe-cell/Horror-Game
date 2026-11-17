/**
 * Shadow cast on the floor by a standing character from nearby lights.
 * The shadow starts at the feet and points away from the strongest light;
 * it gets longer as the light gets farther and lower, and fainter as the
 * light gets weaker. The character's own suit lamp casts nothing, since it
 * sits on the character.
 */
export interface ShadowLight {
  x: number;
  y: number;
  radius: number;
  intensity: number;
}

export interface CastShadow {
  /** Direction from the feet, in radians (0 = right, π/2 = down the screen). */
  angle: number;
  /** Length as a multiple of the contact shadow width. */
  length: number;
  /** Opacity, 0 to 1. */
  alpha: number;
}

/** Height of the light sources above the floor and of the character, in pixels. */
const LIGHT_HEIGHT = 16;
const BODY_HEIGHT = 40;

export function castShadow(feetX: number, feetY: number, lights: readonly ShadowLight[]): CastShadow | null {
  let best: { light: ShadowLight; strength: number; dist: number } | null = null;
  for (const light of lights) {
    const dist = Math.hypot(feetX - light.x, feetY - light.y);
    if (dist < 4 || dist >= light.radius) continue;
    const fall = 1 - dist / light.radius;
    const strength = fall * fall * light.intensity;
    if (!best || strength > best.strength) best = { light, strength, dist };
  }
  if (!best || best.strength < 0.03) return null;
  const angle = Math.atan2(feetY - best.light.y, feetX - best.light.x);
  // Similar triangles: a body of height H lit from height h at distance d
  // casts a shadow d·H/(h−…); clamp it so it stays readable.
  const raw = (best.dist * BODY_HEIGHT) / (LIGHT_HEIGHT * 60);
  const length = Math.min(2.4, Math.max(0.8, raw));
  const alpha = Math.min(0.7, best.strength * 2.6);
  return { angle, length, alpha };
}
