require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { SIEM_LABS } = require('../src/labs/siemScenarios.ts');
const { matchesQuery } = require('../src/labs/siemTypes.ts');
const { assessInvestigationStage } = require('../src/labs/investigation.ts');
const cases = SIEM_LABS.filter(lab => lab.investigation);
assert.equal(cases.length, 10);
assert.equal(new Set(SIEM_LABS.map(lab => lab.id)).size, SIEM_LABS.length, 'No duplicate routes when upgrading existing labs');
const legacyProofs = {
  'siem-sentinel-impossible-travel': ['flag{sentinel_impossible_travel_ghana_to_kyiv_18_minutes}'],
  'siem-qradar-capital-one-ssrf-metadata-2019': ['flag{capital_one_waf_ssrf_metadata_confirmed}', 'flag{capital_one_tor_exit_node_s3_exfiltration_confirmed}'],
  'siem-sentinel-moveit-cl0p-2023': ['flag{moveit_2023_cve_2023_34362_sqli_exploitation_confirmed}', 'flag{moveit_2023_data_theft_no_encryption_extortion_confirmed}'],
  'siem-chronicle-dns-tunneling': ['flag{dns_tunneling_confirmed_via_txt_query_volume_and_entropy}'],
  'siem-suricata-notpetya-lateral-spread': ['flag{notpetya_medoc_supply_chain_entry_confirmed}', 'flag{notpetya_mbr_wipe_confirms_disguised_wiper_not_ransomware}'],
  'siem-qradar-insider-data-theft': ['flag{qradar_insider_theft_confirmed_pre_resignation_bulk_download}'],
  'siem-qradar-log4shell-exploitation': ['flag{log4shell_exploitation_confirmed_via_jndi_to_outbound_ldap_correlation}'],
};
const upgradedIds = Object.keys(legacyProofs);
const expandedIds = upgradedIds.slice(3);
for (const id of upgradedIds) {
  const lab = cases.find(item => item.id === id);
  assert.ok(lab, id + ': existing route must now expose its investigation');
  assert.equal(lab.investigation.stages.length, 8);
  assert.ok(lab.investigation.stages.some(stage => ['shodan', 'maltego', 'theharvester'].includes(stage.tool)), 'Chain must include a passive OSINT pivot');
  assert.ok(lab.investigation.stages.some(stage => stage.id === 'contain'));
  assert.equal(lab.investigation.stages.at(-1).id, 'recover');
  assert.deepEqual(lab.investigation.stages.slice(0, legacyProofs[id].length).map(stage => stage.proof), legacyProofs[id], 'Keep credit for earlier earned proofs');
  if (expandedIds.includes(id)) {
    assert.equal(lab.entries.length, 32, 'Expanded casefiles have four distinct records per checkpoint');
    assert.ok(lab.investigation.stages.some(stage => stage.requiredEvidence.length === 3), 'Require multi-source corroboration');
    assert.ok(lab.investigation.stages.some(stage => !stage.requiredEvidence.includes(stage.availableEvidence[1])), 'Evidence position cannot encode the answer');
  }
}
let checkpoints = 0;
for (const lab of cases) {
  const data = lab.investigation;
  const completed = [];
  assert.equal(data.stages.length, lab.totalFlags);
  assert.equal(new Set(lab.entries.map(entry => entry.evidenceId)).size, lab.entries.length);
  assert.equal(new Set(data.stages.map(stage => stage.proof)).size, data.stages.length);
  assert.ok(lab.entries.every(entry => !/flag\{/i.test(entry.line)), 'Searchable logs must not contain completion proofs');
  for (let index = 0; index < data.stages.length; index++) {
    const stage = data.stages[index];
    const found = lab.entries.filter(entry => stage.availableEvidence.includes(entry.evidenceId) && matchesQuery(entry, stage.hint)).map(entry => entry.evidenceId);
    for (const id of stage.requiredEvidence) assert.ok(found.includes(id), lab.id + '/' + stage.id + ': hint must retrieve ' + id);
    const assess = (proofs, observed, selected, choice) => assessInvestigationStage(data, stage.id, proofs, observed, selected, choice);
    assert.equal(assess(completed, [], stage.requiredEvidence, stage.correctIndex).passed, false, 'Reject uninspected evidence');
    assert.equal(assess(completed, found, [], stage.correctIndex).passed, false);
    if (stage.requiredEvidence.length > 1) assert.equal(assess(completed, found, stage.requiredEvidence.slice(1), stage.correctIndex).passed, false, 'Reject partial corroboration');
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
assert.equal(checkpoints, 71);
const storage = new Map();
global.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
const { progressActions } = require('../src/state/progressStore.ts');
const snapshot = () => JSON.parse(storage.get('hackerhub.progress.v1'));
for (const id of upgradedIds) {
  const lab = cases.find(item => item.id === id);
  const proofs = lab.investigation.stages.map(stage => stage.proof);
  progressActions.syncIdentity(id, 'Case investigator');
  for (const proof of proofs.slice(0, 3)) progressActions.captureFlag(id, proof, lab.totalFlags);
  assert.equal(snapshot().labCompletedAt[id], undefined, 'Three checkpoints cannot complete an eight-stage case');
  progressActions.syncIdentity('other-account', 'Other learner');
  assert.equal(snapshot().labFlags[id], undefined, 'Case progress must remain private to its account');
  progressActions.syncIdentity(id, 'Case investigator');
  assert.deepEqual(snapshot().labFlags[id], proofs.slice(0, 3), 'Resume preserves exactly the completed checkpoints');
  for (const proof of proofs.slice(3)) progressActions.captureFlag(id, proof, lab.totalFlags);
  assert.equal(snapshot().labFlags[id].length, 8);
  assert.ok(snapshot().labCompletedAt[id], 'Only the final checkpoint records completion');
  progressActions.captureFlag(id, proofs.at(-1), lab.totalFlags);
  assert.equal(snapshot().labFlags[id].length, 8, 'Replaying a checkpoint cannot inflate the score');
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
