import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Job Queue

A minimal background-job queue: enqueue callables to run later, then process them one at a time,
in order — the same FIFO shape a real task queue (Celery, Sidekiq, SQS) has, just running
in-process instead of across a network.
`;

const STARTER = `const QUEUE = [];
const RESULTS = [];

function enqueueJob(fn, ...args) {
  // TODO: add { fn, args } to the end of QUEUE.
}

function runNextJob() {
  // TODO: remove the job at the FRONT of QUEUE (FIFO — first enqueued, first run), call it with
  // its stored args, push the return value onto RESULTS, and return that value. Return undefined
  // (and don't touch RESULTS) if QUEUE is empty.
}

function pendingCount() {
  // TODO: return how many jobs are still waiting in QUEUE.
}

module.exports = { enqueueJob, runNextJob, pendingCount, QUEUE, RESULTS };
`;

const SOLUTION = `const QUEUE = [];
const RESULTS = [];

function enqueueJob(fn, ...args) {
  QUEUE.push({ fn, args });
}

function runNextJob() {
  if (QUEUE.length === 0) return undefined;
  const { fn, args } = QUEUE.shift();
  const result = fn(...args);
  RESULTS.push(result);
  return result;
}

function pendingCount() {
  return QUEUE.length;
}

module.exports = { enqueueJob, runNextJob, pendingCount, QUEUE, RESULTS };
`;

const TEST_CODE = `const { enqueueJob, runNextJob, pendingCount, RESULTS } = require('./jobs');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

function add(a, b) {
  return a + b;
}

function shout(msg) {
  return msg.toUpperCase();
}

check('queue starts empty', pendingCount(), 0);
check('running an empty queue returns undefined', runNextJob(), undefined);

enqueueJob(add, 2, 3);
enqueueJob(shout, 'hello');
check('two jobs are pending', pendingCount(), 2);

const result1 = runNextJob();
check('first job runs in FIFO order (add first)', result1, 5);
check('one job left after running one', pendingCount(), 1);

const result2 = runNextJob();
check('second job runs next', result2, 'HELLO');
check('queue is empty after both jobs run', pendingCount(), 0);

check('results accumulate in order', RESULTS, [5, 'HELLO']);

enqueueJob(add, 10, 20);
enqueueJob(add, 1, 1);
runNextJob();
check('FIFO holds across multiple enqueue rounds', pendingCount(), 1);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-015',
  title: 'Job Queue',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'Background Jobs',
  tags: ['queues', 'background-jobs'],
  prompt: 'Build a FIFO job queue: enqueue a function with its arguments, then process jobs one at a time in the order they were added.',
  hints: [
    '`...args` in the function signature collects every extra argument into an array — store it alongside `fn` so both are available later.',
    '`QUEUE.shift()` removes and returns the FRONT of the array — that\'s what makes this FIFO (first-in, first-out) rather than a stack (which would use `.pop()`).',
    'Spread the stored arguments back out when calling: `fn(...args)`.',
    'Guard the empty-queue case first — `if (QUEUE.length === 0) return undefined;` — before attempting to shift anything.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('jobs.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('jobs.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Job Queue', kind: 'node-js', entry: 'jobs.js', testCode: TEST_CODE }],
};

export default task;
