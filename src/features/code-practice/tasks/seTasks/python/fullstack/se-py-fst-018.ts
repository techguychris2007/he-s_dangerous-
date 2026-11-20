import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Accessible Toggle Button

A real \`aria-pressed\` toggle button, plus a visually-hidden status region that announces the
change — the pattern behind any icon-only mute/favorite/like button that needs to make sense to a
screen reader, not just sighted users.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Accessible Toggle</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Audio Settings</h1>
<button id="mute-btn" aria-pressed="false">🔊 Mute</button>
<span id="sr-status" class="sr-only"></span>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
button { font-size: 1rem; padding: 0.5rem 1rem; }
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
`;

const APP_JS_STARTER = `const muteBtn = document.getElementById('mute-btn');
const status = document.getElementById('sr-status');

muteBtn.addEventListener('click', function () {
  // TODO:
  //  - read the CURRENT state via muteBtn.getAttribute('aria-pressed') (a string, 'true' or 'false')
  //  - flip it and set aria-pressed to the new value (as a string)
  //  - set status's textContent to 'Muted' when newly pressed, or 'Unmuted' when newly released
});
`;

const APP_JS_SOLUTION = `const muteBtn = document.getElementById('mute-btn');
const status = document.getElementById('sr-status');

muteBtn.addEventListener('click', function () {
  const isPressed = muteBtn.getAttribute('aria-pressed') === 'true';
  const newState = !isPressed;
  muteBtn.setAttribute('aria-pressed', String(newState));
  status.textContent = newState ? 'Muted' : 'Unmuted';
});
`;

const FRONTEND_TEST_CODE = `checkAttr('starts unpressed', '#mute-btn', 'aria-pressed', 'false');

await click('#mute-btn');
checkAttr('pressed after one click', '#mute-btn', 'aria-pressed', 'true');
checkText('announces the muted status', '#sr-status', 'Muted');

await click('#mute-btn');
checkAttr('unpressed after a second click', '#mute-btn', 'aria-pressed', 'false');
checkText('announces the unmuted status', '#sr-status', 'Unmuted');
`;

const task: ProjectTask = {
  id: 'se-py-fst-018',
  title: 'Accessible Toggle Button',
  difficulty: 'Medium',
  language: 'python',
  track: 'fullstack',
  category: 'Accessibility',
  tags: ['accessibility', 'aria', 'dom'],
  prompt: 'Implement a real aria-pressed toggle button and a visually-hidden status region that announces state changes for screen readers.',
  hints: [
    '`muteBtn.getAttribute(\'aria-pressed\')` returns the STRING `\'true\'` or `\'false\'` — compare it with `=== \'true\'` to get an actual boolean.',
    '`muteBtn.setAttribute(\'aria-pressed\', String(newState))` — `setAttribute` always needs a string, so wrap the boolean with `String(...)`.',
    'The visually-hidden `#sr-status` span exists specifically so a screen reader announces the change — sighted users never see it (that\'s what the `.sr-only` CSS class does), but its `textContent` still matters.',
    'Compute the new state once (`const newState = !isPressed;`), then use that same value for both the attribute and the status text — don\'t re-derive it twice.',
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
