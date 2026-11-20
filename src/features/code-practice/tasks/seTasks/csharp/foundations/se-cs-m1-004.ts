import { pf, type ProjectTask } from '../../../projectTypes';
import { csTests } from '../../../csharpTasks/harness';

const README = `# Week 4 Assignment: Tested Engineering Challenge

Build a component **and** prove it works. You are graded on both halves:

1. **Implementation** — \`SlidingWindowRateLimiter\` must pass hidden behaviour tests.
2. **Your tests** — \`LearnerTests.Run\` must pass against a correct limiter **and catch six planted
   bugs** (mutation testing). Coverage does not count here; only the bugs your tests detect do.

## The component

A rate limiter protects an API from clients that send too many requests. This one allows each
client at most \`limit\` requests in any rolling \`window\` of time:

- \`TryAcquire(clientId)\` returns \`true\` and records the request if the client has made fewer than
  \`limit\` requests in the last \`window\`; otherwise returns \`false\` and records nothing.
- A request made at time *t* stops counting at exactly *t + window*.
- \`Remaining(clientId)\` — how many more requests the client could make right now.
- \`RetryAfter(clientId)\` — \`TimeSpan.Zero\` if a request would succeed now, otherwise the time until the
  oldest counted request expires.
- Clients are independent and ids are case-sensitive.
- The constructor rejects \`limit < 1\` and non-positive windows with \`ArgumentOutOfRangeException\`.
- Time comes only from the injected \`TimeProvider\`.

Use a \`Queue<DateTimeOffset>\` per client so each call does O(1) amortised work.

## Your tests

\`LearnerTests.Run(create, clock)\` receives a factory that builds a limiter of whatever implementation the
grader is checking, and a \`ManualClock\` you can \`Advance\`. Return one \`bool\` per check. Think in
equivalence classes and boundaries: exactly at the limit, exactly at the window edge, two clients, the
value of \`RetryAfter\` when blocked, and what a refused request must *not* do.
`;

const CONTRACT = `public interface IRateLimiter
{
    bool TryAcquire(string clientId);
    int Remaining(string clientId);
    TimeSpan RetryAfter(string clientId);
}

/// <summary>A TimeProvider that only moves when told to.</summary>
public sealed class ManualClock(DateTimeOffset start) : TimeProvider
{
    private DateTimeOffset _now = start;
    public override DateTimeOffset GetUtcNow() => _now;
    public void Advance(TimeSpan by) => _now += by;
}
`;

const LIMITER_STARTER = `public sealed class SlidingWindowRateLimiter : IRateLimiter
{
    public SlidingWindowRateLimiter(int limit, TimeSpan window, TimeProvider time)
    {
        throw new NotImplementedException();
    }

    public bool TryAcquire(string clientId) => throw new NotImplementedException();

    public int Remaining(string clientId) => throw new NotImplementedException();

    public TimeSpan RetryAfter(string clientId) => throw new NotImplementedException();
}
`;

const LIMITER_SOLUTION = `public sealed class SlidingWindowRateLimiter : IRateLimiter
{
    private readonly int _limit;
    private readonly TimeSpan _window;
    private readonly TimeProvider _time;
    private readonly Dictionary<string, Queue<DateTimeOffset>> _requests = new(StringComparer.Ordinal);

    public SlidingWindowRateLimiter(int limit, TimeSpan window, TimeProvider time)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(limit, 1);
        if (window <= TimeSpan.Zero) throw new ArgumentOutOfRangeException(nameof(window), "The window must be positive.");
        _limit = limit;
        _window = window;
        _time = time;
    }

    public bool TryAcquire(string clientId)
    {
        var queue = Current(clientId);
        if (queue.Count >= _limit) return false;
        queue.Enqueue(_time.GetUtcNow());
        return true;
    }

    public int Remaining(string clientId) => _limit - Current(clientId).Count;

    public TimeSpan RetryAfter(string clientId)
    {
        var queue = Current(clientId);
        return queue.Count < _limit ? TimeSpan.Zero : queue.Peek() + _window - _time.GetUtcNow();
    }

    /// <summary>The client's queue with every request older than the window removed.</summary>
    private Queue<DateTimeOffset> Current(string clientId)
    {
        if (!_requests.TryGetValue(clientId, out var queue)) _requests[clientId] = queue = new Queue<DateTimeOffset>();
        var now = _time.GetUtcNow();
        while (queue.Count > 0 && now - queue.Peek() >= _window) queue.Dequeue();
        return queue;
    }
}
`;

const LEARNER_TESTS_STARTER = `public static class LearnerTests
{
    /// <summary>
    /// create(limit, window) builds the limiter being graded, wired to clock. Return one bool per check.
    /// </summary>
    public static IEnumerable<bool> Run(Func<int, TimeSpan, IRateLimiter> create, ManualClock clock)
    {
        var limiter = create(2, TimeSpan.FromSeconds(10));
        yield return limiter.TryAcquire("a");     // example: the first request is allowed

        // TODO: your checks. Each planted bug is caught by a check about a specific rule in README.md.
    }
}
`;

