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
  /** Across both shoulders. */
  shoulders: { views: [[0, -6], [0, -6], [1, -6]], width: 20 },
  /** The other hip. */
  hipR: { views: [[-5, 6], [5, 6], [1, 6]], width: 6 },
  /** Round the waist. */
  belt: { views: [[0, 6], [0, 6], [1, 6]], width: 14 },
  /** Floating over the helmet. */
  aboveHead: { views: [[0, -27], [0, -27], [0, -27]], width: 6 },
} satisfies Record<string, Slot>;

interface Overlay {
  sheet: number;
  row: number;
  slot: keyof typeof SLOTS;
  width?: number;
  /**
   * One scale for the three views, from the largest of them, so a piece
   * seen edge-on stays thin instead of being blown up to the slot size.
   */
  uniform?: boolean;
}

/**
 * Add-on art for each item: overlay sheet, row, and slot. Items left out
 * (their Gemini pieces came out unusable) show only their light effect.
 */
const OVERLAYS: Partial<Record<ItemId, Overlay>> = {
  'plasma-core': { sheet: 1, row: 0, slot: 'back' },
  'rapid-capacitor': { sheet: 1, row: 1, slot: 'blaster', width: 6 },
  'extended-barrel': { sheet: 1, row: 2, slot: 'blaster', width: 12 },
  'captains-coin': { sheet: 2, row: 1, slot: 'neck' },
  'armor-plate': { sheet: 2, row: 2, slot: 'chest' },
  'shield-generator': { sheet: 2, row: 3, slot: 'shoulderL' },
  'crystal-shard': { sheet: 3, row: 1, slot: 'shoulderR', width: 12 },
  'twin-emitter': { sheet: 3, row: 2, slot: 'blaster' },
  'overclock': { sheet: 4, row: 0, slot: 'gun' },
  'nano-repair': { sheet: 4, row: 1, slot: 'hip' },
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
  // overlay-13 … overlay-19 = "Pezzi fermi" 6 … 12. The lens (36) and the
  // laser sight (29) came out unusable and only show their light.
  'steam-turbine': { sheet: 13, row: 0, slot: 'back', width: 10, uniform: true },
  'pirate-chip': { sheet: 13, row: 1, slot: 'shoulderR', width: 4, uniform: true },
  'hydraulic-piston': { sheet: 13, row: 2, slot: 'shoulderL', width: 8, uniform: true },
  'pulsing-egg': { sheet: 13, row: 3, slot: 'hip', width: 7, uniform: true },
  'jetpack': { sheet: 14, row: 0, slot: 'back', width: 16, uniform: true },
  'broken-coolant': { sheet: 14, row: 1, slot: 'back', width: 14, uniform: true },
  'first-aid-kit': { sheet: 14, row: 2, slot: 'hip', width: 7, uniform: true },
  'quartz-crystal': { sheet: 15, row: 0, slot: 'heart', width: 7, uniform: true },
  'cooling-fan': { sheet: 15, row: 1, slot: 'chest', width: 6, uniform: true },
  'alien-clover': { sheet: 15, row: 2, slot: 'shoulders', uniform: true },
  'titanium-plate': { sheet: 15, row: 3, slot: 'chest', width: 14, uniform: true },
  'elastic-rounds': { sheet: 16, row: 0, slot: 'chest', width: 14, uniform: true },
  'plasma-cell': { sheet: 16, row: 2, slot: 'back', width: 9, uniform: true },
  'radar-antenna': { sheet: 16, row: 3, slot: 'shoulderL', width: 16, uniform: true },
  'emergency-charge': { sheet: 17, row: 0, slot: 'back', width: 11, uniform: true },
  'ship-medal': { sheet: 17, row: 1, slot: 'neck', width: 5, uniform: true },
  'stabilizer': { sheet: 17, row: 2, slot: 'chest', width: 6, uniform: true },
  'star-fragment': { sheet: 17, row: 3, slot: 'aboveHead', uniform: true },
  'flesh-doll': { sheet: 18, row: 0, slot: 'hip', width: 10, uniform: true },
  'black-mirror': { sheet: 18, row: 1, slot: 'hipR', width: 8, uniform: true },
  'rusty-chain': { sheet: 18, row: 2, slot: 'belt', uniform: true },
  'blind-eye': { sheet: 18, row: 3, slot: 'shoulderR', width: 5, uniform: true },
  'whispering-skull': { sheet: 19, row: 0, slot: 'shoulderL', width: 6, uniform: true },
  'thorn': { sheet: 19, row: 1, slot: 'chest', width: 12, uniform: true },
  'black-dust': { sheet: 19, row: 2, slot: 'hip', width: 6, uniform: true },
  'abyss-idol': { sheet: 19, row: 3, slot: 'chest', width: 8, uniform: true },
};

