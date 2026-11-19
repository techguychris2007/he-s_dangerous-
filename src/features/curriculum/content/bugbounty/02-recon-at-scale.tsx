import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ReconAtScale() {
  return (
    <div className="prose-hh">
      <h1>Recon at Scale: Subdomains, Assets &amp; Automation</h1>
      <p>
        A bug bounty target with a wildcard scope (<code>*.example.com</code>) might have hundreds of
        subdomains, most abandoned, forgotten, or running outdated software nobody's thought about in
        years. Recon at scale is how you find the forgotten asset before someone else does.
      </p>

      <h2>Subdomain enumeration</h2>
      <CodeBlock label="the standard toolchain (conceptual — install these locally to practice)">{`subfinder -d example.com -o subs.txt        # passive subdomain discovery from multiple sources
amass enum -passive -d example.com            # another passive enumeration engine, different sources
assetfinder example.com                        # lightweight, fast, good for quick passes

cat subs.txt | httpx -silent -status-code       # check which subdomains actually respond over HTTP(S)`}</CodeBlock>
      <p>
        Passive tools query third-party data sources (certificate transparency logs, DNS aggregators)
        rather than brute-forcing the target directly — the same certificate transparency technique covered
        back in Module 3's passive recon lesson, just automated across an entire domain at once.
      </p>

      <h2>Why the forgotten subdomain matters more than the main site</h2>
      <p>
        <code>www.example.com</code> is tested by every hunter on day one — it's hardened, monitored, and
        picked over. <code>old-staging.example.com</code> or <code>partner-api-v1.example.com</code>,
        forgotten by the dev team and untested by other hunters, is where real findings live. This is the
        single most repeated lesson across every published bug bounty methodology.
      </p>

      <h2>Filtering and prioritizing what you find</h2>
      <CodeBlock label="turning a big subdomain list into a prioritized target list">{`cat subs.txt | httpx -silent -title -tech-detect -status-code
# output shows: URL, page title, detected tech stack, and status code per subdomain —
# scan the results for anything that looks like an admin panel, an old CMS version,
# or a status code (500, 403) that suggests something interesting is misconfigured`}</CodeBlock>

      <h2>JavaScript file analysis (an underused goldmine)</h2>
      <p>
        Modern single-page apps ship huge JavaScript bundles that frequently contain hardcoded API
        endpoints, internal hostnames, and occasionally forgotten API keys or tokens.
      </p>
      <CodeBlock>{`curl -s https://example.com/static/app.js | grep -oE "https?://[a-zA-Z0-9./_-]+"
# surfaces every URL hardcoded in the bundle — often internal/staging endpoints never linked anywhere public`}</CodeBlock>

      <Callout variant="tip">
        <p>
          Build a simple habit: every new program you pick up, spend the first session purely on recon —
          no exploitation attempts at all. Build the full asset list, note the tech stack per asset, and
          only then decide where to spend deep testing time.
        </p>
      </Callout>

      <h2>API recon: the modern bug bounty frontier</h2>
      <p>
        Most in-scope targets today are APIs first and HTML pages second — a mobile app, a single-page
        frontend, and a partner integration are usually all calling the same underlying REST or GraphQL
        API. <strong>Postman</strong> and <strong>Insomnia</strong> are the manual-exploration workhorses
        here: both let you organize requests into collections, save auth tokens as environment variables,
        and replay/modify a captured request without retyping headers every time. A common workflow is
        proxying a mobile app's traffic once (Module 3's interception techniques), then importing the
        captured requests into a Postman collection so the whole API surface is browsable and re-testable
        without the app itself.
      </p>
      <p>
        Documented endpoints are only half the surface. <strong>Kiterunner</strong> (<code>kr</code>) is
        purpose-built for finding the undocumented half — it brute-forces API routes using wordlists built
        from real-world OpenAPI/Swagger specs and route patterns scraped from public API definitions,
        which makes it dramatically more effective against REST APIs than a generic directory wordlist:
      </p>
      <CodeBlock label="Kiterunner against an API host">{`kr scan https://api.example.com -w routes-large.kite -x 20
# -w: a Kiterunner wordlist built from real API route patterns (routes-large.kite ships with the tool)
# -x: concurrency — number of simultaneous requests
# output flags routes that return anything other than a generic 404, including ones that
# differ only by HTTP method (POST /users/{id}/admin existing when GET does not, for example)`}</CodeBlock>
      <p>
        Once you're inside an API, most modern auth is a JSON Web Token (JWT) — a base64-encoded header,
        payload, and signature. <strong>JWT Tool</strong> (<code>jwt_tool</code>) automates the standard
        attacks against them: decoding the payload to inspect claims, testing whether the server accepts an
        unsigned token by switching the algorithm to <code>none</code>, checking for algorithm confusion
        (tricking an RS256-verifying server into accepting a token signed with its own public key as an
        HMAC secret), and brute-forcing weak HMAC signing secrets against a wordlist:
      </p>
      <CodeBlock label="jwt_tool — the standard JWT attack menu">{`jwt_tool eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYWRtaW4ifQ.abc123 -T
# -T: interactive tampering — walks through editing claims and re-signing

jwt_tool eyJhbGciOiJIUzI1NiJ9... -X a
# -X a: "alg" attack mode — tests the none-algorithm bypass and common algorithm-confusion variants

jwt_tool eyJhbGciOiJIUzI1NiJ9... -C -d /usr/share/wordlists/rockyou.txt
# -C -d: crack mode — brute-forces the HMAC secret against a wordlist offline`}</CodeBlock>

      <h2>OSINT for people: when the target isn't just infrastructure</h2>
      <p>
        A growing share of real-world findings — business email compromise chains, credential-stuffing
        entry points, social-engineering-adjacent reports programs increasingly reward — start with
        reconnaissance on humans, not servers. A handful of tools cover this specifically:
      </p>
      <ul>
        <li><strong>Sherlock</strong> — enumerates a given username across hundreds of platforms at once,
        useful for building a picture of an employee's or executive's public footprint from a single
        handle: <code>python3 sherlock.py johndoe</code>.</li>
        <li><strong>Holehe</strong> — checks whether a given email address is registered on dozens of
        services (often revealing which platforms an employee reuses credentials on, directly relevant to
        credential-stuffing risk): <code>holehe target@example.com</code>.</li>
        <li><strong>GHunt</strong> — OSINT specifically against Google accounts; given a Gmail address it
        can surface an associated public Google Maps reviews history, YouTube channel, and other linked
        Google properties an account owner may not realize are correlatable.</li>
        <li><strong>PhoneInfoga</strong> — OSINT against phone numbers, identifying carrier, line type, and
        cross-referencing the number against search engines and social platforms for a linked identity:
        <code>phoneinfoga scan -n "+15555555555"</code>.</li>
        <li><strong>Maltego</strong> — a link-analysis platform rather than a single-purpose tool: you feed
        it a starting entity (a domain, an email, a name) and its "transforms" pull and graph related
        entities from dozens of data sources, visually mapping how a company's infrastructure, employees,
        and third parties connect — the tool of choice when you need to see relationships, not just a flat
        list of results.</li>
      </ul>
      <Callout variant="warn">
        <p>
          People-focused OSINT sits closer to the ethical and legal edge than infrastructure recon — most
          bug bounty program scopes explicitly exclude social engineering and testing against employees
          directly. Use this category of tooling to understand exposure (what's already public and
          correlatable) for a report, not to actually run a phishing or pretexting attempt against staff
          unless a program's scope explicitly authorizes it.
        </p>
      </Callout>

      <h2>Automation without losing the manual edge</h2>
      <p>
        Fully automated scanning (running every tool against every subdomain nightly) catches the easy,
        already-patched-elsewhere issues — useful for continuous monitoring, but rarely where the big
        payouts come from. The Python automation skills from earlier in this course let you build custom
        recon pipelines tailored to a specific program, which is where automation actually pays off in bug
        bounty specifically.
      </p>

      <Callout variant="warn">
        <p>
          Aggressive subdomain brute-forcing (as opposed to passive enumeration) generates real traffic
          against the target's infrastructure — always confirm the program's scope explicitly permits
          active enumeration techniques, and respect any documented rate limits.
        </p>
      </Callout>

      <p>
        Once recon surfaces a finding, the next lesson covers the step many technically skilled hunters
        undervalue: writing the report that gets it triaged fast and paid at the severity it deserves.
      </p>
    </div>
  );
}
