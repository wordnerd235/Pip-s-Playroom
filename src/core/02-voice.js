/* Pip's Playroom — natural voice pack (pre-rendered clips, e.g. made with Kokoro TTS).
 *
 * If voice/manifest.json + its pack file sit next to index.html, Pip speaks with recorded clips.
 * Speech is matched SENTENCE BY SENTENCE: "That's a cat. Find the dog!" plays the clips for
 * "That's a cat." and "Find the dog!" back to back. If any sentence of an utterance has no clip,
 * the whole utterance falls back to the device voice (so one line never mixes two voices), and the
 * missing sentence is logged so a grown-up can copy the list from settings and render more clips.
 *
 * manifest.json: { version, voice, pack: "pack-<hash>.mp3pack", gapMs, clips: { "<key>": [offset, length, ms] } }
 *   key = PP.voice.key(sentence); the pack is all clips' MP3 files concatenated; offsets are bytes.
 */
(function () {
  'use strict';
  const PP = window.PP;
  const V = (PP.voice = { ready: false, available: false, clipCount: 0 });
  const BASE = 'voice/';
  const MISSING_KEY = 'pips-playroom.missing-lines';

  /* ---------- text → sentence keys (the build tools use these same functions) ---------- */
  V.clean = (t) => String(t || '')
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\.\.\./g, '…')
    .replace(/\s+/g, ' ')
    .trim();
  /** Split into sentences, keeping end punctuation: "Hi! I'm Pip." -> ["Hi!", "I'm Pip."] */
  V.split = function (text) {
    const t = V.clean(text);
    if (!t) return [];
    const out = [];
    const re = /[^.!?…]+(?:[.!?…]+|$)/g;
    let m;
    while ((m = re.exec(t))) {
      const s = m[0].trim();
      if (s) out.push(s);
    }
    // glue stray punctuation-only pieces onto the previous sentence
    return out.reduce((acc, s) => {
      if (/^[.!?…"')\s]+$/.test(s) && acc.length) acc[acc.length - 1] += s;
      else acc.push(s);
      return acc;
    }, []);
  };
  V.key = (s) => V.clean(s).toLowerCase();

  /* ---------- loading ---------- */
  let manifest = null;
  let pack = null; // ArrayBuffer
  const decoded = new Map(); // key -> AudioBuffer (small LRU)
  const missing = new Set();
  try { (JSON.parse(localStorage.getItem(MISSING_KEY) || '[]') || []).forEach((k) => missing.add(k)); } catch (e) {}

  V.init = function () {
    if (V._init) return V._init;
    if (!/^https?:$/.test(location.protocol)) return (V._init = Promise.resolve(false)); // file:// can't fetch
    V._init = fetch(BASE + 'manifest.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (!m || !m.clips || !m.pack) return false;
        manifest = m;
        V.available = true;
        V.clipCount = Object.keys(m.clips).length;
        V.voiceName = m.voice || '';
        PP.bus.emit('voice:manifest', V.clipCount);
        return fetch(BASE + m.pack).then((r) => (r.ok ? r.arrayBuffer() : null)).then((buf) => {
          if (!buf) return false;
          pack = buf;
          V.ready = true;
          // drop older voice packs from the offline cache
          try {
            if (window.caches) caches.open('pips-voice').then((c) => c.keys().then((ks) => ks.forEach((r) => {
              if (/\.mp3pack$/.test(r.url) && r.url.indexOf(m.pack) < 0) c.delete(r);
            })));
          } catch (e) {}
          PP.bus.emit('voice:ready', V.clipCount);
          return true;
        });
      })
      .catch(() => false);
    return V._init;
  };

  V.useClips = () => V.ready && PP.store && PP.store.settings.voiceMode !== 'device';

  /** True if every sentence of `text` has a clip. Logs the misses otherwise. */
  V.canSpeak = function (text) {
    if (!V.useClips()) return false;
    const sents = V.split(text);
    if (!sents.length) return false;
    let ok = true;
    sents.forEach((s) => {
      const k = V.key(s);
      if (!manifest.clips[k]) {
        ok = false;
        if (!missing.has(k) && missing.size < 2000) {
          missing.add(k);
          saveMissing();
        }
      }
    });
    return ok;
  };
  let saveT = null;
  function saveMissing() {
    clearTimeout(saveT);
    saveT = setTimeout(() => { try { localStorage.setItem(MISSING_KEY, JSON.stringify([...missing])); } catch (e) {} }, 500);
  }
  V.missingLines = () => [...missing];
  V.clearMissing = () => { missing.clear(); saveMissing(); };

  function decode(key) {
    if (decoded.has(key)) {
      const b = decoded.get(key);
      decoded.delete(key);
      decoded.set(key, b); // refresh LRU position
      return Promise.resolve(b);
    }
    const ent = manifest.clips[key];
    const ctx = PP.audio.ctx;
    const slice = pack.slice(ent[0], ent[0] + ent[1]);
    return new Promise((res, rej) => {
      // callback form works on older Safari; promise form on newer
      const p = ctx.decodeAudioData(slice, res, rej);
      if (p && p.then) p.then(res, rej);
    }).then((buf) => {
      decoded.set(key, buf);
      if (decoded.size > 240) decoded.delete(decoded.keys().next().value);
      return buf;
    });
  }

  /** Warm the decode cache for lines a game is about to say (optional). */
  V.prefetch = function (texts) {
    if (!V.useClips() || !PP.audio.ctx) return;
    texts.forEach((t) => V.split(t).forEach((s) => { const k = V.key(s); if (manifest.clips[k]) decode(k).catch(() => {}); }));
  };

  /**
   * Play an utterance from clips. Returns a handle {stop()} or null if it can't (caller falls back).
   * opts.pitch / opts.rate (relative to the normal voice) become a gentle playback-rate change.
   */
  V.play = function (text, opts, onEnd) {
    const ctx = PP.audio.ctx;
    if (!ctx || !V.canSpeak(text)) return null;
    opts = opts || {};
    const keys = V.split(text).map(V.key);
    const baseRate = (PP.store && PP.store.settings.rate) || 0.92;
    const pf = opts.pitch ? Math.pow(opts.pitch, 0.4) : 1;
    const rf = opts.rate ? Math.pow(opts.rate / baseRate, 0.5) : 1;
    const pr = Math.max(0.75, Math.min(1.35, pf * rf));
    const gap = ((manifest.gapMs != null ? manifest.gapMs : 130) / 1000) / pr;
    let stopped = false;
    const sources = [];
    Promise.all(keys.map(decode)).then((bufs) => {
      if (stopped) return;
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
      let t = ctx.currentTime + 0.03;
      const out = PP.audio.voiceOut();
      bufs.forEach((b, i) => {
        const s = ctx.createBufferSource();
        s.buffer = b;
        s.playbackRate.value = pr;
        s.connect(out);
        s.start(t);
        sources.push(s);
        if (i === bufs.length - 1) s.onended = () => { if (!stopped) { stopped = true; onEnd(true); } };
        t += b.duration / pr + gap;
      });
    }).catch(() => { if (!stopped) { stopped = true; onEnd(false); } });
    return {
      stop() {
        if (stopped) return;
        stopped = true;
        sources.forEach((s) => { try { s.onended = null; s.stop(); } catch (e) {} });
      },
    };
  };
})();
