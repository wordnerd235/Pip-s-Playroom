/* Color Sort — color MATCHING (which comes before naming).
 * Big smiley toy boxes sit on the floor. One toy at a time appears; the child taps the matching box (or drags the
 * toy onto it). Correct → the toy hops into the box with a plop: "Red ball, red box!". Wrong → the toy bounces
 * back, "That's the blue box. Where does red go?", and after 2 misses the right box glows.
 * After the set is sorted the boxes jiggle and celebrate. Every other set is a quick "Find something yellow!"
 * round with real-world things, connecting colors to objects.
 *
 * Level 1: 2 boxes (red/blue/yellow), 4 toys, 2-choice find rounds.
 * Level 5: 4 boxes from 10 colors (look-alikes such as red/pink allowed), 6 toys, 3-choice find rounds.
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;
  const D = PP.data;
  const INK = '#2B2340';

  function starPts(cx, cy, R, r) {
    const p = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r : R;
      p.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1));
    }
    return p.join(' ');
  }

  /* ---------------- toys (any color) ---------------- */
  const TOYS = {
    ball: (c, L, K) => `
      <circle cx="50" cy="52" r="42" fill="${c}" stroke="${INK}" stroke-width="3.5"/>
      <path d="M10 50 C 30 64 70 64 90 50" stroke="${L}" stroke-width="10" fill="none" opacity=".9"/>
      <path d="M50 10 C 40 30 40 74 50 94" stroke="${K}" stroke-width="3" fill="none" opacity=".35"/>
      <circle cx="50" cy="52" r="42" fill="none" stroke="${INK}" stroke-width="3.5"/>
      <ellipse cx="34" cy="30" rx="12" ry="7" fill="#fff" opacity=".65" transform="rotate(-32 34 30)"/>`,
    car: (c, L, K) => `
      <path d="M8 62 C 8 50 16 44 26 44 L32 44 L42 26 C 44 22 48 20 52 20 L70 20 C 75 20 78 22 80 26 L90 44 C 96 46 98 52 98 60 L98 66 C 98 70 95 72 92 72 L12 72 C 9 72 8 70 8 66 Z" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M45 30 L58 30 L58 44 L37 44 Z" fill="#E4F5FF" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M64 30 L74 30 L81 44 L64 44 Z" fill="#E4F5FF" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M14 52 L26 52" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>
      <circle cx="94" cy="54" r="3.5" fill="#FFE45C" stroke="${INK}" stroke-width="2"/>
      <circle cx="30" cy="74" r="13" fill="#3A3448" stroke="${INK}" stroke-width="3"/><circle cx="30" cy="74" r="5" fill="#D7D3E2"/>
      <circle cx="76" cy="74" r="13" fill="#3A3448" stroke="${INK}" stroke-width="3"/><circle cx="76" cy="74" r="5" fill="#D7D3E2"/>`,
    block: (c, L, K) => `
      <path d="M50 14 L88 32 L50 50 L12 32 Z" fill="${L}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M12 32 L50 50 L50 92 L12 74 Z" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M88 32 L50 50 L50 92 L88 74 Z" fill="${K}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <ellipse cx="50" cy="31" rx="13" ry="6.5" fill="${c}" stroke="${INK}" stroke-width="3"/>
      <path d="M22 46 L24 66" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>`,
    duck: (c, L, K, id) => `
      <path d="M14 60 C 14 46 26 42 38 46 C 34 30 44 14 60 14 C 76 14 84 28 80 40 C 92 40 98 52 94 64 C 90 82 70 90 50 90 C 28 90 14 78 14 60 Z" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M78 32 C 88 26 99 30 97 38 C 93 44 84 42 79 40 Z" fill="${id === 'orange' ? '#FFD21F' : '#FF8C1A'}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="64" cy="30" r="5" fill="${id === 'black' ? '#fff' : INK}"/><circle cx="65.6" cy="28.4" r="1.8" fill="${id === 'black' ? INK : '#fff'}"/>
      <path d="M32 62 C 42 54 58 56 62 66 C 54 76 38 76 32 62 Z" fill="${K}" opacity=".45"/>
      <ellipse cx="46" cy="26" rx="7" ry="4" fill="#fff" opacity=".55" transform="rotate(-35 46 26)"/>`,
    star: (c, L, K, id, F) => `
      <polygon points="${starPts(50, 54, 46, 22)}" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="42" cy="54" r="3.6" fill="${F}"/><circle cx="58" cy="54" r="3.6" fill="${F}"/>
      <path d="M43 63 Q50 69 57 63" stroke="${F}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M38 34 L44 28" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>`,
    teddy: (c, L, K, id, F) => `
      <ellipse cx="50" cy="80" rx="27" ry="17" fill="${c}" stroke="${INK}" stroke-width="3.5"/>
      <ellipse cx="50" cy="84" rx="13" ry="9" fill="${L}"/>
      <circle cx="25" cy="24" r="12" fill="${c}" stroke="${INK}" stroke-width="3.5"/><circle cx="25" cy="24" r="5.5" fill="${L}"/>
      <circle cx="75" cy="24" r="12" fill="${c}" stroke="${INK}" stroke-width="3.5"/><circle cx="75" cy="24" r="5.5" fill="${L}"/>
      <circle cx="50" cy="46" r="29" fill="${c}" stroke="${INK}" stroke-width="3.5"/>
      <ellipse cx="50" cy="56" rx="12" ry="9" fill="${L}"/>
      <ellipse cx="50" cy="52" rx="4.6" ry="3.4" fill="${INK}"/>
      <path d="M45 60 Q50 64 55 60" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <circle cx="39" cy="42" r="3.6" fill="${F}"/><circle cx="61" cy="42" r="3.6" fill="${F}"/>
      <ellipse cx="38" cy="30" rx="7" ry="4" fill="#fff" opacity=".45" transform="rotate(-30 38 30)"/>`,
    fish: (c, L, K) => `
      <path d="M26 52 L6 32 C 2 46 2 58 6 72 Z" fill="${K}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M40 30 C 46 14 64 14 70 30 Z" fill="${K}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <ellipse cx="56" cy="52" rx="38" ry="27" fill="${c}" stroke="${INK}" stroke-width="3.5"/>
      <path d="M40 40 C 34 48 34 56 40 64" stroke="${K}" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".6"/>
      <circle cx="76" cy="46" r="7.5" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="78" cy="47" r="3.6" fill="${INK}"/>
      <path d="M84 60 Q78 64 73 61" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <ellipse cx="54" cy="36" rx="10" ry="4.5" fill="#fff" opacity=".5"/>`,
    heart: (c, L, K) => `
      <path d="M50 90 C 22 70 6 54 8 32 C 10 14 36 8 50 28 C 64 8 90 14 92 32 C 94 54 78 70 50 90 Z" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <ellipse cx="28" cy="30" rx="9" ry="6" fill="#fff" opacity=".6" transform="rotate(-35 28 30)"/>
      <path d="M70 26 Q78 30 80 38" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".45"/>`,
    boat: (c, L, K) => `
      <path d="M50 10 V64" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M55 14 C 70 28 80 44 84 60 L55 60 Z" fill="${L}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M45 24 L45 60 L20 60 C 26 46 34 34 45 24 Z" fill="${L}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M8 62 L92 62 C 88 80 74 90 60 90 L40 90 C 26 90 12 80 8 62 Z" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M18 70 L30 70" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>`,
  };
  const TOY_IDS = Object.keys(TOYS);
  function toySVG(kind, color) {
    const L = color.id === 'white' ? '#EEF0F4' : U.shade(color.hex, 0.35);
    const K = color.id === 'black' ? '#55505F' : color.id === 'white' ? '#C9CED6' : U.shade(color.hex, -0.22);
    return `<svg viewBox="0 0 100 100" aria-hidden="true">${TOYS[kind](color.hex, L, K, color.id, color.id === 'black' ? '#fff' : INK)}</svg>`;
  }

  /* ---------------- toy boxes ---------------- */
  function binBack(color) {
    return `<svg class="cs-back" viewBox="0 0 200 170" preserveAspectRatio="none" aria-hidden="true">
      <path d="M14 66 L14 40 C 14 28 24 22 36 22 L164 22 C 176 22 186 28 186 40 L186 66 Z" fill="${U.shade(color.hex, color.id === 'black' ? 0.15 : -0.45)}"/>
      <path d="M22 40 C 22 32 28 28 36 28 L164 28 C 172 28 178 32 178 40" stroke="rgba(255,255,255,.12)" stroke-width="4" fill="none"/></svg>`;
  }
  function binFront(color) {
    const dk = color.id === 'black' ? '#000' : U.shade(color.hex, -0.35);
    const rim = color.id === 'white' ? '#F4F6F9' : color.id === 'black' ? '#4A4654' : U.shade(color.hex, 0.25);
    return `<svg class="cs-front" viewBox="0 0 200 170" aria-hidden="true">
      <path d="M10 60 L190 60 L178 156 C 177 163 172 167 164 167 L36 167 C 28 167 23 163 22 156 Z" fill="${color.hex}" stroke="${dk}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M28 84 L35 150" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity="${color.id === 'white' ? 0 : 0.3}"/>
      <rect x="3" y="46" width="194" height="28" rx="14" fill="${rim}" stroke="${dk}" stroke-width="4"/>
      <path d="M18 54 L120 54" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45"/>
      <g class="cs-face">
        <g class="cs-eyes">
          <ellipse cx="76" cy="110" rx="12" ry="14" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle class="cs-pupil" cx="78" cy="112" r="6.5" fill="${INK}"/><circle cx="80.5" cy="109" r="2.2" fill="#fff"/>
          <ellipse cx="124" cy="110" rx="12" ry="14" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle class="cs-pupil" cx="126" cy="112" r="6.5" fill="${INK}"/><circle cx="128.5" cy="109" r="2.2" fill="#fff"/>
        </g>
        <path class="cs-happyeyes" d="M64 112 Q76 98 88 112 M112 112 Q124 98 136 112" stroke="${color.id === 'black' ? '#fff' : INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path class="cs-smile" d="M88 134 Q100 146 112 134" stroke="${color.id === 'black' ? '#fff' : INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
        <path class="cs-open" d="M84 130 Q100 158 116 130 Z" fill="#7A2B32" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <ellipse cx="56" cy="132" rx="10" ry="6" fill="#FF7A8A" opacity=".4"/><ellipse cx="144" cy="132" rx="10" ry="6" fill="#FF7A8A" opacity=".4"/>
      </g></svg>`;
  }

  /* names for the real-world color things */
  const THING_NAMES = {
    '🍎': 'apple', '🍓': 'strawberry', '🚒': 'fire truck', '🍒': 'cherries', '🍅': 'tomato', '🐞': 'ladybug', '🎈': 'balloon',
    '🍊': 'orange', '🥕': 'carrot', '🦊': 'fox', '🎃': 'pumpkin', '🏀': 'ball',
    '🍌': 'banana', '🌻': 'sunflower', '🍋': 'lemon', '🐥': 'chick', '🌽': 'corn', '🧀': 'cheese', '⭐': 'star',
    '🥦': 'broccoli', '🐸': 'frog', '🌳': 'tree', '🍐': 'pear', '🥒': 'cucumber', '🦖': 'dinosaur', '🐢': 'turtle',
    '🫐': 'blueberries', '🐳': 'whale', '🧢': 'hat', '💧': 'water drop', '🦋': 'butterfly', '👖': 'jeans',
    '🍇': 'grapes', '🍆': 'eggplant', '☂️': 'umbrella',
    '🐷': 'pig', '🌸': 'flower', '🦩': 'flamingo', '🧁': 'cupcake', '🎀': 'bow',
    '🐻': 'bear', '🍪': 'cookie', '🪵': 'log', '🥔': 'potato', '🐴': 'horse',
    '🎩': 'hat', '🎱': 'ball', '🕶️': 'sunglasses',
    '☁️': 'cloud', '⛄': 'snowman', '🥚': 'egg', '🐑': 'sheep', '🥛': 'milk',
  };
  const PLURAL = /^(cherries|blueberries|grapes|jeans|sunglasses|milk|corn|cheese|broccoli|water drop)$/;
  function thingPhrase(color, emoji) {
    const n = THING_NAMES[emoji] || 'one';
    if (n === color.name) return `an ${n}`; // "an orange"
    const art = PLURAL.test(n) ? '' : /^[aeiou]/.test(color.name) ? 'an ' : 'a ';
    return `${art}${color.name} ${n}`.trim();
  }

  const CONFUSABLE = [['red', 'pink'], ['red', 'orange'], ['orange', 'yellow'], ['blue', 'purple'], ['orange', 'brown'], ['red', 'brown'], ['purple', 'pink'], ['black', 'brown'], ['white', 'gray'], ['yellow', 'white']];

  U.addStyles('colorsort', `
    .g-colorsort { background: #FFF6E3; }
    .cs-room { position: absolute; inset: 0; pointer-events: none; }
    .cs-wall { position: absolute; left: 0; right: 0; top: 0; background-color: #E6F4FF;
      background-image: radial-gradient(circle, rgba(255,255,255,.75) 0 7px, transparent 8px), radial-gradient(circle, rgba(143,200,255,.28) 0 5px, transparent 6px);
      background-size: 64px 64px, 64px 64px; background-position: 0 0, 32px 32px; }
    .cs-wall::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 16px; background: #fff; box-shadow: 0 -3px 0 rgba(0,0,0,.04), 0 3px 0 #E2C9A3; }
    .cs-floor { position: absolute; left: 0; right: 0; bottom: 0;
      background: repeating-linear-gradient(90deg, #F2CF9E 0 120px, #EAC28C 120px 122px, #F5D5A8 122px 240px, #EAC28C 240px 242px), #F2CF9E; }
    .cs-rug { position: absolute; border-radius: 50%; background: radial-gradient(closest-side, #FFD9E8 0 72%, #FFC2DA 73% 84%, #FFD9E8 85% 100%); opacity: .9; }
    .cs-window { position: absolute; border-radius: 18px; background: linear-gradient(#9FDCFF, #E6F6FF); border: 8px solid #fff; box-shadow: 0 4px 0 rgba(0,0,0,.06); overflow: hidden; }
    .cs-window::before { content: ""; position: absolute; left: 50%; top: 0; bottom: 0; width: 8px; margin-left: -4px; background: #fff; }
    .cs-window::after { content: ""; position: absolute; top: 50%; left: 0; right: 0; height: 8px; margin-top: -4px; background: #fff; }
    .cs-sun { position: absolute; width: 34%; height: 34%; right: 12%; top: 10%; border-radius: 50%; background: #FFE45C; box-shadow: 0 0 0 6px rgba(255,228,92,.35); }

    .cs-bin { position: absolute; z-index: 10; touch-action: none; }
    .cs-bin.cs-in { animation: cs-binin .55s cubic-bezier(.3,1.5,.5,1) both; }
    .cs-bin.cs-out { animation: cs-binout .45s cubic-bezier(.5,0,.8,.5) both; pointer-events: none; }
    @keyframes cs-binin { from { transform: translateY(70%) scale(.6); opacity: 0 } to { transform: none; opacity: 1 } }
    @keyframes cs-binout { to { transform: translateY(90%) scale(.7); opacity: 0 } }
    .cs-binin { position: absolute; inset: 0; transform-origin: 50% 100%; }
    .cs-back, .cs-front { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: block; overflow: visible; }
    .cs-stash { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
    .cs-mini { position: absolute; transform-origin: 50% 100%; }
    .cs-mini svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .cs-happyeyes, .cs-open { display: none; }
    .cs-bin.happy .cs-eyes, .cs-bin.happy .cs-smile { display: none; }
    .cs-bin.happy .cs-happyeyes, .cs-bin.happy .cs-open { display: inline; }
    .cs-bin.over .cs-binin { transform: scale(1.07); transition: transform .15s; }
    .cs-binin.plop { animation: cs-plop .55s cubic-bezier(.3,1.6,.5,1); }
    .cs-binin.nope { animation: cs-nope .5s ease; }
    .cs-binin.jig { animation: cs-jig .7s ease-in-out 2; }
    @keyframes cs-plop { 0% { transform: scale(1,1) } 25% { transform: scale(1.12,.84) } 55% { transform: scale(.95,1.1) } 100% { transform: scale(1,1) } }
    @keyframes cs-nope { 0%, 100% { transform: rotate(0) } 25% { transform: rotate(-4deg) } 50% { transform: rotate(4deg) } 75% { transform: rotate(-2deg) } }
    @keyframes cs-jig { 0%, 100% { transform: rotate(0) translateY(0) } 25% { transform: rotate(-6deg) translateY(-12%) } 50% { transform: rotate(0) translateY(0) } 75% { transform: rotate(6deg) translateY(-12%) } }
    .cs-halo { position: absolute; left: -22%; right: -22%; top: -18%; bottom: -16%; border-radius: 40%; pointer-events: none; opacity: 0;
      background: radial-gradient(closest-side, rgba(255,240,120,1), rgba(255,226,70,.7) 62%, rgba(255,226,70,0)); }
    .cs-bin.hint .cs-halo { animation: bp-halo-cs 1s ease-in-out infinite; }
    .cs-bin.hint .cs-binin { animation: cs-hintbob 1s ease-in-out infinite; filter: drop-shadow(0 0 6px #FFE14D) drop-shadow(0 0 12px #FFE14D); }
    .cs-arrow { position: absolute; left: 50%; bottom: 100%; width: 34%; margin-left: -17%; aspect-ratio: 1; pointer-events: none; display: none; }
    .cs-arrow svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .cs-bin.hint .cs-arrow { display: block; animation: cs-arrow .7s ease-in-out infinite alternate; }
    @keyframes cs-arrow { from { transform: translateY(-14%) } to { transform: translateY(10%) } }
    @keyframes bp-halo-cs { 0%, 100% { opacity: .6; transform: scale(.94) } 50% { opacity: 1; transform: scale(1.06) } }
    @keyframes cs-hintbob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6%) } }

    .cs-toy { position: absolute; z-index: 20; touch-action: none; }
    .cs-toyshadow { position: absolute; left: 18%; right: 18%; bottom: -8%; height: 12%; border-radius: 50%; background: rgba(60,40,20,.16); animation: cs-shadow 1.6s ease-in-out infinite; }
    .cs-toyin { position: absolute; inset: 0; animation: cs-float 1.6s ease-in-out infinite; }
    .cs-toyin svg { width: 100%; height: 100%; display: block; overflow: visible; filter: drop-shadow(0 4px 0 rgba(0,0,0,.08)); }
    .cs-toy.pp-dragging .cs-toyin, .cs-toy.pp-dragging .cs-toyshadow { animation: none; }
    .cs-toy.wig .cs-toyin { animation: pp-wiggle .5s ease; }
    @keyframes cs-float { 0%, 100% { transform: translateY(0) rotate(-3deg) } 50% { transform: translateY(-7%) rotate(3deg) } }
    @keyframes cs-shadow { 0%, 100% { transform: scale(1); opacity: 1 } 50% { transform: scale(.82); opacity: .7 } }
    .cs-find { position: absolute; z-index: 15; display: none; }
    .cs-find.on { display: block; }
    .cs-swatch { position: absolute; z-index: 16; pointer-events: none; display: flex; gap: 10px; left: 50%; transform: translateX(-50%); }
  `);

  PP.registerGame({
    id: 'colorsort',
    title: 'Color Sort',
    domain: 'colors',
    icon: '🧺',
    tileColor: '#2EC4B6',
    order: 12,
    // every data-driven line, for tools/harvest.js (natural voice pack)
    voiceLines() {
      const L = [];
      PP.data.COLORS.forEach((c) => {
        const C = U.cap(c.name);
        L.push(`Find something ${c.name}!`, `${C}!`, `That's the ${c.name} box.`, `Where does ${c.name} go?`, `Find the ${c.name} box!`);
        TOY_IDS.forEach((k) => L.push(`${C} ${k}!`, `Where does the ${c.name} ${k} go?`, `${C} ${k}, ${c.name} box!`));
        (PP.data.COLOR_THINGS[c.id] || []).forEach((e) => { const p = thingPhrase(c, e); L.push(`That's ${p}.`, `${U.cap(p)}!`); });
      });
      return L;
    },
    create(stage, ctx) {
      const room = ctx.el('div', { class: 'cs-room' });
      const wall = ctx.el('div', { class: 'cs-wall' });
      const floor = ctx.el('div', { class: 'cs-floor' });
      const win = ctx.el('div', { class: 'cs-window' }, ctx.el('div', { class: 'cs-sun' }));
      const rug = ctx.el('div', { class: 'cs-rug' });
      room.append(wall, win, floor, rug);
      const findArea = ctx.el('div', { class: 'cs-find' });
      stage.append(room, findArea);
      ctx.mascot.show({ corner: 'tr' });

      let bins = [];          // {el, inner, stash, color, count}
      let toy = null;         // current toy {el, kind, color, drag}
      let state = null;       // current toy round {color, kind, misses, missed, hinted, done, resolve}
      let L = { w: 0, h: 0, bw: 100, bh: 85, toyS: 160, toyX: 0, toyY: 0, binTop: 0 };
      let lastColors = [];
      let lastKind = '';
      let idleTalks = 0;

      /* ---------------- layout ---------------- */
      function layout() {
        const { w, h } = ctx.size();
        const land = w > h * 1.1;
        const n = bins.length || 3;
        const pad = 12;
        const gap = U.clamp(Math.min(w, h) * 0.03, 10, 26);
        let cols = n, rows = 1;
        if (!land && n === 4 && w < 600) { cols = 2; rows = 2; }
        let bw = Math.min(land ? 280 : 290, (w - pad * 2 - gap * (cols - 1)) / cols);
        let bh = bw * 0.85;
        const maxH = land ? h * 0.4 : h * (rows > 1 ? 0.4 : 0.3);
        if (bh * rows + gap * (rows - 1) > maxH) { bh = (maxH - gap * (rows - 1)) / rows; bw = bh / 0.85; }
        const totW = cols * bw + gap * (cols - 1), totH = rows * bh + gap * (rows - 1);
        const x0 = (w - totW) / 2, y0 = h - totH - pad - 4;
        bins.forEach((b, i) => {
          const c = i % cols, r = Math.floor(i / cols);
          Object.assign(b.el.style, { left: x0 + c * (bw + gap) + 'px', top: y0 + r * (bh + gap) + 'px', width: bw + 'px', height: bh + 'px' });
          b.stash.querySelectorAll('.cs-mini').forEach((m, k) => placeMini(b, m, k));
        });
        const floorTop = y0 + bh * 0.38;
        wall.style.height = floorTop + 'px';
        floor.style.top = floorTop + 'px';
        const top = Math.max(land ? 16 : 90, 0);
        const toyS = U.clamp(Math.min(w * 0.46, (y0 - top - 24) * 0.82), 110, 270);
        L = { w, h, bw, bh, toyS, toyX: w / 2, toyY: top + (y0 - top - 10) / 2, binTop: y0, land };
        const ws = U.clamp(Math.min(w, h) * 0.22, 90, 200);
        Object.assign(win.style, { width: ws + 'px', height: ws * 0.8 + 'px', left: (land ? w * 0.08 + 70 : 18) + 'px', top: (land ? 18 : 100) + 'px' });
        win.style.display = land && w < 900 ? 'none' : '';
        if (!land && toyS > w * 0.42) win.style.display = 'none';
        Object.assign(rug.style, { width: toyS * 1.5 + 'px', height: toyS * 0.32 + 'px', left: w / 2 - toyS * 0.75 + 'px', top: L.toyY + toyS * 0.5 + 'px' });
        rug.style.display = L.toyY + toyS * 0.66 > floorTop ? '' : 'none';
        if (toy) placeToy(toy.el);
        const pipS = U.clamp(Math.min(w, h) * 0.14, 80, 140);
        Object.assign(findArea.style, land
          ? { left: Math.max(100, pipS + 8) + 'px', right: Math.max(100, pipS + 8) + 'px', top: '12px', bottom: '12px' }
          : { left: '12px', right: '12px', top: Math.max(90, pipS + 12) + 'px', bottom: '12px' });
      }
      function placeToy(el) {
        Object.assign(el.style, { left: L.toyX - L.toyS / 2 + 'px', top: L.toyY - L.toyS / 2 + 'px', width: L.toyS + 'px', height: L.toyS + 'px' });
      }
      function placeMini(b, m, k) {
        const s = L.bw * 0.42;
        const xs = [0.5, 0.27, 0.73, 0.38, 0.62, 0.5, 0.3, 0.7];
        Object.assign(m.style, {
          width: s + 'px', height: s + 'px', left: L.bw * xs[k % xs.length] - s / 2 + 'px',
          top: L.bh * 0.36 - s * 0.82 - (k >= 3 ? s * 0.18 : 0) + 'px',
          transform: `rotate(${m.dataset.rot}deg)`,
        });
      }
      ctx.onResize(layout);

      /* ---------------- bins ---------------- */
      function pickColors(n, lvl) {
        const pool = D.colorsForLevel(lvl);
        let best = null;
        for (let k = 0; k < 80; k++) {
          const s = ctx.sample(pool, n);
          const ids = s.map((c) => c.id);
          if (lvl <= 3 && CONFUSABLE.some(([a, b]) => ids.includes(a) && ids.includes(b))) continue;
          const same = ids.filter((id) => lastColors.includes(id)).length;
          if (same === n && k < 60) continue;
          if (same > Math.max(0, n - 2) && k < 40 && pool.length > n + 1) continue;
          best = s;
          break;
        }
        best = best || ctx.sample(pool, n);
        lastColors = best.map((c) => c.id);
        return best;
      }
      async function buildBins(colors) {
        clearBins(false);
        bins = colors.map((c) => {
          const el = ctx.el('div', { class: 'cs-bin pp-noripple', 'aria-label': c.name + ' box' });
          el.innerHTML = `<div class="cs-halo"></div><div class="cs-binin">${binBack(c)}<div class="cs-stash"></div>${binFront(c)}</div>` +
            `<div class="cs-arrow"><svg viewBox="0 0 100 100"><path d="M36 8 H64 V50 H86 L50 92 L14 50 H36 Z" fill="#FFD21F" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><path d="M44 16 V52" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6"/></svg></div>`;
          el.style.opacity = '0';
          stage.appendChild(el);
          const b = { el, inner: el.querySelector('.cs-binin'), stash: el.querySelector('.cs-stash'), color: c, count: 0 };
          ctx.tap(el, () => onBinTap(b));
          return b;
        });
        layout();
        for (const b of bins) {
          b.el.style.opacity = '';
          b.el.classList.add('cs-in');
          ctx.sfx('bubble');
          ctx.play('marimba', ['C5', 'E5', 'G5', 'C6'][bins.indexOf(b)], { vel: 0.4 });
          await ctx.say(U.cap(b.color.name) + '!');
          await ctx.wait(80);
        }
      }
      function clearBins(animate) {
        bins.forEach((b) => {
          if (animate) {
            b.el.classList.remove('cs-in');
            b.el.classList.add('cs-out');
            ctx.setTimeout(() => b.el.remove(), 480);
          } else b.el.remove();
        });
        bins = [];
      }
      function binAnim(b, cls) {
        b.inner.classList.remove('plop', 'nope', 'jig');
        void b.inner.offsetWidth;
        b.inner.classList.add(cls);
      }
      function setHappy(b, ms) {
        b.el.classList.add('happy');
        ctx.setTimeout(() => b.el.classList.remove('happy'), ms || 1200);
      }
      function hintBin(b, on) { b.el.classList.toggle('hint', on); }
      /** the boxes' pupils look toward a point (viewport coords) */
      function look(x, y) {
        bins.forEach((b) => {
          const r = b.el.getBoundingClientRect();
          const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height * 0.65);
          const d = Math.hypot(dx, dy) || 1;
          const k = Math.min(1, d / 200) * 4.5;
          b.pupils = b.pupils || b.el.querySelectorAll('.cs-pupil');
          b.pupils.forEach((p) => p.setAttribute('transform', `translate(${((dx / d) * k).toFixed(1)} ${((dy / d) * k).toFixed(1)})`));
        });
      }

      /* ---------------- toys ---------------- */
      function makeToy(kind, color) {
        const el = ctx.el('div', { class: 'cs-toy pp-noripple', 'aria-label': `${color.name} ${kind}` });
        el.innerHTML = `<div class="cs-toyshadow"></div><div class="cs-toyin">${toySVG(kind, color)}</div>`;
        placeToy(el);
        stage.appendChild(el);
        const t = { el, kind, color, moved: false };
        t.drag = ctx.drag(el, {
          lift: 1.1,
          onStart() {
            t.moved = false;
            idleTalks = 0;
          },
          onMove(e, d) {
            if (Math.hypot(d.dx, d.dy) > 12) t.moved = true;
            look(d.x, d.y);
            const b = binAt(d.x, d.y);
            bins.forEach((q) => q.el.classList.toggle('over', q === b));
          },
          onEnd(e, d) {
            bins.forEach((q) => q.el.classList.remove('over'));
            if (!state || state.done || toy !== t) return null;
            if (!t.moved) { tapToy(t); return null; }
            const b = binAt(d.x, d.y, true);
            if (!b) { ctx.sfx('boing', { vel: 0.35 }); return null; }
            if (b.color.id === t.color.id) { correct(b, true); return 'keep'; }
            wrong(b, true);
            return null;
          },
        });
        return t;
      }
      function binAt(x, y, generous) {
        let best = null, bd = Infinity;
        bins.forEach((b) => {
          const r = b.el.getBoundingClientRect();
          const m = generous ? r.width * 0.18 : 0;
          if (x >= r.left - m && x <= r.right + m && y >= r.top - r.height * (generous ? 0.5 : 0.2) && y <= r.bottom + m) {
            const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
            if (d < bd) { bd = d; best = b; }
          }
        });
        return best;
      }
      function tapToy(t) {
        t.el.classList.remove('wig'); void t.el.offsetWidth; t.el.classList.add('wig');
        ctx.sfx('boing', { vel: 0.4 });
        ctx.say(`${U.cap(t.color.name)} ${t.kind}!`, { mode: 'skip' });
      }

      /* ---------------- answers ---------------- */
      function onBinTap(b) {
        idleTalks = 0;
        if (!state || state.done || !toy) {
          // between toys: the box just giggles and says its color
          binAnim(b, 'plop');
          ctx.sfx('bubble', { vel: 0.5 });
          if (b.el.classList.contains('cs-in')) ctx.say(U.cap(b.color.name) + '!', { mode: 'skip' });
          return;
        }
        if (b.color.id === state.color.id) correct(b, false);
        else wrong(b, false);
      }
      function correct(b, fromDrag) {
        const st = state;
        st.done = true;
        const t = toy;
        toy = null;
        bins.forEach((q) => hintBin(q, false));
        const tr = t.el.getBoundingClientRect();
        const br = b.el.getBoundingClientRect();
        const sr = stage.getBoundingClientRect();
        // fly: from the toy's current on-screen box into the box opening (arc), then plop
        const cx = tr.left + tr.width / 2 - sr.left, cy = tr.top + tr.height / 2 - sr.top;
        const tx = br.left + br.width / 2 - sr.left, ty = br.top + br.height * 0.3 - sr.top;
        t.drag.setEnabled(false);
        t.el.style.transition = 'none';
        t.el.style.transform = 'none';
        Object.assign(t.el.style, { left: cx - L.toyS / 2 + 'px', top: cy - L.toyS / 2 + 'px', zIndex: 25 });
        const sc = (L.bw * 0.42) / L.toyS;
        const lift = Math.min(cy, ty) - (fromDrag ? 40 : L.toyS * 0.6) - Math.min(cy, ty);
        ctx.sfx('swish');
        const a = t.el.animate([
          { transform: `translate(0,0) scale(${fromDrag ? 1.1 : 1}) rotate(0)` },
          { transform: `translate(${(tx - cx) * 0.5}px, ${(ty - cy) * 0.5 + lift}px) scale(${(1 + sc) * 0.55}) rotate(-12deg)`, offset: 0.5 },
          { transform: `translate(${tx - cx}px, ${ty - cy}px) scale(${sc}) rotate(8deg)` },
        ], { duration: 560, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' });
        a.onfinish = () => {
          t.el.remove();
          t.drag.stop(); // release its pointer listeners
          addMini(b, t.kind, t.color);
          binAnim(b, 'plop');
          setHappy(b, 1300);
          ctx.sfx('bubble');
          ctx.sfx('pop', { vel: 0.5, delay: 0.04 });
          const p = U.center(b.el);
          PP.fx.burst(p.x, p.y - br.height * 0.3, { emoji: ['⭐', '✨', '🌟'], count: 6, distance: 90, size: 32 });
          PP.fx.confetti({ x: p.x, y: p.y - br.height * 0.3, count: 22, colors: [b.color.hex, b.color.light, '#FFE45C'], power: 0.6 });
        };
        ctx.success(st.misses === 0 && !st.hinted);
        ctx.mascot.mood('happy');
        const c = st.color.name;
        const line = Math.random() < 0.3 ? `${ctx.praise()} ${U.cap(c)} ${st.kind}, ${c} box!` : `${U.cap(c)} ${st.kind}, ${c} box!`;
        Promise.all([ctx.say(line), ctx.wait(1300)]).then(() => st.resolve());
      }
      function wrong(b, fromDrag) {
        const st = state;
        st.misses++;
        ctx.sfx('oops', { vel: 0.6 });
        binAnim(b, 'nope');
        ctx.mascot.mood('think');
        if (!fromDrag && toy) {
          // the toy hops toward the box, then bounces back home
          const tr = toy.el.getBoundingClientRect(), br = b.el.getBoundingClientRect();
          const dx = (br.left + br.width / 2 - (tr.left + tr.width / 2)) * 0.35, dy = (br.top - (tr.top + tr.height / 2)) * 0.3;
          toy.el.animate([
            { transform: 'translate(0,0) rotate(0)' }, { transform: `translate(${dx}px, ${dy - 30}px) rotate(-10deg)`, offset: 0.4 },
            { transform: `translate(${dx * 0.8}px, ${dy}px) scale(1.05,.92)`, offset: 0.55 }, { transform: 'translate(0,-20px) rotate(6deg)', offset: 0.8 }, { transform: 'translate(0,0) rotate(0)' },
          ], { duration: 650, easing: 'ease-in-out' });
          ctx.sfx('boing', { vel: 0.35, delay: 0.25 });
        }
        const right = bins.find((q) => q.color.id === st.color.id);
        if (st.misses >= 2) {
          if (!st.missed) { st.missed = true; ctx.miss(); }
          st.hinted = true;
          if (right) hintBin(right, true);
        }
        ctx.say(`That's the ${b.color.name} box. Where does ${st.color.name} go?`);
      }
      function addMini(b, kind, color) {
        const m = ctx.el('div', { class: 'cs-mini' });
        m.innerHTML = toySVG(kind, color);
        m.dataset.rot = U.randInt(-22, 22);
        b.stash.appendChild(m);
        placeMini(b, m, b.count);
        b.count++;
        m.animate([{ transform: `translateY(-40%) rotate(${m.dataset.rot}deg) scale(.6)` }, { transform: `translateY(8%) rotate(${m.dataset.rot}deg) scale(1.05,.9)`, offset: 0.6 }, { transform: `rotate(${m.dataset.rot}deg)` }],
          { duration: 380, easing: 'ease-out' });
      }

      /* ---------------- one toy ---------------- */
      function toyRound(color) {
        return new Promise((resolve) => {
          const pool = TOY_IDS.filter((k) => k !== lastKind);
          const kind = ctx.pick(pool);
          lastKind = kind;
          toy = makeToy(kind, color);
          state = { color, kind, misses: 0, missed: false, hinted: false, done: false, resolve, idle: 0 };
          ctx.poke();
          ctx.setTimeout(() => { if (toy) { const c = U.center(toy.el); look(c.x, c.y); } }, 300);
          toy.el.animate([
            { transform: 'translateY(-120%) scale(.7)', opacity: 0 }, { transform: 'translateY(6%) scale(1.08,.9)', opacity: 1, offset: 0.6 },
            { transform: 'translateY(-4%) scale(.97,1.04)', offset: 0.8 }, { transform: 'none' },
          ], { duration: 600, easing: 'ease-out' });
          ctx.sfx('slidedown', { vel: 0.35 });
          ctx.sfx('boing', { vel: 0.3, delay: 0.35 });
          const C = U.cap(color.name);
          const prompt = ctx.pick([`${C} ${kind}! Where does it go?`, `Where does the ${color.name} ${kind} go?`, `${C} ${kind}! Which box?`]);
          ctx.setPrompt(`Where does the ${color.name} ${kind} go?`);
          ctx.setTimeout(() => { if (state && !state.done) ctx.say(prompt); }, 350);
        });
      }

      ctx.idle(7000, () => {
        if (!state || state.done || !toy) return;
        idleTalks++;
        if (idleTalks > 4) return;
        state.idle++;
        const right = bins.find((q) => q.color.id === state.color.id);
        ctx.say(`${U.cap(state.color.name)} ${state.kind}! Find the ${state.color.name} box!`);
        if (right) {
          state.hinted = true;
          hintBin(right, true);
          // the toy leans toward its box
          const tr = toy.el.getBoundingClientRect(), br = right.el.getBoundingClientRect();
          const dx = (br.left + br.width / 2 - (tr.left + tr.width / 2)) * 0.12;
          toy.el.querySelector('.cs-toyin').animate([{ transform: 'translate(0,0)' }, { transform: `translate(${dx}px, -10%) rotate(${dx > 0 ? 10 : -10}deg)` }, { transform: 'translate(0,0)' }],
            { duration: 700, iterations: 2, easing: 'ease-in-out' });
        }
      });

      /* ---------------- sets ---------------- */
      async function sortSet(first) {
        const lvl = ctx.level;
        const n = [2, 2, 2, 3, 4, 4][lvl];
        const colors = pickColors(n, lvl);
        findArea.innerHTML = '';
        ctx.setPrompt('Put the toys in the boxes!');
        if (first) await ctx.say(n === 2 ? "Let's sort colors!" : "Let's sort colors! Look at the boxes!");
        else await ctx.say(ctx.pick(['New boxes!', 'Here come new boxes!']));
        await buildBins(colors);
        const count = [4, 4, 5, 6, 6, 6][lvl];
        // every box gets at least one toy; never three of a color in a row
        let seq = colors.slice();
        while (seq.length < count) seq.push(ctx.pick(colors));
        for (let k = 0; k < 30; k++) {
          seq = ctx.shuffle(seq);
          if (!seq.some((c, i) => i >= 2 && c === seq[i - 1] && c === seq[i - 2])) break;
        }
        for (const c of seq) {
          await ctx.wait(250);
          await toyRound(c);
          state = null;
        }
        // all sorted!
        await ctx.wait(300);
        bins.forEach((b, i) => ctx.setTimeout(() => { binAnim(b, 'jig'); setHappy(b, 1600); ctx.play('xylo', ['C5', 'E5', 'G5', 'C6'][i], { vel: 0.5 }); }, i * 140));
        await ctx.celebrate({ big: true, say: ctx.pick(['All sorted! Great job!', 'You sorted them all!', 'The boxes are full! Hooray!']), colors: colors.map((c) => c.hex).concat(['#FFE45C']) });
        await ctx.wait(200);
        clearBins(true);
        await ctx.wait(500);
      }

      async function findSet() {
        const lvl = ctx.level;
        const nChoices = lvl <= 2 ? 2 : 3;
        const recent = lastColors.slice();
        ctx.mascot.mood('wave');
        findArea.classList.add('on');
        ctx.poke();
        const rounds = 2;
        let prevTarget = '';
        for (let r = 0; r < rounds; r++) {
          const avail = D.colorsForLevel(Math.max(lvl, 2)).filter((c) => D.COLOR_THINGS[c.id] && c.id !== 'white' && c.id !== 'black');
          let targetPool = avail.filter((c) => recent.includes(c.id) && c.id !== prevTarget);
          if (!targetPool.length) targetPool = avail.filter((c) => c.id !== prevTarget);
          const target = ctx.pick(targetPool);
          prevTarget = target.id;
          const others = ctx.shuffle(avail.filter((c) => c.id !== target.id && !(lvl <= 3 && CONFUSABLE.some(([a, b]) => (a === target.id && b === c.id) || (b === target.id && a === c.id)))));
          const tEmoji = ctx.pick(D.COLOR_THINGS[target.id]);
          const choices = [{ id: target.id, color: target, emoji: tEmoji }];
          others.slice(0, nChoices - 1).forEach((c) => choices.push({ id: c.id, color: c, emoji: ctx.pick(D.COLOR_THINGS[c.id].filter((e) => !D.COLOR_THINGS[target.id].includes(e))) }));
          await PP.kit.findRound(ctx, {
            container: findArea,
            choices: ctx.shuffle(choices).map((ch) => ({ id: ch.id, name: thingPhrase(ch.color, ch.emoji), render: () => PP.kit.emoji(ch.emoji) })),
            targetId: target.id,
            intro: r === 0 ? ctx.pick(["Let's find colors!", 'Now find colors!']) : null,
            prompt: `Find something ${target.name}!`,
            maxCard: 250,
            idleMs: 8000,
            sayWrong: (ch) => `That's ${ch.name}.`,
            sayRight: (ch) => `${ctx.praise()} ${U.cap(ch.name)}!`,
          });
          await ctx.wait(200);
        }
        findArea.innerHTML = '';
        findArea.classList.remove('on');
      }

      if (/[?&]ppdebug/.test(location.search)) {
        window.__cs = { get state() { return state; }, get bins() { return bins; }, get toy() { return toy; }, TOY_IDS, toySVG };
      }

      layout();
      (async () => {
        let first = true, k = 0;
        while (ctx.alive) {
          await sortSet(first);
          first = false;
          k++;
          if (k % 2 === 1) await findSet();
        }
      })();

      return { destroy() { if (window.__cs) delete window.__cs; } };
    },
  });
})();
