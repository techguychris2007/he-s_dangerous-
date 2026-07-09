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

      <p>
        With scanning and HTTP automation covered, the final lesson in this module turns to writing the
        other classic category of offensive Python tool: brute-forcers and simple exploit proof-of-concepts.
      </p>
    </div>
  );
}
