# Pip's Playroom — Game Module Contract

A web app for a **2-year-old** on **iPad / iPhone Safari**. Learning goals: colors, numbers, words, shapes, music.
The core engine is done (`src/core/*`). Each activity is ONE self-contained file in `src/games/<domain>-<name>.js`
that calls `PP.registerGame({...})`. **Read `src/games/words-findit.js` first — it is the reference implementation.**
Skim `src/core/07-ctx.js`, `08-kit.js`, `01-audio.js`, `03-data.js` for exact APIs.

## Hard rules
- **Only edit your own game files** (`src/games/<yours>.js`). Never edit core, other games, or tools. If core is missing
  something, implement it locally inside your file and mention it in your final report.
- No external assets, no network, no images/audio files, no libraries. Art = inline SVG / CSS / emoji. Sound = `PP.audio` synth.
  Speech = `ctx.say()` (device text-to-speech). No microphone.
- All art must be original. No copyrighted characters, logos or brand designs. Public-domain nursery tunes are fine.
- Namespace CSS classes with your game id: `.g-<id>` is put on the stage element; use prefixes like `.bp-` for "balloons".
  Inject CSS once with `PP.util.addStyles('<id>', css)`.
- Use **ctx** timing/input helpers (`ctx.setTimeout`, `ctx.setInterval`, `ctx.raf`, `ctx.wait`, `ctx.on`, `ctx.tap`,
  `ctx.drag`, `ctx.loop`, `ctx.sequence`, `ctx.rumble`) so everything is cleaned up automatically when the child leaves.
  Never use bare `setInterval`/`requestAnimationFrame`/`document.addEventListener` without cleanup.
- Async flows: `while (ctx.alive) { ... await ctx.wait(...) }` — `ctx.wait`/`ctx.celebrate` never resolve after exit, so loops just stop.
- No console errors. Must work at 393×852 (iPhone portrait), 852×393 (iPhone landscape), 1180×820 and 820×1180 (iPad). Recompute
  layout in `ctx.onResize(fn)`.

## Toddler design principles (this is what makes or breaks it)
1. **No reading required.** Every instruction is spoken. Text on screen only as print exposure (big numerals, color words).
2. **Instant feedback on every touch** (<50 ms): a sound + a visual reaction. Use `ctx.tap(el, fn)` (fires on pointerdown).
   Dead zones feel broken to a 2-year-old — even tapping the background can do something small and delightful.
3. **Errorless learning, no failure states.** Wrong answer → gentle `ctx.sfx('oops')`, wiggle, *name what they tapped*,
   re-prompt; after 2 misses make the right answer glow (`PP.fx.glow(el)`). Never a buzzer, never "wrong", never a lost life,
   never a timer that runs out.
4. **Huge targets**: ≥ 90 px on iPad, ≥ 72 px on iPhone, well separated. Toddlers tap with the whole finger pad, often drag while tapping,
   and multi-touch with the other hand resting on the screen.
5. **Short speech.** 2–6 words: "Find the red one!", "Pop!", "Three!". Repeat key words. Name things constantly ("Blue!").
   Don't talk over yourself; `ctx.say` interrupts by default; use `{mode:'skip'}` for chatter during rapid tapping.
6. **Rhythm of play**: short rounds (3–6 actions), then a celebration, then something new. Celebrate with `ctx.celebrate()`.
7. **Adaptive**: read `ctx.level` (1–5) at the start of each round to scale difficulty (number of choices, range, speed).
   Call `ctx.success(firstTry)` for each accomplishment (drives leveling + sticker rewards) and `ctx.miss()` at most once per round when they
   struggled. Level 1 must be achievable by a 24-month-old.
8. **Idle help**: `ctx.idle(7000, () => { ctx.prompt(); glow the answer })`. Set the current instruction with `ctx.setPrompt(text)`.
9. **Keep the top-left ~100×100 px clear** (home button lives there). Pip (`ctx.mascot.show({corner:'bl'})`) is optional.
10. Joyful, bright, rounded, bouncy. Squash-and-stretch, wobble, pops, sparkles. Animate with CSS transforms/opacity or WAAPI;
    avoid layout thrash and heavy filters in animation loops. Keep < ~150 live animated DOM nodes.

