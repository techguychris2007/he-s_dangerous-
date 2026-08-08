import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Input Validator

Two validation styles, both common in real code: one that *raises* on the first problem
(\`validate_age\`, \`validate_email\`), and one that *collects every* problem instead of stopping at
the first (\`validate_all\`).
`;

const STARTER = `def validate_age(age):
    """Raise ValueError("age must be between 0 and 150") if age < 0 or age > 150. Otherwise return age."""
    # TODO
    pass


def validate_email(email):
    """Raise ValueError("invalid email") if '@' is not in \`email\`. Otherwise return email."""
    # TODO
    pass


def validate_all(record):
    """\`record\` is a dict with 'age' and 'email' keys. Try both validators; instead of letting
    exceptions propagate, catch them and return a list of their error messages (empty list if both
    are valid)."""
    # TODO
    pass
`;

const SOLUTION = `def validate_age(age):
    if age < 0 or age > 150:
        raise ValueError("age must be between 0 and 150")
    return age


def validate_email(email):
    if '@' not in email:
        raise ValueError("invalid email")
    return email


def validate_all(record):
    errors = []
    try:
        validate_age(record['age'])
    except ValueError as e:
        errors.append(str(e))
    try:
        validate_email(record['email'])
    except ValueError as e:
        errors.append(str(e))
    return errors
`;

const TEST_CODE = `from validator import validate_age, validate_email, validate_all

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("valid age passes through", validate_age(30), 30)

raised = False
try:
    validate_age(-1)
except ValueError as e:
    raised = True
    __check__("negative age error message", str(e), "age must be between 0 and 150")
__check__("negative age raises", raised, True)

raised = False
try:
    validate_age(200)
except ValueError:
    raised = True
__check__("too-large age raises", raised, True)

__check__("valid email passes through", validate_email("a@b.com"), "a@b.com")

raised = False
try:
    validate_email("not-an-email")
except ValueError:
    raised = True
__check__("invalid email raises", raised, True)

__check__("validate_all with both valid", validate_all({"age": 25, "email": "x@y.com"}), [])
errors = validate_all({"age": -5, "email": "bad"})
__check__("validate_all collects both errors", len(errors), 2)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-008',
  title: 'Input Validator',
  difficulty: 'Medium',
  language: 'python',
  track: 'foundations',
  category: 'Errors & Robustness',
  tags: ['exceptions', 'validation'],
  prompt: 'Write two raise-on-failure validators, then a third function that runs both and collects their errors instead of crashing on the first one.',
  hints: [
    '`raise ValueError("age must be between 0 and 150")` — the exact message matters here, tests check it with `str(e)`.',
    'Guard both bounds in one condition: `if age < 0 or age > 150:`.',
    '`\'@\' not in email` is the whole check for `validate_email`.',
    'In `validate_all`, wrap each individual validator call in its own `try`/`except ValueError as e:` so one failure doesn\'t stop the other from being checked.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('validator.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('validator.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Input Validator', kind: 'python', entry: 'validator.py', testCode: TEST_CODE }],
};

export default task;
