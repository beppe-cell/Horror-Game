import Phaser from 'phaser';
import type { PropEffect } from './biome';

interface Running {
  effect: PropEffect;
  x: number;
  y: number;
  nextAt: number;
  beacon?: { dot: Phaser.GameObjects.Arc; light: Phaser.GameObjects.Light; phase: number };
}

/**
 * Code-made animations on props: one shared particle emitter per kind, fed
 * at each prop's anchor on its own timer, plus blinking beacon lights. On
 * low quality everything fires half as often.
 */
export class PropEffects {
  private running: Running[] = [];
  private emitters: Record<'sparkle' | 'smoke' | 'sparks' | 'steam', Phaser.GameObjects.Particles.ParticleEmitter>;
  private rate: number;

  constructor(private scene: Phaser.Scene, high: boolean) {
    this.rate = high ? 1 : 2;
    const make = (key: string, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig) =>
      scene.add.particles(0, 0, key, { emitting: false, ...config }).setDepth(15);
    this.emitters = {
      sparkle: make('px-spark', {
        lifespan: { min: 900, max: 1500 },
        speedX: { min: -4, max: 4 },
        speedY: { min: -18, max: -8 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.9, end: 0 },
        tint: [0x4dffb0, 0xb8ffe0],
        blendMode: Phaser.BlendModes.ADD,
      }),
      smoke: make('px-puff', {
        lifespan: { min: 1800, max: 2600 },
        speedX: { min: -3, max: 4 },
        speedY: { min: -12, max: -6 },
        scale: { start: 0.5, end: 2.2 },
        alpha: { start: 0.45, end: 0 },
        tint: 0x6a707c,
      }),
      sparks: make('px-spark', {
        lifespan: { min: 220, max: 420 },
        speed: { min: 20, max: 50 },
        angle: { min: -130, max: -50 },
        gravityY: 70,
        scale: { start: 0.9, end: 0 },
        tint: [0xffd36a, 0xff8a3c, 0xff4a3a],
        blendMode: Phaser.BlendModes.ADD,
      }),
      steam: make('px-puff', {
        lifespan: { min: 700, max: 1000 },
        speedX: { min: 10, max: 22 },
        speedY: { min: -14, max: -6 },
        scale: { start: 0.4, end: 1.8 },
        alpha: { start: 0.28, end: 0 },
        tint: 0xaab4c0,
      }),
    };
  }

  /** Attaches the prop's effects; `prop` stands with origin (0.5, 1). */
  add(prop: Phaser.GameObjects.Image, effects: readonly PropEffect[] | undefined, phase: number): void {
    for (const effect of effects ?? []) {
      const x = prop.x - prop.displayWidth / 2 + effect.fx * prop.displayWidth;
      const y = prop.y - prop.displayHeight + effect.fy * prop.displayHeight;
      const run: Running = { effect, x, y, nextAt: this.scene.time.now + phase * effect.every };
      if (effect.type === 'beacon') {
        const dot = this.scene.add.circle(x, y, 1, 0xff3a2a).setDepth(15).setBlendMode(Phaser.BlendModes.ADD);
        const light = this.scene.lights.addLight(x, y, 34, 0xff3a2a, 0);
        run.beacon = { dot, light, phase };
      }
      this.running.push(run);
    }
  }

  update(time: number): void {
    for (const run of this.running) {
      const { effect } = run;
      if (run.beacon) {
        // Short blink once per period, like an aircraft warning light.
        const t = ((time / effect.every + run.beacon.phase) % 1 + 1) % 1;
        const on = t < 0.12;
        run.beacon.dot.setVisible(on);
        run.beacon.light.intensity = on ? 1.4 : 0;
        continue;
      }
      const type = effect.type;
      if (type === 'beacon' || time < run.nextAt) continue;
      run.nextAt = time + effect.every * this.rate * (0.6 + Math.random() * 0.8);
      this.emitters[type].explode(type === 'steam' ? 4 : 1, run.x, run.y);
    }
  }
}
