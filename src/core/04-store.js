/* Pip's Playroom — settings, adaptive levels, stickers. Persisted in localStorage (best-effort). */
(function () {
  'use strict';
  const PP = window.PP;
  const KEY = 'pips-playroom.v1';

  const DEFAULT_SETTINGS = {
    childName: '',
    voiceURI: '',
    voiceMode: 'auto', // 'auto' = natural voice pack when installed, else device voice | 'device'
    rate: 0.92,
    pitch: 1.12,
    volume: 0.85,
    music: true,
    speech: true,
    challenge: 'auto', // 'auto' | 'gentle' | 'big'
    lockHome: false, // legacy: true = press-and-hold
    homeMode: 'double', // 'double' (tap twice) | 'tap' | 'hold'
    playLimit: 0, // minutes of play before Pip says goodnight (0 = off)
    hidden: [], // game ids hidden from the home screen
    stickerEvery: 5, // successes per sticker
  };

  const store = (PP.store = {
    settings: Object.assign({}, DEFAULT_SETTINGS),
    progress: {}, // gameId -> {level, streak, rounds, correct, misses, plays}
    stickers: [], // sticker ids in the order earned
    successTotal: 0,
    sinceSticker: 0,
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      Object.assign(store.settings, d.settings || {});
      store.progress = d.progress || {};
      store.stickers = Array.isArray(d.stickers) ? d.stickers : [];
      store.successTotal = d.successTotal || 0;
      store.sinceSticker = d.sinceSticker || 0;
    } catch (e) { /* private mode etc. */ }
  }
  let saveTimer = null;
  store.save = function () {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify({
          settings: store.settings, progress: store.progress, stickers: store.stickers,
          successTotal: store.successTotal, sinceSticker: store.sinceSticker,
        }));
      } catch (e) {}
    }, 150);
  };
  store.set = function (k, v) {
    store.settings[k] = v;
    store.save();
    PP.bus.emit('settings:changed', { key: k, value: v });
  };
  store.resetProgress = function () {
    store.progress = {};
    store.stickers = [];
    store.successTotal = 0;
    store.sinceSticker = 0;
    store.save();
  };

  store.game = function (id) {
    if (!store.progress[id]) store.progress[id] = { level: 1, streak: 0, rounds: 0, correct: 0, misses: 0, plays: 0, missRun: 0 };
    return store.progress[id];
  };
  function levelCap() {
    const c = store.settings.challenge;
    return c === 'gentle' ? 2 : 5;
  }
  function levelFloor() {
    return store.settings.challenge === 'big' ? 3 : 1;
  }
  store.level = function (id) {
    const g = store.game(id);
    return Math.max(levelFloor(), Math.min(levelCap(), g.level));
  };
  /** Record a success. firstTry=true counts toward leveling up; false = needed help; null = neutral (free play). Returns {leveledUp, sticker} */
  store.recordSuccess = function (id, firstTry) {
    const g = store.game(id);
    g.correct++;
    g.rounds++;
    let leveledUp = false;
    if (firstTry === null) {
      // neutral: counts toward stickers, but says nothing about skill (no level change)
    } else if (firstTry !== false) {
      g.streak++;
      g.missRun = 0;
      if (g.streak >= 3 && g.level < 5) { g.level++; g.streak = 0; leveledUp = true; }
    } else {
      g.streak = 0;
    }
    store.successTotal++;
    store.sinceSticker++;
    let sticker = null;
    if (store.sinceSticker >= (store.settings.stickerEvery || 5)) {
      store.sinceSticker = 0;
      sticker = store.awardSticker();
    }
    store.save();
    return { leveledUp, sticker, level: store.level(id) };
  };
  /** Record a struggle (call at most once per round). Two struggling rounds in a row step the level down. */
  store.recordMiss = function (id) {
    const g = store.game(id);
    g.misses++;
    g.streak = 0;
    g.missRun = (g.missRun || 0) + 1;
    let leveledDown = false;
    if (g.missRun >= 2 && g.level > 1) { g.level--; g.missRun = 0; leveledDown = true; }
    store.save();
    return { leveledDown, level: store.level(id) };
  };
  store.awardSticker = function () {
    const all = PP.data.STICKERS;
    const owned = new Set(store.stickers);
    const fresh = all.filter((s) => !owned.has(s.id));
    const s = fresh.length ? PP.util.pick(fresh) : PP.util.pick(all);
    if (!owned.has(s.id)) store.stickers.push(s.id);
    store.save();
    return s;
  };

  load();
})();
