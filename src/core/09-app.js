/* Pip's Playroom — app shell: start screen, home, game host, stickers, parent settings. */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;
  const el = U.el;

  const DOMAINS = {
    colors: { name: 'Colors', color: '#FF6B6B' },
    numbers: { name: 'Numbers', color: '#4D96FF' },
    words: { name: 'Words', color: '#6BCB77' },
    shapes: { name: 'Shapes', color: '#FFB547' },
    music: { name: 'Music', color: '#B276F5' },
  };

  const app = (PP.app = {
    current: null, // {game, ctx, inst, stage}
    pendingSticker: null,
    overlayPromise: null,
  });

  let root, homeEl, gameEl, stageEl, homePip, gridEl;

  /* ======================= build DOM ======================= */
  function build() {
    root = document.getElementById('app');

    /* ---------- home ---------- */
    homeEl = el('section', { id: 'home', class: 'screen' });
    const sky = el('div', { class: 'home-sky', 'aria-hidden': 'true' });
    for (let i = 0; i < 5; i++) sky.appendChild(el('div', { class: 'cloud c' + i }));
    sky.appendChild(U.html(`<svg class="home-hills" viewBox="0 0 1200 200" preserveAspectRatio="none"><path d="M0 120 Q 150 40 320 110 T 650 100 T 950 90 T 1200 110 V200 H0 Z" fill="#9BE08F"/><path d="M0 150 Q 200 90 420 150 T 820 140 T 1200 150 V200 H0 Z" fill="#79CF6E"/></svg>`));
    homeEl.appendChild(sky);

    const header = el('header', { class: 'home-header' });
    homePip = PP.mascot.create({ size: 'clamp(76px, 15vmin, 150px)', cls: 'home-pip' });
    const title = el('h1', { class: 'home-title', 'aria-label': "Pip's Playroom" });
    let li = 0;
    ["Pip's", 'Playroom'].forEach((word, wi) => {
      const w = el('span', { class: 'home-title-word' });
      word.split('').forEach((ch) => {
        w.appendChild(el('span', { text: ch, style: { color: ['#EF3B36', '#FF8C1A', '#E8B400', '#3DBE4B', '#2F7BEA', '#8E4FD6', '#FF6FB5'][li % 7], animationDelay: li * 0.08 + 's' } }));
        li++;
      });
      if (wi) title.appendChild(document.createTextNode(' '));
      title.appendChild(w);
    });
    const stickerBtn = el('button', { class: 'home-sticker-btn', 'aria-label': 'Sticker book' },
      el('span', { class: 'pp-emoji', text: '📒' }), el('span', { class: 'sticker-count', text: '0' }));
    const gear = el('button', { class: 'home-gear', 'aria-label': 'Grown-ups: hold for settings' });
    gear.innerHTML = '<svg viewBox="0 0 100 100"><circle class="gear-ring" cx="50" cy="50" r="46" fill="none" stroke-width="6"/><path fill="currentColor" d="M50 30a20 20 0 1 0 0.01 0zM44 8h12l2 10 7 3 9-6 8 8-6 9 3 7 10 2v12l-10 2-3 7 6 9-8 8-9-6-7 3-2 10H44l-2-10-7-3-9 6-8-8 6-9-3-7-10-2V44l10-2 3-7-6-9 8-8 9 6 7-3z" fill-rule="evenodd"/></svg><span class="gear-tip">hold</span>';
    header.append(homePip.el, title, el('div', { class: 'home-actions' }, stickerBtn, gear));
    homeEl.appendChild(header);

    gridEl = el('div', { class: 'home-grid' });
    homeEl.appendChild(el('div', { class: 'home-scroll' }, gridEl));
    root.appendChild(homeEl);

    // home interactions
    homePip.el.addEventListener('pointerdown', () => {
      homePip.mood(U.pick(['cheer', 'wiggle', 'happy']));
      PP.audio.sfx('boing');
      PP.speech.say(U.pick(["Hi! I'm Pip!", 'Pick a game!', "Let's play!", 'Tickle tickle! Hee hee!', 'What should we play?']));
    });
    stickerBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); PP.audio.sfx('tap'); openStickerBook(); });
    holdButton(gear, 1600, openSettings, () => PP.speech.say('That button is for grown-ups!', { mode: 'skip' }));

    /* ---------- game screen ---------- */
    gameEl = el('section', { id: 'game', class: 'screen hidden' });
    stageEl = el('div', { class: 'pp-stage' });
    const homeBtn = el('button', { class: 'pp-home-btn pp-noripple', 'aria-label': 'Home' });
    homeBtn.innerHTML = '<svg viewBox="0 0 100 100"><circle class="hold-ring" cx="50" cy="50" r="46" fill="none" stroke-width="7"/><path d="M50 22 L82 50 H72 V78 H58 V60 H42 V78 H28 V50 H18 Z" fill="#FF7A45" stroke="#FF7A45" stroke-width="6" stroke-linejoin="round"/></svg>';
    gameEl.append(stageEl, homeBtn);
    root.appendChild(gameEl);
    let homeHold = null;
    const leave = () => { history.state && history.state.game ? history.back() : app.goHome(); };
    const homeMode = () => (PP.store.settings.lockHome ? 'hold' : PP.store.settings.homeMode || 'double');
    let armedAt = 0, disarmT = null;
    homeBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const mode = homeMode();
      if (mode === 'hold') return;
      if (mode === 'tap' || performance.now() - armedAt < 2600) {
        clearTimeout(disarmT);
        homeBtn.classList.remove('armed');
        armedAt = 0;
        PP.audio.sfx('tap');
        leave();
        return;
      }
      // First tap only "arms" the button (it grows and pulses); a second tap goes home.
      armedAt = performance.now();
      homeBtn.classList.add('armed');
      PP.audio.sfx('click');
      clearTimeout(disarmT);
      disarmT = setTimeout(() => { homeBtn.classList.remove('armed'); armedAt = 0; }, 2600);
    });
    homeHold = holdButton(homeBtn, 1200, leave, null, () => homeMode() === 'hold');

    window.addEventListener('popstate', () => { if (app.current) app.goHome(true); });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', () => setTimeout(onResize, 250));

    PP.bus.on('games:changed', renderHome);
    PP.bus.on('settings:changed', renderHome);
    renderHome();
  }

  let resizeT = null;
  function onResize() {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { if (app.current) app.current.ctx._resize(); }, 120);
  }

  /** Press-and-hold helper (parent gate). onHold fires after ms; onShort on quick taps. enabledFn gates it. */
  function holdButton(btn, ms, onHold, onShort, enabledFn) {
    let t = null, start = 0;
    const ring = btn.querySelector('.gear-ring, .hold-ring');
    const C = 2 * Math.PI * 46;
    if (ring) { ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C; }
    function down(e) {
      if (enabledFn && !enabledFn()) return;
      e.preventDefault();
      start = performance.now();
      btn.classList.add('holding');
      if (ring) { ring.style.transition = `stroke-dashoffset ${ms}ms linear`; ring.style.strokeDashoffset = 0; }
      t = setTimeout(() => { t = null; reset(); PP.audio.sfx('ding'); onHold(); }, ms);
    }
    function reset() {
      btn.classList.remove('holding');
      if (ring) { ring.style.transition = 'stroke-dashoffset .2s'; ring.style.strokeDashoffset = C; }
    }
    function up() {
      if (t) {
        clearTimeout(t);
        t = null;
        reset();
        if (performance.now() - start < 400 && onShort) onShort();
      }
    }
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
  }

  /* ======================= home ======================= */
  function renderHome() {
    if (!gridEl) return;
    gridEl.innerHTML = '';
    const hidden = new Set(PP.store.settings.hidden || []);
    PP.games.filter((g) => !hidden.has(g.id)).forEach((g, i) => {
      const dom = DOMAINS[g.domain] || DOMAINS.words;
      const color = g.tileColor || dom.color;
      const tile = el('button', { class: 'home-tile', style: { '--tile': color, '--tile-dark': U.shade(color, -0.25), '--tile-light': U.shade(color, 0.35), animationDelay: i * 45 + 'ms' }, 'aria-label': g.title });
      const icon = el('div', { class: 'tile-icon' });
      if (typeof g.icon === 'string' && g.icon.trim().startsWith('<')) icon.innerHTML = g.icon;
      else icon.appendChild(el('span', { class: 'pp-emoji', text: g.icon || '⭐' }));
      tile.append(icon, el('div', { class: 'tile-title', text: g.title }), el('div', { class: 'tile-domain', text: dom.name }));
      tile.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (tile.dataset.busy) return;
        tile.dataset.busy = '1';
        PP.audio.sfx('tap');
        tile.classList.add('pressed');
        homePip.mood('happy');
        PP.speech.say(g.title + '!');
        setTimeout(() => { delete tile.dataset.busy; tile.classList.remove('pressed'); app.openGame(g.id); }, 420);
      });
      gridEl.appendChild(tile);
    });
    updateStickerCount();
  }
  function updateStickerCount() {
    const c = document.querySelector('.sticker-count');
    if (c) c.textContent = PP.store.stickers.length;
  }

  /* ======================= game host ======================= */
  app.openGame = function (id, opts) {
    const game = PP.games.find((g) => g.id === id);
    if (!game) { console.warn('no game', id); return; }
    if (app.current) app.goHome(true);
    PP.speech.cancel();
    homeEl.classList.add('hidden');
    gameEl.classList.remove('hidden');
    stageEl.innerHTML = '';
    stageEl.className = 'pp-stage g-' + game.id;
    stageEl.style.background = game.background || '';
    const ctx = PP.makeCtx(game, stageEl);
    PP.store.game(id).plays++;
    PP.store.save();
    app.current = { game, ctx, inst: null };
    if (!(opts && opts.noHistory)) {
      try { history.pushState({ game: id }, '', location.pathname + location.search); } catch (e) {}
    }
    try {
      app.current.inst = game.create(stageEl, ctx) || {};
    } catch (e) {
      console.error('Game crashed on start:', id, e);
      PP.speech.say('Oops! Let’s play something else.');
      setTimeout(() => app.goHome(), 600);
    }
    PP.bus.emit('game:open', id);
  };

  app.goHome = function (fromPop) {
    const cur = app.current;
    if (cur) {
      app.current = null;
      try { cur.inst && cur.inst.destroy && cur.inst.destroy(); } catch (e) { console.error(e); }
      cur.ctx._destroy();
      PP.audio.hush();
      PP.speech.cancel();
      stageEl.innerHTML = '';
      closeOverlay(true);
      app.pendingSticker = null;
      if (!fromPop && history.state && history.state.game) {
        try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
      }
    }
    gameEl.classList.add('hidden');
    homeEl.classList.remove('hidden');
    renderHome();
    homePip.mood('wave');
  };

  /* ======================= overlays ======================= */
  let overlayEl = null, overlayResolve = null;
  function openOverlay(cls, content, opts) {
    closeOverlay(true);
    opts = opts || {};
    overlayEl = el('div', { class: 'pp-overlay ' + cls });
    overlayEl.appendChild(content);
    document.body.appendChild(overlayEl);
    requestAnimationFrame(() => overlayEl && overlayEl.classList.add('show'));
    app.overlayPromise = new Promise((r) => (overlayResolve = r));
    return overlayEl;
  }
  function closeOverlay(immediate) {
    if (!overlayEl) return;
    const o = overlayEl;
    overlayEl = null;
    o.classList.remove('show');
    setTimeout(() => o.remove(), immediate ? 0 : 300);
    const r = overlayResolve;
    overlayResolve = null;
    app.overlayPromise = null;
    if (r) r();
  }
  app.closeOverlay = closeOverlay;

  /* ---------- sticker reward ---------- */
  let stickerFallback = null;
  app.queueSticker = function (s) {
    app.pendingSticker = s;
    clearTimeout(stickerFallback);
    // Games that celebrate at the end of every set can ask to hold the sticker until ctx.celebrate().
    if (app.current && app.current.game.stickersAtCelebrate) return;
    // If the game doesn't call ctx.celebrate(), show it on our own shortly.
    const t0 = performance.now();
    const check = () => {
      if (!app.pendingSticker) return;
      const quiet = !PP.speech.speaking() && !app.overlayPromise;
      if (quiet || performance.now() - t0 > 7000) { if (!app.overlayPromise) app.showPendingSticker(); }
      else stickerFallback = setTimeout(check, 400);
    };
    stickerFallback = setTimeout(check, 1800);
  };
  app.showPendingSticker = function () {
    const s = app.pendingSticker;
    if (!s) return Promise.resolve();
    app.pendingSticker = null;
    clearTimeout(stickerFallback);
    const big = el('div', { class: 'sticker-award' },
      el('div', { class: 'sticker-rays' }),
      el('div', { class: 'sticker-big pp-emoji', text: s.emoji }),
      el('div', { class: 'sticker-label', text: 'New sticker!' }));
    const ov = openOverlay('sticker-overlay', big);
    const done = app.overlayPromise;
    PP.audio.sfx('tada');
    PP.fx.confetti({ count: 140 });
    PP.speech.say(`You got a sticker! ${U.cap(PP.data.a(s.word))}!`).then(() => {});
    let closed = false;
    const finish = () => {
      if (closed) return;
      closed = true;
      const bigEl = big.querySelector('.sticker-big');
      const homeBtn = document.querySelector('.pp-home-btn');
      PP.fx.flyTo(bigEl, homeBtn && !gameEl.classList.contains('hidden') ? homeBtn : { x: innerWidth - 60, y: 60 }, { scale: 0.2, duration: 650 });
      bigEl.style.visibility = 'hidden';
      PP.audio.sfx('swish');
      setTimeout(() => closeOverlay(), 250);
      updateStickerCount();
    };
    setTimeout(() => ov.addEventListener('pointerdown', finish), 900);
    setTimeout(finish, 3600);
    return done;
  };

  /* ---------- sticker book ---------- */
  function openStickerBook() {
    const owned = new Set(PP.store.stickers);
    const grid = el('div', { class: 'book-grid' });
    PP.data.STICKERS.forEach((s) => {
      const has = owned.has(s.id);
      const cell = el('div', { class: 'book-cell' + (has ? ' has' : '') }, el('span', { class: 'pp-emoji', text: has ? s.emoji : '?' }));
      if (has) cell.addEventListener('pointerdown', () => {
        cell.classList.remove('pop'); void cell.offsetWidth; cell.classList.add('pop');
        PP.audio.sfx('bubble');
        PP.speech.say(U.cap(PP.data.a(s.word)) + '!');
      });
      grid.appendChild(cell);
    });
    const close = el('button', { class: 'book-close', 'aria-label': 'Close' });
    close.innerHTML = '<svg viewBox="0 0 100 100"><path d="M28 28 L72 72 M72 28 L28 72" stroke="#fff" stroke-width="14" stroke-linecap="round"/></svg>';
    const panel = el('div', { class: 'book' },
      el('div', { class: 'book-head' }, el('span', { class: 'pp-emoji', text: '📒' }), el('h2', { text: 'My Stickers' }), el('span', { class: 'book-count', text: `${owned.size} / ${PP.data.STICKERS.length}` })),
      el('div', { class: 'book-scroll' }, grid), close);
    openOverlay('book-overlay', panel);
    close.addEventListener('pointerdown', (e) => { e.preventDefault(); PP.audio.sfx('tap'); closeOverlay(); });
    PP.speech.say(owned.size ? `You have ${owned.size} sticker${owned.size === 1 ? '' : 's'}!` : 'Play games to win stickers!');
  }
  app.openStickerBook = openStickerBook;

  /* ---------- parent settings ---------- */
  function openSettings() {
    const s = PP.store.settings;
    const row = (label, control, help) => el('label', { class: 'set-row' }, el('span', { class: 'set-label', text: label }), control, help ? el('small', { class: 'set-help', text: help }) : null);

    const name = el('input', { type: 'text', value: s.childName || '', placeholder: 'e.g. Sam', maxlength: '20', autocomplete: 'off', autocapitalize: 'words' });
    name.addEventListener('change', () => PP.store.set('childName', name.value.trim()));

    // natural voice pack status + controls
    const vmSel = el('select');
    const vmStatus = el('small', { class: 'set-help' });
    function fillVoiceMode() {
      vmSel.innerHTML = '';
      const has = PP.voice && PP.voice.available;
      vmSel.appendChild(el('option', { value: 'auto', text: has ? `Pip's natural voice${PP.voice.voiceName ? ' (' + PP.voice.voiceName + ')' : ''}` : "Pip's natural voice (not installed)" }));
      vmSel.appendChild(el('option', { value: 'device', text: 'Device voice (below)' }));
      vmSel.value = s.voiceMode || 'auto';
      const miss = PP.voice ? PP.voice.missingLines().length : 0;
      vmStatus.textContent = !has
        ? 'No voice pack found next to the app, so the device voice is used. See VOICE.md to make one with Kokoro.'
        : (PP.voice.ready ? `Voice pack ready: ${PP.voice.clipCount.toLocaleString()} lines.` : 'Voice pack is still downloading…') +
          (miss ? ` ${miss} line${miss === 1 ? '' : 's'} had no clip and used the device voice.` : '');
    }
    fillVoiceMode();
    const offVm = [PP.bus.on('voice:ready', fillVoiceMode), PP.bus.on('voice:manifest', fillVoiceMode)];
    vmSel.addEventListener('change', () => { PP.store.set('voiceMode', vmSel.value); testVoice(); });
    const copyMissing = el('button', { class: 'set-btn', type: 'button', text: 'Copy missing lines' });
    copyMissing.addEventListener('click', () => {
      const lines = PP.voice ? PP.voice.missingLines() : [];
      const txt = lines.join('\n');
      const done = () => { copyMissing.textContent = `Copied ${lines.length} ✓`; };
      try { navigator.clipboard.writeText(txt).then(done, () => { missBox.value = txt; missBox.hidden = false; missBox.select(); }); }
      catch (e) { missBox.value = txt; missBox.hidden = false; }
    });
    const clearMissing = el('button', { class: 'set-btn', type: 'button', text: 'Clear list' });
    clearMissing.addEventListener('click', () => { if (PP.voice) PP.voice.clearMissing(); fillVoiceMode(); });
    const missBox = el('textarea', { class: 'set-missing', rows: '5', readonly: true });
    missBox.hidden = true;

    const voiceSel = el('select');
    function fillVoices() {
      voiceSel.innerHTML = '';
      const list = PP.speech.listVoices();
      voiceSel.appendChild(el('option', { value: '', text: 'Automatic (best available)' }));
      list.forEach((v) => voiceSel.appendChild(el('option', { value: v.voiceURI, text: `${v.name} (${v.lang})` })));
      voiceSel.value = s.voiceURI || '';
    }
    fillVoices();
    const offVoices = PP.bus.on('speech:voices', fillVoices);
    voiceSel.addEventListener('change', () => { PP.store.set('voiceURI', voiceSel.value); PP.speech.setVoice(voiceSel.value); testVoice(); });
    const testBtn = el('button', { class: 'set-btn', text: '▶︎ Test voice', type: 'button' });
    function testVoice() { PP.speech.say(`Hi${s.childName ? ' ' + s.childName : ''}! I'm Pip. Let's find the red balloon!`); }
    testBtn.addEventListener('click', testVoice);

    const range = (key, min, max, step, apply) => {
      const r = el('input', { type: 'range', min, max, step, value: s[key] });
      r.addEventListener('input', () => { apply(parseFloat(r.value)); });
      r.addEventListener('change', () => { PP.store.set(key, parseFloat(r.value)); });
      return r;
    };
    const rate = range('rate', 0.6, 1.2, 0.02, (v) => PP.speech.setRate(v));
    rate.addEventListener('change', testVoice);
    const pitch = range('pitch', 0.8, 1.5, 0.02, (v) => PP.speech.setPitch(v));
    pitch.addEventListener('change', testVoice);
    const vol = range('volume', 0, 1, 0.05, (v) => PP.audio.setVolume(v));
    vol.addEventListener('change', () => PP.audio.sfx('ding'));

    const toggle = (key, apply) => {
      const c = el('input', { type: 'checkbox' });
      c.checked = !!s[key];
      c.addEventListener('change', () => { PP.store.set(key, c.checked); apply && apply(c.checked); });
      return c;
    };

    const challenge = el('select');
    [['auto', 'Automatic — adjusts as they play (recommended)'], ['gentle', 'Gentle — keep it easy'], ['big', 'Big kid — start harder']].forEach(([v, t]) => challenge.appendChild(el('option', { value: v, text: t })));
    challenge.value = s.challenge;
    challenge.addEventListener('change', () => PP.store.set('challenge', challenge.value));

    const homeSel = el('select');
    [['double', 'Tap twice (recommended)'], ['tap', 'One tap'], ['hold', 'Press and hold (most locked)']].forEach(([v, t]) => homeSel.appendChild(el('option', { value: v, text: t })));
    homeSel.value = s.lockHome ? 'hold' : s.homeMode || 'double';
    homeSel.addEventListener('change', () => { PP.store.set('lockHome', false); PP.store.set('homeMode', homeSel.value); });

    const playLimitSel = el('select');
    [[0, 'Off'], [10, '10 minutes'], [15, '15 minutes'], [20, '20 minutes'], [30, '30 minutes'], [45, '45 minutes']].forEach(([v, t]) => playLimitSel.appendChild(el('option', { value: v, text: t })));
    playLimitSel.value = String(s.playLimit || 0);
    playLimitSel.addEventListener('change', () => { PP.store.set('playLimit', parseInt(playLimitSel.value, 10)); app.resetPlayTimer(); });

    const gamesBox = el('div', { class: 'set-games' });
    PP.games.forEach((g) => {
      const c = el('input', { type: 'checkbox' });
      c.checked = !(s.hidden || []).includes(g.id);
      c.addEventListener('change', () => {
        const h = new Set(PP.store.settings.hidden || []);
        if (c.checked) h.delete(g.id); else h.add(g.id);
        PP.store.set('hidden', [...h]);
      });
      const lvl = PP.store.game(g.id).level;
      gamesBox.appendChild(el('label', { class: 'set-game' }, c, el('span', { class: 'pp-emoji', text: typeof g.icon === 'string' && !g.icon.startsWith('<') ? g.icon : '⭐' }), el('span', { text: g.title }), el('small', { text: `level ${lvl}` })));
    });

    const reset = el('button', { class: 'set-btn danger', text: 'Reset stickers & levels', type: 'button' });
    reset.addEventListener('click', () => {
      if (reset.dataset.armed) { PP.store.resetProgress(); reset.textContent = 'Done ✓'; delete reset.dataset.armed; updateStickerCount(); return; }
      reset.dataset.armed = '1';
      reset.textContent = 'Tap again to confirm';
    });

    const close = el('button', { class: 'set-close', text: 'Done', type: 'button' });
    const panel = el('div', { class: 'settings' },
      el('div', { class: 'set-head' }, el('h2', { text: 'Grown-up Settings' }), close),
      el('div', { class: 'set-body' },
        el('h3', { text: 'Child' }),
        row("Child's name", name, 'Pip will sometimes cheer for them by name.'),
        el('h3', { text: 'Voice' }),
        row("Pip's voice", vmSel),
        vmStatus,
        el('div', { class: 'set-inline' }, copyMissing, ' ', clearMissing),
        missBox,
        row('Device voice', voiceSel),
        el('div', { class: 'set-inline' }, testBtn),
        row('Talking speed', rate),
        row('Voice pitch', pitch),
        el('p', { class: 'set-tip', html: 'Note: Safari on iPhone and iPad only lets web pages use the voices that come pre-installed. Enhanced or Premium voices you download in iOS Settings won’t appear in this list (an Apple restriction). <b>Samantha</b> is usually the best built-in English voice; try lowering the pitch or speed if she sounds rushed.' }),
        el('h3', { text: 'Sound' }),
        row('Volume', vol),
        row('Background music', toggle('music', (v) => PP.audio.setMusic(v)), 'Drum grooves and backing tracks. Tapped instruments always play.'),
        el('h3', { text: 'Play' }),
        row('Challenge', challenge),
        row('Home button in games', homeSel, 'Toddlers brush the corner a lot. “Tap twice” makes the button grow on the first tap and go home on the second.'),
        row('Play timer', playLimitSel, 'After this much play, Pip yawns, plays a lullaby and says bye-bye. Hold the moon button for 2 seconds to keep playing.'),
        el('h3', { text: 'Activities' }),
        gamesBox,
        el('h3', { text: 'Make it toddler-proof' }),
        el('p', { class: 'set-tip', html: '<b>1. Add to Home Screen:</b> in Safari tap Share → <i>Add to Home Screen</i>. It opens full-screen like a real app.<br><b>2. Guided Access:</b> Settings → Accessibility → Guided Access → On. Then open the app and triple-click the top (or home) button to lock the iPad into it.' }),
        el('h3', { text: 'Progress' }),
        el('p', { class: 'set-tip', text: `Stickers earned: ${PP.store.stickers.length} · Successes: ${PP.store.successTotal}` }),
        reset,
        el('p', { class: 'set-ver', text: "Pip's Playroom v" + PP.version + ' · all sounds and art are generated in your browser' })
      )
    );
    openOverlay('settings-overlay', panel);
    close.addEventListener('click', () => { offVoices(); offVm.forEach((f) => f()); PP.audio.sfx('tap'); closeOverlay(); renderHome(); });
  }
  app.openSettings = openSettings;

  /* ======================= start screen ======================= */
  app.showStart = function (then) {
    const pip = PP.mascot.create({ size: 'min(42vmin, 300px)', cls: 'start-pip' });
    const play = el('button', { class: 'start-play', 'aria-label': 'Play' });
    play.innerHTML = '<svg viewBox="0 0 100 100"><path d="M36 24 L78 50 L36 76 Z" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></svg>';
    const start = el('section', { id: 'start', class: 'screen' },
      el('div', { class: 'start-bubbles', 'aria-hidden': 'true' }),
      pip.el,
      el('h1', { class: 'start-title', html: 'Pip’s<br>Playroom' }),
      play);
    const bubbles = start.querySelector('.start-bubbles');
    for (let i = 0; i < 14; i++) {
      bubbles.appendChild(el('span', { style: { left: U.rand(0, 100) + '%', width: (i % 4 + 2) * 14 + 'px', height: (i % 4 + 2) * 14 + 'px', animationDelay: -U.rand(0, 14) + 's', animationDuration: U.rand(9, 16) + 's', background: U.pick(['#FFD21F', '#FF6FB5', '#4D96FF', '#6BCB77', '#FF8C1A', '#B276F5']) } }));
    }
    root.appendChild(start);
    pip.mood('wave');
    let go = false;
    // iOS only counts touchEND / pointerUP / click as a user gesture for audio + speech, so start on release.
    start.addEventListener('pointerdown', () => { play.classList.add('pressed'); pip.mood('surprise'); });
    const begin = (e) => {
      if (go) return;
      go = true;
      if (e.cancelable) e.preventDefault();
      PP.audio.unlock();
      const nm = PP.store.settings.childName;
      PP.speech.unlock(`Hi${nm ? ' ' + nm : ''}! I'm Pip! Let's play!`);
      PP.audio.sfx('magic');
      pip.mood('cheer');
      start.classList.add('leaving');
      PP.bus.emit('started');
      setTimeout(() => { pip.destroy(); start.remove(); then && then(); }, 650);
    };
    ['pointerup', 'touchend', 'click'].forEach((t) => start.addEventListener(t, begin));
  };

  /* ======================= play timer ("time for a break") ======================= */
  let playMs = 0, lastTick = performance.now(), started = false, sleeping = false;
  app.resetPlayTimer = () => { playMs = 0; };
  setInterval(() => {
    const now = performance.now(), dt = now - lastTick;
    lastTick = now;
    if (!started || sleeping || document.hidden) return;
    playMs += Math.min(dt, 2000);
    const lim = PP.store.settings.playLimit || 0;
    if (lim > 0 && playMs >= lim * 60000 && !app.overlayPromise) app.sleep();
  }, 1000);
  PP.bus.on('started', () => { started = true; });

  // Brahms' Lullaby (public domain), first phrase
  const LULLABY = [['E4', .5], ['E4', .5], ['G4', 2], ['E4', .5], ['E4', .5], ['G4', 2], ['E4', .5], ['G4', .5], ['C5', 1], ['B4', 1.5], ['A4', .5], ['A4', 1], ['G4', 1],
    ['D4', .5], ['E4', .5], ['F4', 1], ['D4', 1], ['D4', .5], ['E4', .5], ['F4', 2], ['D4', .5], ['F4', .5], ['B4', .5], ['A4', .5], ['G4', 1], ['B4', 1], ['C5', 3]];

  app.sleep = function () {
    if (sleeping) return;
    sleeping = true;
    app.goHome();
    const pip = PP.mascot.create({ size: 'min(44vmin, 300px)', cls: 'sleep-pip m-sleep' });
    const sky = el('div', { class: 'sleep-sky' });
    for (let i = 0; i < 40; i++) sky.appendChild(el('span', { class: 'sleep-star', style: { left: U.rand(0, 100) + '%', top: U.rand(0, 70) + '%', animationDelay: -U.rand(0, 4) + 's', transform: `scale(${U.rand(0.4, 1.2)})` } }));
    const zzz = el('div', { class: 'sleep-z' }, el('span', { text: 'z' }), el('span', { text: 'z' }), el('span', { text: 'Z' }));
    const moon = el('button', { class: 'sleep-moon', 'aria-label': 'Grown-ups: hold to keep playing' });
    moon.innerHTML = '<svg viewBox="0 0 100 100"><circle class="hold-ring" cx="50" cy="50" r="46" fill="none" stroke-width="6"/><path d="M62 22 A30 30 0 1 0 78 64 A24 24 0 1 1 62 22 Z" fill="#FFE68A"/></svg>';
    const wrap = el('div', { class: 'sleep-wrap' }, sky, el('div', { class: 'sleep-center' }, zzz, pip.el, el('div', { class: 'sleep-text', text: 'Bye-bye!' })), moon);
    openOverlay('sleep-overlay', wrap);
    const nm = PP.store.settings.childName;
    PP.speech.say(`Yawn! Time for a break${nm ? ', ' + nm : ''}! Bye-bye! See you soon!`, { rate: 0.8 });
    const playLullaby = () => PP.audio.sequence(LULLABY, { bpm: 72, inst: 'kalimba', vel: 0.45, bus: 'sfx', delay: 2.5 });
    let lull = playLullaby();
    const again = setInterval(() => { lull = playLullaby(); }, 24000);
    holdButton(moon, 2000, () => {
      clearInterval(again);
      lull.stop();
      PP.audio.hush();
      sleeping = false;
      playMs = 0;
      pip.destroy();
      closeOverlay();
      PP.speech.say('Yay! More playing!');
    });
  };

  app.build = build;
  app.renderHome = renderHome;
  app.DOMAINS = DOMAINS;
})();
