/* Pip's Playroom — shared learning content.
 *   PP.data.COLORS, PP.data.colorById(id), PP.data.colorsForLevel(level)
 *   PP.data.NUMBERS (1..20 words)
 *   PP.data.SHAPES, PP.data.shapeSVG(id, fill, opts)
 *   PP.data.WORDS, PP.data.CATEGORIES, PP.data.wordsIn(cat), PP.data.word(id), PP.data.a(word)
 *   PP.data.STICKERS
 *   PP.data.PRAISE, PP.data.praise(name?)
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;
  const D = (PP.data = {});

  /* ---------------- COLORS ----------------
   * Ordered by the sequence toddlers typically learn them. */
  D.COLORS = [
    { id: 'red', name: 'red', hex: '#EF3B36', dark: '#B5221F', light: '#FF8A85' },
    { id: 'blue', name: 'blue', hex: '#2F7BEA', dark: '#1B54AB', light: '#86B6FF' },
    { id: 'yellow', name: 'yellow', hex: '#FFD21F', dark: '#D9A800', light: '#FFE985' },
    { id: 'green', name: 'green', hex: '#3DBE4B', dark: '#23873A', light: '#8FE39A' },
    { id: 'orange', name: 'orange', hex: '#FF8C1A', dark: '#D3660A', light: '#FFBE7D' },
    { id: 'purple', name: 'purple', hex: '#8E4FD6', dark: '#62309F', light: '#C9A6F2' },
    { id: 'pink', name: 'pink', hex: '#FF6FB5', dark: '#D6408A', light: '#FFB3D8' },
    { id: 'brown', name: 'brown', hex: '#8B5A2B', dark: '#5E3A18', light: '#C49467' },
    { id: 'black', name: 'black', hex: '#2A2A33', dark: '#000000', light: '#6B6B78' },
    { id: 'white', name: 'white', hex: '#FFFFFF', dark: '#C9CED6', light: '#FFFFFF' },
    { id: 'gray', name: 'gray', hex: '#9AA0A6', dark: '#6B7178', light: '#CDD1D5' },
  ];
  D.colorById = (id) => D.COLORS.find((c) => c.id === id);
  /** level 1: 3 colors, 2: 4, 3: 6, 4: 8, 5: 10 */
  D.colorsForLevel = (level) => D.COLORS.slice(0, [3, 3, 4, 6, 8, 10][U.clamp(level | 0, 1, 5)]);
  /** Bright "rainbow" set that looks good together (no black/white/gray/brown) */
  D.RAINBOW = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'].map((id) => D.colorById(id));

  /* ---------------- NUMBERS ---------------- */
  D.NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  /** Max number to work with for an adaptive level 1..5 */
  D.numberMaxForLevel = (level) => [3, 3, 5, 6, 8, 10][U.clamp(level | 0, 1, 5)];
  /** Dice-style dot positions (0..1 coords) for 1..10, useful for subitizing visuals */
  D.DOTS = {
    1: [[0.5, 0.5]],
    2: [[0.3, 0.3], [0.7, 0.7]],
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    4: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]],
    5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
    6: [[0.3, 0.22], [0.7, 0.22], [0.3, 0.5], [0.7, 0.5], [0.3, 0.78], [0.7, 0.78]],
    7: [[0.3, 0.22], [0.7, 0.22], [0.3, 0.5], [0.5, 0.5], [0.7, 0.5], [0.3, 0.78], [0.7, 0.78]],
    8: [[0.3, 0.18], [0.7, 0.18], [0.3, 0.39], [0.7, 0.39], [0.3, 0.61], [0.7, 0.61], [0.3, 0.82], [0.7, 0.82]],
    9: [[0.22, 0.22], [0.5, 0.22], [0.78, 0.22], [0.22, 0.5], [0.5, 0.5], [0.78, 0.5], [0.22, 0.78], [0.5, 0.78], [0.78, 0.78]],
    10: [[0.22, 0.2], [0.5, 0.2], [0.78, 0.2], [0.36, 0.4], [0.64, 0.4], [0.22, 0.6], [0.5, 0.6], [0.78, 0.6], [0.36, 0.8], [0.64, 0.8]],
  };

  /* ---------------- SHAPES ---------------- */
  function starPoints(cx, cy, R, r, n) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / n;
      const rad = i % 2 === 0 ? R : r;
      pts.push((cx + rad * Math.cos(a)).toFixed(1) + ',' + (cy + rad * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  }
  // All shapes drawn in a 100×100 box.
  D.SHAPES = [
    { id: 'circle', name: 'circle', markup: '<circle cx="50" cy="50" r="44"/>' },
    { id: 'square', name: 'square', markup: '<rect x="9" y="9" width="82" height="82" rx="7"/>' },
    { id: 'triangle', name: 'triangle', markup: '<polygon points="50,7 95,90 5,90" stroke-linejoin="round"/>' },
    { id: 'star', name: 'star', markup: `<polygon points="${starPoints(50, 53, 47, 20, 5)}" stroke-linejoin="round"/>` },
    { id: 'heart', name: 'heart', markup: '<path d="M50 90 C 22 70, 4 52, 8 31 C 12 12, 38 6, 50 26 C 62 6, 88 12, 92 31 C 96 52, 78 70, 50 90 Z"/>' },
    { id: 'rectangle', name: 'rectangle', markup: '<rect x="4" y="24" width="92" height="52" rx="6"/>' },
    { id: 'oval', name: 'oval', markup: '<ellipse cx="50" cy="50" rx="46" ry="31"/>' },
    { id: 'diamond', name: 'diamond', markup: '<polygon points="50,4 93,50 50,96 7,50" stroke-linejoin="round"/>' },
  ];
  D.shapeById = (id) => D.SHAPES.find((s) => s.id === id);
  /** level 1: circle/square/triangle, 2: +star, 3: +heart, 4: +rectangle/oval, 5: all */
  D.shapesForLevel = (level) => D.SHAPES.slice(0, [3, 3, 4, 5, 7, 8][U.clamp(level | 0, 1, 5)]);
  /**
   * Returns an <svg> element for a shape.
   *   opts: { size (css length, default '100%'), stroke (color), strokeWidth (default 4), shine (bool, default true), cls }
   */
  D.shapeSVG = function (id, fill, opts) {
    opts = opts || {};
    const s = D.shapeById(id) || D.SHAPES[0];
    const stroke = opts.stroke || U.shade(fill, -0.3);
    const sw = opts.strokeWidth == null ? 4 : opts.strokeWidth;
    const svg = U.html(
      `<svg viewBox="-4 -4 108 108" class="${opts.cls || ''}" width="${opts.size || '100%'}" height="${opts.size || '100%'}" aria-hidden="true">` +
        `<g fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round">${s.markup}</g>` +
        (opts.shine === false ? '' : `<g fill="#fff" opacity=".28" transform="translate(-6 -8) scale(0.94)" style="pointer-events:none">${s.id === 'circle' || s.id === 'oval' ? '<ellipse cx="38" cy="34" rx="16" ry="10"/>' : '<ellipse cx="36" cy="34" rx="12" ry="7"/>'}</g>`) +
        `</svg>`
    );
    return svg;
  };

  /* ---------------- WORDS ----------------
   * {id, word, emoji, cat, sound?, says?}
   *   sound: what the thing "says" (spoken), e.g. 'moo'
   * All emoji are Unicode ≤ 13 so they render on iPadOS/iOS 14+. */
  D.CATEGORIES = [
    { id: 'animals', name: 'animals', emoji: '🐮', place: 'farm' },
    { id: 'vehicles', name: 'things that go', emoji: '🚗', place: 'garage' },
    { id: 'food', name: 'food', emoji: '🍎', place: 'kitchen' },
    { id: 'body', name: 'body parts', emoji: '👃', place: 'me' },
    { id: 'clothes', name: 'clothes', emoji: '👕', place: 'closet' },
    { id: 'home', name: 'things at home', emoji: '🧸', place: 'house' },
    { id: 'nature', name: 'outside', emoji: '🌳', place: 'outside' },
  ];
  const W = (cat, list) => list.map(([id, emoji, extra]) => Object.assign({ id, word: id.replace(/_/g, ' '), emoji, cat }, extra || {}));
  D.WORDS = [].concat(
    W('animals', [
      ['dog', '🐶', { sound: 'woof woof' }],
      ['cat', '🐱', { sound: 'meow' }],
      ['cow', '🐮', { sound: 'moo' }],
      ['pig', '🐷', { sound: 'oink oink' }],
      ['duck', '🦆', { sound: 'quack quack' }],
      ['sheep', '🐑', { sound: 'baa baa' }],
      ['horse', '🐴', { sound: 'neigh' }],
      ['chicken', '🐔', { sound: 'cluck cluck' }],
      ['frog', '🐸', { sound: 'ribbit' }],
      ['lion', '🦁', { sound: 'roar' }],
      ['monkey', '🐵', { sound: 'ooh ooh, ah ah' }],
      ['owl', '🦉', { sound: 'hoo hoo' }],
      ['bee', '🐝', { sound: 'buzz' }],
      ['mouse', '🐭', { sound: 'squeak squeak' }],
      ['bird', '🐦', { sound: 'tweet tweet' }],
      ['elephant', '🐘', { sound: 'toot toot' }],
      ['snake', '🐍', { sound: 'hiss' }],
      ['bear', '🐻', { sound: 'grr' }],
      ['fish', '🐟', { sound: 'blub blub' }],
      ['bunny', '🐰', { sound: 'hop hop' }],
      ['turtle', '🐢'],
      ['giraffe', '🦒'],
      ['penguin', '🐧'],
      ['rooster', '🐓', { sound: 'cock-a-doodle-doo' }],
      ['goat', '🐐', { sound: 'maa' }],
      ['tiger', '🐯', { sound: 'roar' }],
      ['whale', '🐳', { sound: 'splash' }],
      ['dinosaur', '🦖', { sound: 'roar' }],
      ['butterfly', '🦋'],
      ['ladybug', '🐞'],
      ['octopus', '🐙'],
      ['crab', '🦀'],
      ['zebra', '🦓'],
      ['panda', '🐼'],
      ['fox', '🦊'],
      ['wolf', '🐺', { sound: 'awooo' }],
    ]),
    W('vehicles', [
      ['car', '🚗', { sound: 'beep beep' }],
      ['bus', '🚌', { sound: 'honk honk' }],
      ['truck', '🚚', { sound: 'honk' }],
      ['fire_truck', '🚒', { sound: 'wee-oo, wee-oo' }],
      ['police_car', '🚓', { sound: 'woo woo' }],
      ['ambulance', '🚑', { sound: 'nee-naw' }],
      ['train', '🚂', { sound: 'choo choo' }],
      ['airplane', '✈️', { sound: 'zoom' }],
      ['helicopter', '🚁', { sound: 'whirr' }],
      ['boat', '⛵', { sound: 'splash' }],
      ['tractor', '🚜', { sound: 'putt putt' }],
      ['bike', '🚲', { sound: 'ring ring' }],
      ['rocket', '🚀', { sound: 'whoosh' }],
      ['motorcycle', '🏍️', { sound: 'vroom' }],
      ['taxi', '🚕', { sound: 'beep' }],
      ['race_car', '🏎️', { sound: 'vroom vroom' }],
      ['scooter', '🛴'],
    ]),
    W('food', [
      ['apple', '🍎'], ['banana', '🍌'], ['grapes', '🍇'], ['strawberry', '🍓'], ['orange', '🍊'],
      ['watermelon', '🍉'], ['carrot', '🥕'], ['broccoli', '🥦'], ['corn', '🌽'], ['bread', '🍞'],
      ['cheese', '🧀'], ['egg', '🥚'], ['milk', '🥛'], ['cookie', '🍪'], ['cake', '🍰'],
      ['ice_cream', '🍦'], ['pizza', '🍕'], ['pear', '🍐'], ['cherries', '🍒'], ['blueberries', '🫐'],
      ['pancakes', '🥞'], ['sandwich', '🥪'], ['juice', '🧃'], ['lemon', '🍋'], ['tomato', '🍅'],
      ['cupcake', '🧁'], ['popcorn', '🍿'], ['potato', '🥔'], ['avocado', '🥑'], ['pineapple', '🍍'],
    ]),
    W('body', [
      ['nose', '👃'], ['ear', '👂'], ['eye', '👁️'], ['mouth', '👄'], ['hand', '✋'],
      ['foot', '🦶'], ['tooth', '🦷'], ['leg', '🦵'], ['arm', '💪'], ['tongue', '👅'],
    ]),
    W('clothes', [
      ['shirt', '👕'], ['pants', '👖'], ['socks', '🧦'], ['shoe', '👟'], ['hat', '🧢'],
      ['dress', '👗'], ['coat', '🧥'], ['mittens', '🧤'], ['scarf', '🧣'], ['boots', '🥾'],
      ['glasses', '👓'], ['crown', '👑'],
    ]),
    W('home', [
      ['ball', '⚽'], ['teddy_bear', '🧸'], ['book', '📖'], ['bed', '🛏️'], ['chair', '🪑'],
      ['spoon', '🥄'], ['key', '🔑'], ['phone', '📱'], ['clock', '⏰'], ['light', '💡'],
      ['door', '🚪'], ['bathtub', '🛁'], ['toothbrush', '🪥'], ['umbrella', '☂️'], ['balloon', '🎈'],
      ['present', '🎁'], ['drum', '🥁'], ['crayon', '🖍️'], ['house', '🏠'], ['cup', '🥤'],
      ['blocks', '🧱'], ['kite', '🪁'], ['guitar', '🎸'], ['soap', '🧼'],
    ]),
    W('nature', [
      ['tree', '🌳'], ['flower', '🌻'], ['sun', '☀️'], ['moon', '🌙'], ['star', '⭐'],
      ['cloud', '☁️'], ['rainbow', '🌈'], ['snowflake', '❄️'], ['mountain', '⛰️'], ['leaf', '🍁'],
      ['rain', '🌧️'], ['snowman', '⛄'], ['rock', '🪨'], ['mushroom', '🍄'], ['cactus', '🌵'], ['water', '💧'],
    ])
  );
  D.wordsIn = (cat) => D.WORDS.filter((w) => w.cat === cat);
  D.word = (id) => D.WORDS.find((w) => w.id === id);
  const PLURALISH = /^(grapes|cherries|blueberries|pancakes|pants|socks|mittens|boots|glasses|blocks|popcorn|milk|juice|bread|cheese|corn|broccoli|water|rain|ice cream)$/;
  /** 'a dog' / 'an apple' / 'grapes' / 'some milk' */
  D.a = function (w) {
    const word = typeof w === 'string' ? w : w.word;
    if (PLURALISH.test(word)) return word;
    return (/^[aeiou]/i.test(word) ? 'an ' : 'a ') + word;
  };
  /** 'The cow says moo!' or '' */
  D.says = (w) => (w.sound ? `The ${w.word} says ${w.sound}!` : '');

  /* Colored-in-real-life items (for "find something red") */
  D.COLOR_THINGS = {
    red: ['🍎', '🍓', '🚒', '🍒', '🍅', '🐞', '🎈'],
    orange: ['🍊', '🥕', '🦊', '🎃', '🏀'],
    yellow: ['🍌', '🌻', '🍋', '🐥', '🌽', '🧀', '⭐'],
    green: ['🥦', '🐸', '🌳', '🍐', '🥒', '🦖', '🐢'],
    blue: ['🫐', '🐳', '🧢', '💧', '🦋', '👖'],
    purple: ['🍇', '🍆', '☂️'],
    pink: ['🐷', '🌸', '🦩', '🧁', '🎀'],
    brown: ['🐻', '🍪', '🪵', '🥔', '🐴'],
    black: ['🎩', '🎱', '🕶️'],
    white: ['☁️', '⛄', '🥚', '🐑', '🥛'],
  };

  /* ---------------- STICKERS ---------------- */
  D.STICKERS = W('sticker', [
    ['unicorn', '🦄'], ['dinosaur', '🦖'], ['rocket', '🚀'], ['rainbow', '🌈'], ['puppy', '🐶'],
    ['kitty', '🐱'], ['lion', '🦁'], ['frog', '🐸'], ['octopus', '🐙'], ['butterfly', '🦋'],
    ['turtle', '🐢'], ['giraffe', '🦒'], ['elephant', '🐘'], ['penguin', '🐧'], ['owl', '🦉'],
    ['bee', '🐝'], ['ladybug', '🐞'], ['shark', '🦈'], ['whale', '🐳'], ['crab', '🦀'],
    ['fire_truck', '🚒'], ['tractor', '🚜'], ['train', '🚂'], ['airplane', '✈️'], ['helicopter', '🚁'],
    ['race_car', '🏎️'], ['bus', '🚌'], ['sailboat', '⛵'], ['star', '🌟'], ['moon', '🌙'],
    ['sun', '☀️'], ['ice_cream', '🍦'], ['strawberry', '🍓'], ['donut', '🍩'], ['cupcake', '🧁'],
    ['pizza', '🍕'], ['balloon', '🎈'], ['present', '🎁'], ['drum', '🥁'], ['guitar', '🎸'],
    ['trumpet', '🎺'], ['ball', '⚽'], ['kite', '🪁'], ['big_dinosaur', '🦕'], ['dragon', '🐉'],
    ['monkey', '🐵'], ['panda', '🐼'], ['fox', '🦊'], ['bunny', '🐰'], ['bear', '🐻'],
    ['robot', '🤖'], ['crown', '👑'], ['sunflower', '🌻'], ['watermelon', '🍉'], ['snowman', '⛄'],
    ['parrot', '🦜'], ['koala', '🐨'], ['hedgehog', '🦔'], ['teddy_bear', '🧸'], ['castle', '🏰'],
  ]);

  /* ---------------- PRAISE ---------------- */
  D.PRAISE = ['Yay!', 'Great job!', 'You did it!', 'Hooray!', 'Awesome!', 'Wow!', 'Super!', 'Way to go!',
    'Yes!', 'Good job!', 'Amazing!', 'Woo-hoo!', 'Fantastic!', 'Nice one!', 'You got it!', 'Terrific!'];
  let lastPraise = '';
  /** Random praise; sometimes includes the child's name if set in settings. */
  D.praise = function () {
    let p;
    do { p = U.pick(D.PRAISE); } while (p === lastPraise && D.PRAISE.length > 1);
    lastPraise = p;
    const name = PP.store && PP.store.settings.childName;
    if (name && Math.random() < 0.35) p = p.replace(/[!.]$/, '') + ', ' + name + '!';
    return p;
  };
})();