const LEARNER_TESTS_SOLUTION = `public static class LearnerTests
{
    public static IEnumerable<bool> Run(Func<int, TimeSpan, IRateLimiter> create, ManualClock clock)
    {
        var window = TimeSpan.FromSeconds(10);
        var limiter = create(2, window);

        yield return limiter.Remaining("a") == 2;
        yield return limiter.TryAcquire("a");                      // t = 0
        yield return limiter.Remaining("a") == 1;
        clock.Advance(TimeSpan.FromSeconds(3));
        yield return limiter.TryAcquire("a");                      // t = 3
        yield return !limiter.TryAcquire("a");                     // limit reached
        yield return limiter.Remaining("a") == 0;
        yield return limiter.TryAcquire("b");                      // clients are independent
        yield return limiter.RetryAfter("a") == TimeSpan.FromSeconds(7);   // the t = 0 request expires at t = 10

        clock.Advance(TimeSpan.FromSeconds(6.999));
        yield return !limiter.TryAcquire("a");                     // t = 9.999: still inside the window
        clock.Advance(TimeSpan.FromMilliseconds(1));               // t = 10: exactly one window after the first
        yield return limiter.RetryAfter("a") == TimeSpan.Zero;
        yield return limiter.TryAcquire("a");                      // refused attempts must not have used up this slot
        yield return !limiter.TryAcquire("a");                     // t = 3 and t = 10 now fill the window

        var fresh = create(1, TimeSpan.FromSeconds(30));
        yield return fresh.RetryAfter("x") == TimeSpan.Zero;
    }
}
`;

const PROGRAM = `var clock = new ManualClock(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
var limiter = new SlidingWindowRateLimiter(3, TimeSpan.FromSeconds(10), clock);
for (int i = 1; i <= 4; i++)
    Console.WriteLine($"request {i}: {(limiter.TryAcquire("client-1") ? "allowed" : "blocked, retry after " + limiter.RetryAfter("client-1"))}");

var results = LearnerTests.Run((limit, window) => new SlidingWindowRateLimiter(limit, window, clock), clock).ToList();
Console.WriteLine($"Your tests on your limiter: {results.Count(ok => ok)}/{results.Count} pass");
`;

