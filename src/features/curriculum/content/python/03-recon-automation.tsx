import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ReconAutomation() {
  return (
    <div className="prose-hh">
      <h1>Automating Recon with Requests &amp; Threading</h1>
      <p>
        Manual <code>curl</code> commands don't scale past a handful of URLs. Every serious recon workflow
        — directory brute-forcing, subdomain probing, bulk screenshot-style status checks — is a Python
        script wrapping the <code>requests</code> library with concurrency.
      </p>

      <h2>The requests library basics</h2>
      <CodeBlock>{`import requests

resp = requests.get("http://10.10.10.5", timeout=3)
print(resp.status_code)     # 200
print(resp.headers)          # server, content-type, etc.
print(resp.text[:200])        # first 200 chars of body

# POST with form data — for login forms, search boxes
resp = requests.post("http://10.10.10.5/login", data={"user": "admin", "pass": "test"})

# custom headers — spoofing UA, adding auth tokens
headers = {"User-Agent": "Mozilla/5.0", "Authorization": "Bearer <token>"}
resp = requests.get("http://10.10.10.5/api/data", headers=headers)`}</CodeBlock>

      <h2>Sessions: reusing connections instead of paying handshake cost every request</h2>
      <p>
        Calling <code>requests.get()</code> repeatedly opens a fresh TCP (and TLS, for HTTPS) connection
        every single time. A <code>requests.Session</code> reuses the underlying connection pool between
        requests to the same host — a meaningful speedup once you're making hundreds of requests — and also
        persists cookies automatically across requests, which matters the moment a target sets a session
        cookie after login that later requests need to carry.
      </p>
      <CodeBlock label="session reuse + a real retry/backoff strategy">{`import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

session = requests.Session()
retries = Retry(total=3, backoff_factor=0.5, status_forcelist=[500, 502, 503, 504])
session.mount("https://", HTTPAdapter(max_retries=retries))
session.mount("http://", HTTPAdapter(max_retries=retries))

resp = session.get("http://10.10.10.5/dashboard", timeout=3)   # reuses the pooled connection, retries on 5xx`}</CodeBlock>
      <p>
        That retry strategy matters in practice: a flaky lab VM or a target briefly rate-limiting you
        shouldn't make your whole scan report false negatives — three retries with exponential backoff
        (0.5s, 1s, 2s) absorbs transient failures without hammering a struggling service.
      </p>

      <h2>A directory brute-forcer</h2>
      <CodeBlock label="bounded directory check with visible errors">{`import requests
from concurrent.futures import ThreadPoolExecutor

BASE = "http://10.10.10.5"  # replace only with the target named in your lab scope

def check_path(path):
    url = f"{BASE}/{path.lstrip('/')}"
    try:
        response = requests.get(url, timeout=3, allow_redirects=False)
    except requests.RequestException as error:
        return f"[request error] {url}: {error}"
    if response.status_code == 404:
        return None
    return f"[{response.status_code}] {url}"

with open("wordlist.txt", encoding="utf-8") as wordlist:
    paths = [line.strip() for line in wordlist if line.strip()]

# A modest worker count limits pressure on the authorized training service.
with ThreadPoolExecutor(max_workers=5) as pool:
    for result in pool.map(check_path, paths):
        if result is not None:
            print(result)`}</CodeBlock>
      <p>
        This is a small teaching example of the same request-and-classify loop used by directory discovery
        tools. Run it only against a system named in the lab or a target for which you have explicit
        authorization. A timeout is not evidence that a path is absent; the revised example prints request
        errors rather than silently discarding them. A 404 can also be customized by the application, so
        real work should establish a baseline for nonexistent paths before treating status codes as truth.
        Keep concurrency modest and follow the engagement's request-rate limits.
      </p>

      <h2>Parsing HTML for links (lightweight crawling)</h2>
      <CodeBlock>{`import re
import requests

resp = requests.get("http://10.10.10.5")
links = re.findall(r'href=["\\'](.*?)["\\']', resp.text)
print(links)

# for real projects, use BeautifulSoup instead of regex on HTML:
# from bs4 import BeautifulSoup
# soup = BeautifulSoup(resp.text, "html.parser")
# links = [a['href'] for a in soup.find_all('a', href=True)]`}</CodeBlock>

      <Callout variant="tip">
        <p>
          Regex-parsing HTML is a classic "don't do this in production" pattern — it breaks on malformed
          markup. Use it for a 5-minute one-off script; use <code>BeautifulSoup</code> or <code>lxml</code>
          for anything you'll reuse.
        </p>
      </Callout>

      <h2>Rate limiting yourself (yes, really)</h2>
      <CodeBlock>{`import time
from concurrent.futures import ThreadPoolExecutor

def check_with_delay(path):
    time.sleep(0.1)  # be a good citizen — avoid tripping WAF rate limits
    check_path(path)`}</CodeBlock>
      <Callout variant="warn">
        <p>
          An unthrottled multithreaded scanner against a client's production site during business hours is
          how you accidentally cause a denial-of-service on an authorized engagement — always agree on
          testing windows and rate limits with the client beforehand, and build throttling into your tools
          by default, not as an afterthought.
        </p>
      </Callout>

      <h2>Routing through a proxy — pivoting your own tooling</h2>
      <p>
        Once you have a foothold and need to reach a second network segment only visible from that
        compromised host, your Python tools need to route through it too — not just your browser. Setting up
        a SOCKS proxy (an SSH dynamic-forward tunnel, or a purpose-built tool like Chisel, tunneling a SOCKS
        proxy back through the compromised host) turns that host into a pivot point; <code>requests</code>{' '}
        just needs to know to use it:
      </p>
      <CodeBlock label="routing requests through a SOCKS proxy tunneled via a pivot host">{`import requests

proxies = {
    "http": "socks5h://127.0.0.1:1080",
    "https": "socks5h://127.0.0.1:1080",
}
resp = requests.get("http://172.16.5.10/internal-app", proxies=proxies, timeout=5)
# socks5h (not socks5) matters: the 'h' means DNS resolution happens on the PROXY side too —
# critical when the target hostname only resolves from inside the pivoted network at all`}</CodeBlock>
      <p>
        That <code>socks5h</code> vs <code>socks5</code> distinction is an easy, silent mistake: get it wrong
        and your script fails to resolve a hostname that only exists on the internal DNS server behind the
        pivot, with an error that looks like a connectivity problem rather than the actual DNS-resolution
        issue it is.
      </p>

      <h2>Beyond threads: when asyncio/aiohttp is the better tool</h2>
      <p>
        <code>ThreadPoolExecutor</code> is simple and works well into the hundreds of concurrent requests,
        but each thread still carries real OS overhead (its own stack, scheduling cost). For truly
        high-volume HTTP work — probing tens of thousands of URLs, the kind of job tools like httpx are built
        for — <code>asyncio</code> with <code>aiohttp</code> scales further, because coroutines are
        cooperatively scheduled inside a single thread instead of relying on OS thread scheduling:
      </p>
      <CodeBlock label="bounded async requests with explicit errors">{`import asyncio
import aiohttp

async def check_path(session, base, path):
    url = f"{base}/{path.lstrip('/')}"
    try:
        async with session.get(url, allow_redirects=False) as response:
            if response.status == 404:
                return None
            return f"[{response.status}] {url}"
    except (aiohttp.ClientError, asyncio.TimeoutError) as error:
        return f"[request error] {url}: {error}"

async def main(base, paths):
    timeout = aiohttp.ClientTimeout(total=3)
    connector = aiohttp.TCPConnector(limit=5)
    async with aiohttp.ClientSession(timeout=timeout, connector=connector) as session:
        results = await asyncio.gather(*(check_path(session, base, p) for p in paths))
    for result in results:
        if result is not None:
            print(result)

asyncio.run(main("http://10.10.10.5", ["admin", "login", "backup.zip"]))`}</CodeBlock>
      <p>
        The connector limit bounds simultaneous connections even though every candidate is scheduled as a
        coroutine. Threading and asyncio are implementation choices, not permission to increase request
        volume. Choose the simplest method that meets the lab's rate and scale requirements, and stop if
        the target becomes unstable.
      </p>

      <p>
        With scanning and HTTP automation covered, the final lesson in this module turns to writing the
        other classic category of offensive Python tool: brute-forcers and simple exploit proof-of-concepts.
      </p>
    </div>
  );
}
