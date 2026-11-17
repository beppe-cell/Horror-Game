import Phaser from 'phaser';
import type { Cell } from '../rules/room';
import { waterMask } from '../rules/waterMask';

const MAX_RIPPLES = 10;
const MAX_LIGHTS = 6;
/** Mask texels per room tile; the shoreline is blurred over a few of them. */
const MASK_SCALE = 8;
/** How high light sources sit above the floor, in pixels: their reflection appears this far below them. */
const LIGHT_HEIGHT = 16;

/**
 * Realistic shallow water drawn by a fragment shader over the room floor.
 *
 * - Surface: several travelling wave trains plus fine noise, so the normal
 *   map moves like real water instead of a single pattern.
 * - Refraction: the floor seen through the water, bent by the waves.
 * - Absorption: red fades first and blue last as the water gets deeper,
 *   so shallows are clear and the middle of a pool is dark teal.
 * - Reflections: mirrored images of the player, rocks and crystals (drawn
 *   each frame into a reflection texture), wobbled by the waves and mixed
 *   in with a Fresnel term.
 * - Light: every light makes a soft wobbling reflection of its source, a
 *   sheen on the surface and caustics on the bottom only where it shines.
 * - Ripples from footsteps and shots, a wet dark rim on the floor around
 *   each pool, and a thin broken foam line on the shore (high quality).
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
uniform sampler2D uReflect;
uniform float uTime;
uniform vec2 uSize;
uniform vec4 uRipples[MAX_RIPPLES];
uniform vec4 uLights[MAX_LIGHTS];
uniform vec3 uLightColors[MAX_LIGHTS];
uniform float uHigh;
uniform float uReflectFlip;
varying vec2 outTexCoord;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Surface height at a point in room pixels (y up).
float heightAt(vec2 p) {
  float t = uTime;
  float h = 0.0;
  h += sin(dot(p, vec2(0.110, 0.046)) + t * 1.25) * 0.30;
  h += sin(dot(p, vec2(-0.064, 0.098)) + t * 1.62) * 0.22;
  h += sin(dot(p, vec2(0.170, -0.120)) + t * 2.10) * 0.12;
  h += sin(dot(p, vec2(-0.230, -0.210)) + t * 2.90) * 0.06 * uHigh;
  h += (noise(p * 0.11 + vec2(t * 0.35, t * 0.22)) - 0.5) * 0.35;
  for (int i = 0; i < MAX_RIPPLES; i++) {
    vec4 r = uRipples[i];
    float age = t - r.z;
    if (r.w <= 0.0 || age < 0.0 || age > 3.0) continue;
    float d = distance(p, r.xy);
    float front = age * 46.0;
    float ring = exp(-pow((d - front) / 7.0, 2.0));
    h += sin((d - front) * 0.55) * ring * exp(-age * 1.3) * r.w * 1.6;
  }
  return h;
}

vec4 reflectAt(vec2 uv) {
  vec2 ruv = uReflectFlip > 0.5 ? vec2(uv.x, 1.0 - uv.y) : uv;
  return texture2D(uReflect, ruv);
}

void main() {
  vec2 uv = outTexCoord;
  vec2 p = uv * uSize;
  float m = texture2D(uMask, uv).r;

  // Wet floor around the pool: darker, no water on top.
  if (m < 0.47) {
    float wet = smoothstep(0.12, 0.47, m);
    float a = wet * 0.38;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vec3(0.0, 0.01, 0.02) * a, a);
    return;
  }

  float depth = smoothstep(0.5, 0.98, m);          // 0 at the shore, 1 in the middle
  float e = 1.0;
  float hx = heightAt(p + vec2(e, 0.0)) - heightAt(p - vec2(e, 0.0));
  float hy = heightAt(p + vec2(0.0, e)) - heightAt(p - vec2(0.0, e));
  vec3 n = normalize(vec3(-hx * 3.2, -hy * 3.2, 1.0));
  // The camera looks down from the south (bottom of the screen) at an angle.
  vec3 V = normalize(vec3(0.0, -0.55, 0.83));

  // Bottom seen through the water, bent more where the water is deeper.
  vec2 refrUv = uv + n.xy * (5.0 + 9.0 * depth) / uSize;
  vec3 floorCol = texture2D(uFloor, refrUv).rgb;
  float path = 0.15 + depth * 1.6;
  vec3 transmit = exp(-vec3(2.6, 1.05, 0.75) * path);
  vec3 deep = vec3(0.010, 0.045, 0.060);
  vec3 col = floorCol * transmit + deep * (1.0 - transmit);

  // Light on and under the surface.
  vec3 sheen = vec3(0.0);
  vec3 lightReflect = vec3(0.0);
  float lit = 0.0;
  for (int i = 0; i < MAX_LIGHTS; i++) {
    vec4 L = uLights[i];
    if (L.w <= 0.0) continue;
    vec3 lc = uLightColors[i];
    float dist = distance(p, L.xy);
    float fall = clamp(1.0 - dist / L.z, 0.0, 1.0);
    fall *= fall;
    lit += fall * L.w;
    // Glitter: sharp highlights where a wave tilts to bounce the light to the camera.
    vec3 toL = normalize(vec3(L.xy - p, ${LIGHT_HEIGHT}.0));
    vec3 h = normalize(toL + V);
    float spec = pow(max(dot(n, h), 0.0), 160.0) * fall * L.w;
    sheen += lc * spec * 1.3;
    sheen += lc * fall * L.w * 0.04;
    // Mirror image of the light source, below it, broken up by the waves.
    vec2 img = L.xy - vec2(0.0, ${LIGHT_HEIGHT}.0);
    vec2 q = (p + n.xy * 14.0) - img;
    q.y *= 0.5; // reflections stretch along the viewing direction
    float glow = exp(-dot(q, q) / (60.0 + L.z * 0.35));
    lightReflect += lc * glow * L.w * 0.75;
  }

  // The bottom is lit like the floor around it: dark away from the lights.
  col *= 0.22 + min(lit, 1.4) * 0.85;

  // Caustics: thin bright webs on the bottom, only where light reaches it.
  vec2 cp = p * 0.085 + n.xy * 0.8;
  float c1 = noise(cp + vec2(uTime * 0.45, uTime * 0.3));
  float c2 = noise(cp * 1.6 - vec2(uTime * 0.38, -uTime * 0.52));
  float caustic = pow(1.0 - abs(c1 - c2), 14.0);
  col += vec3(0.55, 0.85, 0.80) * caustic * min(lit, 1.2) * 0.22 * (1.0 - depth * 0.6) * (0.6 + 0.4 * uHigh);

  // Reflections of objects, with a Fresnel term: more reflective where the
  // surface tilts away from the viewer.
  vec2 reflUv = uv + n.xy * 7.0 / uSize;
  vec4 refl = reflectAt(reflUv);
  float fresnel = clamp(0.32 + 1.6 * (1.0 - n.z), 0.0, 0.85);
  col = col * (1.0 - refl.a * fresnel) + refl.rgb * vec3(0.78, 0.9, 0.95) * fresnel;

  col += lightReflect + sheen;

  // Shoreline: thin broken foam where the water is very shallow.
  float shore = 1.0 - smoothstep(0.0, 0.12, depth);
  float foam = shore * smoothstep(0.55, 0.75, noise(p * 0.35 + vec2(uTime * 0.4, 0.0))) * (0.35 + 0.65 * uHigh);
  col = mix(col, vec3(0.62, 0.70, 0.72) * (0.25 + min(lit, 1.0)), foam * 0.35);

  float alpha = smoothstep(0.47, 0.55, m);
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
  color: number;
}

/** An object mirrored in the water. `baseRow` is the frame row where it touches the ground. */
export interface Reflector {
  obj: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
  baseRow: number;
}

