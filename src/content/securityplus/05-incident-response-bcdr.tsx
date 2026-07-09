import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function IncidentResponseBcdr() {
  return (
    <div className="prose-hh">
      <h1>Incident Response &amp; Business Continuity</h1>
      <p>
        Every technique you've practiced in this course's labs — from a simple FTP-leaked credential to a
        full domain compromise — eventually gets discovered by someone following the process this lesson
        describes. Understanding it from the defender's side makes you better at both roles.
      </p>

      <h2>The incident response lifecycle</h2>
      <CodeBlock label="the six phases Security+ tests by name and order">{`1. Preparation      — policies, tools, and training BEFORE an incident happens
2. Identification    — detecting and confirming an incident is actually occurring
3. Containment       — stopping the spread (short-term: isolate the host; long-term: patch/rebuild)
4. Eradication        — removing the root cause entirely (the malware, the backdoor, the vulnerable config)
5. Recovery            — restoring normal operations, verified clean
6. Lessons Learned      — a post-incident review feeding back into Preparation for next time`}</CodeBlock>
      <p>
        Notice containment splits into short-term (stop the bleeding, e.g. disconnect the host from the
        network) and long-term (fix it properly so reconnecting is safe) — this exact distinction is why
        the SOC labs earlier in this course emphasized identifying scope before acting, since containing
        too early can destroy evidence, and too late lets an incident spread further.
      </p>

      <h2>Evidence handling: chain of custody</h2>
      <p>
        Anything collected during an investigation that might end up in a legal proceeding must maintain a
        documented, unbroken chain of custody — who collected it, when, how it was stored, and who accessed
        it since. This is exactly why the Digital Forensics module in this course emphasized working from a
        verified copy, never the original evidence directly.
      </p>
      <CodeBlock label="order of volatility — collect the most fragile evidence first">{`1. CPU registers, cache
2. RAM (routing table, ARP cache, running processes)
3. Temporary file systems
4. Disk
5. Remote logging / monitoring data
6. Physical configuration / network topology
7. Archival media / backups`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This "order of volatility" is why memory forensics (covered hands-on in the Digital Forensics
          module) is captured before disk imaging whenever possible — RAM contents disappear the moment a
          machine powers off, while a disk image can wait.
        </p>
      </Callout>

      <h2>Business Continuity Planning (BCP) vs. Disaster Recovery Planning (DRP)</h2>
      <CodeBlock>{`BCP — how the BUSINESS keeps operating during a disruption (alternate processes, alternate locations)
DRP — how IT SYSTEMS specifically get restored (the technical recovery procedures, RTO/RPO targets)

DRP is a subset that supports the broader BCP.`}</CodeBlock>

      <h2>Alternate site strategies</h2>
      <CodeBlock label="ranked by cost vs. recovery speed">{`Hot site   — a fully equipped, staffed, near-real-time mirror of production — fastest recovery, most expensive
Warm site   — hardware in place, but requires some setup/data restoration — moderate cost and speed
Cold site    — basic facility with power/space only, no pre-installed systems — cheapest, slowest recovery`}</CodeBlock>

      <h2>Tabletop exercises</h2>
      <p>
        A tabletop exercise is a discussion-based walkthrough of an incident scenario with key stakeholders
        — no systems are actually touched. This is a low-cost, high-value way to find gaps in a response
        plan (unclear ownership, missing contact information, an assumption that turns out to be wrong)
        before a real incident forces the discovery under pressure.
      </p>

      <h2>Communication during an incident</h2>
      <p>
        Security+ expects you to know that incident communication has legal and regulatory dimensions, not
        just technical ones — breach notification laws (GDPR's 72-hour requirement being the best-known
        example) impose hard deadlines on when affected parties and regulators must be informed, completely
        independent of whether the technical investigation is finished.
      </p>

      <Callout variant="warn">
        <p>
          A common exam trap: choosing an answer that delays notification "until the investigation is
          complete." Many regulations require notification within a fixed window of DISCOVERY, not
          resolution — compliance and technical timelines are often running on two separate clocks
          simultaneously.
        </p>
      </Callout>

      <h2>Module complete</h2>
      <p>
        You now have the Security+ layer that sits above every technical module in this course: governance
        and risk math, cryptographic foundations, IAM models, resilient architecture, and the formal
        incident response process that ties a real security program together end to end.
      </p>
    </div>
  );
}