## Registering
```js
(function () {
  'use strict';
  const PP = window.PP, U = PP.util;
  U.addStyles('balloons', `.g-balloons { background: linear-gradient(#8fd3ff, #e9f8ff); } .bp-balloon { ... }`);
  PP.registerGame({
    id: 'balloons',            // unique, lowercase
    title: 'Balloons',         // spoken + shown on the home tile (1–2 words)
    domain: 'colors',          // colors | numbers | words | shapes | music
    icon: '🎈',                // emoji (or an inline SVG string) for the home tile
    tileColor: '#FF6B6B',      // home tile color
    order: 10,                 // home-screen ordering (colors 10s, numbers 20s, words 30s, shapes 40s, music 50s)
    create(stage, ctx) {       // stage: full-screen div (position:absolute; inset:0; overflow:hidden; touch-action:none)
      ...build DOM into stage, start play...
      return { destroy() { /* optional extra cleanup */ } };
    },
  });
})();
```

Optional: `voiceLines() { return [...] }` on the definition lists data-driven sentences the game can say
(e.g. every "Three apples!" combination) so `tools/harvest.js` puts them in the natural voice pack.

## ctx cheat-sheet (see src/core/07-ctx.js)
| | |
|---|---|
| `ctx.say(text, {mode})` → Promise | speak (interrupt / queue / skip) |
| `ctx.sfx(name, {vel, delay, pan})` | pop tap click ding twinkle success tada whoosh swish boing sparkle magic oops bubble splash splat slideup slidedown creak applause drumroll chomp blastoff |
| `ctx.play(inst, note, {dur, vel, delay, at})` | marimba xylo bell piano pluck kalimba flute bass toy — note `'C4'`, midi, or `['C4','E4','G4']` |
| `ctx.drum(name, {vel, at, pitch})` | kick tom snare hat openhat shaker tamb clap cowbell woodblock cymbal triangle bongo |
| `ctx.sequence(events, {bpm, inst, onNote})` | play a melody: `[['C4',1],['D4',.5],{n:null,d:1}]`; returns `{stop, done, duration}` |
| `ctx.loop({bpm, steps, tracks:{kick:'x...x...', hat:'..x...x.'}, notes, onStep})` | look-ahead step sequencer; `{stop, setBpm, beatTime, beatDur}` |
| `ctx.rumble({vel})` | sustained rumble `{stop, setLevel, setCutoff}` |
| `ctx.audio.now()` | audio clock (seconds) |
| `ctx.celebrate({x, y, say, big, colors})` → Promise | confetti + sound + Pip cheer + praise (+ sticker reward if earned) |
| `ctx.success(firstTry)` / `ctx.miss()` | progress + adaptive level + stickers (`success(null)` = neutral: sticker progress only) |
| `ctx.level` | 1..5 |
| `ctx.setPrompt(t)` / `ctx.prompt()` | current instruction; tapping Pip repeats it |
| `ctx.idle(ms, fn)` / `ctx.poke()` | inactivity help |
| `ctx.tap(el, (e,{x,y}) => …)` | instant pointerdown tap |
| `ctx.drag(el, {onStart, onMove, onEnd})` | onEnd returns `'keep'` to stay, otherwise snaps back |
| `ctx.setTimeout / setInterval / raf(fn(dt)) / wait(ms) / on(el,type,fn)` | auto-cleaned |
| `ctx.onResize(fn({w,h}))`, `ctx.size()` | layout |
| `ctx.mascot.show({corner})`, `ctx.mascot.mood('cheer'|'happy'|'wiggle'|'surprise'|'think'|'wave')` | Pip |
| `ctx.el(tag, attrs, ...kids)`, `ctx.svg(...)`, `ctx.html(str)` | DOM helpers |
| `ctx.pick / shuffle / sample / rand / randInt / clamp` | random helpers |
| `PP.fx.confetti({x,y,count,colors})`, `PP.fx.burst(x,y,{emoji})`, `PP.fx.floatText(x,y,'3!',{color,size})`, `PP.fx.flyTo(el,target)`, `PP.fx.glow(el)` | effects |
| `PP.kit.findRound(ctx, {...})` | complete "find the X" round with errorless flow (see words-findit.js) |
| `PP.kit.emoji(ch)`, `PP.kit.card(content,{color})`, `PP.kit.nextButton(ctx, fn)`, `PP.kit.speakerButton(ctx)` | widgets |
| `PP.data.COLORS / colorsForLevel(l) / RAINBOW / COLOR_THINGS` | colors `{id,name,hex,dark,light}` |
| `PP.data.NUMBERS / numberMaxForLevel(l) / DOTS` | numbers |
| `PP.data.SHAPES / shapesForLevel(l) / shapeSVG(id, fill, opts)` | shapes |
| `PP.data.WORDS / wordsIn(cat) / word(id) / a(word) / says(word)` | vocabulary with emoji + animal/vehicle sounds |
| `PP.data.praise()` | random praise (sometimes with the child's name) |

CSS available: `.pp-emoji` (emoji font), keyframes `pp-popin pp-yay pp-wiggle pp-glow pp-pulse pp-bob pp-float`,
CSS vars `--safe-t/-r/-b/-l` (iOS safe areas). Font: rounded system font (`var(--font)`).

## Build & test loop (do this repeatedly)
```bash
cd /home/claude/pips-playroom
python3 tools/build.py --only <your-file-stems> --out /tmp/<agent>/index.html     # isolated build with just your games
node tools/smoke.js --file /tmp/<agent>/index.html --game <id> --out /tmp/<agent>/shots            # 4 viewports
node tools/smoke.js --file /tmp/<agent>/index.html --game <id> --vp ipad --taps 80 --seconds 15 --out /tmp/<agent>/shots
```
Then **look at the screenshots** with the Read tool (`/tmp/<agent>/shots/<id>-<viewport>-{1,2,3}.png`) and fix what looks off.
You can also write your own Playwright scripts (require('/opt/npm-tools/node_modules/playwright')) to drive specific flows, e.g.
tap the right answer via `page.evaluate`, check `PP.store.progress`, or capture mid-animation frames.
URL params: `?autostart=1&game=<id>` skips the start screen. `window.PP` is global for inspection.
Speech is silent in headless Chromium but promises still resolve (timer fallback), so flows run.
