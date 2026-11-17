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
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}

const failures = [...errors];
if (result.seed !== 'SMOKETST') failures.push(`seed from URL not applied: ${result.seed}`);
if (result.moved < 50) failures.push(`player did not move right (moved ${result.moved}px)`);
if (result.shotsFired < 1) failures.push('no shots fired while holding ArrowUp');
console.log(JSON.stringify({ ...result, errors }, null, 2));
if (failures.length) {
  console.error('SMOKE FAILED:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('SMOKE OK');
