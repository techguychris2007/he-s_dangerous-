import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function GrcFundamentals() {
  return (
    <div className="prose-hh">
      <h1>Governance, Risk &amp; Compliance (GRC) Fundamentals</h1>
      <p>
        Everything else in this course is offense and defense at the technical layer. GRC is the layer
        above it — the policies, risk decisions, and regulatory obligations that determine what "secure
        enough" actually means for a given organization. Security+ treats this as core knowledge because in
        practice, most security programs are shaped more by compliance deadlines than by technical elegance.
      </p>

      <h2>Governance: who decides, and how</h2>
      <p>
        Security governance is the structure of policies, standards, and accountability that directs an
        organization's security program. The hierarchy matters:
      </p>
      <CodeBlock label="the governance document hierarchy">{`Policy      — high-level, board-approved statement of intent ("we will protect customer data")
Standard    — specific, mandatory requirements implementing a policy ("passwords must be 12+ characters")
Procedure   — step-by-step instructions to meet a standard ("how to reset a user's password securely")
Guideline   — recommended (not mandatory) best practice`}</CodeBlock>

      <h2>Risk management: the core vocabulary</h2>
      <CodeBlock label="terms you need cold for both the exam and real practice">{`Asset          — anything of value worth protecting (data, systems, reputation)
Threat         — anything that could cause harm to an asset
Vulnerability  — a weakness a threat could exploit
Risk           — the intersection: likelihood x impact of a threat exploiting a vulnerability
Risk appetite  — how much risk an organization is willing to accept in pursuit of its objectives`}</CodeBlock>
      <p>
        Risk treatment has exactly four options, and Security+ expects you to identify which one applies
        in a given scenario:
      </p>
      <ul>
        <li><strong>Accept</strong> — do nothing further; the cost of mitigation exceeds the risk.</li>
        <li><strong>Mitigate</strong> — reduce likelihood or impact (patch the vulnerability, add a control).</li>
        <li><strong>Transfer</strong> — shift the financial impact elsewhere (cyber insurance, a vendor contract).</li>
        <li><strong>Avoid</strong> — eliminate the activity that creates the risk entirely.</li>
      </ul>

      <h2>Quantitative risk calculation</h2>
      <CodeBlock label="the formulas Security+ actually tests">{`SLE (Single Loss Expectancy) = Asset Value x Exposure Factor
ARO (Annualized Rate of Occurrence) = expected number of occurrences per year
ALE (Annualized Loss Expectancy) = SLE x ARO

Example: a server worth $50,000 (Asset Value), a breach destroys 40% of its value (Exposure Factor 0.4)
SLE = $50,000 x 0.4 = $20,000
If this type of breach is expected once every 5 years, ARO = 0.2
ALE = $20,000 x 0.2 = $4,000/year`}</CodeBlock>
      <p>
        That $4,000/year figure is what a security control's cost gets compared against — if a control
        costs $10,000/year to prevent a $4,000/year expected loss, the numbers say accept the risk instead.
      </p>

      <h2>Compliance frameworks you'll encounter constantly</h2>
      <CodeBlock label="the major ones and what they actually govern">{`PCI DSS   — payment card data (any org that handles credit card transactions)
HIPAA     — healthcare data (US) — patient records, protected health information
GDPR      — personal data of EU residents, regardless of where the company is based
SOC 2     — a service organization's controls, reported on for enterprise customers/auditors
ISO 27001 — a general information security management system (ISMS) standard, internationally recognized
NIST CSF  — a US framework (Identify, Protect, Detect, Respond, Recover) widely adopted well beyond government`}</CodeBlock>

      <Callout variant="tip">
        <p>
          A pattern the exam loves: a scenario describes a control that's technically weaker but keeps the
          organization compliant with a named framework, versus a stronger control that would violate it.
          Compliance requirements are a floor, not a ceiling — but violating them has its own consequences
          (fines, loss of processing rights) independent of the actual security outcome.
        </p>
      </Callout>

      <h2>Business Continuity &amp; Disaster Recovery — the vocabulary</h2>
      <CodeBlock>{`RTO (Recovery Time Objective)   — how long can this system be down before it's unacceptable
RPO (Recovery Point Objective)  — how much data loss (measured in time) is acceptable
MTTR (Mean Time To Repair)       — average time to restore a failed component
MTBF (Mean Time Between Failures) — average time a component runs before failing`}</CodeBlock>
      <p>
        An RPO of 1 hour means backups must run at least hourly — that single number drives your entire
        backup architecture decision, which is exactly why Security+ tests it as a design constraint, not
        just a definition to memorize.
      </p>

      <p>
        This foundation — governance structure, risk math, and the major compliance frameworks — is what
        every other Security+ domain in this module builds on. Next: the cryptography fundamentals that
        underpin nearly every control discussed from here forward.
      </p>
    </div>
  );
}
