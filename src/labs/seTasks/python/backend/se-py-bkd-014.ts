import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Sliding Window Rate Limiter

Limit each client to at most \`limit\` requests within the last \`window\` seconds. The current time
is passed in as a plain argument (\`now\`) rather than read from the real clock — that's what makes
this testable without actually waiting: a test can simulate time passing just by passing a bigger
number.
`;

const STARTER = `REQUEST_LOG = {}


def allow_request(client_id, now, limit=3, window=60):
    """Return True if client_id may make a request at time \`now\`, False if they've hit the limit.
    A request is "within the window" if it happened at time >= now - window.

    On every call (whether allowed or not... actually only when ALLOWED):
    - Drop any of client_id's logged timestamps older than (now - window).
    - If fewer than \`limit\` requests remain in the window, record \`now\` as a new request and
      return True.
    - Otherwise return False (and do NOT record this attempt)."""
    # TODO
    pass
`;

const SOLUTION = `REQUEST_LOG = {}


def allow_request(client_id, now, limit=3, window=60):
    timestamps = REQUEST_LOG.get(client_id, [])
    timestamps = [t for t in timestamps if t >= now - window]

    if len(timestamps) < limit:
        timestamps.append(now)
        REQUEST_LOG[client_id] = timestamps
        return True

    REQUEST_LOG[client_id] = timestamps
    return False
`;

const TEST_CODE = `from rate_limiter import allow_request

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("1st request allowed", allow_request("client-a", 0, limit=3, window=60), True)
__check__("2nd request allowed", allow_request("client-a", 1, limit=3, window=60), True)
__check__("3rd request allowed", allow_request("client-a", 2, limit=3, window=60), True)
__check__("4th request within the window is blocked", allow_request("client-a", 3, limit=3, window=60), False)

__check__("a different client has its own independent limit", allow_request("client-b", 3, limit=3, window=60), True)

__check__("after the window fully elapses, requests are allowed again", allow_request("client-a", 100, limit=3, window=60), True)

__check__("2nd request in the new window is still allowed", allow_request("client-a", 100, limit=3, window=60), True)
__check__("3rd request in the new window is still allowed", allow_request("client-a", 100, limit=3, window=60), True)
__check__("4th in the new window is blocked too", allow_request("client-a", 101, limit=3, window=60), False)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-014',
  title: 'Sliding Window Rate Limiter',
  difficulty: 'Hard',
  language: 'python',
  track: 'backend',
  category: 'Caching & Rate Limiting',
  tags: ['rate-limiting'],
  prompt: 'Implement a per-client sliding-window rate limiter — old requests age out of the window automatically, so the limit is always "in the last N seconds," not "since the server started."',
  hints: [
    'Start by pruning: `[t for t in timestamps if t >= now - window]` drops every timestamp that has aged out, leaving only the ones still "in the window."',
    'Compare the PRUNED list\'s length to `limit` — that\'s the count of requests still within the window, not the raw historical count.',
    'Only append `now` and save it back to `REQUEST_LOG` in the ALLOWED branch — a rejected request should not count toward future limits.',
    'Even in the rejected branch, still save the pruned (shorter) list back to `REQUEST_LOG[client_id]` — otherwise old timestamps you already filtered out would just reappear on the next call.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('rate_limiter.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('rate_limiter.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Sliding Window Rate Limiter', kind: 'python', entry: 'rate_limiter.py', testCode: TEST_CODE }],
};

export default task;
