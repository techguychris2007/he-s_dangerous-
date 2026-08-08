import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Validated Partial Update

Real PATCH-style validation: only the fields present in the request should change, but any field
that ISN'T one of the allowed ones should reject the whole request — a common real-world API rule
("don't silently ignore fields you don't recognize").
`;

const VALIDATION_STARTER = `ALLOWED_FIELDS = {'title', 'price', 'quantity'}


def validate_patch(body):
    """Return a list of error strings (empty list if valid):
    - "no fields to update" if body is empty.
    - f"unknown field: {field}" for every key in body that's NOT in ALLOWED_FIELDS (one error per
    unknown field, in the order they appear in body)."""
    # TODO
    pass


def apply_patch(record, body):
    """Return a NEW dict: record with every key from body applied on top. Do not mutate record."""
    # TODO
    pass
`;

const VALIDATION_SOLUTION = `ALLOWED_FIELDS = {'title', 'price', 'quantity'}


def validate_patch(body):
    if not body:
        return ["no fields to update"]

    errors = []
    for field in body:
        if field not in ALLOWED_FIELDS:
            errors.append(f"unknown field: {field}")
    return errors


def apply_patch(record, body):
    updated = dict(record)
    updated.update(body)
    return updated
`;

const TEST_CODE = `from validation import validate_patch, apply_patch

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("valid single field", validate_patch({"price": 9.99}), [])
__check__("valid multiple fields", validate_patch({"title": "New", "quantity": 5}), [])
__check__("empty body is invalid", validate_patch({}), ["no fields to update"])
__check__("unknown field is invalid", validate_patch({"color": "red"}), ["unknown field: color"])

errors = validate_patch({"title": "ok", "color": "red", "size": "L"})
__check__("collects multiple unknown fields", len(errors), 2)

record = {"title": "Widget", "price": 5.0, "quantity": 10}
patched = apply_patch(record, {"price": 6.0})
__check__("patch updates the given field", patched["price"], 6.0)
__check__("patch leaves other fields alone", patched["title"], "Widget")
__check__("patch does not mutate the original", record["price"], 5.0)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-006',
  title: 'Validated Partial Update',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'Request Validation',
  tags: ['validation', 'rest'],
  prompt: 'Validate a PATCH-style partial update: reject unknown fields (don\'t silently ignore them), then apply an already-valid patch without mutating the original record.',
  hints: [
    'Check the empty-body case FIRST and return early — `if not body: return ["no fields to update"]`.',
    '`for field in body:` iterates over a dict\'s keys by default — check each one against `ALLOWED_FIELDS` (a set, so `in` is a fast membership check).',
    'Collect ALL unknown fields, not just the first — same "build a list, don\'t return early" pattern as any other multi-error validator.',
    '`apply_patch`: `dict(record)` makes a shallow copy first, THEN `.update(body)` on the copy — that keeps the original `record` untouched.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('validation.py', VALIDATION_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('validation.py', VALIDATION_SOLUTION),
  ],
  targets: [{ id: 'main', label: 'Validated Partial Update', kind: 'python', entry: 'validation.py', testCode: TEST_CODE }],
};

export default task;
