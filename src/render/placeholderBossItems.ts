/**
 * Code-drawn stand-ins for the floor 1 boss and item sheets, laid out like
 * the Gemini sheets will be (boss: 24 frames of 96x96, items: 12 cells of
 * 32x32), so the real art drops in by loading a PNG under the same key.
 */
import Phaser from 'phaser';
import { makeLitTexture } from './pixelArt';

export const BOSS_KEY = 'boss-brood';
export const BOSS_FRAME = 96;
export const ITEMS_KEY = 'items';
export const ITEM_CELL = 32;

type Ctx = CanvasRenderingContext2D;

function rect(ctx: Ctx, color: string, x: number, y: number, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** Filled ellipse made of whole pixel rows: crisp edges, no anti-aliasing. */
function ellipse(ctx: Ctx, color: string, cx: number, cy: number, rx: number, ry: number): void {
  ctx.fillStyle = color;
  for (let y = -Math.floor(ry); y <= Math.floor(ry); y++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (half > 0) ctx.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2, 1);
  }
}

interface GrubPose {
  /** Phase of the crawl wave, radians. */
  wave: number;
  /** 0..1: egg sacs swollen, body reared. */
  swell: number;
  /** Pixels sunk into the ground. */
  sink: number;
  /** 0..1: mouth open. */
  mouth: number;
  /** 0..1: body collapsed (death). */
  deflate: number;
}

const OUT = '#0b0d14';
const FLESH = ['#a8b29a', '#7d8a72', '#4f5a48'];

/** One Brood Mother frame, facing right, resting on the bottom of its cell. */
function grub(ctx: Ctx, ox: number, oy: number, p: GrubPose): void {
  const base = oy + 90;
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox, oy, BOSS_FRAME, 91);
  ctx.clip();
  const segs = [16, 30, 44, 58, 72];
  const squash = 1 - p.deflate * 0.65;
  for (let i = 0; i < segs.length; i++) {
    const heave = Math.sin(p.wave - i * 0.9) * 2;
    const ry = (12 + i * 2 + p.swell * 3) * squash + heave * 0.5;
    const rx = 10 + i + p.swell * 2;
    const cx = ox + segs[i] + (i === 4 ? p.swell * 2 : 0);
    const cy = base - ry + p.sink - (i === 4 ? p.swell * 5 : 0);
    // Short legs under the belly.
    if (p.sink < 6 && p.deflate < 0.5) rect(ctx, OUT, cx - 4 + heave, base - 3, 3, 4);
    ellipse(ctx, OUT, cx, cy, rx + 1, ry + 1);
    ellipse(ctx, FLESH[2], cx, cy, rx, ry);
    ellipse(ctx, FLESH[1], cx - 1, cy - 2, rx - 2, ry - 3);
    ellipse(ctx, FLESH[0], cx - 3, cy - ry * 0.45, rx * 0.5, ry * 0.3);
    // Glowing egg sacs on the middle segments.
    if (i === 1 || i === 2) {
      const sac = 4 + p.swell * 3;
      ellipse(ctx, OUT, cx + 1, cy + ry * 0.35, sac + 1, sac);
      ellipse(ctx, p.swell > 0.6 ? '#f0f080' : '#d8e04a', cx + 1, cy + ry * 0.35, sac, sac - 1);
      rect(ctx, '#a0b030', cx + 1 - sac / 2, cy + ry * 0.35 + 1, sac, 1);
    }
  }
  // Hull plate fused on the back, with its hazard stripe.
  const plateY = base - 40 * squash + p.sink;
  rect(ctx, OUT, ox + 26, plateY - 1, 32, 11);
  rect(ctx, '#4f5762', ox + 27, plateY, 30, 9);
  rect(ctx, '#7d8799', ox + 27, plateY, 30, 2);
  rect(ctx, '#ff9a3c', ox + 36, plateY + 4, 12, 2);
  rect(ctx, '#2a3040', ox + 50, plateY + 2, 1, 6);
  // Torn cable trailing off the plate.
  rect(ctx, '#1a1f2a', ox + 24, plateY + 3, 4, 2);
  rect(ctx, '#ff9a3c', ox + 21, plateY + 5, 3, 1);
  if (p.deflate < 0.7) {
    // Mouth ringed with teeth at the front, small black eyes above it.
    const hx = ox + 80 + p.swell * 2;
    const hy = base - 18 * squash + p.sink - p.swell * 5;
    const open = 3 + p.mouth * 6;
    ellipse(ctx, OUT, hx, hy, 6, open + 1);
    ellipse(ctx, '#3a0f18', hx, hy, 5, open);
    ellipse(ctx, '#8a2a3a', hx - 1, hy + 1, 3, Math.max(1, open - 2));
    for (let t = -open; t <= open; t += 3) rect(ctx, '#e8eef7', hx + 3, hy + t, 2, 1);
    for (const [ex, ey] of [[-6, -9], [-2, -11], [2, -10], [-4, -13]]) rect(ctx, OUT, hx + ex, hy + ey - p.mouth * 2, 2, 2);
  }
  ctx.restore();
  if (p.sink > 0) {
    // Mound of dirt where she digs.
    const w = 30 + p.sink;
    ellipse(ctx, OUT, ox + 48, base, w / 2 + 1, 6);
    ellipse(ctx, '#3b3226', ox + 48, base, w / 2, 5);
    ellipse(ctx, '#5a4a36', ox + 46, base - 2, w / 3, 2);
  }
  if (p.deflate > 0) {
    // Goo puddle spreading under the corpse.
    const w = 20 + p.deflate * 60;
    ellipse(ctx, '#4f5a48', ox + 48, base + 1, w / 2, 3);
    ellipse(ctx, '#d8e8c8', ox + 40, base, w / 6, 1);
  }
}

