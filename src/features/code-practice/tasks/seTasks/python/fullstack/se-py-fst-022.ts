import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Poll App (Capstone)

A backend that computes percentages from raw vote counts, and a frontend that re-renders itself
from whatever the backend just sent back — click a vote button, and the whole results view updates
from the RESPONSE, not from any local guess about what the new totals should be.
`;

const FRAMEWORK = `class Request:
    def __init__(self, method, path, body=None):
        self.method = method
        self.path = path
        self.body = body or {}


class App:
    def __init__(self):
        self.routes = []

    def route(self, path, methods=('GET',)):
        def decorator(fn):
            for m in methods:
                self.routes.append((m, path, fn))
            return fn
        return decorator

    def handle(self, method, path, body=None):
        req = Request(method, path, body)
        for m, pattern, fn in self.routes:
            if m != method:
                continue
            params = _match(pattern, path)
            if params is not None:
                return fn(req, **params)
        return (404, {"error": "not found"})


def _match(pattern, path):
    p_parts = pattern.strip('/').split('/')
    a_parts = path.strip('/').split('/')
    if len(p_parts) != len(a_parts):
        return None
    params = {}
    for p, a in zip(p_parts, a_parts):
        if p.startswith('<') and p.endswith('>'):
            params[p[1:-1]] = a
        elif p != a:
            return None
    return params
`;

const POLL_MODEL = `POLL = {
    "question": "Favorite language?",
    "options": [
        {"id": 1, "label": "Python", "votes": 3},
        {"id": 2, "label": "JavaScript", "votes": 1},
    ],
}
`;

const VOTES_STARTER = `from poll import POLL


def cast_vote(option_id):
    """Find the option in POLL['options'] whose id matches option_id, increment its votes by 1,
    and return True. Return False if no option matches."""
    # TODO
    pass


def get_results():
    """Return a list of {"id", "label", "votes", "percentage"} dicts, one per option — percentage
    is votes / total_votes * 100, rounded to the nearest whole number (round()). If total_votes is
    0, every percentage should be 0 (avoid dividing by zero)."""
    # TODO
    pass
`;

const VOTES_SOLUTION = `from poll import POLL


def cast_vote(option_id):
    for option in POLL['options']:
        if option['id'] == option_id:
            option['votes'] += 1
            return True
    return False


def get_results():
    total = sum(o['votes'] for o in POLL['options'])
    results = []
    for option in POLL['options']:
        percentage = round(option['votes'] / total * 100) if total > 0 else 0
        results.append({"id": option['id'], "label": option['label'], "votes": option['votes'], "percentage": percentage})
    return results
`;

const ROUTES = `from framework import App
from poll import POLL
from votes import cast_vote, get_results

app = App()


@app.route('/poll', methods=('GET',))
def get_poll(req):
    return (200, {"question": POLL['question'], "results": get_results()})


@app.route('/poll/vote/<option_id>', methods=('POST',))
def vote(req, option_id):
    if not cast_vote(int(option_id)):
        return (404, {"error": "no such option"})
    return (200, {"question": POLL['question'], "results": get_results()})
`;

const MAIN = `from routes import app

if __name__ == '__main__':
    status, body = app.handle('GET', '/poll')
    print(f"GET /poll -> {status} {body}")
`;

const BACKEND_TEST_CODE = `from votes import cast_vote, get_results
from poll import POLL
from routes import app

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

results = get_results()
__check__("initial percentages sum sensibly", results[0]['percentage'], 75)
__check__("second option percentage", results[1]['percentage'], 25)

__check__("casting a vote for an existing option", cast_vote(2), True)
__check__("casting a vote for a missing option", cast_vote(999), False)

results2 = get_results()
__check__("vote count increments", results2[1]['votes'], 2)
__check__("percentages update after a vote", results2[0]['percentage'], 60)

status, body = app.handle('GET', '/poll')
__check__("get poll status", status, 200)
__check__("get poll includes the question", body.get('question'), 'Favorite language?')

status, body = app.handle('POST', '/poll/vote/1')
__check__("vote route status", status, 200)
__check__("vote route returns updated results", body['results'][0]['votes'], 4)

status, body = app.handle('POST', '/poll/vote/999')
__check__("vote route for missing option", status, 404)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
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
  id: 'se-py-fst-022',
  title: 'Poll App',
  difficulty: 'Hard',
  language: 'python',
  track: 'fullstack',
  category: 'Capstones',
  tags: ['capstone', 'fetch', 'computed-data'],
  prompt:
    'Compute vote percentages on the backend, then render — and RE-render, after every vote — the ' +
    'whole results view from whatever the server just sent back, never from a locally-guessed update.',
  hints: [
    'cast_vote: loop over POLL[\'options\'], find the matching id, `option[\'votes\'] += 1`, return True immediately — return False after the loop if nothing matched.',
    'get_results: compute `total` once with a generator sum, then round each option\'s `votes / total * 100` — guard `total == 0` first so an all-zero poll never divides by zero.',
    'renderPoll() is called BOTH after the initial load AND after every vote — write it once, to always fully rebuild #options from whatever `data` it\'s given, and both call sites get correct behavior for free.',
    'The click listener is on `#options` itself (event delegation, same pattern as the Blog Platform capstone) — `e.target.dataset.id` reads the button\'s `data-id`, and a click that misses (not on a button) returns early since `dataset.id` would be undefined.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/poll.py', POLL_MODEL, { editable: false }),
    pf('backend/votes.py', VOTES_STARTER),
    pf('backend/routes.py', ROUTES, { editable: false }),
    pf('backend/main.py', MAIN, { editable: false }),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/poll.py', POLL_MODEL, { editable: false }),
    pf('backend/votes.py', VOTES_SOLUTION),
    pf('backend/routes.py', ROUTES, { editable: false }),
    pf('backend/main.py', MAIN, { editable: false }),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_SOLUTION),
  ],
  targets: [
    { id: 'backend', label: 'Backend', kind: 'python', entry: 'backend/routes.py', testCode: BACKEND_TEST_CODE },
    { id: 'frontend', label: 'Frontend', kind: 'dom', entry: 'frontend/index.html', testCode: FRONTEND_TEST_CODE, fetchFixtures: FETCH_FIXTURES },
  ],
};

export default task;
