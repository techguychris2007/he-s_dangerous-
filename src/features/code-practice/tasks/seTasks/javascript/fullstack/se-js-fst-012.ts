import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Star Rating Component

A component factory producing an interactive 1-N star rating: click any star to set the rating to
its position, with every star up to and including it shown as "filled." Two independent instances,
each with its own private rating state.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Star Rating</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Rate this product</h1>
<div id="rating-1"></div>
<h1>Rate the seller</h1>
<div id="rating-2"></div>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
.star { font-size: 1.5rem; cursor: pointer; color: #ccc; }
.star.filled { color: #f59e0b; }
`;

const APP_JS_STARTER = `function createStarRating(max) {
  // TODO: build and return a <div class="star-rating"> containing \`max\` <span class="star">
  // elements (textContent '★' for each), appended as children in order.
  // Clicking a star should set EVERY star from the first up to AND INCLUDING the clicked one to
  // have class "filled", and remove "filled" from every star after it.
  // Hint: give each star a data-index attribute (1-based) when you create it, so a click listener
  // can tell which position was clicked.
}

document.getElementById('rating-1').appendChild(createStarRating(5));
document.getElementById('rating-2').appendChild(createStarRating(3));
`;

const APP_JS_SOLUTION = `function createStarRating(max) {
  const container = document.createElement('div');
  container.className = 'star-rating';

  const stars = [];
  for (let i = 1; i <= max; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    star.textContent = '★';
    star.dataset.index = String(i);
    stars.push(star);
    container.appendChild(star);
  }

  container.addEventListener('click', function (e) {
    if (!e.target.dataset.index) return;
    const clicked = Number(e.target.dataset.index);
    stars.forEach(function (star, i) {
      star.classList.toggle('filled', i < clicked);
    });
  });

  return container;
}

document.getElementById('rating-1').appendChild(createStarRating(5));
document.getElementById('rating-2').appendChild(createStarRating(3));
`;

const FRONTEND_TEST_CODE = `checkCount('first rating has 5 stars', '#rating-1 .star', 5);
checkCount('second rating has 3 stars', '#rating-2 .star', 3);
checkCount('no stars filled initially', '#rating-1 .star.filled', 0);

await click('#rating-1 .star[data-index="3"]');
checkCount('clicking the 3rd star fills exactly 3 stars', '#rating-1 .star.filled', 3);
checkExists('the 1st star is filled', '#rating-1 .star[data-index="1"].filled');
checkExists('the 3rd star is filled', '#rating-1 .star[data-index="3"].filled');
checkExists('the 4th star is NOT filled', '#rating-1 .star[data-index="4"]:not(.filled)');

checkCount('the second rating widget is unaffected', '#rating-2 .star.filled', 0);

await click('#rating-1 .star[data-index="1"]');
checkCount('clicking a lower star reduces the fill', '#rating-1 .star.filled', 1);
`;

const task: ProjectTask = {
  id: 'se-js-fst-012',
  title: 'Star Rating Component',
  difficulty: 'Hard',
  language: 'javascript',
  track: 'fullstack',
  category: 'Component Patterns',
  tags: ['components', 'dom', 'events'],
  prompt: 'Build an interactive star-rating component factory: clicking a star fills every star up to and including it, and multiple instances stay fully independent.',
  hints: [
    'Build all `max` stars in a loop, giving each one `star.dataset.index = String(i)` so you can identify which one was clicked later — and keep a plain array (`stars`) of them for the click handler to loop over.',
    'One click listener on the CONTAINER (event delegation, same pattern as the Blog Platform/Poll App capstones) handles clicks on any star, current or future.',
    '`e.target.dataset.index` tells you which star was clicked; if it\'s missing (a click landed on the container itself, not a star), return early.',
    '`star.classList.toggle(\'filled\', i < clicked)` — the two-argument form of `toggle` FORCES the class on or off based on a condition, rather than flipping it — exactly what you need to set the fill state from scratch on every click, not just flip whatever was there before.',
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
