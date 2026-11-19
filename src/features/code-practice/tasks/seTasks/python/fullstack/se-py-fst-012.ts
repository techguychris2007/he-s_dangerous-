import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Toggle Component

A component FACTORY: a function that creates and returns a fresh, independent toggle button each
time it's called — two calls, two buttons, each with its own private on/off state that never leaks
into the other.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Toggle Component</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Settings</h1>
<div id="toggles"></div>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
button { display: block; margin-bottom: 0.5rem; padding: 0.4rem 0.8rem; }
`;

const APP_JS_STARTER = `function createToggle(label) {
  // TODO: create and return a <button> element whose textContent starts as "LABEL: OFF".
  // Clicking it should flip between "LABEL: OFF" and "LABEL: ON" each time (keep the on/off state
  // in a variable captured by the click listener's closure, not on the button element itself).
}

const container = document.getElementById('toggles');
const soundToggle = createToggle('Sound');
const notifsToggle = createToggle('Notifications');
container.appendChild(soundToggle);
container.appendChild(notifsToggle);
`;

const APP_JS_SOLUTION = `function createToggle(label) {
  let isOn = false;
  const button = document.createElement('button');
  button.textContent = label + ': OFF';
  button.addEventListener('click', function () {
    isOn = !isOn;
    button.textContent = label + ': ' + (isOn ? 'ON' : 'OFF');
  });
  return button;
}

const container = document.getElementById('toggles');
const soundToggle = createToggle('Sound');
const notifsToggle = createToggle('Notifications');
container.appendChild(soundToggle);
container.appendChild(notifsToggle);
`;

const FRONTEND_TEST_CODE = `checkCount('creates two independent buttons', '#toggles button', 2);
checkText('first toggle starts OFF', '#toggles button:first-child', 'Sound: OFF');
checkText('second toggle starts OFF', '#toggles button:nth-child(2)', 'Notifications: OFF');

await click('#toggles button:first-child');
checkText('first toggle switches ON when clicked', '#toggles button:first-child', 'Sound: ON');
checkText('second toggle is unaffected by the first', '#toggles button:nth-child(2)', 'Notifications: OFF');

await click('#toggles button:first-child');
checkText('first toggle switches back OFF on a second click', '#toggles button:first-child', 'Sound: OFF');
`;

const task: ProjectTask = {
  id: 'se-py-fst-012',
  title: 'Toggle Component',
  difficulty: 'Medium',
  language: 'python',
  track: 'fullstack',
  category: 'Component Patterns',
  tags: ['components', 'closures', 'dom'],
  prompt: 'Write a component factory function: each call to createToggle() must produce an independent button with its own private on/off state, not shared with any other toggle.',
  hints: [
    'Declare `let isOn = false;` INSIDE `createToggle` — that\'s what gives each call its own private variable, captured by that call\'s own click listener (a closure).',
    'Build the button, set its starting text, attach one click listener, then `return button` at the end.',
    'Inside the listener: flip `isOn = !isOn;` first, then rebuild the text from the new state: `label + \': \' + (isOn ? \'ON\' : \'OFF\')`.',
    'Two separate calls to `createToggle(...)` each run the function body fresh — their `isOn` variables are two completely separate bindings, which is exactly why clicking one never affects the other.',
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
