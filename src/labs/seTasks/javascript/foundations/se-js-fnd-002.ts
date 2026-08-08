import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Temperature Converter

Three small functions on plain numbers — no data structures yet, just variables, arithmetic, and
\`if\`/\`else if\`/\`else\`. The JS twin of the Python foundations task with the same shape.
`;

const STARTER = `function celsiusToFahrenheit(c) {
  // TODO: F = C * 9/5 + 32
}

function fahrenheitToCelsius(f) {
  // TODO: C = (F - 32) * 5/9
}

function classifyTemperature(celsius) {
  // TODO: 'freezing' if celsius <= 0, 'cold' if <= 15, 'mild' if <= 25, else 'hot'
}

module.exports = { celsiusToFahrenheit, fahrenheitToCelsius, classifyTemperature };
`;

const SOLUTION = `function celsiusToFahrenheit(c) {
  return (c * 9) / 5 + 32;
}

function fahrenheitToCelsius(f) {
  return ((f - 32) * 5) / 9;
}

function classifyTemperature(celsius) {
  if (celsius <= 0) return 'freezing';
  else if (celsius <= 15) return 'cold';
  else if (celsius <= 25) return 'mild';
  else return 'hot';
}

module.exports = { celsiusToFahrenheit, fahrenheitToCelsius, classifyTemperature };
`;

const TEST_CODE = `const { celsiusToFahrenheit, fahrenheitToCelsius, classifyTemperature } = require('./converter');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('0C to F', celsiusToFahrenheit(0), 32);
check('100C to F', celsiusToFahrenheit(100), 212);
check('32F to C', fahrenheitToCelsius(32), 0);
check('212F to C', fahrenheitToCelsius(212), 100);
check('classify freezing', classifyTemperature(-5), 'freezing');
check('classify boundary 0', classifyTemperature(0), 'freezing');
check('classify cold', classifyTemperature(10), 'cold');
check('classify mild', classifyTemperature(20), 'mild');
check('classify hot', classifyTemperature(30), 'hot');

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-002',
  title: 'Temperature Converter',
  difficulty: 'Easy',
  language: 'javascript',
  track: 'foundations',
  category: 'Language Core',
  tags: ['variables', 'conditionals', 'arithmetic'],
  prompt: 'Write two unit-conversion functions and one classifier that branches on the result. Pure variables, arithmetic, and `if`/`else if`/`else` — no collections yet.',
  hints: [
    'Fahrenheit = Celsius * 9/5 + 32 — a direct arithmetic expression, no loop needed.',
    'Celsius = (Fahrenheit - 32) * 5/9 — the inverse of the formula above.',
    'Order your `else if` chain from lowest to highest threshold so each boundary only needs one comparison.',
    'The boundaries are inclusive ("<= 0" is freezing) — double check 0 lands in "freezing", not "cold".',
  ],
  files: [pf('README.md', README, { editable: false }), pf('converter.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('converter.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Temperature Converter', kind: 'node-js', entry: 'converter.js', testCode: TEST_CODE }],
};

export default task;
