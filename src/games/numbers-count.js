/* Count with me! — one-to-one counting with musical numbers.
 *
 * Rotating original scenes: apples drop into a basket, ducks hop into the pond, sleepy stars light up,
 * birthday candles light, bees fly into the honeycomb, a ladybug gets her spots.
 * Tap every item in ANY order: it moves / changes (so it can't be counted twice), Pip says "One!",
 * a big numeral floats up and a note climbs the major scale. Then a recap counts them all again
 * ("One, two, three…") and names the total ("Three apples!") with a numeral + dot pattern.
 *
 * Level 1: 1–3 items · L2: 2–4 · L3: 3–6 · L4: 4–8 · L5: 5–10.
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;
  const NUM = PP.data.NUMBERS;
  const Word = (n) => U.cap(NUM[n] || String(n));
  const SCALE = ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6', 'D6', 'E6'];
  const N_RANGE = [null, [1, 3], [2, 4], [3, 6], [4, 8], [5, 10]];
  const GAP = 620; // ms between spoken counts (long enough for iOS to finish 'seven' before the next number) (fast taps are queued so every number is said)

  U.addDefs('count', `
    <radialGradient id="ct-glow-g" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#FFF8C8" stop-opacity=".95"/><stop offset=".42" stop-color="#FFE45C" stop-opacity=".5"/><stop offset="1" stop-color="#FFE45C" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ct-moon-g" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#FFFBE6"/><stop offset="1" stop-color="#FFE7A0"/></radialGradient>
    <linearGradient id="ct-pond-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7AD3FA"/><stop offset="1" stop-color="#2F9FE0"/></linearGradient>
    <clipPath id="ct-bee-clip"><ellipse cx="44" cy="60" rx="31" ry="24"/></clipPath>
  `);

  /* ======================================================================
   * styles
   * ==================================================================== */
  U.addStyles('count', `
    .g-count { background: #BFE9FF; }
    .ct-root { position: absolute; inset: 0; overflow: hidden; }
    .ct-probe { position: absolute; left: var(--safe-l); top: var(--safe-t); right: var(--safe-r); bottom: var(--safe-b); pointer-events: none; visibility: hidden; }
    .ct-scene { position: absolute; inset: 0; overflow: hidden; will-change: transform; }
    .ct-layer { position: absolute; inset: 0; pointer-events: none; }
    .ct-items { position: absolute; inset: 0; pointer-events: none; }
    .ct-art { position: absolute; pointer-events: none; }
    .ct-art > svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .ct-art[data-fun] { pointer-events: auto; }

    .ct-item { position: absolute; pointer-events: auto; border-radius: 50%; touch-action: none; }
    .ct-item::before { content: ""; position: absolute; inset: -11%; border-radius: 50%; }
    .ct-item.pend { pointer-events: none; }
    .ct-in { position: absolute; inset: 0; }
    .ct-in > svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .ct-item.ct-pop .ct-in { animation: ct-popin .55s cubic-bezier(.3,1.6,.5,1) both !important; }
    .ct-item.pp-glow { border-radius: 50%; }
    @keyframes ct-popin { from { transform: scale(0) rotate(-14deg); opacity: 0 } to { transform: scale(1) rotate(0); opacity: 1 } }
    @keyframes ct-bob { 0%, 100% { transform: translateY(0) rotate(-2deg) } 50% { transform: translateY(-6%) rotate(2deg) } }
    @keyframes ct-sway { 0%, 100% { transform: rotate(-4deg) } 50% { transform: rotate(4deg) } }
    @keyframes ct-spin { to { transform: rotate(360deg) } }
    @keyframes ct-drift { 0%, 100% { transform: translateX(0) } 50% { transform: translateX(26px) } }
    @keyframes ct-twinkle { 0%, 100% { transform: scale(1) rotate(0) } 50% { transform: scale(1.07) rotate(6deg) } }
    @keyframes ct-tw { 0%, 100% { opacity: .25 } 50% { opacity: 1 } }
    @keyframes ct-flicker { 0%, 100% { transform: scale(1, 1) rotate(-2deg) } 30% { transform: scale(.94, 1.08) rotate(3deg) } 60% { transform: scale(1.05, .95) rotate(-3deg) } }
    @keyframes ct-flap { from { transform: scaleY(1) } to { transform: scaleY(.55) } }
    @keyframes ct-hover { 0%, 100% { transform: translateY(0) rotate(-3deg) } 50% { transform: translateY(-9%) rotate(3deg) } }
    @keyframes ct-ripple { 0% { transform: translate(-50%,-50%) scale(.3); opacity: .9 } 100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0 } }

    /* tally pill */
    .ct-tally { position: absolute; z-index: 20; left: 50%; top: calc(var(--safe-t) + 12px); transform: translateX(-50%);
      display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; padding: 8px 12px; border-radius: calc(var(--d) * .5 + 10px); background: rgba(255,255,255,.82);
      box-shadow: 0 4px 0 rgba(30,40,90,.10), 0 8px 18px rgba(30,40,90,.14); transition: opacity .3s; pointer-events: none; }
    .ct-tally.hide { opacity: 0; }
    .ct-dot { width: var(--d); height: var(--d); border-radius: 50%; border: 3px dashed rgba(43,35,64,.25); background: rgba(255,255,255,.7);
      display: grid; place-items: center; font-weight: 900; color: #fff; font-size: calc(var(--d) * .55); line-height: 1; }
    .ct-dot.on { border: 3px solid rgba(255,255,255,.95); background: var(--c); box-shadow: 0 2px 0 rgba(0,0,0,.15); animation: ct-dotpop .45s cubic-bezier(.3,1.7,.5,1); text-shadow: 0 1px 0 rgba(0,0,0,.25); }
    .ct-dot.beat { animation: ct-dotbeat .5s cubic-bezier(.3,1.7,.5,1); }
    @keyframes ct-dotpop { from { transform: scale(.2) } to { transform: scale(1) } }
    @keyframes ct-dotbeat { 0% { transform: scale(1) } 40% { transform: scale(1.45) } 100% { transform: scale(1) } }

    /* result card: numeral + dot pattern */
    .ct-result { position: absolute; z-index: 25; left: 50%; top: 46%; display: flex; align-items: center; gap: calc(var(--rs) * .12);
      padding: calc(var(--rs) * .12) calc(var(--rs) * .18); border-radius: calc(var(--rs) * .22); background: rgba(255,255,255,.94);
      border: 5px solid #fff; box-shadow: 0 8px 0 rgba(30,40,90,.12), 0 18px 40px rgba(30,40,90,.25);
      transform: translate(-50%,-50%) scale(0); opacity: 0; pointer-events: none; }
    .ct-result.show { animation: ct-resin .6s cubic-bezier(.3,1.6,.5,1) forwards; }
    .ct-result.out { animation: ct-resout .35s ease-in forwards; }
    @keyframes ct-resin { from { transform: translate(-50%,-50%) scale(0) rotate(-12deg); opacity: 0 } to { transform: translate(-50%,-50%) scale(1) rotate(0); opacity: 1 } }
    @keyframes ct-resout { from { transform: translate(-50%,-50%) scale(1); opacity: 1 } to { transform: translate(-50%,-50%) scale(.4); opacity: 0 } }
    .ct-rnum { font-weight: 900; font-size: var(--rs); line-height: .9; color: var(--c); min-width: calc(var(--rs) * .62); text-align: center;
      -webkit-text-stroke: calc(var(--rs) * .03) rgba(43,35,64,.55); paint-order: stroke fill; text-shadow: 0 calc(var(--rs) * .04) 0 rgba(43,35,64,.18); }
    .ct-rdots { position: relative; width: calc(var(--rs) * .9); height: calc(var(--rs) * .9); border-radius: calc(var(--rs) * .16); background: #F3F1FA; }
    .ct-rdots span { position: absolute; width: calc(var(--rs) * .17); height: calc(var(--rs) * .17); margin: calc(var(--rs) * -.085) 0 0 calc(var(--rs) * -.085);
      border-radius: 50%; background: var(--c); box-shadow: inset 0 -3px 0 rgba(0,0,0,.18); animation: ct-dotpop .4s cubic-bezier(.3,1.7,.5,1) both; }

    /* --- apples --- */
    .ct-s-apples { background: linear-gradient(#7FD0FF 0%, #B6E7FF 48%, #E2F7FF 80%); }
    .ct-rays { transform-box: fill-box; transform-origin: 50% 50%; animation: ct-spin 40s linear infinite; }
    .ct-cloud { animation: ct-drift 14s ease-in-out infinite; opacity: .95; }
    .ct-cloud.c2 { animation-duration: 19s; animation-delay: -6s; }

    /* --- ducks --- */
    .ct-s-ducks { background: linear-gradient(#8DD8FF 0%, #CDEFFF 30%, #E9F8FF 42%); }
    .dk-swim-only { display: none; }
    .ct-item.swim .dk-swim-only { display: inline; }
    .ct-item.swim .dk-land-only { display: none; }
    .ct-item.swim .ct-in { animation: ct-bob 2.2s ease-in-out infinite; }
    .ct-ring { position: absolute; width: 10px; height: 10px; border-radius: 50%; border: 4px solid rgba(255,255,255,.9); pointer-events: none; animation: ct-ripple .9s ease-out forwards; }
    .ct-reeds { transform-origin: 50% 100%; animation: ct-sway 4s ease-in-out infinite; }

    /* --- stars --- */
    .ct-s-stars { background: linear-gradient(#10164A 0%, #262A72 45%, #4B3B8E 80%, #6A4A9C 100%); }
    .ct-skydots circle.tw { animation: ct-tw 2.6s ease-in-out infinite; }
    .st-body { fill: #6F6CB4; stroke: #6F6CB4; transition: fill .35s, stroke .35s; }
    .st-halo { opacity: 0; transition: opacity .4s; }
    .st-awake { display: none; }
    .ct-item.on .st-body { fill: #FFD84A; stroke: #FFC52E; }
    .ct-item.on .st-halo { opacity: 1; }
    .ct-item.on .st-awake { display: inline; }
    .ct-item.on .st-sleep { display: none; }
    .ct-item.on .ct-in { animation: ct-twinkle 2.4s ease-in-out infinite; }
    .ct-item.sleepy .ct-in { animation: ct-bob 3.4s ease-in-out infinite; }

    /* --- cake --- */
    .ct-s-cake { background:
      radial-gradient(circle, rgba(255,255,255,.55) 0 5px, transparent 6px) 0 0 / 46px 46px,
      radial-gradient(circle, rgba(255,255,255,.35) 0 4px, transparent 5px) 23px 23px / 46px 46px,
      linear-gradient(#FFE3EE, #FFD3E3); }
    .cd-flame { transform-box: fill-box; transform-origin: 50% 90%; transform: scale(0); transition: transform .35s cubic-bezier(.3,1.7,.5,1); }
    .cd-glow { opacity: 0; transition: opacity .4s; }
    .ct-item.on .cd-flame { transform: scale(1); }
    .ct-item.on .cd-flame > g { transform-box: fill-box; transform-origin: 50% 90%; animation: ct-flicker .5s ease-in-out infinite; }
    .ct-item.on .cd-glow { opacity: 1; }
    .ct-item.out .cd-flame { transform: scale(0); transition: transform .25s ease-in; }
    .ct-item.out .cd-glow { opacity: 0; }
    .ct-candle.ct-item::before { inset: -4% -12%; border-radius: 30%; }
    .ct-candle.pp-glow { border-radius: 30%; }
    .ct-bunting { animation: ct-sway 6s ease-in-out infinite; transform-origin: 50% 0; }
    .ct-balloon > svg { transform-origin: 50% 100%; animation: ct-sway 3.6s ease-in-out infinite; }
    .ct-balloon.b2 > svg { animation-duration: 4.3s; animation-delay: -1.4s; }
    .ct-balloon.b3 > svg { animation-duration: 3.9s; animation-delay: -2.4s; }

    /* --- bees --- */
    .ct-s-bees { background: linear-gradient(#9EE0FF 0%, #D6F3FF 45%, #EAFBE8 70%); }
    .bee-wings { transform-box: fill-box; transform-origin: 50% 100%; animation: ct-flap .09s ease-in-out infinite alternate; }
    .ct-item.bee .ct-in { animation: ct-hover 1.5s ease-in-out infinite; }
    .ct-item.bee.rest .ct-in { animation: ct-twinkle 2.8s ease-in-out infinite; }
    .ct-item.bee.rest .bee-wings { animation: none; }
    .ct-flower { transform-origin: 50% 100%; animation: ct-sway 5s ease-in-out infinite; }

    /* --- ladybug --- */
    .ct-s-ladybug { background: radial-gradient(120% 90% at 50% 0%, #F4FFE8 0%, #D2F5C4 55%, #A8E39A 100%); }
    .ct-bug { position: absolute; pointer-events: none; }
    .ct-bug > .ct-bugart { position: absolute; inset: 0; }
    .ct-bug > .ct-bugart > svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .ct-spot .sp-on { opacity: 0; transform: scale(.2); transform-box: fill-box; transform-origin: 50% 50%; transition: transform .35s cubic-bezier(.3,1.8,.5,1), opacity .2s; }
    .ct-item.on.ct-spot .sp-on { opacity: 1; transform: scale(1); }
    .ct-item.on.ct-spot .sp-off { opacity: 0; }
    .ct-spot .sp-off { transition: opacity .2s; }
    .ct-antenna { transform-box: fill-box; transform-origin: 50% 100%; animation: ct-sway 2.2s ease-in-out infinite; }

    .ct-hl { animation: ct-hlring .6s ease-out; }
    @keyframes ct-hlring { 0% { box-shadow: 0 0 0 0 rgba(255,228,92,.95) } 100% { box-shadow: 0 0 0 26px rgba(255,228,92,0) } }
  `);

  /* ======================================================================
   * art (all original, drawn here)
   * ==================================================================== */
  function starPath(cx, cy, R, r, n) {
    n = n || 5;
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / n;
      const rad = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + (cx + rad * Math.cos(a)).toFixed(1) + ' ' + (cy + rad * Math.sin(a)).toFixed(1) + ' ';
    }
    return d + 'Z';
  }
  function hexPath(cx, cy, R) {
    let d = '';
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 3;
      d += (i ? 'L' : 'M') + (cx + R * Math.cos(a)).toFixed(1) + ' ' + (cy + R * Math.sin(a)).toFixed(1) + ' ';
    }
    return d + 'Z';
  }

  const SUN = (() => {
    let rays = '';
    for (let i = 0; i < 12; i++) rays += `<rect x="56" y="2" width="8" height="20" rx="4" transform="rotate(${i * 30} 60 60)"/>`;
    return `<svg viewBox="0 0 120 120"><g class="ct-rays" fill="#FFD84A">${rays}</g>
      <circle cx="60" cy="60" r="35" fill="#FFCF2E"/><circle cx="60" cy="60" r="35" fill="url(#pp-shine)"/>
      <circle cx="49" cy="56" r="3.6" fill="#7A4A12"/><circle cx="71" cy="56" r="3.6" fill="#7A4A12"/>
      <path d="M50 67 Q60 76 70 67" stroke="#7A4A12" stroke-width="3.6" fill="none" stroke-linecap="round"/>
      <ellipse cx="43" cy="66" rx="5" ry="3" fill="#FF8A5B" opacity=".55"/><ellipse cx="77" cy="66" rx="5" ry="3" fill="#FF8A5B" opacity=".55"/></svg>`;
  })();
  const CLOUD = `<svg viewBox="0 0 160 80"><path d="M30 72 C 8 72, 4 48, 24 42 C 22 20, 52 12, 64 28 C 72 6, 112 6, 116 32 C 138 26, 156 46, 142 62 C 148 70, 140 72, 132 72 Z" fill="#fff"/><path d="M30 72 C 20 72, 14 66, 16 60 C 40 66, 110 66, 142 60 C 146 68, 140 72, 132 72 Z" fill="#E4F2FF"/></svg>`;
  const HILL = `<svg viewBox="0 0 400 120" preserveAspectRatio="none"><path d="M0 34 C 70 8, 150 26, 220 18 C 300 8, 360 26, 400 20 V120 H0 Z" fill="#9BE07E"/><path d="M0 60 C 100 36, 200 58, 280 48 C 340 40, 380 50, 400 48 V120 H0 Z" fill="#74CF63"/></svg>`;
  const TRUNK = `<svg viewBox="0 0 100 200" preserveAspectRatio="none">
    <path d="M44 40 C 34 30, 22 26, 10 12" stroke="#8B5A2B" stroke-width="12" stroke-linecap="round" fill="none"/>
    <path d="M56 50 C 66 38, 78 32, 92 24" stroke="#8B5A2B" stroke-width="11" stroke-linecap="round" fill="none"/>
    <path d="M36 0 C 40 60, 36 140, 22 196 C 20 202, 80 202, 78 196 C 64 140, 60 60, 64 0 Z" fill="#8B5A2B"/>
    <path d="M47 10 C 49 70, 47 140, 40 190" stroke="#A9733F" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>
    <path d="M60 120 C 58 140, 60 160, 64 180" stroke="#6E4520" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/></svg>`;
  const CANOPY = `<svg viewBox="0 0 320 240" preserveAspectRatio="none">
    <g fill="#2F9E47"><circle cx="66" cy="128" r="62"/><circle cx="128" cy="78" r="72"/><circle cx="200" cy="72" r="70"/><circle cx="260" cy="122" r="58"/>
      <circle cx="160" cy="146" r="88"/><circle cx="80" cy="182" r="54"/><circle cx="240" cy="182" r="56"/></g>
    <g fill="#46B655"><circle cx="70" cy="120" r="52"/><circle cx="130" cy="72" r="62"/><circle cx="198" cy="66" r="60"/><circle cx="254" cy="116" r="48"/>
      <circle cx="160" cy="136" r="76"/><circle cx="86" cy="172" r="44"/><circle cx="234" cy="172" r="46"/></g>
    <g fill="#6CD06A" opacity=".85"><circle cx="112" cy="52" r="26"/><circle cx="184" cy="44" r="22"/><circle cx="58" cy="100" r="18"/><circle cx="248" cy="96" r="16"/></g></svg>`;
  const BASKET_BACK = `<svg viewBox="0 0 200 140"><path d="M14 30 C 30 -14, 170 -14, 186 30" stroke="#A8692F" stroke-width="9" fill="none" stroke-linecap="round"/>
    <ellipse cx="100" cy="34" rx="94" ry="24" fill="#7A4A1F"/><ellipse cx="100" cy="38" rx="84" ry="17" fill="#5A3412"/></svg>`;
  const BASKET_FRONT = `<svg viewBox="0 0 200 140">
    <path d="M6 34 C 10 82, 26 128, 46 134 L 154 134 C 174 128, 190 82, 194 34 C 160 56, 40 56, 6 34 Z" fill="#CF8F48"/>
    <g stroke="#A86C30" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="15 9">
      <path d="M16 68 C 60 80, 140 80, 184 68"/><path d="M24 96 C 64 108, 136 108, 176 96"/><path d="M36 122 C 70 130, 130 130, 164 122"/></g>
    <path d="M146 60 C 152 90, 156 110, 150 132 L 154 134 C 174 128, 190 82, 194 34 C 180 46, 166 52, 146 60 Z" fill="#B8783A" opacity=".55"/>
    <path d="M6 34 C 40 58, 160 58, 194 34" stroke="#E7AD63" stroke-width="13" fill="none" stroke-linecap="round"/>
    <path d="M30 44 C 60 54, 100 56, 130 54" stroke="#F6CD8E" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/></svg>`;
  const APPLE = `<svg viewBox="0 0 100 100">
    <path d="M50 28 C 40 17, 12 20, 12 48 C 12 75, 32 95, 50 88 C 68 95, 88 75, 88 48 C 88 20, 60 17, 50 28 Z" fill="#EC3A30"/>
    <path d="M50 88 C 68 95, 88 75, 88 48 C 88 40, 86 34, 82 29 C 84 60, 72 84, 50 88 Z" fill="#B71E18" opacity=".42"/>
    <ellipse cx="30" cy="46" rx="7" ry="12.5" fill="#fff" opacity=".55" transform="rotate(18 30 46)"/>
    <path d="M50 30 C 50 22, 51 15, 55 9" stroke="#6B3E1E" stroke-width="5.5" stroke-linecap="round" fill="none"/>
    <path d="M54 17 C 60 5, 79 5, 85 12 C 77 23, 62 23, 54 17 Z" fill="#4CB050"/>
    <path d="M57 16 C 65 13, 73 12, 81 12" stroke="#2E8B3A" stroke-width="2" fill="none" opacity=".6"/></svg>`;

  const DUCK = (flip) => `<svg viewBox="0 0 100 100"><g ${flip ? 'transform="translate(100 0) scale(-1 1)"' : ''}>
    <ellipse class="dk-land-only" cx="50" cy="93" rx="30" ry="5" fill="rgba(30,60,20,.18)"/>
    <g class="dk-land-only" fill="#FF8A1F"><path d="M38 84 l-7 9 h14 z"/><path d="M56 84 l-5 9 h14 z"/></g>
    <path d="M12 58 C 8 44, 20 38, 28 48 C 40 42, 72 42, 82 58 C 90 74, 76 90, 52 90 C 30 90, 14 80, 12 58 Z" fill="#FFD43B"/>
    <path d="M36 62 C 44 53, 60 55, 62 66 C 56 75, 42 75, 36 62 Z" fill="#F4B526"/>
    <circle cx="66" cy="38" r="20" fill="#FFD43B"/>
    <path d="M60 19 C 58 10, 65 8, 67 14 C 69 8, 77 10, 71 20 Z" fill="#FFD43B"/>
    <path d="M82 37 C 92 34, 98 39, 95 44 C 91 49, 84 47, 80 44 Z" fill="#FF8A1F"/>
    <path d="M83 43 C 88 44, 92 44, 95 43" stroke="#D96A0C" stroke-width="1.6" fill="none"/>
    <circle cx="72" cy="34" r="4.4" fill="#2B2340"/><circle cx="73.6" cy="32.5" r="1.6" fill="#fff"/>
    <ellipse cx="67" cy="46" rx="5" ry="3" fill="#FF9AA2" opacity=".75"/>
    <ellipse cx="58" cy="28" rx="6" ry="3.6" fill="#fff" opacity=".55" transform="rotate(-20 58 28)"/>
    <g class="dk-swim-only"><path d="M2 78 C 20 72, 80 72, 98 78 L 98 100 L 2 100 Z" fill="#5BC0F2"/>
      <path d="M8 80 q8 -5 16 0 q8 5 16 0 q8 -5 16 0 q8 5 16 0 q8 -5 16 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/></g></g></svg>`;
  const POND = `<svg viewBox="0 0 300 160" preserveAspectRatio="none">
    <ellipse cx="150" cy="84" rx="149" ry="74" fill="#5DB851"/>
    <ellipse cx="150" cy="80" rx="140" ry="67" fill="#2E97D4"/>
    <ellipse cx="150" cy="86" rx="132" ry="60" fill="url(#ct-pond-g)"/>
    <ellipse cx="150" cy="96" rx="112" ry="44" fill="#5BC0F2"/>
    <g stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"><path d="M62 64 q12 -6 24 0"/><path d="M200 120 q12 -6 24 0"/><path d="M118 128 q10 -5 20 0"/><path d="M220 58 q8 -4 16 0"/></g></svg>`;
  const LILY = `<svg viewBox="0 0 100 60"><path d="M50 30 L 92 24 C 96 46, 70 58, 50 58 C 22 58, 4 46, 6 30 C 8 12, 34 4, 50 4 C 66 4, 86 10, 92 22 Z" fill="#43A94A"/>
    <path d="M50 30 L 92 24" stroke="#2F8A39" stroke-width="2"/><path d="M50 30 C 40 20, 30 18, 20 22" stroke="#6CC66A" stroke-width="2" fill="none"/>
    <g transform="translate(34 22)"><circle cx="0" cy="0" r="9" fill="#FF8FC0"/><circle cx="0" cy="-2" r="6" fill="#FFB8D8"/><circle cx="0" cy="-1" r="3" fill="#FFE066"/></g></svg>`;
  const REEDS = `<svg viewBox="0 0 80 160"><g class="ct-reeds">
    <path d="M20 160 C 22 110, 18 70, 22 30" stroke="#4E9A3A" stroke-width="5" fill="none" stroke-linecap="round"/>
    <rect x="15" y="26" width="13" height="38" rx="6.5" fill="#8B5A2B"/>
    <path d="M44 160 C 44 120, 48 90, 46 56" stroke="#5DAA45" stroke-width="5" fill="none" stroke-linecap="round"/>
    <rect x="40" y="50" width="12" height="34" rx="6" fill="#9C6634"/>
    <path d="M62 160 C 60 130, 66 104, 74 84" stroke="#4E9A3A" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M8 160 C 2 130, 4 110, 0 96 C 10 110, 14 130, 14 160 Z" fill="#6CC055"/>
    <path d="M70 160 C 70 140, 76 124, 80 116 C 80 130, 78 146, 78 160 Z" fill="#6CC055"/></g></svg>`;

  const STAR_ITEM = `<svg viewBox="0 0 100 100"><circle class="st-halo" cx="50" cy="53" r="50" fill="url(#ct-glow-g)"/>
    <path class="st-body" d="${starPath(50, 55, 43, 20)}" stroke-width="10" stroke-linejoin="round"/>
    <g class="st-sleep" stroke="#3B3770" stroke-width="3.4" fill="none" stroke-linecap="round"><path d="M36 56 q5 4.5 10 0"/><path d="M54 56 q5 4.5 10 0"/></g>
    <g class="st-awake"><circle cx="41.5" cy="54" r="4.6" fill="#5A3A00"/><circle cx="58.5" cy="54" r="4.6" fill="#5A3A00"/>
      <circle cx="43" cy="52.4" r="1.7" fill="#fff"/><circle cx="60" cy="52.4" r="1.7" fill="#fff"/>
      <path d="M43.5 63 q6.5 6.5 13 0" stroke="#5A3A00" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <ellipse cx="35" cy="62" rx="4.2" ry="2.6" fill="#FF8A65" opacity=".65"/><ellipse cx="65" cy="62" rx="4.2" ry="2.6" fill="#FF8A65" opacity=".65"/></g></svg>`;
  const MOON = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#FFF4C2" opacity=".18"/><circle cx="50" cy="50" r="40" fill="url(#ct-moon-g)"/>
    <circle cx="66" cy="34" r="6" fill="#F3DC92" opacity=".8"/><circle cx="30" cy="66" r="4.5" fill="#F3DC92" opacity=".8"/><circle cx="70" cy="68" r="3.5" fill="#F3DC92" opacity=".8"/>
    <g stroke="#8A6A2A" stroke-width="3" fill="none" stroke-linecap="round"><path d="M34 48 q5 4 10 0"/><path d="M56 48 q5 4 10 0"/><path d="M42 60 q8 6 16 0"/></g>
    <ellipse cx="34" cy="57" rx="4" ry="2.4" fill="#FFAA8A" opacity=".6"/><ellipse cx="66" cy="57" rx="4" ry="2.4" fill="#FFAA8A" opacity=".6"/></svg>`;
  const NIGHT_HILLS = `<svg viewBox="0 0 400 100" preserveAspectRatio="none"><path d="M0 46 C 60 18, 130 28, 190 42 C 250 56, 310 18, 400 32 V100 H0 Z" fill="#33296E"/>
    <path d="M0 68 C 80 48, 160 64, 240 58 C 320 52, 360 64, 400 60 V100 H0 Z" fill="#221C55"/></svg>`;
  const HOUSE = `<svg viewBox="0 0 100 90"><path d="M10 44 L50 8 L90 44 Z" fill="#5B3F8C"/><rect x="18" y="40" width="64" height="50" fill="#47357A"/>
    <rect x="30" y="52" width="18" height="16" rx="3" fill="#FFD966"/><rect x="58" y="60" width="14" height="30" rx="3" fill="#2E2458"/>
    <path d="M30 60 H48 M39 52 V68" stroke="#E0A92E" stroke-width="2"/><rect x="64" y="14" width="10" height="20" fill="#47357A"/></svg>`;
  function skyDots() {
    let c = '';
    for (let i = 0; i < 46; i++) {
      const x = U.rand(2, 398), y = U.rand(2, 300), r = U.rand(0.8, 2.2);
      c += `<circle ${i % 5 === 0 ? 'class="tw" style="animation-delay:-' + U.rand(0, 2.6).toFixed(1) + 's"' : ''} cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#fff" opacity="${U.rand(0.4, 0.95).toFixed(2)}"/>`;
    }
    return `<svg class="ct-skydots" viewBox="0 0 400 400" preserveAspectRatio="none">${c}</svg>`;
  }

  const CANDLE_COLORS = ['#4D96FF', '#3DBE4B', '#FF8C1A', '#8E4FD6', '#FF6FB5', '#22C3C3', '#FFC21F', '#EF3B36', '#2F7BEA', '#6BCB77'];
  const CANDLE = (color) => `<svg viewBox="8 0 44 160">
    <circle class="cd-glow" cx="30" cy="32" r="34" fill="url(#ct-glow-g)"/>
    <g class="cd-flame"><g><path d="M30 4 C 40 20, 47 33, 43 44 C 40 53, 20 53, 17 44 C 13 33, 21 20, 30 4 Z" fill="#FF9F1C"/>
      <path d="M30 18 C 36 28, 39 37, 36 44 C 34 49, 26 49, 24 44 C 21 37, 24 28, 30 18 Z" fill="#FFE066"/>
      <ellipse cx="30" cy="44" rx="4" ry="5" fill="#fff" opacity=".85"/></g></g>
    <path d="M30 48 V 60" stroke="#4A3426" stroke-width="3.2" stroke-linecap="round"/>
    <rect x="17" y="58" width="26" height="100" rx="7" fill="${color}"/>
    <g stroke="#fff" stroke-width="6" opacity=".7"><path d="M17 80 L43 68"/><path d="M17 102 L43 90"/><path d="M17 124 L43 112"/><path d="M17 146 L43 134"/></g>
    <rect x="21" y="63" width="5" height="88" rx="2.5" fill="#fff" opacity=".35"/></svg>`;
  const CAKE = (() => {
    let sprinkles = '';
    const cols = ['#4D96FF', '#3DBE4B', '#FFC21F', '#8E4FD6', '#22C3C3', '#FF8C1A'];
    for (let i = 0; i < 22; i++) {
      const x = 40 + ((i * 53) % 220), y = (i % 2 ? 160 : 102) + ((i * 29) % 26);
      sprinkles += `<rect x="${x}" y="${y}" width="10" height="4" rx="2" fill="${cols[i % cols.length]}" transform="rotate(${(i * 47) % 180} ${x + 5} ${y + 2})"/>`;
    }
    return `<svg viewBox="0 0 300 236">
      <ellipse cx="150" cy="222" rx="148" ry="13" fill="#D9DEEA"/><ellipse cx="150" cy="217" rx="146" ry="13" fill="#fff"/>
      <path d="M26 60 V 198 C 26 216, 274 216, 274 198 V 60 Z" fill="#FF8FB7"/>
      <path d="M232 64 V 208 C 256 204, 274 200, 274 194 V 60 Z" fill="#E86E9B" opacity=".5"/>
      <path d="M26 134 C 70 146, 230 146, 274 134 V 146 C 230 158, 70 158, 26 146 Z" fill="#FFF4F8"/>
      ${sprinkles}
      <ellipse cx="150" cy="60" rx="124" ry="26" fill="#FFF7FB"/>
      <path d="M26 60 C 26 76, 30 88, 38 88 C 47 88, 46 74, 55 74 C 64 74, 63 98, 74 98 C 85 98, 82 78, 94 80 C 104 82, 104 92, 114 92 C 126 92, 124 80, 136 82 C 148 84, 146 104, 158 104 C 170 104, 168 84, 180 84 C 192 84, 190 96, 202 96 C 214 96, 212 78, 224 78 C 236 78, 234 94, 246 94 C 258 94, 258 80, 266 78 C 272 76, 274 68, 274 60 C 274 80, 26 80, 26 60 Z" fill="#FFF7FB"/>
      <ellipse cx="108" cy="52" rx="40" ry="8" fill="#fff" opacity=".8"/></svg>`;
  })();
  const BUNTING = (() => {
    const cols = ['#EF3B36', '#FF8C1A', '#FFD21F', '#3DBE4B', '#2F7BEA', '#8E4FD6', '#FF6FB5'];
    let t = '';
    for (let i = 0; i < 13; i++) {
      const x = 8 + i * 30.5, y = 6 + Math.sin((i / 12) * Math.PI) * 18;
      t += `<path d="M${x} ${y} L${x + 24} ${y + 1} L${x + 12} ${y + 30} Z" fill="${cols[i % cols.length]}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>`;
    }
    return `<svg viewBox="0 0 400 56" preserveAspectRatio="none"><path d="M0 4 Q200 44 400 4" stroke="#fff" stroke-width="3" fill="none"/>${t}</svg>`;
  })();
  const BALLOON = (c) => `<svg viewBox="0 0 60 132"><path d="M30 70 C 26 84, 36 94, 30 106 C 24 118, 34 124, 30 132" stroke="#fff" stroke-width="2.4" fill="none" opacity=".9"/>
    <path d="M30 2 C 48 2, 58 18, 58 34 C 58 52, 44 66, 30 68 C 16 66, 2 52, 2 34 C 2 18, 12 2, 30 2 Z" fill="${c}"/>
    <path d="M24 66 L36 66 L33 72 L27 72 Z" fill="${c}"/>
    <ellipse cx="19" cy="22" rx="6" ry="11" fill="#fff" opacity=".45" transform="rotate(20 19 22)"/></svg>`;
  const TABLE = `<svg viewBox="0 0 400 100" preserveAspectRatio="none"><rect x="0" y="6" width="400" height="94" fill="#7FC8F8"/>
    <path d="M0 6 H400 V18 ${Array.from({ length: 20 }, (_, i) => `Q ${390 - i * 20} 34, ${380 - i * 20} 18`).join(' ')} Z" fill="#fff"/>
    <rect x="0" y="0" width="400" height="8" fill="#5DB2EC"/></svg>`;

  const BEE = (flip) => `<svg viewBox="0 0 100 100"><g ${flip ? 'transform="translate(100 0) scale(-1 1)"' : ''}>
    <g class="bee-wings"><ellipse cx="38" cy="30" rx="13" ry="20" fill="#EAF8FF" stroke="#9FD3F0" stroke-width="2.5" transform="rotate(-22 38 30)" opacity=".95"/>
      <ellipse cx="55" cy="28" rx="12" ry="18" fill="#F6FCFF" stroke="#9FD3F0" stroke-width="2.5" transform="rotate(18 55 28)" opacity=".95"/></g>
    <path d="M14 62 L5 60 L13 55 Z" fill="#2B2340"/>
    <ellipse cx="44" cy="60" rx="31" ry="24" fill="#FFD23F"/>
    <g clip-path="url(#ct-bee-clip)"><rect x="25" y="30" width="9" height="60" fill="#2B2340"/><rect x="43" y="30" width="9" height="60" fill="#2B2340"/></g>
    <ellipse cx="38" cy="50" rx="10" ry="5" fill="#fff" opacity=".45"/>
    <circle cx="73" cy="55" r="19" fill="#FFD23F"/>
    <path d="M70 38 C 68 28, 64 22, 58 20" stroke="#2B2340" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="58" cy="20" r="3.6" fill="#2B2340"/>
    <path d="M79 38 C 83 28, 87 24, 92 22" stroke="#2B2340" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="92" cy="22" r="3.6" fill="#2B2340"/>
    <circle cx="69" cy="52" r="4" fill="#2B2340"/><circle cx="81" cy="52" r="4" fill="#2B2340"/><circle cx="70.3" cy="50.6" r="1.5" fill="#fff"/><circle cx="82.3" cy="50.6" r="1.5" fill="#fff"/>
    <path d="M69 62 q6 5.5 12 0" stroke="#2B2340" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <ellipse cx="86" cy="60" rx="3.6" ry="2.2" fill="#FF8A80" opacity=".75"/><ellipse cx="64" cy="60" rx="3.6" ry="2.2" fill="#FF8A80" opacity=".75"/></g></svg>`;
  const FLOWER = (petal, center) => {
    let p = '';
    for (let i = 0; i < 8; i++) p += `<ellipse cx="50" cy="22" rx="10" ry="17" fill="${petal}" transform="rotate(${i * 45} 50 40)"/>`;
    return `<svg viewBox="0 0 100 200"><g class="ct-flower"><path d="M50 56 C 48 100, 54 150, 50 200" stroke="#3E9E4E" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M50 130 C 30 112, 14 116, 8 124 C 20 136, 38 138, 50 130 Z" fill="#59B85A"/><path d="M51 154 C 70 136, 86 140, 92 148 C 80 160, 62 162, 51 154 Z" fill="#59B85A"/>
      ${p}<circle cx="50" cy="40" r="13" fill="${center}"/><circle cx="46" cy="36" r="4" fill="#fff" opacity=".5"/></g></svg>`;
  };
  const MEADOW = `<svg viewBox="0 0 400 100" preserveAspectRatio="none"><path d="M0 30 C 80 10, 160 26, 240 16 C 320 6, 370 20, 400 16 V100 H0 Z" fill="#A6E38A"/>
    <path d="M0 54 C 90 36, 190 52, 270 44 C 340 38, 380 46, 400 44 V100 H0 Z" fill="#82D46C"/></svg>`;

  const LADYBUG = `<svg viewBox="0 0 200 240">
    <g stroke="#2B2340" stroke-width="9" stroke-linecap="round" fill="none">
      <path d="M22 110 L4 98"/><path d="M14 150 L-4 150"/><path d="M24 192 L8 206"/><path d="M178 110 L196 98"/><path d="M186 150 L204 150"/><path d="M176 192 L192 206"/></g>
    <g class="ct-antenna"><path d="M86 18 C 80 2, 70 -4, 60 -4" stroke="#2B2340" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="58" cy="-4" r="7" fill="#2B2340"/></g>
    <g class="ct-antenna" style="animation-delay:-1.1s"><path d="M114 18 C 120 2, 130 -4, 140 -4" stroke="#2B2340" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="142" cy="-4" r="7" fill="#2B2340"/></g>
    <circle cx="100" cy="46" r="42" fill="#2B2340"/>
    <ellipse cx="84" cy="36" rx="12" ry="13" fill="#fff"/><ellipse cx="116" cy="36" rx="12" ry="13" fill="#fff"/>
    <circle cx="86" cy="38" r="6.5" fill="#2B2340"/><circle cx="118" cy="38" r="6.5" fill="#2B2340"/><circle cx="88" cy="35.5" r="2.2" fill="#fff"/><circle cx="120" cy="35.5" r="2.2" fill="#fff"/>
    <path d="M90 56 q10 8 20 0" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="72" cy="52" rx="6" ry="3.5" fill="#FF7A9A" opacity=".75"/><ellipse cx="128" cy="52" rx="6" ry="3.5" fill="#FF7A9A" opacity=".75"/>
    <ellipse cx="100" cy="148" rx="92" ry="90" fill="#EF3B36"/>
    <path d="M100 238 C 150 238, 192 196, 192 148 C 192 130, 186 112, 176 98 C 182 160, 150 220, 100 238 Z" fill="#C42722" opacity=".55"/>
    <path d="M100 58 V 238" stroke="#2B2340" stroke-width="5"/>
    <ellipse cx="62" cy="98" rx="22" ry="12" fill="#fff" opacity=".35" transform="rotate(-32 62 98)"/></svg>`;
  const LEAF = `<svg viewBox="0 0 200 260"><path d="M100 4 C 172 40, 198 140, 150 214 C 128 248, 72 248, 50 214 C 2 140, 28 40, 100 4 Z" fill="#5CC46A"/>
    <path d="M100 4 C 172 40, 198 140, 150 214 C 140 230, 122 240, 100 242 C 150 180, 160 90, 100 4 Z" fill="#4AB35A"/>
    <path d="M100 18 C 102 100, 100 180, 100 258" stroke="#3B9A4B" stroke-width="5" fill="none" stroke-linecap="round"/>
    <g stroke="#3B9A4B" stroke-width="3.5" fill="none" stroke-linecap="round"><path d="M100 70 C 80 60, 66 58, 54 62"/><path d="M100 70 C 120 60, 134 58, 146 62"/>
      <path d="M100 120 C 76 110, 58 110, 42 116"/><path d="M100 120 C 124 110, 142 110, 158 116"/><path d="M100 170 C 80 162, 64 164, 52 172"/><path d="M100 170 C 120 162, 136 164, 148 172"/></g></svg>`;
  const SPOT = `<svg viewBox="0 0 100 100"><circle class="sp-off" cx="50" cy="50" r="40" fill="rgba(120,0,0,.16)" stroke="#fff" stroke-width="6" stroke-dasharray="13 9" stroke-linecap="round"/>
    <g class="sp-on"><circle cx="50" cy="50" r="42" fill="#2B2340"/><ellipse cx="36" cy="34" rx="12" ry="8" fill="#fff" opacity=".35" transform="rotate(-30 36 34)"/></g></svg>`;
  const GRASS = `<svg viewBox="0 0 400 60" preserveAspectRatio="none"><path d="M0 60 V30 ${Array.from({ length: 40 }, (_, i) => `L ${i * 10 + 5} ${i % 3 ? 8 : 16} L ${i * 10 + 10} 30`).join(' ')} V60 Z" fill="#7ACB5F"/></svg>`;

  /* ======================================================================
   * scenes — each: build(sc, A) creates art; layout(sc, L, A) -> { homes:[rect], slot?(i)->rect };
   *          count(sc, it, k, A) -> Promise (item becomes "counted")
   * ==================================================================== */
  const R = (x, y, w, h, z) => ({ x, y, w, h, z });
  const inset = (r, fx, fy) => R(r.x + r.w * fx, r.y + r.h * fy, r.w * (1 - 2 * fx), r.h * (1 - 2 * fy));

  const SCENES = {
    apples: {
      noun: 'apple', plural: 'apples', inst: 'marimba', color: '#EC3A30', bgEmoji: ['🍃', '🌼'],
      build(sc, A) {
        const a = sc.art;
        a.sun = A.art(sc.back, SUN, 'ct-sun', 'boing');
        a.c1 = A.art(sc.back, CLOUD, 'ct-cloud');
        a.c2 = A.art(sc.back, CLOUD, 'ct-cloud c2');
        a.hill = A.art(sc.back, HILL);
        a.trunk = A.art(sc.back, TRUNK);
        a.canopy = A.art(sc.back, CANOPY);
        a.bback = A.art(sc.back, BASKET_BACK);
        a.bfront = A.art(sc.front, BASKET_FRONT);
      },
      item: () => APPLE,
      layout(sc, L, A) {
        const { w, h } = L, a = sc.art;
        let canopy, trunk, basket, hill;
        if (!L.land) {
          canopy = R(w * 0.02, L.top - 6, w * 0.96, Math.min(h * 0.5, w * 1.15));
          const cb = canopy.y + canopy.h;
          hill = R(-w * 0.05, h * 0.76, w * 1.1, h * 0.24 + 2);
          const tw = Math.min(w * 0.2, 110);
          trunk = R(w * 0.34 - tw / 2, cb - canopy.h * 0.22, tw, hill.y + h * 0.07 - (cb - canopy.h * 0.22));
          const bw = Math.min(w * 0.62, (h - cb) * 0.95, 400);
          basket = R(w * 0.6 - bw / 2, L.bot - 10 - bw * 0.7, bw, bw * 0.7);
        } else {
          canopy = R(L.lft + w * 0.03, L.top - 8, w * 0.6, L.bot - L.top - h * 0.17);
          hill = R(-10, h * 0.8, w + 20, h * 0.2 + 2);
          const tw = Math.min(w * 0.1, 120);
          const ty = canopy.y + canopy.h * 0.78;
          trunk = R(canopy.x + canopy.w * 0.5 - tw / 2, ty, tw, hill.y + h * 0.08 - ty);
          const bw = Math.min(w * 0.28, (L.bot - L.top) * 0.62, 420);
          basket = R(Math.min(w * 0.82, L.rgt - bw * 0.55) - bw / 2, L.bot - 8 - bw * 0.7, bw, bw * 0.7);
        }
        const sunS = U.clamp(L.s * 0.2, 70, 150);
        A.place(a.sun, R(L.rgt - sunS * 0.85, L.safe.t + 4 - sunS * 0.1, sunS, sunS));
        A.place(a.c1, R(w * 0.06, L.top + 4, L.s * 0.3, L.s * 0.15));
        A.place(a.c2, R(w * 0.55, L.top + L.s * 0.18, L.s * 0.24, L.s * 0.12));
        A.place(a.hill, hill);
        A.place(a.trunk, trunk);
        A.place(a.canopy, canopy);
        A.place(a.bback, basket);
        A.place(a.bfront, basket);
        const homes = A.scatter(sc, inset(canopy, 0.08, 0.1), { max: Math.min(L.s * 0.25, 180) });
        const size = homes[0].w;
        const n = sc.N, rows = n > 3 ? 2 : 1, per = Math.ceil(n / rows);
        const as = Math.min(size * 0.86, (basket.w * 0.8) / Math.min(per, 5));
        const rimY = basket.y + basket.h * 0.24;
        return {
          homes,
          slot(s) {
            const row = s < per ? 0 : 1, idx = row ? s - per : s, cnt = row ? n - per : per;
            const span = basket.w * 0.76;
            const step = cnt > 1 ? Math.min(as * 0.98, (span - as) / (cnt - 1)) : 0;
            const x0 = basket.x + basket.w / 2 - (step * (cnt - 1)) / 2 + (row ? step * 0.25 : 0);
            const cy = row ? rimY - as * 0.4 : rimY + as * 0.05;
            return R(x0 + idx * step - as / 2, cy - as / 2, as, as, row ? 2 : 3);
          },
        };
      },
      count(sc, it, k, A) {
        const to = sc.slotRect(it.slot);
        return A.fly(it, to, {
          duration: 720,
          path(t, dx, dy) {
            if (t < 0.18) return { x: 0, y: 0, r: Math.sin((t / 0.18) * Math.PI * 3) * 14 };
            const u = (t - 0.18) / 0.82;
            return { x: dx * u, y: dy * u * u - 50 * Math.sin(Math.PI * u) * (1 - u), r: u * 30 };
          },
        }).then(() => {
          A.ctx.drum('tom', { vel: 0.5, pitch: 140 + k * 8, bus: 'sfx' });
          A.squash(it);
        });
      },
    },

    ducks: {
      noun: 'duck', plural: 'ducks', inst: 'xylo', color: '#F5B700', bgEmoji: ['🌼', '🌸'], sfx: 'boing', sfxVel: 0.25,
      build(sc, A) {
        const a = sc.art;
        a.sun = A.art(sc.back, SUN, 'ct-sun', 'boing');
        a.c1 = A.art(sc.back, CLOUD, 'ct-cloud');
        a.meadow = A.art(sc.back, MEADOW);
        a.pond = A.art(sc.back, POND);
        a.lily1 = A.art(sc.back, LILY);
        a.lily2 = A.art(sc.back, LILY);
        a.reeds = A.art(sc.front, REEDS);
        a.f1 = A.art(sc.back, FLOWER('#fff', '#FFC93C'), 'ct-fl');
        a.f2 = A.art(sc.back, FLOWER('#FF9CC8', '#FFE066'), 'ct-fl');
      },
      item: (i) => DUCK(i % 2 === 1),
      layout(sc, L, A) {
        const { w, h } = L, a = sc.art;
        let area, pond, meadow;
        if (!L.land) {
          meadow = R(-w * 0.05, h * 0.12, w * 1.1, h * 0.9);
          area = R(L.lft + w * 0.04, L.top + h * 0.03, w * 0.92 - L.lft - L.safe.r, h * 0.5 - L.top);
          pond = R(w * 0.05, h * 0.6, w * 0.9, Math.min(h * 0.27, w * 0.62));
        } else {
          meadow = R(-10, h * 0.16, w + 20, h * 0.86);
          area = R(L.lft + w * 0.04, L.top + 4, w * 0.5 - L.lft, L.bot - L.top - 12);
          pond = R(w * 0.57, h * 0.34, L.rgt - w * 0.58, h * 0.58);
        }
        const sunS = U.clamp(L.s * 0.18, 64, 140);
        A.place(a.sun, R(L.rgt - sunS * 0.85, L.safe.t + 4 - sunS * 0.1, sunS, sunS));
        A.place(a.c1, R(L.land ? w * 0.22 : w * 0.06, L.land ? L.safe.t + 8 : L.top + 8, L.s * 0.26, L.s * 0.13));
        A.place(a.meadow, meadow);
        A.place(a.pond, pond);
        const lw = pond.w * 0.2;
        A.place(a.lily1, R(pond.x + pond.w * 0.08, pond.y + pond.h * 0.62, lw, lw * 0.6));
        A.place(a.lily2, R(pond.x + pond.w * 0.74, pond.y + pond.h * 0.16, lw * 0.8, lw * 0.48));
        const rh = pond.h * 0.85;
        A.place(a.reeds, R(pond.x + pond.w - rh * 0.3, pond.y + pond.h * 0.55 - rh * 0.6, rh * 0.5, rh));
        const fh = L.s * 0.2;
        A.place(a.f1, R(L.land ? w * 0.52 : w * 0.82, L.land ? L.bot - fh * 0.9 : h * 0.5, fh * 0.5, fh));
        A.place(a.f2, R(L.land ? w * 0.46 : w * 0.06 + L.lft, L.land ? L.bot - fh * 0.75 : h * 0.47, fh * 0.42, fh * 0.84));
        const homes = A.scatter(sc, area, { max: Math.min(L.s * 0.27, 190) });
        const size = homes[0].w, n = sc.N;
        const rows = n <= 4 ? 1 : n <= 8 ? 2 : 3, per = Math.ceil(n / rows);
        const cx = pond.x + pond.w / 2, cy = pond.y + pond.h * 0.56;
        const rx = pond.w * 0.4, ry = pond.h * 0.3;
        const ds = Math.min(size * 0.86, (rx * 1.8) / per, (ry * 2.6) / rows);
        return {
          homes,
          slot(s) {
            const r = Math.floor(s / per), idx = s % per, cnt = Math.min(per, n - r * per);
            const yy = cy + (r - (rows - 1) / 2) * ds * 0.78;
            const half = rx * Math.sqrt(Math.max(0.2, 1 - Math.pow((yy - cy) / (ry * 1.3), 2))) * 0.9;
            const step = cnt > 1 ? Math.min(ds * 1.05, (half * 2 - ds) / (cnt - 1)) : 0;
            const xx = cx - (step * (cnt - 1)) / 2 + idx * step;
            return R(xx - ds / 2, yy - ds * 0.62, ds, ds, 2 + r);
          },
        };
      },
      count(sc, it, k, A) {
        const to = sc.slotRect(it.slot);
        return A.fly(it, to, {
          duration: 760,
          path(t, dx, dy) {
            const lift = 60 + Math.abs(dy) * 0.25;
            return { x: dx * t, y: dy * t - lift * Math.sin(Math.PI * t), r: Math.sin(Math.PI * t) * (dx > 0 ? 18 : -18) };
          },
        }).then(() => {
          it.el.classList.add('swim');
          A.ctx.sfx('splash', { vel: 0.45 });
          A.ripple(sc, it);
        });
      },
    },

    stars: {
      noun: 'star', plural: 'stars', inst: 'bell', color: '#FFC21F', bgEmoji: ['✨'], sfx: 'sparkle', sfxVel: 0.22, inPlace: true,
      build(sc, A) {
        const a = sc.art;
        a.dots = A.art(sc.back, skyDots());
        a.moon = A.art(sc.back, MOON, '', 'twinkle');
        a.hills = A.art(sc.back, NIGHT_HILLS);
        a.house = A.art(sc.back, HOUSE, '', 'boing');
        sc.items.forEach((it) => { it.el.classList.add('sleepy'); it.delay = -U.rand(0, 3).toFixed(2) + 's'; });
      },
      item: () => STAR_ITEM,
      layout(sc, L, A) {
        const { w, h } = L, a = sc.art;
        const hh = h * (L.land ? 0.2 : 0.16);
        A.place(a.dots, R(0, 0, w, h * 0.85));
        A.place(a.hills, R(-10, h - hh, w + 20, hh + 2));
        const hs = U.clamp(L.s * 0.16, 54, 130);
        A.place(a.house, R(w * 0.7, h - hh * 0.62 - hs * 0.8, hs, hs * 0.9));
        const ms = U.clamp(L.s * 0.2, 70, 160);
        const moon = R(L.rgt - ms - 6, L.safe.t + 6, ms, ms);
        A.place(a.moon, moon);
        const area = R(L.lft + 8, L.top, w - L.lft - L.safe.r - 16, h - L.top - hh * 0.75);
        return { homes: A.scatter(sc, area, { max: Math.min(L.s * 0.3, 210), zones: [inset(moon, 0.08, 0.08)] }) };
      },
      count(sc, it, k, A) {
        it.el.classList.remove('sleepy');
        it.el.classList.add('on');
        const c = U.center(it.el);
        PP.fx.burst(c.x, c.y, { emoji: ['✨', '⭐'], count: 5, size: 26, distance: it.rect.w * 0.7 });
        A.squash(it, 1.3);
        return A.ctx.wait(350);
      },
    },

    cake: {
      noun: 'candle', plural: 'candles', inst: 'kalimba', color: '#FF6FB5', bgEmoji: ['🎈', '🎉', '✨'], sfx: 'twinkle', sfxVel: 0.2, inPlace: true,
      fits(n, L) { return cakeGeom(L, n).spacing >= 40; },
      build(sc, A) {
        const a = sc.art;
        a.bunting = A.art(sc.back, BUNTING, 'ct-bunting');
        a.table = A.art(sc.back, TABLE);
        a.cake = A.art(sc.back, CAKE, '', 'boing');
        a.b1 = A.art(sc.back, BALLOON('#FF6FB5'), 'ct-balloon', 'boing');
        a.b2 = A.art(sc.back, BALLOON('#4D96FF'), 'ct-balloon b2', 'boing');
        a.b3 = A.art(sc.back, BALLOON('#FFC21F'), 'ct-balloon b3', 'boing');
        sc.items.forEach((it) => it.el.classList.add('ct-candle'));
      },
      item: (i) => CANDLE(CANDLE_COLORS[i % CANDLE_COLORS.length]),
      layout(sc, L, A) {
        const a = sc.art, g = cakeGeom(L, sc.N);
        A.place(a.cake, g.cake);
        A.place(a.table, R(-10, g.cake.y + g.cake.h * 0.86, L.w + 20, L.h - g.cake.y - g.cake.h * 0.86 + 4));
        const bh = Math.min(L.s * 0.13, 90);
        A.place(a.bunting, R(L.w * 0.02, L.land ? L.safe.t + 2 : L.top + 6, L.w * 0.96, bh));
        a.bunting.style.display = L.land && g.candleTop < L.safe.t + bh + 8 ? 'none' : '';
        // balloons fill the wall beside / above the cake
        const bs = U.clamp(L.s * 0.16, 56, 130);
        const room = g.cake.x - L.lft;
        if (!L.land) {
          const yy = Math.max(L.top + bh + 10, Math.min(g.candleTop - bs * 2.4, L.h * 0.3));
          A.place(a.b1, R(L.w * 0.06, yy, bs, bs * 2.2));
          A.place(a.b2, R(L.w * 0.94 - bs * 0.9, yy + bs * 0.35, bs * 0.9, bs * 2));
          a.b3.style.display = '';
          A.place(a.b3, R(L.w * 0.14 + bs * 0.55, yy + bs * 0.55, bs * 0.8, bs * 1.8));
        } else {
          const bw2 = Math.min(bs, room * 0.5);
          A.place(a.b1, R(L.lft + room * 0.2, L.top + 6, bw2, bw2 * 2.2));
          A.place(a.b2, R(L.w - L.safe.r - room * 0.2 - bw2, L.top + 6 + bw2 * 0.4, bw2 * 0.95, bw2 * 2.1));
          a.b3.style.display = 'none';
        }
        return { homes: g.homes };
      },
      count(sc, it, k, A) {
        it.el.classList.add('on');
        A.ctx.sfx('swish', { vel: 0.3 });
        const c = U.center(it.el);
        PP.fx.burst(c.x, c.y - it.rect.h * 0.35, { emoji: ['✨'], count: 4, size: 22, distance: 50 });
        return A.ctx.wait(350);
      },
      async outro(sc, A) {
        await A.ctx.say('Make a wish! Blow!');
        A.ctx.sfx('whoosh', { vel: 0.8 });
        sc.items.forEach((it, i) => A.ctx.setTimeout(() => it.el.classList.add('out'), i * 40));
        await A.ctx.wait(700);
      },
    },

    bees: {
      noun: 'bee', plural: 'bees', inst: 'pluck', color: '#F2A900', bgEmoji: ['🌸', '🌼'], sfx: 'slideup', sfxVel: 0.18,
      build(sc, A) {
        const a = sc.art;
        a.sun = A.art(sc.back, SUN, 'ct-sun', 'boing');
        a.meadow = A.art(sc.back, MEADOW);
        a.comb = A.art(sc.back, '<svg></svg>');
        a.f1 = A.art(sc.back, FLOWER('#FF8FB7', '#FFE066'));
        a.f2 = A.art(sc.back, FLOWER('#fff', '#FFC93C'));
        a.f3 = A.art(sc.back, FLOWER('#B58CFF', '#FFE066'));
        a.f4 = A.art(sc.back, FLOWER('#FF9F45', '#FFF2A8'));
        sc.items.forEach((it) => { it.el.classList.add('bee'); it.delay = -U.rand(0, 1.5).toFixed(2) + 's'; });
      },
      item: (i) => BEE(i % 2 === 1),
      layout(sc, L, A) {
        const { w, h } = L, a = sc.art;
        let comb, area;
        if (!L.land) {
          comb = R(w * 0.14, L.top + 8, w * 0.72, h * 0.3);
          area = R(L.lft + w * 0.04, comb.y + comb.h + h * 0.06, w * 0.92 - L.lft - L.safe.r, L.bot - (comb.y + comb.h + h * 0.06) - 14);
        } else {
          comb = R(w * 0.56, L.top + 6, L.rgt - w * 0.56 - 10, L.bot - L.top - 24);
          area = R(L.lft + w * 0.04, L.top + 4, w * 0.49 - L.lft, L.bot - L.top - 12);
        }
        A.place(a.meadow, R(-10, h * (L.land ? 0.62 : 0.66), w + 20, h * 0.4));
        const sunS = U.clamp(L.s * 0.16, 60, 120);
        A.place(a.sun, R(L.land ? L.lft + w * 0.2 : L.rgt - sunS * 0.85, L.safe.t + 4 - sunS * 0.1, sunS, sunS));
        const fh = U.clamp(L.s * 0.28, 110, 260);
        A.place(a.f1, R(w * 0.02, h - fh * 0.92, fh * 0.5, fh));
        A.place(a.f2, R(w * 0.3, h - fh * 0.78, fh * 0.42, fh * 0.84));
        A.place(a.f3, R(w * (L.land ? 0.5 : 0.62), h - fh * 0.88, fh * 0.46, fh * 0.92));
        A.place(a.f4, R(w * (L.land ? 0.88 : 0.86), h - fh * 0.7, fh * 0.38, fh * 0.76));
        // honeycomb cells (hex cluster)
        const n = sc.N;
        let best = null;
        for (let cols = 1; cols <= n; cols++) {
          const rows = Math.ceil(n / cols);
          const Rw = comb.w / (cols * 1.732 + (rows > 1 ? 0.866 : 0) + 0.4);
          const Rh = comb.h / ((rows - 1) * 1.5 + 2.4);
          const Rr = Math.min(Rw, Rh, L.s * 0.13);
          const score = Rr - Math.max(0, rows - cols) * 6 - Math.abs(cols - rows * 1.4) * 0.5;
          if (!best || score > best.score) best = { cols, rows, R: Rr, score };
        }
        const Rr = best.R, cells = [];
        const totalH = (best.rows - 1) * 1.5 * Rr + 2 * Rr;
        const y0 = comb.y + (comb.h - totalH) / 2 + Rr;
        for (let r = 0; r < best.rows; r++) {
          const cnt = Math.min(best.cols, n - r * best.cols);
          const shift = cnt === best.cols && best.rows > 1 ? (r % 2 ? 0.433 : -0.433) * Rr : 0;
          const x0 = comb.x + comb.w / 2 - ((cnt - 1) * 1.732 * Rr) / 2 + shift;
          for (let c = 0; c < cnt; c++) cells.push({ x: x0 + c * 1.732 * Rr, y: y0 + r * 1.5 * Rr });
        }
        let back = '', front = '';
        cells.forEach((c) => { back += `<path d="${hexPath(c.x, c.y, Rr * 1.16)}" fill="#E39A12"/>`; });
        cells.forEach((c) => {
          front += `<path d="${hexPath(c.x, c.y, Rr * 0.98)}" fill="#FFC93C" stroke="#FFE07A" stroke-width="${(Rr * 0.08).toFixed(1)}" stroke-linejoin="round"/>`;
          front += `<path d="${hexPath(c.x, c.y + Rr * 0.08, Rr * 0.7)}" fill="#E8A21A" opacity=".75"/>`;
        });
        const top = cells.reduce((m, c) => Math.min(m, c.y), 1e9) - Rr * 1.2;
        const bx = comb.x + comb.w / 2;
        const branch = `<path d="M${bx} ${top + Rr * 0.2} V ${Math.max(0, top - Rr * 0.9)}" stroke="#8B5A2B" stroke-width="${(Rr * 0.16).toFixed(1)}" stroke-linecap="round"/>`
          + `<path d="M${(L.land ? bx - comb.w * 0.6 : -20)} ${Math.max(6, top - Rr * 0.9)} C ${bx - Rr} ${top - Rr * 1.3}, ${bx + Rr} ${top - Rr * 0.5}, ${w + 20} ${Math.max(6, top - Rr * 1.2)}" stroke="#8B5A2B" stroke-width="${(Rr * 0.32).toFixed(1)}" fill="none" stroke-linecap="round"/>`
          + `<ellipse cx="${bx + Rr * 2.2}" cy="${top - Rr * 1.2}" rx="${Rr * 0.5}" ry="${Rr * 0.26}" fill="#5CC46A" transform="rotate(-20 ${bx + Rr * 2.2} ${top - Rr * 1.2})"/>`;
        a.comb.style.left = '0px'; a.comb.style.top = '0px'; a.comb.style.width = w + 'px'; a.comb.style.height = h + 'px';
        a.comb.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${branch}${back}${front}</svg>`;
        const homes = A.scatter(sc, area, { max: Math.min(L.s * 0.26, 180) });
        return { homes, slot: (s) => R(cells[s].x - Rr * 0.8, cells[s].y - Rr * 0.82, Rr * 1.6, Rr * 1.6, 3) };
      },
      count(sc, it, k, A) {
        const to = sc.slotRect(it.slot);
        const loop = Math.min(70, it.rect.w * 0.6);
        return A.fly(it, to, {
          duration: 900,
          path(t, dx, dy) {
            const s = Math.sin(Math.PI * t);
            return {
              x: dx * t + Math.sin(t * Math.PI * 2) * loop * s,
              y: dy * t - (1 - Math.cos(t * Math.PI * 2)) * loop * 0.7 * s - 40 * s,
              r: Math.sin(t * Math.PI * 2) * 25,
            };
          },
        }).then(() => {
          it.el.classList.add('rest');
          A.ctx.sfx('pop', { vel: 0.35 });
          A.squash(it);
        });
      },
    },

    ladybug: {
      noun: 'spot', plural: 'spots', inst: 'marimba', color: '#2B2340', numColor: '#FFC21F', bgEmoji: ['🍀', '🌼'], sfx: 'pop', sfxVel: 0.4, inPlace: true,
      fits(n, L) { return bugGeom(L, n).spot >= 46; },
      build(sc, A) {
        const a = sc.art;
        a.leaf = A.art(sc.back, LEAF);
        a.grass = A.art(sc.back, GRASS);
        a.f1 = A.art(sc.back, FLOWER('#fff', '#FFC93C'));
        a.f2 = A.art(sc.back, FLOWER('#FF9CC8', '#FFE066'));
        a.bug = A.ctx.el('div', { class: 'ct-bug' });
        a.bug.appendChild(A.ctx.el('div', { class: 'ct-bugart', html: LADYBUG }));
        sc.items.forEach((it) => { it.el.classList.add('ct-spot'); a.bug.appendChild(it.el); });
        sc.items[0] && sc.layers.items.appendChild(a.bug);
        sc.itemParent = a.bug;
      },
      item: () => SPOT,
      layout(sc, L, A) {
        const a = sc.art, g = bugGeom(L, sc.N);
        A.place(a.bug, R(g.cx - g.W / 2, g.cy - g.H / 2, g.W, g.H));
        a.bug.style.transform = L.land ? 'rotate(-90deg)' : '';
        const lw = g.W * 1.4, lh = g.H * 1.22;
        A.place(a.leaf, R(g.cx - lw / 2, g.cy - lh / 2 + g.H * 0.04, lw, lh));
        a.leaf.style.transform = L.land ? 'rotate(-80deg)' : 'rotate(8deg)';
        A.place(a.grass, R(-10, L.h - L.s * 0.1, L.w + 20, L.s * 0.1 + 2));
        const fh = U.clamp(L.s * 0.26, 100, 240);
        A.place(a.f1, R(L.rgt - fh * 0.55, L.h - fh * 0.95, fh * 0.5, fh));
        A.place(a.f2, R(L.land ? L.rgt - fh * 1.05 : L.w * 0.3, L.h - fh * 0.8, fh * 0.42, fh * 0.84));
        return { homes: g.spots };
      },
      count(sc, it, k, A) {
        it.el.classList.add('on');
        sc.art.bug.querySelector('.ct-bugart').animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0)' }], { duration: 380 });
        A.squash(it, 1.25);
        return A.ctx.wait(300);
      },
      async outro(sc, A) {
        await A.ctx.say('Bye bye, ladybug!');
        A.ctx.sfx('whoosh', { vel: 0.7 });
        const b = sc.art.bug;
        const base = b.style.transform || '';
        const an = b.animate([
          { transform: base + ' translate(0,0) scale(1)' },
          { transform: base + ' translate(30px,-60px) rotate(15deg) scale(1.05)', offset: 0.3 },
          { transform: base + ' translate(-40px,-160px) rotate(-10deg) scale(.8)', offset: 0.6 },
          { transform: base + ' translate(160px,-900px) rotate(20deg) scale(.4)' },
        ], { duration: 1300, easing: 'ease-in', fill: 'forwards' });
        await Promise.race([new Promise((r) => (an.onfinish = r)), A.ctx.wait(1500)]);
      },
    },
  };

  function cakeGeom(L, n, cwIn) {
    const { w } = L;
    let cw = cwIn;
    const avail = L.bot - L.top - 10;
    if (!cw) cw = !L.land ? Math.min(w * 0.94, avail * 0.78, 640) : Math.min(w * 0.56, avail * 1.02, 640);
    const ch = cw * (236 / 300);
    const cake = R(w / 2 - cw / 2, L.bot - ch - (L.land ? 4 : avail * 0.08), cw, ch);
    const topY = cake.y + ch * (60 / 236);
    const rx = cw * (124 / 300) * 0.86, ry = cw * (26 / 300) * 0.42;
    const span = rx * 2;
    const spacing = span / n;
    const zig = spacing < 58; // alternate back/front rows when crowded
    const cwid = Math.min(spacing * (zig ? 1.25 : 0.82), cw * 0.13, ch * 0.62 * (44 / 160));
    const chgt = cwid * (160 / 44);
    const homes = [];
    for (let i = 0; i < n; i++) {
      const xx = w / 2 + (i - (n - 1) / 2) * spacing;
      const front = zig && i % 2 === 1;
      const baseY = !zig ? topY + ry * 0.15 : topY + (front ? ry : -ry);
      homes.push(R(xx - cwid / 2, baseY - chgt * (152 / 160), cwid, chgt, front ? 4 : 2));
    }
    const candleTop = topY - ry - chgt;
    if (candleTop < L.top + 6 && !cwIn) return cakeGeom(L, n, cw * Math.max(0.6, (cake.y + ch - L.top - 6) / (cake.y + ch - candleTop)));
    return { cake, homes, spacing, candleTop };
  }

  function bugGeom(L, n) {
    const { w, h } = L;
    const availH = L.bot - L.top - L.s * 0.06;
    let W, H, cx, cy;
    if (!L.land) {
      W = Math.min(w * 0.76, availH / 1.32, 560);
      H = W * 1.2;
      cx = w / 2; cy = L.top + availH / 2 + L.s * 0.04;
    } else {
      W = Math.min(availH * 0.9, (w * 0.62) / 1.2, 560);
      H = W * 1.2;
      cx = w / 2; cy = L.top + availH / 2 + 4;
    }
    const k = W / 200;
    const pts = PP.data.DOTS[n] || PP.data.DOTS[1];
    let md = 1e9;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      md = Math.min(md, Math.hypot((pts[i][0] - pts[j][0]) * 146, (pts[i][1] - pts[j][1]) * 150));
    }
    const sd = Math.min(md === 1e9 ? 66 : md * 0.82, 64) * k;
    const spots = pts.map(([dx, dy]) => {
      const x = (100 + (dx - 0.5) * 146) * k, y = (150 + (dy - 0.5) * 150) * k;
      return R(x - sd / 2, y - sd / 2, sd, sd);
    });
    return { W, H, cx, cy, spots, spot: sd };
  }

  /* ======================================================================
   * the game
   * ==================================================================== */
  PP.registerGame({
    id: 'count',
    title: 'Count',
    domain: 'numbers',
    icon: '🍎',
    tileColor: '#F2545B',
    order: 20,
    // every data-driven line, for tools/harvest.js (natural voice pack)
    voiceLines() {
      const L = [];
      Object.values(SCENES).forEach((d) => {
        L.push(`Tap the ${d.noun}!`, `Tap the ${d.plural}!`, `Let's count the ${d.plural}!`, `Count the ${d.plural}!`, `How many ${d.plural}?`);
        for (let n = 1; n <= 10; n++) L.push(`${Word(n)} ${n === 1 ? d.noun : d.plural}!`);
      });
      return L;
    },
    create(stage, ctx) {
      const root = ctx.el('div', { class: 'ct-root' });
      const probe = ctx.el('div', { class: 'ct-probe' });
      const tally = ctx.el('div', { class: 'ct-tally hide' });
      const result = ctx.el('div', { class: 'ct-result' });
      stage.append(root, probe, tally, result);
      ctx.mascot.show({ corner: 'bl' });

      let L = measure();
      let cur = null;
      let bag = [];
      let lastId = null, lastN = 0;

      function measure() {
        const w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight;
        const sr = stage.getBoundingClientRect(), pr = probe.getBoundingClientRect();
        const safe = { l: Math.max(0, pr.left - sr.left), t: Math.max(0, pr.top - sr.top), r: Math.max(0, sr.right - pr.right), b: Math.max(0, sr.bottom - pr.bottom) };
        const s = Math.min(w, h);
        const pip = U.clamp(Math.min(innerWidth, innerHeight) * 0.14, 80, 140);
        const dot = U.clamp(s * 0.06, 22, 38);
        const top = safe.t + 12 + dot + 16 + 12;
        return { w, h, s, land: w > h * 1.12, safe, pip, dot, top, bot: h - safe.b, lft: safe.l, rgt: w - safe.r };
      }

      /* ---------- helpers given to scenes ---------- */
      function place(el, r) {
        el.style.left = r.x.toFixed(1) + 'px';
        el.style.top = r.y.toFixed(1) + 'px';
        el.style.width = r.w.toFixed(1) + 'px';
        el.style.height = r.h.toFixed(1) + 'px';
      }
      function art(parent, markup, cls, fun) {
        const e = ctx.el('div', { class: 'ct-art ' + (cls || '') });
        e.innerHTML = markup;
        if (fun) e.dataset.fun = fun;
        parent.appendChild(e);
        return e;
      }
      function zones() {
        const tw = L.tallyW || 100;
        return [
          R(0, 0, L.safe.l + 100, L.safe.t + 100),
          R(0, L.h - L.safe.b - L.pip - 10, L.safe.l + L.pip + 14, L.pip + 10 + L.safe.b),
          R(L.w / 2 - tw / 2 - 8, 0, tw + 16, L.top - 6),
        ];
      }
      function circleHits(cx, cy, r, z) {
        const nx = U.clamp(cx, z.x, z.x + z.w), ny = U.clamp(cy, z.y, z.y + z.h);
        return (cx - nx) * (cx - nx) + (cy - ny) * (cy - ny) < r * r;
      }
      /** Spread sc.N items inside `area` (stage px) on a jittered grid, avoiding UI zones. Returns rects. */
      function scatter(sc, area, o) {
        o = o || {};
        const n = sc.N;
        const zs = (o.zones || []).concat(zones());
        const maxS = o.max || Math.min(L.s * 0.27, 190);
        let best = null;
        for (let pass = 0; pass < 2 && !best; pass++) {
          for (let cols = 1; cols <= n + 3; cols++) {
            const rows0 = Math.max(1, Math.ceil(n / cols));
            for (let rows = rows0; rows <= rows0 + 2; rows++) {
              const cw = area.w / cols, ch = area.h / rows;
              const size = Math.min(maxS, Math.min(cw, ch) * 0.84);
              const cells = [];
              for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
                const cx = area.x + (c + 0.5) * cw + (rows > 1 && cols > 1 ? (r % 2 ? 0.12 : -0.12) * cw : 0);
                const cy = area.y + (r + 0.5) * ch;
                if (pass || !zs.some((z) => circleHits(cx, cy, size * 0.48, z))) cells.push({ cx, cy, cw, ch });
              }
              if (cells.length < n) continue;
              const score = size - (cells.length - n) * 1.5;
              if (!best || score > best.score) best = { score, size, cells };
            }
          }
        }
        const size = best.size;
        const order = best.cells.map((c, i) => i).sort((a, b) => sc.rnd[a % sc.rnd.length] - sc.rnd[b % sc.rnd.length]).slice(0, n).sort((a, b) => a - b);
        return order.map((ci, k) => {
          const c = best.cells[ci];
          const j = sc.jit[k];
          const sx = Math.max(0, (c.cw - size) / 2) * 0.8, sy = Math.max(0, (c.ch - size) / 2) * 0.8;
          let cx = c.cx + j[0] * sx, cy = c.cy + j[1] * sy;
          if (zs.some((z) => circleHits(cx, cy, size * 0.48, z))) { cx = c.cx; cy = c.cy; }
          return R(cx - size / 2, cy - size / 2, size, size);
        });
      }
      /** Fly an item (wrapper) from its rect to `to` along o.path(t, dx, dy) -> {x, y, r}. */
      function fly(it, to, o) {
        o = o || {};
        const from = it.rect;
        const dx = to.x + to.w / 2 - (from.x + from.w / 2), dy = to.y + to.h / 2 - (from.y + from.h / 2);
        const s1 = to.w / from.w;
        const kf = [];
        const steps = 24;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const p = o.path ? o.path(t, dx, dy) : { x: dx * t, y: dy * t };
          const sc = 1 + (s1 - 1) * Math.min(1, t * 1.15);
          kf.push({ transform: `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) scale(${sc.toFixed(3)}) rotate(${(p.r || 0).toFixed(1)}deg)` });
        }
        it.el.style.zIndex = 30;
        const an = it.el.animate(kf, { duration: o.duration || 650, easing: 'linear', fill: 'forwards' });
        const done = new Promise((res) => { an.onfinish = res; });
        return Promise.race([done, ctx.wait((o.duration || 650) + 600)]).then(() => {
          const sc = cur;
          const r = sc && sc.slotRect && it.slot >= 0 ? sc.slotRect(it.slot) : to;
          place(it.el, r);
          it.rect = r;
          it.el.style.zIndex = r.z != null ? r.z : '';
          try { an.cancel(); } catch (e) {}
        });
      }
      function squash(it, amt) {
        const a = amt || 1.18;
        it.inner.animate([
          { transform: 'scale(1)' }, { transform: `scale(${a}, ${2 - a})`, offset: 0.3 }, { transform: `scale(${2 - a * 0.92}, ${a * 0.95})`, offset: 0.6 }, { transform: 'scale(1)' },
        ], { duration: 420, easing: 'ease-out' });
      }
      function ripple(sc, it) {
        const r = it.rect;
        for (let i = 0; i < 2; i++) {
          const e = ctx.el('div', { class: 'ct-ring', style: { left: r.x + r.w / 2 + 'px', top: r.y + r.h * 0.85 + 'px', width: r.w * 1.1 + 'px', height: r.w * 0.35 + 'px', animationDelay: i * 0.18 + 's' } });
          sc.layers.items.appendChild(e);
          ctx.setTimeout(() => e.remove(), 1300);
        }
      }
      const A = { ctx, place, art, scatter, fly, squash, ripple };

      /* ---------- tally + result ---------- */
      function buildTally(n, color) {
        tally.innerHTML = '';
        tally.style.setProperty('--c', color);
        for (let i = 0; i < n; i++) tally.appendChild(ctx.el('span', { class: 'ct-dot' }));
        tally.classList.remove('hide');
        layoutTally();
      }
      /** One row of dots if it fits between the home button and the right edge, else a 5+5 "ten-frame". */
      function layoutTally() {
        const n = tally.children.length || 1;
        const need = (c, dd) => c * dd + (c - 1) * 6 + 24;
        const availW = L.w - 2 * (L.safe.l + 88);
        let d = L.dot, cols = n;
        if (need(n, d) > availW) {
          const d2 = (availW - 24 - (n - 1) * 6) / n;
          if (d2 >= 21) d = d2;
          else { cols = Math.ceil(n / 2); d = Math.min(L.dot, (availW - 24 - (cols - 1) * 6) / cols); }
        }
        const rows = Math.ceil(n / cols);
        L.tallyW = need(cols, d) + 2;
        L.top = L.safe.t + 12 + rows * d + (rows - 1) * 6 + 16 + 12;
        tally.style.setProperty('--d', d.toFixed(1) + 'px');
        tally.style.width = L.tallyW.toFixed(1) + 'px';
      }
      function fillDot(k) {
        const d = tally.children[k - 1];
        if (!d) return;
        d.classList.add('on');
        d.textContent = k;
      }
      function beatDot(k) {
        const d = tally.children[k - 1];
        if (!d) return;
        d.classList.remove('beat');
        void d.offsetWidth;
        d.classList.add('beat');
      }
      function showResult(n, color) {
        result.innerHTML = '';
        const rs = U.clamp(L.s * 0.28, 110, 240);
        result.style.setProperty('--rs', rs + 'px');
        result.style.setProperty('--c', color);
        result.appendChild(ctx.el('div', { class: 'ct-rnum', text: String(n) }));
        const dots = ctx.el('div', { class: 'ct-rdots' });
        (PP.data.DOTS[n] || []).forEach(([x, y], i) => dots.appendChild(ctx.el('span', { style: { left: x * 100 + '%', top: y * 100 + '%', animationDelay: 0.25 + i * 0.06 + 's' } })));
        result.appendChild(dots);
        result.classList.remove('out');
        void result.offsetWidth;
        result.classList.add('show');
      }
      function hideResult() {
        if (!result.classList.contains('show')) return;
        result.classList.remove('show');
        result.classList.add('out');
      }

      /* ---------- scenes ---------- */
      function chooseN(level) {
        const [lo, hi] = N_RANGE[U.clamp(level, 1, 5)];
        let n;
        for (let t = 0; t < 8; t++) {
          n = level === 1 ? U.pick([1, 2, 2, 3, 3, 3, 3]) : U.randInt(lo, hi);
          if (n !== lastN) break;
        }
        lastN = n;
        return n;
      }
      function chooseScene(n) {
        const ids = Object.keys(SCENES);
        for (let t = 0; t < ids.length * 2; t++) {
          if (!bag.length) bag = ctx.shuffle(ids);
          const id = bag.shift();
          if (id === lastId) continue;
          const def = SCENES[id];
          if (def.fits && !def.fits(n, L)) continue;
          lastId = id;
          return id;
        }
        lastId = 'apples';
        return 'apples';
      }

      function newScene(id, n) {
        const def = SCENES[id];
        const sc = {
          id, def, N: n, items: [], counted: 0, inflight: 0, state: 'intro', hinted: false, nextAt: 0, art: {},
          rnd: Array.from({ length: 40 }, () => Math.random()),
          jit: Array.from({ length: 12 }, () => [U.rand(-1, 1), U.rand(-1, 1)]),
        };
        sc.el = ctx.el('div', { class: 'ct-scene ct-s-' + id });
        sc.back = ctx.el('div', { class: 'ct-layer' });
        sc.layers = { items: ctx.el('div', { class: 'ct-items' }) };
        sc.front = ctx.el('div', { class: 'ct-layer' });
        sc.el.append(sc.back, sc.layers.items, sc.front);
        for (let i = 0; i < n; i++) {
          const wrap = ctx.el('div', { class: 'ct-item' });
          const inner = ctx.el('div', { class: 'ct-in', html: def.item(i, sc) });
          wrap.appendChild(inner);
          const it = { i, el: wrap, inner, counted: false, pending: false, slot: -1, rect: R(0, 0, 10, 10) };
          wrap._ct = it;
          sc.items.push(it);
          sc.layers.items.appendChild(wrap);
        }
        def.build(sc, A);
        root.appendChild(sc.el);
        return sc;
      }

      function layoutScene(sc) {
        layoutTally();
        const res = sc.def.layout(sc, L, A);
        sc.homes = res.homes;
        sc.slotRect = res.slot || null;
        sc.items.forEach((it) => {
          if (it.flying) return;
          const r = it.counted && sc.slotRect ? sc.slotRect(it.slot) : sc.homes[it.i];
          place(it.el, r);
          it.rect = r;
          it.el.style.zIndex = r.z != null ? r.z : '';
        });
      }

      function relayout() {
        L = measure();
        layoutTally();
        if (cur) layoutScene(cur);
      }
      ctx.onResize(relayout);

      /* ---------- counting ---------- */
      function tapItem(sc, it) {
        if (sc !== cur) return;
        if (sc.state !== 'counting' || it.counted || it.pending) {
          if (it.counted && !it.flying) { A.squash(it, 1.12); ctx.sfx('tap', { vel: 0.3 }); }
          return;
        }
        it.pending = true;
        it.el.classList.remove('pp-glow');
        it.el.classList.add('pend');
        const now = performance.now();
        const at = Math.max(now, sc.nextAt);
        sc.nextAt = at + GAP;
        if (sc.pendingCount == null) sc.pendingCount = 0;
        sc.pendingCount++;
        if (at - now < 20) doCount(sc, it);
        else {
          A.squash(it, 1.1);
          ctx.sfx('tap', { vel: 0.3 });
          ctx.setTimeout(() => doCount(sc, it), at - now);
        }
      }

      function doCount(sc, it) {
        if (sc !== cur) return;
        sc.pendingCount--;
        const k = ++sc.counted;
        it.counted = true;
        it.pending = false;
        it.slot = k - 1;
        it.el.classList.remove('pp-glow');
        const c = U.center(it.el);
        ctx.play(sc.def.inst || 'marimba', SCALE[k - 1], { vel: 0.9 });
        if (sc.def.sfx) ctx.sfx(sc.def.sfx, { vel: sc.def.sfxVel || 0.4 });
        ctx.say(Word(k) + '!');
        PP.fx.floatText(c.x, c.y - it.rect.h * 0.3, String(k), { color: sc.def.numColor || sc.def.color, size: U.clamp(L.s * 0.2, 72, 150) });
        fillDot(k);
        ctx.mascot.mood(k === sc.N ? 'happy' : 'surprise');
        if (k === sc.N) sc.state = 'finishing';
        sc.inflight++;
        it.flying = !sc.def.inPlace;
        Promise.resolve(sc.def.count(sc, it, k, A)).then(() => {
          it.flying = false;
          it.el.classList.remove('pend');
          sc.inflight--;
          if (sc.counted === sc.N && sc.inflight === 0 && !sc.finished) {
            sc.finished = true;
            sc.resolve && sc.resolve();
          }
        });
      }

      async function recap(sc) {
        sc.state = 'recap';
        ctx.setPrompt('');
        const order = sc.items.slice().sort((a, b) => a.slot - b.slot);
        const n = sc.N;
        const beat = n <= 3 ? 760 : n <= 6 ? 660 : 560;
        if (n > 1) {
          ctx.say(U.pick(["Let's count them!", 'Count with me!', 'All together!']));
          await ctx.wait(1300);
          for (let k = 1; k <= n; k++) {
            const it = order[k - 1];
            const c = U.center(it.el);
            it.el.classList.remove('ct-hl');
            void it.el.offsetWidth;
            it.el.classList.add('ct-hl');
            it.inner.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.4) rotate(-8deg)', offset: 0.35 }, { transform: 'scale(1)' }], { duration: 560, easing: 'cubic-bezier(.3,1.5,.5,1)' });
            PP.fx.floatText(c.x, c.y - it.rect.h * 0.55, String(k), { color: '#fff', size: U.clamp(L.s * 0.11, 44, 84), duration: 900 });
            ctx.play(sc.def.inst || 'marimba', SCALE[k - 1], { vel: 0.75 });
            const said = ctx.say(Word(k) + (k === n ? '!' : ''));
            beatDot(k);
            // pace by whichever is slower: the beat or the voice (never chop a number off)
            await Promise.all([ctx.wait(k === n ? beat + 200 : beat), said]);
          }
        } else {
          await ctx.wait(400);
        }
        // total: numeral + dot pattern + celebration
        showResult(n, sc.def.numColor || sc.def.color);
        const inst = sc.def.inst || 'marimba';
        ['C5', 'E5', 'G5', 'C6'].forEach((nt, i) => ctx.play(inst, nt, { vel: 0.6, delay: i * 0.09 }));
        ctx.success(!sc.hinted);
        const name = n === 1 ? sc.def.noun : sc.def.plural;
        await ctx.celebrate({ say: `${Word(n)} ${name}! ${ctx.praise()}`, big: n >= 5, y: innerHeight * 0.45 });
        hideResult();
        if (sc.def.outro) { await ctx.wait(250); await sc.def.outro(sc, A); }
        await ctx.wait(350);
      }

      async function playScene(first) {
        const n = chooseN(ctx.level);
        const id = chooseScene(n);
        const prev = cur;
        const sc = newScene(id, n);
        cur = sc;
        buildTally(n, sc.def.numColor || sc.def.color);
        layoutScene(sc);
        sc.items.forEach((it, i) => { it.el.classList.add('ct-pop'); it.inner.style.animationDelay = (prev ? 0.55 : 0.1) + i * 0.08 + 's'; });
        ctx.setTimeout(() => sc.items.forEach((it) => { it.el.classList.remove('ct-pop'); it.inner.style.animationDelay = it.delay || ''; }), (prev ? 1200 : 700) + n * 90);
        if (prev) {
          ctx.sfx('whoosh', { vel: 0.5 });
          const ease = 'cubic-bezier(.65,0,.3,1)';
          prev.el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-100%)' }], { duration: 700, easing: ease, fill: 'forwards' });
          sc.el.animate([{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], { duration: 700, easing: ease });
          ctx.setTimeout(() => prev.el.remove(), 720);
        }
        const plural = sc.def.plural;
        const prompt = n === 1 ? `Tap the ${sc.def.noun}!` : `Tap the ${plural}!`;
        sc.prompt = prompt;
        ctx.setPrompt(prompt);
        sc.state = 'counting';
        sc.nextAt = performance.now() + (prev ? 500 : 0);
        ctx.poke();
        const intro = n === 1 ? prompt
          : first ? `Let's count the ${plural}!`
          : U.pick([`Let's count the ${plural}!`, `Count the ${plural}!`, `How many ${plural}?`]);
        ctx.setTimeout(() => { if (cur === sc && sc.counted === 0) ctx.say(intro); }, prev ? 450 : 0);
        await new Promise((res) => { sc.resolve = res; });
        await ctx.wait(450);
        await recap(sc);
      }

      /* ---------- input ---------- */
      ctx.on(stage, 'pointerdown', (e) => {
        if (e.button > 0) return;
        const t = e.target;
        if (!t || !t.closest || t.closest('.pp-game-pip')) return;
        const itEl = t.closest('.ct-item');
        if (itEl && itEl._ct && cur && cur.items.includes(itEl._ct)) {
          e.preventDefault();
          tapItem(cur, itEl._ct);
          return;
        }
        const fun = t.closest('[data-fun]');
        if (fun) {
          ctx.sfx(fun.dataset.fun, { vel: 0.5 });
          fun.animate([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-10deg) scale(1.12)' }, { transform: 'rotate(8deg) scale(.96)' }, { transform: 'rotate(0) scale(1)' }], { duration: 600, easing: 'ease-out' });
          return;
        }
        if (cur) {
          PP.fx.burst(e.clientX, e.clientY, { emoji: cur.def.bgEmoji || ['✨'], count: 4, size: 26, distance: 56 });
          ctx.sfx('tap', { vel: 0.25 });
        }
      });

      ctx.idle(7000, () => {
        if (!cur || cur.state !== 'counting') return;
        const left = cur.items.filter((it) => !it.counted && !it.pending);
        if (!left.length) return;
        cur.hinted = true;
        PP.fx.glow(ctx.pick(left).el);
        ctx.mascot.mood('wave');
        ctx.say(cur.prompt);
      });

      (async () => {
        let first = true;
        while (ctx.alive) {
          await playScene(first);
          first = false;
        }
      })();

      return { destroy() {} };
    },
  });
})();
