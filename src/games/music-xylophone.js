/* Xylophone — tap the rainbow bars, then "play" real nursery songs in magic mode.
 *
 * Music skills: cause & effect, high (short bars) vs low (long bars), and the melody + rhythm of real tunes.
 *   Level 1: short song versions, ANY tap plays the next note (glow + mallet show where it comes from).
 *   Level 2: full songs, any tap plays the next note.
 *   Level 3: tap the glowing bar (a mallet points at it); other bars just play softly — no penalty.
 *   Level 4: glow only.
 *   Level 5: the glow appears only after a short pause (play it from memory / by ear).
 * A soft piano + bass accompaniment (correct harmony) follows every melody note.
 * "Listen" plays the whole song (melody + oom-pah accompaniment) while a mallet strikes the bars.
 * Happy Birthday is played in F, so — like a real Orff xylophone — the B bar is swapped for a B-flat bar.
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;

  /* ======================= the instrument ======================= */
  const BARS = [
    { n: 'C4', letter: 'C', color: '#EF3B36', word: 'red' },
    { n: 'D4', letter: 'D', color: '#FF8C1A', word: 'orange' },
    { n: 'E4', letter: 'E', color: '#FFC81A', word: 'yellow' },
    { n: 'F4', letter: 'F', color: '#3DBE4B', word: 'green' },
    { n: 'G4', letter: 'G', color: '#14B8AE', word: 'teal' },
    { n: 'A4', letter: 'A', color: '#2F7BEA', word: 'blue' },
    { n: 'B4', letter: 'B', color: '#8E4FD6', word: 'purple' },
    { n: 'C5', letter: 'C', color: '#FF4D8D', word: 'pink' },
  ];
  const B_FLAT = { n: 'Bb4', letter: 'B♭', color: '#6A4FE3', word: 'purple' };
  // Real bars shrink ~1/sqrt(f); exaggerate a little so "short = high" is obvious.
  const barLen = (note) => Math.pow(2, -((PP.audio.midi(note) - 60) / 12) * 0.62);
  const barIndexFor = (n) => (n === 'Bb4' ? 6 : BARS.findIndex((b) => b.n === n));

  /* ======================= harmony ======================= */
  // Close voicings below the melody (E3..C4) + a bass line kept between F2 and E3.
  const CHORDS = {
    C: { bass: 'C3', b5: 'G2', v: ['E3', 'G3', 'C4'] },
    F: { bass: 'F2', b5: 'C3', v: ['F3', 'A3', 'C4'] },
    G: { bass: 'G2', b5: 'D3', v: ['D3', 'G3', 'B3'] },
    G7: { bass: 'G2', b5: 'D3', v: ['D3', 'F3', 'B3'] },
    C7: { bass: 'C3', b5: 'G2', v: ['E3', 'G3', 'Bb3'] },
    F7: { bass: 'F2', b5: 'C3', v: ['Eb3', 'A3', 'C4'] },
    Bb: { bass: 'Bb2', b5: 'F2', v: ['D3', 'F3', 'Bb3'] },
    D7: { bass: 'D3', b5: 'A2', v: ['F#3', 'A3', 'C4'] },
  };
  const BAR_BEATS = { '4/4': 4, '3/4': 3, '6/8': 3 }; // in quarter-note beats
  // accompaniment pattern for "Listen": oom-pah / oom-pah-pah / compound-time lilt
  const GRID = {
    '4/4': [[0, 'bass'], [1, 'chord'], [2, 'bass5'], [3, 'chord']],
    '3/4': [[0, 'bass'], [1, 'chord'], [2, 'chord']],
    '6/8': [[0, 'bass'], [1, 'chord'], [1.5, 'bass5'], [2.5, 'chord']],
  };
  const STRONG = { '4/4': [0, 2], '3/4': [0], '6/8': [0, 1.5] };
  const WEAK = { '4/4': [1, 3], '3/4': [1, 2], '6/8': [] };

  /* ======================= songs (public domain) =======================
   * NOTE:beats[@CHORD]  — beats are quarter notes; '|' is a bar line (ignored, but checked in tests).
   * Chords carry forward until the next @CHORD. */
  function parseSong(src) {
    const out = [];
    let t = 0, chord = null;
    src.trim().split(/\s+/).forEach((tok) => {
      if (tok === '|') return;
      const m = /^([A-G][b#]?\d):([\d.]+)(?:@(\w+))?$/.exec(tok);
      if (!m) throw new Error('xylophone: bad token ' + tok);
      if (m[3]) chord = m[3];
      const ev = { n: m[1], d: parseFloat(m[2]), t, chord, change: !!m[3] };
      out.push(ev);
      t += ev.d;
    });
    return out;
  }
  const SONGS = [
    {
      id: 'twinkle', icon: '⭐', tint: '#FFC93C', title: 'Twinkle, Twinkle, Little Star', name: 'Twinkle Twinkle',
      meter: '4/4', bpm: 96, pickup: 0, short: 14,
      src: `C4:1@C C4:1 G4:1 G4:1 | A4:1@F A4:1 G4:2@C | F4:1@F F4:1 E4:1@C E4:1 | D4:1@G D4:1 C4:2@C |
            G4:1@C G4:1 F4:1@G7 F4:1 | E4:1@C E4:1 D4:2@G | G4:1@C G4:1 F4:1@G7 F4:1 | E4:1@C E4:1 D4:2@G |
            C4:1@C C4:1 G4:1 G4:1 | A4:1@F A4:1 G4:2@C | F4:1@F F4:1 E4:1@C E4:1 | D4:1@G D4:1 C4:2@C`,
    },
    {
      id: 'mary', icon: '🐑', tint: '#9AD0FF', title: 'Mary Had a Little Lamb', name: 'Mary Had a Little Lamb',
      meter: '4/4', bpm: 108, pickup: 0,
      src: `E4:1@C D4:1 C4:1 D4:1 | E4:1 E4:1 E4:2 | D4:1@G D4:1 D4:2 | E4:1@C G4:1 G4:2 |
            E4:1 D4:1 C4:1 D4:1 | E4:1 E4:1 E4:1 E4:1 | D4:1@G D4:1 E4:1 D4:1 | C4:4@C`,
    },
    {
      id: 'buns', icon: '🍞', tint: '#F4B26B', title: 'Hot Cross Buns', name: 'Hot Cross Buns',
      meter: '4/4', bpm: 96, pickup: 0,
      src: `E4:1@C D4:1 C4:2 | E4:1 D4:1 C4:2 | C4:.5 C4:.5 C4:.5 C4:.5 D4:.5@G D4:.5 D4:.5 D4:.5 |
            E4:1@C D4:1@G7 C4:2@C`,
    },
    {
      id: 'row', icon: '⛵', tint: '#5CC8FF', title: 'Row, Row, Row Your Boat', name: 'Row Your Boat',
      meter: '6/8', bpm: 100, pickup: 0,
      src: `C4:1.5@C C4:1.5 | C4:1 D4:.5 E4:1.5 | E4:1 D4:.5 E4:1 F4:.5 | G4:3 |
            C5:.5 C5:.5 C5:.5 G4:.5 G4:.5 G4:.5 | E4:.5 E4:.5 E4:.5 C4:.5 C4:.5 C4:.5 |
            G4:1@G7 F4:.5 E4:1 D4:.5 | C4:3@C`,
    },
    {
      id: 'bridge', icon: '🌉', tint: '#B79CFF', title: 'London Bridge', name: 'London Bridge',
      meter: '4/4', bpm: 108, pickup: 0,
      src: `G4:1.5@C A4:.5 G4:1 F4:1 | E4:1 F4:1 G4:2 | D4:1@G7 E4:1 F4:2 | E4:1@C F4:1 G4:2 |
            G4:1.5 A4:.5 G4:1 F4:1 | E4:1 F4:1 G4:2 | D4:2@G7 G4:2 | E4:1@C C4:3`,
    },
    {
      id: 'farm', icon: '🐮', tint: '#8EDB7E', title: 'Old MacDonald Had a Farm', name: 'Old MacDonald',
      meter: '4/4', bpm: 116, pickup: 0, short: 12,
      src: `F4:1@F F4:1 F4:1 C4:1 | D4:1@Bb D4:1 C4:2@F | A4:1@F A4:1 G4:1@C7 G4:1 | F4:3@F C4:1 |
            F4:1 F4:1 F4:1 C4:1 | D4:1@Bb D4:1 C4:2@F | A4:1@F A4:1 G4:1@C7 G4:1 | F4:3@F C4:.5 C4:.5 |
            F4:1 F4:1 F4:1 C4:.5 C4:.5 | F4:1 F4:1 F4:2 | F4:.5 F4:.5 F4:1 F4:.5 F4:.5 F4:1 |
            F4:.5 F4:.5 F4:.5 F4:.5 F4:1 F4:1 |
            F4:1 F4:1 F4:1 C4:1 | D4:1@Bb D4:1 C4:2@F | A4:1@F A4:1 G4:1@C7 G4:1 | F4:4@F`,
    },
    {
      id: 'bells', icon: '🔔', tint: '#FFD95A', title: 'Jingle Bells', name: 'Jingle Bells',
      meter: '4/4', bpm: 116, pickup: 0, short: 11,
      src: `E4:1@C E4:1 E4:2 | E4:1 E4:1 E4:2 | E4:1 G4:1 C4:1.5 D4:.5 | E4:4 |
            F4:1@F F4:1 F4:1.5 F4:.5 | F4:1@C E4:1 E4:1 E4:.5 E4:.5 | E4:1@D7 D4:1 D4:1 E4:1 | D4:2@G7 G4:2 |
            E4:1@C E4:1 E4:2 | E4:1 E4:1 E4:2 | E4:1 G4:1 C4:1.5 D4:.5 | E4:4 |
            F4:1@F F4:1 F4:1.5 F4:.5 | F4:1@C E4:1 E4:1 E4:.5 E4:.5 | G4:1@G7 G4:1 F4:1 D4:1 | C4:4@C`,
    },
    {
      id: 'birthday', icon: '🎂', tint: '#FF9EC7', title: 'Happy Birthday', name: 'Happy Birthday',
      meter: '3/4', bpm: 96, pickup: 1,
      src: `C4:.75 C4:.25 | D4:1@F C4:1 F4:1 | E4:2@C7 C4:.75 C4:.25 | D4:1@C7 C4:1 G4:1 | F4:2@F C4:.75 C4:.25 |
            C5:1@F7 A4:1 F4:1 | E4:1@Bb D4:1 Bb4:.75 Bb4:.25 | A4:1@F F4:1 G4:1@C7 | F4:3@F`,
    },
  ];
  SONGS.forEach((s) => {
    s.notes = parseSong(s.src);
    s.flat = s.notes.some((e) => e.n === 'Bb4');
    s.key = s.notes[s.notes.length - 1].n; // tonic (every song ends on its tonic)
  });
  /** the version of a song for this level (level 1 gets the first phrase only, where marked) */
  function versionFor(song, level) {
    if (!(level <= 1 && song.short)) return song.notes;
    const list = song.notes.slice(0, song.short).map((e) => Object.assign({}, e));
    const last = list[list.length - 1];
    const bb = BAR_BEATS[song.meter];
    const end = last.t + last.d - song.pickup;
    last.d += (Math.ceil(end / bb - 1e-6) * bb) - end; // let the last note fill its bar
    return list;
  }
  function chordAt(list, beat) {
    let c = null;
    for (const e of list) { if (e.t <= beat + 1e-6) c = e.chord; else break; }
    return c;
  }

  /* ======================= look-ahead timeline (stoppable, sample-accurate) ======================= */
  function timeline(ctx, items, opts) {
    opts = opts || {};
    items = items.slice().sort((a, b) => a.t - b.t);
    const A = ctx.audio;
    const useAudio = A.isRunning();
    const p0 = performance.now(), a0 = A.now();
    const clock = () => (useAudio ? A.now() : a0 + (performance.now() - p0) / 1000);
    const start = clock() + (opts.lead == null ? 0.1 : opts.lead);
    const total = opts.total != null ? opts.total : items.length ? items[items.length - 1].t : 0;
    let i = 0, stopped = false, iv = 0, endTimer = 0, resolve;
    const vis = new Set();
    const done = new Promise((r) => (resolve = r));
    function finish(ok) {
      if (stopped) return;
      stopped = true;
      if (iv) ctx.clearInterval(iv);
      if (endTimer) ctx.clearTimeout(endTimer);
      vis.forEach((id) => ctx.clearTimeout(id));
      resolve(ok);
    }
    function pump() {
      if (stopped) return;
      const now = clock();
      while (i < items.length && start + items[i].t < now + 0.16) {
        const it = items[i++];
        const when = Math.max(start + it.t, now);
        if (it.a && useAudio) { try { it.a(when); } catch (e) { console.error(e); } }
        if (it.v) {
          const id = ctx.setTimeout(() => { vis.delete(id); if (!stopped) it.v(when); }, Math.max(0, (when - clock()) * 1000));
          vis.add(id);
        }
      }
      if (i >= items.length && !endTimer) {
        ctx.clearInterval(iv);
        iv = 0;
        endTimer = ctx.setTimeout(() => finish(true), Math.max(0, (start + total - clock()) * 1000));
      }
    }
    iv = ctx.setInterval(pump, 25);
    pump();
    return { start, done, stop: () => finish(false), get stopped() { return stopped; } };
  }

  /* ======================= art ======================= */
  const ICON = `<svg viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(-10 50 54)">
    <path d="M6 33 L94 41" stroke="#8C5428" stroke-width="7" stroke-linecap="round"/><path d="M6 75 L94 66" stroke="#8C5428" stroke-width="7" stroke-linecap="round"/>
    ${BARS.map((b, i) => { const L = 62 * barLen(b.n); const x = 7 + i * 11; return `<rect x="${x}" y="${(54 - L / 2).toFixed(1)}" width="9" height="${L.toFixed(1)}" rx="3.5" fill="${b.color}" stroke="${U.shade(b.color, -0.3)}" stroke-width="1.2"/><rect x="${x + 2}" y="${(57 - L / 2).toFixed(1)}" width="2.2" height="${(L - 8).toFixed(1)}" rx="1.1" fill="#fff" opacity=".45"/>`; }).join('')}
    </g><path d="M58 96 L84 62" stroke="#E8B26A" stroke-width="5" stroke-linecap="round"/><circle cx="86" cy="59" r="8.5" fill="#FF5D73" stroke="#C93450" stroke-width="2"/><circle cx="83.5" cy="56.5" r="2.6" fill="#fff" opacity=".7"/></svg>`;

  function barSVG(b, w, h, vertical) {
    const t = vertical ? w : h;
    const sd = Math.max(4, Math.round(t * 0.09));
    const fh = h - sd;
    const r = Math.round(t * 0.26);
    const dark = U.shade(b.color, -0.3);
    const pr = Math.max(4, t * 0.085);
    const pegs = vertical ? [[w / 2, fh * 0.224], [w / 2, fh * 0.776]] : [[w * 0.224, fh / 2], [w * 0.776, fh / 2]];
    const gloss = vertical
      ? `<rect x="${t * 0.15}" y="${t * 0.2}" width="${t * 0.17}" height="${Math.max(0, fh - t * 0.4)}" rx="${t * 0.085}" fill="#fff" opacity=".38"/>`
      : `<rect x="${t * 0.2}" y="${t * 0.14}" width="${Math.max(0, w - t * 0.4)}" height="${t * 0.16}" rx="${t * 0.08}" fill="#fff" opacity=".38"/>`;
    const shade = vertical
      ? `<rect x="${w * 0.7}" y="${t * 0.12}" width="${w * 0.18}" height="${Math.max(0, fh - t * 0.24)}" rx="${t * 0.08}" fill="#000" opacity=".07"/>`
      : `<rect x="${t * 0.12}" y="${fh * 0.7}" width="${Math.max(0, w - t * 0.24)}" height="${fh * 0.18}" rx="${t * 0.08}" fill="#000" opacity=".07"/>`;
    const fs = Math.round(t * 0.34);
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
      <rect x="0" y="${sd}" width="${w}" height="${fh}" rx="${r}" fill="${dark}"/>
      <rect x="0" y="0" width="${w}" height="${fh}" rx="${r}" fill="${b.color}"/>
      ${shade}${gloss}
      ${pegs.map(([x, y]) => `<circle cx="${x}" cy="${y + pr * 0.25}" r="${pr}" fill="rgba(0,0,0,.18)"/><circle cx="${x}" cy="${y}" r="${pr}" fill="#F2F5FA" stroke="#9AA5B5" stroke-width="${Math.max(1.5, pr * 0.28)}"/><circle cx="${x - pr * 0.3}" cy="${y - pr * 0.3}" r="${pr * 0.32}" fill="#fff"/>`).join('')}
      <text x="${w / 2}" y="${fh / 2}" dy=".36em" text-anchor="middle" font-size="${fs}" font-weight="900" font-family="ui-rounded, 'SF Pro Rounded', system-ui, sans-serif"
        fill="#fff" stroke="${dark}" stroke-width="${Math.max(2, t * 0.06)}" paint-order="stroke" stroke-linejoin="round" opacity=".92">${b.letter}</text>
    </svg>`;
  }

  function malletSVG(hr) {
    const L = hr * 4.2; // handle length (head centre → end)
    const k = Math.SQRT1_2;
    const S = Math.ceil(hr + L * k + hr * 0.5);
    const hx = hr, hy = hr, ex = hr + L * k, ey = hr + L * k;
    return {
      size: S, ox: ex, oy: ey,
      svg: `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" aria-hidden="true">
        <line x1="${hx}" y1="${hy}" x2="${ex}" y2="${ey}" stroke="#B57A3C" stroke-width="${hr * 0.62}" stroke-linecap="round"/>
        <line x1="${hx}" y1="${hy}" x2="${ex}" y2="${ey}" stroke="#E8B26A" stroke-width="${hr * 0.36}" stroke-linecap="round"/>
        <circle cx="${hx}" cy="${hy + hr * 0.12}" r="${hr}" fill="#C93450"/>
        <circle cx="${hx}" cy="${hy}" r="${hr}" fill="#FF5D73"/>
        <circle cx="${hx - hr * 0.32}" cy="${hy - hr * 0.34}" r="${hr * 0.34}" fill="#fff" opacity=".75"/>
      </svg>`,
    };
  }

  const PLAY_ICON = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M36 26 L74 50 L36 74 Z" fill="#fff" stroke="#fff" stroke-width="9" stroke-linejoin="round"/></svg>`;
  const STOP_ICON = `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="31" y="31" width="38" height="38" rx="8" fill="#fff"/></svg>`;

  U.addStyles('xylophone', `
    .g-xylophone { background: radial-gradient(130% 100% at 50% 0%, #FFF8E6 0%, #FFE7EF 50%, #E8DCFF 100%); }
    .xy-deco { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
    .xy-deco span { position: absolute; font-weight: 900; line-height: 1; color: rgba(142, 79, 214, .11); animation: xy-drift 9s ease-in-out infinite; }
    @keyframes xy-drift { 0%, 100% { transform: translateY(0) rotate(-10deg) } 50% { transform: translateY(-22px) rotate(10deg) } }
    .xy-frame { position: absolute; left: 0; top: 0; pointer-events: none; z-index: 1; overflow: visible; }
    .xy-bar { position: absolute; z-index: 2; }
    .xy-bar-in { position: absolute; inset: 0; transform-origin: 50% 50%; }
    .xy-bar-in > svg { position: absolute; left: 0; top: 0; overflow: visible; display: block; }
    .xy-bar-glow { position: absolute; left: -3px; top: -3px; right: -3px; bottom: calc(var(--sd) - 3px); border-radius: var(--r); opacity: 0;
      box-shadow: 0 0 18px 9px var(--c), 0 0 0 4px #fff; }
    .xy-bar-flash { position: absolute; left: 0; top: 0; right: 0; bottom: var(--sd); border-radius: var(--r); background: #fff; opacity: 0; }
    .xy-ring { position: absolute; z-index: 3; pointer-events: none; opacity: 0; transition: opacity .25s;
      border: 5px solid #fff; box-shadow: 0 0 0 5px rgba(255, 205, 0, .9), 0 0 30px 12px rgba(255, 214, 40, .6); }
    .xy-ring.on { opacity: 1; animation: xy-ring .9s ease-in-out infinite; }
    .xy-ring.soft.on { opacity: .55; }
    @keyframes xy-ring { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.07) } }
    .xy-mallet { position: absolute; z-index: 5; pointer-events: none; opacity: 0; transition: left .13s ease-out, top .13s ease-out, opacity .25s; }
    .xy-mallet.on { opacity: 1; }
    .xy-mallet-in { animation: xy-hover 1.1s ease-in-out infinite; filter: drop-shadow(0 6px 5px rgba(60, 20, 60, .25)); }
    .xy-mallet-in > svg { display: block; }
    @keyframes xy-hover { 0%, 100% { transform: rotate(-14deg) } 50% { transform: rotate(-24deg) } }
    .xy-btn { position: absolute; z-index: 6; border-radius: 50%; display: grid; place-items: center; background: #fff;
      border: 4px solid var(--c); box-shadow: 0 5px 0 var(--d), 0 9px 16px rgba(70, 30, 100, .18); transition: background .25s, transform .12s; }
    .xy-btn .pp-emoji { font-size: calc(var(--s) * .5); pointer-events: none; }
    .xy-btn svg { width: 56%; height: 56%; pointer-events: none; }
    .xy-btn.on { background: var(--l); border-width: 6px; animation: xy-pulse 1.1s ease-in-out infinite; }
    .xy-btn.on .pp-emoji { animation: xy-bop .55s ease-in-out infinite alternate; }
    @keyframes xy-bop { from { transform: scale(1) rotate(-6deg) } to { transform: scale(1.12) rotate(6deg) } }
    .xy-btn.pressed { transform: translateY(4px) scale(.95); }
    .xy-btn.wig { animation: pp-wiggle .6s ease both; }
    @keyframes xy-pulse { 0%, 100% { box-shadow: 0 5px 0 var(--d), 0 0 0 3px #fff, 0 0 0 6px var(--c) } 50% { box-shadow: 0 5px 0 var(--d), 0 0 0 6px #fff, 0 0 0 12px var(--c) } }
    .xy-listen { --c: #8B4FE6; --d: #5F2DB0; background: radial-gradient(circle at 35% 30%, #C9A2FF, #9B5CF0 60%, #7438CF); border-color: #fff; }
    .xy-listen.on { background: radial-gradient(circle at 35% 30%, #FF9AC0, #F2557F 60%, #C93460); }
    .xy-fx { position: absolute; inset: 0; pointer-events: none; z-index: 8; overflow: hidden; }
    .xy-note { position: absolute; left: 0; top: 0; font-weight: 900; line-height: 1; -webkit-text-stroke: 3px #fff; paint-order: stroke fill;
      text-shadow: 0 3px 6px rgba(60, 20, 80, .18); will-change: transform, opacity; }
  `);

  PP.registerGame({
    id: 'xylophone',
    title: 'Xylophone',
    domain: 'music',
    icon: ICON,
    tileColor: '#8A63F0',
    order: 50,
    _data: { SONGS, CHORDS, BARS, parseSong, versionFor, BAR_BEATS },
    create(stage, ctx) {
      /* ---------------- DOM ---------------- */
      const probe = ctx.el('div', { style: { position: 'absolute', visibility: 'hidden', pointerEvents: 'none', paddingTop: 'var(--safe-t)', paddingRight: 'var(--safe-r)', paddingBottom: 'var(--safe-b)', paddingLeft: 'var(--safe-l)' } });
      const deco = ctx.el('div', { class: 'xy-deco' });
      ['♪', '♫', '♩', '♬', '♪', '♫'].forEach((g, i) => deco.appendChild(ctx.el('span', { text: g, style: { left: [6, 82, 44, 18, 66, 90][i] + '%', top: [70, 14, 88, 30, 52, 78][i] + '%', fontSize: [64, 52, 46, 58, 40, 70][i] + 'px', animationDelay: -i * 1.7 + 's' } })));
      const frame = ctx.svg('svg', { class: 'xy-frame' });
      const fx = ctx.el('div', { class: 'xy-fx' });
      const ring = ctx.el('div', { class: 'xy-ring' });
      const mallet = ctx.el('div', { class: 'xy-mallet' });
      const malletIn = ctx.el('div', { class: 'xy-mallet-in' });
      mallet.appendChild(malletIn);
      stage.append(probe, deco, frame);

      const barEls = BARS.map((b, i) => {
        const el = ctx.el('div', { class: 'xy-bar', 'data-i': i });
        const inner = ctx.el('div', { class: 'xy-bar-in' });
        const glow = ctx.el('div', { class: 'xy-bar-glow' });
        const flash = ctx.el('div', { class: 'xy-bar-flash' });
        inner.append(glow, ctx.el('div', { class: 'xy-bar-art' }), flash);
        el.appendChild(inner);
        stage.appendChild(el);
        return { el, inner, glow, flash, art: inner.children[1], def: b, rect: null, len: 0, t: 0 };
      });
      stage.append(ring, mallet);

      const songBtns = SONGS.map((s) => {
        const b = ctx.el('button', { class: 'xy-btn xy-song pp-noripple', 'aria-label': s.title, style: { '--c': s.tint, '--d': U.shade(s.tint, -0.3), '--l': U.shade(s.tint, 0.72) } },
          ctx.el('span', { class: 'pp-emoji', text: s.icon }));
        stage.appendChild(b);
        ctx.tap(b, () => { press(b); pickSong(s); });
        return b;
      });
      const listenBtn = ctx.el('button', { class: 'xy-btn xy-listen pp-noripple', 'aria-label': 'Listen to the song', html: PLAY_ICON });
      stage.append(listenBtn, fx);
      ctx.tap(listenBtn, () => { press(listenBtn); onListen(); });

      function press(b) {
        b.classList.add('pressed');
        ctx.setTimeout(() => b.classList.remove('pressed'), 140);
      }

      /* ---------------- state ---------------- */
      let portrait = false;
      let thick = 80; // bar thickness px
      let mode = 'free'; // 'free' | 'magic' | 'done'
      let song = null, notes = null, idx = 0;
      let offTaps = 0, lastAdvance = 0, lastChordAt = 0, missDone = false;
      let demo = null; // {tl, kind:'full'|'phrase'}
      let flat = false; // B-flat bar mounted?
      let idleCount = 0;
      let lastHiLo = 0;
      let glowTimer = 0;
      let hintedOnce = { any: false, aim: false };
      let malletGeo = null;

      /* ---------------- layout ---------------- */
      function insets() {
        const cs = getComputedStyle(probe);
        return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
      }
      function layout() {
        const { w, h } = ctx.size();
        if (!w || !h) return;
        const S = insets();
        portrait = h > w * 1.05;
        const m = Math.round(U.clamp(Math.min(w, h) * 0.025, 10, 22));
        const HOME = 96;
        let s = Math.round(U.clamp(Math.min(w, h) * 0.11, 72, 100));
        const btns = songBtns.concat([listenBtn]);
        const n = btns.length;
        let area;
        if (!portrait) {
          const x0 = S.l + HOME + 4, x1 = w - S.r - m;
          const avail = x1 - x0;
          s = Math.max(60, Math.min(s, Math.floor((avail - (n - 1) * 8) / n)));
          const gap = Math.min(26, (avail - n * s) / (n - 1));
          const rowW = n * s + (n - 1) * gap;
          let x = x0 + (avail - rowW) / 2;
          const y = S.t + m;
          btns.forEach((b) => { place(b, x, y, s); x += s + gap; });
          area = { l: S.l + m, r: w - S.r - m, t: y + s + m * 1.3, b: h - S.b - m };
        } else {
          const y0 = S.t + m, y1 = h - S.b - m;
          const avail = y1 - y0;
          s = Math.max(60, Math.min(s, Math.floor((avail - (n - 1) * 8) / n)));
          const gap = Math.min(30, (avail - n * s) / (n - 1));
          const colH = n * s + (n - 1) * gap;
          const x = w - S.r - m - s;
          let y = y0 + (avail - colH) / 2;
          // listen first (top), then songs
          [listenBtn].concat(songBtns).forEach((b) => { place(b, x, y, s); y += s + gap; });
          area = { l: S.l + m, r: x - m * 1.2, t: S.t + HOME, b: h - S.b - m };
        }
        // leave room for the rails' end knobs
        const k = U.clamp(Math.min(w, h) * 0.045, 16, 40);
        if (!portrait) { area.l += k; area.r -= k; } else { area.t += k * 0.6; area.b -= k; }
        layoutBars(area);
        drawFrame();
        const hr = U.clamp(thick * 0.3, 14, 30);
        malletGeo = malletSVG(hr);
        malletGeo.hr = hr;
        malletIn.innerHTML = malletGeo.svg;
        malletIn.style.transformOrigin = `${malletGeo.ox}px ${malletGeo.oy}px`;
        if (mode === 'magic') showNext(true);
      }
      function place(b, x, y, s) {
        Object.assign(b.style, { left: x + 'px', top: y + 'px', width: s + 'px', height: s + 'px' });
        b.style.setProperty('--s', s + 'px');
      }
      function layoutBars(a) {
        const W = a.r - a.l, H = a.b - a.t;
        if (!portrait) {
          const pitch = W / 8;
          thick = Math.round(Math.min(pitch * 0.8, 132, H * 0.3));
          const gap = Math.min(pitch - thick, thick * 0.34);
          const total = 8 * thick + 7 * gap;
          const x0 = a.l + (W - total) / 2;
          const cy = a.t + H / 2;
          barEls.forEach((B, i) => {
            const len = Math.round(H * barLen(B.def.n));
            B.rect = { x: x0 + i * (thick + gap), y: cy - len / 2, w: thick, h: len };
            B.len = len;
            B.gap = gap;
            renderBar(B);
          });
        } else {
          const pitch = H / 8;
          thick = Math.round(Math.min(pitch * 0.8, 120, W * 0.32));
          const gap = Math.min(pitch - thick, thick * 0.3);
          const total = 8 * thick + 7 * gap;
          const y0 = a.t + (H - total) / 2;
          const cx = a.l + W / 2;
          barEls.forEach((B, i) => {
            const len = Math.round(W * barLen(B.def.n));
            B.rect = { x: cx - len / 2, y: y0 + (7 - i) * (thick + gap), w: len, h: thick };
            B.len = len;
            B.gap = gap;
            renderBar(B);
          });
        }
      }
      function renderBar(B) {
        const r = B.rect;
        Object.assign(B.el.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
        const t = portrait ? r.h : r.w;
        const sd = Math.max(4, Math.round(t * 0.09));
        B.el.style.setProperty('--sd', sd + 'px');
        B.el.style.setProperty('--r', Math.round(t * 0.26) + 'px');
        B.el.style.setProperty('--c', U.rgba(B.def.color, 0.75));
        B.art.innerHTML = barSVG(B.def, r.w, r.h, !portrait);
        B.t = t;
        B.sd = sd;
      }
      function drawFrame() {
        const { w, h } = ctx.size();
        frame.setAttribute('width', w);
        frame.setAttribute('height', h);
        frame.setAttribute('viewBox', `0 0 ${w} ${h}`);
        const rw = Math.max(10, thick * 0.24);
        const rails = [[], []];
        barEls.forEach((B) => {
          const r = B.rect;
          if (!portrait) {
            const x = r.x + r.w / 2, fh = r.h - B.sd;
            rails[0].push([x, r.y + fh * 0.224]);
            rails[1].push([x, r.y + fh * 0.776]);
          } else {
            const y = r.y + (r.h - B.sd) / 2;
            rails[0].push([r.x + r.w * 0.224, y]);
            rails[1].push([r.x + r.w * 0.776, y]);
          }
        });
        const ext = (pts) => {
          // extend the rail a little past the first/last bar
          const a = pts[0], b = pts[1], y = pts[pts.length - 1], z = pts[pts.length - 2];
          const e = thick * 0.42;
          const da = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, dz = Math.hypot(y[0] - z[0], y[1] - z[1]) || 1;
          return [[a[0] + (a[0] - b[0]) / da * e, a[1] + (a[1] - b[1]) / da * e]].concat(pts, [[y[0] + (y[0] - z[0]) / dz * e, y[1] + (y[1] - z[1]) / dz * e]]);
        };
        let svg = '';
        rails.forEach((pts) => {
          const p = ext(pts);
          const d = 'M' + p.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L');
          svg += `<path d="${d}" stroke="rgba(80,40,10,.18)" stroke-width="${rw + 8}" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(0 6)"/>`;
          svg += `<path d="${d}" stroke="#9C6230" stroke-width="${rw + 5}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
          svg += `<path d="${d}" stroke="#D99A5B" stroke-width="${rw}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
          svg += `<path d="${d}" stroke="#F2C48D" stroke-width="${rw * 0.28}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".8" transform="translate(${-rw * 0.15} ${-rw * 0.18})"/>`;
          [p[0], p[p.length - 1]].forEach((q) => {
            svg += `<circle cx="${q[0]}" cy="${q[1]}" r="${rw * 0.95}" fill="#9C6230"/><circle cx="${q[0]}" cy="${q[1]}" r="${rw * 0.72}" fill="#E8A866"/><circle cx="${q[0] - rw * 0.25}" cy="${q[1] - rw * 0.25}" r="${rw * 0.24}" fill="#fff" opacity=".55"/>`;
          });
        });
        frame.innerHTML = svg;
      }

      /* ---------------- sound ---------------- */
      function panFor(i) { return (i - 3.5) / 3.5 * 0.45; }
      function noteSound(i, vel, when) {
        const n = barEls[i].def.n;
        const o = { vel, pan: panFor(i) };
        if (when) o.at = when;
        ctx.play('xylo', n, o);
        ctx.play('marimba', n, Object.assign({}, o, { vel: vel * 0.3 }));
      }
      function accomp(chName, kind, when, beat) {
        const ch = CHORDS[chName];
        if (!ch) return;
        if (kind === 'bass') ctx.play('bass', ch.bass, { at: when, dur: beat * 0.9, vel: 0.42 });
        else if (kind === 'bass5') ctx.play('bass', ch.b5, { at: when, dur: beat * 0.9, vel: 0.34 });
        else if (kind === 'chord') ctx.play('piano', ch.v, { at: when, dur: beat * 0.8, vel: 0.24 });
        else if (kind === 'final') {
          ctx.play('piano', ch.v, { at: when, dur: beat * 2.5, vel: 0.32 });
          ctx.play('bass', ch.bass, { at: when, dur: beat * 2.5, vel: 0.45 });
        }
      }
      /** soft accompaniment under a note the child just "played" in magic mode */
      function accompanyLive(k) {
        const ev = notes[k];
        if (!ev.chord) return;
        const pos = ev.t - song.pickup;
        const bb = BAR_BEATS[song.meter];
        const inBar = ((pos % bb) + bb) % bb;
        const near = (arr) => arr.some((p) => Math.abs(p - inBar) < 0.01);
        const nowMs = performance.now();
        const stale = nowMs - lastChordAt > 1600;
        const ch = CHORDS[ev.chord];
        if (ev.change || near(STRONG[song.meter]) || stale) {
          ctx.play('piano', ch.v, { dur: 1.1, vel: 0.3 });
          ctx.play('bass', ch.bass, { dur: 0.9, vel: 0.4 });
          lastChordAt = nowMs;
        } else if (near(WEAK[song.meter])) {
          ctx.play('piano', ch.v, { dur: 0.7, vel: 0.17 });
          lastChordAt = nowMs;
        }
      }

      /* ---------------- visuals ---------------- */
      function barCenter(i) {
        const B = barEls[i], r = B.rect;
        return { x: r.x + r.w / 2, y: r.y + (r.h - B.sd) / 2 };
      }
      function hitBar(i, o) {
        o = o || {};
        const B = barEls[i];
        const soft = o.soft;
        const sx = portrait ? 1.02 : 0.9, sy = portrait ? 0.9 : 1.02;
        B.inner.animate([
          { transform: 'none' },
          { transform: `scale(${soft ? (1 + sx) / 2 : sx}, ${soft ? (1 + sy) / 2 : sy})`, offset: 0.14 },
          { transform: `scale(${2 - sx * 0.98}, ${2 - sy * 0.98}) rotate(${portrait ? 0.8 : 1.2}deg)`, offset: 0.38 },
          { transform: `rotate(${portrait ? -0.5 : -0.8}deg)`, offset: 0.6 },
          { transform: `rotate(${portrait ? 0.25 : 0.4}deg)`, offset: 0.8 },
          { transform: 'none' },
        ], { duration: soft ? 300 : 460, easing: 'ease-out' });
        B.flash.animate([{ opacity: soft ? 0.25 : 0.6 }, { opacity: 0 }], { duration: soft ? 180 : 320, easing: 'ease-out' });
        if (!soft) B.glow.animate([{ opacity: 0.95 }, { opacity: 0 }], { duration: 650, easing: 'ease-out' });
        const c = barCenter(i);
        const x = o.x == null ? c.x : o.x, y = o.y == null ? c.y : o.y;
        burstNotes(x, y, B.def.color, soft ? 1 : o.big ? 3 : 2);
      }
      let liveNotes = 0;
      function burstNotes(x, y, color, n) {
        for (let k = 0; k < n; k++) {
          if (liveNotes > 36) return;
          liveNotes++;
          const e = ctx.el('div', { class: 'xy-note', text: ctx.pick(['♪', '♫', '♪', '♬']), style: { color, fontSize: Math.round(U.clamp(thick * 0.5, 26, 54) * ctx.rand(0.8, 1.15)) + 'px' } });
          fx.appendChild(e);
          const dx = ctx.rand(-60, 60), dy = -ctx.rand(70, 150), rot = ctx.rand(-30, 30);
          const a = e.animate([
            { transform: `translate(${x}px, ${y}px) translate(-50%,-50%) scale(.4) rotate(0deg)`, opacity: 0 },
            { transform: `translate(${x + dx * 0.4}px, ${y + dy * 0.4}px) translate(-50%,-50%) scale(1.1) rotate(${rot * 0.5}deg)`, opacity: 1, offset: 0.3 },
            { transform: `translate(${x + dx}px, ${y + dy}px) translate(-50%,-50%) scale(.9) rotate(${rot}deg)`, opacity: 0 },
          ], { duration: ctx.rand(800, 1100), easing: 'cubic-bezier(.2,.7,.3,1)' });
          a.onfinish = () => { e.remove(); liveNotes--; };
        }
      }
      function wave(up, withSound) {
        const order = up ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
        const t0 = ctx.audio.now() + 0.05;
        order.forEach((i, k) => {
          if (withSound) noteSound(i, 0.22, t0 + k * 0.07);
          ctx.setTimeout(() => {
            const B = barEls[i];
            B.inner.animate([{ transform: 'none' }, { transform: portrait ? 'translateX(-10px) scale(1.04)' : 'translateY(-14px) scale(1.04)', offset: 0.4 }, { transform: 'none' }], { duration: 420, easing: 'ease-in-out' });
            B.flash.animate([{ opacity: 0.45 }, { opacity: 0 }], { duration: 380 });
          }, 50 + k * 70);
        });
      }
      function moveMallet(i) {
        if (!malletGeo) return;
        const c = barCenter(i);
        mallet.style.left = c.x - malletGeo.hr + 'px';
        mallet.style.top = c.y - malletGeo.hr + 'px';
      }
      function strike(dur) {
        malletIn.animate([
          { transform: 'rotate(-26deg)' },
          { transform: 'rotate(2deg)', offset: 0.3 },
          { transform: 'rotate(-18deg)' },
        ], { duration: U.clamp(dur || 300, 160, 380), easing: 'ease-out' });
      }
      function ringTo(i, soft) {
        const B = barEls[i], r = B.rect;
        const pad = Math.round(U.clamp(thick * 0.1, 6, 12));
        Object.assign(ring.style, { left: r.x - pad + 'px', top: r.y - pad + 'px', width: r.w + pad * 2 + 'px', height: r.h - B.sd + pad * 2 + 'px', borderRadius: Math.round(B.t * 0.26 + pad) + 'px' });
        ring.classList.toggle('soft', !!soft);
        ring.classList.add('on');
        ring.animate([{ transform: 'scale(1.18)', opacity: 0.4 }, { transform: 'scale(1)', opacity: 1 }], { duration: 220, easing: 'ease-out' });
      }
      function ringOff() { ring.classList.remove('on'); }

      /* ---------------- B / B-flat swap (Orff style) ---------------- */
      function setFlat(on) {
        if (flat === on) return;
        flat = on;
        const B = barEls[6];
        const ax = portrait ? 'scaleY' : 'scaleX';
        const a = B.inner.animate([{ transform: `${ax}(1)` }, { transform: `${ax}(0)` }], { duration: 160, easing: 'ease-in' });
        a.onfinish = () => {
          B.def = on ? B_FLAT : BARS[6];
          layout();
          B.inner.animate([{ transform: `${ax}(0)` }, { transform: `${ax}(1.12)`, offset: 0.7 }, { transform: `${ax}(1)` }], { duration: 260, easing: 'ease-out' });
          const c = barCenter(6);
          PP.fx.burst(c.x, c.y, { emoji: ['✨', '⭐'], count: 5, distance: 70, size: 30 });
        };
        ctx.sfx('magic', { vel: 0.35 });
      }

      /* ---------------- free play ---------------- */
      function freeTap(i, x, y, glide) {
        noteSound(i, glide ? 0.6 : 0.78);
        hitBar(i, { x, y });
        if (mode !== 'free' || demo) return;
        const now = performance.now();
        if ((i === 0 || i === 7) && now - lastHiLo > 22000 && Math.random() < 0.6 && !glide) {
          lastHiLo = now;
          ctx.setTimeout(() => {
            if (i === 0) ctx.say('Low!', { mode: 'skip', pitch: 0.6, rate: 0.8 });
            else ctx.say('High!', { mode: 'skip', pitch: 1.9, rate: 1.05 });
          }, 250);
        }
      }

      /* ---------------- songs / magic mode ---------------- */
      function setActiveBtn() {
        songBtns.forEach((b, k) => b.classList.toggle('on', !!song && SONGS[k] === song && mode !== 'free'));
        listenBtn.classList.toggle('on', !!(demo && demo.kind === 'full'));
        listenBtn.innerHTML = demo && demo.kind === 'full' ? STOP_ICON : PLAY_ICON;
      }
      function pickSong(s, opts) {
        opts = opts || {};
        stopDemo();
        if (song === s && mode === 'magic' && !opts.force) {
          // tapping the lit song again = back to free play
          endSong(false);
          ctx.sfx('swish', { vel: 0.5 });
          return;
        }
        song = s;
        notes = versionFor(s, ctx.level);
        idx = 0;
        offTaps = 0;
        missDone = false;
        lastAdvance = 0;
        mode = 'magic';
        idleCount = 0;
        setFlat(s.flat);
        setActiveBtn();
        showNext();
        ctx.setPrompt(ctx.level >= 3 ? 'Tap the sparkly bar!' : 'Tap, tap, tap!');
        if (opts.silent) return;
        (async () => {
          await ctx.say(s.title + '!');
          if (song !== s || mode !== 'magic' || idx > 1) return;
          const lvl = ctx.level;
          if (lvl >= 3 && !hintedOnce.aim) { hintedOnce.aim = true; ctx.say('Tap the sparkly bar!', { mode: 'queue' }); }
          else if (lvl < 3 && !hintedOnce.any) { hintedOnce.any = true; ctx.say('Tap, tap, tap!', { mode: 'queue' }); }
        })();
      }
      function targetIndex() { return notes && idx < notes.length ? barIndexFor(notes[idx].n) : -1; }
      function showNext(instant) {
        ctx.clearTimeout(glowTimer);
        const ti = targetIndex();
        if (ti < 0 || mode !== 'magic') { ringOff(); mallet.classList.remove('on'); return; }
        const lvl = ctx.level;
        const useMallet = lvl <= 3;
        if (useMallet) { moveMallet(ti); mallet.classList.add('on'); } else mallet.classList.remove('on');
        if (lvl >= 5 && !instant) {
          ringOff();
          const at = idx;
          glowTimer = ctx.setTimeout(() => { if (mode === 'magic' && idx === at) ringTo(ti); }, 1300);
        } else {
          ringTo(ti, lvl <= 2);
        }
      }
      function magicTap(i, x, y, glide) {
        if (demo && demo.kind === 'phrase') stopDemo();
        const ti = targetIndex();
        if (ti < 0) return freeTap(i, x, y, glide);
        const lvl = ctx.level;
        const now = performance.now();
        if (lvl <= 2 || i === ti) {
          if (now - lastAdvance < 130) { hitBar(i, { soft: true, x, y }); return; }
          lastAdvance = now;
          if (i !== ti) hitBar(i, { soft: true, x, y }); // the finger's bar twitches, the song's bar sings
          playSongNote(idx);
        } else {
          // aiming levels: other bars just play softly — never a penalty
          offTaps++;
          noteSound(i, 0.3);
          hitBar(i, { soft: true, x, y });
          if (offTaps % 4 === 0) {
            ringTo(ti);
            if (lvl <= 3) strike(300);
            ctx.say(`The ${barEls[ti].def.word} one!`, { mode: 'skip' });
          }
          if (!missDone && offTaps > notes.length * 0.6 + 4) { missDone = true; ctx.miss(); }
        }
      }
      function playSongNote(k) {
        const ev = notes[k];
        const bi = barIndexFor(ev.n);
        noteSound(bi, 0.85);
        hitBar(bi, { big: true });
        accompanyLive(k);
        if (mallet.classList.contains('on')) { moveMallet(bi); strike(220); }
        idx = k + 1;
        if (idx >= notes.length) finishSong();
        else ctx.setTimeout(() => { if (mode === 'magic' && idx === k + 1) showNext(); }, 90);
      }
      async function finishSong() {
        const s = song;
        mode = 'done';
        ringOff();
        mallet.classList.remove('on');
        setActiveBtn();
        const firstTry = ctx.level <= 2 || offTaps <= Math.max(3, notes.length * 0.2);
        await ctx.wait(650);
        wave(true, false);
        // a little cadence in the song's key, then applause
        const tonic = PP.audio.midi(s.key);
        const t0 = ctx.audio.now() + 0.05;
        [0, 4, 7, 12].forEach((iv, k) => ctx.play('bell', tonic + 12 + iv, { at: t0 + k * 0.08, vel: 0.28 }));
        ctx.sfx('applause', { vel: 0.75, delay: 0.25 });
        ctx.success(firstTry);
        await ctx.celebrate({ big: true, sound: false, say: `${ctx.pick(['Bravo!', 'Hooray!', 'Yay!', 'Wow!'])} You played ${s.name}!` });
        if (song !== s || mode !== 'done') return;
        endSong(true);
      }
      function endSong(invite) {
        mode = 'free';
        song = null;
        notes = null;
        ringOff();
        mallet.classList.remove('on');
        ctx.clearTimeout(glowTimer);
        setFlat(false);
        setActiveBtn();
        ctx.setPrompt('Tap the bars!');
        if (invite) wiggleSongs();
      }
      function wiggleSongs() {
        songBtns.forEach((b, k) => ctx.setTimeout(() => {
          b.classList.remove('wig');
          void b.offsetWidth;
          b.classList.add('wig');
        }, k * 90));
      }

      /* ---------------- demonstrations ---------------- */
      function stopDemo() {
        if (!demo) return;
        demo.tl.stop();
        demo = null;
        setActiveBtn();
        if (mode === 'magic') showNext(true);
        else mallet.classList.remove('on');
      }
      /** Play list[from..to) at the song's tempo with accompaniment; the mallet strikes along. */
      function playDemo(s, list, from, to, kind) {
        stopDemo();
        const beat = 60 / s.bpm;
        const t0 = list[from].t;
        const items = [];
        for (let k = from; k < to; k++) {
          const ev = list[k];
          const bi = barIndexFor(ev.n);
          const dur = ev.d * beat;
          items.push({ t: (ev.t - t0) * beat, a: (when) => noteSound(bi, 0.75, when), v: () => { moveMallet(bi); strike(dur * 1000); hitBar(bi); } });
        }
        const last = list[to - 1];
        const bb = BAR_BEATS[s.meter];
        for (let bar = s.pickup - bb * 2; bar <= last.t + 1e-6; bar += bb) {
          GRID[s.meter].forEach(([p, kindA]) => {
            const gb = bar + p;
            if (gb < t0 - 1e-6 || gb < s.pickup - 1e-6 || gb >= last.t - 1e-6) return;
            const ch = chordAt(list, gb);
            if (ch) items.push({ t: (gb - t0) * beat, a: (when) => accomp(ch, kindA, when, beat) });
          });
        }
        const lastCh = chordAt(list, last.t);
        if (lastCh) items.push({ t: (last.t - t0) * beat, a: (when) => accomp(lastCh, 'final', when, beat) });
        ringOff();
        moveMallet(barIndexFor(list[from].n));
        mallet.classList.add('on');
        const tl = timeline(ctx, items, { total: (last.t + Math.min(last.d, 2) - t0) * beat + 0.2, lead: 0.15 });
        demo = { tl, kind };
        setActiveBtn();
        return tl.done.then((ok) => {
          if (demo && demo.tl === tl) { demo = null; setActiveBtn(); }
          return ok;
        });
      }
      async function onListen() {
        if (demo && demo.kind === 'full') { stopDemo(); return; }
        let s = song;
        if (!s) {
          s = ctx.pick(SONGS);
          pickSong(s, { silent: true });
          await ctx.say(s.title + '!');
          if (song !== s) return;
        } else {
          ctx.say('Listen!');
        }
        idx = 0;
        const list = notes;
        const ok = await playDemo(s, list, 0, list.length, 'full');
        if (!ok || song !== s || mode !== 'magic') return;
        idx = 0;
        lastAdvance = 0;
        showNext();
        ctx.say('Your turn!');
      }
      /** idle help: play the next little phrase from where the child is, then hand it back */
      async function phraseHint() {
        if (!notes) return;
        const from = idx;
        let to = from;
        while (to < notes.length && to - from < 7) { to++; if (notes[to - 1].d >= 2) break; }
        if (to <= from) return;
        const s = song;
        await ctx.say('Listen!');
        if (song !== s || idx !== from || mode !== 'magic') return;
        const ok = await playDemo(s, notes, from, to, 'phrase');
        if (!ok || song !== s || idx !== from) return;
        showNext();
        ctx.say('Your turn!');
      }
      async function freeDemo() {
        const s = ctx.pick(SONGS.slice(0, 5));
        const list = s.notes;
        let to = 0;
        while (to < list.length && to < 8) { to++; if (list[to - 1].d >= 2) break; }
        await ctx.say(s.title + '!');
        if (mode !== 'free' || demo) return;
        setFlat(s.flat);
        const ok = await playDemo(s, list, 0, to, 'phrase');
        if (!ok || mode !== 'free') { if (mode === 'free') setFlat(false); return; }
        pickSong(s, { silent: true, force: true });
        ctx.say('Your turn!');
      }

      /* ---------------- input: multi-touch + glissando ---------------- */
      function hitTest(x, y, strict) {
        let best = -1, bestD = 1e9;
        barEls.forEach((B, i) => {
          const r = B.rect;
          if (!r) return;
          const padX = strict ? 0 : portrait ? 14 : B.gap / 2 + 1;
          const padY = strict ? 0 : portrait ? B.gap / 2 + 1 : 14;
          if (x >= r.x - padX && x <= r.x + r.w + padX && y >= r.y - padY && y <= r.y + r.h + padY) {
            const c = barCenter(i);
            const d = portrait ? Math.abs(y - c.y) : Math.abs(x - c.x);
            if (d < bestD) { bestD = d; best = i; }
          }
        });
        return best;
      }
      const pointers = new Map();
      function onBar(i, x, y, glide) {
        idleCount = 0;
        if (mode === 'magic' && !(demo && demo.kind === 'full')) magicTap(i, x, y, glide);
        else if (demo && demo.kind === 'full') { noteSound(i, 0.4); hitBar(i, { soft: true, x, y }); }
        else freeTap(i, x, y, glide);
      }
      ctx.on(stage, 'pointerdown', (e) => {
        if (e.target.closest && e.target.closest('.xy-btn, .pp-game-pip')) return;
        e.preventDefault();
        const i = hitTest(e.clientX, e.clientY, false);
        pointers.set(e.pointerId, i);
        if (i >= 0) onBar(i, e.clientX, e.clientY, false);
        else burstNotes(e.clientX, e.clientY, ctx.pick(BARS).color, 1);
      });
      ctx.on(stage, 'pointermove', (e) => {
        if (!pointers.has(e.pointerId)) return;
        const i = hitTest(e.clientX, e.clientY, true);
        if (i >= 0 && i !== pointers.get(e.pointerId)) {
          pointers.set(e.pointerId, i);
          onBar(i, e.clientX, e.clientY, true);
        } else if (i < 0 && hitTest(e.clientX, e.clientY, false) < 0) {
          pointers.set(e.pointerId, -1);
        }
      });
      const up = (e) => pointers.delete(e.pointerId);
      ctx.on(stage, 'pointerup', up);
      ctx.on(stage, 'pointercancel', up);

      /* ---------------- idle help ---------------- */
      ctx.idle(7500, () => {
        if (demo) return;
        idleCount++;
        if (idleCount > 6) return; // don't nag forever
        if (mode === 'magic') {
          const ti = targetIndex();
          if (ti < 0) return;
          if (idleCount % 2 === 1) {
            ringTo(ti);
            moveMallet(ti);
            if (ctx.level <= 3) { mallet.classList.add('on'); strike(320); }
            ctx.say(ctx.level <= 2 ? ctx.pick(['Keep playing!', 'Tap, tap, tap!']) : `Tap the ${barEls[ti].def.word} one!`);
          } else {
            phraseHint();
          }
        } else if (mode === 'free') {
          const k = idleCount % 3;
          if (k === 1) { ctx.say('Tap the bars!'); wave(true, true); }
          else if (k === 2) { ctx.say('Pick a song!'); wiggleSongs(); }
          else freeDemo();
        }
      });

      /* ---------------- go ---------------- */
      // read-only hook for automated tests
      stage.__xy = { state: () => ({ mode, idx, n: notes ? notes.length : 0, target: targetIndex(), song: song && song.id, demo: demo && demo.kind, flat, portrait, thick }), bars: () => barEls.map((B) => B.rect) };
      layout();
      ctx.onResize(layout);
      ctx.setPrompt('Tap the bars!');
      ctx.setTimeout(() => { wave(true, true); ctx.say('Tap the bars!'); }, 500);

      return { destroy() { stopDemo(); } };
    },
  });
})();