export class Water {
  readonly shader: Phaser.GameObjects.Shader | null;
  private ripples: Ripple[] = [];
  private nextRipple = 0;
  private lights: WaterLight[] = [];
  private maskKey: string;
  private reflectKey: string;
  private reflectTex: Phaser.Textures.DynamicTexture | null = null;
  private mirrors = new Map<Reflector['obj'], Phaser.GameObjects.Image>();
  /** Set to 1 if render textures come out upside down relative to images. */
  reflectFlip = 0;

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
    this.reflectKey = `water-reflect-${floorKey}`;
    const hasWater = cells.some((row) => row.includes('water'));
    if (!hasWater) {
      this.shader = null;
      return;
    }
    this.makeMask(cells);
    if (scene.textures.exists(this.reflectKey)) scene.textures.remove(this.reflectKey);
    this.reflectTex = scene.textures.addDynamicTexture(this.reflectKey, width, height)!;
    const start = scene.time.now;
    this.shader = scene.add.shader(
      {
        name: 'deepcore-water-v2',
        fragmentSource: FRAGMENT,
        setupUniforms: (setUniform: (name: string, value: unknown) => void) => {
          setUniform('uFloor', 0);
          setUniform('uMask', 1);
          setUniform('uReflect', 2);
          setUniform('uTime', (scene.time.now - start) / 1000);
          setUniform('uSize', [this.width, this.height]);
          setUniform('uHigh', high ? 1 : 0);
          setUniform('uReflectFlip', this.reflectFlip);
          const ripples: number[] = [];
          for (let i = 0; i < MAX_RIPPLES; i++) {
            const r = this.ripples[i];
            if (r) ripples.push(r.x, this.height - r.y, (r.t - start) / 1000, r.strength);
            else ripples.push(0, 0, 0, 0);
          }
          setUniform('uRipples[0]', ripples); // WebGL names array uniforms with their first element
          const lights: number[] = [];
          const colors: number[] = [];
          for (let i = 0; i < MAX_LIGHTS; i++) {
            const l = this.lights[i];
            if (l) {
              lights.push(l.x - this.x, this.height - (l.y - this.y), l.radius, l.intensity);
              colors.push(((l.color >> 16) & 255) / 255, ((l.color >> 8) & 255) / 255, (l.color & 255) / 255);
            } else {
              lights.push(0, 0, 0, 0);
              colors.push(0, 0, 0);
            }
          }
          setUniform('uLights[0]', lights);
          setUniform('uLightColors[0]', colors);
        },
      },
      x + width / 2,
      y + height / 2,
      width,
      height,
      [floorKey, this.maskKey, this.reflectKey],
    );
  }

  /** Mask texture: smooth, blurred version of the water cells. */
  private makeMask(cells: Cell[][]): void {
    const mask = waterMask(
      cells.map((row) => row.map((c) => c === 'water')),
      MASK_SCALE,
      3,
    );
    if (this.scene.textures.exists(this.maskKey)) this.scene.textures.remove(this.maskKey);
    const tex = this.scene.textures.createCanvas(this.maskKey, mask.width, mask.height)!;
    const img = tex.context.createImageData(mask.width, mask.height);
    for (let i = 0; i < mask.data.length; i++) {
      const v = Math.round(mask.data[i] * 255);
      img.data.set([v, v, v, 255], i * 4);
    }
    tex.context.putImageData(img, 0, 0);
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

  /** Lights that shine on the water this frame (world coordinates). */
  setLights(lights: WaterLight[]): void {
    this.lights = lights.slice(0, MAX_LIGHTS);
  }

  /**
   * Redraws the mirror images of the given objects. Each image is flipped
   * at the point where the object touches the ground and dimmed by how much
   * light reaches it, since the reflection texture itself is drawn unlit.
   */
  updateReflections(reflectors: Reflector[], brightnessAt: (x: number, y: number) => number): void {
    const dt = this.reflectTex;
    if (!dt) return;
    dt.clear();
    for (const { obj, baseRow } of reflectors) {
      if (!obj.visible || !obj.active) continue;
      let mirror = this.mirrors.get(obj);
      if (!mirror) {
        mirror = new Phaser.GameObjects.Image(this.scene, 0, 0, obj.texture.key);
        this.mirrors.set(obj, mirror);
      }
      const frame = obj.frame;
      mirror.setTexture(obj.texture.key, frame.name);
      mirror.setFlipX(obj.flipX).setFlipY(true).setScale(obj.scaleX, obj.scaleY);
      // Ground contact in world space, then the image hangs below it.
      const groundY = obj.y - obj.displayOriginY + baseRow;
      const fromBottom = frame.height - 1 - baseRow;
      mirror.setOrigin(obj.originX, fromBottom / frame.height);
      mirror.setPosition(obj.x - this.x, groundY - this.y + 1);
      const b = Phaser.Math.Clamp(brightnessAt(obj.x, groundY), 0.08, 1);
      const g = Math.round(b * 255);
      mirror.setTint((g << 16) | (g << 8) | g);
      mirror.setAlpha(obj.alpha);
      dt.draw(mirror);
    }
    dt.render();
  }
}
