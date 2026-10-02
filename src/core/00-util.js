/* Pip's Playroom — core utilities
 * Everything lives on window.PP. Load order is the file-name order (00-, 01-, ...).
 */
(function () {
  'use strict';
  const PP = (window.PP = window.PP || {});
  PP.version = '1.0.0';
  PP.games = PP.games || [];

  const SVGNS = 'http://www.w3.org/2000/svg';

  function applyAttrs(e, attrs) {
    if (!attrs) return;
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class' || k === 'className') e.setAttribute('class', v);
      else if (k === 'style' && typeof v === 'object') {
        for (const s in v) {
          if (s.startsWith('--')) e.style.setProperty(s, v[s]);
          else e.style[s] = v[s];
        }
      } else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
  }
  function appendKids(e, kids) {
    for (const c of kids.flat(Infinity)) {
      if (c == null || c === false) continue;
      e.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    }
  }

  const U = (PP.util = {
    rand: (a, b) => a + Math.random() * (b - a),
    randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    sample: (arr, n) => U.shuffle(arr).slice(0, n),
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    /** el('div', {class:'x', style:{left:'4px'}, onPointerdown: fn}, child, 'text') */
    el(tag, attrs, ...kids) {
      const e = document.createElement(tag);
      applyAttrs(e, attrs);
      appendKids(e, kids);
      return e;
    },
    /** svg('circle', {cx:5, cy:5, r:4, fill:'red'}) — SVG namespace element */
    svg(tag, attrs, ...kids) {
      const e = document.createElementNS(SVGNS, tag);
      applyAttrs(e, attrs);
      appendKids(e, kids);
      return e;
    },
    /** Parse an HTML/SVG string into a single element (first element child). */
    html(str) {
      const t = document.createElement('template');
      t.innerHTML = str.trim();
      return t.content.firstElementChild;
    },
    /** Add a <style> block once per id. Games should namespace their classes (e.g. .g-balloons-*) */
    addStyles(id, css) {
      if (document.getElementById('style-' + id)) return;
      const s = document.createElement('style');
      s.id = 'style-' + id;
      s.textContent = css;
      document.head.appendChild(s);
    },
    /** Add SVG <defs> content (gradients/filters) to the global, always-rendered defs sprite. */
    addDefs(id, defsMarkup) {
      if (document.getElementById('defs-' + id)) return;
      const host = document.getElementById('pp-defs');
      const g = document.createElementNS(SVGNS, 'g');
      g.id = 'defs-' + id;
      g.innerHTML = defsMarkup;
      host.querySelector('defs').appendChild(g);
    },
    /** Lighten (amt>0) or darken (amt<0) a hex color. amt in -1..1 */
    shade(hex, amt) {
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map((x) => x + x).join('');
      const n = parseInt(c, 16);
      let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
      r = Math.round((t - r) * p + r);
      g = Math.round((t - g) * p + g);
      b = Math.round((t - b) * p + b);
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },
    rgba(hex, a) {
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map((x) => x + x).join('');
      const n = parseInt(c, 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    },
    /** Center point of an element in viewport coords */
    center(el) {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    },
    /**
     * Best grid for n square-ish cards inside w×h. Returns {cols, rows, size}
     * where size is the largest square card edge that fits (gap included).
     */
    layoutGrid(n, w, h, gap = 16) {
      let best = { cols: 1, rows: n, size: 0 };
      for (let cols = 1; cols <= n; cols++) {
        const rows = Math.ceil(n / cols);
        const size = Math.min((w - gap * (cols + 1)) / cols, (h - gap * (rows + 1)) / rows);
        if (size > best.size) best = { cols, rows, size: Math.floor(size) };
      }
      return best;
    },
    /** Capitalize first letter */
    cap: (s) => (s ? s[0].toUpperCase() + s.slice(1) : s),
    isTouch: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
  });

  /* Tiny event bus: PP.bus.on('speech:start', fn) */
  const listeners = {};
  PP.bus = {
    on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); return () => PP.bus.off(evt, fn); },
    off(evt, fn) { const l = listeners[evt]; if (l) { const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); } },
    emit(evt, data) { (listeners[evt] || []).slice().forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } }); },
  };

  /** Register an activity. See GAME_API.md */
  PP.registerGame = function (def) {
    if (!def || !def.id || typeof def.create !== 'function') {
      console.error('registerGame: invalid definition', def);
      return;
    }
    if (PP.games.find((g) => g.id === def.id)) {
      console.warn('registerGame: duplicate id', def.id);
      return;
    }
    PP.games.push(def);
    PP.games.sort((a, b) => (a.order || 100) - (b.order || 100));
    PP.bus.emit('games:changed');
  };
})();