const TESTS = `/// <summary>A configurable reference limiter: correct by default, with switches that plant one bug each.</summary>
public sealed class ReferenceLimiter(int limit, TimeSpan window, TimeProvider time, string bug = "") : IRateLimiter
{
    private readonly Dictionary<string, Queue<DateTimeOffset>> _requests = new();
    private string Key(string id) => bug == "shared" ? "*" : id;
    private Queue<DateTimeOffset> Current(string id)
    {
        if (!_requests.TryGetValue(Key(id), out var q)) _requests[Key(id)] = q = new();
        var now = time.GetUtcNow();
        while (q.Count > 0 && (bug == "edge" ? now - q.Peek() > window : now - q.Peek() >= window)) q.Dequeue();
        if (bug == "never-expires") { }
        return q;
    }
    public bool TryAcquire(string id)
    {
        var q = bug == "never-expires" ? Raw(id) : Current(id);
        int max = bug == "off-by-one" ? limit + 1 : limit;
        if (q.Count >= max) { if (bug == "records-refused") q.Enqueue(time.GetUtcNow()); return false; }
        q.Enqueue(time.GetUtcNow());
        return true;
    }
    private Queue<DateTimeOffset> Raw(string id) { if (!_requests.TryGetValue(Key(id), out var q)) _requests[Key(id)] = q = new(); return q; }
    public int Remaining(string id) => Math.Max(0, limit - (bug == "never-expires" ? Raw(id) : Current(id)).Count);
    public TimeSpan RetryAfter(string id)
    {
        var q = bug == "never-expires" ? Raw(id) : Current(id);
        if (q.Count < limit) return TimeSpan.Zero;
        return bug == "retry-window" ? window : q.Peek() + window - time.GetUtcNow();
    }
}
` + csTests(`
var start = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
var w = TimeSpan.FromSeconds(10);
(SlidingWindowRateLimiter L, ManualClock C) Mine(int limit = 2) { var c = new ManualClock(start); return (new SlidingWindowRateLimiter(limit, w, c), c); }

// Part 1 — your implementation
Check("allows up to the limit", () => { var (l, _) = Mine(); return (l.TryAcquire("a"), l.TryAcquire("a"), l.TryAcquire("a")); }, (true, true, false));
Check("remaining", () => { var (l, _) = Mine(3); l.TryAcquire("a"); return l.Remaining("a"); }, 2);
Check("clients independent", () => { var (l, _) = Mine(1); l.TryAcquire("a"); return l.TryAcquire("b"); }, true);
Check("ids are case-sensitive", () => { var (l, _) = Mine(1); l.TryAcquire("a"); return l.TryAcquire("A"); }, true);
Check("expires exactly at window", () => { var (l, c) = Mine(1); l.TryAcquire("a"); c.Advance(w); return l.TryAcquire("a"); }, true);
Check("still blocked just before", () => { var (l, c) = Mine(1); l.TryAcquire("a"); c.Advance(w - TimeSpan.FromMilliseconds(1)); return l.TryAcquire("a"); }, false);
Check("retry after", () => { var (l, c) = Mine(2); l.TryAcquire("a"); c.Advance(TimeSpan.FromSeconds(3)); l.TryAcquire("a"); return l.RetryAfter("a"); }, TimeSpan.FromSeconds(7));
Check("retry after when free", () => Mine().L.RetryAfter("zzz"), TimeSpan.Zero);
Check("refused requests not recorded", () => { var (l, c) = Mine(1); l.TryAcquire("a"); c.Advance(TimeSpan.FromSeconds(5)); l.TryAcquire("a"); c.Advance(TimeSpan.FromSeconds(5)); return l.TryAcquire("a"); }, true);
Check("sliding, not fixed buckets", () => { var (l, c) = Mine(2); l.TryAcquire("a"); c.Advance(TimeSpan.FromSeconds(6)); l.TryAcquire("a"); c.Advance(TimeSpan.FromSeconds(5)); return (l.TryAcquire("a"), l.TryAcquire("a")); }, (true, false));
Throws<ArgumentOutOfRangeException>("limit must be positive", () => new SlidingWindowRateLimiter(0, w, new ManualClock(start)));
Throws<ArgumentOutOfRangeException>("window must be positive", () => new SlidingWindowRateLimiter(1, TimeSpan.Zero, new ManualClock(start)));
Expect("handles 100k requests quickly", () => { var (l, c) = Mine(50); for (int i = 0; i < 100_000; i++) { l.TryAcquire("hot"); c.Advance(TimeSpan.FromMilliseconds(1)); } return true; }, "too slow");

// Part 2 — your tests, mutation-graded
List<bool> RunTests(string bug) { var c = new ManualClock(start); return LearnerTests.Run((limit, window) => new ReferenceLimiter(limit, window, c, bug), c).ToList(); }
Expect("your tests pass on a correct limiter", () => RunTests("") is { Count: >= 5 } r && r.All(ok => ok), "write at least 5 checks, all true on correct code");
Expect("your tests pass on your own limiter", () => { var c = new ManualClock(start); var r = LearnerTests.Run((limit, window) => new SlidingWindowRateLimiter(limit, window, c), c).ToList(); return r.Count > 0 && r.All(ok => ok); }, "your tests and your implementation disagree");
foreach (var (bug, description) in new[]
{
    ("off-by-one", "the limiter allows one request too many"),
    ("edge", "a request still counts at exactly window age"),
    ("shared", "all clients share one counter"),
    ("records-refused", "refused requests are recorded"),
    ("retry-window", "RetryAfter always returns the full window"),
    ("never-expires", "requests never expire"),
})
    Expect($"your tests catch: {description}", () => RunTests(bug).Any(ok => !ok), $"no check fails when {description}");
`);

const task: ProjectTask = {
  id: 'se-cs-m1-004',
  title: 'Week 4: Tested Engineering Challenge',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'foundations',
  category: 'Month 1 · C# & Engineering Foundations',
  tags: ['testing', 'mutation testing', 'rate limiting', 'queues', 'TimeProvider'],
  prompt:
    'Build a sliding-window rate limiter with an injected clock — and the test suite that proves it. Your implementation must pass hidden ' +
    'behaviour tests, including exact window-edge behaviour and an O(1)-amortised design that handles 100,000 requests. Your own tests must ' +
    'pass on a correct limiter and catch six planted bugs: an off-by-one limit, a wrong window edge, shared counters, recorded refusals, a ' +
    'wrong retry time and requests that never expire. README.md specifies every rule.',
  hints: [
    'Keep a Queue<DateTimeOffset> per client. Before answering any question about a client, dequeue every timestamp whose age (now − timestamp) is at least the window.',
    'RetryAfter when blocked is the oldest timestamp + window − now: the moment the first slot frees up.',
    'For your tests, walk through a timeline with the ManualClock: fill to the limit, check refusal, advance to just inside and exactly at the window edge, and compare RetryAfter with exact TimeSpans.',
    'One mutant only shows up if you test with two different client ids; another only if a refused request is followed later by a check that it was not counted.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('Contract.cs', CONTRACT, { editable: false }),
    pf('SlidingWindowRateLimiter.cs', LIMITER_STARTER),
    pf('LearnerTests.cs', LEARNER_TESTS_STARTER),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('Contract.cs', CONTRACT, { editable: false }),
    pf('SlidingWindowRateLimiter.cs', LIMITER_SOLUTION),
    pf('LearnerTests.cs', LEARNER_TESTS_SOLUTION),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Rate limiter + your tests', kind: 'csharp', entry: 'Program.cs', testCode: TESTS }],
};

export default task;
