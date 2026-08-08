import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Poll App (Capstone)

A backend that computes percentages from raw vote counts, and a frontend that re-renders itself
from whatever the backend just sent back — click a vote button, and the whole results view updates
from the RESPONSE, not from any local guess about what the new totals should be.
`;

const FRAMEWORK = `class Request {
  constructor(method, path, body) {
    this.method = method;
    this.path = path;
    this.body = body || {};
  }
}

class App {
  constructor() {
    this.routes = [];
  }
  route(method, path, handler) {
    this.routes.push({ method, path, handler });
  }
  handle(method, path, body) {
    const req = new Request(method, path, body);
    for (const r of this.routes) {
      if (r.method !== method) continue;
      const params = matchPath(r.path, path);
      if (params) return r.handler(req, params);
    }
    return [404, { error: 'not found' }];
  }
}

function matchPath(pattern, path) {
  const p = pattern.replace(/^\\/|\\/$/g, '').split('/');
  const a = path.replace(/^\\/|\\/$/g, '').split('/');
  if (p.length !== a.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = a[i];
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

module.exports = { App };
`;

const POLL_MODEL = `const POLL = {
  question: 'Favorite language?',
  options: [
    { id: 1, label: 'Python', votes: 3 },
    { id: 2, label: 'JavaScript', votes: 1 },
  ],
};

module.exports = { POLL };
`;

const VOTES_STARTER = `const { POLL } = require('./poll');

function castVote(optionId) {
  // TODO: find the option in POLL.options whose id matches optionId, increment its votes by 1,
  // and return true. Return false if no option matches.
}

function getResults() {
  // TODO: return an array of {id, label, votes, percentage} objects, one per option —
  // percentage is votes / totalVotes * 100, rounded to the nearest whole number (Math.round()).
  // If totalVotes is 0, every percentage should be 0 (avoid dividing by zero).
}

module.exports = { castVote, getResults };
`;

const VOTES_SOLUTION = `const { POLL } = require('./poll');

function castVote(optionId) {
  for (const option of POLL.options) {
    if (option.id === optionId) {
      option.votes += 1;
      return true;
    }
  }
  return false;
}

function getResults() {
  const total = POLL.options.reduce((sum, o) => sum + o.votes, 0);
  return POLL.options.map((option) => ({
    id: option.id,
    label: option.label,
    votes: option.votes,
    percentage: total > 0 ? Math.round((option.votes / total) * 100) : 0,
  }));
}

module.exports = { castVote, getResults };
`;

const ROUTES = `const { App } = require('./framework');
const { POLL } = require('./poll');
const { castVote, getResults } = require('./votes');

const app = new App();

app.route('GET', '/poll', function (req, params) {
  return [200, { question: POLL.question, results: getResults() }];
});

app.route('POST', '/poll/vote/:optionId', function (req, params) {
  if (!castVote(Number(params.optionId))) return [404, { error: 'no such option' }];
  return [200, { question: POLL.question, results: getResults() }];
});

module.exports = { app };
`;

const BACKEND_TEST_CODE = `const { castVote, getResults } = require('./votes');
const { app } = require('./routes');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

const results = getResults();
check('initial percentages', results[0].percentage, 75);
check('second option percentage', results[1].percentage, 25);

check('casting a vote for an existing option', castVote(2), true);
check('casting a vote for a missing option', castVote(999), false);

const results2 = getResults();
check('vote count increments', results2[1].votes, 2);
check('percentages update after a vote', results2[0].percentage, 60);

let result = app.handle('GET', '/poll');
check('get poll status', result[0], 200);
check('get poll includes the question', result[1].question, 'Favorite language?');

result = app.handle('POST', '/poll/vote/1');
check('vote route status', result[0], 200);
check('vote route returns updated results', result[1].results[0].votes, 4);

result = app.handle('POST', '/poll/vote/999');
check('vote route for missing option', result[0], 404);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Poll</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1 id="question"></h1>
<div id="options"></div>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
.option { margin-bottom: 0.5rem; }
.option button { margin-right: 0.5rem; padding: 0.3rem 0.7rem; }
`;

const APP_JS_STARTER = `function renderPoll(data) {
  // TODO:
  //  - set #question's textContent to data.question
  //  - clear #options (options.innerHTML = ''), then for each result in data.results, append a
  //    div with class "option" containing:
  //      a <button> with textContent "Vote" and a data-id attribute set to result.id
  //        (button.dataset.id = String(result.id))
  //      a <span> whose textContent is: "LABEL: VOTES votes (PERCENTAGE%)"
  //        e.g. "Python: 3 votes (75%)"
}

async function loadPoll() {
  const res = await fetch('/poll');
  const data = await res.json();
  renderPoll(data);
}

document.getElementById('options').addEventListener('click', async function (e) {
  // TODO: if e.target is a vote button (has a data-id attribute), fetch
  // '/poll/vote/' + e.target.dataset.id (method POST), parse the JSON response, and call
  // renderPoll() with it to refresh the whole view from the server's numbers.
});

loadPoll();
`;

const APP_JS_SOLUTION = `function renderPoll(data) {
  document.getElementById('question').textContent = data.question;
  const options = document.getElementById('options');
  options.innerHTML = '';
  for (const result of data.results) {
    const div = document.createElement('div');
    div.className = 'option';

    const button = document.createElement('button');
    button.textContent = 'Vote';
    button.dataset.id = String(result.id);
    div.appendChild(button);

    const span = document.createElement('span');
    span.textContent = result.label + ': ' + result.votes + ' votes (' + result.percentage + '%)';
    div.appendChild(span);

    options.appendChild(div);
  }
}

async function loadPoll() {
  const res = await fetch('/poll');
  const data = await res.json();
  renderPoll(data);
}

document.getElementById('options').addEventListener('click', async function (e) {
  if (!e.target.dataset.id) return;
  const res = await fetch('/poll/vote/' + e.target.dataset.id, { method: 'POST' });
  const data = await res.json();
  renderPoll(data);
});

loadPoll();
`;

const FRONTEND_TEST_CODE = `checkText('renders the poll question', '#question', 'Favorite language?');
checkCount('renders one row per option', '#options .option', 2);
checkText('shows the initial vote count and percentage', '#options .option:first-child span', 'Python: 3 votes (75%)');

await click('#options .option:nth-child(2) button');
checkText('re-renders vote counts from the response after voting', '#options .option:nth-child(2) span', 'JavaScript: 2 votes (40%)');
checkText('the other option\\'s percentage updates too', '#options .option:first-child span', 'Python: 3 votes (60%)');
`;

const FETCH_FIXTURES = {
  '/poll': {
    question: 'Favorite language?',
    results: [
      { id: 1, label: 'Python', votes: 3, percentage: 75 },
      { id: 2, label: 'JavaScript', votes: 1, percentage: 25 },
    ],
  },
  '/poll/vote/2': {
    question: 'Favorite language?',
    results: [
      { id: 1, label: 'Python', votes: 3, percentage: 60 },
      { id: 2, label: 'JavaScript', votes: 2, percentage: 40 },
    ],
  },
};

const task: ProjectTask = {
  id: 'se-js-fst-022',
  title: 'Poll App',
  difficulty: 'Hard',
  language: 'javascript',
  track: 'fullstack',
  category: 'Capstones',
  tags: ['capstone', 'fetch', 'computed-data'],
  prompt:
    'Compute vote percentages on the backend, then render — and RE-render, after every vote — the ' +
    'whole results view from whatever the server just sent back, never from a locally-guessed update.',
  hints: [
    "castVote: loop over POLL.options, find the matching id, `option.votes += 1`, return true immediately — return false after the loop if nothing matched.",
    'getResults: compute `total` once with `.reduce()`, then round each option\'s `(votes / total) * 100` with `Math.round()` — guard `total === 0` first so an all-zero poll never divides by zero.',
    'renderPoll() is called BOTH after the initial load AND after every vote — write it once, to always fully rebuild #options from whatever `data` it\'s given, and both call sites get correct behavior for free.',
    "The click listener is on `#options` itself (event delegation, same pattern as the Blog Platform capstone) — `e.target.dataset.id` reads the button's `data-id`, and a click that misses (not on a button) returns early since `dataset.id` would be undefined.",
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/poll.js', POLL_MODEL, { editable: false }),
    pf('backend/votes.js', VOTES_STARTER),
    pf('backend/routes.js', ROUTES, { editable: false }),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/poll.js', POLL_MODEL, { editable: false }),
    pf('backend/votes.js', VOTES_SOLUTION),
    pf('backend/routes.js', ROUTES, { editable: false }),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_SOLUTION),
  ],
  targets: [
    { id: 'backend', label: 'Backend', kind: 'node-js', entry: 'backend/routes.js', testCode: BACKEND_TEST_CODE },
    { id: 'frontend', label: 'Frontend', kind: 'dom', entry: 'frontend/index.html', testCode: FRONTEND_TEST_CODE, fetchFixtures: FETCH_FIXTURES },
  ],
};

export default task;
