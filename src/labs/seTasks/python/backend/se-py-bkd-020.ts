import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Structured Logging

Plain \`print()\` debugging doesn't scale — real systems log structured events (a level, a message,
and arbitrary key/value context) so they can be filtered and queried later. Build a tiny structured
logger and a query function over its history.
`;

const STARTER = `LOG_HISTORY = []


def log_event(level, message, **context):
    """Append {"level": level, "message": message, "context": context} to LOG_HISTORY.
    (context collects any extra keyword arguments the caller passes, e.g.
    log_event("ERROR", "payment failed", user_id=42, amount=9.99) -> context is
    {"user_id": 42, "amount": 9.99}.)"""
    # TODO
    pass


def query_logs(level=None, **context_filters):
    """Return every entry in LOG_HISTORY that matches:
    - level, if given (skip this check if level is None — match any level)
    - EVERY key/value pair in context_filters (an entry only matches if its own context has that
      key with that exact value; if context_filters is empty, this check always passes)."""
    # TODO
    pass
`;

const SOLUTION = `LOG_HISTORY = []


def log_event(level, message, **context):
    LOG_HISTORY.append({"level": level, "message": message, "context": context})


def query_logs(level=None, **context_filters):
    results = []
    for entry in LOG_HISTORY:
        if level is not None and entry["level"] != level:
            continue
        if not all(entry["context"].get(k) == v for k, v in context_filters.items()):
            continue
        results.append(entry)
    return results
`;

const TEST_CODE = `from logging_lib import log_event, query_logs, LOG_HISTORY

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

log_event("INFO", "server started")
log_event("ERROR", "payment failed", user_id=42, amount=9.99)
log_event("ERROR", "payment failed", user_id=7, amount=3.5)
log_event("INFO", "user logged in", user_id=42)

__check__("all events recorded", len(LOG_HISTORY), 4)
__check__("event stores the message", LOG_HISTORY[1]["message"], "payment failed")
__check__("event collects context kwargs", LOG_HISTORY[1]["context"], {"user_id": 42, "amount": 9.99})

errors = query_logs(level="ERROR")
__check__("query by level filters correctly", len(errors), 2)

user42_events = query_logs(user_id=42)
__check__("query by context filters correctly", len(user42_events), 2)

user42_errors = query_logs(level="ERROR", user_id=42)
__check__("query combines level and context filters", len(user42_errors), 1)
__check__("combined query finds the right entry", user42_errors[0]["message"], "payment failed")

__check__("query with no filters returns everything", len(query_logs()), 4)
__check__("query for a level with no matches is empty", query_logs(level="DEBUG"), [])

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-020',
  title: 'Structured Logging',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'Observability',
  tags: ['logging', 'observability'],
  prompt: 'Build a structured logger (level + message + arbitrary key/value context) and a query function that can filter that history by level, by context, or both.',
  hints: [
    '`**context` in the function signature collects every extra keyword argument into a dict — `log_event("ERROR", "x", user_id=42)` gives you `context == {"user_id": 42}` for free.',
    '`log_event` is a single `LOG_HISTORY.append({...})` call assembling the three fields.',
    'In `query_logs`, skip an entry with `continue` the moment ANY filter fails — check `level` first, then the context filters.',
    '`all(entry["context"].get(k) == v for k, v in context_filters.items())` checks every requested context filter at once — and is vacuously `True` when `context_filters` is empty, so "no filters" naturally means "match everything."',
  ],
  files: [pf('README.md', README, { editable: false }), pf('logging_lib.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('logging_lib.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Structured Logging', kind: 'python', entry: 'logging_lib.py', testCode: TEST_CODE }],
};

export default task;
