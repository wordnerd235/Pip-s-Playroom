/* Rocket — count down, blast off, count the stars, land on a planet.
 *
 * A chunky rocket waits on the launch pad. Each tap on the big button (or the rocket) shows the next
 * countdown number huge and says it ("Five!… Four!…"), throttled so every number is spoken even when
 * he mashes. The rocket shakes harder and a rumble builds. At zero: "Blast off!" — flames, smoke,
 * screen shake, and the camera follows the rocket up into space. "Let's count the stars!": tap N
 * sleepy stars to light them up (bell notes climb the scale, big numerals). Then the rocket lands on a
 * colorful planet where a friendly alien waves "Hi! Hi!". The green arrow flies home to the pad.
 *
 * Countdown from 3 (L1) · 5 (L2–3) · 10 (L4–5). Stars: 3 · 4 · 5–6 · 7–8 · 8–10.
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;
  const NUM = PP.data.NUMBERS;
  const Word = (n) => U.cap(NUM[n] || String(n));
  const SCALE = ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6', 'D6', 'E6'];
  const RISE = ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5', 'A5', 'B5'];
  const START = [3, 3, 5, 5, 10, 10];
  const STARS = [null, [3, 3], [4, 4], [5, 6], [7, 8], [8, 10]];
  const THROTTLE = 720;

  U.addStyles('rocket', `
    .g-rocket { background: #8ED6FF; }
    .rk-world { position: absolute; inset: 0; overflow: hidden; }
    .rk-probe { position: absolute; left: var(--safe-l); top: var(--safe-t); right: var(--safe-r); bottom: var(--safe-b); pointer-events: none; visibility: hidden; }
    .rk-layer { position: absolute; inset: 0; pointer-events: none; }
    .rk-sky { position: absolute; inset: 0; background: linear-gradient(#6CC8FF 0%, #A9E2FF 55%, #DDF4FF 100%); }
    .rk-space { position: absolute; inset: 0; opacity: 0; background: radial-gradient(120% 80% at 70% 20%, #3A2C8A 0%, #1C1B5A 45%, #0D0F33 100%); }
    .rk-art { position: absolute; pointer-events: none; }
    .rk-art > svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .rk-art[data-fun] { pointer-events: auto; }
    .rk-cloud { animation: rk-drift 12s ease-in-out infinite; }
    @keyframes rk-drift { 0%, 100% { transform: translateX(0) } 50% { transform: translateX(24px) } }
    @keyframes rk-spin { to { transform: rotate(360deg) } }
    @keyframes rk-bob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6%) } }
    @keyframes rk-tw { 0%, 100% { opacity: .3 } 50% { opacity: 1 } }
    .rk-skydots circle.tw { animation: rk-tw 2.4s ease-in-out infinite; }
    .rk-blink { animation: rk-tw 1s steps(2) infinite; }
    .rk-ringed { animation: rk-bob 6s ease-in-out infinite; }

    .rk-rocket { position: absolute; left: 0; top: 0; pointer-events: auto; will-change: transform; }
    .rk-rocket > .rk-body { position: absolute; inset: 0; }
    .rk-rocket svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .rk-flame { position: absolute; left: 30%; width: 40%; top: 83%; height: 50%; transform-origin: 50% 0; transform: scale(0); transition: transform .35s cubic-bezier(.3,1.5,.5,1); pointer-events: none; }
    .rk-flame.on { transform: scale(1); }
    .rk-flame.big { transform: scale(1.6, 2.1); }
    .rk-flame.small { transform: scale(.7, .75); }
    .rk-flame svg { animation: rk-flick .12s ease-in-out infinite alternate; transform-origin: 50% 0; }
    @keyframes rk-flick { from { transform: scale(1, 1) } to { transform: scale(.88, 1.12) } }
    .rk-puff { position: absolute; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #fff, #E6ECF5 70%); pointer-events: none; }
    .rk-streak { position: absolute; width: 4px; border-radius: 2px; background: linear-gradient(rgba(255,255,255,0), rgba(255,255,255,.85)); pointer-events: none; }

    .rk-big { position: absolute; z-index: 30; pointer-events: none; font-weight: 900; line-height: 1; color: #FFD21F; text-align: center;
      -webkit-text-stroke: 6px #2B2340; paint-order: stroke fill; text-shadow: 0 8px 0 rgba(43,35,64,.25); transform: translate(-50%, -50%); }
    .rk-big.pop { animation: rk-bigpop .55s cubic-bezier(.3,1.7,.5,1); }
    @keyframes rk-bigpop { 0% { transform: translate(-50%,-50%) scale(.2) rotate(-15deg); opacity: 0 } 100% { transform: translate(-50%,-50%) scale(1) rotate(0); opacity: 1 } }
    .rk-big.out { opacity: 0; transition: opacity .3s; }

    .rk-btn { position: absolute; z-index: 35; border-radius: 50%; pointer-events: auto;
      background: radial-gradient(circle at 35% 30%, #FF8A80, #F2453D 55%, #C22A24); border: 6px solid #fff;
      box-shadow: 0 9px 0 #A11F1A, 0 16px 28px rgba(0,0,0,.25); display: grid; place-items: center; animation: pp-pulse 1.2s ease-in-out infinite; }
    .rk-btn::before { content: ""; position: absolute; inset: -14%; border-radius: 50%; }
    .rk-btn span { font-weight: 900; color: #fff; font-size: calc(var(--b) * .5); line-height: 1; text-shadow: 0 3px 0 rgba(120,10,10,.45); }
    .rk-btn span.ic { font-size: calc(var(--b) * .46); }
    .rk-btn.press { animation: none; transform: translateY(6px) scale(.94); box-shadow: 0 3px 0 #A11F1A, 0 8px 14px rgba(0,0,0,.25); }
    .rk-btn.gone { transform: scale(0); transition: transform .3s ease-in; animation: none; }

    .rk-star { position: absolute; pointer-events: auto; border-radius: 50%; }
    .rk-star::before { content: ""; position: absolute; inset: -10%; border-radius: 50%; }
    .rk-star .rk-sin { position: absolute; inset: 0; animation: rk-bob 3s ease-in-out infinite; }
    .rk-star.in .rk-sin { animation: rk-starin .6s cubic-bezier(.3,1.6,.5,1) both; }
    @keyframes rk-starin { from { transform: scale(0) rotate(-90deg) } to { transform: scale(1) rotate(0) } }
    .rk-star .st-body { fill: #7C78C6; stroke: #7C78C6; transition: fill .3s, stroke .3s; }
    .rk-star .st-halo { opacity: 0; transition: opacity .4s; }
    .rk-star .st-awake { display: none; }
    .rk-star.on .st-body { fill: #FFD84A; stroke: #FFC52E; }
    .rk-star.on .st-halo { opacity: 1; }
    .rk-star.on .st-awake { display: inline; }
    .rk-star.on .st-sleep { display: none; }
    .rk-star.on .rk-sin { animation: rk-twinkle 2.2s ease-in-out infinite; }
    @keyframes rk-twinkle { 0%, 100% { transform: scale(1) rotate(0) } 50% { transform: scale(1.08) rotate(7deg) } }
    .rk-star.pp-glow { border-radius: 50%; }
    .rk-badge { position: absolute; right: -4%; top: -4%; width: 34%; height: 34%; border-radius: 50%; background: #FF6FB5; color: #fff; border: 3px solid #fff;
      display: grid; place-items: center; font-weight: 900; font-size: calc(var(--s) * .2); line-height: 1; transform: scale(0); transition: transform .35s cubic-bezier(.3,1.7,.5,1); box-shadow: 0 3px 0 rgba(0,0,0,.15); }
    .rk-star.on .rk-badge { transform: scale(1); }

    .rk-alien { position: absolute; pointer-events: auto; transform-origin: 50% 100%; }
    .rk-alien .rk-ain { width: 100%; height: 100%; transform-origin: 50% 100%; }
    .rk-alien.show .rk-ain { animation: rk-alienin .7s cubic-bezier(.3,1.6,.5,1) both; }
    @keyframes rk-alienin { from { transform: scale(0) } to { transform: scale(1) } }
    .rk-alien .rk-wave { transform-box: fill-box; transform-origin: 20% 90%; animation: rk-wave .35s ease-in-out infinite alternate; }
    @keyframes rk-wave { from { transform: rotate(-25deg) } to { transform: rotate(20deg) } }
    .rk-alien .rk-ant { transform-box: fill-box; transform-origin: 50% 100%; animation: rk-ant 1.4s ease-in-out infinite alternate; }
    @keyframes rk-ant { from { transform: rotate(-12deg) } to { transform: rotate(12deg) } }
  `);

  /* ---------------- art ---------------- */
  const ROCKET = `<svg viewBox="0 0 120 220">
    <path d="M26 118 C 8 132, 2 158, 4 186 L 30 162 Z" fill="#F2453D"/><path d="M94 118 C 112 132, 118 158, 116 186 L 90 162 Z" fill="#D8342D"/>
    <path d="M60 6 C 92 30, 100 84, 96 166 L 24 166 C 20 84, 28 30, 60 6 Z" fill="#F6F7FB"/>
    <path d="M60 6 C 92 30, 100 84, 96 166 L 78 166 C 84 90, 80 40, 60 6 Z" fill="#DCE2EE"/>
    <path d="M60 6 C 76 18, 86 36, 91 56 L 29 56 C 34 36, 44 18, 60 6 Z" fill="#F2453D"/>
    <path d="M60 6 C 76 18, 86 36, 91 56 L 80 56 C 76 36, 70 20, 60 6 Z" fill="#C92E28"/>
    <rect x="24" y="132" width="72" height="12" fill="#4D96FF"/><rect x="78" y="132" width="18" height="12" fill="#2F72D6"/>
    <circle cx="60" cy="94" r="23" fill="#3D5A99"/><circle cx="60" cy="94" r="17" fill="#9FE0FF"/>
    <g><circle cx="60" cy="98" r="11" fill="#FFB547"/><path d="M60 87 C 59 83, 60 80, 62 78" stroke="#38A04C" stroke-width="2" fill="none"/><ellipse cx="65" cy="78" rx="4" ry="2.4" fill="#7FDA86"/>
      <circle cx="56" cy="97" r="2" fill="#2B2340"/><circle cx="64" cy="97" r="2" fill="#2B2340"/><path d="M56.5 101.5 q3.5 3 7 0" stroke="#5A2A1A" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>
    <path d="M47 84 C 50 79, 56 77, 61 77" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".85"/>
    <path d="M55 132 L65 132 L68 176 Q60 184 52 176 Z" fill="#F2453D"/><path d="M60 132 L65 132 L68 176 Q64 180 60 181 Z" fill="#C92E28"/>
    <path d="M38 166 L 82 166 L 76 182 L 44 182 Z" fill="#5B6478"/><path d="M38 166 L 82 166 L 80 171 L 40 171 Z" fill="#78839A"/>
    <path d="M36 48 C 34 70, 34 100, 36 124" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/></svg>`;
  const FLAME = `<svg viewBox="0 0 60 120" preserveAspectRatio="xMidYMin meet"><path d="M30 120 C 14 96, 2 70, 6 40 C 8 22, 18 8, 30 0 C 42 8, 52 22, 54 40 C 58 70, 46 96, 30 120 Z" fill="#FF7A1A"/>
    <path d="M30 96 C 20 78, 14 60, 16 40 C 18 26, 24 14, 30 6 C 36 14, 42 26, 44 40 C 46 60, 40 78, 30 96 Z" fill="#FFC21F"/>
    <path d="M30 64 C 25 54, 23 44, 24 34 C 25 24, 28 16, 30 10 C 32 16, 35 24, 36 34 C 37 44, 35 54, 30 64 Z" fill="#FFF6C8"/></svg>`;
  const SUN = (() => {
    let r = '';
    for (let i = 0; i < 12; i++) r += `<rect x="56" y="2" width="8" height="20" rx="4" transform="rotate(${i * 30} 60 60)"/>`;
    return `<svg viewBox="0 0 120 120"><g fill="#FFD84A" style="transform-box:fill-box;transform-origin:50% 50%;animation:rk-spin 40s linear infinite">${r}</g><circle cx="60" cy="60" r="35" fill="#FFCF2E"/>
      <circle cx="49" cy="56" r="3.6" fill="#7A4A12"/><circle cx="71" cy="56" r="3.6" fill="#7A4A12"/><path d="M50 67 Q60 76 70 67" stroke="#7A4A12" stroke-width="3.6" fill="none" stroke-linecap="round"/></svg>`;
  })();
  const CLOUD = `<svg viewBox="0 0 160 80"><path d="M30 72 C 8 72, 4 48, 24 42 C 22 20, 52 12, 64 28 C 72 6, 112 6, 116 32 C 138 26, 156 46, 142 62 C 148 70, 140 72, 132 72 Z" fill="#fff"/></svg>`;
  const HILLS = `<svg viewBox="0 0 400 120" preserveAspectRatio="none"><path d="M0 40 C 70 10, 140 30, 210 22 C 290 12, 350 30, 400 24 V120 H0 Z" fill="#9BE07E"/>
    <path d="M0 64 C 100 44, 190 62, 280 54 C 340 48, 380 56, 400 54 V120 H0 Z" fill="#74CF63"/></svg>`;
  const TOWER = `<svg viewBox="0 0 80 300" preserveAspectRatio="none">
    <g stroke="#E94F3D" stroke-width="5" fill="none"><path d="M12 300 V 20 M52 300 V 20"/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M12 ${290 - i * 30} L52 ${260 - i * 30} M52 ${290 - i * 30} L12 ${260 - i * 30}"/>`).join('')}
      <path d="M12 20 H52"/></g>
    <rect x="44" y="70" width="36" height="8" rx="3" fill="#B8C0D0"/><rect x="44" y="160" width="36" height="8" rx="3" fill="#B8C0D0"/>
    <circle class="rk-blink" cx="32" cy="12" r="8" fill="#FF5A5A"/></svg>`;
  const PAD = `<svg viewBox="0 0 200 40" preserveAspectRatio="none"><rect x="0" y="8" width="200" height="32" rx="6" fill="#7D8597"/><rect x="0" y="8" width="200" height="9" rx="4" fill="#A4ACBC"/>
    <g fill="#FFD21F"><rect x="16" y="22" width="22" height="8" rx="2"/><rect x="62" y="22" width="22" height="8" rx="2"/><rect x="116" y="22" width="22" height="8" rx="2"/><rect x="162" y="22" width="22" height="8" rx="2"/></g></svg>`;
  const RINGED = `<svg viewBox="0 0 160 110"><ellipse cx="80" cy="60" rx="76" ry="18" fill="none" stroke="#FFC27A" stroke-width="9" opacity=".9"/>
    <circle cx="80" cy="55" r="40" fill="#FF8FB7"/><path d="M44 46 C 60 40, 100 40, 118 48" stroke="#FFC0D6" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M42 64 C 64 70, 100 70, 118 62" stroke="#E86E9B" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M4 60 C 30 80, 130 80, 156 60" stroke="#FFC27A" stroke-width="9" fill="none" stroke-linecap="round"/></svg>`;
  const MOON = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#E8E6F5"/><circle cx="34" cy="38" r="9" fill="#CFCBE6"/><circle cx="64" cy="62" r="12" fill="#CFCBE6"/><circle cx="66" cy="30" r="5" fill="#CFCBE6"/>
    <g stroke="#7A74A8" stroke-width="3" fill="none" stroke-linecap="round"><path d="M36 54 q4 3 8 0"/><path d="M56 54 q4 3 8 0"/><path d="M44 64 q6 5 12 0"/></g></svg>`;
  const STAR = (() => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 20 : 43;
      d += (i ? 'L' : 'M') + (50 + r * Math.cos(a)).toFixed(1) + ' ' + (55 + r * Math.sin(a)).toFixed(1) + ' ';
    }
    return `<svg viewBox="0 0 100 100"><circle class="st-halo" cx="50" cy="53" r="50" fill="url(#rk-glow-g)"/><path class="st-body" d="${d}Z" stroke-width="10" stroke-linejoin="round"/>
      <g class="st-sleep" stroke="#3B3770" stroke-width="3.4" fill="none" stroke-linecap="round"><path d="M36 56 q5 4.5 10 0"/><path d="M54 56 q5 4.5 10 0"/></g>
      <g class="st-awake"><circle cx="41.5" cy="54" r="4.6" fill="#5A3A00"/><circle cx="58.5" cy="54" r="4.6" fill="#5A3A00"/><circle cx="43" cy="52.4" r="1.7" fill="#fff"/><circle cx="60" cy="52.4" r="1.7" fill="#fff"/>
        <path d="M43.5 63 q6.5 6.5 13 0" stroke="#5A3A00" stroke-width="3.2" fill="none" stroke-linecap="round"/></g></svg>`;
  })();
  const PLANET = `<svg viewBox="0 0 400 200" preserveAspectRatio="none">
    <ellipse cx="200" cy="200" rx="230" ry="170" fill="#7B5CE0"/><ellipse cx="200" cy="206" rx="226" ry="160" fill="#9C7BFF"/>
    <g fill="#7B5CE0" opacity=".7"><ellipse cx="90" cy="110" rx="26" ry="9"/><ellipse cx="300" cy="96" rx="20" ry="7"/><ellipse cx="220" cy="150" rx="34" ry="11"/><ellipse cx="140" cy="168" rx="18" ry="6"/></g>
    <g fill="#B9A2FF"><ellipse cx="86" cy="106" rx="20" ry="5"/><ellipse cx="296" cy="93" rx="15" ry="4"/></g></svg>`;
  const PLANT = (c) => `<svg viewBox="0 0 60 90"><path d="M30 90 C 28 70, 30 50, 30 34" stroke="#2FBF9A" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M30 70 C 18 62, 10 50, 12 40 C 22 46, 28 56, 30 66 Z" fill="#45D6AE"/><path d="M30 60 C 42 52, 50 42, 48 32 C 38 38, 32 48, 30 56 Z" fill="#45D6AE"/>
    <circle cx="30" cy="26" r="12" fill="${c}"/><circle cx="26" cy="22" r="4" fill="#fff" opacity=".6"/></svg>`;
  const ALIEN = `<svg viewBox="0 0 120 150">
    <g class="rk-ant"><path d="M44 40 C 40 26, 34 18, 28 14" stroke="#4DBE5A" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="27" cy="12" r="8" fill="#FF6FB5"/></g>
    <g class="rk-ant" style="animation-delay:-.7s"><path d="M76 40 C 80 26, 86 18, 92 14" stroke="#4DBE5A" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="93" cy="12" r="8" fill="#FFD21F"/></g>
    <ellipse cx="44" cy="142" rx="14" ry="7" fill="#3FA94D"/><ellipse cx="76" cy="142" rx="14" ry="7" fill="#3FA94D"/>
    <path d="M22 98 C 10 104, 6 116, 10 124" stroke="#6FD66C" stroke-width="11" fill="none" stroke-linecap="round"/>
    <g class="rk-wave"><path d="M98 96 C 110 86, 114 72, 110 60" stroke="#6FD66C" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="110" cy="56" r="8" fill="#6FD66C"/></g>
    <path d="M60 34 C 92 34, 104 62, 102 92 C 100 124, 84 140, 60 140 C 36 140, 20 124, 18 92 C 16 62, 28 34, 60 34 Z" fill="#7BE07A"/>
    <ellipse cx="60" cy="112" rx="26" ry="20" fill="#B5F2A6" opacity=".8"/>
    <ellipse cx="46" cy="72" rx="13" ry="15" fill="#fff"/><ellipse cx="74" cy="72" rx="13" ry="15" fill="#fff"/>
    <circle cx="48" cy="75" r="7.5" fill="#2B2340"/><circle cx="76" cy="75" r="7.5" fill="#2B2340"/><circle cx="50.5" cy="72" r="2.8" fill="#fff"/><circle cx="78.5" cy="72" r="2.8" fill="#fff"/>
    <path d="M48 96 Q60 110 72 96 Q60 102 48 96 Z" fill="#5A2A1A"/>
    <ellipse cx="34" cy="92" rx="6" ry="3.5" fill="#FF8FB7" opacity=".7"/><ellipse cx="86" cy="92" rx="6" ry="3.5" fill="#FF8FB7" opacity=".7"/>
    <ellipse cx="44" cy="48" rx="10" ry="5" fill="#fff" opacity=".4" transform="rotate(-25 44 48)"/></svg>`;
  function skyDots(n) {
    let c = '';
    for (let i = 0; i < n; i++) {
      c += `<circle ${i % 5 === 0 ? `class="tw" style="animation-delay:-${U.rand(0, 2.4).toFixed(1)}s"` : ''} cx="${U.rand(0, 400).toFixed(1)}" cy="${U.rand(0, 400).toFixed(1)}" r="${U.rand(0.7, 2).toFixed(1)}" fill="#fff" opacity="${U.rand(0.4, 1).toFixed(2)}"/>`;
    }
    return `<svg class="rk-skydots" viewBox="0 0 400 400" preserveAspectRatio="none">${c}</svg>`;
  }

  U.addDefs('rocket', `<radialGradient id="rk-glow-g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF8C8" stop-opacity=".95"/><stop offset=".42" stop-color="#FFE45C" stop-opacity=".5"/><stop offset="1" stop-color="#FFE45C" stop-opacity="0"/></radialGradient>`);

  PP.registerGame({
    id: 'rocket',
    title: 'Rocket',
    domain: 'numbers',
    icon: '🚀',
    tileColor: '#6C5CE7',
    order: 22,
    create(stage, ctx) {
      const probe = ctx.el('div', { class: 'rk-probe' });
      const world = ctx.el('div', { class: 'rk-world' });
      stage.append(probe, world);

      let G = null;
      function measure() {
        const w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight;
        const sr = stage.getBoundingClientRect(), pr = probe.getBoundingClientRect();
        const safe = { l: Math.max(0, pr.left - sr.left), t: Math.max(0, pr.top - sr.top), r: Math.max(0, sr.right - pr.right), b: Math.max(0, sr.bottom - pr.bottom) };
        const s = Math.min(w, h), land = w > h * 1.15;
        const RH = land ? U.clamp(h * 0.58, 150, 420) : U.clamp(h * 0.36, 170, 440);
        const RW = RH * (120 / 220);
        const groundY = h * (land ? 0.86 : 0.84);
        const padH = RH * 0.09;
        const btn = U.clamp(s * 0.27, 100, 180);
        const g = { w, h, s, safe, land, RH, RW, groundY, padH, btn };
        g.padX = land ? w * 0.36 : w * 0.4;
        g.padY = groundY - padH * 0.35; // rocket bottom on the pad
        g.btnX = land ? w - safe.r - btn * 0.62 - 18 : w - safe.r - btn / 2 - 22;
        g.btnY = land ? h * 0.64 : h - safe.b - btn / 2 - 30;
        const rocketTop = g.padY - RH;
        g.bigX = land ? (g.padX + g.RW * 0.6 + g.btnX - btn * 0.4) / 2 + w * 0.04 : w / 2;
        g.bigY = land ? h * 0.36 : (safe.t + 84 + rocketTop) / 2;
        g.bigS = land ? Math.min(h * 0.44, w * 0.24, 320) : Math.min((rocketTop - safe.t - 84) * 0.95, w * 0.62, 320);
        // in space the rocket waits off to one side so the stars have room
        g.spaceRH = RH * (land ? 0.82 : 0.66);
        g.spaceX = land ? safe.l + Math.max(120, w * 0.14) : w / 2;
        g.spaceY = land ? h * 0.92 : h - safe.b - 20;
        g.surfaceY = h * (land ? 0.8 : 0.82);
        return g;
      }

      /* ---------- scene DOM (rebuilt for every flight) ---------- */
      let S = null; // scene parts
      const rocket = { x: 0, y: 0, rot: 0, h: 100, shake: 0 };
      const rocketEl = ctx.el('div', { class: 'rk-rocket' });
      const rocketBody = ctx.el('div', { class: 'rk-body', html: ROCKET });
      const flame = ctx.el('div', { class: 'rk-flame', html: FLAME });
      rocketEl.append(flame, rocketBody);
      const big = ctx.el('div', { class: 'rk-big' });
      const btn = ctx.el('div', { class: 'rk-btn' });
      const btnTxt = ctx.el('span');
      btn.appendChild(btnTxt);

      function art(parent, markup, cls, fun) {
        const e = ctx.el('div', { class: 'rk-art ' + (cls || ''), html: markup });
        if (fun) e.dataset.fun = fun;
        parent.appendChild(e);
        return e;
      }
      function place(el, x, y, w, h) {
        el.style.left = x.toFixed(1) + 'px'; el.style.top = y.toFixed(1) + 'px';
        el.style.width = w.toFixed(1) + 'px'; el.style.height = h.toFixed(1) + 'px';
      }

      function buildScene() {
        world.innerHTML = '';
        const P = {};
        P.sky = ctx.el('div', { class: 'rk-sky' });
        P.space = ctx.el('div', { class: 'rk-space' });
        P.spaceDots = art(P.space, skyDots(70));
        P.spaceObjs = ctx.el('div', { class: 'rk-layer', style: { opacity: 0 } });
        P.ringed = art(P.spaceObjs, RINGED, 'rk-ringed', 'boing');
        P.moon = art(P.spaceObjs, MOON, '', 'twinkle');
        P.ground = ctx.el('div', { class: 'rk-layer' });
        P.sun = art(P.ground, SUN, '', 'boing');
        P.c1 = art(P.ground, CLOUD, 'rk-cloud', 'whoosh');
        P.c2 = art(P.ground, CLOUD, 'rk-cloud', 'whoosh');
        P.hills = art(P.ground, HILLS);
        P.tower = art(P.ground, TOWER);
        P.pad = art(P.ground, PAD);
        P.fly = ctx.el('div', { class: 'rk-layer' }); // streaks & puffs
        P.stars = ctx.el('div', { class: 'rk-layer' });
        P.planet = ctx.el('div', { class: 'rk-layer' });
        P.planetArt = art(P.planet, PLANET);
        P.plants = [art(P.planet, PLANT('#FF6FB5'), '', 'boing'), art(P.planet, PLANT('#FFD21F'), '', 'boing'), art(P.planet, PLANT('#4DD6FF'), '', 'boing')];
        P.alien = ctx.el('div', { class: 'rk-alien' });
        P.alienIn = ctx.el('div', { class: 'rk-ain', html: ALIEN });
        P.alien.appendChild(P.alienIn);
        P.alien.style.display = 'none';
        P.planet.appendChild(P.alien);
        P.planet.style.visibility = 'hidden';
        world.append(P.sky, P.space, P.spaceObjs, P.ground, P.fly, P.stars, P.planet, rocketEl, big, btn);
        S = P;
      }

      function layoutScene() {
        G = measure();
        const { w, h, s, land } = G;
        if (!S) return;
        place(S.spaceDots, 0, 0, w, h);
        const rs = U.clamp(s * 0.3, 110, 260);
        place(S.ringed, land ? w * 0.6 : w - rs * 0.95, land ? G.safe.t + 10 : h * 0.14, rs, rs * 0.69);
        const ms = U.clamp(s * 0.17, 60, 150);
        place(S.moon, land ? w - G.safe.r - ms * 1.1 : w * 0.06, land ? h * 0.42 : h * 0.4, ms, ms);
        const ss = U.clamp(s * 0.2, 70, 150);
        place(S.sun, w - G.safe.r - ss * 0.95, G.safe.t + 6, ss, ss);
        place(S.c1, w * 0.12 + G.safe.l, h * (land ? 0.2 : 0.16), s * 0.3, s * 0.15);
        place(S.c2, w * (land ? 0.5 : 0.55), h * (land ? 0.1 : 0.3), s * 0.24, s * 0.12);
        place(S.hills, -10, G.groundY - h * 0.08, w + 20, h - G.groundY + h * 0.08 + 2);
        const th = G.RH * 1.02;
        place(S.tower, G.padX - G.RW * 0.5 - th * 0.3, G.padY - th, th * 0.27, th);
        place(S.pad, G.padX - G.RW * 0.75, G.padY - G.padH * 0.2, G.RW * 1.5, G.padH);
        btn.style.setProperty('--b', G.btn + 'px');
        btn.style.width = btn.style.height = G.btn + 'px';
        btn.style.left = G.btnX - G.btn / 2 + 'px';
        btn.style.top = G.btnY - G.btn / 2 + 'px';
        big.style.left = G.bigX + 'px';
        big.style.top = G.bigY + 'px';
        big.style.fontSize = G.bigS + 'px';
        // planet
        place(S.planetArt, -w * 0.1, G.surfaceY - h * 0.05, w * 1.2, h - G.surfaceY + h * 0.05 + 2);
        const ps = U.clamp(s * 0.14, 50, 120);
        place(S.plants[0], w * 0.08, G.surfaceY - ps * 1.2, ps * 0.66, ps);
        place(S.plants[1], w * 0.8, G.surfaceY - ps * 1.1, ps * 0.6, ps * 0.9);
        place(S.plants[2], w * 0.9, G.surfaceY - ps * 0.6, ps * 0.5, ps * 0.75);
        const as = U.clamp(s * 0.3, 110, 240);
        G.landX = land ? w * 0.36 : w * 0.34;
        place(S.alien, land ? w * 0.62 - as * 0.4 : w * 0.7 - as * 0.4, G.surfaceY - as * 1.05, as * 0.8, as);
        stars.forEach(layoutStar);
        if (phase === 'pad' || phase === 'count') { rocket.x = G.padX; rocket.y = G.padY; rocket.h = G.RH; }
        else if (phase === 'stars') { rocket.x = G.spaceX; rocket.y = G.spaceY; rocket.h = G.spaceRH; }
        else if (phase === 'landed') { rocket.x = G.landX; rocket.y = G.surfaceY + G.RH * 0.02; rocket.h = G.RH * 0.8; }
        drawRocket();
      }

      function drawRocket() {
        const rh = rocket.h, rw = rh * (120 / 220);
        const a = rocket.shake;
        const sx = a ? U.rand(-a, a) : 0, sy = a ? U.rand(-a, a) * 0.5 : 0;
        rocketEl.style.width = rw + 'px';
        rocketEl.style.height = rh + 'px';
        rocketEl.style.transform = `translate3d(${(rocket.x - rw / 2 + sx).toFixed(1)}px, ${(rocket.y - rh + sy).toFixed(1)}px, 0) rotate(${rocket.rot.toFixed(1)}deg)`;
      }

      /* tween numeric props of an object over ms with an easing fn */
      const EASE = {
        inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
        in: (t) => t * t * t,
        out: (t) => 1 - Math.pow(1 - t, 3),
      };
      function tween(obj, to, ms, ease) {
        const from = {};
        for (const k in to) from[k] = obj[k];
        const e = EASE[ease || 'inOut'];
        let t = 0;
        return new Promise((res) => {
          ctx.raf((dt) => {
            t += dt * 1000;
            const p = Math.min(1, t / ms), q = e(p);
            for (const k in to) obj[k] = from[k] + (to[k] - from[k]) * q;
            if (p >= 1) { res(); return false; }
            return true;
          });
        });
      }
      let worldShake = 0;
      ctx.raf(() => {
        drawRocket();
        if (worldShake > 0.2) world.style.transform = `translate(${U.rand(-worldShake, worldShake).toFixed(1)}px, ${U.rand(-worldShake, worldShake).toFixed(1)}px) scale(1.04)`;
        else if (world.style.transform) world.style.transform = '';
      });

      /* ---------- phases ---------- */
      let phase = 'pad';
      let cur = 0, lastStep = 0, hinted = false, rum = null, startN = 5;
      let stars = [], starCount = 0, starTarget = 0;

      function puff(x, y, size, dx, dy, ms) {
        const e = ctx.el('div', { class: 'rk-puff', style: { left: x - size / 2 + 'px', top: y - size / 2 + 'px', width: size + 'px', height: size + 'px' } });
        S.fly.appendChild(e);
        const an = e.animate([
          { transform: 'translate(0,0) scale(.3)', opacity: 0.95 },
          { transform: `translate(${dx}px, ${dy}px) scale(1.4)`, opacity: 0 },
        ], { duration: ms || 1200, easing: 'cubic-bezier(.2,.7,.3,1)' });
        an.onfinish = () => e.remove();
        ctx.setTimeout(() => e.remove(), (ms || 1200) + 200);
      }

      async function startFlight(first) {
        phase = 'pad';
        buildScene();
        stars = [];
        rocket.rot = 0; rocket.shake = 0;
        flame.className = 'rk-flame';
        layoutScene();
        const lvl = ctx.level;
        startN = START[lvl];
        cur = startN;
        hinted = false;
        btn.className = 'rk-btn';
        btnTxt.className = '';
        btnTxt.textContent = String(cur);
        big.textContent = '';
        big.className = 'rk-big';
        ctx.setPrompt('Tap the button!');
        ctx.poke();
        await ctx.say(first ? "Let's count down! Tap the button!" : 'Ready? Tap the button!');
      }

      function tapCountdown(fromRocket) {
        if (phase !== 'pad' && phase !== 'count') return;
        const now = performance.now();
        btn.classList.add('press');
        ctx.setTimeout(() => btn.classList.remove('press'), 140);
        if (now - lastStep < THROTTLE || cur < 1) {
          ctx.sfx('click', { vel: 0.4 });
          return;
        }
        lastStep = now;
        phase = 'count';
        const n = cur;
        const step = startN - n; // 0 ..
        big.textContent = String(n);
        big.classList.remove('pop', 'out'); void big.offsetWidth; big.classList.add('pop');
        ctx.say(Word(n) + '!');
        ctx.play('toy', RISE[Math.round((step / Math.max(1, startN - 1)) * 9)] || 'G5', { vel: 0.7 });
        ctx.drum('tom', { vel: 0.4 + step * 0.04, pitch: 110 + step * 6, bus: 'sfx' });
        const frac = (step + 1) / startN;
        rocket.shake = 1 + frac * 5;
        if (!rum) rum = ctx.rumble({ vel: 0.06, cutoff: 160 });
        rum.setLevel(0.06 + frac * 0.32);
        rum.setCutoff(160 + frac * 260);
        if (frac > 0.5) { flame.classList.add('on', 'small'); }
        if (fromRocket) rocketBody.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06, .95)' }, { transform: 'scale(1)' }], { duration: 260 });
        cur = n - 1;
        if (cur >= 1) btnTxt.textContent = String(cur);
        else {
          btnTxt.textContent = '🚀';
          btnTxt.className = 'ic pp-emoji';
          ctx.setTimeout(blastOff, 850);
        }
      }

      async function blastOff() {
        if (!ctx.alive) return;
        phase = 'launch';
        ctx.setPrompt('');
        btn.classList.add('gone');
        big.classList.add('out');
        ctx.say('Blast off!');
        ctx.sfx('blastoff', { vel: 1 });
        flame.classList.remove('small');
        flame.classList.add('on', 'big');
        if (rum) { rum.setLevel(0.75); rum.setCutoff(900); }
        rocket.shake = 7;
        worldShake = 9;
        // smoke billows from the pad
        const bx = G.padX, by = G.padY;
        for (let i = 0; i < 14; i++) {
          const side = i % 2 ? 1 : -1;
          ctx.setTimeout(() => puff(bx + side * U.rand(0, G.RW * 0.3), by - G.padH * 0.2, G.RW * U.rand(0.5, 0.9), side * U.rand(G.RW * 0.6, G.RW * 1.8), U.rand(-30, 10), 1400), i * 70);
        }
        await ctx.wait(650);
        // lift off — the camera follows: ground slides down, space fades in
        const dur = 2600;
        S.ground.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${G.h * 1.25}px)` }], { duration: dur, easing: 'cubic-bezier(.55,0,.6,1)', fill: 'forwards' });
        S.fly.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${G.h * 1.25}px)` }], { duration: dur, easing: 'cubic-bezier(.55,0,.6,1)', fill: 'forwards' });
        S.space.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur, easing: 'ease-in', fill: 'forwards' });
        S.sky.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur, easing: 'ease-in', fill: 'forwards' });
        S.spaceObjs.animate([{ transform: `translateY(${-G.h * 0.8}px)`, opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: dur + 600, easing: 'cubic-bezier(.3,.6,.3,1)', fill: 'forwards' });
        streaks(dur + 400);
        tween(rocket, { y: G.h * 0.62 }, 1500, 'in').then(() => { worldShake = 3; });
        ctx.setTimeout(() => { worldShake = 0; rocket.shake = 1.2; if (rum) { rum.stop(1.6); rum = null; } flame.classList.remove('big'); }, dur - 300);
        await ctx.wait(dur + 200);
        // glide to a corner so the stars have room
        flame.classList.add('small');
        await tween(rocket, { x: G.spaceX, y: G.spaceY, h: G.spaceRH }, 1100, 'inOut');
        rocket.shake = 0.6;
        countStars();
      }

      function streaks(ms) {
        for (let i = 0; i < 14; i++) {
          ctx.setTimeout(() => {
            if (!S) return;
            const len = U.rand(60, 160);
            const e = ctx.el('div', { class: 'rk-streak', style: { left: U.rand(0, G.w) + 'px', top: -len + 'px', height: len + 'px' } });
            S.stars.appendChild(e);
            const an = e.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${G.h + len * 2}px)` }], { duration: U.rand(500, 800), easing: 'linear' });
            an.onfinish = () => e.remove();
          }, U.rand(300, ms - 400));
        }
      }

      /* ---------- star counting ---------- */
      function starSize(n) { return U.clamp(G.s * (n <= 4 ? 0.27 : n <= 6 ? 0.23 : 0.2), 80, 170); }
      function starSpots(n) {
        const { w, h, safe } = G;
        const size = starSize(n);
        const rw = G.spaceRH * (120 / 220);
        const zones = [
          { x: 0, y: 0, w: safe.l + 104, h: safe.t + 104 },
          { x: G.spaceX - rw * 0.8, y: G.spaceY - G.spaceRH * 1.05, w: rw * 1.6, h: G.spaceRH * 1.1 },
        ];
        [S.moon, S.ringed].forEach((el) => {
          const z = { x: parseFloat(el.style.left), y: parseFloat(el.style.top), w: parseFloat(el.style.width), h: parseFloat(el.style.height) };
          zones.push({ x: z.x + z.w * 0.12, y: z.y + z.h * 0.12, w: z.w * 0.76, h: z.h * 0.76 });
        });
        const area = { x: safe.l + 10, y: safe.t + 14, w: w - safe.l - safe.r - 20, h: h - safe.t - safe.b - 24 };
        let best = null;
        for (let k = 0; k < 6 && !best; k++) {
          const sz = size * Math.pow(0.9, k);
          const cols = Math.max(1, Math.floor(area.w / (sz * 1.25))), rows = Math.max(1, Math.floor(area.h / (sz * 1.2)));
          const cw = area.w / cols, ch = area.h / rows;
          const cells = [];
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            const cx = area.x + (c + 0.5) * cw, cy = area.y + (r + 0.5) * ch;
            const hit = zones.some((z) => cx + sz * 0.45 > z.x && cx - sz * 0.45 < z.x + z.w && cy + sz * 0.45 > z.y && cy - sz * 0.45 < z.y + z.h);
            if (!hit) cells.push({ cx, cy, cw, ch });
          }
          if (cells.length >= n) best = { sz, cells };
        }
        if (!best) best = { sz: size * 0.55, cells: [{ cx: w / 2, cy: h / 2, cw: 0, ch: 0 }] };
        // pick n well-spread cells
        const pickd = [];
        const pool = ctx.shuffle(best.cells);
        pickd.push(pool.shift());
        while (pickd.length < n && pool.length) {
          let bi = 0, bd = -1;
          pool.forEach((c, i) => {
            const d = Math.min(...pickd.map((p) => Math.hypot(p.cx - c.cx, p.cy - c.cy))) * U.rand(0.85, 1.15);
            if (d > bd) { bd = d; bi = i; }
          });
          pickd.push(pool.splice(bi, 1)[0]);
        }
        while (pickd.length < n) pickd.push(pickd[pickd.length % Math.max(1, pickd.length)]);
        return pickd.map((c) => ({ x: c.cx + U.rand(-1, 1) * Math.max(0, (c.cw - best.sz) / 2) * 0.6, y: c.cy + U.rand(-1, 1) * Math.max(0, (c.ch - best.sz) / 2) * 0.6, s: best.sz }));
      }
      function layoutStar(st) {
        st.el.style.left = st.pos.x - st.pos.s / 2 + 'px';
        st.el.style.top = st.pos.y - st.pos.s / 2 + 'px';
        st.el.style.width = st.el.style.height = st.pos.s + 'px';
        st.el.style.setProperty('--s', st.pos.s + 'px');
      }

      async function countStars() {
        phase = 'stars';
        const [lo, hi] = STARS[ctx.level];
        starTarget = U.randInt(lo, hi);
        starCount = 0;
        const spots = starSpots(starTarget);
        stars = spots.map((pos, i) => {
          const el = ctx.el('div', { class: 'rk-star in' });
          const sin = ctx.el('div', { class: 'rk-sin', html: STAR, style: { animationDelay: i * 0.09 + 's' } });
          const badge = ctx.el('div', { class: 'rk-badge' });
          el.append(sin, badge);
          const st = { el, sin, badge, pos, on: false, i };
          el._st = st;
          S.stars.appendChild(el);
          layoutStar(st);
          ctx.setTimeout(() => { el.classList.remove('in'); sin.style.animationDelay = -U.rand(0, 3).toFixed(2) + 's'; }, 700 + i * 90);
          return st;
        });
        ctx.sfx('twinkle', { vel: 0.5 });
        ctx.setPrompt('Tap the stars!');
        ctx.poke();
        await ctx.say("Let's count the stars!");
      }

      function tapStar(st) {
        if (phase !== 'stars') return;
        if (st.on) {
          st.sin.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 300 });
          ctx.sfx('tap', { vel: 0.3 });
          return;
        }
        st.on = true;
        st.el.classList.remove('pp-glow');
        const k = ++starCount;
        st.el.classList.add('on');
        st.badge.textContent = String(k);
        ctx.play('bell', SCALE[k - 1] || 'E6', { vel: 0.85 });
        ctx.sfx('ding', { vel: 0.25 });
        ctx.say(Word(k) + '!');
        const r = st.el.getBoundingClientRect();
        PP.fx.floatText(r.left + r.width / 2, r.top + r.height * 0.2, String(k), { color: '#FFD84A', size: U.clamp(G.s * 0.2, 72, 140) });
        PP.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { emoji: ['✨'], count: 5, size: 24, distance: r.width * 0.7 });
        st.sin.animate([{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.35) rotate(25deg)' }, { transform: 'scale(1) rotate(0)' }], { duration: 500, easing: 'cubic-bezier(.3,1.5,.5,1)' });
        if (k === starTarget) {
          phase = 'starsdone';
          ctx.setTimeout(starsDone, 900);
        }
      }

      async function starsDone() {
        if (!ctx.alive) return;
        // quick sparkle recap, then the total
        stars.forEach((st, i) => ctx.setTimeout(() => st.sin.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 400 }), i * 90));
        ctx.sfx('sparkle', { vel: 0.5 });
        big.textContent = String(starTarget);
        big.style.left = G.w / 2 + 'px';
        big.style.top = G.h * 0.42 + 'px';
        big.style.fontSize = Math.min(G.s * 0.42, 300) + 'px';
        big.className = 'rk-big';
        void big.offsetWidth;
        big.classList.add('pop');
        await Promise.all([ctx.say(`${Word(starTarget)} stars!`), ctx.wait(1500)]);
        await ctx.wait(300);
        big.classList.add('out');
        land();
      }

      /* ---------- landing ---------- */
      async function land() {
        phase = 'landing';
        ctx.setPrompt('');
        ctx.say('Look! A planet!');
        S.stars.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(${-G.h * 0.6}px)`, opacity: 0 }], { duration: 1800, easing: 'ease-in', fill: 'forwards' });
        S.spaceObjs.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-G.h * 0.3}px)` }], { duration: 1800, easing: 'ease-in-out', fill: 'forwards' });
        S.planet.style.visibility = 'visible';
        S.planet.animate([{ transform: `translateY(${G.h * 0.6}px)` }, { transform: 'translateY(0)' }], { duration: 1900, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' });
        flame.classList.remove('small');
        flame.classList.add('on');
        // swoop over, then descend gently
        await tween(rocket, { x: G.landX, y: G.surfaceY - G.RH * 0.5, h: G.RH * 0.8 }, 1500, 'inOut');
        flame.classList.add('small');
        await tween(rocket, { y: G.surfaceY + G.RH * 0.02 }, 1100, 'out');
        flame.classList.remove('on', 'small');
        rocket.shake = 0;
        ctx.drum('kick', { vel: 0.7, bus: 'sfx' });
        for (let i = 0; i < 8; i++) {
          const side = i % 2 ? 1 : -1;
          puffDust(G.landX + side * U.rand(0, G.RW * 0.3), G.surfaceY, side);
        }
        rocketBody.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.08,.9)' }, { transform: 'scale(1,1)' }], { duration: 380, easing: 'ease-out', transformOrigin: '50% 100%' });
        phase = 'landed';
        await ctx.wait(450);
        S.alien.style.display = '';
        S.alien.classList.add('show');
        ctx.sfx('boing', { vel: 0.6 });
        await ctx.wait(350);
        await ctx.say('Hi! Hi!', { pitch: 1.6, rate: 1.05 });
        ctx.success(!hinted);
        await ctx.celebrate({ say: `${ctx.praise()} We landed!`, y: G.h * 0.4 });
        ctx.setPrompt('Fly again?');
        const nb = PP.kit.nextButton(ctx, () => {
          if (nextLock) return;
          nextLock = true;
          nb.remove();
          flyHome();
        });
        nextBtn = nb;
        ctx.poke();
      }
      let nextLock = false, nextBtn = null;
      function puffDust(x, y, side) {
        const e = ctx.el('div', { class: 'rk-puff', style: { left: x - 20 + 'px', top: y - 20 + 'px', width: '40px', height: '40px', background: 'radial-gradient(circle at 40% 35%, #E6DAFF, #B9A2FF 75%)' } });
        S.planet.appendChild(e);
        const an = e.animate([{ transform: 'scale(.3)', opacity: 1 }, { transform: `translate(${side * U.rand(40, 110)}px, ${U.rand(-30, -5)}px) scale(1.4)`, opacity: 0 }], { duration: 900, easing: 'ease-out' });
        an.onfinish = () => e.remove();
      }

      async function flyHome() {
        phase = 'home';
        nextBtn = null;
        ctx.sfx('whoosh', { vel: 0.6 });
        flame.classList.add('on');
        S.alien.querySelector('.rk-wave');
        tween(rocket, { y: -G.RH * 0.2 }, 900, 'in');
        await ctx.wait(500);
        const fade = world.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' });
        await ctx.wait(420);
        nextLock = false;
        await startFlightFade(fade);
      }
      async function startFlightFade(fade) {
        const p = startFlight(false);
        fade.cancel();
        world.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450 });
        await p;
      }

      /* ---------- input ---------- */
      ctx.on(stage, 'pointerdown', (e) => {
        if (e.button > 0) return;
        const t = e.target;
        if (!t || !t.closest) return;
        if (t.closest('.pp-next')) return;
        if (t.closest('.rk-btn')) { e.preventDefault(); tapCountdown(false); return; }
        if (t.closest('.rk-rocket')) {
          e.preventDefault();
          if (phase === 'pad' || phase === 'count') { tapCountdown(true); return; }
          rocketBody.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(0)' }], { duration: 500 });
          ctx.sfx('boing', { vel: 0.4 });
          if (phase === 'stars' || phase === 'landed') ctx.say('Whee!', { mode: 'skip' });
          return;
        }
        const st = t.closest('.rk-star');
        if (st && st._st) { e.preventDefault(); tapStar(st._st); return; }
        if (t.closest('.rk-alien')) {
          S.alienIn.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-18%) scale(1.05,.95)' }, { transform: 'translateY(0) scale(1)' }], { duration: 450, easing: 'cubic-bezier(.3,1.5,.5,1)' });
          ctx.sfx('boing', { vel: 0.5 });
          ctx.say(U.pick(['Hi!', 'Hee hee!', 'Hello!', 'Wheee!']), { pitch: 1.6, rate: 1.05 });
          return;
        }
        const fun = t.closest('[data-fun]');
        if (fun) {
          ctx.sfx(fun.dataset.fun, { vel: 0.5 });
          fun.animate([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-10deg) scale(1.12)' }, { transform: 'rotate(8deg) scale(.96)' }, { transform: 'rotate(0) scale(1)' }], { duration: 600, easing: 'ease-out' });
          return;
        }
        PP.fx.burst(e.clientX, e.clientY, { emoji: phase === 'pad' || phase === 'count' ? ['✨', '☁️'] : ['✨', '⭐'], count: 4, size: 24, distance: 56 });
        ctx.sfx('tap', { vel: 0.25 });
      });

      ctx.idle(7000, () => {
        if (phase === 'pad' || phase === 'count') {
          hinted = true;
          PP.fx.glow(btn, 2600);
          ctx.say('Tap the button!');
        } else if (phase === 'stars') {
          const left = stars.filter((s) => !s.on);
          if (!left.length) return;
          hinted = true;
          PP.fx.glow(U.pick(left).el);
          ctx.say('Tap the stars!');
        } else if (phase === 'landed' && nextBtn) {
          PP.fx.glow(nextBtn, 2600);
          ctx.say('Fly again?');
        }
      });

      ctx.onResize(() => {
        layoutScene();
        if (phase === 'stars') {
          const spots = starSpots(stars.length);
          stars.forEach((st, i) => { st.pos = spots[i]; layoutStar(st); });
        }
      });

      startFlight(true);
      return { destroy() { if (rum) { try { rum.stop(0.1); } catch (e) {} } } };
    },
  });
})();
