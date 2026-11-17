import Phaser from 'phaser';
import { Rng } from '../rules/rng';
import { ENEMIES, EnemyKind, EnemyState, SPORE_SPEED, newEnemy, stepEnemy } from '../rules/enemies';
import { attachNormalMap } from '../render/pixelArt';

/**
 * Gemini sprite sheets cleaned by `npm run enemies` (one strip per enemy,
 * frames in the order of the original grid, facing right). Frame numbers
 * pick the rows that worked best on each sheet.
 */
const SHEETS: Record<EnemyKind, { w: number; h: number; scale?: number; anims: Record<string, { frames: number[]; fps: number; loop: boolean }> }> = {
  crawler: {
    w: 27,
    h: 25,
    anims: {
      move: { frames: [0, 1, 2, 3, 4, 5], fps: 10, loop: true },
      death: { frames: [32, 33, 34, 35], fps: 9, loop: false },
    },
  },
  spitter: {
    w: 30,
    h: 44,
    anims: {
      idle: { frames: [0, 1, 2, 3, 4, 5], fps: 6, loop: true },
      attack: { frames: [6, 7, 8, 9, 10, 11], fps: 12, loop: false },
      death: { frames: [20, 21, 22, 23], fps: 8, loop: false },
    },
  },
  miner: {
    w: 31,
    h: 45,
    // Drawn at the astronaut's height; shown bigger so it reads as a threat.
    scale: 1.35,
    anims: {
      move: { frames: [0, 1, 2, 3, 4, 5], fps: 7, loop: true },
      attack: { frames: [6, 7, 8, 9, 10, 11], fps: 11, loop: true },
      death: { frames: [14, 15, 16, 17], fps: 7, loop: false },
    },
  },
};

const animName = (kind: EnemyKind, anim: string) => `en-${kind}-${anim}`;

export function preloadEnemies(scene: Phaser.Scene): void {
  for (const [kind, sheet] of Object.entries(SHEETS)) {
    scene.load.spritesheet(`en-${kind}`, `sprites/enemies/${kind}.png`, { frameWidth: sheet.w, frameHeight: sheet.h });
  }
}

function createEnemyAnims(scene: Phaser.Scene): void {
  for (const [kind, sheet] of Object.entries(SHEETS) as [EnemyKind, (typeof SHEETS)[EnemyKind]][]) {
    attachNormalMap(scene, `en-${kind}`);
    for (const [name, a] of Object.entries(sheet.anims)) {
      const key = animName(kind, name);
      if (scene.anims.exists(key)) continue;
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(`en-${kind}`, { frames: a.frames }),
        frameRate: a.fps,
        repeat: a.loop ? -1 : 0,
      });
    }
  }
}

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
    createEnemyAnims(scene);
    makeSporeTexture(scene);
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
    const sprite = scene.physics.add.sprite(x, baseY, `en-${kind}`, 0);
    // Start each enemy on a different frame so they do not move in step.
    const first = kind === 'spitter' ? 'idle' : 'move';
    sprite.play({ key: animName(kind, first), startFrame: Math.floor(seed * SHEETS[kind].anims[first].frames.length) });
    const scale = SHEETS[kind].scale ?? 1;
    sprite.setOrigin(0.5, 1).setScale(scale).setLighting(true).setDepth(this.host.depthAt(baseY));
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(def.body.w, def.body.h).setOffset((sprite.width - def.body.w) / 2, sprite.height - def.body.h - 1);
    if (def.speed === 0) body.setImmovable(true);
    this.group.add(sprite);
    const h = sprite.height;
    this.host.track(sprite, h - 1, Math.round(h * scale * 0.85), Math.round(sprite.width * scale * 0.8));
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

  /** Sprite animation for the current behaviour, a red telegraph before attacks, a white flash when hit. */
  private animate(e: Enemy, anim: 'move' | 'attack' | 'idle', time: number): void {
    const s = e.sprite;
    const kind = e.state.kind;
    const anims = SHEETS[kind].anims;
    const wanted = anim === 'attack' && anims.attack ? 'attack' : anims.move ? 'move' : 'idle';
    const key = animName(kind, wanted);
    if (s.anims.currentAnim?.key !== key) s.play(key);
    // Walkers pause their walk cycle while standing still.
    s.anims.timeScale = anim === 'idle' && wanted === 'move' ? 0.3 : 1;
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
  }

  private fireSpore(e: Enemy, dir: { x: number; y: number }): void {
    const top = e.sprite.y - e.sprite.displayHeight + 4;
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
    (kind === 'spitter' ? this.sporePuff : this.goo).explode(kind === 'miner' ? 28 : 18, sprite.x, sprite.y - sprite.displayHeight / 2);
    this.host.shakeAdd(kind === 'miner' ? 0.3 : 0.18);
    this.host.untrack(sprite);
    this.enemies = this.enemies.filter((x) => x !== e);
    // Play the death animation, leave the remains a moment, then fade them out.
    sprite.disableBody(true, false);
    sprite.clearTint();
    sprite.anims.timeScale = 1;
    sprite.play(animName(kind, 'death'));
    sprite.setDepth(this.host.depthAt(sprite.y) - 0.02);
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.host.scene.tweens.add({ targets: sprite, alpha: 0, delay: 900, duration: 700, onComplete: () => sprite.destroy() });
    });
    if (this.enemies.length === 0) this.onCleared?.();
  }
}

/** The spore the spitter fires: a small glowing ball. */
function makeSporeTexture(scene: Phaser.Scene): void {
  if (!scene.textures.exists('en-spore')) {
    const g = scene.add.graphics();
    g.fillStyle(0xa0b030).fillRect(1, 1, 5, 5);
    g.fillStyle(0xd8e04a).fillRect(2, 2, 3, 3);
    g.fillStyle(0xffffff).fillRect(3, 2, 1, 1);
    g.generateTexture('en-spore', 7, 7).destroy();
  }
}
