/* Body Parts — "Touch & Giggle" with Bo, a round fuzzy mint buddy (original character).
 * Free play: every part does something silly and Bo names it ("Nose! Honk honk!").
 * Teaching rounds: "Where is Bo's nose?" — errorless (wrong part reacts + is named; glow after 2 misses).
 * "Touch YOUR nose!" moments: Bo demonstrates, the child copies in the real world.
 * Level 1: nose, eyes, mouth, tummy · 2: + ears, hands, feet · 3: + hair, head · 4: + cheeks, knees · 5: + toes, eyebrows
 * (small fine parts are only taught when Bo is drawn big enough for a generous target).
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;

  U.addStyles('body', `
    .g-body { background: radial-gradient(120% 90% at 50% 38%, #FFF8DC 0%, #FFE6C7 38%, #C9EBFF 100%); }
    .bo-floor { position: absolute; left: 50%; transform: translateX(-50%); border-radius: 50%; pointer-events: none;
      background: radial-gradient(ellipse at center, #FFD9A8 0 46%, #FFC98A 47% 60%, rgba(255,201,138,0) 61%); }
    .bo-svg { position: absolute; overflow: visible; display: block; touch-action: none; }
    .bo-svg * { -webkit-tap-highlight-color: transparent; }
    .bo-glow { fill: rgba(255, 228, 92, .28); stroke: #FFD21F; stroke-width: 7; transform-box: fill-box; transform-origin: center;
      animation: bo-glow 1.1s ease-in-out infinite; pointer-events: none; }
    @keyframes bo-glow { 0%, 100% { transform: scale(.92); opacity: .65 } 50% { transform: scale(1.1); opacity: 1 } }
    .bo-bubble { position: absolute; pointer-events: none; border-radius: 50%;
      background: radial-gradient(circle at 32% 30%, rgba(255,255,255,.95) 0 12%, rgba(255,255,255,.35) 13% 55%, rgba(255,255,255,.12) 56%);
      box-shadow: inset 0 0 0 2px rgba(255,255,255,.55); animation: bo-float linear infinite; }
    @keyframes bo-float { 0% { transform: translateY(0) } 50% { transform: translateY(-26px) } 100% { transform: translateY(0) } }
    .bo-word { position: absolute; z-index: 20; left: 50%; transform: translateX(-50%) scale(0); pointer-events: none;
      top: calc(var(--safe-t) + 14px); padding: .08em .6em .14em; border-radius: 999px; background: #fff; color: #3A2A5A;
      font-weight: 900; font-size: clamp(26px, 5.4vmin, 46px); box-shadow: 0 5px 0 rgba(60, 40, 120, .14), 0 10px 22px rgba(60, 40, 120, .12);
      transition: transform .3s cubic-bezier(.3,1.6,.5,1); white-space: nowrap; }
    .bo-word.on { transform: translateX(-50%) scale(1); }
    .bo-word.side { left: auto; right: calc(var(--safe-r) + 18px); transform: scale(0); transform-origin: 100% 0; }
    .bo-word.side.on { transform: scale(1); }
    .bo-word .q { color: #8E6BEA; }
    .bo-you { position: absolute; z-index: 20; pointer-events: none; left: 50%; bottom: calc(var(--safe-b) + 14px);
      transform: translateX(-50%) scale(0); font-size: clamp(54px, 11vmin, 96px); transition: transform .35s cubic-bezier(.3,1.6,.5,1); }
    .bo-you.on { transform: translateX(-50%) scale(1); animation: bo-you 1s ease-in-out infinite .35s; }
    @keyframes bo-you { 0%, 100% { margin-bottom: 0 } 50% { margin-bottom: 14px } }
  `);

  /* ======================================================================= Bo's artwork */
  const FUR = '#6FD6B8', FUR_D = '#3FA88A', FUR_L = '#A6F0DA';
  const HAIR_D = '#6A4BC9', PINK = '#FFB8C9', INK = '#2B2340', MOUTH = '#5A2340';

  /** scalloped "fluffy" ellipse path */
  function fluffy(cx, cy, rx, ry, n, amp, rot) {
    rot = rot || 0;
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
      if (!i) { d += `M${x.toFixed(1)} ${y.toFixed(1)}`; continue; }
      const am = rot + ((i - 0.5) / n) * Math.PI * 2, k = 1 + amp;
      d += `Q${(cx + rx * k * Math.cos(am)).toFixed(1)} ${(cy + ry * k * Math.sin(am)).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d + 'Z';
  }

  const TOES = { L: [[118, 503], [143, 509], [168, 505]], R: [[232, 505], [257, 509], [282, 503]] };

  function boSVG() {
    const toe = (side) => TOES[side].map(([x, y], i) => `<ellipse class="bo-toe bo-toe${side}${i}" cx="${x}" cy="${y}" rx="10.5" ry="8" fill="${PINK}" stroke="#F08AA4" stroke-width="2"/>`).join('');
    const hand = (side) => `
      <g class="bo-hand${side}">
        <g class="bo-handart">
          <circle cx="0" cy="0" r="29" fill="${FUR}" stroke="${FUR_D}" stroke-width="4"/>
          <circle cx="23" cy="-15" r="11" fill="${FUR}" stroke="${FUR_D}" stroke-width="4"/>
          <circle cx="28" cy="2" r="11" fill="${FUR}" stroke="${FUR_D}" stroke-width="4"/>
          <circle cx="22" cy="18" r="11" fill="${FUR}" stroke="${FUR_D}" stroke-width="4"/>
          <circle cx="0" cy="0" r="27" fill="${FUR}"/>
          <ellipse cx="-2" cy="2" rx="13" ry="12" fill="${PINK}" opacity=".9"/>
          <circle cx="-9" cy="-9" r="6" fill="#fff" opacity=".3"/>
        </g>
      </g>`;
    return `
<svg class="bo-svg" viewBox="0 -30 400 560" aria-hidden="true">
  <defs>
    <radialGradient id="bo-fur" cx="38%" cy="28%" r="80%"><stop offset="0" stop-color="${FUR_L}"/><stop offset=".55" stop-color="${FUR}"/><stop offset="1" stop-color="#4DBE9E"/></radialGradient>
    <radialGradient id="bo-tum" cx="45%" cy="38%" r="70%"><stop offset="0" stop-color="#FFF6E6"/><stop offset="1" stop-color="#FFD9AE"/></radialGradient>
    <radialGradient id="bo-nose" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#FFA3BC"/><stop offset=".65" stop-color="#FF5C86"/><stop offset="1" stop-color="#DE4069"/></radialGradient>
    <radialGradient id="bo-hairg" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#C2A8FF"/><stop offset=".6" stop-color="#9270F0"/><stop offset="1" stop-color="#7353D6"/></radialGradient>
  </defs>
  <g class="bo-all">
    <ellipse cx="200" cy="520" rx="150" ry="13" fill="rgba(60,40,90,.16)"/>
    <g class="bo-legL"><rect x="128" y="392" width="60" height="96" rx="28" fill="url(#bo-fur)" stroke="${FUR_D}" stroke-width="4"/>
      <ellipse class="bo-kneeL" cx="158" cy="447" rx="20" ry="16" fill="${FUR_L}" opacity=".9"/></g>
    <g class="bo-legR"><rect x="212" y="392" width="60" height="96" rx="28" fill="url(#bo-fur)" stroke="${FUR_D}" stroke-width="4"/>
      <ellipse class="bo-kneeR" cx="242" cy="447" rx="20" ry="16" fill="${FUR_L}" opacity=".9"/></g>
    <g class="bo-footL"><ellipse cx="143" cy="492" rx="58" ry="27" fill="url(#bo-fur)" stroke="${FUR_D}" stroke-width="4"/>
      <ellipse cx="132" cy="482" rx="22" ry="8" fill="#fff" opacity=".25"/>${toe('L')}</g>
    <g class="bo-footR"><ellipse cx="257" cy="492" rx="58" ry="27" fill="url(#bo-fur)" stroke="${FUR_D}" stroke-width="4"/>
      <ellipse cx="246" cy="482" rx="22" ry="8" fill="#fff" opacity=".25"/>${toe('R')}</g>
    <g class="bo-upper">
      <g class="bo-body">
        <path d="${fluffy(200, 338, 116, 94, 30, 0.05)}" fill="url(#bo-fur)" stroke="${FUR_D}" stroke-width="4" stroke-linejoin="round"/>
        <g class="bo-tummy">
          <ellipse cx="200" cy="352" rx="70" ry="58" fill="url(#bo-tum)"/>
          <path d="M193 360 Q200 370 207 360" stroke="#E0A270" stroke-width="4.5" fill="none" stroke-linecap="round"/>
        </g>
      </g>
      <g class="bo-head">
        <g class="bo-earL"><path d="${fluffy(84, 76, 40, 40, 16, 0.07)}" fill="url(#bo-fur)" stroke="${FUR_D}" stroke-width="4"/><ellipse cx="88" cy="80" rx="21" ry="23" fill="${PINK}"/></g>
        <g class="bo-earR"><path d="${fluffy(316, 76, 40, 40, 16, 0.07)}" fill="url(#bo-fur)" stroke="${FUR_D}" stroke-width="4"/><ellipse cx="312" cy="80" rx="21" ry="23" fill="${PINK}"/></g>
        <path d="${fluffy(200, 165, 130, 124, 36, 0.035)}" fill="url(#bo-fur)" stroke="${FUR_D}" stroke-width="4" stroke-linejoin="round"/>
        <ellipse cx="150" cy="86" rx="44" ry="18" fill="#fff" opacity=".22" transform="rotate(-22 150 86)"/>
        <g class="bo-hair">
          <path d="${fluffy(170, 44, 25, 23, 12, 0.08)}" fill="url(#bo-hairg)" stroke="${HAIR_D}" stroke-width="3.5"/>
          <path d="${fluffy(232, 44, 23, 22, 12, 0.08)}" fill="url(#bo-hairg)" stroke="${HAIR_D}" stroke-width="3.5"/>
          <path d="${fluffy(201, 28, 30, 28, 14, 0.07)}" fill="url(#bo-hairg)" stroke="${HAIR_D}" stroke-width="3.5"/>
          <path d="M201 2 C 214 -14, 236 -6, 228 8 C 222 18, 208 10, 216 2" stroke="${HAIR_D}" stroke-width="5" fill="none" stroke-linecap="round"/>
          <ellipse cx="190" cy="18" rx="10" ry="6" fill="#fff" opacity=".35" transform="rotate(-20 190 18)"/>
        </g>
        <path class="bo-browL" d="M124 101 Q150 84 177 98" stroke="${HAIR_D}" stroke-width="9" fill="none" stroke-linecap="round"/>
        <path class="bo-browR" d="M223 98 Q250 84 276 101" stroke="${HAIR_D}" stroke-width="9" fill="none" stroke-linecap="round"/>
        <g class="bo-eyeL"><ellipse cx="152" cy="150" rx="30" ry="35" fill="#fff" stroke="${INK}" stroke-width="3"/>
          <g class="bo-pupilL"><circle cx="154" cy="154" r="17" fill="${INK}"/><circle cx="160" cy="147" r="6" fill="#fff"/><circle cx="148" cy="161" r="2.6" fill="#fff"/></g></g>
        <g class="bo-eyeR"><ellipse cx="248" cy="150" rx="30" ry="35" fill="#fff" stroke="${INK}" stroke-width="3"/>
          <g class="bo-pupilR"><circle cx="246" cy="154" r="17" fill="${INK}"/><circle cx="252" cy="147" r="6" fill="#fff"/><circle cx="240" cy="161" r="2.6" fill="#fff"/></g></g>
        <g class="bo-happy" style="display:none">
          <path d="M124 156 Q152 128 180 156" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round"/>
          <path d="M220 156 Q248 128 276 156" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round"/>
        </g>
        <ellipse class="bo-cheekL" cx="112" cy="211" rx="22" ry="14" fill="#FF7FA3" opacity=".8"/>
        <ellipse class="bo-cheekR" cx="288" cy="211" rx="22" ry="14" fill="#FF7FA3" opacity=".8"/>
        <g class="bo-nose"><ellipse cx="200" cy="201" rx="28" ry="22" fill="url(#bo-nose)" stroke="#C93A61" stroke-width="2.5"/>
          <ellipse cx="190" cy="193" rx="9" ry="5.5" fill="#fff" opacity=".75"/></g>
        <g class="bo-mouth">
          <g class="m-smile"><path d="M162 236 Q200 280 238 236 Q200 254 162 236Z" fill="${MOUTH}" stroke="${MOUTH}" stroke-width="4" stroke-linejoin="round"/>
            <path d="M183 255 Q200 266 217 255 Q200 249 183 255Z" fill="#FF8FA8"/></g>
          <g class="m-talk" style="display:none"><ellipse cx="200" cy="248" rx="24" ry="16" fill="${MOUTH}"/><ellipse cx="200" cy="256" rx="13" ry="6" fill="#FF8FA8"/></g>
          <g class="m-ahh" style="display:none"><ellipse cx="200" cy="261" rx="35" ry="31" fill="${MOUTH}"/><ellipse cx="200" cy="279" rx="20" ry="9" fill="#FF8FA8"/>
            <rect x="187" y="231" width="12" height="10" rx="3" fill="#fff"/><rect x="201" y="231" width="12" height="10" rx="3" fill="#fff"/></g>
          <g class="m-o" style="display:none"><ellipse cx="200" cy="246" rx="11" ry="13" fill="${MOUTH}"/></g>
        </g>
      </g>
      <g class="bo-arms">
        <path class="bo-armL-o" fill="none" stroke="${FUR_D}" stroke-width="38" stroke-linecap="round"/>
        <path class="bo-armR-o" fill="none" stroke="${FUR_D}" stroke-width="38" stroke-linecap="round"/>
        <path class="bo-armL" fill="none" stroke="${FUR}" stroke-width="30" stroke-linecap="round"/>
        <path class="bo-armR" fill="none" stroke="${FUR}" stroke-width="30" stroke-linecap="round"/>
        ${hand('L')}${hand('R')}
      </g>
    </g>
  </g>
  <g class="bo-glows"></g>
</svg>`;
  }

  /* ======================================================================= parts */
  const PARTS = {
    nose: { word: 'nose', lv: 1, zone: 'head', anchors: [[200, 201]], w: 1.05, glow: [[200, 201, 44, 38]] },
    eyes: { word: 'eyes', pl: true, lv: 1, zone: 'head', anchors: [[152, 150], [248, 150]], w: 1.05, glow: [[152, 150, 44, 48], [248, 150, 44, 48]] },
    mouth: { word: 'mouth', lv: 1, zone: 'head', anchors: [[200, 250]], w: 1.05, glow: [[200, 248, 56, 40]] },
    tummy: { word: 'tummy', lv: 1, zone: 'body', glow: [[200, 352, 84, 72]] },
    ears: { word: 'ears', pl: true, lv: 2, zone: 'head', anchors: [[82, 74], [318, 74]], w: 1.1, glow: [[84, 76, 54, 54], [316, 76, 54, 54]] },
    hands: { word: 'hands', pl: true, lv: 2, zone: 'hands', glow: 'hands' },
    feet: { word: 'feet', pl: true, lv: 2, zone: 'feet', glow: [[143, 492, 74, 40], [257, 492, 74, 40]] },
    hair: { word: 'hair', lv: 3, zone: 'head', anchors: [[201, 22], [168, 44], [234, 44]], w: 1.1, glow: [[201, 34, 72, 44]] },
    head: { word: 'head', lv: 3, zone: 'head', anchors: [[200, 92], [76, 178], [324, 178]], w: 0.9, glow: [[200, 150, 150, 150]],
      contains: ['nose', 'eyes', 'mouth', 'ears', 'hair', 'cheeks', 'eyebrows'] },
    cheeks: { word: 'cheeks', pl: true, lv: 4, fine: true, zone: 'head', anchors: [[112, 214], [288, 214]], w: 0.95, glow: [[112, 211, 34, 26], [288, 211, 34, 26]] },
    knees: { word: 'knees', pl: true, lv: 4, zone: 'legs', glow: [[158, 447, 34, 30], [242, 447, 34, 30]] },
    toes: { word: 'toes', pl: true, lv: 5, fine: true, zone: 'feet', glow: [[143, 506, 42, 18], [257, 506, 42, 18]] },
    eyebrows: { word: 'eyebrows', pl: true, lv: 5, fine: true, zone: 'head', anchors: [[150, 96], [250, 96]], w: 0.9, glow: [[150, 94, 36, 20], [250, 94, 36, 20]] },
    // free-play only (never asked, but always fun)
    arms: { word: 'arms', pl: true, lv: 99, zone: 'arms' },
    legs: { word: 'legs', pl: true, lv: 99, zone: 'legs' },
  };
  const TEACH = [['nose', 'eyes', 'mouth', 'tummy'], ['ears', 'hands', 'feet'], ['hair', 'head'], ['cheeks', 'knees'], ['toes', 'eyebrows']];

  const SILLY = {
    nose: 'Honk honk!', eyes: 'Blink blink!', mouth: 'Ahhh!', tummy: 'Hee hee hee!', ears: 'Wiggle wiggle!',
    hands: 'Clap clap!', feet: 'Stomp stomp!', hair: 'Boing!', head: 'Wobble wobble!', cheeks: 'Puff!',
    knees: 'Bend, bend!', toes: 'Wiggle wiggle!', eyebrows: 'Up and down!', arms: 'Flap flap!', legs: 'Bend, bend!',
  };

  const TOUCH_YOUR = {
    nose: 'Can you touch your nose?', tummy: 'Can you pat your tummy?', head: 'Can you touch your head?',
    ears: 'Can you touch your ears?', hands: 'Can you clap your hands?', feet: 'Can you stomp your feet?',
    mouth: 'Can you open your mouth? Ahhh!', eyes: 'Can you cover your eyes?', cheeks: 'Can you touch your cheeks?',
    knees: 'Can you touch your knees?', hair: 'Can you touch your hair?', toes: 'Can you wiggle your toes?',
    eyebrows: 'Can you wiggle your eyebrows?',
  };

  /* small math helpers */
  const TAU = Math.PI * 2;
  const damp = (t, f, k) => Math.exp(-k * t) * Math.sin(TAU * f * t);
  const bump = (p) => (p <= 0 || p >= 1 ? 0 : Math.sin(Math.PI * p));
  const easeIO = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  const easeOutBack = (p) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };

  PP.registerGame({
    id: 'body',
    title: 'Body Parts',
    domain: 'words',
    icon: '👃',
    tileColor: '#3CC7A6',
    order: 32,
    stickersAtCelebrate: true, // questions come back-to-back; show stickers at the end-of-set party
    create(stage, ctx) {
      /* ---------------- DOM ---------------- */
      const probe = ctx.el('div', { style: { position: 'absolute', visibility: 'hidden', pointerEvents: 'none', padding: 'var(--safe-t) var(--safe-r) var(--safe-b) var(--safe-l)' } });
      const floor = ctx.el('div', { class: 'bo-floor' });
      stage.append(probe, floor);
      const bubbles = [];
      for (let i = 0; i < 7; i++) {
        const s = 18 + (i % 4) * 12;
        const b = ctx.el('div', { class: 'bo-bubble', style: { width: s + 'px', height: s + 'px', animationDuration: (5 + i * 0.9) + 's', animationDelay: -(i * 1.3) + 's' } });
        bubbles.push(b);
        stage.appendChild(b);
      }
      const holder = ctx.html(boSVG());
      stage.appendChild(holder);
      const svg = holder;
      const wordEl = ctx.el('div', { class: 'bo-word' });
      const youEl = ctx.el('div', { class: 'bo-you pp-emoji', text: '🙌' });
      stage.append(wordEl, youEl);
      const $ = (sel) => svg.querySelector(sel);

      /* ---------------- rig ---------------- */
      const rig = {};
      function R(name, sel, ox, oy) {
        const el = typeof sel === 'string' ? $(sel) : sel;
        rig[name] = { el, ox, oy, fx: [], last: '' };
      }
      R('all', '.bo-all', 200, 520);
      R('upper', '.bo-upper', 200, 430);
      R('body', '.bo-body', 200, 430);
      R('tummy', '.bo-tummy', 200, 352);
      R('head', '.bo-head', 200, 280);
      R('hair', '.bo-hair', 201, 60);
      R('earL', '.bo-earL', 112, 104);
      R('earR', '.bo-earR', 288, 104);
      R('browL', '.bo-browL', 150, 94);
      R('browR', '.bo-browR', 250, 94);
      R('eyeL', '.bo-eyeL', 152, 150);
      R('eyeR', '.bo-eyeR', 248, 150);
      R('cheekL', '.bo-cheekL', 112, 211);
      R('cheekR', '.bo-cheekR', 288, 211);
      R('nose', '.bo-nose', 200, 205);
      R('mouth', '.bo-mouth', 200, 246);
      R('legL', '.bo-legL', 158, 488);
      R('legR', '.bo-legR', 242, 488);
      R('footL', '.bo-footL', 143, 518);
      R('footR', '.bo-footR', 257, 518);
      for (let i = 0; i < 3; i++) {
        R('toeL' + i, '.bo-toeL' + i, TOES.L[i][0], TOES.L[i][1] + 8);
        R('toeR' + i, '.bo-toeR' + i, TOES.R[i][0], TOES.R[i][1] + 8);
      }
      const pupilL = $('.bo-pupilL'), pupilR = $('.bo-pupilR');
      const happyEyes = $('.bo-happy');
      const eyesOpen = [$('.bo-eyeL'), $('.bo-eyeR')];
      const mouthEls = { smile: $('.m-smile'), talk: $('.m-talk'), ahh: $('.m-ahh'), o: $('.m-o') };
      const glowLayer = $('.bo-glows');
      const arms = {
        L: { o: $('.bo-armL-o'), i: $('.bo-armL'), hand: $('.bo-handL'), S: [120, 304], rest: [68, 384], side: -1 },
        R: { o: $('.bo-armR-o'), i: $('.bo-armR'), hand: $('.bo-handR'), S: [280, 304], rest: [332, 384], side: 1 },
      };
      ['L', 'R'].forEach((k) => {
        const a = arms[k];
        a.pos = a.rest.slice();
        a.tw = null; // {from, to, t0, dur, ease}
      });

      let now = performance.now() / 1000;
      function fx(name, dur, fn) {
        const r = rig[name];
        if (!r) return;
        r.fx.push({ t0: now, dur, fn });
      }
      // hands: tween to a target (absolute coords in the upper frame)
      function handTo(k, xy, ms, ease) {
        const a = arms[k];
        a.tw = { from: a.pos.slice(), to: xy.slice(), t0: now, dur: Math.max(0.01, ms / 1000), ease: ease || easeIO };
      }
      let handToken = 0;
      async function handsTo(L, Rr, ms, ease) {
        if (L) handTo('L', L, ms, ease);
        if (Rr) handTo('R', Rr, ms, ease);
        await ctx.wait(ms);
      }
      function restHands(ms) { handTo('L', arms.L.rest, ms || 380); handTo('R', arms.R.rest, ms || 380); }

      let mouthOverride = null, mouthUntil = 0, talking = false, happyUntil = 0;
      let look = { x: 0, y: 0 }; // pupil offset target
      let lookCur = { x: 0, y: 0 };
      let rollUntil = 0;
      let nextBlink = now + 2.5;

      function setMouth(m) {
        for (const k in mouthEls) mouthEls[k].style.display = k === m ? '' : 'none';
      }
      let mouthShown = 'smile';

      function frame(dt, tms) {
        now = tms / 1000;
        // breathing
        // quantized so the big body group repaints ~8×/s instead of every frame (cheaper on older iPads)
        const br = Math.round(Math.sin(now * TAU * 0.33) * 12) / 12;
        for (const name in rig) {
          const r = rig[name];
          let tx = 0, ty = 0, rot = 0, sx = 1, sy = 1;
          if (name === 'upper') { sy *= 1 + 0.012 * br; sx *= 1 - 0.006 * br; }
          for (let i = r.fx.length - 1; i >= 0; i--) {
            const f = r.fx[i];
            const t = now - f.t0;
            if (t >= f.dur) { r.fx.splice(i, 1); continue; }
            if (t < 0) continue;
            const v = f.fn(t / f.dur, t) || {};
            tx += v.tx || 0; ty += v.ty || 0; rot += v.r || 0;
            if (v.sx != null) sx *= v.sx;
            if (v.sy != null) sy *= v.sy;
            if (v.s != null) { sx *= v.s; sy *= v.s; }
          }
          // blink
          if ((name === 'eyeL' || name === 'eyeR') && now > nextBlink && now < nextBlink + 0.16) sy *= 0.1;
          const tr = (tx || ty || rot || sx !== 1 || sy !== 1)
            ? `translate(${(r.ox + tx).toFixed(2)} ${(r.oy + ty).toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-r.ox} ${-r.oy})`
            : '';
          if (tr !== r.last) { r.last = tr; if (tr) r.el.setAttribute('transform', tr); else r.el.removeAttribute('transform'); }
        }
        if (now > nextBlink + 0.16) nextBlink = now + 2.4 + Math.random() * 3.2;

        // arms & hands
        ['L', 'R'].forEach((k) => {
          const a = arms[k];
          if (a.tw) {
            const p = Math.min(1, (now - a.tw.t0) / a.tw.dur);
            const e = a.tw.ease(p);
            a.pos[0] = a.tw.from[0] + (a.tw.to[0] - a.tw.from[0]) * e;
            a.pos[1] = a.tw.from[1] + (a.tw.to[1] - a.tw.from[1]) * e;
            if (p >= 1) a.tw = null;
          }
          const [hx, hy] = a.pos, [sx0, sy0] = a.S;
          const dx = hx - sx0, dy = hy - sy0;
          const len = Math.hypot(dx, dy) || 1;
          // elbow bends outward, a little more when the arm is short
          let px = -dy / len, py = dx / len;
          if (px * a.side < 0) { px = -px; py = -py; }
          const bend = 10 + Math.max(0, 70 - len) * 0.25;
          const cx = (sx0 + hx) / 2 + px * bend, cy = (sy0 + hy) / 2 + py * bend;
          const d = `M${sx0} ${sy0}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${hx.toFixed(1)} ${hy.toFixed(1)}`;
          if (d !== a.lastD) {
            a.lastD = d;
            a.o.setAttribute('d', d);
            a.i.setAttribute('d', d);
            const ang = Math.atan2(hy - cy, hx - cx) * 180 / Math.PI;
            a.hand.setAttribute('transform', `translate(${hx.toFixed(1)} ${hy.toFixed(1)}) rotate(${ang.toFixed(1)})${k === 'L' ? '' : ''}`);
          }
        });

        // pupils: look target or rolling
        let tx = look.x, ty = look.y;
        if (now < rollUntil) { const a = now * 9; tx = Math.cos(a) * 9; ty = Math.sin(a) * 9; }
        lookCur.x += (tx - lookCur.x) * Math.min(1, dt * 14);
        lookCur.y += (ty - lookCur.y) * Math.min(1, dt * 14);
        const pt = `translate(${lookCur.x.toFixed(2)} ${lookCur.y.toFixed(2)})`;
        if (pt !== frame.lastPupil) { frame.lastPupil = pt; pupilL.setAttribute('transform', pt); pupilR.setAttribute('transform', pt); }

        // eyes: happy arcs
        const happy = now < happyUntil;
        if (happy !== frame.lastHappy) {
          frame.lastHappy = happy;
          happyEyes.style.display = happy ? '' : 'none';
          eyesOpen.forEach((e) => { e.style.display = happy ? 'none' : ''; });
        }

        // mouth
        let m = 'smile';
        if (mouthOverride && now < mouthUntil) m = mouthOverride;
        else if (talking) m = Math.floor(now * 7.5) % 2 ? 'talk' : 'smile';
        if (m !== mouthShown) { mouthShown = m; setMouth(m); }
      }
      ctx.raf(frame);

      // Bo's mouth moves whenever someone is talking (he is the narrator here)
      const offA = PP.bus.on('speech:start', () => { talking = true; });
      const offB = PP.bus.on('speech:end', () => { talking = false; });
      ctx.track({ stop() { offA(); offB(); } });

      /* ---------------- layout ---------------- */
      let scale = 1;
      let fineOK = true;
      function layout() {
        const W = stage.clientWidth, H = stage.clientHeight;
        if (!W || !H) return;
        const cs = getComputedStyle(probe);
        const sf = { t: parseFloat(cs.paddingTop) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0, r: parseFloat(cs.paddingRight) || 0 };
        const small = Math.min(W, H) < 520;
        const top = sf.t + (small ? (W > H ? 8 : 74) : 86);
        const bottom = sf.b + (small ? 6 : 18);
        const availW = W - sf.l - sf.r - 16, availH = H - top - bottom;
        scale = Math.min(availW / 400, availH / 560, 1.9);
        const w = 400 * scale, h = 560 * scale;
        let left = sf.l + 8 + (availW - w) / 2;
        let y = top + Math.max(0, (availH - h) * 0.55);
        // keep Bo's ear clear of the home button corner
        const earX = left + 44 * scale, earY = y + (30 + 36) * scale;
        if (earX < 104 && earY < 104) y += 104 - earY;
        Object.assign(svg.style, { left: left + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
        floor.style.width = (w * 1.05) + 'px';
        floor.style.height = (h * 0.16) + 'px';
        floor.style.top = (y + h * 0.89) + 'px';
        // fine parts (cheeks, toes, eyebrows) need Bo to be drawn reasonably big
        fineOK = scale >= 0.86;
        // the word bubble goes top-centre, or top-right when Bo's head would be underneath it
        const wordBottom = sf.t + (small ? 66 : 84);
        wordEl.classList.toggle('side', y < wordBottom && W > H);
        bubbles.forEach((b, i) => {
          const side = i % 2 ? 1 : -1;
          const free = Math.max(30, (W - w) / 2);
          const bx = side < 0 ? (free * (0.2 + (i % 3) * 0.25)) : W - free * (0.2 + (i % 3) * 0.25) - 30;
          b.style.left = bx + 'px';
          b.style.top = (H * (0.18 + ((i * 37) % 70) / 100)) + 'px';
          b.style.display = free > 60 || i < 3 ? '' : 'none';
        });
      }
      layout();
      ctx.onResize(layout);

      /* ---------------- helpers ---------------- */
      const enabledFine = (p) => !PARTS[p].fine || fineOK;
      function activeParts() {
        const lv = ctx.level;
        const set = new Set(['nose', 'eyes', 'mouth', 'tummy', 'ears', 'hands', 'feet', 'hair', 'arms']);
        if (lv >= 3) set.add('head');
        if (lv >= 4) { set.add('knees'); if (fineOK) set.add('cheeks'); } else set.add('legs');
        if (lv >= 5 && fineOK) { set.add('toes'); set.add('eyebrows'); }
        return set;
      }
      function toSvg(x, y) {
        const m = svg.getScreenCTM();
        if (!m) return null;
        const p = svg.createSVGPoint();
        p.x = x; p.y = y;
        return p.matrixTransform(m.inverse());
      }
      function toScreen(x, y) {
        const m = svg.getScreenCTM();
        const p = svg.createSVGPoint();
        p.x = x; p.y = y;
        const q = p.matrixTransform(m);
        return { x: q.x, y: q.y };
      }
      function segDist(px, py, ax, ay, bx, by) {
        const vx = bx - ax, vy = by - ay;
        const t = U.clamp(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1), 0, 1);
        return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
      }

      /** which part is at svg point (x,y)? */
      function hitPart(x, y) {
        const act = activeParts();
        // hands first (they move around, and can be in front of the face)
        for (const k of ['L', 'R']) if (Math.hypot(x - arms[k].pos[0], y - arms[k].pos[1]) < 50) return 'hands';
        for (const k of ['L', 'R']) {
          const a = arms[k];
          if (segDist(x, y, a.S[0], a.S[1], a.pos[0], a.pos[1]) < 25 && Math.hypot(x - a.S[0], y - a.S[1]) > 26) return 'arms';
        }
        // feet & toes
        for (const fx0 of [143, 257]) {
          if (Math.pow((x - fx0) / 74, 2) + Math.pow((y - 494) / 40, 2) < 1 || (Math.abs(x - fx0) < 70 && y > 494 && y < 545)) {
            return act.has('toes') && y > 494 ? 'toes' : 'feet';
          }
        }
        // legs / knees
        if (y > 400 && y < 478 && (Math.abs(x - 158) < 46 || Math.abs(x - 242) < 46)) return act.has('knees') ? 'knees' : 'legs';
        // head zone
        const inHead = Math.hypot(x - 200, y - 165) < 142 || Math.hypot(x - 84, y - 76) < 54 || Math.hypot(x - 316, y - 76) < 54 ||
          (y > -30 && y < 70 && Math.abs(x - 201) < 82);
        if (inHead) {
          let best = null, bd = 1e9;
          for (const name of ['nose', 'eyes', 'mouth', 'ears', 'hair', 'head', 'cheeks', 'eyebrows']) {
            if (!act.has(name)) continue;
            const P = PARTS[name];
            for (const [ax, ay] of P.anchors) {
              const d = Math.hypot(x - ax, y - ay) / (P.w || 1);
              if (d < bd) { bd = d; best = name; }
            }
          }
          return best;
        }
        // body
        if (Math.pow((x - 200) / 128, 2) + Math.pow((y - 340) / 104, 2) < 1) return 'tummy';
        return null;
      }
      /** screen point to show effects for a part */
      function partPoint(part) {
        const P = PARTS[part];
        if (part === 'hands') return toScreen(arms.R.pos[0], arms.R.pos[1] - 20);
        if (part === 'arms') return toScreen(arms.R.pos[0], arms.R.pos[1] - 60);
        if (part === 'legs') return toScreen(242, 440);
        if (Array.isArray(P.glow)) { const g = P.glow[P.glow.length > 1 ? 1 : 0]; return toScreen(g[0], g[1] - (part === 'head' ? 120 : 0)); }
        return toScreen(200, 300);
      }

      /* ---------------- reactions ---------------- */
      const sfx = (n, o) => ctx.sfx(n, o);
      const note = (inst, n, o) => ctx.play(inst, n, Object.assign({ bus: 'sfx' }, o || {}));
      const drum = (n, o) => ctx.drum(n, Object.assign({ bus: 'sfx' }, o || {}));
      function honk(delay) {
        note('toy', ['F4', 'A4'], { delay, dur: 0.16, vel: 0.95 });
        note('bass', 'F3', { delay, dur: 0.14, vel: 0.5 });
      }
      function giggle() {
        ['A5', 'F5', 'D5', 'A5', 'F5', 'C5'].forEach((n, i) => note('kalimba', n, { delay: i * 0.075, vel: 0.55 }));
      }
      function shake(px) {
        try { svg.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${px}px, ${px * 0.6}px)` }, { transform: `translate(${-px}px, 0)` }, { transform: 'translate(0,0)' }], { duration: 160 }); } catch (e) {}
      }

      async function gesture(fn) {
        const tok = ++handToken;
        const alive = () => tok === handToken && ctx.alive;
        restHands(300); // start from a relaxed pose (a gesture that moves the hands overrides this at once)
        await fn(alive);
        if (tok === handToken) restHands(420);
      }

      const REACT = {
        nose() {
          honk(0); honk(0.24);
          fx('nose', 0.75, (p, t) => ({ sx: 1 + 0.38 * damp(t, 3.2, 4), sy: 1 - 0.32 * damp(t, 3.2, 4) }));
          happyUntil = now + 0.8;
        },
        eyes() {
          drum('woodblock', { vel: 0.3 });
          ['eyeL', 'eyeR'].forEach((e) => fx(e, 0.62, (p) => ({ sy: 1 - 0.92 * (bump(p * 2.2) + bump(p * 2.2 - 1.15)) })));
          rollUntil = now + 1.5;
          sfx('twinkle', { vel: 0.4, delay: 0.55 });
          note('flute', 'G5', { delay: 0.6, dur: 0.25, vel: 0.35 });
          note('flute', 'C6', { delay: 0.85, dur: 0.3, vel: 0.35 });
        },
        mouth() {
          mouthOverride = 'ahh'; mouthUntil = now + 1.35;
          fx('mouth', 1.35, (p, t) => ({ s: 1 + 0.12 * damp(t, 2.5, 3) }));
          fx('head', 1.35, (p) => ({ r: -4 * bump(p) }));
          note('flute', 'E5', { dur: 0.9, vel: 0.35 });
          sfx('chomp', { delay: 1.35, vel: 0.8 });
        },
        tummy() {
          giggle();
          fx('tummy', 1.2, (p, t) => ({ sx: 1 + 0.1 * damp(t, 4.5, 3.2), sy: 1 - 0.09 * damp(t, 4.5, 3.2) }));
          fx('body', 1.2, (p, t) => ({ sx: 1 + 0.035 * damp(t, 4.5, 3), sy: 1 - 0.03 * damp(t, 4.5, 3) }));
          fx('head', 1.2, (p, t) => ({ r: 3 * damp(t, 2.2, 2.5) }));
          happyUntil = now + 1.3;
        },
        ears() {
          fx('earL', 1.3, (p, t) => ({ r: 24 * damp(t, 3, 2.4) }));
          fx('earR', 1.3, (p, t) => ({ r: -24 * damp(t + 0.08, 3, 2.4) }));
          ['C6', 'E6', 'C6', 'E6', 'G6'].forEach((n, i) => note('kalimba', n, { delay: i * 0.11, vel: 0.4 }));
        },
        hands() {
          gesture(async (alive) => {
            for (let i = 0; i < 3 && alive(); i++) {
              await handsTo([152, 330], [248, 330], i ? 150 : 260);
              if (!alive()) return;
              await handsTo([186, 336], [214, 336], 110);
              drum('clap', { vel: 0.9 });
              fx('upper', 0.15, (p) => ({ sy: 1 - 0.015 * bump(p) }));
            }
            await ctx.wait(120);
          });
        },
        feet() {
          ['L', 'R'].forEach((k, i) => {
            const d = i * 0.42;
            fx('foot' + k, 0.4 + d, (p, t) => {
              const tt = t - d;
              if (tt < 0) return null;
              const q = tt / 0.4;
              return { ty: q < 0.6 ? -30 * Math.sin((q / 0.6) * Math.PI / 2) : -30 * (1 - (q - 0.6) / 0.4) * 1, r: (k === 'L' ? -6 : 6) * bump(q) };
            });
            fx('leg' + k, 0.4 + d, (p, t) => { const tt = t - d; if (tt < 0) return null; const q = tt / 0.4; return { sy: 1 - 0.28 * (q < 0.6 ? Math.sin((q / 0.6) * Math.PI / 2) : 1 - (q - 0.6) / 0.4) }; });
            ctx.setTimeout(() => {
              drum('kick', { vel: 1 });
              drum('tom', { vel: 0.6, pitch: 90 });
              fx('all', 0.25, (p) => ({ sy: 1 - 0.035 * bump(p), sx: 1 + 0.02 * bump(p) }));
              shake(5);
            }, (d + 0.4) * 1000);
          });
        },
        hair() {
          sfx('boing', { vel: 0.9 });
          fx('hair', 1.3, (p, t) => ({ sy: 1 + 0.5 * damp(t, 2.6, 2.8), sx: 1 - 0.18 * damp(t, 2.6, 2.8) }));
          fx('head', 0.5, (p) => ({ ty: 4 * bump(p) }));
        },
        head() {
          fx('head', 1.3, (p, t) => ({ r: 9 * damp(t, 1.8, 2.2) }));
          [0, 0.28, 0.56].forEach((d, i) => drum('woodblock', { delay: d, vel: 0.7, pitch: 0 }));
          note('xylo', 'G5', { vel: 0.4 }); note('xylo', 'E5', { delay: 0.28, vel: 0.4 }); note('xylo', 'C5', { delay: 0.56, vel: 0.4 });
        },
        cheeks() {
          ['cheekL', 'cheekR'].forEach((c) => fx(c, 1.0, (p) => ({ s: 1 + 0.7 * bump(Math.min(1, p * 1.25)) })));
          mouthOverride = 'o'; mouthUntil = now + 0.85;
          note('flute', 'C5', { dur: 0.6, vel: 0.3 });
          sfx('pop', { delay: 0.82, vel: 0.9 });
        },
        knees() { REACT.legs(); },
        legs() {
          [0, 0.5].forEach((d) => {
            fx('upper', 0.5 + d, (p, t) => { const q = (t - d) / 0.5; return q < 0 ? null : { ty: 20 * bump(q) }; });
            fx('legL', 0.5 + d, (p, t) => { const q = (t - d) / 0.5; return q < 0 ? null : { sy: 1 - 0.22 * bump(q) }; });
            fx('legR', 0.5 + d, (p, t) => { const q = (t - d) / 0.5; return q < 0 ? null : { sy: 1 - 0.22 * bump(q) }; });
            drum('tom', { delay: d + 0.2, vel: 0.5, pitch: 130 });
            sfx('boing', { delay: d + 0.25, vel: 0.35 });
          });
        },
        toes() {
          const order = ['toeL0', 'toeL1', 'toeL2', 'toeR0', 'toeR1', 'toeR2'];
          order.forEach((n, i) => {
            const d = i * 0.08;
            fx(n, 0.3 + d, (p, t) => { const q = (t - d) / 0.3; return q < 0 ? null : { ty: -9 * bump(q), s: 1 + 0.25 * bump(q) }; });
            note('xylo', ['C6', 'D6', 'E6', 'G6', 'A6', 'C7'][i], { delay: d, vel: 0.45 });
          });
        },
        eyebrows() {
          ['browL', 'browR'].forEach((b) => fx(b, 1.0, (p) => ({ ty: -16 * (bump(p * 2) + bump(p * 2 - 1)) })));
          sfx('slideup', { vel: 0.4 }); sfx('slidedown', { delay: 0.25, vel: 0.35 }); sfx('slideup', { delay: 0.5, vel: 0.4 }); sfx('slidedown', { delay: 0.75, vel: 0.35 });
        },
        arms() {
          sfx('swish', { vel: 0.8 }); sfx('swish', { delay: 0.36, vel: 0.7 });
          gesture(async (alive) => {
            for (let i = 0; i < 2 && alive(); i++) {
              await handsTo([30, 250], [370, 250], 180);
              if (!alive()) return;
              await handsTo([50, 360], [350, 360], 180);
            }
          });
        },
      };

      function react(part) {
        const P = PARTS[part];
        REACT[part]();
        const sp = partPoint(part);
        PP.fx.floatText(sp.x, sp.y - 20 * scale, P.word, { color: '#fff', size: Math.round(Math.max(30, Math.min(56, 40 * scale))) });
        PP.fx.burst(sp.x, sp.y, { emoji: ['✨', '💫', '⭐'], count: 4, size: 26, distance: 60 * scale + 20 });
      }

      /* ---------------- gestures for "touch YOUR ___" ---------------- */
      async function demo(part) {
        const hold = 2600;
        const g = {
          nose: async (alive) => { await handsTo([178, 214], null, 450); if (alive()) { fx('nose', 0.4, (p) => ({ s: 1 - 0.12 * bump(p) })); honk(0); } await ctx.wait(hold); },
          tummy: async (alive) => { await handsTo([168, 350], [232, 350], 420); for (let i = 0; i < 4 && alive(); i++) { await handsTo([168, 340], [232, 360], 220); drum('tom', { pitch: 120, vel: 0.35 }); await handsTo([168, 360], [232, 340], 220); drum('tom', { pitch: 110, vel: 0.35 }); } },
          head: async (alive) => { await handsTo([140, 62], null, 450); for (let i = 0; i < 3 && alive(); i++) { await handsTo([140, 52], null, 200); drum('woodblock', { vel: 0.4 }); await handsTo([140, 64], null, 200); } await ctx.wait(hold - 1200); },
          ears: async () => { await handsTo([92, 96], [308, 96], 450); fx('earL', 1.2, (p, t) => ({ r: 16 * damp(t, 3, 2.5) })); fx('earR', 1.2, (p, t) => ({ r: -16 * damp(t, 3, 2.5) })); await ctx.wait(hold); },
          hands: async (alive) => { for (let i = 0; i < 5 && alive(); i++) { await handsTo([152, 330], [248, 330], 180); await handsTo([186, 336], [214, 336], 110); drum('clap', { vel: 0.9 }); } },
          feet: async () => { REACT.feet(); await ctx.wait(1000); REACT.feet(); await ctx.wait(1100); },
          mouth: async () => { mouthOverride = 'ahh'; mouthUntil = now + 2.6; await ctx.wait(hold); },
          eyes: async (alive) => { await handsTo([150, 152], [250, 152], 420); await ctx.wait(1700); if (!alive()) return; await handsTo([70, 250], [330, 250], 260); happyUntil = now + 1.1; ctx.say('Peekaboo!'); sfx('boing', { vel: 0.5 }); await ctx.wait(900); },
          cheeks: async () => { await handsTo([120, 214], [280, 214], 450); fx('cheekL', hold / 1000, (p) => ({ s: 1 + 0.3 * bump(p) })); fx('cheekR', hold / 1000, (p) => ({ s: 1 + 0.3 * bump(p) })); await ctx.wait(hold); },
          knees: async () => { await handsTo([156, 444], [244, 444], 500); fx('upper', hold / 1000, (p) => ({ ty: 14 * bump(p) })); await ctx.wait(hold); },
          hair: async () => { await handsTo([180, 40], null, 450); REACT.hair(); await ctx.wait(hold); },
          toes: async () => { REACT.toes(); await ctx.wait(800); REACT.toes(); await ctx.wait(900); },
          eyebrows: async () => { REACT.eyebrows(); await ctx.wait(1100); REACT.eyebrows(); await ctx.wait(1100); },
        }[part];
        await gesture(g);
      }

      /* ---------------- teaching state ---------------- */
      let question = null; // { part, misses, done, resolve, glows, missReported }
      let tapsInPhase = 0;
      let lastTapAt = 0;
      const lastSpokenAt = { t: 0 };

      function glowOn(part) {
        glowOff();
        const P = PARTS[part];
        let g = P.glow;
        if (g === 'hands') g = [[arms.L.pos[0], arms.L.pos[1], 48, 48], [arms.R.pos[0], arms.R.pos[1], 48, 48]];
        (g || []).forEach(([x, y, rx, ry]) => {
          glowLayer.appendChild(U.svg('ellipse', { class: 'bo-glow', cx: x, cy: y, rx, ry }));
        });
      }
      function glowOff() { glowLayer.innerHTML = ''; }

      function showWord(text) {
        if (!text) { wordEl.classList.remove('on'); return; }
        wordEl.innerHTML = '';
        wordEl.appendChild(document.createTextNode(text));
        wordEl.classList.add('on');
      }

      const isPart = (hit, target) => hit === target || (PARTS[target].contains || []).includes(hit) ||
        (target === 'feet' && hit === 'toes') || (target === 'knees' && hit === 'legs') || (target === 'hands' && hit === 'arms' && false);
      const thatIs = (p) => (PARTS[p].pl ? `Those are Bo's ${PARTS[p].word}!` : `That's Bo's ${PARTS[p].word}!`);
      const whereIs = (p) => (PARTS[p].pl ? `Where are Bo's ${PARTS[p].word}?` : `Where is Bo's ${PARTS[p].word}?`);

      function onTap(e, pt) {
        lastTapAt = performance.now();
        const sp = toSvg(pt.x, pt.y);
        if (!sp) return;
        // Bo looks at every touch
        const ex = sp.x - 200, ey = sp.y - 150;
        const d = Math.hypot(ex, ey) || 1;
        const k = Math.min(9, d / 14);
        look = { x: (ex / d) * k, y: (ey / d) * k };
        const part = hitPart(sp.x, sp.y);
        if (!part) {
          // background: tiny sparkle, and Bo repeats the question if there is one
          sfx('bubble', { vel: 0.35 });
          PP.fx.burst(pt.x, pt.y, { emoji: ['✨'], count: 3, size: 22, distance: 40 });
          if (question && !question.done) ctx.say(whereIs(question.part), { mode: 'skip' });
          return;
        }
        tapsInPhase++;
        react(part);
        const q = question;
        if (q && !q.done) {
          if (isPart(part, q.part)) {
            q.done = true;
            q.resolve(part);
          } else {
            q.misses++;
            ctx.sfx('oops', { vel: 0.4, delay: 0.25 });
            if (q.misses >= 2) {
              if (!q.missReported) { q.missReported = true; ctx.miss(); }
              glowOn(q.part);
            }
            ctx.say(`${thatIs(part)} ${whereIs(q.part)}`);
          }
          return;
        }
        // free play: name it + the silly line (re-tapping the same part doesn't chop the word off)
        const w = PARTS[part].word;
        const nowMs = performance.now();
        const again = part === lastSaidPart && nowMs - lastSaidAt < 1500;
        lastSaidPart = part;
        lastSaidAt = nowMs;
        ctx.say(`${U.cap(w)}! ${SILLY[part]}`, again ? { mode: 'skip' } : undefined);
      }
      let lastSaidPart = '', lastSaidAt = 0;
      ctx.tap(stage, onTap, { cooldown: 40 });
      svg.__boHit = (x, y) => hitPart(x, y); // test hook (used by automated hit-map checks)

      /* ---------------- flow ---------------- */
      async function freePlay(nTaps, maxMs, prompt) {
        ctx.setPrompt(prompt);
        tapsInPhase = 0;
        const t0 = performance.now();
        let waved = false;
        while (ctx.alive && tapsInPhase < nTaps && performance.now() - t0 < maxMs) {
          await ctx.wait(250);
          if (!waved && performance.now() - Math.max(t0, lastTapAt) > 5500) {
            waved = true;
            wave();
            ctx.say(prompt, { mode: 'skip' });
          }
        }
        await ctx.wait(900);
      }
      function wave() {
        gesture(async (alive) => {
          await handsTo(null, [350, 220], 300);
          for (let i = 0; i < 3 && alive(); i++) { await handsTo(null, [374, 214], 160); await handsTo(null, [336, 222], 160); }
        });
        sfx('twinkle', { vel: 0.4 });
      }

      async function ask(part) {
        const prompt = whereIs(part);
        ctx.setPrompt(prompt);
        showWord(PARTS[part].word + '?');
        let resolve;
        const done = new Promise((r) => { resolve = r; });
        question = { part, misses: 0, done: false, resolve, missReported: false };
        const q = question;
        ctx.say(prompt);
        let idles = 0;
        const stopIdle = ctx.idle(7000, () => {
          if (q.done) return;
          idles++;
          ctx.say(prompt);
          if (idles >= 1) glowOn(part);
        });
        await done;
        stopIdle();
        glowOff();
        ctx.success(q.misses === 0);
        const sp = partPoint(part);
        ctx.sfx('success', { delay: 0.2 });
        PP.fx.burst(sp.x, sp.y, { emoji: ['⭐', '🌟', '✨'], count: 8, size: 34, distance: 90 * scale + 30 });
        PP.fx.confetti({ x: sp.x, y: sp.y, count: 40, power: 0.7 });
        happyUntil = now + 1.6;
        await ctx.wait(350);
        await ctx.say(`${ctx.praise()} ${thatIs(part)}`);
        question = null;
        showWord('');
        await ctx.wait(500);
      }

      async function celebrateBo() {
        happyUntil = now + 2.4;
        gesture(async () => {
          await handsTo([40, 200], [360, 200], 260);
          await ctx.wait(1500);
        });
        fx('all', 0.7, (p) => ({ ty: -70 * bump(p), sy: p < 0.12 ? 1 - 0.1 * bump(p / 0.12) : 1, r: 4 * Math.sin(p * TAU) }));
        ctx.setTimeout(() => fx('all', 0.6, (p) => ({ ty: -40 * bump(p) })), 800);
        await ctx.celebrate({ big: true, say: ctx.pick(['You know your body parts!', 'Bo is so happy!', 'Hooray! You did it!']) });
      }

      async function touchYour() {
        const lv = ctx.level;
        const opts = [];
        TEACH.slice(0, lv).forEach((arr) => arr.forEach((p) => { if (enabledFine(p) && TOUCH_YOUR[p]) opts.push(p); }));
        const part = ctx.pick(opts.length ? opts : ['nose']);
        const line = TOUCH_YOUR[part];
        ctx.setPrompt(line);
        showWord(`your ${PARTS[part].word}!`);
        youEl.classList.add('on');
        sfx('magic', { vel: 0.4 });
        await ctx.say(line);
        // Bo shows how while the child copies
        const melody = ctx.sequence([['C5', 0.5], ['E5', 0.5], ['G5', 0.5], ['E5', 0.5], ['C5', 0.5], ['E5', 0.5], ['G5', 1]], { bpm: 150, inst: 'kalimba', vel: 0.35, bus: 'sfx' });
        await demo(part);
        melody.stop();
        youEl.classList.remove('on');
        showWord('');
        happyUntil = now + 1.5;
        ctx.sfx('sparkle', { vel: 0.6 });
        PP.fx.burst(innerWidth / 2, innerHeight * 0.4, { emoji: ['⭐', '🌟', '💖'], count: 8, distance: 140 });
        await ctx.say(ctx.pick(['Good job!', 'Great job! You did it!', 'Yay! Just like Bo!']));
        await ctx.wait(400);
      }

      let recentQ = [];
      function pickQuestions(n) {
        const lv = ctx.level;
        const pool = [];
        TEACH.slice(0, lv).forEach((arr, i) => arr.forEach((p) => {
          if (!enabledFine(p)) return;
          const wgt = i === lv - 1 ? 3 : 1; // newest parts come up more often
          for (let k = 0; k < wgt; k++) pool.push(p);
        }));
        const out = [];
        let guard = 0;
        while (out.length < n && guard++ < 200) {
          const p = ctx.pick(pool);
          if (out.includes(p) || (recentQ.includes(p) && guard < 60)) continue;
          out.push(p);
        }
        recentQ = out.slice(-2);
        return out;
      }

      (async () => {
        await ctx.wait(350);
        wave();
        await ctx.say("Hi! I'm Bo! Tickle me!");
        let set = 0;
        while (ctx.alive) {
          await freePlay(set === 0 ? 4 : 3, set === 0 ? 12000 : 8000, 'Touch Bo! Tickle tickle!');
          await ctx.say(ctx.pick(["Let's play a game!", 'Now help me find...', 'Ready? Here we go!']));
          const qs = pickQuestions(3);
          for (const p of qs) {
            if (!ctx.alive) return;
            await ask(p);
          }
          await celebrateBo();
          set++;
          if (set % 2 === 1) await touchYour();
        }
      })();

      return { destroy() { glowOff(); } };
    },
  });
})();
