/**
 * Which way the player looks and which animation plays. Shooting wins over
 * moving, so the astronaut faces where the shots go while strafing.
 */
import type { Dir4, Vec2 } from './input';

export type PlayerAction = 'idle' | 'walk' | 'shoot';
/** Sprite sheet row: front, back, or side (right; left is the side flipped). */
export type View = 'down' | 'up' | 'side';

export function facingFrom(move: Vec2, shoot: Dir4 | null, previous: Dir4): Dir4 {
  if (shoot) return shoot;
  if (move.x === 0 && move.y === 0) return previous;
  if (Math.abs(move.x) > Math.abs(move.y)) return move.x > 0 ? 'right' : 'left';
  return move.y > 0 ? 'down' : 'up';
}

export function actionFrom(move: Vec2, shooting: boolean): PlayerAction {
  if (shooting) return 'shoot';
  return move.x !== 0 || move.y !== 0 ? 'walk' : 'idle';
}

export function viewOf(facing: Dir4): { view: View; flipX: boolean } {
  if (facing === 'down' || facing === 'up') return { view: facing, flipX: false };
  return { view: 'side', flipX: facing === 'left' };
}

export function animKey(action: PlayerAction, facing: Dir4): { key: string; flipX: boolean } {
  const { view, flipX } = viewOf(facing);
  return { key: `player-${action}-${view}`, flipX };
}
