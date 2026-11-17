import Phaser from 'phaser';
import PlayScene from './scenes/PlayScene';

const seedFromUrl = new URLSearchParams(window.location.search).get('seed') ?? undefined;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1920,
  height: 1080,
  backgroundColor: '#07070c',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { gamepad: true },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: import.meta.env.DEV },
  },
  scene: [],
});

game.scene.add('play', PlayScene, true, { seed: seedFromUrl?.toUpperCase() });

// Exposed for the smoke test and for debugging from the browser console.
Object.assign(window, { game });
