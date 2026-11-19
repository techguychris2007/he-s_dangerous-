import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function SecurityArchitecture() {
  return (
    <div className="prose-hh">
      <h1>Security Architecture &amp; Resilience</h1>
      <p>
        This lesson is about designing systems that assume failure and attack are inevitable, and stay
        secure and available anyway — the architectural mindset behind every network diagram you'll review
        professionally.
      </p>

      <h2>Defense in depth</h2>
      <p>
        No single control is ever assumed sufficient. A properly designed network has multiple independent
        layers, so that a failure or bypass of one layer doesn't mean total compromise — the whole point is
        that an attacker who defeats layer one (a phished credential, say) still has to defeat every layer
        behind it before reaching anything valuable.
      </p>
      <CodeBlock label="a layered defense, outside in">{`Perimeter firewall  ->  DMZ (public-facing services isolated from internal network)
   -> Internal network segmentation (VLANs separating finance, HR, engineering)
      -> Host-based firewall + EDR on each endpoint
         -> Application-level controls (input validation, auth checks)
            -> Data-level controls (encryption at rest, DLP)`}</CodeBlock>
      <p>
        Each layer should assume the ones outside it have already failed. This is why a well-designed
        internal network still enforces authentication between internal services (rather than trusting
        "it's inside the firewall, so it's fine") — a single phished laptop or exposed VPN credential should
        not be enough, on its own, to reach the finance VLAN, a domain controller, or a production database.

      </p>

      <h2>Network segmentation &amp; zero trust</h2>
      <p>
        Traditional architecture trusted anything "inside" the perimeter by default — exactly the
        assumption that made the lateral-movement labs in this course's Red Team module so effective once a
        single host was compromised. Zero Trust architecture flips this: no request is trusted by default
        based on network location alone; every request is authenticated and authorized on its own merits,
        continuously, regardless of whether it originates "inside" or "outside." Google's internal
        <strong> BeyondCorp</strong> model — built after Google itself was targeted in the 2009
        "Operation Aurora" intrusions — is the most cited production example: employees at Google
        authenticate every request based on device and user identity rather than which network they're
        plugged into, with no privileged "corporate VPN" network to compromise in the first place.
      </p>
      <CodeBlock label="zero trust core principles">{`- Verify explicitly (every request, every time — not just at initial login)
- Use least privilege access (scoped tightly, time-limited where possible)
- Assume breach (design as if an attacker is already inside the network)`}</CodeBlock>
      <Callout variant="incident">
        <p>
          <strong>Real incident — Target Corporation, 2013:</strong> attackers gained an initial foothold
          using network credentials stolen from an HVAC/refrigeration vendor, Fazio Mechanical, who had
          remote access for billing and system monitoring. The vendor connection should never have been
          able to reach anywhere near payment systems — but Target's network was not meaningfully
          segmented between the vendor-facing environment and the point-of-sale network, so attackers
          pivoted from a third-party HVAC contractor's stolen login all the way to memory-scraping malware
          on cash registers across thousands of stores, exposing roughly 40 million payment card records.
          It remains one of the most cited real-world cases for why network segmentation cannot be
          treated as a "nice to have" — the vendor credential compromise was arguably unavoidable, but the
          flat network that let it reach POS systems was an architectural choice.
        </p>
      </Callout>

      <h2>SASE: zero trust, delivered as a cloud service</h2>
      <p>
        Zero trust above is a principle; <strong>SASE (Secure Access Service Edge)</strong> is the
        architectural pattern that delivers it operationally for a modern, largely remote/cloud-first
        workforce. It converges networking and security functions that used to live as separate on-premises
        appliances — VPN concentrators, firewalls, secure web gateways, CASB (Cloud Access Security Broker)
        — into a single, cloud-delivered service that every user's traffic routes through regardless of
        physical location, applying consistent zero-trust policy at the network edge closest to the user
        rather than backhauling all traffic through a central corporate data center first.
      </p>
      <CodeBlock label="the shift SASE represents">{`OLD MODEL:  remote user -> VPN back to corporate HQ -> THEN through security appliances -> internet
             (every remote connection pays a latency penalty routing through one physical location)

SASE MODEL:  remote user -> nearest cloud SASE edge node (security policy applied here) -> internet
              (policy enforcement happens close to the user, not funneled through one central choke point)`}</CodeBlock>
      <p>
        This is precisely why SASE adoption accelerated alongside widespread remote work — the old
        "VPN back to headquarters" model assumes a workforce that's mostly on-site, and stops scaling
        gracefully the moment most connections are remote by default rather than the exception.
      </p>

      <h2>High availability &amp; redundancy</h2>
      <CodeBlock label="patterns for eliminating single points of failure">{`Active-Active  — multiple systems handle load simultaneously; if one fails, others absorb the traffic
Active-Passive — a standby system takes over only if the primary fails
Load balancing  — distributes requests across multiple servers (also improves performance, not just resilience)
Geographic redundancy — duplicate infrastructure in a physically separate location, protecting against
                        site-level disasters (fire, regional power outage, natural disaster)`}</CodeBlock>

      <h2>Backup strategies</h2>
      <CodeBlock label="the 3-2-1 rule and backup types">{`3-2-1 rule: 3 copies of data, on 2 different media types, with 1 copy offsite

Full backup         — complete copy every time (slow to create, fast to restore)
Incremental backup   — only changes since the LAST backup of any type (fast to create, slower to restore —
                       must replay every incremental since the last full)
Differential backup   — only changes since the last FULL backup (a middle ground)`}</CodeBlock>
      <Callout variant="warn">
        <p>
          Backups are also a ransomware target specifically because organizations rely on them for
          recovery — this is exactly why immutable/offline backup copies (a true "air gap," not just a
          separate folder on the same network) are now considered a baseline control, not an optional
          extra.
        </p>
      </Callout>
      <Callout variant="incident">
        <p>
          <strong>Real incident — Maersk and NotPetya, June 2017:</strong> the NotPetya wiper (disguised as
          ransomware but designed purely to destroy, spreading via a hijacked Ukrainian tax software
          update) reached Maersk's global network and destroyed effectively every domain controller the
          company had online in under an hour, threatening the shipping giant's entire IT backbone across
          more than 100 countries. Maersk was saved by pure chance rather than a designed DR plan: one
          domain controller, in a branch office in Ghana, happened to be offline during the outbreak due to
          a local power cut, which left it as the sole surviving unencrypted copy of Active Directory in
          the entire company. Staff physically flew a hard drive from that office back to headquarters to
          rebuild from it. The incident cost Maersk an estimated $200-300 million and is now the textbook
          argument for deliberately engineered redundancy and offline/immutable backups — Maersk's recovery
          worked, but it worked by accident, which is precisely the outcome resilience planning exists to
          stop being true.
        </p>
      </Callout>

      <h2>Cloud deployment &amp; shared responsibility, revisited</h2>
      <p>
        The Cloud Security module covered this in depth for AWS/Azure/GCP specifically. Security+ frames it
        more broadly across service models:
      </p>
      <CodeBlock>{`IaaS (Infrastructure as a Service)  — you manage OS, patching, and up; provider manages hardware/virtualization
PaaS (Platform as a Service)          — you manage only your application code and data; provider manages the runtime
SaaS (Software as a Service)           — you manage only your data and user access; provider manages everything else

Your security responsibility shrinks as you move IaaS -> PaaS -> SaaS,
but it never reaches zero — data classification and access control remain yours at every level.`}</CodeBlock>

      <h2>Physical security controls, briefly</h2>
      <p>
        Security architecture doesn't stop at the network layer. Badge access, mantraps (a small
        double-doored space preventing tailgating), security cameras, and environmental controls
        (fire suppression, HVAC monitoring for data centers) are all in-scope Security+ topics — a reminder
        that "someone walked in and plugged a rogue device into a network port" is still a completely valid
        attack path worth designing against.
      </p>

      <p>
        With architecture covered, the final Security+ lesson turns to what happens when all these
        controls still don't prevent an incident — the formal incident response and business continuity
        process.
      </p>
    </div>
  );
}
