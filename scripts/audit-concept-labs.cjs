require('./register-typescript.cjs');
require.extensions['.css'] = () => null;
require.extensions['.jpg'] = () => null;
require.extensions['.png'] = () => null;
require.extensions['.svg'] = () => null;

const fs = require('fs');
const path = require('path');
const { LABS } = require('../src/data/labs.ts');

const labsWithEngagement = LABS.filter(entry => entry.scenario.engagement).map(entry => entry.slug);
const requiredLabText = [];
const sourceTargets = [
  'src/pages/LabPage.tsx',
  'src/components/lesson/LessonLabCard.tsx',
  'src/components/labs/LabLearningBridge.tsx',
  'src/components/labs/ShareWriteupModal.tsx',
  'src/labs/scenarios/visual-pentest-labs.ts',
];
const forbidden = [
  /Complete engagement/i,
  /engagement handoff/i,
  /engagement remediate/i,
  /engagement cleanup/i,
  /Cleanup & handback/i,
  /full pentest methodology/i,
  /rules of engagement/i,
];
for (const file of sourceTargets) {
  const text = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(text)) requiredLabText.push({ file, pattern: pattern.source });
  }
}

const report = { labs: LABS.length, labsWithEngagement, forbiddenStudentFacingText: requiredLabText };
console.log(JSON.stringify(report, null, 2));
if (labsWithEngagement.length || requiredLabText.length) process.exitCode = 1;
