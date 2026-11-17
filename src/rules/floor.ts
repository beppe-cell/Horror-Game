/**
 * Floor layout: rooms on a grid, joined through the middle of their walls.
 * The start room is in the middle; the boss room is the dead end farthest
 * from it and the treasure room another dead end. Same seed, same floor.
 */
import { Rng } from './rng';
import { DOOR_CELLS, Door } from './room';

export type Side = 'up' | 'down' | 'left' | 'right';
export type RoomKind = 'start' | 'normal' | 'treasure' | 'boss';

export interface FloorRoom {
  id: number;
  gx: number;
  gy: number;
  kind: RoomKind;
  /** Steps from the start room. */
  depth: number;
}

export interface FloorLayout {
  rooms: FloorRoom[];
}

export const SIDES: readonly Side[] = ['up', 'down', 'left', 'right'];

const STEP: Record<Side, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const OPPOSITE: Record<Side, Side> = { up: 'down', down: 'up', left: 'right', right: 'left' };

/** Door cell of each side, matching DOOR_CELLS order (top, bottom, left, right). */
export const SIDE_DOOR: Record<Side, Door> = {
  up: DOOR_CELLS[0],
  down: DOOR_CELLS[1],
  left: DOOR_CELLS[2],
  right: DOOR_CELLS[3],
};

export function roomAt(floor: FloorLayout, gx: number, gy: number): FloorRoom | undefined {
  return floor.rooms.find((r) => r.gx === gx && r.gy === gy);
}

/** The room through the door on `side`, if there is one. */
export function neighbour(floor: FloorLayout, room: FloorRoom, side: Side): FloorRoom | undefined {
  return roomAt(floor, room.gx + STEP[side].x, room.gy + STEP[side].y);
}

/** Sides of a room that have a door. */
export function doorSides(floor: FloorLayout, room: FloorRoom): Side[] {
  return SIDES.filter((s) => neighbour(floor, room, s));
}

/**
 * Grows `count` rooms from the start. A new room is added only next to
 * exactly one existing room, so the floor branches like a tree and has
 * dead ends for the special rooms. Retries until there are enough of them.
 */
export function generateFloor(rng: Rng, count = 9): FloorLayout {
  for (let attempt = 0; attempt < 50; attempt++) {
    const rooms: FloorRoom[] = [{ id: 0, gx: 0, gy: 0, kind: 'start', depth: 0 }];
    const floor = { rooms };
    for (let tries = 0; rooms.length < count && tries < 500; tries++) {
      const from = rng.pick(rooms);
      const side = rng.pick(SIDES);
      const gx = from.gx + STEP[side].x;
      const gy = from.gy + STEP[side].y;
      if (roomAt(floor, gx, gy)) continue;
      const touching = SIDES.filter((s) => roomAt(floor, gx + STEP[s].x, gy + STEP[s].y)).length;
      if (touching !== 1) continue;
      rooms.push({ id: rooms.length, gx, gy, kind: 'normal', depth: from.depth + 1 });
    }
    const deadEnds = rooms
      .filter((r) => r.kind === 'normal' && doorSides(floor, r).length === 1)
      .sort((a, b) => b.depth - a.depth);
    if (rooms.length < count || deadEnds.length < 2) continue;
    deadEnds[0].kind = 'boss';
    rng.pick(deadEnds.slice(1)).kind = 'treasure';
    return floor;
  }
  throw new Error('generateFloor: no layout found');
}
