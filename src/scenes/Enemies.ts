import Phaser from 'phaser';
import { Rng } from '../rules/rng';
import { ENEMIES, EnemyKind, EnemyState, SPORE_SPEED, newEnemy, stepEnemy } from '../rules/enemies';
import { makeLitTexture } from '../render/pixelArt';

/** What the enemies need from the play scene. */
export interface EnemyHost {
  scene: Phaser.Scene;
  player: Phaser.Physics.Arcade.Sprite;
  walls: Phaser.Physics.Arcade.StaticGroup;
  shots: Phaser.Physics.Arcade.Group;
  tile: number;
  /** Damage dealt by one player shot. */
  shotDamage(): number;
  /** A shot hit an enemy: impact feedback and remove the shot. */
  shotHit(shot: Phaser.Physics.Arcade.Image, x: number, y: number): void;
  /** Hurts the astronaut by `amount` half cells, pushed away from (fromX, fromY). */
  hurtPlayer(amount: number, fromX: number, fromY: number): void;
  /** Adds shadows and water reflection for a standing object. */
  track(obj: Phaser.GameObjects.Sprite, baseRow: number, height: number, width: number): void;
  untrack(obj: Phaser.GameObjects.Sprite): void;
  depthAt(baseY: number): number;
  shakeAdd(amount: number): void;
  /** Where the astronaut's feet are, in world pixels. */
  playerFeet(): { x: number; y: number };
}

interface Enemy {
  sprite: Phaser.Physics.Arcade.Sprite;
  state: EnemyState;
  hp: number;
  flashUntil: number;
  knockUntil: number;
  knock: { x: number; y: number };
}

/** Height of player shots above the floor, in pixels (matches PlayScene). */
const SHOT_FLIGHT_HEIGHT = 16;

/** How many of each kind appear in a room, by weight. */
const SPAWN_WEIGHTS: [EnemyKind, number][] = [
  ['crawler', 3],
  ['spitter', 1],
  ['miner', 1],
];

/**
 * Enemies of the current room: spawning, behaviour (rules/enemies.ts),
 * spores, hits, knockback and death. Until the Gemini art arrives they are
 * drawn as simple code placeholders, lit like everything else.
 */
export class EnemyManager {
  private enemies: Enemy[] = [];
  private spores!: Phaser.Physics.Arcade.Group;
  private goo!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sporePuff!: Phaser.GameObjects.Particles.ParticleEmitter;
  private group!: Phaser.Physics.Arcade.Group;
  /** Called once when the last enemy dies. */
  onCleared?: () => void;

