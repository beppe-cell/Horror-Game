import Phaser from 'phaser';
import type { Cell } from '../rules/room';

const MAX_RIPPLES = 8;
const MAX_LIGHTS = 4;

/**
 * Water surface for one room, drawn by a fragment shader over the floor:
 * refraction of the floor through animated waves, depth tint, caustics,
 * ripples from footsteps and shots, specular highlights from the lights,
 * and foam at the shore. The water mask comes from the room cells, sampled
 * with linear filtering so the shoreline is smooth rather than blocky.
 */
const FRAGMENT = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#define MAX_RIPPLES ${MAX_RIPPLES}
#define MAX_LIGHTS ${MAX_LIGHTS}
uniform sampler2D uFloor;
uniform sampler2D uMask;
uniform float uTime;
uniform vec2 uSize;
uniform vec4 uRipples[MAX_RIPPLES];
uniform vec4 uLights[MAX_LIGHTS];
uniform float uHigh;
varying vec2 outTexCoord;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Water height at a point in room pixels.
float heightAt(vec2 p) {
  vec2 t = p / 32.0;
  float h = noise(t * 1.3 + vec2(uTime * 0.25, uTime * 0.18)) * 0.5;
  h += noise(t * 2.9 - vec2(uTime * 0.31, -uTime * 0.21)) * 0.25 * uHigh;
  for (int i = 0; i < MAX_RIPPLES; i++) {
    vec4 r = uRipples[i];
    float age = uTime - r.z;
    if (r.w <= 0.0 || age < 0.0 || age > 2.5) continue;
    float d = distance(p, r.xy) / 32.0;
    float front = age * 2.2;
    float ring = exp(-pow((d - front) * 3.0, 2.0));
    h += sin((d - front) * 12.0) * ring * exp(-age * 1.4) * r.w;
  }
  return h;
}

void main() {
  float m = texture2D(uMask, outTexCoord).r;
  float mask = smoothstep(0.38, 0.62, m);
  if (mask < 0.01) discard;
  vec2 p = outTexCoord * uSize; // room pixels, y up
  float e = 1.0;
  float hx = heightAt(p + vec2(e, 0.0)) - heightAt(p - vec2(e, 0.0));
  float hy = heightAt(p + vec2(0.0, e)) - heightAt(p - vec2(0.0, e));
  vec3 n = normalize(vec3(-hx * 2.2, -hy * 2.2, 1.0));

  // Refraction: the floor seen through the moving surface.
  vec2 uv = outTexCoord + n.xy * (6.0 / uSize);
  vec3 floorCol = texture2D(uFloor, uv).rgb;
  float depth = smoothstep(0.5, 1.0, m);
  vec3 deep = vec3(0.02, 0.10, 0.16);
  vec3 col = mix(floorCol * vec3(0.55, 0.85, 0.95), deep, 0.30 + 0.45 * depth);

  // Caustics: thin bright lines dancing on the bottom.
  vec2 cp = p / 32.0 * 2.2 + n.xy * 0.6;
  float c1 = noise(cp + vec2(uTime * 0.6, uTime * 0.4));
  float c2 = noise(cp * 1.7 - vec2(uTime * 0.5, -uTime * 0.7));
  float caustic = pow(1.0 - abs(c1 - c2), 20.0) * (0.16 + 0.18 * uHigh);
  col += vec3(0.45, 0.9, 1.0) * caustic * (1.0 - depth * 0.5);

  // Specular glints from each light (xy in room pixels, z radius, w intensity).
  for (int i = 0; i < MAX_LIGHTS; i++) {
    vec4 L = uLights[i];
    if (L.w <= 0.0) continue;
    vec3 toL = vec3(L.xy - p, 40.0);
    float dist = length(toL.xy);
    float fall = clamp(1.0 - dist / L.z, 0.0, 1.0);
    vec3 h = normalize(normalize(toL) + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(n, h), 0.0), 90.0) * fall * L.w;
    col += vec3(0.8, 0.95, 1.0) * spec * 1.6;
    col += vec3(0.1, 0.25, 0.3) * fall * L.w * 0.25; // light scattered in the water
  }

  // Foam where the water meets the floor.
  float shore = 1.0 - smoothstep(0.0, 0.28, abs(m - 0.5));
  float foam = shore * (0.5 + 0.5 * noise(p / 6.0 + uTime));
  col = mix(col, vec3(0.75, 0.92, 0.98), foam * 0.45);

  float alpha = mask * 0.94;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

