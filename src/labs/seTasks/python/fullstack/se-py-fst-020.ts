import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Tab Panel Router

The ARIA tabs pattern: exactly one tab is \`aria-selected="true"\` at a time, and exactly one panel
is visible — both driven by the same click handler, kept perfectly in sync by construction (never
two separate pieces of state that could drift apart).
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Tab Panel Router</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Account</h1>
<div role="tablist">
<button id="tab-1" role="tab" aria-selected="true">Profile</button>
<button id="tab-2" role="tab" aria-selected="false">Settings</button>
</div>
<div id="panel-1" role="tabpanel">Profile content</div>
<div id="panel-2" role="tabpanel" hidden>Settings content</div>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
[role="tab"] { padding: 0.4rem 0.9rem; margin-right: 0.25rem; }
[role="tab"][aria-selected="true"] { font-weight: bold; }
`;

const APP_JS_STARTER = `const tabs = document.querySelectorAll('[role="tab"]');

tabs.forEach(function (tab) {
  tab.addEventListener('click', function () {
    // TODO:
    //  - set every tab's aria-selected to 'false', then set THIS tab's to 'true'
    //  - hide every element with role="tabpanel", then un-hide the one matching this tab
    //    (a tab with id 'tab-N' matches the panel with id 'panel-N')
  });
});
`;

const APP_JS_SOLUTION = `const tabs = document.querySelectorAll('[role="tab"]');

tabs.forEach(function (tab) {
  tab.addEventListener('click', function () {
    tabs.forEach(function (t) {
      t.setAttribute('aria-selected', 'false');
    });
    tab.setAttribute('aria-selected', 'true');

    document.querySelectorAll('[role="tabpanel"]').forEach(function (p) {
      p.hidden = true;
    });
    const panelId = 'panel-' + tab.id.split('-')[1];
    document.getElementById(panelId).hidden = false;
  });
});
`;

const FRONTEND_TEST_CODE = `checkAttr('tab 1 starts selected', '#tab-1', 'aria-selected', 'true');
checkAttr('tab 2 starts unselected', '#tab-2', 'aria-selected', 'false');
checkExists('panel 1 starts visible', '#panel-1:not([hidden])');
checkExists('panel 2 starts hidden', '#panel-2[hidden]');

await click('#tab-2');
checkAttr('tab 2 becomes selected', '#tab-2', 'aria-selected', 'true');
checkAttr('tab 1 becomes unselected', '#tab-1', 'aria-selected', 'false');
checkExists('panel 2 becomes visible', '#panel-2:not([hidden])');
checkExists('panel 1 becomes hidden', '#panel-1[hidden]');

await click('#tab-1');
checkAttr('tab 1 selected again', '#tab-1', 'aria-selected', 'true');
checkExists('panel 1 visible again', '#panel-1:not([hidden])');
`;

const task: ProjectTask = {
  id: 'se-py-fst-020',
  title: 'Tab Panel Router',
  difficulty: 'Medium',
  language: 'python',
  track: 'fullstack',
  category: 'SPA Routing',
  tags: ['spa', 'routing', 'aria', 'dom'],
  prompt: "Implement the ARIA tabs pattern: clicking a tab updates aria-selected on every tab AND shows its matching panel — both driven from the same click handler.",
  hints: [
    'Reset ALL tabs to unselected first (`tabs.forEach(...)`), THEN mark just the clicked one selected — this guarantees exactly one is ever selected, no matter which was selected before.',
    'Same two-step shape for panels: hide every `[role="tabpanel"]`, then un-hide only the matching one.',
    '`tab.id.split(\'-\')[1]` pulls the number back out of an id like `\'tab-2\'` — giving you `\'2\'`, which you can then prefix with `\'panel-\'` to find the matching panel.',
    'Both pieces of state (which tab is selected, which panel is visible) update inside the SAME click handler — that\'s what keeps them from ever falling out of sync with each other.',
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
