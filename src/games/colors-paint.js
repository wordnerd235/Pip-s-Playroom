/* Paint — a toddler coloring book.
 * Big paint pots (a color is always selected). Tap a region → a juicy paint splat floods it with the color.
 * When every region is painted the picture comes alive (fish swims, car drives, rocket launches…), then a big
 * arrow brings the next picture. From level 2 Pip sometimes suggests a color ("Let's make the sun yellow!") —
 * following it earns extra praise; ignoring it is fine.
 *
 * Level 1: 6 paints, simple pictures (4–6 regions), no suggestions.
 * Level 3+: 8 paints, all pictures (up to 8 regions), suggestions (up to 2 per picture at level 4–5).
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;
  const D = PP.data;
  const INK = '#2B2340';

  /* ---------------- picture helpers ---------------- */
  // R(id, name, shape-markup, hintColorId) → paintable region;  X(markup) → fixed detail;  G(key, items, {t}) → animatable group
  const R = (id, name, shape, hint) => ({ id, name, shape, hint });
  const an = (w) => (/^[aeiou]/i.test(w) ? 'An' : 'A');
  const X = (markup) => ({ x: markup });
  const G = (k, items, o) => Object.assign({ k, items }, o || {});
  const eye = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.36}" fill="#fff"/>`;
  const rays = (cx, cy, r1, r2, n) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `M${(cx + Math.cos(a) * r1).toFixed(1)} ${(cy + Math.sin(a) * r1).toFixed(1)} L${(cx + Math.cos(a) * r2).toFixed(1)} ${(cy + Math.sin(a) * r2).toFixed(1)}`;
  }).join(' ');
  const petal = (a) => `<ellipse cx="200" cy="74" rx="41" ry="56" transform="rotate(${a} 200 140)"/>`;

  // Web Animations helper for SVG parts (transform-box: fill-box so % origins work on groups)
  function anim(el, frames, opts, origin) {
    if (!el || !el.animate) return null;
    el.style.transformBox = 'fill-box';
    el.style.transformOrigin = origin || '50% 50%';
    return el.animate(frames, opts);
  }

  const PICTURES = [
    {
      id: 'cupcake', name: 'cupcake', intro: 'A cupcake!', cheer: 'Yummy yummy!', vb: '14 14 372 372',
      bg: `<ellipse cx="200" cy="370" rx="150" ry="16" fill="#F1E9DD"/>`,
      parts: [
        G('cake', [
          R('wrapper', 'cupcake', '<path d="M96 220 L304 220 L276 364 L124 364 Z"/>'),
          X(`<path d="M128 236 L140 352 M272 236 L260 352" stroke="${INK}" stroke-width="4" stroke-linecap="round" opacity=".35"/>`),
          X(`${eye(172, 284, 9)}${eye(228, 284, 9)}<path d="M186 306 Q200 320 214 306" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="152" cy="306" rx="10" ry="6" fill="#FF8FA3" opacity=".5"/><ellipse cx="248" cy="306" rx="10" ry="6" fill="#FF8FA3" opacity=".5"/>`),
          R('frosting', 'frosting', '<path d="M84 214 C 62 186 88 150 124 150 L276 150 C 312 150 338 186 316 214 C 302 236 282 222 266 232 C 250 244 230 228 212 238 C 196 246 180 230 164 240 C 146 248 132 226 116 234 C 100 240 92 226 84 214 Z"/>', 'pink'),
          R('swirl', 'frosting', '<path d="M124 156 C 118 114 160 94 200 102 C 240 94 282 114 276 156 Z"/>'),
          G('sprinkles', [X(['#EF3B36', '#2F7BEA', '#FFD21F', '#3DBE4B', '#8E4FD6', '#FF8C1A', '#FF6FB5', '#22C3C3', '#EF3B36', '#2F7BEA', '#3DBE4B', '#FFD21F']
            .map((c, i) => { const x = 116 + (i % 6) * 34 + (i > 5 ? 16 : 0), y = i > 5 ? 192 : 134 + (i % 2) * 12 + (i % 3 === 0 ? 30 : 0); return `<rect x="${x}" y="${y}" width="16" height="7" rx="3.5" fill="${c}" transform="rotate(${(i * 47) % 160 - 80} ${x + 8} ${y + 3})"/>`; }).join(''))], { style: 'opacity:0' }),
          G('cherry', [
            X(`<path d="M206 54 C 210 38 222 28 238 24" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`),
            R('cherry', 'cherry', '<circle cx="200" cy="80" r="30"/>', 'red'),
            X('<ellipse cx="189" cy="70" rx="7" ry="4.5" fill="#fff" opacity=".7" transform="rotate(-30 189 70)"/>'),
          ]),
        ]),
      ],
      alive(P) {
        anim(P.part('cake'), [
          { transform: 'scale(1,1)' }, { transform: 'scale(1.08,.9)', offset: 0.18 }, { transform: 'scale(.95,1.08) translateY(-18px)', offset: 0.4 },
          { transform: 'scale(1.04,.96)', offset: 0.6 }, { transform: 'scale(1,1)' },
        ], { duration: 900, iterations: 3, easing: 'ease-in-out' }, '50% 100%');
        anim(P.part('cherry'), [{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-60px) rotate(20deg)', offset: 0.45 }, { transform: 'translateY(0) rotate(0)' }],
          { duration: 900, delay: 600, iterations: 2, easing: 'cubic-bezier(.3,0,.5,1)' });
        const sp = P.part('sprinkles');
        if (sp) sp.animate([{ opacity: 0, transform: 'translateY(-40px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 700, delay: 300, fill: 'forwards', easing: 'cubic-bezier(.3,1.5,.5,1)' });
        P.sfx('chomp', 900);
        P.sfx('sparkle', 300);
      },
    },
    {
      id: 'fish', name: 'fish', intro: 'A fish!', cheer: 'Swim, little fish!', vb: '18 14 380 380',
      bg: `<path d="M24 360 q 22 -14 44 0 t 44 0 t 44 0 M232 372 q 22 -14 44 0 t 44 0 t 44 0" stroke="#CFE9F7" stroke-width="6" fill="none" stroke-linecap="round"/>`,
      parts: [
        G('fishwrap', [G('fish', [
          G('tail', [R('tail', 'tail', '<path d="M134 200 C 106 172 76 140 52 118 C 34 152 34 248 52 282 C 76 260 106 228 134 200 Z"/>')]),
          R('fin', 'fin', '<path d="M168 144 C 174 74 236 22 296 132 Z"/>'),
          R('body', 'fish', '<path d="M112 200 C 116 140 176 106 240 108 C 304 110 348 152 348 200 C 348 248 304 290 240 292 C 176 294 116 260 112 200 Z"/>', 'orange'),
          G('sidefin', [R('sidefin', 'fin', '<path d="M196 206 C 226 170 284 178 290 224 C 262 258 220 254 196 206 Z"/>')]),
          X(`<circle cx="298" cy="176" r="20" fill="#fff" stroke="${INK}" stroke-width="5"/>${eye(302, 178, 10)}<path d="M336 216 Q 324 228 312 220" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`),
        ]),
        G('bubbles', [
          R('bubble1', 'bubble', '<circle cx="360" cy="112" r="32"/>', 'blue'),
          R('bubble2', 'bubble', '<circle cx="322" cy="42" r="36"/>', 'blue'),
          X('<path d="M346 98 q 6 -9 15 -9 M306 27 q 7 -9 18 -9" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>'),
        ]),
        ], { t: 'translate(0 26)' }),
      ],
      alive(P) {
        anim(P.part('fish'), [
          { transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(-34px,10px) rotate(-4deg)', offset: 0.25 },
          { transform: 'translate(0,-8px) rotate(0)', offset: 0.5 }, { transform: 'translate(30px,8px) rotate(4deg)', offset: 0.75 }, { transform: 'translate(0,0) rotate(0)' },
        ], { duration: 2600, iterations: Infinity, easing: 'ease-in-out' });
        anim(P.part('tail'), [{ transform: 'rotate(-16deg)' }, { transform: 'rotate(16deg)' }], { duration: 260, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }, '100% 50%');
        anim(P.part('sidefin'), [{ transform: 'rotate(-10deg)' }, { transform: 'rotate(12deg)' }], { duration: 400, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }, '0% 50%');
        anim(P.part('bubbles'), [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-26px)', opacity: 0.85 }], { duration: 1100, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
        P.sfx('bubble', 0); P.sfx('bubble', 250); P.sfx('splash', 500);
      },
    },
    {
      id: 'car', name: 'car', intro: 'A car!', cheer: 'Beep beep! Vroom!', vb: '22 66 356 356',
      bg: `<path d="M10 354 H390" stroke="#E2DACB" stroke-width="7" stroke-dasharray="28 20" stroke-linecap="round"/>`,
      parts: [
        G('car', [
          G('carbody', [
            R('cabin', 'roof', '<path d="M100 216 L140 140 C 146 129 154 124 168 124 L262 124 C 276 124 285 130 292 140 L334 216 Z"/>'),
            R('winback', 'window', '<path d="M128 206 L156 152 C 160 145 165 142 172 142 L206 142 L206 206 Z"/>', 'blue'),
            R('winfront', 'window', '<path d="M222 206 L222 142 L258 142 C 266 142 272 146 276 152 L306 206 Z"/>', 'blue'),
            R('body', 'car', '<path d="M34 264 C 34 230 58 210 92 210 L314 210 C 348 210 370 230 370 264 L370 288 C 370 300 362 308 350 308 L54 308 C 42 308 34 300 34 288 Z"/>', 'red'),
            X(`<path d="M214 216 V296" stroke="${INK}" stroke-width="4" opacity=".45"/><rect x="230" y="232" width="26" height="9" rx="4.5" fill="${INK}" opacity=".55"/><path d="M370 236 C 360 236 352 244 352 256 L370 256 Z" fill="#FFE45C" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M34 240 C 42 240 48 246 48 254 L34 254 Z" fill="#FF6B6B" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`),
          ]),
          G('wl', [R('wheel1', 'wheel', '<circle cx="112" cy="308" r="44"/>'), X(`<circle cx="112" cy="308" r="16" fill="#E9E7F0" stroke="${INK}" stroke-width="4"/><path d="M112 296 V320 M100 308 H124" stroke="${INK}" stroke-width="3" opacity=".5"/>`)]),
          G('wr', [R('wheel2', 'wheel', '<circle cx="294" cy="308" r="44"/>'), X(`<circle cx="294" cy="308" r="16" fill="#E9E7F0" stroke="${INK}" stroke-width="4"/><path d="M294 296 V320 M282 308 H306" stroke="${INK}" stroke-width="3" opacity=".5"/>`)]),
        ]),
      ],
      alive(P) {
        const spin = [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }];
        anim(P.part('wl'), spin, { duration: 500, iterations: Infinity });
        anim(P.part('wr'), spin, { duration: 500, iterations: Infinity });
        anim(P.part('carbody'), [{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }], { duration: 180, iterations: Infinity, direction: 'alternate' });
        const car = P.part('car');
        const drive = () => anim(car, [
          { transform: 'translateX(0)' }, { transform: 'translateX(-24px)', offset: 0.12 }, { transform: 'translateX(560px)', offset: 0.5 },
          { transform: 'translateX(-560px)', offset: 0.5001 }, { transform: 'translateX(14px)', offset: 0.9 }, { transform: 'translateX(0)' },
        ], { duration: 2600, easing: 'ease-in-out' });
        drive();
        P.every(7000, drive);
        P.sfx('whoosh', 300);
        P.sfx('whoosh', 1400);
      },
    },
    {
      id: 'rocket', name: 'rocket', intro: 'A rocket!', cheer: 'Three, two, one, blast off!',
      bg: [[60, 70], [330, 60], [340, 300], [56, 250], [300, 170], [90, 160]].map(([x, y], i) =>
        `<path d="M${x} ${y - 12} L${x + 4} ${y - 4} L${x + 12} ${y} L${x + 4} ${y + 4} L${x} ${y + 12} L${x - 4} ${y + 4} L${x - 12} ${y} L${x - 4} ${y - 4} Z" fill="${i % 2 ? '#FFE9A8' : '#E3DBF7'}"/>`).join(''),
      parts: [
        G('rocket', [
          G('flame', [X(`<path d="M164 342 C 160 376 186 398 200 404 C 214 398 240 376 236 342 Z" fill="#FF8C1A"/><path d="M180 342 C 178 368 192 384 200 390 C 208 384 222 368 220 342 Z" fill="#FFD21F"/>`)], { style: 'opacity:0' }),
          R('finL', 'fin', '<path d="M148 210 C 100 230 64 276 64 336 L148 306 Z"/>'),
          R('finR', 'fin', '<path d="M252 210 C 300 230 336 276 336 336 L252 306 Z"/>'),
          R('nozzle', 'bottom', '<path d="M152 296 L248 296 L236 354 L164 354 Z"/>'),
          R('body', 'rocket', '<path d="M140 132 C 136 200 136 250 144 302 L256 302 C 264 250 264 200 260 132 Z"/>'),
          R('nose', 'nose', '<path d="M200 20 C 238 44 260 92 264 138 L136 138 C 140 92 162 44 200 20 Z"/>', 'red'),
          R('window', 'window', '<circle cx="200" cy="208" r="38"/>', 'blue'),
          X(`<circle cx="200" cy="208" r="46" fill="none" stroke="${INK}" stroke-width="5"/><path d="M180 192 q 8 -12 22 -12" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".85"/>`),
        ]),
      ],
      alive(P) {
        const flame = P.part('flame');
        const rocket = P.part('rocket');
        anim(rocket, [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 120, iterations: 6 });
        if (flame) {
          flame.style.opacity = 1;
          anim(flame, [{ transform: 'scale(1,1)' }, { transform: 'scale(.85,1.25)' }], { duration: 120, iterations: Infinity, direction: 'alternate' }, '50% 0%');
        }
        P.sfx('blastoff', 500);
        P.later(700, () => anim(rocket, [
          { transform: 'translateY(0)' }, { transform: 'translateY(-560px)', offset: 0.45 }, { transform: 'translateY(560px)', offset: 0.4501 },
          { transform: 'translateY(-10px)', offset: 0.9 }, { transform: 'translateY(0)' },
        ], { duration: 3000, easing: 'cubic-bezier(.5,0,.4,1)' }));
        P.later(3800, () => { if (flame) flame.style.opacity = 0; });
      },
    },
    {
      id: 'boat', name: 'boat', intro: 'A sailboat!', cheer: 'Sail away, little boat!',
      parts: [
        G('sun', [R('sun', 'sun', '<circle cx="76" cy="76" r="40"/>', 'yellow'), X(`<path d="${rays(76, 76, 50, 66, 8)}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`)]),
        G('cloud', [R('cloud', 'cloud', '<path d="M262 104 C 238 104 232 74 256 68 C 256 42 290 34 302 52 C 312 30 352 34 352 62 C 376 62 380 104 352 104 Z"/>')]),
        G('boat', [
          R('sailS', 'sail', '<path d="M192 88 L192 248 L90 248 C 118 190 150 130 192 88 Z"/>'),
          R('sailB', 'sail', '<path d="M208 52 C 262 110 318 180 338 248 L208 248 Z"/>'),
          X(`<path d="M200 40 V262" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>`),
          R('hull', 'boat', '<path d="M54 256 L350 256 C 340 302 304 326 270 326 L134 326 C 100 326 64 302 54 256 Z"/>', 'red'),
        ]),
        G('water', [R('water', 'water', '<path d="M-30 318 C 10 302 50 334 90 318 C 130 302 170 334 210 318 C 250 302 290 334 330 318 C 370 302 410 334 450 318 L450 410 L-30 410 Z"/>', 'blue')]),
      ],
      alive(P) {
        anim(P.part('boat'), [{ transform: 'translateY(0) rotate(-4deg)' }, { transform: 'translateY(-10px) rotate(4deg)' }], { duration: 1000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }, '50% 90%');
        anim(P.part('water'), [{ transform: 'translateX(-14px)' }, { transform: 'translateX(14px)' }], { duration: 1300, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
        anim(P.part('sun'), [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 6000, iterations: Infinity });
        anim(P.part('cloud'), [{ transform: 'translateX(0)' }, { transform: 'translateX(-30px)' }], { duration: 2500, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
        P.sfx('splash', 200);
      },
    },
    {
      id: 'butterfly', name: 'butterfly', intro: 'A butterfly!', cheer: 'Flap, flap! Fly, butterfly!', minLevel: 2, vb: '12 -6 376 376',
      parts: [
        G('bfly', [
          X(`<path d="M190 104 C 180 72 166 56 146 48 M210 104 C 220 72 234 56 254 48" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="144" cy="46" r="9" fill="${INK}"/><circle cx="256" cy="46" r="9" fill="${INK}"/>`),
          G('wingL', [
            R('wUL', 'wing', '<path d="M196 180 C 150 76 60 44 38 104 C 20 164 108 206 196 198 Z"/>'),
            R('wLL', 'wing', '<path d="M196 206 C 116 206 58 242 74 298 C 92 348 172 320 198 242 Z"/>'),
            R('spotL', 'spot', '<circle cx="114" cy="134" r="32"/>'),
          ]),
          G('wingR', [
            R('wUR', 'wing', '<path d="M204 180 C 250 76 340 44 362 104 C 380 164 292 206 204 198 Z"/>'),
            R('wLR', 'wing', '<path d="M204 206 C 284 206 342 242 326 298 C 308 348 228 320 202 242 Z"/>'),
            R('spotR', 'spot', '<circle cx="286" cy="134" r="32"/>'),
          ]),
          R('body', 'body', '<path d="M200 90 C 226 90 232 114 226 130 C 236 180 234 270 220 308 C 212 328 188 328 180 308 C 166 270 164 180 174 130 C 168 114 174 90 200 90 Z"/>'),
          X(`${eye(191, 116, 5)}${eye(209, 116, 5)}<path d="M193 128 Q200 134 207 128" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`),
        ]),
      ],
      alive(P) {
        anim(P.part('wingL'), [{ transform: 'scaleX(1)' }, { transform: 'scaleX(.35)' }], { duration: 220, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }, '100% 50%');
        anim(P.part('wingR'), [{ transform: 'scaleX(1)' }, { transform: 'scaleX(.35)' }], { duration: 220, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }, '0% 50%');
        anim(P.part('bfly'), [
          { transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(-40px,-30px) rotate(-8deg)', offset: 0.25 }, { transform: 'translate(0,-50px) rotate(0)', offset: 0.5 },
          { transform: 'translate(40px,-24px) rotate(8deg)', offset: 0.75 }, { transform: 'translate(0,0) rotate(0)' },
        ], { duration: 3000, iterations: Infinity, easing: 'ease-in-out' });
        P.sfx('twinkle', 200);
      },
    },
    {
      id: 'flower', name: 'flower', intro: 'A flower!', cheer: 'What a pretty flower!', minLevel: 3,
      parts: [
        G('plant', [
          R('stem', 'leaves', '<path d="M186 186 L214 186 L214 312 L186 312 Z M200 292 C 168 240 112 236 88 262 C 110 308 170 316 200 292 Z M200 258 C 232 206 288 202 312 228 C 290 274 230 282 200 258 Z"/>', 'green'),
          G('bloom', [
            R('p1', 'petal', petal(0)), R('p2', 'petal', petal(72)), R('p3', 'petal', petal(144)), R('p4', 'petal', petal(216)), R('p5', 'petal', petal(288)),
            R('center', 'middle', '<circle cx="200" cy="140" r="42"/>', 'yellow'),
            X(`${eye(186, 134, 6)}${eye(214, 134, 6)}<path d="M186 152 Q200 166 214 152" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`),
          ]),
        ]),
        R('pot', 'pot', '<path d="M116 304 L284 304 L284 332 L270 332 L256 394 L144 394 L130 332 L116 332 Z"/>', 'orange'),
        X(`<path d="M130 332 H270" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`),
      ],
      alive(P) {
        anim(P.part('plant'), [{ transform: 'rotate(-7deg)' }, { transform: 'rotate(7deg)' }], { duration: 1200, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }, '50% 100%');
        anim(P.part('bloom'), [{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.1) rotate(10deg)' }], { duration: 900, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
        P.sfx('sparkle', 200);
      },
    },
    {
      id: 'house', name: 'house', intro: 'A house!', cheer: 'What a happy house!', minLevel: 3,
      parts: [
        G('sun', [R('sun', 'sun', '<circle cx="334" cy="70" r="38"/>', 'yellow'), X(`<path d="${rays(334, 70, 48, 62, 8)}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`)]),
        G('smoke', []),
        G('house', [
          R('chimney', 'chimney', '<rect x="104" y="54" width="54" height="124"/>'),
          R('wall', 'house', '<rect x="78" y="184" width="244" height="172"/>'),
          R('roof', 'roof', '<path d="M46 192 L200 64 L354 192 Z"/>', 'red'),
          R('winL', 'window', '<rect x="102" y="212" width="68" height="64" rx="6"/>', 'blue'),
          R('winR', 'window', '<rect x="230" y="212" width="68" height="64" rx="6"/>', 'blue'),
          X(`<path d="M136 214 V274 M104 244 H168 M264 214 V274 M232 244 H296" stroke="${INK}" stroke-width="4"/>`),
          R('door', 'door', '<path d="M166 356 L166 266 C 166 236 234 236 234 266 L234 356 Z"/>', 'brown'),
          X(`<circle cx="220" cy="312" r="6" fill="${INK}"/>`),
        ]),
        R('grass', 'grass', '<path d="M-10 350 C 60 336 120 346 200 342 C 280 338 340 346 410 338 L410 410 L-10 410 Z"/>', 'green'),
      ],
      alive(P) {
        anim(P.part('house'), [{ transform: 'scale(1,1)' }, { transform: 'scale(1.05,.94)', offset: 0.3 }, { transform: 'scale(.97,1.05)', offset: 0.6 }, { transform: 'scale(1,1)' }],
          { duration: 700, iterations: 3, easing: 'ease-in-out' }, '50% 100%');
        anim(P.part('sun'), [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 5000, iterations: Infinity });
        const smoke = P.part('smoke');
        const puff = () => {
          if (!smoke) return;
          const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          c.setAttribute('cx', 131); c.setAttribute('cy', 40); c.setAttribute('r', 16);
          c.setAttribute('fill', '#E4E1EC');
          smoke.appendChild(c);
          const a = c.animate([{ transform: 'translate(0,0) scale(.5)', opacity: 0.95 }, { transform: `translate(${U.rand(-30, 10)}px,-70px) scale(1.6)`, opacity: 0 }], { duration: 2200, easing: 'ease-out' });
          c.style.transformBox = 'fill-box'; c.style.transformOrigin = '50% 50%';
          a.onfinish = () => c.remove();
        };
        puff();
        P.every(650, puff);
        P.sfx('twinkle', 300);
      },
    },
  ];

  /* ---------------- art ---------------- */
  function paletteFor(level) {
    const ids = level >= 3 ? ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown'] : ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    return ids.map((id) => D.colorById(id));
  }
  function potMarkup(c) {
    const dk = U.shade(c.hex, -0.32);
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="50" cy="94" rx="31" ry="5" fill="rgba(60,40,20,.16)"/>
      <path d="M21 44 L27 85 Q28 93 37 93 L63 93 Q72 93 73 85 L79 44 Z" fill="${U.shade(c.hex, -0.12)}" stroke="${dk}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M24 62 L76 62 L74.6 74 L25.4 74 Z" fill="#fff" opacity=".42"/>
      <path d="M31 50 L34 84" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/>
      <path d="M13 44 C 13 27 30 18 50 18 C 70 18 87 27 87 44 C 87 50 82 52 79 49 L79 58 C 79 65 69 65 69 58 L69 51 C 58 53 44 53 33 51 L33 62 C 33 69 23 69 23 62 L23 49 C 19 52 13 50 13 44 Z" fill="${c.hex}" stroke="${dk}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="37" cy="31" rx="11" ry="5.5" fill="#fff" opacity=".6" transform="rotate(-16 37 31)"/>
      <circle cx="56" cy="27" r="2.6" fill="#fff" opacity=".6"/>
    </svg>`;
  }

  let uidN = 0;
  function renderPicture(pic) {
    const uid = ++uidN;
    let defs = '';
    const regions = [];
    function items(list) {
      let s = '';
      list.forEach((it) => {
        if (it.items) {
          s += `<g class="pt-part" data-k="${it.k}"${it.style ? ` style="${it.style}"` : ''}>${it.t ? `<g transform="${it.t}">` : ''}${items(it.items)}${it.t ? '</g>' : ''}</g>`;
        } else if (it.x) {
          s += `<g class="pt-detail">${it.x}</g>`;
        } else {
          const cid = `pt-c${uid}-${it.id}`;
          defs += `<clipPath id="${cid}">${it.shape}</clipPath>`;
          regions.push(it);
          s += `<g class="pt-reg" data-r="${it.id}"><g class="pt-r" fill="#fff">${it.shape}</g><g class="pt-flood" clip-path="url(#${cid})"></g>` +
            `<g class="pt-o" fill="none" stroke="${INK}" stroke-width="6.5" stroke-linejoin="round" stroke-linecap="round">${it.shape}</g></g>`;
        }
      });
      return s;
    }
    const body = items(pic.parts);
    const svg = `<svg class="pt-svg" viewBox="${pic.vb || '0 0 400 400'}" aria-hidden="true"><defs>${defs}</defs>${pic.bg || ''}${body}</svg>`;
    return { svg, regions };
  }

  function blobPath(R, seed) {
    const n = 11, pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + seed;
      const r = R * (0.86 + 0.14 * Math.abs(Math.sin(seed * 7 + i * 2.3)));
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    let d = '';
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      d += i === 0 ? `M${mx.toFixed(1)} ${my.toFixed(1)} ` : '';
      const nq = pts[(i + 2) % n];
      const nx = (q[0] + nq[0]) / 2, ny = (q[1] + nq[1]) / 2;
      d += `Q${q[0].toFixed(1)} ${q[1].toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)} `;
    }
    return d + 'Z';
  }

  U.addStyles('paint', `
    .g-paint { background: linear-gradient(160deg, #FFF9EF 0%, #FFEEDA 100%); }
    .pt-deco { position: absolute; pointer-events: none; z-index: 0; opacity: .5; }
    .pt-deco svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .pt-fx { position: absolute; inset: 0; pointer-events: none; z-index: 30; overflow: hidden; }
    .pt-card { position: absolute; z-index: 5; background: #fff; border-radius: 7%; overflow: hidden;
      box-shadow: 0 6px 0 #EADBC4, 0 14px 30px rgba(120,80,30,.18); border: 5px solid #fff; }
    .pt-card.in { animation: pt-in .6s cubic-bezier(.3,1.4,.5,1) both; }
    @keyframes pt-in { from { transform: translateX(60%) rotate(8deg) scale(.7); opacity: 0 } to { transform: none; opacity: 1 } }
    .pt-svg { width: 100%; height: 100%; display: block; }
    .pt-o, .pt-detail, .pt-flood { pointer-events: none; }
    .pt-r { cursor: pointer; }
    .pt-r.pt-hint { animation: pt-hint 1s ease-in-out infinite; }
    @keyframes pt-hint { 0%, 100% { fill: #fff } 50% { fill: var(--hl, #FFF3A0) } }
    .pt-tape { position: absolute; z-index: 6; width: 18%; height: 7%; background: rgba(255,226,140,.75); border-radius: 3px; pointer-events: none;
      box-shadow: 0 1px 2px rgba(0,0,0,.08); }
    .pt-pal { position: absolute; z-index: 8; display: grid; }
    .pt-pot { position: relative; border-radius: 28%; background: rgba(255,255,255,.55); display: grid; place-items: center;
      box-shadow: 0 4px 0 rgba(160,120,70,.12); transition: transform .22s cubic-bezier(.3,1.6,.5,1), background .2s, box-shadow .2s; }
    .pt-pot svg { width: 86%; height: 86%; display: block; overflow: visible; }
    .pt-pot.sel { background: #fff; transform: translateY(-9%) scale(1.1); z-index: 2;
      box-shadow: 0 0 0 calc(var(--pot) * .06) var(--c), 0 10px 18px rgba(80,50,20,.22); }
    .pt-pot.sel svg { animation: pt-potbob 1.4s ease-in-out infinite; }
    @keyframes pt-potbob { 0%, 100% { transform: translateY(0) rotate(0) } 50% { transform: translateY(-5%) rotate(-3deg) } }
    .pt-pot.wig svg { animation: pp-wiggle .5s ease; }
    .pt-pot.pt-suggest { animation: pp-glow 1.1s ease-in-out infinite; }
    .pt-drop { position: absolute; border-radius: 50%; pointer-events: none; }
    .pt-bgsplat { position: absolute; pointer-events: none; z-index: 1; }
    .pt-bgsplat svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .pp-next.pt-next { right: auto; bottom: auto; z-index: 40; }
  `);

  PP.registerGame({
    id: 'paint',
    title: 'Paint',
    domain: 'colors',
    icon: '🎨',
    tileColor: '#FF8C42',
    order: 11,
    // every data-driven line, for tools/harvest.js (natural voice pack)
    voiceLines() {
      const L = [];
      const cols = paletteFor(5);
      const walk = (list, out) => list.forEach((it) => { if (it.items) walk(it.items, out); else if (it.name && it.shape) out.push(it.name); });
      PICTURES.forEach((p) => {
        L.push(p.intro, p.cheer);
        const names = [];
        walk(p.parts, names);
        [...new Set(names)].forEach((n) => {
          L.push(`Tap the ${n}!`, `Let's paint the ${n}!`);
          cols.forEach((c) => L.push(`${an(c.name)} ${c.name} ${n}!`, `${U.cap(c.name)} ${n}!`, `Let's make the ${n} ${c.name}!`));
        });
      });
      return L;
    },
    create(stage, ctx) {
      const fxl = ctx.el('div', { class: 'pt-fx' });
      const pal = ctx.el('div', { class: 'pt-pal' });
      // soft paint splats decorating the room
      [['#FFB3D8', 'left:-6vmin;bottom:16%', 30, 1.2], ['#86B6FF', 'left:16%;bottom:-10vmin', 26, 3.1], ['#FFE985', 'left:30%;top:-7vmin', 24, 5.3],
        ['#8FE39A', 'right:22%;bottom:-8vmin', 28, 0.4], ['#C9A6F2', 'left:-4vmin;top:22%', 16, 2.2]].forEach(([c, pos, sz, seed]) => {
        const d = ctx.el('div', { class: 'pt-deco' });
        d.style.cssText += pos + `;width:${sz}vmin;height:${sz}vmin`;
        d.innerHTML = `<svg viewBox="-60 -60 120 120"><path d="${blobPath(40, seed)}" fill="${c}"/><circle cx="${Math.cos(seed) * 52}" cy="${Math.sin(seed) * 52}" r="7" fill="${c}"/><circle cx="${Math.cos(seed + 2) * 50}" cy="${Math.sin(seed + 2) * 50}" r="4.5" fill="${c}"/><circle cx="${Math.cos(seed + 4) * 54}" cy="${Math.sin(seed + 4) * 54}" r="5.5" fill="${c}"/></svg>`;
        stage.appendChild(d);
      });
      stage.append(pal, fxl);
      ctx.mascot.show({ corner: 'bl' });

      let colors = [];
      let current = null;
      let pots = [];
      let card = null, tapes = [], svgEl = null, pic = null, regions = [], painted = new Map();
      let done = false, nextBtn = null, sugg = null, suggCount = 0, picIdx = -1, history = [], idleTalks = 0;
      let lastSpoken = '', paintCount = 0, picStops = [];
      let L = { landscape: false, S: 300, x: 0, y: 0, pot: 80 };

      /* ---------------- palette ---------------- */
      function buildPalette() {
        const lvl = ctx.level;
        const want = paletteFor(lvl);
        if (pots.length === want.length) return;
        colors = want;
        pal.innerHTML = '';
        pots = colors.map((c) => {
          const p = ctx.el('button', { class: 'pt-pot pp-noripple', 'aria-label': c.name, style: { '--c': c.hex } });
          p.innerHTML = potMarkup(c);
          p.dataset.c = c.id;
          ctx.tap(p, () => {
            idleTalks = 0;
            select(c, true);
          });
          pal.appendChild(p);
          return p;
        });
        if (!current || !colors.find((c) => c.id === current.id)) current = colors[U.randInt(0, Math.min(4, colors.length - 1))];
        select(current, false);
        layout();
      }
      function select(c, user) {
        current = c;
        pots.forEach((p) => p.classList.toggle('sel', p.dataset.c === c.id));
        if (user) {
          const p = pots.find((q) => q.dataset.c === c.id);
          p.classList.remove('wig'); void p.offsetWidth; p.classList.add('wig');
          ctx.sfx('bubble', { vel: 0.7 });
          ctx.say(U.cap(c.name) + '!');
          lastSpoken = c.id;
          const r = p.getBoundingClientRect();
          drops(r.left + r.width / 2, r.top + r.height * 0.3, c, 5, 0.6);
        }
      }

      /* ---------------- layout ---------------- */
      function layout() {
        const { w, h } = ctx.size();
        const n = pots.length || 6;
        const pip = U.clamp(Math.min(w, h) * 0.14, 80, 140);
        const land = w > h * 1.08;
        const gap = U.clamp(Math.min(w, h) * 0.018, 8, 16);
        const pad = 12;
        let cols, rows, pot, palW, palH;
        if (land) {
          cols = 2; rows = Math.ceil(n / 2);
          pot = Math.min(126, (h - pad * 2 - gap * (rows - 1)) / rows - 4, (w * 0.26 - gap) / 2);
          palW = cols * pot + gap * (cols - 1);
          palH = rows * pot + gap * (rows - 1);
          pal.style.left = (w - palW - pad - 6) + 'px';
          pal.style.top = (h - palH) / 2 + 'px';
          const areaL = Math.max(100, pip + 18), areaR = w - palW - pad * 2 - 10;
          const S = Math.max(160, Math.min(h - 2 * pad - 8, areaR - areaL));
          L = { landscape: true, S, x: areaL + (areaR - areaL - S) / 2, y: (h - S) / 2 };
        } else {
          cols = n <= 6 ? (w >= 640 ? 6 : 3) : (w >= 700 ? 8 : 4);
          rows = Math.ceil(n / cols);
          pot = Math.min(118, (w - pad * 2 - gap * (cols - 1)) / cols - 2);
          palW = cols * pot + gap * (cols - 1);
          palH = rows * pot + gap * (rows - 1);
          pal.style.left = (w - palW) / 2 + 'px';
          pal.style.top = (h - palH - pad - 10) + 'px';
          const top = Math.max(92, pip + 14), bottom = h - palH - pad - 10 - 16;
          const S = Math.max(160, Math.min(w - 2 * pad - 4, bottom - top));
          L = { landscape: false, S, x: (w - S) / 2, y: top + (bottom - top - S) / 2 };
        }
        pal.style.gridTemplateColumns = `repeat(${cols}, ${pot}px)`;
        pal.style.gridAutoRows = pot + 'px';
        pal.style.gap = gap + 'px';
        pal.style.setProperty('--pot', pot + 'px');
        ctx.mascot.show({ corner: land ? 'bl' : 'tr' });
        placeCard();
      }
      function placeCard() {
        if (!card) return;
        Object.assign(card.style, { left: L.x + 'px', top: L.y + 'px', width: L.S + 'px', height: L.S + 'px' });
        const tw = L.S * 0.18;
        tapes.forEach((t, i) => Object.assign(t.style, {
          left: (i ? L.x + L.S - tw * 0.75 : L.x - tw * 0.25) + 'px', top: (L.y - L.S * 0.02) + 'px', width: tw + 'px', height: L.S * 0.065 + 'px',
          transform: `rotate(${i ? 38 : -38}deg)`,
        }));
        if (nextBtn) {
          const b = nextBtn.offsetWidth || 100; // layout size (rect is 0 while its pop-in starts at scale 0)
          const sw = stage.clientWidth, sh = stage.clientHeight;
          nextBtn.style.left = U.clamp(L.x + L.S - b * 0.72, 8, sw - b - 8) + 'px';
          nextBtn.style.top = U.clamp(L.y + L.S - b * 0.72, 8, sh - b - 8) + 'px';
        }
      }
      ctx.onResize(layout);

      /* ---------------- picture ---------------- */
      function choosePicture() {
        const lvl = ctx.level;
        const pool = PICTURES.map((p, i) => i).filter((i) => (PICTURES[i].minLevel || 1) <= lvl);
        const fresh = pool.filter((i) => !history.includes(i));
        const i = fresh.length ? (history.length === 0 ? fresh[0] : ctx.pick(fresh)) : ctx.pick(pool.filter((i) => i !== history[history.length - 1]));
        history.push(i);
        if (history.length > Math.max(2, pool.length - 1)) history.shift();
        return i;
      }
      function loadPicture(first, forceIdx) {
        picStops.forEach((s) => s());
        picStops = [];
        buildPalette();
        if (card) {
          const old = card, oldT = tapes;
          old.style.pointerEvents = 'none';
          oldT.forEach((t) => t.remove());
          const a = old.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(-70%) rotate(-10deg) scale(.7)', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.5,0,.8,.5)', fill: 'forwards' });
          a.onfinish = () => old.remove();
        }
        if (nextBtn) { nextBtn.remove(); nextBtn = null; }
        picIdx = forceIdx != null ? forceIdx : choosePicture();
        pic = PICTURES[picIdx];
        const r = renderPicture(pic);
        regions = r.regions;
        painted = new Map();
        done = false; sugg = null; suggCount = 0; paintCount = 0;
        card = ctx.el('div', { class: 'pt-card in' });
        card.innerHTML = r.svg;
        svgEl = card.firstElementChild;
        tapes = [ctx.el('div', { class: 'pt-tape' }), ctx.el('div', { class: 'pt-tape' })];
        stage.append(card, ...tapes);
        placeCard();
        ctx.setPrompt(`Let's paint the ${pic.name}!`);
        ctx.say(first ? `Let's paint! ${pic.intro}` : `${pic.intro} Let's paint it!`);
      }

      /* ---------------- painting ---------------- */
      function regionEl(id) { return svgEl.querySelector(`.pt-reg[data-r="${id}"]`); }
      function findRegionAt(x, y) {
        const hit = (px, py) => {
          const el = document.elementFromPoint(px, py);
          const r = el && el.closest && el.closest('.pt-r');
          return r && card.contains(r) ? r : null;
        };
        let r = hit(x, y);
        if (r) return r;
        const step = L.S * 0.035;
        for (let ring = 1; ring <= 3; ring++) {
          for (let k = 0; k < 10; k++) {
            const a = (k / 10) * Math.PI * 2 + ring;
            r = hit(x + Math.cos(a) * step * ring, y + Math.sin(a) * step * ring);
            if (r) return r;
          }
        }
        return null;
      }
      function drops(x, y, c, n, scale) {
        const sr = stage.getBoundingClientRect();
        for (let k = 0; k < n; k++) {
          const s = U.rand(8, 18) * (scale || 1) * (L.S / 380 + 0.4);
          const d = U.el('div', { class: 'pt-drop', style: { left: x - sr.left + 'px', top: y - sr.top + 'px', width: s + 'px', height: s + 'px', background: c.hex,
            boxShadow: `inset -${s * 0.15}px -${s * 0.15}px 0 ${U.rgba(c.dark, 0.5)}` } });
          fxl.appendChild(d);
          const a = Math.random() * Math.PI * 2, dist = U.rand(30, 70) * (scale || 1) * (L.S / 380 + 0.3);
          d.animate([
            { transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
            { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist - 20}px)) scale(1)`, opacity: 1, offset: 0.5 },
            { transform: `translate(calc(-50% + ${Math.cos(a) * dist * 1.2}px), calc(-50% + ${Math.sin(a) * dist + 30}px)) scale(.3)`, opacity: 0 },
          ], { duration: U.rand(500, 700), easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => d.remove();
        }
      }
      function flood(regEl, c, x, y) {
        const r = regEl.querySelector('.pt-r');
        const fl = regEl.querySelector('.pt-flood');
        let p = { x: 200, y: 200 };
        try {
          const m = r.getScreenCTM().inverse();
          const pt = svgEl.createSVGPoint();
          pt.x = x; pt.y = y;
          p = pt.matrixTransform(m);
        } catch (e) {}
        const bb = r.getBBox();
        const far = Math.max(Math.hypot(bb.x - p.x, bb.y - p.y), Math.hypot(bb.x + bb.width - p.x, bb.y - p.y),
          Math.hypot(bb.x - p.x, bb.y + bb.height - p.y), Math.hypot(bb.x + bb.width - p.x, bb.y + bb.height - p.y));
        const Rf = far / 0.84 + 6;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const seed = Math.random() * 6;
        g.innerHTML = `<path d="${blobPath(Rf, seed)}" fill="${c.hex}"/>` +
          [0, 1, 2, 3].map((i) => { const a = seed + i * 1.6; return `<circle cx="${(Math.cos(a) * Rf * 0.98).toFixed(1)}" cy="${(Math.sin(a) * Rf * 0.98).toFixed(1)}" r="${(Rf * 0.16).toFixed(1)}" fill="${c.hex}"/>`; }).join('');
        fl.appendChild(g);
        const seq = (regEl._seq = (regEl._seq || 0) + 1);
        const t0 = performance.now(), dur = 430;
        // region "boing"
        const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
        ctx.raf(() => {
          const k = Math.min(1, (performance.now() - t0) / dur);
          const e = 1 - Math.pow(1 - k, 3);
          g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${Math.max(0.001, e).toFixed(3)})`);
          const s = 1 + Math.sin(Math.min(1, k * 1.4) * Math.PI) * 0.045;
          regEl.setAttribute('transform', `translate(${cx} ${cy}) scale(${s.toFixed(4)}) translate(${-cx} ${-cy})`);
          if (k >= 1) {
            regEl.removeAttribute('transform');
            if (regEl._seq === seq) {
              r.setAttribute('fill', c.hex);
              fl.innerHTML = '';
            }
            return false;
          }
        });
      }

      function paint(regEl, x, y) {
        const id = regEl.dataset.r;
        const reg = regions.find((q) => q.id === id);
        const c = current;
        const prev = painted.get(id);
        const r = regEl.querySelector('.pt-r');
        r.classList.remove('pt-hint');
        flood(regEl, c, x, y);
        drops(x, y, c, 6, 1);
        ctx.sfx('splat', { vel: 0.85 });
        const scale = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6'];
        ctx.play('marimba', scale[Math.min(scale.length - 1, painted.size + (prev ? 0 : 0))], { vel: 0.35, delay: 0.05 });
        painted.set(id, c.id);
        paintCount++;

        // a suggestion was waiting for this region?
        if (sugg && sugg.id === id) {
          const s = sugg;
          clearSuggestion();
          if (c.id === s.color.id) {
            const pt = { x, y };
            PP.fx.burst(pt.x, pt.y, { emoji: ['⭐', '🌟', '✨'], count: 8, distance: 110 });
            ctx.sfx('success');
            ctx.mascot.mood('cheer');
            ctx.success(true);
            ctx.say(`${ctx.praise()} ${an(c.name)} ${c.name} ${reg.name}!`);
          } else {
            ctx.mascot.mood('happy');
            ctx.say(`Ooh! ${an(c.name)} ${c.name} ${reg.name}!`);
          }
          lastSpoken = c.id;
        } else if (painted.size < regions.length) {
          // sometimes name the color (or color + thing); don't chatter on every tap
          const roll = Math.random();
          if (paintCount === 1 || (lastSpoken !== c.id && roll < 0.75)) {
            ctx.say(roll < 0.35 && paintCount > 1 ? `${U.cap(c.name)} ${reg.name}!` : `${U.cap(c.name)}!`, { mode: 'skip' });
            lastSpoken = c.id;
          } else if (roll < 0.18) {
            ctx.say(ctx.pick([`${U.cap(c.name)}!`, `${an(c.name)} ${c.name} ${reg.name}!`, 'Splat!', 'Pretty!']), { mode: 'skip' });
          }
        }

        if (!done && painted.size === regions.length) { complete(); return; }
        if (!done) maybeSuggest();
      }

      /* ---------------- suggestions (level ≥ 2) ---------------- */
      function maybeSuggest() {
        const lvl = ctx.level;
        if (lvl < 2 || sugg || done) return;
        if (suggCount >= (lvl >= 4 ? 2 : 1)) return;
        if (paintCount < 1 || regions.length - painted.size < 2) return;
        if (Math.random() > (lvl >= 4 ? 0.45 : 0.35)) return;
        const cand = regions.filter((q) => q.hint && !painted.has(q.id) && colors.find((c) => c.id === q.hint));
        if (!cand.length) return;
        const reg = ctx.pick(cand);
        const color = D.colorById(reg.hint);
        sugg = { id: reg.id, color, t: performance.now() };
        suggCount++;
        ctx.setTimeout(() => {
          if (!sugg || sugg.id !== reg.id) return;
          const text = `Let's make the ${reg.name} ${color.name}!`;
          ctx.setPrompt(text);
          ctx.say(text);
          ctx.mascot.mood('wave');
          showSuggestion();
        }, 900);
        sugg.timer = ctx.setTimeout(() => { if (sugg && sugg.id === reg.id) clearSuggestion(); }, 20000);
      }
      function showSuggestion() {
        if (!sugg) return;
        const re = regionEl(sugg.id);
        if (re) { const r = re.querySelector('.pt-r'); r.style.setProperty('--hl', sugg.color.light); r.classList.add('pt-hint'); }
        const p = pots.find((q) => q.dataset.c === sugg.color.id);
        if (p) p.classList.add('pt-suggest');
      }
      function clearSuggestion() {
        if (!sugg) return;
        const re = regionEl(sugg.id);
        if (re) re.querySelector('.pt-r').classList.remove('pt-hint');
        pots.forEach((p) => p.classList.remove('pt-suggest'));
        if (sugg.timer) ctx.clearTimeout(sugg.timer);
        sugg = null;
        ctx.setPrompt(done ? 'Tap the arrow!' : `Let's paint the ${pic.name}!`);
      }

      /* ---------------- finished picture ---------------- */
      async function complete() {
        done = true;
        clearSuggestion();
        svgEl.querySelectorAll('.pt-hint').forEach((e) => e.classList.remove('pt-hint'));
        ctx.success(true);
        const myCard = card;
        await ctx.wait(650);
        if (card !== myCard) return;
        const P = {
          part: (k) => svgEl.querySelector(`.pt-part[data-k="${k}"]`),
          sfx: (name, delay) => { const id = ctx.setTimeout(() => { if (card === myCard) ctx.sfx(name); }, delay || 0); picStops.push(() => ctx.clearTimeout(id)); },
          later: (ms, fn) => { const id = ctx.setTimeout(() => { if (card === myCard) fn(); }, ms); picStops.push(() => ctx.clearTimeout(id)); },
          every: (ms, fn) => { const id = ctx.setInterval(() => { if (card === myCard) fn(); }, ms); picStops.push(() => ctx.clearInterval(id)); },
        };
        try { pic.alive(P); } catch (e) { console.error(e); }
        ctx.mascot.mood('surprise');
        await ctx.wait(500);
        if (card !== myCard) return;
        const cr = card.getBoundingClientRect();
        const used = [...new Set(painted.values())].map((id) => D.colorById(id).hex);
        await ctx.celebrate({ big: true, x: cr.left + cr.width / 2, y: cr.top + cr.height * 0.4, colors: used.concat(['#FFE45C', '#fff']), say: `${ctx.praise()} ${pic.cheer}` });
        if (card !== myCard) return;
        ctx.setPrompt('Tap the arrow!');
        nextBtn = PP.kit.nextButton(ctx, () => { idleTalks = 0; loadPicture(false); }, { parent: stage, cls: 'pt-next pp-noripple' });
        nextBtn.style.animation = 'pp-popin .5s cubic-bezier(.3,1.6,.5,1) both, pp-pulse 1.3s ease-in-out .5s infinite';
        placeCard();
      }

      /* ---------------- touch ---------------- */
      ctx.on(stage, 'pointerdown', (e) => {
        if (e.button > 0) return;
        const t = e.target;
        if (!t || !t.closest || t.closest('.pt-pot, .pp-game-pip, .pp-next')) return;
        idleTalks = 0;
        e.preventDefault();
        if (card && (t === card || card.contains(t) || pointInCard(e.clientX, e.clientY, 0.06))) {
          const reg = findRegionAt(e.clientX, e.clientY);
          if (reg) { paint(reg.parentNode, e.clientX, e.clientY); return; }
          ctx.sfx('tap', { vel: 0.4 });
          return;
        }
        bgSplat(e.clientX, e.clientY);
      });
      function pointInCard(x, y, margin) {
        const r = card.getBoundingClientRect();
        const m = r.width * margin;
        return x > r.left - m && x < r.right + m && y > r.top - m && y < r.bottom + m;
      }
      function bgSplat(x, y) {
        const sr = stage.getBoundingClientRect();
        const s = U.clamp(L.S * 0.12, 36, 70);
        const el = U.el('div', { class: 'pt-bgsplat', style: { left: x - sr.left - s / 2 + 'px', top: y - sr.top - s / 2 + 'px', width: s + 'px', height: s + 'px' } });
        el.innerHTML = `<svg viewBox="-50 -50 100 100"><path d="${blobPath(34, Math.random() * 6)}" fill="${current.hex}" opacity=".85"/></svg>`;
        stage.appendChild(el);
        el.animate([{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1.1)', opacity: 1, offset: 0.25 }, { transform: 'scale(1)', opacity: 0.9, offset: 0.7 }, { transform: 'scale(1)', opacity: 0 }],
          { duration: 1400, easing: 'ease-out' }).onfinish = () => el.remove();
        ctx.sfx('splat', { vel: 0.35 });
      }

      ctx.idle(8000, () => {
        if (!card) return;
        idleTalks++;
        if (idleTalks > 3) return;
        if (done) {
          ctx.say(ctx.pick(['Tap the arrow!', 'More painting? Tap the arrow!']));
          if (nextBtn) PP.fx.glow(nextBtn, 3000);
          return;
        }
        if (sugg) {
          const reg = regions.find((q) => q.id === sugg.id);
          ctx.say(`Let's make the ${reg.name} ${sugg.color.name}!`);
          showSuggestion();
          return;
        }
        const un = regions.filter((q) => !painted.has(q.id));
        if (!un.length) return;
        const reg = ctx.pick(un);
        const re = regionEl(reg.id);
        if (re) {
          const r = re.querySelector('.pt-r');
          r.style.setProperty('--hl', current.light);
          r.classList.add('pt-hint');
          ctx.setTimeout(() => r.classList.remove('pt-hint'), 4000);
        }
        ctx.mascot.mood('wave');
        ctx.say(ctx.pick([`Tap the ${reg.name}!`, `Let's paint the ${reg.name}!`, 'Tap the picture to paint!']));
      });

      if (/[?&]ppdebug/.test(location.search)) {
        window.__pt = {
          PICTURES,
          show(i) { loadPicture(false, i); },
          fillAll() { svgEl.querySelectorAll('.pt-reg').forEach((g, k) => { current = colors[k % colors.length]; const b = g.querySelector('.pt-r').getBoundingClientRect(); paint(g, b.left + b.width / 2, b.top + b.height / 2); }); },
          fillOne() { const g = [...svgEl.querySelectorAll('.pt-reg')].find((g) => !painted.has(g.dataset.r)); if (g) { const b = g.querySelector('.pt-r').getBoundingClientRect(); paint(g, b.left + b.width / 2, b.top + b.height / 2); return g.dataset.r; } },
          get sugg() { return sugg; },
          select(id) { select(D.colorById(id), true); },
          regions: () => regions.map((r) => r.id),
        };
      }

      buildPalette();
      layout();
      loadPicture(true);

      return { destroy() { picStops.forEach((s) => s()); if (window.__pt) delete window.__pt; } };
    },
  });
})();
