import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Shape Hierarchy

Inheritance in its most useful shape: a base class that defines the *interface* (\`area\`,
\`perimeter\`) without knowing how to compute either, and two subclasses that each fill it in
differently. \`shapes_base.js\` (the base class) is already written — you write the subclasses with
\`extends\`.
`;

const SHAPES_BASE = `class Shape {
  area() {
    throw new Error('not implemented');
  }

  perimeter() {
    throw new Error('not implemented');
  }

  describe() {
    return \`\${this.constructor.name}: area=\${this.area().toFixed(2)}, perimeter=\${this.perimeter().toFixed(2)}\`;
  }
}

module.exports = { Shape };
`;

const STARTER = `const { Shape } = require('./shapes_base');

class Rectangle extends Shape {
  constructor(width, height) {
    super();
    // TODO: store width and height on this
  }

  area() {
    // TODO
  }

  perimeter() {
    // TODO
  }
}

class Circle extends Shape {
  constructor(radius) {
    super();
    // TODO: store radius on this
  }

  area() {
    // TODO: pi * radius ** 2 (use 3.14159 for pi)
  }

  perimeter() {
    // TODO: 2 * pi * radius
  }
}

module.exports = { Rectangle, Circle };
`;

const SOLUTION = `const { Shape } = require('./shapes_base');

class Rectangle extends Shape {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
  }

  area() {
    return this.width * this.height;
  }

  perimeter() {
    return 2 * (this.width + this.height);
  }
}

class Circle extends Shape {
  constructor(radius) {
    super();
    this.radius = radius;
  }

  area() {
    return 3.14159 * this.radius ** 2;
  }

  perimeter() {
    return 2 * 3.14159 * this.radius;
  }
}

module.exports = { Rectangle, Circle };
`;

const TEST_CODE = `const { Shape } = require('./shapes_base');
const { Rectangle, Circle } = require('./shapes');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

function close(a, b) {
  return Math.abs(a - b) < 0.01;
}

const r = new Rectangle(3, 4);
check('rectangle is a Shape', r instanceof Shape, true);
check('rectangle area', r.area(), 12);
check('rectangle perimeter', r.perimeter(), 14);

const c = new Circle(2);
check('circle is a Shape', c instanceof Shape, true);
check('circle area', close(c.area(), 12.566), true);
check('circle perimeter', close(c.perimeter(), 12.566), true);

check('describe uses actual class name', r.describe().startsWith('Rectangle:'), true);
check('describe formats area', r.describe().includes('area=12.00'), true);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-012',
  title: 'Shape Hierarchy',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'foundations',
  category: 'OOP/Classes',
  tags: ['inheritance', 'classes', 'extends'],
  prompt: 'Implement Rectangle and Circle subclasses of a given Shape base class using `extends`, each filling in area() and perimeter() their own way.',
  hints: [
    '`class Rectangle extends Shape` already inherits `describe()` for free — you only need `constructor`, `area`, and `perimeter`.',
    '`super()` must run before you touch `this` in a subclass constructor — it\'s already called for you, just add the assignments after it.',
    'Rectangle: `area = width * height`, `perimeter = 2 * (width + height)`.',
    'Circle: `area = 3.14159 * radius ** 2`, `perimeter = 2 * 3.14159 * radius` — the constant is given, no `Math.PI` needed.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('shapes_base.js', SHAPES_BASE, { editable: false }),
    pf('shapes.js', STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('shapes_base.js', SHAPES_BASE, { editable: false }),
    pf('shapes.js', SOLUTION),
  ],
  targets: [{ id: 'main', label: 'Shape Hierarchy', kind: 'node-js', entry: 'shapes.js', testCode: TEST_CODE }],
};

export default task;
