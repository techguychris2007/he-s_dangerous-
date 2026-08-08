import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Session Tokens

A minimal session system: logging in produces an opaque token, and that token (not the username or
password) is what proves identity on every later request — the same shape real cookie/session-based
auth uses, just without an actual HTTP cookie jar.
`;

const STARTER = `const USERS = { ama: 'hunter2', kofi: 'letmein' };
const SESSIONS = new Map();

function makeToken() {
  return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
}

function login(username, password) {
  // TODO: if USERS[username] === password, generate a token with makeToken(), store
  // SESSIONS.set(token, username), and return the token. Return null if the credentials are wrong.
}

function getCurrentUser(token) {
  // TODO: return the username associated with token, or null if the token isn't a valid session.
}

function logout(token) {
  // TODO: remove token from SESSIONS if present. Return true if it was removed, false if it wasn't there.
}

module.exports = { login, getCurrentUser, logout };
`;

const SOLUTION = `const USERS = { ama: 'hunter2', kofi: 'letmein' };
const SESSIONS = new Map();

function makeToken() {
  return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
}

function login(username, password) {
  if (USERS[username] !== password) return null;
  const token = makeToken();
  SESSIONS.set(token, username);
  return token;
}

function getCurrentUser(token) {
  return SESSIONS.get(token) || null;
}

function logout(token) {
  return SESSIONS.delete(token);
}

module.exports = { login, getCurrentUser, logout };
`;

const TEST_CODE = `const { login, getCurrentUser, logout } = require('./sessions');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

const token = login('ama', 'hunter2');
check('valid login returns a token', token !== null, true);
check('token is a non-empty string', typeof token === 'string' && token.length > 0, true);

check('wrong password returns null', login('ama', 'wrong'), null);
check('unknown user returns null', login('nobody', 'anything'), null);

check('valid token resolves to the right user', getCurrentUser(token), 'ama');
check('invalid token resolves to null', getCurrentUser('not-a-real-token'), null);

const secondToken = login('kofi', 'letmein');
check('two logins produce different tokens', token !== secondToken, true);
check('both sessions are independently valid', getCurrentUser(secondToken), 'kofi');

check('logout removes an active session', logout(token), true);
check('logged-out token no longer resolves', getCurrentUser(token), null);
check('logging out an already-gone token returns false', logout(token), false);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-011',
  title: 'Session Tokens',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'Auth & Sessions',
  tags: ['auth', 'sessions'],
  prompt: 'Build a minimal session system: login produces an opaque token backed by a server-side session map, and that token is what identifies the user on later calls.',
  hints: [
    '`makeToken()` is already written — it produces a random-enough opaque string.',
    'Check credentials first: `if (USERS[username] !== password) return null;` — only generate a token in the success path.',
    '`SESSIONS.set(token, username)` is the entire "session" — a Map from opaque tokens to usernames.',
    '`SESSIONS.get(token) || null` normalizes a missing key\'s `undefined` into the documented `null` return value; `SESSIONS.delete(token)` already returns true/false for "did this key exist," matching what `logout` needs to return.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('sessions.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('sessions.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Session Tokens', kind: 'node-js', entry: 'sessions.js', testCode: TEST_CODE }],
};

export default task;
