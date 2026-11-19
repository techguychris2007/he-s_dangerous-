import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# JSON Config Merger

Parse a JSON config string with \`JSON.parse\`, then shallow-merge a base config with an override —
the same layering pattern real app config (defaults + environment overrides) uses.
`;

const STARTER = `function loadConfig(text) {
  // TODO: parse \`text\` as JSON and return the resulting object.
}

function mergeConfigs(base, override) {
  // TODO: return a NEW object: a shallow copy of base with every key from override applied on top
  // (override wins on key collisions). Do not mutate base or override.
}

module.exports = { loadConfig, mergeConfigs };
`;

const SOLUTION = `function loadConfig(text) {
  return JSON.parse(text);
}

function mergeConfigs(base, override) {
  return { ...base, ...override };
}

module.exports = { loadConfig, mergeConfigs };
`;

const TEST_CODE = `const { loadConfig, mergeConfigs } = require('./config');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

const cfg = loadConfig('{"debug": false, "port": 8000, "name": "app"}');
check('loads debug', cfg.debug, false);
check('loads port', cfg.port, 8000);
check('loads name', cfg.name, 'app');

const base = { debug: false, port: 8000 };
const override = { port: 9000, verbose: true };
const merged = mergeConfigs(base, override);
check('merge overrides port', merged.port, 9000);
check('merge keeps base key', merged.debug, false);
check('merge adds new key', merged.verbose, true);
check('merge does not mutate base', base, { debug: false, port: 8000 });

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-006',
  title: 'JSON Config Merger',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'foundations',
  category: 'Files & Formats',
  tags: ['json', 'objects'],
  prompt: 'Parse a JSON config string, then shallow-merge a base config with an override without mutating either input.',
  hints: [
    '`JSON.parse(text)` is the whole body of `loadConfig`.',
    'The object spread operator does a shallow merge in one expression: `{ ...base, ...override }`.',
    'Spread order matters — properties from `override` need to come AFTER `...base` so they win on collisions.',
    'Object spread already creates a brand-new object, so neither `base` nor `override` ever gets mutated — no extra copying step needed.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('config.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('config.js', SOLUTION)],
  targets: [{ id: 'main', label: 'JSON Config Merger', kind: 'node-js', entry: 'config.js', testCode: TEST_CODE }],
};

export default task;
