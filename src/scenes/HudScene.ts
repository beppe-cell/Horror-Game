import Phaser from 'phaser';
import { TouchControls } from './TouchControls';

/** Size of one suit-cell icon in screen pixels. */
const CELL = 22;
/** Size of one minimap room in screen pixels, and the gap between rooms. */
const MAP_W = 16;
const MAP_H = 11;
const MAP_GAP = 3;

export interface MapRoom {
  gx: number;
  gy: number;
  kind: 'start' | 'normal' | 'treasure' | 'boss';
  state: 'current' | 'visited' | 'seen';
}

/**
 * Screen-space overlay drawn above the game at zoom 1: the suit cells, the
 * debug line, messages and the touch sticks. The play scene zooms its own
 * camera freely underneath.
 */
export default class HudScene extends Phaser.Scene {
  touch!: TouchControls;
  private debugText!: Phaser.GameObjects.Text;
  private cells!: Phaser.GameObjects.Graphics;
  private message!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private map!: Phaser.GameObjects.Graphics;
  private mapRooms: MapRoom[] = [];
  private bossBar!: Phaser.GameObjects.Graphics;
  private bossName!: Phaser.GameObjects.Text;
  private boss: { name: string; frac: number } | null = null;

  constructor() {
    super('hud');
  }

  create(): void {
    this.touch = new TouchControls(this);
    this.cells = this.add.graphics().setDepth(100);
    this.map = this.add.graphics().setDepth(100);
    this.debugText = this.add
      .text(12, 0, '', { fontFamily: 'monospace', fontSize: '12px', color: '#7fe3ff' })
      .setDepth(100)
      .setAlpha(0.7);
    const style = { fontFamily: 'monospace', fontSize: '20px', color: '#e8eef7', align: 'center' as const };
    this.message = this.add.text(0, 0, '', style).setOrigin(0.5).setDepth(110).setVisible(false);
    this.message.setShadow(0, 2, '#000000', 6, true, true);
    this.banner = this.add
      .text(0, 0, '', { ...style, fontSize: '18px', color: '#7cf7d4' })
      .setOrigin(0.5)
      .setDepth(110)
      .setAlpha(0);
    this.banner.setShadow(0, 2, '#000000', 6, true, true);
    this.bossBar = this.add.graphics().setDepth(100);
    this.bossName = this.add
      .text(0, 0, '', { fontFamily: 'monospace', fontSize: '13px', color: '#ff8a8a' })
      .setOrigin(0.5, 1)
      .setDepth(100);
    this.bossName.setShadow(0, 1, '#000000', 4, true, true);
    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
  }

  private layout(): void {
    const { width, height } = this.scale;
    this.debugText.setPosition(12, height - 22);
    this.message.setPosition(width / 2, height / 2).setWordWrapWidth(width * 0.85);
    this.banner.setPosition(width / 2, height * 0.18);
    this.drawMap();
    this.drawBoss();
  }

  /** Boss health bar at the bottom of the screen; null hides it. */
  setBoss(name: string | null, frac = 1): void {
    this.boss = name ? { name, frac } : null;
    this.drawBoss();
  }

  private drawBoss(): void {
    const g = this.bossBar;
    if (!g) return;
    g.clear();
    this.bossName.setVisible(!!this.boss);
    if (!this.boss) return;
    const { width, height } = this.scale;
    const w = Math.min(360, width * 0.6);
    const x = (width - w) / 2;
    const y = height - 44;
    g.fillStyle(0x0b0d14, 0.85).fillRect(x - 3, y - 3, w + 6, 16);
    g.fillStyle(0x3a0f18, 1).fillRect(x, y, w, 10);
    g.fillStyle(0xd84a4a, 1).fillRect(x, y, w * this.boss.frac, 10);
    g.fillStyle(0xff8a8a, 1).fillRect(x, y, w * this.boss.frac, 2);
    this.bossName.setText(this.boss.name).setPosition(width / 2, y - 6);
  }

  /** Minimap in the top-right corner. */
  setMap(rooms: MapRoom[]): void {
    this.mapRooms = rooms;
    this.drawMap();
  }

  private drawMap(): void {
    const g = this.map;
    if (!g) return;
    g.clear();
    const rooms = this.mapRooms;
    if (!rooms.length) return;
    const minX = Math.min(...rooms.map((r) => r.gx));
    const maxX = Math.max(...rooms.map((r) => r.gx));
    const minY = Math.min(...rooms.map((r) => r.gy));
    const stepX = MAP_W + MAP_GAP;
    const stepY = MAP_H + MAP_GAP;
    const left = this.scale.width - 14 - (maxX - minX + 1) * stepX + MAP_GAP;
    const top = 14;
    for (const r of rooms) {
      const x = left + (r.gx - minX) * stepX;
      const y = top + (r.gy - minY) * stepY;
      const fill = r.state === 'current' ? 0xe8eef7 : r.state === 'visited' ? 0x5a6478 : 0x1a2030;
      g.fillStyle(0x0b0d14, 0.85).fillRect(x - 1, y - 1, MAP_W + 2, MAP_H + 2);
      g.fillStyle(fill, 0.95).fillRect(x, y, MAP_W, MAP_H);
      const icon = r.kind === 'boss' ? 0xff4d4d : r.kind === 'treasure' ? 0xffd34d : undefined;
      if (icon !== undefined) g.fillStyle(icon, 1).fillRect(x + MAP_W / 2 - 2, y + MAP_H / 2 - 2, 4, 4);
    }
  }

  setDebug(text: string): void {
    this.debugText?.setText(text);
  }

  /**
   * Draws the suit cells top-left: each icon is 2 (full), 1 (half) or 0
   * (empty); shield cells follow in a lighter colour.
   */
  setHealth(icons: number[], shield: number): void {
    const g = this.cells;
    if (!g) return;
    g.clear();
    const draw = (i: number, fill: number, color: number, light: number) => {
      const x = 14 + i * (CELL + 6);
      const y = 14;
      g.fillStyle(0x0b0d14, 0.85).fillRect(x - 2, y - 2, CELL + 4, CELL + 4);
      g.fillStyle(0x1a2030, 1).fillRect(x, y, CELL, CELL);
      if (fill > 0) {
        const w = fill === 2 ? CELL : CELL / 2;
        g.fillStyle(color, 1).fillRect(x, y, w, CELL);
        g.fillStyle(light, 1).fillRect(x, y, w, 4);
      }
      g.lineStyle(2, 0x39d0ff, 0.9).strokeRect(x, y, CELL, CELL);
    };
    icons.forEach((fill, i) => draw(i, fill, 0x39d0ff, 0xb8f1ff));
    for (let s = 0; s < Math.ceil(shield / 2); s++) {
      draw(icons.length + s, Math.min(2, shield - s * 2), 0xe8eef7, 0xffffff);
    }
  }

  /** A centred message that stays until hidden (for example on death). */
  showMessage(text: string): void {
    this.message.setText(text).setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.message, alpha: 1, duration: 300 });
  }

  hideMessage(): void {
    this.message.setVisible(false);
  }

  /** A short banner near the top that fades out by itself. */
  flash(text: string): void {
    this.tweens.killTweensOf(this.banner);
    this.banner.setText(text).setAlpha(1);
    this.tweens.add({ targets: this.banner, alpha: 0, delay: 1300, duration: 600 });
  }
}