/**
 * Leg pieces, animated with the walk: each sheet has the 6 walk frames for
 * the front, back and side views (rows), drawn at the feet. They are scaled
 * from the front view (`width` = both legs) and stand on her soles, so they move step by step with her.
 */
const LEGS: Partial<Record<ItemId, { key: string; width: number }>> = {
  'leg-servos': { key: 'legs-servos', width: 15 },
  'grav-boots': { key: 'legs-grav', width: 17 },
  'lead-boots': { key: 'legs-lead', width: 17 },
  'compression-spring': { key: 'legs-spring', width: 15 },
};
/** Her soles, below the sprite centre. */
const SOLES_Y = 22;
const WALK_FRAMES = 6;

/** A piece of art worn by the astronaut, picked by the way she faces. */
interface Piece {
  key: string;
  row: number;
  slot: Slot;
  width: number;
  uniform?: boolean;
  /** Animated leg piece (LEGS). */
  legs?: boolean;
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
      this.pieces.push({ key, row: o.row, slot, width: o.width ?? slot.width, uniform: o.uniform, img });
    }
    for (const id of items) {
      const l = LEGS[id];
      if (!l || !this.scene.textures.exists(l.key)) continue;
      const img = this.scene.add.image(0, 0, l.key, 0).setLighting(true);
      this.pieces.push({ key: l.key, row: 0, slot: SLOTS.feet, width: l.width, legs: true, img });
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
      if (piece.legs) {
        this.placeLegs(piece, view, mirror);
        continue;
      }
      const off = piece.slot.views[view];
      const frame = piece.row * 3 + view;
      const box = OVERLAY_BOXES[piece.key]?.boxes[frame];
      if (!off || !box || !p.visible) {
        piece.img.setVisible(false);
        continue;
      }
      const sheet = OVERLAY_BOXES[piece.key];
      // Scaled on its longest side, so a long thin piece seen end-on is not blown up.
      const scale = piece.width / (piece.uniform ? rowSize(piece.key, piece.row * 3, 3) : Math.max(4, box[2] - box[0], box[3] - box[1]));
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

  /**
   * A leg piece: the walk frame she is on (standing still: the first), for
   * the view she is seen from, standing on her soles.
   */
  private placeLegs(piece: Piece, view: number, mirror: number): void {
    const p = this.player;
    const sheet = OVERLAY_BOXES[piece.key];
    const walking = p.texture.key === 'player-walk';
    const step = walking ? Number(p.frame.name) % WALK_FRAMES : 0;
    const first = view * WALK_FRAMES;
    const box = sheet?.boxes[first + step];
    if (!sheet || !box || !p.visible) {
      piece.img.setVisible(false);
      return;
    }
    const boxes = sheet.boxes.slice(first, first + WALK_FRAMES).filter((b): b is [number, number, number, number] => !!b);
    // One anchor per view (the middle of the steps, the lowest sole), so the
    // legs keep their own motion inside the frame.
    const cx = boxes.reduce((t, b) => t + (b[0] + b[2]) / 2, 0) / boxes.length;
    const bottom = Math.max(...boxes.map((b) => b[3]));
    piece.img
      .setVisible(true)
      .setFrame(first + step)
      .setOrigin(cx / sheet.w, bottom / sheet.h)
      // One scale for every view, from the front one (both legs side by side).
      .setScale(piece.width / rowSize(piece.key, 0, WALK_FRAMES, true))
      .setFlipX(mirror < 0)
      .setPosition(p.x, p.y + SOLES_Y)
      .setAlpha(p.alpha)
      .setDepth(p.depth + 0.003);
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

/**
 * Size of the largest piece among `count` frames from `first`: the longest
 * side, or only the width (`widthOnly`, for legs, which are tall).
 */
function rowSize(key: string, first: number, count: number, widthOnly = false): number {
  let size = 4;
  for (const b of OVERLAY_BOXES[key]?.boxes.slice(first, first + count) ?? []) {
    if (b) size = Math.max(size, b[2] - b[0], widthOnly ? 0 : b[3] - b[1]);
  }
  return size;
}
