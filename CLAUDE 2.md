# Pip's Playroom — project memory for Claude Code

## What this is
- **Pip's Playroom** is a toddler learning web app built for Caleb's 2-year-old son.
- It runs in **Safari on iPad and iPhone** and is added to the Home Screen as a full-screen app.
- **Pip**, an original orange sprout character, guides 13 activities: colors, numbers, words, shapes and music.
- Built in October 2026 in a Claude (Cowork) session using orchestrated sub-agents.
- It's served from GitHub Pages out of **`/docs`**.

**Owner's hard requirements:** don't change these without asking.
- **No microphone input** and **no voice recordings by the parent**. Speech is device TTS or a Kokoro-rendered voice pack.
- **Original art only:** inline SVG, CSS or emoji, with no copyrighted characters. **Public-domain tunes only.**
- **Errorless, toddler-first design.** Every touch gets instant feedback, there are no fail states or timers that run out, targets are huge, speech is short, difficulty adapts, and the top-left ~100px is kept clear for the home button. Details are in `GAME_API.md`.
- **No external dependencies** at runtime. The optional voice pack and an optional Google Fonts fallback are the only extra loads.

**Working with Caleb:** he's an engineer who wants direct, economical updates without padding. He checks claims closely, so verify before saying something works, and say plainly what you didn't or couldn't test.

## Current status
- **Done:**
  - all 13 activities
  - parent settings
  - stickers
  - play timer
  - offline service worker
  - two QA passes, fixed
- **Tested:** only in headless Chromium at iPad and iPhone sizes, with no console errors and flat memory in soak runs. **Not yet verified on a real iPhone or iPad.**
- **Voice pack plumbing is finished and tested end-to-end with the test engine (beeps):**
  - the app player
  - the harvest
  - `make_clips.py`
  - service-worker caching
- **Kokoro itself has never been run.** The model couldn't be downloaded in the original sandbox.
- **Next task:** render the Kokoro voice pack into `docs/voice/` and ship it. See "Voice pack" below and `VOICE.md`.

## Layout
- **`src/core/*.js`** is the engine. Files load in file-name order, all on `window.PP`.
  - **`00-util`:** DOM helpers, `PP.bus`, `registerGame`.
  - **`01-audio`:** Web Audio synth: instruments, drums, sfx, `sequence`, `loop`, `rumble`, `voiceOut`.
  - **`02-speech`:** device TTS with interrupt, queue and skip modes. It tries the voice pack first.
  - **`02-voice`:** clip player. Splits utterances into sentences, matches clips, falls back to TTS and logs misses.
  - **`03-data`:** colors, numbers, dot patterns, shapes and their SVG, about 150 vocabulary words with emoji and animal or vehicle sounds, 60 stickers, praise.
  - **`04-store`:** settings and per-game progress in localStorage.
  - **`05-mascot`:** Pip, an SVG character with moods, blinking and a mouth that moves while speech plays.
  - **`06-fx`:** confetti canvas, bursts, float text, ripples, glow.
  - **`07-ctx`:** the per-game context. Its timers, listeners, loops and sequences clean themselves up when the child exits.
  - **`08-kit`:** `findRound`, which runs the errorless "Find the X!" flow, plus drag, next and speaker buttons.
  - **`09-app`:** start screen, home grid, game host, sticker reward and book, grown-up settings, play-timer sleep screen.
  - **`99-boot`:** boot code.
- **`src/games/<domain>-<name>.js`:** one activity per file. Read `GAME_API.md` and `src/games/words-findit.js` (the reference game) before editing.
- **`src/core.css`, `shell.html`, `body.html`, `sw.js`, `assets/`:** styles, page shell, service worker, icons.
- **`tools/`:** build, Playwright tests, voice pipeline, icon generation, screenshot contact sheets.
- **`voice/`:**
  - `lines.json`: every sentence to render, about 3.3k, plus `nameTemplates`.
  - `played.json`: raw sentences seen during auto-play, used by `--merge`.
  - `extra-lines.txt`: hand-added lines.
  - `lines-report.json`
- **`docs/`:** the **built site**: `index.html` (single self-contained file, about 790 KB), `sw.js`, `apple-touch-icon.png` and `voice/` once rendered. It's generated, so **never hand-edit `docs/index.html`**.

