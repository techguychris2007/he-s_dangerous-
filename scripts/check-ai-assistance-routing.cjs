const assert = require('node:assert/strict');
require('./register-typescript.cjs');
let requests = 0, localRequests = 0;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
let reply = () => json({ answer: 'Hosted answer', model: 'Hosted test model' });
const cacheModule = (modulePath, exports) => { const filename = require.resolve(modulePath); require.cache[filename] = { id: filename, filename, loaded: true, exports }; };
cacheModule('../src/lib/supabaseClient.ts', {
  supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'anon',
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'user-token' } } }) } },
});
globalThis.fetch = async (url, options) => {
  requests++;
  const body = JSON.parse(options.body);
  assert.ok(!('source' in body), 'Client routing preference must not change hosted API payload');
  assert.equal(body.stream, true, 'Hosted requests ask for a streamed answer');
  assert.equal(options.headers.Authorization, 'Bearer user-token', 'Hosted requests carry the user session, not the anon key');
  const result = reply();
  if (result instanceof Error) throw result;
  return result;
};
cacheModule('../src/lib/offlineLibrary.ts', { searchSavedLibrary: async () => { localRequests++; return { answer: 'Saved source passage', model: 'Offline library search', sourceMode: 'library' }; } });
const { askAiTutor, askCyberLabAi } = require('../src/lib/aiTutor.ts');
Object.defineProperty(navigator, 'onLine', { configurable: true, writable: true, value: true });
// Pull-based so a failure lands after earlier chunks were read (erroring a stream drops queued chunks).
const streamOf = (parts, failAfter = false) => new Response(new ReadableStream({
  pull(controller) {
    const part = parts.shift();
    if (part !== undefined) controller.enqueue(new TextEncoder().encode(part));
    else if (failAfter) controller.error(new TypeError('network lost'));
    else controller.close();
  },
}), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Dig-Model': 'Streamed test model' } });
(async () => {
  assert.equal((await askAiTutor({ question: 'Explain recursion' })).sourceMode, 'online');
  assert.equal(requests, 1);
  navigator.onLine = false;
  assert.equal((await askAiTutor({ question: 'Explain recursion' })).sourceMode, 'library');
  assert.equal(requests, 1, 'Offline requests must not contact hosted models');
  navigator.onLine = true;
  assert.equal((await askAiTutor({ question: 'Explain recursion' })).sourceMode, 'online', 'Reconnection restores hosted mode');
  await askCyberLabAi({ question: 'Reference material', mode: 'ask', source: 'library', context: { kind: 'lab', title: 'A lab' } });
  assert.equal(requests, 2, 'Explicit saved-library searches stay local');

  reply = () => streamOf(['Recursion is ', 'a function ', 'calling itself.']);
  const progress = [];
  const streamed = await askAiTutor({ question: 'Explain recursion' }, text => progress.push(text));
  assert.equal(streamed.answer, 'Recursion is a function calling itself.');
  assert.equal(streamed.model, 'Streamed test model');
  assert.deepEqual(progress, ['Recursion is ', 'Recursion is a function ', 'Recursion is a function calling itself.'], 'Each streamed chunk is shown as it arrives');
  reply = () => streamOf(['Partial answer'], true);
  const partial = await askAiTutor({ question: 'Explain recursion' });
  assert.match(partial.answer, /^Partial answer[\s\S]*Connection lost/, 'A dropped stream keeps the text that already arrived');
  assert.equal(partial.sourceMode, 'online');

  const beforeAuth = localRequests;
  reply = () => json({ error: 'Unauthorized' }, 401);
  await assert.rejects(askAiTutor({ question: 'Explain recursion' }), /Sign in again/);
  assert.equal(localRequests, beforeAuth, 'Authentication errors must remain visible');
  reply = () => json({ error: 'Unavailable' }, 503);
  assert.equal((await askAiTutor({ question: 'Explain recursion' })).sourceMode, 'library');
  reply = () => new TypeError('Failed to fetch');
  assert.equal((await askAiTutor({ question: 'Explain recursion' })).sourceMode, 'library');
  reply = () => json({ error: 'Invalid request' }, 400);
  await assert.rejects(askAiTutor({ question: 'Explain recursion' }), /Invalid request/);
  console.log('AI routing passed: online/offline/reconnection, explicit library mode, streamed and interrupted answers, service/network fallback, unchanged API payloads and visible authentication errors.');
})().catch(error => { console.error(error); process.exitCode = 1; });
