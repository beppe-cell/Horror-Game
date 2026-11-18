import Phaser from 'phaser';
import { Rng } from '../rules/rng';
import { BASH_DAMAGE, BASH_RANGE, BLOAT_RING, GOLEM_DAMAGE, GOLEM_RANGE, GOLEM_SHARDS, MINE_LIFE_MS, SPEAR_SPEED, JELLY_PULSE_RADIUS, SLIME_BIG, SLIME_SIZES, ENEMIES, EnemyKind, EnemyState, LURKER_REACH, SPORE_SPEED, WAKE_MS, newEnemy, roomRoster, stepEnemy, weightsFor } from '../rules/enemies';
import { KIT_BOSSES, type BossKind } from '../rules/bosses';
import { KitDef, KitState, newKit, stepKit, KIT_WAKE_MS } from '../rules/bossKit';
import { QUEEN_BODY, QUEEN_CONTACT_DAMAGE, QUEEN_HP, QUEEN_WAKE_MS, QueenState, SPIT_SPREAD, newQueen, stepQueen } from '../rules/queen';
import { attachNormalMap } from '../render/pixelArt';
import { BOSS_BODY, BOSS_CONTACT_DAMAGE, BOSS_HP, BOSS_WAKE_MS, BossState, EMERGE_DAMAGE, EMERGE_RADIUS, newBoss, stepBoss } from '../rules/boss';

/**
 * Gemini sprite sheets cleaned by `npm run enemies` (one strip per enemy,
 * frames in the order of the original grid, facing right). Frame numbers
 * pick the rows that worked best on each sheet.
 */
const SHEETS: Record<EnemyKind, { w: number; h: number; scale?: number; base?: number; facesLeft?: boolean; anims: Record<string, { frames: number[]; fps: number; loop: boolean }> }> = {
  crawler: {
    w: 38,
    h: 36,
    // Leg tips on row 30; drawn a little big for a basic enemy.
    base: 30,
    scale: 0.8,
    anims: {
      move: { frames: [0, 1, 2, 3, 4, 5], fps: 14, loop: true },
      death: { frames: [14, 15, 16, 17], fps: 9, loop: false },
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
  drone: {
    w: 34,
    h: 38,
    // It hovers: the ground is 10 px below the bottom of its drawing (row 33).
    base: 43,
    scale: 0.8,
    anims: {
      move: { frames: [0, 1, 2, 3, 4, 5], fps: 10, loop: true },
      attack: { frames: [6, 7, 8, 9, 10, 11], fps: 10, loop: false },
      death: { frames: [14, 15, 16, 17], fps: 8, loop: false },
    },
  },
  lurker: {
    w: 39,
    h: 34,
    // The pool rests on row 30.
    base: 30,
    scale: 0.9,
    anims: {
      idle: { frames: [0, 1, 2, 3, 4, 5], fps: 5, loop: true },
      attack: { frames: [6, 7, 8, 9, 10, 11], fps: 4, loop: false },
      death: { frames: [14, 15, 16, 17], fps: 7, loop: false },
    },
  },
  bloater: {
    w: 38,
    h: 41,
    // Tendril tips on row 37.
    base: 37,
    scale: 0.8,
    anims: {
      move: { frames: [0, 1, 2, 3, 4, 5], fps: 6, loop: true },
      attack: { frames: [6, 7, 8, 9, 10, 11], fps: 12, loop: false },
      death: { frames: [14, 15, 16, 17], fps: 10, loop: false },
    },
  },
  worker: {
    w: 43,
    h: 69,
    // Drawn big and facing left; it hovers about 6 px above the ground.
    base: 68,
    scale: 0.62,
    facesLeft: true,
    anims: {
      move: { frames: [0, 1, 2, 3, 4, 5], fps: 16, loop: true },
      attack: { frames: [6, 7, 8, 9, 10, 11], fps: 14, loop: false },
      death: { frames: [14, 15, 16, 17], fps: 9, loop: false },
    },
  },
  cocoon: {
    w: 40,
    h: 61,
    // Roots on row 60.
    base: 60,
    scale: 0.55,
    anims: {
      idle: { frames: [0, 1, 2, 3, 4, 5], fps: 5, loop: true },
      attack: { frames: [6, 7, 8, 9, 10, 11], fps: 7, loop: false },
      death: { frames: [14, 15, 16, 17], fps: 8, loop: false },
    },
  },
  guardian: {
    w: 41,
    h: 52,
    // Feet on row 42.
    base: 42,
    scale: 0.75,
    anims: {
      move: { frames: [0, 1, 2, 3, 4, 5], fps: 7, loop: true },
      attack: { frames: [6, 7, 8, 9, 10, 11], fps: 11, loop: false },
      death: { frames: [14, 15, 16, 17], fps: 7, loop: false },
    },
  },
  slime: {
    w: 41,
    h: 53,
    // Rests on row 43; its scale depends on its size (rules SLIME_SIZES).
    base: 43,
    anims: {
      move: { frames: [0, 1, 2, 3, 4, 5], fps: 8, loop: true },
      split: { frames: [6, 7, 8, 9, 10, 11], fps: 16, loop: false },
      death: { frames: [14, 15, 16, 17], fps: 10, loop: false },
    },
  },
  jelly: {
    w: 41,
    h: 58,
    // It floats: the ground is a few pixels below its tentacle tips.
    base: 60,
    scale: 0.6,
    anims: {
      move: { frames: [0, 1, 2, 3, 4, 5], fps: 7, loop: true },
      attack: { frames: [6, 7, 8, 9, 10, 11], fps: 7, loop: false },
      death: { frames: [14, 15, 16, 17], fps: 8, loop: false },
    },
  },
  hunter: {
    w: 40,
    h: 45,
    // Feet on row 44; about the astronaut's height.
    base: 44,
    scale: 1.05,
    anims: {
      move: { frames: [0, 1, 2, 3, 4, 5], fps: 9, loop: true },
      attack: { frames: [6, 7, 8, 9, 10, 11], fps: 12, loop: false },
      death: { frames: [14, 15, 16, 17], fps: 8, loop: false },
    },
  },
  fungus: {
    w: 38,
    h: 39,
    base: 38,
    scale: 0.75,
    anims: {
      idle: { frames: [0, 1, 2, 3, 4, 5], fps: 5, loop: true },
      attack: { frames: [6, 7, 8, 9, 10, 11], fps: 9, loop: false },
      death: { frames: [14, 15, 16, 17], fps: 7, loop: false },
    },
  },
  golem: {
    w: 38,
    h: 43,
    // Feet on row 38 when walking; the slam row is drawn a little lower.
    base: 39,
    scale: 0.9,
    anims: {
      move: { frames: [0, 1, 2, 3, 4, 5], fps: 5, loop: true },
      attack: { frames: [6, 7, 8, 9, 10, 11], fps: 8, loop: false },
      death: { frames: [14, 15, 16, 17], fps: 7, loop: false },
    },
  },
};

type KitKind = keyof typeof KIT_BOSSES;
type Anim = { frames: number[]; fps: number; loop: boolean };
const death: Anim = { frames: [20, 21, 22, 23], fps: 5, loop: false };
/**
 * Sheets of the bosses made from attack lists: 6x4 grids cleaned by
 * `npm run boss`. `front` bosses face the viewer and never turn.
 */
const KIT_SHEETS: Record<KitKind, { w: number; h: number; scale: number; base: number; facesLeft?: boolean; front?: boolean; anims: Record<string, Anim> }> = {
  colossus: {
    w: 52,
    h: 53,
    scale: 1.3,
    base: 52,
    anims: {
      move: { frames: [0, 1, 2, 3, 4, 5], fps: 7, loop: true },
      cannon: { frames: [6, 7, 8, 9, 10, 11], fps: 10, loop: false },
      drill: { frames: [12, 13, 14], fps: 12, loop: true },
      overheat: { frames: [15, 16, 17], fps: 4, loop: true },
      death,
    },
  },
  oracle: {
    w: 53,
    h: 47,
    scale: 1.3,
    // It floats: the ground is below its drawing.
    base: 52,
    front: true,
    anims: {
      move: { frames: [0, 1, 2, 3, 4, 5], fps: 6, loop: true },
      beams: { frames: [6, 7, 8, 9, 10, 11], fps: 8, loop: true },
      out: { frames: [12, 13, 14], fps: 8, loop: false },
      in: { frames: [15, 16, 17], fps: 8, loop: false },
      death,
    },
  },
  warlord: {
    w: 52,
    h: 53,
    // Bigger than the rival hunters it leads.
    scale: 1.6,
    base: 51,
    anims: {
      move: { frames: [0, 1, 2, 3, 4, 5], fps: 7, loop: true },
      lunge: { frames: [6, 7, 8, 9, 10, 11], fps: 12, loop: false },
      spears: { frames: [12, 13, 14], fps: 6, loop: false },
      cry: { frames: [15, 16, 17], fps: 5, loop: false },
      death,
    },
  },
  amalgam: {
    w: 53,
    h: 52,
    scale: 1.3,
    base: 49,
    anims: {
      move: { frames: [0, 1, 2, 3, 4, 5], fps: 6, loop: true },
      lash: { frames: [6, 7, 8, 9, 10, 11], fps: 9, loop: false },
      melt: { frames: [12, 13, 14], fps: 6, loop: false },
      reform: { frames: [15, 16, 17], fps: 6, loop: false },
      death,
    },
  },
  reactor: {
    w: 53,
    h: 53,
    scale: 1.2,
    base: 56,
    front: true,
    anims: {
      move: { frames: [0, 1, 2, 3, 4, 5], fps: 8, loop: true },
      nova: { frames: [6, 7, 8, 9, 10, 11], fps: 8, loop: true },
      arc: { frames: [12, 13, 14], fps: 10, loop: true },
      cool: { frames: [15, 16, 17], fps: 4, loop: true },
      death,
    },
  },
};
const kitKey = (k: KitKind) => `boss-${k}`;
const isKit = (k: BossKind): k is KitKind => k in KIT_BOSSES;

/** Faces a sprite left or right; sheets are drawn facing right unless `facesLeft`. */
function face(sprite: Phaser.GameObjects.Sprite, kind: EnemyKind, left: boolean): void {
  sprite.setFlipX(left !== !!SHEETS[kind].facesLeft);
}
/** True when the enemy looks left. */
function looksLeft(sprite: Phaser.GameObjects.Sprite, kind: EnemyKind): boolean {
  return sprite.flipX !== !!SHEETS[kind].facesLeft;
}

const QUEEN_KEY = 'boss-queen';
const QUEEN_W = 49;
const QUEEN_H = 53;
const QUEEN_SCALE = 1.25;
const QUEEN_BASE_ROW = 51;
const QUEEN_ANIMS: Record<string, { frames: number[]; fps: number; loop: boolean }> = {
  crawl: { frames: [0, 1, 2, 3, 4, 5], fps: 7, loop: true },
  spit: { frames: [6, 7, 8, 9, 10, 11], fps: 9, loop: false },
  summon: { frames: [12, 13, 14], fps: 4, loop: false },
  charge: { frames: [15, 16, 17], fps: 8, loop: true },
  death: { frames: [20, 21, 22, 23], fps: 5, loop: false },
};

const animName = (kind: EnemyKind, anim: string) => `en-${kind}-${anim}`;

const BOSS_KEY = 'boss-brood';
/** Frame size of her sheet, and how much bigger she is drawn. */
const BOSS_W = 30;
const BOSS_H = 28;
const BOSS_SCALE = 2;

/** Brood Mother animations, by frame of her 6x4 sheet. */
const BOSS_ANIMS: Record<string, { frames: number[]; fps: number; loop: boolean }> = {
  crawl: { frames: [0, 1, 2, 3, 4, 5], fps: 7, loop: true },
  spores: { frames: [6, 7, 8, 9, 10, 11], fps: 8, loop: false },
  sink: { frames: [12, 13, 14], fps: 5, loop: false },
  emerge: { frames: [15, 16, 17], fps: 6, loop: false },
  brood: { frames: [18, 19, 20], fps: 4, loop: false },
  death: { frames: [21, 22, 23], fps: 4, loop: false },
};
/** Row of the boss frame her legs rest on. */
const BOSS_BASE_ROW = 25;

function createBossAnims(scene: Phaser.Scene): void {
  for (const [kind, sheet] of Object.entries(KIT_SHEETS) as [KitKind, (typeof KIT_SHEETS)[KitKind]][]) {
    attachNormalMap(scene, kitKey(kind));
    for (const [name, a] of Object.entries(sheet.anims)) {
      const key = `${kitKey(kind)}-${name}`;
      if (scene.anims.exists(key)) continue;
      scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(kitKey(kind), { frames: a.frames }), frameRate: a.fps, repeat: a.loop ? -1 : 0 });
    }
  }
  attachNormalMap(scene, QUEEN_KEY);
  for (const [name, a] of Object.entries(QUEEN_ANIMS)) {
    const key = `queen-${name}`;
    if (scene.anims.exists(key)) continue;
    scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(QUEEN_KEY, { frames: a.frames }), frameRate: a.fps, repeat: a.loop ? -1 : 0 });
  }
  attachNormalMap(scene, BOSS_KEY);
  for (const [name, a] of Object.entries(BOSS_ANIMS)) {
    const key = `boss-${name}`;
    if (scene.anims.exists(key)) continue;
    scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(BOSS_KEY, { frames: a.frames }), frameRate: a.fps, repeat: a.loop ? -1 : 0 });
  }
}

