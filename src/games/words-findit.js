/* Find It! — receptive vocabulary ("Where's the dog?").
 * Reference implementation of a game module; see GAME_API.md.
 * Level 1: 2 pictures from different categories → Level 5: 6 pictures from the same category.
 */
(function () {
  'use strict';
  const PP = window.PP;
  const U = PP.util;

  U.addStyles('findit', `
    .g-findit { background: radial-gradient(120% 90% at 50% 0%, #FFFBE0 0%, #D9F5E1 55%, #B8E8F5 100%); }
    .fi-stars { position: absolute; z-index: 5; top: calc(var(--safe-t) + 16px); left: 50%; transform: translateX(-50%); display: flex; gap: 1.2vmin; }
    .fi-star { font-size: clamp(26px, 5.4vmin, 46px); opacity: .25; filter: grayscale(1); transition: opacity .4s, filter .4s; }
    .fi-star.on { opacity: 1; filter: none; animation: pp-yay .7s cubic-bezier(.3,1.6,.5,1); }
    .fi-area { position: absolute; left: calc(var(--safe-l) + 12px); right: calc(var(--safe-r) + 12px);
      top: calc(var(--safe-t) + clamp(68px, 11vmin, 104px)); bottom: calc(var(--safe-b) + clamp(70px, 13vmin, 130px)); }
    .fi-cat { position: absolute; z-index: 5; top: calc(var(--safe-t) + 14px); right: calc(var(--safe-r) + 16px); font-size: clamp(30px, 6vmin, 52px); }
  `);

  const BASIC = ['animals', 'vehicles', 'food'];
  const MORE = ['animals', 'vehicles', 'food', 'home', 'body', 'clothes', 'nature'];
  const PROMPTS = [(w) => `Where's the ${w}?`, (w) => `Find the ${w}!`, (w) => `Can you find the ${w}?`, (w) => `Tap the ${w}!`];

  PP.registerGame({
    id: 'findit',
    title: 'Find It!',
    domain: 'words',
    icon: '🔍',
    tileColor: '#2EBF9A',
    order: 30,
    create(stage, ctx) {
      const stars = ctx.el('div', { class: 'fi-stars' });
      const ROUNDS = 5;
      for (let i = 0; i < ROUNDS; i++) stars.appendChild(ctx.el('span', { class: 'fi-star pp-emoji', text: '⭐' }));
      const catBadge = ctx.el('div', { class: 'fi-cat pp-emoji' });
      const area = ctx.el('div', { class: 'fi-area' });
      stage.append(stars, catBadge, area);
      ctx.mascot.show({ corner: 'bl' });

      let catIdx = 0;
      let recent = [];

      async function playSet(first) {
        const lvl = ctx.level;
        const cats = lvl <= 2 ? BASIC : MORE;
        const cat = cats[catIdx++ % cats.length];
        const catInfo = PP.data.CATEGORIES.find((c) => c.id === cat);
        catBadge.textContent = catInfo.emoji;
        stars.querySelectorAll('.fi-star').forEach((s) => s.classList.remove('on'));
        let intro = first ? `Let's find ${catInfo.name}!` : `Now let's find ${catInfo.name}!`;

        for (let r = 0; r < ROUNDS; r++) {
          const level = ctx.level;
          const n = [2, 2, 3, 4, 4, 6][level];
          const pool = PP.data.wordsIn(cat).filter((w) => !recent.includes(w.id));
          const target = ctx.pick(pool.length ? pool : PP.data.wordsIn(cat));
          recent.push(target.id);
          if (recent.length > 8) recent.shift();
          // distractors: different categories when easy, same category when harder
          const distractPool = (level <= 2 ? PP.data.WORDS.filter((w) => w.cat !== cat) : PP.data.wordsIn(cat))
            .filter((w) => w.id !== target.id && w.emoji !== target.emoji);
          const choices = ctx.shuffle([target].concat(ctx.sample(distractPool, n - 1))).map((w) => ({
            id: w.id, name: w.word, render: () => PP.kit.emoji(w.emoji),
          }));
          await PP.kit.findRound(ctx, {
            container: area,
            choices,
            targetId: target.id,
            intro: r === 0 ? intro : null,
            prompt: ctx.pick(PROMPTS)(target.word),
            sayRight: (c) => {
              const w = PP.data.word(c.id);
              return `${ctx.praise()} The ${w.word}!` + (w.sound && Math.random() < 0.6 ? ` ${PP.data.says(w)}` : '');
            },
          });
          const star = stars.children[r];
          star.classList.add('on');
          ctx.sfx('ding');
          await ctx.wait(250);
        }
        area.innerHTML = '';
        await ctx.celebrate({ big: true, say: `You found them all!` });
        await ctx.wait(400);
      }

      (async () => {
        let first = true;
        while (ctx.alive) {
          await playSet(first);
          first = false;
        }
      })();

      return { destroy() {} };
    },
  });
})();
