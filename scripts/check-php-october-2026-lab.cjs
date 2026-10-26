require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { LABS } = require('../src/data/labs.ts');
const { TerminalEngine } = require('../src/labs/engine.ts');

const entry = LABS.find((lab) => lab.slug === 'php-october-2026-critical-rce-chain');
assert.ok(entry, 'October 2026 PHP lab is registered');
const scenario = entry.scenario;
assert.equal(scenario.totalFlags, 6);
assert.equal(scenario.objectives.length, 9);
assert.equal(scenario.hints.length, scenario.objectives.length);

const engine = new TerminalEngine(scenario);
const flags = new Set();
const capture = (flag) => flags.add(flag);
for (const command of scenario.hints) engine.run(command, capture);

assert.equal(flags.size, scenario.totalFlags, 'every guided objective produces its expected evidence');
for (const expected of [
  'flag{php_8_4_26_below_october_2026_fixed_release}',
  'flag{multipart_oom_reaches_invalid_request_shutdown_state}',
  'flag{cve_2026_109618_modeled_www_data_rce}',
  'flag{stale_global_state_producer_survives_request_teardown}',
  'flag{cve_2026_109619_modeled_cross_request_uaf_rce}',
  'flag{php_8_4_27_blocks_both_october_2026_chains}',
]) assert.ok(flags.has(expected), `captured ${expected}`);

const safe = new TerminalEngine(scenario);
const safeFlags = new Set();
safe.run('curl http://10.10.206.21/health.php', (flag) => safeFlags.add(flag));
safe.run('curl -X POST -d "profile=unapproved-payload" http://10.10.206.21/upload.php', (flag) => safeFlags.add(flag));
assert.equal(safeFlags.size, 0, 'unapproved or baseline requests do not award evidence');

console.log('October 2026 PHP lab is registered, replayable, and safely gated to its documented profiles.');
