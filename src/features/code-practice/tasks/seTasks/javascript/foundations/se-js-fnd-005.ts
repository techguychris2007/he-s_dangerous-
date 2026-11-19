import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Log Line Parser

Parse a "LEVEL: message" formatted log and summarize how many lines were logged at each level.

This runner executes your code in a plain Worker with no real filesystem (unlike the Python track,
which has one via Pyodide) — so instead of reading a file from disk, \`parseLog\` takes the log's
text content directly as a string. Same parsing logic either way, just no \`fs.readFile\` step.
`;

const STARTER = `function parseLog(text) {
  // TODO: split \`text\` into lines. Each non-empty line looks like "LEVEL: message"
  // (e.g. "INFO: started"). Return an array of {level, message} objects, in order. Skip blank lines.
}

function countLevels(entries) {
  // TODO: given an array of {level, message} objects, return an object of {level: count}.
}

module.exports = { parseLog, countLevels };
`;

const SOLUTION = `function parseLog(text) {
  const entries = [];
  for (const rawLine of text.split('\\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const sepIndex = line.indexOf(': ');
    const level = line.slice(0, sepIndex);
    const message = line.slice(sepIndex + 2);
    entries.push({ level, message });
  }
  return entries;
}

function countLevels(entries) {
  const counts = {};
  for (const { level } of entries) {
    counts[level] = (counts[level] || 0) + 1;
  }
  return counts;
}

module.exports = { parseLog, countLevels };
`;

const TEST_CODE = `const { parseLog, countLevels } = require('./log_parser');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

const logText = 'INFO: started\\nWARN: low memory\\nERROR: crashed\\n\\nINFO: restarted\\n';
const entries = parseLog(logText);
check('parses 4 entries (blank skipped)', entries.length, 4);
check('first entry', entries[0], { level: 'INFO', message: 'started' });
check('third entry level', entries[2].level, 'ERROR');
check('third entry message', entries[2].message, 'crashed');

const counts = countLevels(entries);
check('INFO count', counts.INFO, 2);
check('WARN count', counts.WARN, 1);
check('ERROR count', counts.ERROR, 1);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-005',
  title: 'Log Line Parser',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'foundations',
  category: 'Files & Formats',
  tags: ['parsing', 'strings'],
  prompt: 'Parse "LEVEL: message" formatted log text into structured entries, then summarize counts per level.',
  hints: [
    "`text.split('\\n')` gives you lines; `.trim()` each one before checking if it's blank.",
    "`continue` past a line entirely once `.trim()` leaves it empty — that's the blank line.",
    "`line.indexOf(': ')` finds where the separator starts; `line.slice(0, sepIndex)` is the level, `line.slice(sepIndex + 2)` is the message (the `+ 2` skips past the ': ' itself).",
    "`counts[level] = (counts[level] || 0) + 1` is the classic \"increment or start at zero\" pattern for a frequency object.",
  ],
  files: [pf('README.md', README, { editable: false }), pf('log_parser.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('log_parser.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Log Line Parser', kind: 'node-js', entry: 'log_parser.js', testCode: TEST_CODE }],
};

export default task;
