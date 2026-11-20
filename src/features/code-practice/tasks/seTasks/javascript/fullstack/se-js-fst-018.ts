import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Accessible Accordion

Each accordion header is a real toggle button with \`aria-expanded\`, controlling a content panel
that's actually hidden from assistive tech (not just visually collapsed) when closed — the ARIA
disclosure pattern, applied to two independent sections.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Accessible Accordion</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>FAQ</h1>

<button id="header-1" class="accordion-header" aria-expanded="false">What is this?</button>
<div id="panel-1" class="accordion-panel" hidden>A tiny demo app.</div>

<button id="header-2" class="accordion-header" aria-expanded="false">How do I use it?</button>
<div id="panel-2" class="accordion-panel" hidden>Click a question to expand its answer.</div>

<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
.accordion-header { display: block; width: 100%; text-align: left; padding: 0.6rem; margin-top: 0.5rem; }
.accordion-panel { padding: 0.6rem; border: 1px solid #eee; }
`;

const APP_JS_STARTER = `const headers = document.querySelectorAll('.accordion-header');

headers.forEach(function (header, index) {
  const panel = document.getElementById('panel-' + (index + 1));
  header.addEventListener('click', function () {
    // TODO:
    //  - read the CURRENT state via header.getAttribute('aria-expanded') (a string, 'true' or 'false')
    //  - flip it: set header's aria-expanded to the new value (as a string)
    //  - set panel.hidden to the OPPOSITE of the new expanded state (expanded -> not hidden)
  });
});
`;

const APP_JS_SOLUTION = `const headers = document.querySelectorAll('.accordion-header');

headers.forEach(function (header, index) {
  const panel = document.getElementById('panel-' + (index + 1));
  header.addEventListener('click', function () {
    const isExpanded = header.getAttribute('aria-expanded') === 'true';
    const newState = !isExpanded;
    header.setAttribute('aria-expanded', String(newState));
    panel.hidden = !newState;
  });
});
`;

const FRONTEND_TEST_CODE = `checkAttr('section 1 starts collapsed', '#header-1', 'aria-expanded', 'false');
checkExists('panel 1 starts hidden', '#panel-1[hidden]');

await click('#header-1');
checkAttr('section 1 expands on click', '#header-1', 'aria-expanded', 'true');
checkExists('panel 1 becomes visible', '#panel-1:not([hidden])');
checkAttr('section 2 is unaffected by clicking section 1', '#header-2', 'aria-expanded', 'false');

await click('#header-1');
checkAttr('section 1 collapses on a second click', '#header-1', 'aria-expanded', 'false');
checkExists('panel 1 becomes hidden again', '#panel-1[hidden]');

await click('#header-2');
checkAttr('section 2 expands independently', '#header-2', 'aria-expanded', 'true');
checkExists('panel 2 becomes visible', '#panel-2:not([hidden])');
`;

const task: ProjectTask = {
  id: 'se-js-fst-018',
  title: 'Accessible Accordion',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'fullstack',
  category: 'Accessibility',
  tags: ['accessibility', 'aria', 'dom'],
  prompt: 'Implement the ARIA disclosure pattern for an accordion: aria-expanded on each header, and its matching panel genuinely hidden (not just visually collapsed) when closed.',
  hints: [
    "`header.getAttribute('aria-expanded')` returns the STRING `'true'` or `'false'` — compare with `=== 'true'` to get an actual boolean before flipping it.",
    "`header.setAttribute('aria-expanded', String(newState))` — `setAttribute` always needs a string.",
    '`panel.hidden = !newState;` ties the panel\'s visibility directly to the new expanded state — expanded means NOT hidden.',
    'Each header/panel pair is matched by index (`\'panel-\' + (index + 1)`) — the forEach callback\'s second argument is the 0-based index, already wired up for you.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('index.html', HTML, { editable: false }),
    pf('style.css', CSS, { editable: false }),
    pf('app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('index.html', HTML, { editable: false }),
    pf('style.css', CSS, { editable: false }),
    pf('app.js', APP_JS_SOLUTION),
  ],
  targets: [{ id: 'frontend', label: 'Frontend', kind: 'dom', entry: 'index.html', testCode: FRONTEND_TEST_CODE }],
};

export default task;
