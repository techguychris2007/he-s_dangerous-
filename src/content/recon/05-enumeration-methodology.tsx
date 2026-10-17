import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function EnumerationMethodology() {
  return (
    <div className="prose-hh">
      <h1>A Repeatable Enumeration Workflow</h1>
      <p>
        This lesson brings reconnaissance and service-enumeration concepts together without skipping ahead
        to exploitation or a complete engagement methodology. Enumeration is the disciplined process of
        turning a reachable host or service into verified facts: what responds, which protocol is in use,
        what information is exposed, and what questions remain unanswered. Work only against targets and
        time windows explicitly authorized by the engagement or training lab.
      </p>

      <h2>Four steps that keep enumeration reliable</h2>
      <CodeBlock label="A bounded workflow for authorized host and service discovery">{`1. Confirm scope
   - Read lab rules, target address, allowed ports and time window.
   - Identify excluded systems and the approved request rate.

2. Discover only what scope permits
   - Record the discovery method, timestamp and observed target address.
   - Treat filtered/no-response results as inconclusive, not proof of absence.

3. Enumerate one exposed service at a time
   - Record protocol, port, banner/version confidence and response data.
   - Use a protocol-appropriate, low-impact query to answer one question.

4. Verify and report observations
   - Repeat important observations and preserve raw output and tool options.
   - Separate confirmed facts, hypotheses, negative results and unknowns.
   - Stop at the lesson objective; exploitation is a separate module.`}</CodeBlock>

      <h2>Why discovery output is not a complete inventory</h2>
      <p>
        A port scan is a measurement from one source, network path, time and set of options. A host that does
        not answer a discovery probe may be offline, filtering that probe, reachable only through a different
        route, or outside the selected address range. A port reported as <code>open</code> accepted a probe at
        scan time; <code>closed</code> means a response indicated no listener; <code>filtered</code> means
        filtering or missing responses prevented the scanner from determining the state. UDP scans are
        especially easy to misread because many services do not reply to empty or malformed requests.
      </p>
      <p>
        Version detection is an inference. Some services disclose a product string; others proxy, rewrite or
        suppress banners. A guessed version is a lead for validation, not proof that a particular
        vulnerability exists. Confirm with the service's own response, configuration evidence or a safe
        version-specific check in the lab. Never run a public exploit merely because a scanner printed a CVE
        association.
      </p>
      <CodeBlock label="Capture a small, repeatable scan in the lab">{`# Set this only to the target assigned by the training environment.
TARGET=10.10.10.25

# Inspect a small approved port set with version detection.
nmap -n -sV --version-light -p 22,53,80,443 "$TARGET" -oA evidence/initial

# Read the saved output; retain timestamp and tool version in your notes.
cat evidence/initial.nmap`}</CodeBlock>
      <p>
        The address above is an example from a private training range. Replace it with the assigned lab address,
        never a public address selected at random. <code>-n</code> disables DNS resolution so lookup delays do
        not obscure the scan; <code>-oA</code> keeps normal, grepable and XML outputs for review. This small
        scan does not establish that other ports are absent. Expand coverage only when the lab objective and
        rules permit it, and avoid timing options that overwhelm a fragile service.
      </p>

      <h2>Worked example: investigate one HTTP service</h2>
      <p>
        Suppose the assigned lab scan reports TCP port 80 open and a likely HTTP service. Preserve the raw
        output, then send a normal request to the lab's web root and record the status, headers and redirects.
        A <code>200</code> response means the request was handled at the HTTP layer; it does not prove every
        route is public. A <code>401</code> indicates an authentication challenge, while <code>403</code>
        indicates refusal; neither status alone reveals the complete authorization design. If the lab gives
        you a hostname, use it so the intended virtual host is selected, and record hostname and resolved
        address separately.
      </p>
      <CodeBlock label="Make one ordinary request to the assigned lab website">{`# LAB_HOST must be supplied by the training environment.
LAB_HOST=training-web.local
curl --max-time 5 -sS -D evidence/http-headers.txt \\
  -o evidence/http-body.html "http://$LAB_HOST/"

# Inspect the status/headers and identify the downloaded body.
head -n 20 evidence/http-headers.txt
file evidence/http-body.html`}</CodeBlock>
      <p>
        Check whether a redirect changes the scheme or hostname, whether the response is an application page
        or proxy error, whether a cookie is issued, and whether the host header selects a virtual host. Do not
        infer a software version from a page title alone. If the lab has not supplied a hostname, use the
        platform's target information rather than guessing domain names.
      </p>

      <Callout variant="tip">
        <p>
          Keep notes as you go: assigned scope, target, tool/version, exact options, time, observed result,
          confidence and next question. Do not collect or reuse credentials unless the lab objective explicitly
          requires it. A failed query is useful when you record what was attempted and why its result is
          inconclusive or meaningful.
        </p>
      </Callout>

      <Callout variant="info">
        <p>
          <strong>Further reading &amp; real-world references:</strong> the modular framework approach in
          <code> Recon-ng</code> is worth revisiting once these fundamentals are automatic — it's built
          around exactly this recon-to-report loop. For how this methodology plays out against real,
          currently-patched vulnerabilities, the <strong>Google Project Zero blog</strong> and
          <strong> PortSwigger Research</strong> publish detailed technical write-ups of real bugs found
          using this same enumerate-everything mindset. And when you're ready to apply it against realistic
          web targets, the <strong>OWASP</strong> project and the <strong>PortSwigger Web Security
          Academy</strong> are the two most respected free places to practice — both are referenced again in
          this course's Web Application Hacking module.
        </p>
      </Callout>

      <h2>How this lesson fits a larger engagement</h2>
      <p>
        Professional assessments also include authorization, objectives, communication plans, impact controls,
        validation, evidence handling and reporting. Those responsibilities are important, but this lesson
        intentionally teaches only reconnaissance and service enumeration. Do not interpret an open port or
        interesting banner as permission to authenticate, exploit, access data or change a system. Those actions
        require explicit authorization and belong to separate lessons with their own lab boundaries.
      </p>

      <h2>You're ready for the labs</h2>
      <p>
        You now have a repeatable way to discover and describe in-scope services. The labs that follow practice
        only their stated reconnaissance or enumeration objective in a simulated environment. Preserve
        evidence, test one question at a time, and stop when that objective is met.
      </p>
    </div>
  );
}
