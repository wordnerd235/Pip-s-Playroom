#!/usr/bin/env node
/* Harvest every sentence Pip can say → voice/lines.json (the script for the voice actor, i.e. Kokoro).
 *
 *   node tools/harvest.js [--seconds 50] [--parallel 8] [--games a,b] [--levels 1,2,3,4,5] [--merge]
 *     --merge keeps the sentences already in voice/lines.json and adds the new ones
 *
 * How it works
 *  1. Auto-plays every game at every level in headless Chromium with toddler-style random tapping,
 *     recording each utterance (speech is stubbed so play runs fast).
 *  2. Adds the app-level lines (start screen, stickers, sleep screen, settings test, tile names…).
 *  3. Splits utterances into sentences (same rules the app uses at runtime: PP.voice.split/key).
 *  4. Generalizes: if a sentence slot was seen with several colors / numbers / shapes / words, it is
 *     expanded to every value of that kind (words: only the categories actually seen in that slot),
 *     so "Find the crab!" also yields "Find the zebra!" even if the random run never hit it.
 *  Anything still missing at runtime falls back to the device voice and is logged in settings
 *  ("Copy missing lines") — add those to voice/extra-lines.txt and re-run make_clips.py.
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
const arg = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..');
const FILE = path.resolve(arg('file', path.join(ROOT, 'docs', 'index.html')));
const SECONDS = parseFloat(arg('seconds', 50));
const PAR = parseInt(arg('parallel', 8), 10);
const NAME = (arg('name', '') || '').trim();
const LEVELS = String(arg('levels', '1,2,3,4,5')).split(',').map(Number);
const OUT = path.join(ROOT, 'voice');
fs.mkdirSync(OUT, { recursive: true });

const STUB = (level, game, name) => `
  try {
    const progress = {}; if (${JSON.stringify(game)}) progress[${JSON.stringify(game)}] = { level: ${level}, streak: 0, rounds: 0, correct: 0, misses: 0, plays: 0, missRun: 0 };
    localStorage.setItem('pips-playroom.v1', JSON.stringify({ settings: { childName: ${JSON.stringify(name)} }, progress }));
  } catch (e) {}
  window.__said = [];
  document.addEventListener('DOMContentLoaded', () => {
    PP.speech.say = function (t) { window.__said.push(String(t)); return new Promise((r) => setTimeout(() => r(true), 40 + String(t).length * 6)); };
    PP.speech.speaking = () => false;
    PP.speech.cancel = () => {};
  }, { capture: true });
`;

async function playGame(browser, game, level) {
  const context = await browser.newContext({ viewport: Math.random() < 0.5 ? { width: 1180, height: 820 } : { width: 393, height: 852 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.addInitScript(STUB(level, game, ''));
  await page.goto('file://' + FILE + '?autostart=1&game=' + game);
  await page.waitForTimeout(800);
  const t0 = Date.now();
  while (Date.now() - t0 < SECONDS * 1000) {
    const burst = Math.random() < 0.25 ? 4 : 1;
    for (let b = 0; b < burst; b++) {
      const pt = await page.evaluate(() => {
        const stage = document.querySelector('.pp-stage');
        if (!stage) return null;
        const c = [...stage.querySelectorAll('*')].filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 24 && r.height > 24 && r.width < innerWidth * 0.85 && r.top > 90 && r.bottom < innerHeight - 2 && r.left > 2 && r.right < innerWidth - 2;
        });
        if (c.length && Math.random() < 0.85) { const r = c[Math.floor(Math.random() * c.length)].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
        return { x: 100 + Math.random() * (innerWidth - 120), y: 100 + Math.random() * (innerHeight - 120) };
      }).catch(() => null);
      if (!pt) break;
      await page.touchscreen.tap(pt.x, pt.y).catch(() => {});
      await page.waitForTimeout(30);
    }
    // sometimes wait long enough for idle re-prompts
    await page.waitForTimeout(Math.random() < 0.08 ? 8000 : 120 + Math.random() * 700);
  }
  const said = await page.evaluate(() => window.__said).catch(() => []);
  await context.close();
  return said;
}

async function appLines(browser) {
  // start screen, home Pip, sticker book, sleep screen, settings test
  const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true });
  const page = await context.newPage();
  await page.addInitScript(STUB(1, '', ''));
  await page.goto('file://' + FILE);
  await page.waitForTimeout(600);
  await page.touchscreen.tap(590, 410);
  await page.waitForTimeout(1200);
  for (let i = 0; i < 25; i++) { await page.evaluate(() => document.querySelector('.home-pip').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await page.waitForTimeout(30); }
  await page.evaluate(() => { PP.app.openStickerBook(); PP.app.closeOverlay(true); });
  await page.evaluate(() => { PP.app.openSettings(); [...document.querySelectorAll('.set-btn')].find((b) => /Test/.test(b.textContent)).click(); PP.app.closeOverlay(true); });
  await page.evaluate(() => PP.app.sleep());
  await page.waitForTimeout(300);
  const said = await page.evaluate(() => window.__said);
  // generated: tile titles, every sticker, sticker counts, error line
  const extra = await page.evaluate(() => {
    const L = [];
    PP.games.forEach((g) => { L.push(g.title + '!'); if (g.voiceLines) { try { L.push(...g.voiceLines()); } catch (e) {} } });
    PP.data.STICKERS.forEach((s) => { L.push(`You got a sticker! ${PP.util.cap(PP.data.a(s.word))}!`); L.push(PP.util.cap(PP.data.a(s.word)) + '!'); });
    for (let n = 1; n <= PP.data.STICKERS.length; n++) L.push(`You have ${n} sticker${n === 1 ? '' : 's'}!`);
    L.push('Play games to win stickers!', 'Yay! More playing!', 'Oops! Let’s play something else.', 'That button is for grown-ups!');
    PP.data.PRAISE.forEach((p) => L.push(p));
    return L;
  });
  await context.close();
  return said.concat(extra);
}

function nameLines(name) {
  if (!name) return [];
  return [
    `Hi ${name}! I'm Pip! Let's play!`,
    `Hi ${name}! I'm Pip. Let's find the red balloon!`,
    `Yawn! Time for a break, ${name}! Bye-bye! See you soon!`,
  ];
}

(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const boot = await browser.newContext();
  const bp = await boot.newPage();
  await bp.goto('file://' + FILE + '?autostart=1');
  await bp.waitForTimeout(400);
  const allGames = await bp.evaluate(() => PP.games.map((g) => g.id));
  const games = arg('games') ? arg('games').split(',') : allGames;
  const jobs = [];
  games.forEach((g) => LEVELS.forEach((l) => jobs.push([g, l])));
  const utterances = [];
  let done = 0;
  const t0 = Date.now();
  async function worker() {
    while (jobs.length) {
      const [g, l] = jobs.shift();
      const said = await playGame(browser, g, l).catch((e) => { console.error(g, l, e.message); return []; });
      said.forEach((s) => utterances.push(s));
      done++;
      if (done % 5 === 0 || done === games.length * LEVELS.length) console.log(`  played ${done}/${games.length * LEVELS.length} (${Math.round((Date.now() - t0) / 1000)}s) — ${utterances.length} utterances`);
    }
  }
  await Promise.all(Array.from({ length: PAR }, worker));
  console.log('');
  // what games actually said is the evidence for generalizing; fixed lines are added as-is
  if (args.includes('--merge') && fs.existsSync(path.join(OUT, 'played.json'))) {
    JSON.parse(fs.readFileSync(path.join(OUT, 'played.json'), 'utf8')).forEach((s) => utterances.push(s));
  }
  const played = [...new Set(utterances)].sort();
  fs.writeFileSync(path.join(OUT, 'played.json'), JSON.stringify(played, null, 0));
  const fixed = [];
  (await appLines(browser)).forEach((s) => fixed.push(s));
  nameLines(NAME).forEach((s) => fixed.push(s));
  let extraFile = path.join(OUT, 'extra-lines.txt');
  if (fs.existsSync(extraFile)) fs.readFileSync(extraFile, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#')).forEach((s) => fixed.push(s));

  // ---- split + generalize inside the app so the rules match runtime exactly ----
  const result = await bp.evaluate(({ played, fixed, name }) => {
    const V = PP.voice, D = PP.data, U = PP.util;
    const sentences = new Map(); // key -> text
    const add = (s) => { const k = V.key(s); if (k && !sentences.has(k)) sentences.set(k, V.clean(s)); };
    const playedKeys = new Set();
    played.forEach((u) => V.split(u).forEach((s) => { add(s); playedKeys.add(V.key(s)); }));
    fixed.forEach((u) => V.split(u).forEach(add));
    if (name) D.PRAISE.forEach((p) => add(p.replace(/[!.]$/, '') + ', ' + name + '!'));

    // vocabulary classes
    const nouns = new Map(); // word -> {cats:Set, sound}
    D.WORDS.forEach((w) => { const n = nouns.get(w.word) || { cats: new Set(), sound: w.sound }; n.cats.add(w.cat); nouns.set(w.word, n); });
    D.STICKERS.forEach((w) => { const n = nouns.get(w.word) || { cats: new Set() }; n.cats.add('sticker'); nouns.set(w.word, n); });
    const CLASSES = {
      color: D.COLORS.map((c) => c.name),
      number: D.NUMBERS.slice(0, 11),
      shape: D.SHAPES.map((s) => s.name),
      noun: [...nouns.keys()],
    };
    const MIN_SEEN = { color: 2, number: 2, shape: 2, noun: 3 };
    const PRIORITY = ['color', 'shape', 'number', 'noun'];
    const tokenClass = new Map();
    for (const c in CLASSES) CLASSES[c].forEach((v) => { const k = v.toLowerCase(); if (!tokenClass.has(k)) tokenClass.set(k, new Set()); tokenClass.get(k).add(c); });
    const tokens = [...tokenClass.keys()].sort((a, b) => b.length - a.length);
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tokRe = new RegExp('(^|[^a-z])(' + tokens.map(esc).join('|') + ')(?![a-z])', 'gi');

    function findTokens(text) {
      const found = [];
      let m;
      tokRe.lastIndex = 0;
      while ((m = tokRe.exec(text))) {
        found.push({ value: m[2].toLowerCase(), raw: m[2], index: m.index + m[1].length });
        tokRe.lastIndex = m.index + m[0].length;
      }
      return found;
    }
    const caseLike = (raw, v) => (raw[0] === raw[0].toUpperCase() && raw[0] !== raw[0].toLowerCase() ? U.cap(v) : v);
    // template for slot class c, value v: replace "a/an v" and "v" (and its sound for nouns)
    function templ(text, c, v) {
      let t = text;
      const r = esc(v);
      t = t.replace(new RegExp('(^|[^a-z])(an?|An?) (' + r + ')(?![a-z])', 'g'), (m0, pre, art) => pre + (art[0] === 'A' ? '{A}' : '{a}'));
      t = t.replace(new RegExp('(^|[^a-z])(' + r + ')(?![a-z])', 'gi'), (m0, pre, raw) => pre + (raw[0] === raw[0].toUpperCase() && raw[0] !== raw[0].toLowerCase() ? '{V}' : '{v}'));
      if (c === 'noun') { const snd = nouns.get(v) && nouns.get(v).sound; if (snd && t.toLowerCase().includes(snd.toLowerCase())) t = t.replace(new RegExp(esc(snd), 'i'), '{s}'); }
      return t;
    }
    function fill(t, c, v) {
      if (c === 'noun' && t.includes('{s}')) { const snd = nouns.get(v) && nouns.get(v).sound; if (!snd) return null; t = t.replace('{s}', snd); }
      return t.replace(/\{A\}/g, U.cap(D.a(v))).replace(/\{a\}/g, D.a(v)).replace(/\{V\}/g, U.cap(v)).replace(/\{v\}/g, v);
    }
    const templates = new Map(); // `${c}|${t}` -> {c, t, seen:Set}
    sentences.forEach((text, key) => {
      if (!playedKeys.has(key)) return; // generalize only from what games really said
      const toks = findTokens(text);
      if (!toks.length) return;
      const classes = new Set();
      toks.forEach((tk) => tokenClass.get(tk.value).forEach((c) => classes.add(c)));
      // expand only the highest-priority class present (avoids color × noun explosions)
      const c = PRIORITY.find((p) => classes.has(p));
      const tk = toks.find((x) => tokenClass.get(x.value).has(c));
      // a bare plural like "That's grapes." can't stand in for "That's a cow." — skip it as evidence
      if (c === 'noun' && D.a(tk.value) === tk.value) return;
      const t = templ(text, c, tk.value);
      if (!/\{[aAvV]\}/.test(t)) return;
      const id = c + '|' + t;
      if (!templates.has(id)) templates.set(id, { c, t, seen: new Set() });
      templates.get(id).seen.add(tk.value);
    });
    let generated = 0;
    const report = [];
    templates.forEach((T) => {
      if (T.seen.size < MIN_SEEN[T.c]) return;
      let domain = CLASSES[T.c].map((v) => v.toLowerCase());
      if (T.c === 'noun') {
        const cats = new Set();
        T.seen.forEach((v) => nouns.get(v) && nouns.get(v).cats.forEach((x) => cats.add(x)));
        // a slot that already mixes word categories (e.g. Find It distractors) can hold any word
        const wordCats = [...cats].filter((x) => x !== 'sticker');
        if (wordCats.length >= 2) D.CATEGORIES.forEach((c) => cats.add(c.id));
        domain = [...nouns.keys()].filter((w) => [...nouns.get(w).cats].some((x) => cats.has(x)));
      }
      if (T.c === 'number') {
        const maxSeen = Math.max(...[...T.seen].map((v) => CLASSES.number.indexOf(v)));
        domain = CLASSES.number.slice(maxSeen > 10 ? 0 : 1, 11);
      }
      let n = 0;
      domain.forEach((v) => { const s = fill(T.t, T.c, v); if (s) { const before = sentences.size; add(s); if (sentences.size > before) { n++; generated++; } } });
      report.push({ class: T.c, template: T.t, seen: T.seen.size, added: n });
    });
    report.sort((a, b) => b.added - a.added);
    const lines = [...sentences.entries()].map(([key, text]) => ({ key, text })).sort((a, b) => a.key.localeCompare(b.key));
    return { lines, generated, report, praise: D.PRAISE };
  }, { played, fixed, name: NAME });

  await browser.close();
  const chars = result.lines.reduce((n, l) => n + l.text.length, 0);
  // sentences that contain the child's name; tools/make_clips.py --name fills these in
  const nameTemplates = ['Hi {name}!', 'Time for a break, {name}!'].concat(result.praise.map((p) => p.replace(/[!.]$/, '') + ', {name}!'));
  fs.writeFileSync(path.join(OUT, 'lines.json'), JSON.stringify({ name: NAME || null, count: result.lines.length, chars, nameTemplates, lines: result.lines }, null, 1));
  fs.writeFileSync(path.join(OUT, 'lines-report.json'), JSON.stringify(result.report, null, 1));
  console.log(`played utterances: ${played.length}, fixed lines: ${fixed.length}  → unique sentences: ${result.lines.length} (${result.generated} from generalizing), ${chars.toLocaleString()} characters`);
  console.log('wrote voice/lines.json and voice/lines-report.json');
})();
