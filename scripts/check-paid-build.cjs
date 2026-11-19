// Proves the production build does not contain Pro or Max content: no flag from a paid lab and no
// passage from a paid lesson may appear in any built file. Run after `vite build`:
//   node scripts/check-paid-build.cjs [dist]
const fs = require('node:fs');
const path = require('node:path');
const { leakProbes, load } = require('./paid-content.cjs');

(async () => {
  const dist = path.resolve(process.argv[2] ?? 'dist');
  if (!fs.existsSync(dist)) throw new Error(`${dist} does not exist; run the build first.`);
  const marker = path.join(dist, 'paid-content-build.json');
  if (!fs.existsSync(marker)) throw new Error(`${marker} is missing; was this built with vite.config.ts?`);
  if (!JSON.parse(fs.readFileSync(marker, 'utf8')).paidPlans) {
    console.log('Paid plans are off (VITE_PAID_PLANS is not "on"): every lesson and lab is free and intentionally in the build.');
    return;
  }
  const chunks = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (!['books', 'csharp-runtime', 'ts-runtime'].includes(entry.name)) walk(full); }
      else if (/\.(js|mjs|html|json|webmanifest|css)$/.test(entry.name)) chunks.push(fs.readFileSync(full, 'utf8'));
    }
  };
  walk(dist);
  const text = chunks.join('\n');
  const { flags, lessonText } = await leakProbes();
  // One pass each instead of one search per probe: the built files are tens of megabytes.
  const leaks = [];
  const builtFlags = new Set(text.match(/flag\{[^}"\\]{6,}\}/g) ?? []);
  for (const flag of flags) if (builtFlags.has(flag)) leaks.push(`lab flag ${flag}`);
  const owner = new Map();
  for (const [id, probes] of lessonText) for (const probe of probes) owner.set(probe, id);
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = owner.size ? new RegExp([...owner.keys()].map(escape).join('|'), 'g') : null;
  const leakedLessons = new Map();
  for (const match of pattern ? text.matchAll(pattern) : []) if (!leakedLessons.has(owner.get(match[0]))) leakedLessons.set(owner.get(match[0]), match[0]);
  for (const [id, probe] of leakedLessons) leaks.push(`lesson ${id}: "${probe}"`);
  const { paidLabs, paidLessons } = load();
  if (leaks.length) {
    console.error(`Paid content found in ${dist}:\n  ${leaks.slice(0, 40).join('\n  ')}${leaks.length > 40 ? `\n  …and ${leaks.length - 40} more` : ''}`);
    process.exit(1);
  }
  console.log(`Paid content check passed: none of ${flags.length} flags from ${paidLabs.size} paid labs, and no text from ${paidLessons.size} paid lessons, is in ${dist}.`);
})().catch(error => { console.error(error); process.exit(1); });
