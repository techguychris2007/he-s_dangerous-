require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { LABS, LAB_DEPTH_UPGRADES } = require('../src/data/labs.ts');
const { TerminalEngine } = require('../src/labs/engine.ts');
const { getNode } = require('../src/labs/vfs.ts');
const { ADVANCED_LESSONS, ADVANCED_OFFENSIVE_MODULES } = require('../src/data/advancedOffensiveCurriculum.tsx');
const campaigns = LABS.filter(entry => entry.scenario.engagement?.origin === 'new-campaign');
for (const { scenario } of campaigns) {
  const engine = new TerminalEngine(scenario);
  const flags = new Set();
  const run = command => engine.run(command, flag => flags.add(flag));
  assert.match(run('engagement handoff').map(l => l.text).join('\n'), /blocked/);
  assert.equal(run('engagement cleanup')[0].kind, 'error');
  assert.equal(run('engagement retest')[0].kind, 'error');
  assert.match(run('engagement report /root/nonexistent.json').map(l => l.text).join('\n'), /removed/);
  assert.equal(run('engagement remediate')[0].kind, 'error');
  assert.ok(run(`nmap -sV ${scenario.engagement.followupIp}`).some(l => l.kind === 'error'), 'Follow-on host must remain gated');
  for (const command of scenario.engagement.walkthrough) {
    const output = run(command);
    // The two denied baseline/negative reads are intentional.
    const expectedDirectoryDenial = scenario.directoryMap && command.startsWith('secretsdump ') && (command.startsWith('secretsdump ordinary:') || engine.getSnapshot().events.some(event => event.kind === 'remediation' && event.hostIp === scenario.directoryMap.repairHostIp)) && output.some(line => /DCSync denied/.test(line.text));
    if (output.some(l => l.kind === 'error') && !expectedDirectoryDenial && !['cat /root/impact.txt', 'cat /root/proof.txt'].includes(command) && !(engine.remediated && command === scenario.engagement.privilegeCommand)) {
      throw new Error(`${scenario.id}: ${command}: ${JSON.stringify(output)}`);
    }
  }
  assert.equal(flags.size, scenario.totalFlags, `${scenario.id}: complete path must produce every distinct proof`);
  assert.equal(engine.engagementClosed, true);
  assert.equal(getNode(engine.scenario.network.find(h => h.ip === scenario.engagement.followupIp).root, ['tmp', 'assessment-marker']), null);
  assert.equal(engine.scenario.network.find(h => h.ip === scenario.engagement.followupIp).users.length, 0);
  assert.ok(scenario.network.find(h => h.ip === scenario.engagement.followupIp).users.length, 'Catalog must remain unchanged');
  const fresh = new TerminalEngine(scenario);
  assert.equal(fresh.seenFlags.size, 0, 'Attempts must not inherit evidence');
  assert.ok(fresh.scenario.network.find(h => h.ip === scenario.engagement.followupIp).users.length, 'Attempts restore scoped identity');
  console.log(`PASS ${scenario.id}: ${flags.size} proofs, retest and cleanup`);
}
// Isolate each legacy extension from its unchanged original exercise. Seed only its prerequisite
// evidence in the test fixture, then execute every new host/repair/report/cleanup operation.
for (const { scenario } of LABS.filter(entry => entry.scenario.engagement?.origin === 'depth-upgrade')) {
  const engine = new TerminalEngine(scenario);
  const e = scenario.engagement;
  const flags = new Set();
  e.initialFlags.slice(0, e.initialRequired).forEach(flag => engine.seenFlags.add(flag));
  for (const command of e.walkthrough) {
    const output = engine.run(command, flag => flags.add(flag));
    if (output.some(l => l.kind === 'error') && command !== 'cat /root/impact.txt' && !(engine.remediated && command === e.privilegeCommand)) {
      throw new Error(`${scenario.id} follow-on: ${command}: ${JSON.stringify(output)}`);
    }
  }
  assert.deepEqual([...flags].sort(), [e.accessFlag, e.retestFlag, e.cleanupFlag].sort());
  assert.equal(engine.engagementClosed, true);
}
const ids = LABS.map(l => l.slug);
assert.equal(new Set(ids).size, ids.length, 'No duplicate scenario IDs');
for (const { scenario } of LABS.filter(l => l.scenario.engagement)) {
  const e = scenario.engagement;
  assert.ok(e.initialFlags.length >= e.initialRequired, `${scenario.id}: insufficient declared original evidence`);
  assert.equal(scenario.totalFlags, e.initialRequired + 3);
  assert.equal(new Set(scenario.network.map(host => host.ip)).size, scenario.network.length);
}
console.log(`PASS catalog: ${LABS.length} labs, ${LAB_DEPTH_UPGRADES.length} depth upgrades, ${campaigns.length} new campaigns`);
assert.equal(ADVANCED_OFFENSIVE_MODULES.length, 5);
assert.equal(ADVANCED_LESSONS.length, 20);
assert.equal(new Set(ADVANCED_LESSONS.map(l => l.id)).size, ADVANCED_LESSONS.length);
for (const lesson of ADVANCED_LESSONS) {
  for (const lab of lesson.labs) assert.ok(ids.includes(lab), `${lesson.id}: unknown lab ${lab}`);
  assert.ok(lesson.sections.length >= 3 && lesson.outcomes.length >= 3 && lesson.comparison.rows.length >= 3);
  assert.ok(lesson.answer.length >= 100 && lesson.caseStudy.analysis.length >= 100);
  for (const q of lesson.quiz) assert.ok(q.correctIndex >= 0 && q.correctIndex < q.choices.length);
}
console.log('PASS curriculum: 5 modules, 20 substantive lessons, quizzes, worked cases and valid lab links');
