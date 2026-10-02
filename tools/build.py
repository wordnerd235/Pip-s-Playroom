#!/usr/bin/env python3
"""Build Pip's Playroom into a single self-contained HTML file.

usage:
  python3 tools/build.py                       -> docs/index.html (all games; docs/ is the GitHub Pages site)
  python3 tools/build.py --out /tmp/x.html --only balloons,paint
                                               -> only games whose file stem contains one of the names
  python3 tools/build.py --artifact            -> build/artifact.html (body fragment, no <head>, for claude.ai Artifact)

Each JS file goes in its own <script> tag, so a syntax error in one game cannot break the others.
Game files whose name starts with "_" are skipped.
"""
import argparse, base64, json, os, re, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def b64(path, mime):
    if not os.path.exists(path):
        return ''
    with open(path, 'rb') as f:
        return f'data:{mime};base64,' + base64.b64encode(f.read()).decode()


def script(name, code):
    code = code.replace('</script', '<\\/script')
    return f'<script data-src="{name}">\n{code}\n</script>'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out')
    ap.add_argument('--only', help='comma-separated substrings of game file names to include')
    ap.add_argument('--artifact', action='store_true')
    a = ap.parse_args()

    core = sorted(glob.glob(os.path.join(SRC, 'core', '*.js')))
    boot = [p for p in core if os.path.basename(p).startswith('99')]
    core = [p for p in core if p not in boot]
    games = sorted(p for p in glob.glob(os.path.join(SRC, 'games', '*.js')) if not os.path.basename(p).startswith('_'))
    if a.only:
        keys = [k.strip() for k in a.only.split(',') if k.strip()]
        games = [g for g in games if any(k in os.path.basename(g) for k in keys)]

    css = read(os.path.join(SRC, 'core.css'))
    # optional per-game css files (games/*.css)
    for c in sorted(glob.glob(os.path.join(SRC, 'games', '*.css'))):
        css += '\n/* ---- ' + os.path.basename(c) + ' ---- */\n' + read(c)

    scripts = '\n'.join(script(os.path.relpath(p, SRC), read(p)) for p in core + games + boot)
    body = read(os.path.join(SRC, 'body.html')) + '\n' + scripts

    icon = b64(os.path.join(SRC, 'assets', 'icon-180.png'), 'image/png')
    fav = b64(os.path.join(SRC, 'assets', 'icon-64.png'), 'image/png')
    manifest = {
        'name': "Pip's Playroom", 'short_name': 'Pip', 'display': 'fullscreen', 'orientation': 'any',
        'background_color': '#8ED6FF', 'theme_color': '#8ED6FF', 'start_url': '.',
        'icons': [{'src': b64(os.path.join(SRC, 'assets', 'icon-512.png'), 'image/png'), 'sizes': '512x512', 'type': 'image/png'}],
    }
    manifest_uri = 'data:application/manifest+json;charset=utf-8,' + json.dumps(manifest).replace('#', '%23')

    if a.artifact:
        html = (
            '<title>Pip\'s Playroom</title>\n'
            '<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet">\n'
            f'<style>\n{css}\n</style>\n{body}\n'
        )
        out = a.out or os.path.join(ROOT, 'build', 'artifact.html')
    else:
        shell = read(os.path.join(SRC, 'shell.html'))
        html = (shell.replace('{{CSS}}', css).replace('{{BODY}}', body)
                .replace('{{ICON}}', icon).replace('{{FAVICON}}', fav).replace('{{MANIFEST}}', manifest_uri))
        out = a.out or os.path.join(ROOT, 'docs', 'index.html')

    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)
    if not a.artifact and not a.out:
        import hashlib
        ver = hashlib.sha1(html.encode()).hexdigest()[:10]
        with open(os.path.join(ROOT, 'docs', 'sw.js'), 'w') as f:
            f.write(read(os.path.join(SRC, 'sw.js')).replace('{{VERSION}}', ver))
        import shutil
        shutil.copy(os.path.join(SRC, 'assets', 'icon-180.png'), os.path.join(ROOT, 'docs', 'apple-touch-icon.png'))
    print(f'built {out}  ({len(html)/1024:.0f} KB, {len(games)} game files: {", ".join(os.path.basename(g) for g in games)})')


if __name__ == '__main__':
    main()
