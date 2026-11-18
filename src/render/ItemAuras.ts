/**
 * Visual effects that items add to the astronaut. Each item brings one
 * effect (rules/items.ts `aura`), and all of them are drawn together on top
 * of the sprite: a glow, sparks at the blaster, a trail at the feet, motes
 * circling, a halo, a shield bubble, a coloured shimmer, dripping drops.
 * So any mix of items shows without a sprite for every combination.
 */
import Phaser from 'phaser';
import { Aura, ITEMS, ItemId } from '../rules/items';

interface Effect {
  aura: Aura;
  /** Index among effects of the same kind, to spread them out. */
  n: number;
  light?: Phaser.GameObjects.Light;
  emitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  motes?: Phaser.GameObjects.Image[];
  gfx?: Phaser.GameObjects.Graphics;
  ghost?: Phaser.GameObjects.Sprite;
}

export class ItemAuras {
  private effects: Effect[] = [];
  private shown: string[] = [];

  constructor(
    private scene: Phaser.Scene,
    private player: Phaser.Physics.Arcade.Sprite,
  ) {}

  /** Rebuilds the effects for the items carried (only when the list changed). */
  sync(items: readonly ItemId[]): void {
    if (items.length === this.shown.length && items.every((id, i) => id === this.shown[i])) return;
    this.shown = [...items];
    for (const e of this.effects) {
      if (e.light) this.scene.lights.removeLight(e.light);
      e.emitter?.destroy();
      e.motes?.forEach((m) => m.destroy());
      e.gfx?.destroy();
      e.ghost?.destroy();
    }
    this.effects = [];
    const count: Record<string, number> = {};
    for (const id of items) {
      const aura = ITEMS[id].aura;
      const n = (count[aura.kind] = (count[aura.kind] ?? 0) + 1) - 1;
      this.effects.push(this.make(aura, n));
    }
  }

  private make(aura: Aura, n: number): Effect {
    const s = this.scene;
    const e: Effect = { aura, n };
    const add = Phaser.BlendModes.ADD;
    switch (aura.kind) {
      case 'glow':
        e.light = s.lights.addLight(0, 0, 70 + n * 15, aura.color, 0.55);
        break;
      case 'sparks':
        e.emitter = s.add.particles(0, 0, 'px-spark', {
          lifespan: { min: 150, max: 320 },
          speed: { min: 20, max: 60 },
          scale: { start: 0.9, end: 0 },
          tint: aura.color,
          blendMode: add,
          frequency: 160 + n * 60,
          quantity: 1,
        });
        break;
      case 'trail':
        e.emitter = s.add.particles(0, 0, 'px-spark', {
          lifespan: 380,
          speed: { min: 2, max: 10 },
          scale: { start: 1.3, end: 0 },
          alpha: { start: 0.7, end: 0 },
          tint: aura.color,
          blendMode: add,
          frequency: 45,
          emitting: false,
        });
        break;
      case 'drip':
        e.emitter = s.add.particles(0, 0, 'px-spark', {
          lifespan: 500,
          speedY: { min: 10, max: 30 },
          speedX: { min: -6, max: 6 },
          gravityY: 120,
          scale: { start: 1, end: 0.4 },
          tint: aura.color,
          frequency: 380 + n * 120,
        });
        break;
      case 'orbit':
        e.motes = [0, 1].map(() => s.add.image(0, 0, 'px-spark').setScale(1.4).setTint(aura.color).setBlendMode(add));
        break;
      case 'halo':
      case 'bubble':
        e.gfx = s.add.graphics().setBlendMode(add);
        break;
      case 'shimmer':
        e.ghost = s.add.sprite(0, 0, this.player.texture.key).setTint(aura.color).setBlendMode(add);
        break;
    }
    return e;
  }

  /** Moves every effect with the astronaut; `moving` turns the feet trails on. */
  update(time: number, moving: boolean): void {
    const p = this.player;
    const chestY = p.y + 4;
    const feetY = p.y + 20;
    const helmetY = p.y - 18;
    for (const e of this.effects) {
      const c = e.aura.color;
      const phase = time / 1000 + e.n * 1.7;
      switch (e.aura.kind) {
        case 'glow':
          e.light!.setPosition(p.x, chestY);
          e.light!.intensity = 0.45 + 0.15 * Math.sin(phase * 3);
          break;
        case 'sparks':
          // Near the blaster, on the side the astronaut faces.
          e.emitter!.setPosition(p.x + (p.flipX ? -9 : 9), chestY + 2).setDepth(p.depth + 0.002);
          break;
        case 'trail':
          e.emitter!.setPosition(p.x, feetY).setDepth(p.depth - 0.002);
          e.emitter!.emitting = moving;
          break;
        case 'drip':
          e.emitter!.setPosition(p.x + Math.sin(phase * 5) * 5, chestY).setDepth(p.depth + 0.001);
          break;
        case 'orbit':
          e.motes!.forEach((m, i) => {
            const a = phase * 3.2 + i * Math.PI;
            // A flattened orbit: in front of the astronaut on the lower half.
            m.setPosition(p.x + Math.cos(a) * (15 + e.n * 4), chestY + Math.sin(a) * (6 + e.n * 2));
            m.setDepth(p.depth + (Math.sin(a) > 0 ? 0.003 : -0.003));
          });
          break;
        case 'halo': {
          const g = e.gfx!.clear().setDepth(p.depth + 0.004);
          const y = helmetY - 5 - e.n * 4 + Math.sin(phase * 2) * 1.2;
          g.lineStyle(2, c, 0.85).strokeEllipse(p.x, y, 16, 5);
          break;
        }
        case 'bubble': {
          const g = e.gfx!.clear().setDepth(p.depth + 0.004);
          const r = 22 + e.n * 3 + Math.sin(phase * 2.5) * 1.2;
          g.fillStyle(c, 0.08).fillCircle(p.x, chestY - 2, r);
          g.lineStyle(1, c, 0.35 + 0.15 * Math.sin(phase * 4)).strokeCircle(p.x, chestY - 2, r);
          break;
        }
        case 'shimmer': {
          const ghost = e.ghost!;
          ghost.setTexture(p.texture.key, p.frame.name).setPosition(p.x, p.y).setFlipX(p.flipX);
          ghost.setDepth(p.depth + 0.001).setAlpha((0.12 + 0.18 * (0.5 + 0.5 * Math.sin(phase * 3))) * p.alpha);
          break;
        }
      }
    }
  }
}
