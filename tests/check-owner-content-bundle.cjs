// Fails when owner-only content (machine learning, C# & .NET, software engineering) is present in the
// built app. That content is served only from the private owner-content bucket; run after `vite build`.
require('../scripts/register-typescript.cjs');
for (const extension of ['.css', '.jpg', '.png', '.svg']) require.extensions[extension] = module => { module.exports = ''; };
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const dist = path.join(__dirname, '../dist');
assert.ok(fs.existsSync(dist), 'Build the app first (npm run build).');
const built = [];
const walk = dir => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) walk(full); else if (/\.(js|mjs|html|json)$/.test(entry.name)) built.push(fs.readFileSync(full, 'utf8')); } };
walk(dist);
const text = built.join('\n');

/** A distinctive, escape-free run of words from a field, so it matches however the bundler quotes it. */
function sentinel(value) {
  const runs = String(value ?? '').match(/[A-Za-z][A-Za-z0-9 ,]{44,}/g) ?? [];
  const run = runs.sort((a, b) => b.length - a.length)[0];
  return run && run.slice(0, 44);
}

const { SE_MODULE_SOURCES } = require('../src/features/curriculum/data/softwareEngineeringCurriculum.ts');
const { DN_MODULE_SOURCES } = require('../src/features/curriculum/data/dotnetCurriculum.ts');
const { CSHARP_TASKS } = require('../src/features/code-practice/tasks/csharpTasks/index.ts');
const { ML_TASKS } = require('../src/features/code-practice/tasks/mlTasks/index.ts');
const { SE_TASKS } = require('../src/features/code-practice/tasks/pythonTasks/softwareEngineering/index.ts');
const { ML_LESSONS } = require('../src/features/curriculum/data/mlLessons/index.ts');

const samples = [
  ...[...SE_MODULE_SOURCES, ...DN_MODULE_SOURCES].flatMap(({ lessons }) => lessons.map(lesson => ['lesson ' + lesson.id, lesson.introduction])),
  ...[...CSHARP_TASKS, ...ML_TASKS, ...SE_TASKS].map(task => ['task ' + task.id, task.prompt]),
  ...ML_LESSONS.map(lesson => ['ML lesson ' + lesson.id, JSON.stringify(lesson.sections)]),
];
let checked = 0;
const leaks = [];
for (const [label, value] of samples) {
  const needle = sentinel(value);
  if (!needle) continue;
  checked++;
  if (text.includes(needle)) leaks.push(`${label}: "${needle}"`);
}
assert.ok(checked > 300, `Too few owner-only samples to check (${checked}).`);
assert.deepEqual(leaks.slice(0, 10), [], `Owner-only content found in the built app (${leaks.length} items).`);
console.log(`Owner content bundle check passed: ${checked} owner-only lessons and tasks are absent from the built app.`);
