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
        layers, so that a failure or bypass of one layer doesn't mean total compromise.
      </p>
      <CodeBlock label="a layered defense, outside in">{`Perimeter firewall  ->  DMZ (public-facing services isolated from internal network)
   -> Internal network segmentation (VLANs separating finance, HR, engineering)
      -> Host-based firewall + EDR on each endpoint
         -> Application-level controls (input validation, auth checks)
            -> Data-level controls (encryption at rest, DLP)`}</CodeBlock>

      <h2>Network segmentation &amp; zero trust</h2>
      <p>
        Traditional architecture trusted anything "inside" the perimeter by default — exactly the
        assumption that made the lateral-movement labs in this course's Red Team module so effective once a
        single host was compromised. Zero Trust architecture flips this: no request is trusted by default
        based on network location alone; every request is authenticated and authorized on its own merits,
        continuously, regardless of whether it originates "inside" or "outside."
      </p>
      <CodeBlock label="zero trust core principles">{`- Verify explicitly (every request, every time — not just at initial login)
- Use least privilege access (scoped tightly, time-limited where possible)
- Assume breach (design as if an attacker is already inside the network)`}</CodeBlock>

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
