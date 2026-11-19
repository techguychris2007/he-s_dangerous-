import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';
import PracticeTasksCallout from '../../components/lesson/PracticeTasksCallout';

export default function PythonTestingAndTypes() {
  return <div className="prose-hh">
    <h1>Testing, Debugging &amp; Type Hints</h1>
    <p>Programs rarely fail only on the example their author tried. A blank field, duplicate record, unexpected type, daylight-saving boundary, or interrupted write can reveal assumptions hidden in code. Testing makes those assumptions executable; debugging turns a failure into evidence; type hints communicate the shape of values to readers and static-analysis tools.</p>
    <h2>Start with a contract and observable behavior</h2>
    <p>Before testing a function, state its inputs, output, and failure behavior. A parser might accept one line of a documented format and return a record, return a deliberate “not a record” result for an unrelated line, and raise a specific error for a malformed line that claims to be a record. Ambiguous behavior leads to fragile callers. Tests should verify externally observable results, not private implementation details.</p>
    <CodeBlock label="A pure parser with explicit outcomes">{`def parse_event(line):
    parts = line.strip().split()
    if not parts:
        return None                    # blank lines are intentionally ignored
    if len(parts) != 3:
        raise ValueError("expected timestamp, event, and username")
    timestamp, event, username = parts
    if not timestamp.endswith("Z"):
        raise ValueError("timestamp must be UTC and end in Z")
    if event not in {"LOGIN_OK", "LOGIN_FAILED"}:
        raise ValueError(f"unsupported event: {event}")
    if not username.startswith("user=") or len(username) == 5:
        raise ValueError("username field is missing")
    return {"timestamp": timestamp, "event": event, "user": username[5:]}

record = parse_event("2026-10-09T08:15:00Z LOGIN_FAILED user=alice")
print(record["event"], record["user"])`}</CodeBlock>
    <p>This function is pure in the practical sense: for the same input it gives the same result and does not read files, print, or mutate shared state. That makes edge cases cheap to test. Notice the deliberate distinction between an irrelevant blank line and a malformed event-like line; silently ignoring both could conceal damaged input.</p>
    <h2>Unit tests, boundaries, and regression</h2>
    <p>A unit test checks a small behavior in isolation. A good test set includes a normal case, the smallest and largest accepted values, empty values, invalid types, malformed values, and the exact failure contract. A regression test records a bug that was discovered so it cannot quietly return later. Tests do not prove all possible inputs are correct, but they make known expectations repeatable.</p>
    <CodeBlock label="pytest-style tests that explain the contract">{`import pytest
from event_parser import parse_event

def test_parses_a_supported_event():
    parsed = parse_event("2026-10-09T08:15:00Z LOGIN_FAILED user=alice")
    assert parsed == {
        "timestamp": "2026-10-09T08:15:00Z",
        "event": "LOGIN_FAILED",
        "user": "alice",
    }

def test_blank_lines_are_ignored():
    assert parse_event("  ") is None

@pytest.mark.parametrize("line", ["too few", "date LOGIN_OK user=bob extra"])
def test_rejects_wrong_field_count(line):
    with pytest.raises(ValueError, match="expected timestamp"):
        parse_event(line)

def test_rejects_unknown_event():
    with pytest.raises(ValueError, match="unsupported event"):
        parse_event("2026-10-09T08:15:00Z ADMIN user=alice")`}</CodeBlock>
    <p>Run a focused test while editing, then the full suite before committing. A failing assertion is useful evidence: read the expected and actual values, reproduce the case, and trace state from input toward output. Do not “fix” a failure by weakening the assertion unless the contract itself has intentionally changed.</p>
    <h2>Debugging with a small, repeatable case</h2>
    <p>When a bug appears, reduce it to the smallest input that still reproduces it. Inspect values and their types at the boundary, then step through one branch at a time. The built-in <code>breakpoint()</code> opens a debugger in standard CPython environments; <code>repr(value)</code> exposes whitespace and quoting that <code>print(value)</code> can hide. Logs should identify the operation and safe context, not dump credentials or whole sensitive records.</p>
    <CodeBlock label="Make invisible characters visible while debugging">{`raw = "alice\\tLOGIN_FAILED\\n"
print(raw)             # output contains a tab and a line break
print(repr(raw))       # 'alice\\tLOGIN_FAILED\\n'
print(type(raw), len(raw))

fields = raw.rstrip("\\r\\n").split("\\t")
breakpoint()           # inspect fields, then continue with c in a debugger`}</CodeBlock>
    <h2>Type hints document intent, but do not validate runtime input</h2>
    <p>Python type annotations are metadata. They help editors, reviewers, and static checkers find mismatches, but ordinary Python does not enforce them when a function is called. A value arriving from JSON, CSV, a socket, or an environment variable still needs runtime validation. Use types to describe trusted internal values after parsing, and use explicit validators at untrusted boundaries.</p>
    <CodeBlock label="Use annotations to make a function's data contract visible">{`from collections.abc import Iterable
from typing import TypedDict

class Event(TypedDict):
    timestamp: str
    event: str
    user: str

def count_failures(events: Iterable[Event]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for event in events:
        if event["event"] == "LOGIN_FAILED":
            user = event["user"]
            counts[user] = counts.get(user, 0) + 1
    return counts`}</CodeBlock>
    <p><code>Iterable[Event]</code> says the function can consume a sequence or generator of event-shaped values. The result type says each key is a username and each value is an integer count. A <code>TypedDict</code> helps a checker understand dictionary keys; it does not reject malformed dictionaries at runtime. For runtime schemas, validate explicitly or use a maintained validation library when the project needs its added dependency.</p>
    <h2>Test doubles and integration boundaries</h2>
    <p>Unit tests should not need a real production database or external network. Inject a small dependency such as a file object, clock, or repository interface so a test can provide a controlled substitute. Integration tests then verify that the real pieces work together: a temporary SQLite database, a temporary directory, or a local test server. Keep tests deterministic by avoiding current time, random values, and public services unless you control those inputs.</p>
    <Callout variant="warn"><p>Never place a real password, API key, session token, or private customer record in a test fixture that can be committed. Use synthetic data and deliberately invalid credentials. Logs and assertion output are often retained by CI systems.</p></Callout>
    <PracticeTasksCallout tasks={[{ id: 'py-fund-14', title: 'Safe Config Parsing With Try/Except' }, { id: 'py-fund-16', title: 'Extract All IP Addresses From a Block of Text' }]} />
    <p><strong>Further reading:</strong> <a href="https://docs.python.org/3/library/unittest.html" target="_blank" rel="noreferrer">Python unittest</a>, <a href="https://docs.pytest.org/en/stable/" target="_blank" rel="noreferrer">pytest documentation</a>, and <a href="https://typing.python.org/en/latest/" target="_blank" rel="noreferrer">Python typing documentation</a>.</p>
  </div>;
}
