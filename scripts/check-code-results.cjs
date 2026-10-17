require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { parseTestResult } = require('../src/lib/testResult.ts');
assert.deepEqual(parseTestResult('debug output\n__RESULT__ 4/4\n'), { passed: 4, total: 4 });
assert.deepEqual(parseTestResult('__RESULT__ 2/4'), { passed: 2, total: 4 });
for (const output of ['__RESULT__ 0/0', '__RESULT__ 5/4', '__RESULT__ 999999999999999999/999999999999999999', '__RESULT__ 4/4\nTraceback', 'prefix __RESULT__ 4/4']) {
  assert.equal(parseTestResult(output), null, `Invalid or interrupted grading must not pass: ${output}`);
}
assert.deepEqual(parseTestResult('__RESULT__ 9/9\n__RESULT__ 1/9'), { passed: 1, total: 9 });
console.log('Coding result validation passed: real trailing results, failure output, zero tests, invalid counts, and earlier misleading output.');
