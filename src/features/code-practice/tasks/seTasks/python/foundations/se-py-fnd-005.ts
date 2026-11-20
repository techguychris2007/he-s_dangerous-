import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Log Line Parser

Real file I/O: read a log file line by line, parse its "LEVEL: message" shape, and summarize how
many lines were logged at each level. The test writes the log file to disk itself before calling
your functions, so this exercises the same \`open()\`/\`with\` pattern you'd use on a real file.
`;

const STARTER = `def parse_log(path):
    """Read the file at \`path\`. Each non-empty line looks like "LEVEL: message" (e.g. "INFO: started").
    Return a list of (level, message) tuples, in file order. Skip blank lines."""
    # TODO
    pass


def count_levels(entries):
    """Given a list of (level, message) tuples, return a dict of {level: count}."""
    # TODO
    pass
`;

const SOLUTION = `def parse_log(path):
    entries = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            level, _, message = line.partition(': ')
            entries.append((level, message))
    return entries


def count_levels(entries):
    counts = {}
    for level, _ in entries:
        counts[level] = counts.get(level, 0) + 1
    return counts
`;

const TEST_CODE = `from log_parser import parse_log, count_levels

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

log_text = "INFO: started\\nWARN: low memory\\nERROR: crashed\\n\\nINFO: restarted\\n"
with open('app.log', 'w') as f:
    f.write(log_text)

entries = parse_log('app.log')
__check__("parses 4 entries (blank skipped)", len(entries), 4)
__check__("first entry", entries[0], ("INFO", "started"))
__check__("third entry level", entries[2][0], "ERROR")
__check__("third entry message", entries[2][1], "crashed")

counts = count_levels(entries)
__check__("INFO count", counts.get("INFO"), 2)
__check__("WARN count", counts.get("WARN"), 1)
__check__("ERROR count", counts.get("ERROR"), 1)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-005',
  title: 'Log Line Parser',
  difficulty: 'Medium',
  language: 'python',
  track: 'foundations',
  category: 'Files & Formats',
  tags: ['files', 'parsing', 'io'],
  prompt: 'Parse a real log file on disk into structured (level, message) entries, then summarize counts per level.',
  hints: [
    "`with open(path) as f:` then iterate `for line in f:` — each `line` includes its trailing newline, so `.strip()` it first.",
    'Skip a line entirely (`continue`) if `.strip()` leaves it empty — that\'s the blank line.',
    '`line.partition(\': \')` splits "LEVEL: message" into `(level, \': \', message)` in one call — the middle piece is the separator you can ignore with `_`.',
    '`counts.get(level, 0) + 1` is the classic "increment or start at zero" pattern for building a frequency dict.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('log_parser.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('log_parser.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Log Line Parser', kind: 'python', entry: 'log_parser.py', testCode: TEST_CODE }],
};

export default task;
