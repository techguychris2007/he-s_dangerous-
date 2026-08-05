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
      <CodeBlock label="why real recon workflows are scripted, not run interactively command-by-command">{`#!/bin/bash
# a simplified real-world recon orchestration script
subfinder -d "$1" -silent | anew subdomains.txt
crtsh-query "$1" | anew subdomains.txt
httpx -l subdomains.txt -silent | anew live-hosts.txt
nuclei -l live-hosts.txt -t cves/ -o nuclei-findings.txt

-- 'anew' specifically appends only NEW lines not already in the file --
   critical for recurring/scheduled recon runs, where re-discovering the
   same 4,000 subdomains every night is wasted effort; what matters is the
   DELTA -- newly appeared subdomains, newly exposed services -- exactly
   the same "alert on the change, not the steady state" principle from the
   SOC Detection Engineering module's UEBA lesson`}</CodeBlock>
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
