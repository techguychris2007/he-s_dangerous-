require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { ML_LESSONS } = require('../src/data/mlLessons/index.ts');
const { ML_TASKS } = require('../src/labs/mlTasks/index.ts');
const { COMPREHENSIVE_FOUNDATIONS } = require('../src/data/mlLessons/comprehensiveFoundations.ts');
const { COMPREHENSIVE_EVALUATION } = require('../src/data/mlLessons/comprehensiveEvaluation.ts');
const { COMPREHENSIVE_FORECASTING } = require('../src/data/mlLessons/comprehensiveForecasting.ts');
const { ML_ENGINEERING_PRACTICE } = require('../src/labs/mlTasks/engineeringPractice.ts');
const replacements = { ...COMPREHENSIVE_FOUNDATIONS, ...COMPREHENSIVE_EVALUATION, ...COMPREHENSIVE_FORECASTING };
const tasks = new Map(ML_TASKS.map(task => [task.id, task]));
assert.equal(tasks.size, ML_TASKS.length, 'Coding task IDs must be unique');
for (const lesson of ML_LESSONS) {
  if (lesson.challengeTaskId) assert.ok(tasks.has(lesson.challengeTaskId), lesson.id + ': missing assignment route');
}
assert.equal(ML_LESSONS.find(l => l.id === 'pandas').challengeTaskId, 'ml-data-join-audit');
assert.equal(ML_LESSONS.find(l => l.id === 'time-series').challengeTaskId, 'ml-ts-walk-forward');
const validationExample = ML_LESSONS.find(l => l.id === 'py-ml-control-flow').sections.find(s => s.body.includes('def validate_training_row'));
assert.ok(validationExample.body.includes('amount &lt; 0'), 'Comparison operators must survive HTML code rendering');
const decode = text => text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const examples = [];
for (const id of Object.keys(replacements)) {
  const lesson = ML_LESSONS.find(l => l.id === id);
  assert.deepEqual(lesson.sections, replacements[id], 'Complete teaching must replace old summaries, not append conflicting material');
  for (const section of lesson.sections) {
    for (const match of section.body.matchAll(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g)) {
      assert.equal(/<(?!\/code>)[a-z]/i.test(match[1]), false, id + ': code must be escaped text');
      examples.push({ name: id + ' / ' + section.heading, code: decode(match[1]) });
    }
  }
}
const python = process.env.DARKWORLD_ML_PYTHON || 'python';
if (process.argv.includes('--structure-only')) {
  console.log(`ML content integrity passed: ${Object.keys(replacements).length} complete lessons, ${examples.length} escaped Python examples, valid assignment routes.`);
  process.exit(0);
}
const runner = "import ast, contextlib, io, json, re, sys\npayload = json.load(sys.stdin)\nfor example in payload[\"examples\"]:\n    ast.parse(example[\"code\"])\n    try:\n        with contextlib.redirect_stdout(io.StringIO()):\n            exec(compile(example[\"code\"], example[\"name\"], \"exec\"), {})\n    except Exception as error:\n        raise AssertionError(example[\"name\"]) from error\nfor task in payload[\"tasks\"]:\n    tree = ast.parse(task[\"starterCode\"])\n    for statement in tree.body:\n        assert isinstance(statement, (ast.FunctionDef, ast.AsyncFunctionDef)), \"Starter contains implementation\"\n        for body in statement.body:\n            assert isinstance(body, ast.Pass) or (\n                isinstance(body, ast.Expr) and isinstance(body.value, ast.Constant)\n                and isinstance(body.value.value, str)\n            ), \"Starter function is partially solved\"\n    outputs = []\n    for code in [task[\"solution\"], task[\"starterCode\"]]:\n        stream = io.StringIO()\n        with contextlib.redirect_stdout(stream):\n            exec(compile(code + \"\\n\" + task[\"testCode\"], task[\"id\"], \"exec\"), {})\n        result = re.findall(r\"^__RESULT__ (\\d+)/(\\d+)$\", stream.getvalue(), re.M)\n        assert result, task[\"id\"] + \": missing grading summary\"\n        passed, total = map(int, result[-1])\n        assert total > 0\n        outputs.append((passed, total))\n    assert outputs[0][0] == outputs[0][1], (task[\"id\"], outputs)\n    assert outputs[1][0] < outputs[1][1], \"Unimplemented starter must not pass\"\n    print(task[\"id\"] + \": \" + str(outputs[0][1]) + \" reference tests passed; starter rejected\")\nprint(str(len(payload[\"examples\"])) + \" independently executed lesson examples passed\")\n";

const result = spawnSync(python, ['-c', runner], {
  input: JSON.stringify({ examples, tasks: ML_ENGINEERING_PRACTICE }),
  encoding: 'utf8', maxBuffer: 4 * 1024 * 1024,
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
assert.equal(result.status, 0, 'ML lesson examples and assignment graders must execute successfully');
console.log('ML lesson routes, replacement content, code rendering and unsolved starter contracts passed.');

