import Phaser from 'phaser';
import { TouchControls } from './TouchControls';

/** Size of one suit-cell icon in screen pixels. */
const CELL = 22;
/** Size of one minimap grid cell in screen pixels, and the gap between cells. */
const MAP_W = 14;
const MAP_H = 9;
const MAP_GAP = 4;
/** Padding of the minimap panel. */
const MAP_PAD = 7;

export interface MapRoom {
  /** Grid cells the room covers. */
  cells: { x: number; y: number }[];
  kind: 'start' | 'normal' | 'treasure' | 'boss';
  state: 'current' | 'visited' | 'seen';
  /** Doors of the room, drawn as short links across the gaps. */
  doors: { x: number; y: number; side: 'up' | 'down' | 'left' | 'right' }[];
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

  /**
   * Minimap in the top-right corner, on a dark glass panel: rooms as soft
   * blocks (joined cells merge into one shape), short links for the doors,
   * the current room bright, visited rooms grey, rooms only seen as faint
   * ghosts. The boss lair has a red eye, the treasure room a gold diamond.
   */
  private drawMap(): void {
    const g = this.map;
    if (!g) return;
    g.clear();
    const rooms = this.mapRooms;
    if (!rooms.length) return;
    const all = rooms.flatMap((r) => r.cells);
    const minX = Math.min(...all.map((c) => c.x));
    const maxX = Math.max(...all.map((c) => c.x));
    const minY = Math.min(...all.map((c) => c.y));
    const maxY = Math.max(...all.map((c) => c.y));
    const stepX = MAP_W + MAP_GAP;
    const stepY = MAP_H + MAP_GAP;
    const panelW = (maxX - minX + 1) * stepX - MAP_GAP + 2 * MAP_PAD;
    const panelH = (maxY - minY + 1) * stepY - MAP_GAP + 2 * MAP_PAD;
    const left = this.scale.width - 12 - panelW;
    const top = 12;
    g.fillStyle(0x07090f, 0.55).fillRoundedRect(left, top, panelW, panelH, 6);
    g.lineStyle(1, 0x2a3346, 0.9).strokeRoundedRect(left + 0.5, top + 0.5, panelW - 1, panelH - 1, 6);
    const px = (x: number) => left + MAP_PAD + (x - minX) * stepX;
    const py = (y: number) => top + MAP_PAD + (y - minY) * stepY;

    // Door links first, under the rooms.
    g.fillStyle(0x6f7a8f, 0.9);
    for (const r of rooms) {
      for (const d of r.doors) {
        const x = px(d.x);
        const y = py(d.y);
        if (d.side === 'up') g.fillRect(x + MAP_W / 2 - 1, y - MAP_GAP, 2, MAP_GAP);
        if (d.side === 'down') g.fillRect(x + MAP_W / 2 - 1, y + MAP_H, 2, MAP_GAP);
        if (d.side === 'left') g.fillRect(x - MAP_GAP, y + MAP_H / 2 - 1, MAP_GAP, 2);
        if (d.side === 'right') g.fillRect(x + MAP_W, y + MAP_H / 2 - 1, MAP_GAP, 2);
      }
    }

    for (const r of rooms) {
      const [color, alpha] = r.state === 'current' ? [0xdfe8f5, 1] : r.state === 'visited' ? [0x4a5670, 1] : [0x4a5670, 0.35];
      g.fillStyle(color, alpha);
      const has = (x: number, y: number) => r.cells.some((c) => c.x === x && c.y === y);
      for (const c of r.cells) {
        g.fillRoundedRect(px(c.x), py(c.y), MAP_W, MAP_H, 2);
        // Fill the gap towards the next cell of the same room, so they merge.
        if (has(c.x + 1, c.y)) g.fillRect(px(c.x) + MAP_W - 2, py(c.y), MAP_GAP + 4, MAP_H);
        if (has(c.x, c.y + 1)) g.fillRect(px(c.x), py(c.y) + MAP_H - 2, MAP_W, MAP_GAP + 4);
      }
      // Icon in the middle of the room's first cell.
      const cx = px(r.cells[0].x) + MAP_W / 2;
      const cy = py(r.cells[0].y) + MAP_H / 2;
      if (r.kind === 'boss') {
        g.fillStyle(0xff4d5a, 1).fillCircle(cx, cy, 3);
        g.fillStyle(0x0b0d14, 1).fillRect(cx - 0.5, cy - 2, 1, 4);
      } else if (r.kind === 'treasure') {
        g.fillStyle(0xffd34d, 1);
        g.fillTriangle(cx, cy - 3.5, cx + 3, cy, cx - 3, cy);
        g.fillTriangle(cx, cy + 3.5, cx + 3, cy, cx - 3, cy);
      }
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