/** Boss frames in sheet order: crawl, spores, burrow in/out, brood + death. */
function bossPoses(): GrubPose[] {
  const rest = { wave: 0, swell: 0, sink: 0, mouth: 0.2, deflate: 0 };
  const poses: GrubPose[] = [];
  for (let i = 0; i < 6; i++) poses.push({ ...rest, wave: (i / 6) * Math.PI * 2, mouth: 0.2 + 0.3 * Math.sin((i / 6) * Math.PI * 2) ** 2 });
  for (const s of [0.3, 0.7, 1, 1, 0.4, 0.1]) poses.push({ ...rest, swell: s, mouth: s });
  for (const k of [10, 24, 44]) poses.push({ ...rest, sink: k, mouth: 0 });
  for (const k of [36, 14, 0]) poses.push({ ...rest, sink: k, mouth: 1, swell: 0.5 });
  for (const s of [0.4, 0.8, 0.3]) poses.push({ ...rest, swell: s, wave: 1 });
  for (const d of [0.3, 0.7, 1]) poses.push({ ...rest, deflate: d, mouth: 1 - d });
  return poses;
}

function makeBossSheet(scene: Phaser.Scene): void {
  if (scene.textures.exists(BOSS_KEY)) return;
  const poses = bossPoses();
  makeLitTexture(scene, BOSS_KEY, BOSS_FRAME * poses.length, BOSS_FRAME, (ctx) =>
    poses.forEach((p, i) => grub(ctx, i * BOSS_FRAME, 0, p)),
  );
  const tex = scene.textures.get(BOSS_KEY);
  poses.forEach((_, i) => tex.add(i, 0, i * BOSS_FRAME, 0, BOSS_FRAME, BOSS_FRAME));
}

