import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function OwaspTop10() {
  return (
    <div className="prose-hh">
      <h1>The OWASP Top 10: A Working Map</h1>
      <p>
        The OWASP Top 10 is the industry-standard list of the most common and impactful web application
        vulnerability categories. It's not a checklist you run once — it's the mental map you overlay onto
        every application you test. This lesson gives you that map; the rest of this module and the labs
        ahead go deep on each category.
      </p>

      <h2>The categories, in plain language</h2>
      <CodeBlock label="OWASP Top 10 (2021 edition, condensed)">{`A01 Broken Access Control       — users can act outside their intended permissions (IDOR lives here)
A02 Cryptographic Failures       — weak/missing encryption, exposed sensitive data
A03 Injection                    — SQLi, command injection, and (as of 2021) XSS folded in here
A04 Insecure Design               — missing security controls baked into the architecture itself
A05 Security Misconfiguration     — default creds, verbose errors, unnecessary features enabled
A06 Vulnerable & Outdated Components — using libraries/frameworks with known CVEs
A07 Identification & Auth Failures — weak login, session, and credential handling
A08 Software & Data Integrity Failures — unsigned updates, insecure deserialization
A09 Security Logging & Monitoring Failures — attacks go undetected because nobody's watching
A10 Server-Side Request Forgery (SSRF) — tricking the server into making requests on your behalf`}</CodeBlock>

      <h2>Why this list, and why it changes</h2>
      <p>
        OWASP updates this list periodically based on real-world vulnerability data — it's not theoretical.
        Notice that "Injection" absorbed XSS in the 2021 revision, reflecting how the industry's
        understanding of vulnerability classes evolves. Treat the categories as a lens, not gospel.
      </p>

      <h2>How professionals actually use this list</h2>
      <ul>
        <li>As a <strong>test plan skeleton</strong> — for every feature (login, search, file upload,
        API endpoint), ask which of the 10 categories apply.</li>
        <li>As a <strong>report structure</strong> — clients and bug bounty triagers recognize these
        category names instantly.</li>
        <li>As a <strong>training curriculum</strong> — which is exactly how this module and PortSwigger's
        Web Security Academy are organized.</li>
      </ul>

      <Callout variant="tip">
        <p>
          The single highest-leverage habit in web app testing: for every input field, URL parameter,
          header, and cookie, ask "what happens if I change this to something the developer didn't expect?"
          Almost every OWASP Top 10 category is a variation on that one question.
        </p>
      </Callout>

      <h2>What's ahead in this module</h2>
      <p>
        The next three lessons go deep on the categories with the highest real-world hit rate: Injection
        (SQL injection specifically), Broken Access Control (IDOR) and XSS/session attacks, and finally
        SSRF alongside a few other advanced categories (XXE, insecure deserialization). Every technique is
        one you'll practice directly in the lab terminal using <code>curl</code> — exactly how professional
        testers interact with APIs day to day.
      </p>

      <Callout variant="danger">
        <p>
          Every technique from here forward is demonstrated against intentionally vulnerable simulated
          targets built for this course. Testing these techniques against real websites without written
          authorization is illegal under computer misuse laws in virtually every jurisdiction.
        </p>
      </Callout>
    </div>
  );
}
