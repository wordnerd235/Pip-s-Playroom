# Pip's natural voice (Kokoro)

Safari on iPhone and iPad only lets web pages use the built-in voices (mostly Samantha). This pipeline gives Pip a natural voice instead. **Kokoro**, a free open-source text-to-speech model, renders every sentence Pip says ahead of time. The app then plays those clips and falls back to the device voice for any sentence it doesn't have.

## How it fits together
1. `voice/lines.json` holds every sentence the app can say, about 2,000 of them, already generated. `node tools/harvest.js` regenerates it by auto-playing every game at every level. It then expands each sentence slot across the app's vocabulary: colors, numbers, shapes and words.
2. `python3 tools/make_clips.py` renders each line with Kokoro. It trims and levels each clip, encodes it as MP3, and writes two files:
   - `docs/voice/manifest.json`
   - `docs/voice/pack-<hash>.mp3pack`, all the clips in one file, roughly 8–12 MB.
3. When the app runs, it loads the pack in the background. Each utterance is split into sentences ("That's a cat. Find the dog!" → two clips), and the matching clips play back to back. If any sentence has no clip, the whole line uses the device voice, so one line never mixes two voices. That sentence is also logged.
4. To find and fix gaps, open Pip's grown-up settings (hold the gear) → **Copy missing lines**. Paste the list into `voice/extra-lines.txt` and run `make_clips.py` again. Only new lines get rendered, because `.voice-cache/` keeps the rest.

The offline service worker caches the pack, so the voice still works without internet after the first load.

## Run it in a Claude Code cloud session
The default **Trusted** network access is enough: PyPI and GitHub are both on its allowlist, and the model files download from the kokoro-onnx GitHub releases. You only need **Custom** (adding `huggingface.co`) if you switch to HuggingFace-hosted models.

Paste this prompt into Claude Code, opened on this repo:

> Read CLAUDE.md and VOICE.md, then give Pip the Kokoro voice:
> 1. `python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements-voice.txt` (if `ffmpeg` isn't installed, `pip install imageio-ffmpeg` provides one).
> 2. Run `python3 tools/make_clips.py --preview 6` and tell me which preview files were written.
> 3. Render the full pack: `python3 tools/make_clips.py --voice af_heart --speed 0.92 --name <MY SON'S NAME>`.
> 4. Run `python3 tools/build.py`. Check that `docs/voice/manifest.json` exists and the pack is under ~20 MB.
> 5. Commit `docs/` and `voice/` (not `.kokoro/` or `.voice-cache/`) and push.

Rendering about 2,000 lines on the cloud VM's CPU should take roughly 10–30 minutes. If a command times out, re-run it: the cache keeps what's already done.

## Picking a voice
`--preview` writes `voice/preview/<voice>.wav` for several voices. In a cloud session you can't listen to those files directly. Either download them from the session, or just start with `af_heart`, Kokoro's highest-rated voice: warm, clear and American.
- **Other US voices:** `af_bella`, `af_nicole`, `af_sarah`, `am_michael`.
- **UK voices:** `bf_emma`, `bm_george`.
- **Full list:** `python3 tools/make_clips.py --list-voices`.

## Changing the voice later
Re-run `make_clips.py` with a different `--voice` or `--speed`, then commit `docs/voice/`. The app picks up the new pack the next time it opens online. To turn the natural voice off without deleting anything, use Pip's settings → **Pip's voice** → *Device voice*.

## The child's name
The app already speaks name lines like "Great job, NAME!" and "Hi NAME!" through the device voice. To have them in Pip's natural voice, pass `--name` to `make_clips.py`, spelled exactly as it's typed in Pip's settings. Without it, those few lines fall back to the device voice.
