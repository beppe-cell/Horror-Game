import Phaser from 'phaser';
import { Rng, newSeedString, seedFromString } from '../rules/rng';
import { BASE_STATS, Stats, computeStats, fireCooldownMs } from '../rules/stats';
import { DIR4_VECTORS, Dir4, ShootKeys, moveVector, stickToDir4 } from '../rules/input';
import { RoomLayout, centreTile, doorTile, generateRoom, interiorSize, solidRects } from '../rules/room';
import { DoorLink, FloorLayout, FloorRoom, doorLinks, generateFloor } from '../rules/floor';
import { Quality, frameView } from '../rules/view';
import { actionFrom, animKey, facingFrom } from '../rules/facing';
import { PLAYER_HEIGHT, ShadowLight, castShadows } from '../rules/shadow';
import { CameraShake } from '../rules/shake';
import { GlowKind, glowIntensity } from '../rules/glow';
import { TILE, WALL_TILES, makePlaceholderArt } from '../render/pixelArt';
import { CRASH_SITE, doorAnimKey, hatchKey, paintFloor, paintWalls, preloadBiome, prepareBiome, propAnimKey, propKey } from '../render/biome';
import { Reflector, Water, WaterLight } from '../render/Water';
import { addFog } from '../render/Fog';
import { createPlayerAnims, preloadPlayer } from '../render/playerSprites';
import { PropEffects } from '../render/PropEffects';
import { Health, applyDamage, cellIcons, heal, newHealth } from '../rules/health';
import { ENERGY_CELL_FRAME, ENERGY_HEAL, ITEMS, ItemId, PEDESTAL_FRAME, applyItemToHealth, hasEffect, itemModifiers, pickItem, rollRoomReward } from '../rules/items';
import { attachNormalMap } from '../render/pixelArt';
import { COIN_NAME, COIN_VALUE, CoinKind, PRICE, PROP_COIN_CHANCE, PROP_HP, rollCoin } from '../rules/coins';
import { COINS_KEY, COIN_FRAME, ITEMS2_KEY, ITEMS_KEY, SHOP_PROPS, coinSpinKey, itemTexture, makeCoinAnims, preloadItemArt } from '../render/itemIcons';
import { ItemAuras } from '../render/ItemAuras';
import { OVERLAY_BOXES } from '../render/overlayBoxes';
import { shove, slide } from '../rules/slide';
import { EnemyManager, preloadEnemies } from './Enemies';
import type HudScene from './HudScene';

/** Suit integrity at the start of a run, in cells. */
const START_CELLS = 3;

/** Wall thickness in world pixels. */
const WALL = WALL_TILES * TILE;
/** Room interior starts one wall thickness in from the world origin. */
const ROOM_X = WALL;
const ROOM_Y = WALL;
/** Interior of a single-cell room, in world pixels: the camera zoom is set for it. */
const CELL_W = 13 * TILE;
const CELL_H = 7 * TILE;

/** Share of the player's velocity added to a new shot. */
const SHOT_INHERIT = 0.3;
/** How far above the floor shots fly (blaster at chest height), in pixels. */
const SHOT_HEIGHT = 16;
/** Row of the boot soles in the 48×48 player frames (see tools/clean_sprites.py). */
const PLAYER_SOLE_ROW = 46;
/** Most objects (obstacles, crystals, small props) in one room. */
const MAX_PROPS = 7;
/** Reach of a shot's light, in pixels. */
const SHOT_LIGHT_RADIUS = 90;
/** Size of the 'px-shadow-cast' texture (see render/pixelArt.ts). */
const CAST_TEXTURE_W = 28;
const CAST_TEXTURE_H = 11;
/** Shadows each object can cast at once (one per nearby light). */
const SHADOWS_PER_OBJECT = 2;

/**
 * Something standing on the floor: a dark contact patch under it, so it
 * does not float, and one cast shadow per nearby light.
 */
interface ShadowCaster {
  obj: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
  /** Frame row where the object touches the floor. */
  baseRow: number;
  /** Height in pixels, for shadow length. */
  height: number;
  /** Width in pixels: the shadow is as wide as the object. */
  width: number;
  contact: Phaser.GameObjects.Image;
  casts: Phaser.GameObjects.Image[];
}

/**
 * Draw order for things standing on the floor: lower on screen is in front.
 * Everything that stands sits between depth 5 and 6; shots fly above (12).
 */
function depthAt(baseY: number): number {
  return 5 + baseY / 10000;
}

/** Shots that carry their own light; extra shots fly unlit. */
const LIT_SHOTS = 6;

const SHOOT_CODES: Record<string, Dir4> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/** What carries over from room to room during one run. */
export interface RunState {
  seed: string;
  /** Id of the room the player is in. */
  room: number;
  /** Room the player came from, through the door that leads back to it. */
  from?: number;
  health: Health;
  /** Rooms whose enemies are all dead. */
  cleared: number[];
  visited: number[];
  /** Items picked up, in order. */
  items: ItemId[];
  /** Treasure rooms whose item was taken. */
  taken: number[];
  /** Rewards lying on the floor of cleared rooms, by room id, until picked up. */
  drops?: Record<number, Drop>;
  /** Alien coins carried. */
  coins?: number;
  /** Shop slots already bought, by room id. */
  bought?: Record<number, number[]>;
  /** Small props broken, by room id (their index in the room). */
  broken?: Record<number, number[]>;
}

/** Something left on the floor: an item, an energy cell or a coin. */
type Drop = ItemId | 'energy' | `coin:${CoinKind}`;

/** Minimap marker for a reward left in a room. */
function lootOf(drop: Drop | undefined): 'item' | 'energy' | 'coin' | undefined {
  if (!drop) return undefined;
  return drop === 'energy' ? 'energy' : drop.startsWith('coin:') ? 'coin' : 'item';
}

/** A small prop that bolts can break. */
interface Breakable {
  prop: Phaser.GameObjects.Image;
  index: number;
  hp: number;
}

/** Something lying in the room that the astronaut picks up by walking onto it. */
interface Pickup {
  icon: Phaser.GameObjects.Sprite;
  /** Soft shadow under the floating icon, on the floor or the pedestal top. */
  shadow: Phaser.GameObjects.Image;
  /** Height of the surface the shadow falls on (the pedestal top), above the ground point. */
  surface: number;
  light: Phaser.GameObjects.Light;
  /** Ground point, in world pixels. */
  x: number;
  y: number;
  /** Sliding velocity after a shove, px/s. */
  vx: number;
  vy: number;
  /** Height the icon floats at above its ground point. */
  lift: number;
  /** Bob phase, so pickups do not float in step. */
  phase: number;
  radius: number;
  /** Returns false to leave it on the floor (for example a full suit): the boots shove it instead. */
  take: () => boolean;
  /** Stays put when refused (shop goods on their pedestals). */
  fixed?: boolean;
}

const BOSS_NAME = 'Madre della covata';
/** Item sheet: 4x3 cells of 42x36, the pedestal standing on row 29 of its cell. */
const PEDESTAL_BASE_ROW = 29;
/** Height of the pedestal's flat top above its base, in pixels. */
const PEDESTAL_TOP = 20;

export interface PlayData {
  seed?: string;
  /** Set when walking into another room of the same run. */
  run?: RunState;
  quality?: Quality;
  /** Screen shake strength, 0 (off) to 1. */
  shake?: number;
}

export default class PlayScene extends Phaser.Scene {
  seed = '';
  quality: Quality = 'high';
  stats: Stats = { ...BASE_STATS };
  room!: RoomLayout;
  player!: Phaser.Physics.Arcade.Sprite;
  shots!: Phaser.Physics.Arcade.Group;
  walls!: Phaser.Physics.Arcade.StaticGroup;
  water!: Water;
  shotsFired = 0;

  private shootKeys = new ShootKeys();
  private moveKeys!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private nextShotAt = 0;
  private nextStepRippleAt = 0;
  facing: Dir4 = 'down';
  private lastMove = { x: 0, y: 0 };
  private playerLight!: Phaser.GameObjects.Light;
  private shotLights: Phaser.GameObjects.Light[] = [];
  /** Lights of glowing objects (crystals, flares, embers…), each with its own rhythm. */
  private glows: { light: Phaser.GameObjects.Light; base: number; phase: number; kind: GlowKind; color: number; radius: number }[] = [];
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private trail!: Phaser.GameObjects.Particles.ParticleEmitter;
  private muzzleFlash!: Phaser.GameObjects.Image;
  private muzzleLight!: Phaser.GameObjects.Light;
  /** Short light pulses where shots hit; reused in turn. */
  private impactLights: Phaser.GameObjects.Light[] = [];
  private nextImpactLight = 0;
  private rings: Phaser.GameObjects.Image[] = [];
  private nextRing = 0;
  private shake!: CameraShake;
  private propEffects!: PropEffects;
  private shakeStrength = 1;
  /** Where the camera looks before shake (landscape: the room centre). */
  private cameraBase = { x: 0, y: 0 };
  /** True when the camera scrolls with the player (portrait, or a room bigger than the screen). */
  private cameraFollows = false;
  /** Astronaut, rocks and crystals, with their shadows. */
  private casters: ShadowCaster[] = [];
  /** Objects mirrored in the water (player first, then rocks and crystals). */
  private reflectors: Reflector[] = [];
  health: Health = newHealth(START_CELLS);
  run!: RunState;
  floor!: FloorLayout;
  here!: FloorRoom;
  /** Doors of this room: the closed-door image and the blocker that stops the player. */
  private doors: { link: DoorLink; image: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite; blocker?: Phaser.GameObjects.Zone }[] = [];
  /** Doors of this room and where they lead. */
  private links: DoorLink[] = [];
  /** Room interior (bounding box) and room plus walls, in world pixels. */
  roomW = CELL_W;
  roomH = CELL_H;
  frameW = CELL_W + 2 * WALL;
  frameH = CELL_H + 2 * WALL;
  private leaving = false;
  /**
   * False until the first frames run smoothly: while textures upload and
   * shaders compile the frame rate dips and physics slows down, so controls
   * and enemies wait. Then any touch made while loading is dropped.
   */
  ready = false;
  private steadyFrames = 0;
  private createdAt = 0;
  private pickups: Pickup[] = [];
  private breakables: Breakable[] = [];
  /** No "not enough coins" message again before this time. */
  private nextShopHintAt = 0;
  /** Item effects drawn on the astronaut. */
  private auras!: ItemAuras;
  /** Chalk tutorial on the start room floor, and which controls it shows. */
  private tutorial: Phaser.GameObjects.GameObject[] = [];
  private tutorialMode: 'keys' | 'touch' | 'pad' | null = null;
  dead = false;
  enemies!: EnemyManager;
  /** Free floor cells left after props are placed, for enemies to start on. */
  private spawnCells: { c: number; r: number }[] = [];
  private hurtUntil = 0;
  private hudSynced = false;
  private tintUntil = 0;
  private deadAt = 0;
  private restartOffered = false;
  private knockUntil = 0;
  private knock = { x: 0, y: 0 };

