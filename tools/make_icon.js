// Renders the app icon (Pip on a sky tile) to PNGs with sharp.
const path = require('path');
const fs = require('fs');
const sharp = require(process.env.SHARP || '/opt/npm-tools/node_modules/sharp');
const out = path.resolve(__dirname, '..', 'src', 'assets');
fs.mkdirSync(out, { recursive: true });

const pip = `
  <g transform="translate(56 70) scale(2)">
    <ellipse cx="100" cy="200" rx="52" ry="7" fill="rgba(40,20,60,.18)"/>
    <ellipse cx="76" cy="186" rx="17" ry="9" fill="#EE7A2B"/>
    <ellipse cx="124" cy="186" rx="17" ry="9" fill="#EE7A2B"/>
    <ellipse cx="30" cy="104" rx="13" ry="20" fill="#FF9E40" transform="rotate(140 30 104)"/>
    <ellipse cx="170" cy="104" rx="13" ry="20" fill="#FF9E40" transform="rotate(-140 170 104)"/>
    <path d="M100 52 C 99 40, 100 30, 103 22" stroke="#38A04C" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M103 24 C 92 6, 66 10, 68 26 C 80 34, 96 32, 103 24 Z" fill="#5BC56A"/>
    <path d="M103 24 C 114 4, 142 8, 140 24 C 126 34, 110 32, 103 24 Z" fill="#7FDA86"/>
    <ellipse cx="100" cy="118" rx="70" ry="68" fill="url(#body)"/>
    <ellipse cx="100" cy="146" rx="42" ry="31" fill="#FFE9B8" opacity=".75"/>
    <ellipse cx="72" cy="78" rx="18" ry="10" fill="#fff" opacity=".35" transform="rotate(-25 72 78)"/>
    <ellipse cx="54" cy="128" rx="12" ry="7.5" fill="#FF6F86" opacity=".5"/>
    <ellipse cx="146" cy="128" rx="12" ry="7.5" fill="#FF6F86" opacity=".5"/>
    <ellipse cx="74" cy="104" rx="16" ry="19" fill="#fff"/>
    <circle cx="76" cy="107" r="10" fill="#2B2340"/><circle cx="80" cy="102" r="3.6" fill="#fff"/>
    <ellipse cx="126" cy="104" rx="16" ry="19" fill="#fff"/>
    <circle cx="128" cy="107" r="10" fill="#2B2340"/><circle cx="132" cy="102" r="3.6" fill="#fff"/>
    <path d="M84 132 Q100 162 116 132 Z" fill="#7A2B32" stroke="#5A2A1A" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="100" cy="146" rx="8" ry="4.5" fill="#FF8C9A"/>
  </g>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="body" cx="40%" cy="32%" r="72%"><stop offset="0" stop-color="#FFE38F"/><stop offset=".55" stop-color="#FFB547"/><stop offset="1" stop-color="#FF8A3D"/></radialGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FD0FF"/><stop offset="1" stop-color="#D4F1FF"/></linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#sky)"/>
  <circle cx="420" cy="90" r="46" fill="#FFE45C" opacity=".9"/>
  <path d="M0 430 Q 130 370 260 420 T 512 410 V512 H0 Z" fill="#8EDC83"/>
  <circle cx="70" cy="120" r="16" fill="#FF6FB5" opacity=".8"/>
  <circle cx="110" cy="70" r="10" fill="#4D96FF" opacity=".8"/>
  <circle cx="455" cy="230" r="13" fill="#3DBE4B" opacity=".8"/>
  ${pip}
</svg>`;

(async () => {
  const buf = Buffer.from(svg);
  for (const s of [512, 180, 64]) await sharp(buf).resize(s, s).png().toFile(path.join(out, `icon-${s}.png`));
  console.log('icons written to', out);
})();
