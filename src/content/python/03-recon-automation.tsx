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
      <CodeBlock label="dirbrute.py">{`import requests
from concurrent.futures import ThreadPoolExecutor

BASE = "http://10.10.10.5"

def check_path(path):
    url = f"{BASE}/{path}"
    try:
        r = requests.get(url, timeout=2, allow_redirects=False)
        if r.status_code != 404:
            print(f"[{r.status_code}] {url}")
    except requests.RequestException:
        pass

with open("wordlist.txt") as f:
    paths = [line.strip() for line in f if line.strip()]

with ThreadPoolExecutor(max_workers=20) as pool:
    pool.map(check_path, paths)`}</CodeBlock>
      <p>
        This is functionally what gobuster/ffuf do — request every candidate path, filter out 404s, and
        report what's actually there. Writing it yourself means you can customize matching logic (e.g.
        filter by response length or a specific string) that off-the-shelf tools don't expose as easily.
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
      <CodeBlock label="the same directory brute-forcer, async style">{`import asyncio
import aiohttp

async def check_path(session, base, path):
    try:
        async with session.get(f"{base}/{path}", allow_redirects=False, timeout=2) as r:
            if r.status != 404:
                print(f"[{r.status}] {base}/{path}")
    except aiohttp.ClientError:
        pass

async def main(base, paths):
    async with aiohttp.ClientSession() as session:
        await asyncio.gather(*(check_path(session, base, p) for p in paths))

asyncio.run(main("http://10.10.10.5", ["admin", "login", "backup.zip"]))`}</CodeBlock>
      <p>
        Know both patterns rather than picking a favorite: threading is easier to reason about and plenty
        fast for most engagement-sized targets; asyncio is the right call once you're scaling into the
        thousands-of-requests territory where thread overhead itself becomes the bottleneck.
      </p>

      <p>
        With scanning and HTTP automation covered, the final lesson in this module turns to writing the
        other classic category of offensive Python tool: brute-forcers and simple exploit proof-of-concepts.
      </p>
    </div>
  );
}
