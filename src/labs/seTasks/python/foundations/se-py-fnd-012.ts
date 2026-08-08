import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Shape Hierarchy

Inheritance in its most useful shape: a base class that defines the *interface* (\`area\`,
\`perimeter\`) without knowing how to compute either, and two subclasses that each fill it in
differently. \`shapes_base.py\` (the base class) is already written — you write the subclasses.
`;

const SHAPES_BASE = `class Shape:
    def area(self):
        raise NotImplementedError

    def perimeter(self):
        raise NotImplementedError

    def describe(self):
        return f"{type(self).__name__}: area={self.area():.2f}, perimeter={self.perimeter():.2f}"
`;

const STARTER = `from shapes_base import Shape


class Rectangle(Shape):
    def __init__(self, width, height):
        # TODO: store width and height on self
        pass

    def area(self):
        # TODO
        pass

    def perimeter(self):
        # TODO
        pass


class Circle(Shape):
    def __init__(self, radius):
        # TODO: store radius on self
        pass

    def area(self):
        # TODO: pi * radius ** 2 (use 3.14159 for pi, no imports needed)
        pass

    def perimeter(self):
        # TODO: 2 * pi * radius
        pass
`;

const SOLUTION = `from shapes_base import Shape


class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

    def perimeter(self):
        return 2 * (self.width + self.height)


class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return 3.14159 * self.radius ** 2

    def perimeter(self):
        return 2 * 3.14159 * self.radius
`;

const TEST_CODE = `from shapes_base import Shape
from shapes import Rectangle, Circle

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

def close(a, b):
    return abs(a - b) < 0.01

r = Rectangle(3, 4)
__check__("rectangle is a Shape", isinstance(r, Shape), True)
__check__("rectangle area", r.area(), 12)
__check__("rectangle perimeter", r.perimeter(), 14)

c = Circle(2)
__check__("circle is a Shape", isinstance(c, Shape), True)
__check__("circle area", close(c.area(), 12.566), True)
__check__("circle perimeter", close(c.perimeter(), 12.566), True)

__check__("describe uses actual class name", r.describe().startswith("Rectangle:"), True)
__check__("describe formats area", "area=12.00" in r.describe(), True)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-012',
  title: 'Shape Hierarchy',
  difficulty: 'Medium',
  language: 'python',
  track: 'foundations',
  category: 'OOP/Classes',
  tags: ['inheritance', 'classes'],
  prompt: 'Implement Rectangle and Circle subclasses of a given Shape base class, each filling in area() and perimeter() their own way.',
  hints: [
    '`class Rectangle(Shape):` already inherits `describe()` for free — you only need to implement `__init__`, `area`, and `perimeter`.',
    'Store constructor arguments the same way as any class: `self.width = width`, `self.height = height`.',
    'Rectangle: `area = width * height`, `perimeter = 2 * (width + height)`.',
    'Circle: `area = 3.14159 * radius ** 2`, `perimeter = 2 * 3.14159 * radius` — no `import math` needed, the constant is given.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('shapes_base.py', SHAPES_BASE, { editable: false }),
    pf('shapes.py', STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('shapes_base.py', SHAPES_BASE, { editable: false }),
    pf('shapes.py', SOLUTION),
  ],
  targets: [{ id: 'main', label: 'Shape Hierarchy', kind: 'python', entry: 'shapes.py', testCode: TEST_CODE }],
};

export default task;
