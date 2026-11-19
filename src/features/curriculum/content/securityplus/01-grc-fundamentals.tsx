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

      <h2>Qualitative vs. quantitative risk assessment</h2>
      <p>
        The ALE math above is quantitative — it produces a dollar figure. Not every risk can be priced that
        precisely (what's the "exposure factor" of reputational damage?), which is why real organizations
        also run <strong>qualitative</strong> assessments: ranking risks on a simple scale (Low/Medium/High,
        or a 1-5 matrix of likelihood x impact) using expert judgment rather than hard numbers. Security+
        expects you to recognize both are legitimate and often used together — quantitative where good data
        exists (known asset values, historical incident frequency), qualitative where it doesn't.
      </p>
      <CodeBlock label="a simple qualitative risk matrix">{`             Impact: Low    Impact: Medium   Impact: High
Likelihood:
Low            Low risk        Low risk         Medium risk
Medium         Low risk        Medium risk      High risk
High           Medium risk     High risk        Critical risk`}</CodeBlock>

      <h2>Putting a real number on the ALE math</h2>
      <p>
        The SLE/ARO/ALE formulas above read as an academic exercise until they're grounded in real industry
        figures. IBM's annual <em>Cost of a Data Breach</em> report has consistently placed the GLOBAL AVERAGE
        cost of a single data breach in the range of $4-4.5 million in recent years — a number organizations
        routinely plug directly into their own ALE calculations as a starting Asset Value/Exposure Factor
        estimate when they don't yet have better internal data. It's also the exact justification behind the
        "Transfer" risk treatment option: cyber insurance premiums are priced against exactly this kind of
        industry-wide loss data, not a guess.
      </p>

      <h2>Third-party and vendor risk management</h2>
      <p>
        An organization's own controls are only half the picture — every vendor, SaaS integration, and
        supply-chain dependency inherits a share of that organization's risk. This is exactly the pattern
        the Cloud Security module's Salesloft/Drift case study illustrates: a compromise at a trusted
        third-party vendor gave attackers access to over 700 downstream customer organizations without
        touching any of their own perimeters directly. GRC programs formalize this as vendor risk
        management — due diligence before signing a contract (does this vendor hold a current SOC 2 report?
        what data will they touch?), and ongoing monitoring after (do they notify us promptly if they're
        breached?), not just a one-time checkbox at procurement.
      </p>
      <CodeBlock label="assessment types Security+ expects you to distinguish">{`Vulnerability assessment  — identifies and ranks weaknesses, does NOT attempt to exploit them
Penetration test          — actively attempts exploitation, with defined scope and rules of engagement
Security audit            — checks compliance against a specific standard/policy (are controls implemented as documented?)
SOC 2 Type I              — are controls suitably DESIGNED, as of a point in time
SOC 2 Type II             — are controls OPERATING EFFECTIVELY over a period (typically 6-12 months) — a materially stronger assurance`}</CodeBlock>
      <Callout variant="warn">
        <p>
          A frequent exam trap: treating a vulnerability scan and a penetration test as interchangeable.
          A vulnerability scan is broad, automated, and non-invasive; a penetration test is scoped, requires
          explicit written authorization (the same rules of engagement covered across this course's offensive
          modules), and can include actual exploitation. Confusing which one a scenario describes is one of
          the most commonly missed question types on the real exam.
        </p>
      </Callout>

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
