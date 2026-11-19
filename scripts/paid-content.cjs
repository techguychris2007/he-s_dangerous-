// Shared by the production build (vite.config.ts → scripts/build-public-content.cjs) and the publisher
// (scripts/publish-paid-content.cjs). It loads the full curriculum and lab catalogue from source, then
// works out:
//   * which labs and lessons are paid (src/data/planTiers.ts),
//   * the public lab catalogue: free labs in full, paid labs as stubs without hosts, files, flags,
//     hints or objectives,
//   * the private files: each paid lab's full scenario and each paid lesson's body, quiz and questions.
// Paid lesson bodies are React components; they are stored as a plain element tree (see
// serializeElement) that src/lib/paidContent.ts turns back into React elements.
require('./register-typescript.cjs');
for (const extension of ['.css', '.jpg', '.png', '.svg', '.webp']) require.extensions[extension] = module => { module.exports = ''; };
const React = require('react');

let cache;
function load() {
  if (cache) return cache;
  const { LABS } = require('../src/data/labs.ts');
  const { MODULES } = require('../src/data/curriculum.ts');
  const { labPlan, lessonPlan } = require('../src/data/planTiers.ts');
  const { lessonQuestions } = require('../src/data/lessonQuestions.ts');
  const { labReference } = require('../src/labs/labReference.ts');
  const paidLabs = new Map();
  for (const entry of LABS) { const plan = labPlan(entry.slug); if (plan !== 'free') paidLabs.set(entry.slug, plan); }
  const paidLessons = new Map();
  for (const module of MODULES) module.lessons.forEach((lesson, index) => {
    const plan = lessonPlan(module.slug, index);
    if (plan !== 'free') paidLessons.set(lesson.id, { plan, lesson, module: module.slug });
  });
  cache = { LABS, MODULES, paidLabs, paidLessons, lessonQuestions, labReference };
  return cache;
}

/** What a catalogue card, filter or count needs, and nothing that solves the lab. */
function labStub(scenario) {
  return {
    id: scenario.id,
    title: scenario.title,
    difficulty: scenario.difficulty,
    category: scenario.category,
    briefing: scenario.briefing,
    narrative: scenario.narrative,
    totalFlags: scenario.totalFlags,
    objectives: scenario.objectives.map(() => 'Locked'),
    hints: [],
    attacker: { hostname: 'kali', user: 'root', root: { type: 'dir', children: {} } },
    network: [],
    ...(scenario.webApplication ? { webApplication: {} } : {}),
    ...(scenario.directoryMap ? { directoryMap: {} } : {}),
    locked: true,
  };
}

function publicLabEntries() {
  const { LABS, paidLabs } = load();
  return LABS.map(entry => paidLabs.has(entry.slug) ? { slug: entry.slug, scenario: labStub(entry.scenario) } : entry);
}

// Lesson display components that stay components (they keep their own behaviour, such as the copy
// button). Everything else is expanded into plain elements.
function leafComponents() {
  return new Map([
    [require('../src/components/lesson/CodeBlock.tsx').default, 'CodeBlock'],
    [require('../src/components/lesson/Callout.tsx').default, 'Callout'],
    [require('../src/components/lesson/PracticeTasksCallout.tsx').default, 'PracticeTasksCallout'],
    [require('../src/content/CurriculumArticle.tsx').default, 'CurriculumArticle'],
  ]);
}

function assertPlain(value, where) {
  if (typeof value === 'function' || typeof value === 'symbol') throw new Error(`${where} cannot be published (${typeof value})`);
  if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) assertPlain(item, `${where}.${key}`);
}

/** React element → JSON. Strings stay strings; {t} is an HTML element, {k} a known component,
 *  {f} a fragment, {$el} an element passed as a prop. Function components without hooks are
 *  expanded by calling them, exactly as React would render them. */
function serializeElement(node, leaves, where) {
  if (node === null || node === undefined || typeof node === 'boolean') return null;
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(item => serializeElement(item, leaves, where)).filter(item => item !== null);
  if (!React.isValidElement(node)) throw new Error(`${where}: unsupported lesson node`);
  const { children, ...rest } = node.props ?? {};
  const props = {};
  for (const [key, value] of Object.entries(rest)) props[key] = React.isValidElement(value) ? { $el: serializeElement(value, leaves, where) } : value;
  assertPlain(props, `${where} props`);
  const kids = [].concat(serializeElement(children, leaves, where) ?? []);
  if (node.type === React.Fragment) return { f: 1, c: kids };
  if (typeof node.type === 'string') return { t: node.type, p: props, c: kids };
  const leaf = leaves.get(node.type);
  if (leaf) return { k: leaf, p: props, c: kids };
  if (typeof node.type === 'function') {
    try { return serializeElement(node.type(node.props), leaves, where); }
    catch (error) { throw new Error(`${where}: component ${node.type.name || 'anonymous'} could not be expanded (${error.message}). Add it to leafComponents().`); }
  }
  throw new Error(`${where}: unsupported element type`);
}

