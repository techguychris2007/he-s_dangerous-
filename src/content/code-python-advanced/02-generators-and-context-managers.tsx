import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';
import PracticeTasksCallout from '../../components/lesson/PracticeTasksCallout';

export default function GeneratorsAndContextManagers() {
  return (
    <div className="prose-hh">
      <h1>Generators, Iterators &amp; Context Managers</h1>
      <p>
        These three features solve two related problems: processing huge amounts of data without loading it
        all into memory at once (generators), and guaranteeing setup/cleanup code always runs correctly even
        when something goes wrong partway through (context managers).
      </p>

      <h2>The problem generators solve</h2>
      <CodeBlock label="the memory-hungry way">{`def get_matching_lines(filename, keyword):
    matches = []
    with open(filename) as f:
        for line in f:
            if keyword in line:
                matches.append(line)   # every match gets held in memory at once
    return matches`}</CodeBlock>
      <p>
        On a small file this is fine. On a multi-gigabyte log file, building the entire{' '}
        <code>matches</code> list before returning it can exhaust available memory — even though the
        calling code might only actually need to look at the first few matches.
      </p>

      <h2>Generators — yield instead of return</h2>
      <CodeBlock label="the lazy way, using yield">{`def get_matching_lines(filename, keyword):
    with open(filename) as f:
        for line in f:
            if keyword in line:
                yield line   # pause here, hand back one line, resume on the next request

# nothing runs yet — calling the function just creates a generator object
gen = get_matching_lines("huge.log", "FAILED_LOGIN")

for line in gen:
    print(line)
    # each iteration of this loop resumes get_matching_lines exactly where it left off`}</CodeBlock>
      <p>
        The moment a function body contains <code>yield</code> anywhere, calling it doesn't run the
        function immediately — it returns a generator object. The function's code only actually executes as
        you iterate, one <code>yield</code> at a time, and its local state (like the file handle and
        current position) is preserved between each resumption automatically.
      </p>

      <h2>Generators that never end</h2>
      <CodeBlock label="an infinite generator, safely consumed">{`def ticket_ids(prefix):
    n = 1
    while True:            # this loop never breaks on its own
        yield f"{prefix}-{n}"
        n += 1

import itertools
gen = ticket_ids("INC")
first_five = list(itertools.islice(gen, 5))   # only pulls 5 values, safely
print(first_five)   # ['INC-1', 'INC-2', 'INC-3', 'INC-4', 'INC-5']`}</CodeBlock>
      <Callout variant="warn">
        <p>
          Never call <code>list(some_infinite_generator)</code> directly — it will hang forever trying to
          exhaust something that never ends. <code>itertools.islice(gen, n)</code> is the standard, safe way
          to take just the first <code>n</code> values from a generator that might not have a natural stopping point.
        </p>
      </Callout>

      <h2>Context managers — guaranteed cleanup with the with statement</h2>
      <p>
        You've already used context managers constantly: <code>with open(file) as f:</code> guarantees the
        file gets closed even if an exception happens inside the block. You can build your own the same
        way, using <code>__enter__</code> and <code>__exit__</code>.
      </p>
      <CodeBlock label="a context manager class">{`class SecureTempSecret:
    def __init__(self, value):
        self.value = value

    def __enter__(self):
        return self   # this is what the "as" part of the with-statement binds to

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.value = None   # runs on the way out — exception or not
        return False          # False means "don't suppress the exception"

with SecureTempSecret("s3cr3t") as s:
    print(s.value)     # "s3cr3t"
print(s.value)           # None — cleared automatically on exit`}</CodeBlock>
      <p>
        <code>__exit__</code> receives details about any exception that occurred (or three{' '}
        <code>None</code>s if the block finished normally) — this is what guarantees the cleanup code runs
        in both cases, which is exactly the property you want for clearing a secret from memory or closing
        a network connection.
      </p>

      <h2>The shorter way: @contextmanager</h2>
      <CodeBlock label="a generator-based context manager">{`from contextlib import contextmanager

@contextmanager
def timed_block(label, log):
    log.append(f"{label}: start")
    try:
        yield                      # the with-block's body runs here
    finally:
        log.append(f"{label}: end")   # always runs, exception or not

log = []
with timed_block("scan", log):
    log.append("scan: working")
print(log)   # ['scan: start', 'scan: working', 'scan: end']`}</CodeBlock>
      <p>
        Everything before <code>yield</code> plays the role of <code>__enter__</code>; everything after it
        (inside <code>finally</code>) plays the role of <code>__exit__</code>. For simple cases, this is
        noticeably less code than writing a full class with both dunder methods.
      </p>

      <PracticeTasksCallout
        tasks={[
          { id: 'py-adv-03', title: 'A Generator That Filters Log Lines Lazily' },
          { id: 'py-adv-05', title: 'A Context Manager That Clears a Secret on Exit' },
          { id: 'py-adv-06', title: 'A @contextmanager-Decorated Logging Block' },
        ]}
      />
    </div>
  );
}
