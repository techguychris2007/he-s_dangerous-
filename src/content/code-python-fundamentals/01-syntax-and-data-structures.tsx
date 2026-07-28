import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';
import PracticeTasksCallout from '../../components/lesson/PracticeTasksCallout';

export default function SyntaxAndDataStructures() {
  return (
    <div className="prose-hh">
      <h1>Python Syntax &amp; Data Structures, From Zero</h1>
      <p>
        This is the start of a different track than the "Black Hat Python" module elsewhere in this
        platform — that one assumes you already know Python and teaches you to build offensive tools with
        it. This one assumes nothing, and builds up general-purpose programming fluency from the ground up,
        using security-flavored examples the whole way. If you've never written a line of code before,
        start here.
      </p>

      <h2>Variables and types</h2>
      <p>
        Python doesn't make you declare a variable's type up front — it figures it out from whatever value
        you assign. This is called <strong>dynamic typing</strong>, and it's both Python's biggest
        convenience and a common source of subtle bugs if you're not paying attention to what type a
        variable actually holds at any given moment.
      </p>
      <CodeBlock label="the core types you'll use constantly">{`ip_address = "192.168.1.1"      # str — text
port = 443                       # int — whole numbers
is_open = True                   # bool — True/False
cvss_score = 9.8                  # float — decimal numbers
finding = None                    # NoneType — "no value yet"

# check a variable's type at any time
print(type(port))        # <class 'int'>
print(type(ip_address))  # <class 'str'>`}</CodeBlock>
      <p>
        A classic bug: reading a port number from a config file or command-line argument gives you a{' '}
        <code>str</code> like <code>"443"</code>, not an <code>int</code>. Comparing <code>"443" == 443</code>{' '}
        is <code>False</code> in Python — different types are never equal. You have to explicitly convert
        with <code>int("443")</code> before doing numeric comparisons or arithmetic.
      </p>

      <h2>Lists — ordered, changeable collections</h2>
      <CodeBlock label="lists">{`open_ports = [22, 80, 443]
open_ports.append(8080)          # [22, 80, 443, 8080]
open_ports.remove(80)            # [22, 443, 8080]
first_port = open_ports[0]       # 22 — indexing starts at 0
last_port = open_ports[-1]       # 8080 — negative indices count from the end

# looping over a list
for port in open_ports:
    print(f"Port {port} is open")

# list comprehension — build a new list from an existing one, in one line
high_ports = [p for p in open_ports if p > 1024]`}</CodeBlock>
      <p>
        List comprehensions look intimidating at first but read left to right almost like English: "give me{' '}
        <code>p</code> for every <code>p</code> in <code>open_ports</code>, where <code>p &gt; 1024</code>."
        You'll see this pattern everywhere in real security scripts — filtering log lines, IPs, findings.
      </p>

      <h2>Dictionaries — key/value lookups</h2>
      <CodeBlock label="dicts">{`scan_results = {
    "10.0.0.5": ["22/ssh", "80/http"],
    "10.0.0.9": ["443/https"],
}

scan_results["10.0.0.12"] = ["21/ftp"]   # add a new entry
ports = scan_results["10.0.0.5"]          # ["22/ssh", "80/http"]
ports_or_default = scan_results.get("10.0.0.99", [])  # [] — no KeyError, unlike scan_results["10.0.0.99"]

for host, ports in scan_results.items():
    print(f"{host}: {len(ports)} open ports")`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Prefer <code>.get(key, default)</code> over <code>dict[key]</code> whenever the key might not
          exist — a missing key with <code>[]</code> raises <code>KeyError</code> and crashes your script;{' '}
          <code>.get()</code> just hands you back a sensible default. This one habit prevents an enormous
          number of "it worked in testing, then crashed on real data" bugs.
        </p>
      </Callout>

      <h2>Sets — unique, unordered collections</h2>
      <CodeBlock label="sets">{`seen_ips = set()
seen_ips.add("10.0.0.5")
seen_ips.add("10.0.0.5")   # adding a duplicate does nothing — sets never have repeats
print(len(seen_ips))        # 1

blocklist_a = {"1.1.1.1", "2.2.2.2"}
blocklist_b = {"2.2.2.2", "3.3.3.3"}
combined = blocklist_a | blocklist_b     # union: every IP in either list
shared = blocklist_a & blocklist_b       # intersection: only IPs in BOTH lists`}</CodeBlock>
      <p>
        Sets are the right tool the instant you need "no duplicates" or "what's common between these two
        lists of things" — deduplicating a scraped wordlist, or finding which IPs show up on two separate
        blocklists, are both one-line set operations instead of manual loops.
      </p>

      <h2>Control flow — if/elif/else and loops</h2>
      <CodeBlock label="control flow">{`def classify_port(port):
    if port in (80, 443):
        return "web"
    elif port == 22:
        return "ssh"
    elif port < 1024:
        return "well-known"
    else:
        return "high"

# while loop — repeats until a condition becomes False
attempts = 0
max_attempts = 3
while attempts < max_attempts:
    attempts += 1
    print(f"Attempt {attempts}")`}</CodeBlock>
      <p>
        Python uses <strong>indentation</strong> (whitespace) to mark code blocks instead of curly braces —
        this isn't just a style choice, it's mandatory syntax. Mixing tabs and spaces, or indenting
        inconsistently, is a genuine syntax error in Python, not just messy formatting.
      </p>

      <PracticeTasksCallout
        tasks={[
          { id: 'py-fund-01', title: 'Validate an IPv4 Address' },
          { id: 'py-fund-07', title: 'Find Duplicate Lines in a Wordlist' },
          { id: 'py-fund-11', title: 'Merge Two Blocklists Without Duplicates' },
        ]}
      />

      <p>
        The next lesson builds on this with functions, exception handling, and working with strings and
        files — the last pieces you need before writing genuinely useful scripts.
      </p>
    </div>
  );
}
