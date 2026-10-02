/* Pip's Playroom — shared building blocks for games.
 *   PP.kit.emoji(char, {size})                      -> <span class="pp-emoji">
 *   PP.kit.card(content, {color, size})             -> rounded tappable card element
 *   PP.kit.findRound(ctx, opts) -> Promise<{firstTry, misses}>   "Find the ___!" round (errorless-learning flow)
 *   PP.kit.drag(el, opts) -> {stop(), reset()}      pointer dragging with snap-back
 *   PP.kit.nextButton(ctx, onTap, {parent})        big bouncing "go on" arrow
 *   PP.kit.speakerButton(ctx, {parent})            replays the current prompt
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;
  const K = (PP.kit = {});

  K.emoji = function (ch, o) {
    o = o || {};
    return U.el('span', { class: 'pp-emoji ' + (o.cls || ''), text: ch, style: o.size ? { fontSize: o.size } : null });
  };

  K.card = function (content, o) {
    o = o || {};
    const c = U.el('div', { class: 'pp-card ' + (o.cls || ''), style: Object.assign({}, o.color ? { '--card': o.color } : {}, o.size ? { width: o.size + 'px', height: o.size + 'px', '--s': o.size + 'px' } : {}) });
    if (content) c.appendChild(content);
    return c;
  };

  /**
   * A complete "find it" round with built-in errorless-learning behavior.
   *  opts:
   *    container   element to render cards into (cleared). Defaults to a full-stage area.
   *    choices     [{ id, name, render: () => Element, color? }]   name is spoken when tapped wrongly ("That's the cat")
   *    targetId    id of the correct choice
   *    prompt      'Find the dog!'   (also set as ctx prompt; Pip/idle repeats it)
   *    intro       optional text said before the prompt (e.g., 'Let's find animals!')
   *    sayWrong    (choice) => text   default: `That's ${a(name)}.`
   *    sayRight    (choice) => text   default: `${praise} ${Cap(name)}!`   (set false for none)
   *    cardColor   background css color of cards (default white)
   *    maxCard     max card px (default 260)
   *    hintAfter   misses before the right card glows (default 2)
   *    celebrate   true (default) => confetti etc. on success
   *  Resolves after the success celebration. Records ctx.success / ctx.miss automatically.
   */
  K.findRound = function (ctx, o) {
    const container = o.container || ctx.stage;
    container.innerHTML = '';
    const grid = U.el('div', { class: 'pp-findgrid' });
    container.appendChild(grid);
    const cards = [];
    let misses = 0;
    let done = false;
    let hinted = false;
    let missReported = false;

    function layout() {
      const w = container.clientWidth, h = container.clientHeight;
      const n = o.choices.length;
      const gap = Math.max(12, Math.min(28, Math.min(w, h) * 0.035));
      const g = U.layoutGrid(n, w, h, gap);
      const size = Math.min(o.maxCard || 330, g.size);
      grid.style.gridTemplateColumns = `repeat(${g.cols}, ${size}px)`;
      grid.style.gap = gap + 'px';
      cards.forEach((c) => { c.style.width = c.style.height = size + 'px'; c.style.setProperty('--s', size + 'px'); });
    }

    o.choices.forEach((ch, i) => {
      const card = K.card(ch.render(), { color: ch.color || o.cardColor, cls: 'pp-findcard' });
      card.dataset.id = ch.id;
      card.style.animationDelay = i * 70 + 'ms';
      cards.push(card);
      grid.appendChild(card);
    });
    layout();
    ctx.onResize(layout);
    ctx.poke();
    const offs = [];

    const target = o.choices.find((c) => c.id === o.targetId);
    const targetCard = cards.find((c) => c.dataset.id === o.targetId);
    ctx.setPrompt(o.prompt);

    return new Promise((resolve) => {
      (async () => {
        if (o.intro) await ctx.say(o.intro);
        if (!done) ctx.say(o.prompt);
      })();

      const stopIdle = ctx.idle(o.idleMs || 7000, () => {
        if (done) return;
        ctx.say(o.prompt);
        if (!hinted) { hinted = true; PP.fx.glow(targetCard); }
      });

      cards.forEach((card, i) => {
        const ch = o.choices[i];
        offs.push(ctx.tap(card, async () => {
          if (done) return;
          if (ch.id === o.targetId) {
            done = true;
            stopIdle();
            card.classList.remove('pp-glow');
            card.classList.add('pp-correct');
            cards.forEach((c) => { if (c !== card) c.classList.add('pp-dim'); });
            const p = U.center(card);
            PP.fx.burst(p.x, p.y, { emoji: ['⭐', '✨', '🌟'], count: 7, distance: 110 });
            ctx.success(misses === 0);
            const right = o.sayRight === false ? false
              : o.sayRight ? o.sayRight(ch)
              : `${PP.data.praise()} ${U.cap(target.name)}!`;
            if (o.celebrate === false) {
              ctx.sfx('success');
              if (right) await ctx.say(right);
              else await ctx.wait(700);
            } else {
              await ctx.celebrate({ x: p.x, y: p.y, say: right });
            }
            offs.forEach((f) => f());
            ctx.offResize(layout);
            resolve({ firstTry: misses === 0, misses });
          } else {
            misses++;
            ctx.sfx('oops', { vel: 0.6 });
            card.classList.remove('pp-wiggle');
            void card.offsetWidth;
            card.classList.add('pp-wiggle');
            if (ctx.mascot.el) ctx.mascot.mood('think');
            const wrong = o.sayWrong ? o.sayWrong(ch) : `That's ${PP.data.a(ch.name)}.`;
            if (misses >= (o.hintAfter || 2)) {
              if (!missReported) { missReported = true; ctx.miss(); }
              hinted = true;
              PP.fx.glow(targetCard);
            }
            ctx.say(`${wrong} ${o.prompt}`);
          }
        }));
      });
    });
  };

  /**
   * Drag an element with the finger. Uses transforms; element should be position:absolute or relative.
   *  opts: { onStart(e), onMove(e, {dx, dy, x, y}), onEnd(e, {dx, dy, x, y}) -> return 'keep' to stay, else snaps back
   *          lift: scale while dragging (1.12) }
   *  returns { stop(), reset(), setEnabled(bool) }
   */
  K.drag = function (el, opts) {
    opts = opts || {};
    let id = null, sx = 0, sy = 0, dx = 0, dy = 0, enabled = true;
    const lift = opts.lift || 1.12;
    function down(e) {
      if (!enabled || id !== null) return;
      id = e.pointerId;
      try { el.setPointerCapture(id); } catch (err) {}
      sx = e.clientX; sy = e.clientY; dx = dy = 0;
      el.classList.add('pp-dragging');
      el.style.transition = 'none';
      el.style.transform = `translate(0px,0px) scale(${lift})`;
      e.preventDefault();
      opts.onStart && opts.onStart(e);
    }
    function move(e) {
      if (e.pointerId !== id) return;
      dx = e.clientX - sx; dy = e.clientY - sy;
      el.style.transform = `translate(${dx}px,${dy}px) scale(${lift})`;
      opts.onMove && opts.onMove(e, { dx, dy, x: e.clientX, y: e.clientY });
    }
    function up(e) {
      if (e.pointerId !== id) return;
      id = null;
      el.classList.remove('pp-dragging');
      const r = opts.onEnd ? opts.onEnd(e, { dx, dy, x: e.clientX, y: e.clientY }) : null;
      if (r !== 'keep') reset();
    }
    function reset() {
      el.style.transition = 'transform .35s cubic-bezier(.3,1.6,.5,1)';
      el.style.transform = 'translate(0px,0px) scale(1)';
    }
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return {
      reset,
      setEnabled(v) { enabled = !!v; },
      stop() {
        el.removeEventListener('pointerdown', down);
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
      },
    };
  };

  /** Big bouncing arrow button (bottom-right by default). Returns the element. */
  K.nextButton = function (ctx, onTap, o) {
    o = o || {};
    const b = U.el('button', { class: 'pp-next ' + (o.cls || ''), 'aria-label': 'Next' });
    b.innerHTML = '<svg viewBox="0 0 100 100"><path d="M30 18 L74 50 L30 82 Z" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></svg>';
    (o.parent || ctx.stage).appendChild(b);
    ctx.tap(b, () => { ctx.sfx('whoosh'); onTap(); });
    return b;
  };

  /** Round button that repeats the current prompt (top-right by default). */
  K.speakerButton = function (ctx, o) {
    o = o || {};
    const b = U.el('button', { class: 'pp-speaker ' + (o.cls || ''), 'aria-label': 'Say it again' });
    b.innerHTML = '<svg viewBox="0 0 100 100"><path d="M18 38 H36 L58 20 V80 L36 62 H18 Z" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="M68 34 Q78 50 68 66 M78 26 Q94 50 78 74" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/></svg>';
    (o.parent || ctx.stage).appendChild(b);
    ctx.tap(b, () => ctx.prompt());
    return b;
  };
})();
