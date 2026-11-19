/**
 * Visual effects that items add to the astronaut. Each item brings one
 * effect (rules/items.ts `aura`), and all of them are drawn together on top
 * of the sprite: a glow, sparks at the blaster, a trail at the feet, motes
 * circling, a halo, a shield bubble, a coloured shimmer, dripping drops.
 * So any mix of items shows without a sprite for every combination.
 */
import Phaser from 'phaser';
import { Aura, ITEMS, ItemId } from '../rules/items';
import type { Dir4 } from '../rules/input';
import { OVERLAY_BOXES } from './overlayBoxes';

/**
 * Where an add-on piece sits on the astronaut, for each view: offset from
 * the sprite centre in the front, back and right-side views (null = not
 * seen from there), its size on screen (longest side), and whether it is a back piece
 * (drawn behind her when she faces the camera).
 */
interface Slot {
  views: [[number, number] | null, [number, number] | null, [number, number] | null];
  width: number;
  back?: boolean;
  /** Hidden by her body when seen from behind (drawn under the sprite). */
  front?: boolean;
}

const SLOTS = {
  back: { views: [[0, -4], [0, -2], [-6, -2]], width: 13, back: true },
  lowerBack: { views: [[0, 4], [0, 4], [-6, 4]], width: 9, back: true },
  blaster: { views: [[-9, 4], [9, 4], [10, 2]], width: 9 },
  gun: { views: [[-9, 4], [9, 4], [10, 2]], width: 14 },
  knees: { views: [[0, 13], [0, 13], [1, 13]], width: 14 },
  feet: { views: [[0, 19], [0, 19], [1, 19]], width: 16 },
  neck: { views: [[0, -5], [0, -5], [2, -5]], width: 9, front: true },
  chest: { views: [[0, 0], [0, 0], [2, 0]], width: 13, front: true },
  heart: { views: [[3, -1], null, [2, -1]], width: 8, front: true },
  shoulderR: { views: [[-7, -6], [7, -6], [-2, -6]], width: 10 },
  shoulderL: { views: [[7, -6], [-7, -6], [1, -6]], width: 9 },
  hip: { views: [[5, 6], [-5, 6], [1, 6]], width: 6 },
  visor: { views: [[-3, -12], null, [5, -12]], width: 6, front: true },
  torso: { views: [[0, -3], [0, -3], [0, -3]], width: 24 },
  arm: { views: [[-8, 1], [8, 1], [7, 1]], width: 12 },
  /** The whole helmet: pieces drawn around it (monocle, goggles). */
  helmet: { views: [[0, -12], [0, -12], [1, -12]], width: 15 },
  /** Over the shoulders and down the back, behind her when she faces the camera. */
  cloak: { views: [[0, 3], [0, 3], [-3, 3]], width: 22, back: true },
} satisfies Record<string, Slot>;

/**
 * Add-on art for each item: overlay sheet, row, and slot. Items left out
 * (their Gemini pieces came out unusable) show only their light effect.
 */
