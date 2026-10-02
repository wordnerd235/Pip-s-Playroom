#!/usr/bin/env python3
"""Render every line Pip says with Kokoro (free, open-source TTS) into a voice pack the app plays.

Setup (once):
    pip install kokoro-onnx soundfile numpy          # ffmpeg must also be installed (apt-get install -y ffmpeg)

Use:
    python3 tools/make_clips.py --preview 12                 # audition a few voices/lines → voice/preview/*.wav
    python3 tools/make_clips.py --voice af_heart --speed 0.92  # render everything → docs/voice/
    python3 tools/make_clips.py --list-voices

Inputs:  voice/lines.json (from tools/harvest.js) + voice/extra-lines.txt (one line per row, optional)
Outputs: docs/voice/manifest.json + docs/voice/pack-<hash>.mp3pack (all clips concatenated; the app slices it)
Cache:   .voice-cache/ — re-runs only render new or changed lines.

The Kokoro model files (~330 MB) download from the kokoro-onnx GitHub releases into .kokoro/ on first run.
"""
import argparse, hashlib, json, os, random, subprocess, sys, time, urllib.request, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_FILES = ['kokoro-v1.0.onnx', 'voices-v1.0.bin']
RELEASE_TAGS = ['model-files-v1.0', 'model-files-v1.1']
GH = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/{tag}/{name}'


def log(*a):
    print(*a, flush=True)


def download_models(model_dir):
    os.makedirs(model_dir, exist_ok=True)
    for name in MODEL_FILES:
        dest = os.path.join(model_dir, name)
        if os.path.exists(dest) and os.path.getsize(dest) > 1_000_000:
            continue
        last_err = None
        for tag in RELEASE_TAGS:
            url = GH.format(tag=tag, name=name)
            try:
                log(f'downloading {url}')
                tmp = dest + '.part'
                with urllib.request.urlopen(url) as r, open(tmp, 'wb') as f:
                    total = int(r.headers.get('Content-Length') or 0)
                    got = 0
                    while True:
                        chunk = r.read(1 << 20)
                        if not chunk:
                            break
                        f.write(chunk)
                        got += len(chunk)
                        if total:
                            sys.stdout.write(f'\r  {got / 1e6:.0f} / {total / 1e6:.0f} MB')
                            sys.stdout.flush()
                os.replace(tmp, dest)
                log('')
                break
            except Exception as e:  # try the next release tag
                last_err = e
        else:
            sys.exit(f'Could not download {name}: {last_err}\n'
                     f'Download it manually from https://github.com/thewh1teagle/kokoro-onnx/releases into {model_dir}/')


class KokoroEngine:
    def __init__(self, model_dir, voice, speed, lang):
        try:
            from kokoro_onnx import Kokoro
        except ImportError:
            sys.exit('kokoro-onnx is not installed. Run: pip install kokoro-onnx soundfile numpy')
        download_models(model_dir)
        self.k = Kokoro(os.path.join(model_dir, MODEL_FILES[0]), os.path.join(model_dir, MODEL_FILES[1]))
        self.voice, self.speed, self.lang = voice, speed, lang

    def voices(self):
        try:
            return sorted(self.k.get_voices())
        except Exception:
            return []

    def render(self, text, voice=None):
        samples, sr = self.k.create(text, voice=voice or self.voice, speed=self.speed, lang=self.lang)
        return samples, sr


class FakeEngine:
    """Test engine: a soft 'bloop' whose length matches the text. Lets the pipeline run without the model."""
    def __init__(self, *a):
        import numpy as np
        self.np = np

    def voices(self):
        return ['fake']

    def render(self, text, voice=None):
        np = self.np
        sr = 24000
        dur = 0.25 + 0.055 * len(text)
        t = np.arange(int(sr * dur)) / sr
        f = 220 + 80 * np.sin(2 * np.pi * 3 * t)
        y = 0.3 * np.sin(2 * np.pi * np.cumsum(f) / sr) * np.minimum(1, np.minimum(t * 20, (dur - t) * 20))
        return y.astype('float32'), sr


