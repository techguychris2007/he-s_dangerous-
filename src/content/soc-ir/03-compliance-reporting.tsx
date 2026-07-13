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
             for systems in the cardholder data environment.
HIPAA      — protected health information. Requires access logging and periodic review
             for any system touching patient records.
SOC 2       — a broader trust-services audit (security, availability, confidentiality)
              that most B2B SaaS vendors are asked for by their own enterprise customers.
ISO 27001    — an international information-security management standard, audited
               against a documented set of controls an organization commits to maintaining.`}</CodeBlock>
      <p>
        Notice the common thread: every one of these asks for the SAME underlying evidence — logs were
        collected, they were actually reviewed (not just stored), and any anomaly found during that review was
        followed up on and documented. A SIEM is the tool that makes generating that evidence a query instead
        of a weeks-long manual archaeology project.
      </p>

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
        This closes out the four-module SOC curriculum: alert triage and threat hunting, the SIEM platforms
        themselves, the detection-engineering techniques that generate real findings, and the investigation,
        automation, and reporting that turn a finding into a properly closed incident. The SOC Portal's SIEM
        labs let you practice every one of these mechanics directly, inside real platform-style consoles,
        against both realistic essentials scenarios and reconstructions of major real-world breaches.
      </p>
    </div>
  );
}
