import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Modal Dialog Component

A component factory that builds a real, independent modal dialog element — opened by a button,
closed by its own close button OR by clicking the backdrop behind it, with its own private open/
closed state.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Modal Dialog</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Settings</h1>
<button id="open-btn">Open Settings</button>
<div id="modal-root"></div>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
.backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); }
.backdrop[hidden] { display: none; }
.modal { background: white; padding: 1.5rem; max-width: 320px; margin: 4rem auto; border-radius: 8px; }
`;

const APP_JS_STARTER = `function createModal(title) {
  // TODO: build and return a backdrop element:
  // <div class="backdrop" hidden>
  //   <div class="modal">
  //     <h2>TITLE</h2>
  //     <button class="close-btn">Close</button>
  //   </div>
  // </div>
  // using document.createElement calls (not innerHTML). Clicking the close button OR clicking the
  // backdrop itself (but NOT clicking inside .modal) should set the backdrop's hidden to true.
  // Hint: clicking .modal will also "bubble" a click up to .backdrop, since .modal is INSIDE it —
  // check e.target === backdrop to tell a real backdrop click apart from a bubbled one.
}

const modal = createModal('Settings');
document.getElementById('modal-root').appendChild(modal);

document.getElementById('open-btn').addEventListener('click', function () {
  modal.hidden = false;
});
`;

const APP_JS_SOLUTION = `function createModal(title) {
  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  backdrop.hidden = true;

  const modal = document.createElement('div');
  modal.className = 'modal';
  backdrop.appendChild(modal);

  const heading = document.createElement('h2');
  heading.textContent = title;
  modal.appendChild(heading);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.textContent = 'Close';
  modal.appendChild(closeBtn);

  closeBtn.addEventListener('click', function () {
    backdrop.hidden = true;
  });

  backdrop.addEventListener('click', function (e) {
    if (e.target === backdrop) {
      backdrop.hidden = true;
    }
  });

  return backdrop;
}

const modal = createModal('Settings');
document.getElementById('modal-root').appendChild(modal);

document.getElementById('open-btn').addEventListener('click', function () {
  modal.hidden = false;
});
`;

const FRONTEND_TEST_CODE = `checkExists('modal starts hidden', '.backdrop[hidden]');

await click('#open-btn');
checkExists('opens when the open button is clicked', '.backdrop:not([hidden])');
checkText('shows the title', '.modal h2', 'Settings');

await click('.close-btn');
checkExists('closes when the close button is clicked', '.backdrop[hidden]');

await click('#open-btn');
checkExists('re-opens for the next test', '.backdrop:not([hidden])');

await click('.modal h2');
checkExists('clicking INSIDE the modal does not close it', '.backdrop:not([hidden])');

await click('.backdrop');
checkExists('clicking the backdrop itself closes the modal', '.backdrop[hidden]');
`;

const task: ProjectTask = {
  id: 'se-js-fst-011',
  title: 'Modal Dialog Component',
  difficulty: 'Hard',
  language: 'javascript',
  track: 'fullstack',
  category: 'Component Patterns',
  tags: ['components', 'dom', 'events'],
  prompt: 'Build a modal dialog as a component factory: openable from outside, closable by its own close button, and closable by clicking the backdrop — but NOT by clicking inside the modal itself.',
  hints: [
    'Build the structure with nested `createElement` calls: backdrop -> modal -> heading + close button, `appendChild`ing each piece onto its parent as you go.',
    'The backdrop starts `hidden = true` — `createModal` never shows itself; that\'s the caller\'s job (the open button listener, already written for you).',
    'Clicking anywhere inside `.modal` still fires a click on `.backdrop` too, because DOM events bubble upward through ancestors — the click "started" on some descendant of the backdrop, and bubbles up through it.',
    "`if (e.target === backdrop)` is what distinguishes a REAL backdrop click from a bubbled one — `e.target` is the exact element that was clicked, and it only equals `backdrop` when the click didn't originate inside `.modal`.",
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