def process(samples, sr, np):
    """Trim silence, normalize loudness, add a tiny pad."""
    y = np.asarray(samples, dtype='float32').flatten()
    if y.size == 0:
        return y
    thr = max(0.008, float(np.max(np.abs(y))) * 0.02)
    idx = np.where(np.abs(y) > thr)[0]
    if idx.size:
        a = max(0, idx[0] - int(0.02 * sr))
        b = min(y.size, idx[-1] + int(0.06 * sr))
        y = y[a:b]
    rms = float(np.sqrt(np.mean(y ** 2))) or 1e-6
    y = y * min(0.12 / rms, 0.95 / (float(np.max(np.abs(y))) or 1e-6))  # ~-18 dBFS RMS, peaks ≤ -0.5 dB
    pad = np.zeros(int(0.015 * sr), dtype='float32')
    return np.concatenate([pad, y, pad])


def find_ffmpeg():
    exe = shutil.which('ffmpeg')
    if exe:
        return exe
    try:  # pip install imageio-ffmpeg ships a static ffmpeg binary
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


FFMPEG = None


def encode_mp3(y, sr, bitrate):
    p = subprocess.run(
        [FFMPEG, '-v', 'error', '-f', 'f32le', '-ar', str(sr), '-ac', '1', '-i', 'pipe:0',
         '-ac', '1', '-ar', '24000', '-codec:a', 'libmp3lame', '-b:a', bitrate, '-f', 'mp3', 'pipe:1'],
        input=y.astype('float32').tobytes(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if p.returncode != 0:
        sys.exit('ffmpeg failed: ' + p.stderr.decode()[:400] + '\nInstall it with: apt-get install -y ffmpeg')
    return p.stdout


def key_of(text):
    """Must match PP.voice.key() in src/core/02-voice.js."""
    import re
    t = re.sub('[‘’ʼ]', "'", text)
    t = re.sub('[“”]', '"', t)
    t = t.replace('...', '…')
    t = re.sub(r'\s+', ' ', t).strip()
    return t.lower()


def load_lines(lines_path, extra_path, name=''):
    lines = []
    seen = set()
    if os.path.exists(lines_path):
        data = json.load(open(lines_path, encoding='utf-8'))
        for l in data['lines']:
            if l['key'] not in seen:
                seen.add(l['key'])
                lines.append(l['text'])
        if name:
            for t in data.get('nameTemplates', []):
                s = t.replace('{name}', name)
                if key_of(s) not in seen:
                    seen.add(key_of(s))
                    lines.append(s)
    if os.path.exists(extra_path):
        import re
        for raw in open(extra_path, encoding='utf-8'):
            raw = raw.strip()
            if not raw or raw.startswith('#'):
                continue
            # split extra lines into sentences the same way the app does
            for s in re.findall(r'[^.!?…]+(?:[.!?…]+|$)', raw):
                s = s.strip()
                if s and key_of(s) not in seen:
                    seen.add(key_of(s))
                    lines.append(s)
    return lines


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--voice', default='af_heart', help='Kokoro voice id (af_heart, af_bella, af_nicole, af_sarah, am_michael, bf_emma, …)')
    ap.add_argument('--speed', type=float, default=0.92, help='speaking speed (1.0 = normal; slightly slower is better for toddlers)')
    ap.add_argument('--lang', default='en-us')
    ap.add_argument('--bitrate', default='32k')
    ap.add_argument('--gap-ms', type=int, default=130, help='pause the app inserts between sentences')
    ap.add_argument('--lines', default=os.path.join(ROOT, 'voice', 'lines.json'))
    ap.add_argument('--extra', default=os.path.join(ROOT, 'voice', 'extra-lines.txt'))
    ap.add_argument('--out', default=os.path.join(ROOT, 'docs', 'voice'))
    ap.add_argument('--cache', default=os.path.join(ROOT, '.voice-cache'))
    ap.add_argument('--model-dir', default=os.path.join(ROOT, '.kokoro'))
    ap.add_argument('--engine', default='kokoro', choices=['kokoro', 'fake'])
    ap.add_argument('--limit', type=int, default=0, help='only render the first N lines (testing)')
    ap.add_argument('--preview', type=int, default=0, help='render N sample lines in several voices to voice/preview/ and stop')
    ap.add_argument('--preview-voices', default='af_heart,af_bella,af_nicole,af_sarah,am_michael,bf_emma')
    ap.add_argument('--list-voices', action='store_true')
    ap.add_argument('--name', default='', help="child's name, so Pip can cheer 'Great job, NAME!' (must match the name typed in Pip's settings)")
    a = ap.parse_args()

    import numpy as np
    global FFMPEG
    FFMPEG = find_ffmpeg()
    if not FFMPEG and not a.list_voices:
        sys.exit('ffmpeg is required: apt-get install -y ffmpeg  (or: pip install imageio-ffmpeg)')
    eng = (KokoroEngine if a.engine == 'kokoro' else FakeEngine)(a.model_dir, a.voice, a.speed, a.lang)
    if a.list_voices:
        log('\n'.join(eng.voices()))
        return

    lines = load_lines(a.lines, a.extra, a.name.strip())
    if not lines:
        sys.exit(f'No lines found. Run: node tools/harvest.js   (expected {a.lines})')
    if a.limit:
        lines = lines[:a.limit]

    if a.preview:
        import soundfile as sf
        pdir = os.path.join(ROOT, 'voice', 'preview')
        os.makedirs(pdir, exist_ok=True)
        sample = random.Random(7).sample(lines, min(a.preview, len(lines)))
        sample = ["Hi! I'm Pip! Let's play!", 'Can you pop a red balloon?', 'Peekaboo! A cow! The cow says moo!'] + sample
        for v in a.preview_voices.split(','):
            text = ' '.join(sample[:6])
            y, sr = eng.render(text, voice=v)
            sf.write(os.path.join(pdir, f'{v}.wav'), y, sr)
            log(f'  voice/preview/{v}.wav')
        log('Listen to these, pick a voice, then run without --preview.')
        return

    os.makedirs(a.cache, exist_ok=True)
    os.makedirs(a.out, exist_ok=True)
    tag = f'{a.engine}|{a.voice}|{a.speed}|{a.lang}|{a.bitrate}|v2'
    clips = {}
    blobs = []
    offset = 0
    t0 = time.time()
    rendered = 0
    for i, text in enumerate(lines):
        h = hashlib.sha1((tag + '|' + text).encode()).hexdigest()
        mp3_path = os.path.join(a.cache, h + '.mp3')
        meta_path = os.path.join(a.cache, h + '.json')
        if not (os.path.exists(mp3_path) and os.path.exists(meta_path)):
            y, sr = eng.render(text)
            y = process(y, sr, np)
            data = encode_mp3(y, sr, a.bitrate)
            with open(mp3_path, 'wb') as f:
                f.write(data)
            json.dump({'ms': round(len(y) / sr * 1000), 'text': text}, open(meta_path, 'w'))
            rendered += 1
        data = open(mp3_path, 'rb').read()
        ms = json.load(open(meta_path))['ms']
        clips[key_of(text)] = [offset, len(data), ms]
        blobs.append(data)
        offset += len(data)
        tty = sys.stdout.isatty()
        if (tty and (i + 1) % 25 == 0) or (not tty and (i + 1) % 250 == 0) or i + 1 == len(lines):
            el = time.time() - t0
            eta = (el / max(1, rendered)) * (len(lines) - i - 1) if rendered else 0
            sys.stdout.write(('\r' if tty else '') + f'  {i + 1}/{len(lines)} lines  ({rendered} rendered, {el:.0f}s, ~{eta:.0f}s left)   ' + ('' if tty else '\n'))
            sys.stdout.flush()
    log('')

    pack = b''.join(blobs)
    ph = hashlib.sha1(pack).hexdigest()[:10]
    pack_name = f'pack-{ph}.mp3pack'
    for f in os.listdir(a.out):
        if f.startswith('pack-') and f.endswith('.mp3pack') and f != pack_name:
            os.remove(os.path.join(a.out, f))
    with open(os.path.join(a.out, pack_name), 'wb') as f:
        f.write(pack)
    manifest = {'version': 1, 'voice': a.voice if a.engine == 'kokoro' else 'test tones', 'engine': a.engine,
                'speed': a.speed, 'gapMs': a.gap_ms, 'pack': pack_name, 'count': len(clips), 'clips': clips}
    with open(os.path.join(a.out, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, separators=(',', ':'))
    total_ms = sum(c[2] for c in clips.values())
    log(f'voice pack: {len(clips)} clips, {total_ms / 60000:.1f} min of speech, {len(pack) / 1e6:.1f} MB → {os.path.relpath(a.out, ROOT)}/{pack_name}')


if __name__ == '__main__':
    main()
