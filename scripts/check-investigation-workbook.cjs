require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { phishingWorkbook: lab } = require('../src/labs/scenarios/phishing-workbook.ts');
const { executeSiemQuery: execute } = require('../src/labs/siemExecution.ts');
const { assessWorkbookAnswer, workbookProof } = require('../src/labs/workbookAssessment.ts');
assert.ok(lab.entries.length >= 12000);
assert.equal(lab.workbook.questions.length, 20);
const proofs = new Set();
for (const question of lab.workbook.questions) {
  const result = execute(lab.entries, question.query, 'sentinel');
  assert.equal(result.error, undefined, question.id + ': ' + result.error);
  assert.equal(result.rows.length, 1, question.id);
  const answer = result.rows[0][question.column];
  assert.notEqual(answer, undefined, question.id);
  assert.equal(assessWorkbookAnswer(lab, question, String(answer)).passed, true, question.id);
  assert.equal(assessWorkbookAnswer(lab, question, 'incorrect-finding').passed, false, question.id);
  proofs.add(workbookProof(lab.id, question.id));
}
assert.equal(proofs.size, 20);
for (const [tool, query] of [
  ['sentinel', 'EmailEvents'],
  ['splunk', 'index=main sourcetype=email'],
  ['qradar', "SELECT * FROM events WHERE Table = 'EmailEvents'"],
  ['elastic', 'event.category: email'],
  ['chronicle', 'metadata.event_type = "EMAIL_TRANSACTION"'],
]) {
  const result = execute(lab.entries, query, tool);
  assert.equal(result.error, undefined, tool + ': ' + result.error);
  assert.equal(result.rows.length, 2401, tool);
}
const pivot = execute(lab.entries, 'let targets = EmailEvents | where SenderAddress == "accounts@billing-docs.example" | distinct RecipientAddress; SigninLogs | where UserPrincipalName in (targets)', 'sentinel');
assert.equal(pivot.error, undefined);
assert.ok(pivot.rows.length > 0, 'Tabular pivots must resolve real records');
console.log('Investigation workbook: 20 findings, negative controls, five dialects and tabular pivot passed.');
