#!/usr/bin/env node
/* Long-session soak test: random toddler taps for N seconds per game; tracks DOM growth, speech log sanity,
 * successes, errors. usage: node tools/soak.js [--seconds 45] [--game id,id] [--vp ipad|iphone] */
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
const arg = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..');
const FILE = path.resolve(arg('file', path.join(ROOT, 'docs', 'index.html')));
const SECONDS = parseFloat(arg('seconds', 45));
const VPS = { ipad: { width: 1180, height: 820 }, iphone: { width: 393, height: 852 } };
const vp = VPS[arg('vp', 'ipad')];

(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx0 = await browser.newContext();
  const p0 = await ctx0.newPage();
  await p0.goto('file://' + FILE + '?autostart=1');
  await p0.waitForTimeout(400);
  const all = await p0.evaluate(() => PP.games.map((g) => g.id));
  await ctx0.close();
  const games = arg('game') ? arg('game').split(',') : all;
  const report = [];
  for (const g of games) {
    const context = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await page.addInitScript(() => {
      window.__said = [];
      window.addEventListener('DOMContentLoaded', () => {
        const orig = PP.speech.say;
        PP.speech.say = function (t, o) { window.__said.push([Math.round(performance.now()), String(t), (o && o.mode) || 'interrupt']); return orig.call(this, t, o); };
      });
    });
    await page.goto('file://' + FILE + '?autostart=1&game=' + g);
    await page.waitForTimeout(1200);
    const samples = [];
    const t0 = Date.now();
    let taps = 0;
    while (Date.now() - t0 < SECONDS * 1000) {
      // bursty toddler: sometimes mash, sometimes wait
      const burst = Math.random() < 0.3 ? 5 : 1;
      for (let b = 0; b < burst; b++) {
        const pt = await page.evaluate(() => {
          const stage = document.querySelector('.pp-stage');
          if (!stage) return null;
          const c = [...stage.querySelectorAll('*')].filter((e) => {
            const r = e.getBoundingClientRect();
            return r.width > 30 && r.height > 30 && r.width < innerWidth * 0.8 && r.top > 90 && r.bottom < innerHeight - 4 && r.left > 4 && r.right < innerWidth - 4;
          });
          if (c.length && Math.random() < 0.8) { const r = c[Math.floor(Math.random() * c.length)].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
          return { x: 100 + Math.random() * (innerWidth - 120), y: 100 + Math.random() * (innerHeight - 120) };
        });
        if (!pt) break;
        await page.touchscreen.tap(pt.x, pt.y);
        taps++;
        await page.waitForTimeout(40);
      }
      // dismiss sticker overlays like a parent would (or wait them out)
      await page.waitForTimeout(150 + Math.random() * 900);
      if ((Date.now() - t0) % 5000 < 1200) {
        samples.push(await page.evaluate(() => ({ nodes: document.querySelector('.pp-stage').getElementsByTagName('*').length, fx: document.getElementById('pp-fx') ? document.getElementById('pp-fx').children.length : 0, styles: document.querySelectorAll('style').length, heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : 0 })));
      }
    }
    const res = await page.evaluate((id) => ({
      inGame: !!(PP.app.current && PP.app.current.game.id === id),
      prog: PP.store.progress[id] || null,
      stickers: PP.store.stickers.length,
      said: window.__said,
    }), g);
    const said = res.said;
    const bad = said.filter((s) => /undefined|NaN|\[object|null/.test(s[1]));
    let rapid = 0;
    for (let i = 1; i < said.length; i++) if (said[i][0] - said[i - 1][0] < 250 && said[i][2] !== 'skip') rapid++;
    const r = { game: g, taps, errors: errors.slice(0, 5), inGame: res.inGame, successes: res.prog && res.prog.correct, misses: res.prog && res.prog.misses, level: res.prog && res.prog.level, stickers: res.stickers,
      utterances: said.length, rapidInterrupts: rapid, badText: bad.slice(0, 5).map((s) => s[1]), nodes: samples.map((s) => s.nodes).join(','), heapMB: samples.map((s) => s.heap).join(','),
      sampleSpeech: [...new Set(said.map((s) => s[1]))].slice(0, 25) };
    report.push(r);
    console.log(`${r.errors.length || !r.inGame || r.badText.length ? 'WARN' : 'OK  '} ${g}: taps=${taps} succ=${r.successes} miss=${r.misses} lvl=${r.level} stickers=${r.stickers} said=${r.utterances} rapid=${rapid} nodes=[${r.nodes}] heap=[${r.heapMB}]${r.errors.length ? ' ERR: ' + r.errors.join(' | ') : ''}${r.badText.length ? ' BAD: ' + r.badText.join(' | ') : ''}`);
    await context.close();
  }
  fs.writeFileSync(path.join(ROOT, 'shots', 'soak.json'), JSON.stringify(report, null, 2));
  await browser.close();
})();
