import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Generator Pipeline

\`yield\`-based generators instead of hand-rolled iterator classes — the idiomatic way to produce a
lazy sequence in Python. Chain two small generators together to build a pipeline.
`;

const STARTER = `def even_numbers(n):
    """Yield every even number from 0 up to (and including, if even) n."""
    # TODO
    pass


def squares(iterable):
    """Yield the square of every value in \`iterable\`, in order."""
    # TODO
    pass


def first_n(iterable, n):
    """Return a list of the first \`n\` values pulled from \`iterable\` (which may be infinite —
    don't just call list() on it)."""
    # TODO
    pass
`;

const SOLUTION = `def even_numbers(n):
    for i in range(0, n + 1, 2):
        yield i


def squares(iterable):
    for value in iterable:
        yield value ** 2


def first_n(iterable, n):
    result = []
    for value in iterable:
        if len(result) >= n:
            break
        result.append(value)
    return result
`;

const TEST_CODE = `from pipeline import even_numbers, squares, first_n

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("even numbers up to 10", list(even_numbers(10)), [0, 2, 4, 6, 8, 10])
__check__("even numbers up to 9 (odd bound)", list(even_numbers(9)), [0, 2, 4, 6, 8])
__check__("even_numbers is a generator", hasattr(even_numbers(4), '__next__'), True)

__check__("squares of a list", list(squares([1, 2, 3, 4])), [1, 4, 9, 16])
__check__("squares chained onto even_numbers", list(squares(even_numbers(4))), [0, 4, 16])

def naturals():
    n = 0
    while True:
        yield n
        n += 1

__check__("first_n pulls from an infinite generator", first_n(naturals(), 5), [0, 1, 2, 3, 4])
__check__("first_n chained with squares on infinite gen", first_n(squares(naturals()), 4), [0, 1, 4, 9])

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-014',
  title: 'Generator Pipeline',
  difficulty: 'Medium',
  language: 'python',
  track: 'foundations',
  category: 'Iterators/Generators/Async',
  tags: ['generators', 'yield', 'laziness'],
  prompt: 'Write two `yield`-based generators and a consumer that can pull a finite number of values out of a potentially infinite one.',
  hints: [
    '`even_numbers` is a one-line loop: `for i in range(0, n + 1, 2): yield i`.',
    '`squares` doesn\'t care where its input comes from — `for value in iterable: yield value ** 2` works whether `iterable` is a list or another generator.',
    'The whole point of `first_n` is that it must NOT call `list(iterable)` — that would hang forever on an infinite generator. Loop with `for value in iterable:` and `break` once you have enough.',
    'Check `if len(result) >= n: break` BEFORE appending, so you stop at exactly `n` items, not `n + 1`.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('pipeline.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('pipeline.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Generator Pipeline', kind: 'python', entry: 'pipeline.py', testCode: TEST_CODE }],
};

export default task;
