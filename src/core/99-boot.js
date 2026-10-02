/* Pip's Playroom — boot: apply settings, harden for toddler fingers on iOS, show start screen. */
(function () {
  'use strict';
  const PP = window.PP;

  function applySettings() {
    const s = PP.store.settings;
    PP.speech.setVoice(s.voiceURI);
    PP.speech.setRate(s.rate);
    PP.speech.setPitch(s.pitch);
    PP.speech.setEnabled(s.speech !== false);
    PP.audio.setVolume(s.volume);
    PP.audio.setMusic(s.music);
  }
  PP.bus.on('settings:changed', applySettings);

  // Any touch (re)unlocks audio — iOS suspends the context after interruptions. iOS treats only the END of a
  // touch (touchend / pointerup / click) as a user gesture, so listen there too.
  const reUnlock = () => { if (!PP.audio.isRunning()) PP.audio.unlock(); };
  ['pointerdown', 'pointerup', 'touchend', 'click'].forEach((t) => document.addEventListener(t, reUnlock, { capture: true, passive: true }));

  // No pinch-zoom, double-tap zoom, long-press menus, or rubber-band scrolling (except in scroll areas).
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('gesturechange', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 1) { e.preventDefault(); return; }
    if (!e.target.closest || !e.target.closest('.home-scroll, .book-scroll, .set-body, .pp-scroll')) e.preventDefault();
  }, { passive: false });
  document.addEventListener('selectstart', (e) => { if (!e.target.closest || !e.target.closest('input, textarea')) e.preventDefault(); });

  function boot() {
    applySettings();
    if (PP.voice) PP.voice.init();
    PP.app.build();
    const q = new URLSearchParams(location.search);
    const game = q.get('game');
    const go = () => { if (game) PP.app.openGame(game); };
    if (q.has('autostart')) {
      PP.audio.unlock();
      PP.bus.emit('started');
      go();
    } else {
      PP.app.showStart(go);
    }
    // Offline support when hosted (e.g. GitHub Pages) with sw.js next to index.html
    try {
      if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && window.top === window && !q.has('nosw')) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      }
    } catch (e) {}
    PP.booted = true;
    PP.bus.emit('boot');
  }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
