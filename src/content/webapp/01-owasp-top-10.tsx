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

      <h2>The modern web testing toolkit</h2>
      <p>
        Reading the OWASP categories is the theory. In practice, professional testers reach for a
        consistent set of tools to find where each category applies on a real target, fast enough to cover
        a wide scope within a limited engagement window.
      </p>
      <ul>
        <li><strong>Burp Suite</strong> — the intercepting proxy nearly every web pentester runs all day,
        every day. It sits between your browser and the target, letting you see and edit every request
        before it leaves your machine. The <strong>Proxy</strong> tab captures traffic live; <strong>Repeater</strong>{' '}
        lets you resend and tweak a single request over and over while you probe a parameter; <strong>Intruder</strong>{' '}
        automates sending many variations of a request (a wordlist against a parameter, for example) and
        diffs the responses. The free <strong>Community</strong> edition covers Proxy/Repeater with a
        throttled Intruder; the paid <strong>Professional</strong> edition removes that throttle and adds the
        active/passive vulnerability scanner most firms build their methodology around.</li>
        <li><strong>OWASP ZAP</strong> (Zed Attack Proxy) — the leading free and open-source alternative to
        Burp, maintained by the OWASP Foundation itself. It covers the same core proxy/repeater/scanner
        workflow, and its scriptable automation framework makes it the tool of choice for wiring web
        security testing directly into a CI/CD pipeline rather than running it as a one-off manual pass.</li>
      </ul>
      <CodeBlock label="template-based scanning with Nuclei">{`nuclei -u https://target.com -t cves/ -severity critical
# runs the community's YAML-based vulnerability templates against a target —
# includes templates for specific named CVEs, misconfigurations, exposed panels, default creds, and more`}</CodeBlock>
      <p>
        <strong>Nuclei</strong> doesn't understand your target's business logic the way a human does, but
        it checks thousands of known issues in minutes using a huge, constantly-updated community template
        library — genuinely useful as a first pass across a large scope, and as a way to instantly re-check
        every asset the moment a new critical CVE template is published.
      </p>
      <CodeBlock label="fast mass HTTP probing with httpx">{`httpx -l hosts.txt -sc -title -tech-detect
# feed it a list of hosts/subdomains — it reports the status code, page title, and detected
# tech stack (framework, server, CMS) for every one of them, in seconds`}</CodeBlock>
      <CodeBlock label="crawling a modern JS-heavy site with Katana">{`katana -u https://target.com -jc
# -jc follows links discovered inside JavaScript, not just static HTML —
# builds the endpoint list that feeds straight into Nuclei, httpx, or manual testing`}</CodeBlock>
      <p>
        These four command-line tools are typically chained together: Katana crawls a target to build a
        full URL/endpoint list, httpx probes that list to see what's alive and what it's running, and Nuclei
        scans the result for known vulnerability patterns — all before a human ever opens Burp to dig into
        the interesting findings by hand.
      </p>

      <h2>One list among several: OWASP's other Top 10s</h2>
      <p>
        The general Top 10 covers traditional web apps, but OWASP maintains separate, purpose-built lists for
        adjacent surfaces with genuinely different risk profiles — worth knowing they exist by name so you
        reach for the right lens on the right target. The <strong>OWASP API Security Top 10</strong> (its own
        dedicated list, covered directly in this course's API Security module) reflects that APIs fail
        differently than rendered web pages — object-level and function-level authorization bugs dominate
        there in a way the general list doesn't fully capture. There's also a <strong>Mobile Top 10</strong>{' '}
        and, reflecting how fast the field is moving, a newer <strong>OWASP Top 10 for LLM Applications</strong>{' '}
        covering risks like prompt injection and insecure output handling in AI-integrated apps.
      </p>

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
