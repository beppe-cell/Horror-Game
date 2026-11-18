/**
 * Floor layout: rooms on a grid, joined through the middle of their walls.
 * A room fills one grid cell or several: a wide or tall double room, a big
 * 2×2 room or an L of three cells. The start room is a single cell in the
 * middle; the boss room is the dead end farthest from it and the treasure
 * room another dead end. Same seed, same floor.
 */
import { Rng } from './rng';
import { RoomShape, SINGLE } from './room';

export type Side = 'up' | 'down' | 'left' | 'right';
export type RoomKind = 'start' | 'normal' | 'treasure' | 'boss';

export interface FloorRoom {
  id: number;
  /** Top-left grid cell of the room's box. */
  gx: number;
  gy: number;
  shape: RoomShape;
  kind: RoomKind;
  /** Steps from the start room. */
  depth: number;
}

export interface FloorLayout {
  rooms: FloorRoom[];
}

/** A door: on `side` of the room's cell (x, y) (inside its box), leading to room `to`. */
export interface DoorLink {
  x: number;
  y: number;
  side: Side;
  to: number;
}

export const SIDES: readonly Side[] = ['up', 'down', 'left', 'right'];

const STEP: Record<Side, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const OPPOSITE: Record<Side, Side> = { up: 'down', down: 'up', left: 'right', right: 'left' };

/** Room shapes with how often each is picked for a new room. */
const SHAPES: { shape: RoomShape; weight: number }[] = [
  { shape: SINGLE, weight: 46 },
  { shape: { w: 2, h: 1, cells: [[0, 0], [1, 0]] }, weight: 12 },
  { shape: { w: 1, h: 2, cells: [[0, 0], [0, 1]] }, weight: 10 },
  { shape: { w: 2, h: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] }, weight: 6 },
  // The four L rooms: a 2×2 box missing one corner.
  { shape: { w: 2, h: 2, cells: [[0, 0], [0, 1], [1, 1]] }, weight: 3 },
  { shape: { w: 2, h: 2, cells: [[1, 0], [0, 1], [1, 1]] }, weight: 3 },
  { shape: { w: 2, h: 2, cells: [[0, 0], [1, 0], [0, 1]] }, weight: 3 },
  { shape: { w: 2, h: 2, cells: [[0, 0], [1, 0], [1, 1]] }, weight: 3 },
];

function pickShape(rng: Rng): RoomShape {
  const total = SHAPES.reduce((s, x) => s + x.weight, 0);
  let roll = rng.next() * total;
  return (SHAPES.find((x) => (roll -= x.weight) < 0) ?? SHAPES[0]).shape;
}

/** Grid cells a room covers, in absolute grid coordinates. */
export function roomCells(room: FloorRoom): { x: number; y: number }[] {
  return room.shape.cells.map(([x, y]) => ({ x: room.gx + x, y: room.gy + y }));
}

export function roomAt(floor: FloorLayout, gx: number, gy: number): FloorRoom | undefined {
  return floor.rooms.find((r) => r.shape.cells.some(([x, y]) => r.gx + x === gx && r.gy + y === gy));
}

/**
 * The doors of a room: one per neighbouring room, on the first wall the two
 * share (top-left first), so both rooms agree on where it is.
 */
export function doorLinks(floor: FloorLayout, room: FloorRoom): DoorLink[] {
  const shared = new Map<number, { x: number; y: number; side: Side }[]>();
  for (const [x, y] of room.shape.cells) {
    for (const side of SIDES) {
      const other = roomAt(floor, room.gx + x + STEP[side].x, room.gy + y + STEP[side].y);
      if (!other || other === room) continue;
      if (!shared.has(other.id)) shared.set(other.id, []);
      shared.get(other.id)!.push({ x, y, side });
    }
  }
  const links: DoorLink[] = [];
  for (const [to, edges] of shared) {
    // Sort the shared edges the same way from both rooms: by the absolute
    // position of the edge's midpoint (doubled to stay in whole numbers).
    const key = (e: { x: number; y: number; side: Side }) => {
      const mx = 2 * (room.gx + e.x) + 1 + STEP[e.side].x;
      const my = 2 * (room.gy + e.y) + 1 + STEP[e.side].y;
      return my * 1000 + mx;
    };
    edges.sort((a, b) => key(a) - key(b));
    links.push({ ...edges[0], to });
  }
  return links.sort((a, b) => a.to - b.to);
}

/** The room behind a door. */
export function neighbour(floor: FloorLayout, link: DoorLink): FloorRoom {
  return floor.rooms[link.to];
}

/**
 * Grows `count` rooms from the start. A new room is added only where it
 * touches exactly one existing room, so the floor branches like a tree and
 * has dead ends for the special rooms. Retries until there are enough.
 */
export function generateFloor(rng: Rng, count = 9): FloorLayout {
  for (let attempt = 0; attempt < 50; attempt++) {
    const rooms: FloorRoom[] = [{ id: 0, gx: 0, gy: 0, shape: SINGLE, kind: 'start', depth: 0 }];
    const floor = { rooms };
    for (let tries = 0; rooms.length < count && tries < 800; tries++) {
      const from = rng.pick(rooms);
      const [fx, fy] = rng.pick(from.shape.cells);
      const side = rng.pick(SIDES);
      const tx = from.gx + fx + STEP[side].x;
      const ty = from.gy + fy + STEP[side].y;
      const shape = pickShape(rng);
      // Which cell of the new shape sits on the target cell.
      const [ax, ay] = rng.pick(shape.cells);
      const gx = tx - ax;
      const gy = ty - ay;
      const cells = shape.cells.map(([x, y]) => ({ x: gx + x, y: gy + y }));
      if (cells.some((c) => roomAt(floor, c.x, c.y))) continue;
      const touching = new Set<number>();
      for (const c of cells) {
        for (const s of SIDES) {
          const r = roomAt(floor, c.x + STEP[s].x, c.y + STEP[s].y);
          if (r) touching.add(r.id);
        }
      }
      if (touching.size !== 1 || !touching.has(from.id)) continue;
      rooms.push({ id: rooms.length, gx, gy, shape, kind: 'normal', depth: from.depth + 1 });
    }
    const deadEnds = rooms
      .filter((r) => r.kind === 'normal' && doorLinks(floor, r).length === 1)
      .sort((a, b) => b.depth - a.depth);
    if (rooms.length < count || deadEnds.length < 2) continue;
    deadEnds[0].kind = 'boss';
    // The treasure room is a small one: its pedestal stands in the middle.
    const small = deadEnds.slice(1).filter((r) => r.shape.cells.length === 1);
    rng.pick(small.length ? small : deadEnds.slice(1)).kind = 'treasure';
    return floor;
  }
  throw new Error('generateFloor: no layout found');
}
