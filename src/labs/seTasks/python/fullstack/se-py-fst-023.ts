import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Multi-Step Form Wizard (Capstone)

A three-step form: each step validates before letting you move on, a shared state object carries
your answers across every step (Back and Next never lose data), and the final step builds a live
review from that same state before submitting. Pure frontend — no backend needed, since the whole
challenge here is in the client-side flow itself.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Signup Wizard</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Sign Up</h1>

<div id="step-1" class="step">
<h2>Step 1: Your Info</h2>
<input id="name" type="text" placeholder="Name" />
<input id="email" type="text" placeholder="Email" />
<div id="step1-error" class="error"></div>
<button id="next-1">Next</button>
</div>

<div id="step-2" class="step" hidden>
<h2>Step 2: Address</h2>
<input id="address" type="text" placeholder="Address" />
<div id="step2-error" class="error"></div>
<button id="back-2">Back</button>
<button id="next-2">Next</button>
</div>

<div id="step-3" class="step" hidden>
<h2>Step 3: Review</h2>
<div id="review"></div>
<button id="back-3">Back</button>
<button id="submit-btn">Submit</button>
</div>

<div id="thank-you" hidden>Thank you, <span id="ty-name"></span>!</div>

<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
input { display: block; margin-bottom: 0.5rem; padding: 0.4rem; width: 240px; }
.error { color: #dc2626; min-height: 1.2em; margin-bottom: 0.5rem; }
button { margin-right: 0.5rem; padding: 0.4rem 0.9rem; }
`;

const APP_JS_STARTER = `const state = { name: '', email: '', address: '' };

function showStep(n) {
  // TODO: hide every element with class "step" (element.hidden = true), then un-hide #step-<n>
  // (e.g. showStep(2) un-hides #step-2).
}

document.getElementById('next-1').addEventListener('click', function () {
  // TODO:
  //  - read #name's and #email's .value
  //  - if EITHER is empty, set #step1-error's textContent to 'Name and email are required' and
  //    do NOT advance
  //  - otherwise: clear #step1-error's textContent, save both values into state.name/state.email,
  //    and showStep(2)
});

document.getElementById('back-2').addEventListener('click', function () {
  showStep(1);
});

document.getElementById('next-2').addEventListener('click', function () {
  // TODO:
  //  - read #address's .value
  //  - if it's empty, set #step2-error's textContent to 'Address is required' and do NOT advance
  //  - otherwise: clear #step2-error's textContent, save it into state.address, call
  //    buildReview(), and showStep(3)
});

document.getElementById('back-3').addEventListener('click', function () {
  showStep(2);
});

function buildReview() {
  // TODO: set #review's innerHTML to three paragraphs built from state:
  // '<p>Name: ' + state.name + '</p><p>Email: ' + state.email + '</p><p>Address: ' + state.address + '</p>'
}

document.getElementById('submit-btn').addEventListener('click', function () {
  // TODO: hide #step-3, un-hide #thank-you, and set #ty-name's textContent to state.name
});

showStep(1);
`;

const APP_JS_SOLUTION = `const state = { name: '', email: '', address: '' };

function showStep(n) {
  document.querySelectorAll('.step').forEach(function (step) {
    step.hidden = true;
  });
  document.getElementById('step-' + n).hidden = false;
}

document.getElementById('next-1').addEventListener('click', function () {
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const errorEl = document.getElementById('step1-error');
  if (!name || !email) {
    errorEl.textContent = 'Name and email are required';
    return;
  }
  errorEl.textContent = '';
  state.name = name;
  state.email = email;
  showStep(2);
});

document.getElementById('back-2').addEventListener('click', function () {
  showStep(1);
});

document.getElementById('next-2').addEventListener('click', function () {
  const address = document.getElementById('address').value;
  const errorEl = document.getElementById('step2-error');
  if (!address) {
    errorEl.textContent = 'Address is required';
    return;
  }
  errorEl.textContent = '';
  state.address = address;
  buildReview();
  showStep(3);
});

document.getElementById('back-3').addEventListener('click', function () {
  showStep(2);
});

function buildReview() {
  document.getElementById('review').innerHTML =
    '<p>Name: ' + state.name + '</p>' +
    '<p>Email: ' + state.email + '</p>' +
    '<p>Address: ' + state.address + '</p>';
}

document.getElementById('submit-btn').addEventListener('click', function () {
  document.getElementById('step-3').hidden = true;
  document.getElementById('thank-you').hidden = false;
  document.getElementById('ty-name').textContent = state.name;
});

showStep(1);
`;

const FRONTEND_TEST_CODE = `checkExists('starts on step 1', '#step-1:not([hidden])');
checkExists('step 2 is hidden initially', '#step-2[hidden]');

await click('#next-1');
checkExists('blocks advancing with empty required fields', '#step-1:not([hidden])');
checkText('shows a validation error for step 1', '#step1-error', 'Name and email are required');

await type('#name', 'Ama');
await type('#email', 'ama@example.com');
await click('#next-1');
checkExists('advances to step 2 once step 1 is valid', '#step-2:not([hidden])');
checkExists('step 1 is hidden after advancing', '#step-1[hidden]');

await click('#next-2');
checkExists('blocks advancing from step 2 without an address', '#step-2:not([hidden])');
checkText('shows a validation error for step 2', '#step2-error', 'Address is required');

await type('#address', '123 Main St');
await click('#next-2');
checkExists('advances to step 3 once step 2 is valid', '#step-3:not([hidden])');
checkText('review shows the entered name', '#review p:nth-child(1)', 'Name: Ama');
checkText('review shows the entered email', '#review p:nth-child(2)', 'Email: ama@example.com');
checkText('review shows the entered address', '#review p:nth-child(3)', 'Address: 123 Main St');

await click('#back-3');
checkExists('back button from step 3 returns to step 2', '#step-2:not([hidden])');
await click('#next-2');
checkExists('re-advancing to step 3 keeps the data intact', '#step-3:not([hidden])');

await click('#submit-btn');
checkExists('shows the thank-you message after submitting', '#thank-you:not([hidden])');
checkExists('step 3 is hidden after submitting', '#step-3[hidden]');
checkText('thank-you message greets the entered name', '#ty-name', 'Ama');
`;

const task: ProjectTask = {
  id: 'se-py-fst-023',
  title: 'Multi-Step Form Wizard',
  difficulty: 'Hard',
  language: 'python',
  track: 'fullstack',
  category: 'Capstones',
  tags: ['capstone', 'state', 'validation', 'dom'],
  prompt:
    'Build a 3-step form wizard: each step blocks advancing until its fields are filled in, a shared ' +
    'state object survives Back/Next navigation, and the final step renders a live review from that ' +
    'state before submitting.',
  hints: [
    'showStep(n) always does the same two things: hide EVERY `.step` first, then un-hide just the one requested — that guarantees exactly one step is ever visible, no matter which was showing before.',
    'Each "Next" handler follows the same shape: read the field(s), check for empty, set/clear the matching error text, and only call `showStep(...)` (and save into `state`) in the valid branch — an early `return` in the invalid branch is what actually blocks advancing.',
    '`state` is declared once, outside every handler — every step\'s handler reads from and writes to the SAME object, which is exactly what makes data survive a Back-then-Next round trip.',
    'buildReview() only needs to run once, right before advancing to step 3 — it reads whatever is currently in `state`, so it\'s always correct no matter how many times the user has gone Back and Next.',
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
