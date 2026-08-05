import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function WebReconAndSubdomainEnumerationAtScale() {
  return (
    <div className="prose-hh">
      <h1>Web Reconnaissance & Subdomain Enumeration at Scale</h1>
      <p>
        Lesson 1's passive recon covered WHOIS, certificate transparency, and dorking against a single target.
        Real modern organizations run dozens to thousands of subdomains — this lesson covers enumerating that
        entire surface systematically, the foundational methodology the Bug Bounty module's recon-at-scale
        lesson later builds on directly.
      </p>

      <h2>Certificate transparency, revisited at scale</h2>
      <CodeBlock label="crt.sh as a bulk subdomain source, not just a single lookup">{`curl -s "https://crt.sh/?q=%.example.com&output=json" | jq -r '.[].name_value' | sort -u
-- every certificate ever issued for *.example.com is logged permanently
   in public Certificate Transparency logs (a requirement for CAs since
   roughly 2018) -- querying crt.sh in bulk surfaces subdomains that were
   only ever briefly live, long since decommissioned pages, and
   staging/internal-sounding hostnames a target never intended to
   advertise, all from one publicly queryable source with no scanning of
   the target's own infrastructure required at all`}</CodeBlock>

      <h2>DNS brute-forcing and permutation</h2>
      <CodeBlock label="the two complementary subdomain-discovery techniques">{`# Wordlist-based brute force against common subdomain names:
gobuster dns -d example.com -w subdomains-top1M.txt

# Permutation: generating variations of ALREADY-discovered subdomains
# (dev.example.com found -> also try dev-2, dev-staging, dev-old, devapi)
dnsgen discovered-subdomains.txt | massdns -r resolvers.txt -o S -w results.txt
  -- permutation catches naming PATTERNS a plain wordlist would never
     guess -- if "api-us-east.example.com" exists, "api-eu-west.example.com"
     becomes a very reasonable next guess`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Passive sources (crt.sh, this lesson) and active brute-forcing are complementary, not redundant — a
          passive source only reveals what happened to get a certificate issued or indexed somewhere; active
          brute-forcing finds subdomains that exist and resolve but never triggered any of those passive
          signals at all. A thorough recon pass runs both and merges the results.
        </p>
      </Callout>

      <h2>Screenshot triage: turning a huge subdomain list into a prioritized target list</h2>
      <CodeBlock label="the practical problem with 4,000 discovered subdomains">{`httpx -l all-subdomains.txt -silent -o live-hosts.txt   # confirm which
                                                          # actually respond
gowitness file -f live-hosts.txt                          # screenshot
                                                             # every live host

-- reviewing a folder of screenshots is dramatically faster than manually
   visiting thousands of URLs -- a default Apache test page, an obvious
   staging environment with a login form, and a completely blank 404 all
   become visually distinguishable at a glance, letting you prioritize
   which of thousands of hosts are actually worth manual attention first`}</CodeBlock>

      <h2>Technology fingerprinting at scale</h2>
      <CodeBlock label="identifying what's actually running before testing anything">{`whatweb -i live-hosts.txt --log-json=fingerprints.json
-- surfaces the CMS, framework, and server software for every live host in
   one pass -- immediately useful for prioritization (an old WordPress
   install is a very different risk profile than a modern React SPA behind
   a hardened API gateway) and for correlating against known CVEs, exactly
   the version-to-CVE correlation technique from the IoT module's firmware
   lesson, just applied to web technology stacks instead of embedded firmware`}</CodeBlock>

      <Callout variant="warn">
        <p>
          At this scale, scope discipline matters more than ever — a bulk subdomain enumeration pass will
          routinely surface hosts belonging to third-party services (a marketing site on a SaaS platform, a
          CDN edge, a completely unrelated company that happens to share infrastructure) that are NOT actually
          in scope for the engagement or bug bounty program, even though they resolve under the target's
          domain. Always cross-reference discovered hosts against the actual documented scope before testing
          anything.
        </p>
      </Callout>

      <p>
        With a systematic way to map an entire organization's web-facing surface, the next lesson extends this
        same discovery discipline to infrastructure that often isn't reachable by hostname enumeration at all —
        assets living directly in a target's cloud environment.
      </p>
    </div>
  );
}
