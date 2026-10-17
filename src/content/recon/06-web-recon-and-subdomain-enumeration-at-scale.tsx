import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

const passiveCommands = [
  '# Set this only to a domain explicitly listed in your written scope.',
  'DOMAIN=your-authorized-domain.example',
  '',
  '# Passive discovery uses public data sources and the provider APIs you configure.',
  'subfinder -d "$DOMAIN" -silent -o subfinder-passive.txt',
  'amass enum -passive -d "$DOMAIN" -o amass-passive.txt',
  '',
  '# Merge and normalize candidate names; do not treat them as confirmed assets.',
  'cat subfinder-passive.txt amass-passive.txt | tr "[:upper:]" "[:lower:]" | sort -u > candidates.txt',
  '',
  '# Keep provenance separately: source, query time, and original result.',
].join('\n');

const resolveAndProbe = [
  '# DNS queries: candidates go to the configured resolver.',
  'dnsx -l candidates.txt -silent -o resolved-candidates.txt',
  '',
  '# Review and scope-check the resolved list before making HTTP requests.',
  '# Put only confirmed, authorized hostnames in this file.',
  'httpx -l approved-live-hosts.txt -silent -status-code -title -tech-detect -o web-inventory.txt',
  '',
  '# Optional visual triage on the same approved list.',
  'httpx -l approved-live-hosts.txt -silent -screenshot -o screenshots/',
  '',
  '# Follow each tool’s current help/version output; flags vary by release.',
].join('\n');

const evidenceRecord = [
  'hostname,source,first_seen,dns_status,addresses,cname,scope,owner,confidence',
  'portal.your-authorized-domain.example,CT log,2026-10-15,resolves,192.0.2.10,,in-scope,Platform Team,medium',
  'old-admin.your-authorized-domain.example,archive,2026-10-15,no-answer,,,unconfirmed,unknown,low',
  'images.vendor.example,DNS CNAME,2026-10-15,resolves,198.51.100.20,cdn.vendor.example,third-party-review,Vendor,medium',
  '',
  'Example addresses are reserved for documentation and are not live targets.',
].join('\n');

const scopeCheck = [
  '# approved-hosts.txt contains one exact in-scope hostname per line.',
  '# discovered-hosts.txt contains normalized candidate hostnames.',
  'sort -u discovered-hosts.txt > discovered-sorted.txt',
  'sort -u approved-hosts.txt > approved-sorted.txt',
  'comm -12 discovered-sorted.txt approved-sorted.txt > in-scope-hosts.txt',
  'comm -23 discovered-sorted.txt approved-sorted.txt > needs-owner-review.txt',
  '',
  '# Review wildcard and parent-domain rules separately; exact string matching',
  '# does not prove that a CNAME or shared-IP service is owned by the client.',
].join('\n');

