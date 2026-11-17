/**
 * Shadows cast on the floor by something standing on it (the astronaut, a
 * rock, a crystal) from the lights around it: flying shots and crystals.
 * Each shadow starts at the base of the object and points away from its
 * light; it gets longer as the light gets farther and the object taller,
 * and fainter as the light gets weaker. A light sitting on the object (the
 * suit lamp, a crystal's own glow) casts nothing for it.
 */
export interface ShadowLight {
  x: number;
  y: number;
  radius: number;
  intensity: number;
}

export interface CastShadow {
  /** Direction from the base, in radians (0 = right, π/2 = down the screen). */
  angle: number;
  /** Length on the floor, in pixels from the base of the object. */
  length: number;
  /** Opacity, 0 to 1. */
  alpha: number;
}

/** Height of the light sources above the floor, in pixels (shots fly at blaster height). */
const LIGHT_HEIGHT = 16;
/** Height of the astronaut, in pixels. */
export const PLAYER_HEIGHT = 40;
/** Shadow length limits, in pixels. */
const MIN_LENGTH = 8;
const MAX_LENGTH = 56;
/** A light closer than this to the base is on the object itself. */
const OWN_LIGHT_DISTANCE = 16;

/**
 * Up to `max` shadows for an object of the given height, strongest first.
 */
export function castShadows(
  baseX: number,
  baseY: number,
  lights: readonly ShadowLight[],
  height = PLAYER_HEIGHT,
  max = 2,
): CastShadow[] {
  const found: (CastShadow & { strength: number })[] = [];
  for (const light of lights) {
    const dist = Math.hypot(baseX - light.x, baseY - light.y);
    if (dist < OWN_LIGHT_DISTANCE || dist >= light.radius) continue;
    const fall = 1 - dist / light.radius;
    const strength = fall * fall * light.intensity;
    if (strength < 0.03) continue;
    // Similar triangles: taller objects and lower, farther lights make
    // longer shadows (scaled down: lights are not point sources). Clamped
    // so they stay readable and never cross the whole room.
    const raw = (dist * height) / (LIGHT_HEIGHT * 2.5);
    found.push({
      angle: Math.atan2(baseY - light.y, baseX - light.x),
      length: Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, raw)),
      alpha: Math.min(0.7, strength * 2.6),
      strength,
    });
  }
  return found
    .sort((a, b) => b.strength - a.strength)
    .slice(0, max)
    .map(({ angle, length, alpha }) => ({ angle, length, alpha }));
}
