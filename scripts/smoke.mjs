// Smoke test: builds nothing, serves dist/ with `vite preview`, opens it in a
// headless browser, moves and shoots, and fails on any page error.
// Usage: npm run build && npm run smoke
import { preview } from 'vite';
import { chromium } from 'playwright';

const server = await preview({ preview: { port: 4317, strictPort: true }, logLevel: 'error' });
const url = 'http://localhost:4317/?seed=SMOKETST';
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const errors = [];
let result;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(url);
  await page.waitForFunction(() => window.game?.isRunning && window.game.scene.getScene('play')?.player, null, {
    timeout: 15000,
  });
  await page.waitForTimeout(500);
  const before = await page.evaluate(() => {
    const s = window.game.scene.getScene('play');
    return { x: s.player.x, y: s.player.y };
  });
  await page.locator('canvas').click();
  await page.keyboard.down('KeyD');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(800);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('KeyD');
  await page.waitForTimeout(100);
  result = await page.evaluate(() => {
    const s = window.game.scene.getScene('play');
    return {
      renderer: window.game.config.renderType === 2 ? 'webgl' : 'canvas',
      scenes: window.game.scene.getScenes(true).map((sc) => sc.sys.settings.key),
      seed: s.seed,
      x: s.player.x,
      y: s.player.y,
      shotsFired: s.shotsFired,
    };
  });
  result.moved = result.x - before.x;
  await page.screenshot({ path: 'smoke.png' });

  // Phone in landscape: drag the left virtual stick right and the right one up.
  const phone = await browser.newContext({
    viewport: { width: 915, height: 412 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
  });
  const mobile = await phone.newPage();
  mobile.on('pageerror', (e) => errors.push(`[mobile] ${e.message}`));
  await mobile.goto(url);
  await mobile.waitForFunction(() => window.game?.isRunning && window.game.scene.getScene('play')?.player, null, {
    timeout: 15000,
  });
  await mobile.waitForTimeout(500);
  const mBefore = await mobile.evaluate(() => window.game.scene.getScene('play').player.x);
  const cdp = await phone.newCDPSession(mobile);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  const left = { id: 1, x: 200, y: 260 };
  const right = { id: 2, x: 720, y: 260 };
  await touch('touchStart', [left]);
  await touch('touchStart', [left, right]);
  for (let i = 1; i <= 10; i++) {
    await touch('touchMove', [
      { ...left, x: left.x + i * 10 },
      { ...right, y: right.y - i * 10 },
    ]);
    await mobile.waitForTimeout(80);
  }
  const during = await mobile.evaluate(() => {
    const s = window.game.scene.getScene('play');
    return { touchUsed: s.touch.used, x: s.player.x, shotsFired: s.shotsFired };
  });
  await mobile.screenshot({ path: 'smoke-mobile.png' });
  await touch('touchEnd', []);
  result.mobile = { ...during, moved: during.x - mBefore };
  await phone.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}

const failures = [...errors];
if (result.seed !== 'SMOKETST') failures.push(`seed from URL not applied: ${result.seed}`);
if (result.moved < 50) failures.push(`player did not move right (moved ${result.moved}px)`);
if (result.shotsFired < 1) failures.push('no shots fired while holding ArrowUp');
if (!result.mobile.touchUsed) failures.push('touch controls never saw a touch');
if (result.mobile.moved < 50) failures.push(`touch stick did not move the player (moved ${result.mobile.moved}px)`);
if (result.mobile.shotsFired < 1) failures.push('touch stick did not shoot');
console.log(JSON.stringify({ ...result, errors }, null, 2));
if (failures.length) {
  console.error('SMOKE FAILED:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('SMOKE OK');
