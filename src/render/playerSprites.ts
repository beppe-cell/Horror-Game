import Phaser from 'phaser';
import { attachNormalMap } from './pixelArt';

/** Frame size of the cleaned player sheets (see tools/clean_sprites.py). */
export const PLAYER_FRAME = 48;
/** Columns per sheet row: one row per view (front, back, side). */
const COLS = 6;
const SHEETS = ['idle', 'walk', 'shoot', 'hurt-death'] as const;

export function preloadPlayer(scene: Phaser.Scene): void {
  for (const sheet of SHEETS) {
    scene.load.spritesheet(`player-${sheet}`, `sprites/player/${sheet}.png`, {
      frameWidth: PLAYER_FRAME,
      frameHeight: PLAYER_FRAME,
    });
  }
}

/** Normal maps for lighting, then one animation per action and view. */
export function createPlayerAnims(scene: Phaser.Scene): void {
  for (const sheet of SHEETS) attachNormalMap(scene, `player-${sheet}`);
  if (scene.anims.exists('player-idle-down')) return;

  const views = ['down', 'up', 'side'] as const;
  const loops: { sheet: string; action: string; fps: number }[] = [
    { sheet: 'idle', action: 'idle', fps: 6 },
    { sheet: 'walk', action: 'walk', fps: 11 },
    { sheet: 'shoot', action: 'shoot', fps: 14 },
  ];
  for (const { sheet, action, fps } of loops) {
    views.forEach((view, row) => {
      scene.anims.create({
        key: `player-${action}-${view}`,
        frames: scene.anims.generateFrameNumbers(`player-${sheet}`, { start: row * COLS, end: row * COLS + COLS - 1 }),
        frameRate: fps,
        repeat: -1,
      });
    });
  }
  // Hurt: row 1 = front (0-2) and back (3-5), row 2 = side (6-8).
  const hurt: Record<string, [number, number]> = { down: [0, 2], up: [3, 5], side: [6, 8] };
  for (const [view, [start, end]] of Object.entries(hurt)) {
    scene.anims.create({
      key: `player-hurt-${view}`,
      frames: scene.anims.generateFrameNumbers('player-hurt-death', { start, end }),
      frameRate: 14,
    });
  }
  scene.anims.create({
    key: 'player-death',
    frames: scene.anims.generateFrameNumbers('player-hurt-death', { start: 12, end: 17 }),
    frameRate: 8,
  });
}
