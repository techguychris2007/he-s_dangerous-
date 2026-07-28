import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';
import PracticeTasksCallout from '../../components/lesson/PracticeTasksCallout';

export default function StringsAndTextProcessing() {
  return (
    <div className="prose-hh">
      <h1>Strings, Text Processing &amp; the re Module</h1>
      <p>
        Nearly every piece of security tooling eventually comes down to text processing: parsing a log
        line, pulling an IP out of a wall of text, checking whether a string matches a pattern. This lesson
        covers the string methods and regular expressions you'll reach for constantly.
      </p>

      <h2>Core string methods</h2>
      <CodeBlock label="string methods you'll use daily">{`line = "  2024-01-01 FAILED_LOGIN user=alice  "

line.strip()              # removes leading/trailing whitespace
line.lower()               # lowercases everything — for case-insensitive comparisons
line.split()               # splits on whitespace by default: ['2024-01-01', 'FAILED_LOGIN', 'user=alice']
line.split(",")            # splits on a specific character/substring instead

"user=alice".startswith("user=")   # True
"alice".find("user=")               # -1 (not found)
"FAILED_LOGIN" in line               # True — substring containment check

# f-strings — the modern way to build strings from variables
username = "alice"
count = 3
print(f"{username} failed {count} times")`}</CodeBlock>

      <h2>Slicing — pulling out parts of a string</h2>
      <CodeBlock label="slicing">{`card = "4111111111111111"
last_four = card[-4:]        # "1111" — last 4 characters
masked = "*" * (len(card) - 4) + last_four   # "************1111"

hostname = "web01.internal.example.com"
parts = hostname.split(".")   # ['web01', 'internal', 'example', 'com']
domain = ".".join(parts[1:])  # "internal.example.com" — join is split's inverse`}</CodeBlock>
      <p>
        <code>text[start:end]</code> slicing is one of the most-used pieces of syntax in all of Python.
        Negative indices count backward from the end, which is exactly why <code>card[-4:]</code> reliably
        grabs "the last 4 characters" regardless of the string's total length.
      </p>

      <h2>Regular expressions with the re module</h2>
      <p>
        Regular expressions ("regex") describe a <em>pattern</em> of text rather than an exact string —
        essential once you need to match "something IP-address-shaped" or "something email-shaped" instead
        of one specific known value.
      </p>
      <CodeBlock label="the re module">{`import re

text = "Connection from 10.0.0.5 failed. Retry from 192.168.1.1 also failed."

# findall — every match, as a list
ips = re.findall(r"\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}", text)
# ['10.0.0.5', '192.168.1.1']

# search — the first match anywhere in the string (or None)
match = re.search(r"\\d+\\.\\d+\\.\\d+\\.\\d+", text)
if match:
    print(match.group())  # "10.0.0.5"

# sub — replace every match with something else
redacted = re.sub(r"\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}", "[REDACTED]", text)`}</CodeBlock>
      <p>Reading the pattern piece by piece:</p>
      <CodeBlock label="regex syntax cheat sheet">{`\\d       any single digit (0-9)
\\d{1,3}  1 to 3 digits in a row
.        matches any character — so a LITERAL dot must be escaped as \\.
+        one or more of the previous thing
*        zero or more of the previous thing
{2,}     2 or more of the previous thing
[abc]    any one of a, b, or c
(?=...)  lookahead — "must be followed by this," without consuming it`}</CodeBlock>
      <Callout variant="tip">
        <p>
          A very common regex bug: forgetting to escape a literal dot. The pattern{' '}
          <code>10.0.0.5</code> (unescaped) would technically also match <code>"10X0X0X5"</code>, because an
          unescaped <code>.</code> matches <em>any</em> character, not just a literal period. Always write{' '}
          <code>10\.0\.0\.5</code> when you mean an actual dot.
        </p>
      </Callout>

      <h2>Working with multi-line text</h2>
      <CodeBlock label="splitlines and iterating a log dump">{`log_dump = """2024-01-01 09:00:01 FAILED_LOGIN user=alice
2024-01-01 09:00:05 SUCCESS user=bob
2024-01-01 09:00:09 FAILED_LOGIN user=alice"""

for line in log_dump.splitlines():
    if "FAILED_LOGIN" in line:
        print(line)`}</CodeBlock>
      <p>
        <code>.splitlines()</code> is generally preferred over <code>.split("\n")</code> for real files,
        since it correctly handles the different line-ending conventions Windows and Unix files sometimes
        mix together.
      </p>

      <PracticeTasksCallout
        tasks={[
          { id: 'py-fund-03', title: 'Extract All IP Addresses From a Block of Text' },
          { id: 'py-fund-05', title: 'Redact Credit Card Numbers in Text' },
          { id: 'py-fund-06', title: 'Parse a CSV-Style Access Log Line' },
        ]}
      />

      <p>
        That's the full Fundamentals module. Next up is Object-Oriented Programming — the design vocabulary
        real scanners, vaults, and detection tools are actually built from.
      </p>
    </div>
  );
}
