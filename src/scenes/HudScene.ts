import Phaser from 'phaser';
import { TouchControls } from './TouchControls';

/** Size of one suit-cell icon in screen pixels. */
const CELL = 22;

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

  constructor() {
    super('hud');
  }

  create(): void {
    this.touch = new TouchControls(this);
    this.cells = this.add.graphics().setDepth(100);
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
    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
  }

  private layout(): void {
    const { width, height } = this.scale;
    this.debugText.setPosition(12, height - 22);
    this.message.setPosition(width / 2, height / 2).setWordWrapWidth(width * 0.85);
    this.banner.setPosition(width / 2, height * 0.18);
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