  constructor() {
    super('play');
  }

  init(data: PlayData): void {
    this.seed = data.run?.seed ?? data.seed ?? newSeedString();
    this.run = data.run ?? { seed: this.seed, room: 0, health: newHealth(START_CELLS), cleared: [], visited: [], items: [], taken: [] };
    this.doors = [];
    this.pickups = [];
    this.breakables = [];
    this.ready = false;
    this.steadyFrames = 0;
    this.tutorial = [];
    this.tutorialMode = null;
    this.leaving = false;
    this.quality = data.quality ?? 'high';
    this.shakeStrength = data.shake ?? 1;
    this.impactLights = [];
    this.rings = [];
    this.stats = computeStats(BASE_STATS, itemModifiers(this.run.items));
    this.shootKeys.clear();
    this.nextShotAt = 0;
    this.shotsFired = 0;
    this.shotLights = [];
    this.glows = [];
    this.reflectors = [];
    this.casters = [];
    this.facing = 'down';
    this.health = this.run.health;
    this.dead = false;
    this.spawnCells = [];
    this.hurtUntil = 0;
    this.knockUntil = 0;
    this.hudSynced = false;
    this.tintUntil = 0;
    this.restartOffered = false;
  }

  preload(): void {
    preloadPlayer(this);
    preloadBiome(this, CRASH_SITE);
    preloadEnemies(this);
    preloadItemArt(this);
  }

  /** Converts a stat in tiles to world pixels. */
  private px(tiles: number): number {
    return tiles * TILE;
  }

