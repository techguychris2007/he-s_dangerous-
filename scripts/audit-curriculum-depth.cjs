require('./register-typescript.cjs');
const assert = require('node:assert/strict');
for (const extension of ['.css', '.jpg', '.png', '.svg']) require.extensions[extension] = module => { module.exports = ''; };
const { MODULES, ROADMAP } = require('../src/data/curriculum.ts');
const { labsForLesson } = require('../src/data/lessonLabs.ts');

const tracksBySlug = new Map(ROADMAP.filter(stage => stage.moduleSlug).map(stage => [stage.moduleSlug, stage.track]));
const warnings = [];
const hardFailures = [];

for (const mod of MODULES) {
  const track = tracksBySlug.get(mod.slug) ?? 'unknown';
  if (mod.status !== 'available') continue;
  if (mod.lessons.length < 3) hardFailures.push(`${mod.id}: fewer than 3 lessons`);
  if (mod.description.split(/\s+/).length < 10) warnings.push(`${mod.id}: short module description`);
  const totalMinutes = mod.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  if (totalMinutes < 30) warnings.push(`${mod.id}: less than 30 minutes of guided reading`);
  const uniqueLabs = new Set(mod.lessons.flatMap(lesson => labsForLesson(lesson.id)));
  const labExpected = !['programming', 'ml'].includes(track);
  if (labExpected && uniqueLabs.size === 0) warnings.push(`${mod.id}: no linked practice labs`);
  const quizLessons = mod.lessons.filter(lesson => lesson.quiz?.length).length;
  if (quizLessons === 0 && !['programming', 'ml'].includes(track)) warnings.push(`${mod.id}: no knowledge checks`);
  for (const lesson of mod.lessons) {
    if (!lesson.title || lesson.title.length < 8) hardFailures.push(`${mod.id}/${lesson.id}: weak lesson title`);
    if (!lesson.summary || lesson.summary.split(/\s+/).length < 7) warnings.push(`${mod.id}/${lesson.id}: summary may be too thin for beginners`);
    if (lesson.minutes < 8) warnings.push(`${mod.id}/${lesson.id}: very short study estimate`);
  }
}

assert.equal(hardFailures.length, 0, hardFailures.join('\n'));
console.log(JSON.stringify({ modules: MODULES.length, warnings: warnings.length, sampleWarnings: warnings.slice(0, 12) }, null, 2));
