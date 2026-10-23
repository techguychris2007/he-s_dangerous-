// Every Season 1 casebook question must be answerable from its own dataset: the reference query runs
// without error, returns exactly one row, the computed answer passes, a wrong answer fails, and the answer
// is not given away in the prompt. Also checks dataset scale, unique ids and the legacy drill link.
require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { CASEBOOK_LABS } = require('../src/labs/casebooks/index.ts');
const { SIEM_LABS } = require('../src/labs/siemScenarios.ts');
const { executeSiemQuery: execute } = require('../src/labs/siemExecution.ts');
const { assessWorkbookAnswer } = require('../src/labs/workbookAssessment.ts');

const ids = new Set();
let questions = 0;
for (const lab of CASEBOOK_LABS) {
  assert.ok(!ids.has(lab.id), 'duplicate casebook id ' + lab.id);
  ids.add(lab.id);
  assert.ok(lab.entries.length >= 3000, lab.id + ': dataset too small (' + lab.entries.length + ')');
  assert.ok(lab.workbook.questions.length >= 10, lab.id + ': needs at least 10 questions');
  assert.equal(lab.totalFlags, lab.workbook.questions.length, lab.id + ': totalFlags must equal question count');
  const chapters = new Set(lab.workbook.chapters.map(c => c.id));
  if (lab.replaces) assert.ok(SIEM_LABS.some(other => other.id === lab.replaces), lab.id + ': replaces unknown drill ' + lab.replaces);
  for (const q of lab.workbook.questions) {
    const where = lab.id + ' ' + q.id;
    assert.ok(chapters.has(q.chapter), where + ': unknown chapter ' + q.chapter);
    const result = execute(lab.entries, q.query, 'sentinel');
    assert.equal(result.error, undefined, where + ': ' + result.error);
    assert.equal(result.rows.length, 1, where + ': expected one row, got ' + result.rows.length);
    const answer = result.rows[0][q.column];
    assert.ok(answer !== undefined && answer !== null && String(answer) !== '', where + ': empty answer in column ' + q.column);
    assert.equal(assessWorkbookAnswer(lab, q, String(answer)).passed, true, where + ': correct answer rejected');
    assert.equal(assessWorkbookAnswer(lab, q, 'incorrect-finding').passed, false, where + ': wrong answer accepted');
    if (q.answerType !== 'number' && String(answer).length > 3) assert.ok(!q.prompt.includes(String(answer)), where + ': prompt reveals the answer "' + answer + '"');
    questions++;
  }
}
console.log(`Casebooks: ${CASEBOOK_LABS.length} cases, ${questions} questions verified against their datasets.`);
