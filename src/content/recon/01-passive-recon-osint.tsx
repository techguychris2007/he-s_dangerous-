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

      <h2>Turning recon into a target list</h2>
      <p>
        By the end of passive recon you should have: a list of in-scope domains/subdomains, an IP range,
        technology fingerprints (CMS, frameworks, cloud provider), and employee/naming patterns. That
        target list is what feeds directly into the active scanning phase — covered next.
      </p>
    </div>
  );
}