## Commands
```bash
python3 tools/build.py                        # src → docs/index.html + docs/sw.js (+ icon)
python3 tools/build.py --artifact             # build/artifact.html (claude.ai preview variant; owner republishes it from Cowork)
node tools/smoke.js --all                     # every game @ iPad + iPhone; screenshots → shots/
node tools/smoke.js --game paint --vp ipad,iphone,ipad-portrait,iphone-landscape
node tools/smoke.js --home                    # start + home screens, all 4 viewports
node tools/soak.js --seconds 40               # toddler-mashing soak: errors, DOM growth, speech text sanity
python3 tools/sheet.py out.png 4 400 shots/*.png   # contact sheet to eyeball many screenshots at once
node tools/harvest.js [--merge]               # regenerate voice/lines.json (~8 min; needs Playwright)
python3 tools/make_clips.py --voice af_heart --speed 0.92 --name <NAME>   # render voice pack → docs/voice/
python3 tools/make_clips.py --engine fake     # pipeline test without Kokoro (beeps)
```
- **Playwright:** the tools look for it via `PW`, `require('playwright')`, `/opt/npm-tools/...` and then the global npm root. If it's missing, run `npm i -g playwright && npx playwright install chromium`.
- **URL flags:**
  - `?autostart=1&game=<id>` skips the start screen.
  - `?nosw=1` disables the service worker.
  - `?ppdebug` exposes some game debug hooks.
- **The voice pack only loads over http(s),** not `file://`. To test it, serve `docs/` with `python3 -m http.server 8765 -d docs` and open `http://localhost:8765/?autostart=1&nosw=1`. Wait for `PP.voice.ready`.

## Mechanics worth knowing
- **Adaptive levels (1–5, per game):**
  - 3 first-try successes in a row move the game up a level.
  - 2 struggling rounds in a row move it down.
  - `ctx.success(true|false|null)`: `null` is neutral. It counts toward stickers but doesn't change the level, which suits rounds that can't be failed.
  - Settings → Challenge: *Gentle* caps the level at 2; *Big kid* sets the floor at 3.
- **Stickers:** one every 5 successes, from a pool of 60. The overlay waits for `ctx.celebrate()`. Games that set `stickersAtCelebrate: true` hold the overlay until their celebration.
- **Idle nudges:** `ctx.idle(ms, fn)` fires at most 3 times per quiet stretch, and a touch re-arms it. Speech and overlays count as activity, not idle time.
- **Home button:** tap-twice by default. The first tap arms it, so it grows and pulses. Settings can change this to one tap or press-and-hold.
- **Grown-up settings:** hold the gear for 1.6 s. Settings include:
  - name
  - voice mode and device voice
  - volume
  - background music (grooves and backing tracks only; tapped instruments always play)
  - challenge
  - home-button mode
  - play timer (10–45 min, ending with a lullaby sleep screen; hold the moon for 2 s to continue)
  - hide games
  - reset
  - copy missing voice lines
- **Storage:**
  - localStorage keys are `pips-playroom.v1` (settings and progress) and `pips-playroom.missing-lines`.
  - The service-worker caches are `pips-playroom-<buildhash>` (the page) and `pips-voice` (packs, kept across app updates).

