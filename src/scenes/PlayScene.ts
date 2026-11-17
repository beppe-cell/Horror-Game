import Phaser from 'phaser';
import { Rng, newSeedString, seedFromString } from '../rules/rng';
import { BASE_STATS, Stats, computeStats, fireCooldownMs, shotLifetimeMs } from '../rules/stats';
import { DIR4_VECTORS, Dir4, ShootKeys, moveVector, stickToDir4 } from '../rules/input';
import { DOOR_CELLS, ROOM_COLS, ROOM_ROWS, RoomLayout, generateRoom } from '../rules/room';
import { Quality, frameView } from '../rules/view';
import { TILE, makePlaceholderArt, makeRoomFloor, makeRoomWalls } from '../render/pixelArt';
import { Water } from '../render/Water';
import { addFog } from '../render/Fog';
import type HudScene from './HudScene';

const ROOM_W = ROOM_COLS * TILE;
const ROOM_H = ROOM_ROWS * TILE;
/** Room interior starts one wall tile in from the world origin. */
const ROOM_X = TILE;
const ROOM_Y = TILE;
/** Room plus its wall ring. */
const FRAME_W = ROOM_W + TILE * 2;
const FRAME_H = ROOM_H + TILE * 2;

/** Share of the player's velocity added to a new shot. */
const SHOT_INHERIT = 0.3;
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
  private playerLight!: Phaser.GameObjects.Light;
  private shotLights: Phaser.GameObjects.Light[] = [];
  private crystalLights: { light: Phaser.GameObjects.Light; base: number; phase: number }[] = [];
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super('play');
  }

  init(data: PlayData): void {
    this.seed = data.seed ?? newSeedString();
    this.quality = data.quality ?? 'high';
    this.stats = computeStats(BASE_STATS, []);
    this.shootKeys.clear();
    this.nextShotAt = 0;
    this.shotsFired = 0;
    this.shotLights = [];
    this.crystalLights = [];
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

    this.player = this.physics.add.sprite(ROOM_X + ROOM_W / 2, ROOM_Y + ROOM_H / 2, 'px-player');
    this.player.setLighting(true).setDepth(10);
    this.player.body!.setSize(14, 12).setOffset(9, 18); // feet, so heads overlap walls like 3/4 view
    this.playerLight = this.lights.addLight(this.player.x, this.player.y, 150, 0xcfeeff, 1.6);

    this.shots = this.physics.add.group({ defaultKey: 'px-shot', maxSize: 40 });
    for (let i = 0; i < LIT_SHOTS; i++) {
      this.shotLights.push(this.lights.addLight(0, 0, 70, 0x7cf7d4, 0).setVisible(false));
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
      Phaser.Actions.AddEffectBloom(this.cameras.main, { threshold: 0.55, blurRadius: 2, blendAmount: 0.9 });
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
    const view = frameView(width, height, FRAME_W, FRAME_H, TILE);
    cam.setZoom(view.zoom);
    if (view.follow) {
      cam.startFollow(this.player, true, 0.12, 0.12);
      // Keep the room centred vertically and stop at the side walls.
      cam.setBounds(0, FRAME_H / 2 - height / view.zoom / 2, FRAME_W, height / view.zoom);
    } else {
      cam.stopFollow();
      cam.removeBounds();
      cam.centerOn(FRAME_W / 2, FRAME_H / 2);
    }
  }

  private hud(): HudScene | undefined {
    const hud = this.scene.get('hud') as HudScene | undefined;
    return hud?.touch ? hud : undefined;
  }

  update(time: number): void {
    this.updateMovement(time);
    this.updateShooting(time);
    this.updateShots(time);
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
    if (v.x) this.player.setFlipX(v.x < 0);

    // Wading: ripples at the feet while moving through water.
    const feetY = this.player.y + 10;
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

  private updateShooting(time: number): void {
    const dir = this.shootDirection();
    if (!dir || time < this.nextShotAt) return;
    const shot = this.shots.get(this.player.x, this.player.y) as Phaser.Physics.Arcade.Image | null;
    if (!shot) return;
    const d = DIR4_VECTORS[dir];
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    shot.enableBody(true, this.player.x + d.x * 10, this.player.y + d.y * 10, true, true);
    shot.body!.setSize(6, 6);
    const speed = this.px(this.stats.shotSpeed);
    shot.setVelocity(d.x * speed + body.velocity.x * SHOT_INHERIT, d.y * speed + body.velocity.y * SHOT_INHERIT);
    shot.setData('expiresAt', time + shotLifetimeMs(this.stats));
    shot.setDepth(12).setBlendMode(Phaser.BlendModes.ADD);
    this.nextShotAt = time + fireCooldownMs(this.stats);
    this.shotsFired++;
  }

  private updateShots(time: number): void {
    for (const child of this.shots.getChildren()) {
      const shot = child as Phaser.Physics.Arcade.Image;
      if (shot.active && time >= (shot.getData('expiresAt') as number)) this.killShot(shot, false);
    }
  }

  private killShot(shot: Phaser.Physics.Arcade.Image, hitWall: boolean): void {
    if (!shot.active) return;
    if (this.water.contains(this.room.cells, shot.x, shot.y, TILE)) this.water.ripple(shot.x, shot.y, 1.2);
    else this.sparks.explode(hitWall ? 10 : 5, shot.x, shot.y);
    shot.disableBody(true, true);
  }

  private updateLights(time: number): void {
    // Suit lamp with a faint flicker.
    this.playerLight.setPosition(this.player.x, this.player.y - 4);
    this.playerLight.intensity = 1.5 + Math.sin(time / 90) * 0.04 + Math.sin(time / 37) * 0.03;

    const active = this.shots.getChildren().filter((c) => c.active) as Phaser.Physics.Arcade.Image[];
    this.shotLights.forEach((light, i) => {
      const shot = active[i];
      light.setVisible(!!shot);
      light.intensity = shot ? 1.2 : 0;
      if (shot) light.setPosition(shot.x, shot.y);
    });
    for (const c of this.crystalLights) c.light.intensity = c.base + Math.sin(time / 700 + c.phase) * c.base * 0.25;

    const glints = [{ x: this.player.x, y: this.player.y, radius: 150, intensity: 1 }];
    for (const shot of active.slice(0, 3)) glints.push({ x: shot.x, y: shot.y, radius: 70, intensity: 0.9 });
    this.water.setLights(glints);
  }

  private buildColliders(rng: Rng): void {
    this.walls = this.physics.add.staticGroup();
    const addBlock = (x: number, y: number, w: number, h: number) => {
      const zone = this.add.zone(x, y, w, h).setOrigin(0);
      this.walls.add(zone);
    };
    addBlock(0, 0, FRAME_W, TILE);
    addBlock(0, FRAME_H - TILE, FRAME_W, TILE);
    addBlock(0, TILE, TILE, ROOM_H);
    addBlock(FRAME_W - TILE, TILE, TILE, ROOM_H);

    const floorCells: { c: number; r: number }[] = [];
    this.room.cells.forEach((row, r) =>
      row.forEach((cell, c) => {
        const x = ROOM_X + c * TILE + TILE / 2;
        const y = ROOM_Y + r * TILE + TILE / 2;
        if (cell === 'rock') {
          const rock = this.add.image(x, y, 'px-rock').setLighting(true).setDepth(5);
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
      this.add.image(x, y, 'px-crystal').setLighting(true).setDepth(4).setBlendMode(Phaser.BlendModes.NORMAL);
      const base = 0.9;
      this.crystalLights.push({ light: this.lights.addLight(x, y - 4, 110, 0x4dffb0, base), base, phase: rng.next() * 6 });
    }
  }
}
