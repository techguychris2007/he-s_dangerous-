import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Validated Partial Update

Real PATCH-style validation: only the fields present in the request should change, but any field
that ISN'T one of the allowed ones should reject the whole request — a common real-world API rule
("don't silently ignore fields you don't recognize").
`;

const STARTER = `const ALLOWED_FIELDS = new Set(['title', 'price', 'quantity']);

function validatePatch(body) {
  // TODO: return an array of error strings (empty array if valid):
  // - 'no fields to update' if body has no keys at all.
  // - \`unknown field: \${field}\` for every key in body that's NOT in ALLOWED_FIELDS (one error per
  // unknown field, in the order they appear in body).
}

function applyPatch(record, body) {
  // TODO: return a NEW object: record with every key from body applied on top. Do not mutate record.
}

module.exports = { validatePatch, applyPatch };
`;

const SOLUTION = `const ALLOWED_FIELDS = new Set(['title', 'price', 'quantity']);

function validatePatch(body) {
  const keys = Object.keys(body);
  if (keys.length === 0) {
    return ['no fields to update'];
  }

  const errors = [];
  for (const field of keys) {
    if (!ALLOWED_FIELDS.has(field)) {
      errors.push(\`unknown field: \${field}\`);
    }
  }
  return errors;
}

function applyPatch(record, body) {
  return { ...record, ...body };
}

module.exports = { validatePatch, applyPatch };
`;

const TEST_CODE = `const { validatePatch, applyPatch } = require('./validation');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('valid single field', validatePatch({ price: 9.99 }), []);
check('valid multiple fields', validatePatch({ title: 'New', quantity: 5 }), []);
check('empty body is invalid', validatePatch({}), ['no fields to update']);
check('unknown field is invalid', validatePatch({ color: 'red' }), ['unknown field: color']);

const errors = validatePatch({ title: 'ok', color: 'red', size: 'L' });
check('collects multiple unknown fields', errors.length, 2);

const record = { title: 'Widget', price: 5.0, quantity: 10 };
const patched = applyPatch(record, { price: 6.0 });
check('patch updates the given field', patched.price, 6.0);
check('patch leaves other fields alone', patched.title, 'Widget');
check('patch does not mutate the original', record.price, 5.0);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-006',
  title: 'Validated Partial Update',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'Request Validation',
  tags: ['validation', 'rest'],
  prompt: "Validate a PATCH-style partial update: reject unknown fields (don't silently ignore them), then apply an already-valid patch without mutating the original record.",
  hints: [
    '`Object.keys(body)` gives you the field names present in the request — check its length for the empty-body case first.',
    '`ALLOWED_FIELDS.has(field)` is a fast membership check against a Set — reach for a Set instead of an array `.includes()` for this kind of fixed lookup list.',
    'Collect ALL unknown fields, not just the first — same "build an array, don\'t return early" pattern as any other multi-error validator.',
    '`{ ...record, ...body }` does a shallow merge into a brand-new object — `record` itself is never touched.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('validation.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('validation.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Validated Partial Update', kind: 'node-js', entry: 'validation.js', testCode: TEST_CODE }],
};

export default task;
