import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function CspmAndClosingCaseStudies() {
  return (
    <div className="prose-hh">
      <h1>Cloud Security Posture Management & Closing Case Studies</h1>
      <p>
        This closing lesson ties every technique across this module's six lessons into a Cloud Security
        Posture Management (CSPM) framework, and closes with a real-world case study showing what happens when
        a single misconfiguration goes undetected at scale.
      </p>

      <h2>CSPM: continuous automated auditing against this module's own checklist</h2>
      <CodeBlock label="what a CSPM tool actually automates, mapped to this module's lessons">{`Lesson 1 checks    -- public S3/storage bucket scanning, instance metadata
                      service version enforcement (IMDSv2-only)
Lesson 2 checks       -- overly permissive IAM policies (wildcard actions/
                      resources), unused access keys, missing MFA
Lesson 3 checks          -- exposed container/Kubernetes API endpoints,
                      Terraform state file exposure
Lesson 4 checks             -- overly broad cross-account trust policies
                      (this module's "root" principal anti-pattern)
Lesson 5 checks                -- CloudTrail not enabled in all regions,
                      retention below policy minimums`}</CodeBlock>
      <Callout variant="tip">
        <p>
          A CSPM tool (AWS Security Hub, Prisma Cloud, Wiz, and similar) is, fundamentally, this ENTIRE
          module's checklist automated and run continuously rather than as a one-time manual assessment —
          directly paralleling the IoT module's OWASP FSTM framework and the Mobile module's MASVS checklist:
          codify a domain's known misconfiguration patterns into a repeatable, automatable audit rather than
          relying on a human remembering to check each one during periodic manual reviews.
        </p>
      </Callout>

      <h2>Prioritization: not every finding deserves equal urgency</h2>
      <CodeBlock label="a realistic CSPM triage framework, not just flagging everything critical">{`Internet-facing + no auth + sensitive data       -> Critical, immediate
  (a public bucket with PII, Lesson 1)
Internet-facing + no auth + non-sensitive data      -> High, near-term
  (a public bucket with only marketing assets)
Internal-only + overly broad permissions               -> Medium, scheduled
  remediation (an over-permissioned role no INTERNET-reachable service
  can actually exploit without a separate foothold first)
Compensating control already present                     -> Lower priority
  (an exposed API that's already behind a properly configured VPN/
  allowlist, reducing real-world exploitability even if the underlying
  finding is technically still true)`}</CodeBlock>
      <Callout variant="warn">
        <p>
          A CSPM tool that reports every finding as "Critical" trains security teams to ignore its output
          entirely — the same alert-fatigue dynamic from the SOC Fundamentals module's alert-triage lesson,
          just at the cloud-configuration layer instead of real-time event streams. Effective CSPM prioritization
          requires the same severity-calibration discipline as the Bug Bounty Methodology module's report-writing
          lesson: real-world exploitability and actual data sensitivity, not just "does this technically violate
          a best practice."
        </p>
      </Callout>

      <Callout variant="incident">
        <p>
          <strong>Real incident — the Verizon/NICE Systems exposure, disclosed July 2017:</strong> security
          researchers at UpGuard discovered a misconfigured Amazon S3 bucket, owned by NICE Systems (a
          third-party partner analyzing customer service call data for Verizon), left with public access
          enabled — exposing detailed records for an estimated 14 million Verizon customers, including names,
          phone numbers, and in some records, account PINs used to verify customer identity over the phone.
          This is a direct, large-scale real-world instance of exactly the Lesson 1 finding class this module
          opened with — no exploit, no injection, no clever attack technique of any kind, just a storage bucket
          left publicly readable — and it illustrates the module's recurring throughline precisely: the third-
          party/vendor angle. Verizon's own cloud security posture was not what failed here; a partner's
          misconfigured bucket, processing Verizon's data under a business relationship, was the actual failure
          point — the exact reason vendor risk management and third-party data-handling agreements sit
          alongside an organization's own CSPM coverage, not as an afterthought.
        </p>
      </Callout>

      <h2>Module synthesis: the complete arc, six lessons</h2>
      <CodeBlock label="the throughline from fundamentals through this closing lesson">{`L1  Fundamentals        -> shared responsibility, public buckets, SSRF-to-
                           metadata-credential-theft
L2    IAM/misconfig        -> least privilege, and the misconfiguration
                           checklist this entire module keeps returning to
L3      Containers/IaC        -> the same misconfiguration patterns, one
                           layer down in the infrastructure stack
L4        Cross-account          -> the same patterns again, at the
                           account-trust-boundary layer
L5          Detection/logging       -> catching all of the above once
                           they're being actively exploited
L6            CSPM/case studies        -> automating the entire checklist,
                           and a real 14-million-record example of what
                           happens when Lesson 1's finding class goes
                           undetected at real-world scale`}</CodeBlock>
      <p>
        Across every lesson, cloud security findings have turned out to be dramatically more about
        MISCONFIGURATION than about novel exploitation techniques — public storage, over-permissioned roles,
        missing logging, and overly broad trust relationships account for the overwhelming majority of real
        cloud breaches, this module's entire arc included. The tooling is cloud-specific; the underlying
        discipline — least privilege, defense in depth, and verifying rather than assuming a control is
        actually enforced — is the same discipline this course has built from its very first module.
      </p>
    </div>
  );
}
