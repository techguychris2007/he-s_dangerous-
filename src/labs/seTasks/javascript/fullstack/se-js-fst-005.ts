import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Client-Side Comment Template

The other half of templating: this task's data comes back as plain JSON (no markup at all), and
the frontend builds its OWN HTML using a small JS template function — the pattern a client-rendered
single-page app uses instead of server-side rendering. Graded frontend-only, since there's no
server-rendering logic to test here.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Comments</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Comments</h1>
<div id="comments"></div>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
.comment { border-bottom: 1px solid #eee; padding: 0.5rem 0; }
.comment .author { font-weight: bold; }
`;

const APP_JS_STARTER = `function renderComment(comment) {
  // TODO: return an HTML string:
  // '<div class="comment"><span class="author">AUTHOR</span><p>TEXT</p></div>'
  // with AUTHOR/TEXT replaced by comment.author/comment.text.
}

async function loadComments() {
  // TODO:
  //  - fetch('/comments') and parse the JSON body
  //  - build one HTML string by calling renderComment() on each comment and joining the results
  //  - set #comments' innerHTML to that joined string
}

loadComments();
`;

const APP_JS_SOLUTION = `function renderComment(comment) {
  return '<div class="comment"><span class="author">' + comment.author + '</span><p>' + comment.text + '</p></div>';
}

async function loadComments() {
  const res = await fetch('/comments');
  const data = await res.json();
  const html = data.comments.map(renderComment).join('');
  document.getElementById('comments').innerHTML = html;
}

loadComments();
`;

const FRONTEND_TEST_CODE = `checkCount('renders one comment block per comment', '#comments .comment', 2);
checkText('first comment author', '#comments .comment:first-child .author', 'Ama');
checkText('first comment text', '#comments .comment:first-child p', 'Great post!');
checkText('second comment author', '#comments .comment:nth-child(2) .author', 'Kofi');
`;

const FETCH_FIXTURES = {
  '/comments': {
    comments: [
      { author: 'Ama', text: 'Great post!' },
      { author: 'Kofi', text: 'Thanks for sharing.' },
    ],
  },
};

const task: ProjectTask = {
  id: 'se-js-fst-005',
  title: 'Client-Side Comment Template',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'fullstack',
  category: 'Templating',
  tags: ['templating', 'client-side-rendering'],
  prompt: 'Fetch plain JSON (no markup at all) and build the HTML yourself with a small JS template function — the client-rendered counterpart to server-side templates.',
  hints: [
    'A function that returns a string built from its argument IS a template function — `renderComment` just needs string concatenation with `comment.author`/`comment.text` interpolated.',
    '`data.comments.map(renderComment)` calls your template function once per comment, producing an array of HTML strings.',
    "`.join('')` combines that array into one string with nothing between entries — ready to drop straight into `innerHTML`.",
    'The `/comments` endpoint returns plain data, no HTML — all the rendering happens in app.js this time.',
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
  targets: [{ id: 'frontend', label: 'Frontend', kind: 'dom', entry: 'index.html', testCode: FRONTEND_TEST_CODE, fetchFixtures: FETCH_FIXTURES }],
};

export default task;
