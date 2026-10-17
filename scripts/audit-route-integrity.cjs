require('./register-typescript.cjs');
require.extensions['.css'] = () => null;
require.extensions['.jpg'] = () => null;
require.extensions['.png'] = () => null;
require.extensions['.svg'] = () => null;

const { MODULES } = require('../src/data/curriculum.ts');
const { LABS, findLab } = require('../src/data/labs.ts');
const { LESSON_LABS } = require('../src/data/lessonLabs.ts');
const { SIEM_LABS } = require('../src/labs/siemScenarios.ts');
const { PYTHON_TASKS } = require('../src/labs/pythonTasks/index.ts');

const duplicateKeys = [];
const scenarioIds = new Set();
const slugs = new Set();
for (const lab of LABS) {
  if (scenarioIds.has(lab.scenario.id)) duplicateKeys.push({ kind: 'scenarioId', value: lab.scenario.id });
  scenarioIds.add(lab.scenario.id);
  if (slugs.has(lab.slug)) duplicateKeys.push({ kind: 'slug', value: lab.slug });
  slugs.add(lab.slug);
}

const lessonIds = new Set(MODULES.flatMap(module => module.lessons.map(lesson => lesson.id)));
const badLessonIds = [];
const badLabLinks = [];
const siemIds = new Set(SIEM_LABS.map(lab => lab.id));
const codeTaskIds = new Set(PYTHON_TASKS.map(task => task.id));
for (const [lessonId, labSlugs] of Object.entries(LESSON_LABS)) {
  if (!lessonIds.has(lessonId)) badLessonIds.push(lessonId);
  for (const slug of labSlugs) {
    const resolvable = findLab(slug) || siemIds.has(slug) || codeTaskIds.has(slug);
    if (!resolvable) badLabLinks.push({ lessonId, slug });
  }
}

const lessonsWithLabs = Object.entries(LESSON_LABS).filter(([lessonId, labs]) => lessonIds.has(lessonId) && labs.length > 0).length;
const report = {
  modules: MODULES.length,
  lessons: lessonIds.size,
  labs: LABS.length,
  lessonsWithLabs,
  duplicateKeys,
  badLessonIds,
  badLabLinks,
};

console.log(JSON.stringify(report, null, 2));
if (duplicateKeys.length || badLessonIds.length || badLabLinks.length) process.exitCode = 1;