const LAZY = Symbol.for('react.lazy');

/** Lesson components are React.lazy(() => import(file)). Resolves the real component and the source
 *  file it came from (the build swaps paid lesson files for an empty stub). */
async function resolveLesson(Content) {
  if (Content?.$$typeof !== LAZY) return { component: Content, file: undefined };
  const exports = await Content._payload._result();
  const file = Object.values(require.cache).find(module => module.exports === exports)?.filename;
  return { component: exports.default, file };
}

async function lessonPayload(id) {
  const { paidLessons, lessonQuestions } = load();
  const { lesson, plan } = paidLessons.get(id);
  const leaves = leafComponents();
  const { component } = await resolveLesson(lesson.Content);
  const tree = serializeElement(React.createElement(component), leaves, `lesson ${id}`);
  const payload = { id, plan, tree, quiz: lesson.quiz ?? [], questions: lessonQuestions(lesson), keyTerms: lesson.keyTerms ?? [] };
  assertPlain(payload, `lesson ${id}`);
  return payload;
}

function labPayload(slug) {
  const { LABS, paidLabs, labReference } = load();
  const entry = LABS.find(item => item.slug === slug);
  const payload = { slug, plan: paidLabs.get(slug), scenario: entry.scenario, reference: labReference[slug] ?? null };
  assertPlain(payload, `lab ${slug}`);
  return payload;
}

/** Text that only a paid lesson or lab contains, used to prove the public build does not ship it. */
async function leakProbes() {
  const { LABS, MODULES, paidLabs, paidLessons } = load();
  // Text that is public on purpose: the lab catalogue, the free SIEM investigations (some reuse a
  // paid lab's evidence) and every lesson's outline (title, summary, outcomes).
  const { SIEM_LABS } = require('../src/labs/siemScenarios.ts');
  const outlines = MODULES.flatMap(module => module.lessons.map(({ id, slug, title, summary, objectives, prerequisite }) => ({ id, slug, title, summary, objectives, prerequisite })));
  // Free lessons are public too; a sentence a paid lesson shares with one is not a leak.
  const leaves = leafComponents();
  const freeLessons = [];
  for (const module of MODULES) for (const lesson of module.lessons) {
    if (paidLessons.has(lesson.id)) continue;
    const { component } = await resolveLesson(lesson.Content);
    freeLessons.push(serializeElement(React.createElement(component), leaves, `lesson ${lesson.id}`));
  }
  const free = JSON.stringify([publicLabEntries(), SIEM_LABS, outlines, freeLessons]);
  const freeFlags = new Set(free.match(/flag\{[^}"\\]{6,}\}/g) ?? []);
  const flags = new Set();
  for (const entry of LABS) {
    if (!paidLabs.has(entry.slug)) continue;
    for (const match of JSON.stringify(entry.scenario).matchAll(/flag\{[^}"\\]{6,}\}/g)) if (!freeFlags.has(match[0])) flags.add(match[0]);
  }
  const strings = [];
  const walk = node => { if (typeof node === 'string') strings.push(node); else if (Array.isArray(node)) node.forEach(walk); else if (node && typeof node === 'object') Object.values(node).forEach(walk); };
  const lessonText = new Map();
  for (const id of paidLessons.keys()) {
    const found = []; strings.length = 0; walk((await lessonPayload(id)).tree);
    // Plain ASCII runs survive minification byte for byte, so they can be searched for in dist/.
    for (const text of strings) {
      if (found.length >= 3) break;
      const run = /[A-Za-z0-9 ,.;:()-]{50,}/.exec(text)?.[0]?.slice(0, 50);
      if (run && !free.includes(run)) found.push(run);
    }
    lessonText.set(id, found);
  }
  return { flags: [...flags], lessonText };
}

/** Source files that hold only paid lesson bodies. A file shared with a free lesson is an error,
 *  because stubbing it would empty the free lesson too. */
async function paidLessonFiles() {
  const { MODULES, paidLessons } = load();
  const owners = new Map();
  for (const module of MODULES) for (const lesson of module.lessons) {
    const { file } = await resolveLesson(lesson.Content);
    if (!file) continue;
    if (!owners.has(file)) owners.set(file, []);
    owners.get(file).push(lesson.id);
  }
  const files = [];
  for (const [file, ids] of owners) {
    const paid = ids.filter(id => paidLessons.has(id));
    if (!paid.length) continue;
    if (paid.length !== ids.length) throw new Error(`${file} holds both free and paid lessons (${ids.join(', ')})`);
    files.push(file);
  }
  return files;
}

module.exports = { load, publicLabEntries, lessonPayload, labPayload, leakProbes, labStub, paidLessonFiles };
