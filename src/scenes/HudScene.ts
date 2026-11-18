import Phaser from 'phaser';
import { TouchControls } from './TouchControls';

/** Size of one suit-cell icon in screen pixels. */
const CELL = 22;
/** Size of one minimap grid cell in screen pixels, and the gap between cells. */
const MAP_W = 13;
const MAP_H = 9;
const MAP_GAP = 2;
/** Padding of the minimap panel. */
const MAP_PAD = 6;

/** One line of the stats column: which icon to draw and the value shown. */
export interface StatLine {
  icon: 'coin' | 'speed' | 'rate' | 'damage' | 'range' | 'shotSpeed' | 'luck';
  value: number;
  /** Shown as a whole number (coins), not with two decimals. */
  whole?: boolean;
}

export interface MapRoom {
  /** Grid cells the room covers. */
  cells: { x: number; y: number }[];
  kind: 'start' | 'normal' | 'treasure' | 'boss' | 'shop';
  state: 'current' | 'visited' | 'seen';
  /** A reward left lying in the room: shown so the player can come back for it. */
  loot?: 'item' | 'energy' | 'coin';
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
  private statIcons!: Phaser.GameObjects.Graphics;
  private statTexts: Phaser.GameObjects.Text[] = [];
  private lastStats: StatLine[] = [];
  private musicButton!: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Text;
  private pauseVeil!: Phaser.GameObjects.Rectangle;
  private menuButton!: Phaser.GameObjects.Text;
  private pauseText!: Phaser.GameObjects.Text;
  private itemIcons: Phaser.GameObjects.Image[] = [];
  private lastItems: { key: string; frame: number }[] = [];
  /** Screen y of the bottom of the minimap panel, for the item list under it. */
  private mapBottom = 60;
  paused = false;
  private lastHealth: { icons: number[]; shield: number } | null = null;

