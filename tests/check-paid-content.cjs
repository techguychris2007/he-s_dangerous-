// Checks that paid content survives publishing: every paid lesson, rebuilt in the app from its
// downloaded element tree (src/features/billing/lib/paidLessonTree.ts), renders exactly the same HTML as the original
// component, and every paid lab payload is the full scenario.
require('../scripts/register-typescript.cjs');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { MemoryRouter } = require('react-router-dom');
const { load, lessonPayload, labPayload } = require('../scripts/paid-content.cjs');
const { renderNode } = require('../src/features/billing/lib/paidLessonTree.ts');

const html = element => renderToStaticMarkup(React.createElement(MemoryRouter, null, element));

(async () => {
  const { paidLessons, paidLabs, LABS } = load();
  for (const [id, { lesson }] of paidLessons) {
    const original = lesson.Content.$$typeof === Symbol.for('react.lazy') ? (await lesson.Content._payload._result()).default : lesson.Content;
    const payload = JSON.parse(JSON.stringify(await lessonPayload(id)));
    assert.equal(html(renderNode(payload.tree)), html(React.createElement(original)), `lesson ${id} renders differently after publishing`);
    assert.ok(Array.isArray(payload.quiz) && Array.isArray(payload.questions), `lesson ${id} payload is missing its quiz or questions`);
  }
  for (const slug of paidLabs.keys()) {
    const payload = JSON.parse(JSON.stringify(labPayload(slug)));
    assert.deepEqual(payload.scenario, JSON.parse(JSON.stringify(LABS.find(entry => entry.slug === slug).scenario)), `lab ${slug} payload differs from its scenario`);
  }
  console.log(`Paid content OK — ${paidLessons.size} lessons render identically from their published form; ${paidLabs.size} lab payloads are complete.`);
})().catch(error => { console.error(error.message); process.exit(1); });
