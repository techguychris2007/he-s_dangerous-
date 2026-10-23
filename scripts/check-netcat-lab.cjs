require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const storage = new Map();
global.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
const { progressActions } = require('../src/state/progressStore.ts');
const { LABS } = require('../src/data/labs.ts');
const { TerminalEngine } = require('../src/labs/engine.ts');
const scenario = LABS.find(lab => lab.slug === 'pre-netcat-services').scenario;
for (const alias of ['nc', 'netcat']) {
  const engine = new TerminalEngine(scenario);
  const flags = new Set();
  const capture = flag => flags.add(flag);
  engine.run(alias + ' 10.10.10.20 9999', capture);
  assert.equal(flags.size, 0, 'Closed ports must not award evidence');
  engine.run(alias + ' 10.10.10.20 31337', capture);
  assert.ok(flags.has('flag{pre_netcat_banner_read}'), 'Visible banner flag must be captured');
  engine.run(alias + ' 10.10.10.20 31337', capture);
  assert.equal(flags.size, 1, 'Repeated banner is not a second proof');
  engine.run('curl http://10.10.10.20/health', capture);
  assert.equal(flags.size, scenario.totalFlags, 'Both service checks must complete the lab');
  for (const flag of flags) progressActions.captureFlag(scenario.id, flag, scenario.totalFlags);
  const saved = JSON.parse(storage.get('hackerhub.progress.v1'));
  assert.equal(saved.labFlags[scenario.id].length, scenario.totalFlags);
  assert.ok(saved.labCompletedAt[scenario.id], 'Completion must persist with its date');
}
console.log('Netcat banner and HTTP proofs complete and persist for both command aliases.');
