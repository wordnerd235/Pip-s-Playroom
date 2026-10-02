/* Pip's Playroom — synthesized audio engine (Web Audio, no files).
 *
 *   PP.audio.unlock()                      call inside a user gesture (core does this for you)
 *   PP.audio.play(inst, note, opts)        melodic instruments: marimba xylo bell piano pluck flute bass toy kalimba
 *   PP.audio.drum(name, opts)              kick tom snare hat shaker tamb clap cowbell woodblock cymbal triangle
 *   PP.audio.sfx(name, opts)               pop tap ding success tada whoosh boing sparkle oops bubble splash
 *                                          slideup slidedown creak applause magic drumroll splat chomp click
 *                                          blastoff swish twinkle
 *   PP.audio.rumble(opts) -> {stop()}      sustained low rumble (rockets, engines)
 *   PP.audio.sequence(events, opts)        -> {stop(), done:Promise}
 *   PP.audio.loop(pattern)                 -> {stop(), setBpm(bpm), bpm}
 *   PP.audio.freq('C#4') / PP.audio.midi('C4')
 *   PP.audio.hush()                        instantly silences everything already scheduled (used on game exit)
 *
 * opts (common): { delay: seconds from now, at: absolute ctx time, vel: 0..1, dur: seconds,
 *                  pan: -1..1, bus: 'music'|'sfx', reverb: 0..1 }
 */
