/* Balloon Pop — colors.
 * Glossy balloons float up from behind the hills. Tap → POP! with shards in the balloon's color, the color word
 * floats up and is spoken. After a few free pops Pip asks for a color ("Can you pop a red balloon?") and shows a
 * balloon of that color in a speech bubble (visual matching cue). Other colors still pop and get named — no penalty.
 * Every 10 pops fills the garland at the top → BALLOON PARTY. Rare rainbow / star balloons give a sparkle shower.
 *
 * Level 1: 3 colors, 4 balloons on screen, slow, request after 5 pops, many target balloons.
 * Level 5: 10 colors, 7 balloons on screen, a bit quicker, requests every 2–3 pops, fewer target balloons.
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;
  const D = PP.data;

  const INK = '#2B2340';
  const BODY = 'M50 4 C 21 4 4 27 4 54 C 4 82 29 103 50 112 C 71 103 96 82 96 54 C 96 27 79 4 50 4 Z';
  function starPts(cx, cy, R, r) {
    const p = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r : R;
      p.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1));
    }
    return p.join(' ');
  }
  const STAR = starPts(50, 58, 50, 25);

  U.addDefs('balloons', `
    <radialGradient id="bp-shine" cx="34%" cy="26%" r="58%">
      <stop offset="0" stop-color="#fff" stop-opacity=".62"/><stop offset=".45" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bp-shade" cx="36%" cy="30%" r="78%">
      <stop offset=".55" stop-color="#1a0f33" stop-opacity="0"/><stop offset="1" stop-color="#1a0f33" stop-opacity=".34"/>
    </radialGradient>
    <linearGradient id="bp-rainbow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#EF3B36"/><stop offset=".17" stop-color="#EF3B36"/>
      <stop offset=".17" stop-color="#FF8C1A"/><stop offset=".33" stop-color="#FF8C1A"/>
      <stop offset=".33" stop-color="#FFD21F"/><stop offset=".5" stop-color="#FFD21F"/>
      <stop offset=".5" stop-color="#3DBE4B"/><stop offset=".67" stop-color="#3DBE4B"/>
      <stop offset=".67" stop-color="#2F7BEA"/><stop offset=".83" stop-color="#2F7BEA"/>
      <stop offset=".83" stop-color="#8E4FD6"/><stop offset="1" stop-color="#8E4FD6"/>
    </linearGradient>
    <linearGradient id="bp-gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFF3A6"/><stop offset=".35" stop-color="#FFD21F"/><stop offset=".7" stop-color="#F5B400"/><stop offset="1" stop-color="#FFE36B"/>
    </linearGradient>
    <radialGradient id="bp-sunglow" cx="50%" cy="50%" r="50%">
      <stop offset=".45" stop-color="#FFF6B0" stop-opacity=".9"/><stop offset="1" stop-color="#FFF6B0" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bp-sunbody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFE45C"/><stop offset="1" stop-color="#FFB627"/>
    </linearGradient>
  `);

  U.addStyles('balloons', `
    .g-balloons { background: linear-gradient(180deg, #49B3F2 0%, #86D2FF 38%, #C6ECFF 72%, #E6F7FF 100%); }
    .bp-sky, .bp-layer, .bp-front, .bp-fx { position: absolute; inset: 0; pointer-events: none; }
    .bp-sky { z-index: 1; }
    .bp-layer { z-index: 10; }
    .bp-front { z-index: 12; }
    .bp-fx { z-index: 30; overflow: hidden; }

    .bp-sun { position: absolute; pointer-events: auto; width: var(--sun); height: var(--sun);
      right: calc(var(--safe-r) - var(--sun) * .2); top: calc(var(--safe-t) - var(--sun) * .2); }
    .bp-sun svg { width: 100%; height: 100%; overflow: visible; display: block; }
    .bp-rays { transform-box: view-box; transform-origin: 100px 100px; animation: bp-spin 40s linear infinite; }
    .bp-sun.bp-happy .bp-rays { animation: bp-spin 1.2s cubic-bezier(.2,.8,.3,1) 1; }
    .bp-sunface { transform-box: view-box; transform-origin: 100px 100px; }
    .bp-sun.bp-happy .bp-sunface { animation: pp-yay .8s cubic-bezier(.3,1.6,.5,1); }
    @keyframes bp-spin { to { transform: rotate(360deg) } }

    .bp-cloud { position: absolute; left: 0; pointer-events: auto; will-change: transform; animation: bp-drift linear infinite; }
    .bp-cloud svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .bp-cloud .bp-puff { transform-box: fill-box; transform-origin: 50% 80%; }
    .bp-cloud.bp-squish .bp-puff { animation: bp-squish .5s cubic-bezier(.3,1.6,.5,1); }
    @keyframes bp-drift { from { transform: translateX(-30vw) } to { transform: translateX(115vw) } }
    @keyframes bp-squish { 0% { transform: scale(1) } 35% { transform: scale(1.18, .82) } 70% { transform: scale(.94, 1.06) } 100% { transform: scale(1) } }

    .bp-hills { position: absolute; left: 0; bottom: 0; width: 100%; display: block; }
    .bp-hills.back { height: 22%; }
    .bp-hills.front { height: 12%; }
    .bp-fl { position: absolute; width: var(--fl, 18px); height: calc(var(--fl, 18px) * 1.42); transform: translateX(-50%); }
    .bp-fl svg { width: 100%; height: 100%; display: block; overflow: visible; transform-origin: 50% 100%; animation: bp-sway 3s ease-in-out infinite alternate; }
    @keyframes bp-sway { from { transform: rotate(-6deg) } to { transform: rotate(6deg) } }

    .bp-b { position: absolute; left: 0; top: 0; will-change: transform; transform-origin: 50% 28%; }
    .bp-b > svg { display: block; width: 100%; height: 100%; overflow: visible; position: relative; }
    .bp-string { transform-box: fill-box; transform-origin: 50% 0; animation: bp-string 1.7s ease-in-out infinite alternate; }
    @keyframes bp-string { from { transform: skewX(7deg) } to { transform: skewX(-7deg) } }
    .bp-halo { position: absolute; left: -26%; top: -10%; width: 152%; height: 76%; border-radius: 50%; opacity: 0;
      background: radial-gradient(closest-side, rgba(255,246,150,1) 0%, rgba(255,232,80,.75) 52%, rgba(255,232,80,0) 100%); }
    .bp-b.bp-glow .bp-halo { animation: bp-halo 1s ease-in-out infinite; }
    @keyframes bp-halo { 0%, 100% { opacity: .55; transform: scale(.9) } 50% { opacity: 1; transform: scale(1.12) } }
    .bp-b.bp-nudge > svg { animation: pp-wiggle .6s ease 2; transform-origin: 50% 30%; }

    .bp-ring { position: absolute; border-radius: 50%; border: 6px solid #fff; pointer-events: none; }
    .bp-shard { position: absolute; pointer-events: none; will-change: transform, opacity; }
    .bp-dropstring { position: absolute; pointer-events: none; }
    .bp-dropstring svg { width: 100%; height: 100%; overflow: visible; display: block; }
    .bp-twinkle { position: absolute; pointer-events: none; font-size: 26px; line-height: 1; }

    .bp-garland { position: absolute; z-index: 20; left: 50%; top: calc(var(--safe-t) + 10px); transform: translateX(-50%);
      display: grid; justify-items: center; pointer-events: none; }
    .bp-slot { width: var(--slot); height: calc(var(--slot) * 1.45); display: block; }
    .bp-slot svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .bp-slot .bp-mini { transition: fill .2s; }
    .bp-slot.on > svg { animation: pp-yay .7s cubic-bezier(.3,1.6,.5,1); }
    .bp-slot.fly > svg { animation: bp-flyup 1.1s cubic-bezier(.4,0,.7,.4) forwards; }
    @keyframes bp-flyup { 0% { transform: translateY(0) } 15% { transform: translateY(6px) } 100% { transform: translateY(-140px) rotate(12deg); opacity: 0 } }

    .bp-ask { position: absolute; z-index: 44; pointer-events: auto; width: var(--ask); height: var(--ask);
      left: calc(var(--safe-l) + var(--pip) + 4px); bottom: calc(var(--safe-b) + var(--pip) * .55);
      transform-origin: 0% 100%; transform: scale(0); transition: transform .35s cubic-bezier(.3,1.6,.5,1); }
    .bp-ask.show { transform: scale(1); }
    .bp-ask.show.bp-bump { animation: bp-bump .5s cubic-bezier(.3,1.6,.5,1); }
    @keyframes bp-bump { 0% { transform: scale(1) } 40% { transform: scale(1.18) rotate(-4deg) } 100% { transform: scale(1) } }
    .bp-ask > svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .bp-ask .bp-askb { transform-box: fill-box; transform-origin: 50% 100%; animation: pp-bob 1.4s ease-in-out infinite; }
  `);

  function balloonMarkup(kind, c) {
    const str = '<path class="bp-string" d="M50 119 C 41 133, 59 147, 50 161 S 43 185, 50 198" stroke="rgba(70,70,110,.55)" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    if (kind === 'star') {
      return `<svg viewBox="0 0 100 200" aria-hidden="true">
        <path class="bp-string" d="M50 86 C 41 104, 59 122, 50 140 S 43 175, 50 196" stroke="rgba(70,70,110,.55)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <polygon points="${STAR}" fill="url(#bp-gold)" stroke="#D99A00" stroke-width="3" stroke-linejoin="round"/>
        <polygon points="${STAR}" fill="url(#bp-shine)"/>
        <path d="M30 40 L38 46" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/>
        <circle cx="45" cy="30" r="3" fill="#fff" opacity=".9"/>
        <path d="M50 52 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="#fff" opacity=".55"/>
      </svg>`;
    }
    const fill = kind === 'rainbow' ? 'url(#bp-rainbow)' : c.hex;
    const edge = kind === 'rainbow' ? 'rgba(60,40,90,.35)' : U.shade(c.hex, c.id === 'white' ? -0.25 : -0.3);
    const knot = kind === 'rainbow' ? '#8E4FD6' : c.dark;
    return `<svg viewBox="0 0 100 200" aria-hidden="true">
      ${str}
      <path d="M43 121 L50 110 L57 121 Q50 125 43 121 Z" fill="${knot}"/>
      <path d="${BODY}" fill="${fill}" stroke="${edge}" stroke-width="1.6"/>
      <path d="${BODY}" fill="url(#bp-shade)"/>
      <path d="${BODY}" fill="url(#bp-shine)"/>
      <ellipse cx="30" cy="36" rx="8" ry="15" transform="rotate(28 30 36)" fill="#fff" opacity=".72"/>
      <circle cx="41" cy="18" r="3.6" fill="#fff" opacity=".85"/>
      <path d="M74 86 Q82 76 84 64" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".28"/>
    </svg>`;
  }

  const MINI = 'M30 4 C 13 4 4 17 4 32 C 4 48 18 60 30 66 C 42 60 56 48 56 32 C 56 17 47 4 30 4 Z';
  function slotMarkup() {
    return `<svg viewBox="0 0 60 88" aria-hidden="true">
      <path d="M30 70 C 25 76, 35 80, 30 86" stroke="rgba(255,255,255,.85)" stroke-width="2" fill="none"/>
      <path class="bp-mini" d="${MINI}" fill="rgba(255,255,255,.35)" stroke="rgba(255,255,255,.95)" stroke-width="3" stroke-dasharray="6 5"/>
      <path class="bp-minishine" d="${MINI}" fill="url(#bp-shine)" opacity="0"/>
      <ellipse class="bp-minihl" cx="20" cy="22" rx="5" ry="9" transform="rotate(28 20 22)" fill="#fff" opacity="0"/>
    </svg>`;
  }

  const CLOUD = '<svg viewBox="0 0 220 110" aria-hidden="true"><g class="bp-puff"><path d="M38 96 C 10 96 6 64 30 58 C 26 32 58 20 76 36 C 84 10 128 6 140 34 C 160 20 192 30 188 58 C 214 60 214 96 186 96 Z" fill="#fff"/><path d="M40 92 C 70 100 150 100 184 92" stroke="#DCEFFF" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="88" cy="54" rx="22" ry="10" fill="#fff" opacity=".9"/></g></svg>';

  const SUN = `<svg viewBox="0 0 200 200" aria-hidden="true">
    <circle cx="100" cy="100" r="98" fill="url(#bp-sunglow)"/>
    <g class="bp-rays">${Array.from({ length: 12 }, (_, i) => `<path d="M100 8 L110 30 L90 30 Z" fill="#FFD84A" stroke="#FFC21F" stroke-width="4" stroke-linejoin="round" transform="rotate(${i * 30} 100 100)"/>`).join('')}</g>
    <g class="bp-sunface">
      <circle cx="100" cy="100" r="56" fill="url(#bp-sunbody)" stroke="#F7A91B" stroke-width="4"/>
      <ellipse cx="80" cy="76" rx="16" ry="9" fill="#fff" opacity=".45" transform="rotate(-28 80 76)"/>
      <path d="M74 98 Q82 90 90 98 M110 98 Q118 90 126 98" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M84 114 Q100 130 116 114" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="72" cy="114" rx="9" ry="6" fill="#FF8A6B" opacity=".55"/><ellipse cx="128" cy="114" rx="9" ry="6" fill="#FF8A6B" opacity=".55"/>
    </g></svg>`;

  function flowerMarkup(c) {
    return `<svg viewBox="0 0 24 34" aria-hidden="true"><path d="M12 33 V16" stroke="#3E9E50" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M12 26 Q5 22 4 17 Q10 18 12 24" fill="#5FC25A"/>` +
      `<circle cx="6.5" cy="11" r="5.5" fill="${c}"/><circle cx="17.5" cy="11" r="5.5" fill="${c}"/><circle cx="12" cy="5.5" r="5.5" fill="${c}"/><circle cx="12" cy="16.5" r="5.5" fill="${c}"/>` +
      `<circle cx="12" cy="11" r="4" fill="#FFB627"/></svg>`;
  }

  const PENTA = ['C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'D6', 'E6'];

  PP.registerGame({
    id: 'balloons',
    title: 'Balloons',
    domain: 'colors',
    icon: '🎈',
    tileColor: '#FF6B6B',
    order: 10,
    create(stage, ctx) {
      /* ---------------- scene ---------------- */
      const sky = ctx.el('div', { class: 'bp-sky' });
      const sun = ctx.html(`<div class="bp-sun">${SUN}</div>`);
      sky.appendChild(sun);
      const clouds = [];
      [[0.13, 70, -8, 1], [0.34, 95, -52, 0.75], [0.52, 82, -30, 0.95], [0.24, 120, -95, 0.6]].forEach(([top, dur, delay, sc]) => {
        const c = ctx.html(`<div class="bp-cloud">${CLOUD}</div>`);
        c.style.top = top * 100 + '%';
        c.style.animationDuration = dur + 's';
        c.style.animationDelay = delay + 's';
        c.dataset.sc = sc;
        clouds.push(c);
        sky.appendChild(c);
      });
      sky.appendChild(ctx.html(`<svg class="bp-hills back" viewBox="0 0 1200 220" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 120 C 140 40 300 50 420 110 C 540 160 640 60 800 70 C 950 80 1050 150 1200 100 V220 H0 Z" fill="#A6E39A"/>
        <path d="M0 160 C 180 100 360 120 520 160 C 700 200 860 110 1020 130 C 1100 140 1160 150 1200 150 V220 H0 Z" fill="#86D67A"/>
      </svg>`));
      const layer = ctx.el('div', { class: 'bp-layer' });
      const front = ctx.html(`<svg class="bp-hills front" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 50 C 200 10 380 30 600 52 C 820 74 1000 20 1200 40 V120 H0 Z" fill="#5FC25A"/>
        <path d="M0 78 C 260 56 520 70 760 84 C 940 94 1080 74 1200 70 V120 H0 Z" fill="#4CB04A"/>
      </svg>`);
      const frontWrap = ctx.el('div', { class: 'bp-front' });
      frontWrap.appendChild(front);
      ['#FF6FB5', '#FFD21F', '#fff', '#FF8C1A', '#C9A6F2', '#FF6FB5', '#fff', '#FFD21F', '#C9A6F2', '#FF8C1A'].forEach((c, i) => {
        const f = ctx.html(`<div class="bp-fl">${flowerMarkup(c)}</div>`);
        f.style.left = (14 + i * 8.6 + ((i * 37) % 5)) + '%';
        f.style.bottom = (1.2 + ((i * 7) % 5) * 1.1) + '%';
        f.firstChild.style.animationDelay = -(i % 5) * 0.6 + 's';
        frontWrap.appendChild(f);
      });
      const fxl = ctx.el('div', { class: 'bp-fx' });

      const garland = ctx.el('div', { class: 'bp-garland' });
      const slots = [];
      for (let i = 0; i < 10; i++) {
        const s = ctx.html(`<span class="bp-slot">${slotMarkup()}</span>`);
        slots.push(s);
        garland.appendChild(s);
      }
      const ask = ctx.html(`<div class="bp-ask"><svg viewBox="0 0 120 120" aria-hidden="true">
        <path d="M18 8 H106 Q116 8 116 18 V92 Q116 102 106 102 H34 L10 116 L18 98 Q8 96 8 86 V18 Q8 8 18 8 Z" fill="#fff" stroke="#D8E6F5" stroke-width="3" stroke-linejoin="round"/>
        <g class="bp-askb"><g transform="translate(36 12) scale(.5)"><path class="bp-askstr" d="M50 119 C 41 133, 59 147, 50 160" stroke="rgba(70,70,110,.55)" stroke-width="3" fill="none"/>
          <path class="bp-askknot" d="M43 121 L50 110 L57 121 Q50 125 43 121 Z" fill="#999"/>
          <path class="bp-askbody" d="${BODY}" fill="#999" stroke="rgba(0,0,0,.2)" stroke-width="2"/>
          <path d="${BODY}" fill="url(#bp-shade)"/><path d="${BODY}" fill="url(#bp-shine)"/>
          <ellipse cx="30" cy="36" rx="8" ry="15" transform="rotate(28 30 36)" fill="#fff" opacity=".72"/></g></g>
      </svg></div>`);
      stage.append(sky, layer, frontWrap, fxl, garland, ask);
      ctx.mascot.show({ corner: 'bl' });

      /* ---------------- layout ---------------- */
      let w = 0, h = 0, BW = 100;
      function layout() {
        const s = ctx.size();
        // on rotation, carry balloons over proportionally so none are stranded off-screen
        if (w && s.w && s.w !== w && typeof balloons !== 'undefined') {
          const kx = s.w / w;
          balloons.forEach((b) => { b.x0 = U.clamp(b.x0 * kx, s.w >= 500 ? 92 : 64, Math.max(0, s.w - b.W - 6)); });
        }
        w = s.w; h = s.h;
        const mn = Math.min(w, h);
        BW = U.clamp(mn * 0.165, 84, 138);
        const sunSize = U.clamp(mn * 0.27, 112, 230);
        stage.style.setProperty('--sun', sunSize + 'px');
        const pip = U.clamp(mn * 0.14, 80, 140);
        stage.style.setProperty('--pip', pip + 'px');
        stage.style.setProperty('--ask', U.clamp(mn * 0.22, 90, 140) + 'px');
        stage.style.setProperty('--fl', U.clamp(mn * 0.032, 16, 30) + 'px');
        clouds.forEach((c) => { const cw = U.clamp(mn * 0.3, 120, 260) * +c.dataset.sc; c.style.width = cw + 'px'; c.style.height = cw / 2 + 'px'; });
        // garland: one row when there is room, otherwise 2 rows of 5 — always clear of the home button and the sun
        const avail = Math.min(560, w - 2 * 104, w - 2 * (sunSize * 0.82));
        let cols = 10, slot = Math.min(50, avail / 10);
        if (slot < 30) { cols = 5; slot = Math.min(40, avail / 5); }
        garland.style.gridTemplateColumns = `repeat(${cols}, ${slot}px)`;
        garland.style.setProperty('--slot', slot * 0.88 + 'px');
        garland.style.rowGap = '2px';
      }
      layout();
      ctx.onResize(layout);

      /* ---------------- state ---------------- */
      const balloons = [];
      let t = 0, lastSpawn = -10, nextGap = 0.2, spawnCount = 0, lastColorId = '';
      let colors = D.colorsForLevel(ctx.level);
      let req = null, lastReqId = '', freePops = 0, reqAfter = [0, 5, 4, 3, 3, 2][ctx.level];
      let garlandN = 0, partyPending = false, partyUntil = 0, celebrating = false;
      let idleTalks = 0, lastSpecialAt = 0;
      const now = () => performance.now();
      const cap = U.cap;
      const lvl = () => ctx.level;
      const travelTime = () => U.clamp(4 + h / 150, 7, 12) * [1, 1.1, 1.05, 1, 0.94, 0.88][lvl()];
      const wantOnScreen = () => [4, 4, 5, 5, 6, 7][lvl()];

      function stagePt(e) { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, ox: r.left, oy: r.top }; }
      function vp(x, y) { const r = stage.getBoundingClientRect(); return { x: x + r.left, y: y + r.top }; }

      /* ---------------- balloons ---------------- */
      function chooseX(bw) {
        // keep clear of the home button's column (top-left) so reaching for a balloon never exits the game
        const lo = w >= 500 ? 92 : 64, hi = Math.max(lo + 1, w - bw - 6);
        let best = lo + Math.random() * (hi - lo), bestScore = -1;
        for (let k = 0; k < 8; k++) {
          const x = lo + Math.random() * (hi - lo);
          let d = 9999;
          balloons.forEach((b) => { if (b.y > h * 0.4) d = Math.min(d, Math.abs(b.x0 - x)); });
          if (d > bestScore) { bestScore = d; best = x; }
        }
        return best;
      }
      function chooseColor() {
        if (req) {
          const p = [0.6, 0.62, 0.55, 0.48, 0.42, 0.38][lvl()];
          if (Math.random() < p) return req.color;
        }
        const pool = colors.filter((c) => c.id !== lastColorId && (!req || c.id !== req.color.id));
        return ctx.pick(pool.length ? pool : colors);
      }
      function spawn(o) {
        o = o || {};
        let kind = o.kind || 'normal';
        if (!o.kind && !o.party && !req && spawnCount > 6 && t - lastSpecialAt > 18 && Math.random() < 0.09 &&
            !balloons.some((b) => b.kind !== 'normal')) {
          kind = Math.random() < 0.5 ? 'rainbow' : 'star';
          lastSpecialAt = t;
        }
        const color = kind === 'normal' ? o.color || chooseColor() : null;
        if (color) lastColorId = color.id;
        const bw = BW * (o.party ? U.rand(0.8, 0.95) : U.rand(0.94, 1.06));
        const el = ctx.html(`<div class="bp-b"><div class="bp-halo"></div>${balloonMarkup(kind, color)}</div>`);
        el.style.width = bw + 'px';
        el.style.height = bw * 2 + 'px';
        const str = el.querySelector('.bp-string');
        if (str) { str.style.animationDuration = U.rand(1.3, 2.1) + 's'; str.style.animationDelay = -U.rand(0, 2) + 's'; }
        const T = travelTime() * (o.party ? 0.5 : U.rand(0.9, 1.12)) * (kind === 'normal' ? 1 : 1.15);
        const b = {
          el, kind, color, W: bw, party: !!o.party,
          x0: o.x != null ? o.x : chooseX(bw), x: 0, y: h + (o.y0 || U.rand(0, bw * 0.2)),
          vy: (h + bw * 2.4) / T, amp: U.rand(8, 18) * (bw / 110), freq: U.rand(0.7, 1.3), phase: U.rand(0, 6.28), tilt: U.rand(3, 6),
          glow: false,
        };
        if (req && req.hinted && color && color.id === req.color.id) setGlow(b, true);
        balloons.push(b);
        layer.appendChild(el);
        place(b);
        spawnCount++;
        return b;
      }
      function place(b) {
        const s = Math.sin(t * b.freq + b.phase);
        b.x = b.x0 + b.amp * s;
        const rot = Math.cos(t * b.freq + b.phase) * b.tilt;
        b.el.style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg)`;
      }
      function setGlow(b, on) { b.glow = on; b.el.classList.toggle('bp-glow', on); }

      ctx.raf((dt) => {
        t += dt;
        const regular = balloons.filter((b) => !b.party).length;
        const want = wantOnScreen();
        if ((regular < want && t - lastSpawn > nextGap) || (regular < 2 && t - lastSpawn > 0.6)) {
          spawn();
          lastSpawn = t;
          nextGap = (travelTime() / want) * U.rand(0.7, 1.15);
        }
        for (let i = balloons.length - 1; i >= 0; i--) {
          const b = balloons[i];
          b.y -= b.vy * dt;
          place(b);
          if (b.y < -b.W * 2.3) { b.el.remove(); balloons.splice(i, 1); }
        }
      });

      /* ---------------- popping ---------------- */
      function popFx(b, cx, cy) {
        const cols = b.kind === 'rainbow' ? ['#EF3B36', '#FF8C1A', '#FFD21F', '#3DBE4B', '#2F7BEA', '#8E4FD6']
          : b.kind === 'star' ? ['#FFD21F', '#FFE985', '#F5B400', '#fff']
          : [b.color.hex, b.color.hex, b.color.light, b.color.dark];
        const ring = U.el('div', { class: 'bp-ring', style: { left: cx + 'px', top: cy + 'px', width: b.W * 1.15 + 'px', height: b.W * 1.15 + 'px', borderColor: b.kind === 'normal' && b.color.id !== 'white' ? U.shade(b.color.hex, 0.55) : '#fff' } });
        fxl.appendChild(ring);
        ring.animate([{ transform: 'translate(-50%,-50%) scale(.35)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.45)', opacity: 0 }], { duration: 340, easing: 'ease-out' }).onfinish = () => ring.remove();
        const n = 10;
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2 + Math.random() * 0.6;
          const dist = b.W * U.rand(0.5, 1.05);
          const sz = b.W * U.rand(0.1, 0.2);
          const sh = U.el('div', { class: 'bp-shard', style: {
            left: cx + 'px', top: cy + 'px', width: sz + 'px', height: sz * U.rand(0.5, 0.8) + 'px', background: cols[k % cols.length],
            borderRadius: `${U.randInt(30, 70)}% ${U.randInt(30, 70)}% ${U.randInt(20, 60)}% ${U.randInt(40, 80)}%`,
            boxShadow: b.color && b.color.id === 'white' ? 'inset 0 0 0 2px #C9CED6' : 'none',
          } });
          fxl.appendChild(sh);
          const rot = (Math.random() - 0.5) * 600;
          const ex = Math.cos(a) * dist, ey = Math.sin(a) * dist;
          sh.animate([
            { transform: 'translate(-50%,-50%) rotate(0deg) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${ex}px), calc(-50% + ${ey}px)) rotate(${rot * 0.6}deg) scale(1)`, opacity: 1, offset: 0.45 },
            { transform: `translate(calc(-50% + ${ex * 1.2}px), calc(-50% + ${ey + b.W * 0.9}px)) rotate(${rot}deg) scale(.5)`, opacity: 0 },
          ], { duration: U.rand(650, 900), easing: 'cubic-bezier(.12,.75,.35,1)' }).onfinish = () => sh.remove();
        }
        // the string flutters down
        const ds = U.el('div', { class: 'bp-dropstring', style: { left: b.x + 'px', top: b.y + 'px', width: b.W + 'px', height: b.W * 2 + 'px' } });
        ds.innerHTML = b.kind === 'star'
          ? '<svg viewBox="0 0 100 200"><path d="M50 86 C 41 104, 59 122, 50 140 S 43 175, 50 196" stroke="rgba(70,70,110,.55)" stroke-width="2.2" fill="none"/></svg>'
          : `<svg viewBox="0 0 100 200"><path d="M50 119 C 41 133, 59 147, 50 161 S 43 185, 50 198" stroke="rgba(70,70,110,.55)" stroke-width="2.2" fill="none"/><path d="M43 121 L50 110 L57 121 Q50 125 43 121 Z" fill="${b.color ? b.color.dark : '#8E4FD6'}"/></svg>`;
        fxl.appendChild(ds);
        const drift = (Math.random() - 0.5) * 60;
        ds.animate([
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${drift}px, ${b.W * 1.4}px) rotate(${drift / 3}deg)`, opacity: 0 },
        ], { duration: 900, easing: 'cubic-bezier(.5,0,.8,.6)' }).onfinish = () => ds.remove();
        const p = vp(cx, cy);
        PP.fx.confetti({ x: p.x, y: p.y, count: b.kind === 'normal' ? 16 : 50, colors: cols, power: b.kind === 'normal' ? 0.5 : 0.8, spread: 2 });
      }

      function pop(b) {
        const i = balloons.indexOf(b);
        if (i < 0) return;
        balloons.splice(i, 1);
        const cx = b.x + b.W * 0.5, cy = b.y + b.W * 0.58;
        b.el.remove();
        ctx.sfx('pop', { pan: U.clamp((cx / Math.max(1, w)) * 2 - 1, -0.7, 0.7) * 0.8, vel: 0.9 });
        popFx(b, cx, cy);
        const p = vp(cx, cy);
        const fs = U.clamp(b.W * 0.5, 40, 66);

        if (b.kind !== 'normal') {
          ctx.sfx('magic');
          PP.fx.burst(p.x, p.y, { emoji: ['✨', '⭐', '🌟', '💫'], count: 14, distance: b.W * 1.7, size: U.clamp(b.W * 0.36, 30, 48) });
          for (let k = 0; k < 6; k++) ctx.setTimeout(() => {
            const sp = vp(U.clamp(cx + U.rand(-1.4, 1.4) * b.W, 20, w - 20), U.clamp(cy + U.rand(-1, 0.6) * b.W, 60, h - 20));
            PP.fx.burst(sp.x, sp.y, { emoji: ['✨', '⭐'], count: 4, distance: 50, size: 26 });
          }, 120 + k * 110);
          PP.fx.floatText(p.x, p.y - b.W * 0.2, b.kind === 'star' ? '⭐' : '🌈', { size: fs * 1.3 });
          if (!req && !celebrating) ctx.say(b.kind === 'star' ? ctx.pick(['A star!', 'Twinkle twinkle!', 'Star sparkles!']) : ctx.pick(['Rainbow!', 'A rainbow balloon!', 'Wow, rainbow!']));
          ctx.mascot.mood('surprise');
        } else {
          PP.fx.floatText(p.x, p.y - b.W * 0.25, cap(b.color.name) + '!', { color: b.color.hex, size: fs });
        }
        if (!b.party) addGarland(b);

        if (b.kind === 'normal' && req && b.color.id === req.color.id) { reqSuccess(b, p); return; }
        if (b.kind !== 'normal') return;
        if (req) {
          if (now() - req.t0 > 1500) req.others++;
          if (req.others && req.others % 3 === 0 && !celebrating) {
            ctx.say(`That's ${b.color.name}! Pop ${req.color.name}!`);
            req.lastSay = now();
            hint();
          } else {
            ctx.say(cap(b.color.name) + '!', { mode: 'skip' });
            if (req.others >= 2) hint();
          }
          return;
        }
        if (!celebrating) ctx.say(cap(b.color.name) + '!', { mode: 'skip' });
        if (now() < partyUntil) return;
        freePops++;
        if (freePops >= reqAfter && !partyPending && !celebrating) {
          freePops = -999; // until the request starts
          ctx.setTimeout(() => { if (!startRequest()) freePops = reqAfter - 1; }, 900);
        }
      }

      /* ---------------- garland & party ---------------- */
      function addGarland(b) {
        if (garlandN >= 10) return;
        const s = slots[garlandN++];
        const fill = b.kind === 'rainbow' ? 'url(#bp-rainbow)' : b.kind === 'star' ? 'url(#bp-gold)' : b.color.hex;
        const body = s.querySelector('.bp-mini');
        body.setAttribute('fill', fill);
        body.setAttribute('stroke', b.color ? U.shade(b.color.hex, -0.25) : 'rgba(0,0,0,.2)');
        body.setAttribute('stroke-dasharray', 'none');
        body.setAttribute('stroke-width', '2');
        s.querySelector('.bp-minishine').setAttribute('opacity', '1');
        s.querySelector('.bp-minihl').setAttribute('opacity', '.75');
        s.classList.remove('on'); void s.offsetWidth; s.classList.add('on');
        ctx.play('bell', PENTA[(garlandN - 1) % PENTA.length], { vel: 0.22, delay: 0.05 });
        if (garlandN >= 10) {
          partyPending = true;
          if (!req && !celebrating) ctx.setTimeout(party, 500);
        }
      }
      function resetGarland() {
        garlandN = 0;
        slots.forEach((s) => {
          s.classList.remove('on', 'fly');
          const body = s.querySelector('.bp-mini');
          body.setAttribute('fill', 'rgba(255,255,255,.35)');
          body.setAttribute('stroke', 'rgba(255,255,255,.95)');
          body.setAttribute('stroke-dasharray', '6 5');
          body.setAttribute('stroke-width', '3');
          s.querySelector('.bp-minishine').setAttribute('opacity', '0');
          s.querySelector('.bp-minihl').setAttribute('opacity', '0');
        });
      }
      function party() {
        if (!partyPending) return;
        partyPending = false;
        partyUntil = now() + 5000;
        freePops = Math.min(freePops, 0);
        ctx.say(ctx.pick(['Balloon party!', 'Hooray! Balloon party!']));
        ctx.mascot.mood('cheer');
        ctx.sfx('tada');
        ctx.sequence([['C5', 0.5], ['E5', 0.5], ['G5', 0.5], ['C6', 0.5], ['G5', 0.5], ['C6', 1.5]], { bpm: 300, inst: 'xylo', vel: 0.5 });
        slots.forEach((s, i) => ctx.setTimeout(() => { s.classList.remove('on'); s.classList.add('fly'); }, i * 50));
        ctx.setTimeout(resetGarland, 1500);
        const pal = D.RAINBOW;
        const n = w > 700 ? 16 : 11;
        const order = ctx.shuffle(Array.from({ length: n }, (_, i) => i));
        order.forEach((slot, k) => {
          ctx.setTimeout(() => {
            const lo = w >= 500 ? 92 : 64;
            const x = lo + (slot + 0.5) * ((w - lo - BW * 0.9) / n) + U.rand(-10, 10);
            spawn({ party: true, x: U.clamp(x, lo, w - BW), color: pal[(slot + k) % pal.length], y0: U.rand(0, 60) });
          }, k * 85);
        });
        const a = vp(w * 0.15, h), c = vp(w * 0.85, h);
        PP.fx.confetti({ x: a.x, y: a.y, count: 60, power: 1.1 });
        PP.fx.confetti({ x: c.x, y: c.y, count: 60, power: 1.1 });
      }

      /* ---------------- requests ("Can you pop a red balloon?") ---------------- */
      function setAsk(color) {
        if (!color) { ask.classList.remove('show', 'bp-bump'); return; }
        ask.querySelector('.bp-askbody').setAttribute('fill', color.hex);
        ask.querySelector('.bp-askbody').setAttribute('stroke', U.shade(color.hex, -0.3));
        ask.querySelector('.bp-askknot').setAttribute('fill', color.dark);
        ask.classList.add('show');
      }
      function bumpAsk() { ask.classList.remove('bp-bump'); void ask.offsetWidth; ask.classList.add('bp-bump'); }
      function ensureTargets(n) {
        if (!req) return;
        const have = balloons.filter((b) => b.color && b.color.id === req.color.id && b.y > h * 0.3 && !b.party).length;
        for (let k = have; k < n; k++) ctx.setTimeout(() => { if (req) { spawn({ color: req.color }); lastSpawn = t; } }, (k - have) * 650);
      }
      function hint() {
        if (!req) return;
        req.hinted = true;
        balloons.forEach((b) => { if (b.color && b.color.id === req.color.id) setGlow(b, true); });
        bumpAsk();
      }
      function clearHint() { balloons.forEach((b) => { if (b.glow) setGlow(b, false); }); }

      function startRequest() {
        if (req || celebrating || partyPending || now() < partyUntil || !ctx.alive) return false;
        colors = D.colorsForLevel(ctx.level);
        const pool = colors.filter((c) => c.id !== lastReqId);
        const color = ctx.pick(pool.length ? pool : colors);
        lastReqId = color.id;
        req = { color, t0: now(), lastSay: now(), says: 1, others: 0, hinted: false };
        const c = color.name;
        ctx.setPrompt(`Pop a ${c} balloon!`);
        ctx.say(ctx.pick([`Can you pop a ${c} balloon?`, `Pop a ${c} balloon!`, `Can you find ${c}? Pop it!`]));
        ctx.mascot.mood('wave');
        setAsk(color);
        ensureTargets(lvl() <= 2 ? 2 : 1);
        return true;
      }
      async function reqSuccess(b, p) {
        const r = req;
        req = null;
        clearHint();
        setAsk(null);
        const firstTry = r.others === 0 && !r.hinted;
        celebrating = true;
        ctx.success(firstTry);
        PP.fx.burst(p.x, p.y, { emoji: ['⭐', '🌟', '✨'], count: 9, distance: 140 });
        const C = cap(r.color.name);
        await ctx.celebrate({ x: p.x, y: p.y, colors: [r.color.hex, r.color.light, r.color.dark, '#FFE45C', '#fff'],
          say: ctx.pick([`Yay! ${C}!`, `You popped ${r.color.name}!`, `${C}! ${ctx.praise()}`, `${ctx.praise()} A ${r.color.name} balloon!`]) });
        celebrating = false;
        colors = D.colorsForLevel(ctx.level);
        freePops = 0;
        reqAfter = ctx.randInt.apply(null, [[0, 0], [3, 5], [3, 4], [2, 4], [2, 3], [2, 3]][ctx.level]);
        ctx.setPrompt('Pop the balloons!');
        if (partyPending) ctx.setTimeout(party, 300);
      }
      function giveUp() {
        const r = req;
        req = null;
        clearHint();
        setAsk(null);
        if (r.others >= 2) ctx.miss();
        freePops = 0;
        reqAfter = [0, 6, 5, 4, 4, 3][ctx.level];
        ctx.setPrompt('Pop the balloons!');
        if (r.others > 0) ctx.say(ctx.pick(['Pop them all!', 'Pop, pop, pop!']));
        if (partyPending) ctx.setTimeout(party, 600);
      }

      ctx.setInterval(() => {
        if (!req || celebrating) return;
        const n = now();
        if (n - req.lastSay > 7000 && !PP.speech.speaking() && !PP.app.overlayPromise) {
          if (req.says >= 3) { giveUp(); return; }
          req.says++;
          req.lastSay = n;
          const c = req.color.name;
          ctx.say(ctx.pick([`${cap(c)}! Pop a ${c} balloon!`, `Look! ${cap(c)} balloons! Pop one!`, `Where's ${c}? Pop it!`]));
          hint();
          ensureTargets(2);
        }
      }, 300);

      /* ---------------- touch ---------------- */
      function skyTap(e, pt) {
        const tgt = e.target;
        const p = vp(pt.x, pt.y);
        if (tgt && tgt.closest && tgt.closest('.bp-sun')) {
          sun.classList.remove('bp-happy'); void sun.offsetWidth; sun.classList.add('bp-happy');
          ctx.sfx('twinkle');
          ctx.say(ctx.pick(['Hello, sun!', 'Sunny!', 'The sun!']), { mode: 'skip' });
          PP.fx.burst(p.x, p.y, { emoji: ['✨', '🌟'], count: 6, distance: 70, size: 30 });
          return;
        }
        const cl = tgt && tgt.closest && tgt.closest('.bp-cloud');
        if (cl) {
          cl.classList.remove('bp-squish'); void cl.offsetWidth; cl.classList.add('bp-squish');
          ctx.sfx('bubble');
          ctx.play('kalimba', ctx.pick(['C5', 'E5', 'G5']), { vel: 0.35 });
          return;
        }
        ctx.play('bell', ctx.pick(PENTA), { vel: 0.18 });
        const tw = U.el('div', { class: 'bp-twinkle pp-emoji', text: ctx.pick(['✨', '⭐', '💫']), style: { left: pt.x + 'px', top: pt.y + 'px' } });
        fxl.appendChild(tw);
        tw.animate([
          { transform: 'translate(-50%,-50%) scale(.2) rotate(-40deg)', opacity: 1 },
          { transform: 'translate(-50%,-90%) scale(1.1) rotate(10deg)', opacity: 1, offset: 0.4 },
          { transform: 'translate(-50%,-160%) scale(.6) rotate(30deg)', opacity: 0 },
        ], { duration: 700, easing: 'ease-out' }).onfinish = () => tw.remove();
      }

      ctx.on(stage, 'pointerdown', (e) => {
        if (e.button > 0) return;
        const tgt = e.target;
        if (tgt && tgt.closest && tgt.closest('.pp-game-pip')) return;
        e.preventDefault();
        idleTalks = 0;
        const pt = stagePt(e);
        if (tgt && tgt.closest && tgt.closest('.bp-ask') && req) {
          bumpAsk();
          ctx.sfx('boing', { vel: 0.4 });
          ctx.say(`${cap(req.color.name)}! Pop a ${req.color.name} balloon!`);
          req.lastSay = now();
          return;
        }
        let best = null, bd = 1;
        for (const b of balloons) {
          const cx = b.x + b.W * 0.5, cy = b.y + b.W * 0.64;
          const dx = (pt.x - cx) / (b.W * 0.64), dy = (pt.y - cy) / (b.W * 0.78);
          const d = dx * dx + dy * dy;
          if (d <= bd) { bd = d; best = b; }
        }
        if (best) pop(best);
        else skyTap(e, pt);
      });

      ctx.idle(9000, () => {
        if (req || celebrating) return;
        idleTalks++;
        const mid = balloons.filter((b) => !b.party && b.y > h * 0.2 && b.y < h * 0.7);
        const b = mid.length ? ctx.pick(mid) : null;
        if (b) { b.el.classList.remove('bp-nudge'); void b.el.offsetWidth; b.el.classList.add('bp-nudge'); }
        if (idleTalks <= 3) {
          ctx.mascot.mood('wave');
          ctx.say(ctx.pick(['Pop a balloon!', 'Tap a balloon! Pop!', 'Pop! Pop! Can you pop one?']));
        }
      });

      /* ---------------- start ---------------- */
      ctx.setPrompt('Pop the balloons!');
      ctx.say(ctx.pick(['Pop the balloons!', "Balloons! Let's pop them!"]));
      // a first few balloons already on their way
      for (let k = 0; k < 3; k++) {
        const b = spawn();
        b.y = h * (0.55 + k * 0.17);
      }
      lastSpawn = 0;

      if (/[?&]ppdebug/.test(location.search)) window.__bp = { spawn, startRequest, party: () => { partyPending = true; party(); }, get req() { return req; }, balloons };
      return { destroy() { if (window.__bp) delete window.__bp; } };
    },
  });
})();
