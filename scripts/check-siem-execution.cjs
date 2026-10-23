require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { executeSiemQuery } = require('../src/labs/siemExecution.ts');
const { withBackgroundTraffic } = require('../src/labs/siemTraffic.ts');
const entries = [
  { line: 'user=alice host=WS-01 EventID=4625', timestamp: '2025-05-12T10:00:00Z', eventType: 'AUTH_FAILURE' },
  { line: 'user=alice host=WS-01 EventID=4625', timestamp: '2025-05-12T10:05:00Z', eventType: 'AUTH_FAILURE' },
  { line: 'user=bob host=WS-02 EventID=4624', timestamp: '2025-05-12T11:00:00Z', eventType: 'AUTH_SUCCESS' },
];
function run(query, tool = 'sentinel') { const result = executeSiemQuery(entries, query, tool); assert.equal(result.error, undefined, query + ': ' + result.error); return result; }
assert.deepEqual(run('SecurityEvent | where EventID == 4625 | summarize Failures=count() by Account').rows, [{ Account: 'alice', Failures: 2 }]);
assert.deepEqual(run('SecurityEvent | summarize FirstSeen=min(TimeGenerated), LastSeen=max(TimeGenerated)').rows, [{ FirstSeen: '2025-05-12T10:00:00.000Z', LastSeen: '2025-05-12T11:00:00.000Z' }]);
assert.deepEqual(run('index=main EventCode=4625 | stats count by user', 'splunk').rows, [{ user: 'alice', count: 2 }]);
assert.equal(run('SecurityEvent | where (EventID == 4625 or user == "bob") and not host == "WS-01"').rows.length, 1);
assert.equal(run('SecurityEvent | where TimeGenerated > ago(30m)').rows.length, 1);
assert.deepEqual(run('SecurityEvent | summarize count() by bin(TimeGenerated, 1h) | sort by TimeGenerated asc').rows, [{ TimeGenerated: '2025-05-12T10:00:00.000Z', count_: 2 }, { TimeGenerated: '2025-05-12T11:00:00.000Z', count_: 1 }]);
assert.equal(run('SecurityEvent | where user !in ("alice")').rows.length, 1);
assert.equal(run('user=alice | take 1', 'splunk').rows.length, 1);
assert.deepEqual(run('SecurityEvent | distinct user | sort by user desc').rows, [{ user: 'bob' }, { user: 'alice' }]);
assert.deepEqual(run('SELECT user, COUNT(*) AS failures FROM events WHERE EventID = 4625 GROUP BY user ORDER BY failures DESC', 'qradar').rows, [{ user: 'alice', failures: 2 }]);
assert.ok(executeSiemQuery(entries, '* | magic hidden', 'splunk').error);
assert.ok(executeSiemQuery(entries, '* | where (user == "alice"', 'sentinel').error);
assert.equal(run('SecurityEvent | where user == "nobody" | count').rows[0].Count, 0);
assert.deepEqual(run('SELECT COUNT(*) AS total FROM events LAST 30 MINUTES', 'qradar').rows, [{ total: 1 }]);
const { packetFilter } = require('../src/labs/packetFilter.ts');
const packet = { line: 'IP 10.10.30.5.52144 > 8.8.8.8.53: A? updates.example. (32)' };
assert.equal(packetFilter('udp and dst port 53 and src host 10.10.30.5')(packet), true);
assert.equal(packetFilter('src port 53')(packet), false);
assert.equal(packetFilter('host 8.8.8.8 and not tcp')(packet), true);
assert.equal(executeSiemQuery([packet], 'port 53', 'tcpdump').rows.length, 1);
assert.throws(() => packetFilter('port bananas'));
const scenario = { id: 'test-traffic', entries };
const expanded = withBackgroundTraffic(scenario);
assert.equal(expanded.entries.length, 1027);
assert.equal(expanded.entries.filter(entry => entry.background).length, 1024);
assert.equal(withBackgroundTraffic(scenario), expanded, 'Do not regenerate telemetry on each render');
assert.ok(expanded.entries.some(entry => entry.fields?.Table === 'SigninLogs'));
const chronicle = withBackgroundTraffic({ id: 'udm-reference', tool: 'chronicle', entries: [] });
assert.ok(executeSiemQuery(chronicle.entries, 'metadata.event_type = "USER_LOGIN"', 'chronicle').rows.length > 0, 'UDM examples must query actual normalized fields');
const capture = withBackgroundTraffic({ id: 'packet-reference', tool: 'tcpdump', entries: [] });
assert.equal(capture.entries.some(entry => entry.fields?.Account || entry.fields?.Computer), false, 'A packet capture must not invent endpoint identities');
const { SIEM_LABS } = require('../src/labs/siemScenarios.ts');
const { assessInvestigationStage } = require('../src/labs/investigation.ts');
let checkpoints = 0;
for (const lab of SIEM_LABS) {
  if (lab.workbook) continue; // Typed findings are covered by check-investigation-workbook.cjs.
  if (!lab.investigation) {
    const flags = new Set(lab.hints.flatMap(hint => executeSiemQuery(lab.entries, hint, lab.tool).rows.flatMap(row => String(row._raw ?? '').match(/flag\{[^}]+\}/gi) ?? [])));
    assert.equal(flags.size, lab.totalFlags, lab.id + ': learner hints must reach every proof through the new query engine');
    continue;
  }
  const corpus = withBackgroundTraffic(lab), completed = [];
  assert.ok(corpus.entries.length > 1024);
  assert.equal(corpus.entries.some(entry => /\bphase=/.test(entry.line)), false, 'Do not label incident events with the answer stage');
  for (const stage of lab.investigation.stages) {
    const result = executeSiemQuery(corpus.entries, stage.hint, stage.tool);
    assert.equal(result.error, undefined, lab.id + '/' + stage.id + ': ' + result.error);
    const observed = result.entries.map(entry => entry.evidenceId).filter(Boolean);
    for (const id of stage.requiredEvidence) assert.ok(observed.includes(id), lab.id + '/' + stage.id + ': evidence must remain reachable within background traffic');
    assert.equal(assessInvestigationStage(lab.investigation, stage.id, completed, [], stage.requiredEvidence, stage.correctIndex).passed, false, 'Searching cannot replace inspecting source events');
    const assessed = assessInvestigationStage(lab.investigation, stage.id, completed, observed, stage.requiredEvidence, stage.correctIndex);
    assert.equal(assessed.passed, true, lab.id + '/' + stage.id);
    completed.push(assessed.proof); checkpoints++;
  }
}
console.log('Full corpus checks passed: ' + checkpoints + ' chained decisions and all legacy SIEM proofs remain reachable amid routine telemetry.');
