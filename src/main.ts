import Phaser from 'phaser';
import PlayScene from './scenes/PlayScene';
import HudScene from './scenes/HudScene';
import { pickQuality } from './rules/view';
import { AmbientMusic } from './audio/AmbientMusic';

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
  render: { maxLights: 20 },
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
// `?floor=2` starts the run on a deeper floor, to try it without playing the first.
const floorParam = Math.floor(Number(params.get('floor')));
const floor = Number.isFinite(floorParam) && floorParam > 1 ? floorParam : undefined;
game.scene.add('play', PlayScene, true, { seed: seedFromUrl?.toUpperCase(), quality, shake, floor });
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

// Soundtrack: browsers only allow sound after a gesture, so it starts on
// the first tap or key press. M turns it on and off (so does the ♪ button).
const music = new AmbientMusic();
game.registry.set('music', music);
const startMusic = () => music.start();
window.addEventListener('pointerdown', startMusic, { once: true });
window.addEventListener('keydown', (e) => {
  music.start();
  if (e.code === 'KeyM' && !e.repeat) {
    music.toggle();
    game.events.emit('music-toggled');
  }
});

// Exposed for the smoke test and for debugging from the browser console.
Object.assign(window, { game });
