import Phaser from 'phaser';
import { Rng, newSeedString, seedFromString } from '../rules/rng';
import { BASE_STATS, Stats, computeStats, fireCooldownMs } from '../rules/stats';
import { DIR4_VECTORS, Dir4, ShootKeys, moveVector, stickToDir4 } from '../rules/input';
import { DOOR_CELLS, ROOM_COLS, ROOM_ROWS, RoomLayout, generateRoom } from '../rules/room';
import { Quality, frameView } from '../rules/view';
import { actionFrom, animKey, facingFrom } from '../rules/facing';
import { PLAYER_HEIGHT, ShadowLight, castShadows } from '../rules/shadow';
import { CameraShake } from '../rules/shake';
import { TILE, WALL_TILES, makePlaceholderArt, makeRoomFloor, makeRoomWalls } from '../render/pixelArt';
import { Reflector, Water, WaterLight } from '../render/Water';
import { addFog } from '../render/Fog';
import { createPlayerAnims, preloadPlayer } from '../render/playerSprites';
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
  private crystalLights: { light: Phaser.GameObjects.Light; base: number; phase: number }[] = [];
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
    this.crystalLights = [];
    this.reflectors = [];
    this.casters = [];
    this.facing = 'down';
  }

  preload(): void {
    preloadPlayer(this);
  }

  /** Converts a stat in tiles to world pixels. */
  private px(tiles: number): number {
    return tiles * TILE;
  }

  create(): void {
    const high = this.quality === 'high';
    const rng = new Rng(seedFromString(this.seed));
    this.room = generateRoom(rng, DOOR_CELLS, { rockCount: 12, waterPools: rng.int(1, 2), poolSize: 12 });

    makePlaceholderArt(this);
    createPlayerAnims(this);
    makeRoomFloor(this, 'room-floor', ROOM_COLS, ROOM_ROWS, rng.int(0, 1e9));
    makeRoomWalls(this, 'room-walls', ROOM_COLS, ROOM_ROWS, this.room.doors);

    this.lights.enable().setAmbientColor(0x1b2030);

    // Cave rock around the room fills whatever spare screen space there is.
    const cave = this.add.tileSprite(FRAME_W / 2, FRAME_H / 2, FRAME_W * 8, FRAME_H * 8, 'px-cave');
    cave.setLighting(true).setDepth(-20);
    this.add.image(ROOM_X, ROOM_Y, 'room-floor').setOrigin(0).setLighting(true).setDepth(-10);
    this.water = new Water(this, this.room.cells, 'room-floor', ROOM_X, ROOM_Y, ROOM_W, ROOM_H, high);
    this.water.shader?.setDepth(-9);
    this.add.image(0, 0, 'room-walls').setOrigin(0).setLighting(true).setDepth(1);
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
    this.addCaster(this.player, PLAYER_SOLE_ROW, PLAYER_HEIGHT, 18, 1, 9);
    this.playerLight = this.lights.addLight(this.player.x, this.player.y, 150, 0xcfeeff, 1.2);

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
    this.updateShots();
    this.updateLights(time);
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
    for (const c of this.crystalLights) c.light.intensity = c.base + Math.sin(time / 700 + c.phase) * c.base * 0.25;

    // Lights the water sees: the suit lamp, the nearest shots and the crystals.
    const waterLights: WaterLight[] = [
      { x: this.playerLight.x, y: this.playerLight.y, radius: 150, intensity: this.playerLight.intensity, color: 0xcfeeff },
    ];
    for (const shot of active.slice(0, 2)) {
      waterLights.push({ x: shot.x, y: shot.y, radius: SHOT_LIGHT_RADIUS, intensity: 1.1, color: 0x7cf7d4 });
    }
    for (const c of this.crystalLights) {
      waterLights.push({ x: c.light.x, y: c.light.y, radius: 110, intensity: c.light.intensity, color: 0x4dffb0 });
    }
    this.water.setLights(waterLights);
    // Every lit shot and every crystal casts shadows; the suit lamp does not.
    const shadowLights: ShadowLight[] = active
      .slice(0, LIT_SHOTS)
      .map((shot) => ({ x: shot.x, y: shot.y, radius: SHOT_LIGHT_RADIUS, intensity: 1.1 }));
    for (const c of this.crystalLights) shadowLights.push({ x: c.light.x, y: c.light.y, radius: 110, intensity: c.light.intensity });
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

    const floorCells: { c: number; r: number }[] = [];
    this.room.cells.forEach((row, r) =>
      row.forEach((cell, c) => {
        const x = ROOM_X + c * TILE + TILE / 2;
        const y = ROOM_Y + r * TILE + TILE / 2;
        if (cell === 'rock') {
          const rock = this.add.image(x, y, 'px-rock').setLighting(true).setDepth(5);
          this.reflectors.push({ obj: rock, baseRow: 29 });
          this.addCaster(rock, 29, 24, 24, 0.85, 4.9);
          this.walls.add(rock);
          (rock.body as Phaser.Physics.Arcade.StaticBody).setSize(26, 22).setOffset(3, 7);
        } else if (cell === 'floor' && (r === 0 || r === ROOM_ROWS - 1 || c === 0 || c === ROOM_COLS - 1)) {
          floorCells.push({ c, r });
        }
      }),
    );

    // Bioluminescent crystals along the edges: decoration and light sources.
    for (let i = 0; i < 3 && floorCells.length; i++) {
      const spot = floorCells.splice(rng.int(0, floorCells.length - 1), 1)[0];
      const x = ROOM_X + spot.c * TILE + TILE / 2;
      const y = ROOM_Y + spot.r * TILE + TILE / 2;
      const crystal = this.add.image(x, y, 'px-crystal').setLighting(true).setDepth(4);
      this.reflectors.push({ obj: crystal, baseRow: 22 });
      this.addCaster(crystal, 22, 22, 12, 0.5, 3.9);
      const base = 0.9;
      this.crystalLights.push({ light: this.lights.addLight(x, y - 4, 110, 0x4dffb0, base), base, phase: rng.next() * 6 });
    }
  }
}
