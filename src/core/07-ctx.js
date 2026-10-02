/* Pip's Playroom — the per-game context object handed to game.create(stage, ctx).
 * Everything registered through ctx (timers, listeners, loops, sequences) is cleaned up
 * automatically when the child leaves the game. See GAME_API.md for the full contract.
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;

  PP.makeCtx = function (game, stage) {
    const timers = new Set();
    const intervals = new Set();
    const rafStops = new Set();
    const listeners = [];
    const handles = [];
    const resizeFns = [];
    const idleWatchers = new Set();
    let alive = true;
    let promptText = '';
    let mascot = null;
    let lastTouch = performance.now();

    const onStageDown = () => { lastTouch = performance.now(); };
    stage.addEventListener('pointerdown', onStageDown, { passive: true, capture: true });

    const ctx = {
      game,
      stage,
      get alive() { return alive; },
      get level() { return PP.store.level(game.id); },
      get settings() { return PP.store.settings; },
      data: PP.data,
      util: U,
      audio: PP.audio,
      fx: PP.fx,
      get kit() { return PP.kit; },
      el: U.el,
      svg: U.svg,
      html: U.html,
      pick: U.pick,
      shuffle: U.shuffle,
      sample: U.sample,
      rand: U.rand,
      randInt: U.randInt,
      clamp: U.clamp,

      /* ---------- sound & speech ---------- */
      say(text, opts) {
        if (!alive) return Promise.resolve(false);
        if (PP.app.overlayPromise) {
          return PP.app.overlayPromise.then(() => (alive ? PP.speech.say(text, opts) : false));
        }
        return PP.speech.say(text, opts);
      },
      sfx(name, opts) { return alive ? PP.audio.sfx(name, opts) : 0; },
      play(inst, note, opts) { return alive ? PP.audio.play(inst, note, opts) : 0; },
      drum(name, opts) { return alive ? PP.audio.drum(name, opts) : 0; },
      sequence(events, opts) { const h = PP.audio.sequence(events, opts); handles.push(h); return h; },
      loop(pattern) { const h = PP.audio.loop(pattern); handles.push(h); return h; },
      rumble(opts) { const h = PP.audio.rumble(opts); handles.push(h); return h; },

      /** Remember the current instruction; tapping Pip (or idling) repeats it. */
      setPrompt(text) { promptText = text || ''; },
      getPrompt() { return promptText; },
      prompt() { return promptText ? ctx.say(promptText) : Promise.resolve(false); },

      /* ---------- lifecycle-safe timing ---------- */
      setTimeout(fn, ms) {
        const id = setTimeout(() => { timers.delete(id); if (alive) fn(); }, ms);
        timers.add(id);
        return id;
      },
      clearTimeout(id) { clearTimeout(id); timers.delete(id); },
      setInterval(fn, ms) {
        const id = setInterval(() => { if (alive) fn(); }, ms);
        intervals.add(id);
        return id;
      },
      clearInterval(id) { clearInterval(id); intervals.delete(id); },
      /** Promise that resolves after ms — and never resolves if the game was exited (so async flows just stop). */
      wait(ms) {
        return new Promise((res) => { ctx.setTimeout(res, ms); });
      },
      /** Animation loop: fn(dtSeconds, timeMs) each frame until it returns false or the game exits. Returns stop(). */
      raf(fn) {
        let last = performance.now();
        let stopped = false;
        let id = 0;
        const stop = () => { stopped = true; cancelAnimationFrame(id); rafStops.delete(stop); };
        const frame = (t) => {
          if (stopped || !alive) return;
          const dt = Math.min(0.05, (t - last) / 1000);
          last = t;
          let r;
          try { r = fn(dt, t); } catch (e) { console.error(e); r = false; }
          if (r === false) { stop(); return; }
          id = requestAnimationFrame(frame);
        };
        id = requestAnimationFrame(frame);
        rafStops.add(stop);
        return stop;
      },

      /* ---------- input ---------- */
      on(el, type, fn, opts) {
        const wrapped = (e) => { if (alive) fn(e); };
        el.addEventListener(type, wrapped, opts);
        listeners.push([el, type, wrapped, opts]);
        if (listeners.length > 150) {
          // prune listeners on elements that were removed from the DOM (long sessions)
          for (let i = listeners.length - 1; i >= 0; i--) {
            const t = listeners[i][0];
            if (t && t.nodeType === 1 && !t.isConnected) { t.removeEventListener(listeners[i][1], listeners[i][2], listeners[i][3]); listeners.splice(i, 1); }
          }
        }
        return () => el.removeEventListener(type, wrapped, opts);
      },
      /**
       * Toddler-friendly tap: fires on pointerdown (instant), ignores multi-fire within `cooldown` ms (default 120)
       * for the same element. fn(event, {x, y})
       */
      tap(el, fn, opts) {
        opts = opts || {};
        const cooldown = opts.cooldown == null ? 120 : opts.cooldown;
        let lastAt = 0;
        return ctx.on(el, 'pointerdown', (e) => {
          if (e.button > 0) return;
          const now = performance.now();
          if (now - lastAt < cooldown) return;
          lastAt = now;
          if (opts.preventDefault !== false) e.preventDefault();
          fn(e, { x: e.clientX, y: e.clientY });
        });
      },
      /** Drag helper — see PP.kit.drag */
      drag(el, opts) { const h = PP.kit.drag(el, opts); handles.push(h); return h; },
      /** Register anything with stop() or destroy() to be cleaned up on exit */
      track(h) { handles.push(h); return h; },
      onResize(fn) { resizeFns.push(fn); return fn; },
      offResize(fn) { const i = resizeFns.indexOf(fn); if (i >= 0) resizeFns.splice(i, 1); },
      size() { return { w: stage.clientWidth, h: stage.clientHeight }; },
      /**
       * Call fn() whenever the child hasn't touched the stage for `ms`. Repeats every `ms` while idle.
       * Returns cancel(). Typical: ctx.idle(7000, () => { ctx.prompt(); hint(); })
       */
      idle(ms, fn, opts) {
        // At most `max` (default 3) nudges per quiet stretch; a real touch re-arms it. No endless nagging.
        const w = { ms, fn, lastFire: performance.now(), count: 0, max: (opts && opts.max) || 3, touchAt: lastTouch };
        idleWatchers.add(w);
        return () => idleWatchers.delete(w);
      },
      /** Reset the idle clock (e.g. after a long animation) */
      poke() { lastTouch = performance.now(); },

      /* ---------- progress & rewards ---------- */
      /** Record an accomplishment. firstTry=false if the child needed help/mistakes. */
      success(firstTry) {
        if (!alive) return {};
        const r = PP.store.recordSuccess(game.id, firstTry);
        if (r.sticker) PP.app.queueSticker(r.sticker);
        if (r.leveledUp) PP.bus.emit('level:up', { game: game.id, level: r.level });
        return r;
      },
      /** Record a struggle — call at most once per round. */
      miss() { return alive ? PP.store.recordMiss(game.id) : {}; },
      praise: () => PP.data.praise(),
      /**
       * Celebrate! Confetti + happy sound + Pip cheers + spoken praise.
       *   opts: { x, y, say: string|false, big: bool, colors: [...], sound: sfxName|false }
       * Resolves when the praise is done (and after any sticker reward that was earned is shown).
       */
      celebrate(o) {
        o = o || {};
        if (!alive) return new Promise(() => {});
        const x = o.x == null ? innerWidth / 2 : o.x;
        const y = o.y == null ? innerHeight * 0.45 : o.y;
        if (o.sound !== false) ctx.sfx(o.sound || (o.big ? 'tada' : 'success'));
        PP.fx.confetti({ x, y, count: o.big ? 170 : 70, colors: o.colors, power: o.big ? 1.2 : 0.9 });
        if (o.big) PP.fx.burst(x, y, { emoji: ['⭐', '🌟', '✨'], count: 10, distance: 160 });
        if (mascot) mascot.mood('cheer');
        const text = o.say === false ? null : o.say || PP.data.praise();
        const minWait = ctx.wait(o.big ? 1500 : 800);
        const sp = text ? PP.speech.say(text) : Promise.resolve();
        return Promise.all([minWait, sp]).then(() => {
          if (!alive) return new Promise(() => {});
          if (PP.app.pendingSticker) return PP.app.showPendingSticker();
        }).then(() => (alive ? undefined : new Promise(() => {})));
      },

      /* ---------- Pip in the game ---------- */
      mascot: {
        /** Show Pip in a corner. opts: {corner:'bl'|'br'|'tl'|'tr', size:'110px'} . Tapping Pip repeats the prompt. */
        show(opts) {
          opts = opts || {};
          if (!mascot) {
            mascot = PP.mascot.create({ size: opts.size || 'clamp(80px, 14vmin, 140px)', cls: 'pp-game-pip' });
            stage.appendChild(mascot.el);
            ctx.tap(mascot.el, () => { mascot.mood('wiggle'); if (promptText) ctx.prompt(); else ctx.sfx('boing'); });
          }
          mascot.el.dataset.corner = opts.corner || 'bl';
          mascot.el.style.display = '';
          return mascot;
        },
        hide() { if (mascot) mascot.el.style.display = 'none'; },
        mood(m, ms) { if (mascot) mascot.mood(m, ms); },
        get el() { return mascot && mascot.el; },
      },

      exit() { PP.app.goHome(); },

      /* internal */
      _destroy() {
        alive = false;
        timers.forEach(clearTimeout);
        intervals.forEach(clearInterval);
        rafStops.forEach((s) => s());
        listeners.forEach(([el, type, fn, opts]) => el.removeEventListener(type, fn, opts));
        handles.forEach((h) => { try { (h.stop || h.destroy || (() => {})).call(h); } catch (e) {} });
        idleWatchers.clear();
        stage.removeEventListener('pointerdown', onStageDown, { capture: true });
        clearInterval(idleIv);
        if (mascot) mascot.destroy();
      },
      _resize() { resizeFns.forEach((f) => { try { f(ctx.size()); } catch (e) { console.error(e); } }); },
    };

    let quietSince = performance.now();
    const idleIv = setInterval(() => {
      if (!alive) return;
      const now = performance.now();
      // Talking, celebrating and sticker breaks count as activity — idle time only accrues in silence.
      if (PP.app.overlayPromise || PP.speech.speaking()) { quietSince = now; return; }
      const since = Math.max(lastTouch, quietSince);
      idleWatchers.forEach((w) => {
        if (w.touchAt !== lastTouch) { w.touchAt = lastTouch; w.count = 0; }
        if (w.count >= w.max) return;
        if (now - since >= w.ms && now - w.lastFire >= w.ms) {
          w.lastFire = now;
          w.count++;
          try { w.fn(); } catch (e) { console.error(e); }
        }
      });
    }, 400);

    return ctx;
  };
})();
