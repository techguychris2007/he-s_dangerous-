import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Shape Calculator

A real multi-module layout: \`shapes.py\` (already written) knows how to compute the area of one
shape at a time; your job in \`calculator.py\` is to import it and total up a whole list of shapes.
`;

const SHAPES = `import math


def area_circle(radius):
    return math.pi * radius ** 2


def area_rectangle(width, height):
    return width * height


def area_triangle(base, height):
    return 0.5 * base * height
`;

const CALCULATOR_STARTER = `from shapes import area_circle, area_rectangle, area_triangle


def area_of(shape):
    """\`shape\` is a dict like {'type': 'circle', 'radius': 2} or {'type': 'rectangle', 'width': 3,
    'height': 4} or {'type': 'triangle', 'base': 5, 'height': 6}. Dispatch to the matching shapes.py
    function and return its result. Raise ValueError("unknown shape: <type>") for anything else."""
    # TODO
    pass


def total_area(shape_list):
    """Return the sum of area_of(shape) for every shape in \`shape_list\`."""
    # TODO
    pass
`;

const CALCULATOR_SOLUTION = `from shapes import area_circle, area_rectangle, area_triangle


def area_of(shape):
    kind = shape['type']
    if kind == 'circle':
        return area_circle(shape['radius'])
    elif kind == 'rectangle':
        return area_rectangle(shape['width'], shape['height'])
    elif kind == 'triangle':
        return area_triangle(shape['base'], shape['height'])
    else:
        raise ValueError(f"unknown shape: {kind}")


def total_area(shape_list):
    return sum(area_of(shape) for shape in shape_list)
`;

const TEST_CODE = `import math
from calculator import area_of, total_area

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

def close(a, b):
    return abs(a - b) < 1e-9

__check__("rectangle area", area_of({"type": "rectangle", "width": 3, "height": 4}), 12)
__check__("triangle area", area_of({"type": "triangle", "base": 5, "height": 6}), 15.0)
__check__("circle area", close(area_of({"type": "circle", "radius": 2}), math.pi * 4), True)

raised = False
try:
    area_of({"type": "hexagon"})
except ValueError:
    raised = True
__check__("unknown shape raises", raised, True)

shapes = [
    {"type": "rectangle", "width": 2, "height": 3},
    {"type": "rectangle", "width": 1, "height": 1},
]
__check__("total area of two rectangles", total_area(shapes), 7)
__check__("total area of empty list", total_area([]), 0)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-009',
  title: 'Shape Calculator',
  difficulty: 'Medium',
  language: 'python',
  track: 'foundations',
  category: 'Modules & Packaging',
  tags: ['imports', 'dispatch', 'modules'],
  prompt: 'Import three shape functions from a given `shapes.py` module and use them to build a dict-driven dispatcher plus a totaling function.',
  hints: [
    'The import line is already written for you — `area_of` just needs to pick the right one of the three based on `shape[\'type\']`.',
    'An `if`/`elif`/`else` chain on `kind = shape[\'type\']` is the simplest dispatch — `else` raises `ValueError(f"unknown shape: {kind}")`.',
    "Each branch unpacks the dict's own fields as keyword-shaped arguments, e.g. `area_rectangle(shape['width'], shape['height'])`.",
    '`total_area` is a one-line generator sum over `area_of(shape)` for each shape — it doesn\'t need to know about shape types at all, that\'s `area_of`\'s job.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('shapes.py', SHAPES, { editable: false }),
    pf('calculator.py', CALCULATOR_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('shapes.py', SHAPES, { editable: false }),
    pf('calculator.py', CALCULATOR_SOLUTION),
  ],
  targets: [{ id: 'main', label: 'Shape Calculator', kind: 'python', entry: 'calculator.py', testCode: TEST_CODE }],
};

export default task;
