#!/usr/bin/env node
/* Smoke-test Pip's Playroom in headless Chromium with touch emulation.
 *
 *   node tools/smoke.js --game balloons                 # all 4 viewports, screenshots in shots/
 *   node tools/smoke.js --game balloons --vp ipad --taps 60 --seconds 10
 *   node tools/smoke.js --home                          # screenshots of start + home screens
 *   node tools/smoke.js --all                           # every registered game, ipad + iphone
 *   node tools/smoke.js --file /tmp/my-build.html --game paint
 *
 * Exits non-zero if there were page errors / console errors or the game bounced back home.
 * Screenshots: shots/<game>-<viewport>-<n>.png  (view them with the Read tool)
 */
const path = require('path');
const fs = require('fs');
function loadPlaywright() {
  const tries = [process.env.PW, 'playwright', '/opt/npm-tools/node_modules/playwright'];
  try { tries.push(require('path').join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright')); } catch (e) {}
  for (const t of tries) { if (!t) continue; try { return require(t); } catch (e) {} }
  console.error('Playwright not found. Install it: npm i -g playwright && npx playwright install chromium');
  process.exit(1);
}
const { chromium } = loadPlaywright();

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d; };
const ROOT = path.resolve(__dirname, '..');
const FILE = path.resolve(arg('file', path.join(ROOT, 'docs', 'index.html')));
const OUT = path.resolve(arg('out', path.join(ROOT, 'shots')));
const TAPS = parseInt(arg('taps', 30), 10);
const SECONDS = parseFloat(arg('seconds', 6));
const SHOT_SCALE = parseFloat(arg('scale', 1));

const VIEWPORTS = {
  ipad: { width: 1180, height: 820, isMobile: true },          // iPad Air landscape
  'ipad-portrait': { width: 820, height: 1180, isMobile: true },
  iphone: { width: 393, height: 852, isMobile: true },         // iPhone 15 portrait
  'iphone-landscape': { width: 852, height: 393, isMobile: true },
};

fs.mkdirSync(OUT, { recursive: true });

async function runGame(browser, game, vpName) {
  const vp = VIEWPORTS[vpName];
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: SHOT_SCALE, hasTouch: true, isMobile: vp.isMobile,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();
  const errors = [];
  const logs = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + (e.stack || e.message)));
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console.error: ' + m.text());
    else if (t === 'warning' || t === 'warn') logs.push('warn: ' + m.text());
  });
  await page.goto('file://' + FILE + '?autostart=1&game=' + encodeURIComponent(game));
  await page.waitForTimeout(1500);
  const opened = await page.evaluate((g) => !!(window.PP && PP.app.current && PP.app.current.game.id === g), game);
  if (!opened) errors.push('game did not open: ' + game + ' (registered: ' + (await page.evaluate(() => (window.PP ? PP.games.map((g) => g.id).join(',') : 'no PP'))) + ')');
  const shots = [];
  const shot = async (n) => { const p = path.join(OUT, `${game}-${vpName}-${n}.png`); await page.screenshot({ path: p }); shots.push(p); };
  await shot(1);

  // Random-ish taps: mix of interactive-looking elements and random points
  const t0 = Date.now();
  for (let i = 0; i < TAPS; i++) {
    const pt = await page.evaluate(() => {
      const stage = document.querySelector('.pp-stage');
      if (!stage) return null;
      const cands = [...stage.querySelectorAll('button, .pp-card, [data-tap], .tappable, svg [class], div[class]')]
        .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 20 && r.height > 20 && r.width < innerWidth * 0.9 && r.top > 80 && r.bottom < innerHeight && r.left > 0 && r.right < innerWidth; })
        .filter((e) => !e.closest('.pp-home-btn'));
      if (cands.length && Math.random() < 0.75) {
        const e = cands[Math.floor(Math.random() * cands.length)];
        const r = e.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
      return { x: 100 + Math.random() * (innerWidth - 120), y: 100 + Math.random() * (innerHeight - 120) };
    });
    if (!pt) break;
    await page.touchscreen.tap(pt.x, pt.y);
    await page.waitForTimeout(Math.max(60, (SECONDS * 1000) / TAPS));
    if (i === Math.floor(TAPS / 2)) await shot(2);
  }
  // let celebrations / timers play out a little
  await page.waitForTimeout(Math.max(0, SECONDS * 1000 - (Date.now() - t0)) + 800);
  await shot(3);
  const stillIn = await page.evaluate((g) => !!(PP.app.current && PP.app.current.game.id === g), game);
  if (opened && !stillIn) errors.push('game exited on its own (crash or bounced home)');
  const stickerOverlay = await page.evaluate(() => !!document.querySelector('.pp-overlay'));

  // exit via home button, check cleanup
  await page.evaluate(() => PP.app.goHome());
  await page.waitForTimeout(400);
  const leaks = await page.evaluate(() => ({ stageKids: document.querySelector('.pp-stage').children.length, onHome: !document.getElementById('home').classList.contains('hidden') }));
  if (leaks.stageKids) errors.push('stage not empty after exit');
  // re-open once to catch state bugs
  await page.evaluate((g) => PP.app.openGame(g), game);
  await page.waitForTimeout(900);
  await page.touchscreen.tap(vp.width / 2, vp.height / 2);
  await page.waitForTimeout(500);
  await page.evaluate(() => PP.app.goHome());
  await page.waitForTimeout(200);
  await context.close();
  return { game, viewport: vpName, ok: errors.length === 0, errors, warnings: logs.slice(0, 10), shots, stickerOverlaySeen: stickerOverlay };
}

async function homeShots(browser) {
  const res = [];
  for (const vpName of Object.keys(VIEWPORTS)) {
    const vp = VIEWPORTS[vpName];
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: SHOT_SCALE, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console.error: ' + m.text()); });
    await page.goto('file://' + FILE);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, `start-${vpName}.png`) });
    await page.touchscreen.tap(vp.width / 2, vp.height / 2);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(OUT, `home-${vpName}.png`) });
    res.push({ viewport: vpName, errors, games: await page.evaluate(() => PP.games.map((g) => g.id)) });
    await context.close();
  }
  return res;
}

(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const results = [];
  try {
    if (arg('home')) {
      console.log(JSON.stringify(await homeShots(browser), null, 2));
    } else {
      let games;
      if (arg('all')) {
        const ctx = await browser.newContext();
        const p = await ctx.newPage();
        await p.goto('file://' + FILE + '?autostart=1');
        await p.waitForTimeout(500);
        games = await p.evaluate(() => PP.games.map((g) => g.id));
        await ctx.close();
      } else {
        games = String(arg('game', '')).split(',').filter(Boolean);
      }
      const vps = arg('vp') ? String(arg('vp')).split(',') : arg('all') ? ['ipad', 'iphone'] : Object.keys(VIEWPORTS);
      for (const g of games) for (const v of vps) {
        const r = await runGame(browser, g, v);
        results.push(r);
        console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${g} @ ${v}${r.errors.length ? '\n   ' + r.errors.slice(0, 6).join('\n   ') : ''}`);
      }
      fs.writeFileSync(path.join(OUT, 'smoke-results.json'), JSON.stringify(results, null, 2));
      console.log('screenshots in', OUT);
    }
  } finally {
    await browser.close();
  }
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
})();
