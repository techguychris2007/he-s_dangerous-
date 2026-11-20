import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ProductionReliability() {
  return <div className="prose-hh">
    <h1>Production Reliability, Queues &amp; Delivery</h1>
    <p>A production service must handle slow dependencies, partial outages, duplicate requests, growing data, and changes that introduce defects. Reliability comes from explicit limits and observable behavior, not from assuming failures will not occur. This lesson introduces timeouts, retries, idempotency, back pressure, caching, metrics, CI, and deployment artifacts.</p>
    <h2>Timeouts bound how long work can consume resources</h2>
    <p>Every call across a process or network boundary needs a deadline or timeout. If service A waits indefinitely for service B, its worker pool can fill and prevent healthy requests from progressing. A timeout should propagate through the call chain so a downstream operation does not continue after the caller has abandoned it. Choose limits based on a service objective and observed latency distributions.</p>
    <h2>Retries can amplify an outage</h2>
    <p>Retry only failures likely to be transient, such as a connection reset or a selected rate-limit response. Use a small maximum attempt count, exponential backoff, and jitter so many clients do not retry simultaneously. Do not retry invalid requests, authentication failures, or operations with uncertain side effects unless the operation is idempotent or protected by an idempotency key.</p>
    <CodeBlock label="Bounded retry schedule with exponential backoff and jitter">{`import random

def retry_delays(attempts, base=0.2, cap=5.0):
    """Yield waits before retries; caller still decides which errors are retryable."""
    for attempt in range(attempts):
        ceiling = min(cap, base * (2 ** attempt))
        yield random.uniform(0, ceiling)

for delay in retry_delays(4):
    print(round(delay, 3))  # in a real client: sleep only after a retryable failure`}</CodeBlock>
    <p>This code only illustrates a schedule. A robust client also needs an overall deadline, cancellation, retryable status classification, and a way to report the final cause. Never put a retry loop around all exceptions: doing so can conceal a programming defect and repeat a dangerous side effect.</p>
    <h2>Idempotency makes duplicate delivery safe</h2>
    <p>An operation is idempotent when repeating it has the same intended effect as performing it once. “Set status to closed” can be idempotent; “add 10 to balance” is not. Networks can fail after a server commits but before the response reaches the client, leaving the caller uncertain. A unique idempotency key lets a service recognize a retry and return the prior outcome rather than applying the action twice.</p>
    <h2>Queues, workers, and back pressure</h2>
    <p>A message queue separates request acceptance from background processing. It can smooth bursts and allow independent scaling, but it introduces delivery semantics, visibility timeouts, retries, ordering, dead-letter handling, and operational monitoring. Many queues deliver at least once, so consumers should be idempotent. Bound queue length and worker concurrency; without back pressure a system may accept work faster than it can process and fail later with exhausted memory or stale jobs.</p>
    <h2>Caching requires a freshness contract</h2>
    <p>A cache stores a result to avoid repeating expensive work. Cache-aside checks the cache, loads from the source on a miss, then stores the result with a time-to-live (TTL). The hard question is invalidation: when the underlying record changes, how long may a stale value be served? Define the acceptable staleness and whether a cache outage should fail open, fall back to the database, or reject the request. Never let a cache become an undocumented source of truth.</p>
    <CodeBlock label="A bounded in-process cache using functools">{`from functools import lru_cache

@lru_cache(maxsize=512)
def parse_policy(policy_text):
    # This is safe to cache only if the output depends solely on this immutable input.
    # Return an immutable representation or ensure callers do not mutate shared results.
    return tuple(rule.strip() for rule in policy_text.splitlines() if rule.strip())

parse_policy.cache_info()  # hits, misses, capacity, and current size`}</CodeBlock>
    <h2>Observability: logs, metrics, and traces answer different questions</h2>
    <p>Logs record discrete events and context; metrics aggregate numeric signals over time; traces connect one request across services. Use structured logs with a request identifier, event name, and safe fields. Avoid secrets, access tokens, and unnecessary personal data. Metrics should have bounded labels: placing user IDs or arbitrary URLs into labels can create an unbounded number of time series. Alert on user-visible symptoms and service objectives, not every noisy internal event.</p>
    <h2>Continuous integration and deployment</h2>
    <p>Continuous integration runs repeatable checks on proposed changes: formatting, static checks, unit tests, integration tests, and dependency or secret scanning. A container packages an application with its runtime dependencies, but it still shares the host kernel and needs least-privilege configuration, patched base images, non-root execution where possible, and secrets injected at runtime. Deployment should support health checks and a rollback path.</p>
    <CodeBlock label="An example CI sequence, independent of a specific vendor">{`# A project might run these checks on each pull request:
python -m compileall src
python -m pytest
python -m ruff check src tests
python -m pip check

# A deployment pipeline then builds an immutable artifact,
# scans it, tests it in a staging environment, and promotes that artifact.`}</CodeBlock>
    <Callout variant="info"><p>“Exactly once” processing is rarely a property that a queue can guarantee across every failure boundary. Design for at-least-once delivery and make repeated handling safe, or use a transactional outbox/inbox pattern when the database update and message publication must remain coordinated.</p></Callout>
    <p><strong>Further reading:</strong> <a href="https://github.com/donnemartin/system-design-primer" target="_blank" rel="noreferrer">System Design Primer</a> covers caching, queues, and scaling tradeoffs; <a href="https://cheatsheetseries.owasp.org/" target="_blank" rel="noreferrer">OWASP Cheat Sheet Series</a> has secure implementation guidance; and <a href="https://docs.python.org/3/library/functools.html#functools.lru_cache" target="_blank" rel="noreferrer">functools.lru_cache</a> documents Python's bounded memoization utility.</p>
  </div>;
}