const OVERLAYS: Partial<Record<ItemId, { sheet: number; row: number; slot: keyof typeof SLOTS; width?: number }>> = {
  'plasma-core': { sheet: 1, row: 0, slot: 'back' },
  'rapid-capacitor': { sheet: 1, row: 1, slot: 'blaster', width: 6 },
  'extended-barrel': { sheet: 1, row: 2, slot: 'blaster', width: 12 },
  'leg-servos': { sheet: 1, row: 3, slot: 'knees' },
  'captains-coin': { sheet: 2, row: 1, slot: 'neck' },
  'armor-plate': { sheet: 2, row: 2, slot: 'chest' },
  'shield-generator': { sheet: 2, row: 3, slot: 'shoulderL' },
  'crystal-shard': { sheet: 3, row: 1, slot: 'shoulderR', width: 12 },
  'twin-emitter': { sheet: 3, row: 2, slot: 'blaster' },
  'overclock': { sheet: 4, row: 0, slot: 'gun' },
  'nano-repair': { sheet: 4, row: 1, slot: 'hip' },
  'grav-boots': { sheet: 4, row: 2, slot: 'feet' },
  'dog-tag': { sheet: 4, row: 3, slot: 'neck' },
  'long-scope': { sheet: 5, row: 0, slot: 'gun' },
  'alien-heart': { sheet: 5, row: 1, slot: 'heart' },
  'battery-pack': { sheet: 5, row: 2, slot: 'lowerBack' },
  'reactive-armor': { sheet: 5, row: 3, slot: 'arm' },
  'coolant-tank': { sheet: 6, row: 0, slot: 'back', width: 14 },
  'spore-lens': { sheet: 6, row: 1, slot: 'visor' },
  'brood-heart': { sheet: 6, row: 2, slot: 'heart', width: 9 },
  'tri-emitter': { sheet: 6, row: 3, slot: 'blaster', width: 12 },
  'queen-carapace': { sheet: 7, row: 0, slot: 'torso' },
  'plasma-overdrive': { sheet: 7, row: 1, slot: 'arm', width: 14 },
  // Second wave (overlay-8 … overlay-12 = "Pezzi fermi" 1 … 5).
  'misaligned-cannon': { sheet: 8, row: 0, slot: 'gun', width: 15 },
  'adrenaline-injector': { sheet: 8, row: 1, slot: 'arm', width: 7 },
  'cracked-lens': { sheet: 8, row: 2, slot: 'helmet' },
  'leaking-battery': { sheet: 8, row: 3, slot: 'lowerBack', width: 10 },
  'bone-horn': { sheet: 9, row: 0, slot: 'shoulderR', width: 11 },
  'stitched-heart': { sheet: 9, row: 1, slot: 'chest', width: 12 },
  'cursed-coin': { sheet: 9, row: 2, slot: 'neck', width: 10 },
  'skeletal-glove': { sheet: 9, row: 3, slot: 'blaster', width: 7 },
  'night-visor': { sheet: 10, row: 0, slot: 'helmet', width: 16 },
  'unstable-core': { sheet: 10, row: 1, slot: 'chest', width: 5 },
  'crystal-rounds': { sheet: 10, row: 2, slot: 'hip', width: 10 },
  'shadow-cloak': { sheet: 10, row: 3, slot: 'cloak' },
  'release-valve': { sheet: 11, row: 0, slot: 'shoulderL', width: 10 },
  'pulse-coil': { sheet: 11, row: 1, slot: 'blaster', width: 8 },
  'split-prism': { sheet: 11, row: 2, slot: 'blaster', width: 5 },
  'spore-vial': { sheet: 11, row: 3, slot: 'hip', width: 5 },
  'gravity-anchor': { sheet: 12, row: 0, slot: 'lowerBack', width: 7 },
  'alien-eye': { sheet: 12, row: 1, slot: 'shoulderL', width: 6 },
  'red-serum': { sheet: 12, row: 2, slot: 'neck', width: 11 },
  'resin-shell': { sheet: 12, row: 3, slot: 'back', width: 14 },
};

/** A piece of art worn by the astronaut, picked by the way she faces. */
interface Piece {
  key: string;
  row: number;
  slot: Slot;
  width: number;
  img: Phaser.GameObjects.Image;
}

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
  private pieces: Piece[] = [];
  private shown: string[] = [];

  constructor(
    private scene: Phaser.Scene,
    private player: Phaser.Physics.Arcade.Sprite,
    private facing: () => Dir4,
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
    this.pieces.forEach((p) => p.img.destroy());
    this.pieces = [];
    for (const id of items) {
      const o = OVERLAYS[id];
      const key = o && `overlay-${o.sheet}`;
      if (!o || !key || !this.scene.textures.exists(key)) continue;
      const slot: Slot = SLOTS[o.slot];
      const img = this.scene.add.image(0, 0, key, o.row * 3).setLighting(true);
      this.pieces.push({ key, row: o.row, slot, width: o.width ?? slot.width, img });
    }
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

  /**
   * Puts each worn piece on its slot for the view she is seen from (front,
   * back or side, mirrored when she faces left), scaled to the slot.
   */
  private placePieces(): void {
    const p = this.player;
    const facing = this.facing();
    const view = facing === 'down' ? 0 : facing === 'up' ? 1 : 2;
    const mirror = facing === 'left' ? -1 : 1;
    for (const piece of this.pieces) {
      const off = piece.slot.views[view];
      const frame = piece.row * 3 + view;
      const box = OVERLAY_BOXES[piece.key]?.boxes[frame];
      if (!off || !box || !p.visible) {
        piece.img.setVisible(false);
        continue;
      }
      const sheet = OVERLAY_BOXES[piece.key];
      // Scaled on its longest side, so a long thin piece seen end-on is not blown up.
      const scale = piece.width / Math.max(4, box[2] - box[0], box[3] - box[1]);
      piece.img
        .setVisible(true)
        .setFrame(frame)
        .setOrigin((box[0] + box[2]) / 2 / sheet.w, (box[1] + box[3]) / 2 / sheet.h)
        .setScale(scale)
        .setFlipX(mirror < 0)
        .setPosition(p.x + off[0] * mirror, p.y + off[1])
        .setAlpha(p.alpha);
      // Back pieces go behind her when she faces the camera or turns aside;
      // front pieces go behind her when she turns her back.
      const behind = (piece.slot.back && view !== 1) || (piece.slot.front && view === 1);
      piece.img.setDepth(p.depth + (behind ? -0.004 : 0.004));
    }
  }

  /** Moves every effect with the astronaut; `moving` turns the feet trails on. */
  update(time: number, moving: boolean): void {
    const p = this.player;
    this.placePieces();
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
