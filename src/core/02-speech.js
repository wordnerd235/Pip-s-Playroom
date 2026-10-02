/* Pip's Playroom — text-to-speech (Web Speech API; works in iOS Safari, no recordings needed).
 *
 *   PP.speech.say(text, {mode:'interrupt'|'queue'|'skip', rate, pitch}) -> Promise<boolean>
 *       interrupt (default): stop whatever is being said and say this (rapid calls coalesce)
 *       queue: say after current speech
 *       skip:  only say it if nothing is currently being said
 *   PP.speech.cancel()
 *   PP.speech.speaking() -> boolean
 *   PP.speech.listVoices() -> English voices, best first
 *   PP.speech.setVoice(voiceURI)
 *
 * The promise always resolves (onend can be flaky on iOS, so there is a length-based fallback timer).
 */
(function () {
  'use strict';
  const PP = window.PP;
  const S = (PP.speech = {});
  const synth = window.speechSynthesis;
  S.supported = !!(synth && window.SpeechSynthesisUtterance);

  let voices = [];
  let voice = null;
  let preferredURI = '';
  let rate = 0.92;
  let pitch = 1.12;
  let enabled = true;

  const NOVELTY = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|princess|junior|ralph|fred|kathy)\b/i;
  const ELOQUENCE = /\b(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/i;
  const FAVORITES = { ava: 24, zoe: 24, samantha: 22, allison: 18, nicky: 16, joelle: 16, susan: 12, evan: 10, nathan: 10, noelle: 14, karen: 12, serena: 12, kate: 10, moira: 10, tessa: 10, daniel: 8, tom: 6, aaron: 6, siri: 26 };

  function score(v) {
    let s = 0;
    const name = (v.name || '').toLowerCase();
    const lang = (v.lang || '').replace('_', '-').toLowerCase();
    if (!lang.startsWith('en')) return -999;
    if (NOVELTY.test(name)) return -500;
    if (lang === 'en-us') s += 30;
    else s += 15;
    if (/premium/.test(name)) s += 40;
    if (/enhanced/.test(name)) s += 30;
    if (/natural/.test(name)) s += 35;
    if (/google us english/.test(name)) s += 22;
    if (ELOQUENCE.test(name)) s -= 25;
    for (const k in FAVORITES) if (name.includes(k)) { s += FAVORITES[k]; break; }
    if (v.localService) s += 2;
    if (v.default && lang.startsWith('en')) s += 3;
    return s;
  }

  function loadVoices() {
    if (!S.supported) return;
    voices = synth.getVoices() || [];
    pickVoice();
    PP.bus.emit('speech:voices', voices.length);
  }
  function pickVoice() {
    if (!voices.length) { voice = null; return; }
    if (preferredURI) {
      const v = voices.find((x) => x.voiceURI === preferredURI);
      if (v) { voice = v; return; }
    }
    const sorted = S.listVoices();
    voice = sorted[0] || null;
  }

  S.listVoices = function () {
    return voices.filter((v) => score(v) > -100).sort((a, b) => score(b) - score(a));
  };
  S.currentVoice = () => voice;
  S.setVoice = function (uri) { preferredURI = uri || ''; pickVoice(); };
  S.setRate = (r) => { rate = r; };
  S.setPitch = (p) => { pitch = p; };
  S.setEnabled = (on) => { enabled = !!on; if (!on) S.cancel(); };

  if (S.supported) {
    loadVoices();
    if ('onvoiceschanged' in synth) synth.addEventListener('voiceschanged', loadVoices);
    // Safari sometimes never fires voiceschanged — poll briefly.
    let tries = 0;
    const poll = setInterval(() => {
      tries++;
      if (voices.length || tries > 20) { clearInterval(poll); return; }
      loadVoices();
    }, 250);
  }

  /* ---- speaking ---- */
  const live = new Set(); // keep utterances referenced (GC bug in some engines)
  let current = null; // {utt, resolve, timer}
  let pending = null; // coalesced interrupt {text, opts, resolvers[]}
  let pendingTimer = null;
  const queue = [];
  let speakingFlag = false;

  function estimate(text, r) {
    return Math.min(9000, (500 + text.length * 70) / (r || 1));
  }

  function finish(item, ok) {
    if (!item || item.done) return;
    item.done = true;
    clearTimeout(item.timer);
    if (item.clip && !ok) item.clip.stop();
    live.delete(item.utt);
    if (current === item) {
      current = null;
      speakingFlag = false;
      PP.bus.emit('speech:end');
    }
    item.resolvers.forEach((r) => r(ok));
    // next in queue
    if (!current && !pending && queue.length) {
      const q = queue.shift();
      speakNow(q.text, q.opts, q.resolvers);
    }
  }

  function speakNow(text, opts, resolvers) {
    const r = opts.rate || rate;
    const item = { resolvers, done: false, utt: null, timer: null };
    current = item;
    speakingFlag = true;
    PP.bus.emit('speech:start', { text });
    PP.bus.emit('speech:text', text);
    // 1) Natural recorded voice, when a voice pack is installed and covers every sentence.
    if (enabled && PP.voice && PP.voice.useClips()) {
      const h = PP.voice.play(text, opts, (ok) => finish(item, ok));
      if (h) {
        item.clip = h;
        item.timer = setTimeout(() => finish(item, false), estimate(text, 0.7) * 2 + 3000); // safety net
        return;
      }
    }
    // 2) Device text-to-speech.
    if (!S.supported || !enabled) {
      item.timer = setTimeout(() => finish(item, false), estimate(text, r) * 0.6);
      return;
    }
    try {
      if (synth.paused) synth.resume();
      const u = new SpeechSynthesisUtterance(text);
      item.utt = u;
      live.add(u);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = 'en-US'; }
      u.rate = r;
      u.pitch = opts.pitch || pitch;
      u.volume = 1;
      u.onend = () => finish(item, true);
      u.onerror = () => finish(item, false);
      // fallback in case onend never fires (iOS quirk)
      item.timer = setTimeout(() => finish(item, false), estimate(text, r) * 1.8 + 1500);
      synth.speak(u);
    } catch (e) {
      item.timer = setTimeout(() => finish(item, false), estimate(text, r) * 0.6);
    }
  }

  function hardCancel() {
    queue.length = 0;
    if (current) {
      const c = current;
      current = null;
      speakingFlag = false;
      c.done = true;
      clearTimeout(c.timer);
      live.delete(c.utt);
      if (c.clip) c.clip.stop();
      c.resolvers.forEach((r) => r(false));
      PP.bus.emit('speech:end');
    }
    if (S.supported) { try { synth.cancel(); } catch (e) {} }
  }

  S.speaking = () => speakingFlag || !!pending;

  S.say = function (text, opts) {
    opts = opts || {};
    text = String(text || '').trim();
    if (!text) return Promise.resolve(false);
    const mode = opts.mode || (opts.interrupt === false ? 'queue' : 'interrupt');
    if (mode === 'skip' && S.speaking()) return Promise.resolve(false);
    return new Promise((resolve) => {
      if (mode === 'queue' && (current || pending)) {
        queue.push({ text, opts, resolvers: [resolve] });
        return;
      }
      if (mode === 'queue' || (!current && !pending)) {
        if (!current) { speakNow(text, opts, [resolve]); return; }
      }
      // interrupt: coalesce rapid calls — only the latest text is spoken
      const wasSpeaking = !!current;
      hardCancel();
      if (pending) {
        pending.resolvers.forEach((r) => r(false));
        clearTimeout(pendingTimer);
      }
      pending = { text, opts, resolvers: [resolve] };
      // Safari drops a speak() issued in the same tick as cancel(); give it a moment.
      pendingTimer = setTimeout(() => {
        const p = pending;
        pending = null;
        if (p) speakNow(p.text, p.opts, p.resolvers);
      }, wasSpeaking ? 90 : 0);
    });
  };

  S.cancel = function () {
    if (pending) { pending.resolvers.forEach((r) => r(false)); pending = null; clearTimeout(pendingTimer); }
    hardCancel();
  };

  /** Must be called from inside a user gesture once (iOS requirement). */
  S.unlock = function (text) {
    if (S.supported) {
      loadVoices();
      // Prime the device voice inside the gesture even when clips will do the talking,
      // so fallback lines spoken later from timers are allowed on iOS.
      try {
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        synth.speak(u);
      } catch (e) {}
    }
    if (text) S.say(text, { mode: 'interrupt' });
  };

  // iOS can wedge the synth after backgrounding; reset on return.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) S.cancel();
  });
})();
