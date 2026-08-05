import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ComplianceReporting() {
  return (
    <div className="prose-hh">
      <h1>Compliance Reporting (PCI-DSS, HIPAA, SOC 2, ISO 27001)</h1>
      <p>
        Detection and response are only half of what a SIEM gets used for on a routine basis. Compliance
        frameworks explicitly require organizations to review and retain security logs, and to be able to
        produce evidence of that review on demand — turning "we have a SIEM" into "we can prove we actually
        use it" for an external auditor.
      </p>

      <h2>The frameworks and what each one actually cares about</h2>
      <CodeBlock label="the major frameworks a SOC commonly reports against">{`PCI-DSS   — payment card data. Requirement 10.6 specifically mandates DAILY log review
             for systems in the cardholder data environment. Minimum 1-year log retention.
HIPAA      — protected health information. Requires access logging and periodic review
             for any system touching patient records. ~6-year retention is standard practice.
SOC 2       — a broader trust-services audit (security, availability, confidentiality)
              that most B2B SaaS vendors are asked for by their own enterprise customers.
              No fixed retention mandate — auditors check that your OWN stated policy
              (commonly 1-3 years) is actually followed, not a specific number.
ISO 27001    — an international information-security management standard, audited
               against a documented set of controls an organization commits to maintaining.
               No hard-coded retention period either, but 12 months is the commonly-cited
               practical minimum to support incident response and management review.
GDPR          — EU personal data protection. Doesn't mandate periodic review like the
               others — it mandates something sharper: notifying regulators within
               72 HOURS of becoming aware of a breach likely to risk individuals' rights.`}</CodeBlock>
      <p>
        Notice the common thread: every one of these asks for the SAME underlying evidence — logs were
        collected, they were actually reviewed (not just stored), and any anomaly found during that review was
        followed up on and documented. A SIEM is the tool that makes generating that evidence a query instead
        of a weeks-long manual archaeology project.
      </p>

      <h2>GDPR: a fundamentally different kind of reporting requirement</h2>
      <p>
        Every framework above is about proving <em>ongoing</em>, routine review happened. GDPR's Article 33 is
        different in kind: it's not a periodic-review requirement at all, but an incident-triggered one — once
        an organization becomes aware that a breach has occurred and it's likely to risk individuals' rights
        and freedoms, the clock starts on a 72-hour deadline to notify the relevant supervisory authority, even
        if full details aren't yet known.
      </p>
      <CodeBlock label="how a real GDPR notification timeline actually plays out">{`T+0h    Awareness confirmed: reasonable certainty personal data was compromised
T+72h   DEADLINE — initial notification filed with the supervisory authority,
         stating what IS known even if the full scope isn't yet
T+later Supplementary notification filed once more information is available
         (explicitly permitted — GDPR does not require a complete picture in 72 hours,
         only a documented, timely start)`}</CodeBlock>
      <Callout variant="warn">
        <p>
          The 72 hours starts at <strong>awareness</strong>, not at the moment the breach actually occurred —
          which is exactly why this lesson's earlier point about timelines and scoping matters so much here: an
          organization that can't quickly reconstruct when it became aware, and what it knew at each point, has
          no reliable way to prove it met the deadline at all. Missing this notification is its own separate
          violation, independent of the breach itself, carrying fines of up to €10 million or 2% of global
          annual turnover — whichever is higher.
        </p>
      </Callout>

      <h2>What a real compliance report actually contains</h2>
      <CodeBlock label="the shape of a PCI-DSS Requirement 10.6 report, the exact one the Elastic compliance lab has you find">{`PCI-DSS COMPLIANCE REPORT (Requirement 10.6 — daily log review, aggregated quarterly)
  - 14,220 authentication events reviewed this quarter, card-data environment
  - 3 privileged-access events flagged for manual review
  - all 3 confirmed legitimate against open change-management tickets
  - report generated and retained for the required 12-month audit trail`}</CodeBlock>
      <p>
        An auditor reading this wants to see three specific things: that review actually happened (not just
        that logging was theoretically enabled), that anomalies were followed up rather than silently
        ignored, and that the report itself is retained long enough to satisfy the framework's specific
        retention requirement.
      </p>

      <h2>Retention: the requirement that quietly shapes SIEM architecture</h2>
      <p>
        PCI-DSS requires at least one year of retained log history, with the most recent three months
        immediately available for analysis rather than archived to slower cold storage. This single
        requirement is a major driver of real SIEM storage-tiering architecture — hot, fast, expensive storage
        for the recent window investigations actually run against, cheaper cold storage for the longer
        compliance-retention tail that is rarely queried but must still be producible on request.
      </p>

      <h2>Automating the report itself</h2>
      <p>
        Just like detection, compliance reporting benefits enormously from automation — a scheduled query that
        runs on the same cadence the framework requires (daily, for PCI-DSS Requirement 10.6) and produces a
        standing report automatically is both less error-prone and dramatically less labor-intensive than an
        analyst manually re-running the same review by hand every single day.
      </p>

      <Callout variant="tip">
        <p>
          A useful habit: treat every compliance report the same way you would treat a detection rule — write
          it once, automate its generation, and review its OUTPUT rather than manually re-deriving it from raw
          logs each time. The manual-review requirement is about the review happening reliably, not about the
          review being manually performed by hand every single time.
        </p>
      </Callout>

      <Callout variant="warn">
        <p>
          A generated report that nobody actually reads is not compliance, it is paperwork — auditors
          increasingly ask not just "can you produce this report" but "show me evidence a human looked at it
          and what they did when something needed follow-up," exactly the "3 flagged, all confirmed
          legitimate" detail in the example report above.
        </p>
      </Callout>

      <p>
        With triage, automation, and reporting all covered, the final lesson steps back from mechanics to two
        real, widely-cited breaches — Target in 2013 and the Bangladesh Bank SWIFT heist in 2016 — that show
        exactly what happens when a detection is correct but the response around it still fails.
      </p>
    </div>
  );
}