  create(): void {
    const high = this.quality === 'high';
    this.floor = generateFloor(new Rng(seedFromString(this.seed)));
    this.here = this.floor.rooms[this.run.room];
    if (!this.run.visited.includes(this.here.id)) this.run.visited.push(this.here.id);
    this.links = doorLinks(this.floor, this.here);
    const shape = this.here.shape;
    const size = interiorSize(shape);
    this.roomW = size.cols * TILE;
    this.roomH = size.rows * TILE;
    this.frameW = this.roomW + 2 * WALL;
    this.frameH = this.roomH + 2 * WALL;
    const area = shape.cells.length;
    // Each room has its own seed, so walking back into it rebuilds the same room.
    const rng = new Rng(seedFromString(`${this.seed}:${this.here.id}`));
    // At most MAX_PROPS objects per room: a few obstacles, 1-2 glowing crystals, up to two small props.
    // The boss needs room to move, and the shop's pedestals need a clear row: no obstacles there.
    const rockCount = this.here.kind === 'boss' || this.here.kind === 'shop' ? 0 : rng.int(2, 3) * area;
    const doorTiles = this.links.map((l) => doorTile(l.x, l.y, l.side));
    this.room = generateRoom(rng, doorTiles, { rockCount, waterPools: rng.int(1, 2) * area, poolSize: 12, shape });

    makePlaceholderArt(this);
    attachNormalMap(this, ITEMS_KEY);
    attachNormalMap(this, ITEMS2_KEY);
    attachNormalMap(this, COINS_KEY);
    for (const name of SHOP_PROPS) attachNormalMap(this, `shop-${name}`);
    makeCoinAnims(this);
    for (const key of Object.keys(OVERLAY_BOXES)) attachNormalMap(this, key);
    createPlayerAnims(this);
    prepareBiome(this, CRASH_SITE);
    paintFloor(this, 'room-floor', CRASH_SITE, size.cols, size.rows, new Rng(rng.int(0, 1e9)));
    const open = this.room.cells.map((row) => row.map((c) => c !== 'void'));
    paintWalls(this, 'room-walls', CRASH_SITE, open, this.links.map((l, i) => ({ ...doorTiles[i], side: l.side })), new Rng(rng.int(0, 1e9)));

    this.lights.enable().setAmbientColor(0x343a4c);

    // Cave rock around the room fills whatever spare screen space there is.
    const cave = this.add.tileSprite(this.frameW / 2, this.frameH / 2, this.frameW * 8, this.frameH * 8, 'px-cave');
    cave.setLighting(true).setDepth(-20);
    this.add.image(ROOM_X, ROOM_Y, 'room-floor').setOrigin(0).setLighting(true).setDepth(-10);
    this.water = new Water(this, this.room.cells, 'room-floor', ROOM_X, ROOM_Y, this.roomW, this.roomH, high);
    this.water.shader?.setDepth(-9);
    this.add.image(0, 0, 'room-walls').setOrigin(0).setLighting(true).setDepth(1);
    this.propEffects = new PropEffects(this, high);
    this.buildColliders(rng);

    const start = this.entryPoint(this.run.from);
    this.player = this.physics.add.sprite(start.x, start.y, 'player-idle', 0);
    this.player.setLighting(true).setDepth(10);
    // Hitbox at the boots (frame is 48×48, soles on row 46), so the helmet can
    // overlap the wall above like in a 3/4 view.
    this.player.body!.setSize(14, 8).setOffset(17, 38);
    this.player.play('player-idle-down');
    this.reflectors.unshift({ obj: this.player, baseRow: PLAYER_SOLE_ROW });
    // The contact patch sits just behind the player, so the boots overlap
    // its top half: no gap, no floating.
    this.addCaster(this.player, PLAYER_SOLE_ROW, PLAYER_HEIGHT, 18, 1, 4.9);
    this.playerLight = this.lights.addLight(this.player.x, this.player.y, 190, 0xcfeeff, 1.2);
    this.auras = new ItemAuras(this, this.player, () => this.facing);
    this.auras.sync(this.run.items);

    this.shots = this.physics.add.group({ defaultKey: 'px-bolt', maxSize: 40 });
    for (let i = 0; i < LIT_SHOTS; i++) {
      this.shotLights.push(this.lights.addLight(0, 0, SHOT_LIGHT_RADIUS, 0x7cf7d4, 0).setVisible(false));
    }
    this.physics.add.collider(this.player, this.walls);
    // Bolts fly at chest height, so in this 3/4 view they hit a wall or a
    // rock where their ground point (the shadow) meets it: a bolt fired along
    // the top wall passes in front of it instead of bursting at once.
    this.physics.add.overlap(
      this.shots,
      this.walls,
      (shot, wall) => {
        if (!this.bounceShot(shot as Phaser.Physics.Arcade.Image, wall as Phaser.GameObjects.GameObject)) this.killShot(shot as Phaser.Physics.Arcade.Image, true);
      },
      (shot, wall) => this.groundHit(shot as Phaser.Physics.Arcade.Image, wall as Phaser.GameObjects.GameObject) !== null,
    );

    this.sparks = this.add.particles(0, 0, 'px-spark', {
      lifespan: { min: 200, max: 450 },
      speed: { min: 40, max: 140 },
      scale: { start: 1, end: 0 },
      tint: [0x7cf7d4, 0xffffff, 0x39d0ff],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    this.sparks.setDepth(20);
    // Glowing trail behind every bolt in flight.
    this.trail = this.add.particles(0, 0, 'px-spark', {
      lifespan: 170,
      speed: 0,
      scale: { start: 1.6, end: 0 },
      alpha: { start: 0.65, end: 0 },
      tint: [0x7cf7d4, 0x39d0ff],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    this.trail.setDepth(11);
    this.muzzleFlash = this.add.image(0, 0, 'px-flash').setDepth(13).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.muzzleLight = this.lights.addLight(0, 0, 70, 0x9ffcf0, 0);
    for (let i = 0; i < 3; i++) {
      this.impactLights.push(this.lights.addLight(0, 0, 80, 0x9ffcf0, 0));
      this.rings.push(this.add.image(0, 0, 'px-ring').setDepth(19).setBlendMode(Phaser.BlendModes.ADD).setVisible(false));
    }
    this.shake = new CameraShake({ decay: 2.2, maxOffset: 5, strength: this.shakeStrength });

    this.enemies = new EnemyManager({
      scene: this,
      player: this.player,
      walls: this.walls,
      shots: this.shots,
      tile: TILE,
      shotDamage: () => this.stats.damage,
      shotHit: (shot, x, y, keep) => {
        const v = shot.body!.velocity;
        this.impactFeedback(x, y, v.x, v.y);
        if (keep) return;
        this.tweens.killTweensOf(shot);
        this.retireShot(shot);
      },
      pierce: () => hasEffect(this.run.items, 'pierce'),
      bounds: { x: ROOM_X, y: ROOM_Y, w: this.roomW, h: this.roomH },
      hurtPlayer: (amount, fromX, fromY) => this.hurtPlayer(amount, fromX, fromY),
      track: (obj, baseRow, height, width) => {
        this.reflectors.push({ obj, baseRow });
        this.addCaster(obj, baseRow, height, width, Math.min(1.4, width / 24), 4.9);
      },
      untrack: (obj) => this.untrack(obj),
      depthAt,
      shakeAdd: (amount) => this.shake.add(amount),
      playerFeet: () => this.playerFeet(),
      open: (x, y) => !this.blockedAt(x, y),
    });
    this.enemies.onCleared = () => {
      this.run.cleared.push(this.here.id);
      this.hud()?.flash(this.here.kind === 'boss' ? `${BOSS_NAME} sconfitta` : 'Stanza ripulita');
      this.openDoors(true);
      this.syncMap();
      if (this.here.kind === 'normal') this.rollReward();
      if (this.here.kind === 'boss') this.bossReward();
    };
    this.enemies.onBossHealth = (frac) => this.hud()?.setBoss(frac > 0 ? BOSS_NAME : null, frac);
    const enemyRng = new Rng(rng.int(0, 1e9));
    const fights = !this.run.cleared.includes(this.here.id);
    const cellBase = (c: number, r: number) => ({ x: ROOM_X + c * TILE + TILE / 2, y: ROOM_Y + (r + 1) * TILE - 4 });
    if (fights && this.here.kind === 'normal') {
      // Bigger rooms hold more enemies.
      const water: { c: number; r: number }[] = [];
      this.room.cells.forEach((row, r) => row.forEach((cell, c) => cell === 'water' && water.push({ c, r })));
      this.enemies.spawn(enemyRng, this.spawnCells, this.playerFeet(), cellBase, (area - 1) * 2, water);
    } else if (fights && this.here.kind === 'boss') {
      // She waits on the free floor farthest from the door the player came in by.
      const feet = this.playerFeet();
      const far = this.spawnCells
        .map((cell) => ({ cell, d: Math.hypot(cellBase(cell.c, cell.r).x - feet.x, cellBase(cell.c, cell.r).y - feet.y) }))
        .filter(({ cell }) => cell.c > 1 && cell.r > 0 && cell.c < size.cols - 2)
        .sort((a, b) => b.d - a.d)[0]?.cell ?? { c: 6, r: 3 };
      const p = cellBase(far.c, far.r);
      this.enemies.spawnBoss(p.x, p.y);
    }
    if (this.here.kind === 'treasure') this.addPedestal();
    if (this.here.kind === 'shop') this.addShop();
    const waiting = this.run.drops?.[this.here.id];
    if (waiting) this.placeDrop(waiting, false);
    if (this.here.kind === 'start') this.drawTutorial(this.inputMode());
    this.addDoors();
    if (this.enemies.alive === 0) this.openDoors(false);

    if (high) {
      // Dust motes drifting in the dark.
      this.add
        .particles(0, 0, 'px-spark', {
          x: { min: ROOM_X, max: ROOM_X + this.roomW },
          y: { min: ROOM_Y, max: ROOM_Y + this.roomH },
          lifespan: 6000,
          speedX: { min: -4, max: 4 },
          speedY: { min: -6, max: -1 },
          alpha: { start: 0, end: 0, ease: (t: number) => Math.sin(t * Math.PI) * 0.5 },
          scale: 0.5,
          frequency: 120,
          blendMode: Phaser.BlendModes.ADD,
        })
        .setDepth(15);
      addFog(this, ROOM_X, ROOM_Y, this.roomW, this.roomH).setDepth(30);
      Phaser.Actions.AddEffectBloom(this.cameras.main, { threshold: 0.78, blurRadius: 2, blendAmount: 0.7 });
    }

    this.bindInput();
    this.frameCamera();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.frameCamera, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.frameCamera, this));
    if (!this.scene.isActive('hud')) this.scene.launch('hud');
    this.createdAt = this.time.now;
    if (this.run.from !== undefined) this.cameras.main.fadeIn(180, 0, 0, 0);
  }

  /**
   * Which controls the player is using: a connected gamepad, a touch screen
   * (touched, or touch-only with no mouse), or the keyboard.
   */
  private inputMode(): 'keys' | 'touch' | 'pad' {
    if (this.pad()) return 'pad';
    if (this.hud()?.touch.used) return 'touch';
    const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches;
    return coarse || !this.sys.game.device.os.desktop ? 'touch' : 'keys';
  }

  /**
   * Chalk drawings on the start room floor, like a survivor's notes: how to
   * move and how to shoot, for the controls in use (keys, two touch sticks
   * or a gamepad). Redrawn if the player switches device.
   */
  private drawTutorial(mode: 'keys' | 'touch' | 'pad'): void {
    this.tutorial.forEach((o) => o.destroy());
    this.tutorial = [];
    this.tutorialMode = mode;
    const chalk = 0xd8d0bc;
    const alpha = 0.3;
    const g = this.add.graphics().setDepth(-8.5).setAlpha(alpha);
    this.tutorial.push(g);
    g.lineStyle(2, chalk, 1);
    const label = (x: number, y: number, text: string, size = 15) => {
      const t = this.add
        .text(x, y, text, { fontFamily: 'monospace', fontSize: `${size}px`, fontStyle: 'bold', color: '#d8d0bc' })
        .setOrigin(0.5)
        .setDepth(-8.5)
        .setAlpha(alpha);
      this.tutorial.push(t);
    };
    const key = (x: number, y: number, text: string, arrow?: 'up' | 'down' | 'left' | 'right') => {
      g.strokeRoundedRect(x - 9, y - 9, 18, 18, 3);
      if (!arrow) {
        label(x, y, text, 11);
        return;
      }
      g.fillStyle(chalk, 1);
      const [a, b, c] = {
        up: [[0, -4], [-4, 3], [4, 3]],
        down: [[0, 4], [-4, -3], [4, -3]],
        left: [[-4, 0], [3, -4], [3, 4]],
        right: [[4, 0], [-3, -4], [-3, 4]],
      }[arrow];
      g.fillTriangle(x + a[0], y + a[1], x + b[0], y + b[1], x + c[0], y + c[1]);
    };
    /** A thumbstick seen from above, with arrows around it. */
    const stick = (x: number, y: number, name: string) => {
      g.strokeCircle(x, y, 17);
      g.strokeCircle(x, y, 8);
      g.fillStyle(chalk, 1);
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const ax = x + dx * 24;
        const ay = y + dy * 24;
        g.fillTriangle(ax + dx * 4, ay + dy * 4, ax - dy * 3 - dx * 1, ay + dx * 3 - dy * 1, ax + dy * 3 - dx * 1, ay - dx * 3 - dy * 1);
      }
      label(x, y + 1, name, 10);
    };
    const leftX = ROOM_X + 3 * TILE;
    const rightX = ROOM_X + 10 * TILE;
    const top = ROOM_Y + 1.1 * TILE;
    label(leftX, top, 'MUOVI');
    label(rightX, top, 'SPARA');
    if (mode === 'touch') {
      stick(leftX, top + 42, '');
      stick(rightX, top + 42, '');
      label(leftX, top + 78, 'lato sinistro', 10);
      label(rightX, top + 78, 'lato destro', 10);
    } else if (mode === 'pad') {
      stick(leftX, top + 42, 'L');
      stick(rightX, top + 42, 'R');
    } else {
      key(leftX, top + 26, 'W');
      key(leftX - 21, top + 47, 'A');
      key(leftX, top + 47, 'S');
      key(leftX + 21, top + 47, 'D');
      key(rightX, top + 26, '', 'up');
      key(rightX - 21, top + 47, '', 'left');
      key(rightX, top + 47, '', 'down');
      key(rightX + 21, top + 47, '', 'right');
    }
    // A little astronaut between them, with a dashed shot flying off.
    const cx = ROOM_X + 6.5 * TILE;
    const cy = ROOM_Y + 5.6 * TILE;
    g.strokeCircle(cx, cy - 10, 6);
    g.strokeRect(cx - 4, cy - 4, 8, 9);
    for (let i = 0; i < 4; i++) g.lineBetween(cx + 10 + i * 8, cy - 2, cx + 14 + i * 8, cy - 2);
    label(cx, cy + 20, 'ripulisci le stanze, trova il boss', 10);
  }

  /** An alien pedestal standing with its base at (x, baseY): solid, lit, with shadow and reflection. */
  private placePedestal(x: number, baseY: number): void {
    const pedestal = this.physics.add.staticImage(x, baseY, ITEMS_KEY, PEDESTAL_FRAME);
    pedestal.setOrigin(0.5, (PEDESTAL_BASE_ROW + 1) / pedestal.height).setLighting(true).setDepth(depthAt(baseY));
    const body = pedestal.body as Phaser.Physics.Arcade.StaticBody;
    body.updateFromGameObject();
    body.setSize(30, 10).setOffset(6, PEDESTAL_BASE_ROW + 1 - 10);
    this.walls.add(pedestal);
    this.reflectors.push({ obj: pedestal, baseRow: PEDESTAL_BASE_ROW });
    this.addCaster(pedestal, PEDESTAL_BASE_ROW, 20, 36, 1.2, 4.9);
  }

  /** Treasure room: an alien pedestal in the middle, with an item floating over it until taken. */
  private addPedestal(): void {
    const centre = centreTile(this.here.shape);
    const x = ROOM_X + (centre.col + 0.5) * TILE;
    const baseY = ROOM_Y + (centre.row + 1) * TILE - 4;
    this.placePedestal(x, baseY);
    if (this.run.taken.includes(this.here.id)) return;
    const id = pickItem(new Rng(seedFromString(`${this.seed}:${this.here.id}:item`)), this.run.items);
    if (!id) return;
    this.addPickup(itemTexture(id), x, baseY, 40, ITEMS[id].color, 28, PEDESTAL_TOP, () => {
      this.run.taken.push(this.here.id);
      this.takeItem(id);
      return true;
    });
  }

  /**
   * Shop: three items on pedestals and an energy cell, each with its price.
   * Walking onto one buys it if there are enough coins; otherwise it stays
   * put and a short message says how many are needed.
   */
  private addShop(): void {
    const centre = centreTile(this.here.shape);
    const baseY = ROOM_Y + (centre.row + 1) * TILE - 4;
    // Furniture: a vending terminal and a dispenser against the top wall,
    // with the shop's sign hanging on the wall between them.
    for (const [name, dx] of [['terminal', -3.6], ['dispenser', 3.6]] as const) {
      const fx = ROOM_X + (centre.col + 0.5 + dx) * TILE;
      const fy = ROOM_Y + 1.7 * TILE;
      const prop = this.addProp(`shop-${name}`, fx, fy, true);
      const body = prop.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(prop.width - 6, 14).setOffset(3, prop.height - 14);
      this.walls.add(prop);
    }
    const sign = this.add.image(ROOM_X + (centre.col + 0.5 - 1.6) * TILE, ROOM_Y - 2, 'shop-sign').setOrigin(0.5, 1).setLighting(true).setDepth(2);
    this.tweens.add({ targets: sign, angle: { from: -2, to: 2 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const rng = new Rng(seedFromString(`${this.seed}:${this.here.id}:shop`));
    const stock: ItemId[] = [];
    for (let i = 0; i < 3; i++) {
      const id = pickItem(rng, [...this.run.items, ...stock]);
      if (id) stock.push(id);
    }
    const bought = this.run.bought?.[this.here.id] ?? [];
    const label = (x: number, y: number, price: number) =>
      this.add
        .text(x, y, `${price}`, { fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold', color: '#ffd34d' })
        .setOrigin(0.5, 0)
        .setDepth(depthAt(y) + 0.02)
        .setShadow(0, 1, '#000000', 2, true, true);
    const buy = (slot: number, price: number, onBuy: () => boolean, tag: Phaser.GameObjects.Text) => () => {
      const coins = this.run.coins ?? 0;
      if (coins < price) {
        if (this.time.now >= this.nextShopHintAt) {
          this.hud()?.flash(`Servono ${price} monete`);
          this.nextShopHintAt = this.time.now + 1500;
        }
        return false;
      }
      if (!onBuy()) return false;
      this.run.coins = coins - price;
      bought.push(slot);
      this.run.bought = { ...this.run.bought, [this.here.id]: [...bought] };
      tag.destroy();
      this.syncStats();
      return true;
    };
    stock.forEach((id, i) => {
      const x = ROOM_X + (centre.col + 0.5 + (i - 1.5) * 2.4) * TILE;
      this.placePedestal(x, baseY);
      if (bought.includes(i)) return;
      const tag = label(x, baseY + 2, PRICE.item);
      const p = this.addPickup(itemTexture(id), x, baseY, 40, ITEMS[id].color, 26, PEDESTAL_TOP, buy(i, PRICE.item, () => (this.takeItem(id), true), tag));
      p.fixed = true;
    });
    // The energy cell lies on the floor at the end of the row.
    const ex = ROOM_X + (centre.col + 0.5 + 1.5 * 2.4) * TILE;
    if (!bought.includes(3)) {
      const tag = label(ex, baseY + 2, PRICE.energy);
      const take = buy(
        3,
        PRICE.energy,
        () => {
          if (this.health.hp >= this.health.max) return false;
          this.health = heal(this.health, ENERGY_HEAL);
          this.hud()?.setHealth(cellIcons(this.health), this.health.shield);
          return true;
        },
        tag,
      );
      const p = this.addPickup({ key: ITEMS_KEY, frame: ENERGY_CELL_FRAME }, ex, baseY - 2, 14, 0x39d0ff, 18, 0, take);
      p.fixed = true;
    }
  }


  /**
   * A floating, softly lit pickup whose ground point is (x, groundY), drawn
   * `lift` pixels above it; `take` runs when the astronaut's feet come within `radius`.
   */
  private addPickup(
    tex: { key: string; frame: number },
    x: number,
    groundY: number,
    lift: number,
    color: number,
    radius: number,
    surface: number,
    take: () => boolean,
  ): Pickup {
    const y = groundY - lift;
    const icon = this.add.sprite(x, y, tex.key, tex.frame).setLighting(true).setDepth(depthAt(groundY) + 0.01);
    const shadow = this.add.image(x, groundY - surface, 'px-shadow').setDepth(surface ? depthAt(groundY) + 0.005 : 4.9);
    const light = this.lights.addLight(x, y, 70, color, 0.9);
    const pickup: Pickup = { icon, shadow, surface, light, x, y: groundY, vx: 0, vy: 0, lift, phase: Math.random() * 6, radius, take };
    this.pickups.push(pickup);
    return pickup;
  }

  /** True where a sliding pickup cannot go: outside the floor or into a rock. */
  private blockedAt(x: number, y: number): boolean {
    const c = Math.floor((x - ROOM_X) / TILE);
    const r = Math.floor((y - ROOM_Y) / TILE);
    if (x < ROOM_X + 6 || x > ROOM_X + this.roomW - 6 || y < ROOM_Y + 8 || y > ROOM_Y + this.roomH - 2) return true;
    const cell = this.room.cells[r]?.[c];
    return cell === 'rock' || cell === 'void';
  }

  /**
   * Pickups bob in the air. Walking onto one takes it; if it cannot be taken
   * yet (a full suit), the boots shove it and it slides away and stops.
   */
  private updatePickups(time: number, dt: number): void {
    const feet = this.playerFeet();
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    for (const p of this.pickups) {
      const near = !this.dead && !this.leaving && Math.hypot(feet.x - p.x, feet.y - p.y) <= p.radius;
      if (near && !p.take()) {
        if (p.fixed) continue;
        const wasStill = Math.hypot(p.vx, p.vy) < 20;
        Object.assign(p, shove(p, feet.x, feet.y, body.velocity.length()));
        if (wasStill) {
          this.sparks.setEmitterAngle({ min: 200, max: 340 });
          this.sparks.explode(4, p.x, p.y);
        }
      } else if (near) {
        this.collect(p);
        continue;
      }
      Object.assign(p, slide(p, dt, (x, y) => this.blockedAt(x, y)));
      // Levitation: a slow rise and fall; the shadow below shrinks and fades as the icon rises.
      const rise = (Math.sin(time / 420 + p.phase) + 1) / 2;
      const tilt = Math.sin(time / 700 + p.phase) * 0.06;
      p.icon.setPosition(p.x, p.y - p.lift - rise * 5).setRotation(tilt + p.vx * 0.003).setDepth(depthAt(p.y) + 0.01);
      const w = (p.icon.width / 30) * (0.75 - rise * 0.15);
      p.shadow.setPosition(p.x, p.y - p.surface).setScale(w, w * 0.8).setAlpha(0.55 - rise * 0.2);
      p.light.setPosition(p.x, p.y - p.lift - rise * 5);
    }
  }

  /** Takes a pickup: it rises, fades and sparkles. */
  private collect(p: Pickup): void {
    this.pickups = this.pickups.filter((x) => x !== p);
    this.tweens.add({ targets: p.icon, y: p.icon.y - 24, alpha: 0, duration: 400, ease: 'Quad.Out', onComplete: () => p.icon.destroy() });
    this.tweens.add({ targets: p.shadow, alpha: 0, scale: 0, duration: 300, onComplete: () => p.shadow.destroy() });
    this.tweens.add({ targets: p.light, intensity: 0, duration: 400, onComplete: () => this.lights.removeLight(p.light) });
    this.sparks.setEmitterAngle({ min: 0, max: 360 });
    this.sparks.explode(16, p.icon.x, p.icon.y);
  }

  /** The room is playable: drop input made while loading and let enemies start their wake-up from now. */
  private becomeReady(time: number): void {
    this.ready = true;
    // Only on a fresh start: when walking through a door the finger is often
    // still on the stick, and releasing it would leave that touch ignored.
    if (this.run.from === undefined) {
      this.hud()?.touch.releaseAll();
      this.shootKeys.clear();
      this.nextShotAt = time + 150;
    }
    this.enemies.rewake(time);
  }

  /** Stats column in the HUD, and the icons of the items picked up. */
  private syncStats(): void {
    this.hud()?.setItems(this.run.items.map((id) => itemTexture(id)));
    const st = this.stats;
    this.hud()?.setStats([
      { icon: 'coin', value: this.run.coins ?? 0, whole: true },
      { icon: 'speed', value: st.moveSpeed },
      { icon: 'rate', value: st.fireRate },
      { icon: 'damage', value: st.damage },
      { icon: 'range', value: st.range },
      { icon: 'shotSpeed', value: st.shotSpeed },
      { icon: 'luck', value: st.luck },
    ]);
  }

  /** Adds an item to the run: stats, suit and shot effects change at once. */
  takeItem(id: ItemId): void {
    this.run.items.push(id);
    this.auras.sync(this.run.items);
    this.stats = computeStats(BASE_STATS, itemModifiers(this.run.items));
    this.health = applyItemToHealth(this.health, id);
    this.hud()?.setHealth(cellIcons(this.health), this.health.shield);
    this.syncStats();
    this.hud()?.flash(`${ITEMS[id].name}\n${ITEMS[id].hint}`);
    this.shake.add(0.2);
  }

  /**
   * A cleared room sometimes leaves a reward in the middle: a whole suit
   * cell, or (rarer) an item. Luck raises both chances. The reward stays on
   * the floor until picked up, even after leaving the room.
   */
  private rollReward(): void {
    const rng = new Rng(seedFromString(`${this.seed}:${this.here.id}:drop`));
    const reward = rollRoomReward(rng.next(), this.stats.luck);
    const item = reward === 'item' ? pickItem(rng, this.run.items) : undefined;
    const drop: Drop | null = item ?? (reward === 'coin' ? `coin:${rollCoin(rng.next())}` : reward ? 'energy' : null);
    if (!drop) return;
    this.run.drops = { ...this.run.drops, [this.here.id]: drop };
    this.placeDrop(drop, true);
  }

  /**
   * The boss leaves a strong item from the boss pool where she fell, a
   * moment after dying. It is stored at once, so it waits if the player
   * walks out before it appears.
   */
  private bossReward(): void {
    const item = pickItem(new Rng(seedFromString(`${this.seed}:${this.here.id}:boss`)), this.run.items, 'boss');
    if (!item) return;
    this.run.drops = { ...this.run.drops, [this.here.id]: item };
    const room = this.here.id;
    this.time.delayedCall(1400, () => {
      if (this.here.id === room && this.run.drops?.[room] === item) this.placeDrop(item, true);
    });
  }

  /**
   * A coin on the floor: picked up by walking onto it (always), adding its
   * value. `fresh` pops it out with a little hop.
   */
  private dropCoin(kind: CoinKind, x: number, y: number, fresh: boolean, onTake?: () => void): void {
    const color = { shard: 0x4dffb0, chip: 0x39d0ff, core: 0xffd34d }[kind];
    const p = this.addPickup({ key: COINS_KEY, frame: COIN_FRAME[kind] }, x, y, 8, color, 16, 0, () => {
      this.run.coins = (this.run.coins ?? 0) + COIN_VALUE[kind];
      this.syncStats();
      if (kind !== 'shard') this.hud()?.flash(`${COIN_NAME[kind]} +${COIN_VALUE[kind]}`);
      onTake?.();
      return true;
    });
    p.light.setRadius(40);
    p.icon.play({ key: coinSpinKey(kind), startFrame: Math.floor(Math.random() * 6) });
    if (fresh) {
      p.icon.setScale(0.2);
      this.tweens.add({ targets: p.icon, scale: 1, duration: 220, ease: 'Back.Out' });
      // A little hop away from where it came from.
      Object.assign(p, { vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 60 });
    }
  }

  /**
   * Bolts break small props: their ground point inside the prop's footprint
   * chips it; after PROP_HP hits it shatters, maybe leaving a coin. Broken
   * props stay broken when the room is visited again.
   */
  private hitBreakable(shot: Phaser.Physics.Arcade.Image): boolean {
    const gx = shot.x;
    const gy = shot.y + SHOT_HEIGHT;
    for (const b of this.breakables) {
      const p = b.prop;
      if (Math.abs(gx - p.x) > p.width * 0.4 || gy < p.y - 12 || gy > p.y + 4) continue;
      const v = shot.body!.velocity;
      this.impactFeedback(shot.x, shot.y, v.x, v.y);
      this.tweens.killTweensOf(shot);
      this.retireShot(shot);
      b.hp -= 1;
      this.tweens.add({ targets: p, x: p.x + 2, duration: 40, yoyo: true, repeat: 1 });
      if (b.hp <= 0) this.breakProp(b, true);
      return true;
    }
    return false;
  }

  private breakProp(b: Breakable, now: boolean): void {
    this.breakables = this.breakables.filter((x) => x !== b);
    const p = b.prop;
    this.untrack(p);
    if (now) {
      this.sparks.setEmitterAngle({ min: 200, max: 340 });
      this.sparks.explode(14, p.x, p.y - 6);
      this.shake.add(0.12);
      const list = this.run.broken?.[this.here.id] ?? [];
      this.run.broken = { ...this.run.broken, [this.here.id]: [...list, b.index] };
      const rng = new Rng(seedFromString(`${this.seed}:${this.here.id}:prop${b.index}`));
      if (rng.next() < PROP_COIN_CHANCE) this.dropCoin(rollCoin(rng.next()), p.x, p.y, true);
    }
    p.destroy();
  }

  /** Puts a room's reward on the floor in the middle of the room (popping in when just dropped). */
  private placeDrop(drop: Drop, fresh: boolean): void {
    const centre = centreTile(this.here.shape);
    const x = ROOM_X + (centre.col + 0.5) * TILE;
    const y = ROOM_Y + (centre.row + 1) * TILE - 6;
    if (drop.startsWith('coin:')) {
      this.dropCoin(drop.slice(5) as CoinKind, x, y, fresh, () => {
        const drops = { ...this.run.drops };
        delete drops[this.here.id];
        this.run.drops = drops;
        this.syncMap();
      });
      return;
    }
    const done = () => {
      const drops = { ...this.run.drops };
      delete drops[this.here.id];
      this.run.drops = drops;
      this.syncMap();
      return true;
    };
    if (drop === 'energy') {
      this.addPickup({ key: ITEMS_KEY, frame: ENERGY_CELL_FRAME }, x, y, 14, 0x39d0ff, 16, 0, () => {
        if (this.health.hp >= this.health.max) return false;
        this.health = heal(this.health, ENERGY_HEAL);
        this.hud()?.setHealth(cellIcons(this.health), this.health.shield);
        return done();
      });
    } else {
      const id = drop as ItemId;
      this.addPickup(itemTexture(id), x, y, 18, ITEMS[id].color, 20, 0, () => {
        this.takeItem(id);
        return done();
      });
    }
    if (fresh) {
      const p = this.pickups[this.pickups.length - 1];
      this.sparks.setEmitterAngle({ min: 0, max: 360 });
      this.sparks.explode(14, x, y - 14);
      p.icon.setScale(0.2);
      this.tweens.add({ targets: p.icon, scale: 1, duration: 260, ease: 'Back.Out' });
    }
  }

  /**
   * With the reflecting prism a shot bounces off the first wall it meets:
   * the velocity flips on the side it came in from, and it keeps the range
   * it had left. Returns false when the shot should break instead.
   */
  /**
   * How deep a bolt's ground point is inside a wall or rock body, on each
   * axis, or null when it is not inside (the bolt only passes in front).
   */
  private groundHit(shot: Phaser.Physics.Arcade.Image, wall: Phaser.GameObjects.GameObject): { ox: number; oy: number } | null {
    const wb = wall.body as Phaser.Physics.Arcade.StaticBody | null;
    if (!wb) return null;
    const gx = shot.x;
    const gy = shot.y + SHOT_HEIGHT;
    if (gx < wb.x || gx > wb.right || gy < wb.y || gy > wb.bottom) return null;
    return { ox: Math.min(gx - wb.x, wb.right - gx), oy: Math.min(gy - wb.y, wb.bottom - gy) };
  }

  private bounceShot(shot: Phaser.Physics.Arcade.Image, wall: Phaser.GameObjects.GameObject): boolean {
    if (!shot.active || shot.getData('dropping') || shot.getData('bounces') >= 1 || !hasEffect(this.run.items, 'bounce')) return false;
    const sb = shot.body as Phaser.Physics.Arcade.Body;
    const hit = this.groundHit(shot, wall);
    if (!hit) return false;
    const { ox, oy } = hit;
    const v = sb.velocity;
    this.impactFeedback(shot.x, shot.y, v.x, v.y);
    if (ox < oy) {
      v.x = -v.x;
      shot.x += Math.sign(v.x) * (ox + 1);
    } else {
      v.y = -v.y;
      shot.y += Math.sign(v.y) * (oy + 1);
    }
    const travelled = Math.hypot(shot.x - (shot.getData('startX') as number), shot.y - (shot.getData('startY') as number));
    shot.setData('range', Math.max(0, (shot.getData('range') as number) - travelled));
    shot.setData('startX', shot.x).setData('startY', shot.y).setData('bounces', 1);
    shot.setRotation(Math.atan2(v.y, v.x));
    return true;
  }

  /** Where the player stands on arrival: just inside the door that leads back, or the room centre. */
  private entryPoint(from?: number): { x: number; y: number } {
    const link = this.links.find((l) => l.to === from);
    let tile = centreTile(this.here.shape);
    if (link) {
      const d = doorTile(link.x, link.y, link.side);
      const inward = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }[link.side];
      tile = { col: d.col + inward[0], row: d.row + inward[1] };
    }
    // The sprite centre sits above the boots (soles on row 46 of 48).
    return { x: ROOM_X + tile.col * TILE + TILE / 2, y: ROOM_Y + tile.row * TILE + TILE / 2 - 8 };
  }

  /** The doorway of a door, in world pixels: the gap through the wall beyond the door tile. */
  private passage(link: DoorLink): { x: number; y: number; w: number; h: number } {
    const d = doorTile(link.x, link.y, link.side);
    const x = ROOM_X + d.col * TILE;
    const y = ROOM_Y + d.row * TILE;
    return {
      up: { x, y: y - WALL, w: TILE, h: WALL },
      down: { x, y: y + TILE, w: TILE, h: WALL },
      left: { x: x - WALL, y, w: WALL, h: TILE },
      right: { x: x + TILE, y, w: WALL, h: TILE },
    }[link.side];
  }

  /** Closed doors on every wall that leads somewhere, each with a blocker in the opening. */
  private addDoors(): void {
    for (const link of this.links) {
      const g = this.passage(link);
      let image: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
      if (link.side === 'up') {
        image = this.add.sprite(g.x + TILE / 2, g.y + WALL, doorAnimKey(CRASH_SITE), 0).setOrigin(0.5, 1);
      } else {
        image = this.add.image(g.x, g.y, hatchKey(CRASH_SITE, link.side === 'down' ? 'bottom' : link.side)).setOrigin(0);
      }
      image.setLighting(true).setDepth(1.5);
      const blocker = this.add.zone(g.x, g.y, g.w, g.h).setOrigin(0);
      this.walls.add(blocker);
      this.doors.push({ link, image, blocker });
    }
  }

  /** Opens every door: the top one slides open, side hatches retract. */
  private openDoors(animate: boolean): void {
    for (const door of this.doors) {
      if (door.blocker) {
        this.walls.remove(door.blocker, true, true);
        door.blocker = undefined;
      }
      if (door.image instanceof Phaser.GameObjects.Sprite) {
        if (animate) door.image.play(doorAnimKey(CRASH_SITE));
        else door.image.setFrame(CRASH_SITE.doorAnim.frames[CRASH_SITE.doorAnim.frames.length - 1]);
      } else if (animate) {
        this.tweens.add({ targets: door.image, alpha: 0, duration: 220, ease: 'Quad.In' });
      } else {
        door.image.setVisible(false);
      }
    }
    if (animate && this.doors.length) this.shake.add(0.15);
  }

  /** Walks through an open door into the next room, with a short fade. */
  leave(link: DoorLink): void {
    if (this.leaving || this.dead) return;
    this.leaving = true;
    this.player.setVelocity(0, 0);
    this.shootKeys.clear();
    const run: RunState = { ...this.run, room: link.to, from: this.here.id, health: this.health };
    this.cameras.main.fadeOut(160, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
      this.scene.restart({ quality: this.quality, shake: this.shakeStrength, run }),
    );
  }

  /** The door whose doorway the player has walked into, if any. */
  private exitLink(): DoorLink | null {
    const f = this.playerFeet();
    for (const door of this.doors) {
      if (door.blocker) continue;
      const g = this.passage(door.link);
      // Deep enough into the doorway: past the room edge by a few pixels.
      const depth = { up: 4, down: 12, left: 8, right: 8 }[door.link.side];
      const inX = f.x >= g.x - 4 && f.x <= g.x + g.w + 4;
      const inY = f.y >= g.y - 4 && f.y <= g.y + g.h + 4;
      const s = door.link.side;
      if (s === 'up' && inX && f.y < g.y + g.h - depth) return door.link;
      if (s === 'down' && inX && f.y > g.y + depth) return door.link;
      if (s === 'left' && inY && f.x < g.x + g.w - depth) return door.link;
      if (s === 'right' && inY && f.x > g.x + depth) return door.link;
    }
    return null;
  }

  /** Minimap: rooms visited, and the ones seen through their doors. */
  private syncMap(): void {
    const visited = new Set(this.run.visited);
    const seen = new Set<number>();
    for (const id of visited) for (const l of doorLinks(this.floor, this.floor.rooms[id])) seen.add(l.to);
    const shown = this.floor.rooms.filter((r) => visited.has(r.id) || seen.has(r.id));
    this.hud()?.setMap(
      shown.map((r) => ({
        cells: r.shape.cells.map(([x, y]) => ({ x: r.gx + x, y: r.gy + y })),
        kind: r.kind,
        state: r.id === this.here.id ? 'current' : visited.has(r.id) ? 'visited' : 'seen',
        loot: r.id === this.here.id ? undefined : lootOf(this.run.drops?.[r.id]),
        // Doors to rooms that are also on the map, as the grid cell and side they leave from.
        doors: visited.has(r.id)
          ? doorLinks(this.floor, r).map((l) => ({ x: r.gx + l.x, y: r.gy + l.y, side: l.side }))
          : [],
      })),
    );
  }

  /** Fits the camera to the screen: whole room in landscape, follow in portrait. */
  private frameCamera(): void {
    const cam = this.cameras.main;
    const { width, height } = this.scale;
    cam.setSize(width, height);
    // Zoom as for a single room, so big rooms keep the same scale and scroll.
    const view = frameView(width, height, CELL_W, CELL_H, TILE);
    cam.setZoom(view.zoom);
    this.cameraFollows = view.follow || this.roomW > CELL_W || this.roomH > CELL_H;
    if (this.cameraFollows) {
      cam.startFollow(this.player, true, 0.12, 0.12);
      cam.setFollowOffset(0, 0);
      // Stop at the walls; when the room is smaller than the view on one axis, centre it.
      const bw = Math.max(this.frameW, width / view.zoom);
      const bh = Math.max(this.frameH, height / view.zoom);
      cam.setBounds((this.frameW - bw) / 2, (this.frameH - bh) / 2, bw, bh);
    } else {
      cam.stopFollow();
      cam.removeBounds();
      cam.centerOn(ROOM_X + this.roomW / 2, ROOM_Y + this.roomH / 2);
    }
    this.cameraBase = { x: ROOM_X + this.roomW / 2, y: ROOM_Y + this.roomH / 2 };
  }

  private hud(): HudScene | undefined {
    const hud = this.scene.get('hud') as HudScene | undefined;
    return hud?.touch ? hud : undefined;
  }

  update(time: number, delta: number): void {
    this.applyShake(delta / 1000);
    if (!this.ready) {
      this.steadyFrames = delta < 34 ? this.steadyFrames + 1 : 0;
      this.player.setVelocity(0, 0);
      if (this.steadyFrames >= 12 || time - this.createdAt > 3000) this.becomeReady(time);
    }
    if (this.tintUntil && time >= this.tintUntil) {
      this.player.clearTint();
      this.tintUntil = 0;
    }
    if (this.dead) {
      this.player.setVelocity(0, 0);
      if (!this.restartOffered && time - this.deadAt > 1400) this.offerRestart();
    } else if (!this.leaving && this.ready) {
      this.updateMovement(time);
      this.updateShooting(time);
      this.updateAnimation(time);
      const exit = this.exitLink();
      if (exit) this.leave(exit);
    }
    if (this.ready) this.enemies.update(time);
    this.updatePickups(time, delta / 1000);
    if (this.tutorialMode) {
      const mode = this.inputMode();
      if (mode !== this.tutorialMode) this.drawTutorial(mode);
    }
    if (!this.hudSynced && this.hud()) {
      this.hud()!.setHealth(cellIcons(this.health), this.health.shield);
      this.syncStats();
      const bossFight = this.here.kind === 'boss' && this.enemies.alive > 0;
      this.hud()!.setBoss(bossFight ? BOSS_NAME : null, 1);
      this.syncMap();
      const title = this.run.from === undefined
        ? 'Piano 1 — Sito dello schianto'
        : this.here.kind === 'treasure'
          ? 'Stanza del tesoro'
          : this.here.kind === 'shop'
            ? 'Negozio'
          : this.here.kind === 'boss' && !this.run.cleared.includes(this.here.id)
            ? 'Tana del boss'
            : null;
      if (title) this.hud()!.flash(title);
      this.hudSynced = true;
    }
    // Blink while invulnerable after a hit.
    // While immune after a hit: a clear blink and a cold tint, so the
    // player sees that nothing can hurt them for a moment.
    const blinking = !this.dead && time < this.health.invulnerableUntil;
    this.player.setAlpha(blinking && Math.floor(time / 70) % 2 === 0 ? 0.2 : 1);
    if (blinking && time >= this.tintUntil) this.player.setTint(0xb8f1ff);
    else if (!blinking && !this.tintUntil) this.player.clearTint();
    // Stand in front of props higher up the screen, behind the ones lower down.
    this.player.setDepth(depthAt(this.player.y - this.player.displayOriginY + PLAYER_SOLE_ROW));
    this.updateShots(delta / 1000);
    this.auras.update(time, !this.dead && (this.lastMove.x !== 0 || this.lastMove.y !== 0));
    this.updateLights(time);
    this.propEffects.update(time);
    this.hud()?.setDebug(
      `seed ${this.seed}  ${this.quality}  fps ${Math.round(this.game.loop.actualFps)}  ` +
        `dmg ${this.stats.damage.toFixed(1)}  rate ${this.stats.fireRate.toFixed(2)}/s  items ${this.run.items.length}`,
    );
  }

  private bindInput(): void {
    const kb = this.input.keyboard!;
    this.moveKeys = kb.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' }) as typeof this.moveKeys;
    kb.addCapture('UP,DOWN,LEFT,RIGHT,SPACE');
    const onDown = (e: KeyboardEvent) => {
      const dir = SHOOT_CODES[e.code];
      if (dir && !e.repeat) this.shootKeys.press(dir);
    };
    const onUp = (e: KeyboardEvent) => {
      const dir = SHOOT_CODES[e.code];
      if (dir) this.shootKeys.release(dir);
    };
    kb.on('keydown', onDown);
    kb.on('keyup', onUp);
    // Losing focus must not leave the player shooting forever.
    const onBlur = () => this.shootKeys.clear();
    this.game.events.on(Phaser.Core.Events.BLUR, onBlur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb.off('keydown', onDown);
      kb.off('keyup', onUp);
      this.game.events.off(Phaser.Core.Events.BLUR, onBlur);
    });
  }

  private pad(): Phaser.Input.Gamepad.Gamepad | undefined {
    return this.input.gamepad?.pad1 ?? undefined;
  }

  private updateMovement(time: number): void {
    const k = this.moveKeys;
    let x = (k.right.isDown ? 1 : 0) - (k.left.isDown ? 1 : 0);
    let y = (k.down.isDown ? 1 : 0) - (k.up.isDown ? 1 : 0);
    if (x === 0 && y === 0) {
      const t = this.hud()?.touch.moveVector();
      if (t) {
        x = t.x;
        y = t.y;
      }
    }
    const pad = this.pad();
    if (x === 0 && y === 0 && pad) {
      x = pad.leftStick.x;
      y = pad.leftStick.y;
    }
    const v = moveVector(x, y);
    const speed = this.px(this.stats.moveSpeed);
    if (time < this.knockUntil) this.player.setVelocity(this.knock.x, this.knock.y);
    else this.player.setVelocity(v.x * speed, v.y * speed);
    this.lastMove = v;

    // Wading: ripples at the feet while moving through water.
    const feetY = this.player.y + 20;
    if ((v.x || v.y) && time >= this.nextStepRippleAt && this.water.contains(this.room.cells, this.player.x, feetY, TILE)) {
      this.water.ripple(this.player.x, feetY, 0.6);
      this.nextStepRippleAt = time + 260;
    }
  }

  private shootDirection(): Dir4 | null {
    const fromKeys = this.shootKeys.current();
    if (fromKeys) return fromKeys;
    const fromTouch = this.hud()?.touch.shootDirection();
    if (fromTouch) return fromTouch;
    const pad = this.pad();
    return pad ? stickToDir4(pad.rightStick.x, pad.rightStick.y) : null;
  }

  /** Camera shake and recoil kicks: visual only, the bodies never move. */
  private applyShake(dt: number): void {
    const off = this.shake.update(dt);
    const cam = this.cameras.main;
    if (this.cameraFollows) {
      cam.setFollowOffset(-off.x, -off.y); // the camera follows the player
    } else {
      cam.centerOn(this.cameraBase.x + off.x, this.cameraBase.y + off.y);
    }
  }

  private updateAnimation(time: number): void {
    const shoot = this.shootDirection();
    this.facing = facingFrom(this.lastMove, shoot, this.facing);
    if (time < this.hurtUntil) {
      // The hurt animation plays out before walking or shooting take over again.
      const { key, flipX } = animKey('idle', this.facing);
      this.player.setFlipX(flipX);
      const hurt = key.replace('player-idle-', 'player-hurt-');
      if (this.player.anims.currentAnim?.key !== hurt) this.player.play(hurt, true);
      return;
    }
    const { key, flipX } = animKey(actionFrom(this.lastMove, !!shoot), this.facing);
    this.player.setFlipX(flipX);
    if (this.player.anims.currentAnim?.key !== key) this.player.play(key, true);
  }

  /** Feet of the astronaut in world pixels. */
  private playerFeet(): { x: number; y: number } {
    return { x: this.player.x, y: this.player.y - this.player.displayOriginY + PLAYER_SOLE_ROW };
  }

  /**
   * Damage to the suit: shield first, then integrity. A hit shakes the view,
   * pushes the astronaut away from the source, plays the hurt animation and
   * gives 1.5 s of blinking invulnerability. At zero the astronaut dies.
   */
  hurtPlayer(amount: number, fromX: number, fromY: number): void {
    if (this.dead || this.leaving) return;
    const now = this.time.now;
    const r = applyDamage(this.health, amount, now);
    if (!r.took) return;
    this.health = r.health;
    this.hud()?.setHealth(cellIcons(this.health), this.health.shield);
    this.shake.add(0.45);
    this.hurtUntil = now + 220;
    const feet = this.playerFeet();
    const dx = feet.x - fromX;
    const dy = feet.y - fromY;
    const d = Math.hypot(dx, dy) || 1;
    this.knockUntil = now + 140;
    this.knock = { x: (dx / d) * 220, y: (dy / d) * 220 };
    this.player.setTint(0xff6a6a);
    this.tintUntil = now + 140;
    if (hasEffect(this.run.items, 'retaliate') && !r.dead) {
      // Reactive armor: a ring of bolts bursts out of the suit.
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        this.fireBolt(this.player.x, this.player.y + 6, Math.cos(a), Math.sin(a), now);
      }
      this.shake.add(0.2);
    }
    if (r.dead) this.die();
  }

  private die(): void {
    this.dead = true;
    this.shootKeys.clear();
    this.player.setVelocity(0, 0).setAlpha(1).clearTint();
    this.player.setFlipX(false);
    this.player.play('player-death');
    this.shake.add(0.7);
    this.deadAt = this.time.now;
  }

  /** After the death animation: offer a restart (R key, or a tap anywhere). */
  private offerRestart(): void {
    this.restartOffered = true;
    this.hud()?.showMessage('Tuta compromessa\n\nPremi R o tocca lo schermo per ricominciare');
    let done = false;
    const restart = () => {
      if (done) return;
      done = true;
      this.hud()?.hideMessage();
      this.scene.restart({ quality: this.quality, shake: this.shakeStrength });
    };
    this.input.keyboard?.once('keydown-R', restart);
    this.input.once(Phaser.Input.Events.POINTER_DOWN, restart);
    this.hud()?.input.once(Phaser.Input.Events.POINTER_DOWN, restart);
  }

  private updateShooting(time: number): void {
    const dir = this.shootDirection();
    if (!dir || time < this.nextShotAt) return;
    const d = DIR4_VECTORS[dir];
    // From the blaster, roughly at chest height (the sprite centre is above the waist).
    const x = this.player.x + d.x * 14;
    const y = this.player.y + 6 + d.y * 10;
    // Items change the volley: a fan of three, and/or twin bolts side by side.
    const angles = hasEffect(this.run.items, 'spread') ? [-0.26, 0, 0.26] : [0];
    const offsets = hasEffect(this.run.items, 'double') ? [-5, 5] : [0];
    for (const a of angles) {
      const vx = d.x * Math.cos(a) - d.y * Math.sin(a);
      const vy = d.x * Math.sin(a) + d.y * Math.cos(a);
      for (const o of offsets) this.fireBolt(x - d.y * o, y + d.x * o, vx, vy, time);
    }
    this.fireFeedback(x, y, d);
    this.nextShotAt = time + fireCooldownMs(this.stats);
    this.shotsFired++;
  }

  /** Launches one bolt from (x, y) in direction (dx, dy), at chest height. */
  private fireBolt(x: number, y: number, dx: number, dy: number, time: number): Phaser.Physics.Arcade.Image | null {
    const shot = this.shots.get(x, y) as Phaser.Physics.Arcade.Image | null;
    if (!shot) return null;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    shot.enableBody(true, x, y, true, true);
    shot.body!.setSize(6, 6);
    const speed = this.px(this.stats.shotSpeed);
    shot.setVelocity(dx * speed + body.velocity.x * SHOT_INHERIT, dy * speed + body.velocity.y * SHOT_INHERIT);
    // Range is a distance, not a time: a slow frame rate must not shorten it.
    shot.setData('startX', shot.x).setData('startY', shot.y).setData('range', this.px(this.stats.range));
    // Shadow on the floor straight below the shot, at the shooter's feet level.
    let shadow = shot.getData('shadow') as Phaser.GameObjects.Image | undefined;
    if (!shadow) {
      shadow = this.add.image(0, 0, 'px-shadow-shot').setDepth(7);
      shot.setData('shadow', shadow);
    }
    shadow.setVisible(true);
    this.placeShotShadow(shot);
    shot.setDepth(12).setBlendMode(Phaser.BlendModes.ADD).setAlpha(1);
    shot.setRotation(Math.atan2(shot.body!.velocity.y, shot.body!.velocity.x));
    shot.setData('dropping', false).setData('born', time).setData('hit', []).setData('bounces', 0);
    // Spawn pop: stretched along the flight, then springs to its rest shape.
    this.tweens.killTweensOf(shot);
    shot.setScale(1.7, 0.55);
    this.tweens.add({ targets: shot, scaleX: 1, scaleY: 1, duration: 110, ease: 'Back.Out' });
    return shot;
  }

  /** Muzzle flash, a light blink at the barrel and a small recoil of the view. */
  private fireFeedback(x: number, y: number, d: { x: number; y: number }): void {
    this.tweens.killTweensOf(this.muzzleFlash);
    this.muzzleFlash
      .setPosition(x, y)
      .setVisible(true)
      .setAlpha(1)
      .setScale(1.4)
      .setRotation(Math.random() * Math.PI);
    this.tweens.add({
      targets: this.muzzleFlash,
      scale: 0.5,
      alpha: 0,
      duration: 80,
      ease: 'Quad.Out',
      onComplete: () => this.muzzleFlash.setVisible(false),
    });
    this.muzzleLight.setPosition(x, y);
    this.muzzleLight.intensity = 1.3;
    this.tweens.killTweensOf(this.muzzleLight);
    this.tweens.add({ targets: this.muzzleLight, intensity: 0, duration: 90, ease: 'Quad.Out' });
    this.shake.kick(-d.x * 1.5, -d.y * 1.5);
  }

  /**
   * Impact on a wall or rock: sparks bouncing back off the surface, an
   * expanding ring, a light pulse and a small shake.
   */
  private impactFeedback(x: number, y: number, vx: number, vy: number): void {
    const back = Phaser.Math.RadToDeg(Math.atan2(-vy, -vx));
    this.sparks.setEmitterAngle({ min: back - 55, max: back + 55 });
    this.sparks.explode(12, x, y);
    const ring = this.rings[this.nextRing];
    this.nextRing = (this.nextRing + 1) % this.rings.length;
    this.tweens.killTweensOf(ring);
    ring.setPosition(x, y).setVisible(true).setAlpha(1).setScale(0.3);
    this.tweens.add({ targets: ring, scale: 1.3, alpha: 0, duration: 160, ease: 'Quad.Out', onComplete: () => ring.setVisible(false) });
    const light = this.impactLights[this.nextImpactLight];
    this.nextImpactLight = (this.nextImpactLight + 1) % this.impactLights.length;
    light.setPosition(x, y);
    light.intensity = 1.5;
    this.tweens.killTweensOf(light);
    this.tweens.add({ targets: light, intensity: 0, duration: 140, ease: 'Quad.Out' });
    this.shake.add(0.12);
  }

  /**
   * End of range: the bolt falls onto its shadow, then fizzles out in a few
   * sparks, or splashes and ripples if it lands in water.
   */
  private dropShot(shot: Phaser.Physics.Arcade.Image): void {
    shot.setData('dropping', true);
    shot.body!.enable = false;
    const groundY = shot.y + SHOT_HEIGHT;
    this.tweens.killTweensOf(shot);
    this.tweens.add({
      targets: shot,
      y: groundY,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 110,
      ease: 'Quad.In',
      onComplete: () => {
        if (this.water.contains(this.room.cells, shot.x, groundY, TILE)) {
          this.water.ripple(shot.x, groundY, 1.3);
          this.sparks.setEmitterAngle({ min: 220, max: 320 });
          this.sparks.explode(6, shot.x, groundY);
        } else {
          this.sparks.setEmitterAngle({ min: 0, max: 360 });
          this.sparks.explode(4, shot.x, groundY);
        }
        this.retireShot(shot);
      },
    });
  }

  private retireShot(shot: Phaser.Physics.Arcade.Image): void {
    (shot.getData('shadow') as Phaser.GameObjects.Image | undefined)?.setVisible(false);
    shot.setData('dropping', false);
    shot.disableBody(true, true);
  }

  private updateShots(dt: number): void {
    const t = this.time.now;
    const homing = hasEffect(this.run.items, 'homing');
    const targets = homing ? this.enemies.targets() : [];
    for (const child of this.shots.getChildren()) {
      const shot = child as Phaser.Physics.Arcade.Image;
      if (!shot.active || shot.getData('dropping')) continue;
      if (homing && targets.length) this.steerShot(shot, targets, dt);
      if (this.breakables.length && this.hitBreakable(shot)) continue;
      this.placeShotShadow(shot);
      this.trail.emitParticleAt(shot.x, shot.y, 1);
      // Plasma shimmer once the spawn pop is over.
      if (t - (shot.getData('born') as number) > 120) {
        const w = 1 + Math.sin(t / 35 + shot.x * 0.1) * 0.1;
        shot.setScale(w, 2 - w);
      }
      const travelled = Math.hypot(shot.x - (shot.getData('startX') as number), shot.y - (shot.getData('startY') as number));
      if (travelled >= (shot.getData('range') as number)) this.killShot(shot, false);
    }
  }

  /**
   * Homing bolts turn towards the nearest enemy within 5 tiles (its ground
   * point towards the enemy's feet), at most 4 radians a second.
   */
  private steerShot(shot: Phaser.Physics.Arcade.Image, targets: { x: number; y: number }[], dt: number): void {
    const gx = shot.x;
    const gy = shot.y + SHOT_HEIGHT;
    let best: { x: number; y: number } | null = null;
    let bestD = 5 * TILE;
    for (const t of targets) {
      const d = Math.hypot(t.x - gx, t.y - gy);
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    if (!best) return;
    const v = shot.body!.velocity;
    const speed = Math.hypot(v.x, v.y);
    const now = Math.atan2(v.y, v.x);
    const want = Math.atan2(best.y - gy, best.x - gx);
    const turn = Phaser.Math.Angle.Wrap(want - now);
    const a = now + Phaser.Math.Clamp(turn, -4 * dt, 4 * dt);
    shot.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
    shot.setRotation(a);
  }

  /** Keeps a shot's floor shadow under it; fainter over water, where the surface scatters light. */
  private placeShotShadow(shot: Phaser.Physics.Arcade.Image): void {
    const shadow = shot.getData('shadow') as Phaser.GameObjects.Image | undefined;
    if (!shadow) return;
    const gx = Math.round(shot.x);
    const gy = Math.round(shot.y + SHOT_HEIGHT);
    const overWater = this.water.contains(this.room.cells, gx, gy, TILE);
    shadow.setPosition(gx, gy).setAlpha(overWater ? 0.35 : 1);
  }

  private killShot(shot: Phaser.Physics.Arcade.Image, hitWall: boolean): void {
    if (!shot.active || shot.getData('dropping')) return;
    if (!hitWall) {
      this.dropShot(shot);
      return;
    }
    const v = shot.body!.velocity;
    this.impactFeedback(shot.x, shot.y, v.x, v.y);
    this.tweens.killTweensOf(shot);
    this.retireShot(shot);
  }

  private updateLights(time: number): void {
    // Suit lamp with a faint flicker.
    this.playerLight.setPosition(this.player.x, this.player.y);
    this.playerLight.intensity = 1.15 + Math.sin(time / 90) * 0.04 + Math.sin(time / 37) * 0.03;

    const active = this.shots.getChildren().filter((c) => c.active) as Phaser.Physics.Arcade.Image[];
    this.shotLights.forEach((light, i) => {
      const shot = active[i];
      light.setVisible(!!shot);
      light.intensity = shot ? 1.2 : 0;
      if (shot) light.setPosition(shot.x, shot.y);
    });
    for (const g of this.glows) g.light.intensity = glowIntensity(g.kind, g.base, time, g.phase);

    // Lights the water sees: the suit lamp, the nearest shots and the crystals.
    const waterLights: WaterLight[] = [
      { x: this.playerLight.x, y: this.playerLight.y, radius: 150, intensity: this.playerLight.intensity, color: 0xcfeeff },
    ];
    for (const shot of active.slice(0, 2)) {
      waterLights.push({ x: shot.x, y: shot.y, radius: SHOT_LIGHT_RADIUS, intensity: 1.1, color: 0x7cf7d4 });
    }
    for (const g of this.glows) {
      waterLights.push({ x: g.light.x, y: g.light.y, radius: g.radius, intensity: g.light.intensity, color: g.color });
    }
    this.water.setLights(waterLights);
    // Every lit shot and every crystal casts shadows; the suit lamp does not.
    const shadowLights: ShadowLight[] = active
      .slice(0, LIT_SHOTS)
      .map((shot) => ({ x: shot.x, y: shot.y, radius: SHOT_LIGHT_RADIUS, intensity: 1.1 }));
    for (const g of this.glows) shadowLights.push({ x: g.light.x, y: g.light.y, radius: g.radius, intensity: g.light.intensity });
    this.updateShadows(shadowLights);
    this.water.updateReflections(this.reflectors, (x, y) => this.brightnessAt(waterLights, x, y));
  }

  /** Adds the contact patch and the pooled cast shadows for one object. */
  private addCaster(
    obj: ShadowCaster['obj'],
    baseRow: number,
    height: number,
    width: number,
    contactScale: number,
    contactDepth: number,
  ): void {
    const contact = this.add.image(0, 0, 'px-shadow').setDepth(contactDepth).setScale(contactScale, Math.min(1, contactScale + 0.1));
    // Cast shadows lie flat on the floor, under every standing object.
    const casts = Array.from({ length: SHADOWS_PER_OBJECT }, () =>
      this.add.image(0, 0, 'px-shadow-cast').setOrigin(0.12, 0.5).setDepth(3).setVisible(false),
    );
    this.casters.push({ obj, baseRow, height, width, contact, casts });
  }

  /**
   * Moves every contact patch under its object and points each cast shadow
   * away from one of the nearby lights, so a passing shot sweeps the
   * shadows of the astronaut and the rocks around. In water everything is
   * fainter: the surface scatters the light.
   */
  private updateShadows(lights: ShadowLight[]): void {
    const dying = this.player.anims.currentAnim?.key === 'player-death';
    for (const caster of this.casters) {
      const { obj, baseRow, height, width, contact, casts } = caster;
      const hidden = !obj.visible || (obj === this.player && dying);
      const baseX = obj.x;
      const baseY = obj.y - obj.displayOriginY + baseRow;
      const fade = this.water.contains(this.room.cells, baseX, baseY, TILE) ? 0.4 : 1;
      contact.setPosition(Math.round(baseX), Math.round(baseY)).setVisible(!hidden).setAlpha(fade);
      const shadows = hidden ? [] : castShadows(baseX, baseY, lights, height, SHADOWS_PER_OBJECT);
      casts.forEach((img, i) => {
        const sh = shadows[i];
        img.setVisible(!!sh);
        if (!sh) return;
        img
          .setPosition(Math.round(baseX), Math.round(baseY - 1))
          .setRotation(sh.angle)
          // Texture is 28×11 with its start at 12%: stretch to the length, widen to the object.
          .setScale(sh.length / (CAST_TEXTURE_W * 0.88), width / CAST_TEXTURE_H)
          .setAlpha(sh.alpha * fade);
      });
    }
  }

  /** Rough light level at a point, matching the scene lights, for unlit reflections. */
  private brightnessAt(lights: WaterLight[], x: number, y: number): number {
    let b = 0.14;
    for (const l of lights) {
      const f = Math.max(0, 1 - Math.hypot(l.x - x, l.y - y) / l.radius);
      b += f * f * l.intensity * 0.8;
    }
    return b;
  }

  private buildColliders(rng: Rng): void {
    this.walls = this.physics.add.staticGroup();
    const addBlock = (x: number, y: number, w: number, h: number) => {
      const zone = this.add.zone(x, y, w, h).setOrigin(0);
      this.walls.add(zone);
    };
    // Every frame tile that is not floor is solid, except the doorways
    // (closed doors add their own blocker). Solid tiles are merged into big
    // rectangles, so walls have no seams for the player to snag on.
    const cols = this.room.cells[0].length;
    const rows = this.room.cells.length;
    const doorway = new Set<string>();
    for (const link of this.links) {
      const g = this.passage(link);
      for (let ty = g.y / TILE; ty < (g.y + g.h) / TILE; ty++) for (let tx = g.x / TILE; tx < (g.x + g.w) / TILE; tx++) doorway.add(`${tx},${ty}`);
    }
    const solid = Array.from({ length: rows + 2 * WALL_TILES }, (_, ty) =>
      Array.from({ length: cols + 2 * WALL_TILES }, (_, tx) => {
        if (doorway.has(`${tx},${ty}`)) return false;
        const cell = this.room.cells[ty - WALL_TILES]?.[tx - WALL_TILES];
        return cell === undefined || cell === 'void';
      }),
    );
    for (const r of solidRects(solid)) addBlock(r.x * TILE, r.y * TILE, r.w * TILE, r.h * TILE);

    const edgeCells: { c: number; r: number }[] = [];
    const freeCells: { c: number; r: number }[] = [];
    const reserved = (c: number, r: number) =>
      [...this.room.doors, centreTile(this.here.shape)].some(
        (d) => Math.abs(d.col - c) + Math.abs(d.row - r) <= 1,
      );
    this.room.cells.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell === 'rock') {
          // Obstacle prop standing on the bottom of its cell.
          const id = rng.pick(CRASH_SITE.obstacles);
          const x = ROOM_X + c * TILE + TILE / 2;
          const baseY = ROOM_Y + (r + 1) * TILE - 3;
          const prop = this.addProp(propKey(CRASH_SITE, id), x, baseY, true, id, rng);
          this.walls.add(prop);
          // The body covers the whole cell, so rocks side by side leave no
          // gaps for the player to wedge into and slide along smoothly.
          const body = prop.body as Phaser.Physics.Arcade.StaticBody;
          body.setSize(TILE, TILE).setOffset((prop.width - TILE) / 2, prop.height + 3 - TILE);
        } else if (cell === 'floor' && !reserved(c, r)) {
          freeCells.push({ c, r });
          // Next to a wall: room border or the rock of an L's missing corner.
          const open = (cc: number, rr: number) => this.room.cells[rr]?.[cc] !== undefined && this.room.cells[rr][cc] !== 'void';
          if (!open(c, r - 1) || !open(c, r + 1) || !open(c - 1, r) || !open(c + 1, r)) edgeCells.push({ c, r });
        }
      }),
    );

    // Small walkable props scattered on free floor (some give off light).
    const obstacles = this.room.cells.flat().filter((c) => c === 'rock').length;
    const maxProps = MAX_PROPS * this.here.shape.cells.length;
    const crystals = Math.min(rng.int(1, 2) * this.here.shape.cells.length, maxProps - obstacles);
    const decor = Math.max(0, Math.min(2 * this.here.shape.cells.length, maxProps - obstacles - crystals));
    for (let i = 0; i < decor && freeCells.length; i++) {
      const spot = freeCells.splice(rng.int(0, freeCells.length - 1), 1)[0];
      // Half of the small props are ones that glow (flares, broken visors…).
      const id = rng.next() < 0.5 ? rng.pick(CRASH_SITE.litDecor) : rng.pick(CRASH_SITE.decor);
      const x = ROOM_X + spot.c * TILE + rng.int(8, TILE - 8);
      const baseY = ROOM_Y + spot.r * TILE + rng.int(16, TILE - 4);
      const prop = this.addProp(propKey(CRASH_SITE, id), x, baseY, false, id, rng);
      // Plain debris (not the glowing props) can be shot to pieces.
      if (!CRASH_SITE.litDecor.includes(id)) this.breakables.push({ prop, index: i, hp: PROP_HP });
    }
    // Props broken on an earlier visit stay broken.
    for (const index of this.run.broken?.[this.here.id] ?? []) {
      const b = this.breakables.find((x) => x.index === index);
      if (b) this.breakProp(b, false);
    }

    // Bioluminescent crystals along the edges: decoration and light sources.
    for (let i = 0; i < crystals && edgeCells.length; i++) {
      const spot = edgeCells.splice(rng.int(0, edgeCells.length - 1), 1)[0];
      const x = ROOM_X + spot.c * TILE + TILE / 2;
      const baseY = ROOM_Y + (spot.r + 1) * TILE - 4;
      const id = rng.pick(CRASH_SITE.crystals);
      this.addProp(propKey(CRASH_SITE, id), x, baseY, false, id, rng);
      const used = freeCells.findIndex((f) => f.c === spot.c && f.r === spot.r);
      if (used >= 0) freeCells.splice(used, 1);
    }
    // Enemies start on the floor nothing else took (not in water).
    this.spawnCells = freeCells.filter((f) => this.room.cells[f.r][f.c] === 'floor');
  }

