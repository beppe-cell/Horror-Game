import Phaser from 'phaser';

/**
 * Two layers of slow drifting mist over the room, drawn by a shader with
 * additive-looking soft alpha. High quality only.
 */
const FRAGMENT = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform float uTime;
uniform vec2 uSize;
uniform vec3 uTint;
varying vec2 outTexCoord;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
void main() {
  vec2 p = outTexCoord * uSize / 96.0;
  float f1 = fbm(p + vec2(uTime * 0.03, uTime * 0.01));
  float f2 = fbm(p * 1.8 - vec2(uTime * 0.05, -uTime * 0.02));
  float fog = smoothstep(0.45, 0.85, f1 * 0.6 + f2 * 0.5) * 0.22;
  gl_FragColor = vec4(uTint * fog, fog);
}
`;

export function addFog(scene: Phaser.Scene, x: number, y: number, w: number, h: number): Phaser.GameObjects.Shader {
  const start = scene.time.now;
  return scene.add.shader(
    {
      name: 'deepcore-fog',
      fragmentSource: FRAGMENT,
      setupUniforms: (setUniform: (name: string, value: unknown) => void) => {
        setUniform('uTime', (scene.time.now - start) / 1000);
        setUniform('uSize', [w, h]);
        setUniform('uTint', [0.55, 0.75, 0.85]);
      },
    },
    x + w / 2,
    y + h / 2,
    w,
    h,
  );
}
