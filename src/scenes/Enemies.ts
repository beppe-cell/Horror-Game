import Phaser from 'phaser';
import { Rng } from '../rules/rng';
import { ENEMIES, EnemyKind, EnemyState, SPORE_SPEED, newEnemy, stepEnemy } from '../rules/enemies';
import { attachNormalMap } from '../render/pixelArt';
import { BOSS_BODY, BOSS_CONTACT_DAMAGE, BOSS_HP, BossState, EMERGE_DAMAGE, EMERGE_RADIUS, newBoss, stepBoss } from '../rules/boss';

/**
 * Gemini sprite sheets cleaned by `npm run enemies` (one strip per enemy,
 * frames in the order of the original grid, facing right). Frame numbers
 * pick the rows that worked best on each sheet.
 */
const SHEETS: Record<EnemyKind, { w: number; h: number; scale?: number; base?: number; anims: Record<string, { frames: number[]; fps: number; loop: boolean }> }> = {
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
}

interface Boss {
  sprite: Phaser.Physics.Arcade.Sprite;
  state: BossState;
  hp: number;
  flashUntil: number;
  nextDirt: number;
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
  private boss?: Boss;
  private dirt!: Phaser.GameObjects.Particles.ParticleEmitter;
  /** Boss health from 0 to 1 after each hit; 0 when she dies. */
  onBossHealth?: (frac: number) => void;
  private spores!: Phaser.Physics.Arcade.Group;
  private goo!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sporePuff!: Phaser.GameObjects.Particles.ParticleEmitter;
  private group!: Phaser.Physics.Arcade.Group;
  /** Called once when the last enemy dies. */
  onCleared?: () => void;