(function () {
  'use strict';
  const PP = window.PP;
  const A = (PP.audio = {});

  let ctx = null;
  let master, comp, reverbIn, musicBus, sfxBus, noiseBuf, voiceBus;
  let volume = 0.8;
  let musicOn = true;
  A.ready = false;

  /* ---------- helpers ---------- */
  const NOTE_IDX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  A.midi = function (n) {
    if (typeof n === 'number') return n;
    const m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(String(n).trim());
    if (!m) return 60;
    let v = NOTE_IDX[m[1].toUpperCase()] + (parseInt(m[3], 10) + 1) * 12;
    if (m[2] === '#') v++;
    if (m[2] === 'b') v--;
    return v;
  };
  A.freq = function (n) {
    if (typeof n === 'number' && n > 127) return n; // already Hz
    return 440 * Math.pow(2, (A.midi(n) - 69) / 12);
  };

  function makeNoise(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function makeIR(seconds, decay) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }

  function buildBuses() {
    musicBus = ctx.createGain();
    musicBus.gain.value = musicOn ? 1 : 0;
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 1;
    musicBus.connect(master);
    sfxBus.connect(master);
  }

  function create() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ctx = new AC({ latencyHint: 'interactive' });
    } catch (e) {
      try { ctx = new AC(); } catch (e2) { return false; }
    }
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 5;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(comp);
    comp.connect(ctx.destination);

    const conv = ctx.createConvolver();
    conv.buffer = makeIR(1.6, 2.8);
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    conv.connect(wet);
    wet.connect(master);
    reverbIn = conv;

    noiseBuf = makeNoise(2);
    voiceBus = ctx.createGain(); // recorded voice clips (never swapped by hush; speech.cancel stops them)
    voiceBus.gain.value = 0.95;
    voiceBus.connect(master);
    buildBuses();
    A.ctx = ctx;
    return true;
  }

  A.unlock = function () {
    try {
      if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback';
    } catch (e) { /* not supported */ }
    if (!ctx && !create()) return;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    if (!A._primed) {
      // iOS: play a silent buffer inside the gesture to fully unlock output
      const b = ctx.createBuffer(1, 1, 22050);
      const s = ctx.createBufferSource();
      s.buffer = b;
      s.connect(ctx.destination);
      s.start(0);
      A._primed = true;
    }
    A.ready = true;
  };
  A.isRunning = () => !!ctx && ctx.state === 'running';
  A.voiceOut = () => voiceBus;
  A.now = () => (ctx ? ctx.currentTime : 0);

  A.setVolume = function (v) {
    volume = Math.max(0, Math.min(1, v));
    if (master) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.02);
  };
  A.setMusic = function (on) {
    musicOn = !!on;
    if (musicBus) musicBus.gain.setTargetAtTime(musicOn ? 1 : 0, ctx.currentTime, 0.02);
  };

  /** Silence everything already scheduled (swap buses). */
  A.hush = function () {
    if (!ctx) return;
    const oldM = musicBus, oldS = sfxBus, t = ctx.currentTime;
    try {
      oldM.gain.cancelScheduledValues(t);
      oldS.gain.cancelScheduledValues(t);
      oldM.gain.setTargetAtTime(0, t, 0.015);
      oldS.gain.setTargetAtTime(0, t, 0.015);
    } catch (e) {}
    setTimeout(() => { try { oldM.disconnect(); oldS.disconnect(); } catch (e) {} }, 200);
    buildBuses();
    activeLoops.slice().forEach((l) => l.stop());
  };

  function T(opts) {
    if (opts && opts.at != null) return Math.max(opts.at, ctx.currentTime);
    return ctx.currentTime + ((opts && opts.delay) || 0) + 0.005;
  }
  /** output node for a voice: pan -> bus (+ reverb send) */
  function out(opts, defaultBus, defaultReverb) {
    const g = ctx.createGain();
    let node = g;
    if (opts && opts.pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, opts.pan));
      g.connect(p);
      node = p;
    }
    const bus = (opts && opts.bus) === 'music' || (!(opts && opts.bus) && defaultBus === 'music') ? musicBus : sfxBus;
    node.connect(bus);
    const rv = opts && opts.reverb != null ? opts.reverb : defaultReverb;
    if (rv > 0) {
      const s = ctx.createGain();
      s.gain.value = rv;
      node.connect(s);
      s.connect(reverbIn);
    }
    return g;
  }
  function osc(type, f, t, stopAt, dest, detune) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (detune) o.detune.value = detune;
    o.connect(dest);
    o.start(t);
    o.stop(stopAt);
    return o;
  }
  function envGain(dest, t, peak, attack, decay, sustainLevel, sustainEnd, release) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    if (sustainLevel != null) {
      g.gain.setTargetAtTime(peak * sustainLevel, t + attack, decay / 3);
      g.gain.setValueAtTime(peak * sustainLevel, sustainEnd);
      g.gain.exponentialRampToValueAtTime(0.0001, sustainEnd + release);
    } else {
      g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    }
    g.connect(dest);
    return g;
  }
  function noise(t, dur, dest) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    s.connect(dest);
    const off = Math.random() * 1.5;
    s.start(t, off);
    s.stop(t + dur);
    return s;
  }
  function filter(type, f, q, dest) {
    const b = ctx.createBiquadFilter();
    b.type = type;
    b.frequency.value = f;
    if (q != null) b.Q.value = q;
    b.connect(dest);
    return b;
  }

  /* ---------- melodic instruments ---------- */
  const INST = {
    marimba(f, t, o, v) {
      const dec = Math.max(0.35, 1.3 - (f - 200) / 900);
      osc('sine', f, t, t + dec + 0.1, envGain(o, t, 0.9 * v, 0.003, dec));
      osc('sine', f * 4, t, t + 0.25, envGain(o, t, 0.12 * v, 0.002, 0.12));
      osc('sine', f * 10, t, t + 0.06, envGain(o, t, 0.04 * v, 0.001, 0.03));
    },
    xylo(f, t, o, v) {
      osc('sine', f, t, t + 0.8, envGain(o, t, 0.8 * v, 0.002, 0.65));
      osc('sine', f * 3, t, t + 0.4, envGain(o, t, 0.22 * v, 0.002, 0.3));
      osc('sine', f * 6.2, t, t + 0.15, envGain(o, t, 0.08 * v, 0.001, 0.1));
      const n = filter('bandpass', Math.min(8000, f * 4), 2, envGain(o, t, 0.15 * v, 0.001, 0.02));
      noise(t, 0.04, n);
    },
    bell(f, t, o, v) {
      [[1, 0.6, 1.8], [2.76, 0.25, 1.0], [5.4, 0.12, 0.5], [8.93, 0.06, 0.25]].forEach(([m, a, d]) => {
        if (f * m < 16000) osc('sine', f * m, t, t + d + 0.1, envGain(o, t, a * v, 0.002, d));
      });
    },
    piano(f, t, o, v, dur) {
      const d = Math.max(0.6, Math.min(2.2, dur + 0.8));
      const lp = filter('lowpass', Math.min(9000, f * 8), 0.7, o);
      lp.frequency.setValueAtTime(Math.min(12000, f * 10), t);
      lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 2), t + d);
      const g = envGain(lp, t, 0.5 * v, 0.004, d);
      osc('triangle', f, t, t + d + 0.1, g, -4);
      osc('triangle', f, t, t + d + 0.1, g, 4);
      osc('sine', f * 2, t, t + d * 0.5, envGain(lp, t, 0.12 * v, 0.003, d * 0.4));
    },
    pluck(f, t, o, v) {
      const lp = filter('lowpass', f * 6, 1, o);
      lp.frequency.setValueAtTime(f * 8, t);
      lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + 0.5);
      osc('sawtooth', f, t, t + 0.7, envGain(lp, t, 0.35 * v, 0.002, 0.6));
      osc('sine', f, t, t + 0.7, envGain(o, t, 0.35 * v, 0.002, 0.6));
    },
    kalimba(f, t, o, v) {
      osc('sine', f, t, t + 1.3, envGain(o, t, 0.75 * v, 0.002, 1.2));
      osc('sine', f * 5.4, t, t + 0.2, envGain(o, t, 0.1 * v, 0.001, 0.12));
      osc('triangle', f * 2, t, t + 0.3, envGain(o, t, 0.08 * v, 0.002, 0.2));
    },
    flute(f, t, o, v, dur) {
      const g = envGain(o, t, 0.4 * v, 0.06, 0.2, 0.85, t + Math.max(0.1, dur), 0.12);
      const o1 = osc('sine', f, t, t + dur + 0.3, g);
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 5.2;
      lg.gain.value = f * 0.006;
      lfo.connect(lg);
      lg.connect(o1.frequency);
      lfo.start(t + 0.1);
      lfo.stop(t + dur + 0.3);
      osc('sine', f * 2, t, t + dur + 0.3, envGain(o, t, 0.05 * v, 0.06, 0.2, 0.8, t + Math.max(0.1, dur), 0.1));
      const bp = filter('bandpass', f * 2, 1.5, envGain(o, t, 0.04 * v, 0.03, 0.15));
      noise(t, 0.2, bp);
    },
    bass(f, t, o, v, dur) {
      const lp = filter('lowpass', 600, 1, o);
      osc('triangle', f, t, t + dur + 0.3, envGain(lp, t, 0.8 * v, 0.005, 0.2, 0.6, t + Math.max(0.05, dur * 0.9), 0.12));
      osc('sine', f, t, t + dur + 0.3, envGain(o, t, 0.4 * v, 0.005, 0.2, 0.6, t + Math.max(0.05, dur * 0.9), 0.12));
    },
    toy(f, t, o, v) {
      const lp = filter('lowpass', Math.min(6000, f * 5), 0.8, o);
      osc('square', f, t, t + 0.5, envGain(lp, t, 0.16 * v, 0.003, 0.4));
      osc('sine', f * 2, t, t + 0.6, envGain(o, t, 0.3 * v, 0.002, 0.5));
    },
  };
  const INST_REVERB = { marimba: 0.25, xylo: 0.25, bell: 0.45, piano: 0.3, pluck: 0.2, kalimba: 0.35, flute: 0.35, bass: 0.05, toy: 0.2 };

  /** Play a melodic note. note: 'C4' | midi number | Hz (>127). Returns start time. */
  A.play = function (inst, note, opts) {
    if (!ctx) return 0;
    opts = opts || {};
    const fn = INST[inst] || INST.marimba;
    const t = T(opts);
    const v = opts.vel == null ? 0.8 : opts.vel;
    const o = out(opts, 'sfx', INST_REVERB[inst] != null ? INST_REVERB[inst] : 0.25);
    const notes = Array.isArray(note) ? note : [note];
    notes.forEach((n) => fn(A.freq(n), t, o, v / Math.sqrt(notes.length), opts.dur || 0.4));
    setTimeout(() => { try { o.disconnect(); } catch (e) {} }, ((t - ctx.currentTime) + (opts.dur || 0.4) + 3) * 1000);
    return t;
  };
  A.instruments = Object.keys(INST);

  /* ---------- percussion ---------- */
  const DRUM = {
    kick(t, o, v) {
      const g = envGain(o, t, 1.1 * v, 0.002, 0.4);
      const k = osc('sine', 150, t, t + 0.45, g);
      k.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      noise(t, 0.02, filter('lowpass', 2000, 1, envGain(o, t, 0.25 * v, 0.001, 0.02)));
    },
    tom(t, o, v, pitch) {
      const f = pitch || 180;
      const g = envGain(o, t, 0.9 * v, 0.002, 0.45);
      const k = osc('sine', f, t, t + 0.5, g);
      k.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.35);
      osc('triangle', f * 1.5, t, t + 0.1, envGain(o, t, 0.15 * v, 0.001, 0.06));
    },
    snare(t, o, v) {
      const hp = filter('highpass', 1200, 0.7, envGain(o, t, 0.7 * v, 0.001, 0.2));
      noise(t, 0.25, hp);
      const b = osc('triangle', 220, t, t + 0.12, envGain(o, t, 0.5 * v, 0.001, 0.08));
      b.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    },
    hat(t, o, v) {
      noise(t, 0.08, filter('highpass', 7500, 0.8, envGain(o, t, 0.35 * v, 0.001, 0.05)));
    },
    openhat(t, o, v) {
      noise(t, 0.4, filter('highpass', 7000, 0.8, envGain(o, t, 0.3 * v, 0.002, 0.3)));
    },
    shaker(t, o, v) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.45 * v, t + 0.035);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      g.connect(o);
      noise(t, 0.15, filter('bandpass', 6000, 1.2, g));
    },
    tamb(t, o, v) {
      noise(t, 0.3, filter('highpass', 5500, 1, envGain(o, t, 0.4 * v, 0.001, 0.22)));
      [5200, 6700, 7900, 9100].forEach((f, i) => {
        osc('sine', f + Math.random() * 300, t + i * 0.004, t + 0.25, envGain(o, t + i * 0.004, 0.05 * v, 0.001, 0.18));
      });
    },
    clap(t, o, v) {
      const bp = filter('bandpass', 1400, 1.2, o);
      [0, 0.011, 0.022].forEach((d) => {
        noise(t + d, 0.02, envGain(bp, t + d, 0.8 * v, 0.001, 0.015));
      });
      noise(t + 0.03, 0.2, envGain(bp, t + 0.03, 0.6 * v, 0.002, 0.15));
    },
    cowbell(t, o, v) {
      const bp = filter('bandpass', 800, 3, envGain(o, t, 0.55 * v, 0.001, 0.35));
      osc('square', 540, t, t + 0.4, bp);
      osc('square', 800, t, t + 0.4, bp);
    },
    woodblock(t, o, v) {
      osc('sine', 820, t, t + 0.1, envGain(o, t, 0.8 * v, 0.001, 0.07));
      osc('sine', 1260, t, t + 0.06, envGain(o, t, 0.3 * v, 0.001, 0.04));
    },
    cymbal(t, o, v) {
      const hp = filter('highpass', 5000, 0.5, envGain(o, t, 0.4 * v, 0.003, 1.3));
      noise(t, 1.4, hp);
      const bp = filter('bandpass', 9000, 0.6, envGain(o, t, 0.12 * v, 0.003, 1.1));
      [263, 400, 421, 474, 587, 845].forEach((f) => osc('square', f * 2, t, t + 1.2, bp));
    },
    triangle(t, o, v) {
      [[2600, 0.25, 1.8], [7100, 0.08, 1.2], [4300, 0.06, 1.4]].forEach(([f, a, d]) =>
        osc('sine', f, t, t + d + 0.1, envGain(o, t, a * v, 0.001, d)));
    },
    bongo(t, o, v, pitch) {
      const f = pitch || 380;
      const g = envGain(o, t, 0.8 * v, 0.001, 0.18);
      const k = osc('sine', f, t, t + 0.2, g);
      k.frequency.exponentialRampToValueAtTime(f * 0.8, t + 0.12);
    },
  };
  A.drums = Object.keys(DRUM);
  A.drum = function (name, opts) {
    if (!ctx) return 0;
    opts = opts || {};
    const fn = DRUM[name] || DRUM.kick;
    const t = T(opts);
    const o = out(opts, 'sfx', 0.12);
    fn(t, o, opts.vel == null ? 0.85 : opts.vel, opts.pitch);
    setTimeout(() => { try { o.disconnect(); } catch (e) {} }, ((t - ctx.currentTime) + 2.5) * 1000);
    return t;
  };

  /* ---------- sound effects ---------- */
  const PENTA = ['C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'D7', 'E7'];
  const SFX = {
    pop(t, o, v) {
      noise(t, 0.09, filter('bandpass', 1300, 0.8, envGain(o, t, 1.0 * v, 0.001, 0.08)));
      const s = osc('sine', 260, t, t + 0.12, envGain(o, t, 0.6 * v, 0.001, 0.1));
      s.frequency.exponentialRampToValueAtTime(90, t + 0.1);
      const hi = osc('sine', 900, t, t + 0.06, envGain(o, t, 0.25 * v, 0.001, 0.05));
      hi.frequency.exponentialRampToValueAtTime(1800, t + 0.05);
    },
    tap(t, o, v) {
      const s = osc('sine', 700, t, t + 0.08, envGain(o, t, 0.35 * v, 0.001, 0.06));
      s.frequency.exponentialRampToValueAtTime(1000, t + 0.05);
    },
    click(t, o, v) {
      noise(t, 0.02, filter('highpass', 3000, 1, envGain(o, t, 0.4 * v, 0.001, 0.015)));
    },
    ding(t, o, v) { INST.bell(A.freq('E6'), t, o, 0.7 * v); },
    twinkle(t, o, v) {
      ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => INST.bell(A.freq(n), t + i * 0.07, o, 0.35 * v));
    },
    success(t, o, v) {
      ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => INST.xylo(A.freq(n), t + i * 0.085, o, 0.6 * v));
      INST.bell(A.freq('E6'), t + 0.34, o, 0.3 * v);
    },
    tada(t, o, v) {
      ['G4', 'C5', 'E5'].forEach((n, i) => INST.piano(A.freq(n), t + i * 0.06, o, 0.45 * v, 0.2));
      ['C5', 'E5', 'G5', 'C6'].forEach((n) => INST.piano(A.freq(n), t + 0.28, o, 0.35 * v, 1.0));
      for (let i = 0; i < 6; i++) INST.bell(A.freq(PENTA[i + 1]), t + 0.3 + i * 0.06, o, 0.18 * v);
      DRUM.cymbal(t + 0.28, o, 0.4 * v);
    },
    whoosh(t, o, v) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.5 * v, t + 0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      g.connect(o);
      const bp = filter('bandpass', 400, 1.5, g);
      bp.frequency.setValueAtTime(300, t);
      bp.frequency.exponentialRampToValueAtTime(3500, t + 0.4);
      noise(t, 0.5, bp);
    },
    swish(t, o, v) {
      const g = envGain(o, t, 0.3 * v, 0.03, 0.15);
      const bp = filter('bandpass', 3000, 2, g);
      bp.frequency.setValueAtTime(5000, t);
      bp.frequency.exponentialRampToValueAtTime(1500, t + 0.15);
      noise(t, 0.2, bp);
    },
    boing(t, o, v) {
      const g = envGain(o, t, 0.5 * v, 0.003, 0.6);
      const s = osc('sine', 180, t, t + 0.65, g);
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.setValueAtTime(14, t);
      lg.gain.setValueAtTime(90, t);
      lg.gain.exponentialRampToValueAtTime(5, t + 0.6);
      lfo.connect(lg);
      lg.connect(s.frequency);
      lfo.start(t);
      lfo.stop(t + 0.65);
      s.frequency.linearRampToValueAtTime(320, t + 0.6);
    },
    sparkle(t, o, v) {
      const notes = PP.util.shuffle(PENTA).slice(0, 6);
      notes.forEach((n, i) => INST.bell(A.freq(n), t + i * 0.055, o, 0.22 * v));
    },
    magic(t, o, v) {
      ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'C7'].forEach((n, i) => INST.bell(A.freq(n), t + i * 0.04, o, 0.2 * v));
    },
    oops(t, o, v) {
      // friendly "bwoop" — never harsh
      const g = envGain(o, t, 0.35 * v, 0.01, 0.3);
      const s = osc('triangle', 330, t, t + 0.35, g);
      s.frequency.setValueAtTime(330, t);
      s.frequency.exponentialRampToValueAtTime(220, t + 0.25);
    },
    bubble(t, o, v) {
      const s = osc('sine', 300, t, t + 0.12, envGain(o, t, 0.5 * v, 0.002, 0.1));
      s.frequency.exponentialRampToValueAtTime(1300, t + 0.08);
    },
    splash(t, o, v) {
      const lp = filter('lowpass', 3000, 0.7, envGain(o, t, 0.6 * v, 0.005, 0.5));
      lp.frequency.setValueAtTime(4000, t);
      lp.frequency.exponentialRampToValueAtTime(500, t + 0.5);
      noise(t, 0.6, lp);
      for (let i = 0; i < 4; i++) SFX.bubble(t + 0.08 + i * 0.07 + Math.random() * 0.03, o, 0.25 * v);
    },
    splat(t, o, v) {
      noise(t, 0.15, filter('lowpass', 900, 1, envGain(o, t, 0.8 * v, 0.002, 0.13)));
      const s = osc('sine', 160, t, t + 0.15, envGain(o, t, 0.5 * v, 0.002, 0.12));
      s.frequency.exponentialRampToValueAtTime(70, t + 0.12);
    },
    slideup(t, o, v) {
      const s = osc('sine', 350, t, t + 0.5, envGain(o, t, 0.4 * v, 0.02, 0.45));
      s.frequency.exponentialRampToValueAtTime(1400, t + 0.45);
    },
    slidedown(t, o, v) {
      const s = osc('sine', 1300, t, t + 0.5, envGain(o, t, 0.4 * v, 0.02, 0.45));
      s.frequency.exponentialRampToValueAtTime(300, t + 0.45);
    },
    creak(t, o, v) {
      const bp = filter('bandpass', 900, 4, envGain(o, t, 0.35 * v, 0.03, 0.4));
      const s = osc('sawtooth', 90, t, t + 0.45, bp);
      for (let i = 0; i < 8; i++) s.frequency.setValueAtTime(80 + Math.random() * 60, t + i * 0.05);
    },
    applause(t, o, v) {
      for (let i = 0; i < 26; i++) {
        const d = Math.random() * 1.4;
        const bp = filter('bandpass', 900 + Math.random() * 1500, 1.5, o);
        noise(t + d, 0.03, envGain(bp, t + d, (0.15 + Math.random() * 0.2) * v * (1 - d / 2), 0.001, 0.025));
      }
    },
    drumroll(t, o, v) {
      for (let i = 0; i < 16; i++) DRUM.snare(t + i * 0.045, o, 0.25 * v * (0.5 + i / 32));
      DRUM.cymbal(t + 0.75, o, 0.6 * v);
      DRUM.kick(t + 0.75, o, 0.6 * v);
    },
    chomp(t, o, v) {
      [0, 0.16].forEach((d) => {
        noise(t + d, 0.06, filter('lowpass', 1200, 1, envGain(o, t + d, 0.6 * v, 0.002, 0.05)));
        osc('sine', 120, t + d, t + d + 0.08, envGain(o, t + d, 0.4 * v, 0.002, 0.06));
      });
    },
    blastoff(t, o, v) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.8 * v, t + 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      g.connect(o);
      const lp = filter('lowpass', 300, 1, g);
      lp.frequency.setValueAtTime(200, t);
      lp.frequency.exponentialRampToValueAtTime(2500, t + 1.5);
      noise(t, 2.5, lp);
      SFX.slideup(t + 0.2, o, 0.3 * v);
    },
  };
  A.sfxNames = Object.keys(SFX);
  A.sfx = function (name, opts) {
    if (!ctx) return 0;
    opts = opts || {};
    const fn = SFX[name];
    if (!fn) { console.warn('unknown sfx', name); return 0; }
    const t = T(opts);
    const o = out(opts, 'sfx', name === 'tada' || name === 'success' || name === 'ding' ? 0.3 : 0.1);
    fn(t, o, opts.vel == null ? 0.8 : opts.vel);
    setTimeout(() => { try { o.disconnect(); } catch (e) {} }, ((t - ctx.currentTime) + 3.5) * 1000);
    return t;
  };

  /** Sustained low rumble; returns {stop(fadeSeconds)} */
  A.rumble = function (opts) {
    if (!ctx) return { stop() {}, setLevel() {} };
    opts = opts || {};
    const t = T(opts);
    const o = out(opts, 'sfx', 0.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime((opts.vel || 0.5), t + (opts.attack || 0.4));
    g.connect(o);
    const lp = filter('lowpass', opts.cutoff || 180, 1, g);
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    s.connect(lp);
    s.start(t);
    const sub = osc('sine', 45, t, t + 600, g);
    return {
      setLevel(v) { g.gain.setTargetAtTime(v, ctx.currentTime, 0.1); },
      setCutoff(f) { lp.frequency.setTargetAtTime(f, ctx.currentTime, 0.1); },
      stop(fade) {
        const now = ctx.currentTime, f = fade == null ? 0.4 : fade;
        g.gain.cancelScheduledValues(now);
        g.gain.setTargetAtTime(0.0001, now, f / 3);
        try { s.stop(now + f + 0.1); sub.stop(now + f + 0.1); } catch (e) {}
        setTimeout(() => { try { o.disconnect(); } catch (e) {} }, (f + 0.5) * 1000);
      },
    };
  };

  /* ---------- sequencing ---------- */
  /**
   * Play a list of events.
   *   events: [{n:'C4'|['C4','E4']|null, d: beats, inst?, vel?, drum?:'kick'}] or shorthand ['C4', 1]
   *   opts: { bpm=100, inst='marimba', vel, onNote(i, ev, when), bus, delay }
   * Returns { stop(), done: Promise, duration (seconds) }
   * onNote is called (via setTimeout) roughly when each note sounds — use it for visuals.
   */
  A.sequence = function (events, opts) {
    opts = opts || {};
    if (!ctx) return { stop() {}, done: Promise.resolve(), duration: 0 };
    const bpm = opts.bpm || 100, beat = 60 / bpm;
    let t = T(opts) + 0.05;
    const start = t;
    const timers = [];
    let stopped = false;
    const evs = events.map((e) => (Array.isArray(e) ? { n: e[0], d: e[1] } : e));
    evs.forEach((ev, i) => {
      const d = (ev.d == null ? 1 : ev.d) * beat;
      if (ev.n != null || ev.drum) {
        if (ev.drum) A.drum(ev.drum, { at: t, vel: ev.vel || opts.vel, bus: opts.bus || 'music' });
        if (ev.n != null) A.play(ev.inst || opts.inst || 'marimba', ev.n, { at: t, dur: d * 0.9, vel: ev.vel || opts.vel, bus: opts.bus || 'music' });
      }
      if (opts.onNote) {
        const when = t;
        timers.push(setTimeout(() => { if (!stopped) opts.onNote(i, ev, when); }, Math.max(0, (t - ctx.currentTime) * 1000)));
      }
      t += d;
    });
    const duration = t - start;
    let resolveDone;
    const done = new Promise((r) => (resolveDone = r));
    timers.push(setTimeout(() => resolveDone(true), Math.max(0, (t - ctx.currentTime) * 1000)));
    return {
      duration,
      done,
      stop() {
        if (stopped) return;
        stopped = true;
        timers.forEach(clearTimeout);
        resolveDone(false);
      },
    };
  };

  /**
   * Step-sequencer loop with a look-ahead scheduler (rock-steady timing).
   *   pattern: { bpm: 100, steps: 16, stepsPerBeat: 4,
   *              tracks: { kick: [1,0,0,0, ...], hat: 'x.x.x.x.x.x.x.x.' },   // drum names
   *              notes:  { bass: { inst:'bass', seq:['C2',null,...] } },     // optional melodic tracks
   *              vel: 0.6,
   *              onStep(stepIndex, when) }  // visuals; called via setTimeout near the audible time
   * Returns { stop(), setBpm(bpm), get bpm, get step, beatTime(): ctx time of the most recent beat }
   */
  const activeLoops = [];
  A.loop = function (pattern) {
    if (!ctx) return { stop() {}, setBpm() {}, bpm: pattern.bpm, beatTime: () => 0, nextBeatTime: () => 0 };
    let bpm = pattern.bpm || 100;
    const steps = pattern.steps || 16;
    const spb = pattern.stepsPerBeat || 4;
    let step = 0;
    let next = ctx.currentTime + 0.1;
    let stopped = false;
    let lastBeat = next;
    const timers = new Set();
    const tracks = {};
    for (const k in pattern.tracks || {}) {
      const tr = pattern.tracks[k];
      tracks[k] = typeof tr === 'string' ? tr.split('').map((c) => (c === 'x' ? 1 : c === 'o' ? 0.5 : 0)) : tr;
    }
    function schedule() {
      if (stopped) return;
      while (next < ctx.currentTime + 0.12) {
        const s = step % steps;
        for (const k in tracks) {
          const hit = tracks[k][s % tracks[k].length];
          if (hit) A.drum(k, { at: next, vel: (pattern.vel || 0.6) * hit, bus: 'music' });
        }
        for (const k in pattern.notes || {}) {
          const nt = pattern.notes[k];
          const n = nt.seq[s % nt.seq.length];
          if (n) A.play(nt.inst || 'bass', n, { at: next, dur: (60 / bpm / spb) * (nt.len || 1.8), vel: nt.vel || 0.5, bus: 'music' });
        }
        if (s % spb === 0) lastBeat = next;
        if (pattern.onStep) {
          const when = next, idx = s;
          const id = setTimeout(() => { timers.delete(id); if (!stopped) pattern.onStep(idx, when); }, Math.max(0, (next - ctx.currentTime) * 1000));
          timers.add(id);
        }
        next += 60 / bpm / spb;
        step++;
      }
    }
    const iv = setInterval(schedule, 25);
    schedule();
    const handle = {
      stop() {
        if (stopped) return;
        stopped = true;
        clearInterval(iv);
        timers.forEach(clearTimeout);
        const i = activeLoops.indexOf(handle);
        if (i >= 0) activeLoops.splice(i, 1);
      },
      setBpm(b) { bpm = Math.max(30, Math.min(240, b)); },
      get bpm() { return bpm; },
      get step() { return step; },
      beatTime: () => lastBeat,
      beatDur: () => 60 / bpm,
    };
    activeLoops.push(handle);
    return handle;
  };

  // Keep the context alive across iOS interruptions (calls, app switching).
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend && ctx.suspend().catch(() => {});
    else ctx.resume && ctx.resume().catch(() => {});
  });
})();
