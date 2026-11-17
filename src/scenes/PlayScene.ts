import Phaser from 'phaser';
import { Rng, newSeedString, seedFromString } from '../rules/rng';
import { BASE_STATS, Stats, computeStats, fireCooldownMs } from '../rules/stats';
import { DIR4_VECTORS, Dir4, ShootKeys, moveVector, stickToDir4 } from '../rules/input';
import { DOOR_CELLS, ROOM_COLS, ROOM_ROWS, RoomLayout, generateRoom } from '../rules/room';
import { Quality, frameView } from '../rules/view';
import { actionFrom, animKey, facingFrom } from '../rules/facing';
import { PLAYER_HEIGHT, ShadowLight, castShadows } from '../rules/shadow';
import { CameraShake } from '../rules/shake';
import { GlowKind, glowIntensity } from '../rules/glow';
import { TILE, WALL_TILES, makePlaceholderArt } from '../render/pixelArt';
import { CRASH_SITE, paintFloor, paintWalls, preloadBiome, prepareBiome, propKey } from '../render/biome';
import { Reflector, Water, WaterLight } from '../render/Water';
import { addFog } from '../render/Fog';
import { createPlayerAnims, preloadPlayer } from '../render/playerSprites';
import { PropEffects } from '../render/PropEffects';
import type HudScene from './HudScene';

const ROOM_W = ROOM_COLS * TILE;
const ROOM_H = ROOM_ROWS * TILE;
/** Wall thickness in world pixels. */
const WALL = WALL_TILES * TILE;
/** Room interior starts one wall thickness in from the world origin. */
const ROOM_X = WALL;
const ROOM_Y = WALL;
/** Room plus its wall ring. */
const FRAME_W = ROOM_W + WALL * 2;
const FRAME_H = ROOM_H + WALL * 2;

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

export interface PlayData {
  seed?: string;
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
  /** Astronaut, rocks and crystals, with their shadows. */
  private casters: ShadowCaster[] = [];
  /** Objects mirrored in the water (player first, then rocks and crystals). */
  private reflectors: Reflector[] = [];

  constructor() {
    super('play');
  }

  init(data: PlayData): void {
    this.seed = data.seed ?? newSeedString();
    this.quality = data.quality ?? 'high';
    this.shakeStrength = data.shake ?? 1;
    this.impactLights = [];
    this.rings = [];
    this.stats = computeStats(BASE_STATS, []);
    this.shootKeys.clear();
    this.nextShotAt = 0;
    this.shotsFired = 0;
    this.shotLights = [];
    this.glows = [];
    this.reflectors = [];
    this.casters = [];
    this.facing = 'down';
  }

  preload(): void {
    preloadPlayer(this);
    preloadBiome(this, CRASH_SITE);
  }

  /** Converts a stat in tiles to world pixels. */
  private px(tiles: number): number {
    return tiles * TILE;
  }