interface Ripple {
  x: number;
  y: number;
  t: number;
  strength: number;
}

export interface WaterLight {
  x: number;
  y: number;
  radius: number;
  intensity: number;
}

export class Water {
  readonly shader: Phaser.GameObjects.Shader | null;
  private ripples: Ripple[] = [];
  private nextRipple = 0;
  private lights: WaterLight[] = [];
  private maskKey: string;

  /**
   * @param x left of the room interior in world pixels
   * @param y top of the room interior in world pixels
   */
  constructor(
    private scene: Phaser.Scene,
    cells: Cell[][],
    floorKey: string,
    private x: number,
    private y: number,
    private width: number,
    private height: number,
    high: boolean,
  ) {
    this.maskKey = `water-mask-${floorKey}`;
    const hasWater = cells.some((row) => row.includes('water'));
    if (!hasWater) {
      this.shader = null;
      return;
    }
    this.makeMask(cells);
    const start = scene.time.now;
    this.shader = scene.add.shader(
      {
        name: 'deepcore-water',
        fragmentSource: FRAGMENT,
        setupUniforms: (setUniform: (name: string, value: unknown) => void) => {
          setUniform('uFloor', 0);
          setUniform('uMask', 1);
          setUniform('uTime', (scene.time.now - start) / 1000);
          setUniform('uSize', [this.width, this.height]);
          setUniform('uHigh', high ? 1 : 0);
          const ripples: number[] = [];
          for (let i = 0; i < MAX_RIPPLES; i++) {
            const r = this.ripples[i];
            if (r) ripples.push(r.x, this.height - r.y, (r.t - start) / 1000, r.strength);
            else ripples.push(0, 0, 0, 0);
          }
          setUniform('uRipples', ripples);
          const lights: number[] = [];
          for (let i = 0; i < MAX_LIGHTS; i++) {
            const l = this.lights[i];
            if (l) lights.push(l.x - this.x, this.height - (l.y - this.y), l.radius, l.intensity);
            else lights.push(0, 0, 0, 0);
          }
          setUniform('uLights', lights);
        },
      },
      x + width / 2,
      y + height / 2,
      width,
      height,
      [floorKey, this.maskKey],
    );
  }

  /** Mask texture: one pixel per room cell, white where there is water. */
  private makeMask(cells: Cell[][]): void {
    const rows = cells.length;
    const cols = cells[0].length;
    if (this.scene.textures.exists(this.maskKey)) this.scene.textures.remove(this.maskKey);
    // One extra pixel of border so the shore fades out at the room edge too.
    const tex = this.scene.textures.createCanvas(this.maskKey, cols, rows)!;
    const ctx = tex.context;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cols, rows);
    ctx.fillStyle = '#fff';
    cells.forEach((row, r) => row.forEach((cell, c) => cell === 'water' && ctx.fillRect(c, r, 1, 1)));
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  /** True when a world point is over water. */
  contains(cells: Cell[][], wx: number, wy: number, tile: number): boolean {
    const c = Math.floor((wx - this.x) / tile);
    const r = Math.floor((wy - this.y) / tile);
    return cells[r]?.[c] === 'water';
  }

  /** Starts a ripple at a world point. */
  ripple(wx: number, wy: number, strength = 1): void {
    if (!this.shader) return;
    this.ripples[this.nextRipple] = { x: wx - this.x, y: wy - this.y, t: this.scene.time.now, strength };
    this.nextRipple = (this.nextRipple + 1) % MAX_RIPPLES;
  }

  /** Lights that make glints on the surface this frame (world coordinates). */
  setLights(lights: WaterLight[]): void {
    this.lights = lights.slice(0, MAX_LIGHTS);
  }
}
