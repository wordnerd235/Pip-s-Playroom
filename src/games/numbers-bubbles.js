/* Number Bubbles — numeral recognition under the sea.
 *
 * Translucent bubbles with big numerals wobble up from the seabed. Every pop says the number.
 * Pip asks "Pop number two!" — that number is frequent (always at least one on screen), the target is
 * also shown on a buoy at the surface, and popping it earns a small celebration. Other numbers still pop
 * and get named (errorless: after 2 other pops the right bubbles glow).
 * From level 2, every few successes a "How many fish?" round: a school of 2–5 fish swims in, Pip counts
 * them with the child (fish light up one by one), then 2–3 numeral bubbles are offered.
 * Fish friends dart away when tapped; the octopus blows bubbles; tapping the water makes little bubbles.
 *
 * Range: L1 1–3 · L2 1–4 · L3 1–6 · L4 1–8 · L5 1–10.
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;
  const NUM = PP.data.NUMBERS;
  const Word = (n) => U.cap(NUM[n] || String(n));
  const MAX = [3, 3, 4, 6, 8, 10];
  const SCALE = ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6', 'D6', 'E6'];
  const TINTS = ['255,111,181', '120,170,255', '90,220,140', '190,140,255', '255,200,60', '60,220,220'];

  U.addStyles('bubbles', `
    .g-bubbles { background: linear-gradient(#3EC3EE 0%, #2AA3DD 30%, #1C7CC4 65%, #175EA6 100%); }
    .bb-layer { position: absolute; inset: 0; pointer-events: none; }
    .bb-probe { position: absolute; left: var(--safe-l); top: var(--safe-t); right: var(--safe-r); bottom: var(--safe-b); pointer-events: none; visibility: hidden; }
    .bb-art { position: absolute; pointer-events: none; }
    .bb-art > svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .bb-sky { position: absolute; left: 0; right: 0; top: 0; background: linear-gradient(#A9E8FF, #DDF7FF); }
    .bb-wave { position: absolute; left: 0; height: 30px; width: 200%; animation: bb-wave 7s linear infinite; }
    .bb-wave svg { width: 100%; height: 100%; display: block; }
    @keyframes bb-wave { from { transform: translateX(0) } to { transform: translateX(-50%) } }
    .bb-ray { position: absolute; top: 0; width: 16%; transform-origin: 50% 0;
      background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.3) 50%, rgba(255,255,255,0));
      -webkit-mask-image: linear-gradient(#000, rgba(0,0,0,0)); mask-image: linear-gradient(#000, rgba(0,0,0,0));
      animation: bb-ray 6s ease-in-out infinite; }
    @keyframes bb-ray { 0%, 100% { opacity: .35 } 50% { opacity: 1 } }
    .bb-weed { transform-origin: 50% 100%; animation: bb-sway 4.5s ease-in-out infinite; }
    @keyframes bb-sway { 0%, 100% { transform: rotate(-6deg) } 50% { transform: rotate(6deg) } }
    @keyframes bb-bob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-7%) } }
    @keyframes bb-jelly { 0%, 100% { transform: scale(1, 1) } 25% { transform: scale(1.05, .95) } 50% { transform: scale(.97, 1.03) } 75% { transform: scale(1.03, .97) } }

    /* number bubbles */
    .bb-bubble { position: absolute; left: 0; top: 0; pointer-events: auto; border-radius: 50%; will-change: transform; }
    .bb-bubble::before { content: ""; position: absolute; inset: -8%; border-radius: 50%; }
    .bb-wob { position: absolute; inset: 0; border-radius: 50%; animation: bb-jelly 2.2s ease-in-out infinite; }
    .bb-skin { position: absolute; inset: 0; border-radius: 50%;
      background: radial-gradient(circle at 50% 55%, rgba(255,255,255,.08) 0 52%, rgba(var(--t),.28) 70%, rgba(255,255,255,.62) 94%, rgba(255,255,255,.9) 100%);
      box-shadow: inset 0 0 0 2px rgba(255,255,255,.75), inset -6px -10px 18px rgba(var(--t),.45), 0 6px 18px rgba(10,40,90,.18); }
    .bb-shine { position: absolute; left: 17%; top: 13%; width: 26%; height: 17%; border-radius: 50%; background: rgba(255,255,255,.85); transform: rotate(-35deg); }
    .bb-shine2 { position: absolute; right: 20%; bottom: 16%; width: 9%; height: 9%; border-radius: 50%; background: rgba(255,255,255,.6); }
    .bb-num { position: absolute; inset: 0; display: grid; place-items: center; font-weight: 900; line-height: 1; color: #fff;
      font-size: calc(var(--d) * .54); -webkit-text-stroke: calc(var(--d) * .035) #1D3B7A; paint-order: stroke fill; text-shadow: 0 calc(var(--d) * .03) 0 rgba(20,40,90,.35); padding-bottom: 4%; }
    .bb-num.two { font-size: calc(var(--d) * .44); letter-spacing: -.04em; }
    .bb-bubble.bb-in .bb-wob { animation: bb-in .5s cubic-bezier(.3,1.6,.5,1) both; }
    @keyframes bb-in { from { transform: scale(.2) } to { transform: scale(1) } }
    .bb-wob.pp-glow { border-radius: 50%; }
    .bb-drop { position: absolute; width: 12px; height: 12px; margin: -6px 0 0 -6px; border-radius: 50%; background: rgba(255,255,255,.9); pointer-events: none; }
    .bb-mini { position: absolute; border-radius: 50%; pointer-events: none;
      background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.9) 0 18%, rgba(255,255,255,.15) 45%, rgba(255,255,255,.55) 90%); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.7); }

    /* buoy badge with the target numeral */
    .bb-badge { position: absolute; z-index: 55; left: 50%; pointer-events: auto; transform: translateX(-50%); }
    .bb-badge-in { position: relative; width: 100%; height: 100%; animation: bb-bob 2.6s ease-in-out infinite; }
    .bb-badge svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
    .bb-badge .bb-num { color: #1D3B7A; -webkit-text-stroke: 0; text-shadow: none; font-size: calc(var(--d) * .5); padding-bottom: 2%; }
    .bb-badge.hide { opacity: 0; transform: translateX(-50%) scale(.4); transition: opacity .3s, transform .3s; }
    .bb-badge.pulse .bb-badge-in { animation: bb-badgepop .6s cubic-bezier(.3,1.7,.5,1); }
    @keyframes bb-badgepop { 0% { transform: scale(.4) rotate(-20deg) } 100% { transform: scale(1) rotate(0) } }

    /* fish & friends */
    .bb-fish { position: absolute; left: 0; top: 0; pointer-events: auto; will-change: transform; }
    .bb-fish::before { content: ""; position: absolute; inset: -10%; border-radius: 50%; }
    .bb-fish .bb-body { position: absolute; inset: 0; transition: transform .3s; }
    .bb-fish.flip .bb-body { transform: scaleX(-1); }
    .bb-fish .bb-swim { position: absolute; inset: 0; animation: bb-bob 1.8s ease-in-out infinite; }
    .bb-tail { transform-box: fill-box; transform-origin: 100% 50%; animation: bb-tail .5s ease-in-out infinite alternate; }
    @keyframes bb-tail { from { transform: scaleY(1) skewY(-6deg) } to { transform: scaleY(.8) skewY(6deg) } }
    .bb-fish.dart .bb-tail { animation-duration: .12s; }
    .bb-fish.hl .bb-swim { animation: bb-hl .6s cubic-bezier(.3,1.6,.5,1); }
    @keyframes bb-hl { 0% { transform: scale(1) } 40% { transform: scale(1.3) translateY(-10%) } 100% { transform: scale(1) } }
    .bb-fish.lit .bb-ring { opacity: 1; }
    .bb-ring { position: absolute; inset: -14% -8%; border-radius: 50%; border: 3px solid rgba(255,244,170,.9);
      background: radial-gradient(closest-side, rgba(255,236,120,.45), rgba(255,236,120,.12) 70%, rgba(255,236,120,0)); box-shadow: 0 0 22px rgba(255,236,120,.7); opacity: 0; transition: opacity .25s; pointer-events: none; }
    .bb-octo { pointer-events: auto; }
    .bb-octo .bb-arm { transform-box: fill-box; transform-origin: 50% 0; animation: bb-sway 1.6s ease-in-out infinite; }
    .bb-octo .bb-octo-in { width: 100%; height: 100%; animation: bb-bob 3s ease-in-out infinite; }
    .bb-choice { position: absolute; pointer-events: auto; border-radius: 50%; }
    .bb-choice::before { content: ""; position: absolute; inset: -8%; border-radius: 50%; }
    .bb-choice .bb-float { position: absolute; inset: 0; animation: bb-bob 2.2s ease-in-out infinite; }
    .bb-choice.bb-in .bb-wob { animation: bb-in .5s cubic-bezier(.3,1.6,.5,1) both; }
    .bb-choice.wig .bb-float { animation: pp-wiggle .5s ease both; }
  `);

  /* ---------------- art ---------------- */
  const FISH = (body, fin, stripe, face) => `<svg viewBox="0 0 120 84">
    <g class="bb-tail"><path d="M24 42 C 14 30, 6 20, 2 16 C 6 30, 6 54, 2 68 C 8 64, 16 54, 24 42 Z" fill="${fin}"/></g>
    <path d="M52 12 C 60 0, 80 0, 86 12 C 74 14, 62 14, 52 12 Z" fill="${fin}"/>
    <ellipse cx="66" cy="44" rx="46" ry="32" fill="${body}"/>
    ${stripe ? `<path d="M44 16 C 36 32, 36 56, 44 72" stroke="${stripe}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".9"/><path d="M62 12 C 56 32, 56 56, 62 76" stroke="${stripe}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>` : ''}
    <path d="M60 54 C 64 66, 76 68, 80 60 C 74 56, 66 54, 60 54 Z" fill="${fin}"/>
    <ellipse cx="54" cy="30" rx="14" ry="6" fill="#fff" opacity=".35" transform="rotate(-15 54 30)"/>
    <circle cx="90" cy="36" r="10" fill="#fff"/><circle cx="92" cy="37" r="6" fill="#2B2340"/><circle cx="94.5" cy="34.5" r="2.2" fill="#fff"/>
    <path d="M104 52 q-6 5 -12 0" stroke="#2B2340" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <ellipse cx="86" cy="52" rx="5" ry="3" fill="${face || '#FF8A80'}" opacity=".75"/></svg>`;
  const FRIENDS = [
    FISH('#FFD23F', '#FF9F1C', '#fff'),
    FISH('#FF8A3D', '#FFFFFF', '#fff', '#FF5A5A'),
    FISH('#7AE0B8', '#3BB58A', null),
  ];
  const SCHOOL = FISH('#FF7AA2', '#FFC93C', '#FFD6E2');
  const OCTO = `<svg viewBox="0 0 140 130"><g class="bb-octo-in">
    <g stroke="#A855D8" stroke-width="13" stroke-linecap="round" fill="none">
      <path class="bb-arm" d="M34 84 C 22 98, 22 112, 10 116"/><path d="M50 90 C 44 106, 44 118, 36 124"/><path d="M70 92 C 70 108, 72 118, 66 126"/>
      <path d="M90 90 C 96 106, 96 118, 104 124"/><path class="bb-arm" style="animation-delay:-.8s" d="M106 84 C 118 98, 118 112, 130 116"/></g>
    <path d="M70 6 C 110 6, 126 38, 122 66 C 120 86, 100 94, 70 94 C 40 94, 20 86, 18 66 C 14 38, 30 6, 70 6 Z" fill="#C77DFF"/>
    <g fill="#E0B3FF" opacity=".8"><circle cx="46" cy="30" r="6"/><circle cx="96" cy="26" r="4.5"/><circle cx="104" cy="44" r="3.5"/></g>
    <ellipse cx="54" cy="56" rx="12" ry="14" fill="#fff"/><ellipse cx="86" cy="56" rx="12" ry="14" fill="#fff"/>
    <circle cx="56" cy="58" r="7" fill="#2B2340"/><circle cx="88" cy="58" r="7" fill="#2B2340"/><circle cx="58.5" cy="55" r="2.6" fill="#fff"/><circle cx="90.5" cy="55" r="2.6" fill="#fff"/>
    <path d="M62 76 q8 7 16 0" stroke="#5A2A6A" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <ellipse cx="40" cy="72" rx="7" ry="4" fill="#FF7AB0" opacity=".7"/><ellipse cx="100" cy="72" rx="7" ry="4" fill="#FF7AB0" opacity=".7"/></g></svg>`;
  const WEED = (c1, c2) => `<svg viewBox="0 0 50 200" preserveAspectRatio="none"><g class="bb-weed">
    <path d="M24 200 C 8 160, 38 130, 20 92 C 6 60, 34 30, 22 0 C 40 30, 26 60, 34 92 C 46 130, 18 160, 32 200 Z" fill="${c1}"/>
    <path d="M27 196 C 20 160, 36 132, 26 96 C 20 70, 30 44, 25 20" stroke="${c2}" stroke-width="3" fill="none" opacity=".7"/></g></svg>`;
  const CORAL = `<svg viewBox="0 0 120 110"><g fill="#FF7A8A">
    <path d="M58 110 C 56 80, 50 60, 34 44 C 28 38, 32 30, 40 34 C 52 42, 58 56, 62 70 C 64 54, 66 34, 60 18 C 58 10, 66 6, 70 14 C 76 30, 74 52, 70 70 C 78 56, 88 44, 100 38 C 108 34, 112 42, 106 48 C 92 58, 80 76, 74 110 Z"/>
    <circle cx="38" cy="36" r="7"/><circle cx="64" cy="14" r="7"/><circle cx="104" cy="42" r="7"/></g>
    <g fill="#FFB0BA"><circle cx="36" cy="34" r="2.5"/><circle cx="62" cy="12" r="2.5"/><circle cx="102" cy="40" r="2.5"/></g></svg>`;
  const STARFISH = `<svg viewBox="0 0 100 100"><path d="M50 6 C 56 6, 58 30, 62 36 C 68 40, 94 36, 96 42 C 98 48, 76 60, 74 66 C 74 74, 86 94, 80 98 C 74 100, 56 84, 50 84 C 44 84, 26 100, 20 98 C 14 94, 26 74, 26 66 C 24 60, 2 48, 4 42 C 6 36, 32 40, 38 36 C 42 30, 44 6, 50 6 Z" fill="#FFB347"/>
    <g fill="#FFE0A8"><circle cx="50" cy="30" r="3"/><circle cx="50" cy="52" r="4"/><circle cx="74" cy="46" r="3"/><circle cx="26" cy="46" r="3"/><circle cx="64" cy="76" r="3"/><circle cx="36" cy="76" r="3"/></g></svg>`;
  const SHELL = `<svg viewBox="0 0 100 80"><path d="M50 76 C 20 76, 4 56, 8 36 C 12 14, 36 4, 50 4 C 64 4, 88 14, 92 36 C 96 56, 80 76, 50 76 Z" fill="#FFC6D9"/>
    <g stroke="#F49AB8" stroke-width="4" fill="none" stroke-linecap="round"><path d="M50 74 V 10"/><path d="M50 74 C 34 60, 24 40, 26 16"/><path d="M50 74 C 66 60, 76 40, 74 16"/><path d="M50 74 C 24 66, 12 50, 12 36"/><path d="M50 74 C 76 66, 88 50, 88 36"/></g>
    <path d="M40 74 h20 v6 h-20 z" fill="#F49AB8"/></svg>`;
  function sandSVG() {
    let peb = '';
    for (let i = 0; i < 26; i++) peb += `<circle cx="${(i * 37 + 11) % 400}" cy="${42 + ((i * 13) % 50)}" r="${1.5 + (i % 3)}" fill="#E2B56E" opacity=".7"/>`;
    return `<svg viewBox="0 0 400 100" preserveAspectRatio="none"><path d="M0 22 C 60 6, 120 26, 190 16 C 260 6, 330 24, 400 14 V100 H0 Z" fill="#F4D49A"/>
      <path d="M0 44 C 80 30, 150 50, 230 40 C 300 32, 360 46, 400 40 V100 H0 Z" fill="#EEC57E"/>${peb}</svg>`;
  }
  const WAVE = (() => {
    let d = 'M0 14';
    for (let i = 0; i < 16; i++) d += ` Q ${i * 50 + 25} ${i % 2 ? 26 : 2}, ${i * 50 + 50} 14`;
    return `<svg viewBox="0 0 800 30" preserveAspectRatio="none"><path d="${d} V30 H0 Z" fill="#3EC3EE"/><path d="${d}" stroke="#fff" stroke-width="3" fill="none" opacity=".85"/></svg>`;
  })();
  const BUOY = `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="94" rx="40" ry="6" fill="rgba(10,60,110,.25)"/>
    <circle cx="50" cy="50" r="46" fill="#fff"/>
    <path d="M50 4 A46 46 0 0 1 96 50 L82 50 A32 32 0 0 0 50 18 Z" fill="#FF5A5A"/>
    <path d="M50 96 A46 46 0 0 1 4 50 L18 50 A32 32 0 0 0 50 82 Z" fill="#FF5A5A"/>
    <circle cx="50" cy="50" r="33" fill="#FFFDF4" stroke="#E8E2D0" stroke-width="2"/>
    <ellipse cx="30" cy="24" rx="10" ry="5" fill="#fff" opacity=".7" transform="rotate(-35 30 24)"/></svg>`;

  PP.registerGame({
    id: 'bubbles',
    title: 'Bubbles',
    domain: 'numbers',
    icon: `<svg viewBox="0 0 100 100"><defs><radialGradient id="bb-ic" cx="50%" cy="55%" r="50%"><stop offset=".6" stop-color="#fff" stop-opacity=".1"/><stop offset=".92" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff"/></radialGradient></defs>
      <circle cx="40" cy="56" r="34" fill="url(#bb-ic)"/><ellipse cx="28" cy="38" rx="8" ry="5" fill="#fff" transform="rotate(-35 28 38)"/>
      <text x="40" y="70" text-anchor="middle" font-size="40" font-weight="900" fill="#fff" stroke="#1D3B7A" stroke-width="4" paint-order="stroke" font-family="system-ui, sans-serif">2</text>
      <circle cx="80" cy="26" r="16" fill="url(#bb-ic)"/><circle cx="78" cy="68" r="9" fill="url(#bb-ic)"/></svg>`,
    tileColor: '#1FA9E1',
    order: 21,
    create(stage, ctx) {
      /* ---------- scene ---------- */
      const probe = ctx.el('div', { class: 'bb-probe' });
      const sky = ctx.el('div', { class: 'bb-sky' });
      const wave = ctx.el('div', { class: 'bb-wave', html: WAVE });
      const rays = ctx.el('div', { class: 'bb-layer' });
      for (let i = 0; i < 4; i++) rays.appendChild(ctx.el('div', { class: 'bb-ray', style: { animationDelay: -i * 1.5 + 's' } }));
      const floor = ctx.el('div', { class: 'bb-layer' });
      const sand = ctx.el('div', { class: 'bb-art', html: sandSVG() });
      const weeds = [
        ctx.el('div', { class: 'bb-art', html: WEED('#2FB574', '#7BE3A6') }),
        ctx.el('div', { class: 'bb-art', html: WEED('#25A267', '#6BD596') }),
        ctx.el('div', { class: 'bb-art', html: WEED('#3CC47E', '#9BEBBE') }),
        ctx.el('div', { class: 'bb-art', html: WEED('#2A9F6A', '#73D9A0') }),
      ];
      weeds.forEach((wd, i) => { wd.firstElementChild.firstElementChild.style.animationDelay = -i * 1.1 + 's'; wd.firstElementChild.firstElementChild.style.animationDuration = 4 + i * 0.6 + 's'; });
      const coral = ctx.el('div', { class: 'bb-art', html: CORAL });
      const star = ctx.el('div', { class: 'bb-art', html: STARFISH });
      const shell = ctx.el('div', { class: 'bb-art', html: SHELL });
      floor.append(...weeds, coral, sand, star, shell);
      const octo = ctx.el('div', { class: 'bb-art bb-octo', html: OCTO });
      floor.appendChild(octo);
      const fishLayer = ctx.el('div', { class: 'bb-layer' });
      const schoolLayer = ctx.el('div', { class: 'bb-layer' });
      const fxLayer = ctx.el('div', { class: 'bb-layer' });
      const bubbleLayer = ctx.el('div', { class: 'bb-layer', style: { zIndex: 50 } });
      const choiceLayer = ctx.el('div', { class: 'bb-layer', style: { zIndex: 52 } });
      const badge = ctx.el('div', { class: 'bb-badge hide' });
      const badgeIn = ctx.el('div', { class: 'bb-badge-in', html: BUOY });
      const badgeNum = ctx.el('div', { class: 'bb-num' });
      badgeIn.appendChild(badgeNum);
      badge.appendChild(badgeIn);
      stage.append(probe, rays, sky, wave, floor, fishLayer, schoolLayer, fxLayer, bubbleLayer, choiceLayer, badge);
      ctx.mascot.show({ corner: 'bl' });

      let G = null;
      function measure() {
        const w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight;
        const sr = stage.getBoundingClientRect(), pr = probe.getBoundingClientRect();
        const safe = { l: Math.max(0, pr.left - sr.left), t: Math.max(0, pr.top - sr.top), r: Math.max(0, sr.right - pr.right), b: Math.max(0, sr.bottom - pr.bottom) };
        const s = Math.min(w, h);
        const D = U.clamp(s * 0.235, 88, 160);
        const pip = U.clamp(Math.min(innerWidth, innerHeight) * 0.14, 80, 140);
        const surfaceY = safe.t + U.clamp(s * 0.12, 54, 90);
        const sandH = U.clamp(h * 0.11, 40, 110);
        const sandY = h - sandH;
        const x0 = safe.l + Math.max(100, pip + 18) + D / 2;
        const x1 = w - safe.r - 12 - D / 2;
        const nl = Math.max(1, Math.floor((x1 - x0) / (D * 1.08)) + 1);
        const lanes = [];
        for (let i = 0; i < nl; i++) lanes.push(nl === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (nl - 1));
        const waterH = h - surfaceY;
        const conc = U.clamp(Math.round((w * waterH) / (D * D * 5)), 4, 8);
        return { w, h, s, D, pip, safe, surfaceY, sandY, sandH, lanes, waterH, conc, land: w > h * 1.15 };
      }
      function place(el, x, y, w, h) {
        el.style.left = x.toFixed(1) + 'px'; el.style.top = y.toFixed(1) + 'px';
        el.style.width = w.toFixed(1) + 'px'; el.style.height = h.toFixed(1) + 'px';
      }
      function layout() {
        G = measure();
        const { w, h, s, surfaceY, sandY, sandH } = G;
        sky.style.height = surfaceY + 'px';
        wave.style.top = surfaceY - 14 + 'px';
        rays.childNodes.forEach((r, i) => {
          r.style.left = (0.12 + i * 0.24) * w + 'px';
          r.style.top = surfaceY + 'px';
          r.style.height = (h - surfaceY) * 0.85 + 'px';
          r.style.transform = `rotate(${12 - i * 3}deg)`;
        });
        place(sand, -10, sandY - sandH * 0.15, w + 20, sandH * 1.15 + 2);
        const wh = U.clamp(s * 0.42, 150, 400);
        const wx = [0.03, 0.16, 0.7, 0.88];
        weeds.forEach((wd, i) => place(wd, w * wx[i], h - wh * (i % 2 ? 0.75 : 1) - sandH * 0.3, wh * 0.22, wh * (i % 2 ? 0.75 : 1)));
        const cs = U.clamp(s * 0.22, 80, 200);
        place(coral, w * 0.5 - cs * 0.2, h - cs * 0.95 - sandH * 0.25, cs, cs * 0.92);
        const ss = U.clamp(s * 0.09, 34, 80);
        place(star, w * 0.33, h - ss * 1.15, ss, ss);
        place(shell, w * 0.62, h - ss * 0.95, ss * 1.1, ss * 0.88);
        const os = U.clamp(s * 0.26, 100, 220);
        place(octo, w - G.safe.r - os * 1.02, h - os * 0.98, os, os * 0.93);
        const bd = U.clamp(s * 0.2, 76, 140);
        badge.style.width = bd + 'px'; badge.style.height = bd + 'px';
        badge.style.top = Math.max(G.safe.t + 4, surfaceY - bd * 0.62) + 'px';
        badge.style.setProperty('--d', bd + 'px');
        friends.forEach((f, i) => { f.size = U.clamp(s * 0.17, 64, 130); f.el.style.width = f.size + 'px'; f.el.style.height = f.size * 0.7 + 'px'; f.y = surfaceY + (h - surfaceY - sandH) * [0.3, 0.56, 0.8][i % 3]; });
        school.forEach((f) => layoutSchoolFish(f));
        choices.forEach((c) => layoutChoice(c));
        bubbles.forEach((b) => {
          b.el.style.width = b.el.style.height = G.D + 'px'; b.el.style.setProperty('--d', G.D + 'px'); b.D = G.D;
          // after a rotation, move each bubble into a lane that exists on the new screen
          if (b.lane != null && b.lane >= G.lanes.length) b.lane = G.lanes.length - 1;
          if (b.lane != null) b.x0 = G.lanes[b.lane];
        });
      }

      /* ---------- state ---------- */
      const bubbles = [];
      const friends = [];
      let school = [];
      let choices = [];
      let mode = 'intro'; // intro | play | celebrate | howmany
      let target = 0, lastTarget = 0;
      let misses = 0, hinted = false, missReported = false;
      let successes = 0, nextHowMany = U.randInt(3, 4);
      let spawnClock = 0, lastLane = -1;
      let tintI = 0;

      /* ---------- bubbles ---------- */
      function makeBubble(n, x, y, o) {
        o = o || {};
        const el = ctx.el('div', { class: (o.cls || 'bb-bubble') + ' bb-in' });
        const wob = ctx.el('div', { class: 'bb-wob', style: { animationDelay: -U.rand(0, 2) + 's' } });
        const tint = TINTS[tintI++ % TINTS.length];
        wob.style.setProperty('--t', tint);
        wob.append(ctx.el('div', { class: 'bb-skin' }), ctx.el('div', { class: 'bb-num' + (n >= 10 ? ' two' : ''), text: String(n) }),
          ctx.el('div', { class: 'bb-shine' }), ctx.el('div', { class: 'bb-shine2' }));
        el.appendChild(wob);
        ctx.setTimeout(() => el.classList.remove('bb-in'), 600);
        return { el, wob, n };
      }
      function spawn(forceN) {
        const lvlMax = MAX[ctx.level];
        let n = forceN;
        if (!n) {
          const tCount = bubbles.filter((b) => b.n === target).length;
          if (target && (tCount === 0 || (tCount < 2 && Math.random() < 0.42))) n = target;
          else {
            const pool = [];
            for (let k = 1; k <= lvlMax; k++) if (k !== target) pool.push(k);
            const fresh = pool.filter((k) => !bubbles.some((b) => b.n === k));
            n = pool.length ? U.pick(fresh.length ? fresh : pool) : 1;
          }
        }
        // choose a lane that is clear near the bottom
        const D = G.D;
        const free = G.lanes.map((x, i) => i).filter((i) => i !== lastLane && !bubbles.some((b) => b.lane === i && b.y > G.h - D * 0.4));
        const lane = free.length ? U.pick(free) : U.randInt(0, G.lanes.length - 1);
        lastLane = lane;
        const b = makeBubble(n);
        Object.assign(b, { lane, x0: G.lanes[lane], x: G.lanes[lane], y: G.h + D * 0.55, t: 0, ph: U.rand(0, 6.28), amp: D * U.rand(0.08, 0.14), D,
          speed: riseSpeed() * U.rand(0.9, 1.12) });
        b.el.style.width = b.el.style.height = D + 'px';
        b.el.style.setProperty('--d', D + 'px');
        b.el._bb = b;
        if (hinted && n === target && mode === 'play') b.wob.classList.add('pp-glow');
        bubbleLayer.appendChild(b.el);
        bubbles.push(b);
        posBubble(b);
        return b;
      }
      function riseSpeed() {
        const riseTime = [12, 12, 11, 10, 9, 8][ctx.level];
        return U.clamp(G.waterH / riseTime, 30, 110);
      }
      function posBubble(b) {
        b.el.style.transform = `translate3d(${(b.x - b.D / 2).toFixed(1)}px, ${(b.y - b.D / 2).toFixed(1)}px, 0)`;
      }
      function removeBubble(b) {
        const i = bubbles.indexOf(b);
        if (i >= 0) bubbles.splice(i, 1);
      }
      /** Pop animation (+ droplets). loud=false for the quiet "reached the surface" pop. */
      function popFx(b, loud) {
        const r = b.el.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        b.el.style.pointerEvents = 'none';
        const an = b.wob.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.3)', opacity: 0 }], { duration: loud ? 180 : 320, easing: 'ease-out', fill: 'forwards' });
        an.onfinish = () => b.el.remove();
        ctx.setTimeout(() => b.el.remove(), 500);
        if (!loud) return { x: cx, y: cy };
        const sr = stage.getBoundingClientRect();
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2 + U.rand(0, 0.5);
          const d = b.D * U.rand(0.55, 0.85);
          const dr = ctx.el('div', { class: 'bb-drop', style: { left: cx - sr.left + 'px', top: cy - sr.top + 'px' } });
          const sz = U.rand(0.5, 1.2);
          fxLayer.appendChild(dr);
          const da = dr.animate([
            { transform: `translate(0,0) scale(${sz})`, opacity: 1 },
            { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(${sz * 0.4})`, opacity: 0 },
          ], { duration: 420, easing: 'cubic-bezier(.2,.8,.3,1)' });
          da.onfinish = () => dr.remove();
        }
        return { x: cx, y: cy };
      }
      function numSize() { return U.clamp(G.s * 0.2, 72, 140); }

      function tapBubble(b) {
        if (b.popped) return;
        b.popped = true;
        removeBubble(b);
        const p = popFx(b, true);
        ctx.sfx('pop', { vel: 0.9 });
        ctx.play('marimba', SCALE[b.n - 1] || 'C6', { vel: 0.55, delay: 0.03 });
        PP.fx.floatText(p.x, p.y - b.D * 0.2, String(b.n), { color: '#fff', size: numSize() });
        if (mode === 'play' && target) {
          if (b.n === target) { win(p); return; }
          misses++;
          ctx.mascot.mood('think');
          if (misses >= 2) hint();
          if (misses >= 3 && !missReported) { missReported = true; ctx.miss(); }
          ctx.say(misses % 2 === 0 ? `${Word(b.n)}! Pop number ${NUM[target]}!` : `${Word(b.n)}!`);
        } else {
          ctx.say(Word(b.n) + '!', { mode: mode === 'celebrate' ? 'skip' : 'interrupt' });
        }
      }

      function hint() {
        hinted = true;
        bubbles.forEach((b) => { if (b.n === target) b.wob.classList.add('pp-glow'); });
        if (!bubbles.some((b) => b.n === target && b.y > G.surfaceY + G.D * 1.5)) spawn(target);
        badge.classList.remove('pulse'); void badge.offsetWidth; badge.classList.add('pulse');
      }

      async function win(p) {
        mode = 'celebrate';
        const t = target;
        bubbles.forEach((b) => b.wob.classList.remove('pp-glow'));
        ctx.success(misses === 0 && !hinted);
        successes++;
        PP.fx.burst(p.x, p.y, { emoji: ['⭐', '✨', '🌟'], count: 7, distance: 110 });
        await ctx.celebrate({ x: p.x, y: p.y, say: `${Word(t)}! ${ctx.praise()}` });
        if (ctx.level >= 2 && successes >= nextHowMany) {
          successes = 0;
          nextHowMany = U.randInt(3, 4);
          await howMany();
        }
        newRequest();
      }

      function setBadge(n) {
        badgeNum.textContent = String(n);
        badgeNum.className = 'bb-num' + (n >= 10 ? ' two' : '');
        badge.classList.remove('hide', 'pulse');
        void badge.offsetWidth;
        badge.classList.add('pulse');
      }

      function newRequest(first) {
        const max = MAX[ctx.level];
        let t;
        for (let k = 0; k < 10; k++) { t = U.randInt(1, max); if (t !== lastTarget) break; }
        target = t;
        lastTarget = t;
        misses = 0; hinted = false; missReported = false;
        setBadge(t);
        const p = `Pop number ${NUM[t]}!`;
        ctx.setPrompt(p);
        ctx.say(first ? `Let's pop bubbles! ${p}` : p);
        mode = 'play';
        ctx.poke();
        if (!bubbles.some((b) => b.n === t && b.y > G.surfaceY + G.D * 2)) spawnClock = Math.max(spawnClock, spawnInterval() - 0.35);
      }
      function spawnInterval() { return (G.waterH / riseSpeed()) / G.conc; }

      /* ---------- fish friends ---------- */
      function makeFriend(i) {
        const el = ctx.el('div', { class: 'bb-fish' });
        const body = ctx.el('div', { class: 'bb-body' });
        const swim = ctx.el('div', { class: 'bb-swim', html: FRIENDS[i % FRIENDS.length], style: { animationDelay: -i * 0.6 + 's' } });
        body.appendChild(swim);
        el.appendChild(body);
        const f = { el, i, dir: i % 2 ? -1 : 1, x: 0, y: 0, size: 80, speed: U.rand(38, 62), boost: 0, t: U.rand(0, 6), shown: true };
        el._fr = f;
        fishLayer.appendChild(el);
        return f;
      }
      function placeFriend(f) {
        const x = f.x - f.size / 2, y = f.y - f.size * 0.35 + Math.sin(f.t * 1.3) * 8;
        f.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        f.el.classList.toggle('flip', f.dir < 0);
      }
      function dart(f) {
        f.boost = 1;
        f.el.classList.add('dart');
        ctx.setTimeout(() => f.el.classList.remove('dart'), 700);
        ctx.sfx('bubble', { vel: 0.7 });
        ctx.sfx('swish', { vel: 0.4, delay: 0.05 });
        const r = f.el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
        miniBubbles(r.left - sr.left + (f.dir > 0 ? r.width * 0.1 : r.width * 0.9), r.top - sr.top + r.height * 0.45, 4);
      }

      /* ---------- little decorative bubbles ---------- */
      let miniCount = 0;
      function miniBubbles(x, y, n) {
        for (let i = 0; i < n && miniCount < 30; i++) {
          const s = U.rand(10, 26);
          const e = ctx.el('div', { class: 'bb-mini', style: { left: x - s / 2 + U.rand(-10, 10) + 'px', top: y - s / 2 + 'px', width: s + 'px', height: s + 'px' } });
          fxLayer.appendChild(e);
          miniCount++;
          const rise = U.rand(90, 200);
          const an = e.animate([
            { transform: 'translate(0,0) scale(.3)', opacity: 0 },
            { transform: `translate(${U.rand(-12, 12)}px, ${-rise * 0.2}px) scale(1)`, opacity: 1, offset: 0.15 },
            { transform: `translate(${U.rand(-20, 20)}px, ${-rise}px) scale(1.05)`, opacity: 0 },
          ], { duration: U.rand(1100, 1700), delay: i * 90, easing: 'ease-out', fill: 'backwards' });
          an.onfinish = () => { e.remove(); miniCount--; };
        }
      }

      /* ---------- "How many fish?" ---------- */
      /** Geometry of the "how many" round: the school of fish on top, a row of answer bubbles below, centred in the water. */
      function hmGeom(n, nc) {
        const left = G.safe.l + 12, right = G.w - G.safe.r - 12, W = right - left;
        let size = U.clamp(G.s * 0.2, 70, 150);
        let cols = n, rows = 1;
        if (n * size * 1.2 > W) { cols = Math.ceil(n / 2); rows = 2; }
        size = Math.min(size, W / (cols * 1.2));
        let D = Math.min(G.D * 1.12, W / (Math.max(2, nc) * 1.25));
        const top0 = G.surfaceY + 12, bot0 = G.sandY + G.sandH * 0.15;
        const avail = bot0 - top0;
        let fishH = rows * size * 0.88, gap = Math.max(D * 0.35, 18);
        const total = fishH + gap + D;
        if (total > avail) {
          const k = avail / total;
          size *= k; fishH *= k; gap *= k; D = Math.max(80, D * k);
        }
        const y0 = top0 + Math.max(0, (avail - (fishH + gap + D)) * (G.land ? 0.5 : 0.42));
        return { size, cols, rows, cx: left + W / 2, fishTop: y0, choiceY: y0 + fishH + gap + D / 2, D };
      }
      let hmN = 3, hmNC = 3;
      function hm() { return hmGeom(hmN, hmNC); }
      function layoutSchoolFish(f) {
        const g = hm();
        const r = Math.floor(f.k / g.cols), c = f.k % g.cols;
        const cnt = r === g.rows - 1 ? f.of - r * g.cols : g.cols;
        const x = g.cx + (c - (cnt - 1) / 2) * g.size * 1.2 + (g.rows > 1 ? (r ? 0.3 : -0.3) * g.size : 0);
        const y = g.fishTop + (r + 0.5) * g.size * 0.88;
        f.size = g.size;
        f.el.style.width = g.size + 'px';
        f.el.style.height = g.size * 0.7 + 'px';
        f.el.style.transform = `translate3d(${(x - g.size / 2).toFixed(1)}px, ${(y - g.size * 0.35).toFixed(1)}px, 0)`;
      }
      function layoutChoice(c) {
        const g = hm(), n = hmNC;
        const x = g.cx + (c.k - (n - 1) / 2) * g.D * 1.22;
        c.el.style.left = x - g.D / 2 + 'px'; c.el.style.top = g.choiceY - g.D / 2 + 'px';
        c.el.style.width = c.el.style.height = g.D + 'px';
        c.el.style.setProperty('--d', g.D + 'px');
      }

      async function howMany() {
        mode = 'howmany';
        badge.classList.add('hide');
        ctx.setPrompt('');
        // whoosh the bubbles away and hide the friends so only the school is counted
        bubbles.forEach((b) => { b.speed *= 6; });
        friends.forEach((f) => { f.el.style.transition = 'opacity .5s'; f.el.style.opacity = '0'; f.el.style.pointerEvents = 'none'; });
        ctx.sfx('whoosh', { vel: 0.5 });
        await ctx.wait(800);
        const lvl = ctx.level;
        const n = U.randInt(2, Math.min(5, MAX[lvl]));
        const nc = lvl <= 2 ? 2 : 3;
        hmN = n; hmNC = nc;
        school = [];
        for (let k = 0; k < n; k++) {
          const el = ctx.el('div', { class: 'bb-fish flip' });
          const body = ctx.el('div', { class: 'bb-body' });
          body.appendChild(ctx.el('div', { class: 'bb-swim', html: SCHOOL, style: { animationDelay: -k * 0.35 + 's' } }));
          el.append(ctx.el('div', { class: 'bb-ring' }), body);
          const f = { el, k, of: n };
          el._sf = f;
          schoolLayer.appendChild(el);
          layoutSchoolFish(f);
          el.animate([{ translate: G.w * 0.8 + 'px 0' }, { translate: '0 0' }], { duration: 1100 + k * 160, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' });
          school.push(f);
        }
        ctx.sfx('splash', { vel: 0.4 });
        await ctx.wait(1300);
        ctx.mascot.mood('think');
        ctx.setPrompt('How many fish?');
        await ctx.say("How many fish? Let's count!");
        for (let k = 0; k < n; k++) {
          const f = school[k];
          f.el.classList.remove('hl'); void f.el.offsetWidth;
          f.el.classList.add('hl', 'lit');
          const r = f.el.getBoundingClientRect();
          PP.fx.floatText(r.left + r.width / 2, r.top - 4, String(k + 1), { color: '#FFE45C', size: U.clamp(G.s * 0.12, 48, 90), duration: 1100 });
          ctx.play('xylo', SCALE[k], { vel: 0.8 });
          ctx.say(Word(k + 1) + (k === n - 1 ? '!' : ''));
          await ctx.wait(760);
        }
        await ctx.wait(250);
        const easy = lvl <= 3;
        const prompt = easy ? `${Word(n)} fish! Pop number ${NUM[n]}!` : 'How many fish?';
        const reprompt = easy ? `Pop number ${NUM[n]}!` : 'How many fish?';
        // choices: the answer + 1–2 neighbours
        const opts = new Set([n]);
        const near = ctx.shuffle([n - 1, n + 1, n + 2, n - 2]).filter((k) => k >= 1 && k <= Math.max(5, MAX[lvl]));
        while (opts.size < nc && near.length) opts.add(near.shift());
        const vals = ctx.shuffle([...opts]);
        choices = vals.map((v, k) => {
          const c = makeBubble(v, 0, 0, { cls: 'bb-choice' });
          c.k = k;
          const fl = ctx.el('div', { class: 'bb-float', style: { animationDelay: -k * 0.5 + 's' } });
          c.el.removeChild(c.wob);
          fl.appendChild(c.wob);
          c.el.appendChild(fl);
          c.el._ch = c;
          c.el.style.animationDelay = k * 0.1 + 's';
          choiceLayer.appendChild(c.el);
          return c;
        });
        choices.forEach(layoutChoice);
        ctx.sfx('bubble', { vel: 0.6 });
        ctx.setPrompt(reprompt);
        ctx.say(prompt);
        let wrong = 0, hintedHM = false;
        const right = choices.find((c) => c.n === n);
        const stopIdle = ctx.idle(7000, () => {
          if (mode !== 'howmany' || !choices.length) return;
          hintedHM = true;
          right.wob.classList.add('pp-glow');
          ctx.say(easy ? reprompt : `How many fish? ${Word(n)}!`);
        });
        await new Promise((resolve) => {
          choiceTap = (c) => {
            if (c.n === n) {
              choiceTap = null;
              stopIdle();
              const p = popFx(c, true);
              ctx.sfx('pop', { vel: 0.9 });
              PP.fx.floatText(p.x, p.y - 20, String(n), { color: '#fff', size: numSize() });
              choices.filter((o) => o !== c).forEach((o) => o.el.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.5)' }], { duration: 300, fill: 'forwards' }));
              school.forEach((f, i) => ctx.setTimeout(() => { f.el.classList.remove('hl'); void f.el.offsetWidth; f.el.classList.add('hl'); }, i * 90));
              ctx.success(wrong === 0 && !hintedHM);
              resolve();
            } else {
              wrong++;
              ctx.sfx('oops', { vel: 0.6 });
              c.el.classList.remove('wig'); void c.el.offsetWidth; c.el.classList.add('wig');
              ctx.mascot.mood('think');
              if (wrong >= 2) {
                right.wob.classList.add('pp-glow');
                if (wrong === 2) ctx.miss();
              }
              ctx.say(`That's ${NUM[c.n]}. ${wrong >= 2 ? `${Word(n)} fish! Pop number ${NUM[n]}!` : reprompt}`);
            }
          };
        });
        await ctx.celebrate({ say: `${Word(n)} fish! ${ctx.praise()}`, y: innerHeight * 0.4 });
        // school swims away, friends come back
        ctx.sfx('swish', { vel: 0.5 });
        school.forEach((f, i) => {
          f.el.classList.remove('lit', 'flip');
          f.el.animate([{ translate: '0 0' }, { translate: `${-G.w}px ${U.rand(-40, 40)}px` }], { duration: 1200 + i * 120, easing: 'ease-in', fill: 'forwards' });
        });
        choices.forEach((c) => c.el.remove());
        choices = [];
        await ctx.wait(1300);
        school.forEach((f) => f.el.remove());
        school = [];
        friends.forEach((f) => { f.el.style.opacity = '1'; f.el.style.pointerEvents = ''; });
      }
      let choiceTap = null;

      /* ---------- main loop ---------- */
      const nFriends = 3;
      for (let i = 0; i < nFriends; i++) friends.push(makeFriend(i));
      layout();
      ctx.onResize(layout);
      friends.forEach((f, i) => { f.x = G.w * (0.2 + 0.3 * i); placeFriend(f); });

      ctx.raf((dt) => {
        if (!G) return;
        const top = G.surfaceY;
        for (let i = bubbles.length - 1; i >= 0; i--) {
          const b = bubbles[i];
          b.t += dt;
          b.y -= b.speed * dt;
          b.x = b.x0 + Math.sin(b.t * 1.9 + b.ph) * b.amp;
          if (b.y - b.D * 0.5 < top + 4) {
            // reached the surface: quiet pop
            b.popped = true;
            bubbles.splice(i, 1);
            popFx(b, false);
            continue;
          }
          posBubble(b);
        }
        if (mode === 'play' || mode === 'celebrate' || mode === 'intro') {
          spawnClock += dt;
          const iv = spawnInterval();
          if (mode !== 'celebrate' && spawnClock >= iv && bubbles.length < G.conc + 2) {
            spawnClock = U.rand(-0.25, 0.25) * iv;
            spawn();
          }
        }
        for (const f of friends) {
          f.t += dt;
          if (f.boost > 0) f.boost = Math.max(0, f.boost - dt * 1.4);
          const sp = f.speed * (1 + f.boost * 7);
          f.x += f.dir * sp * dt;
          const m = f.size * 0.6;
          if (f.boost > 0.05) {
            if (f.x > G.w + m * 1.5) f.x = -m * 1.4;
            else if (f.x < -m * 1.5) f.x = G.w + m * 1.4;
          } else if (f.x > G.w - m && f.dir > 0) f.dir = -1;
          else if (f.x < m && f.dir < 0) f.dir = 1;
          placeFriend(f);
        }
      });

      /* ---------- input ---------- */
      ctx.on(stage, 'pointerdown', (e) => {
        if (e.button > 0) return;
        const t = e.target;
        if (!t || !t.closest || t.closest('.pp-game-pip')) return;
        const be = t.closest('.bb-bubble');
        if (be && be._bb) { e.preventDefault(); tapBubble(be._bb); return; }
        const ce = t.closest('.bb-choice');
        if (ce && ce._ch) { e.preventDefault(); if (choiceTap) choiceTap(ce._ch); return; }
        const sf = t.closest('.bb-fish');
        if (sf && sf._fr) { dart(sf._fr); return; }
        if (sf && sf._sf) {
          sf.classList.remove('hl'); void sf.offsetWidth; sf.classList.add('hl');
          ctx.sfx('bubble', { vel: 0.5 });
          return;
        }
        if (t.closest('.bb-octo')) {
          ctx.sfx('boing', { vel: 0.5 });
          octo.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.15,.85)' }, { transform: 'scale(.92,1.1)' }, { transform: 'scale(1,1)' }], { duration: 500, easing: 'ease-out' });
          const r = octo.getBoundingClientRect(), sr = stage.getBoundingClientRect();
          miniBubbles(r.left - sr.left + r.width * 0.5, r.top - sr.top + r.height * 0.1, 5);
          return;
        }
        if (t.closest('.bb-badge')) {
          badge.classList.remove('pulse'); void badge.offsetWidth; badge.classList.add('pulse');
          ctx.sfx('ding', { vel: 0.4 });
          if (target && mode === 'play') ctx.say(`Number ${NUM[target]}!`);
          return;
        }
        // water: a few little bubbles
        const sr = stage.getBoundingClientRect();
        miniBubbles(e.clientX - sr.left, e.clientY - sr.top, 3);
        ctx.sfx('bubble', { vel: 0.35 });
      });

      ctx.idle(7000, () => {
        if (mode !== 'play' || !target) return;
        hint();
        ctx.mascot.mood('wave');
        ctx.say(`Pop number ${NUM[target]}!`);
      });

      // start: a few bubbles already on their way up, then the first request
      (async () => {
        const pre = Math.min(3, G.lanes.length);
        for (let i = 0; i < pre; i++) {
          const b = spawn(U.randInt(1, MAX[ctx.level]));
          b.y = G.sandY - (G.sandY - G.surfaceY) * (0.15 + i * 0.28);
          posBubble(b);
        }
        await ctx.wait(500);
        newRequest(true);
      })();

      return { destroy() {} };
    },
  });
})();