  /**
   * HUD scale: everything is drawn at a base size and scaled with the
   * screen, so the cells, stats and minimap keep the same share of the view
   * on a phone and on a big monitor.
   */
  private get ui(): number {
    const { width, height } = this.scale;
    return Math.max(1, Math.min(width, height) / 300);
  }

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
    this.statIcons = this.add.graphics().setDepth(100);
    // Music on/off: a note under the stats. Its tap must not also start a stick.
    this.musicButton = this.add
      .text(0, 0, '♪', { fontFamily: 'monospace', color: '#c8ccc4' })
      .setDepth(100)
      .setInteractive({ useHandCursor: true });
    this.musicButton.on(
      Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN,
      (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        const music = this.registry.get('music') as { start(): void; toggle(): boolean } | undefined;
        music?.start();
        music?.toggle();
        this.syncMusicButton();
      },
    );
    this.game.events.on('music-toggled', this.syncMusicButton, this);
    // Pause: P, Esc or the pause button. The game stops; stats and items
    // become fully opaque so they can be read.
    this.pauseButton = this.add
      .text(0, 0, '❚❚', { fontFamily: 'monospace', color: '#c8ccc4' })
      .setDepth(100)
      .setInteractive({ useHandCursor: true });
    this.pauseButton.on(
      Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN,
      (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.togglePause();
      },
    );
    this.pauseVeil = this.add.rectangle(0, 0, 10, 10, 0x000000, 0.55).setOrigin(0).setDepth(95).setVisible(false);
    this.pauseText = this.add
      .text(0, 0, 'PAUSA\n\nP, Esc o ❚❚ per riprendere', { fontFamily: 'monospace', fontSize: '22px', color: '#e8eef7', align: 'center' })
      .setOrigin(0.5)
      .setDepth(110)
      .setVisible(false);
    this.pauseText.setShadow(0, 2, '#000000', 6, true, true);
    // In pause: leave the run and go back to the title screen.
    this.menuButton = this.add
      .text(0, 0, '[ Torna al menu ]', { fontFamily: 'monospace', fontSize: '18px', color: '#ff9a8a' })
      .setOrigin(0.5)
      .setDepth(110)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.menuButton.on(
      Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN,
      (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.quitToMenu();
      },
    );
    this.input.keyboard?.on('keydown-Q', () => {
      if (this.paused) this.quitToMenu();
    });
    this.input.keyboard?.on('keydown-P', () => this.togglePause());
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off('music-toggled', this.syncMusicButton, this));
    this.statTexts = [];
    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
  }

  update(): void {
    this.touch?.update();
  }

  private layout(): void {
    const { width, height } = this.scale;
    this.debugText.setPosition(12, height - 22);
    this.message.setPosition(width / 2, height / 2).setWordWrapWidth(width * 0.85);
    this.banner.setPosition(width / 2, height * 0.18);
    this.drawMap();
    this.drawBoss();
    if (this.lastHealth) this.setHealth(this.lastHealth.icons, this.lastHealth.shield);
    this.setStats(this.lastStats);
    this.setItems(this.lastItems);
    this.pauseVeil?.setSize(width, height);
    this.pauseText?.setPosition(width / 2, height / 2).setFontSize(Math.round(11 * this.ui));
    this.menuButton?.setPosition(width / 2, height / 2 + 34 * this.ui).setFontSize(Math.round(9 * this.ui));
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
    this.setItems(this.lastItems);
  }

  /**
   * Minimap in the top-right corner, in the style of room-based roguelikes:
   * a dark see-through panel with a thin frame, rooms as grey blocks almost
   * touching, each with a dark outline (joined cells merge into one block),
   * the current room white, rooms only seen dark. The boss lair shows a
   * skull and the treasure room a crown.
   */
  private drawMap(): void {
    const g = this.map;
    if (!g) return;
    g.clear();
    // Drawn at base size; the graphics object is scaled with the screen.
    const k = this.ui * 0.95;
    g.setScale(k);
    const rooms = this.mapRooms;
    if (!rooms.length) return;
    const all = rooms.flatMap((r) => r.cells);
    const minX = Math.min(...all.map((c) => c.x));
    const maxX = Math.max(...all.map((c) => c.x));
    const minY = Math.min(...all.map((c) => c.y));
    const maxY = Math.max(...all.map((c) => c.y));
    const stepX = MAP_W + MAP_GAP;
    const stepY = MAP_H + MAP_GAP;
    const panelW = Math.max(60, (maxX - minX + 1) * stepX - MAP_GAP + 2 * MAP_PAD);
    const panelH = Math.max(44, (maxY - minY + 1) * stepY - MAP_GAP + 2 * MAP_PAD);
    const left = this.scale.width / k - 10 - panelW;
    const top = 10;
    g.fillStyle(0x000000, 0.45).fillRect(left, top, panelW, panelH);
    this.mapBottom = (top + panelH) * k;
    g.lineStyle(1, 0xc8ccc4, 0.55).strokeRect(left + 0.5, top + 0.5, panelW - 1, panelH - 1);
    // Centre the rooms in the panel when it is wider than they need.
    const usedW = (maxX - minX + 1) * stepX - MAP_GAP;
    const usedH = (maxY - minY + 1) * stepY - MAP_GAP;
    const px = (x: number) => left + (panelW - usedW) / 2 + (x - minX) * stepX;
    const py = (y: number) => top + (panelH - usedH) / 2 + (y - minY) * stepY;

    for (const r of rooms) {
      const fill = r.state === 'current' ? 0xf2f2f2 : r.state === 'visited' ? 0x8a8a8a : 0x3a3a3a;
      const has = (x: number, y: number) => r.cells.some((c) => c.x === x && c.y === y);
      // Dark outline first, then the fill, then the bridges between joined cells.
      g.fillStyle(0x0b0b0b, 1);
      for (const c of r.cells) g.fillRect(px(c.x) - 1, py(c.y) - 1, MAP_W + 2, MAP_H + 2);
      g.fillStyle(fill, 1);
      for (const c of r.cells) {
        g.fillRect(px(c.x), py(c.y), MAP_W, MAP_H);
        if (has(c.x + 1, c.y)) g.fillRect(px(c.x) + MAP_W, py(c.y), MAP_GAP, MAP_H);
        if (has(c.x, c.y + 1)) g.fillRect(px(c.x), py(c.y) + MAP_H, MAP_W, MAP_GAP);
        if (has(c.x + 1, c.y) && has(c.x, c.y + 1) && has(c.x + 1, c.y + 1)) g.fillRect(px(c.x) + MAP_W, py(c.y) + MAP_H, MAP_GAP, MAP_GAP);
      }
      const cx = Math.round(px(r.cells[0].x) + MAP_W / 2);
      const cy = Math.round(py(r.cells[0].y) + MAP_H / 2);
      if (r.kind === 'boss') {
        // Skull: round head, two dark eyes, a jaw.
        g.fillStyle(0xe8e8e8, 1).fillRect(cx - 3, cy - 3, 6, 4);
        g.fillRect(cx - 2, cy + 1, 4, 2);
        g.fillStyle(0x0b0b0b, 1).fillRect(cx - 2, cy - 2, 1, 2).fillRect(cx + 1, cy - 2, 1, 2);
        g.fillStyle(0xc0303a, 1).fillRect(cx - 3, cy - 4, 6, 1);
      } else if (r.kind === 'shop') {
        // Shop: a gold coin with a dark slot.
        g.fillStyle(0xffd34d, 1).fillCircle(cx, cy, 3.5);
        g.fillStyle(0xb8862a, 1).fillRect(cx - 0.5, cy - 2, 1, 4);
      } else if (r.kind === 'treasure') {
        // Crown: three points over a band.
        g.fillStyle(0xffd34d, 1).fillRect(cx - 3, cy, 7, 2);
        g.fillRect(cx - 3, cy - 3, 1, 3).fillRect(cx, cy - 3, 1, 3).fillRect(cx + 3, cy - 3, 1, 3);
        g.fillStyle(0xb8862a, 1).fillRect(cx - 3, cy + 2, 7, 1);
      }
      if (r.loot) {
        // A reward left on the floor: next to the room's own icon if it has one, else in the middle.
        const lx = r.kind === 'start' || r.kind === 'normal' ? cx : cx + 4;
        if (r.loot === 'coin') {
          g.fillStyle(0x0b0b0b, 1).fillCircle(lx, cy, 3.5);
          g.fillStyle(0x4dffb0, 1).fillCircle(lx, cy, 2.5);
        } else if (r.loot === 'energy') {
          g.fillStyle(0x0b0b0b, 1).fillRect(lx - 2, cy - 3, 5, 7);
          g.fillStyle(0x39d0ff, 1).fillRect(lx - 1, cy - 2, 3, 5);
          g.fillStyle(0xffffff, 1).fillRect(lx, cy - 1, 1, 3);
        } else {
          g.fillStyle(0x0b0b0b, 1).fillRect(lx - 3, cy - 3, 7, 7);
          g.fillStyle(0xffd34d, 1).fillRect(lx - 2, cy - 1, 5, 1).fillRect(lx, cy - 2, 1, 3);
          g.fillStyle(0xfff0b0, 1).fillRect(lx - 1, cy - 1, 3, 1);
        }
      }
    }
  }

  /** Pauses or resumes the game. */
  togglePause(): void {
    const play = this.scene.get('play') as Phaser.Scene & { dead?: boolean };
    if (!play || (!this.paused && play.dead)) return;
    this.paused = !this.paused;
    if (this.paused) this.scene.pause('play');
    else {
      this.touch?.releaseAll();
      this.scene.resume('play');
    }
    this.pauseVeil.setVisible(this.paused);
    this.pauseText.setVisible(this.paused);
    this.menuButton.setVisible(this.paused);
    this.applyDim();
  }

  /** Ends the run and goes back to the title screen. */
  private quitToMenu(): void {
    const play = this.scene.get('play') as Phaser.Scene & { quality?: string; shakeStrength?: number };
    this.paused = false;
    this.touch?.releaseAll();
    this.scene.stop('play');
    this.scene.start('menu', { quality: play?.quality ?? 'high', shake: play?.shakeStrength ?? 1 });
  }

  /**
   * Stats and items stay half see-through while playing, so they do not
   * hide the room; in pause they are fully opaque.
   */
  private applyDim(): void {
    const a = this.paused ? 1 : 0.4;
    this.statIcons?.setAlpha(a);
    for (const t of this.statTexts) t.setAlpha(a);
    for (const i of this.itemIcons) i.setAlpha(a);
    this.pauseButton?.setAlpha(this.paused ? 1 : 0.6);
  }

  /**
   * Icons of the items picked up, in rows under the minimap, like a
   * collection the player can glance at.
   */
  setItems(list: { key: string; frame: number }[]): void {
    this.lastItems = list;
    this.itemIcons.forEach((i) => i.destroy());
    this.itemIcons = [];
    const k = this.ui * 0.5;
    const size = 30 * k;
    const perRow = 4;
    const right = this.scale.width - 12;
    list.forEach((tex, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const img = this.add
        .image(right - size / 2 - col * size, this.mapBottom + 8 + size / 2 + row * size, tex.key, tex.frame)
        .setScale(k * 0.85)
        .setDepth(100);
      this.itemIcons.push(img);
    });
    this.applyDim();
  }

  /** Dim, crossed-out note when the music is off. */
  private syncMusicButton(): void {
    const music = this.registry.get('music') as { isMuted: boolean } | undefined;
    const off = music?.isMuted ?? false;
    this.musicButton?.setText(off ? '♪×' : '♪').setAlpha(off ? 0.45 : 0.9);
  }

  /**
   * Stats column on the left, under the suit cells: a small icon and the
   * value of each stat, so item effects can be read at a glance.
   */
  setStats(lines: StatLine[]): void {
    const g = this.statIcons;
    if (!g) return;
    this.lastStats = lines;
    g.clear();
    const k = this.ui * 0.75;
    g.setScale(k);
    const x = 14;
    lines.forEach((line, i) => {
      const y = 50 + i * 19;
      drawStatIcon(g, line.icon, x, y);
      let t = this.statTexts[i];
      if (!t) {
        t = this.add.text(0, 0, '', { fontFamily: 'monospace', color: '#c8ccc4' }).setDepth(100);
        t.setShadow(0, 1, '#000000', 3, true, true);
        this.statTexts[i] = t;
      }
      t.setFontSize(Math.round(14 * k)).setText(line.whole ? `${line.value}`.padStart(2, '0') : line.value.toFixed(2)).setPosition((x + 19) * k, (y - 1) * k);
    });
    // The music button sits under the stats column.
    const by = (50 + Math.max(lines.length, 6) * 19 + 4) * k;
    this.musicButton?.setFontSize(Math.round(18 * k)).setPosition(x * k, by);
    this.pauseButton?.setFontSize(Math.round(16 * k)).setPosition((x + 22) * k, by + 2 * k);
    this.syncMusicButton();
    this.applyDim();
  }

  private nextDebugAt = 0;

  /** Debug line, redrawn at most twice a second: a text redraw every frame costs a lot on phones. */
  setDebug(text: string): void {
    if (!this.debugText || this.time.now < this.nextDebugAt) return;
    this.nextDebugAt = this.time.now + 500;
    this.debugText.setText(text);
  }

  /**
   * Draws the suit cells top-left: each icon is 2 (full), 1 (half) or 0
   * (empty); shield cells follow in a lighter colour.
   */
  setHealth(icons: number[], shield: number): void {
    const g = this.cells;
    if (!g) return;
    this.lastHealth = { icons, shield };
    g.clear();
    g.setScale(this.ui * 0.6);
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

/** 14×14 icon for a stat, drawn with flat pixel shapes, top-left at (x, y). */
function drawStatIcon(g: Phaser.GameObjects.Graphics, icon: StatLine['icon'], x: number, y: number): void {
  const px = (color: number, rx: number, ry: number, w = 2, h = 2) => g.fillStyle(color, 1).fillRect(x + rx, y + ry, w, h);
  g.fillStyle(0x0b0d14, 0.6).fillRect(x - 1, y - 1, 16, 16);
  switch (icon) {
    case 'coin': // the round alien coin, in gold
      px(0x0b0d14, 3, 2, 8, 10);
      px(0x0b0d14, 2, 3, 10, 8);
      px(0xb8862a, 3, 3, 8, 8);
      px(0xffd34d, 4, 4, 6, 6);
      px(0xb8862a, 6, 5, 2, 4);
      break;
    case 'speed': // a boot with speed lines
      px(0x7d8799, 6, 2, 4, 8);
      px(0x7d8799, 6, 9, 7, 3);
      px(0xe8eef7, 7, 3, 2, 2);
      px(0x39d0ff, 0, 4, 4, 1);
      px(0x39d0ff, 1, 7, 3, 1);
      px(0x39d0ff, 0, 10, 4, 1);
      break;
    case 'rate': // three bolts in a row
      for (const bx of [1, 6, 11]) {
        px(0x7cf7d4, bx, 5, 2, 4);
        px(0xffffff, bx, 6, 2, 2);
      }
      break;
    case 'damage': // a red burst
      px(0xff4a5a, 6, 1, 2, 12);
      px(0xff4a5a, 1, 6, 12, 2);
      px(0xff8a8a, 3, 3, 8, 8);
      px(0xffffff, 6, 6, 2, 2);
      break;
    case 'range': // a target with a line towards it
      px(0x7d8799, 0, 6, 7, 2);
      px(0xff9a3c, 7, 2, 6, 10);
      px(0x0b0d14, 8, 3, 4, 8);
      px(0xff9a3c, 9, 5, 2, 4);
      break;
    case 'shotSpeed': // a bolt with a long trail
      px(0x39d0ff, 0, 6, 4, 2);
      px(0x7cf7d4, 4, 6, 5, 2);
      px(0xffffff, 9, 5, 4, 4);
      break;
    case 'luck': // a four-leaf clover
      for (const [cx, cy] of [[3, 2], [8, 2], [3, 7], [8, 7]]) px(0x4dffb0, cx, cy, 4, 4);
      px(0x1f8a5a, 6, 6, 2, 2);
      px(0x1f8a5a, 7, 10, 1, 4);
      break;
  }
}