/** Simple readable icons, one accent colour each, centred in 32x32 cells. */
const ICONS: ((ctx: Ctx, x: number, y: number) => void)[] = [
  // Plasma core: cyan core in a metal cage.
  (c, x, y) => {
    rect(c, OUT, x + 9, y + 6, 14, 20);
    rect(c, '#4f5762', x + 10, y + 7, 12, 18);
    rect(c, '#39d0ff', x + 12, y + 9, 8, 14);
    rect(c, '#b8f1ff', x + 14, y + 11, 4, 10);
    for (const yy of [7, 15, 23]) rect(c, '#7d8799', x + 10, y + yy, 12, 2);
  },
  // Rapid capacitor: battery with a lightning mark.
  (c, x, y) => {
    rect(c, OUT, x + 8, y + 7, 16, 20);
    rect(c, '#b8862a', x + 9, y + 8, 14, 18);
    rect(c, '#7d8799', x + 13, y + 5, 6, 3);
    for (const [a, b] of [[17, 10], [15, 13], [13, 16], [17, 17], [15, 20], [13, 23]]) rect(c, '#ffd34d', x + a, y + b, 3, 3);
  },
  // Extended barrel: long finned tube with a teal tip.
  (c, x, y) => {
    rect(c, OUT, x + 3, y + 12, 26, 9);
    rect(c, '#4f5762', x + 4, y + 13, 24, 7);
    rect(c, '#7d8799', x + 4, y + 13, 24, 2);
    for (let i = 7; i < 22; i += 4) rect(c, '#2a3040', x + i, y + 11, 2, 11);
    rect(c, '#7cf7d4', x + 25, y + 14, 3, 5);
  },
  // Leg servos: two braces with orange joints.
  (c, x, y) => {
    for (const dx of [7, 18]) {
      rect(c, OUT, x + dx, y + 5, 8, 23);
      rect(c, '#c8ccc4', x + dx + 1, y + 6, 6, 21);
      rect(c, '#ff9a3c', x + dx + 1, y + 14, 6, 5);
      rect(c, '#7d8799', x + dx + 3, y + 6, 2, 8);
    }
  },
  // Particle accelerator: ring with a green core.
  (c, x, y) => {
    ellipse(c, OUT, x + 16, y + 16, 12, 12);
    ellipse(c, '#7d8799', x + 16, y + 16, 11, 11);
    ellipse(c, OUT, x + 16, y + 16, 7, 7);
    ellipse(c, '#4dffb0', x + 16, y + 16, 4, 4);
    rect(c, '#e8eef7', x + 15, y + 14, 2, 2);
  },
  // Captain's coin: tilted gold coin with a ship emblem.
  (c, x, y) => {
    ellipse(c, OUT, x + 16, y + 16, 10, 12);
    ellipse(c, '#b8862a', x + 16, y + 16, 9, 11);
    ellipse(c, '#ffd34d', x + 15, y + 15, 7, 9);
    rect(c, '#b8862a', x + 13, y + 11, 4, 9);
    rect(c, '#b8862a', x + 11, y + 17, 8, 2);
  },
  // Armor plate: curved off-white plate, hazard stripe and rivets.
  (c, x, y) => {
    ellipse(c, OUT, x + 16, y + 17, 12, 10);
    ellipse(c, '#c8ccc4', x + 16, y + 17, 11, 9);
    rect(c, '#e8eef7', x + 8, y + 10, 14, 2);
    rect(c, '#ff9a3c', x + 6, y + 16, 20, 3);
    for (const rx of [9, 16, 23]) rect(c, '#4f5762', x + rx, y + 22, 2, 2);
  },
  // Shield generator: disc with a pale blue dome.
  (c, x, y) => {
    ellipse(c, OUT, x + 16, y + 14, 10, 9);
    ellipse(c, '#b8f1ff', x + 16, y + 14, 9, 8);
    ellipse(c, '#e8eef7', x + 13, y + 11, 3, 3);
    rect(c, OUT, x + 4, y + 19, 24, 7);
    rect(c, '#4f5762', x + 5, y + 20, 22, 5);
    rect(c, '#39d0ff', x + 8, y + 22, 16, 1);
  },
  // Reflecting prism: clear triangle with a violet edge.
  (c, x, y) => {
    for (let r = 0; r < 20; r++) {
      const half = Math.round(r * 0.6);
      rect(c, OUT, x + 15 - half, y + 6 + r, half * 2 + 2, 1);
      if (r > 1 && r < 19) rect(c, r % 5 === 0 ? '#a070ff' : '#e8eef7', x + 16 - half, y + 6 + r, half * 2, 1);
    }
    rect(c, '#a070ff', x + 22, y + 20, 5, 1);
    rect(c, '#39d0ff', x + 23, y + 22, 5, 1);
  },
  // Alien crystal shard: jagged green needle.
  (c, x, y) => {
    for (let r = 0; r < 24; r++) {
      const w = Math.max(1, Math.round(6 - Math.abs(r - 14) * 0.45));
      const cx = x + 16 + Math.round((r - 12) * 0.3);
      rect(c, OUT, cx - w - 1, y + 4 + r, w * 2 + 2, 1);
      rect(c, r < 12 ? '#4dffb0' : '#1f8a5a', cx - w, y + 4 + r, w * 2, 1);
    }
  },
  // Alien pedestal: dark stone, flat top, green runes.
  (c, x, y) => {
    rect(c, OUT, x + 3, y + 11, 26, 21);
    rect(c, '#4a5568', x + 4, y + 12, 24, 4);
    rect(c, '#2a3040', x + 6, y + 16, 20, 15);
    for (const [a, b] of [[9, 20], [15, 23], [21, 19], [12, 27], [19, 27]]) rect(c, '#4dffb0', x + a, y + b, 2, 2);
  },
  // Energy cell: cyan battery with a white plus.
  (c, x, y) => {
    rect(c, OUT, x + 10, y + 7, 12, 19);
    rect(c, '#39d0ff', x + 11, y + 8, 10, 17);
    rect(c, '#7d8799', x + 13, y + 5, 6, 3);
    rect(c, '#ffffff', x + 15, y + 11, 2, 10);
    rect(c, '#ffffff', x + 11, y + 15, 10, 2);
  },
];

function makeItemSheet(scene: Phaser.Scene): void {
  if (scene.textures.exists(ITEMS_KEY)) return;
  makeLitTexture(scene, ITEMS_KEY, ITEM_CELL * 4, ITEM_CELL * 3, (ctx) =>
    ICONS.forEach((draw, i) => draw(ctx, (i % 4) * ITEM_CELL, Math.floor(i / 4) * ITEM_CELL)),
  );
  const tex = scene.textures.get(ITEMS_KEY);
  ICONS.forEach((_, i) => tex.add(i, 0, (i % 4) * ITEM_CELL, Math.floor(i / 4) * ITEM_CELL, ITEM_CELL, ITEM_CELL));
}

/** Registers the stand-in sheets unless the real ones were loaded. */
export function makeBossItemArt(scene: Phaser.Scene): void {
  makeBossSheet(scene);
  makeItemSheet(scene);
}
