# Changelog

Every release is a git tag, so any earlier version can be restored or compared:

```bash
git tag -n                          # list releases
git diff v1.0 v1.1 -- src/          # what changed in the code
git checkout v1.0 -- docs/          # put an older build back on GitHub Pages (then commit + push)
```

## v1.1 — bug-fix pass (2026-11-05)

### App and engine
- **Challenge setting:** "Gentle" no longer quietly banks levels up to 5 behind the scenes. Before, switching back to Automatic jumped a game straight to its hardest level. "Big kid" now moves up from level 3 after three wins instead of needing six, and level-up/down events only fire when the level the child plays actually changes. The settings panel shows that level too.
- **Sticker reward:** if the child left a game (or the sleep screen came up) while a sticker was showing, its leftover timers closed whatever opened next, such as the sticker book or settings. Fixed. A sticker that's waiting now also keeps waiting while another overlay is open instead of being dropped.
- **Home screen:** tapping two tiles quickly opened the first game and then jumped to the second. Now only the first opens.
- **Settings:** the child's name is saved as it's typed (iOS doesn't always fire `change` before the panel closes). The last visible activity can't be hidden, so the home screen is never empty.
- **Natural voice:** if iOS leaves audio locked after a phone call, the lock screen or app switching, a line that can't play from the voice pack is now said with the device voice. Before, Pip went silent for up to ~10 seconds and the game waited.
- **Device voice** now follows the Volume setting.
- **Drum grooves and backing loops:** after a main-thread stall they skip ahead instead of firing every missed beat at once (a loud pile-up of drums).
- **Leaving a game:** melodies, loops and rumbles started from a late callback after the child left no longer keep playing. Finished melodies are released during long sessions.
- **"Find it" rounds** (Find It, Color Sort finds, Shapes hunt): an answer the child got by following Pip's idle glow no longer counts as a first-try success, so following the glow doesn't push the level up. It still never counts against them.
- **Grammar:** "Where are the socks?" and "Those are grapes." instead of "Where's the socks?" and "That's grapes." (Find It, Peekaboo, the shared find round, Color Sort).

### Games
- **Balloons:** the garland chime keeps climbing for all 10 balloons; it used to drop back down at the seventh. On notched iPhones in landscape, balloons stay clear of the home button.
- **Color Sort:** "That's a blue water drop." (the article was missing); "Those are red cherries."
- **Bubbles:** popping a leftover bubble during "How many fish?" no longer shouts a number over the counting.
- **Rocket:** on iPhone portrait the launch tower ran off the left edge of the screen. The landing squash now pivots on the rocket's feet.
- **Body Parts:** if the question is "Where is Bo's tummy?" and Bo's clapping hands are still in front of it, touching there counts as the tummy. Taps right after an answer no longer cut off Bo's praise. Answers given after the glow hint aren't first-try.
- **Animal Band:** taps before the mystery sound has played no longer count as wrong guesses. They used to add misses and could even lower the level.
- **Xylophone:** at levels 1–2 any tap plays the next note, so every finished song counted as a first-try success. A toddler mashing bars was pushed up to level 3 ("tap the glowing bar") after six songs. Now only a song played mostly on the glowing bars counts; otherwise it's neutral (sticker progress only).
- **Peekaboo:** finding the hidden friend after the door was lit up isn't a first-try success.

### Voice pack and tools
- `tools/make_clips.py` reuses clips from the pack already in `docs/voice/` when the voice, speed and bitrate match. A fresh checkout without `.voice-cache/` now only renders new lines, and the Kokoro model is only downloaded when something actually needs rendering. `--no-reuse` re-renders everything.
- **Voice coverage:** several lines the games really say had no clip in v1.0, so Pip switched to the robotic device voice for them. Examples: Xylophone's "Tap the red one!" / "The teal one!", Drums' "You're keeping the beat!", "You played Happy Birthday!", Bubbles' "That's three.", Body Parts' "Can you pat your tummy?" / "Just like Bo!", Count's "Count with me!", Balloons' "A purple balloon!". They're in the pack now.
- `tools/harvest.js`: no more ungrammatical generated lines ("Where's the socks?", "One apples!"). It no longer generalizes from lines a game already lists in `voiceLines()`, which used to produce junk like "Let's paint the airplane!". New `--no-play` option rebuilds `voice/lines.json` from `voice/played.json` without replaying every game.
- The voice pack was re-rendered with the new and changed lines (same voice `af_heart`, speed 0.92, name "friend").

## v1.0 — first full release (2026-10-02)
- 13 activities, grown-up settings, stickers, play timer, offline service worker.
- Kokoro natural voice pack (`af_heart`, speed 0.92): 3,305 lines, 15.3 MB.
