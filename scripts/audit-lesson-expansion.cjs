require('./register-typescript.cjs');
require.extensions['.css'] = () => null;
require.extensions['.jpg'] = () => null;
require.extensions['.png'] = () => null;
require.extensions['.svg'] = () => null;

const fs = require('fs');
const path = require('path');
const { MODULES } = require('../src/data/curriculum.ts');

const root = path.resolve(__dirname, '..');
const curriculumArticle = fs.readFileSync(path.join(root, 'src/content/CurriculumArticle.tsx'), 'utf8');
const moduleEnrichment = fs.readFileSync(path.join(root, 'src/data/moduleEnrichment.tsx'), 'utf8');

const requiredArticlePhrases = [
  'Senior educator notes',
  'Beginner-to-practitioner ladder',
  'How to reason professionally',
  'Evidence standard',
  'Mistakes that slow beginners down',
];

const requiredModulePhrases = [
  'Professional mastery layer',
  'What a learner should understand after',
  'Practice progression',
  'Professional habits',
  'resolveMastery',
];

const missingArticlePhrases = requiredArticlePhrases.filter(phrase => !curriculumArticle.includes(phrase));
const missingModulePhrases = requiredModulePhrases.filter(phrase => !moduleEnrichment.includes(phrase));

const thinLessons = [];
for (const module of MODULES) {
  for (const lesson of module.lessons) {
    const objectiveCount = lesson.objectives?.length ?? 0;
    const summaryWords = (lesson.summary ?? '').trim().split(/\s+/).filter(Boolean).length;
    if (objectiveCount < 2 || summaryWords < 6) {
      thinLessons.push({ module: module.id, lesson: lesson.id, title: lesson.title, objectiveCount, summaryWords });
    }
  }
}

const report = {
  modules: MODULES.length,
  lessons: MODULES.reduce((total, module) => total + module.lessons.length, 0),
  missingArticlePhrases,
  missingModulePhrases,
  thinLessons: thinLessons.length,
  sampleThinLessons: thinLessons.slice(0, 10),
};

console.log(JSON.stringify(report, null, 2));

if (missingArticlePhrases.length || missingModulePhrases.length || thinLessons.length) {
  process.exitCode = 1;
}
