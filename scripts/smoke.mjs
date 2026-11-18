// Smoke test: serves dist/ with `vite preview`, opens the game in a headless
// browser on a desktop screen and on a phone held both ways, moves and
// shoots, and fails on any page error. Usage: npm run build && npm run smoke
import { preview } from 'vite';
import { chromium } from 'playwright';

const server = await preview({ preview: { port: 4317, strictPort: true }, logLevel: 'error' });
const base = 'http://localhost:4317/?seed=SMOKETST';
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const errors = [];
const results = {};

async function open(name, contextOptions, quality) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`[${name}] ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[${name}] ${m.text()}`);
  });
  await page.goto(`${base}&quality=${quality}`);
  await page.waitForFunction(() => window.game?.isRunning && window.game.scene.getScene('play')?.ready, null, {
    timeout: 15000,
  });
  await page.waitForTimeout(600);
  return { context, page };
}

const state = (page) =>
  page.evaluate(() => {
    const s = window.game.scene.getScene('play');
    const cam = s.cameras.main;
    return {
      renderer: window.game.config.renderType === 2 ? 'webgl' : 'canvas',
      scenes: window.game.scene.getScenes(true).map((sc) => sc.sys.settings.key),
      seed: s.seed,
      fps: Math.round(window.game.loop.actualFps),
      quality: s.quality,
      x: s.player.x,
      vx: Math.round(s.player.body.velocity.x),
      shotsFired: s.shotsFired,
      anim: s.player.anims.currentAnim?.key ?? null,
      water: !!s.water.shader,
      canvas: [window.game.canvas.width, window.game.canvas.height],
      zoom: Number(cam.zoom.toFixed(2)),
      touchUsed: window.game.scene.getScene('hud')?.touch?.used ?? false,
    };
  });

