require('../scripts/register-typescript.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
for (const extension of ['.css', '.jpg', '.png', '.svg']) require.extensions[extension] = module => { module.exports = ''; };
const { searchAcademy, LEARNING_PATHS, ACADEMY_DESTINATIONS } = require('../src/app/layout/navigation.ts');
const { MODULES } = require('../src/features/curriculum/data/curriculum.ts');
const { matchPath } = require('react-router-dom');
const app = fs.readFileSync(require('node:path').join(__dirname, '../src/app/App.tsx'), 'utf8');
const routes = [...app.matchAll(/path="([^"]+)"/g)].map(match => match[1]).filter(route => route !== '*');
for (const item of ACADEMY_DESTINATIONS) assert.ok(routes.some(route => matchPath(route, item.to.split('?')[0])), 'Unreachable navigation destination: ' + item.to);
assert.equal(searchAcademy('admin').some(item => item.staff), false, 'Staff destinations must stay out of learner search');
assert.equal(searchAcademy('admin dashboard', true)[0].to, '/admin');
assert.equal(searchAcademy('  CODING   practice  ')[0].to, '/code-portal', 'Search must ignore case and extra spaces');
assert.equal(searchAcademy('SOC investigations')[0].to, '/soc-portal');
assert.ok(searchAcademy('OSI')[0].title.includes('OSI & TCP/IP'), 'Exact topic words must rank above incidental substrings in descriptions');
assert.equal(searchAcademy('no-such-lesson-xyz').length, 0);
assert.ok(searchAcademy('').length > 0, 'Empty query should offer useful starting points');
const { setOwnerSession, OWNER_TRACKS, isOwnerOnlyPath } = require('../src/features/account/lib/ownerSession.ts');
for (const path of LEARNING_PATHS.filter(path => !OWNER_TRACKS.has(path.track))) assert.ok(searchAcademy(path.title).some(item => item.to === path.to), 'Search must preserve track parameters');
assert.equal(searchAcademy('machine learning').concat(searchAcademy('build projects'), searchAcademy('C# & .NET')).some(item => isOwnerOnlyPath(item.to)), false, 'Owner-only portals and tracks must stay out of learner search');
// Owner modules arrive from the private bucket at runtime; register them from source as the app would.
const { registerOwnerCurriculum } = require('../src/features/curriculum/data/curriculum.ts');
const { curriculumModule } = require('../src/features/curriculum/content/curriculumDefinition.ts');
const { SE_MODULE_SOURCES, SE_ROADMAP } = require('../src/features/curriculum/data/softwareEngineeringCurriculum.ts');
const { DN_MODULE_SOURCES, DN_ROADMAP } = require('../src/features/curriculum/data/dotnetCurriculum.ts');
assert.equal(MODULES.some(module => module.slug.startsWith('dn-')), false, 'The app bundle must not include the C# & .NET modules');
registerOwnerCurriculum([...SE_MODULE_SOURCES, ...DN_MODULE_SOURCES].map(({ meta, lessons }) => curriculumModule(meta, lessons)), [...SE_ROADMAP, ...DN_ROADMAP]);
setOwnerSession(true);
for (const path of LEARNING_PATHS) assert.ok(searchAcademy(path.title).some(item => item.to === path.to), 'Owner search must include every track');
assert.ok(MODULES.some(module => module.slug.startsWith('dn-')), 'Owner curriculum must include the C# & .NET modules');
setOwnerSession(false);
assert.equal(MODULES.some(module => module.slug.startsWith('dn-')), false, 'Learner curriculum must hide the C# & .NET modules');
const lesson = MODULES.find(module => module.slug === 'networking').lessons[0];
assert.ok(searchAcademy(lesson.title).some(item => item.to === '/module/networking/lesson/' + lesson.slug), 'Lesson search must open the actual lesson route');
assert.ok(searchAcademy('security').length <= 9, 'Keep keyboard results manageable');

// Guided tour: the steps point at elements that exist, open where they say, and the card stays on screen.
const tour = require('../src/features/onboarding/lib/guidedTour.ts');
const navigationSource = fs.readFileSync(require('node:path').join(__dirname, '../src/app/layout/LearningNavigation.tsx'), 'utf8');
const ids = tour.TOUR_STEPS.map(step => step.id);
assert.equal(new Set(ids).size, ids.length, 'Tour step ids must be unique');
assert.equal(ids[0], 'welcome', 'The tour opens with the welcome');
assert.equal(ids.at(-1), 'finish', 'The tour ends with the finish step');
for (const step of tour.TOUR_STEPS) {
  assert.ok(step.title.trim() && step.body.trim(), 'Every tour step needs a title and body: ' + step.id);
  for (const name of [...(step.target ?? '').matchAll(/data-tour="([^"]+)"/g)].map(match => match[1])) {
    const declared = navigationSource.includes(`data-tour="${name}"`) || (name.startsWith('tab-') && navigationSource.includes('data-tour={`tab-${title.toLowerCase()}`}'));
    assert.ok(declared, 'Tour target is not marked in LearningNavigation: ' + name);
  }
}
// On desktop the sidebar is the only menu (the top tabs are hidden), so every menu target the tour
// points at must exist there too.
const sidebarSource = fs.readFileSync(require('node:path').join(__dirname, '../src/app/layout/Sidebar.tsx'), 'utf8');
for (const name of tour.TOUR_STEPS.flatMap(step => [...(step.target ?? '').matchAll(/data-tour="(tabs|tab-[a-z]+)"/g)].map(match => match[1]))) {
  assert.ok(sidebarSource.includes(`data-tour="${name}"`) || sidebarSource.includes(`'${name}')`), 'Tour target is missing from the desktop sidebar: ' + name);
}
for (const tab of tour.TOUR_STEPS.filter(step => step.target?.includes('data-tour="tab-'))) {
  const title = tab.target.match(/tab-([a-z]+)/)[1];
  assert.ok(new RegExp(`title: '${title}'`, 'i').test(navigationSource), 'Tour points at a tab that does not exist: ' + title);
}
assert.ok(routes.some(route => matchPath(route, tour.TOUR_START_PATH.split('?')[0])), 'The tour must finish on a real page');
assert.ok(LEARNING_PATHS.some(path => path.to === tour.TOUR_START_PATH && !OWNER_TRACKS.has(path.track)), 'The tour must start learners on a path every account can open');

assert.equal(tour.shouldAutoStart({ pathname: '/', handleSeen: true, record: null }), true);
assert.equal(tour.shouldAutoStart({ pathname: '/', handleSeen: false, record: null }), false, 'Wait for the cyber-name welcome');
assert.equal(tour.shouldAutoStart({ pathname: '/labs', handleSeen: true, record: null }), false, 'Only start on the Overview');
assert.equal(tour.shouldAutoStart({ pathname: '/', handleSeen: true, record: 'skipped' }), false, 'Never show a skipped tour again by itself');
assert.equal(tour.shouldAutoStart({ pathname: '/', handleSeen: true, record: 'completed' }), false);
const memory = new Map();
const store = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
assert.equal(tour.readTourRecord(store, 'user-1'), null);
tour.writeTourRecord(store, 'user-1', 'completed');
assert.equal(tour.readTourRecord(store, 'user-1'), 'completed');
assert.equal(tour.readTourRecord(store, 'user-2'), null, 'The tour is remembered per learner');
assert.equal(tour.readTourRecord({ getItem: () => { throw new Error('blocked'); } }, 'user-1'), 'skipped', 'Blocked storage must not show the tour on every visit');
assert.equal(tour.readTourRecord(undefined, 'user-1'), 'skipped');
assert.equal(tour.fillTourText('Ready, {handle}? Press {shortcut}.', { handle: 'NullWarden', shortcut: 'Ctrl K' }), 'Ready, NullWarden? Press Ctrl K.');
const searchStep = tour.TOUR_STEPS.find(step => step.id === 'search');
assert.equal(tour.fillTourText(searchStep.body, { handle: '', shortcut: '' }), 'Search jumps straight to any lesson, lab or page.', 'Touch devices get no keyboard shortcut sentence');
assert.ok(tour.fillTourText(searchStep.body, { handle: '', shortcut: 'Ctrl K' }).endsWith('Press Ctrl K from anywhere in the academy.'));

const desk = { width: 1366, height: 820 };
const card = { width: 400, height: 220 };
assert.deepEqual(tour.placeTourCard(null, card, desk), { mode: 'center' });
const tab = { top: 20, left: 600, width: 60, height: 50 };
const below = tour.placeTourCard(tab, card, desk);
assert.equal(below.mode, 'below');
assert.equal(below.top, 20 + 50 + 14);
assert.ok(below.left >= 16 && below.left + card.width <= desk.width - 16, 'The card stays inside the viewport');
assert.ok(Math.abs(below.left + below.arrowLeft - (600 + 30)) < 1, 'The arrow points at the element');
const corner = tour.placeTourCard({ top: 20, left: 1320, width: 30, height: 30 }, card, desk);
assert.equal(corner.left, desk.width - card.width - 16, 'A card near the right edge is pulled back on screen');
assert.ok(corner.arrowLeft <= card.width - 24, 'The arrow never leaves the card');
assert.equal(tour.placeTourCard({ top: 700, left: 600, width: 60, height: 50 }, card, desk).mode, 'above', 'No room below: go above');
assert.deepEqual(tour.placeTourCard({ top: 300, left: 600, width: 60, height: 50 }, { width: 400, height: 500 }, { width: 1366, height: 700 }), { mode: 'sheet', edge: 'bottom' }, 'No room either side: dock as a sheet');
assert.deepEqual(tour.placeTourCard(tab, card, { width: 375, height: 812 }), { mode: 'sheet', edge: 'bottom' }, 'Phones use a bottom sheet away from a top element');
const rail = tour.placeTourCard({ top: 74, left: 8, width: 237, height: 680 }, card, desk);
assert.equal(rail.mode, 'right', 'A tall element in the left-hand menu gets the card beside it');
assert.equal(rail.left, 8 + 237 + 14);
assert.ok(rail.top >= 16 && rail.top + card.height <= desk.height - 16, 'A card beside the menu stays on screen');
assert.ok(rail.arrowTop >= 24 && rail.arrowTop <= card.height - 24, 'Its arrow stays within the card');
assert.equal(tour.placeTourCard({ top: 320, left: 8, width: 237, height: 44 }, card, desk).mode, 'right', 'A sidebar link gets the card beside it');
assert.equal(tour.placeTourCard({ top: 20, left: 600, width: 60, height: 50 }, card, desk).mode, 'below', 'Top-bar elements keep the card below them');
assert.deepEqual(tour.placeTourCard({ top: 740, left: 300, width: 54, height: 54 }, card, { width: 375, height: 812 }), { mode: 'sheet', edge: 'top' }, 'A sheet moves to the top for an element near the bottom');

// After a deploy, an old tab reloads once for a missing chunk, and never loops.
const { shouldReloadForStaleBuild } = require('../src/app/staleBuildRecovery.ts');
assert.equal(shouldReloadForStaleBuild(null, 1_000_000), true);
assert.equal(shouldReloadForStaleBuild(1_000_000, 1_030_000), false, 'A second failure within a minute shows the error page');
assert.equal(shouldReloadForStaleBuild(1_000_000, 1_070_000), true);

console.log('Navigation passed: every destination resolves; track parameters, lesson lookup, normalization, staff and owner-only filtering verified; guided tour targets, start rules, memory and card placement verified; stale-build reload guard verified.');

// Visitors may browse the catalogues; workspaces and personal pages need an account.
const { isVisitorPath } = require('../src/app/layout/visitorPaths.ts');
for (const open of ['/roadmap', '/module/intro-to-cybersecurity', '/labs', '/library', '/soc-portal', '/code-portal']) assert.ok(isVisitorPath(open), 'Visitors should be able to browse ' + open);
for (const closed of ['/', '/lab/web-live-meridian-billing', '/module/x/lesson/y', '/library/some-book', '/progress', '/profile', '/admin', '/my-learning', '/siem-lab/x', '/code-task/x']) assert.equal(isVisitorPath(closed), false, 'Visitors must sign up before opening ' + closed);
for (const path of ['/roadmap', '/labs', '/library', '/soc-portal', '/code-portal']) assert.ok(routes.some(route => matchPath(route, path)), 'Visitor path has no route: ' + path);

// After sign-up a visitor returns to the page they tried to open, and only to an in-app page.
const sessionMemory = new Map();
globalThis.sessionStorage = { getItem: k => sessionMemory.get(k) ?? null, setItem: (k, v) => sessionMemory.set(k, String(v)), removeItem: k => sessionMemory.delete(k) };
const { rememberReturnTo, peekReturnTo, takeReturnTo } = require('../src/shared/lib/returnTo.ts');
rememberReturnTo('/lab/web-live-meridian-billing');
assert.equal(peekReturnTo(), '/lab/web-live-meridian-billing');
assert.equal(takeReturnTo(), '/lab/web-live-meridian-billing');
assert.equal(takeReturnTo(), '/', 'The return path applies once');
for (const unsafe of ['//evil.example', 'https://evil.example', '/\\evil.example', '/login?mode=signup', '/welcome']) { rememberReturnTo(unsafe); assert.equal(takeReturnTo(), '/', 'Unsafe or entry-page return path accepted: ' + unsafe); }

// The welcome page reads precomputed counts so phones skip the full catalogue download.
{
  const { catalogueCounts, render, target } = require('../scripts/catalogue-counts.cjs');
  assert.equal(fs.readFileSync(target, 'utf8'), render(catalogueCounts()), 'Catalogue counts are stale: run node scripts/catalogue-counts.cjs');
}
