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

      <h2>Context managers &amp; the GIL: two concepts that quietly govern every tool you'll write</h2>
      <p>
        The <code>with socket.create_connection(...) as sock:</code> pattern above is a context manager —
        it guarantees the socket gets closed even if an exception fires partway through, without you writing
        a manual <code>finally: sock.close()</code> every time. You'll use this constantly for sockets,
        files, and locks throughout this module.
      </p>
      <p>
        The other concept worth internalizing before you write a scanner: Python's <strong>Global
        Interpreter Lock (GIL)</strong> means only one thread executes Python bytecode at any instant, so
        threading does <em>not</em> speed up CPU-bound work (e.g. hashing millions of password guesses).
        What it does speed up dramatically is <strong>I/O-bound</strong> work — and network calls are the
        textbook case, because a thread blocked waiting on <code>socket.connect()</code> or
        <code>requests.get()</code> releases the GIL while it waits, letting hundreds of other threads make
        progress at the same time. That's precisely why the <code>ThreadPoolExecutor</code> pattern in the
        next lesson turns an 8-minute sequential port scan into a few seconds — the bottleneck was always
        network latency, not CPU, so threading was the correct tool for the job.
      </p>

      <h2>Type hints: cheap documentation that catches real bugs</h2>
      <p>
        Modern offensive Python (and most public tools/PoCs you'll read on GitHub today) annotates function
        signatures with types. Python never enforces these at runtime — they're purely advisory — but a
        static checker like <code>mypy</code>, or just your editor's inline hints, catches an entire class of
        "I passed a string where this expected an int" bugs before you ever run the tool against a real
        target:
      </p>
      <CodeBlock label="the same is_alive function, with type hints">{`def is_alive(host: str, port: int, timeout: float = 1.0) -> bool:
    ...

results: dict[str, list[str]] = {}   # a dict mapping hostname -> list of "port/service" strings`}</CodeBlock>
      <p>
        Worth adopting early: it costs nothing to write, and reading someone else's typed function signature
        tells you exactly what to pass in without opening the implementation at all — genuinely useful when
        skimming an unfamiliar exploit script mid-engagement.
      </p>

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
