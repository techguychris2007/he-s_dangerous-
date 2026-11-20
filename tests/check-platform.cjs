require('../scripts/register-typescript.cjs');
const assert = require('node:assert/strict');
for (const extension of ['.css', '.jpg', '.png', '.svg']) require.extensions[extension] = module => { module.exports = ''; };
const { MODULES, ROADMAP } = require('../src/features/curriculum/data/curriculum.ts');
require('../scripts/register-owner-content.cjs');
const { PRE_SECURITY_MODULES } = require('../src/features/curriculum/data/preSecurityCurriculum.tsx');
const { DEFENSIVE_MODULES, DEFENSIVE_MILESTONES } = require('../src/features/curriculum/data/defensiveCurriculum.tsx');
const { labsForLesson } = require('../src/features/curriculum/data/lessonLabs.ts');
const { LABS } = require('../src/features/labs/data/labs.ts');
const { SIEM_LABS } = require('../src/features/soc/engine/siemScenarios.ts');
const unique = (values, name) => assert.equal(new Set(values).size, values.length, `${name} must be unique`);
unique(MODULES.map(module => module.id), 'Module IDs');
unique(MODULES.map(module => module.slug), 'Module routes');
unique(MODULES.flatMap(module => module.lessons.map(lesson => lesson.id)), 'Lesson IDs');
unique(LABS.map(lab => lab.slug), 'Lab routes');
const modules = new Map(MODULES.map(module => [module.slug, module]));
const labIds = new Set([...LABS.map(lab => lab.slug), ...SIEM_LABS.map(lab => lab.id)]);
for (const stage of ROADMAP) if (stage.moduleSlug) assert.ok(modules.has(stage.moduleSlug), `Unreachable roadmap module ${stage.moduleSlug}`);
for (const module of [...PRE_SECURITY_MODULES, ...DEFENSIVE_MODULES]) {
  assert.ok(module.lessons.length >= 3, `${module.id}: missing teaching sequence`);
  assert.ok(ROADMAP.some(stage => stage.moduleSlug === module.slug), `${module.id}: not in roadmap`);
  const seenModuleLabs = new Set();
  let firstSeenLabCount = 0;
  for (const lesson of module.lessons) {
    assert.ok(lesson.quiz?.length, `${lesson.id}: missing knowledge check`);
    for (const question of lesson.quiz) assert.ok(question.correctIndex >= 0 && question.correctIndex < question.choices.length, `${lesson.id}: invalid answer key`);
    for (const labId of labsForLesson(lesson.id)) {
      assert.ok(labIds.has(labId), `${lesson.id}: missing practice lab ${labId}`);
      if (!seenModuleLabs.has(labId)) {
        seenModuleLabs.add(labId);
        firstSeenLabCount++;
      }
    }
  }
  assert.equal(firstSeenLabCount, seenModuleLabs.size, `${module.id}: unique lab badge count must match unique labs`);
}
let previous = [];
for (const milestone of DEFENSIVE_MILESTONES) {
  assert.ok(modules.has(milestone.moduleSlug));
  for (const slug of milestone.requiredModuleSlugs) assert.ok(modules.has(slug), `Missing milestone prerequisite ${slug}`);
  for (const slug of previous) assert.ok(milestone.requiredModuleSlugs.includes(slug), 'Career progression must retain prior prerequisites');
  previous = milestone.requiredModuleSlugs;
}
console.log(`Platform integrity passed: ${MODULES.length} modules, ${LABS.length} terminal labs, ${DEFENSIVE_MILESTONES.length} career milestones`);