export default function WebReconAndSubdomainEnumerationAtScale() {
  return (
    <article className="prose-hh">
      <h1>Web Reconnaissance and Subdomain Enumeration</h1>
      <p>
        Organizations expose applications through domains, subdomains, APIs, cloud load balancers, content
        delivery networks, SaaS platforms, and mobile backends. Reconnaissance turns scattered clues into a
        defensible inventory. The goal is not to produce the largest possible hostname list: it is to identify
        assets, preserve where each lead came from, check ownership and scope, and only then perform the active
        checks authorized for the exercise.
      </p>

      <h2>Prerequisites: names, DNS records, and scope</h2>
      <p>
        A domain is a name in the DNS hierarchy. A subdomain is a name below it, such as
        <code>portal.example.test</code> below <code>example.test</code>. DNS records connect names to service
        information: A records map names to IPv4 addresses, AAAA records to IPv6 addresses, and CNAME records
        alias one name to another. A DNS answer proves a record was returned at the time of the query; it does
        not prove the service is owned by a particular company, is active, or is in test scope.
      </p>
      <p>
        Scope is the written permission boundary. A program may include a parent domain but exclude hosted
        vendor infrastructure, production APIs, denial-of-service testing, or particular subsidiaries. A
        hostname under a scoped domain may CNAME to a third-party service. An IP address may be shared by many
        customers. Check the program's exact rules and the asset owner before sending application requests.
      </p>

      <h2>1. Passive discovery sources</h2>
      <p>
        Passive discovery gathers names from records or services without directly probing the target's
        application. Certificate Transparency (CT) logs are public append-only records of issued TLS
        certificates. Searching CT can reveal names included in certificate subject alternative names, including
        names for systems that no longer resolve. Results may contain wildcard names, duplicates, typo variants,
        old infrastructure, or third-party hostnames. CT is a lead source, not a live-asset inventory.
      </p>
      <p>
        Other useful passive sources include DNS datasets, public code and configuration repositories, web
        archives, documentation, public cloud configuration records supplied by the owner, and the organization's
        own CMDB or DNS zone exports. Search-engine results and job listings can suggest technologies or
        historical systems but are weaker evidence. Record the source and observation date so another analyst can
        reproduce the discovery.
      </p>
      <p>
        Current workflows commonly combine passive enumeration tools such as Subfinder and OWASP Amass with
        Certificate Transparency, then resolve selected candidates and probe only in-scope hosts. OWASP's
        current Web Security Testing Guide documents this passive-to-active pattern and emphasizes scope,
        rate limits, and validation. Tools change quickly; confirm the current release documentation and use
        each tool's help output rather than relying on copied flags from an old article.
      </p>
      <Callout variant="tip">
        <p>
          A hostname from a CT log can be important even if it is now offline: it may reveal an old environment
          name or a forgotten deployment. Mark it as historical or unresolved until DNS, owner records, or
          approved cloud inventory corroborates it. Do not describe a certificate name as a vulnerable host.
        </p>
      </Callout>

      <h2>2. Build and preserve candidate lists</h2>
      <p>
        Normalize candidates to lowercase, remove surrounding whitespace and trailing dots, and deduplicate
        without losing source attribution. Keep the raw source files as evidence. Maintain separate fields for
        candidate name, source, first-seen time, latest DNS answer, CNAME chain, ownership decision, scope status,
        and confidence. Do not collapse several names into one IP: virtual hosting and CDNs routinely serve many
        unrelated services on the same address.
      </p>
      <CodeBlock label="Passive source collection for an authorized domain">{passiveCommands}</CodeBlock>
      <p>
        The placeholder domain above is documentation-only. Replace it only with a domain included in your
        written authorization. Subfinder and Amass can query third-party data sources and may use API
        credentials configured in their local settings. Protect those credentials, review the source policy, and
        record which data sources produced each result. Passive does not mean “zero privacy implications” or
        “automatically permitted by every engagement.”
      </p>

      <h2>3. Resolve candidates and detect DNS behavior</h2>
      <p>
        Resolution asks the DNS system whether a candidate currently has records. Inspect A and AAAA answers,
        CNAME chains, TTL values, and whether answers vary by resolver or location. A missing answer can mean a
        stale name, temporary DNS issue, internal-only split-horizon record, or a query restriction. A valid
        answer can be a shared CDN or SaaS endpoint. DNS does not reveal the full application path, and a
        CNAME target is not authorization to test the vendor.
      </p>
      <p>
        Wildcard DNS is another source of false positives: a zone may return an address for every random
        subdomain, whether or not that specific application exists. Compare candidates with a random
        non-existent control name, but do this only for a zone you are allowed to query. Note wildcard behavior
        in the inventory so a generated list is not mistaken for thousands of confirmed hosts.
      </p>
      <CodeBlock label="Resolve candidates, then probe only the approved list">{resolveAndProbe}</CodeBlock>
      <p>
        DNS resolution and HTTP probing are separate levels of evidence. A host can resolve while the service is
        unavailable; an HTTP response can be a default page, proxy error, or shared host response. Preserve
        status, title, response time, address, TLS certificate name, and timestamp. A technology fingerprint is
        a hypothesis from observable signals, not proof of a vulnerable version. Confirm versions through
        authorized application evidence before matching against advisories.
      </p>

      <h2>4. Verify scope before active requests</h2>
      <p>
        A bulk list must pass through an explicit ownership and scope review before HTTP probing, crawling,
        content discovery, or vulnerability testing. A practical process compares discovered FQDNs with the
        program's exact allowlist, checks parent-domain and wildcard rules, identifies third-party CNAMEs, and
        routes uncertain assets to the program owner. If scope defines IP ranges instead of hostnames, verify
        current resolution against that approved range and record changes over time.
      </p>
      <CodeBlock label="Exact allowlist comparison for a small assessment">{scopeCheck}</CodeBlock>
      <p>
        The example uses exact names as a starting check. It does not implement wildcard policy, parent-domain
        inclusion, redirects, DNS aliases, or third-party ownership rules. Review those cases manually or with a
        scope engine designed for the engagement. Do not automatically scan anything in
        <code>needs-owner-review.txt</code>.
      </p>

      <h2>5. Triage findings with confidence and ownership</h2>
      <p>
        A large discovery set needs a repeatable triage model. Record technical evidence and confidence
        separately. An authoritative account inventory plus a DNS record and an owner confirmation may provide
        high confidence that an asset belongs to the organization. One CT certificate name with no current DNS
        answer is a low-confidence historical lead. A resolvable hostname that aliases to a vendor may be
        organization-managed but still require explicit vendor-scope clarification.
      </p>
      <CodeBlock label="Example asset evidence table">{evidenceRecord}</CodeBlock>
      <p>
        Prioritize review using asset criticality, internet reachability, authentication boundary, data
        sensitivity, administrative function, and freshness. A staging login page can be a useful lead, but its
        presence alone does not prove a control failure. Confirm whether it is in scope, whether test accounts
        are provided, and what actions the rules permit before interacting with it.
      </p>

      <h2>6. Archived URLs and JavaScript endpoints</h2>
      <p>
        Web archives can reveal historical routes and parameter names that are no longer linked from the current
        site. JavaScript bundles can expose API paths, feature flags, and client-side configuration. Treat
        discovered routes as hypotheses: a stale archived URL can return a completely different service today.
        Review public artifacts without attempting to access private data. For an authorized application test,
        use a designated account, keep requests low-rate, and record the request/response evidence required by
        the program.
      </p>
      <p>
        Client-side configuration is not automatically a secret. Public API base URLs, non-sensitive analytics
        identifiers, and feature flags may be intentionally visible. A credential or private token should be
        reported through the approved process without testing its access unless authorization explicitly permits
        that validation. Never publish a live secret in a screenshot, notebook, or social post.
      </p>

      <h2>Worked example: a forgotten hostname</h2>
      <p>
        CT data returns <code>old-admin.example.test</code>. The name currently has no DNS answer, but an
        archived page shows that it once hosted an operations console. The analyst records the certificate
        source and archive timestamp, labels the host historical/unresolved, and checks the authorized asset
        inventory and owner contacts. No HTTP request is sent because there is no current resolution and the
        engagement rules do not authorize testing an archived service. If the owner confirms it is still
        deployed behind an internal gateway, the asset is added to scope through the formal change process
        before further testing.
      </p>

      <h2>Common mistakes</h2>
      <ul>
        <li>Counting every CT name as a live subdomain or assuming issuance proves current ownership.</li>
        <li>Probing all resolved hosts before checking parent-domain, third-party, and program exclusions.</li>
        <li>Confusing a CNAME to a SaaS provider with permission to test that provider.</li>
        <li>Running large wordlists or high-rate DNS queries without the engagement's rate limits.</li>
        <li>Reporting software based on a banner as a confirmed vulnerable version.</li>
        <li>Discarding source and timestamp information when merging duplicate results.</li>
        <li>Treating an archived path as a currently deployed endpoint.</li>
      </ul>

      <h2>Knowledge check</h2>
      <ol>
        <li>What does a CT result establish, and what does it not establish?</li>
        <li>Why can several hostnames resolve to one IP address without being the same application?</li>
        <li>What is wildcard DNS and how can it distort a candidate list?</li>
        <li>Why must a CNAME to a vendor be reviewed separately from the organization's hostname?</li>
        <li>What evidence would increase confidence that a discovered host is owned and in scope?</li>
        <li>Which stages in the command flow make DNS queries, and which stage sends HTTP requests?</li>
      </ol>

      <h2>References</h2>
      <ul>
        <li><a href="https://wstg.owasp.org/latest/4-Web_Application_Security_Testing/01-Information_Gathering/00-Information_Gathering_Overview/" target="_blank" rel="noreferrer">OWASP Web Security Testing Guide: information-gathering overview</a></li>
        <li><a href="https://wstg.owasp.org/latest/4-Web_Application_Security_Testing/01-Information_Gathering/04-Attack_Surface_Identification/" target="_blank" rel="noreferrer">OWASP Web Security Testing Guide: attack-surface identification</a></li>
        <li><a href="https://owasp.org/projects/amass" target="_blank" rel="noreferrer">OWASP Amass project</a></li>
      </ul>
    </article>
  );
}
