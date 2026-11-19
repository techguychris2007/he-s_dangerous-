import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Accessible Form Errors

A visible red border or error text alone isn't enough — a screen reader needs \`aria-invalid\` and
\`aria-describedby\` wired up in JS to actually announce the problem. This task practices the real
ARIA attributes, not just the visual styling.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Accessible Form</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Sign Up</h1>
<label for="email">Email</label>
<input id="email" type="text" value="" />
<div id="email-error" class="error" hidden></div>
<button id="submit">Submit</button>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
input { display: block; margin: 0.5rem 0; padding: 0.4rem; }
.error { color: #dc2626; margin-bottom: 0.5rem; }
`;

const APP_JS_STARTER = `document.getElementById('submit').addEventListener('click', function () {
  const input = document.getElementById('email');
  const error = document.getElementById('email-error');
  const isValid = input.value.includes('@');

  // TODO:
  //  - if isValid: set input's aria-invalid attribute to 'false', remove its aria-describedby
  //    attribute, and hide the error (error.hidden = true)
  //  - if NOT valid: set input's aria-invalid attribute to 'true', set its aria-describedby
  //    attribute to 'email-error', set error's textContent to 'Email must contain @', and show it
  //    (error.hidden = false)
});
`;

const APP_JS_SOLUTION = `document.getElementById('submit').addEventListener('click', function () {
  const input = document.getElementById('email');
  const error = document.getElementById('email-error');
  const isValid = input.value.includes('@');

  if (isValid) {
    input.setAttribute('aria-invalid', 'false');
    input.removeAttribute('aria-describedby');
    error.hidden = true;
  } else {
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', 'email-error');
    error.textContent = 'Email must contain @';
    error.hidden = false;
  }
});
`;

const FRONTEND_TEST_CODE = `await click('#submit');
checkAttr('marks an empty email as invalid', '#email', 'aria-invalid', 'true');
checkAttr('points to the error message via aria-describedby', '#email', 'aria-describedby', 'email-error');
checkText('shows the error message text', '#email-error', 'Email must contain @');

await type('#email', 'ama@example.com');
await click('#submit');
checkAttr('clears aria-invalid once the email is valid', '#email', 'aria-invalid', 'false');
checkAttr('removes aria-describedby once valid', '#email', 'aria-describedby', null);
`;

const task: ProjectTask = {
  id: 'se-js-fst-017',
  title: 'Accessible Form Errors',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'fullstack',
  category: 'Accessibility',
  tags: ['accessibility', 'aria', 'forms'],
  prompt: 'Wire up real ARIA attributes (aria-invalid, aria-describedby) on a form field when validation fails — a screen reader needs these, not just a red border.',
  hints: [
    "`input.setAttribute('aria-invalid', 'true')` and `'false'` are STRINGS, not booleans — ARIA attribute values are always strings even for true/false states.",
    "`aria-describedby` should point at the error element's id (`'email-error'`) — that's the mechanism a screen reader uses to actually read the error text aloud when the field gets focus.",
    "On the valid path, `input.removeAttribute('aria-describedby')` — there's no error to describe anymore, so the attribute shouldn't just be set to an empty string, it should be gone.",
    "`error.hidden = true/false` is a real DOM property (the `hidden` global HTML attribute) — toggling it show/hides the element without touching any CSS classes.",
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
