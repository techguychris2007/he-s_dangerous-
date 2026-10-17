const fs = require('node:fs');
const path = require('node:path');
require('./register-typescript.cjs');
for (const extension of ['.css', '.jpg', '.png', '.svg']) require.extensions[extension] = module => { module.exports = ''; };
const { MODULES } = require('../src/data/curriculum.ts');
const { LABS } = require('../src/data/labs.ts');
const bridgeSource = fs.readFileSync(path.resolve(__dirname, '../src/components/labs/LabLearningBridge.tsx'), 'utf8');
const enrichmentSource = fs.readFileSync(path.resolve(__dirname, '../src/data/moduleEnrichment.tsx'), 'utf8');
const categories = [...new Set(LABS.map(l => l.scenario.category))].sort();
const moduleIds = MODULES.map(m => m.id);
const missingLabCategories = categories.filter(category => !bridgeSource.includes(`${category}:`) && !bridgeSource.includes(`'${category}':`));
const missingModuleBridge = moduleIds.filter(id => !enrichmentSource.includes(`${id}:`) && !enrichmentSource.includes(`'${id}':`) && !id.startsWith('pre-') && !id.startsWith('defensive-') && !id.startsWith('advanced-') && !id.startsWith('identity-') && !id.startsWith('software-') && !id.startsWith('post-'));
const weakLabs = LABS.filter(({ scenario }) => {
  const briefingWords = scenario.briefing.split(/\s+/).length;
  const objectives = scenario.objectives.length;
  const hints = scenario.hints.length;
  return briefingWords < 18 || objectives < 3 || hints < 2;
}).map(l => ({ id: l.scenario.id, title: l.scenario.title, category: l.scenario.category }));
if (missingLabCategories.length || missingModuleBridge.length) {
  console.error(JSON.stringify({ missingLabCategories, missingModuleBridge }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ labCategoriesCovered: categories.length, modules: moduleIds.length, weakLabs: weakLabs.length, sampleWeakLabs: weakLabs.slice(0, 10) }, null, 2));
