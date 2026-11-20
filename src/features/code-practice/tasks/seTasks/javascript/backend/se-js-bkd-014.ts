import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Sliding Window Rate Limiter

Limit each client to at most \`limit\` requests within the last \`window\` seconds. The current time
is passed in as a plain argument (\`now\`) rather than read from the real clock — that's what makes
this testable without actually waiting: a test can simulate time passing just by passing a bigger
number.
`;

const STARTER = `const REQUEST_LOG = new Map();

function allowRequest(clientId, now, limit = 3, window = 60) {
  // TODO: return true if clientId may make a request at time \`now\`, false if they've hit the limit.
  // A request is "within the window" if it happened at time >= now - window.
  //
  // - Drop any of clientId's logged timestamps older than (now - window).
  // - If fewer than \`limit\` requests remain in the window, record \`now\` as a new request and
  //   return true.
  // - Otherwise return false (and do NOT record this attempt).
  // Either way, save the pruned timestamp list back to REQUEST_LOG.
}

module.exports = { allowRequest };
`;

const SOLUTION = `const REQUEST_LOG = new Map();

function allowRequest(clientId, now, limit = 3, window = 60) {
  let timestamps = REQUEST_LOG.get(clientId) || [];
  timestamps = timestamps.filter((t) => t >= now - window);

  if (timestamps.length < limit) {
    timestamps.push(now);
    REQUEST_LOG.set(clientId, timestamps);
    return true;
  }

  REQUEST_LOG.set(clientId, timestamps);
  return false;
}

module.exports = { allowRequest };
`;

const TEST_CODE = `const { allowRequest } = require('./rate_limiter');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('1st request allowed', allowRequest('client-a', 0, 3, 60), true);
check('2nd request allowed', allowRequest('client-a', 1, 3, 60), true);
check('3rd request allowed', allowRequest('client-a', 2, 3, 60), true);
check('4th request within the window is blocked', allowRequest('client-a', 3, 3, 60), false);

check('a different client has its own independent limit', allowRequest('client-b', 3, 3, 60), true);

check('after the window fully elapses, requests are allowed again', allowRequest('client-a', 100, 3, 60), true);

check('2nd request in the new window is still allowed', allowRequest('client-a', 100, 3, 60), true);
check('3rd request in the new window is still allowed', allowRequest('client-a', 100, 3, 60), true);
check('4th in the new window is blocked too', allowRequest('client-a', 101, 3, 60), false);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-014',
  title: 'Sliding Window Rate Limiter',
  difficulty: 'Hard',
  language: 'javascript',
  track: 'backend',
  category: 'Caching & Rate Limiting',
  tags: ['rate-limiting'],
  prompt: 'Implement a per-client sliding-window rate limiter — old requests age out of the window automatically, so the limit is always "in the last N seconds," not "since the server started."',
  hints: [
    'Start by pruning: `timestamps.filter((t) => t >= now - window)` drops every timestamp that has aged out, leaving only the ones still "in the window."',
    'Compare the PRUNED array\'s length to `limit` — that\'s the count of requests still within the window, not the raw historical count.',
    'Only push `now` in the ALLOWED branch — a rejected request should not count toward future limits.',
    'Even in the rejected branch, still save the pruned (shorter) array back to `REQUEST_LOG` — otherwise old timestamps you already filtered out would just reappear on the next call.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('rate_limiter.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('rate_limiter.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Sliding Window Rate Limiter', kind: 'node-js', entry: 'rate_limiter.js', testCode: TEST_CODE }],
};

export default task;
