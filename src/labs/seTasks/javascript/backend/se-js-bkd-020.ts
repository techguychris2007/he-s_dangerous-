import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Structured Logging

Plain \`console.log\` debugging doesn't scale — real systems log structured events (a level, a
message, and arbitrary key/value context) so they can be filtered and queried later. Build a tiny
structured logger and a query function over its history.
`;

const STARTER = `const LOG_HISTORY = [];

function logEvent(level, message, context = {}) {
  // TODO: push { level, message, context } onto LOG_HISTORY.
}

function queryLogs(filters = {}) {
  // TODO: filters may include \`level\` (a string) and any number of other keys, which should be
  // matched against each entry's context. Return every entry in LOG_HISTORY that matches:
  // - filters.level, if given (skip this check if it's undefined — match any level)
  // - EVERY OTHER key/value pair in filters (an entry only matches if its own context has that
  //   key with that exact value; if there are no other keys, this check always passes)
  // Hint: build the "other keys" object with \`const { level, ...contextFilters } = filters;\`
}

module.exports = { logEvent, queryLogs, LOG_HISTORY };
`;

const SOLUTION = `const LOG_HISTORY = [];

function logEvent(level, message, context = {}) {
  LOG_HISTORY.push({ level, message, context });
}

function queryLogs(filters = {}) {
  const { level, ...contextFilters } = filters;
  return LOG_HISTORY.filter((entry) => {
    if (level !== undefined && entry.level !== level) return false;
    return Object.entries(contextFilters).every(([k, v]) => entry.context[k] === v);
  });
}

module.exports = { logEvent, queryLogs, LOG_HISTORY };
`;

const TEST_CODE = `const { logEvent, queryLogs, LOG_HISTORY } = require('./logging_lib');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

logEvent('INFO', 'server started');
logEvent('ERROR', 'payment failed', { userId: 42, amount: 9.99 });
logEvent('ERROR', 'payment failed', { userId: 7, amount: 3.5 });
logEvent('INFO', 'user logged in', { userId: 42 });

check('all events recorded', LOG_HISTORY.length, 4);
check('event stores the message', LOG_HISTORY[1].message, 'payment failed');
check('event stores the context', LOG_HISTORY[1].context, { userId: 42, amount: 9.99 });

const errors = queryLogs({ level: 'ERROR' });
check('query by level filters correctly', errors.length, 2);

const user42Events = queryLogs({ userId: 42 });
check('query by context filters correctly', user42Events.length, 2);

const user42Errors = queryLogs({ level: 'ERROR', userId: 42 });
check('query combines level and context filters', user42Errors.length, 1);
check('combined query finds the right entry', user42Errors[0].message, 'payment failed');

check('query with no filters returns everything', queryLogs().length, 4);
check('query for a level with no matches is empty', queryLogs({ level: 'DEBUG' }), []);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-020',
  title: 'Structured Logging',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'Observability',
  tags: ['logging', 'observability'],
  prompt: 'Build a structured logger (level + message + arbitrary key/value context) and a query function that can filter that history by level, by context, or both.',
  hints: [
    '`logEvent` is a single `LOG_HISTORY.push({...})` call assembling the three fields.',
    'Rest destructuring pulls `level` out separately from everything else: `const { level, ...contextFilters } = filters;` — `contextFilters` is then just the remaining keys.',
    '`.filter()` with `if (level !== undefined && entry.level !== level) return false;` as the first check, then fall through to the context check.',
    '`Object.entries(contextFilters).every(([k, v]) => entry.context[k] === v)` checks every requested context filter at once — and is vacuously `true` when `contextFilters` is empty, so "no filters" naturally means "match everything."',
  ],
  files: [pf('README.md', README, { editable: false }), pf('logging_lib.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('logging_lib.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Structured Logging', kind: 'node-js', entry: 'logging_lib.js', testCode: TEST_CODE }],
};

export default task;
