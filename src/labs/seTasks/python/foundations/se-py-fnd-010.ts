import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Utility Package

Two given helper modules, \`text_utils.py\` and \`math_utils.py\` — your job in \`report.py\` is to import
from both and combine their output into one summary string. A small taste of what "a package is
several small modules that compose" feels like.
`;

const TEXT_UTILS = `def truncate(text, max_len):
    """Return \`text\` unchanged if it's <= max_len characters, otherwise the first (max_len - 3)
    characters followed by '...'."""
    if len(text) <= max_len:
        return text
    return text[:max_len - 3] + '...'


def word_count(text):
    return len(text.split())
`;

const MATH_UTILS = `def average(numbers):
    if not numbers:
        return 0
    return sum(numbers) / len(numbers)


def clamp(value, low, high):
    return max(low, min(value, high))
`;

const REPORT_STARTER = `from text_utils import truncate, word_count
from math_utils import average, clamp


def summarize(title, body, scores):
    """Build and return a report string in EXACTLY this format (no trailing newline):

    "<truncated title, max 20 chars>: <word count of body> words, avg score <average of scores,
    clamped between 0 and 100>"

    Example: summarize("Short", "one two three", [50, 150]) ->
    "Short: 3 words, avg score 100"
    (average of [50, 150] is 100.0, which is already within 0..100 after clamping, and should be
    formatted as an int if it has no fractional part — use int() on the clamped average.)
    """
    # TODO
    pass
`;

const REPORT_SOLUTION = `from text_utils import truncate, word_count
from math_utils import average, clamp


def summarize(title, body, scores):
    short_title = truncate(title, 20)
    words = word_count(body)
    avg_score = clamp(average(scores), 0, 100)
    return f"{short_title}: {words} words, avg score {int(avg_score)}"
`;

const TEST_CODE = `from report import summarize

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__(
    "short title, in-range scores",
    summarize("Short", "one two three", [50, 150]),
    "Short: 3 words, avg score 100",
)
__check__(
    "long title gets truncated",
    summarize("This Is A Very Long Report Title", "hello world", [80]),
    "This Is A Very Lo...: 2 words, avg score 80",
)
__check__(
    "score clamps to 0 minimum",
    summarize("Neg", "a b", [-50, -50]),
    "Neg: 2 words, avg score 0",
)
__check__(
    "empty body has zero words",
    summarize("Empty", "", [10, 20]),
    "Empty: 0 words, avg score 15",
)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-010',
  title: 'Utility Package',
  difficulty: 'Medium',
  language: 'python',
  track: 'foundations',
  category: 'Modules & Packaging',
  tags: ['imports', 'modules', 'formatting'],
  prompt: 'Compose two given utility modules into one formatted report string — practice reading an unfamiliar module\'s functions and combining their outputs correctly.',
  hints: [
    'All four imports you need are already at the top of `report.py` — you\'re only writing the body of `summarize`.',
    '`truncate(title, 20)` and `word_count(body)` each need exactly one call.',
    '`clamp(average(scores), 0, 100)` composes the two math_utils functions in one line — average first, then clamp the result.',
    'The final piece is an f-string: `f"{short_title}: {words} words, avg score {int(avg_score)}"` — `int()` drops the `.0` so 100.0 prints as 100.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('text_utils.py', TEXT_UTILS, { editable: false }),
    pf('math_utils.py', MATH_UTILS, { editable: false }),
    pf('report.py', REPORT_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('text_utils.py', TEXT_UTILS, { editable: false }),
    pf('math_utils.py', MATH_UTILS, { editable: false }),
    pf('report.py', REPORT_SOLUTION),
  ],
  targets: [{ id: 'main', label: 'Utility Package', kind: 'python', entry: 'report.py', testCode: TEST_CODE }],
};

export default task;
