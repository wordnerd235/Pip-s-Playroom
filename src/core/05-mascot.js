/* Pip — the playroom mascot (original character: a round, sunny sprout-creature).
 *   const pip = PP.mascot.create({size:'120px'})
 *   pip.el                      // container element to place anywhere
 *   pip.mood('happy'|'cheer'|'wiggle'|'surprise'|'think'|'wave'|'sleep'|'idle')
 *   pip.lookAt(x, y)            // viewport coords
 *   pip.destroy()
 * Every live Pip animates its mouth automatically while speech is playing.
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;

  const SVG = `
<svg class="pip-svg" viewBox="0 0 200 210" aria-hidden="true">
  <ellipse class="pip-shadow" cx="100" cy="200" rx="52" ry="7" fill="rgba(40,20,60,.14)"/>
  <g class="pip-jump">
   <g class="pip-squash">
    <ellipse cx="76" cy="186" rx="17" ry="9" fill="#EE7A2B"/>
    <ellipse cx="124" cy="186" rx="17" ry="9" fill="#EE7A2B"/>
    <g class="pip-arm pip-arm-l"><ellipse cx="36" cy="128" rx="13" ry="20" fill="#FF9E40" transform="rotate(28 36 128)"/></g>
    <g class="pip-arm pip-arm-r"><ellipse cx="164" cy="128" rx="13" ry="20" fill="#FF9E40" transform="rotate(-28 164 128)"/></g>
    <g class="pip-sprout">
      <path d="M100 52 C 99 40, 100 30, 103 22" stroke="#38A04C" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M103 24 C 92 6, 66 10, 68 26 C 80 34, 96 32, 103 24 Z" fill="#5BC56A"/>
      <path d="M103 24 C 114 4, 142 8, 140 24 C 126 34, 110 32, 103 24 Z" fill="#7FDA86"/>
      <path d="M103 24 C 96 18, 84 18, 76 22" stroke="#3E9E50" stroke-width="2" fill="none" opacity=".5"/>
    </g>
    <ellipse cx="100" cy="118" rx="70" ry="68" fill="url(#pp-pip-body)"/>
    <ellipse cx="100" cy="146" rx="42" ry="31" fill="#FFE9B8" opacity=".75"/>
    <ellipse cx="72" cy="78" rx="18" ry="10" fill="#fff" opacity=".35" transform="rotate(-25 72 78)"/>
    <ellipse class="pip-cheek" cx="54" cy="128" rx="12" ry="7.5" fill="#FF6F86" opacity=".5"/>
    <ellipse class="pip-cheek" cx="146" cy="128" rx="12" ry="7.5" fill="#FF6F86" opacity=".5"/>
    <g class="pip-eye pip-eye-l">
      <ellipse cx="74" cy="104" rx="16" ry="19" fill="#fff"/>
      <g class="pip-pupil"><circle cx="76" cy="107" r="10" fill="#2B2340"/><circle cx="80" cy="102" r="3.6" fill="#fff"/><circle cx="72.5" cy="111" r="1.6" fill="#fff"/></g>
    </g>
    <g class="pip-eye pip-eye-r">
      <ellipse cx="126" cy="104" rx="16" ry="19" fill="#fff"/>
      <g class="pip-pupil"><circle cx="128" cy="107" r="10" fill="#2B2340"/><circle cx="132" cy="102" r="3.6" fill="#fff"/><circle cx="124.5" cy="111" r="1.6" fill="#fff"/></g>
    </g>
    <path class="pip-happy-eyes" d="M60 106 Q74 92 88 106 M112 106 Q126 92 140 106" stroke="#2B2340" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path class="pip-sleep-eyes" d="M60 104 Q74 116 88 104 M112 104 Q126 116 140 104" stroke="#2B2340" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path class="pip-mouth pip-mouth-smile" d="M86 134 Q100 149 114 134" stroke="#5A2A1A" stroke-width="5.5" fill="none" stroke-linecap="round"/>
    <g class="pip-mouth pip-mouth-open">
      <path d="M84 132 Q100 162 116 132 Z" fill="#7A2B32" stroke="#5A2A1A" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="100" cy="146" rx="8" ry="4.5" fill="#FF8C9A"/>
    </g>
    <ellipse class="pip-mouth pip-mouth-o" cx="100" cy="140" rx="8" ry="10" fill="#7A2B32" stroke="#5A2A1A" stroke-width="3"/>
   </g>
  </g>
</svg>`;

  const live = new Set();

  PP.mascot = {
    create(opts) {
      opts = opts || {};
      const el = U.el('div', { class: 'pip ' + (opts.cls || ''), style: { width: opts.size || '120px', height: opts.size || '120px' } });
      el.innerHTML = SVG;
      const svg = el.firstElementChild;
      const pupils = svg.querySelectorAll('.pip-pupil');
      let moodTimer = null;
      let blinkTimer = null;
      let destroyed = false;

      function blinkLoop() {
        if (destroyed) return;
        blinkTimer = setTimeout(() => {
          el.classList.add('blink');
          setTimeout(() => el.classList.remove('blink'), 140);
          blinkLoop();
        }, 2200 + Math.random() * 3200);
      }
      blinkLoop();

      const api = {
        el,
        mood(m, ms) {
          clearTimeout(moodTimer);
          el.classList.remove('m-happy', 'm-cheer', 'm-wiggle', 'm-surprise', 'm-think', 'm-wave', 'm-sleep');
          // force reflow so the same animation can retrigger
          void el.offsetWidth;
          if (m && m !== 'idle') {
            el.classList.add('m-' + m);
            const dur = ms || { happy: 900, cheer: 1400, wiggle: 700, surprise: 900, think: 1600, wave: 1500, sleep: 0 }[m];
            if (dur) moodTimer = setTimeout(() => el.classList.remove('m-' + m), dur);
          }
          return api;
        },
        lookAt(x, y) {
          const r = svg.getBoundingClientRect();
          if (!r.width) return;
          const cx = r.left + r.width / 2, cy = r.top + r.height * 0.5;
          const dx = x - cx, dy = y - cy;
          const d = Math.hypot(dx, dy) || 1;
          const k = Math.min(1, d / 300) * 5.5;
          pupils.forEach((p) => p.setAttribute('transform', `translate(${((dx / d) * k).toFixed(1)} ${((dy / d) * k).toFixed(1)})`));
        },
        talk(on) { el.classList.toggle('talking', !!on); },
        destroy() {
          destroyed = true;
          clearTimeout(moodTimer);
          clearTimeout(blinkTimer);
          live.delete(api);
          el.remove();
        },
      };
      live.add(api);
      if (PP.speech && PP.speech.speaking()) api.talk(true);
      return api;
    },
  };

  // Mouth flaps while speaking
  let flap = null;
  PP.bus.on('speech:start', () => {
    live.forEach((p) => p.talk(true));
    clearInterval(flap);
    let open = false;
    flap = setInterval(() => {
      open = !open;
      live.forEach((p) => p.el.classList.toggle('mouth-open', open));
    }, 130);
  });
  PP.bus.on('speech:end', () => {
    clearInterval(flap);
    live.forEach((p) => { p.talk(false); p.el.classList.remove('mouth-open'); });
  });
  // Eyes follow touches
  document.addEventListener('pointerdown', (e) => live.forEach((p) => p.lookAt(e.clientX, e.clientY)), { passive: true, capture: true });
})();