  /** Removes an object's shadows and reflection (an enemy that died). */
  private untrack(obj: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
    this.reflectors = this.reflectors.filter((r) => r.obj !== obj);
    for (const c of this.casters.filter((x) => x.obj === obj)) {
      c.contact.destroy();
      c.casts.forEach((img) => img.destroy());
    }
    this.casters = this.casters.filter((x) => x.obj !== obj);
  }

  /**
   * Places a lit prop standing at (x, baseY): mirrored in the water, with a
   * contact shadow and cast shadows, drawn in front of what is behind it.
   */
  private addProp(key: string, x: number, baseY: number, solid: boolean, id?: number, rng?: Rng): Phaser.GameObjects.Image {
    // Props with a drawn animation become looping sprites, each starting on a different frame.
    if (!solid && id !== undefined && CRASH_SITE.animated[id]) {
      const sprite = this.add.sprite(x, baseY, propAnimKey(CRASH_SITE, id));
      sprite.play({ key: propAnimKey(CRASH_SITE, id), startFrame: Math.floor((rng?.next() ?? 0) * 4) });
      const prop = this.finishProp(sprite as unknown as Phaser.GameObjects.Image, x, baseY, false, id, rng);
      // A flame gives off its own light: draw it at full brightness, not lit by the room.
      prop.setLighting(false);
      return prop;
    }
    const prop = (solid ? this.physics.add.staticImage(x, baseY, key) : this.add.image(x, baseY, key)) as Phaser.GameObjects.Image;
    return this.finishProp(prop, x, baseY, solid, id, rng);
  }

  private finishProp(prop: Phaser.GameObjects.Image, x: number, baseY: number, solid: boolean, id?: number, rng?: Rng): Phaser.GameObjects.Image {
    prop.setOrigin(0.5, 1).setLighting(true).setDepth(depthAt(baseY));
    if (solid) (prop.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    const baseRow = prop.height - 1;
    this.reflectors.push({ obj: prop, baseRow });
    this.addCaster(prop, baseRow, Math.round(prop.height * 0.8), Math.round(prop.width * 0.85), Math.min(1, prop.width / 30), 4.9);
    if (id !== undefined) this.propEffects.add(prop, CRASH_SITE.effects[id], rng?.next() ?? Math.random());
    // Glowing props carry a light at their middle, with their own rhythm.
    const lamp = id === undefined ? undefined : CRASH_SITE.lamps[id];
    if (lamp) {
      const light = this.lights.addLight(x, baseY - prop.height / 2, lamp.radius, lamp.color, lamp.intensity);
      this.glows.push({
        light,
        base: lamp.intensity,
        phase: (rng?.next() ?? Math.random()) * 6,
        kind: lamp.kind,
        color: lamp.color,
        radius: lamp.radius,
      });
    }
    return prop;
  }
}
