require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { SIEM_LABS } = require('../src/labs/siemScenarios.ts');
const { matchesQuery } = require('../src/labs/siemTypes.ts');
const { assessInvestigationStage } = require('../src/labs/investigation.ts');
const cases = SIEM_LABS.filter(lab => lab.investigation);
assert.equal(cases.length, 3);
let checkpoints = 0;
for (const lab of cases) {
  const data = lab.investigation;
  const completed = [];
  assert.equal(data.stages.length, lab.totalFlags);
  assert.equal(new Set(lab.entries.map(entry => entry.evidenceId)).size, lab.entries.length);
  assert.ok(lab.entries.every(entry => !/flag\{/i.test(entry.line)), 'Searchable logs must not contain completion proofs');
  for (let index = 0; index < data.stages.length; index++) {
    const stage = data.stages[index];
    const found = lab.entries.filter(entry => stage.availableEvidence.includes(entry.evidenceId) && matchesQuery(entry, stage.hint)).map(entry => entry.evidenceId);
    for (const id of stage.requiredEvidence) assert.ok(found.includes(id), lab.id + '/' + stage.id + ': hint must retrieve ' + id);
    const assess = (proofs, observed, selected, choice) => assessInvestigationStage(data, stage.id, proofs, observed, selected, choice);
    assert.equal(assess(completed, [], stage.requiredEvidence, stage.correctIndex).passed, false, 'Reject uninspected evidence');
    assert.equal(assess(completed, found, [], stage.correctIndex).passed, false);
    assert.equal(assess(completed, found, stage.requiredEvidence, (stage.correctIndex + 1) % stage.choices.length).passed, false);
    if (index) assert.equal(assess([], found, stage.requiredEvidence, stage.correctIndex).passed, false, 'Reject skipped stages');
    const decoy = stage.availableEvidence.find(id => !stage.requiredEvidence.includes(id));
    if (decoy) assert.equal(assess(completed, [...found, decoy], [...stage.requiredEvidence, decoy], stage.correctIndex).passed, false);
    const result = assess(completed, found, stage.requiredEvidence, stage.correctIndex);
    assert.equal(result.passed, true, lab.id + '/' + stage.id + ': correct evidence should pass');
    completed.push(result.proof);
    assert.deepEqual(JSON.parse(JSON.stringify(completed)), completed);
    checkpoints++;
  }
  assert.equal(completed.length, lab.totalFlags);
}
const record = { eventType: 'SigninLogs', line: 'host=WS-14 user=maya EventID=4624 msg="Failed password" port=443 src=192.0.2.1' };
assert.equal(matchesQuery(record, 'host=WS-99'), false);
assert.equal(matchesQuery(record, 'host=WS-99 "Failed password"'), false);
assert.equal(matchesQuery(record, 'host=WS-14 EventID=4625'), false);
assert.equal(matchesQuery(record, 'host=WS-14 EventID=4624'), true);
assert.equal(matchesQuery(record, 'SigninLogs | where UserPrincipalName == "maya"'), true);
assert.equal(matchesQuery(record, 'SigninLogs | where UserPrincipalName == "other"'), false);
assert.equal(matchesQuery(record, 'host=WS-*'), true);
assert.equal(matchesQuery(record, 'port 443 and host 192.0.2.2'), false);
assert.equal(matchesQuery(record, 'port 443 and host 192.0.2.1'), true);
assert.equal(matchesQuery(record, 'unseen | stats count'), false);
for (const lab of SIEM_LABS.filter(lab => !lab.investigation)) {
  const flags = new Set(lab.entries.filter(entry => lab.hints.some(hint => matchesQuery(entry, hint))).flatMap(entry => entry.line.match(/flag\{[^}]+\}/gi) ?? []));
  assert.equal(flags.size, lab.totalFlags, lab.id + ': existing hints must reach all proofs');
}
console.log(cases.length + ' incident chains / ' + checkpoints + ' checkpoints passed, including negative controls and existing SIEM proof paths.');
