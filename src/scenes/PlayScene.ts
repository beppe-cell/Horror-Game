import Phaser from 'phaser';
import { Rng, newSeedString, seedFromString } from '../rules/rng';
import { BASE_STATS, Stats, computeStats, fireCooldownMs, shotLifetimeMs } from '../rules/stats';
import { DIR4_VECTORS, Dir4, ShootKeys, moveVector, stickToDir4 } from '../rules/input';
import { TouchControls } from './TouchControls';
import { DOOR_CELLS, ROOM_COLS, ROOM_ROWS, RoomLayout, generateRoom } from '../rules/room';

/** Size of one room cell in pixels. The room is 13×7 cells inside 1920×1080. */
export const TILE = 120;
const ROOM_W = ROOM_COLS * TILE;
const ROOM_H = ROOM_ROWS * TILE;
const ROOM_X = (1920 - ROOM_W) / 2;
const ROOM_Y = (1080 - ROOM_H) / 2;
const WALL = 60;

/** Share of the player's velocity added to a new shot. */
const SHOT_INHERIT = 0.3;

const SHOOT_CODES: Record<string, Dir4> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export interface PlayData {
  seed?: string;
}

export default class PlayScene extends Phaser.Scene {
  seed = '';
  stats: Stats = { ...BASE_STATS };
  room!: RoomLayout;
  player!: Phaser.Physics.Arcade.Sprite;
  shots!: Phaser.Physics.Arcade.Group;
  walls!: Phaser.Physics.Arcade.StaticGroup;
  shotsFired = 0;

  private shootKeys = new ShootKeys();
  private moveKeys!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private nextShotAt = 0;
  private debugText!: Phaser.GameObjects.Text;
  touch!: TouchControls;

  constructor() {
    super('play');
  }

  init(data: PlayData): void {
    this.seed = data.seed ?? newSeedString();
    this.stats = computeStats(BASE_STATS, []);
    this.shootKeys.clear();
    this.nextShotAt = 0;
    this.shotsFired = 0;
  }

  create(): void {
    this.makePlaceholderTextures();
    this.room = generateRoom(new Rng(seedFromString(this.seed)), DOOR_CELLS, 14);

    this.add.rectangle(ROOM_X, ROOM_Y, ROOM_W, ROOM_H, 0x141824).setOrigin(0);
    this.buildWalls();

    this.player = this.physics.add.sprite(ROOM_X + ROOM_W / 2, ROOM_Y + ROOM_H / 2, 'ph-player');
    this.player.setCircle(36, 12, 12);
    this.player.setDepth(10);

    this.shots = this.physics.add.group({ defaultKey: 'ph-shot', maxSize: 60 });
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.overlap(this.shots, this.walls, (shot) => this.killShot(shot as Phaser.Physics.Arcade.Image));

    this.bindInput();
    this.touch = new TouchControls(this);

    this.debugText = this.add
      .text(24, 16, '', { fontFamily: 'monospace', fontSize: '22px', color: '#7fe3ff' })
      .setDepth(100);
  }

