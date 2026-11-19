import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Temperature Converter

Three small functions on plain numbers — no data structures yet, just variables, arithmetic, and
\`if\`/\`elif\`/\`else\`. This is the "language core" starting point every other foundations task builds on.
`;

const STARTER = `def celsius_to_fahrenheit(c):
    """Convert a Celsius temperature to Fahrenheit: F = C * 9/5 + 32."""
    # TODO
    pass


def fahrenheit_to_celsius(f):
    """Convert a Fahrenheit temperature to Celsius: C = (F - 32) * 5/9."""
    # TODO
    pass


def classify_temperature(celsius):
    """Return 'freezing' if celsius <= 0, 'cold' if <= 15, 'mild' if <= 25, else 'hot'."""
    # TODO
    pass
`;

const SOLUTION = `def celsius_to_fahrenheit(c):
    return c * 9 / 5 + 32


def fahrenheit_to_celsius(f):
    return (f - 32) * 5 / 9


def classify_temperature(celsius):
    if celsius <= 0:
        return 'freezing'
    elif celsius <= 15:
        return 'cold'
    elif celsius <= 25:
        return 'mild'
    else:
        return 'hot'
`;

const TEST_CODE = `from converter import celsius_to_fahrenheit, fahrenheit_to_celsius, classify_temperature

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("0C to F", celsius_to_fahrenheit(0), 32)
__check__("100C to F", celsius_to_fahrenheit(100), 212)
__check__("32F to C", fahrenheit_to_celsius(32), 0)
__check__("212F to C", fahrenheit_to_celsius(212), 100)
__check__("classify freezing", classify_temperature(-5), "freezing")
__check__("classify boundary 0", classify_temperature(0), "freezing")
__check__("classify cold", classify_temperature(10), "cold")
__check__("classify mild", classify_temperature(20), "mild")
__check__("classify hot", classify_temperature(30), "hot")

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-002',
  title: 'Temperature Converter',
  difficulty: 'Easy',
  language: 'python',
  track: 'foundations',
  category: 'Language Core',
  tags: ['variables', 'conditionals', 'arithmetic'],
  prompt:
    'Write two unit-conversion functions and one classifier that branches on the result. Pure ' +
    'variables, arithmetic, and `if`/`elif`/`else` — no collections yet.',
  hints: [
    'Fahrenheit = Celsius * 9/5 + 32 — a direct arithmetic expression, no loop needed.',
    'Celsius = (Fahrenheit - 32) * 5/9 — the inverse of the formula above.',
    'Order your `elif` chain from lowest to highest threshold so each boundary only needs one comparison.',
    'The boundaries are inclusive ("<= 0" is freezing) — double check 0 lands in "freezing", not "cold".',
  ],
  files: [pf('README.md', README, { editable: false }), pf('converter.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('converter.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Temperature Converter', kind: 'python', entry: 'converter.py', testCode: TEST_CODE }],
};

export default task;