export function preloadEnemies(scene: Phaser.Scene): void {
  for (const [kind, sheet] of Object.entries(SHEETS)) {
    scene.load.spritesheet(`en-${kind}`, `sprites/enemies/${kind}.png`, { frameWidth: sheet.w, frameHeight: sheet.h });
  }
  scene.load.spritesheet(BOSS_KEY, 'sprites/bosses/brood-mother.png', { frameWidth: BOSS_W, frameHeight: BOSS_H });
  scene.load.spritesheet(QUEEN_KEY, 'sprites/bosses/queen.png', { frameWidth: QUEEN_W, frameHeight: QUEEN_H });
  for (const [kind, sheet] of Object.entries(KIT_SHEETS)) {
    scene.load.spritesheet(kitKey(kind as KitKind), `sprites/bosses/${kind}.png`, { frameWidth: sheet.w, frameHeight: sheet.h });
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
  /** A shot hit an enemy: impact feedback, and remove the shot unless it pierces (`keep`). */
  shotHit(shot: Phaser.Physics.Arcade.Image, x: number, y: number, keep: boolean): void;
  /** Shots go through enemies. */
  pierce(): boolean;
  /** Floor area enemies must stay inside, in world pixels. */
  bounds: { x: number; y: number; w: number; h: number };
  /** Hurts the astronaut by `amount` half cells, pushed away from (fromX, fromY). */
  hurtPlayer(amount: number, fromX: number, fromY: number): void;
  /** Adds shadows and water reflection for a standing object. */
  track(obj: Phaser.GameObjects.Sprite, baseRow: number, height: number, width: number): void;
  untrack(obj: Phaser.GameObjects.Sprite): void;
  depthAt(baseY: number): number;
  shakeAdd(amount: number): void;
  /** Where the astronaut's feet are, in world pixels. */
  playerFeet(): { x: number; y: number };
  /** True over room floor or water (not walls or the rock of an L's missing corner). */
  open(x: number, y: number): boolean;
}

interface Boss {
  sprite: Phaser.Physics.Arcade.Sprite;
  state: BossState;
  hp: number;
  flashUntil: number;
  nextDirt: number;
  /** Where she went under, in world pixels, while tunnelling. */
  burrowFrom?: { x: number; y: number };
}

interface KitBoss {
  kind: KitKind;
  def: KitDef;
  sprite: Phaser.Physics.Arcade.Sprite;
  state: KitState;
  hp: number;
  flashUntil: number;
  anim: string;
}

interface Queen {
  sprite: Phaser.Physics.Arcade.Sprite;
  state: QueenState;
  hp: number;
  flashUntil: number;
}

interface Enemy {
  sprite: Phaser.Physics.Arcade.Sprite;
  state: EnemyState;
  hp: number;
  flashUntil: number;
  knockUntil: number;
  knock: { x: number; y: number };
  /** Under water (the lurker): no hits either way. */
  hidden: boolean;
}

/** Height of player shots above the floor, in pixels (matches PlayScene). */
const SHOT_FLIGHT_HEIGHT = 16;


/**
 * Enemies of the current room: spawning, behaviour (rules/enemies.ts),
 * spores, hits, knockback and death. Until the Gemini art arrives they are
 * drawn as simple code placeholders, lit like everything else.
 */
export class EnemyManager {
  private enemies: Enemy[] = [];
  private boss?: Boss;
  private queen?: Queen;
  private kit?: KitBoss;
  /** Which floor: picks the enemy mix. */
  floor = 1;
  /** Which boss this floor's boss room holds. */
  bossKind: BossKind = 'brood';
  private clank!: Phaser.GameObjects.Particles.ParticleEmitter;
  private dirt!: Phaser.GameObjects.Particles.ParticleEmitter;
  /** Red cracking ring on the floor where the boss will burst out. */
  private warn?: Phaser.GameObjects.Graphics;
  /** The last spot warned about, in tiles, so she emerges exactly there. */
  private lastWarning?: { x: number; y: number };
  /** Deeper floors make every enemy tougher: health is multiplied by this. */
  hpScale = 1;
  /** Boss health from 0 to 1 after each hit; 0 when she dies. */
  onBossHealth?: (frac: number) => void;
  private spores!: Phaser.Physics.Arcade.Group;
  private goo!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sporePuff!: Phaser.GameObjects.Particles.ParticleEmitter;
  private group!: Phaser.Physics.Arcade.Group;
  /** Drones: they fly over rocks and water, so they do not collide with walls. */
  private flyers!: Phaser.Physics.Arcade.Group;
  /** Called once when the last enemy dies. */
  onCleared?: () => void;

  constructor(private host: EnemyHost) {
    const { scene } = host;
    createEnemyAnims(scene);
    createBossAnims(scene);
    makeSporeTexture(scene);
    this.group = scene.physics.add.group();
    this.flyers = scene.physics.add.group();
    this.spores = scene.physics.add.group({ defaultKey: 'en-spore', maxSize: 60 });
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
    this.clank = scene.add
      .particles(0, 0, 'px-spark', {
        lifespan: { min: 120, max: 260 },
        speed: { min: 40, max: 120 },
        scale: { start: 1.2, end: 0 },
        tint: [0xffffff, 0xe8dcc8, 0xd8e04a],
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(20);
    this.dirt = scene.add
      .particles(0, 0, 'px-spark', {
        lifespan: { min: 300, max: 650 },
        speed: { min: 30, max: 120 },
        angle: { min: 200, max: 340 },
        gravityY: 260,
        scale: { start: 2, end: 0.6 },
        tint: [0x3b3226, 0x5a4a36, 0x7d8a72],
        emitting: false,
      })
      .setDepth(20);

    scene.physics.add.collider(this.group, host.walls);
    scene.physics.add.collider(this.group, this.group);
    scene.physics.add.overlap(host.player, [this.group, this.flyers], (_p, sprite) => {
      const b = this.boss;
      if (b && sprite === b.sprite) host.hurtPlayer(BOSS_CONTACT_DAMAGE, b.sprite.x, b.sprite.y);
      const q = this.queen;
      if (q && sprite === q.sprite) host.hurtPlayer(QUEEN_CONTACT_DAMAGE, q.sprite.x, q.sprite.y);
      const k = this.kit;
      if (k && sprite === k.sprite && k.sprite.visible) host.hurtPlayer(k.def.contactDamage, k.sprite.x, k.sprite.y);
      const e = this.find(sprite as Phaser.Physics.Arcade.Sprite);
      if (e && !e.hidden) host.hurtPlayer(ENEMIES[e.state.kind].contactDamage, e.sprite.x, e.sprite.y);
    });
    scene.physics.add.overlap(this.spores, host.walls, (spore) => this.popSpore(spore as Phaser.Physics.Arcade.Image));
    scene.physics.add.overlap(host.player, this.spores, (_p, spore) => {
      const s = spore as Phaser.Physics.Arcade.Image;
      if (!s.active) return;
      host.hurtPlayer(1, s.x, s.y);
      this.popSpore(s);
    });
  }

  /**
   * Restarts the wake-up wait from `now`, for when the room only becomes
   * playable after loading: enemies never get a head start.
   */
  rewake(now: number): void {
    for (const e of this.enemies) {
      if (e.state.phase === 'idle' || e.state.phase === 'hidden') e.state = { ...e.state, until: Math.max(e.state.until, now + WAKE_MS) };
    }
    if (this.boss && this.boss.state.phase === 'wake') this.boss.state = { ...this.boss.state, until: now + BOSS_WAKE_MS };
    if (this.queen && this.queen.state.phase === 'wake') this.queen.state = { ...this.queen.state, until: now + QUEEN_WAKE_MS };
    if (this.kit && this.kit.state.phase === 'wake') this.kit.state = { ...this.kit.state, until: now + KIT_WAKE_MS };
  }

  /** Where the enemies that can be hit stand (feet), for homing bolts. */
  targets(): { x: number; y: number }[] {
    const list = this.enemies.filter((e) => !e.hidden).map((e) => ({ x: e.sprite.x, y: e.sprite.y }));
    if (this.boss?.sprite.visible) list.push({ x: this.boss.sprite.x, y: this.boss.sprite.y });
    if (this.queen) list.push({ x: this.queen.sprite.x, y: this.queen.sprite.y });
    if (this.kit?.sprite.visible) list.push({ x: this.kit.sprite.x, y: this.kit.sprite.y });
    return list;
  }

  get alive(): number {
    return this.enemies.length + (this.boss ? 1 : 0) + (this.queen ? 1 : 0) + (this.kit ? 1 : 0);
  }

  /** The floor's boss, standing with her feet at (x, baseY). */
  spawnBoss(x: number, baseY: number): void {
    if (isKit(this.bossKind)) this.spawnKit(this.bossKind, x, baseY);
    else if (this.bossKind === 'queen') this.spawnQueen(x, baseY);
    else this.spawnBrood(x, baseY);
  }

  private spawnKit(kind: KitKind, x: number, baseY: number): void {
    const { scene } = this.host;
    const sheet = KIT_SHEETS[kind];
    const def = KIT_BOSSES[kind];
    const key = kitKey(kind);
    const sprite = scene.physics.add.sprite(x, baseY, key, 0);
    sprite.setOrigin(0.5, (sheet.base + 1) / sheet.h).setScale(sheet.scale).setLighting(true).setDepth(this.host.depthAt(baseY));
    sprite.play(`${key}-move`);
    sprite.anims.timeScale = 0.3;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    const bw = def.body.w / sheet.scale;
    const bh = def.body.h / sheet.scale;
    body.setSize(bw, bh).setOffset((sheet.w - bw) / 2, Math.min(sheet.h, sheet.base + 1) - bh);
    body.setImmovable(true);
    body.pushable = false;
    this.group.add(sprite);
    this.host.track(sprite, Math.min(sheet.base, sheet.h - 1), Math.round(sheet.h * sheet.scale * 0.85), Math.round(sheet.w * sheet.scale * 0.7));
    this.kit = { kind, def, sprite, state: newKit(scene.time.now), hp: def.hp * this.hpScale, flashUntil: 0, anim: 'move' };
  }

  private spawnQueen(x: number, baseY: number): void {
    const { scene } = this.host;
    const sprite = scene.physics.add.sprite(x, baseY, QUEEN_KEY, 0);
    sprite.setOrigin(0.5, (QUEEN_BASE_ROW + 1) / QUEEN_H).setScale(QUEEN_SCALE).setLighting(true).setDepth(this.host.depthAt(baseY));
    sprite.play('queen-crawl');
    sprite.anims.timeScale = 0.3;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    const bw = QUEEN_BODY.w / QUEEN_SCALE;
    const bh = QUEEN_BODY.h / QUEEN_SCALE;
    body.setSize(bw, bh).setOffset((QUEEN_W - bw) / 2, QUEEN_BASE_ROW + 1 - bh);
    body.setImmovable(true);
    body.pushable = false;
    this.group.add(sprite);
    this.host.track(sprite, QUEEN_BASE_ROW, 58, 54);
    this.queen = { sprite, state: newQueen(scene.time.now), hp: QUEEN_HP * this.hpScale, flashUntil: 0 };
  }

  /** The Brood Mother. */
  private spawnBrood(x: number, baseY: number): void {
    const { scene } = this.host;
    const sprite = scene.physics.add.sprite(x, baseY, BOSS_KEY, 0);
    sprite.setOrigin(0.5, (BOSS_BASE_ROW + 1) / BOSS_H).setScale(BOSS_SCALE).setLighting(true).setDepth(this.host.depthAt(baseY));
    sprite.play('boss-crawl');
    sprite.anims.timeScale = 0.3;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    // Body sizes are in frame pixels; Phaser scales them with the sprite.
    const bw = BOSS_BODY.w / BOSS_SCALE;
    const bh = BOSS_BODY.h / BOSS_SCALE;
    body.setSize(bw, bh).setOffset((BOSS_W - bw) / 2, BOSS_BASE_ROW + 1 - bh);
    body.setImmovable(true);
    body.pushable = false;
    this.group.add(sprite);
    this.host.track(sprite, BOSS_BASE_ROW, 46, 54);
    this.boss = { sprite, state: newBoss(scene.time.now), hp: BOSS_HP * this.hpScale, flashUntil: 0, nextDirt: 0 };
  }

  /**
   * Places 3-5 enemies (plus `extra` in big rooms) on free cells away from
   * the player's start, and sometimes a lurker in a pool (`water` cells).
   */
  spawn(
    rng: Rng,
    cells: { c: number; r: number }[],
    origin: { x: number; y: number },
    toWorld: (c: number, r: number) => { x: number; y: number },
    extra = 0,
    water: { c: number; r: number }[] = [],
  ): void {
    const pools = water.filter((cell) => {
      const p = toWorld(cell.c, cell.r);
      return Math.hypot(p.x - origin.x, p.y - origin.y) >= 4 * this.host.tile;
    });
    const taken: EnemyKind[] = [];
    if (pools.length && rng.next() < 0.5) {
      const cell = rng.pick(pools);
      const p = toWorld(cell.c, cell.r);
      this.add('lurker', p.x, p.y, rng.next());
      taken.push('lurker');
    }
    const far = cells.filter((cell) => {
      const p = toWorld(cell.c, cell.r);
      return Math.hypot(p.x - origin.x, p.y - origin.y) >= 4 * this.host.tile;
    });
    // At most two kinds per room; small ones in bigger groups, big ones in pairs.
    const roster = roomRoster(rng, rng.int(3, 5) + extra, taken, weightsFor(this.floor));
    for (const kind of roster) {
      if (!far.length) break;
      const cell = far.splice(rng.int(0, far.length - 1), 1)[0];
      const p = toWorld(cell.c, cell.r);
      this.add(kind, p.x, p.y, rng.next());
    }
  }

  private add(kind: EnemyKind, x: number, baseY: number, seed: number, size = SLIME_BIG): Enemy {
    const { scene } = this.host;
    const def = ENEMIES[kind];
    const sprite = scene.physics.add.sprite(x, baseY, `en-${kind}`, 0);
    // Start each enemy on a different frame so they do not move in step.
    const first = SHEETS[kind].anims.move ? 'move' : 'idle';
    sprite.play({ key: animName(kind, first), startFrame: Math.floor(seed * SHEETS[kind].anims[first].frames.length) });
    const scale = kind === 'slime' ? SLIME_SIZES[size].scale : (SHEETS[kind].scale ?? 1);
    const base = SHEETS[kind].base ?? sprite.height - 1;
    sprite.setOrigin(0.5, (base + 1) / sprite.height).setScale(scale).setLighting(true).setDepth(this.host.depthAt(baseY));
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(def.body.w, def.body.h).setOffset((sprite.width - def.body.w) / 2, base - def.body.h);
    if (def.speed === 0) body.setImmovable(true);
    (kind === 'drone' || kind === 'worker' || kind === 'jelly' ? this.flyers : this.group).add(sprite);
    const h = sprite.height;
    this.host.track(sprite, base, Math.round(h * scale * 0.85), Math.round(sprite.width * scale * 0.8));
    const state = kind === 'slime' ? { ...newEnemy(kind, scene.time.now, seed), size } : newEnemy(kind, scene.time.now, seed);
    const hp = kind === 'slime' ? SLIME_SIZES[size].hp : def.hp;
    const enemy = { sprite, state, hp: hp * this.hpScale, flashUntil: 0, knockUntil: 0, knock: { x: 0, y: 0 }, hidden: kind === 'lurker' };
    this.enemies.push(enemy);
    return enemy;
  }

  private find(sprite: Phaser.Physics.Arcade.Sprite): Enemy | undefined {
    return this.enemies.find((e) => e.sprite === sprite);
  }

  update(time: number): void {
    this.checkShots();
    this.updateBoss(time);
    this.updateQueen(time);
    this.updateKit(time);
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
      // Drones fly over everything but walls and the rock of an L's missing corner.
      if ((e.state.kind === 'drone' || e.state.kind === 'worker' || e.state.kind === 'jelly') && !this.host.open(e.sprite.x + vx / 30, e.sprite.y + vy / 30)) {
        const d = Math.hypot(feet.x - e.sprite.x, feet.y - e.sprite.y) || 1;
        vx = ((feet.x - e.sprite.x) / d) * 40;
        vy = ((feet.y - e.sprite.y) / d) * 40;
      }
      e.sprite.setVelocity(vx, vy);
      const kind = e.state.kind;
      if (kind === 'cocoon' || kind === 'fungus') {
        // Rooted: never turns.
      } else if (Math.abs(vx) > 1) face(e.sprite, kind, vx < 0);
      else if (step.anim === 'attack' || kind === 'guardian') face(e.sprite, kind, feet.x < e.sprite.x);
      if (step.bash) {
        this.dirt.explode(14, e.sprite.x + (looksLeft(e.sprite, kind) ? -12 : 12), e.sprite.y);
        this.host.shakeAdd(0.2);
        if (Math.hypot(feet.x - e.sprite.x, feet.y - e.sprite.y) <= BASH_RANGE * t) this.host.hurtPlayer(BASH_DAMAGE, e.sprite.x, e.sprite.y);
      }
      if (step.hatch) this.hatch(e, step.hatch);
      if (step.pulse) this.pulse(e);
      if (step.spear) {
        // A fast spear, thrown from shoulder height.
        const sy = e.sprite.y - e.sprite.displayHeight * 0.6;
        const d = Math.hypot(feet.x - e.sprite.x, feet.y - 14 - sy) || 1;
        const v = SPEAR_SPEED * t;
        this.launchSpore(e.sprite.x, sy, ((feet.x - e.sprite.x) / d) * v, ((feet.y - 14 - sy) / d) * v, 0x9af8ff, 'en-spear');
      }
      if (step.mines) this.scatterMines(e, step.mines);
      if (step.slam) {
        this.dirt.explode(20, e.sprite.x, e.sprite.y);
        this.host.shakeAdd(0.3);
        if (Math.hypot(feet.x - e.sprite.x, feet.y - e.sprite.y) <= GOLEM_RANGE * t) this.host.hurtPlayer(GOLEM_DAMAGE, e.sprite.x, e.sprite.y);
        this.shardRing(e.sprite.x, e.sprite.y - 10, GOLEM_SHARDS, Math.random());
      }
      if (step.spit) this.fireSpore(e, step.spit);
      if (step.fan) {
        // Red bolts from the drone's eye.
        const eyeY = e.sprite.y - e.sprite.displayHeight * 0.55;
        const v = SPORE_SPEED * 1.15 * t;
        for (const d of step.fan) this.launchSpore(e.sprite.x, eyeY, d.x * v, d.y * v, 0xff5a6a);
      }
      if (e.state.kind === 'lurker') {
        const hidden = !!step.hidden;
        if (hidden !== e.hidden) {
          e.hidden = hidden;
          (e.sprite.body as Phaser.Physics.Arcade.Body).enable = !hidden;
          if (!hidden) this.host.shakeAdd(0.12);
        }
        if (step.strike && Math.hypot(feet.x - e.sprite.x, feet.y - e.sprite.y) <= LURKER_REACH * t) {
          this.host.hurtPlayer(1, e.sprite.x, e.sprite.y);
        }
      }
      this.animate(e, step.anim, time);
      e.sprite.setDepth(this.host.depthAt(e.sprite.y));
    }
    // Spores die after flying 8 tiles; mines stop where they land and burst after a while.
    for (const child of this.spores.getChildren()) {
      const s = child as Phaser.Physics.Arcade.Image;
      if (!s.active) continue;
      const stopAt = s.getData('stopAt') as number | undefined;
      if (stopAt !== undefined) {
        if (time >= stopAt) s.setVelocity(0, 0);
        if (time >= (s.getData('until') as number)) this.popSpore(s);
        else s.setAlpha(0.6 + 0.4 * Math.sin(time / 120));
        continue;
      }
      if (Math.hypot(s.x - (s.getData('x0') as number), s.y - (s.getData('y0') as number)) > 8 * t) this.popSpore(s);
    }
  }

  /** The jelly's electric ring: a flash spreading out to JELLY_PULSE_RADIUS. */
  private pulse(e: Enemy): void {
    const { scene } = this.host;
    const r = JELLY_PULSE_RADIUS * this.host.tile;
    const x = e.sprite.x;
    const y = e.sprite.y - 4;
    const ring = scene.add.graphics().setDepth(this.host.depthAt(e.sprite.y) + 0.01).setBlendMode(Phaser.BlendModes.ADD);
    const draw = (k: number) => {
      ring.clear();
      ring.lineStyle(3 - 2 * k, 0xa0f0ff, 1 - k).strokeEllipse(x, y, r * 2 * k, r * k);
      ring.fillStyle(0x6a5ab8, 0.25 * (1 - k)).fillEllipse(x, y, r * 2 * k, r * k);
    };
    draw(0.1);
    scene.tweens.addCounter({ from: 0.1, to: 1, duration: 260, ease: 'Quad.Out', onUpdate: (tw) => draw(tw.getValue() ?? 1), onComplete: () => ring.destroy() });
    this.clank.explode(16, x, y - e.sprite.displayHeight * 0.5);
    const feet = this.host.playerFeet();
    // The ring lies flat on the floor: half as tall as it is wide.
    if (Math.hypot(feet.x - x, (feet.y - y) * 2) <= r) this.host.hurtPlayer(1, x, y);
  }

  /** Larvae crawl out of a cocoon: small, weak crawlers. */
  private hatch(e: Enemy, count: number): void {
    const { x: bx, y: by, w: bw, h: bh } = this.host.bounds;
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Clamp(e.sprite.x + (i === 0 ? -14 : 14), bx + 10, bx + bw - 10);
      const y = Phaser.Math.Clamp(e.sprite.y + 6, by + 12, by + bh - 4);
      this.addLarva(x, y);
    }
    this.goo.explode(14, e.sprite.x, e.sprite.y - e.sprite.displayHeight * 0.8);
  }

  private addLarva(x: number, y: number): void {
    const larva = this.add('crawler', x, y, Math.random());
    larva.sprite.setScale(0.55);
    larva.hp = 3 * this.hpScale;
    // Awake at once: they come out hungry.
    larva.state = { ...larva.state, until: this.host.scene.time.now + 250 };
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
    // Aim at the astronaut's chest, from the vent.
    const feet = this.host.playerFeet();
    const dx = feet.x - e.sprite.x;
    const dy = feet.y - 14 - top;
    const d = Math.hypot(dx, dy) || 1;
    const v = SPORE_SPEED * this.host.tile;
    this.launchSpore(e.sprite.x, top, (dx / d) * v, (dy / d) * v);
    void dir;
  }

  private launchSpore(x: number, y: number, vx: number, vy: number, tint?: number, texture = 'en-spore'): Phaser.Physics.Arcade.Image | null {
    const spore = this.spores.get(x, y) as Phaser.Physics.Arcade.Image | null;
    if (!spore) return null;
    spore.enableBody(true, x, y, true, true);
    spore.setTexture(texture).setAlpha(1);
    spore.setRotation(texture === 'en-spore' ? 0 : Math.atan2(vy, vx));
    spore.setDepth(12).setBlendMode(Phaser.BlendModes.ADD);
    spore.body!.setSize(6, 6);
    spore.setData('x0', x).setData('y0', y).setData('stopAt', undefined).setData('until', undefined);
    spore.setVelocity(vx, vy);
    if (tint === undefined) spore.clearTint();
    else spore.setTint(tint);
    this.sporePuff.explode(5, x, y);
    return spore;
  }

  /** Spore mines: lobbed around the fungus, they sit on the floor and burst on touch. */
  private scatterMines(e: Enemy, count: number): void {
    const now = this.host.scene.time.now;
    const t = this.host.tile;
    const { x: bx, y: by, w: bw, h: bh } = this.host.bounds;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = (1.2 + Math.random() * 1.6) * t;
      const tx = Phaser.Math.Clamp(e.sprite.x + Math.cos(a) * r, bx + 10, bx + bw - 10);
      const ty = Phaser.Math.Clamp(e.sprite.y + Math.sin(a) * r * 0.7, by + 10, by + bh - 6);
      const flight = 500;
      const mine = this.launchSpore(e.sprite.x, e.sprite.y - 14, ((tx - e.sprite.x) / flight) * 1000, ((ty - e.sprite.y + 14) / flight) * 1000, 0x4dffb0);
      mine?.setData('stopAt', now + flight).setData('until', now + flight + MINE_LIFE_MS);
    }
  }

  /** A ring of resin shards, as from the golem's slam. */
  private shardRing(x: number, y: number, count: number, turn: number): void {
    const v = 3 * this.host.tile;
    for (let i = 0; i < count; i++) {
      const a = turn + (i / count) * Math.PI * 2;
      this.launchSpore(x, y, Math.cos(a) * v, Math.sin(a) * v, 0xffb040, 'en-shard');
    }
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
      const b = this.boss;
      if (b && b.sprite.visible && hits(shot, b.sprite.x, b.sprite.y, b.sprite.displayWidth * 0.8, b.sprite.displayHeight * 0.85)) {
        this.onBossShot(shot, b);
        continue;
      }
      const q = this.queen;
      if (q && hits(shot, q.sprite.x, q.sprite.y, q.sprite.displayWidth * 0.75, q.sprite.displayHeight * 0.85)) {
        this.onQueenShot(shot, q);
        continue;
      }
      const k = this.kit;
      if (k && k.sprite.visible && hits(shot, k.sprite.x, k.sprite.y, k.sprite.displayWidth * 0.7, k.sprite.displayHeight * 0.85)) {
        this.onKitShot(shot, k);
        continue;
      }
      for (const e of this.enemies) {
        const s = e.sprite;
        if (e.hidden) continue;
        if (hits(shot, s.x, s.y, s.displayWidth * 0.8, s.displayHeight * 0.95)) {
          this.onShot(shot, e);
          break;
        }
      }
    }
  }

  private onShot(shot: Phaser.Physics.Arcade.Image, e: Enemy): void {
    if (!shot.active || shot.getData('dropping')) return;
    if (this.alreadyHit(shot, e)) return;
    const v = shot.body!.velocity;
    const len = Math.hypot(v.x, v.y) || 1;
    if (e.state.kind === 'guardian') {
      // Its shield covers the front: shots flying into its face bounce off.
      const fx = looksLeft(e.sprite, 'guardian') ? -1 : 1;
      if (v.x * fx < 0 && Math.abs(v.x) > Math.abs(v.y) * 0.6) {
        this.clank.explode(8, shot.x, shot.y);
        this.host.shotHit(shot, shot.x, shot.y, false);
        return;
      }
    }
    this.host.shotHit(shot, shot.x, shot.y, this.host.pierce());
    e.hp -= this.host.shotDamage();
    const now = this.host.scene.time.now;
    e.flashUntil = now + 70;
    // Resin chips off the golem now and then, flying back.
    if (e.state.kind === 'golem' && e.hp > 0 && Math.random() < 0.3) {
      const a = Math.atan2(-v.y, -v.x) + (Math.random() - 0.5) * 1.2;
      const sv = 3 * this.host.tile;
      this.launchSpore(e.sprite.x, e.sprite.y - 16, Math.cos(a) * sv, Math.sin(a) * sv, 0xffb040, 'en-shard');
    }
    if (ENEMIES[e.state.kind].speed > 0) {
      e.knockUntil = now + 90;
      e.knock = { x: (v.x / len) * 140, y: (v.y / len) * 140 };
    }
    if (e.hp <= 0) this.kill(e);
  }

  private kill(e: Enemy): void {
    const { sprite } = e;
    const kind = e.state.kind;
    const size = e.state.size ?? SLIME_BIG;
    if (kind === 'slime' && size > 0) {
      this.split(e, size - 1);
      return;
    }
    (kind === 'spitter' || kind === 'bloater' ? this.sporePuff : this.goo).explode(kind === 'miner' ? 28 : 18, sprite.x, sprite.y - sprite.displayHeight / 2);
    if (kind === 'bloater') {
      // It bursts: a ring of spores, so it is best killed from afar.
      const v = SPORE_SPEED * 0.8 * this.host.tile;
      const y = sprite.y - sprite.displayHeight / 2;
      for (let i = 0; i < BLOAT_RING; i++) {
        const a = (i / BLOAT_RING) * Math.PI * 2 + 0.2;
        this.launchSpore(sprite.x, y, Math.cos(a) * v, Math.sin(a) * v);
      }
      this.sporePuff.explode(30, sprite.x, y);
    }
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
    if (this.enemies.length === 0 && !this.boss && !this.queen && !this.kit) this.onCleared?.();
  }

  /** A slime splits in two smaller, faster ones; the old blob plays its split and fades. */
  private split(e: Enemy, size: number): void {
    const { sprite } = e;
    const { x: bx, y: by, w: bw, h: bh } = this.host.bounds;
    this.goo.explode(14, sprite.x, sprite.y - sprite.displayHeight / 2);
    this.host.shakeAdd(0.12);
    this.host.untrack(sprite);
    this.enemies = this.enemies.filter((x) => x !== e);
    const off = 6 + 8 * size;
    for (const side of [-1, 1]) {
      const x = Phaser.Math.Clamp(sprite.x + side * off, bx + 10, bx + bw - 10);
      const y = Phaser.Math.Clamp(sprite.y, by + 12, by + bh - 4);
      const child = this.add('slime', x, y, Math.random(), size);
      child.state = { ...child.state, until: this.host.scene.time.now + 200 };
      child.knockUntil = this.host.scene.time.now + 160;
      child.knock = { x: side * 90, y: 0 };
      child.sprite.setAlpha(0);
      this.host.scene.tweens.add({ targets: child.sprite, alpha: 1, duration: 220 });
    }
    // The old blob pinches in two and fades as the two new ones appear.
    sprite.disableBody(true, false);
    sprite.clearTint();
    sprite.play(animName('slime', 'split'));
    this.host.scene.tweens.add({ targets: sprite, alpha: 0, duration: 260, onComplete: () => sprite.destroy() });
  }

  /** A piercing shot hits each enemy once; returns true if it already hit this one. */
  private alreadyHit(shot: Phaser.Physics.Arcade.Image, target: object): boolean {
    if (!this.host.pierce()) return false;
    const hit = (shot.getData('hit') as object[] | undefined) ?? [];
    if (hit.includes(target)) return true;
    shot.setData('hit', [...hit, target]);
    return false;
  }

  private onBossShot(shot: Phaser.Physics.Arcade.Image, b: Boss): void {
    if (this.alreadyHit(shot, b)) return;
    this.host.shotHit(shot, shot.x, shot.y, this.host.pierce());
    b.hp -= this.host.shotDamage();
    b.flashUntil = this.host.scene.time.now + 70;
    this.onBossHealth?.(Math.max(0, b.hp / (BOSS_HP * this.hpScale)));
    if (b.hp <= 0) this.killBoss(b);
  }

  /** Brood Mother behaviour: crawl, ring of spores, burrow, brood. */
  private updateBoss(time: number): void {
    const b = this.boss;
    if (!b) return;
    const t = this.host.tile;
    const s = b.sprite;
    const body = s.body as Phaser.Physics.Arcade.Body;
    const feet = this.host.playerFeet();
    const before = b.state.phase;
    const step = stepBoss(b.state, { x: s.x / t, y: s.y / t }, { x: feet.x / t, y: feet.y / t }, time, b.hp / (BOSS_HP * this.hpScale), this.enemies.length);
    b.state = step.state;
    const { x: bx, y: by, w: bw, h: bh } = this.host.bounds;
    if (step.hidden) {
      // Under the ground: no body, only a trail of dirt moving towards the astronaut.
      if (s.visible) {
        s.setVisible(false);
        body.enable = false;
        this.host.shakeAdd(0.25);
      }
      // Her position follows the clock, not the frame steps, so she comes
      // up exactly on the warning even when the frame rate dips.
      if (step.warning) {
        b.burrowFrom ??= { x: s.x, y: s.y };
        const p = step.warning.progress;
        s.x = Phaser.Math.Clamp(b.burrowFrom.x + (step.warning.at.x * t - b.burrowFrom.x) * p, bx + 40, bx + bw - 40);
        s.y = Phaser.Math.Clamp(b.burrowFrom.y + (step.warning.at.y * t - b.burrowFrom.y) * p, by + 12, by + bh - 4);
      }
      if (time >= b.nextDirt) {
        this.dirt.explode(4, s.x, s.y);
        b.nextDirt = time + 70;
      }
    } else {
      if (step.emerge && b.burrowFrom) {
        // Last step: snap onto the spot the warning showed.
        const w = this.lastWarning;
        if (w) {
          s.x = Phaser.Math.Clamp(w.x * t, bx + 40, bx + bw - 40);
          s.y = Phaser.Math.Clamp(w.y * t, by + 12, by + bh - 4);
        }
      }
      b.burrowFrom = undefined;
      if (!s.visible) {
        s.setVisible(true);
        body.enable = true;
        body.reset(s.x, s.y);
      }
      s.setVelocity(step.velocity.x * t, step.velocity.y * t);
      if (b.state.phase === 'crawl' || step.anim !== 'crawl') s.setFlipX(feet.x < s.x);
    }
    if (b.state.phase !== before) {
      const anim = { crawl: 'crawl', spores: 'spores', sink: 'sink', emerge: 'emerge', brood: 'brood', wake: 'crawl', recover: 'crawl', under: 'sink' }[b.state.phase];
      if (b.state.phase !== 'under') s.play(`boss-${anim}`);
      s.anims.timeScale = b.state.phase === 'recover' ? 0.3 : 1;
    }
    if (step.ring) {
      const v = SPORE_SPEED * 0.85 * t;
      const turn = Math.random() * Math.PI * 2;
      for (let i = 0; i < step.ring; i++) {
        const a = turn + (i / step.ring) * Math.PI * 2;
        this.launchSpore(s.x, s.y - 26, Math.cos(a) * v, Math.sin(a) * v);
      }
      this.host.shakeAdd(0.3);
    }
    if (step.brood) {
      for (let i = 0; i < step.brood; i++) {
        const x = Phaser.Math.Clamp(s.x + (s.flipX ? 1 : -1) * (36 + i * 6) + (i - 1) * 18, bx + 12, bx + bw - 12);
        const y = Phaser.Math.Clamp(s.y + (i - 1) * 16, by + 14, by + bh - 4);
        this.add('crawler', x, y, Math.random());
        this.goo.explode(10, x, y - 6);
      }
    }
    this.drawWarning(step.warning, time);
    if (step.emerge) {
      this.dirt.explode(30, s.x, s.y);
      this.host.shakeAdd(0.55);
      if (Math.hypot(feet.x - s.x, feet.y - s.y) < EMERGE_RADIUS * t) this.host.hurtPlayer(EMERGE_DAMAGE, s.x, s.y + 10);
    }
    // Red pulse while winding up an attack; white flash when hit.
    const windup = b.state.phase === 'spores' || b.state.phase === 'brood' || b.state.phase === 'sink';
    if (time < b.flashUntil) s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else if (windup) {
      const k = 0.5 + 0.5 * Math.sin(time / 45);
      const g = Math.round(255 - 140 * k);
      s.setTint((255 << 16) | (g << 8) | g).setTintMode(Phaser.TintModes.MULTIPLY);
    } else s.clearTint();
    s.setDepth(this.host.depthAt(s.y));
  }

  /**
   * Telegraph for the burrow: a red ring on the floor at the spot she will
   * come out of, pulsing faster and growing brighter as the moment nears,
   * with cracks spreading from the middle and dirt jumping out.
   */
  private drawWarning(w: { at: { x: number; y: number }; progress: number } | undefined, time: number): void {
    const t = this.host.tile;
    if (!w) {
      this.warn?.setVisible(false);
      return;
    }
    this.lastWarning = w.at;
    if (!this.warn) this.warn = this.host.scene.add.graphics().setDepth(4.95);
    const g = this.warn.setVisible(true).clear();
    const x = w.at.x * t;
    const y = w.at.y * t;
    const p = w.progress;
    const pulse = 0.5 + 0.5 * Math.sin(time / (140 - 100 * p));
    const r = (1.2 + 0.3 * pulse) * t;
    g.fillStyle(0xff2a3a, 0.12 + 0.25 * p).fillEllipse(x, y, r * 2, r);
    g.lineStyle(2, 0xff4a5a, 0.45 + 0.5 * p * pulse).strokeEllipse(x, y, r * 2, r);
    g.lineStyle(1, 0x1a0a0a, 0.5 + 0.4 * p);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      const len = r * (0.3 + 0.6 * p);
      g.lineBetween(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len * 0.5);
    }
    if (Math.random() < 0.15 + 0.5 * p) this.dirt.explode(2, x + (Math.random() - 0.5) * r, y + (Math.random() - 0.5) * r * 0.5);
  }

  private onKitShot(shot: Phaser.Physics.Arcade.Image, k: KitBoss): void {
    if (this.alreadyHit(shot, k)) return;
    this.host.shotHit(shot, shot.x, shot.y, this.host.pierce());
    k.hp -= this.host.shotDamage();
    k.flashUntil = this.host.scene.time.now + 70;
    this.onBossHealth?.(Math.max(0, k.hp / (k.def.hp * this.hpScale)));
    if (k.hp <= 0) this.killKit(k);
  }

  /** Bosses made from attack lists (rules/bossKit.ts): moving, shooting, charging, vanishing. */
  private updateKit(time: number): void {
    const k = this.kit;
    if (!k) return;
    const t = this.host.tile;
    const s = k.sprite;
    const body = s.body as Phaser.Physics.Arcade.Body;
    const sheet = KIT_SHEETS[k.kind];
    const feet = this.host.playerFeet();
    const step = stepKit(k.def, k.state, { x: s.x / t, y: s.y / t }, { x: feet.x / t, y: feet.y / t }, time, k.hp / (k.def.hp * this.hpScale), this.enemies.length);
    k.state = step.state;
    const { x: bx, y: by, w: bw, h: bh } = this.host.bounds;
    if (step.hidden) {
      if (s.visible && k.state.phase === 'hidden' && !s.anims.isPlaying) {
        s.setVisible(false);
        body.enable = false;
      }
      s.setVelocity(0, 0);
    } else s.setVelocity(step.velocity.x * t, step.velocity.y * t);
    if (step.emerge) {
      s.x = Phaser.Math.Clamp(step.emerge.at.x * t, bx + 40, bx + bw - 40);
      s.y = Phaser.Math.Clamp(step.emerge.at.y * t, by + 12, by + bh - 4);
      s.setVisible(true);
      body.enable = true;
      body.reset(s.x, s.y);
      this.dirt.explode(24, s.x, s.y);
      this.host.shakeAdd(0.5);
      if (Math.hypot(feet.x - s.x, feet.y - s.y) < step.emerge.radius * t) this.host.hurtPlayer(step.emerge.damage, s.x, s.y + 10);
    }
    this.drawWarning(step.warning, time);
    if (!sheet.front && !step.hidden) {
      const vx = step.velocity.x;
      const left = Math.abs(vx) > 0.1 && k.state.phase === 'act' ? vx < 0 : feet.x < s.x;
      s.setFlipX(left !== !!sheet.facesLeft);
    }
    if (step.anim !== k.anim) {
      k.anim = step.anim;
      if (sheet.anims[step.anim]) s.play(`${kitKey(k.kind)}-${step.anim}`);
    }
    s.anims.timeScale = k.state.phase === 'wake' ? 0.3 : 1;
    if (step.shots) {
      const y = s.y - s.displayHeight * 0.55;
      for (const shot of step.shots) {
        const v = shot.speed * t;
        this.launchSpore(s.x, y, shot.dir.x * v, shot.dir.y * v, shot.tint);
      }
      this.host.shakeAdd(0.12);
    }
    if (step.slam) {
      this.dirt.explode(30, s.x, s.y);
      this.host.shakeAdd(0.45);
      if (Math.hypot(feet.x - s.x, feet.y - s.y) <= step.slam.radius * t) this.host.hurtPlayer(step.slam.damage, s.x, s.y);
    }
    if (step.summon) {
      for (let i = 0; i < step.summon.count; i++) {
        const a = (i / step.summon.count) * Math.PI * 2 + Math.random();
        const x = Phaser.Math.Clamp(s.x + Math.cos(a) * 50, bx + 12, bx + bw - 12);
        const y = Phaser.Math.Clamp(s.y + Math.sin(a) * 30, by + 14, by + bh - 4);
        const e = this.add(step.summon.enemy, x, y, Math.random());
        e.state = { ...e.state, until: time + 400 };
        this.sporePuff.explode(12, x, y - 12);
      }
    }
    if (k.state.phase === 'act' && Math.abs(step.velocity.x) + Math.abs(step.velocity.y) > 3 && Math.random() < 0.35) this.dirt.explode(3, s.x, s.y);
    if (time < k.flashUntil) s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else if (step.windup) {
      const kk = 0.5 + 0.5 * Math.sin(time / 45);
      const g = Math.round(255 - 140 * kk);
      s.setTint((255 << 16) | (g << 8) | g).setTintMode(Phaser.TintModes.MULTIPLY);
    } else s.clearTint();
    s.setDepth(this.host.depthAt(s.y));
  }

  private killKit(k: KitBoss): void {
    for (const e of [...this.enemies]) this.kill(e);
    this.kit = undefined;
    this.warn?.setVisible(false);
    const s = k.sprite;
    s.setVisible(true).clearTint().setVelocity(0, 0);
    s.disableBody(true, false);
    s.anims.timeScale = 1;
    s.play(`${kitKey(k.kind)}-death`);
    s.setDepth(this.host.depthAt(s.y) - 0.02);
    this.goo.explode(50, s.x, s.y - 30);
    this.host.shakeAdd(0.9);
    this.host.untrack(s);
    this.onBossHealth?.(0);
    this.onCleared?.();
  }

  private onQueenShot(shot: Phaser.Physics.Arcade.Image, q: Queen): void {
    if (this.alreadyHit(shot, q)) return;
    this.host.shotHit(shot, shot.x, shot.y, this.host.pierce());
    q.hp -= this.host.shotDamage();
    q.flashUntil = this.host.scene.time.now + 70;
    this.onBossHealth?.(Math.max(0, q.hp / (QUEEN_HP * this.hpScale)));
    if (q.hp <= 0) this.killQueen(q);
  }

  /** Hive Queen behaviour: crawl, fan of resin, charge, call the swarm. */
  private updateQueen(time: number): void {
    const q = this.queen;
    if (!q) return;
    const t = this.host.tile;
    const s = q.sprite;
    const feet = this.host.playerFeet();
    const before = q.state.phase;
    const step = stepQueen(q.state, { x: s.x / t, y: s.y / t }, { x: feet.x / t, y: feet.y / t }, time, q.hp / (QUEEN_HP * this.hpScale), this.enemies.length);
    q.state = step.state;
    s.setVelocity(step.velocity.x * t, step.velocity.y * t);
    if (q.state.phase === 'charge') {
      if (Math.random() < 0.35) this.dirt.explode(3, s.x, s.y);
      if (Math.abs(step.velocity.x) > 0.1) s.setFlipX(step.velocity.x < 0);
    } else s.setFlipX(feet.x < s.x);
    if (q.state.phase !== before) {
      const anim = { wake: 'crawl', crawl: 'crawl', spit: 'spit', aim: 'charge', charge: 'charge', summon: 'summon', recover: 'crawl' }[q.state.phase];
      s.play(`queen-${anim}`);
      s.anims.timeScale = q.state.phase === 'recover' || q.state.phase === 'aim' ? 0.3 : 1;
      if (q.state.phase === 'charge') this.host.shakeAdd(0.3);
    }
    if (step.fan && step.aim) {
      // Amber resin blobs from her mouth, fanned around the astronaut.
      const v = SPORE_SPEED * 0.9 * t;
      const mouthX = s.x + (s.flipX ? -18 : 18);
      const mouthY = s.y - s.displayHeight * 0.6;
      const base = Math.atan2(feet.y - 14 - mouthY, feet.x - mouthX);
      for (let i = 0; i < step.fan; i++) {
        const a = base + (i - (step.fan - 1) / 2) * SPIT_SPREAD;
        this.launchSpore(mouthX, mouthY, Math.cos(a) * v, Math.sin(a) * v, 0xffb040);
      }
      this.host.shakeAdd(0.2);
    }
    if (step.swarm) {
      const { x: bx, y: by, w: bw, h: bh } = this.host.bounds;
      for (let i = 0; i < step.swarm; i++) {
        const a = (i / step.swarm) * Math.PI * 2 + Math.random();
        const x = Phaser.Math.Clamp(s.x + Math.cos(a) * 40, bx + 12, bx + bw - 12);
        const y = Phaser.Math.Clamp(s.y + Math.sin(a) * 26, by + 14, by + bh - 4);
        const w = this.add('worker', x, y, Math.random());
        w.state = { ...w.state, until: time + 300 };
        this.sporePuff.explode(12, x, y - 12);
      }
      this.host.shakeAdd(0.25);
    }
    const windup = q.state.phase === 'spit' || q.state.phase === 'aim' || q.state.phase === 'summon';
    if (time < q.flashUntil) s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else if (windup) {
      const k = 0.5 + 0.5 * Math.sin(time / 45);
      const g = Math.round(255 - 140 * k);
      s.setTint((255 << 16) | (g << 8) | g).setTintMode(Phaser.TintModes.MULTIPLY);
    } else s.clearTint();
    s.setDepth(this.host.depthAt(s.y));
  }

  private killQueen(q: Queen): void {
    // Her swarm dies with her.
    for (const e of [...this.enemies]) this.kill(e);
    this.queen = undefined;
    const s = q.sprite;
    s.clearTint().setVelocity(0, 0);
    s.disableBody(true, false);
    s.anims.timeScale = 1;
    s.play('queen-death');
    s.setDepth(this.host.depthAt(s.y) - 0.02);
    this.goo.explode(60, s.x, s.y - 30);
    this.host.shakeAdd(0.9);
    this.host.untrack(s);
    this.onBossHealth?.(0);
    this.onCleared?.();
  }

  private killBoss(b: Boss): void {
    // Her brood dies with her.
    for (const e of [...this.enemies]) this.kill(e);
    this.boss = undefined;
    this.warn?.setVisible(false);
    const s = b.sprite;
    s.setVisible(true).clearTint().setVelocity(0, 0);
    s.disableBody(true, false);
    s.anims.timeScale = 1;
    s.play('boss-death');
    s.setDepth(this.host.depthAt(s.y) - 0.02);
    this.goo.explode(60, s.x, s.y - 30);
    this.host.shakeAdd(0.9);
    this.host.untrack(s);
    this.onBossHealth?.(0);
    this.onCleared?.();
  }
}

