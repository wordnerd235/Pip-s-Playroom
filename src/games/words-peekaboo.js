/* Peekaboo — open doors to find who's hiding (expressive vocabulary + object permanence).
 * Scenes: Barn (animals) · Garage (vehicles) · Kitchen fridges (food) · Toy box (toys) · Closet (clothes).
 * Level 1: 2 doors (core words) → Level 5: 6 doors (more words). From level 3 the doors close again and
 * Pip asks "Where's the cow?" — a gentle, errorless memory (object-permanence) question.
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;

  /* ======================================================================= styles */
  U.addStyles('peekaboo', `
    .g-peekaboo { background: #BDE9FF; }
    .pk-scene { position: absolute; inset: 0; overflow: hidden; transition: opacity .38s ease, transform .38s ease; }
    .pk-scene.pk-out { opacity: 0; transform: scale(.94); }
    .pk-scene.pk-in { animation: pk-scenein .5s cubic-bezier(.3,1.3,.5,1) both; }
    @keyframes pk-scenein { from { opacity: 0; transform: scale(1.06) } to { opacity: 1; transform: scale(1) } }
    .pk-deco { position: absolute; pointer-events: none; }

    /* ---- scene backdrops ---- */
    .s-barn { background: linear-gradient(#7FCFFF 0%, #BFEBFF 55%, #E6F8FF 100%); }
    .s-garage { background: linear-gradient(#8FD2FF 0%, #CFEFFF 60%, #EAF8FF 100%); }
    .s-kitchen { background-color: #FFF5DF;
      background-image: linear-gradient(45deg, #FFE7BD 25%, transparent 25%, transparent 75%, #FFE7BD 75%),
                        linear-gradient(45deg, #FFE7BD 25%, transparent 25%, transparent 75%, #FFE7BD 75%);
      background-size: 64px 64px; background-position: 0 0, 32px 32px; }
    .s-toybox { background-color: #EADFFF;
      background-image: radial-gradient(circle, rgba(255,255,255,.75) 0 5px, transparent 6px),
                        radial-gradient(circle, rgba(255,214,102,.65) 0 4px, transparent 5px);
      background-size: 60px 60px, 60px 60px; background-position: 0 0, 30px 30px; }
    .s-closet { background: repeating-linear-gradient(90deg, #DDF5EC 0 36px, #CBEEE1 36px 72px); }

    .pk-cloud { width: 120px; height: 34px; background: #fff; border-radius: 40px; opacity: .92; animation: pk-drift linear infinite; }
    .pk-cloud::before, .pk-cloud::after { content: ""; position: absolute; background: #fff; border-radius: 50%; }
    .pk-cloud::before { width: 54px; height: 54px; left: 18px; top: -26px; }
    .pk-cloud::after { width: 40px; height: 40px; left: 60px; top: -18px; }
    .pk-cloud-sm { width: 90px; height: 26px; opacity: .8; }
    .pk-cloud-sm::before { width: 40px; height: 40px; left: 14px; top: -19px; }
    .pk-cloud-sm::after { width: 30px; height: 30px; left: 46px; top: -13px; }
    @keyframes pk-drift { from { transform: translateX(-160px) } to { transform: translateX(calc(100vw + 160px)) } }

    .pk-ground { left: 0; right: 0; bottom: 0; }
    .s-barn .pk-ground { background: linear-gradient(#8FDB6E, #5DBB4E); border-top: 6px solid #A6E784; }
    .s-garage .pk-ground { background: linear-gradient(#7A8395, #5E6577); border-top: 8px solid #C9CFDA; }
    .s-garage .pk-ground::after { content: ""; position: absolute; left: 0; right: 0; top: 46%; height: 8px;
      background: repeating-linear-gradient(90deg, #FFD21F 0 46px, transparent 46px 92px); opacity: .9; }
    .s-kitchen .pk-ground { background-color: #F3F7FF;
      background-image: linear-gradient(45deg, #C8D6F2 25%, transparent 25%, transparent 75%, #C8D6F2 75%),
                        linear-gradient(45deg, #C8D6F2 25%, transparent 25%, transparent 75%, #C8D6F2 75%);
      background-size: 48px 48px; background-position: 0 0, 24px 24px; border-top: 8px solid #B48A5C; }
    .s-toybox .pk-ground { background: linear-gradient(#F7C88B, #E9AE6A); border-top: 7px solid #FFDDAA; }
    .s-toybox .pk-ground::after { content: ""; position: absolute; left: 12%; right: 12%; top: 22%; bottom: -30%;
      border-radius: 50%; background: radial-gradient(ellipse at center, #FF9EC4 0 40%, #FFB9D6 41% 56%, #FF9EC4 57% 70%, transparent 71%); opacity: .85; }
    .s-closet .pk-ground { background: repeating-linear-gradient(90deg, #D9A066 0 70px, #C98F57 70px 72px); border-top: 7px solid #F0C58F; }

    .pk-wall { border-radius: 10px; }
    .s-barn .pk-wall { background: repeating-linear-gradient(90deg, #D8473B 0 26px, #BF3A30 26px 29px);
      box-shadow: inset 0 0 0 8px #FFF3DE, 0 10px 24px rgba(80, 20, 10, .18); }
    .s-barn .pk-roof { background: #8C2B25; clip-path: polygon(50% 0, 100% 100%, 0 100%); }
    .s-barn .pk-roof::after { content: ""; position: absolute; left: 50%; top: 42%; width: 22%; aspect-ratio: 1; max-width: 70px;
      transform: translate(-50%, 0); border-radius: 50%; background: #FFF3DE; box-shadow: inset 0 0 0 5px #6B1F1A; }
    .s-barn .pk-rooftrim { background: #FFF3DE; clip-path: polygon(50% 0, 100% 100%, 0 100%); }
    .s-garage .pk-wall { background-color: #F1D9C4;
      background-image: linear-gradient(#E3C2A6 2px, transparent 2px), linear-gradient(90deg, #E3C2A6 2px, transparent 2px);
      background-size: 44px 22px, 44px 44px; box-shadow: 0 10px 24px rgba(40, 40, 80, .18); }
    .s-garage .pk-roof { background: linear-gradient(#5B6B8C, #46547A); border-radius: 12px 12px 4px 4px; box-shadow: 0 6px 0 rgba(0,0,0,.12); }

    .pk-shelf { height: 14px; border-radius: 7px; }
    .s-kitchen .pk-shelf { background: linear-gradient(#D6A472, #B4834F); box-shadow: 0 6px 10px rgba(80,40,0,.18); }
    .s-toybox .pk-shelf { background: linear-gradient(#FFB547, #E98E1F); box-shadow: 0 6px 10px rgba(80,40,0,.18); }
    .s-closet .pk-shelf { background: linear-gradient(#C99A6B, #A97A4C); box-shadow: 0 6px 10px rgba(60,30,0,.18); }

    /* ---- sign ---- */
    .pk-sign { position: absolute; z-index: 6; left: 50%; top: calc(var(--safe-t) + 12px); transform: translateX(-50%);
      display: flex; align-items: center; gap: .3em; padding: .18em .62em .2em .5em; border-radius: 16px;
      font-weight: 900; font-size: clamp(22px, 4.6vmin, 40px); color: #6B3A12; white-space: nowrap;
      background: linear-gradient(#FFE0A8, #F7C27A); border: 4px solid #fff; box-shadow: 0 5px 0 #D59A4F, 0 9px 18px rgba(80,40,0,.22); }
    .pk-sign .pp-emoji { font-size: 1.15em; }
    .pk-sign.pk-swing { animation: pk-swing .9s ease-out; transform-origin: 50% -20px; }
    @keyframes pk-swing { 0% { transform: translateX(-50%) rotate(0) } 20% { transform: translateX(-50%) rotate(-8deg) } 45% { transform: translateX(-50%) rotate(6deg) } 70% { transform: translateX(-50%) rotate(-3deg) } 100% { transform: translateX(-50%) rotate(0) } }

    /* ---- cells / doors ---- */
    .pk-cell { position: absolute; --cw: 200px; --ch: 240px; }
    .pk-cell.pk-pop { animation: pk-cellin .55s cubic-bezier(.3,1.5,.5,1) both; }
    @keyframes pk-cellin { from { transform: scale(.2) translateY(30%); opacity: 0 } to { transform: none; opacity: 1 } }
    .pk-cell.pk-busy { z-index: 3; }
    .pk-layer { position: absolute; }
    .pk-layer > svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; overflow: visible; }
    .pk-inside { overflow: hidden; }
    .pk-doors { perspective: calc(var(--ch) * 3); -webkit-perspective: calc(var(--ch) * 3); }
    .pk-doors.pk-clip { overflow: hidden; }
    .pk-leaf { position: absolute; top: 0; bottom: 0; transform-style: preserve-3d; -webkit-transform-style: preserve-3d; will-change: transform; }
    .pk-leaf.pk-l { left: 0; width: 50%; transform-origin: 0 50%; }
    .pk-leaf.pk-r { right: 0; width: 50%; transform-origin: 100% 50%; }
    .pk-leaf.pk-full { left: 0; right: 0; width: auto; }
    .pk-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
    .pk-face > svg { width: 100%; height: 100%; display: block; }
    .pk-face.pk-back { transform: rotateY(180deg); }
    .pk-lidwrap .pk-face.pk-back { transform: rotateX(180deg); }
    .pk-glowbox { position: absolute; inset: -6px; border-radius: 18px; pointer-events: none; }

    .pk-item { position: absolute; left: 0; top: 0; z-index: 4; pointer-events: none; transform: translate(-50%, -50%) scale(0); }
    .pk-item .pp-emoji { display: block; line-height: 1; filter: drop-shadow(0 4px 3px rgba(0,0,0,.22)); }
    .pk-cell.pk-open .pk-item .pp-emoji { animation: pk-bob 2.6s ease-in-out infinite; }
    @keyframes pk-bob { 0%, 100% { transform: translateY(0) rotate(-3deg) } 50% { transform: translateY(-6%) rotate(3deg) } }
    .pk-light { position: absolute; inset: 0; opacity: 0; transition: opacity .35s; background: radial-gradient(circle at 50% 55%, rgba(255,246,190,.85), rgba(255,246,190,0) 62%); }
    .pk-cell.pk-open .pk-light, .pk-cell.pk-opening .pk-light { opacity: 1; }
    .pk-label { position: absolute; left: 50%; z-index: 5; transform: translate(-50%, 0) scale(0); pointer-events: none;
      padding: .06em .55em .12em; border-radius: 99px; background: #fff; color: #3A2A5A; font-weight: 900; white-space: nowrap;
      box-shadow: 0 3px 0 rgba(0,0,0,.14); transition: transform .35s cubic-bezier(.3,1.6,.5,1); }
    .pk-cell.pk-open .pk-label { transform: translate(-50%, 0) scale(1); }

    .pk-openlid { transform: scaleY(0); transform-origin: 50% 100%; }
    .pk-lid { transform-origin: 50% 100%; }
    .pk-cell .pk-shadow { position: absolute; left: 8%; right: 8%; height: 8%; bottom: -4%; border-radius: 50%; background: rgba(40, 20, 60, .16); }
  `);

  U.addDefs('peekaboo', `
    <linearGradient id="pk-sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".12"/>
    </linearGradient>
    <linearGradient id="pk-sideL" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".12"/><stop offset=".25" stop-color="#000" stop-opacity="0"/>
      <stop offset=".85" stop-color="#fff" stop-opacity=".0"/><stop offset="1" stop-color="#fff" stop-opacity=".16"/>
    </linearGradient>
    <linearGradient id="pk-sideR" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".12"/><stop offset=".25" stop-color="#000" stop-opacity="0"/>
      <stop offset=".85" stop-color="#fff" stop-opacity=".0"/><stop offset="1" stop-color="#fff" stop-opacity=".16"/>
    </linearGradient>
    <radialGradient id="pk-glass" cx="30%" cy="25%" r="90%">
      <stop offset="0" stop-color="#E9F8FF"/><stop offset=".6" stop-color="#9ED6F5"/><stop offset="1" stop-color="#6FB6E0"/>
    </radialGradient>
    <linearGradient id="pk-hay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFE07A"/><stop offset="1" stop-color="#E7B03C"/>
    </linearGradient>
  `);

  /* ======================================================================= content */
  const SCENES = [
    {
      id: 'barn', name: 'Barn', cat: 'animals', emoji: '🐮', door: 'barn', aspect: 0.8,
      intro: ['The barn! Who is hiding?', 'Moo! Let’s go to the barn!'],
      easy: ['cow', 'pig', 'duck', 'sheep', 'horse', 'chicken', 'dog', 'cat'],
      more: ['rooster', 'goat', 'bunny', 'mouse', 'frog', 'owl', 'bird', 'bee', 'turtle'],
    },
    {
      id: 'garage', name: 'Garage', cat: 'vehicles', emoji: '🚗', door: 'garage', aspect: 1.0,
      intro: ['The garage! What is inside?', 'Beep beep! Let’s go to the garage!'],
      easy: ['car', 'bus', 'truck', 'fire_truck', 'train', 'tractor', 'airplane', 'boat', 'police_car'],
      more: ['ambulance', 'helicopter', 'bike', 'rocket', 'motorcycle', 'taxi', 'race_car', 'scooter'],
    },
    {
      id: 'kitchen', name: 'Kitchen', cat: 'food', emoji: '🍎', door: 'fridge', aspect: 0.6,
      intro: ['The kitchen! What is in the fridge?', 'Yum! Let’s look in the fridge!'],
      easy: ['apple', 'banana', 'milk', 'cheese', 'egg', 'cookie', 'bread', 'strawberry', 'carrot', 'grapes'],
      more: ['watermelon', 'broccoli', 'corn', 'cake', 'ice_cream', 'pizza', 'pear', 'cherries', 'pancakes', 'cupcake', 'orange', 'juice'],
    },
    {
      id: 'toybox', name: 'Toy Box', cat: 'home', emoji: '🧸', door: 'chest', aspect: 0.9,
      intro: ['The toy boxes! What will pop out?', 'Toys! Let’s open the toy boxes!'],
      easy: ['ball', 'teddy_bear', 'book', 'drum', 'balloon', 'blocks', 'present', 'crayon'],
      more: ['kite', 'guitar', 'phone', 'clock', 'key', 'spoon', 'cup', 'umbrella', 'toothbrush'],
    },
    {
      id: 'closet', name: 'Closet', cat: 'clothes', emoji: '👕', door: 'wardrobe', aspect: 0.62,
      intro: ['The closet! What can we wear?', 'Let’s peek in the closet!'],
      easy: ['shirt', 'pants', 'socks', 'shoe', 'hat', 'coat', 'dress', 'boots'],
      more: ['mittens', 'scarf', 'glasses', 'crown'],
    },
  ];

  // little extra lines after the name for words without an animal/vehicle sound
  const EXTRA = {
    ball: 'Bounce, bounce!', drum: 'Boom boom!', balloon: 'Up, up, up!', teddy_bear: 'Big hug!', book: 'Let’s read!',
    blocks: 'Stack them up!', present: 'Surprise!', kite: 'Up in the sky!', guitar: 'Strum strum!', clock: 'Tick tock!',
    phone: 'Hello?', crayon: 'Scribble scribble!', umbrella: 'Drip drop!', toothbrush: 'Brush brush!', cup: 'Sip sip!',
    socks: 'For your toes!', hat: 'On your head!', shoe: 'Stomp stomp!', boots: 'Splash splash!', crown: 'Like a king!',
    glasses: 'I can see you!', mittens: 'Warm hands!', coat: 'Nice and warm!', scarf: 'So cozy!', pants: 'For your legs!',
    cookie: 'Yum yum!', cake: 'Yum yum!', ice_cream: 'Yum!', banana: 'Yum!', apple: 'Crunch!', milk: 'Gulp gulp!',
    cheese: 'Say cheese!', carrot: 'Crunch crunch!', pizza: 'Yum yum!', cupcake: 'Yum!', juice: 'Slurp!',
  };

  const DOOR_COLORS = {
    garage: ['#FF6B6B', '#FFB547', '#4D96FF', '#3DBE4B', '#B276F5', '#22C3C3'],
    fridge: ['#9BE3D0', '#FFB3CF', '#FFE58A', '#A9D3FF', '#C9B6FF', '#FFC79A'],
    chest: ['#FF7A59', '#4D96FF', '#3DBE4B', '#B276F5', '#FFB547', '#FF6FB5'],
    wardrobe: ['#C9A6F2', '#FFB3D8', '#8FD8C8', '#FFD27A', '#A9CBFF', '#FFB199'],
  };

  /* ======================================================================= door art (px-exact SVG) */
  const f1 = (v) => (Math.round(v * 10) / 10).toString();

  function svgWrap(w, h, inner) {
    return `<svg viewBox="0 0 ${f1(w)} ${f1(h)}" preserveAspectRatio="none" aria-hidden="true">${inner}</svg>`;
  }

  function barnLeaf(w, h, side, back) {
    const s = w / 50;
    const base = back ? '#A4322A' : '#D8463A';
    const plank = back ? '#8A2822' : '#B9382E';
    let planks = '';
    for (let i = 1; i < 3; i++) planks += `M${f1((w * i) / 3)} 0V${f1(h)}`;
    let inner = `<rect width="${f1(w)}" height="${f1(h)}" fill="${base}"/><path d="${planks}" stroke="${plank}" stroke-width="${f1(1.6 * s)}"/>`;
    if (!back) {
      const t = 4.2 * s, m = t / 2;
      const x0 = m, x1 = w - m, y0 = m, y1 = h - m, ym = h / 2;
      const trim = '#FFF3DE';
      inner += `<rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(x1 - x0)}" height="${f1(y1 - y0)}" fill="none" stroke="${trim}" stroke-width="${f1(t)}" rx="${f1(s)}"/>` +
        `<path d="M${f1(x0)} ${f1(ym)}H${f1(x1)}" stroke="${trim}" stroke-width="${f1(t)}"/>` +
        `<path d="M${f1(x0 + t * .3)} ${f1(y0 + t * .3)}L${f1(x1 - t * .3)} ${f1(ym - t * .3)}M${f1(x1 - t * .3)} ${f1(y0 + t * .3)}L${f1(x0 + t * .3)} ${f1(ym - t * .3)}` +
        `M${f1(x0 + t * .3)} ${f1(ym + t * .3)}L${f1(x1 - t * .3)} ${f1(y1 - t * .3)}M${f1(x1 - t * .3)} ${f1(ym + t * .3)}L${f1(x0 + t * .3)} ${f1(y1 - t * .3)}" stroke="${trim}" stroke-width="${f1(t * .82)}" stroke-linecap="round"/>`;
      // hinge straps on the outer edge + a ring handle on the inner edge
      const hx = side === 'l' ? 0 : w - 9 * s;
      inner += `<rect x="${f1(hx)}" y="${f1(h * .2)}" width="${f1(9 * s)}" height="${f1(3.2 * s)}" rx="${f1(1.2 * s)}" fill="#4A3426"/>` +
        `<rect x="${f1(hx)}" y="${f1(h * .78)}" width="${f1(9 * s)}" height="${f1(3.2 * s)}" rx="${f1(1.2 * s)}" fill="#4A3426"/>`;
      const kx = side === 'l' ? w - 6.5 * s : 6.5 * s;
      inner += `<circle cx="${f1(kx)}" cy="${f1(ym + 6 * s)}" r="${f1(3 * s)}" fill="none" stroke="#4A3426" stroke-width="${f1(1.6 * s)}"/>` +
        `<circle cx="${f1(kx)}" cy="${f1(ym + 2.4 * s)}" r="${f1(1.5 * s)}" fill="#4A3426"/>`;
    }
    inner += `<rect width="${f1(w)}" height="${f1(h)}" fill="url(#pk-sheen)"/><rect width="${f1(w)}" height="${f1(h)}" fill="url(#pk-side${side === 'l' ? 'L' : 'R'})"/>`;
    return svgWrap(w, h, inner);
  }

  function garagePanel(w, h, color) {
    const s = w / 100;
    const n = 4, sh = h / n;
    const dark = U.shade(color, -0.22), light = U.shade(color, 0.3);
    let inner = `<rect width="${f1(w)}" height="${f1(h)}" fill="${color}"/>`;
    for (let i = 0; i < n; i++) {
      const y = i * sh;
      inner += `<rect x="${f1(4 * s)}" y="${f1(y + sh * .16)}" width="${f1(w - 8 * s)}" height="${f1(sh * .62)}" rx="${f1(2.5 * s)}" fill="${light}" opacity=".35"/>`;
      if (i) inner += `<path d="M0 ${f1(y)}H${f1(w)}" stroke="${dark}" stroke-width="${f1(2.2 * s)}"/><path d="M0 ${f1(y + 2.2 * s)}H${f1(w)}" stroke="${light}" stroke-width="${f1(1.2 * s)}" opacity=".7"/>`;
    }
    // windows in the 2nd section
    const wy = sh * 1.22, wh = sh * .52, gap = 5 * s, ww = (w - 12 * s - gap * 3) / 4;
    for (let i = 0; i < 4; i++) {
      const x = 6 * s + i * (ww + gap);
      inner += `<rect x="${f1(x)}" y="${f1(wy)}" width="${f1(ww)}" height="${f1(wh)}" rx="${f1(3 * s)}" fill="url(#pk-glass)" stroke="${dark}" stroke-width="${f1(1.6 * s)}"/>` +
        `<path d="M${f1(x + ww * .2)} ${f1(wy + wh * .75)}L${f1(x + ww * .55)} ${f1(wy + wh * .2)}" stroke="#fff" stroke-width="${f1(2 * s)}" stroke-linecap="round" opacity=".7"/>`;
    }
    // handle
    inner += `<rect x="${f1(w / 2 - 12 * s)}" y="${f1(h - sh * .55)}" width="${f1(24 * s)}" height="${f1(6 * s)}" rx="${f1(3 * s)}" fill="${U.shade(color, -0.45)}"/>`;
    inner += `<rect width="${f1(w)}" height="${f1(h)}" fill="url(#pk-sheen)"/>`;
    return svgWrap(w, h, inner);
  }

  function fridgeDoor(w, h, color, back) {
    const s = w / 100;
    const r = 9 * s;
    if (back) {
      // inner lining with door racks
      let inner = `<rect width="${f1(w)}" height="${f1(h)}" rx="${f1(r)}" fill="#F4F7FB" stroke="${U.shade(color, -0.15)}" stroke-width="${f1(3 * s)}"/>`;
      for (let i = 1; i <= 3; i++) {
        const y = (h * i) / 4;
        inner += `<rect x="${f1(10 * s)}" y="${f1(y - 5 * s)}" width="${f1(w - 20 * s)}" height="${f1(9 * s)}" rx="${f1(3 * s)}" fill="#DDE6F2"/>`;
      }
      return svgWrap(w, h, inner);
    }
    const dark = U.shade(color, -0.25);
    let inner = `<rect width="${f1(w)}" height="${f1(h)}" rx="${f1(r)}" fill="${color}"/>` +
      `<rect x="${f1(3 * s)}" y="${f1(3 * s)}" width="${f1(w - 6 * s)}" height="${f1(h * .45)}" rx="${f1(r * .8)}" fill="#fff" opacity=".22"/>` +
      // handle on the right
      `<rect x="${f1(w - 15 * s)}" y="${f1(h * .1)}" width="${f1(7.5 * s)}" height="${f1(h * .34)}" rx="${f1(3.75 * s)}" fill="${dark}"/>` +
      `<rect x="${f1(w - 13.4 * s)}" y="${f1(h * .12)}" width="${f1(2.4 * s)}" height="${f1(h * .28)}" rx="${f1(1.2 * s)}" fill="#fff" opacity=".45"/>`;
    // a child's drawing held by a magnet: little sun + smile
    const px = w * .16, py = h * .5, pw = w * .5, ph = w * .46;
    inner += `<g transform="rotate(-6 ${f1(px + pw / 2)} ${f1(py + ph / 2)})"><rect x="${f1(px)}" y="${f1(py)}" width="${f1(pw)}" height="${f1(ph)}" rx="${f1(2 * s)}" fill="#fff" stroke="#E5E9F2" stroke-width="${f1(1.2 * s)}"/>` +
      `<circle cx="${f1(px + pw * .5)}" cy="${f1(py + ph * .55)}" r="${f1(pw * .2)}" fill="#FFD21F"/>` +
      `<path d="M${f1(px + pw * .5)} ${f1(py + ph * .18)}V${f1(py + ph * .26)}M${f1(px + pw * .18)} ${f1(py + ph * .55)}H${f1(px + pw * .26)}M${f1(px + pw * .82)} ${f1(py + ph * .55)}H${f1(px + pw * .74)}M${f1(px + pw * .27)} ${f1(py + ph * .3)}L${f1(px + pw * .33)} ${f1(py + ph * .36)}M${f1(px + pw * .73)} ${f1(py + ph * .3)}L${f1(px + pw * .67)} ${f1(py + ph * .36)}" stroke="#FF8C1A" stroke-width="${f1(2.2 * s)}" stroke-linecap="round"/>` +
      `<path d="M${f1(px + pw * .42)} ${f1(py + ph * .6)}Q${f1(px + pw * .5)} ${f1(py + ph * .68)} ${f1(px + pw * .58)} ${f1(py + ph * .6)}" stroke="#B5651D" stroke-width="${f1(1.6 * s)}" fill="none" stroke-linecap="round"/>` +
      `<circle cx="${f1(px + pw * .5)}" cy="${f1(py + 1 * s)}" r="${f1(4.5 * s)}" fill="#FF6B6B"/><circle cx="${f1(px + pw * .5 - 1.3 * s)}" cy="${f1(py - .3 * s)}" r="${f1(1.4 * s)}" fill="#fff" opacity=".7"/></g>`;
    // flower magnet
    const mx = w * .3, my = h * .2, mr = 6 * s;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      inner += `<circle cx="${f1(mx + Math.cos(a) * mr)}" cy="${f1(my + Math.sin(a) * mr)}" r="${f1(mr * .72)}" fill="#FF8FC0"/>`;
    }
    inner += `<circle cx="${f1(mx)}" cy="${f1(my)}" r="${f1(mr * .6)}" fill="#FFD21F"/>`;
    return svgWrap(w, h, inner);
  }

  function wardrobeLeaf(w, h, side, color, back) {
    const s = w / 50;
    if (back) return svgWrap(w, h, `<rect width="${f1(w)}" height="${f1(h)}" rx="${f1(2 * s)}" fill="${U.shade(color, -0.28)}"/><rect x="${f1(4 * s)}" y="${f1(4 * s)}" width="${f1(w - 8 * s)}" height="${f1(h - 8 * s)}" rx="${f1(3 * s)}" fill="${U.shade(color, -0.18)}"/>`);
    const dark = U.shade(color, -0.2), light = U.shade(color, 0.35);
    const m = 5.5 * s;
    let inner = `<rect width="${f1(w)}" height="${f1(h)}" rx="${f1(2 * s)}" fill="${color}"/>` +
      `<rect x="${f1(m)}" y="${f1(m)}" width="${f1(w - 2 * m)}" height="${f1(h * .5 - m * 1.5)}" rx="${f1(5 * s)}" fill="${light}" opacity=".55" stroke="${dark}" stroke-width="${f1(1.4 * s)}"/>` +
      `<rect x="${f1(m)}" y="${f1(h * .5 + m * .5)}" width="${f1(w - 2 * m)}" height="${f1(h * .5 - m * 1.5)}" rx="${f1(5 * s)}" fill="${light}" opacity=".55" stroke="${dark}" stroke-width="${f1(1.4 * s)}"/>`;
    // heart cut-out near the top
    const hx = w / 2, hy = h * .2, hs = 7 * s;
    inner += `<path d="M${f1(hx)} ${f1(hy + hs * .9)}C${f1(hx - hs * 1.4)} ${f1(hy)} ${f1(hx - hs * .8)} ${f1(hy - hs * .9)} ${f1(hx)} ${f1(hy - hs * .25)}C${f1(hx + hs * .8)} ${f1(hy - hs * .9)} ${f1(hx + hs * 1.4)} ${f1(hy)} ${f1(hx)} ${f1(hy + hs * .9)}Z" fill="${U.shade(color, -0.4)}"/>`;
    const kx = side === 'l' ? w - 6 * s : 6 * s;
    inner += `<circle cx="${f1(kx)}" cy="${f1(h * .5)}" r="${f1(3.6 * s)}" fill="#FFD86B" stroke="#C99A2E" stroke-width="${f1(1.2 * s)}"/>`;
    inner += `<rect width="${f1(w)}" height="${f1(h)}" fill="url(#pk-sheen)"/><rect width="${f1(w)}" height="${f1(h)}" fill="url(#pk-side${side === 'l' ? 'L' : 'R'})"/>`;
    return svgWrap(w, h, inner);
  }

  function chestFront(w, h, color) {
    const s = w / 100;
    const dark = U.shade(color, -0.25), light = U.shade(color, 0.4);
    let inner = `<path d="M0 0H${f1(w)}V${f1(h - 12 * s)}Q${f1(w)} ${f1(h)} ${f1(w - 12 * s)} ${f1(h)}H${f1(12 * s)}Q0 ${f1(h)} 0 ${f1(h - 12 * s)}Z" fill="${color}"/>` +
      `<rect x="0" y="${f1(h * .1)}" width="${f1(w)}" height="${f1(h * .1)}" fill="${light}" opacity=".5"/>` +
      `<rect x="0" y="${f1(h * .78)}" width="${f1(w)}" height="${f1(h * .07)}" fill="${dark}" opacity=".35"/>`;
    // stars & dots
    const deco = [[.14, .4, 1], [.86, .42, .8], [.1, .66, .55], [.9, .68, .6]];
    deco.forEach(([x, y, k], i) => {
      const cx = x * w, cy = y * h, R = 6 * s * k, r = R * .45;
      if (i % 2 === 0) {
        let p = '';
        for (let j = 0; j < 10; j++) {
          const a = -Math.PI / 2 + (j * Math.PI) / 5, rr = j % 2 ? r : R;
          p += (j ? 'L' : 'M') + f1(cx + Math.cos(a) * rr) + ' ' + f1(cy + Math.sin(a) * rr);
        }
        inner += `<path d="${p}Z" fill="#FFE45C" stroke="#fff" stroke-width="${f1(.8 * s)}" stroke-linejoin="round"/>`;
      } else {
        inner += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(R * .7)}" fill="#fff" opacity=".85"/>`;
      }
    });
    // name plate (label sits on top of it)
    inner += `<rect x="${f1(w * .24)}" y="${f1(h * .36)}" width="${f1(w * .52)}" height="${f1(h * .34)}" rx="${f1(6 * s)}" fill="#FFF8E8" stroke="${dark}" stroke-width="${f1(1.6 * s)}"/>`;
    inner += `<rect width="${f1(w)}" height="${f1(h)}" fill="url(#pk-sheen)"/>`;
    return svgWrap(w, h, inner);
  }

  function chestLid(w, h, color, back) {
    const s = w / 100;
    const c = back ? U.shade(color, -0.35) : U.shade(color, -0.08);
    let inner = `<path d="M${f1(6 * s)} ${f1(h)}Q0 ${f1(h)} 0 ${f1(h * .62)}Q0 0 ${f1(w * .18)} 0H${f1(w * .82)}Q${f1(w)} 0 ${f1(w)} ${f1(h * .62)}Q${f1(w)} ${f1(h)} ${f1(w - 6 * s)} ${f1(h)}Z" fill="${c}"/>`;
    if (!back) {
      inner += `<path d="M${f1(w * .1)} ${f1(h * .3)}Q${f1(w * .5)} ${f1(-h * .02)} ${f1(w * .9)} ${f1(h * .3)}" stroke="#fff" stroke-width="${f1(3 * s)}" fill="none" opacity=".45" stroke-linecap="round"/>` +
        `<rect x="${f1(w * .44)}" y="${f1(h * .5)}" width="${f1(w * .12)}" height="${f1(h * .62)}" rx="${f1(2 * s)}" fill="#FFD86B" stroke="#C99A2E" stroke-width="${f1(1.2 * s)}"/>` +
        `<circle cx="${f1(w * .5)}" cy="${f1(h * .86)}" r="${f1(1.8 * s)}" fill="#8A6414"/>`;
    }
    return svgWrap(w, h, inner);
  }

  // the lid seen from the front once it has flipped open: its inside stands up behind the box
  function chestOpenLid(w, h, color) {
    const s = w / 100;
    const inset = w * 0.05;
    const inner = U.shade(color, -0.42), rim = U.shade(color, -0.1);
    return svgWrap(w, h,
      `<path d="M0 ${f1(h)}L${f1(inset)} ${f1(h * .12)}Q${f1(inset)} 0 ${f1(inset + 8 * s)} 0H${f1(w - inset - 8 * s)}Q${f1(w - inset)} 0 ${f1(w - inset)} ${f1(h * .12)}L${f1(w)} ${f1(h)}Z" fill="${rim}"/>` +
      `<path d="M${f1(5 * s)} ${f1(h)}L${f1(inset + 4 * s)} ${f1(h * .2)}Q${f1(inset + 4 * s)} ${f1(h * .1)} ${f1(inset + 11 * s)} ${f1(h * .1)}H${f1(w - inset - 11 * s)}Q${f1(w - inset - 4 * s)} ${f1(h * .1)} ${f1(w - inset - 4 * s)} ${f1(h * .2)}L${f1(w - 5 * s)} ${f1(h)}Z" fill="${inner}"/>` +
      `<circle cx="${f1(w * .22)}" cy="${f1(h * .45)}" r="${f1(3 * s)}" fill="#fff" opacity=".35"/><circle cx="${f1(w * .78)}" cy="${f1(h * .55)}" r="${f1(2.4 * s)}" fill="#fff" opacity=".3"/>` +
      `<circle cx="${f1(w * .62)}" cy="${f1(h * .32)}" r="${f1(1.8 * s)}" fill="#fff" opacity=".3"/>`);
  }

  /* cabinets / frames behind the doors */
  function barnFrame(w, h, hole) {
    const t = Math.max(6, w * .07);
    return svgWrap(w, h,
      `<rect x="0" y="0" width="${f1(w)}" height="${f1(h)}" rx="${f1(t * .5)}" fill="#FFF3DE"/>` +
      `<rect x="${f1(hole.x)}" y="${f1(hole.y)}" width="${f1(hole.w)}" height="${f1(hole.h)}" fill="#4A2E1C"/>` +
      `<rect x="0" y="0" width="${f1(w)}" height="${f1(t * .55)}" rx="${f1(t * .3)}" fill="#E9D7B8"/>`);
  }
  function garageFrame(w, h, hole) {
    const s = w / 100;
    return svgWrap(w, h,
      `<rect x="0" y="${f1(hole.y * .5)}" width="${f1(w)}" height="${f1(h - hole.y * .5)}" rx="${f1(4 * s)}" fill="#E2E7F0"/>` +
      `<rect x="${f1(hole.x)}" y="${f1(hole.y)}" width="${f1(hole.w)}" height="${f1(hole.h)}" fill="#3B4253"/>`);
  }
  function garageHeader(w, h, hole) {
    const s = w / 100;
    return svgWrap(w, h,
      `<rect x="${f1(-1 * s)}" y="0" width="${f1(w + 2 * s)}" height="${f1(hole.y)}" rx="${f1(4 * s)}" fill="#5B6B8C"/>` +
      `<rect x="${f1(-1 * s)}" y="${f1(hole.y * .62)}" width="${f1(w + 2 * s)}" height="${f1(hole.y * .38)}" fill="#46547A"/>` +
      `<circle cx="${f1(w * .5)}" cy="${f1(hole.y * .36)}" r="${f1(hole.y * .17)}" fill="#FFE07A"/>` +
      `<rect x="${f1(hole.x - 4 * s)}" y="${f1(hole.y)}" width="${f1(4 * s)}" height="${f1(hole.h)}" fill="#C7CFDD"/>` +
      `<rect x="${f1(hole.x + hole.w)}" y="${f1(hole.y)}" width="${f1(4 * s)}" height="${f1(hole.h)}" fill="#C7CFDD"/>`);
  }
  function fridgeCabinet(w, h, hole, color) {
    const s = w / 100;
    const dark = U.shade(color, -0.18);
    const fz = { x: hole.x, y: h * .035, w: hole.w, h: hole.y - h * .065 };
    return svgWrap(w, h,
      `<rect x="${f1(w * .14)}" y="${f1(h * .95)}" width="${f1(w * .12)}" height="${f1(h * .05)}" rx="${f1(2 * s)}" fill="#8892A6"/>` +
      `<rect x="${f1(w * .74)}" y="${f1(h * .95)}" width="${f1(w * .12)}" height="${f1(h * .05)}" rx="${f1(2 * s)}" fill="#8892A6"/>` +
      `<rect x="0" y="0" width="${f1(w)}" height="${f1(h * .965)}" rx="${f1(12 * s)}" fill="${dark}"/>` +
      `<rect x="${f1(hole.x)}" y="${f1(hole.y)}" width="${f1(hole.w)}" height="${f1(hole.h)}" rx="${f1(8 * s)}" fill="#BFE6FA"/>` +
      // freezer door (stays shut)
      `<rect x="${f1(fz.x)}" y="${f1(fz.y)}" width="${f1(fz.w)}" height="${f1(fz.h)}" rx="${f1(8 * s)}" fill="${color}"/>` +
      `<rect x="${f1(fz.x + 3 * s)}" y="${f1(fz.y + 3 * s)}" width="${f1(fz.w - 6 * s)}" height="${f1(fz.h * .45)}" rx="${f1(6 * s)}" fill="#fff" opacity=".22"/>` +
      `<rect x="${f1(fz.x + fz.w - 15 * s)}" y="${f1(fz.y + fz.h * .45)}" width="${f1(7.5 * s)}" height="${f1(fz.h * .42)}" rx="${f1(3.75 * s)}" fill="${U.shade(color, -0.25)}"/>` +
      `<circle cx="${f1(fz.x + fz.w * .3)}" cy="${f1(fz.y + fz.h * .55)}" r="${f1(5 * s)}" fill="#7BC8FF"/><circle cx="${f1(fz.x + fz.w * .3 - 1.4 * s)}" cy="${f1(fz.y + fz.h * .55 - 1.4 * s)}" r="${f1(1.6 * s)}" fill="#fff" opacity=".8"/>`);
  }
  function fridgeInside(w, h) {
    const s = w / 100;
    let inner = `<rect width="${f1(w)}" height="${f1(h)}" fill="#DDF3FF"/>` +
      `<rect width="${f1(w)}" height="${f1(h * .3)}" fill="#fff" opacity=".45"/>`;
    [0.3, 0.8].forEach((k) => {
      inner += `<rect x="0" y="${f1(h * k)}" width="${f1(w)}" height="${f1(3 * s)}" fill="#fff"/><rect x="0" y="${f1(h * k + 3 * s)}" width="${f1(w)}" height="${f1(2 * s)}" fill="#A9CFE6"/>`;
    });
    return svgWrap(w, h, inner);
  }
  function barnInside(w, h) {
    const s = w / 100;
    let inner = `<rect width="${f1(w)}" height="${f1(h)}" fill="#5A3A24"/>` +
      `<path d="M0 ${f1(h * .25)}H${f1(w)}M0 ${f1(h * .5)}H${f1(w)}" stroke="#4A2F1C" stroke-width="${f1(2 * s)}"/>` +
      `<path d="M0 ${f1(h)}V${f1(h * .86)}Q${f1(w * .12)} ${f1(h * .78)} ${f1(w * .25)} ${f1(h * .85)}Q${f1(w * .38)} ${f1(h * .76)} ${f1(w * .52)} ${f1(h * .84)}Q${f1(w * .66)} ${f1(h * .77)} ${f1(w * .8)} ${f1(h * .85)}Q${f1(w * .9)} ${f1(h * .8)} ${f1(w)} ${f1(h * .84)}V${f1(h)}Z" fill="url(#pk-hay)"/>`;
    for (let i = 0; i < 7; i++) {
      const x = w * (0.08 + i * 0.14);
      inner += `<path d="M${f1(x)} ${f1(h * .9)}l${f1(3 * s)} ${f1(-7 * s)}" stroke="#D49A2A" stroke-width="${f1(1.4 * s)}" stroke-linecap="round"/>`;
    }
    return svgWrap(w, h, inner);
  }
  function garageInside(w, h) {
    const s = w / 100;
    return svgWrap(w, h,
      `<rect width="${f1(w)}" height="${f1(h)}" fill="#4A5266"/>` +
      `<rect y="${f1(h * .78)}" width="${f1(w)}" height="${f1(h * .22)}" fill="#6B7387"/>` +
      `<path d="M${f1(w * .1)} ${f1(h * .2)}H${f1(w * .9)}" stroke="#5D667B" stroke-width="${f1(3 * s)}"/>` +
      `<circle cx="${f1(w * .2)}" cy="${f1(h * .35)}" r="${f1(4 * s)}" fill="#5D667B"/><circle cx="${f1(w * .8)}" cy="${f1(h * .35)}" r="${f1(4 * s)}" fill="#5D667B"/>`);
  }
  function wardrobeCabinet(w, h, hole, color) {
    const s = w / 100;
    const dark = U.shade(color, -0.3);
    return svgWrap(w, h,
      `<rect x="${f1(w * .1)}" y="${f1(h * .94)}" width="${f1(w * .14)}" height="${f1(h * .06)}" rx="${f1(3 * s)}" fill="${U.shade(color, -0.45)}"/>` +
      `<rect x="${f1(w * .76)}" y="${f1(h * .94)}" width="${f1(w * .14)}" height="${f1(h * .06)}" rx="${f1(3 * s)}" fill="${U.shade(color, -0.45)}"/>` +
      `<path d="M0 ${f1(h * .96)}V${f1(hole.y * .9)}Q0 ${f1(hole.y * .45)} ${f1(w * .12)} ${f1(hole.y * .4)}Q${f1(w * .5)} ${f1(-hole.y * .25)} ${f1(w * .88)} ${f1(hole.y * .4)}Q${f1(w)} ${f1(hole.y * .45)} ${f1(w)} ${f1(hole.y * .9)}V${f1(h * .96)}Z" fill="${dark}"/>` +
      `<path d="M${f1(w * .3)} ${f1(hole.y * .55)}Q${f1(w * .5)} ${f1(hole.y * .05)} ${f1(w * .7)} ${f1(hole.y * .55)}" stroke="#fff" stroke-width="${f1(2.6 * s)}" fill="none" opacity=".5" stroke-linecap="round"/>` +
      `<rect x="${f1(hole.x)}" y="${f1(hole.y)}" width="${f1(hole.w)}" height="${f1(hole.h)}" fill="#6E4630"/>`);
  }
  function wardrobeInside(w, h) {
    const s = w / 100;
    const rodY = h * .14;
    return svgWrap(w, h,
      `<rect width="${f1(w)}" height="${f1(h)}" fill="#7A5038"/>` +
      `<path d="M${f1(w * .33)} 0V${f1(h)}M${f1(w * .66)} 0V${f1(h)}" stroke="#6A432D" stroke-width="${f1(1.6 * s)}"/>` +
      `<rect x="0" y="${f1(rodY - 2.4 * s)}" width="${f1(w)}" height="${f1(4.8 * s)}" rx="${f1(2.4 * s)}" fill="#D9DEE8"/>` +
      // hanger
      `<path d="M${f1(w * .5)} ${f1(rodY + 2 * s)}q${f1(-5 * s)} ${f1(-7 * s)} 0 ${f1(-8 * s)}q${f1(5 * s)} ${f1(1 * s)} 0 ${f1(8 * s)}" fill="none" stroke="#C7CCD8" stroke-width="${f1(2.2 * s)}"/>` +
      `<path d="M${f1(w * .5)} ${f1(rodY + 2 * s)}L${f1(w * .2)} ${f1(rodY + 14 * s)}H${f1(w * .8)}Z" fill="none" stroke="#C7CCD8" stroke-width="${f1(2.6 * s)}" stroke-linejoin="round"/>`);
  }

  /* ======================================================================= door types */
  // hole = doorway rect as fractions of the cell; item = center & size (fraction of cell width)
  const TYPES = {
    barn: {
      hole: { x: 0.08, y: 0.08, w: 0.84, h: 0.92 },
      item: { x: 0.5, y: 0.58, s: 0.56 },
      leaves: 2,
      openDeg: 112,
      sounds(ctx) { ctx.sfx('creak', { vel: 0.9 }); ctx.sfx('whoosh', { vel: 0.5, delay: 0.12 }); },
    },
    garage: {
      hole: { x: 0.08, y: 0.17, w: 0.84, h: 0.83 },
      item: { x: 0.5, y: 0.62, s: 0.6 },
      roll: true,
      sounds(ctx) { ctx.sfx('slideup', { vel: 0.5 }); for (let i = 0; i < 5; i++) ctx.drum('shaker', { delay: i * 0.06, vel: 0.35, bus: 'sfx' }); },
    },
    fridge: {
      hole: { x: 0.07, y: 0.3, w: 0.86, h: 0.635 },
      item: { x: 0.5, y: 0.6, s: 0.62 },
      leaves: 1,
      openDeg: 106,
      sounds(ctx) { ctx.sfx('pop', { vel: 0.7 }); ctx.sfx('twinkle', { vel: 0.5, delay: 0.15 }); },
    },
    chest: {
      item: { x: 0.5, y: 0.3, s: 0.52 },
      chest: true,
      sounds(ctx) { ctx.sfx('creak', { vel: 0.6 }); ctx.sfx('boing', { vel: 0.8, delay: 0.12 }); },
    },
    wardrobe: {
      hole: { x: 0.09, y: 0.16, w: 0.82, h: 0.76 },
      item: { x: 0.5, y: 0.57, s: 0.6 },
      leaves: 2,
      openDeg: 108,
      sounds(ctx) { ctx.sfx('creak', { vel: 0.7 }); ctx.sfx('swish', { vel: 0.8, delay: 0.1 }); },
    },
  };

  /* ======================================================================= game */
  PP.registerGame({
    id: 'peekaboo',
    title: 'Peekaboo',
    domain: 'words',
    icon: '🚪',
    tileColor: '#FF8A5B',
    order: 31,
    create(stage, ctx) {
      const probe = ctx.el('div', { style: { position: 'absolute', visibility: 'hidden', pointerEvents: 'none', padding: 'var(--safe-t) var(--safe-r) var(--safe-b) var(--safe-l)' } });
      stage.appendChild(probe);
      const safe = () => {
        const cs = getComputedStyle(probe);
        return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
      };

      let scene = null; // { def, el, cells, decos, sign }
      let sceneIdx = 0;
      let roundInScene = 0;
      let mode = 'busy'; // 'explore' | 'memory' | 'busy'
      let memory = null; // { target, misses, hinted, missReported, done, resolve }
      const recent = {};
      let lastTouchAt = 0;

      ctx.mascot.show({ corner: 'tr', size: 'clamp(64px, 11vmin, 100px)' });

      /* ---------------- words ---------------- */
      function pickWords(def, n, level) {
        const pool = (level <= 2 ? def.easy : def.easy.concat(def.more)).map((id) => PP.data.word(id)).filter(Boolean);
        const rec = recent[def.id] || (recent[def.id] = []);
        let fresh = pool.filter((w) => !rec.includes(w.id));
        if (fresh.length < n) fresh = pool;
        const out = [];
        const emo = new Set();
        ctx.shuffle(fresh).forEach((w) => { if (out.length < n && !emo.has(w.emoji)) { out.push(w); emo.add(w.emoji); } });
        if (out.length < n) ctx.shuffle(pool).forEach((w) => { if (out.length < n && !emo.has(w.emoji)) { out.push(w); emo.add(w.emoji); } });
        out.forEach((w) => { rec.push(w.id); });
        while (rec.length > Math.max(4, pool.length - n)) rec.shift();
        return out;
      }
      const nameOf = (w) => U.cap(PP.data.a(w));
      function lineFor(w) {
        if (w.sound) return PP.data.says(w);
        return EXTRA[w.id] || '';
      }

      /* ---------------- scene building ---------------- */
      function buildScene(def) {
        const el = ctx.el('div', { class: 'pk-scene s-' + def.id });
        const decos = {};
        if (def.id === 'barn' || def.id === 'garage') {
          for (let i = 0; i < 2; i++) {
            const c = ctx.el('div', { class: 'pk-deco pk-cloud' + (i ? ' pk-cloud-sm' : ''), style: { top: (6 + i * 10) + '%', left: '0', animationDuration: (48 + i * 22) + 's', animationDelay: -(i * 20 + 6) + 's' } });
            el.appendChild(c);
          }
        }
        decos.ground = ctx.el('div', { class: 'pk-deco pk-ground' });
        el.appendChild(decos.ground);
        if (def.id === 'barn') {
          decos.rooftrim = ctx.el('div', { class: 'pk-deco pk-rooftrim' });
          decos.roof = ctx.el('div', { class: 'pk-deco pk-roof' });
          decos.wall = ctx.el('div', { class: 'pk-deco pk-wall' });
          el.append(decos.rooftrim, decos.roof, decos.wall);
        } else if (def.id === 'garage') {
          decos.wall = ctx.el('div', { class: 'pk-deco pk-wall' });
          decos.roof = ctx.el('div', { class: 'pk-deco pk-roof' });
          el.append(decos.wall, decos.roof);
        }
        decos.shelves = [];
        const sign = ctx.el('div', { class: 'pk-sign' }, ctx.el('span', { class: 'pp-emoji', text: def.emoji }), ctx.el('span', { text: def.name }));
        el.appendChild(sign);
        ctx.tap(sign, () => {
          sign.classList.remove('pk-swing'); void sign.offsetWidth; sign.classList.add('pk-swing');
          ctx.sfx('tap');
          ctx.say(`The ${def.name.toLowerCase()}!`, { mode: 'skip' });
        });
        return { def, el, decos, sign, cells: [] };
      }

      function makeCell(def, word, i) {
        const T = TYPES[def.door];
        const colors = DOOR_COLORS[def.door];
        const color = colors ? colors[i % colors.length] : null;
        const el = ctx.el('div', { class: 'pk-cell pk-' + def.door });
        const c = { el, def, T, word, color, state: 'closed', layers: {} };
        const L = c.layers;
        const layer = (cls) => { const d = ctx.el('div', { class: 'pk-layer ' + (cls || '') }); el.appendChild(d); return d; };
        el.appendChild(ctx.el('div', { class: 'pk-shadow' }));
        if (T.chest) {
          L.openLid = layer('pk-openlid');
          L.mouth = layer('pk-mouth');
          L.item = ctx.el('div', { class: 'pk-item' }, ctx.el('span', { class: 'pp-emoji', text: word.emoji }));
          el.appendChild(L.item);
          L.front = layer('pk-front');
          L.lid = layer('pk-lid');
          L.label = ctx.el('div', { class: 'pk-label', text: word.word });
          el.appendChild(L.label);
        } else {
          L.frame = layer('pk-frame');
          L.inside = layer('pk-inside');
          L.light = ctx.el('div', { class: 'pk-light' });
          L.inside.appendChild(L.light);
          L.doors = layer('pk-doors' + (T.roll ? ' pk-clip' : ''));
          L.leaves = [];
          if (T.roll) {
            const p = ctx.el('div', { class: 'pk-leaf pk-full' }, ctx.el('div', { class: 'pk-face' }));
            L.doors.appendChild(p);
            L.leaves.push(p);
            L.over = layer('pk-over');
          } else {
            const sides = T.leaves === 2 ? ['l', 'r'] : ['l'];
            sides.forEach((sd) => {
              const lf = ctx.el('div', { class: 'pk-leaf pk-' + sd + (T.leaves === 1 ? ' pk-full' : '') }, ctx.el('div', { class: 'pk-face' }), ctx.el('div', { class: 'pk-face pk-back' }));
              lf.dataset.side = sd;
              if (T.leaves === 1) lf.style.transformOrigin = '0 50%';
              L.doors.appendChild(lf);
              L.leaves.push(lf);
            });
          }
          L.item = ctx.el('div', { class: 'pk-item' }, ctx.el('span', { class: 'pp-emoji', text: word.emoji }));
          el.appendChild(L.item);
          L.label = ctx.el('div', { class: 'pk-label', text: word.word });
          el.appendChild(L.label);
        }
        ctx.tap(el, (e) => onCellTap(c, e));
        return c;
      }

      function setWord(c, w) {
        c.word = w;
        c.layers.item.querySelector('.pp-emoji').textContent = w.emoji;
        c.layers.label.textContent = w.word;
      }

      /* render px-exact art for a cell of size w×h */
      function renderCell(c, w, h) {
        const T = c.T, L = c.layers;
        c.w = w; c.h = h;
        c.el.style.width = w + 'px';
        c.el.style.height = h + 'px';
        c.el.style.setProperty('--cw', w + 'px');
        c.el.style.setProperty('--ch', h + 'px');
        const box = (node, x, y, ww, hh) => { Object.assign(node.style, { left: x + 'px', top: y + 'px', width: ww + 'px', height: hh + 'px' }); };
        const itemSize = Math.min(w * T.item.s, h * 0.52);
        c.itemSize = itemSize;
        L.item.querySelector('.pp-emoji').style.fontSize = itemSize + 'px';
        L.label.style.fontSize = Math.max(15, Math.min(30, w * 0.12)) + 'px';
        if (T.chest) {
          const bodyY = h * 0.52, bodyH = h * 0.46;
          const lidY = h * 0.39, lidH = h * 0.16;
          box(L.mouth, w * 0.06, bodyY - h * 0.02, w * 0.88, h * 0.08);
          L.mouth.innerHTML = svgWrap(w * 0.88, h * 0.08, `<rect width="${f1(w * .88)}" height="${f1(h * .08)}" rx="${f1(h * .03)}" fill="#3A2A4A"/>`);
          box(L.front, w * 0.04, bodyY, w * 0.92, bodyH);
          L.front.innerHTML = chestFront(w * 0.92, bodyH, c.color);
          box(L.lid, 0, lidY, w, lidH);
          L.lid.innerHTML = chestLid(w, lidH, c.color, false);
          const olH = h * 0.27;
          box(L.openLid, w * 0.03, bodyY - olH + h * 0.01, w * 0.94, olH);
          L.openLid.innerHTML = chestOpenLid(w * 0.94, olH, c.color);
          L.openLid.style.zIndex = 1;
          L.mouth.style.zIndex = 2;
          c.itemHidden = { x: w * 0.5, y: bodyY + bodyH * 0.55 };
          c.itemShown = { x: w * 0.5, y: Math.min(h * T.item.y, bodyY - itemSize * 0.42) };
          L.label.style.top = (bodyY + bodyH * 0.53 - parseFloat(L.label.style.fontSize) * 0.72) + 'px';
          L.lid.style.zIndex = 6;
          L.front.style.zIndex = 5;
          L.item.style.zIndex = 4;
          L.label.style.zIndex = 7;
        } else {
          const H = { x: w * T.hole.x, y: h * T.hole.y, w: w * T.hole.w, h: h * T.hole.h };
          box(L.frame, 0, 0, w, h);
          box(L.inside, H.x, H.y, H.w, H.h);
          box(L.doors, H.x, H.y, H.w, H.h);
          let insideArt = '';
          if (c.def.door === 'barn') { L.frame.innerHTML = barnFrame(w, h, H); insideArt = barnInside(H.w, H.h); }
          if (c.def.door === 'garage') { L.frame.innerHTML = garageFrame(w, h, H); insideArt = garageInside(H.w, H.h); }
          if (c.def.door === 'fridge') { L.frame.innerHTML = fridgeCabinet(w, h, H, c.color); insideArt = fridgeInside(H.w, H.h); }
          if (c.def.door === 'wardrobe') { L.frame.innerHTML = wardrobeCabinet(w, h, H, c.color); insideArt = wardrobeInside(H.w, H.h); }
          L.inside.innerHTML = insideArt;
          L.inside.appendChild(L.light);
          if (c.def.door === 'fridge') { L.inside.style.borderRadius = (w * 0.08) + 'px'; L.doors.style.borderRadius = (w * 0.08) + 'px'; }
          if (L.over) { box(L.over, 0, 0, w, h); L.over.innerHTML = garageHeader(w, h, H); L.over.style.zIndex = 3; }
          L.leaves.forEach((lf) => {
            const lw = T.leaves === 2 ? H.w / 2 : H.w;
            const faces = lf.querySelectorAll('.pk-face');
            if (c.def.door === 'barn') { faces[0].innerHTML = barnLeaf(lw, H.h, lf.dataset.side, false); faces[1].innerHTML = barnLeaf(lw, H.h, lf.dataset.side, true); }
            if (c.def.door === 'wardrobe') { faces[0].innerHTML = wardrobeLeaf(lw, H.h, lf.dataset.side, c.color, false); faces[1].innerHTML = wardrobeLeaf(lw, H.h, lf.dataset.side, c.color, true); }
            if (c.def.door === 'fridge') { faces[0].innerHTML = fridgeDoor(lw, H.h, c.color, false); faces[1].innerHTML = fridgeDoor(lw, H.h, c.color, true); }
            if (c.def.door === 'garage') faces[0].innerHTML = garagePanel(lw, H.h, c.color);
          });
          c.itemShown = { x: w * T.item.x, y: h * T.item.y };
          c.itemHidden = c.itemShown;
          const fs = parseFloat(L.label.style.fontSize);
          L.label.style.top = Math.min(H.y + H.h - fs * 1.55, c.itemShown.y + itemSize * 0.5) + 'px';
        }
        const p = c.state === 'open' ? c.itemShown : c.itemHidden;
        L.item.style.left = p.x + 'px';
        L.item.style.top = p.y + 'px';
      }

      /* ---------------- layout ---------------- */
      function layout() {
        if (!scene) return;
        const W = stage.clientWidth, H = stage.clientHeight;
        if (!W || !H) return;
        const sf = safe();
        const small = Math.min(W, H) < 520;
        const def = scene.def;
        const n = scene.cells.length;
        if (!n) return;
        const padX = (small ? 14 : 34);
        const top = sf.t + (small ? 84 : 112);
        const bottom = sf.b + (small ? 18 : 40);
        const areaX = sf.l + padX, areaW = W - sf.l - sf.r - padX * 2;
        const areaY = top, areaH = H - top - bottom;
        const gapX = Math.max(12, Math.min(34, Math.min(W, H) * 0.035));
        const gapY = gapX * (def.door === 'chest' ? 0.6 : 1.1);
        const a = def.aspect;
        let best = null;
        for (let cols = 1; cols <= n; cols++) {
          const rows = Math.ceil(n / cols);
          const byW = (areaW - (cols - 1) * gapX) / cols / a;
          const byH = (areaH - (rows - 1) * gapY) / rows;
          const ch = Math.min(byW, byH);
          // prefer balanced rows: penalise an almost-empty last row
          const last = n - (rows - 1) * cols;
          const score = ch * (last < cols / 2 && rows > 1 ? 0.97 : 1);
          if (!best || score > best.score) best = { cols, rows, ch, score };
        }
        const maxH = small ? 330 : 470;
        const ch = Math.floor(Math.min(best.ch, maxH));
        const cw = Math.floor(ch * a);
        const rows = best.rows, cols = best.cols;
        const gridH = rows * ch + (rows - 1) * gapY;
        const y0 = areaY + Math.max(0, (areaH - gridH) / 2) * (def.door === 'chest' ? 0.9 : 0.75);
        let idx = 0;
        const rowBoxes = [];
        for (let r = 0; r < rows; r++) {
          const inRow = Math.min(cols, n - idx);
          const rowW = inRow * cw + (inRow - 1) * gapX;
          const x0 = areaX + (areaW - rowW) / 2;
          const y = y0 + r * (ch + gapY);
          rowBoxes.push({ x: x0, y, w: rowW, h: ch });
          for (let k = 0; k < inRow; k++, idx++) {
            const c = scene.cells[idx];
            renderCell(c, cw, ch);
            c.el.style.left = (x0 + k * (cw + gapX)) + 'px';
            c.el.style.top = y + 'px';
          }
        }
        // grid bounding box
        const gx = Math.min(...rowBoxes.map((b) => b.x));
        const gw = Math.max(...rowBoxes.map((b) => b.x + b.w)) - gx;
        const gy = rowBoxes[0].y, gh = gridH;
        decorate(scene, { x: gx, y: gy, w: gw, h: gh, cw, ch, rows: rowBoxes, W, H, sf, small });
      }

      function place(node, x, y, w, h) {
        Object.assign(node.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
      }

      function decorate(sc, g) {
        const d = sc.decos;
        const def = sc.def;
        const groundY = g.y + g.h - (def.door === 'barn' || def.door === 'garage' ? 2 : g.ch * 0.035);
        if (def.door === 'barn') {
          const pad = Math.max(12, g.cw * 0.1);
          const wx = g.x - pad, wy = g.y - pad, ww = g.w + pad * 2, wh = groundY - wy + 2;
          place(d.wall, wx, wy, ww, wh);
          const roofH = Math.max(0, Math.min(ww * 0.22, wy - g.sf.t - 4));
          const over = Math.max(8, pad * 0.6);
          place(d.roof, wx - over, wy - roofH, ww + over * 2, roofH + 6);
          place(d.rooftrim, wx - over - 7, wy - roofH - 8, ww + over * 2 + 14, roofH + 14);
          d.roof.style.display = d.rooftrim.style.display = roofH > 24 ? '' : 'none';
        } else if (def.door === 'garage') {
          const pad = Math.max(12, g.cw * 0.08);
          const wx = g.x - pad, wy = g.y - pad, ww = g.w + pad * 2, wh = groundY - wy + 2;
          place(d.wall, wx, wy, ww, wh);
          const rh = Math.max(10, Math.min(pad * 1.6, wy - g.sf.t - 6));
          place(d.roof, wx - 10, wy - rh + 4, ww + 20, rh);
        }
        place(d.ground, 0, groundY, g.W, Math.max(0, g.H - groundY));
        // shelves under upper rows (room scenes)
        d.shelves.forEach((s) => s.remove());
        d.shelves = [];
        if (def.door === 'fridge' || def.door === 'chest' || def.door === 'wardrobe') {
          g.rows.slice(0, -1).forEach((rb) => {
            const s = ctx.el('div', { class: 'pk-deco pk-shelf' });
            const ext = Math.max(10, g.cw * 0.12);
            place(s, rb.x - ext, rb.y + rb.h - 4, rb.w + ext * 2, Math.max(10, g.ch * 0.045));
            sc.el.insertBefore(s, sc.cells[0] ? sc.cells[0].el : null);
            d.shelves.push(s);
          });
        }
      }

      ctx.onResize(layout);

      /* ---------------- door animations ---------------- */
      const EASE_OUT = 'cubic-bezier(.2,.9,.3,1.12)';
      function animate(node, frames, opts) {
        const end = frames[frames.length - 1];
        for (const k in end) if (k !== 'offset' && k !== 'easing') node.style[k] = end[k];
        try { return node.animate(frames, Object.assign({ fill: 'backwards' }, opts)); } catch (e) { return null; }
      }

      function leafTransform(c, lf, amt) {
        // amt 0..1 of full opening
        const T = c.T;
        if (T.roll) return `translateY(${(-100 * amt).toFixed(1)}%)`;
        if (T.chest) return `rotateX(${(105 * amt).toFixed(1)}deg)`;
        const sign = lf.dataset.side === 'r' ? 1 : -1;
        return `rotateY(${(sign * T.openDeg * amt).toFixed(1)}deg)`;
      }
      function leavesOf(c) { return c.layers.leaves; }

      function crack(c) {
        if (c.T.chest) {
          const lid = c.layers.lid;
          lid.style.transformOrigin = '50% 100%';
          animate(lid, [{ transform: 'none' }, { transform: 'translateY(-26%) rotate(-5deg)', offset: 0.5 }, { transform: 'translateY(-12%) rotate(3deg)' }], { duration: 200, easing: 'ease-out' });
          return;
        }
        leavesOf(c).forEach((lf) => {
          animate(lf, [{ transform: leafTransform(c, lf, 0) }, { transform: leafTransform(c, lf, c.T.roll ? 0.16 : 0.2) }], { duration: 170, easing: 'ease-out' });
        });
      }
      function swingOpen(c) {
        if (c.T.chest) {
          const L = c.layers;
          L.openLid.style.transformOrigin = '50% 100%';
          animate(L.lid, [{ transform: 'translateY(-12%) rotate(3deg)' }, { transform: 'translateY(-40%) scaleY(0)' }], { duration: 130, easing: 'ease-in' });
          animate(L.openLid, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1.14)', offset: 0.6 }, { transform: 'scaleY(.96)', offset: 0.82 }, { transform: 'scaleY(1)' }], { duration: 380, delay: 110, easing: 'ease-out' });
          return;
        }
        leavesOf(c).forEach((lf, i) => {
          animate(lf, [{ transform: leafTransform(c, lf, c.T.roll ? 0.16 : 0.2) }, { transform: leafTransform(c, lf, 1) }], { duration: c.T.roll ? 420 : 520, easing: c.T.roll ? 'cubic-bezier(.3,.7,.3,1)' : EASE_OUT, delay: i * 40 });
        });
      }
      function swingClosed(c, delay) {
        if (c.T.chest) {
          const L = c.layers;
          animate(L.openLid, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duration: 160, easing: 'ease-in', delay: delay || 0 });
          animate(L.lid, [{ transform: 'translateY(-40%) scaleY(0)' }, { transform: 'translateY(4%) scaleY(1.08)', offset: 0.7 }, { transform: 'none' }], { duration: 300, easing: 'ease-out', delay: (delay || 0) + 140 });
          return;
        }
        leavesOf(c).forEach((lf) => {
          animate(lf, [{ transform: leafTransform(c, lf, 1) }, { transform: leafTransform(c, lf, 0) }], { duration: 420, easing: 'cubic-bezier(.5,0,.6,1)', delay: delay || 0 });
        });
      }

      function popItem(c) {
        const it = c.layers.item;
        const from = c.itemHidden, to = c.itemShown;
        it.style.left = to.x + 'px';
        it.style.top = to.y + 'px';
        const dy = from.y - to.y;
        if (c.T.chest) {
          animate(it, [
            { transform: `translate(-50%, calc(-50% + ${dy}px)) scale(.9)` },
            { transform: 'translate(-50%, -62%) scale(1.12, .92)', offset: 0.45 },
            { transform: 'translate(-50%, -44%) scale(.94, 1.06)', offset: 0.65 },
            { transform: 'translate(-50%, -53%) scale(1.03, .98)', offset: 0.82 },
            { transform: 'translate(-50%, -50%) scale(1)' },
          ], { duration: 760, easing: 'ease-out' });
        } else {
          animate(it, [
            { transform: 'translate(-50%, -30%) scale(.15)' },
            { transform: 'translate(-50%, -62%) scale(1.22)', offset: 0.42 },
            { transform: 'translate(-50%, -46%) scale(.92)', offset: 0.68 },
            { transform: 'translate(-50%, -50%) scale(1)' },
          ], { duration: 640, easing: 'ease-out' });
        }
      }
      function hideItem(c) {
        const it = c.layers.item;
        const to = c.itemHidden;
        animate(it, [{ transform: 'translate(-50%, -50%) scale(1)' }, { transform: 'translate(-50%, -50%) scale(0)' }], { duration: 220, easing: 'ease-in' });
        ctx.setTimeout(() => { it.style.left = to.x + 'px'; it.style.top = to.y + 'px'; }, 230);
      }
      function bounceItem(c) {
        animate(c.layers.item, [
          { transform: 'translate(-50%, -50%) scale(1)' },
          { transform: 'translate(-50%, -64%) scale(1.18, .88)', offset: 0.3 },
          { transform: 'translate(-50%, -46%) scale(.92, 1.08)', offset: 0.6 },
          { transform: 'translate(-50%, -50%) scale(1)' },
        ], { duration: 520, easing: 'ease-out' });
      }
      function rattle(c, strong) {
        const target = c.T.chest ? (c.state === 'closed' ? c.layers.lid : c.layers.front) : c.layers.doors;
        const a = strong ? 4 : 2.5;
        try {
          target.animate([
            { transform: 'translateX(0) rotate(0)' },
            { transform: `translateX(-${a}px) rotate(-${a * 0.4}deg)` },
            { transform: `translateX(${a}px) rotate(${a * 0.4}deg)` },
            { transform: `translateX(-${a * 0.7}px) rotate(-${a * 0.25}deg)` },
            { transform: `translateX(${a * 0.5}px) rotate(${a * 0.2}deg)` },
            { transform: 'translateX(0) rotate(0)' },
          ], { duration: 420, easing: 'ease-out' });
        } catch (e) {}
      }
      function knock(delay) {
        ctx.drum('woodblock', { bus: 'sfx', vel: 0.75, delay: delay || 0 });
        ctx.drum('woodblock', { bus: 'sfx', vel: 0.6, delay: (delay || 0) + 0.14, pitch: 0 });
      }

      /** Open a closed door. Resolves when the item is out. */
      async function openCell(c, opts) {
        opts = opts || {};
        if (c.state !== 'closed') return false;
        c.state = 'opening';
        c.el.classList.add('pk-busy', 'pk-opening');
        // instant feedback: a knock + the doors shiver
        ctx.drum('woodblock', { bus: 'sfx', vel: 0.8 });
        rattle(c, true);
        crack(c);
        await ctx.wait(opts.fast ? 120 : 230);
        c.T.sounds(ctx);
        swingOpen(c);
        await ctx.wait(c.T.chest ? 140 : 200);
        ctx.sfx('boing', { vel: 0.7 });
        popItem(c);
        const p = U.center(c.layers.item);
        PP.fx.burst(p.x, p.y, { emoji: ['✨', '⭐', '💫'], count: 6, size: 30, distance: Math.max(70, c.w * 0.55) });
        c.state = 'open';
        c.el.classList.remove('pk-opening');
        c.el.classList.add('pk-open');
        ctx.setTimeout(() => c.el.classList.remove('pk-busy'), 600);
        return true;
      }

      async function closeCell(c, delay) {
        if (c.state !== 'open') return;
        c.state = 'closing';
        if (delay) await ctx.wait(delay);
        c.el.classList.remove('pk-open');
        hideItem(c);
        await ctx.wait(160);
        swingClosed(c);
        await ctx.wait(400);
        ctx.drum('tom', { bus: 'sfx', vel: 0.35, pitch: 140 });
        ctx.drum('woodblock', { bus: 'sfx', vel: 0.3 });
        c.state = 'closed';
      }

      function revealLine(w) {
        const extra = lineFor(w);
        return `Peekaboo! ${nameOf(w)}!` + (extra ? ' ' + extra : '');
      }

      /* ---------------- taps ---------------- */
      async function onCellTap(c) {
        lastTouchAt = performance.now();
        if (mode === 'memory') return memoryTap(c);
        if (c.state === 'open') {
          bounceItem(c);
          ctx.sfx('boing', { vel: 0.45 });
          const extra = lineFor(c.word);
          ctx.say(`${nameOf(c.word)}!` + (extra ? ' ' + extra : ''));
          ctx.mascot.mood('happy');
          return;
        }
        if (c.state !== 'closed' || mode !== 'explore') {
          // doors busy (closing / between rounds): still answer the touch
          rattle(c, false);
          ctx.sfx('tap', { vel: 0.5 });
          return;
        }
        const opened = await openCell(c);
        if (!opened) return;
        ctx.mascot.mood('surprise');
        const left = scene.cells.filter((x) => x.state !== 'open').length;
        const p = ctx.say(revealLine(c.word));
        if (!left && mode === 'explore') {
          mode = 'busy';
          await p;
          await ctx.wait(250);
          roundDone && roundDone();
        }
      }

      ctx.tap(stage, (e, pt) => {
        if (e.target.closest && e.target.closest('.pk-cell, .pk-sign, .pp-game-pip, .pp-home-btn')) return;
        ctx.sfx('bubble', { vel: 0.35 });
        PP.fx.burst(pt.x, pt.y, { emoji: ['✨', scene ? scene.def.emoji : '⭐'], count: 4, size: 26, distance: 50 });
      }, { preventDefault: false });

      /* ---------------- memory question (level 3+) ---------------- */
      function memoryTap(c) {
        const m = memory;
        if (!m || m.done) { ctx.sfx('tap', { vel: 0.4 }); return; }
        if (c.state === 'open') { bounceItem(c); ctx.say(`${nameOf(c.word)}! Where's the ${m.target.word.word}?`); return; }
        if (c.state !== 'closed') { rattle(c, false); return; }
        if (c === m.target) {
          m.done = true;
          m.stopIdle();
          if (m.unglow) m.unglow();
          (async () => {
            await openCell(c, { fast: true });
            const p = U.center(c.el);
            ctx.success(m.misses === 0);
            await ctx.celebrate({ x: p.x, y: p.y, say: `Peekaboo! There's the ${c.word.word}! ${ctx.praise()}` });
            m.resolve();
          })();
        } else {
          m.misses++;
          ctx.sfx('oops', { vel: 0.5 });
          ctx.mascot.mood('think');
          (async () => {
            await openCell(c, { fast: true });
            ctx.say(`${nameOf(c.word)}! Where's the ${m.target.word.word}?`);
            if (m.misses >= 2) {
              if (!m.missReported) { m.missReported = true; ctx.miss(); }
              if (!m.unglow) m.unglow = PP.fx.glow(m.target.el);
            }
            await ctx.wait(1500);
            if (!m.done) closeCell(c);
            else if (c.state === 'open') { /* stays open with the rest */ }
          })();
        }
      }

      async function memoryRound() {
        const target = ctx.pick(scene.cells);
        const w = target.word;
        mode = 'busy';
        await settle();
        await ctx.say('Now they hide!');
        await Promise.all(scene.cells.map((c, i) => closeCell(c, i * 90)));
        await settle();
        ctx.sfx('whoosh', { vel: 0.4 });
        await ctx.wait(300);
        const prompt = `Where's the ${w.word}?`;
        ctx.setPrompt(prompt);
        await new Promise((resolve) => {
          memory = { target, misses: 0, done: false, resolve, missReported: false, unglow: null, stopIdle: () => {} };
          const m = memory;
          mode = 'memory';
          ctx.say(prompt);
          let idles = 0;
          m.stopIdle = ctx.idle(7000, () => {
            if (m.done) return;
            idles++;
            rattle(target, true);
            knock();
            if (w.sound && idles === 1) ctx.say(`${U.cap(w.sound)}! ${prompt}`);
            else ctx.say(prompt);
            if (idles >= 2 && !m.unglow) m.unglow = PP.fx.glow(target.el);
          });
        });
        memory = null;
        mode = 'busy';
        await ctx.wait(300);
      }

      /** wait until no door is mid-animation (max ~2 s) */
      async function settle() {
        for (let i = 0; i < 20; i++) {
          if (!scene.cells.some((c) => c.state === 'opening' || c.state === 'closing')) return;
          await ctx.wait(100);
        }
      }

      /* ---------------- rounds ---------------- */
      let roundDone = null;

      async function playRound(first) {
        const level = ctx.level;
        const n = [2, 2, 3, 4, 5, 6][level];
        const def = scene.def;
        const words = pickWords(def, n, level);
        const needRebuild = scene.cells.length !== n;
        if (needRebuild) {
          scene.cells.forEach((c) => c.el.remove());
          scene.cells = words.map((w, i) => makeCell(def, w, i));
          scene.cells.forEach((c, i) => {
            c.el.classList.add('pk-pop');
            c.el.style.animationDelay = i * 80 + 'ms';
            scene.el.appendChild(c.el);
            ctx.setTimeout(() => c.el.classList.remove('pk-pop'), 700 + i * 80);
          });
          scene.sign.parentNode.appendChild(scene.sign);
          layout();
          ctx.sfx('pop', { vel: 0.4 });
        } else {
          scene.cells.forEach((c, i) => setWord(c, words[i]));
        }

        const prompt = 'Who is hiding? Open a door!';
        ctx.setPrompt(prompt);
        const allOpen = new Promise((r) => { roundDone = r; });
        mode = 'explore'; // doors work right away, even while Pip is still talking
        ctx.say(first ? ctx.pick(def.intro) : ctx.pick(['Who else is hiding?', 'Knock knock! Who is there?', 'More doors! Who is hiding?']));
        // idle: a closed door rattles and the hidden friend makes its sound
        const stopIdle = ctx.idle(6500, () => {
          if (mode !== 'explore') return;
          const closed = scene.cells.filter((c) => c.state === 'closed');
          if (!closed.length) return;
          const c = ctx.pick(closed);
          rattle(c, true);
          knock();
          if (c.word.sound && Math.random() < 0.7) ctx.say(`${U.cap(c.word.sound)}! Who is that?`);
          else ctx.say(ctx.pick(['Knock knock! Who is there?', 'Who is hiding? Tap a door!', 'Peekaboo! Open a door!']));
        });
        // gentle "come and find me" shiver of one closed door now and then
        const shiver = ctx.setInterval(() => {
          if (mode !== 'explore' || performance.now() - lastTouchAt < 2500) return;
          const closed = scene.cells.filter((c) => c.state === 'closed');
          if (closed.length) rattle(ctx.pick(closed), false);
        }, 3200);

        await allOpen;
        roundDone = null;
        stopIdle();
        ctx.clearInterval(shiver);
        mode = 'busy';
        // Opening doors can't be failed: it may grow the game up to level 3 (more doors), but past that only
        // the memory question ("Where's the cow?") moves the level, so it can also come back down.
        ctx.success(level < 3 ? true : null);
        await ctx.celebrate({ say: ctx.pick(['You found everyone!', 'Peekaboo! You found them all!', 'Hooray! Everybody came out!']) });

        if (level >= 3) await memoryRound();
        else await ctx.wait(400);

        mode = 'busy';
        await settle();
        ctx.say(ctx.pick(['Bye bye!', 'Close the doors!', 'Peekaboo! Bye bye!']));
        await Promise.all(scene.cells.map((c, i) => closeCell(c, i * 110)));
        await settle();
        await ctx.wait(350);
      }

      async function enterScene(def, first) {
        if (scene) {
          ctx.sfx('whoosh');
          scene.el.classList.add('pk-out');
          await ctx.wait(380);
          scene.el.remove();
        }
        scene = buildScene(def);
        scene.el.classList.add('pk-in');
        stage.insertBefore(scene.el, probe);
        layout();
        ctx.sfx('sparkle', { vel: 0.5 });
        scene.sign.classList.add('pk-swing');
        return first;
      }

      (async () => {
        let first = true;
        while (ctx.alive) {
          const def = SCENES[sceneIdx % SCENES.length];
          await enterScene(def, first);
          roundInScene = 0;
          for (let r = 0; r < 2 && ctx.alive; r++) {
            await playRound(r === 0);
            roundInScene++;
          }
          first = false;
          sceneIdx++;
        }
      })();

      return {
        destroy() { scene = null; },
      };
    },
  });
})();
