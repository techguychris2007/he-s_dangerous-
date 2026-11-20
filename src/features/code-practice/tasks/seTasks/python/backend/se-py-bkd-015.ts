import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Job Queue

A minimal background-job queue: enqueue callables to run later, then process them one at a time,
in order — the same FIFO shape a real task queue (Celery, Sidekiq, SQS) has, just running in-process
instead of across a network.
`;

const STARTER = `QUEUE = []
RESULTS = []


def enqueue_job(fn, *args):
    """Add (fn, args) to the end of QUEUE."""
    # TODO
    pass


def run_next_job():
    """Remove the job at the FRONT of QUEUE (FIFO — first enqueued, first run), call it with its
    stored args, append the return value to RESULTS, and return that value. Return None (and don't
    touch RESULTS) if QUEUE is empty."""
    # TODO
    pass


def pending_count():
    """Return how many jobs are still waiting in QUEUE."""
    # TODO
    pass
`;

const SOLUTION = `QUEUE = []
RESULTS = []


def enqueue_job(fn, *args):
    QUEUE.append((fn, args))


def run_next_job():
    if not QUEUE:
        return None
    fn, args = QUEUE.pop(0)
    result = fn(*args)
    RESULTS.append(result)
    return result


def pending_count():
    return len(QUEUE)
`;

const TEST_CODE = `from jobs import enqueue_job, run_next_job, pending_count, QUEUE, RESULTS

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

def add(a, b):
    return a + b

def shout(msg):
    return msg.upper()

__check__("queue starts empty", pending_count(), 0)
__check__("running an empty queue returns None", run_next_job(), None)

enqueue_job(add, 2, 3)
enqueue_job(shout, "hello")
__check__("two jobs are pending", pending_count(), 2)

result1 = run_next_job()
__check__("first job runs in FIFO order (add first)", result1, 5)
__check__("one job left after running one", pending_count(), 1)

result2 = run_next_job()
__check__("second job runs next", result2, "HELLO")
__check__("queue is empty after both jobs run", pending_count(), 0)

__check__("results accumulate in order", RESULTS, [5, "HELLO"])

enqueue_job(add, 10, 20)
enqueue_job(add, 1, 1)
run_next_job()
__check__("FIFO holds across multiple enqueue rounds", pending_count(), 1)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-015',
  title: 'Job Queue',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'Background Jobs',
  tags: ['queues', 'background-jobs'],
  prompt: 'Build a FIFO job queue: enqueue a function with its arguments, then process jobs one at a time in the order they were added.',
  hints: [
    '`QUEUE.append((fn, args))` stores the function AND its arguments together as a tuple — you need both later to actually call it.',
    '`QUEUE.pop(0)` removes and returns the FRONT of the list — that\'s what makes this FIFO (first-in, first-out) rather than a stack.',
    'Unpack the stored tuple and call it with `*args` to spread the stored arguments back out: `fn, args = QUEUE.pop(0)`, then `fn(*args)`.',
    'Guard the empty-queue case first — `if not QUEUE: return None` — before attempting to pop anything.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('jobs.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('jobs.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Job Queue', kind: 'python', entry: 'jobs.py', testCode: TEST_CODE }],
};

export default task;
