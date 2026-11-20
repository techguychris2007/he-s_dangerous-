import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function PassiveReconOsint() {
  return (
    <div className="prose-hh">
      <h1>Passive Recon &amp; OSINT Fundamentals</h1>
      <p>
        Every real engagement — and every methodology in the RTFM and The Hacker Playbook 3 — starts before
        you send a single packet to the target. Passive recon means gathering information from sources
        that don't touch the target's systems at all.
      </p>

      <h2>Why passive-first?</h2>
      <ul>
        <li>It's undetectable — you never appear in the target's logs.</li>
        <li>It's unauthorized-scope-safe — you're querying third parties (WHOIS registries, search
        engines, certificate logs), not the target directly.</li>
        <li>It shapes your active scanning — knowing the tech stack in advance saves hours later.</li>
      </ul>

      <h2>WHOIS &amp; domain registration</h2>
      <CodeBlock>{`whois target.com
# registrar, creation date, nameservers, sometimes registrant contact info`}</CodeBlock>

      <h2>Certificate transparency — a favorite subdomain source</h2>
      <p>
        Every publicly trusted TLS certificate is logged permanently in Certificate Transparency logs.
        Searching them reveals subdomains the organization may not intend to expose.
      </p>
      <CodeBlock>{`# crt.sh is the standard web UI/API for this
curl -s "https://crt.sh/?q=%.target.com&output=json" | jq -r '.[].name_value' | sort -u`}</CodeBlock>

      <h2>Search engine dorking</h2>
      <CodeBlock label="Google dork patterns">{`site:target.com filetype:pdf
site:target.com inurl:admin
site:target.com intitle:"index of"
site:pastebin.com "target.com"`}</CodeBlock>

      <h2>DNS-based passive recon</h2>
      <CodeBlock>{`dig target.com ANY
dig MX target.com
dig TXT target.com          # SPF records often list mail infrastructure`}</CodeBlock>

      <h2>Subdomain enumeration at scale</h2>
      <p>
        Certificate transparency and DNS give you a starting handful of subdomains; real engagements need
        dozens to thousands. A handful of purpose-built tools now dominate this space, and they are not
        interchangeable — each trades off speed, depth, and passive-vs-active differently.
      </p>
      <CodeBlock label="subfinder — fast, purely passive, the default first move">{`subfinder -d target.com -silent
subfinder -d target.com -all -o subs.txt   # -all pulls from every configured source, not just the fast ones`}</CodeBlock>
      <CodeBlock label="amass — the deepest option, built for full attack-surface mapping">{`amass enum -passive -d target.com          # passive mode — dozens of OSINT sources, no direct target contact
amass enum -active -d target.com -brute     # active mode — adds DNS brute forcing and zone walking, touches the target's DNS`}</CodeBlock>
      <CodeBlock label="assetfinder &amp; findomain — lightweight, script-friendly alternatives">{`assetfinder --subs-only target.com          # quick, no config, good for chaining into other tools
findomain -t target.com -q                    # fast Rust-based enumerator with many API source integrations`}</CodeBlock>
      <p>
        The practical distinction: <strong>subfinder</strong> is optimized for speed and clean output —
        it's what you run first, every time. <strong>Amass</strong> is heavier and slower but genuinely
        the most thorough (it's an OWASP project purpose-built for attack surface mapping, not just
        subdomain lists — it also maps ASNs, netblocks, and relationships between assets). <strong>Assetfinder</strong>
        and <strong>Findomain</strong> sit in between — fast, minimal, easy to drop into a pipeline. A
        realistic workflow chains several of them together and de-duplicates the result:
      </p>
      <CodeBlock label="chaining tools — this is the real-world pattern, not any single tool alone">{`subfinder -d target.com -silent > subs.txt
amass enum -passive -d target.com >> subs.txt
assetfinder --subs-only target.com >> subs.txt
sort -u subs.txt -o subs.txt`}</CodeBlock>

      <h2>theHarvester: aggregating emails, hosts &amp; public info in one pass</h2>
      <CodeBlock>{`theHarvester -d target.com -b all -l 500
# -b selects the data source (google, bing, linkedin, shodan, dnsdumpster, all, ...)
# -l caps how many results to pull per source`}</CodeBlock>
      <p>
        theHarvester's role is different from the subdomain-focused tools above: it's aggregating
        <em> emails</em>, employee names, hostnames, and open ports/banners it can find via search engines,
        PGP key servers, and (optionally) Shodan — one command that used to take manually querying half a
        dozen sites by hand.
      </p>

      <h2>Shodan &amp; Censys: search engines for the internet itself</h2>
      <p>
        Regular search engines index web pages. Shodan and Censys index <em>devices</em> — they
        continuously scan the entire IPv4 address space and record what service banner answered on every
        port, then let you search that dataset like a database instead of scanning it yourself.
      </p>
      <CodeBlock label="Shodan — query syntax examples">{`shodan search "product:nginx" country:US       # nginx servers geolocated to the US
shodan search "port:502" "Modbus"                # exposed industrial (ICS/SCADA) Modbus devices
shodan host 10.10.10.5                             # everything Shodan knows about one specific IP
shodan search 'org:"Target Corp"'                 # every device Shodan has fingerprinted as belonging to an org`}</CodeBlock>
      <CodeBlock label="Censys — similar goal, different query language">{`censys search 'services.service_name: "HTTP" and services.http.response.status_code: 200'
censys search 'services.tls.certificates.leaf_data.subject.organization: "target.com"'`}</CodeBlock>
      <p>
        Both are why "I didn't expose that publicly" is often wrong — a device only needs to answer a
        probe once for Shodan/Censys to record it. For attackers, this means entire categories of internal
        infrastructure (misconfigured databases, forgotten admin panels, ICS equipment) get discovered
        without sending the target a single packet yourself. For defenders, periodically searching your own
        org's footprint on both is a legitimate, standard exposure-check habit.
      </p>

      <h2>SpiderFoot &amp; Recon-ng: automated OSINT frameworks</h2>
      <p>
        Running WHOIS, cert transparency, theHarvester, and subdomain tools one at a time works, but it
        doesn't scale past a handful of targets. <strong>SpiderFoot</strong> and <strong>Recon-ng</strong>
        exist to automate that correlation.
      </p>
      <CodeBlock label="SpiderFoot — point-and-go automation across 200+ modules">{`spiderfoot -s target.com -m sfp_dnsresolve,sfp_crt,sfp_shodan
# or run its web UI (default http://127.0.0.1:5001) and drive it visually`}</CodeBlock>
      <CodeBlock label="Recon-ng — a modular, Metasploit-style recon framework">{`recon-ng
[recon-ng][default] > marketplace install recon/domains-hosts/hackertarget
[recon-ng][default] > modules load recon/domains-hosts/hackertarget
[recon-ng][default][hackertarget] > options set SOURCE target.com
[recon-ng][default][hackertarget] > run`}</CodeBlock>
      <p>
        Recon-ng's value is structure: results land in a workspace database you can query and export later,
        instead of scrollback you have to grep through — the same workflow discipline Metasploit brings to
        exploitation, applied to recon.
      </p>

      <h2>People &amp; org intelligence</h2>
      <p>
        LinkedIn employee lists reveal naming conventions for later username generation (
        <code>first.last</code>, <code>flast</code>, <code>f.last</code>). Job postings leak internal tech
        stack ("looking for a Jenkins + Kubernetes admin" tells you exactly what to expect once you're in).
      </p>

      <Callout variant="danger">
        <p>
          Passive recon against a company you don't have a signed engagement with is still something to be
          careful about — scraping and storing personal data has legal implications (GDPR and similar) even
          when it's "public." For practice, only run these techniques against your own infrastructure, a
          CTF target, or a client you have a written contract with.
        </p>
      </Callout>

      <h2>The Wayback Machine: recon against history, not just the present</h2>
      <p>
        Everything above queries what a target looks like <em>right now</em>. The Internet Archive's Wayback
        Machine (web.archive.org) has been snapshotting public web pages since 1996 — which means it often
        still holds pages, comments, or endpoints an organization removed years ago but never actually
        secured, just hid. An old staging subdomain, a decommissioned admin panel, an API endpoint mentioned
        in a since-deleted developer blog post — all recoverable from a source that never touches the
        target's live infrastructure at all.
      </p>
      <CodeBlock label="pulling every archived URL for a domain in one shot">{`curl -s "http://web.archive.org/cdx/search/cdx?url=target.com/*&output=text&fl=original&collapse=urlkey"
# lists every URL path the Wayback Machine has ever archived for the domain —
# a genuinely different attack surface than what a live crawl of the current site would find`}</CodeBlock>

      <h2>Turning recon into a target list</h2>
      <p>
        By the end of passive recon you should have: a list of in-scope domains/subdomains, an IP range,
        technology fingerprints (CMS, frameworks, cloud provider), and employee/naming patterns. That
        target list is what feeds directly into the active scanning phase — covered next.
      </p>
    </div>
  );
}
