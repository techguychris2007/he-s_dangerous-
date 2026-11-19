import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Shape Calculator

A real multi-module layout: \`shapes.js\` (already written) knows how to compute the area of one
shape at a time; your job in \`calculator.js\` is to \`require\` it and total up a whole list of shapes.
`;

const SHAPES = `function areaCircle(radius) {
  return Math.PI * radius ** 2;
}

function areaRectangle(width, height) {
  return width * height;
}

function areaTriangle(base, height) {
  return 0.5 * base * height;
}

module.exports = { areaCircle, areaRectangle, areaTriangle };
`;

const CALCULATOR_STARTER = `const { areaCircle, areaRectangle, areaTriangle } = require('./shapes');

function areaOf(shape) {
  // TODO: shape is {type: 'circle', radius} or {type: 'rectangle', width, height} or
  // {type: 'triangle', base, height}. Dispatch to the matching shapes.js function and return its
  // result. Throw new Error('unknown shape: ' + shape.type) for anything else.
}

function totalArea(shapeList) {
  // TODO: sum of areaOf(shape) for every shape in shapeList
}

module.exports = { areaOf, totalArea };
`;

const CALCULATOR_SOLUTION = `const { areaCircle, areaRectangle, areaTriangle } = require('./shapes');

function areaOf(shape) {
  switch (shape.type) {
    case 'circle':
      return areaCircle(shape.radius);
    case 'rectangle':
      return areaRectangle(shape.width, shape.height);
    case 'triangle':
      return areaTriangle(shape.base, shape.height);
    default:
      throw new Error('unknown shape: ' + shape.type);
  }
}

function totalArea(shapeList) {
  return shapeList.reduce((sum, shape) => sum + areaOf(shape), 0);
}

module.exports = { areaOf, totalArea };
`;

const TEST_CODE = `const { areaOf, totalArea } = require('./calculator');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

function close(a, b) {
  return Math.abs(a - b) < 1e-9;
}

check('rectangle area', areaOf({ type: 'rectangle', width: 3, height: 4 }), 12);
check('triangle area', areaOf({ type: 'triangle', base: 5, height: 6 }), 15);
check('circle area', close(areaOf({ type: 'circle', radius: 2 }), Math.PI * 4), true);

let raised = false;
try {
  areaOf({ type: 'hexagon' });
} catch (e) {
  raised = true;
}
check('unknown shape throws', raised, true);

const shapes = [
  { type: 'rectangle', width: 2, height: 3 },
  { type: 'rectangle', width: 1, height: 1 },
];
check('total area of two rectangles', totalArea(shapes), 7);
check('total area of empty list', totalArea([]), 0);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-009',
  title: 'Shape Calculator',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'foundations',
  category: 'Modules & Packaging',
  tags: ['require', 'dispatch', 'modules'],
  prompt: 'Require three shape functions from a given `shapes.js` module and use them to build a dispatcher plus a totaling function.',
  hints: [
    'The `require` line is already written for you — `areaOf` just needs to pick the right one of the three based on `shape.type`.',
    'A `switch (shape.type)` is a clean way to dispatch — the `default` case throws `new Error(\'unknown shape: \' + shape.type)`.',
    'Each `case` unpacks the object\'s own fields as arguments, e.g. `areaRectangle(shape.width, shape.height)`.',
    '`totalArea` is a one-line `.reduce()` calling `areaOf(shape)` for each shape — it doesn\'t need to know about shape types at all, that\'s `areaOf`\'s job.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('shapes.js', SHAPES, { editable: false }),
    pf('calculator.js', CALCULATOR_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('shapes.js', SHAPES, { editable: false }),
    pf('calculator.js', CALCULATOR_SOLUTION),
  ],
  targets: [{ id: 'main', label: 'Shape Calculator', kind: 'node-js', entry: 'calculator.js', testCode: TEST_CODE }],
};

export default task;
