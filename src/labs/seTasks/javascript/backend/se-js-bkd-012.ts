import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Password Hashing (Toy)

Never store a plaintext password — hash it, and verify by hashing the attempt and comparing hashes.

The browser's real crypto API (\`crypto.subtle.digest\`) is asynchronous, and this Worker's runner
captures output the instant your script's top-level code finishes running (before any pending
Promise continuation gets a chance to execute) — so a genuinely-async hash would silently produce
nothing. This task uses a small hand-rolled synchronous hash instead, purely to practice the
salt-then-hash SHAPE of real auth code. (The Python backend track's equivalent task uses the real
\`hashlib\`, since Python's runner has no such restriction — see se-py-bkd-012.)
`;

const STARTER = `function simpleHash(text) {
  // A deliberately simple, deterministic (NOT cryptographically secure) hash — good enough to
  // practice the salt-then-hash pattern, not to protect a real password.
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16);
}

function makeSalt() {
  return Math.random().toString(16).slice(2, 10);
}

function hashPassword(password, salt) {
  // TODO: if salt isn't given, generate one with makeSalt(). Return { salt, hash: simpleHash(salt
  // + password) }.
}

function verifyPassword(password, stored) {
  // TODO: stored is a { salt, hash } object from hashPassword. Return true if hashing password
  // with the SAME salt produces the same hash, false otherwise.
}

module.exports = { simpleHash, hashPassword, verifyPassword };
`;

const SOLUTION = `function simpleHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16);
}

function makeSalt() {
  return Math.random().toString(16).slice(2, 10);
}

function hashPassword(password, salt) {
  const actualSalt = salt || makeSalt();
  return { salt: actualSalt, hash: simpleHash(actualSalt + password) };
}

function verifyPassword(password, stored) {
  const check = hashPassword(password, stored.salt);
  return check.hash === stored.hash;
}

module.exports = { simpleHash, hashPassword, verifyPassword };
`;

const TEST_CODE = `const { hashPassword, verifyPassword } = require('./auth');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

const record = hashPassword('correct-horse-battery-staple');
check('hash result has a salt', typeof record.salt === 'string' && record.salt.length > 0, true);
check('hash result has a hash', typeof record.hash === 'string' && record.hash.length > 0, true);
check('hash is not the plaintext password', record.hash !== 'correct-horse-battery-staple', true);

check('correct password verifies', verifyPassword('correct-horse-battery-staple', record), true);
check('wrong password fails verification', verifyPassword('wrong-password', record), false);

const record2 = hashPassword('correct-horse-battery-staple');
check('same password hashed twice gets different salts', record.salt !== record2.salt, true);
check('...and therefore different hashes too', record.hash !== record2.hash, true);
check('both still verify correctly despite different salts', verifyPassword('correct-horse-battery-staple', record2), true);

const fixed = hashPassword('test123', 'abc123');
check('an explicit salt is used as-is', fixed.salt, 'abc123');

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-012',
  title: 'Password Hashing (Toy)',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'Auth & Sessions',
  tags: ['auth', 'hashing', 'security'],
  prompt: 'Hash passwords with a per-user random salt using a given toy hash function, then verify an attempt by re-hashing it with the stored salt and comparing.',
  hints: [
    '`makeSalt()` and `simpleHash()` are already written for you — `hashPassword` just wires them together.',
    '`salt || makeSalt()` generates one only when none is given, exactly like a default-parameter pattern.',
    'Store BOTH the salt and the hash — you cannot verify later without knowing which salt was used.',
    '`verifyPassword` re-hashes the attempt with the SAME stored salt (`hashPassword(password, stored.salt)`) and compares the resulting hash to the stored one — never compare plaintext passwords directly.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('auth.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('auth.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Password Hashing (Toy)', kind: 'node-js', entry: 'auth.js', testCode: TEST_CODE }],
};

export default task;
