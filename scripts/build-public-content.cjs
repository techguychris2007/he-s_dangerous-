// Run by the production build (vite.config.ts, plugin "darkworld-paid-content"). Writes what the
// public bundle needs instead of paid content:
//   labs        the lab catalogue with Pro/Max labs reduced to stubs (scripts/paid-content.cjs)
//   lessonIds   paid lesson ids, whose quiz, questions and data bodies the build strips
//   lessonFiles source files that hold only paid lesson bodies, which the build replaces
//
//   node scripts/build-public-content.cjs <out.json>
const fs = require('node:fs');
const path = require('node:path');
const { load, publicLabEntries, paidLessonFiles } = require('./paid-content.cjs');

(async () => {
  const out = process.argv[2];
  if (!out) throw new Error('usage: build-public-content.cjs <out.json>');
  const { paidLessons } = load();
  const result = { labs: publicLabEntries(), lessonIds: [...paidLessons.keys()], lessonFiles: await paidLessonFiles() };
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(result));
})().catch(error => { console.error(error); process.exit(1); });
