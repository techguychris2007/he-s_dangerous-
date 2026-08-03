import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';
import PracticeTasksCallout from '../../components/lesson/PracticeTasksCallout';

export default function RegexConcurrencyAndCaching() {
  return (
    <div className="prose-hh">
      <h1>Advanced Regex, Concurrency &amp; Caching</h1>
      <p>
        This final lesson covers three tools that turn a working script into a genuinely efficient one:
        expressing complex validation in a single regex, running many slow operations at once instead of
        one at a time, and avoiding repeated expensive work entirely with caching.
      </p>

      <h2>Lookaheads — checking multiple conditions in one regex</h2>
      <p>
        A normal regex match consumes characters as it goes. A <strong>lookahead</strong> —{' '}
        <code>(?=...)</code> — checks that something exists ahead in the string <em>without</em> consuming
        it, which lets you stack several independent requirements at the very start of a pattern.
      </p>
      <CodeBlock label="one regex enforcing four separate rules">{`import re

def is_strong_password(pw):
    pattern = r"(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{10,}"
    return bool(re.fullmatch(pattern, pw))

# (?=.*[a-z])   somewhere ahead, a lowercase letter
# (?=.*[A-Z])   somewhere ahead, an uppercase letter
# (?=.*\\d)      somewhere ahead, a digit
# (?=.*[!@#$%^&*])  somewhere ahead, a symbol
# .{10,}         then actually consume at least 10 characters total

print(is_strong_password("Tr0ub4dor&3x"))   # True
print(is_strong_password("alllowercase1!")) # False — no uppercase`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Each lookahead is evaluated from the same starting position (the beginning of the string), which
          is exactly why you can stack four of them in a row without them interfering with each other — none
          of them actually "moves the cursor" forward.
        </p>
      </Callout>

      <h2>Named groups — pulling structured fields out of a match</h2>
      <CodeBlock label="re.match with named groups">{`log_pattern = re.compile(r"(?P<ip>[\\d.]+) - - \\[(?P<time>[^\\]]+)\\] \"(?P<method>\\w+) (?P<path>\\S+)"

m = log_pattern.match('203.0.113.5 - - [01/Jan/2024:09:00:00] "GET /admin')
if m:
    print(m.group("ip"))      # "203.0.113.5"
    print(m.group("method"))  # "GET"
    print(m.groupdict())       # the whole thing as a dict`}</CodeBlock>
      <p>
        Named groups turn "some regex with a bunch of parentheses I have to count" into self-documenting
        code — <code>m.group("ip")</code> reads clearly regardless of how many other groups are in the
        pattern.
      </p>

      <h2>asyncio — running many slow operations concurrently</h2>
      <p>
        Checking whether one host is reachable involves waiting on the network — mostly idle time, not CPU
        work. <code>asyncio</code> lets you kick off many such waits at once and let them all progress
        while you're not actively doing anything else, instead of finishing one completely before starting
        the next.
      </p>
      <CodeBlock label="async/await and asyncio.gather">{`import asyncio

async def check_host(host, delay):
    await asyncio.sleep(delay)   # stands in for a real network round-trip
    return f"{host}: reachable"

async def check_hosts_concurrently(hosts_with_delays):
    coroutines = [check_host(host, delay) for host, delay in hosts_with_delays]
    return await asyncio.gather(*coroutines)   # runs all of them concurrently

# checking 3 hosts that each take 0.5s takes ~0.5s total, not ~1.5s,
# because they're all waiting on their own asyncio.sleep at the same time`}</CodeBlock>
      <Callout variant="info">
        <p>
          <code>async def</code> defines a <em>coroutine function</em> — calling it doesn't run the body
          immediately, it creates a coroutine object (similar in spirit to how calling a generator function
          doesn't run it either). <code>await</code> is what actually resumes/drives a coroutine, and{' '}
          <code>asyncio.gather(*coroutines)</code> drives several of them concurrently, returning all their
          results together once every one of them has finished.
        </p>
      </Callout>
      <p>
        This is a different concurrency model than the threading you may have seen in the "Black Hat
        Python" module's port scanner lesson — threading uses real OS threads and works well for blocking
        I/O calls that weren't written with asyncio in mind; <code>asyncio</code> uses a single thread that
        cooperatively switches between tasks at each <code>await</code>, and is the modern standard for new
        code built around network I/O.
      </p>

      <h2>When the GIL actually blocks you: multiprocessing</h2>
      <p>
        Threading and asyncio both speed up I/O-bound waiting, but neither helps genuinely CPU-bound work
        (hashing millions of candidate passwords, say) — Python's Global Interpreter Lock means only one
        thread executes Python bytecode at a time, no matter how many threads you spin up.{' '}
        <code>multiprocessing</code> sidesteps the GIL entirely by using separate OS processes, each with its
        own interpreter and memory space, and is the correct tool specifically when the bottleneck is CPU,
        not network waiting:
      </p>
      <CodeBlock label="hashing candidates across real parallel processes">{`from multiprocessing import Pool
import hashlib

def hash_candidate(word):
    return word, hashlib.sha256(word.encode()).hexdigest()

if __name__ == "__main__":
    candidates = ["password1", "letmein", "hunter2"]   # in practice, a large wordlist
    with Pool(processes=4) as pool:
        results = pool.map(hash_candidate, candidates)   # genuinely runs on 4 separate CPU cores at once`}</CodeBlock>
      <p>
        The rule of thumb this closes out: threading/asyncio for I/O-bound work (network calls, file reads —
        the vast majority of this course's scanning and recon tooling), multiprocessing for CPU-bound work
        (hashing, cracking, heavy computation) — picking the wrong one for the bottleneck you actually have is
        a common reason a "concurrent" rewrite doesn't actually get any faster.
      </p>

      <h2>Caching expensive work with functools.lru_cache</h2>
      <CodeBlock label="memoization in one line">{`from functools import lru_cache

@lru_cache(maxsize=None)
def expensive_hash_lookup(value):
    print(f"actually computing for {value}")   # only prints on a true cache miss
    return f"hash-of-{value}"

expensive_hash_lookup("abc")   # prints "actually computing for abc", then returns
expensive_hash_lookup("abc")   # returns instantly from cache — nothing printed
expensive_hash_lookup("xyz")   # a different argument — prints again, computes fresh`}</CodeBlock>
      <p>
        <code>@lru_cache</code> remembers the result of every distinct set of arguments a function has been
        called with, and returns the cached result instantly on any repeat call — perfect for expensive
        lookups (hash computations, parsed data, repeated I/O) where the same input legitimately comes up
        more than once in a single run.
      </p>

      <PracticeTasksCallout
        tasks={[
          { id: 'py-adv-08', title: 'Validate a Strong Password With One Regex' },
          { id: 'py-adv-12', title: 'Concurrent Host Checks With asyncio.gather' },
          { id: 'py-adv-10', title: 'Memoize an Expensive Lookup With lru_cache' },
        ]}
      />

      <p>
        That's the full Python track for now — Fundamentals, OOP, and Advanced, with 53 practice tasks to
        work through in the Code Portal. C++ and JavaScript tracks are next.
      </p>
    </div>
  );
}
