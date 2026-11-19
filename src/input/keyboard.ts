/**
 * The keyboard, read straight from the browser for the whole page. The play
 * scene is rebuilt in every room, and Phaser's per-scene keys start "up":
 * a key held while walking through a door was lost until pressed again, so
 * the astronaut stopped or ran on. One tracker for the page never loses a
 * key, and lets go of everything when the page loses focus.
 */
import { HeldKeys } from '../rules/input';

export const keys = new HeldKeys();

window.addEventListener('keydown', (e) => keys.down(e.code), { capture: true });
window.addEventListener('keyup', (e) => keys.up(e.code), { capture: true });
window.addEventListener('blur', () => keys.clear());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) keys.clear();
});
