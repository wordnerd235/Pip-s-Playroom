/* Drums — "Beat Buddy": six real percussion instruments, a dancing buddy, and a backing groove.
 *
 * Music skills: cause & effect, naming instruments, steady beat, tempo (slow turtle / fast rabbit), copying a rhythm.
 *   Level 1–2: tap anything; first tap names the instrument. Play ▶ starts a groove (~90 bpm), the buddy dances
 *              on the beat and the pads pulse. Tapping on the beat 4× in a row → "You're keeping the beat!".
 *   Level 3+:  now and then Pip plays a short pattern on one instrument ("Boom, boom!") — copy it (2 taps count).
 *   Level 4–5: copying needs the same number of hits; keeping the beat needs a longer streak.
 * All audio is scheduled on the audio clock (ctx.loop / at:), never setTimeout.
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;

  /* ======================= instruments ======================= */
  const PADS = [
    { id: 'bass', name: 'Bass drum', color: '#EF3B36', bg: '#FFE1DE', word: 'Boom!', call: 'Boom, boom!', pattern: [0, 1] },
    { id: 'snare', name: 'Snare drum', color: '#2F7BEA', bg: '#DCEAFF', word: 'Tap!', call: 'Tap, tap, tap!', pattern: [0, 0.5, 1] },
    { id: 'tamb', name: 'Tambourine', color: '#FF8C1A', bg: '#FFE8CF', word: 'Jingle!', call: 'Jingle, jingle!', pattern: [0, 1] },
    { id: 'maracas', name: 'Maracas', color: '#3DBE4B', bg: '#DDF6DF', word: 'Shake!', call: 'Shake, shake, shake!', pattern: [0, 0.5, 1] },
    { id: 'cymbal', name: 'Cymbal', color: '#E0A800', bg: '#FFF5CC', word: 'Crash!', call: 'Crash, crash!', pattern: [0, 1] },
    { id: 'block', name: 'Wood block', color: '#8E4FD6', bg: '#EEE2FF', word: 'Tok!', call: 'Tok, tok, tok!', pattern: [0, 0.5, 1] },
  ];

  const ART = {
    bass: `
      <path d="M58 168 L42 194 M142 168 L158 194" stroke="#8A93A3" stroke-width="9" stroke-linecap="round"/>
      <circle cx="100" cy="98" r="86" fill="#B5221F"/>
      <circle cx="100" cy="92" r="86" fill="#EF3B36"/>
      ${[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((a) => `<rect x="95" y="4" width="10" height="16" rx="4" fill="#E3E8F0" stroke="#9AA5B5" stroke-width="2" transform="rotate(${a} 100 92)"/>`).join('')}
      <circle cx="100" cy="92" r="72" fill="#D5DCE6"/>
      <g class="bd-head"><circle cx="100" cy="92" r="66" fill="#FFF8EC"/>
        <circle cx="100" cy="92" r="34" fill="#FFE07A"/>
        <path d="M100 66 L107 84 L126 84 L111 96 L117 115 L100 103 L83 115 L89 96 L74 84 L93 84 Z" fill="#FF8C1A" stroke="#FF8C1A" stroke-width="4" stroke-linejoin="round"/>
      </g>
      <ellipse cx="68" cy="52" rx="24" ry="11" fill="#fff" opacity=".55" transform="rotate(-35 68 52)"/>`,
    snare: `
      <ellipse cx="100" cy="152" rx="80" ry="27" fill="#1B54AB"/>
      <rect x="20" y="78" width="160" height="74" fill="#2F7BEA"/>
      <rect x="32" y="84" width="12" height="62" rx="6" fill="#fff" opacity=".28"/>
      <path d="M26 92 L48 142 L70 92 L92 142 L114 92 L136 142 L158 92 L176 136" stroke="#F4F7FB" stroke-width="5" fill="none" stroke-linejoin="round" opacity=".95"/>
      <ellipse cx="100" cy="150" rx="80" ry="27" fill="none" stroke="#C9D2DE" stroke-width="6"/>
      <ellipse cx="100" cy="78" rx="80" ry="27" fill="#C9D2DE"/>
      <g class="bd-head"><ellipse cx="100" cy="76" rx="71" ry="22" fill="#fff"/><ellipse cx="78" cy="70" rx="26" ry="6" fill="#EEF2F8"/></g>
      <g class="bd-sticks">
        <line x1="34" y1="22" x2="116" y2="66" stroke="#B57A3C" stroke-width="10" stroke-linecap="round"/>
        <line x1="34" y1="22" x2="116" y2="66" stroke="#E8B26A" stroke-width="5" stroke-linecap="round"/>
        <line x1="168" y1="22" x2="86" y2="66" stroke="#B57A3C" stroke-width="10" stroke-linecap="round"/>
        <line x1="168" y1="22" x2="86" y2="66" stroke="#E8B26A" stroke-width="5" stroke-linecap="round"/>
      </g>`,
    tamb: `
      <circle cx="100" cy="104" r="84" fill="#A85F1E"/>
      <circle cx="100" cy="100" r="84" fill="#F2A54A"/>
      <circle cx="100" cy="100" r="76" fill="#FFC774"/>
      <circle cx="100" cy="100" r="62" fill="#FFF4DC" stroke="#E9C88E" stroke-width="3"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<circle cx="${100 + 40 * Math.cos(k * Math.PI / 4)}" cy="${100 + 40 * Math.sin(k * Math.PI / 4)}" r="7" fill="${['#FF5D73', '#14B8AE'][k % 2]}" opacity=".85"/>`).join('')}
      <circle cx="100" cy="100" r="14" fill="#FF5D73" opacity=".85"/>
      <g class="bd-zils">${[30, 90, 150, 210, 270, 330].map((a) => `<g transform="rotate(${a} 100 100)"><rect x="83" y="10" width="34" height="22" rx="6" fill="#7A4518"/><ellipse cx="100" cy="21" rx="15" ry="8" fill="#EEF2F7" stroke="#8E99AA" stroke-width="2.5"/><ellipse cx="96" cy="19" rx="5" ry="2.4" fill="#fff"/></g>`).join('')}</g>
      <ellipse cx="66" cy="58" rx="18" ry="8" fill="#fff" opacity=".5" transform="rotate(-40 66 58)"/>`,
    maracas: `
      <g class="bd-mar1"><g transform="rotate(-24 100 178)">
        <rect x="91" y="98" width="18" height="86" rx="9" fill="#9C5F27"/><rect x="95" y="104" width="5" height="72" rx="2.5" fill="#fff" opacity=".3"/>
        <ellipse cx="100" cy="66" rx="42" ry="48" fill="#FF8C1A"/>
        <path d="M60 58 Q100 78 140 58" stroke="#FFE07A" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M64 86 Q100 104 136 86" stroke="#FF5D73" stroke-width="8" fill="none" stroke-linecap="round"/>
        <circle cx="86" cy="36" r="5" fill="#fff"/><circle cx="110" cy="32" r="5" fill="#fff"/><circle cx="124" cy="44" r="4" fill="#fff"/>
        <ellipse cx="80" cy="44" rx="12" ry="7" fill="#fff" opacity=".45" transform="rotate(-30 80 44)"/></g></g>
      <g class="bd-mar2"><g transform="rotate(24 100 178)">
        <rect x="91" y="98" width="18" height="86" rx="9" fill="#9C5F27"/><rect x="95" y="104" width="5" height="72" rx="2.5" fill="#fff" opacity=".3"/>
        <ellipse cx="100" cy="66" rx="42" ry="48" fill="#3DBE4B"/>
        <path d="M60 58 Q100 78 140 58" stroke="#FF6FB5" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M64 86 Q100 104 136 86" stroke="#FFE07A" stroke-width="8" fill="none" stroke-linecap="round"/>
        <circle cx="90" cy="34" r="5" fill="#fff"/><circle cx="114" cy="36" r="5" fill="#fff"/><circle cx="76" cy="50" r="4" fill="#fff"/>
        <ellipse cx="80" cy="44" rx="12" ry="7" fill="#fff" opacity=".45" transform="rotate(-30 80 44)"/></g></g>`,
    cymbal: `
      <path d="M100 96 L100 176" stroke="#7D8696" stroke-width="9" stroke-linecap="round"/>
      <path d="M100 168 L62 194 M100 168 L138 194 M100 168 L100 196" stroke="#7D8696" stroke-width="8" stroke-linecap="round"/>
      <g class="bd-cym">
        <ellipse cx="100" cy="94" rx="92" ry="30" fill="#B98A0E"/>
        <ellipse cx="100" cy="88" rx="92" ry="30" fill="#F7C934"/>
        <ellipse cx="100" cy="88" rx="70" ry="22" fill="none" stroke="#E2AA10" stroke-width="3"/>
        <ellipse cx="100" cy="88" rx="46" ry="14" fill="none" stroke="#E2AA10" stroke-width="3"/>
        <ellipse cx="100" cy="82" rx="22" ry="10" fill="#E8B518"/>
        <ellipse cx="100" cy="79" rx="13" ry="5" fill="#F7D35C"/>
        <circle cx="100" cy="76" r="5" fill="#7D8696"/>
        <ellipse cx="56" cy="80" rx="28" ry="7" fill="#fff" opacity=".6" transform="rotate(-8 56 80)"/>
      </g>`,
    block: `
      <g class="bd-blk">
        <rect x="24" y="72" width="152" height="94" rx="32" fill="#7A4317"/>
        <rect x="24" y="62" width="152" height="94" rx="32" fill="#C98146"/>
        <path d="M24 98 Q24 62 58 62 H142 Q176 62 176 98 Z" fill="#DE9C5F"/>
        <path d="M44 84 Q84 74 120 84 T166 80" stroke="#B9702F" stroke-width="3" fill="none" opacity=".7"/>
        <path d="M40 140 Q80 132 116 140 T164 138" stroke="#A9612A" stroke-width="3" fill="none" opacity=".6"/>
        <rect x="46" y="110" width="108" height="15" rx="7.5" fill="#5E300E"/>
        <ellipse cx="60" cy="74" rx="16" ry="5" fill="#fff" opacity=".4"/>
      </g>
      <g class="bd-mallet"><line x1="132" y1="12" x2="178" y2="48" stroke="#B57A3C" stroke-width="9" stroke-linecap="round"/><line x1="132" y1="12" x2="178" y2="48" stroke="#E8B26A" stroke-width="4.5" stroke-linecap="round"/><circle cx="126" cy="8" r="12" fill="#FF5D73"/><circle cx="122" cy="4" r="4" fill="#fff" opacity=".7"/></g>`,
  };

  const BUDDY = `
  <svg class="bd-buddy-svg" viewBox="0 0 200 224" aria-hidden="true">
    <defs><radialGradient id="bd-body-g" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#8BEAF5"/><stop offset=".55" stop-color="#3EC6D8"/><stop offset="1" stop-color="#1E9FB8"/></radialGradient></defs>
    <ellipse class="bd-shadow" cx="100" cy="212" rx="58" ry="9" fill="rgba(80,30,60,.18)"/>
    <g class="bd-bod">
      <g class="bd-foot bd-foot-l"><ellipse cx="72" cy="200" rx="22" ry="12" fill="#1B8AA0"/><ellipse cx="66" cy="196" rx="9" ry="4" fill="#fff" opacity=".3"/></g>
      <g class="bd-foot bd-foot-r"><ellipse cx="128" cy="200" rx="22" ry="12" fill="#1B8AA0"/><ellipse cx="122" cy="196" rx="9" ry="4" fill="#fff" opacity=".3"/></g>
      <g class="bd-arm bd-arm-l"><path d="M44 132 Q22 142 18 166" stroke="#2DB4C8" stroke-width="17" fill="none" stroke-linecap="round"/><circle cx="18" cy="168" r="11" fill="#2DB4C8"/></g>
      <g class="bd-arm bd-arm-r"><path d="M156 132 Q178 142 182 166" stroke="#2DB4C8" stroke-width="17" fill="none" stroke-linecap="round"/><circle cx="182" cy="168" r="11" fill="#2DB4C8"/></g>
      <g class="bd-tuft"><path d="M100 58 C 96 40, 82 34, 78 22" stroke="#1E9FB8" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M102 58 C 104 38, 112 30, 122 26" stroke="#1E9FB8" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M100 58 C 100 42, 98 30, 100 14" stroke="#2DB4C8" stroke-width="8" fill="none" stroke-linecap="round"/></g>
      <ellipse cx="100" cy="128" rx="68" ry="74" fill="url(#bd-body-g)"/>
      <ellipse cx="100" cy="160" rx="42" ry="34" fill="#C9F6FA" opacity=".85"/>
      <ellipse cx="74" cy="82" rx="18" ry="9" fill="#fff" opacity=".35" transform="rotate(-28 74 82)"/>
      <path d="M40 118 Q100 30 160 118" stroke="#E2457A" stroke-width="13" fill="none" stroke-linecap="round"/>
      <path d="M40 118 Q100 30 160 118" stroke="#FF6F9C" stroke-width="7" fill="none" stroke-linecap="round"/>
      <rect x="24" y="100" width="28" height="44" rx="13" fill="#FF6F9C" stroke="#E2457A" stroke-width="4"/>
      <rect x="148" y="100" width="28" height="44" rx="13" fill="#FF6F9C" stroke="#E2457A" stroke-width="4"/>
      <ellipse cx="34" cy="112" rx="4" ry="8" fill="#fff" opacity=".55"/><ellipse cx="158" cy="112" rx="4" ry="8" fill="#fff" opacity=".55"/>
      <g class="bd-eyes">
        <g class="bd-eye"><ellipse cx="78" cy="110" rx="15" ry="18" fill="#fff"/><g class="bd-pupil"><circle cx="80" cy="113" r="9.5" fill="#2B2340"/><circle cx="84" cy="108" r="3.4" fill="#fff"/></g></g>
        <g class="bd-eye"><ellipse cx="122" cy="110" rx="15" ry="18" fill="#fff"/><g class="bd-pupil"><circle cx="124" cy="113" r="9.5" fill="#2B2340"/><circle cx="128" cy="108" r="3.4" fill="#fff"/></g></g>
      </g>
      <path class="bd-happy" d="M64 112 Q78 98 92 112 M108 112 Q122 98 136 112" stroke="#2B2340" stroke-width="6" fill="none" stroke-linecap="round"/>
      <ellipse cx="60" cy="134" rx="11" ry="7" fill="#FF6F86" opacity=".45"/><ellipse cx="140" cy="134" rx="11" ry="7" fill="#FF6F86" opacity=".45"/>
      <path class="bd-mouth" d="M84 140 Q100 166 116 140 Z" fill="#7A2B32" stroke="#5A2A1A" stroke-width="3" stroke-linejoin="round"/>
      <ellipse class="bd-mouth" cx="100" cy="153" rx="8" ry="4" fill="#FF8C9A"/>
    </g>
  </svg>`;

  const STICK = `<svg viewBox="0 0 120 120" aria-hidden="true"><line x1="22" y1="22" x2="108" y2="108" stroke="#B57A3C" stroke-width="13" stroke-linecap="round"/><line x1="22" y1="22" x2="108" y2="108" stroke="#E8B26A" stroke-width="7" stroke-linecap="round"/><circle cx="18" cy="18" r="10" fill="#F6D7A7" stroke="#B57A3C" stroke-width="3"/></svg>`;
  const PLAY = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M36 24 L76 50 L36 76 Z" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></svg>`;
  const PAUSE = `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="28" y="24" width="16" height="52" rx="6" fill="#fff"/><rect x="56" y="24" width="16" height="52" rx="6" fill="#fff"/></svg>`;

  /* ======================= backing groove (C | F | G | C, eighth-note steps) ======================= */
  const BASS = [
    'C2', null, 'C3', null, 'G2', null, 'C3', null,
    'F2', null, 'F3', null, 'C3', null, 'F3', null,
    'G2', null, 'G3', null, 'D3', null, 'G3', null,
    'C2', null, 'C3', null, 'G2', null, 'B2', null,
  ];
  const CH = { C: ['E4', 'G4', 'C5'], F: ['F4', 'A4', 'C5'], G: ['D4', 'G4', 'B4'] };
  const KEYS = [].concat(...['C', 'F', 'G', 'C'].map((c) => [null, null, null, CH[c], null, null, null, CH[c]]));
  const TEMPO = { slow: 70, mid: 90, fast: 130 };

  U.addStyles('drums', `
    .g-drums { background: radial-gradient(120% 95% at 50% 18%, #FFF6D2 0%, #FFE0C2 50%, #FFC6D4 100%); }
    .bd-floor { position: absolute; left: 0; right: 0; bottom: 0; pointer-events: none; background: linear-gradient(#F6B98E, #E99A72); border-top: 6px solid #FFD2AE; }
    .bd-confetti { position: absolute; inset: 0; pointer-events: none; }
    .bd-confetti i { position: absolute; width: 12px; height: 12px; border-radius: 50%; opacity: .35; }
    .bd-spot { position: absolute; pointer-events: none; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.9) 0%, rgba(255,247,200,.55) 38%, rgba(255,240,180,0) 70%); }
    .bd-buddy { position: absolute; z-index: 3; }
    .bd-buddy-svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .bd-buddy-svg g { transform-box: view-box; }
    .bd-bod { transform-origin: 100px 210px; animation: bd-breathe 2.6s ease-in-out infinite; }
    .bd-shadow { transform-box: view-box; transform-origin: 100px 212px; }
    .bd-arm-l { transform-origin: 46px 132px; transition: transform .16s ease-out; }
    .bd-arm-r { transform-origin: 154px 132px; transition: transform .16s ease-out; }
    .bd-foot-l { transform-origin: 72px 200px; transition: transform .12s ease-out; }
    .bd-foot-r { transform-origin: 128px 200px; transition: transform .12s ease-out; }
    .bd-tuft { transform-origin: 100px 60px; }
    .bd-eye { transform-origin: 100px 110px; }
    .bd-pupil { transition: transform .2s ease-out; }
    .bd-happy { display: none; }
    .bd-buddy.happy .bd-eyes { display: none; }
    .bd-buddy.happy .bd-happy { display: inline; }
    .bd-buddy.blink .bd-eye { transform: scaleY(.1); }
    @keyframes bd-breathe { 0%, 100% { transform: scale(1, 1) } 50% { transform: scale(1.025, .975) } }
    .bd-dots { position: absolute; z-index: 4; display: flex; gap: 8px; justify-content: center; pointer-events: none; transition: opacity .3s; }
    .bd-dot { width: var(--ds); height: var(--ds); border-radius: 50%; background: rgba(255,255,255,.65); box-shadow: inset 0 -3px 0 rgba(0,0,0,.08); transition: background .15s, transform .15s; }
    .bd-dot.on { background: #FFD21F; box-shadow: 0 0 12px 3px rgba(255, 210, 31, .8); transform: scale(1.25); }
    .bd-pad { position: absolute; z-index: 2; border-radius: 50%; }
    .bd-pad-in { position: absolute; inset: 0; transform-origin: 50% 60%; }
    .bd-plate { position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle at 38% 30%, #fff 0%, var(--bg) 46%, var(--bg2) 100%);
      border: 5px solid rgba(255,255,255,.95); box-shadow: 0 7px 0 var(--sh), 0 14px 22px rgba(120, 40, 60, .16); }
    .bd-pad svg { position: absolute; left: 9%; top: 8%; width: 82%; height: 82%; overflow: visible; }
    .bd-pad svg g { transform-box: view-box; }
    .bd-head { transform-origin: 100px 92px; }
    .bd-sticks { transform-origin: 100px 60px; }
    .bd-zils { transform-origin: 100px 100px; }
    .bd-mar1, .bd-mar2 { transform-origin: 100px 178px; }
    .bd-cym { transform-origin: 100px 90px; }
    .bd-blk { transform-origin: 100px 160px; }
    .bd-mallet { transform-origin: 178px 48px; }
    .bd-ring { position: absolute; left: 50%; top: 50%; width: 100%; height: 100%; border-radius: 50%; border: 7px solid var(--c); pointer-events: none; opacity: 0; }
    .bd-pad.callme .bd-plate { animation: bd-callme .8s ease-in-out infinite; }
    @keyframes bd-callme { 0%, 100% { box-shadow: 0 7px 0 var(--sh), 0 0 0 6px rgba(255, 214, 0, .95), 0 0 26px 10px rgba(255, 214, 0, .6) } 50% { box-shadow: 0 7px 0 var(--sh), 0 0 0 14px rgba(255, 214, 0, .7), 0 0 46px 18px rgba(255, 214, 0, .5) } }
    .bd-btn { position: absolute; z-index: 6; border-radius: 50%; display: grid; place-items: center; background: #fff; border: 4px solid var(--c);
      box-shadow: 0 6px 0 var(--d), 0 10px 18px rgba(90, 30, 40, .18); transition: transform .12s, background .25s; }
    .bd-btn .pp-emoji { font-size: calc(var(--s) * .52); pointer-events: none; }
    .bd-btn svg { width: 52%; height: 52%; pointer-events: none; }
    .bd-btn.pressed { transform: translateY(4px) scale(.95); }
    .bd-btn.on { background: var(--l); border-width: 6px; }
    .bd-btn.on .pp-emoji { animation: bd-wobble var(--wob, .6s) ease-in-out infinite alternate; }
    @keyframes bd-wobble { from { transform: rotate(-10deg) translateY(0) } to { transform: rotate(10deg) translateY(-4px) } }
    .bd-play { --c: #fff; --d: #1F7F33; background: radial-gradient(circle at 35% 30%, #7BE087, #3DBE4B 60%, #24913A); }
    .bd-play.on { --d: #C93460; background: radial-gradient(circle at 35% 30%, #FF9AC0, #F2557F 60%, #C93460); }
    .bd-play.invite { animation: pp-pulse 1.2s ease-in-out infinite; }
    .bd-play svg { margin-left: 6%; }
    .bd-play.on svg { margin-left: 0; }
    .bd-stick { position: absolute; z-index: 7; pointer-events: none; opacity: 0; transition: opacity .2s; transform-origin: 85% 85%; }
    .bd-stick.on { opacity: 1; }
    .bd-stick svg { width: 100%; height: 100%; display: block; filter: drop-shadow(0 5px 4px rgba(60, 20, 40, .25)); }
    .bd-fx { position: absolute; inset: 0; pointer-events: none; z-index: 8; overflow: hidden; }
  `);

  /* ======================= game ======================= */
  PP.registerGame({
    id: 'drums',
    title: 'Drums',
    domain: 'music',
    icon: '🥁',
    tileColor: '#FF8A3D',
    order: 51,
    create(stage, ctx) {
      const probe = ctx.el('div', { style: { position: 'absolute', visibility: 'hidden', pointerEvents: 'none', paddingTop: 'var(--safe-t)', paddingRight: 'var(--safe-r)', paddingBottom: 'var(--safe-b)', paddingLeft: 'var(--safe-l)' } });
      const floor = ctx.el('div', { class: 'bd-floor' });
      const conf = ctx.el('div', { class: 'bd-confetti' });
      for (let i = 0; i < 14; i++) conf.appendChild(ctx.el('i', { style: { left: ctx.rand(2, 98) + '%', top: ctx.rand(4, 70) + '%', background: ctx.pick(['#FF6FB5', '#FFD21F', '#4D96FF', '#6BCB77', '#FF8C1A', '#B276F5']), transform: `scale(${ctx.rand(0.6, 1.4)})` } }));
      const spot = ctx.el('div', { class: 'bd-spot' });
      const buddy = ctx.el('div', { class: 'bd-buddy', html: BUDDY });
      const dots = ctx.el('div', { class: 'bd-dots', style: { opacity: 0 } });
      const fx = ctx.el('div', { class: 'bd-fx' });
      const stick = ctx.el('div', { class: 'bd-stick', html: STICK });
      stage.append(probe, floor, conf, spot, buddy, dots);

      const q = (s) => buddy.querySelector(s);
      const B = { bod: q('.bd-bod'), armL: q('.bd-arm-l'), armR: q('.bd-arm-r'), footL: q('.bd-foot-l'), footR: q('.bd-foot-r'), tuft: q('.bd-tuft'), shadow: q('.bd-shadow'), pupils: buddy.querySelectorAll('.bd-pupil') };

      const pads = PADS.map((def, i) => {
        const el = ctx.el('div', { class: 'bd-pad', 'data-pad': def.id, 'aria-label': def.name, style: { '--bg': def.bg, '--bg2': U.shade(def.bg, -0.1), '--sh': U.shade(def.bg, -0.28), '--c': def.color } });
        const inner = ctx.el('div', { class: 'bd-pad-in' });
        inner.appendChild(ctx.el('div', { class: 'bd-plate' }));
        inner.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 200 200" aria-hidden="true">${ART[def.id]}</svg>`);
        el.appendChild(inner);
        stage.appendChild(el);
        const P = { def, i, el, inner, plate: inner.firstChild, svg: inner.querySelector('svg'), x: 0, y: 0, s: 0, lastWord: 0 };
        ctx.tap(el, (e) => hitPad(P, { user: true }), { cooldown: 70 });
        return P;
      });

      const mkBtn = (cls, label, html, c, d, l) => {
        const b = ctx.el('button', { class: 'bd-btn pp-noripple ' + cls, 'aria-label': label, html, style: { '--c': c, '--d': d, '--l': l } });
        stage.appendChild(b);
        return b;
      };
      const playBtn = mkBtn('bd-play invite', 'Play music', PLAY);
      const turtleBtn = mkBtn('bd-turtle', 'Slow', '<span class="pp-emoji">🐢</span>', '#3DBE4B', '#23873A', '#DDF6DF');
      const rabbitBtn = mkBtn('bd-rabbit', 'Fast', '<span class="pp-emoji">🐇</span>', '#FF8C1A', '#D3660A', '#FFE8CF');
      turtleBtn.style.setProperty('--wob', '1.1s');
      rabbitBtn.style.setProperty('--wob', '.22s');
      stage.append(stick, fx);

      /* ---------------- state ---------------- */
      let groove = null;
      let tempo = 'mid';
      let beatCount = 0;
      const named = new Set();
      let lastTalk = 0;
      let streak = 0, lastBeatHit = null, lastBeatTap = -1, lastBeatPraise = -1e9;
      let call = null, lastCallEnd = performance.now(), tapsSinceCall = 0;
      let idleN = 0, idleSince = performance.now();
      let geo = { pip: 110 };

      /* ---------------- layout ---------------- */
      function insets() {
        const cs = getComputedStyle(probe);
        return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
      }
      function put(el, x, y, w, h) { Object.assign(el.style, { left: Math.round(x) + 'px', top: Math.round(y) + 'px', width: Math.round(w) + 'px', height: Math.round(h == null ? w : h) + 'px' }); }
      function putBtn(b, x, y, s) { put(b, x, y, s); b.style.setProperty('--s', s + 'px'); }
      function layout() {
        const { w, h } = ctx.size();
        if (!w || !h) return;
        const S = insets();
        const m = Math.round(U.clamp(Math.min(w, h) * 0.025, 10, 22));
        const L = S.l + m, R = w - S.r - m, T = S.t + m, Bm = h - S.b - m;
        const W = R - L, H = Bm - T;
        const ar = w / h;
        const gap = Math.round(U.clamp(Math.min(w, h) * 0.022, 10, 22));
        const pb = Math.round(U.clamp(Math.min(w, h) * 0.2, 84, 128)); // play button
        const tb = Math.round(U.clamp(Math.min(w, h) * 0.15, 72, 104)); // tempo buttons
        let region; // where the buddy goes
        if (ar >= 1.65) {
          // phone landscape: one row of six pads along the floor
          const slot = W / 6;
          const ps = Math.round(Math.min(slot - gap, H * 0.4, 230));
          const py = Bm - ps;
          pads.forEach((P, i) => setPad(P, L + slot * i + (slot - ps) / 2, py, ps));
          floor.style.height = h - (py + ps * 0.45) + 'px';
          const top = T, bot = py - gap;
          const cy = (top + bot) / 2;
          const dh = Math.min(bot - top, W * 0.34);
          region = { cx: w / 2, top, h: dh };
          const dw = dh * 200 / 224;
          putBtn(playBtn, w / 2 - dw / 2 - gap * 2 - pb, cy - pb / 2, pb);
          const tx = w / 2 + dw / 2 + gap * 2;
          if (bot - top >= tb * 2 + gap) {
            putBtn(rabbitBtn, tx, cy - tb - gap / 2, tb);
            putBtn(turtleBtn, tx, cy + gap / 2, tb);
          } else {
            putBtn(turtleBtn, tx, cy - tb / 2, tb);
            putBtn(rabbitBtn, tx + tb + gap, cy - tb / 2, tb);
          }
        } else if (ar > 1) {
          // tablet landscape: three pads down each side, buddy in the middle
          const top0 = Math.max(T, S.t + 100);
          const ps = Math.round(Math.min((Bm - top0 - 2 * gap) / 3, W * 0.22, 250));
          const colH = 3 * ps + 2 * gap;
          const y0 = top0 + (Bm - top0 - colH) / 2;
          pads.forEach((P, i) => {
            const col = i % 2, row = Math.floor(i / 2);
            const x = col === 0 ? L + (row === 1 ? ps * 0.12 : 0) : R - ps - (row === 1 ? ps * 0.12 : 0);
            setPad(P, x, y0 + row * (ps + gap), ps);
          });
          floor.style.height = h * 0.16 + 'px';
          const cL = L + ps * 1.12 + gap, cR = R - ps * 1.12 - gap;
          const cw = cR - cL;
          const rowY = Bm - pb;
          const rowW = tb * 2 + pb + gap * 4;
          const rx = cL + (cw - rowW) / 2;
          putBtn(turtleBtn, rx, rowY + (pb - tb) / 2, tb);
          putBtn(playBtn, rx + tb + gap * 2, rowY, pb);
          putBtn(rabbitBtn, rx + tb + pb + gap * 4, rowY + (pb - tb) / 2, tb);
          const dh = Math.min(rowY - gap - T, cw * 0.95 * 224 / 200);
          region = { cx: w / 2, top: T, h: dh };
        } else {
          // portrait: buddy on top, controls, then a grid of pads
          const cols = W < 600 ? 2 : 3, rows = 6 / cols;
          const ps = Math.round(Math.min((W - (cols - 1) * gap * 1.6) / cols, (H * (cols === 2 ? 0.54 : 0.47) - (rows - 1) * gap) / rows, 250));
          const gw = cols * ps + (cols - 1) * gap * 1.6;
          const gh = rows * ps + (rows - 1) * gap;
          const gx = L + (W - gw) / 2, gy = Bm - gh;
          pads.forEach((P, i) => setPad(P, gx + (i % cols) * (ps + gap * 1.6), gy + Math.floor(i / cols) * (ps + gap), ps));
          floor.style.height = h - (gy + ps * 0.4) + 'px';
          const rowY = gy - gap * 1.4 - pb;
          const rowW = tb * 2 + pb + gap * 4;
          const rx = L + (W - rowW) / 2;
          putBtn(turtleBtn, rx, rowY + (pb - tb) / 2, tb);
          putBtn(playBtn, rx + tb + gap * 2, rowY, pb);
          putBtn(rabbitBtn, rx + tb + pb + gap * 4, rowY + (pb - tb) / 2, tb);
          const dh = Math.min(rowY - gap - T, W * 0.72 * 224 / 200);
          region = { cx: w / 2, top: T, h: dh };
        }
        // buddy + beat dots + spotlight
        const dotS = Math.round(U.clamp(region.h * 0.07, 12, 22));
        const dh = region.h - dotS - 8;
        const dw = dh * 200 / 224;
        put(buddy, region.cx - dw / 2, region.top + dotS + 8, dw, dh);
        dots.style.setProperty('--ds', dotS + 'px');
        put(dots, region.cx - dw / 2, region.top, dw, dotS);
        const sp = dh * 1.25;
        put(spot, region.cx - sp / 2, region.top + dotS + 8 + dh / 2 - sp / 2, sp);
        geo = { pip: Math.round(U.clamp(Math.min(w, h) * 0.2, 84, 150)), w, h, buddy: { x: region.cx - dw / 2, y: region.top + dotS + 8, w: dw, h: dh } };
        if (call && call.pip) placePip(call.pad);
      }
      function setPad(P, x, y, s) {
        put(P.el, x, y, s);
        P.x = x + s / 2; P.y = y + s / 2; P.s = s;
      }

      /* ---------------- sounds ---------------- */
      function sound(P, vel, at) {
        const pan = U.clamp((P.x / (geo.w || 1)) * 2 - 1, -1, 1) * 0.5;
        const o = (v, extra) => Object.assign({ vel: v * vel, pan }, at ? { at } : null, extra || null);
        const t = at || ctx.audio.now() + 0.005;
        switch (P.def.id) {
          case 'bass': ctx.drum('kick', o(0.85)); ctx.drum('tom', o(0.32, { pitch: 92 })); break;
          case 'snare': ctx.drum('snare', o(0.55)); ctx.drum('tom', o(0.14, { pitch: 220 })); break;
          case 'tamb': ctx.drum('tamb', o(0.75)); break;
          case 'maracas': ctx.drum('shaker', o(0.8)); ctx.drum('shaker', Object.assign(o(0.5), { at: t + 0.075 })); break;
          case 'cymbal': ctx.drum('cymbal', o(0.42)); break;
          case 'block': ctx.drum('woodblock', o(0.75)); break;
        }
      }

      /* ---------------- visuals ---------------- */
      const ANIM = {
        bass: (P) => {
          P.inner.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.1, .88)', offset: 0.18 }, { transform: 'scale(.97, 1.04)', offset: 0.5 }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
          anim(P, '.bd-head', [{ transform: 'scale(1)' }, { transform: 'scale(.9)', offset: 0.15 }, { transform: 'scale(1.04)', offset: 0.45 }, { transform: 'scale(1)' }], 380);
        },
        snare: (P) => {
          P.inner.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-5px,2px)', offset: 0.15 }, { transform: 'translate(5px,-1px)', offset: 0.35 }, { transform: 'translate(-3px,1px)', offset: 0.6 }, { transform: 'translate(0,0)' }], { duration: 300 });
          anim(P, '.bd-sticks', [{ transform: 'translateY(0)' }, { transform: 'translateY(14px)', offset: 0.2 }, { transform: 'translateY(-8px)', offset: 0.55 }, { transform: 'translateY(0)' }], 360);
        },
        tamb: (P) => {
          P.inner.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-14deg)', offset: 0.18 }, { transform: 'rotate(10deg)', offset: 0.42 }, { transform: 'rotate(-5deg)', offset: 0.7 }, { transform: 'rotate(0)' }], { duration: 480, easing: 'ease-out' });
          anim(P, '.bd-zils', [{ transform: 'rotate(0)' }, { transform: 'rotate(6deg)', offset: 0.25 }, { transform: 'rotate(-6deg)', offset: 0.55 }, { transform: 'rotate(0)' }], 420);
        },
        maracas: (P) => {
          anim(P, '.bd-mar1', [{ transform: 'rotate(0)' }, { transform: 'rotate(-14deg)', offset: 0.2 }, { transform: 'rotate(10deg)', offset: 0.45 }, { transform: 'rotate(-6deg)', offset: 0.7 }, { transform: 'rotate(0)' }], 360);
          anim(P, '.bd-mar2', [{ transform: 'rotate(0)' }, { transform: 'rotate(14deg)', offset: 0.2 }, { transform: 'rotate(-10deg)', offset: 0.45 }, { transform: 'rotate(6deg)', offset: 0.7 }, { transform: 'rotate(0)' }], 360);
          P.inner.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)', offset: 0.3 }, { transform: 'translateY(0)' }], { duration: 300 });
        },
        cymbal: (P) => {
          anim(P, '.bd-cym', [{ transform: 'rotate(0)' }, { transform: 'rotate(-9deg) scaleY(.85)', offset: 0.12 }, { transform: 'rotate(7deg)', offset: 0.32 }, { transform: 'rotate(-5deg)', offset: 0.52 }, { transform: 'rotate(3deg)', offset: 0.72 }, { transform: 'rotate(0)' }], 1000);
        },
        block: (P) => {
          anim(P, '.bd-blk', [{ transform: 'scale(1)' }, { transform: 'scale(1.08, .86)', offset: 0.2 }, { transform: 'scale(.97, 1.05)', offset: 0.5 }, { transform: 'scale(1)' }], 260);
          anim(P, '.bd-mallet', [{ transform: 'rotate(0)' }, { transform: 'rotate(-22deg)', offset: 0.25 }, { transform: 'rotate(0)' }], 260);
        },
      };
      function anim(P, sel, kf, dur) {
        const e = P.svg.querySelector(sel);
        if (e) e.animate(kf, { duration: dur, easing: 'ease-out' });
      }
      let liveFx = 0;
      function rings(P) {
        for (let k = 0; k < 2; k++) {
          if (liveFx > 30) return;
          liveFx++;
          const r = ctx.el('div', { class: 'bd-ring' });
          P.el.appendChild(r);
          const a = r.animate([
            { transform: 'translate(-50%,-50%) scale(.75)', opacity: 0.85 },
            { transform: `translate(-50%,-50%) scale(${1.45 + k * 0.25})`, opacity: 0 },
          ], { duration: 560 + k * 120, delay: k * 90, easing: 'cubic-bezier(.2,.7,.3,1)' });
          a.onfinish = () => { r.remove(); liveFx--; };
        }
      }
      function hitVisual(P, quiet) {
        ANIM[P.def.id](P);
        rings(P);
        const now = performance.now();
        if (!quiet && now - P.lastWord > 420) {
          P.lastWord = now;
          PP.fx.floatText(P.x + ctx.rand(-P.s * 0.2, P.s * 0.2), P.y - P.s * 0.42, P.def.word, { color: P.def.color, size: Math.round(U.clamp(P.s * 0.2, 26, 50)), duration: 900 });
        }
      }

      /* ---------------- the buddy ---------------- */
      function look(x) {
        const r = buddy.getBoundingClientRect();
        const dx = U.clamp((x - (r.left + r.width / 2)) / 120, -1, 1) * 5;
        B.pupils.forEach((p) => { p.style.transform = `translateX(${dx}px)`; });
      }
      function react(P) {
        look(P.x);
        if (groove) return;
        B.bod.animate([{ transform: 'translateY(0) scale(1.05,.94)' }, { transform: 'translateY(-14px) scale(.97,1.04)', offset: 0.4 }, { transform: 'translateY(0)' }], { duration: 330, easing: 'ease-out' });
        const arm = P.x < (geo.w || 0) / 2 ? B.armL : B.armR;
        const deg = arm === B.armL ? 70 : -70;
        arm.style.transform = `rotate(${deg}deg)`;
        ctx.setTimeout(() => { if (!groove) arm.style.transform = ''; }, 260);
      }
      function danceBeat(n, bd) {
        const dur = Math.max(200, bd * 1000) * 1.08;
        const move = Math.floor(n / 8) % 3;
        const side = n % 2 ? 1 : -1;
        if (move === 0) {
          B.bod.animate([{ transform: 'translateY(0) scale(1.06,.92)' }, { transform: `translateY(-16px) scale(.97,1.04) rotate(${side * 4}deg)`, offset: 0.42 }, { transform: 'translateY(0) scale(1,1)' }], { duration: dur, easing: 'ease-out' });
          B.armL.style.transform = side < 0 ? 'rotate(115deg)' : 'rotate(10deg)';
          B.armR.style.transform = side > 0 ? 'rotate(-115deg)' : 'rotate(-10deg)';
          B.footL.style.transform = side < 0 ? 'translateY(-9px)' : '';
          B.footR.style.transform = side > 0 ? 'translateY(-9px)' : '';
        } else if (move === 1) {
          B.bod.animate([{ transform: `translateX(${-side * 10}px) rotate(${-side * 7}deg)` }, { transform: `translateX(${side * 12}px) translateY(-6px) rotate(${side * 8}deg)`, offset: 0.55 }, { transform: `translateX(${side * 10}px) rotate(${side * 7}deg)` }], { duration: dur, easing: 'ease-in-out', fill: 'none' });
          B.armL.style.transform = `rotate(${side > 0 ? 60 : 30}deg)`;
          B.armR.style.transform = `rotate(${side > 0 ? -30 : -60}deg)`;
          B.footL.style.transform = side > 0 ? 'translateY(-6px)' : '';
          B.footR.style.transform = side < 0 ? 'translateY(-6px)' : '';
        } else {
          const big = n % 4 === 0;
          B.bod.animate([{ transform: 'translateY(0) scale(1.1,.88)' }, { transform: `translateY(${big ? -30 : -12}px) scale(.95,1.06)`, offset: 0.45 }, { transform: 'translateY(0) scale(1,1)' }], { duration: dur, easing: 'ease-out' });
          B.armL.style.transform = big ? 'rotate(140deg)' : 'rotate(40deg)';
          B.armR.style.transform = big ? 'rotate(-140deg)' : 'rotate(-40deg)';
          B.footL.style.transform = B.footR.style.transform = big ? 'translateY(-4px)' : '';
        }
        B.tuft.animate([{ transform: 'rotate(0)' }, { transform: `rotate(${side * 16}deg)`, offset: 0.5 }, { transform: 'rotate(0)' }], { duration: dur * 1.1, delay: 40 });
        B.shadow.animate([{ transform: 'scale(1)' }, { transform: 'scale(.82)', offset: 0.42 }, { transform: 'scale(1)' }], { duration: dur });
        spot.animate([{ opacity: 1, transform: 'scale(1.06)' }, { opacity: 0.7, transform: 'scale(1)' }], { duration: dur, easing: 'ease-out' });
      }
      function restPose() {
        [B.armL, B.armR, B.footL, B.footR].forEach((e) => { e.style.transform = ''; });
      }
      function cheer() {
        buddy.classList.add('happy');
        B.armL.style.transform = 'rotate(150deg)';
        B.armR.style.transform = 'rotate(-150deg)';
        B.bod.animate([{ transform: 'translateY(0) scale(1.1,.88)' }, { transform: 'translateY(-46px) scale(.94,1.08) rotate(-8deg)', offset: 0.4 }, { transform: 'translateY(-16px) rotate(6deg)', offset: 0.7 }, { transform: 'translateY(0)' }], { duration: 750, iterations: 2, easing: 'ease-out' });
        ctx.setTimeout(() => { buddy.classList.remove('happy'); if (!groove) restPose(); }, 1500);
      }
      ctx.setInterval(() => {
        buddy.classList.add('blink');
        ctx.setTimeout(() => buddy.classList.remove('blink'), 130);
      }, 3400);
      ctx.tap(buddy, (e) => {
        cheer();
        ctx.sfx('boing', { vel: 0.5 });
        if (!groove) startGroove();
      });

      /* ---------------- pads ---------------- */
      function hitPad(P, o) {
        o = o || {};
        const user = !!o.user;
        if (user) { idleN = 0; idleSince = performance.now(); tapsSinceCall++; }
        sound(P, o.vel || 1, o.at);
        hitVisual(P, o.quiet);
        if (!user) return;
        react(P);
        playBtn.classList.remove('invite');
        // name it the first time, then only now and then
        const now = performance.now();
        if (!named.has(P.def.id) && !(call && call.phase === 'demo')) {
          named.add(P.def.id);
          lastTalk = now;
          ctx.say(P.def.name + '!');
        } else if (now - lastTalk > 12000 && Math.random() < 0.12 && !call) {
          lastTalk = now;
          ctx.say(P.def.name + '!', { mode: 'skip' });
        }
        if (groove) checkBeat(ctx.audio.now());
        if (call && call.phase === 'turn') callTap(P);
      }

      /* ---------------- groove ---------------- */
      function startGroove(t) {
        if (t) tempo = t;
        if (groove) { groove.setBpm(TEMPO[tempo]); updateTempoBtns(); return; }
        beatCount = 0;
        streak = 0; lastBeatHit = null;
        groove = ctx.loop({
          bpm: TEMPO[tempo],
          steps: 32,
          stepsPerBeat: 2,
          vel: 0.5,
          tracks: {
            kick: [0.9, 0, 0, 0, 0.6, 0, 0, 0],
            hat: [0.55, 0.85, 0.5, 0.85, 0.55, 0.85, 0.5, 0.85],
          },
          notes: {
            bass: { inst: 'bass', seq: BASS, vel: 0.5, len: 1.7 },
            keys: { inst: 'marimba', seq: KEYS, vel: 0.2, len: 1 },
          },
          onStep(s, when) {
            if (s % 2) return;
            const bd = groove ? groove.beatDur() : 60 / TEMPO[tempo];
            danceBeat(beatCount++, bd);
            pads.forEach((P) => {
              if (call && call.pad === P) return;
              P.plate.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.07)', offset: 0.2 }, { transform: 'scale(1)' }], { duration: Math.min(320, bd * 700), easing: 'ease-out' });
            });
          },
        });
        playBtn.classList.add('on');
        playBtn.classList.remove('invite');
        playBtn.innerHTML = PAUSE;
        dots.style.opacity = 1;
        updateDots();
        updateTempoBtns();
        buddy.querySelector('.bd-bod').style.animation = 'none';
      }
      function stopGroove() {
        if (!groove) return;
        groove.stop();
        groove = null;
        playBtn.classList.remove('on');
        playBtn.innerHTML = PLAY;
        dots.style.opacity = 0;
        restPose();
        buddy.querySelector('.bd-bod').style.animation = '';
        updateTempoBtns();
      }
      function updateTempoBtns() {
        turtleBtn.classList.toggle('on', tempo === 'slow');
        rabbitBtn.classList.toggle('on', tempo === 'fast');
      }
      function press(b) { idleSince = performance.now(); b.classList.add('pressed'); ctx.setTimeout(() => b.classList.remove('pressed'), 140); }
      ctx.tap(playBtn, () => {
        press(playBtn);
        idleN = 0;
        if (groove) { stopGroove(); ctx.sfx('slidedown', { vel: 0.35 }); return; }
        startGroove();
        if (!named.has('_dance')) { named.add('_dance'); ctx.say("Let's dance!"); }
      });
      ctx.tap(turtleBtn, () => {
        press(turtleBtn);
        idleN = 0;
        const next = tempo === 'slow' && groove ? 'mid' : 'slow';
        if (next === 'slow') ctx.say('Slow…', { rate: 0.55, pitch: 0.85 });
        else ctx.sfx('pop', { vel: 0.4 });
        startGroove(next);
      });
      ctx.tap(rabbitBtn, () => {
        press(rabbitBtn);
        idleN = 0;
        const next = tempo === 'fast' && groove ? 'mid' : 'fast';
        if (next === 'fast') ctx.say('Fast!', { rate: 1.45, pitch: 1.4 });
        else ctx.sfx('pop', { vel: 0.4 });
        startGroove(next);
      });

      /* ---------------- steady beat ---------------- */
      function needBeats() { return [4, 4, 4, 5, 6, 8][ctx.level] || 4; }
      function updateDots() {
        const n = needBeats();
        while (dots.children.length < n) dots.appendChild(ctx.el('div', { class: 'bd-dot' }));
        while (dots.children.length > n) dots.lastChild.remove();
        [...dots.children].forEach((d, i) => d.classList.toggle('on', i < streak));
      }
      function checkBeat(now) {
        if (!groove) return;
        const ac = ctx.audio.ctx;
        const lat = ac ? Math.min(0.08, ac.outputLatency || ac.baseLatency || 0) : 0;
        if (now - lastBeatTap < 0.12) return; // second hand of a two-handed whack
        lastBeatTap = now;
        const t = now - lat;
        const bd = groove.beatDur(), bt = groove.beatTime();
        let best = bt, err = Infinity;
        [bt - 2 * bd, bt - bd, bt, bt + bd].forEach((c) => { const e = Math.abs(t - c); if (e < err) { err = e; best = c; } });
        const win = ctx.level >= 5 ? 0.11 : 0.13;
        if (err <= win) {
          if (lastBeatHit != null && Math.abs(best - lastBeatHit) < bd * 0.3) return; // same beat
          const g = lastBeatHit == null ? 0 : (best - lastBeatHit) / bd;
          streak = lastBeatHit != null && g > 0.6 && g < 2.4 ? streak + 1 : 1;
          lastBeatHit = best;
          const d = dots.children[Math.min(streak, dots.children.length) - 1];
          if (d) d.animate([{ transform: 'scale(1.8)' }, { transform: 'scale(1.25)' }], { duration: 250, easing: 'ease-out' });
          updateDots();
          if (streak >= needBeats()) beatReward();
        } else {
          streak = 0;
          lastBeatHit = null;
          updateDots();
        }
      }
      function beatReward() {
        const now = performance.now();
        streak = 0;
        lastBeatHit = null;
        if (now - lastBeatPraise < 22000 || call) { ctx.setTimeout(updateDots, 300); return; }
        lastBeatPraise = now;
        const r = buddy.getBoundingClientRect();
        ctx.sfx('sparkle', { vel: 0.6 });
        PP.fx.burst(r.left + r.width / 2, r.top + r.height * 0.3, { emoji: ['✨', '⭐', '🌟'], count: 10, distance: Math.max(110, r.width * 0.7) });
        cheer();
        ctx.success(true);
        ctx.celebrate({ x: r.left + r.width / 2, y: r.top + r.height * 0.4, say: "You're keeping the beat!", sound: false });
        ctx.setTimeout(updateDots, 400);
      }

      /* ---------------- call & response (level 3+) ---------------- */
      function placePip(P) {
        // Pip hops in beside the buddy, on the side of the instrument it's about to play
        const el = ctx.mascot.el;
        if (!el || !geo.buddy) return;
        const s = geo.pip, b = geo.buddy;
        el.style.width = el.style.height = s + 'px';
        const left = P.x < geo.w / 2;
        let x = left ? b.x + b.w * 0.12 - s * 0.6 : b.x + b.w * 0.88 - s * 0.4;
        let y = b.y + b.h - s * 0.92;
        x = U.clamp(x, 6, geo.w - s - 6);
        y = U.clamp(y, 6, geo.h - s - 6);
        if (x < 104 && y < 104) y = 104;
        Object.assign(el.style, { left: x + 'px', top: y + 'px', right: 'auto', bottom: 'auto' });
      }
      function showPip(P) {
        const m = ctx.mascot.show({ corner: 'none', size: geo.pip + 'px' });
        m.el.dataset.corner = 'none';
        placePip(P);
        m.el.animate([{ transform: 'scale(0) translateY(40px)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
        ctx.mascot.mood('wave');
      }
      function hidePip() {
        const el = ctx.mascot.el;
        if (!el || el.style.display === 'none') return;
        const a = el.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0) translateY(40px)', opacity: 0 }], { duration: 300, easing: 'ease-in' });
        a.onfinish = () => { if (!call) ctx.mascot.hide(); };
      }
      function placeStick(P) {
        const s = P.s * 0.55;
        put(stick, P.x - s * 0.08, P.y - s * 0.95, s);
      }
      /** schedule the pattern on the audio clock (locked to the groove's beat when it's playing) */
      function demoPattern(c) {
        const P = c.pad, pat = c.pattern;
        const now = ctx.audio.now();
        let t0, unit;
        if (groove) {
          unit = groove.beatDur();
          t0 = groove.beatTime();
          while (t0 < now + 0.3) t0 += unit;
        } else {
          unit = 0.5;
          t0 = now + 0.3;
        }
        placeStick(P);
        stick.classList.add('on');
        pat.forEach((p) => {
          const when = t0 + p * unit;
          sound(P, 0.95, when);
          ctx.setTimeout(() => {
            if (call !== c) return;
            hitVisual(P);
            stick.animate([{ transform: 'rotate(-30deg)' }, { transform: 'rotate(4deg)', offset: 0.3 }, { transform: 'rotate(-30deg)' }], { duration: 260, easing: 'ease-out' });
            ctx.mascot.mood('happy');
          }, Math.max(0, (when - now) * 1000));
        });
        const end = t0 + pat[pat.length - 1] * unit + 0.35;
        return ctx.wait(Math.max(0, (end - now) * 1000)).then(() => stick.classList.remove('on'));
      }
      async function startCall() {
        const lvl = ctx.level;
        const P = ctx.pick(pads.filter((p) => named.has(p.def.id)).concat(pads.slice(0, 1)));
        let pattern = P.def.pattern;
        if (lvl >= 5 && Math.random() < 0.5) pattern = pattern.length === 2 ? [0, 1, 1.5] : [0, 0.5, 1, 2];
        const c = { pad: P, pattern, need: lvl >= 4 ? pattern.length : 2, got: 0, others: 0, tries: 0, phase: 'demo', pip: true };
        call = c;
        showPip(P);
        ctx.setPrompt('Your turn!');
        await ctx.say('Listen!');
        if (call !== c) return;
        await demoRound(c);
      }
      async function demoRound(c) {
        c.phase = 'demo';
        c.got = 0;
        c.pad.el.classList.remove('callme');
        const said = ctx.say(c.pad.def.call);
        await Promise.all([demoPattern(c), said]);
        if (call !== c) return;
        c.phase = 'turn';
        c.turnAt = performance.now();
        c.pad.el.classList.add('callme');
        ctx.mascot.mood('wave');
        ctx.say('Your turn!');
      }
      function callTap(P) {
        const c = call;
        if (P !== c.pad) { c.others++; return; }
        c.got++;
        c.turnAt = performance.now();
        if (c.got >= c.need) {
          c.phase = 'done';
          endCall(true);
        }
      }
      async function endCall(ok) {
        const c = call;
        if (!c) return;
        c.pad.el.classList.remove('callme');
        stick.classList.remove('on');
        if (ok) {
          ctx.success(c.tries === 0 && c.others <= 2);
          cheer();
          ctx.mascot.mood('cheer');
          await ctx.celebrate({ x: c.pad.x, y: c.pad.y, say: ctx.pick(['You did it!', 'Just like me!', 'Great copying!', 'Yay! Same!']), sound: 'sparkle' });
        } else {
          ctx.mascot.mood('wave');
          ctx.say("Let's play!");
          await ctx.wait(900);
        }
        if (call !== c) return;
        call = null;
        hidePip();
        lastCallEnd = performance.now();
        tapsSinceCall = 0;
        ctx.setPrompt('Tap the drums!');
      }
      ctx.setInterval(() => {
        const now = performance.now();
        if (call) {
          // child's turn: gentle re-demo once, then let it go
          if (call.phase === 'turn' && now - call.turnAt > 7500 && !PP.speech.speaking()) {
            if (call.tries < 1) { call.tries++; ctx.say('Listen again!').then(() => { if (call && call.phase === 'turn') demoRound(call); }); call.turnAt = now + 4000; }
            else { if (call.got === 0) ctx.miss(); endCall(false); }
          }
          return;
        }
        if (ctx.level < 3 || PP.speech.speaking() || PP.app.overlayPromise) return;
        const gapMs = ctx.level >= 4 ? 20000 : 28000;
        if (now - lastCallEnd > gapMs && tapsSinceCall >= 8 && now - idleSince < 6000) startCall();
      }, 1000);

      /* ---------------- idle ---------------- */
      ctx.idle(8000, () => {
        if (call) return;
        idleN++;
        if (groove && performance.now() - idleSince > 45000) { stopGroove(); return; }
        if (idleN > 5) return;
        if (groove) {
          ctx.say(ctx.pick(['Tap along!', 'Boom, boom! Tap along!']));
          pads.forEach((P, k) => ctx.setTimeout(() => P.inner.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 380 }), k * 80));
        } else if (idleN % 2 === 1) {
          const P = ctx.pick(pads);
          ctx.say(`Tap the ${P.def.name.toLowerCase()}!`);
          P.el.classList.add('callme');
          ctx.setTimeout(() => { if (!call || call.pad !== P) P.el.classList.remove('callme'); }, 2600);
        } else {
          ctx.say('Press play!');
          playBtn.classList.add('invite');
        }
      });

      /* ---------------- go ---------------- */
      stage.__bd = { state: () => ({ groove: !!groove, tempo, streak, call: call && { pad: call.pad.def.id, phase: call.phase, got: call.got, need: call.need }, named: [...named], bpm: groove && groove.bpm }), startCall: () => startCall(), pads: () => pads.map((P) => ({ id: P.def.id, x: P.x, y: P.y, s: P.s })), loop: () => groove };
      layout();
      ctx.onResize(layout);
      ctx.setPrompt('Tap the drums!');
      ctx.setTimeout(() => ctx.say('Tap the drums!'), 450);
      return { destroy() { if (groove) groove.stop(); } };
    },
  });
})();
