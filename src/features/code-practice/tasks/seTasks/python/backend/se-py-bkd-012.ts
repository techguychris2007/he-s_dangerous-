import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Password Hashing

Never store a plaintext password — hash it, and verify by hashing the attempt and comparing hashes.
This uses the real \`hashlib\` module (a genuine CPython stdlib, not a toy stand-in) with a per-user
random salt, the same core idea real authentication systems use (production systems use a slower,
purpose-built algorithm like bcrypt/argon2 instead of a raw fast hash — but the salt-then-hash shape
here is the real thing).
`;

const STARTER = `import hashlib
import secrets


def hash_password(password, salt=None):
    """If salt isn't given, generate one with secrets.token_hex(8). Return a dict
    {"salt": salt, "hash": <hex digest>} where the hash is sha256(salt + password), hex-encoded.
    (hashlib.sha256(text.encode()).hexdigest() gives you the hex digest of a string.)"""
    # TODO
    pass


def verify_password(password, stored):
    """\`stored\` is a {"salt", "hash"} dict from hash_password. Return True if hashing \`password\`
    with the SAME salt produces the same hash, False otherwise."""
    # TODO
    pass
`;

const SOLUTION = `import hashlib
import secrets


def hash_password(password, salt=None):
    if salt is None:
        salt = secrets.token_hex(8)
    digest = hashlib.sha256((salt + password).encode()).hexdigest()
    return {"salt": salt, "hash": digest}


def verify_password(password, stored):
    check = hash_password(password, salt=stored["salt"])
    return check["hash"] == stored["hash"]
`;

const TEST_CODE = `from auth import hash_password, verify_password

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

record = hash_password("correct-horse-battery-staple")
__check__("hash result has a salt", "salt" in record, True)
__check__("hash result has a hash", "hash" in record, True)
__check__("hash is not the plaintext password", record["hash"] != "correct-horse-battery-staple", True)

__check__("correct password verifies", verify_password("correct-horse-battery-staple", record), True)
__check__("wrong password fails verification", verify_password("wrong-password", record), False)

record2 = hash_password("correct-horse-battery-staple")
__check__("same password hashed twice gets different salts", record["salt"] != record2["salt"], True)
__check__("...and therefore different hashes too", record["hash"] != record2["hash"], True)
__check__("both still verify correctly despite different salts", verify_password("correct-horse-battery-staple", record2), True)

fixed = hash_password("test123", salt="abc123")
__check__("an explicit salt is used as-is", fixed["salt"], "abc123")

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-012',
  title: 'Password Hashing',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'Auth & Sessions',
  tags: ['auth', 'hashing', 'security'],
  prompt: 'Hash passwords with a per-user random salt using real hashlib, then verify an attempt by re-hashing it with the stored salt and comparing.',
  hints: [
    '`secrets.token_hex(8)` generates the salt when none is given — check `if salt is None:` first.',
    '`hashlib.sha256((salt + password).encode()).hexdigest()` — concatenate salt and password as strings, encode to bytes, hash, then get the hex digest.',
    'Store BOTH the salt and the hash — you cannot verify later without knowing which salt was used.',
    '`verify_password` re-hashes the attempt with the SAME stored salt (`hash_password(password, salt=stored["salt"])`) and compares the resulting hash to the stored one — never compare plaintext passwords directly.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('auth.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('auth.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Password Hashing', kind: 'python', entry: 'auth.py', testCode: TEST_CODE }],
};

export default task;
