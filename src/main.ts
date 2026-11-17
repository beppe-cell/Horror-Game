import Phaser from 'phaser';
import PlayScene from './scenes/PlayScene';
import HudScene from './scenes/HudScene';
import { pickQuality } from './rules/view';

const params = new URLSearchParams(window.location.search);
const seedFromUrl = params.get('seed') ?? undefined;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#07070c',
  // The canvas always fills the screen, in any orientation; the play scene
  // frames the room itself (see rules/view.ts).
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  pixelArt: true,
  render: { maxLights: 16 },
  input: { gamepad: true },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: import.meta.env.DEV && params.has('debug') },
  },
  scene: [],
});

const quality = pickQuality({ desktop: game.device.os.desktop, override: params.get('quality') });
// Screen shake strength, `?shake=0` to `?shake=100` (percent). Default full.
const shakeParam = Number(params.get('shake'));
const shake = params.has('shake') && Number.isFinite(shakeParam) ? Math.min(1, Math.max(0, shakeParam / 100)) : 1;
game.scene.add('play', PlayScene, true, { seed: seedFromUrl?.toUpperCase(), quality, shake });
game.scene.add('hud', HudScene, false);

// On touch devices, the first tap asks for fullscreen. It can be refused
// (iPhone Safari has no fullscreen API), which is fine.
window.addEventListener(
  'touchend',
  () => {
    if (!game.scale.isFullscreen && game.device.fullscreen.available) game.scale.startFullscreen();
  },
  { once: true },
);

// Exposed for the smoke test and for debugging from the browser console.
Object.assign(window, { game });
