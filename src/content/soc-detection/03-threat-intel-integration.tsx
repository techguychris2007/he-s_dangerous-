import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ThreatIntelIntegration() {
  return (
    <div className="prose-hh">
      <h1>Threat Intelligence Integration &amp; IOC Matching</h1>
      <p>
        Rules catch known techniques; UEBA catches deviation from a learned baseline. Threat intelligence
        integration is a third, independent detection layer: consuming knowledge that someone ELSE already
        gathered — a confirmed-malicious IP, domain, file hash, or other Indicator of Compromise (IOC) — and
        matching it against your own environment in real time.
      </p>

      <h2>What an IOC actually is</h2>
      <CodeBlock label="the common IOC categories a threat feed carries">{`IP addresses    -> known C2 servers, scanning infrastructure, Tor exit nodes
Domains          -> phishing/malware-hosting domains, DGA-generated C2 domains
File hashes       -> exact fingerprints of known malware samples (MD5/SHA-256)
URLs               -> specific malicious download or phishing-form links`}</CodeBlock>
      <p>
        A threat intelligence feed is simply a continuously-updated list of these, usually contributed by
        security vendors, government agencies (like CISA), and industry information-sharing groups (ISACs)
        pooling what each of them has already confirmed independently.
      </p>

      <h2>Why this catches things rules and UEBA both miss</h2>
      <p>
        A connection to an external IP can look completely unremarkable on every dimension a rule or
        behavioral baseline would check — normal time of day, normal protocol, unremarkable volume. What makes
        it a finding is a piece of information your own environment has no way to generate on its own: someone
        else already confirmed that exact destination is malicious.
      </p>
      <CodeBlock label="the exact mechanic the Chronicle IOC-matching lab has you confirm">{`Connection: WKSTN-088 -> 185.220.101.204:443
  - Normal protocol (HTTPS), normal port, no unusual volume, no odd timing

Threat intel feed lookup on 185.220.101.204:
  - Source: CommunityThreatFeed
  - Tag: "Cobalt Strike C2"
  - Confidence: high
  - First seen: 3 days ago

-> the connection alone taught you nothing; the feed match is the entire finding.`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This is precisely why threat intel integration and behavioral detection are complementary, not
          redundant: UEBA catches things that look wrong relative to a baseline even with zero external
          knowledge; IOC matching catches things that look completely normal but happen to touch
          infrastructure someone else has already confirmed is bad. Neither replaces the other.
        </p>
      </Callout>

      <h2>Feed quality and the false-positive problem</h2>
      <p>
        Not every threat feed is equally reliable — a low-quality or stale feed generates constant false
        positives (a shared hosting IP flagged permanently after one bad tenant years ago, long since
        reassigned to unrelated legitimate customers). Mature SOCs weight or tier their feeds, and expire
        aging indicators automatically rather than treating "ever appeared on any feed" as permanent proof of
        malice.
      </p>
      <CodeBlock label="a reasonable feed-tiering approach">{`TIER 1 (auto-block on match): a small set of highly-curated, high-confidence feeds
                                — vendor-confirmed C2 infrastructure, government-issued advisories
TIER 2 (alert, human review): broader community/open-source feeds — useful signal,
                                but higher false-positive rate, so a human confirms before acting`}</CodeBlock>

      <h2>STIX/TAXII: how feeds are actually exchanged</h2>
      <p>
        STIX (Structured Threat Information Expression) is the standard format threat intelligence is
        described in, and TAXII (Trusted Automated Exchange of Intelligence Information) is the standard
        protocol feeds are transmitted over — together, they are why a SIEM from one vendor can consume a feed
        published by a completely different organization without custom integration work for every single
        source.
      </p>
      <p>
        Two open-source platforms dominate how organizations actually run this in practice.{' '}
        <strong>MISP</strong> (Malware Information Sharing Platform) is built for exactly the IOC-sharing use
        case this lesson has covered — storing, tagging, and correlating indicators, and distributing them to
        other MISP instances across an ISAC or industry-sharing community. <strong>OpenCTI</strong> takes a
        different angle: instead of just listing indicators, it builds a STIX 2.1 knowledge graph connecting
        threat actors, campaigns, TTPs, and IOCs to each other — useful once a SOC wants to answer not just
        "is this IP bad" but "which known actor uses this infrastructure, and what else do they typically do."
        Many mature threat-intel programs run both side by side.
      </p>

      <h2>The Pyramid of Pain: not every IOC is worth the same effort</h2>
      <p>
        Not all the indicator types from earlier in this lesson deserve equal attention. Security researcher
        David Bianco's Pyramid of Pain (2013) ranks indicator types by one question: how much genuine cost does
        blocking this indicator actually impose on the attacker?
      </p>
      <CodeBlock label="the Pyramid of Pain, bottom (trivial) to top (severe)">{`Hash values        -- trivial: one byte changed anywhere regenerates a completely new hash
IP addresses         -- easy: new infrastructure is minutes away, cheap and disposable
Domain names           -- mildly annoying: re-registering a domain takes a little more effort
Network/host artifacts   -- annoying: a distinctive User-Agent or registry key means retooling
Tools                      -- painful: losing a whole tool (a C2 framework, a packer) costs real
                               development time to replace
TTPs (Tactics, Techniques,    -- SEVERE: this is HOW they operate. Forcing a change here means
  and Procedures)               retraining people and rebuilding tradecraft, not just re-hosting a file`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This is the exact tension this lesson opened with: IOC matching (hashes, IPs, domains — the bottom
          of the pyramid) is fast and cheap to act on, but an attacker shrugs it off by rotating infrastructure
          in minutes. Detection built on TTPs — the kind Sigma rules and MITRE ATT&amp;CK mappings target, the
          subject of the next lesson — sits at the top of the pyramid precisely because it's so much harder
          for an attacker to simply route around. Neither layer is optional: IOC matching catches the cheap,
          fast win today; TTP-based detection is what still works after the attacker changes every piece of
          infrastructure this feed currently knows about.
        </p>
      </Callout>

      <Callout variant="incident">
        <p>
          <strong>Why this matters in practice:</strong> IOC matching is exactly what turned an otherwise
          unremarkable outbound connection into a confirmed Cobalt Strike beacon in the "SIEM Essentials:
          Threat Intelligence IOC Matching" lab in the SOC Portal — the connection itself had no other
          suspicious characteristic at all. This is a realistic illustration of how much of real-world
          detection depends on knowledge that did not originate inside your own environment.
        </p>
      </Callout>

      <p>
        With rules, behavioral baselining, and external threat intelligence all covered, the final lesson in
        this module steps back to a practical problem underneath all three: a rule written in one SIEM's query
        language only runs on that SIEM. Sigma — a vendor-neutral, YAML-based detection format — is how
        detection content gets written once and shared across platforms instead of reinvented per vendor.
      </p>
    </div>
  );
}
