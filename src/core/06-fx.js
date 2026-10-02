/* Pip's Playroom — visual effects (all GPU-friendly transforms).
 *   PP.fx.confetti({x, y, count=80, colors, spread=1, power=1})   canvas confetti (x,y viewport px; default center)
 *   PP.fx.burst(x, y, {emoji:'⭐', count:8, size:40, distance:120})  emoji/star burst
 *   PP.fx.floatText(x, y, text, {color, size})                     big rising word/numeral ("3!", "Red!")
 *   PP.fx.flyTo(el, targetEl|{x,y}, {duration, scale}) -> Promise   clone flies to a point
 *   PP.fx.ripple(x, y, color)                                       touch ripple (automatic on every touch)
 *   PP.fx.glow(el, ms)                                              temporary glow ring (hint)
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;
  const FX = (PP.fx = {});
  const PALETTE = ['#EF3B36', '#FF8C1A', '#FFD21F', '#3DBE4B', '#2F7BEA', '#8E4FD6', '#FF6FB5', '#22C3C3'];

  function layer() {
    let l = document.getElementById('pp-fx');
    if (!l) {
      l = U.el('div', { id: 'pp-fx' });
      document.body.appendChild(l);
    }
    return l;
  }

  /* ---- confetti (single shared canvas, runs only while particles exist) ---- */
  let canvas = null, c2d = null, parts = [], running = false, dpr = 1;
  function ensureCanvas() {
    if (canvas) return;
    canvas = U.el('canvas', { id: 'pp-confetti' });
    document.body.appendChild(canvas);
    c2d = canvas.getContext('2d');
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);
  }
  function sizeCanvas() {
    if (!canvas) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
  }
  function tick() {
    if (!parts.length) { running = false; c2d.clearRect(0, 0, canvas.width, canvas.height); return; }
    c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    c2d.clearRect(0, 0, innerWidth, innerHeight);
    const H = innerHeight + 40;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.32;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life--;
      if (p.y > H || p.life <= 0) { parts.splice(i, 1); continue; }
      c2d.save();
      c2d.globalAlpha = Math.min(1, p.life / 30);
      c2d.translate(p.x, p.y);
      c2d.rotate(p.rot);
      c2d.fillStyle = p.color;
      if (p.shape === 0) {
        c2d.scale(1, Math.cos(p.rot * 2.3));
        c2d.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      } else if (p.shape === 1) {
        c2d.beginPath();
        c2d.arc(0, 0, p.s / 2.6, 0, Math.PI * 2);
        c2d.fill();
      } else {
        c2d.beginPath();
        for (let k = 0; k < 5; k++) {
          const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
          c2d.lineTo(Math.cos(a) * p.s / 1.8, Math.sin(a) * p.s / 1.8);
          const b = a + Math.PI / 5;
          c2d.lineTo(Math.cos(b) * p.s / 4, Math.sin(b) * p.s / 4);
        }
        c2d.closePath();
        c2d.fill();
      }
      c2d.restore();
    }
    requestAnimationFrame(tick);
  }
  FX.confetti = function (o) {
    o = o || {};
    ensureCanvas();
    const x = o.x == null ? innerWidth / 2 : o.x;
    const y = o.y == null ? innerHeight / 2 : o.y;
    const n = Math.min(220, o.count || 80);
    const colors = o.colors || PALETTE;
    const power = (o.power || 1) * Math.min(1.4, Math.max(0.7, innerHeight / 800));
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3 * (o.spread || 1);
      const sp = (6 + Math.random() * 11) * power;
      parts.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        s: 9 + Math.random() * 9, color: U.pick(colors), shape: Math.random() < 0.55 ? 0 : Math.random() < 0.6 ? 1 : 2, life: 160 + Math.random() * 60,
      });
    }
    if (parts.length > 500) parts.splice(0, parts.length - 500);
    if (!running) { running = true; requestAnimationFrame(tick); }
  };

  /* ---- emoji burst ---- */
  FX.burst = function (x, y, o) {
    o = o || {};
    const n = o.count || 8, size = o.size || 38, dist = o.distance || 120;
    const L = layer();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const d = dist * (0.7 + Math.random() * 0.6);
      const e = U.el('div', { class: 'pp-burst', text: Array.isArray(o.emoji) ? U.pick(o.emoji) : o.emoji || '⭐', style: { left: x + 'px', top: y + 'px', fontSize: size + 'px' } });
      L.appendChild(e);
      const anim = e.animate([
        { transform: 'translate(-50%,-50%) scale(.3) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(1) rotate(${(Math.random() - 0.5) * 120}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d * 1.15}px), calc(-50% + ${Math.sin(a) * d * 1.15 + 30}px)) scale(.6)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' });
      anim.onfinish = () => e.remove();
    }
  };

  /* ---- floating text ---- */
  FX.floatText = function (x, y, text, o) {
    o = o || {};
    const e = U.el('div', { class: 'pp-floattext', text, style: { left: x + 'px', top: y + 'px', color: o.color || '#fff', fontSize: (o.size || 72) + 'px' } });
    if (o.stroke) e.style.webkitTextStroke = o.stroke;
    layer().appendChild(e);
    const anim = e.animate([
      { transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 },
      { transform: 'translate(-50%,-70%) scale(1.15)', opacity: 1, offset: 0.25 },
      { transform: 'translate(-50%,-90%) scale(1)', opacity: 1, offset: 0.7 },
      { transform: 'translate(-50%,-130%) scale(.9)', opacity: 0 },
    ], { duration: o.duration || 1300, easing: 'ease-out' });
    anim.onfinish = () => e.remove();
  };

  /* ---- fly a clone of an element to a target ---- */
  FX.flyTo = function (el, target, o) {
    o = o || {};
    const r = el.getBoundingClientRect();
    const t = target instanceof Element ? U.center(target) : target;
    const clone = el.cloneNode(true);
    Object.assign(clone.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', margin: 0, zIndex: 9000, pointerEvents: 'none' });
    layer().appendChild(clone);
    const dx = t.x - (r.left + r.width / 2), dy = t.y - (r.top + r.height / 2);
    const anim = clone.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(${((o.scale || 0.3) + 1) / 2 * 1.1})`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(${o.scale || 0.3})`, opacity: o.fade === false ? 1 : 0.2 },
    ], { duration: o.duration || 700, easing: 'cubic-bezier(.5,0,.5,1)' });
    return new Promise((res) => { anim.onfinish = () => { clone.remove(); res(); }; });
  };

  /* ---- touch ripple ---- */
  FX.ripple = function (x, y, color) {
    const e = U.el('div', { class: 'pp-ripple', style: { left: x + 'px', top: y + 'px', borderColor: color || U.pick(PALETTE) } });
    layer().appendChild(e);
    const anim = e.animate([
      { transform: 'translate(-50%,-50%) scale(.2)', opacity: 0.9 },
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 0 },
    ], { duration: 520, easing: 'ease-out' });
    anim.onfinish = () => e.remove();
  };
  document.addEventListener('pointerdown', (e) => {
    if (e.target && e.target.closest && e.target.closest('.pp-noripple, input, select, textarea')) return;
    FX.ripple(e.clientX, e.clientY);
  }, { passive: true, capture: true });

  /* ---- glow hint ---- */
  FX.glow = function (el, ms) {
    el.classList.add('pp-glow');
    if (ms) setTimeout(() => el.classList.remove('pp-glow'), ms);
    return () => el.classList.remove('pp-glow');
  };
})();
