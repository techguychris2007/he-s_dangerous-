import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';
import PracticeTasksCallout from '../../components/lesson/PracticeTasksCallout';

export default function FunctionsAndErrorHandling() {
  return (
    <div className="prose-hh">
      <h1>Functions, Exceptions &amp; Defensive Scripting</h1>
      <p>
        Functions are how you stop copy-pasting the same five lines everywhere, and exception handling is
        how you stop a script from dying the instant it hits one piece of unexpected input. Both matter
        enormously more once your script starts touching untrusted data — log files, config values, network
        responses — which describes almost every security tool ever written.
      </p>

      <h2>Defining and calling functions</h2>
      <CodeBlock label="functions">{`def is_valid_port(port):
    return 0 <= port <= 65535

def scan_summary(host, open_ports, closed_ports=0):
    # default arguments: closed_ports is optional, defaults to 0 if not passed
    return f"{host}: {len(open_ports)} open, {closed_ports} closed"

print(is_valid_port(443))                       # True
print(scan_summary("10.0.0.5", [22, 80]))        # uses the default closed_ports=0
print(scan_summary("10.0.0.9", [443], 12))       # overrides the default`}</CodeBlock>
      <p>
        Functions can return more than one value at once using a tuple — Python lets you "unpack" it
        directly into multiple variables on the receiving end:
      </p>
      <CodeBlock>{`def parse_host_port(target):
    host, port = target.split(":")
    return host, int(port)

host, port = parse_host_port("10.0.0.5:8080")
print(host)  # "10.0.0.5"
print(port)  # 8080 (an int, not a string)`}</CodeBlock>

      <h2>Exceptions — expect the input to be wrong sometimes</h2>
      <p>
        Real-world input is messy: a config file has a typo, a user pastes in a malformed IP, a network
        call times out. Python signals these problems by <strong>raising an exception</strong>, which — if
        you don't handle it — crashes your entire script immediately. <code>try</code>/<code>except</code>{' '}
        lets you catch specific problems and decide what to do instead of crashing.
      </p>
      <CodeBlock label="try/except">{`def parse_port(value, default=0):
    try:
        port = int(value)
    except ValueError:
        # int("abc") raises ValueError — this is where we catch it
        return default
    if 0 <= port <= 65535:
        return port
    return default

print(parse_port("8080"))       # 8080
print(parse_port("not-a-port")) # 0 (the default), instead of crashing`}</CodeBlock>
      <Callout variant="warn">
        <p>
          Always catch <em>specific</em> exception types (<code>ValueError</code>, <code>KeyError</code>,{' '}
          <code>ConnectionRefusedError</code>) rather than a bare <code>except:</code>. A bare except also
          silently swallows bugs in your <em>own</em> code — a typo in a variable name becomes a{' '}
          <code>NameError</code> that just vanishes instead of telling you where the real problem is.
        </p>
      </Callout>

      <h2>Raising your own exceptions</h2>
      <CodeBlock>{`def connect(host, port):
    if not (0 <= port <= 65535):
        raise ValueError(f"Invalid port: {port}")
    # ... actual connection logic would go here
    return f"connected to {host}:{port}"

try:
    connect("10.0.0.5", 99999)
except ValueError as e:
    print(f"Refused to connect: {e}")`}</CodeBlock>
      <p>
        Raising your own exceptions with a clear message is how you turn "the script silently did the wrong
        thing" into "the script told you exactly what went wrong and where." You'll see this idea again,
        much more fully developed, in the Advanced module when we build custom exception hierarchies.
      </p>

      <h2>The finally block — cleanup that always runs</h2>
      <CodeBlock>{`log_handle = None
try:
    log_handle = open("scan.log", "w")
    log_handle.write("starting scan\\n")
    1 / 0  # pretend something breaks here
except ZeroDivisionError:
    print("something went wrong")
finally:
    if log_handle:
        log_handle.close()  # this runs whether or not an exception happened`}</CodeBlock>
      <p>
        In practice you'll almost always reach for a <code>with</code> statement instead of manual{' '}
        <code>try</code>/<code>finally</code> for things like files and sockets — it does exactly this
        cleanup automatically. We cover that properly (and how to build your own) in the Advanced module's
        context managers lesson.
      </p>

      <PracticeTasksCallout
        tasks={[
          { id: 'py-fund-14', title: 'Safe Config Parsing With Try/Except' },
          { id: 'py-fund-04', title: 'Check Password Strength' },
          { id: 'py-fund-15', title: 'Find UID-0 Accounts in a passwd-Style String' },
        ]}
      />
    </div>
  );
}