/**
 * Shots fly at chest height while bodies sit at the feet, so a shot hits
 * when it is inside the drawn shape (width w, height h above the feet at
 * x, feetY) or when its ground point falls on the footprint: low creatures
 * are hit by bolts passing just above them.
 */
function hits(shot: Phaser.Physics.Arcade.Image, x: number, feetY: number, w: number, h: number): boolean {
  if (shot.x < x - w / 2 || shot.x > x + w / 2) return false;
  const groundY = shot.y + SHOT_FLIGHT_HEIGHT;
  const inShape = shot.y >= feetY - h && shot.y <= feetY + 2;
  const onFootprint = groundY >= feetY - 14 && groundY <= feetY + 4;
  return inShape || onFootprint;
}

/** The spore the spitter fires: a small glowing ball; also the hunter's spear and resin shards. */
function makeSporeTexture(scene: Phaser.Scene): void {
  if (!scene.textures.exists('en-spear')) {
    const g = scene.add.graphics();
    g.fillStyle(0xc8b898).fillRect(0, 1, 9, 1);
    g.fillStyle(0x9af8ff).fillRect(9, 0, 3, 3);
    g.fillStyle(0xffffff).fillRect(10, 1, 2, 1);
    g.generateTexture('en-spear', 12, 3).destroy();
  }
  if (!scene.textures.exists('en-shard')) {
    const g = scene.add.graphics();
    g.fillStyle(0x8a6a30).fillRect(0, 1, 5, 2);
    g.fillStyle(0xffe0a0).fillRect(1, 0, 3, 2);
    g.generateTexture('en-shard', 5, 3).destroy();
  }
  if (!scene.textures.exists('en-spore')) {
    const g = scene.add.graphics();
    g.fillStyle(0xa0b030).fillRect(1, 1, 5, 5);
    g.fillStyle(0xd8e04a).fillRect(2, 2, 3, 3);
    g.fillStyle(0xffffff).fillRect(3, 2, 1, 1);
    g.generateTexture('en-spore', 7, 7).destroy();
  }
}