  create(): void {
    const high = this.quality === 'high';
    const rng = new Rng(seedFromString(this.seed));
    // At most MAX_PROPS objects per room: a few obstacles, 1-2 glowing crystals, up to two small props.
    this.room = generateRoom(rng, DOOR_CELLS, { rockCount: rng.int(2, 3), waterPools: rng.int(1, 2), poolSize: 12 });

    makePlaceholderArt(this);
    createPlayerAnims(this);
    prepareBiome(this, CRASH_SITE);
    paintFloor(this, 'room-floor', CRASH_SITE, ROOM_COLS, ROOM_ROWS, new Rng(rng.int(0, 1e9)));
    paintWalls(this, 'room-walls', CRASH_SITE, ROOM_COLS, ROOM_ROWS, this.room.doors, new Rng(rng.int(0, 1e9)));

    this.lights.enable().setAmbientColor(0x343a4c);

    // Cave rock around the room fills whatever spare screen space there is.
    const cave = this.add.tileSprite(FRAME_W / 2, FRAME_H / 2, FRAME_W * 8, FRAME_H * 8, 'px-cave');
    cave.setLighting(true).setDepth(-20);
    this.add.image(ROOM_X, ROOM_Y, 'room-floor').setOrigin(0).setLighting(true).setDepth(-10);
    this.water = new Water(this, this.room.cells, 'room-floor', ROOM_X, ROOM_Y, ROOM_W, ROOM_H, high);
    this.water.shader?.setDepth(-9);
    this.add.image(0, 0, 'room-walls').setOrigin(0).setLighting(true).setDepth(1);
    this.propEffects = new PropEffects(this, high);
    this.buildColliders(rng);

    this.player = this.physics.add.sprite(ROOM_X + ROOM_W / 2, ROOM_Y + ROOM_H / 2, 'player-idle', 0);
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

    this.shots = this.physics.add.group({ defaultKey: 'px-bolt', maxSize: 40 });
    for (let i = 0; i < LIT_SHOTS; i++) {
      this.shotLights.push(this.lights.addLight(0, 0, SHOT_LIGHT_RADIUS, 0x7cf7d4, 0).setVisible(false));
    }
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.overlap(this.shots, this.walls, (shot) => this.killShot(shot as Phaser.Physics.Arcade.Image, true));

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

    if (high) {
      // Dust motes drifting in the dark.
      this.add
        .particles(0, 0, 'px-spark', {
          x: { min: ROOM_X, max: ROOM_X + ROOM_W },
          y: { min: ROOM_Y, max: ROOM_Y + ROOM_H },
          lifespan: 6000,
          speedX: { min: -4, max: 4 },
          speedY: { min: -6, max: -1 },
          alpha: { start: 0, end: 0, ease: (t: number) => Math.sin(t * Math.PI) * 0.5 },
          scale: 0.5,
          frequency: 120,
          blendMode: Phaser.BlendModes.ADD,
        })
        .setDepth(15);
      addFog(this, ROOM_X, ROOM_Y, ROOM_W, ROOM_H).setDepth(30);
      Phaser.Actions.AddEffectBloom(this.cameras.main, { threshold: 0.78, blurRadius: 2, blendAmount: 0.7 });
    }

    this.bindInput();
    this.frameCamera();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.frameCamera, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.frameCamera, this));
    if (!this.scene.isActive('hud')) this.scene.launch('hud');
  }

  /** Fits the camera to the screen: whole room in landscape, follow in portrait. */
  private frameCamera(): void {
    const cam = this.cameras.main;
    const { width, height } = this.scale;
    cam.setSize(width, height);
    const view = frameView(width, height, ROOM_W, ROOM_H, TILE);
    cam.setZoom(view.zoom);
    if (view.follow) {
      cam.startFollow(this.player, true, 0.12, 0.12);
      cam.setFollowOffset(0, 0);
      // Keep the room centred vertically and stop at the side walls.
      cam.setBounds(0, FRAME_H / 2 - height / view.zoom / 2, FRAME_W, height / view.zoom);
    } else {
      cam.stopFollow();
      cam.removeBounds();
      cam.centerOn(ROOM_X + ROOM_W / 2, ROOM_Y + ROOM_H / 2);
    }
    this.cameraBase = { x: ROOM_X + ROOM_W / 2, y: ROOM_Y + ROOM_H / 2 };
  }

  private hud(): HudScene | undefined {
    const hud = this.scene.get('hud') as HudScene | undefined;
    return hud?.touch ? hud : undefined;
  }

  update(time: number, delta: number): void {
    this.applyShake(delta / 1000);
    this.updateMovement(time);
    this.updateShooting(time);
    this.updateAnimation();
    // Stand in front of props higher up the screen, behind the ones lower down.
    this.player.setDepth(depthAt(this.player.y - this.player.displayOriginY + PLAYER_SOLE_ROW));
    this.updateShots();
    this.updateLights(time);
    this.propEffects.update(time);
    this.hud()?.setDebug(
      `seed ${this.seed}  ${this.quality}  fps ${Math.round(this.game.loop.actualFps)}  ` +
        `dmg ${this.stats.damage.toFixed(1)}  rate ${this.stats.fireRate.toFixed(2)}/s`,
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
    this.player.setVelocity(v.x * speed, v.y * speed);
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
    if (this.scale.height > this.scale.width) {
      cam.setFollowOffset(-off.x, -off.y); // portrait: the camera follows the player
    } else {
      cam.centerOn(this.cameraBase.x + off.x, this.cameraBase.y + off.y);
    }
  }

  private updateAnimation(): void {
    const shoot = this.shootDirection();
    this.facing = facingFrom(this.lastMove, shoot, this.facing);
    const { key, flipX } = animKey(actionFrom(this.lastMove, !!shoot), this.facing);
    this.player.setFlipX(flipX);
    if (this.player.anims.currentAnim?.key !== key) this.player.play(key, true);
  }

  private updateShooting(time: number): void {
    const dir = this.shootDirection();
    if (!dir || time < this.nextShotAt) return;
    const shot = this.shots.get(this.player.x, this.player.y) as Phaser.Physics.Arcade.Image | null;
    if (!shot) return;
    const d = DIR4_VECTORS[dir];
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    // From the blaster, roughly at chest height (the sprite centre is above the waist).
    shot.enableBody(true, this.player.x + d.x * 14, this.player.y + 6 + d.y * 10, true, true);
    shot.body!.setSize(6, 6);
    const speed = this.px(this.stats.shotSpeed);
    shot.setVelocity(d.x * speed + body.velocity.x * SHOT_INHERIT, d.y * speed + body.velocity.y * SHOT_INHERIT);
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
    shot.setData('dropping', false).setData('born', time);
    // Spawn pop: stretched along the flight, then springs to its rest shape.
    this.tweens.killTweensOf(shot);
    shot.setScale(1.7, 0.55);
    this.tweens.add({ targets: shot, scaleX: 1, scaleY: 1, duration: 110, ease: 'Back.Out' });
    this.fireFeedback(shot.x, shot.y, d);
    this.nextShotAt = time + fireCooldownMs(this.stats);
    this.shotsFired++;
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

  private updateShots(): void {
    const t = this.time.now;
    for (const child of this.shots.getChildren()) {
      const shot = child as Phaser.Physics.Arcade.Image;
      if (!shot.active || shot.getData('dropping')) continue;
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
    addBlock(0, 0, FRAME_W, WALL);
    addBlock(0, FRAME_H - WALL, FRAME_W, WALL);
    addBlock(0, WALL, WALL, ROOM_H);
    addBlock(FRAME_W - WALL, WALL, WALL, ROOM_H);

    const edgeCells: { c: number; r: number }[] = [];
    const freeCells: { c: number; r: number }[] = [];
    const reserved = (c: number, r: number) =>
      [...this.room.doors, { col: Math.floor(ROOM_COLS / 2), row: Math.floor(ROOM_ROWS / 2) }].some(
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
          const body = prop.body as Phaser.Physics.Arcade.StaticBody;
          const bw = Math.min(prop.width - 4, TILE - 4);
          const bh = Math.min(prop.height - 4, 20);
          body.setSize(bw, bh).setOffset((prop.width - bw) / 2, prop.height - bh - 1);
        } else if (cell === 'floor' && !reserved(c, r)) {
          freeCells.push({ c, r });
          if (r === 0 || r === ROOM_ROWS - 1 || c === 0 || c === ROOM_COLS - 1) edgeCells.push({ c, r });
        }
      }),
    );

    // Small walkable props scattered on free floor (some give off light).
    const obstacles = this.room.cells.flat().filter((c) => c === 'rock').length;
    const crystals = Math.min(rng.int(1, 2), MAX_PROPS - obstacles);
    const decor = Math.max(0, Math.min(2, MAX_PROPS - obstacles - crystals));
    for (let i = 0; i < decor && freeCells.length; i++) {
      const spot = freeCells.splice(rng.int(0, freeCells.length - 1), 1)[0];
      // Half of the small props are ones that glow (flares, broken visors…).
      const id = rng.next() < 0.5 ? rng.pick(CRASH_SITE.litDecor) : rng.pick(CRASH_SITE.decor);
      const x = ROOM_X + spot.c * TILE + rng.int(8, TILE - 8);
      const baseY = ROOM_Y + spot.r * TILE + rng.int(16, TILE - 4);
      this.addProp(propKey(CRASH_SITE, id), x, baseY, false, id, rng);
    }

    // Bioluminescent crystals along the edges: decoration and light sources.
    for (let i = 0; i < crystals && edgeCells.length; i++) {
      const spot = edgeCells.splice(rng.int(0, edgeCells.length - 1), 1)[0];
      const x = ROOM_X + spot.c * TILE + TILE / 2;
      const baseY = ROOM_Y + (spot.r + 1) * TILE - 4;
      const id = rng.pick(CRASH_SITE.crystals);
      this.addProp(propKey(CRASH_SITE, id), x, baseY, false, id, rng);
    }
  }

  /**
   * Places a lit prop standing at (x, baseY): mirrored in the water, with a
   * contact shadow and cast shadows, drawn in front of what is behind it.
   */
  private addProp(key: string, x: number, baseY: number, solid: boolean, id?: number, rng?: Rng): Phaser.GameObjects.Image {
    const prop = (solid ? this.physics.add.staticImage(x, baseY, key) : this.add.image(x, baseY, key)) as Phaser.GameObjects.Image;
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
