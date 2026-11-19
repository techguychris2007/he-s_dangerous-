import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Session Tokens

A minimal session system: logging in produces an opaque token, and that token (not the username or
password) is what proves identity on every later request — the same shape real cookie/session-based
auth uses, just without an actual HTTP cookie jar.
`;

const STARTER = `import secrets

USERS = {"ama": "hunter2", "kofi": "letmein"}
SESSIONS = {}


def login(username, password):
    """If USERS.get(username) == password, generate a token with secrets.token_hex(8), store
    SESSIONS[token] = username, and return the token. Return None if the credentials are wrong."""
    # TODO
    pass


def get_current_user(token):
    """Return the username associated with token, or None if the token isn't a valid session."""
    # TODO
    pass


def logout(token):
    """Remove token from SESSIONS if present. Return True if it was removed, False if it wasn't there."""
    # TODO
    pass
`;

const SOLUTION = `import secrets

USERS = {"ama": "hunter2", "kofi": "letmein"}
SESSIONS = {}


def login(username, password):
    if USERS.get(username) != password:
        return None
    token = secrets.token_hex(8)
    SESSIONS[token] = username
    return token


def get_current_user(token):
    return SESSIONS.get(token)


def logout(token):
    return SESSIONS.pop(token, None) is not None
`;

const TEST_CODE = `from sessions import login, get_current_user, logout

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

token = login("ama", "hunter2")
__check__("valid login returns a token", token is not None, True)
__check__("token is a non-empty string", isinstance(token, str) and len(token) > 0, True)

__check__("wrong password returns None", login("ama", "wrong"), None)
__check__("unknown user returns None", login("nobody", "anything"), None)

__check__("valid token resolves to the right user", get_current_user(token), "ama")
__check__("invalid token resolves to None", get_current_user("not-a-real-token"), None)

second_token = login("kofi", "letmein")
__check__("two logins produce different tokens", token != second_token, True)
__check__("both sessions are independently valid", get_current_user(second_token), "kofi")

__check__("logout removes an active session", logout(token), True)
__check__("logged-out token no longer resolves", get_current_user(token), None)
__check__("logging out an already-gone token returns False", logout(token), False)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-011',
  title: 'Session Tokens',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'Auth & Sessions',
  tags: ['auth', 'sessions'],
  prompt: 'Build a minimal session system: login produces an opaque token backed by a server-side session map, and that token is what identifies the user on later calls.',
  hints: [
    '`secrets.token_hex(8)` generates a random hex string — a real, unpredictable token, not something guessable like an incrementing id.',
    'Check credentials first: `if USERS.get(username) != password: return None` — only generate a token in the success path.',
    '`SESSIONS[token] = username` is the entire "session" — a dict mapping opaque tokens to usernames.',
    '`SESSIONS.pop(token, None) is not None` for logout mirrors the same delete-and-report-success pattern used elsewhere in this track — it never raises even if the token was already gone.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('sessions.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('sessions.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Session Tokens', kind: 'python', entry: 'sessions.py', testCode: TEST_CODE }],
};

export default task;
