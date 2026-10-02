/* Shapes — a classic shape sorter.
 * Level 1: tap a shape → it says its name and hops into its hole by itself (can't fail).
 * Level 2+: DRAG a shape to its hole (generous snap), or TAP a shape then TAP a hole.
 *   Wrong hole → the shape bonks and bounces home: "That's the square hole. Find the circle hole!" + glow.
 * Shapes per level come from PP.data.shapesForLevel (3 → 8). Level 2 holes have colored rims as a scaffold.
 * When everything is in: the box rattles, the lid pops and the shapes burst out. Every 2nd round: "Find the star!".
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;

  U.addStyles('shapes', `
    .g-shapes { background: linear-gradient(#BFE7FF 0%, #E3F5FF 58%, #F4D2A2 58.2%, #E9BE84 100%); }
    .ss-wallstars { position: absolute; left: 0; right: 0; top: 0; height: 58%; pointer-events: none; opacity: .55;
      background-image: radial-gradient(circle, #fff 0 3px, transparent 4px), radial-gradient(circle, #fff 0 2px, transparent 3px);
      background-size: 90px 90px, 60px 60px; background-position: 10px 20px, 40px 50px; }
    .ss-mat { position: absolute; border-radius: 28px; pointer-events: none;
      background: repeating-linear-gradient(45deg, rgba(255,255,255,.18) 0 18px, rgba(255,255,255,0) 18px 36px), linear-gradient(#9BE3C4, #7FD6B2);
      box-shadow: inset 0 0 0 5px rgba(255,255,255,.65), inset 0 0 0 9px rgba(0,0,0,.04), 0 10px 0 #5DBF97, 0 18px 26px rgba(30,90,60,.22); }
    .ss-mat::after { content: ""; position: absolute; inset: 12px; border-radius: 20px; border: 3px dashed rgba(255,255,255,.75); }
    .ss-box { position: absolute; z-index: 5; }
    .ss-box::after { content: ""; position: absolute; left: 2%; right: 2%; bottom: -12px; height: 24px; border-radius: 50%; background: rgba(90, 50, 10, .2); z-index: -1; }
    .ss-front, .ss-lid { position: absolute; left: 0; }
    .ss-front svg, .ss-lid svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; display: block; }
    .ss-lid { z-index: 2; transform-origin: 20% 100%; }
    .ss-hole { position: absolute; border-radius: 50%; z-index: 3; }
    .ss-hl { opacity: 0; transition: opacity .2s; }
    .ss-hl.hover { opacity: .9; }
    .ss-hl.glow { opacity: 1; animation: ss-hl 1s ease-in-out infinite; }
    @keyframes ss-hl { 0%, 100% { opacity: .35; stroke-width: 8px } 50% { opacity: 1; stroke-width: 16px } }
    .ss-hl.flash { opacity: 1; animation: ss-flash .6s ease-out forwards; }
    @keyframes ss-flash { from { opacity: 1 } to { opacity: 0 } }
    .ss-piece { position: absolute; left: 0; top: 0; z-index: 10; touch-action: none; will-change: transform; }
    .ss-piece.drag { z-index: 30; }
    .ss-piece.fly { z-index: 25; pointer-events: none; }
    .ss-inner { width: 100%; height: 100%; transition: transform .18s cubic-bezier(.3,1.6,.5,1), filter .2s; filter: drop-shadow(0 6px 5px rgba(40,30,80,.22)); }
    .ss-inner svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .ss-piece.lift .ss-inner { transform: scale(1.14); filter: drop-shadow(0 14px 10px rgba(40,30,80,.28)); }
    .ss-piece.sel .ss-inner { animation: ss-sel 1s ease-in-out infinite; filter: drop-shadow(0 0 10px #FFE45C) drop-shadow(0 12px 10px rgba(40,30,80,.25)); }
    @keyframes ss-sel { 0%, 100% { transform: scale(1.12) } 50% { transform: scale(1.2) rotate(3deg) } }
    .ss-piece.pop .ss-inner { animation: ss-pop .5s cubic-bezier(.3,1.6,.5,1) both; }
    @keyframes ss-pop { from { transform: scale(0) rotate(-30deg) } to { transform: scale(1) } }
    .ss-piece.wig .ss-inner { animation: pp-wiggle .5s ease both; }
    .ss-ghost { position: absolute; left: 0; top: 0; z-index: 28; pointer-events: none; opacity: .55; }
    .ss-ghost svg { width: 100%; height: 100%; display: block; }
    .ss-finger { position: absolute; left: 0; top: 0; z-index: 29; pointer-events: none; font-size: 46px; }
    .ss-find { position: absolute; z-index: 40; left: calc(var(--safe-l) + 12px); right: calc(var(--safe-r) + 12px);
      top: calc(var(--safe-t) + 90px); bottom: calc(var(--safe-b) + 20px); }
    .ss-hide { opacity: 0 !important; pointer-events: none !important; transition: opacity .3s; }
    .ss-fade { transition: opacity .3s; }
  `);

  U.addDefs('shapes', `
    <linearGradient id="ss-holeg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#140E26"/><stop offset=".55" stop-color="#2A1F45"/><stop offset="1" stop-color="#4C3D74"/>
    </linearGradient>
  `);

  const PALETTE = ['#EF3B36', '#FF8C1A', '#FFD21F', '#3DBE4B', '#2F7BEA', '#8E4FD6', '#FF6FB5', '#22C3C3'];
  const LID = '#FF5A5F', FRONT = '#3D8BFF';

  function pieceSVG(id, color) {
    const s = PP.data.shapeById(id);
    const dark = U.shade(color, -0.32);
    return `<svg viewBox="-6 -6 112 112" aria-hidden="true">
      <g transform="translate(0 8)" fill="${dark}" stroke="${dark}" stroke-width="5" stroke-linejoin="round">${s.markup}</g>
      <g fill="${color}" stroke="${U.shade(color, -0.18)}" stroke-width="4" stroke-linejoin="round">${s.markup}</g>
      <g fill="#fff" opacity=".32" transform="translate(-4 -6) scale(.92)">${id === 'circle' || id === 'oval' ? '<ellipse cx="38" cy="34" rx="16" ry="10"/>' : '<ellipse cx="36" cy="34" rx="12" ry="7"/>'}</g>
    </svg>`;
  }
  // piece svg viewBox is 112 wide for a 100-unit shape → the shape spans this fraction of the element
  const SHAPE_FRAC = 100 / 112;
  // a hole's 100-unit box is HOLE_K × the piece element, so the hole outline is ~8% bigger than the shape
  const HOLE_K = SHAPE_FRAC * 1.08;

  PP.registerGame({
    id: 'shapes',
    title: 'Shapes',
    domain: 'shapes',
    icon: '🔷',
    tileColor: '#FFB547',
    order: 40,
    // every data-driven line, for tools/harvest.js (natural voice pack)
    voiceLines() {
      const L = ['Tap a shape! In the box it goes!', 'Put the shapes in the box!', "Shapes! Let's put them in the box! Tap a shape!",
        'New shapes! Put them in!', 'More shapes! In the box!', 'All in! Shake, shake, shake!', 'Shape hunt!', 'Quick game!',
        'In it goes!', 'Plonk!', 'It fits!', 'In the box!', 'Shake shake!'];
      const C = (w) => w[0].toUpperCase() + w.slice(1);
      PP.data.SHAPES.forEach((a) => {
        L.push(`${C(a.name)}!`, `Find the ${a.name} hole!`, `The ${a.name} hole!`, `Tap the ${a.name}!`, `Put the ${a.name} in its hole!`,
          `Find the ${a.name}!`, `Where is the ${a.name}?`, `The ${a.name}!`);
        PP.data.SHAPES.forEach((b) => { if (a !== b) L.push(`That's the ${b.name} hole.`); });
      });
      return L;
    },
    create(stage, ctx) {
      const probe = ctx.el('div', { style: { position: 'absolute', visibility: 'hidden', pointerEvents: 'none', padding: 'var(--safe-t) var(--safe-r) var(--safe-b) var(--safe-l)' } });
      const mat = ctx.el('div', { class: 'ss-mat ss-fade' });
      const box = ctx.el('div', { class: 'ss-box ss-fade' });
      const front = ctx.el('div', { class: 'ss-front' });
      const lid = ctx.el('div', { class: 'ss-lid' });
      box.append(front, lid);
      stage.append(probe, ctx.el('div', { class: 'ss-wallstars' }), mat, box);
      ctx.mascot.show({ corner: 'tr', size: 'clamp(64px, 11vmin, 100px)' });

      let pieces = []; // {id, name, color, el, inner, home:{x,y,rot}, state:'mat'|'fly'|'in'}
      let holes = []; // {id, name, x, y (stage coords), lx, ly (lid coords), hit, hl}
      let L = null; // layout numbers
      let selected = null;
      let roundErrors = 0, missReported = false;
      let busy = true; // between rounds
      let roundDoneResolve = null;
      let lastTouch = 0;
      let lidPopped = 'none';

      const say = (t, o) => ctx.say(t, o);
      const cap = U.cap;

      /* ---------------- layout ---------------- */
      function computeLayout() {
        const W = stage.clientWidth, H = stage.clientHeight;
        const cs = getComputedStyle(probe);
        const sf = { t: parseFloat(cs.paddingTop) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0, r: parseFloat(cs.paddingRight) || 0 };
        const n = pieces.length || 3;
        const small = Math.min(W, H) < 520;
        const pad = small ? 14 : 30;
        const land = W > H * 1.15;
        let boxA, matA;
        if (land) {
          const split = 0.5;
          matA = { x: sf.l + pad, y: sf.t + (small ? 88 : 104), w: (W - sf.l - sf.r) * split - pad * 1.5, h: 0 };
          matA.h = H - sf.b - pad - matA.y;
          boxA = { x: sf.l + (W - sf.l - sf.r) * split + pad * 0.5, y: sf.t + (small ? 74 : 112), w: (W - sf.l - sf.r) * (1 - split) - pad * 1.5, h: 0 }; // below Pip (top-right)
          boxA.h = H - sf.b - pad - boxA.y - 10;
        } else {
          const top = sf.t + (small ? 92 : 112);
          const avail = H - sf.b - pad - top;
          const boxH = avail * (n > 5 ? 0.46 : 0.44);
          boxA = { x: sf.l + pad, y: top, w: W - sf.l - sf.r - pad * 2, h: boxH };
          matA = { x: sf.l + pad, y: top + boxH + (small ? 18 : 30), w: W - sf.l - sf.r - pad * 2, h: 0 };
          matA.h = H - sf.b - pad - matA.y - 8;
        }
        // hole grid that gives the biggest holes inside the box area (lid + front face)
        const PADF = 0.26, GAPF = 0.3, FRONTF = 0.34;
        let best = null;
        for (let c = 1; c <= n; c++) {
          const r = Math.ceil(n / c);
          const byW = boxA.w / (c + (c - 1) * GAPF + PADF * 2);
          const byH = boxA.h / ((r + (r - 1) * GAPF + PADF * 2) * (1 + FRONTF) + 0.12);
          const hs = Math.min(byW, byH);
          if (!best || hs > best.hs + 0.5) best = { c, r, hs };
        }
        // pieces on the mat
        const mg = U.layoutGrid(n, matA.w - 24, matA.h - 24, small ? 10 : 18);
        const psMat = mg.size * 0.84;
        const maxP = small ? 128 : 190;
        const ps = Math.max(40, Math.min(psMat, best.hs / HOLE_K, maxP));
        const hs = ps * HOLE_K;
        const g = hs * GAPF, p = hs * PADF;
        const lw = best.c * hs + (best.c - 1) * g + p * 2;
        const lh = best.r * hs + (best.r - 1) * g + p * 2;
        const fh = Math.max(lh * FRONTF, 28);
        const bx = boxA.x + (boxA.w - lw) / 2;
        const by = boxA.y + Math.max(0, (boxA.h - lh - fh) / 2) * (land ? 0.8 : 0.7);
        return { W, H, sf, land, small, boxA, matA, mg, ps, hs, g, p, lw, lh, fh, bx, by, cols: best.c, rows: best.r };
      }

      function layout() {
        if (!pieces.length) return;
        L = computeLayout();
        // mat
        Object.assign(mat.style, { left: L.matA.x + 'px', top: L.matA.y + 'px', width: L.matA.w + 'px', height: L.matA.h + 'px' });
        // box
        Object.assign(box.style, { left: L.bx + 'px', top: L.by + 'px', width: L.lw + 'px', height: (L.lh + L.fh) + 'px' });
        renderBox();
        // pieces' home slots on the mat
        const n = pieces.length;
        const cols = L.mg.cols, rows = L.mg.rows;
        const cw = (L.matA.w - 24) / cols, ch = (L.matA.h - 24) / rows;
        pieces.forEach((pc, i) => {
          const slot = pc.slot;
          const r = Math.floor(slot / cols), c = slot % cols;
          const inRow = r === rows - 1 ? n - (rows - 1) * cols : cols;
          const offX = (cols - inRow) * cw / 2;
          const jx = pc.jit[0] * Math.max(0, cw - L.ps) * 0.35, jy = pc.jit[1] * Math.max(0, ch - L.ps) * 0.35;
          pc.home = { x: L.matA.x + 12 + offX + cw * (c + 0.5) + jx, y: L.matA.y + 12 + ch * (r + 0.5) + jy, rot: pc.rot };
          pc.el.style.width = pc.el.style.height = L.ps + 'px';
          if (pc.state === 'mat' && !pc.dragging) place(pc, pc.home.x, pc.home.y, pc.home.rot, 1);
        });
      }

      function renderBox() {
        const { lw, lh, fh, hs, g, p } = L;
        const s = lw / 300;
        const lip = Math.max(8, lh * 0.07);
        // front face of the box (below the lid)
        const fw = lw * 0.94, fx = (lw - fw) / 2;
        Object.assign(front.style, { left: fx + 'px', top: (lh - lip * 0.6) + 'px', width: fw + 'px', height: (fh + lip * 0.6) + 'px' });
        const FH = fh + lip * 0.6;
        let stars = '';
        const nS = Math.max(3, Math.round(fw / 70));
        for (let i = 0; i < nS; i++) {
          const cx = (fw * (i + 0.5)) / nS, cy = FH * (i % 2 ? 0.62 : 0.5), R = Math.min(FH * 0.2, 16 * s + 6), r = R * 0.45;
          let d = '';
          for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + (j * Math.PI) / 5, rr = j % 2 ? r : R; d += (j ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); }
          stars += i % 2 ? `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(R * 0.55).toFixed(1)}" fill="#fff" opacity=".85"/>` : `<path d="${d}Z" fill="#FFD21F" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>`;
        }
        const rr = Math.min(FH * 0.45, 26);
        front.innerHTML = `<svg viewBox="0 0 ${fw.toFixed(1)} ${FH.toFixed(1)}" preserveAspectRatio="none">
          <path d="M0 0H${fw.toFixed(1)}V${(FH - rr).toFixed(1)}Q${fw.toFixed(1)} ${FH.toFixed(1)} ${(fw - rr).toFixed(1)} ${FH.toFixed(1)}H${rr.toFixed(1)}Q0 ${FH.toFixed(1)} 0 ${(FH - rr).toFixed(1)}Z" fill="${FRONT}"/>
          <path d="M0 ${(FH * 0.8).toFixed(1)}H${fw.toFixed(1)}V${(FH - rr).toFixed(1)}Q${fw.toFixed(1)} ${FH.toFixed(1)} ${(fw - rr).toFixed(1)} ${FH.toFixed(1)}H${rr.toFixed(1)}Q0 ${FH.toFixed(1)} 0 ${(FH - rr).toFixed(1)}Z" fill="#000" opacity=".12"/>
          <rect x="0" y="0" width="${fw.toFixed(1)}" height="${(lip * 1.2).toFixed(1)}" fill="#000" opacity=".18"/>
          ${stars}
        </svg>`;
        // lid with holes
        Object.assign(lid.style, { top: '0px', width: lw + 'px', height: lh + 'px' });
        const rad = Math.min(lw, lh) * 0.14;
        const lvl = ctx.level;
        let holesSvg = '';
        holes.forEach((h, i) => {
          const c = i % L.cols, r = Math.floor(i / L.cols);
          const inRow = r === L.rows - 1 ? holes.length - (L.rows - 1) * L.cols : L.cols;
          const off = (L.cols - inRow) * (hs + g) / 2;
          h.lx = p + off + c * (hs + g) + hs / 2;
          h.ly = p + r * (hs + g) + hs / 2;
          const k = hs / 100;
          const markup = PP.data.shapeById(h.id).markup;
          const pc = pieces.find((x) => x.id === h.id);
          const rim = lvl === 2 && pc ? pc.color : 'rgba(255,255,255,.55)';
          holesSvg += `<g transform="translate(${(h.lx - hs / 2).toFixed(1)} ${(h.ly - hs / 2).toFixed(1)}) scale(${k.toFixed(4)})">
              <g fill="none" stroke="${rim}" stroke-width="${lvl === 2 ? 11 : 9}" stroke-linejoin="round" transform="translate(50 50) scale(1.06) translate(-50 -50)">${markup}</g>
              <g fill="url(#ss-holeg)" stroke="#1B1430" stroke-width="3" stroke-linejoin="round">${markup}</g>
              <g class="ss-hl" data-i="${i}" fill="none" stroke="#FFE45C" stroke-width="10" stroke-linejoin="round" transform="translate(50 50) scale(1.13) translate(-50 -50)">${markup}</g>
            </g>`;
        });
        lid.innerHTML = `<svg viewBox="0 0 ${lw.toFixed(1)} ${lh.toFixed(1)}">
          <rect x="0" y="${(lip * 0.6).toFixed(1)}" width="${lw.toFixed(1)}" height="${lh.toFixed(1)}" rx="${rad.toFixed(1)}" fill="${U.shade(LID, -0.28)}"/>
          <rect x="0" y="0" width="${lw.toFixed(1)}" height="${(lh - lip * 0.4).toFixed(1)}" rx="${rad.toFixed(1)}" fill="${LID}"/>
          <rect x="${(rad * 0.5).toFixed(1)}" y="${(lip * 0.45).toFixed(1)}" width="${(lw - rad).toFixed(1)}" height="${(lip * 0.9).toFixed(1)}" rx="${(lip * 0.45).toFixed(1)}" fill="#fff" opacity=".28"/>
          ${holesSvg}
        </svg>`;
        holes.forEach((h, i) => {
          h.hl = lid.querySelector(`.ss-hl[data-i="${i}"]`);
          if (h.glowing) h.hl.classList.add('glow');
          const sz = Math.max(hs * 1.25, 64);
          if (!h.hit) {
            h.hit = ctx.el('div', { class: 'ss-hole' });
            ctx.tap(h.hit, () => onHoleTap(h));
          }
          lid.appendChild(h.hit);
          Object.assign(h.hit.style, { left: (h.lx - sz / 2) + 'px', top: (h.ly - sz / 2) + 'px', width: sz + 'px', height: sz + 'px' });
          h.x = L.bx + h.lx;
          h.y = L.by + h.ly;
        });
      }
      ctx.onResize(layout);

      /* ---------------- piece helpers ---------------- */
      function place(pc, x, y, rot, s) {
        pc.cur = { x, y, rot, s };
        pc.el.style.transform = `translate(${(x - L.ps / 2).toFixed(1)}px, ${(y - L.ps / 2).toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${s})`;
      }
      const tf = (x, y, rot, s) => `translate(${(x - L.ps / 2).toFixed(1)}px, ${(y - L.ps / 2).toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${s})`;
      /** fly along an arc; resolves when done */
      function flyTo(pc, x, y, rot, s, ms, hop) {
        const a = pc.cur;
        const frames = [];
        const N = 10;
        const h = hop == null ? Math.min(140, Math.hypot(x - a.x, y - a.y) * 0.35 + 30) : hop;
        for (let i = 0; i <= N; i++) {
          const t = i / N;
          const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          const px = a.x + (x - a.x) * e, py = a.y + (y - a.y) * e - Math.sin(Math.PI * t) * h;
          const sc = a.s + (s - a.s) * e + Math.sin(Math.PI * t) * 0.12;
          frames.push({ transform: tf(px, py, a.rot + (rot - a.rot) * e, sc) });
        }
        place(pc, x, y, rot, s);
        try { pc.el.animate(frames, { duration: ms, easing: 'linear' }); } catch (e) {}
        return ctx.wait(ms);
      }
      function pieceCenter(pc) { return { x: pc.cur.x, y: pc.cur.y }; }
      const holeFor = (pc) => holes.find((h) => h.id === pc.id);

      function flashHole(h) { if (!h.hl) return; h.hl.classList.remove('flash'); h.hl.getBoundingClientRect(); h.hl.classList.add('flash'); ctx.setTimeout(() => h.hl && h.hl.classList.remove('flash'), 650); }
      function glowHole(h, on) {
        holes.forEach((x) => { if (x !== h || !on) { x.glowing = false; x.hl && x.hl.classList.remove('glow'); } });
        if (on && h) { h.glowing = true; h.hl && h.hl.classList.add('glow'); }
      }
      function hoverHole(h) { holes.forEach((x) => x.hl && x.hl.classList.toggle('hover', x === h)); }

      function select(pc) {
        if (selected && selected !== pc) selected.el.classList.remove('sel');
        selected = pc;
        if (pc) pc.el.classList.add('sel');
      }

      function plonkSound() {
        ctx.drum('tom', { pitch: 170, vel: 0.9, bus: 'sfx' });
        ctx.drum('woodblock', { vel: 0.5, bus: 'sfx', delay: 0.02 });
        ctx.sfx('pop', { vel: 0.35, delay: 0.05 });
      }
      function boxBump() {
        try { box.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.03,.95)' }, { transform: 'scale(.99,1.02)' }, { transform: 'scale(1,1)' }], { duration: 320, easing: 'ease-out' }); } catch (e) {}
      }

      /** shape goes into its hole */
      async function dropIn(pc, h, opts) {
        opts = opts || {};
        pc.state = 'fly';
        pc.el.classList.remove('lift', 'sel', 'drag');
        pc.el.classList.add('fly');
        if (selected === pc) select(null);
        const fit = (L.hs / (L.ps * SHAPE_FRAC)) * 0.95;
        await flyTo(pc, h.x, h.y, 0, fit, opts.ms || 520, opts.hop);
        // sink into the hole
        try {
          pc.el.animate([
            { transform: tf(h.x, h.y, 0, fit), opacity: 1 },
            { transform: tf(h.x, h.y + L.hs * 0.04, 0, fit * 0.86), opacity: 1, offset: 0.4 },
            { transform: tf(h.x, h.y + L.hs * 0.1, 0, fit * 0.55), opacity: 0 },
          ], { duration: 260, easing: 'ease-in', fill: 'forwards' });
        } catch (e) {}
        await ctx.wait(140);
        plonkSound();
        boxBump();
        flashHole(h);
        glowHole(null, false);
        PP.fx.burst(h.x, h.y, { emoji: ['✨', '⭐'], count: 5, size: 26, distance: L.hs * 0.8 });
        await ctx.wait(140);
        pc.state = 'in';
        pc.el.style.visibility = 'hidden';
        checkDone();
      }

      /** wrong hole: bonk and bounce back */
      async function bonk(pc, h) {
        pc.state = 'fly';
        pc.el.classList.remove('lift', 'sel', 'drag');
        pc.el.classList.add('fly');
        if (selected === pc) select(null);
        roundErrors++;
        if (roundErrors >= 2 && !missReported) { missReported = true; ctx.miss(); }
        await flyTo(pc, h.x, h.y - L.hs * 0.1, pc.cur.rot * 0.5, 1.05, 300, 30);
        ctx.drum('woodblock', { vel: 0.8, bus: 'sfx' });
        ctx.sfx('boing', { vel: 0.55 });
        ctx.sfx('oops', { vel: 0.5, delay: 0.1 });
        pc.el.classList.add('wig');
        ctx.setTimeout(() => pc.el.classList.remove('wig'), 520);
        const right = holeFor(pc);
        glowHole(right, true);
        ctx.mascot.mood('think');
        say(`That's the ${h.name} hole. Find the ${pc.name} hole!`);
        await ctx.wait(220);
        await flyTo(pc, pc.home.x, pc.home.y, pc.home.rot, 1, 520, 60);
        pc.state = 'mat';
        pc.el.classList.remove('fly');
      }

      async function goHome(pc) {
        pc.state = 'fly';
        pc.el.classList.add('fly');
        await flyTo(pc, pc.home.x, pc.home.y, pc.home.rot, 1, 360, 20);
        pc.state = 'mat';
        pc.el.classList.remove('fly', 'lift');
      }

      function correctLine(pc) {
        return `${cap(pc.name)}! ${ctx.pick(['In it goes!', 'Plonk!', 'It fits!', 'In the box!'])}`;
      }

      async function attempt(pc, h) {
        hoverHole(null);
        if (h.id === pc.id) {
          say(correctLine(pc));
          ctx.mascot.mood('happy');
          await dropIn(pc, h);
        } else {
          await bonk(pc, h);
        }
      }

      /* ---------------- input: pieces ---------------- */
      function bindPiece(pc) {
        let pid = null, sx = 0, sy = 0, ox = 0, oy = 0, moved = false;
        ctx.on(pc.el, 'pointerdown', (e) => {
          if (e.button > 0 || pid !== null) return;
          e.preventDefault();
          lastTouch = performance.now();
          if (pc.state !== 'mat' || busy) {
            if (pc.state === 'mat') { ctx.sfx('tap', { vel: 0.5 }); say(`${cap(pc.name)}!`, { mode: 'skip' }); }
            return;
          }
          pid = e.pointerId;
          try { pc.el.setPointerCapture(pid); } catch (err) {}
          sx = e.clientX; sy = e.clientY;
          ox = pc.cur.x; oy = pc.cur.y;
          moved = false;
          pc.el.classList.add('lift');
          ctx.sfx('tap', { vel: 0.7 });
          ctx.play('marimba', ['C5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6'][pieces.indexOf(pc) % 8], { vel: 0.35, bus: 'sfx' });
          // touching a shape always says its name (level 1 also announces the hop)
          if (ctx.level > 1) say(`${cap(pc.name)}!`);
        });
        ctx.on(pc.el, 'pointermove', (e) => {
          if (e.pointerId !== pid) return;
          const dx = e.clientX - sx, dy = e.clientY - sy;
          if (!moved && Math.hypot(dx, dy) > 12) {
            moved = true;
            pc.dragging = true;
            pc.el.classList.add('drag');
            if (selected && selected !== pc) select(null);
            pc.el.classList.remove('sel');
          }
          if (moved) {
            const rot = pc.home.rot * Math.max(0, 1 - Math.hypot(dx, dy) / 160);
            place(pc, ox + dx, oy + dy, rot, 1);
            if (ctx.level > 1) {
              const near = nearestHole(pc.cur.x, pc.cur.y);
              hoverHole(near && near.d < L.hs * 1.3 ? near.h : null);
            }
          }
        });
        const up = (e) => {
          if (e.pointerId !== pid) return;
          pid = null;
          pc.dragging = false;
          pc.el.classList.remove('drag');
          if (pc.state !== 'mat') return;
          if (!moved) return onPieceTap(pc);
          onPieceDrop(pc);
        };
        ctx.on(pc.el, 'pointerup', up);
        ctx.on(pc.el, 'pointercancel', up);
      }

      function nearestHole(x, y) {
        let best = null;
        holes.forEach((h) => { const d = Math.hypot(x - h.x, y - h.y); if (!best || d < best.d) best = { h, d }; });
        return best;
      }

      function onPieceTap(pc) {
        if (ctx.level === 1) {
          // youngest players: it hops in by itself
          say(`${cap(pc.name)}! In it goes!`);
          dropIn(pc, holeFor(pc), { ms: 700 });
          return;
        }
        if (selected === pc) {
          // second tap on the same shape: nudge toward its hole
          glowHole(holeFor(pc), true);
          say(`Find the ${pc.name} hole!`);
          return;
        }
        pc.el.classList.remove('lift');
        select(pc);
        ctx.setPrompt(`Find the ${pc.name} hole!`);
      }

      function onPieceDrop(pc) {
        const c = pieceCenter(pc);
        const right = holeFor(pc);
        if (ctx.level === 1) { say(`${cap(pc.name)}! In it goes!`); dropIn(pc, right, { ms: 420, hop: 30 }); return; }
        const dRight = Math.hypot(c.x - right.x, c.y - right.y);
        const near = nearestHole(c.x, c.y);
        const over = near && near.d < L.hs * 0.6 ? near.h : null;
        hoverHole(null);
        if (over === right || (!over && dRight < L.hs * 1.3)) {
          say(correctLine(pc));
          ctx.mascot.mood('happy');
          dropIn(pc, right, { ms: 260, hop: 12 });
        } else if (over) {
          bonk(pc, over);
        } else {
          goHome(pc);
        }
      }

      /* ---------------- input: holes, box, background ---------------- */
      function onHoleTap(h) {
        lastTouch = performance.now();
        if (busy) return;
        if (selected && selected.state === 'mat') {
          const pc = selected;
          select(null);
          attempt(pc, h);
          return;
        }
        flashHole(h);
        ctx.sfx('click', { vel: 0.6 });
        ctx.drum('woodblock', { vel: 0.4, bus: 'sfx' });
        say(`The ${h.name} hole!`);
      }
      ctx.tap(front, () => {
        lastTouch = performance.now();
        rattleBox(4);
        const inside = pieces.filter((p) => p.state === 'in').length;
        if (inside) say('Shake shake!', { mode: 'skip' });
      });
      ctx.tap(stage, (e, pt) => {
        if (e.target.closest && e.target.closest('.ss-piece, .ss-hole, .ss-front, .pp-game-pip, .ss-find')) return;
        lastTouch = performance.now();
        if (selected) { select(null); ctx.sfx('swish', { vel: 0.4 }); return; }
        ctx.sfx('bubble', { vel: 0.3 });
        PP.fx.burst(pt.x, pt.y, { emoji: ['✨'], count: 3, size: 22, distance: 40 });
      }, { preventDefault: false });

      function rattleBox(times) {
        for (let i = 0; i < times; i++) ctx.drum('shaker', { delay: i * 0.09, vel: 0.6, bus: 'sfx' });
        try {
          box.animate([
            { transform: 'rotate(0)' }, { transform: 'rotate(-4deg) translateX(-4px)' }, { transform: 'rotate(4deg) translateX(4px)' },
            { transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0)' },
          ], { duration: times * 90 + 120, easing: 'ease-in-out' });
        } catch (e) {}
      }

      /* ---------------- ghost hint ---------------- */
      async function ghostHint(pc) {
        const h = holeFor(pc);
        if (!h || !L) return;
        const g = ctx.el('div', { class: 'ss-ghost', html: pieceSVG(pc.id, pc.color) });
        const f = ctx.el('div', { class: 'ss-finger pp-emoji', text: '👆' });
        g.style.width = g.style.height = L.ps + 'px';
        stage.append(g, f);
        const T = (x, y, s) => `translate(${(x - L.ps / 2).toFixed(1)}px, ${(y - L.ps / 2).toFixed(1)}px) scale(${s})`;
        const F = (x, y) => `translate(${(x - 10).toFixed(1)}px, ${(y + L.ps * 0.15).toFixed(1)}px)`;
        const a = pc.home, b = h;
        const fr = [], ff = [];
        for (let i = 0; i <= 10; i++) {
          const t = i / 10, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          const x = a.x + (b.x - a.x) * e, y = a.y + (b.y - a.y) * e - Math.sin(Math.PI * t) * 60;
          fr.push({ transform: T(x, y, 1 - 0.1 * e), opacity: i === 10 ? 0 : 0.6 });
          ff.push({ transform: F(x, y), opacity: i === 10 ? 0 : 1 });
        }
        try { g.animate(fr, { duration: 1500, easing: 'linear', fill: 'forwards' }); f.animate(ff, { duration: 1500, easing: 'linear', fill: 'forwards' }); } catch (e) {}
        await ctx.wait(1550);
        g.remove(); f.remove();
      }

      /* ---------------- rounds ---------------- */
      function checkDone() {
        if (pieces.length && pieces.every((p) => p.state === 'in') && roundDoneResolve) {
          const r = roundDoneResolve;
          roundDoneResolve = null;
          r();
        }
      }

      function buildRound() {
        const lvl = ctx.level;
        const shapes = PP.data.shapesForLevel(lvl);
        const colors = ctx.shuffle(PALETTE).slice(0, shapes.length);
        pieces.forEach((p) => p.el.remove());
        holes.forEach((h) => h.hit && h.hit.remove());
        const order = ctx.shuffle(shapes.map((s, i) => i));
        const maxRot = [0, 8, 10, 16, 24, 28][lvl];
        pieces = shapes.map((s, i) => {
          const el = ctx.el('div', { class: 'ss-piece pop' });
          const inner = ctx.el('div', { class: 'ss-inner', html: pieceSVG(s.id, colors[i]) });
          el.appendChild(inner);
          el.style.animationDelay = '0ms';
          inner.style.animationDelay = i * 70 + 'ms';
          return { id: s.id, name: s.name, color: colors[i], el, inner, state: 'mat', slot: order[i], jit: [ctx.rand(-1, 1), ctx.rand(-1, 1)], rot: ctx.rand(-maxRot, maxRot), dragging: false };
        });
        // holes in a shuffled order on the lid
        holes = ctx.shuffle(shapes).map((s) => ({ id: s.id, name: s.name, glowing: false }));
        pieces.forEach((p) => { stage.appendChild(p.el); bindPiece(p); });
        layout();
        ctx.setTimeout(() => pieces.forEach((p) => p.el.classList.remove('pop')), 600 + pieces.length * 70);
        roundErrors = 0;
        missReported = false;
        selected = null;
      }

      async function sorterRound(first) {
        buildRound();
        lid.style.transform = '';
        ctx.sfx('pop', { vel: 0.4 });
        const lvl = ctx.level;
        const intro = lvl === 1 ? 'Tap a shape! In the box it goes!' : 'Put the shapes in the box!';
        const prompt = lvl === 1 ? 'Tap a shape!' : 'Put the shapes in the box!';
        ctx.setPrompt(prompt);
        const done = new Promise((r) => { roundDoneResolve = r; });
        busy = false;
        say(first ? (lvl === 1 ? "Shapes! Let's put them in the box! Tap a shape!" : intro) : ctx.pick(['New shapes! Put them in!', 'More shapes! In the box!', intro]));
        let idles = 0;
        const stopIdle = ctx.idle(7500, () => {
          const left = pieces.filter((p) => p.state === 'mat');
          if (!left.length) return;
          idles++;
          const pc = selected && selected.state === 'mat' ? selected : ctx.pick(left);
          if (ctx.level === 1) {
            pc.el.classList.add('wig');
            ctx.setTimeout(() => pc.el.classList.remove('wig'), 520);
            say(`Tap the ${pc.name}!`);
          } else {
            say(`Put the ${pc.name} in its hole!`);
            glowHole(holeFor(pc), true);
            ghostHint(pc);
          }
        });
        await done;
        stopIdle();
        busy = true;
        glowHole(null, false);
        select(null);
        await ctx.wait(300);
        // shake, pop, burst!
        say('All in! Shake, shake, shake!');
        rattleBox(8);
        await ctx.wait(950);
        ctx.sfx('pop', { vel: 0.9 });
        ctx.sfx('boing', { vel: 0.7, delay: 0.05 });
        try {
          const up = Math.min(L.lh * 0.55, 150);
          lidPopped = `translateY(${-up}px) rotate(-12deg)`;
          lid.style.transform = lidPopped;
          lid.animate([{ transform: 'none' }, { transform: `translateY(${-up * 1.3}px) rotate(-16deg)` }, { transform: lidPopped }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
        } catch (e) {}
        burstOut();
        ctx.success(roundErrors === 0);
        await ctx.celebrate({ big: true, x: L.bx + L.lw / 2, y: L.by + L.lh * 0.3, say: ctx.pick(['Pop! Hooray!', 'Wow! All the shapes!', 'Pop! You did it!']) });
        // lid back on
        try {
          lid.style.transform = '';
          lid.animate([{ transform: lidPopped }, { transform: 'translateY(4%)' }, { transform: 'none' }], { duration: 380, easing: 'ease-in' });
        } catch (e) {}
        await ctx.wait(300);
        ctx.drum('tom', { pitch: 120, vel: 0.6, bus: 'sfx' });
        await ctx.wait(250);
      }

      function burstOut() {
        const cx = L.bx + L.lw / 2, cy = L.by + L.lh * 0.4;
        const parts = pieces.map((pc, i) => {
          const el = ctx.el('div', { class: 'ss-ghost', html: pieceSVG(pc.id, pc.color) });
          el.style.opacity = '1';
          el.style.width = el.style.height = L.ps * 0.8 + 'px';
          stage.appendChild(el);
          const a = -Math.PI / 2 + (i / Math.max(1, pieces.length - 1) - 0.5) * 2.2 + ctx.rand(-0.15, 0.15);
          const sp = ctx.rand(9, 14) * Math.min(1.3, Math.max(0.75, L.H / 800));
          return { el, x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, r: 0, vr: ctx.rand(-9, 9) };
        });
        ctx.raf((dt) => {
          const k = dt * 60;
          let alive = 0;
          parts.forEach((p) => {
            if (!p.el.parentNode) return;
            p.vy += 0.42 * k;
            p.x += p.vx * k; p.y += p.vy * k; p.r += p.vr * k;
            if (p.y > L.H + L.ps) { p.el.remove(); return; }
            alive++;
            p.el.style.transform = `translate(${(p.x - L.ps * 0.4).toFixed(1)}px, ${(p.y - L.ps * 0.4).toFixed(1)}px) rotate(${p.r.toFixed(1)}deg)`;
          });
          return alive > 0;
        });
      }

      /* ---------------- "Find the star!" bonus ---------------- */
      async function findBonus() {
        const lvl = ctx.level;
        const shapes = PP.data.shapesForLevel(lvl);
        const n = Math.min(shapes.length, [2, 2, 2, 3, 3, 4][lvl]);
        const target = ctx.pick(shapes);
        const others = ctx.sample(shapes.filter((s) => s.id !== target.id), n - 1);
        const colors = ctx.shuffle(PALETTE);
        const choices = ctx.shuffle([target].concat(others)).map((s, i) => ({ id: s.id, name: s.name, render: () => PP.data.shapeSVG(s.id, colors[i]) }));
        pieces.forEach((p) => p.el.classList.add('ss-hide'));
        mat.classList.add('ss-hide');
        box.classList.add('ss-hide');
        const area = ctx.el('div', { class: 'ss-find' });
        stage.appendChild(area);
        await PP.kit.findRound(ctx, {
          container: area,
          choices,
          targetId: target.id,
          intro: ctx.pick(['Shape hunt!', 'Quick game!']),
          prompt: ctx.pick([`Find the ${target.name}!`, `Where is the ${target.name}?`]),
          maxCard: 230,
          sayRight: (c) => `${ctx.praise()} The ${c.name}!`,
        });
        area.remove();
        mat.classList.remove('ss-hide');
        box.classList.remove('ss-hide');
      }

      (async () => {
        let round = 0;
        while (ctx.alive) {
          await sorterRound(round === 0);
          round++;
          if (round % 2 === 0) await findBonus();
        }
      })();

      return { destroy() { pieces = []; holes = []; } };
    },
  });
})();