try {
  // Desktop with every effect on: render check only. Headless Chromium draws
  // on the CPU, so high quality runs at a few fps and movement means little.
  {
    const { context, page } = await open('desktop-high', { viewport: { width: 1280, height: 720 } }, 'high');
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'smoke.png' });
    const s = await state(page);
    if (!s.water) errors.push('[desktop-high] water shader missing');
    if (s.quality !== 'high') errors.push('[desktop-high] quality override ignored');
    await context.close();
  }

  // Desktop, keyboard.
  {
    const { context, page } = await open('desktop', { viewport: { width: 1280, height: 720 } }, 'low');
    const before = await state(page);
    await page.locator('canvas').click();
    await page.keyboard.down('KeyD');
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(800);
    const after = await state(page); // sampled while the keys are still held
    await page.keyboard.up('ArrowUp');
    await page.keyboard.up('KeyD');
    results.desktop = { ...after, moved: after.x - before.x };
    // Walk through a door of the start room (always open: it has no enemies).
    const door = await page.evaluate(() => {
      const s = window.game.scene.getScene('play');
      const link = s.links[0];
      s.leave(link);
      return link.side;
    });
    await page.waitForFunction(() => window.game.scene.getScene('play')?.run?.room > 0, null, { timeout: 10000 });
    await page.waitForTimeout(500);
    const moved = await page.evaluate(() => {
      const s = window.game.scene.getScene('play');
      return { room: s.run.room, from: s.run.from, visited: s.run.visited.length, seed: s.seed };
    });
    await page.screenshot({ path: 'smoke-next-room.png' });
    if (moved.seed !== 'SMOKETST' || moved.visited !== 2 || moved.from !== 0) errors.push(`[desktop] room change failed via ${door}: ${JSON.stringify(moved)}`);

    // Jump to a room of the given kind, entering from below.
    const goTo = async (kind) => {
      await page.evaluate((k) => {
        const s = window.game.scene.getScene('play');
        const room = s.floor.rooms.find((r) => r.kind === k);
        s.scene.restart({ quality: s.quality, shake: 0, run: { ...s.run, room: room.id, from: undefined } });
      }, kind);
      await page.waitForFunction((k) => window.game.scene.getScene('play')?.here?.kind === k && window.game.scene.getScene('play').ready, kind, { timeout: 10000 });
      await page.waitForTimeout(800);
    };

    // Treasure room: walk onto the pedestal and take the item.
    await goTo('treasure');
    await page.evaluate(() => {
      const s = window.game.scene.getScene('play');
      s.player.setPosition(s.player.x, 4 * 32 + 64 + 6 - 46 + 24);
    });
    await page.waitForTimeout(500);
    const items = await page.evaluate(() => window.game.scene.getScene('play').run.items);
    await page.screenshot({ path: 'smoke-treasure.png' });
    if (items.length !== 1) errors.push(`[desktop] treasure item not taken: ${JSON.stringify(items)}`);

    // A pickup that cannot be taken (full suit) is shoved by the boots and slides away.
    const startX = await page.evaluate(() => {
      const s = window.game.scene.getScene('play');
      const f = s.playerFeet();
      s.addPickup({ key: 'items', frame: 11 }, f.x + 6, f.y, 14, 0x39d0ff, 16, 0, () => false);
      return f.x + 6;
    });
    await page.waitForTimeout(700);
    const slid = await page.evaluate(() => {
      const s = window.game.scene.getScene('play');
      const p = s.pickups[s.pickups.length - 1];
      return { x: p.x, vx: p.vx, left: s.pickups.length };
    });
    // Headless Chromium runs the game slowly: check the shove, not the distance.
    if (!(slid.x > startX && slid.vx > 0)) errors.push(`[desktop] refused pickup did not slide: ${JSON.stringify({ startX, ...slid })}`);

    // Boss room: she wakes and moves, then dies and the doors open.
    await goTo('boss');
    await page.evaluate(() => (window.game.scene.getScene('play').health.invulnerableUntil = 1e12));
    await page.waitForTimeout(2500);
    const boss = await page.evaluate(() => {
      // Bosses are dealt out per run: either one may guard this floor.
      const m = window.game.scene.getScene('play').enemies;
      const b = m.boss ?? m.queen;
      return b && { kind: m.bossKind, phase: b.state.phase, hp: b.hp, anim: b.sprite.anims.currentAnim?.key };
    });
    await page.screenshot({ path: 'smoke-boss.png' });
    if (!boss || boss.phase === 'wake') errors.push(`[desktop] boss missing or asleep: ${JSON.stringify(boss)}`);
    const won = await page.evaluate(() => {
      const s = window.game.scene.getScene('play');
      if (s.enemies.boss) s.enemies.killBoss(s.enemies.boss);
      else s.enemies.killQueen(s.enemies.queen);
      return { cleared: s.run.cleared.includes(s.here.id), alive: s.enemies.alive };
    });
    if (!won.cleared || won.alive !== 0) errors.push(`[desktop] boss death did not clear the room: ${JSON.stringify(won)}`);
    await context.close();
  }

  // Phones: drag the left stick right and the right stick up with two fingers.
  const phones = {
    'phone-landscape': { width: 915, height: 412 },
    'phone-portrait': { width: 412, height: 915 },
  };
  for (const [name, viewport] of Object.entries(phones)) {
    const { context, page } = await open(name, { viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 1 }, 'low');
    const before = await state(page);
    const cdp = await context.newCDPSession(page);
    const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
    const left = { id: 1, x: viewport.width * 0.2, y: viewport.height * 0.75 };
    const right = { id: 2, x: viewport.width * 0.8, y: viewport.height * 0.75 };
    await touch('touchStart', [left]);
    await touch('touchStart', [left, right]);
    for (let i = 1; i <= 10; i++) {
      await touch('touchMove', [
        { ...left, x: left.x + i * 6 },
        { ...right, y: right.y - i * 6 },
      ]);
      await page.waitForTimeout(80);
    }
    const after = await state(page);
    await page.screenshot({ path: `smoke-${name}.png` });
    await touch('touchEnd', []);
    results[name] = { ...after, moved: after.x - before.x };
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}

const failures = [...errors];
for (const [name, r] of Object.entries(results)) {
  if (r.renderer !== 'webgl') failures.push(`${name}: not WebGL`);
  if (r.seed !== 'SMOKETST') failures.push(`${name}: seed from URL not applied (${r.seed})`);
  // Velocity, not distance: headless Chromium renders on the CPU at a few fps
  // and Phaser slows the simulation down rather than skipping frames.
  if (r.vx <= 0 || r.moved <= 0) failures.push(`${name}: player not moving right (vx ${r.vx}, moved ${r.moved}px)`);
  if (r.shotsFired < 1) failures.push(`${name}: no shots fired`);
  // Moving right while shooting up: the astronaut faces up and plays the shoot animation.
  if (r.anim !== 'player-shoot-up') failures.push(`${name}: expected animation player-shoot-up, got ${r.anim}`);
  if (name !== 'desktop' && !r.touchUsed) failures.push(`${name}: touch never registered`);
}
console.log(JSON.stringify({ results, errors }, null, 2));
if (failures.length) {
  console.error('SMOKE FAILED:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('SMOKE OK');
