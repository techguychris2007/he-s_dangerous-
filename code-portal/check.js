#!/usr/bin/env node
// Practice-exercise checker.
//
// Usage: node check.js <exercise-id> <cpp|js> [solutionPath]
//   node check.js 01-sum-array js
//   node check.js 01-sum-array cpp
//
// Looks for exercises/<exercise-id>/<lang>/solution.(cpp|js) by default —
// copy starter.(cpp|js) to solution.(cpp|js) in that folder and edit it.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const [, , exerciseId, lang, solutionArg] = process.argv;

if (!exerciseId || !lang || !['cpp', 'js'].includes(lang)) {
  console.error('Usage: node check.js <exercise-id> <cpp|js> [solutionPath]');
  console.error('Example: node check.js 01-sum-array js');
  process.exit(1);
}

const exerciseDir = path.join(__dirname, 'exercises', exerciseId);
if (!fs.existsSync(exerciseDir)) {
  console.error(`Unknown exercise: ${exerciseId} (looked in ${exerciseDir})`);
  process.exit(1);
}

const testsPath = path.join(exerciseDir, 'tests.json');
const tests = JSON.parse(fs.readFileSync(testsPath, 'utf8'));

const defaultSolution = path.join(exerciseDir, lang, lang === 'cpp' ? 'solution.cpp' : 'solution.js');
const solutionPath = solutionArg ? path.resolve(solutionArg) : defaultSolution;

if (!fs.existsSync(solutionPath)) {
  console.error(`No solution found at ${solutionPath}`);
  console.error(`Copy starter.${lang} to solution.${lang} in the same folder and implement it, then re-run.`);
  process.exit(1);
}

function normalize(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .trim();
}

function findCompiler() {
  for (const candidate of ['g++', 'cl']) {
    const probe = spawnSync(candidate, candidate === 'g++' ? ['--version'] : []);
    if (!probe.error) return candidate;
  }
  return null;
}

function compileCpp(sourcePath) {
  const compiler = findCompiler();
  if (!compiler) {
    console.error('No C++ compiler found (looked for g++ and cl.exe).');
    console.error('Install one, then re-run:');
    console.error('  MinGW-w64: winget install -e --id BrechtSanders.WinLibs.POSIX.UCRT  (open a new terminal after)');
    console.error('  MSVC Build Tools: winget install -e --id Microsoft.VisualStudio.2022.BuildTools');
    console.error('    then add the "Desktop development with C++" workload in the VS Installer,');
    console.error('    and run this from an "x64 Native Tools Command Prompt for VS 2022".');
    process.exit(1);
  }

  const exePath = path.join(os.tmpdir(), `check-${path.basename(path.dirname(sourcePath))}-${Date.now()}.exe`);
  let result;
  if (compiler === 'g++') {
    result = spawnSync('g++', ['-O2', '-std=c++17', '-o', exePath, sourcePath]);
  } else {
    result = spawnSync('cl', ['/nologo', '/EHsc', '/O2', sourcePath, `/Fe:${exePath}`]);
  }

  if (result.status !== 0) {
    console.error('Compilation failed:');
    console.error((result.stderr || result.stdout || '').toString());
    process.exit(1);
  }
  return exePath;
}

function runCase(command, args, input) {
  const result = spawnSync(command, args, { input, encoding: 'utf8', timeout: 5000 });
  if (result.error) {
    return { error: result.error.message };
  }
  return { stdout: result.stdout, stderr: result.stderr, status: result.status };
}

let runner; // (input) => { stdout, stderr, error }
if (lang === 'js') {
  runner = (input) => runCase('node', [solutionPath], input);
} else {
  const exePath = compileCpp(solutionPath);
  runner = (input) => runCase(exePath, [], input);
}

let passed = 0;
tests.forEach((test, i) => {
  const outcome = runner(test.input);
  if (outcome.error) {
    console.log(`Test ${i + 1}: ERROR — ${outcome.error}`);
    return;
  }
  const actual = normalize(outcome.stdout || '');
  const expected = normalize(test.expected);
  if (actual === expected) {
    passed++;
    console.log(`Test ${i + 1}: PASS`);
  } else {
    console.log(`Test ${i + 1}: FAIL`);
    console.log(`  input:    ${JSON.stringify(test.input)}`);
    console.log(`  expected: ${JSON.stringify(expected)}`);
    console.log(`  actual:   ${JSON.stringify(actual)}`);
    if (outcome.status !== 0 && outcome.stderr && outcome.stderr.trim()) {
      console.log(`  program crashed (exit ${outcome.status}):`);
      console.log(outcome.stderr.trim().split('\n').map((l) => `    ${l}`).join('\n'));
    }
  }
});

console.log(`\n${passed}/${tests.length} tests passed`);
process.exit(passed === tests.length ? 0 : 1);
