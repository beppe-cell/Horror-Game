import Phaser from 'phaser';
import { TouchControls } from './TouchControls';

/**
 * Screen-space overlay drawn above the game at zoom 1: the debug line and
 * the touch sticks. The play scene zooms its own camera freely underneath.
 */
export default class HudScene extends Phaser.Scene {
  touch!: TouchControls;
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super('hud');
  }

  create(): void {
    this.touch = new TouchControls(this);
    this.debugText = this.add
      .text(12, 10, '', { fontFamily: 'monospace', fontSize: '14px', color: '#7fe3ff' })
      .setDepth(100);
  }

  setDebug(text: string): void {
    this.debugText?.setText(text);
  }
}
