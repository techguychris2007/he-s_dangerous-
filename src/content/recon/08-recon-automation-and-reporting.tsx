import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ReconAutomationAndReporting() {
  return (
    <div className="prose-hh">
      <h1>Recon Automation & Reporting</h1>
      <p>
        This closing lesson ties every recon technique from this module's eight lessons into one repeatable
        pipeline, and covers how findings from a purely reconnaissance-phase engagement actually get reported —
        distinct from a full penetration test, since recon alone rarely produces an exploitable finding on its
        own, but consistently produces the INFORMATION that makes later exploitation possible.
      </p>

      <h2>Chaining this module's eight lessons into one pipeline</h2>
      <CodeBlock label="a complete recon pipeline, each stage feeding the next">{`1. Passive recon (L1)        -- WHOIS, cert transparency, dorking
2. Subdomain enum at scale (L6) -- DNS brute force + permutation + passive
                                    sources, merged and deduplicated
3. Live-host confirmation (L6)    -- httpx filtering the full list down to
                                    what's actually reachable right now
4. Active scanning (L2)             -- nmap against confirmed live hosts
5. Service enumeration (L3)           -- per-service deep enumeration on
                                    whatever active scanning revealed
6. Cloud asset discovery (L7)           -- bucket/storage hunting run in
                                    parallel, seeded from names discovered
                                    in steps 1-3
7. Credential attacks (L4)                -- only once a specific,
                                    justified target account is identified
                                    from the above -- never as an
                                    undirected first step`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Notice credential attacks sit LAST, not first — this mirrors the enumeration methodology from
          Lesson 5's original framing: recon systematically narrows an enormous, undifferentiated attack
          surface down to a small number of specific, justified targets before ever attempting anything as
          noisy or as easily rate-limited as a credential attack.
        </p>
      </Callout>

      <h2>Automating the pipeline: orchestration over ad-hoc commands</h2>
      <CodeBlock label="why real recon workflows are scripted, not run interactively command-by-command">{`#!/usr/bin/env bash
# a simplified real-world recon orchestration script
set -euo pipefail                      # stop on the first failing step
domain="$1"

# passive sources: subfinder plus certificate transparency logs (crt.sh)
subfinder -d "$domain" -silent | anew subdomains.txt
curl -s "https://crt.sh/?q=%25.$domain&output=json" \\
  | jq -r '.[].name_value' | sed 's/^\\*\\.//' | sort -u | anew subdomains.txt

# keep only names the engagement actually authorises
grep -Fxf scope.txt subdomains.txt > in-scope.txt || true

httpx -l in-scope.txt -silent -rate-limit 20 | anew live-hosts.txt
nuclei -l live-hosts.txt -tags cve -rate-limit 20 -o nuclei-findings.txt

-- 'anew' specifically appends only NEW lines not already in the file --
   critical for recurring/scheduled recon runs, where re-discovering the
   same 4,000 subdomains every night is wasted effort; what matters is the
   DELTA -- newly appeared subdomains, newly exposed services -- exactly
   the same "alert on the change, not the steady state" principle from the
   SOC Detection Engineering module's UEBA lesson`}</CodeBlock>
      <p>
        Three lines in that script matter more than they look. <code>set -euo pipefail</code> makes the
        pipeline stop when a step fails instead of silently feeding an empty file to the next tool. The
        <code> grep -Fxf scope.txt</code> step enforces the engagement's scope inside the automation itself:
        passive sources happily return third-party hosts that merely share a naming pattern, and an unattended
        script that scans them is scanning systems nobody authorised. The <code>-rate-limit</code> flags keep
        an automated run from looking — or acting — like a denial-of-service attack.
      </p>
      <p>
        Real scope files are rarely a simple list of names; they include wildcards and exclusions such as
        "*.example.com except payments.example.com". Encode the exclusions as well, and keep the scope file under
        version control next to the script so you can show exactly what the automation was allowed to touch on
        any given night.
      </p>
      <p>
        This directly previews the Python module's own recon-automation lesson — the shell-scripted pipeline
        here and the Python-scripted directory brute-forcer there are the same underlying idea (chain simple
        tools into a repeatable, unattended workflow) at two different levels of customization.
      </p>

      <h2>Reporting recon-only findings</h2>
      <CodeBlock label="what a recon-phase deliverable actually contains, distinct from an exploit-focused report">{`Attack Surface Summary:
  - 340 subdomains discovered, 89 confirmed live
  - 3 publicly-accessible cloud storage buckets identified (2 with
    directory listing enabled -- flagged for immediate follow-up)
  - 14 hosts running software versions with known, unpatched CVEs
    (version-to-CVE correlation, this module's Lesson 3/7 technique)
  - 6 subdomains resolving to decommissioned/unclaimed cloud resources
    (a "subdomain takeover" risk category: a DNS CNAME still pointing at a
    cloud resource the target no longer owns, which anyone can re-claim
    and serve arbitrary content from, under the target's own subdomain)`}</CodeBlock>
      <Callout variant="warn">
        <p>
          A subdomain takeover finding — a forgotten CNAME record pointing at a deprovisioned cloud resource
          (an old Heroku app, an unclaimed S3 bucket, a decommissioned Azure endpoint) — deserves particular
          attention in a recon report specifically because it requires almost no further work to weaponize:
          re-registering the same resource name under the attacker's own account immediately grants control of
          content served under the target's trusted domain, useful for phishing, cookie theft on shared parent
          domains, or simply reputational damage.
        </p>
      </Callout>

      <h2>Confirming a takeover candidate without causing harm</h2>
      <p>
        A dangling CNAME is a candidate, not a finding. Confirm it in steps that each prove a little more
        while changing nothing:
      </p>
      <ol>
        <li><strong>Resolve it.</strong> <code>dig CNAME shop.example.com +short</code> shows where the name points, for example <code>example-shop.herokuapp.com</code>.</li>
        <li><strong>Fingerprint the response.</strong> Requesting the name returns the provider's "no such app" or "bucket does not exist" page. The community project <em>can-i-take-over-xyz</em> lists which providers' error pages genuinely indicate a claimable resource and which do not.</li>
        <li><strong>Stop and check the rules.</strong> Many programmes forbid claiming the resource at all; others allow a harmless proof such as a page containing only your handle. Never serve content beyond what the rules allow, and release the resource afterwards.</li>
      </ol>
      <CodeBlock label="evidence that supports the finding">{`$ dig CNAME shop.example.com +short
example-shop.herokuapp.com.
$ curl -s https://shop.example.com | grep -o "No such app"
No such app`}</CodeBlock>

      <h2>Structuring the recon deliverable</h2>
      <p>
        A recon report is read by people who decide what to fix first, so lead with what is exploitable today,
        not with the size of the asset list. A dependable structure:
      </p>
      <ol>
        <li><strong>Scope and method:</strong> the authorised domains, dates, tools and rate limits, so the results can be reproduced.</li>
        <li><strong>Priority findings:</strong> takeover candidates, exposed storage, services with known exploited vulnerabilities — each with evidence and a fix.</li>
        <li><strong>Attack-surface inventory:</strong> the counts and full lists, attached as data files rather than pasted into prose.</li>
        <li><strong>Change since last run:</strong> new hosts and newly exposed services, because the delta is what continuous recon is for.</li>
      </ol>

      <h2>Practice exercise</h2>
      <p>
        Your nightly pipeline reports 12 new subdomains. Nine follow the pattern <code>build-NNN.ci.example.com</code>
        and resolve to internal addresses; two point at an unrelated company's domain; one,
        <code> status.example.com</code>, is a CNAME to a hosted status-page provider that answers "page not found".
      </p>
      <p><strong>Your task:</strong> decide what to do with each group.</p>
      <details>
        <summary>Worked explanation</summary>
        <p>
          The CI hosts resolving to internal addresses are an information leak worth a low-severity note (public
          DNS reveals internal naming and build infrastructure) but are not reachable targets. The two names under
          another company's domain are out of scope — remove them and fix the scope filter that let them through.
          <code> status.example.com</code> is the priority: fingerprint the provider's response against
          can-i-take-over-xyz, check the programme rules, and report it with the DNS and HTTP evidence.
        </p>
      </details>

      <h2>Common misconceptions</h2>
      <ul>
        <li>"More subdomains means a better report." Readers need the few exploitable findings, not the biggest list.</li>
        <li>"Passive sources only return the target's assets." Certificate logs and search engines return look-alikes; scope-filter everything.</li>
        <li>"Automation is safe because it is standard tooling." Unthrottled, unscoped automation can scan third parties and disrupt production.</li>
        <li>"A 404 on a CNAME is always a takeover." Many providers' error pages are not claimable; verify against the provider's behaviour.</li>
      </ul>

      <h2>References and further practice</h2>
      <ul>
        <li><a href="https://owasp.org/www-project-web-security-testing-guide/" target="_blank" rel="noreferrer">OWASP Web Security Testing Guide — information gathering</a></li>
        <li><a href="https://github.com/EdOverflow/can-i-take-over-xyz" target="_blank" rel="noreferrer">can-i-take-over-xyz — which services allow subdomain takeover</a></li>
        <li><a href="https://docs.projectdiscovery.io/" target="_blank" rel="noreferrer">ProjectDiscovery documentation (subfinder, httpx, nuclei)</a></li>
        <li><a href="https://crt.sh/" target="_blank" rel="noreferrer">crt.sh — certificate transparency search</a></li>
      </ul>

      <h2>Module synthesis: the complete recon methodology</h2>
      <CodeBlock label="the arc across all eight lessons">{`L1 Passive recon       -> gathering everything discoverable with zero
                          packets sent to the target
L2 Active scanning        -> nmap, once passive recon has a target list
L3 Service enumeration       -> turning open ports into real findings
L4 Credential attacks           -> applied narrowly, only once justified
L5 Enumeration methodology         -> the original recon -> foothold ->
                          privesc loop this module opened with
L6 Web recon at scale                 -> the same L1-L2 discipline,
                          automated and applied across an entire
                          organization's subdomains
L7 Cloud asset discovery                 -> the same discipline extended
                          to infrastructure DNS enumeration alone never
                          reaches
L8 Automation & reporting                   -> chaining all seven prior
                          lessons into one repeatable pipeline, and
                          communicating what it found`}</CodeBlock>
      <p>
        Every later module in this course — Web Application Hacking, Red Teaming, Bug Bounty Methodology, Cloud
        Security — assumes exactly this recon foundation already happened. The quality of everything downstream
        is bounded by how thorough this module's methodology actually was.
      </p>
    </div>
  );
}
