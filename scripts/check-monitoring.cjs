require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { scrubReport, scrubText, scrubUrl } = require('../src/lib/monitoringScrub.ts');
const { analyticsAllowed } = require('../src/lib/analyticsPolicy.ts');

// Error reports: nothing that identifies a learner or holds what they typed may leave the browser.
const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJsZWFybmVyLTEyMyJ9.c2lnbmF0dXJlLXZhbHVl';
assert.equal(scrubText('Sync failed for kofi.mensah@st.ug.edu.gh'), 'Sync failed for [email]');
assert.equal(scrubText(`Authorization: Bearer ${jwt}`), 'Authorization: Bearer [token]');
assert.equal(scrubText(`token ${jwt} expired`), 'token [token] expired');
assert.equal(scrubText('POST /rest?apikey=anon-123&select=*'), 'POST /rest?apikey=[redacted]&select=*');
assert.ok(scrubText('x'.repeat(5000)).length <= 1001, 'Long strings such as pasted code are capped');

assert.equal(scrubUrl('https://darkworld.dev/#/labs/sqli?answer=admin'), 'https://darkworld.dev/#/labs/sqli');
assert.equal(scrubUrl('https://darkworld.dev/?email=a@b.co#/profile'), 'https://darkworld.dev/#/profile');
assert.equal(scrubUrl(`https://darkworld.dev/#access_token=${jwt}&type=recovery`), 'https://darkworld.dev/');

const report = scrubReport({
  message: 'Progress push failed for ama@example.com',
  user: { id: 'uuid-1', email: 'ama@example.com', ip_address: '1.2.3.4' },
  request: { url: 'https://darkworld.dev/?code=abc#/lesson/x', headers: { Authorization: `Bearer ${jwt}` }, cookies: { sb: 'session' }, data: { answer: 'secret' } },
  breadcrumbs: [
    { category: 'ui.input', message: 'typed answer' },
    { category: 'ui.keypress', message: 'p' },
    { category: 'console', message: `logged in as ama@example.com with ${jwt}` },
    { category: 'fetch', data: { url: 'https://x.supabase.co/rest/v1/progress?user_id=eq.uuid-1' } },
  ],
  exception: { values: [{ type: 'Error', value: 'Bad JWT ' + jwt, stacktrace: { frames: [{ filename: 'https://darkworld.dev/assets/index.js', lineno: 1 }] } }] },
});
const text = JSON.stringify(report);
assert.equal(report.user, undefined, 'No learner identity');
assert.deepEqual(report.request, { url: 'https://darkworld.dev/#/lesson/x' }, 'No headers, cookies, body or query');
assert.deepEqual(report.breadcrumbs.map(crumb => crumb.category), ['console', 'fetch'], 'Typed input is dropped');
assert.ok(!/@example\.com|eyJ|uuid-1|secret|session/.test(text), 'No emails, tokens, ids or answers anywhere: ' + text);
assert.equal(report.exception.values[0].stacktrace.frames[0].lineno, 1, 'Stack traces survive');

// Analytics: only on the production hostname, never for owners, never with Do Not Track.
const base = { hostname: 'darkworld.dev', expected: 'darkworld.dev', production: true, owner: false, doNotTrack: false };
assert.equal(analyticsAllowed(base), true);
assert.equal(analyticsAllowed({ ...base, expected: undefined }), false, 'Off until configured');
assert.equal(analyticsAllowed({ ...base, production: false }), false, 'Off in development');
assert.equal(analyticsAllowed({ ...base, hostname: 'darkworld-git-x.vercel.app' }), false, 'Off on preview deployments');
assert.equal(analyticsAllowed({ ...base, owner: true }), false, 'Owner visits are not counted');
assert.equal(analyticsAllowed({ ...base, doNotTrack: true }), false, 'Do Not Track is respected');

// Neither service may load in the base page: both are opt-in by configuration.
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert.ok(!/sentry|simpleanalytics/i.test(html), 'index.html loads no third-party monitoring');

console.log('Monitoring passed: error reports carry no learner identity, tokens, query strings or typed input; analytics is production-only, skips owners and honours Do Not Track.');
