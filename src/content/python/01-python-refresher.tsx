import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function PythonRefresher() {
  return (
    <div className="prose-hh">
      <h1>Python Fundamentals for Security Work</h1>
      <p>
        Python is widely used for automation, test tooling, log analysis, cloud administration, and
        security research. This lesson assumes you can read a little code but explains the pieces security
        scripts use repeatedly. Run network examples only against a lab target or a system whose owner has
        explicitly authorized the test.
      </p>

      <h2>The building blocks you'll actually reuse</h2>
      <CodeBlock label="core syntax refresher">{`# variables & f-strings
target = "10.10.10.5"
port = 22
print(f"Checking {target}:{port}")

# lists & dicts — your bread and butter for hosts/results
hosts = ["10.10.10.5", "10.10.10.6"]
results = {"10.10.10.5": ["22/ssh", "80/http"]}

# list comprehension — build a filtered list from an existing sequence
common_web_ports = [p for p in (22, 80, 443, 8080) if p in (80, 443, 8080)]

# functions return a result the caller can use
def display_target(host, port):
    return f"Checking {host}:{port}"
print(display_target(target, port))

# classes — used constantly for scanner/exploit objects
class Target:
    def __init__(self, ip, port):
        self.ip = ip
        self.port = port`}</CodeBlock>

      <h2>Functions, return values, and input validation</h2>
      <p>
        A function packages one named operation. Parameters are the input names in its definition;
        arguments are the values supplied at the call site. A function may return a normal result or raise
        an exception. Returning <code>False</code> is a valid answer; raising <code>ValueError</code> says
        that the caller supplied a value the function cannot process. Validate untrusted text at the point
        it enters the program, then keep the internal representation consistent.
      </p>
      <CodeBlock label="validate a port string before using it">{`def parse_port(raw_port: str) -> int:
    """Convert decimal text to a port in the valid range."""
    if not raw_port.isdecimal():
        raise ValueError("port must contain decimal digits only")

    port = int(raw_port)
    if not 1 <= port <= 65535:
        raise ValueError("port must be between 1 and 65535")
    return port

for candidate in ("443", "0", "ssh"):
    try:
        print(candidate, "->", parse_port(candidate))
    except ValueError as error:
        print(candidate, "-> rejected:", error)`}</CodeBlock>
      <p>
        The check has two stages: verify the text is decimal, then convert it and check the numeric range.
        Converting does not establish permission to contact a destination; a valid port is only valid
        input. Avoid a bare <code>except:</code> because it can hide programming errors such as misspelled
        variables. Catch the errors you expect and allow unexpected defects to remain visible during
        development.
      </p>

      <h3>Strings and simple structured records</h3>
      <p>
        Strings are immutable sequences of Unicode characters. Methods such as <code>strip()</code> and
        <code>lower()</code> return new values. Security data often arrives as text, so normalize only
        fields whose rules permit it; usernames may be case-insensitive in one system and case-sensitive
        in another. Split on spaces only when the format guarantees that spaces cannot occur inside a
        field. JSON, CSV, and quoted formats should use their proper parsers.
      </p>
      <CodeBlock label="parse a deliberately simple key-value training record">{`def parse_training_event(line: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    for token in line.strip().split():
        key, separator, value = token.partition("=")
        if separator and key:
            fields[key] = value
    return fields

record = "event=FAILED_LOGIN user=alice source=192.0.2.25"
event = parse_training_event(record)
print(event["event"])                 # FAILED_LOGIN
print(event.get("user", "unknown"))

# partition splits at only the first '='; a later '=' stays in value.
# This toy parser is not suitable for quoted fields or nested formats.`}</CodeBlock>
      <p>
        <code>partition("=")</code> splits at the first separator, preserving later equals signs in the
        value. <code>dict.get</code> handles an optional key without raising <code>KeyError</code>.
        Production parsers also need explicit rules for duplicate fields, malformed records, encodings,
        and sensitive values. If malformed events are silently skipped, an analyst may mistake an
        incomplete count for a complete investigation.
      </p>

      <h3>A truthful TCP connectivity check</h3>
      <p>
        This helper tests exactly one TCP endpoint. A successful result means the connection completed
        before the timeout. A refusal commonly means the host responded but no process accepted that
        connection; a timeout can reflect filtering, packet loss, routing, or a slow service. Neither
        result alone proves that the whole host is online or offline. Use it only for a designated lab
        endpoint or another explicitly authorized system.
      </p>
      <CodeBlock label="bounded connectivity check with explicit failure behavior">{`import socket

def is_tcp_service_reachable(host: str, port: int, timeout: float = 1.0) -> bool:
    if not host.strip():
        raise ValueError("host cannot be blank")
    if not 1 <= port <= 65535:
        raise ValueError("port must be between 1 and 65535")
    if timeout <= 0:
        raise ValueError("timeout must be positive")

    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, TimeoutError, ConnectionRefusedError, OSError):
        return False

# Example: start a local training web server, then check only that port.
# reachable = is_tcp_service_reachable("127.0.0.1", 8000)
# print("Connected" if reachable else "No connection")`}</CodeBlock>
      <p>
        The <code>with</code> statement closes the socket even when an error occurs. The helper catches
        expected network failures but not every possible exception, so coding mistakes are not quietly
        turned into “unreachable.” A more detailed diagnostic tool could return distinct outcomes such
        as connected, refused, timed out, or invalid input instead of compressing them into one Boolean.
      </p>

      <h2>Working with files and command-line arguments</h2>
      <p>
        Command-line arguments are strings supplied when a program starts. <code>argparse</code> gives
        them names, help text, type conversion, and consistent error messages. A <code>Path</code> object
        represents a filesystem path; <code>open</code> reads file bytes or decoded text depending on its
        mode. Use a context manager so the file is closed even if parsing raises an exception. The example
        below summarizes a local training log and never modifies or transmits it.
      </p>
      <CodeBlock label="complete command-line log summary">{`import argparse
from pathlib import Path

def count_failed_logins(path: Path) -> dict[str, int]:
    counts: dict[str, int] = {}
    with path.open(encoding="utf-8") as log_file:
        for line_number, line in enumerate(log_file, start=1):
            event = parse_training_event(line)
            if event.get("event", "").upper() != "FAILED_LOGIN":
                continue
            username = event.get("user", "").strip()
            if not username:
                print(f"Skipping line {line_number}: missing user")
                continue
            counts[username] = counts.get(username, 0) + 1
    return counts

def main() -> int:
    parser = argparse.ArgumentParser(description="Count failed logins in a lab log")
    parser.add_argument("logfile", type=Path, help="UTF-8 training log to read")
    args = parser.parse_args()
    try:
        counts = count_failed_logins(args.logfile)
    except OSError as error:
        parser.error(f"cannot read {args.logfile}: {error}")
    for username, total in sorted(counts.items()):
        print(f"{username}: {total}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())`}</CodeBlock>
      <p>
        <code>enumerate</code> adds a one-based line number for useful diagnostics. <code>get</code> handles
        optional fields; <code>sorted</code> makes output stable between runs. The <code>if __name__ ==
        "__main__"</code> guard lets another Python file import these functions without starting the CLI.
        <code>SystemExit(main())</code> returns the program's success or failure code to the operating
        system. A mature log parser should use the actual source format (for example JSON Lines), record
        parse failures, and protect sensitive data rather than silently dropping malformed evidence.
      </p>

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
      <CodeBlock label="type hints describe data moving through a tool">{`def count_user_events(
    events: list[dict[str, str]], event_name: str
) -> int:
    wanted = event_name.upper()
    return sum(
        event.get("event", "").upper() == wanted
        for event in events
    )

events: list[dict[str, str]] = []
counts: dict[str, int] = {}  # user name -> number of failed events`}</CodeBlock>
      <p>
        Worth adopting early: it costs nothing to write, and reading someone else's typed function signature
        tells you exactly what to pass in without opening the implementation at all — genuinely useful when
        skimming an unfamiliar exploit script mid-engagement.
      </p>

      <h2>Virtual environments (so your tools don't fight each other)</h2>
      <p>
        A virtual environment gives a project its own installed packages. It prevents one script's version
        requirements from silently changing another project's behavior. Keep dependencies in a project
        file, review upgrades, and do not install an untrusted package simply because a script imports it.
        The activation command depends on the shell; activation changes which Python executable the shell
        finds first, while using <code>python -m pip</code> makes the package installer follow that Python.
      </p>
      <CodeBlock>{`python3 -m venv .venv
source .venv/bin/activate       # Linux/macOS shell
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
python -m pip install requests
python -m pip freeze > requirements.txt
# On another machine: python -m pip install -r requirements.txt`}</CodeBlock>

      <p>
        With this refresher in place, the next lesson builds your first real tool: a multithreaded TCP
        port scanner — the "hello world" of offensive Python, and the direct foundation for everything
        else in this module.
      </p>
      <h2>Official references</h2>
      <ul>
        <li><a href="https://docs.python.org/3/tutorial/" target="_blank" rel="noreferrer">Python Tutorial</a> — syntax, data structures, functions, and modules.</li>
        <li><a href="https://docs.python.org/3/library/argparse.html" target="_blank" rel="noreferrer">argparse reference</a> — command-line interfaces and input validation.</li>
        <li><a href="https://docs.python.org/3/library/socket.html" target="_blank" rel="noreferrer">socket reference</a> — the TCP connection API used in the scoped example.</li>
        <li><a href="https://docs.python.org/3/tutorial/errors.html" target="_blank" rel="noreferrer">Errors and exceptions</a> — interpreting tracebacks and handling expected failures.</li>
      </ul>
    </div>
  );
}
