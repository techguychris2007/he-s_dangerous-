import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function PythonRefresher() {
  return (
    <div className="prose-hh">
      <h1>Python Fundamentals for Security Work</h1>
      <p>
        Python is the connective tissue of offensive tooling — Metasploit modules, Impacket, most public
        exploit PoCs on GitHub, and nearly every custom scanner you'll ever write. This isn't a general
        Python course; it's the subset you need fluent to write tools, fast.
      </p>

      <h2>The building blocks you'll actually reuse</h2>
      <CodeBlock label="core syntax refresher">{`# variables & f-strings
target = "10.10.10.5"
port = 22
print(f"Checking {target}:{port}")

# lists & dicts — your bread and butter for hosts/results
hosts = ["10.10.10.5", "10.10.10.6"]
results = {"10.10.10.5": ["22/ssh", "80/http"]}

# list comprehension — you'll write these constantly
open_ports = [p for p in range(1, 1025) if p in (22, 80, 443)]

# functions
def is_alive(host):
    return True  # placeholder

# classes — used constantly for scanner/exploit objects
class Target:
    def __init__(self, ip, port):
        self.ip = ip
        self.port = port`}</CodeBlock>

      <h2>Error handling that doesn't crash your scanner</h2>
      <CodeBlock>{`import socket

def check_port(ip, port, timeout=1):
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False`}</CodeBlock>
      <p>
        Notice the pattern: catch the <em>specific</em> exceptions you expect (timeout, refused, OS-level
        errors), not a bare <code>except:</code> — a bare except silently swallows bugs in your own tool
        and makes debugging miserable during an engagement.
      </p>

      <h2>Working with files &amp; argument parsing</h2>
      <CodeBlock label="every tool needs this">{`import argparse

parser = argparse.ArgumentParser(description="Simple recon tool")
parser.add_argument("target", help="IP or hostname")
parser.add_argument("-p", "--ports", default="1-1024", help="port range")
args = parser.parse_args()

with open("targets.txt") as f:
    targets = [line.strip() for line in f if line.strip()]`}</CodeBlock>

      <Callout variant="tip">
        <p>
          Every tool you build in this module follows the same shape: parse arguments → read input →
          do the network/file work → print structured output. Once that shape is muscle memory, you can
          build a new one-off tool mid-engagement in minutes instead of hours.
        </p>
      </Callout>

      <h2>Virtual environments (so your tools don't fight each other)</h2>
      <CodeBlock>{`python3 -m venv venv
source venv/bin/activate
pip install requests scapy
pip freeze > requirements.txt`}</CodeBlock>

      <p>
        With this refresher in place, the next lesson builds your first real tool: a multithreaded TCP
        port scanner — the "hello world" of offensive Python, and the direct foundation for everything
        else in this module.
      </p>
    </div>
  );
}
