// Regenerate after editing the shared SVG. Uses sharp; a bundled module path may be supplied.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.env.DARKWORLD_SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');
const mark = fs.readFileSync(path.join(root, 'public/darkworld-mark.svg'), 'utf8');
const badge = fs.readFileSync(path.join(root, 'public/darkworld-badge.svg'));
const innerMark = mark.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const icon = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0b1721"/><svg x="8" y="8" width="48" height="48" viewBox="0 0 64 64">' + innerMark + '</svg></svg>');
(async () => {
  for (const size of [16, 32]) {
    await sharp(Buffer.from(mark)).resize(size, size).png().toFile(path.join(root, 'public/icons/icon-' + size + '.png'));
  }
  for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
    await sharp(icon).resize(size, size).png().toFile(path.join(root, 'public/icons', name));
  }
  await sharp(badge).resize(960, 1080).png().toFile(path.join(root, 'public/darkworld-badge.png'));
  fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
  const background = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="680"><rect width="560" height="680" fill="#f1f5f3"/><rect x="560" width="560" height="680" fill="#0b1721"/><g font-family="Arial,sans-serif" font-size="15" letter-spacing="2"><text x="40" y="48" fill="#30524c">DARKWORLD · COMMUNITY CREST</text><text x="600" y="48" fill="#b2d9cc">TEAL / PLATINUM / IVORY</text></g></svg>');
  const large = await sharp(badge).resize(320, 360).png().toBuffer();
  const small = [];
  for (const panel of [0, 560]) {
    let x = panel + 154;
    for (const size of [24, 40, 64, 96]) {
      small.push({ input: await sharp(Buffer.from(mark)).resize(size, size).png().toBuffer(), left: x, top: 548 - Math.round(size / 2) });
      x += size + 12;
    }
  }
  await sharp(background).composite([{ input: large, left: 120, top: 100 }, { input: large, left: 680, top: 100 }, ...small]).png().toFile(path.join(root, 'tmp/darkworld-brand-preview.png'));
  console.log('Brand icons, transparent badge export and light/dark preview generated.');
})().catch(error => { console.error(error); process.exitCode = 1; });