  update(time: number): void {
    this.updateMovement();
    this.updateShooting(time);
    this.expireShots(time);
    this.debugText.setText(
      `seed ${this.seed}   fps ${Math.round(this.game.loop.actualFps)}   ` +
        `dmg ${this.stats.damage.toFixed(1)}  rate ${this.stats.fireRate.toFixed(2)}/s  ` +
        `range ${Math.round(this.stats.range)}  speed ${Math.round(this.stats.moveSpeed)}`,
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

  private updateMovement(): void {
    const k = this.moveKeys;
    let x = (k.right.isDown ? 1 : 0) - (k.left.isDown ? 1 : 0);
    let y = (k.down.isDown ? 1 : 0) - (k.up.isDown ? 1 : 0);
    if (x === 0 && y === 0) {
      const t = this.touch.moveVector();
      x = t.x;
      y = t.y;
    }
    const pad = this.pad();
    if (x === 0 && y === 0 && pad) {
      x = pad.leftStick.x;
      y = pad.leftStick.y;
    }
    const v = moveVector(x, y);
    this.player.setVelocity(v.x * this.stats.moveSpeed, v.y * this.stats.moveSpeed);
  }

  private shootDirection(): Dir4 | null {
    const fromKeys = this.shootKeys.current();
    if (fromKeys) return fromKeys;
    const fromTouch = this.touch.shootDirection();
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
    shot.enableBody(true, this.player.x + d.x * 40, this.player.y + d.y * 40, true, true);
    shot.setCircle(12);
    shot.setVelocity(
      d.x * this.stats.shotSpeed + body.velocity.x * SHOT_INHERIT,
      d.y * this.stats.shotSpeed + body.velocity.y * SHOT_INHERIT,
    );
    shot.setData('expiresAt', time + shotLifetimeMs(this.stats));
    shot.setDepth(5);
    this.nextShotAt = time + fireCooldownMs(this.stats);
    this.shotsFired++;
  }

  private expireShots(time: number): void {
    for (const child of this.shots.getChildren()) {
      const shot = child as Phaser.Physics.Arcade.Image;
      if (shot.active && time >= (shot.getData('expiresAt') as number)) this.killShot(shot);
    }
  }

  private killShot(shot: Phaser.Physics.Arcade.Image): void {
    shot.disableBody(true, true);
  }

  private buildWalls(): void {
    this.walls = this.physics.add.staticGroup();
    const wallColor = 0x2b3346;
    const addWall = (x: number, y: number, w: number, h: number) => {
      const r = this.add.rectangle(x, y, w, h, wallColor).setOrigin(0);
      this.walls.add(r);
    };
    // Outer walls, closed for now: doors are only marked until rooms connect.
    addWall(ROOM_X - WALL, ROOM_Y - WALL, ROOM_W + WALL * 2, WALL);
    addWall(ROOM_X - WALL, ROOM_Y + ROOM_H, ROOM_W + WALL * 2, WALL);
    addWall(ROOM_X - WALL, ROOM_Y, WALL, ROOM_H);
    addWall(ROOM_X + ROOM_W, ROOM_Y, WALL, ROOM_H);
    for (const door of this.room.doors) {
      const cx = ROOM_X + door.col * TILE + TILE / 2;
      const cy = ROOM_Y + door.row * TILE + TILE / 2;
      const onSide = door.col === 0 || door.col === ROOM_COLS - 1;
      const x = door.col === 0 ? ROOM_X - WALL / 2 : door.col === ROOM_COLS - 1 ? ROOM_X + ROOM_W + WALL / 2 : cx;
      const y = door.row === 0 ? ROOM_Y - WALL / 2 : door.row === ROOM_ROWS - 1 ? ROOM_Y + ROOM_H + WALL / 2 : cy;
      this.add.rectangle(x, y, onSide ? WALL : TILE, onSide ? TILE : WALL, 0x3fb7c9, 0.35).setDepth(1);
    }
    this.room.cells.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell !== 'rock') return;
        const rock = this.add.image(ROOM_X + c * TILE + TILE / 2, ROOM_Y + r * TILE + TILE / 2, 'ph-rock');
        this.walls.add(rock);
      }),
    );
  }

  /** Flat shapes until the AI-generated art arrives in M3. */
  private makePlaceholderTextures(): void {
    if (this.textures.exists('ph-player')) return;
    const g = this.add.graphics();
    g.fillStyle(0xe8eef7).fillCircle(48, 48, 40);
    g.fillStyle(0x39d0ff).fillRoundedRect(28, 30, 40, 22, 10);
    g.lineStyle(6, 0x0b0d14).strokeCircle(48, 48, 40);
    g.generateTexture('ph-player', 96, 96).clear();
    g.fillStyle(0x7cf7d4).fillCircle(14, 14, 12);
    g.lineStyle(3, 0x0b0d14).strokeCircle(14, 14, 12);
    g.generateTexture('ph-shot', 28, 28).clear();
    g.fillStyle(0x4a4f63).fillRoundedRect(8, 8, TILE - 16, TILE - 16, 24);
    g.lineStyle(6, 0x0b0d14).strokeRoundedRect(8, 8, TILE - 16, TILE - 16, 24);
    g.generateTexture('ph-rock', TILE, TILE).destroy();
  }
}