## Voice pack (Kokoro)
- **Rendering:** `make_clips.py` uses `kokoro-onnx` (pip). On first run it downloads `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the GitHub releases of `thewh1teagle/kokoro-onnx` (tag `model-files-v1.0`, falling back to `-v1.1`) into `.kokoro/`. Default "Trusted" cloud network access is enough because PyPI and GitHub are on its allowlist. Encoding needs ffmpeg; `pip install imageio-ffmpeg` is the fallback.
- **Output:** `docs/voice/manifest.json` (`{voice, pack, gapMs, clips: {key: [byteOffset, byteLength, ms]}}`) plus `docs/voice/pack-<hash>.mp3pack`, which is every clip's MP3 concatenated. Expect roughly 12–18 MB for about 3.3k lines at 32 kbps mono. Rendered clips are cached in `.voice-cache/`, so re-runs only render what's new.
- **Runtime:** `PP.voice.split()` and `PP.voice.key()` must stay identical to `key_of()` in `make_clips.py`. Utterances are matched sentence by sentence. If any sentence is missing, the whole utterance falls back to device TTS, and the missing keys are logged for settings.
- **Coverage:** in random play with the beep pack, about 99% of distinct sentences had clips. Data-driven lines come from each game's `voiceLines()` (Count, Color Sort, Paint and Shapes have one); the rest come from auto-play harvesting plus vocabulary expansion. When you add speech to a game, add `voiceLines()` or re-run `harvest.js --merge`.
- **Voice choice:** default `af_heart` at speed 0.92. Alternatives are `af_bella`, `af_nicole`, `af_sarah`, `am_michael`, `bf_emma`; `--list-voices` shows all, and `--preview N` writes WAV samples to `voice/preview/`. **Commit:** `docs/voice/`, `voice/`. **Never commit:** `.kokoro/`, `.voice-cache/`, `voice/preview/` (all gitignored).

## iOS / Safari facts learned the hard way
- **Voices:** Safari only lets web pages use **pre-installed** voices. Enhanced or Premium voices downloaded in iOS Settings never appear in `speechSynthesis.getVoices()`; Apple calls this intended. That limitation is why the Kokoro pack exists. The best built-in voice is usually Samantha.
- **User gestures:** iOS only treats **touchend, pointerup or click** as a user gesture for unlocking audio and speech, not pointerdown. The start screen and the global re-unlock listen on all of these.
- **Audio session:** `navigator.audioSession.type = 'playback'` lets the iPhone play sound with the silent switch on.
- **Other guards in place:** pinch and double-tap zoom, long-press menus and rubber-band scrolling are all blocked. Recommend Guided Access to lock the device into the app.

## Activities
| id | file | what it does |
|---|---|---|
| balloons | colors-balloons.js | pop rising balloons, hear colors; Pip requests a color; specials and balloon party |
| paint | colors-paint.js | 8-picture coloring book; finished pictures animate; color suggestions from level 2 |
| colorsort | colors-sort.js | tap or drag toys into matching color boxes; "Find something yellow!" rounds |
| count | numbers-count.js | 6 counting scenes with a rising-pitch count and a recap with numeral and dots |
| bubbles | numbers-bubbles.js | pop numeral bubbles underwater; "How many fish?" from level 2 |
| rocket | numbers-rocket.js | countdown, blast-off, count stars in space, land on a planet with a friendly alien |
| findit | words-findit.js | receptive vocabulary, 2–6 picture choices (reference implementation) |
| peekaboo | words-peekaboo.js | open barn, garage, fridge, toybox and closet doors; memory question from level 3 |
| body | words-body.js | Bo, an original bear-like buddy: tap body parts; "Where's Bo's nose?" |
| shapes | shapes-sorter.js | shape sorter box: tap or drag shapes into holes; "Find the star!" rounds |
| xylophone | music-xylophone.js | 8-bar xylophone, 8 public-domain songs, magic mode where any tap plays the next note |
| drums | music-drums.js | 6 instruments, backing groove, steady-beat praise, turtle/rabbit tempo, copy-me from level 3 |
| concert | music-concert.js | Animal Band: high/low, loud/soft and fast/slow, with explore and "Who made that sound?" rounds |

## Known gaps / backlog
- **Real-device check pending:**
  - start-screen audio and speech unlock
  - Samantha fallback
  - voice pack loading and playback
  - Add to Home Screen icon (a data-URI `apple-touch-icon`, also shipped as `docs/apple-touch-icon.png`)
- **Xylophone:** at levels 1–2 any tap plays the next note, so every song counts as a first-try success and it climbs to level 3 ("tap the glowing bar") after 6 songs.
- **Peekaboo:** door rounds can't be failed, so they only raise the level up to 3. From level 3 on, only the memory question moves the level, so it can also come back down.
- **Older Safari:** Color Sort's hint arrow uses `aspect-ratio` (Safari 15+); Bubbles animates the `translate` property (Safari 14.1+). Fine on current iPadOS.
- **Device-voice timing:** Count's recap waits for each spoken number, so recaps with the device voice may feel slower on iOS.

## Rules of the road
1. After any change, run `python3 tools/build.py`, then `node tools/smoke.js --game <id>` for each game touched (all 4 viewports for layout work). **Look at the screenshots**, then commit `docs/` along with `src/`.
2. Use `ctx` helpers for all timers and listeners. Namespace CSS as `.g-<id>` with a short prefix. Don't edit core to suit one game without checking the others.
3. Keep spoken lines short (2–6 words). Wrong answers name what was tapped and re-prompt. After 2 misses, glow the right answer.
4. When changing what Pip says, update `voiceLines()` or re-harvest, then re-render the pack (only new lines get rendered).