  constructor(private host: EnemyHost) {
    const { scene } = host;
    createEnemyAnims(scene);
    createBossAnims(scene);
    makeSporeTexture(scene);
    this.group = scene.physics.add.group();
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
    scene.physics.add.overlap(host.player, this.group, (_p, sprite) => {
      const b = this.boss;
      if (b && sprite === b.sprite) host.hurtPlayer(BOSS_CONTACT_DAMAGE, b.sprite.x, b.sprite.y);
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
    return this.enemies.length + (this.boss ? 1 : 0);
  }

  /** The Brood Mother, standing with her feet at (x, baseY). */
  spawnBoss(x: number, baseY: number): void {
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
    this.boss = { sprite, state: newBoss(scene.time.now), hp: BOSS_HP, flashUntil: 0, nextDirt: 0 };
  }

  /** Places 3-5 enemies (plus `extra` in big rooms) on free cells away from the player's start. */
  spawn(rng: Rng, cells: { c: number; r: number }[], origin: { x: number; y: number }, toWorld: (c: number, r: number) => { x: number; y: number }, extra = 0): void {
    const far = cells.filter((cell) => {
      const p = toWorld(cell.c, cell.r);
      return Math.hypot(p.x - origin.x, p.y - origin.y) >= 4 * this.host.tile;
    });
    const count = Math.min(far.length, rng.int(3, 5) + extra);
    const total = SPAWN_WEIGHTS.reduce((s, [, w]) => s + w, 0);
    for (let i = 0; i < count; i++) {
      const cell = far.splice(rng.int(0, far.length - 1), 1)[0];
      let roll = rng.next() * total;
      const kind = SPAWN_WEIGHTS.find(([, w]) => (roll -= w) < 0)?.[0] ?? 'crawler';
      const p = toWorld(cell.c, cell.r);
      this.add(kind, p.x, p.y, rng.next());
    }
  }

  private add(kind: EnemyKind, x: number, baseY: number, seed: number): Enemy {
    const { scene } = this.host;
    const def = ENEMIES[kind];
    const sprite = scene.physics.add.sprite(x, baseY, `en-${kind}`, 0);
    // Start each enemy on a different frame so they do not move in step.
    const first = kind === 'spitter' ? 'idle' : 'move';
    sprite.play({ key: animName(kind, first), startFrame: Math.floor(seed * SHEETS[kind].anims[first].frames.length) });
    const scale = SHEETS[kind].scale ?? 1;
    const base = SHEETS[kind].base ?? sprite.height - 1;
    sprite.setOrigin(0.5, (base + 1) / sprite.height).setScale(scale).setLighting(true).setDepth(this.host.depthAt(baseY));
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(def.body.w, def.body.h).setOffset((sprite.width - def.body.w) / 2, base - def.body.h);
    if (def.speed === 0) body.setImmovable(true);
    this.group.add(sprite);
    const h = sprite.height;
    this.host.track(sprite, base, Math.round(h * scale * 0.85), Math.round(sprite.width * scale * 0.8));
    const enemy = { sprite, state: newEnemy(kind, scene.time.now, seed), hp: def.hp, flashUntil: 0, knockUntil: 0, knock: { x: 0, y: 0 } };
    this.enemies.push(enemy);
    return enemy;
  }

  private find(sprite: Phaser.Physics.Arcade.Sprite): Enemy | undefined {
    return this.enemies.find((e) => e.sprite === sprite);
  }

  update(time: number, delta = 16): void {
    this.checkShots();
    this.updateBoss(time, delta / 1000);
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
    // Aim at the astronaut's chest, from the vent.
    const feet = this.host.playerFeet();
    const dx = feet.x - e.sprite.x;
    const dy = feet.y - 14 - top;
    const d = Math.hypot(dx, dy) || 1;
    const v = SPORE_SPEED * this.host.tile;
    this.launchSpore(e.sprite.x, top, (dx / d) * v, (dy / d) * v);
    void dir;
  }

  private launchSpore(x: number, y: number, vx: number, vy: number): void {
    const spore = this.spores.get(x, y) as Phaser.Physics.Arcade.Image | null;
    if (!spore) return;
    spore.enableBody(true, x, y, true, true);
    spore.setDepth(12).setBlendMode(Phaser.BlendModes.ADD);
    spore.body!.setSize(6, 6);
    spore.setData('x0', x).setData('y0', y);
    spore.setVelocity(vx, vy);
    this.sporePuff.explode(5, x, y);
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
      for (const e of this.enemies) {
        const s = e.sprite;
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
    this.host.shotHit(shot, shot.x, shot.y, this.host.pierce());
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
    if (this.enemies.length === 0 && !this.boss) this.onCleared?.();
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
    this.onBossHealth?.(Math.max(0, b.hp / BOSS_HP));
    if (b.hp <= 0) this.killBoss(b);
  }

  /** Brood Mother behaviour: crawl, ring of spores, burrow, brood. */
  private updateBoss(time: number, dt: number): void {
    const b = this.boss;
    if (!b) return;
    const t = this.host.tile;
    const s = b.sprite;
    const body = s.body as Phaser.Physics.Arcade.Body;
    const feet = this.host.playerFeet();
    const before = b.state.phase;
    const step = stepBoss(b.state, { x: s.x / t, y: s.y / t }, { x: feet.x / t, y: feet.y / t }, time, b.hp / BOSS_HP, this.enemies.length);
    b.state = step.state;
    const { x: bx, y: by, w: bw, h: bh } = this.host.bounds;
    if (step.hidden) {
      // Under the ground: no body, only a trail of dirt moving towards the astronaut.
      if (s.visible) {
        s.setVisible(false);
        body.enable = false;
        this.host.shakeAdd(0.25);
      }
      s.x = Phaser.Math.Clamp(s.x + step.velocity.x * t * dt, bx + 40, bx + bw - 40);
      s.y = Phaser.Math.Clamp(s.y + step.velocity.y * t * dt, by + 12, by + bh - 4);
      if (time >= b.nextDirt) {
        this.dirt.explode(4, s.x, s.y);
        b.nextDirt = time + 70;
      }
    } else {
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

  private killBoss(b: Boss): void {
    // Her brood dies with her.
    for (const e of [...this.enemies]) this.kill(e);
    this.boss = undefined;
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
