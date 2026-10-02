/* Animal Band — music opposites: high & low, loud & soft, fast & slow.
 *
 * Each stage: Pip shows both animals (explore: tap them, hear them, hear the word), then quiz rounds: a sound
 * plays behind the little theatre curtain — "Who made that sound?" — tap the animal (errorless: a wrong animal
 * plays its own sound and is named, then the mystery sound repeats; the right one glows after 2 misses).
 *   Level 1: guided exploring, 2 quiz rounds, very different timbres + visual hints from the curtain.
 *   Level 2: shorter exploring, 2 rounds.
 *   Level 3: 3 rounds, SAME instrument for both animals (only pitch / loudness / speed differ), no visual hints.
 *   Level 4: 4 rounds, closer contrasts, plus a mixed "whole band" stage with four animals.
 *   Level 5: closest contrasts (one octave, softer "loud", nearer tempos).
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;

  const ANIMALS = {
    bird: { emoji: '🐦', name: 'bird', tag: 'high', line: 'The bird sings high!', short: 'High!', voice: { pitch: 1.9, rate: 1.0 }, scale: 0.86 },
    elephant: { emoji: '🐘', name: 'elephant', tag: 'low', line: 'The elephant sings low!', short: 'Low!', voice: { pitch: 0.5, rate: 0.72 }, scale: 1.14 },
    lion: { emoji: '🦁', name: 'lion', tag: 'loud', line: 'The lion is loud!', short: 'Loud!', voice: { pitch: 0.85, rate: 1.0 }, scale: 1.12 },
    mouse: { emoji: '🐭', name: 'mouse', tag: 'soft', line: 'The mouse is soft.', short: 'Soft…', voice: { pitch: 1.6, rate: 0.72 }, scale: 0.74 },
    rabbit: { emoji: '🐇', name: 'bunny', tag: 'fast', line: 'The bunny is fast!', short: 'Fast!', voice: { pitch: 1.35, rate: 1.5 }, scale: 0.92 },
    turtle: { emoji: '🐢', name: 'turtle', tag: 'slow', line: 'The turtle is slow.', short: 'Slow…', voice: { pitch: 0.8, rate: 0.55 }, scale: 0.92 },
  };
  const STAGES = {
    highlow: { pair: ['bird', 'elephant'], title: 'High and low!', bg: 'linear-gradient(#8FD8FF 0%, #CDEFFF 58%, #E8F8E2 100%)' },
    loudsoft: { pair: ['lion', 'mouse'], title: 'Loud and soft!', bg: 'radial-gradient(120% 100% at 50% 0%, #FFE9F3 0%, #F7D3FF 55%, #D9C2FF 100%)' },
    fastslow: { pair: ['rabbit', 'turtle'], title: 'Fast and slow!', bg: 'linear-gradient(#BDEBFF 0%, #E5F7FF 45%, #CFF1C2 100%)' },
    mixed: { pair: null, title: 'The whole band!', bg: 'radial-gradient(120% 100% at 50% 0%, #FFF4D6 0%, #FFD9C9 55%, #FFC2D9 100%)' },
  };
  const MOTIF = [[0, 0], [4, 1], [7, 2], [4, 3], [0, 4]]; // do-mi-sol-mi-do, in eighths
  const TUNE = [['C5', 1], ['C5', 1], ['G5', 1], ['G5', 1], ['A5', 1], ['A5', 1], ['G5', 2]]; // twinkle opening

  /* ---------------- stoppable look-ahead timeline (audio-clock accurate) ---------------- */
  function timeline(ctx, items, opts) {
    opts = opts || {};
    items = items.slice().sort((a, b) => a.t - b.t);
    const A = ctx.audio;
    const useAudio = A.isRunning();
    const p0 = performance.now(), a0 = A.now();
    const clock = () => (useAudio ? A.now() : a0 + (performance.now() - p0) / 1000);
    const start = clock() + (opts.lead == null ? 0.08 : opts.lead);
    const total = opts.total != null ? opts.total : items.length ? items[items.length - 1].t : 0;
    let i = 0, stopped = false, iv = 0, endTimer = 0, resolve;
    const vis = new Set();
    const done = new Promise((r) => (resolve = r));
    function finish(ok) {
      if (stopped) return;
      stopped = true;
      if (iv) ctx.clearInterval(iv);
      if (endTimer) ctx.clearTimeout(endTimer);
      vis.forEach((id) => ctx.clearTimeout(id));
      resolve(ok);
    }
    function pump() {
      if (stopped) return;
      const now = clock();
      while (i < items.length && start + items[i].t < now + 0.16) {
        const it = items[i++];
        const when = Math.max(start + it.t, now);
        if (it.a && useAudio) { try { it.a(when); } catch (e) { console.error(e); } }
        if (it.v) {
          const id = ctx.setTimeout(() => { vis.delete(id); if (!stopped) it.v(when); }, Math.max(0, (when - clock()) * 1000));
          vis.add(id);
        }
      }
      if (i >= items.length && !endTimer) {
        ctx.clearInterval(iv);
        iv = 0;
        endTimer = ctx.setTimeout(() => finish(true), Math.max(0, (start + total - clock()) * 1000));
      }
    }
    iv = ctx.setInterval(pump, 25);
    pump();
    return { done, stop: () => finish(false) };
  }

  /* ---------------- art ---------------- */
  const CURTAIN_BACK = `<svg viewBox="0 0 200 210" aria-hidden="true">
    <path d="M6 206 V46 Q6 8 44 8 H156 Q194 8 194 46 V206 Z" fill="#7B3FC4"/>
    <path d="M6 206 V46 Q6 8 44 8 H156 Q194 8 194 46 V206 Z" fill="none" stroke="#5B2A99" stroke-width="4"/>
    <path d="M22 200 V52 Q22 26 46 26 H154 Q178 26 178 52 V200 Z" fill="#2E1850"/>
    <ellipse cx="100" cy="120" rx="60" ry="70" fill="#4A2A7A" opacity=".7"/>
    <rect x="22" y="180" width="156" height="22" fill="#C98146"/><rect x="22" y="180" width="156" height="6" fill="#DE9C5F"/>
  </svg>`;
  const CURTAIN_FRONT = `<svg viewBox="0 0 200 210" aria-hidden="true">
    <g class="ab-cl"><path d="M22 40 H101 V184 Q90 190 80 184 Q68 191 56 184 Q44 191 34 184 Q28 188 22 184 Z" fill="#E8354D"/>
      <path d="M38 42 Q34 110 40 184 M58 42 Q54 110 60 186 M80 42 Q76 110 82 186" stroke="#B11F38" stroke-width="6" fill="none" opacity=".55"/>
      <path d="M30 44 Q27 110 30 180" stroke="#FF7A8C" stroke-width="4" fill="none" opacity=".6"/></g>
    <g class="ab-cr"><path d="M178 40 H99 V184 Q110 190 120 184 Q132 191 144 184 Q156 191 166 184 Q172 188 178 184 Z" fill="#E8354D"/>
      <path d="M162 42 Q166 110 160 184 M142 42 Q146 110 140 186 M120 42 Q124 110 118 186" stroke="#B11F38" stroke-width="6" fill="none" opacity=".55"/>
      <path d="M108 44 Q105 110 108 180" stroke="#FF7A8C" stroke-width="4" fill="none" opacity=".6"/></g>
    <path d="M18 26 H182 V50 Q168 64 154 50 Q141 64 127 50 Q114 64 100 50 Q86 64 73 50 Q59 64 46 50 Q32 64 18 50 Z" fill="#FFC93C" stroke="#E8A400" stroke-width="2.5" stroke-linejoin="round"/>
    <g class="ab-bulbs">${[[14, 70], [14, 110], [14, 150], [186, 70], [186, 110], [186, 150], [40, 10], [70, 6], [130, 6], [160, 10]].map(([x, y], i) => `<circle class="ab-bulb" style="animation-delay:${-i * 0.13}s" cx="${x}" cy="${y}" r="5.5" fill="#FFF3B0" stroke="#FFC93C" stroke-width="2"/>`).join('')}</g>
    <circle cx="100" cy="10" r="16" fill="#FFC93C" stroke="#fff" stroke-width="4"/>
    <text x="100" y="17" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" stroke="#E8A400" stroke-width="2" paint-order="stroke" font-family="ui-rounded, system-ui, sans-serif">?</text>
  </svg>`;
  const SPEAKER = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M18 38 H36 L58 20 V80 L36 62 H18 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M68 34 Q78 50 68 66 M78 26 Q94 50 78 74" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/></svg>`;
  const DRUM_PROP = `<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="80" rx="40" ry="13" fill="#9C1F1B"/><rect x="10" y="38" width="80" height="42" fill="#EF3B36"/><path d="M12 44 L26 76 L40 44 L54 76 L68 44 L82 76 L88 60" stroke="#FFE07A" stroke-width="4" fill="none"/><ellipse cx="50" cy="38" rx="40" ry="13" fill="#FFF8EC" stroke="#D5DCE6" stroke-width="4"/></svg>`;
  const BELL_PROP = `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="44" y="6" width="12" height="30" rx="6" fill="#B57A3C"/><path d="M24 76 Q24 34 50 32 Q76 34 76 76 Z" fill="#FFC93C" stroke="#E0A800" stroke-width="4" stroke-linejoin="round"/><rect x="18" y="72" width="64" height="10" rx="5" fill="#E0A800"/><circle cx="50" cy="88" r="8" fill="#E0A800"/><ellipse cx="38" cy="50" rx="5" ry="12" fill="#fff" opacity=".55"/></svg>`;

  U.addStyles('concert', `
    .g-concert { transition: background .6s; }
    .ab-world { position: absolute; inset: 0; }
    .ab-scene { position: absolute; inset: 0; pointer-events: none; }
    .ab-ground { position: absolute; left: 0; right: 0; bottom: 0; background: linear-gradient(#8EDB7E, #6BC75E); border-top: 6px solid #B5EBA8; border-radius: 40% 40% 0 0 / 30px 30px 0 0; }
    .ab-floor { position: absolute; left: 0; right: 0; bottom: 0; background: repeating-linear-gradient(90deg, #E7A66C 0 70px, #D9955A 70px 140px); border-top: 7px solid #F6C796; }
    .ab-trunk { position: absolute; background: linear-gradient(90deg, #8A5A2E, #A8713D 50%, #8A5A2E); border-radius: 18px 0 0 18px; }
    .ab-branch { position: absolute; height: 18px; background: #9C6533; border-radius: 9px; transform-origin: 100% 50%; }
    .ab-leaves { position: absolute; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #9BE38A, #4FB848 70%); }
    .ab-sun { position: absolute; border-radius: 50%; background: radial-gradient(circle, #FFF6B0, #FFD93C 60%, #FFC21C); box-shadow: 0 0 40px 10px rgba(255, 220, 80, .5); animation: ab-spin 18s linear infinite; }
    @keyframes ab-spin { to { transform: rotate(360deg) } }
    .ab-lane { position: absolute; border-radius: 999px; background: #E8C590; border: 5px solid #F7DFB5; box-shadow: inset 0 -5px 0 rgba(150, 100, 40, .18); }
    .ab-lane::after { content: ""; position: absolute; left: 6%; right: 6%; top: 50%; border-top: 4px dashed rgba(255, 255, 255, .7); }
    .ab-spot { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.75), rgba(255,255,255,0) 68%); }
    .ab-curtain { position: absolute; z-index: 3; }
    .ab-curtain > svg, .ab-curtain .ab-front { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
    .ab-curtain svg g { transform-box: view-box; }
    .ab-cl { transform-origin: 22px 100px; transition: transform .45s cubic-bezier(.4, 1.3, .5, 1); }
    .ab-cr { transform-origin: 178px 100px; transition: transform .45s cubic-bezier(.4, 1.3, .5, 1); }
    .ab-curtain.open .ab-cl, .ab-curtain.open .ab-cr { transform: scaleX(.16); }
    .ab-bulb { animation: ab-twinkle 1.2s ease-in-out infinite; animation-play-state: paused; }
    .ab-curtain.live .ab-bulb { animation-play-state: running; }
    @keyframes ab-twinkle { 0%, 100% { fill: #FFF3B0 } 50% { fill: #FF8FB1 } }
    .ab-reveal { position: absolute; left: 11%; right: 11%; top: 22%; bottom: 14%; display: grid; place-items: center; opacity: 0; transition: opacity .2s; }
    .ab-curtain.open .ab-reveal { opacity: 1; }
    .ab-reveal .pp-emoji { font-size: var(--rs); }
    .ab-replay { position: absolute; z-index: 4; border-radius: 50%; background: #4D96FF; border: 4px solid #fff; box-shadow: 0 5px 0 #2C6FD1, 0 9px 16px rgba(0,0,0,.18); display: grid; place-items: center; opacity: 0; transform: scale(.4); transition: opacity .25s, transform .25s; pointer-events: none; }
    .ab-replay.on { opacity: 1; transform: scale(1); pointer-events: auto; }
    .ab-replay svg { width: 60%; height: 60%; }
    .ab-animal { position: absolute; z-index: 5; display: grid; place-items: center; transition: transform var(--move, .4s) ease-in-out; }
    .ab-animal.pop { animation: pp-popin .5s cubic-bezier(.3, 1.6, .5, 1) both; }
    .ab-animal .ab-face { position: relative; display: grid; place-items: center; transform-origin: 50% 90%; }
    .ab-animal .ab-face .pp-emoji { font-size: var(--es); filter: drop-shadow(0 6px 4px rgba(40, 20, 60, .2)); transition: transform .25s; }
    .ab-animal.flip .ab-face .pp-emoji { transform: scaleX(-1); }
    .ab-animal .ab-shadow { position: absolute; left: 18%; right: 18%; bottom: 2%; height: 10%; border-radius: 50%; background: rgba(40, 30, 60, .16); }
    .ab-animal.pp-glow { border-radius: 50%; }
    .ab-prop { position: absolute; pointer-events: none; }
    .ab-tag { position: absolute; left: 50%; bottom: -8%; transform: translateX(-50%); white-space: nowrap; pointer-events: none; padding: .1em .55em .15em; border-radius: 999px;
      background: rgba(255, 255, 255, .88); color: #4A3A6A; font-weight: 900; font-size: var(--ts); box-shadow: 0 3px 0 rgba(0,0,0,.08); }
    .ab-tag.t-high { bottom: auto; top: -14%; font-size: calc(var(--ts) * .9); letter-spacing: .04em; }
    .ab-tag.t-low { font-size: calc(var(--ts) * 1.1); }
    .ab-tag.t-loud { font-size: calc(var(--ts) * 1.35); color: #D62839; text-transform: uppercase; }
    .ab-tag.t-soft { font-size: calc(var(--ts) * .8); color: #8C7CA8; font-weight: 600; }
    .ab-tag.t-fast { font-style: italic; color: #E26A00; }
    .ab-tag.t-slow { letter-spacing: .35em; color: #2E8B57; }
    .ab-fx { position: absolute; inset: 0; pointer-events: none; z-index: 8; overflow: hidden; }
    .ab-note { position: absolute; left: 0; top: 0; font-weight: 900; line-height: 1; -webkit-text-stroke: 3px #fff; paint-order: stroke fill; will-change: transform, opacity; }
    .ab-wave { position: absolute; left: 0; top: 0; border-radius: 50%; border-style: solid; border-color: transparent; will-change: transform, opacity; }
  `);

  PP.registerGame({
    id: 'concert',
    title: 'Animal Band',
    domain: 'music',
    icon: '🦁',
    tileColor: '#3C9DF0',
    order: 52,
    create(stage, ctx) {
      const probe = ctx.el('div', { style: { position: 'absolute', visibility: 'hidden', pointerEvents: 'none', paddingTop: 'var(--safe-t)', paddingRight: 'var(--safe-r)', paddingBottom: 'var(--safe-b)', paddingLeft: 'var(--safe-l)' } });
      const world = ctx.el('div', { class: 'ab-world' });
      const scene = ctx.el('div', { class: 'ab-scene' });
      const curtain = ctx.el('div', { class: 'ab-curtain' });
      curtain.innerHTML = CURTAIN_BACK;
      const reveal = ctx.el('div', { class: 'ab-reveal' }, ctx.el('span', { class: 'pp-emoji' }));
      const front = ctx.html(CURTAIN_FRONT);
      front.classList.add('ab-front');
      curtain.append(reveal, front);
      const replay = ctx.el('button', { class: 'ab-replay pp-noripple', 'aria-label': 'Hear it again', html: SPEAKER });
      const fx = ctx.el('div', { class: 'ab-fx' });
      world.append(scene, curtain, replay);
      stage.append(probe, world, fx);
      const pip = ctx.mascot.show({ corner: 'none' });
      pip.el.dataset.corner = 'none';

      /* ---------------- state ---------------- */
      let stageId = null;
      let animals = []; // {id, def, el, face, cx, cy, s, dir, off, taps}
      let phase = 'intro'; // intro | demo | explore | quiz | between
      let perf = null; // {an, tl}
      let mystery = null; // {tl}
      let quiz = null;
      let explore = null;
      let geo = null;
      let gen = 0; // bumps when a stage is torn down, so stale async steps stop

      /* ---------------- layout ---------------- */
      function insets() {
        const cs = getComputedStyle(probe);
        return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
      }
      function put(el, x, y, w, h) { Object.assign(el.style, { left: Math.round(x) + 'px', top: Math.round(y) + 'px', width: Math.round(w) + 'px', height: Math.round(h == null ? w : h) + 'px' }); }
      function computeGeo() {
        const { w, h } = ctx.size();
        const S = insets();
        const m = Math.round(U.clamp(Math.min(w, h) * 0.025, 10, 22));
        const L = S.l + m, R = w - S.r - m, T = S.t + m, B = h - S.b - m;
        const W = R - L, H = B - T;
        const portrait = h > w;
        let cur, area, pipS = Math.round(U.clamp(Math.min(w, h) * 0.2, 80, 140));
        if (!portrait) {
          const cw = Math.min(W * 0.32, H * 0.74, 400);
          const ch = cw * 1.05;
          const cx = Math.max(L + W * 0.26, S.l + 104 + cw / 2);
          cur = { x: cx - cw / 2, y: T + (H - ch) / 2 - H * 0.03, w: cw, h: ch };
          area = { x: cur.x + cw + m * 1.5, y: T, w: R - (cur.x + cw + m * 1.5), h: H };
        } else {
          const cw = Math.min(W * 0.6, H * 0.27, 380);
          const ch = cw * 1.05;
          const cx = Math.max(w / 2, S.l + 104 + cw / 2);
          cur = { x: cx - cw / 2, y: T + 14, w: cw, h: ch };
          area = { x: L, y: cur.y + ch + m * 1.2, w: W, h: B - (cur.y + ch + m * 1.2) };
        }
        const u = Math.min(area.w * (portrait ? 0.36 : 0.4), area.h * 0.36, 230);
        return { w, h, portrait, cur, area, u, pipS, m };
      }
      function layout() {
        geo = computeGeo();
        const c = geo.cur;
        put(curtain, c.x, c.y, c.w, c.h);
        reveal.style.setProperty('--rs', Math.round(c.w * 0.42) + 'px');
        const rs = Math.round(U.clamp(c.w * 0.26, 64, 88));
        if (geo.portrait) put(replay, Math.max(c.x - rs * 0.3, 8), c.y + c.h - rs * 0.75, rs);
        else put(replay, c.x + c.w - rs * 0.7, c.y + c.h - rs * 0.75, rs);
        const ps = geo.pipS;
        pip.el.style.width = pip.el.style.height = ps + 'px';
        let px = geo.portrait ? c.x + c.w - ps * 0.1 : c.x - ps * 0.45;
        px = U.clamp(px, 6, geo.w - ps - 6);
        let py = geo.portrait ? c.y + c.h - ps * 0.9 : c.y + c.h - ps * 0.75;
        py = U.clamp(py, 104, geo.h - ps - 6);
        Object.assign(pip.el.style, { left: px + 'px', top: py + 'px', right: 'auto', bottom: 'auto' });
        if (stageId) arrange();
      }

      /* ---------------- scenes ---------------- */
      function slots(id) {
        const A = geo.area, u = geo.u, P = geo.portrait;
        const at = (fx, fy) => ({ x: A.x + A.w * fx, y: A.y + A.h * fy });
        if (id === 'highlow') return { bird: at(P ? 0.64 : 0.66, 0.2), elephant: at(P ? 0.36 : 0.38, 0.76) };
        if (id === 'loudsoft') return { lion: at(P ? 0.28 : 0.32, P ? 0.42 : 0.52), mouse: at(P ? 0.8 : 0.78, P ? 0.68 : 0.64) };
        if (id === 'fastslow') {
          const right = A.x + A.w - u * 0.55;
          return { rabbit: { x: right, y: A.y + A.h * 0.28 }, turtle: { x: right, y: A.y + A.h * 0.74 } };
        }
        // mixed: 2 x 2
        const o = {};
        animals.forEach((an, i) => { o[an.id] = at(i % 2 ? 0.74 : 0.27, i < 2 ? 0.27 : 0.73); });
        return o;
      }
      function decorate(id) {
        scene.innerHTML = '';
        const A = geo.area, u = geo.u;
        const d = (cls, x, y, w, h, extra) => { const e = ctx.el('div', { class: cls }); put(e, x, y, w, h); if (extra) Object.assign(e.style, extra); scene.appendChild(e); return e; };
        if (id === 'highlow') {
          d('ab-sun', A.x + A.w * (geo.portrait ? 0.02 : 0.1), A.y + A.h * (geo.portrait ? 0.02 : 0.04), u * 0.45, u * 0.45);
          d('ab-ground', 0, A.y + A.h * 0.76 + u * 0.3, geo.w, geo.h);
          const sl = slots(id);
          const tw = Math.max(26, u * 0.22);
          d('ab-trunk', geo.w - tw, 0, tw + 4, geo.h);
          const by = sl.bird.y + u * 0.32;
          const bx = sl.bird.x - u * 0.55;
          d('ab-branch', bx, by, geo.w - tw - bx + 6, 18);
          d('ab-leaves', geo.w - u * 0.9, (geo.portrait ? A.y - u * 0.5 : -u * 0.3), u * 1.4, u * 0.9);
          d('ab-leaves', bx - u * 0.1, by - u * 0.12, u * 0.38, u * 0.26);
        } else if (id === 'loudsoft' || id === 'mixed') {
          d('ab-floor', 0, A.y + A.h * (id === 'mixed' ? 0.9 : 0.72) + u * 0.25, geo.w, geo.h);
          const ls = id === 'loudsoft' ? slots(id).lion : { x: A.x + A.w / 2, y: A.y + A.h / 2 };
          d('ab-spot', ls.x - u, ls.y - u, u * 2, u * 2);
          if (id === 'loudsoft') { const ms = slots(id).mouse; d('ab-spot', ms.x - u * 0.7, ms.y - u * 0.7, u * 1.4, u * 1.4); }
        } else if (id === 'fastslow') {
          const sl = slots(id);
          ['rabbit', 'turtle'].forEach((k) => d('ab-lane', A.x - 4, sl[k].y + u * 0.18, A.w + 8, Math.max(26, u * 0.24)));
        }
      }
      function buildAnimal(id, i) {
        const def = ANIMALS[id];
        const el = ctx.el('div', { class: 'ab-animal pop', 'aria-label': def.name, style: { animationDelay: i * 120 + 'ms' } });
        const face = ctx.el('div', { class: 'ab-face' }, ctx.el('span', { class: 'pp-emoji', text: def.emoji }));
        el.append(ctx.el('div', { class: 'ab-shadow' }), face, ctx.el('div', { class: 'ab-tag t-' + def.tag, text: def.tag }));
        let prop = null;
        if (id === 'lion') prop = ctx.el('div', { class: 'ab-prop', html: DRUM_PROP });
        if (id === 'mouse') prop = ctx.el('div', { class: 'ab-prop', html: BELL_PROP });
        if (prop) el.appendChild(prop);
        world.appendChild(el);
        // drop the entrance animation once it has played, so it never overrides later inline transforms
        el.addEventListener('animationend', (e) => { if (e.target === el && e.animationName === 'pp-popin') el.classList.remove('pop'); });
        const an = { id, def, el, face, prop, cx: 0, cy: 0, s: 0, dir: -1, off: 0, taps: 0 };
        ctx.tap(el, () => onAnimal(an));
        return an;
      }
      function arrange() {
        const sl = slots(stageId);
        const u = geo.u;
        animals.forEach((an) => {
          const p = sl[an.id];
          const vis = u * an.def.scale * (stageId === 'mixed' ? 0.85 : 1);
          const s = Math.max(vis, geo.portrait ? 96 : 92); // tap target never smaller than this
          an.cx = p.x; an.cy = p.y; an.s = s;
          put(an.el, p.x - s / 2, p.y - s / 2, s);
          an.el.style.setProperty('--es', Math.round(vis * 0.82) + 'px');
          an.el.style.setProperty('--ts', Math.round(U.clamp(u * 0.15, 15, 28)) + 'px');
          if (an.prop) {
            const ps = an.id === 'lion' ? vis * 0.58 : Math.max(34, vis * 0.5);
            const left = an.id === 'lion' ? s / 2 + vis * 0.34 : s / 2 + vis * 0.22;
            put(an.prop, left, an.id === 'lion' ? s / 2 - vis * 0.12 : s / 2 + vis * 0.05, ps);
          }
          if (an.id === 'rabbit' || an.id === 'turtle') {
            const frac = an.lane ? -an.off / an.lane : 0; // keep its place along the lane across resizes
            an.lane = stageId === 'mixed' ? 0 : Math.max(0, geo.area.w - u * 1.1);
            an.off = -frac * an.lane;
            an.el.style.setProperty('--move', '0s');
            an.el.style.transform = `translateX(${an.off}px)`;
            an.el.classList.toggle('flip', an.dir > 0);
          }
        });
        decorate(stageId);
      }
      function setStage(id) {
        gen++;
        stopPerf();
        stopMystery();
        animals.forEach((an) => an.el.remove());
        stageId = id;
        stage.style.background = STAGES[id].bg;
        let ids = STAGES[id].pair;
        if (!ids) {
          const pairs = ctx.shuffle([STAGES.highlow.pair, STAGES.loudsoft.pair, STAGES.fastslow.pair]).slice(0, 2);
          ids = ctx.shuffle(pairs[0].concat(pairs[1]));
        }
        animals = ids.map((k, i) => buildAnimal(k, i));
        curtain.classList.remove('open', 'live');
        arrange();
      }

      /* ---------------- sounds ---------------- */
      /** the hits that make up an animal's sound (t in seconds), adapted to the level */
      function hitsFor(id, lvl, pure) {
        const out = [];
        const add = (t, a) => out.push({ t, a });
        const same = lvl >= 3 && !pure;
        if (id === 'bird' || id === 'elephant') {
          const unit = 0.2;
          const hi = lvl <= 3 || pure ? 84 : 72; // C6 / C5
          const lo = lvl <= 4 || pure ? 48 : 60; // C3 / C4
          MOTIF.forEach(([semi, e], k) => {
            const dur = k === MOTIF.length - 1 ? 0.55 : 0.19;
            if (id === 'bird') {
              const n = hi + semi;
              add(e * unit, (at) => (same ? ctx.play('piano', n, { at, dur, vel: 0.5 }) : ctx.play('flute', n, { at, dur, vel: 0.95 })));
            } else {
              const n = lo + semi;
              add(e * unit, (at) => {
                if (same) ctx.play('piano', n, { at, dur, vel: 0.75 });
                else { ctx.play('toy', n, { at, vel: 0.95 }); ctx.play('bass', n, { at, dur, vel: 0.6 }); }
              });
            }
          });
        } else if (id === 'lion' || id === 'mouse') {
          const unit = 0.3;
          if (!same) {
            if (id === 'lion') {
              [0, 1, 2].forEach((k) => add(k * unit, (at) => {
                ctx.drum('kick', { at, vel: 0.85 });
                ctx.drum('tom', { at, vel: 0.8, pitch: 110 });
                if (k === 2) ctx.drum('cymbal', { at, vel: 0.32 });
              }));
            } else {
              ['G6', 'C7', 'E7'].forEach((n, k) => add(k * unit * 0.7, (at) => ctx.play('bell', n, { at, vel: 0.07 })));
              add(3 * unit * 0.7, (at) => ctx.drum('triangle', { at, vel: 0.06 }));
            }
          } else {
            // identical instrument and notes — only the loudness differs
            const sc = id === 'lion' ? 1 : [0, 0.08, 0.08, 0.08, 0.11, 0.2][lvl];
            ['C5', 'E5', 'G5'].forEach((n, k) => add(k * unit, (at) => {
              ctx.drum('tom', { at, vel: 0.85 * sc, pitch: 150 });
              ctx.play('marimba', n, { at, vel: 0.9 * sc });
            }));
          }
        } else {
          const fast = id === 'rabbit';
          const bpm = fast ? [0, 230, 230, 200, 180, 165][lvl] : [0, 84, 84, 88, 94, 104][lvl];
          const beat = 60 / (pure ? (fast ? 230 : 84) : bpm);
          let t = 0;
          TUNE.forEach(([n, d]) => {
            const at0 = t;
            add(at0 * beat, (at) => ctx.play('marimba', n, { at, vel: 0.75, dur: d * beat }));
            t += d;
          });
        }
        return out;
      }
      function lengthOf(hits, id) { return hits[hits.length - 1].t + (id === 'rabbit' || id === 'turtle' ? 0.5 : 0.45); }

      /* ---------------- visuals ---------------- */
      let liveFx = 0;
      function note(x, y, o) {
        if (liveFx > 40) return;
        liveFx++;
        const e = ctx.el('div', { class: 'ab-note', text: ctx.pick(['♪', '♫', '♪']), style: { color: o.color, fontSize: Math.round(o.size) + 'px' } });
        fx.appendChild(e);
        const a = e.animate([
          { transform: `translate(${x}px, ${y}px) translate(-50%,-50%) scale(.4)`, opacity: 0 },
          { transform: `translate(${x + o.dx * 0.4}px, ${y + o.dy * 0.4}px) translate(-50%,-50%) scale(1.1) rotate(${o.rot * 0.5}deg)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${x + o.dx}px, ${y + o.dy}px) translate(-50%,-50%) scale(.9) rotate(${o.rot}deg)`, opacity: 0 },
        ], { duration: o.dur || 1000, easing: 'cubic-bezier(.2,.7,.3,1)' });
        a.onfinish = () => { e.remove(); liveFx--; };
      }
      function wave(x, y, o) {
        if (liveFx > 40) return;
        liveFx++;
        const e = ctx.el('div', { class: 'ab-wave', style: { width: o.r * 2 + 'px', height: o.r * 2 + 'px', borderWidth: o.bw + 'px', borderRightColor: o.color, borderTopColor: o.both ? 'transparent' : 'transparent' } });
        if (o.both) e.style.borderLeftColor = o.color;
        fx.appendChild(e);
        const a = e.animate([
          { transform: `translate(${x - o.r}px, ${y - o.r}px) scale(.3)`, opacity: 0.95 },
          { transform: `translate(${x - o.r}px, ${y - o.r}px) scale(1)`, opacity: 0 },
        ], { duration: o.dur || 700, delay: o.delay || 0, easing: 'ease-out' });
        a.onfinish = () => { e.remove(); liveFx--; };
      }
      /** per-hit visual for an animal's sound, emitted from (x, y) */
      function emit(id, x, y, k, size, hints) {
        const s = size;
        if (id === 'bird') note(x + ctx.rand(-10, 10), y - s * 0.2, { color: '#2F7BEA', size: Math.max(20, s * 0.2), dx: ctx.rand(-30, 30), dy: hints ? -s * 1.3 : -s * 0.7, rot: ctx.rand(-30, 30), dur: 900 });
        else if (id === 'elephant') note(x + ctx.rand(-20, 20), y, { color: '#8E4FD6', size: Math.max(36, s * 0.42), dx: hints ? ctx.rand(-90, 90) : ctx.rand(-30, 30), dy: hints ? s * 0.12 : -s * 0.5, rot: ctx.rand(-15, 15), dur: 1300 });
        else if (id === 'lion') {
          if (hints) for (let r = 0; r < 3; r++) wave(x, y, { r: s * (0.9 + r * 0.3), bw: Math.max(8, s * 0.07), color: '#FF5D3A', both: true, delay: r * 70, dur: 650 });
          else note(x, y - s * 0.2, { color: '#FF5D3A', size: Math.max(28, s * 0.28), dx: ctx.rand(-40, 40), dy: -s * 0.6, rot: 0 });
        } else if (id === 'mouse') {
          if (hints) wave(x, y, { r: s * 0.35, bw: 3, color: '#B08CD8', both: true, dur: 600 });
          else note(x, y - s * 0.2, { color: '#B08CD8', size: Math.max(28, s * 0.28), dx: ctx.rand(-40, 40), dy: -s * 0.6, rot: 0 });
        } else if (id === 'neutral') {
          note(x + ctx.rand(-20, 20), y - s * 0.1, { color: ctx.pick(['#FF5D73', '#8E4FD6', '#2F7BEA', '#FF8C1A']), size: Math.max(26, s * 0.22), dx: ctx.rand(-50, 50), dy: -s * 0.55, rot: ctx.rand(-25, 25), dur: 900 });
        } else {
          note(x + ctx.rand(-12, 12), y - s * 0.25, { color: id === 'rabbit' ? '#FF8C1A' : '#2E8B57', size: Math.max(24, s * 0.26), dx: ctx.rand(-30, 30), dy: -s * 0.7, rot: ctx.rand(-25, 25), dur: id === 'rabbit' ? 650 : 1400 });
        }
      }
      function moveFor(an, k, n, hitDur) {
        const f = an.face;
        const id = an.id;
        if (id === 'bird') f.animate([{ transform: 'none' }, { transform: `translateY(-14%) rotate(${k % 2 ? 9 : -9}deg)`, offset: 0.4 }, { transform: 'none' }], { duration: 260, easing: 'ease-out' });
        else if (id === 'elephant') {
          f.animate([{ transform: 'none' }, { transform: 'scale(1.08, .9)', offset: 0.3 }, { transform: 'scale(.98, 1.03)', offset: 0.6 }, { transform: 'none' }], { duration: 420, easing: 'ease-out' });
        } else if (id === 'lion') {
          const big = ctx.level < 3 || stageId === 'mixed';
          f.animate([{ transform: 'none' }, { transform: `scale(${big ? 1.22 : 1.12}) rotate(${k % 2 ? 6 : -6}deg)`, offset: 0.25 }, { transform: 'scale(1.05)', offset: 0.6 }, { transform: 'none' }], { duration: 320, easing: 'ease-out' });
          if (an.prop) an.prop.animate([{ transform: 'none' }, { transform: 'scale(1.15, .85)', offset: 0.2 }, { transform: 'none' }], { duration: 260 });
          if (big && k === 2) world.animate([{ transform: 'none' }, { transform: 'translate(-6px, 3px)' }, { transform: 'translate(5px, -2px)' }, { transform: 'translate(-3px, 1px)' }, { transform: 'none' }], { duration: 320 });
        } else if (id === 'mouse') {
          f.animate([{ transform: 'none' }, { transform: `rotate(${k % 2 ? 6 : -6}deg) scale(1.04)`, offset: 0.5 }, { transform: 'none' }], { duration: 260 });
          if (an.prop) an.prop.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(18deg)', offset: 0.3 }, { transform: 'rotate(-12deg)', offset: 0.65 }, { transform: 'rotate(0)' }], { duration: 300 });
        } else {
          // rabbit hops / turtle crawls one step along the lane per note
          const step = an.lane / n;
          const from = an.off, to = U.clamp(an.off + an.dir * step, -an.lane, 0);
          an.off = to;
          an.el.style.setProperty('--move', '0s');
          an.el.style.transform = `translateX(${to}px)`;
          const d = Math.max(140, hitDur * 1000 * (id === 'rabbit' ? 0.85 : 0.95));
          if (id === 'rabbit') {
            an.el.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${(from + to) / 2}px) translateY(-${an.s * 0.35}px)`, offset: 0.5 }, { transform: `translateX(${to}px)` }], { duration: d, easing: 'ease-out' });
          } else {
            an.el.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], { duration: d, easing: 'ease-in-out' });
            f.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-4deg) translateY(-3%)', offset: 0.5 }, { transform: 'rotate(0)' }], { duration: d });
          }
        }
      }
      function animalPos(an) {
        const r = an.el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }

      /* ---------------- performances ---------------- */
      function stopPerf() { if (perf) { perf.tl.stop(); perf = null; } }
      function stopMystery() {
        if (mystery) { mystery.tl.stop(); mystery = null; }
        curtain.classList.remove('live');
      }
      /** the animal plays its sound and moves along with it */
      function perform(an, o) {
        o = o || {};
        stopPerf();
        const lvl = ctx.level;
        const hits = hitsFor(an.id, lvl, o.pure || stageId === 'mixed');
        const n = hits.length;
        if (an.id === 'rabbit' || an.id === 'turtle') {
          // turn around at the end of the lane
          if ((an.dir < 0 && an.off <= -an.lane + 1) || (an.dir > 0 && an.off >= -1)) {
            an.dir = -an.dir;
            an.el.classList.toggle('flip', an.dir > 0);
          }
        }
        const items = hits.map((h, k) => ({
          t: h.t, a: h.a,
          v: () => {
            moveFor(an, k, n, k < n - 1 ? hits[k + 1].t - h.t : 0.4);
            const p = animalPos(an);
            emit(an.id, p.x, p.y, k, an.s, true);
          },
        }));
        const tl = timeline(ctx, items, { total: lengthOf(hits, an.id) });
        const me = { an, tl };
        perf = me;
        return tl.done.then((ok) => { if (perf === me) perf = null; return ok; });
      }
      /** the mystery sound, from behind the curtain */
      function playMystery(an) {
        stopMystery();
        stopPerf();
        const lvl = ctx.level;
        const hints = lvl <= 2;
        const hits = hitsFor(an.id, lvl, stageId === 'mixed');
        const c = geo.cur;
        const items = hits.map((h, k) => ({
          t: h.t, a: h.a,
          v: () => {
            front.animate([{ transform: 'none' }, { transform: `translateX(${k % 2 ? 3 : -3}px) scale(1.01, .99)`, offset: 0.4 }, { transform: 'none' }], { duration: 220 });
            const r = curtain.getBoundingClientRect();
            emit(hints ? an.id : 'neutral', r.left + r.width / 2, r.top + r.height * 0.45, k, c.w * 0.55, hints);
          },
        }));
        curtain.classList.add('live');
        const tl = timeline(ctx, items, { total: lengthOf(hits, an.id) });
        const me = { tl };
        mystery = me;
        return tl.done.then((ok) => { if (mystery === me) { mystery = null; curtain.classList.remove('live'); } return ok; });
      }
      function sayAs(an, text, mode) { return ctx.say(text, Object.assign({ mode: mode || 'interrupt' }, an.def.voice)); }
      function glowOn(an) { an.el.classList.add('pp-glow'); }
      function glowOff(an) { if (an) an.el.classList.remove('pp-glow'); }

      /* ---------------- taps ---------------- */
      function onAnimal(an) {
        if (phase === 'quiz') return quizTap(an);
        an.taps++;
        perform(an);
        if (phase === 'explore') exploreTap(an);
      }
      ctx.tap(curtain, () => {
        if (phase === 'quiz' && quiz && !quiz.done) { replayMystery(); return; }
        front.animate([{ transform: 'none' }, { transform: 'translateY(-4px) scale(1.02)' }, { transform: 'none' }], { duration: 260 });
        ctx.sfx('swish', { vel: 0.4 });
      });
      ctx.tap(replay, () => { if (phase === 'quiz' && quiz && !quiz.done) replayMystery(); });

      /* ---------------- explore ---------------- */
      function exploreTap(an) {
        const e = explore;
        if (!e) return;
        glowOff(an);
        e.count[an.id] = (e.count[an.id] || 0) + 1;
        e.total++;
        const said = e.count[an.id] <= 2 ? an.def.line : an.def.short;
        const g = gen;
        ctx.setTimeout(() => { if (g === gen && phase === 'explore') sayAs(an, said); }, an.id === 'turtle' ? 900 : 550);
        if (e.guide && e.guide === an) {
          e.guide = null;
          const other = animals.find((x) => (e.count[x.id] || 0) === 0);
          if (other) ctx.setTimeout(() => { if (explore === e) { e.guide = other; glowOn(other); ctx.setPrompt(`Tap the ${other.def.name}!`); ctx.say(`Now tap the ${other.def.name}!`, { mode: 'queue' }); } }, 900);
        }
        const enough = animals.every((x) => (e.count[x.id] || 0) >= e.each) && e.total >= e.need;
        if (enough && !e.finishing) {
          e.finishing = true;
          ctx.setTimeout(() => e.resolve(), an.id === 'turtle' ? 5200 : 2600);
        }
      }
      async function runExplore() {
        const lvl = ctx.level;
        const g = gen;
        // Pip demonstrates each animal first (levels 1-2), then the child explores
        if (lvl <= 2 || stageId === 'mixed') {
          phase = 'demo';
          for (const an of animals) {
            if (g !== gen) return;
            glowOn(an);
            ctx.mascot.mood('wave');
            await ctx.say(`Listen to the ${an.def.name}!`);
            if (g !== gen) return;
            await perform(an);
            if (g !== gen) return;
            if (stageId !== 'mixed') await sayAs(an, an.def.line);
            glowOff(an);
            await ctx.wait(250);
          }
        }
        if (g !== gen) return;
        phase = 'explore';
        const each = lvl <= 1 ? 2 : 1;
        const need = lvl <= 1 ? 5 : lvl <= 2 ? 3 : 2;
        await new Promise((resolve) => {
          explore = { count: {}, total: 0, each, need, resolve, guide: null };
          const first = animals[0];
          if (lvl <= 1) { explore.guide = first; glowOn(first); }
          const prompt = lvl <= 1 ? `Tap the ${first.def.name}!` : 'Tap the animals!';
          ctx.setPrompt(prompt);
          ctx.say(prompt);
        });
        animals.forEach(glowOff);
        explore = null;
      }

      /* ---------------- quiz ---------------- */
      async function replayMystery() {
        if (!quiz || quiz.done) return;
        const q = quiz;
        await playMystery(q.target);
        if (quiz === q && !q.done && !PP.speech.speaking()) ctx.say('Who made that sound?', { mode: 'skip' });
      }
      async function quizTap(an) {
        const q = quiz;
        if (!q || q.done) { perform(an); return; }
        if (an === q.target) {
          q.done = true;
          stopMystery();
          replay.classList.remove('on');
          animals.forEach(glowOff);
          ctx.success(q.misses === 0);
          reveal.firstChild.textContent = an.def.emoji;
          curtain.classList.add('open');
          ctx.mascot.mood('cheer');
          perform(an);
          const p = animalPos(an);
          PP.fx.burst(p.x, p.y, { emoji: ['⭐', '✨', '🌟'], count: 7, distance: Math.max(90, an.s * 0.8) });
          await Promise.all([sayAs(an, `Yes! ${an.def.line}`), ctx.wait(1800)]);
          if (quiz !== q) return;
          await ctx.celebrate({ x: p.x, y: p.y, say: false, sound: 'success' });
          curtain.classList.remove('open');
          await ctx.wait(450);
          q.resolve();
          return;
        }
        // errorless: name and play what they tapped, then listen again
        q.misses++;
        const token = ++q.token;
        stopMystery();
        ctx.sfx('oops', { vel: 0.5 });
        ctx.mascot.mood('think');
        an.face.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-10deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(0)' }], { duration: 450 });
        if (q.misses >= 2) {
          if (!q.missed) { q.missed = true; ctx.miss(); }
          glowOn(q.target);
        }
        await perform(an);
        if (quiz !== q || q.done || q.token !== token) return;
        await sayAs(an, `That's the ${an.def.name}. ${an.def.short}`);
        if (quiz !== q || q.done || q.token !== token) return;
        await ctx.say('Listen again!');
        if (quiz !== q || q.done || q.token !== token) return;
        await playMystery(q.target);
        if (quiz === q && !q.done && q.token === token) ctx.say('Who made that sound?', { mode: 'skip' });
      }
      async function runQuizRound(r, order) {
        const g = gen;
        const target = order[r];
        await new Promise((resolve) => {
          quiz = { target, misses: 0, done: false, resolve, token: 0, idles: 0 };
          const q = quiz;
          phase = 'quiz';
          ctx.setPrompt('Who made that sound?');
          (async () => {
            ctx.mascot.mood('think');
            await ctx.say(r === 0 ? 'Listen! Who is it?' : ctx.pick(['Listen!', 'Shh… listen!', 'Listen again!']));
            if (quiz !== q || q.done || g !== gen) return;
            replay.classList.add('on');
            await playMystery(target);
            if (quiz !== q || q.done || g !== gen) return;
            ctx.say('Who made that sound?');
          })();
        });
        quiz = null;
        phase = 'between';
      }
      function quizOrder(n) {
        const ids = animals.slice();
        let order = [];
        while (order.length < n) order = order.concat(ctx.shuffle(ids));
        order = order.slice(0, n);
        for (let i = 2; i < order.length; i++) if (order[i] === order[i - 1] && order[i] === order[i - 2]) order[i] = ids.find((x) => x !== order[i]);
        return order;
      }

      /* ---------------- idle help ---------------- */
      ctx.idle(7000, () => {
        if (phase === 'explore' && explore) {
          const lazy = animals.find((x) => (explore.count[x.id] || 0) < explore.each) || ctx.pick(animals);
          glowOn(lazy);
          ctx.say(`Tap the ${lazy.def.name}!`);
        } else if (phase === 'quiz' && quiz && !quiz.done) {
          quiz.idles++;
          if (quiz.idles >= 2) glowOn(quiz.target);
          replayMystery();
        }
      });

      /* ---------------- main loop ---------------- */
      async function runStage(id) {
        setStage(id);
        const g = gen;
        phase = 'intro';
        ctx.setPrompt(STAGES[id].title);
        await ctx.wait(500);
        ctx.mascot.mood('wave');
        await ctx.say(STAGES[id].title);
        if (g !== gen) return;
        await runExplore();
        if (g !== gen) return;
        phase = 'between';
        await ctx.say(ctx.pick(['Now a guessing game!', "Let's play a game!", 'Now listen carefully!']));
        const lvl = ctx.level;
        const rounds = id === 'mixed' ? 3 : [2, 2, 2, 3, 4, 4][lvl];
        const order = quizOrder(rounds);
        for (let r = 0; r < rounds; r++) {
          await runQuizRound(r, order);
          await ctx.wait(350);
        }
        replay.classList.remove('on');
        await ctx.celebrate({ big: true, say: `${STAGES[id].title.replace('!', '')}! ${ctx.pick(['You did it!', 'Hooray!', 'Great listening!'])}` });
        await ctx.wait(300);
      }

      layout();
      ctx.onResize(layout);
      stage.__ab = {
        state: () => ({ stage: stageId, phase, target: quiz && !quiz.done ? quiz.target.id : null, animals: animals.map((a) => a.id), explore: explore && explore.total }),
        tap: (id) => { const an = animals.find((a) => a.id === id); if (an) onAnimal(an); },
        rect: (id) => { const an = animals.find((a) => a.id === id); return an && an.el.getBoundingClientRect().toJSON(); },
      };
      (async () => {
        let k = 0;
        while (ctx.alive) {
          const cycle = ['highlow', 'loudsoft', 'fastslow'].concat(ctx.level >= 4 ? ['mixed'] : []);
          await runStage(cycle[k % cycle.length]);
          k++;
        }
      })();
      return { destroy() { stopPerf(); stopMystery(); } };
    },
  });
})();
