import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Utility Package

Two given helper modules, \`text_utils.js\` and \`math_utils.js\` — your job in \`report.js\` is to
\`require\` both and combine their output into one summary string.
`;

const TEXT_UTILS = `function truncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

function wordCount(text) {
  return text.split(' ').filter((w) => w.length > 0).length;
}

module.exports = { truncate, wordCount };
`;

const MATH_UTILS = `function average(numbers) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(value, high));
}

module.exports = { average, clamp };
`;

const REPORT_STARTER = `const { truncate, wordCount } = require('./text_utils');
const { average, clamp } = require('./math_utils');

function summarize(title, body, scores) {
  // TODO: build and return a report string in EXACTLY this format (no trailing newline):
  // "<truncated title, max 20 chars>: <word count of body> words, avg score <average of scores,
  // clamped between 0 and 100, as an integer>"
  //
  // Example: summarize("Short", "one two three", [50, 150]) ->
  // "Short: 3 words, avg score 100"
}

module.exports = { summarize };
`;

const REPORT_SOLUTION = `const { truncate, wordCount } = require('./text_utils');
const { average, clamp } = require('./math_utils');

function summarize(title, body, scores) {
  const shortTitle = truncate(title, 20);
  const words = wordCount(body);
  const avgScore = clamp(average(scores), 0, 100);
  return \`\${shortTitle}: \${words} words, avg score \${Math.trunc(avgScore)}\`;
}

module.exports = { summarize };
`;

const TEST_CODE = `const { summarize } = require('./report');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check(
  'short title, in-range scores',
  summarize('Short', 'one two three', [50, 150]),
  'Short: 3 words, avg score 100',
);
check(
  'long title gets truncated',
  summarize('This Is A Very Long Report Title', 'hello world', [80]),
  'This Is A Very Lo...: 2 words, avg score 80',
);
check(
  'score clamps to 0 minimum',
  summarize('Neg', 'a b', [-50, -50]),
  'Neg: 2 words, avg score 0',
);
check(
  'empty body has zero words',
  summarize('Empty', '', [10, 20]),
  'Empty: 0 words, avg score 15',
);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-010',
  title: 'Utility Package',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'foundations',
  category: 'Modules & Packaging',
  tags: ['require', 'modules', 'formatting'],
  prompt: "Compose two given utility modules into one formatted report string — practice reading an unfamiliar module's functions and combining their outputs correctly.",
  hints: [
    'All four functions you need are already required at the top of `report.js` — you\'re only writing the body of `summarize`.',
    '`truncate(title, 20)` and `wordCount(body)` each need exactly one call.',
    '`clamp(average(scores), 0, 100)` composes the two math_utils functions in one line — average first, then clamp the result.',
    'The final piece is a template literal: `` `${shortTitle}: ${words} words, avg score ${Math.trunc(avgScore)}` `` — `Math.trunc` drops the decimal so 100.0 prints as 100.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('text_utils.js', TEXT_UTILS, { editable: false }),
    pf('math_utils.js', MATH_UTILS, { editable: false }),
    pf('report.js', REPORT_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('text_utils.js', TEXT_UTILS, { editable: false }),
    pf('math_utils.js', MATH_UTILS, { editable: false }),
    pf('report.js', REPORT_SOLUTION),
  ],
  targets: [{ id: 'main', label: 'Utility Package', kind: 'node-js', entry: 'report.js', testCode: TEST_CODE }],
};

export default task;
