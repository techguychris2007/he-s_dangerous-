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