  constructor(private host: EnemyHost) {
    const { scene } = host;
    makeEnemyPlaceholders(scene);
    this.group = scene.physics.add.group();
    this.spores = scene.physics.add.group({ defaultKey: 'en-spore', maxSize: 20 });
    this.goo = scene.add
      .particles(0, 0, 'px-spark', {
        lifespan: { min: 300, max: 700 },
        speed: { min: 30, max: 110 },
        gravityY: 120,
        scale: { start: 1.6, end: 0.4 },
        tint: [0xa8b29a, 0x7d8a72, 0x8a2a3a],
        emitting: false,
      })
      .setDepth(20);
    this.sporePuff = scene.add
      .particles(0, 0, 'px-spark', {
        lifespan: { min: 250, max: 500 },
        speed: { min: 15, max: 60 },
        scale: { start: 1.4, end: 0 },
        tint: [0xd8e04a, 0xa0b030],
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(20);

    scene.physics.add.collider(this.group, host.walls);
    scene.physics.add.collider(this.group, this.group);
    scene.physics.add.overlap(host.player, this.group, (_p, sprite) => {
      const e = this.find(sprite as Phaser.Physics.Arcade.Sprite);
      if (e) host.hurtPlayer(ENEMIES[e.state.kind].contactDamage, e.sprite.x, e.sprite.y);
    });
    scene.physics.add.overlap(this.spores, host.walls, (spore) => this.popSpore(spore as Phaser.Physics.Arcade.Image));
    scene.physics.add.overlap(host.player, this.spores, (_p, spore) => {
      const s = spore as Phaser.Physics.Arcade.Image;
      if (!s.active) return;
      host.hurtPlayer(1, s.x, s.y);
      this.popSpore(s);
    });
  }

  get alive(): number {
    return this.enemies.length;
  }

  /** Places 3-5 enemies on free cells away from the player's start. */
  spawn(rng: Rng, cells: { c: number; r: number }[], origin: { x: number; y: number }, toWorld: (c: number, r: number) => { x: number; y: number }): void {
    const far = cells.filter((cell) => {
      const p = toWorld(cell.c, cell.r);
      return Math.hypot(p.x - origin.x, p.y - origin.y) >= 4 * this.host.tile;
    });
    const count = Math.min(far.length, rng.int(3, 5));
    const total = SPAWN_WEIGHTS.reduce((s, [, w]) => s + w, 0);
    for (let i = 0; i < count; i++) {
      const cell = far.splice(rng.int(0, far.length - 1), 1)[0];
      let roll = rng.next() * total;
      const kind = SPAWN_WEIGHTS.find(([, w]) => (roll -= w) < 0)?.[0] ?? 'crawler';
      const p = toWorld(cell.c, cell.r);
      this.add(kind, p.x, p.y, rng.next());
    }
  }

  private add(kind: EnemyKind, x: number, baseY: number, seed: number): void {
    const { scene } = this.host;
    const def = ENEMIES[kind];
    const sprite = scene.physics.add.sprite(x, baseY, `en-${kind}`);
    sprite.setOrigin(0.5, 1).setLighting(true).setDepth(this.host.depthAt(baseY));
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(def.body.w, def.body.h).setOffset((sprite.width - def.body.w) / 2, sprite.height - def.body.h - 1);
    if (def.speed === 0) body.setImmovable(true);
    this.group.add(sprite);
    const h = sprite.height;
    this.host.track(sprite, h - 1, Math.round(h * 0.85), Math.round(sprite.width * 0.8));
    this.enemies.push({ sprite, state: newEnemy(kind, scene.time.now, seed), hp: def.hp, flashUntil: 0, knockUntil: 0, knock: { x: 0, y: 0 } });
  }

  private find(sprite: Phaser.Physics.Arcade.Sprite): Enemy | undefined {
    return this.enemies.find((e) => e.sprite === sprite);
  }

  update(time: number): void {
    this.checkShots();
    const t = this.host.tile;
    const feet = this.host.playerFeet();
    for (const e of this.enemies) {
      const step = stepEnemy(e.state, { x: e.sprite.x / t, y: e.sprite.y / t }, { x: feet.x / t, y: feet.y / t }, time);
      e.state = step.state;
      let vx = step.velocity.x * t;
      let vy = step.velocity.y * t;
      if (time < e.knockUntil) {
        vx = e.knock.x;
        vy = e.knock.y;
      }
      e.sprite.setVelocity(vx, vy);
      if (Math.abs(vx) > 1) e.sprite.setFlipX(vx < 0);
      else if (step.anim === 'attack') e.sprite.setFlipX(feet.x < e.sprite.x);
      if (step.spit) this.fireSpore(e, step.spit);
      this.animate(e, step.anim, time);
      e.sprite.setDepth(this.host.depthAt(e.sprite.y));
    }
    // Spores die after flying 8 tiles.
    for (const child of this.spores.getChildren()) {
      const s = child as Phaser.Physics.Arcade.Image;
      if (s.active && Math.hypot(s.x - (s.getData('x0') as number), s.y - (s.getData('y0') as number)) > 8 * t) this.popSpore(s);
    }
  }

  /** Placeholder animation from code: squash while moving, telegraph before attacks, white flash when hit. */
  private animate(e: Enemy, anim: 'move' | 'attack' | 'idle', time: number): void {
    const s = e.sprite;
    if (time < e.flashUntil) {
      s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    } else if (anim === 'attack') {
      // Telegraph: pulse towards red so the player sees the attack coming.
      const k = 0.5 + 0.5 * Math.sin(time / 45);
      const g = Math.round(255 - 150 * k);
      s.setTint((255 << 16) | (g << 8) | g).setTintMode(Phaser.TintModes.MULTIPLY);
    } else {
      s.clearTint();
    }
    const phase = time / 120 + e.state.seed * 10;
    if (anim === 'move') s.setScale(1 + Math.sin(phase) * 0.08, 1 - Math.sin(phase) * 0.08);
    else if (anim === 'attack' && e.state.phase === 'windup') s.setScale(1.1 + Math.sin(time / 30) * 0.04, 0.9);
    else s.setScale(1, 1 + Math.sin(time / 400 + e.state.seed * 6) * 0.03);
  }

  private fireSpore(e: Enemy, dir: { x: number; y: number }): void {
    const top = e.sprite.y - e.sprite.height + 4;
    const spore = this.spores.get(e.sprite.x, top) as Phaser.Physics.Arcade.Image | null;
    if (!spore) return;
    spore.enableBody(true, e.sprite.x, top, true, true);
    spore.setDepth(12).setBlendMode(Phaser.BlendModes.ADD);
    spore.body!.setSize(6, 6);
    spore.setData('x0', spore.x).setData('y0', spore.y);
    // Aim at the astronaut's chest, from the vent.
    const feet = this.host.playerFeet();
    const dx = feet.x - spore.x;
    const dy = feet.y - 14 - spore.y;
    const d = Math.hypot(dx, dy) || 1;
    const v = SPORE_SPEED * this.host.tile;
    spore.setVelocity((dx / d) * v, (dy / d) * v);
    this.sporePuff.explode(5, spore.x, spore.y);
    void dir;
  }

  private popSpore(spore: Phaser.Physics.Arcade.Image): void {
    if (!spore.active) return;
    this.sporePuff.explode(6, spore.x, spore.y);
    spore.disableBody(true, true);
  }

  /**
   * Shots fly at chest height while enemy bodies sit at their feet (for
   * walls), so hits are tested against what the player sees: the shot
   * inside the enemy's drawn shape, trimmed a little at the edges.
   */
  private checkShots(): void {
    for (const child of this.host.shots.getChildren()) {
      const shot = child as Phaser.Physics.Arcade.Image;
      if (!shot.active || shot.getData('dropping')) continue;
      for (const e of this.enemies) {
        const s = e.sprite;
        const w = s.displayWidth * 0.8;
        const left = s.x - w / 2;
        const top = s.y - s.displayHeight * 0.95;
        const inX = shot.x >= left && shot.x <= left + w;
        // Either the bolt is inside the drawn shape, or its ground point
        // (where its shadow is) falls on the enemy's footprint: low
        // creatures like crawlers are hit by bolts passing just above them.
        const groundY = shot.y + SHOT_FLIGHT_HEIGHT;
        const inShape = shot.y >= top && shot.y <= s.y + 2;
        const onFootprint = groundY >= s.y - 14 && groundY <= s.y + 4;
        if (inX && (inShape || onFootprint)) {
          this.onShot(shot, e);
          break;
        }
      }
    }
  }

  private onShot(shot: Phaser.Physics.Arcade.Image, e: Enemy): void {
    if (!shot.active || shot.getData('dropping')) return;
    const v = shot.body!.velocity;
    const len = Math.hypot(v.x, v.y) || 1;
    this.host.shotHit(shot, shot.x, shot.y);
    e.hp -= this.host.shotDamage();
    const now = this.host.scene.time.now;
    e.flashUntil = now + 70;
    if (ENEMIES[e.state.kind].speed > 0) {
      e.knockUntil = now + 90;
      e.knock = { x: (v.x / len) * 140, y: (v.y / len) * 140 };
    }
    if (e.hp <= 0) this.kill(e);
  }

  private kill(e: Enemy): void {
    const { sprite } = e;
    const kind = e.state.kind;
    (kind === 'spitter' ? this.sporePuff : this.goo).explode(kind === 'miner' ? 28 : 18, sprite.x, sprite.y - sprite.height / 2);
    this.host.shakeAdd(kind === 'miner' ? 0.3 : 0.18);
    this.host.untrack(sprite);
    this.enemies = this.enemies.filter((x) => x !== e);
    // A quick squash and fade instead of vanishing on the spot.
    sprite.disableBody(true, false);
    this.host.scene.tweens.add({
      targets: sprite,
      scaleX: 1.5,
      scaleY: 0.2,
      alpha: 0,
      duration: 180,
      ease: 'Quad.In',
      onComplete: () => sprite.destroy(),
    });
    if (this.enemies.length === 0) this.onCleared?.();
  }
}

/** Simple lit placeholders, facing right, standing on their bottom row. */
function makeEnemyPlaceholders(scene: Phaser.Scene): void {
  const px = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const blob = (ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, light: string, mid: string, dark: string) => {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        const d = dx * dx + dy * dy;
        if (d > 1) continue;
        const l = -dx * 0.4 - dy * 0.7;
        px(ctx, d > 0.8 ? '#0b0d14' : l > 0.25 ? light : l > -0.3 ? mid : dark, x, y);
      }
    }
  };
  makeLitTexture(scene, 'en-crawler', 26, 16, (ctx) => {
    blob(ctx, 6, 10, 5, 4.5, '#a8b29a', '#7d8a72', '#4f5a48');
    blob(ctx, 12, 9.5, 5.5, 5.5, '#a8b29a', '#7d8a72', '#4f5a48');
    blob(ctx, 19, 9, 6, 6, '#b8c2aa', '#8d9a82', '#5f6a58');
    px(ctx, '#3a0f18', 23, 8, 2, 3); // mouth
    px(ctx, '#8a2a3a', 23, 9, 1, 1);
    px(ctx, '#0b0d14', 20, 6, 1, 1); // eye
    px(ctx, '#d8e8c8', 15, 5, 2, 1); // wet highlight
  });
  makeLitTexture(scene, 'en-spitter', 26, 30, (ctx) => {
    px(ctx, '#3a2a30', 4, 25, 18, 4); // tendrils
    px(ctx, '#3a2a30', 2, 27, 3, 2);
    px(ctx, '#3a2a30', 21, 27, 3, 2);
    blob(ctx, 13, 16, 9, 11, '#9a6a78', '#7a4a5a', '#5a3a48');
    px(ctx, '#0b0d14', 11, 5, 4, 2); // vent
    px(ctx, '#3a0f18', 12, 5, 2, 1);
    for (const [x, y] of [[7, 14], [8, 19], [18, 13], [19, 18], [13, 22]]) px(ctx, '#d8e04a', x, y, 2, 2);
    px(ctx, '#4f5762', 5, 24, 5, 2); // fused metal scrap
  });
  makeLitTexture(scene, 'en-miner', 30, 40, (ctx) => {
    // Hunched suited figure with a broken visor and alien growths.
    blob(ctx, 14, 26, 8, 10, '#c8ccc4', '#9aa0a0', '#6f7a8f'); // body
    px(ctx, '#3c4252', 8, 34, 5, 5); // legs
    px(ctx, '#3c4252', 16, 34, 5, 5);
    blob(ctx, 16, 11, 7, 7, '#c8ccc4', '#9aa0a0', '#6f7a8f'); // helmet
    px(ctx, '#14202a', 17, 9, 6, 5); // broken visor
    px(ctx, '#2a4a5a', 18, 9, 2, 1);
    blob(ctx, 21, 8, 3, 3, '#a8b29a', '#7d8a72', '#4f5a48'); // growth from the visor
    blob(ctx, 8, 19, 4, 4, '#a8b29a', '#7d8a72', '#4f5a48'); // growth on the shoulder
    px(ctx, '#b85a1c', 9, 23, 4, 2); // hazard stripe
    px(ctx, '#6f7a8f', 21, 24, 4, 10); // long arm
    px(ctx, '#e8e4d8', 24, 33, 2, 4); // claw
    px(ctx, '#e8e4d8', 26, 34, 2, 3);
  });
  if (!scene.textures.exists('en-spore')) {
    const g = scene.add.graphics();
    g.fillStyle(0xa0b030).fillRect(1, 1, 5, 5);
    g.fillStyle(0xd8e04a).fillRect(2, 2, 3, 3);
    g.fillStyle(0xffffff).fillRect(3, 2, 1, 1);
    g.generateTexture('en-spore', 7, 7).destroy();
  }
}
