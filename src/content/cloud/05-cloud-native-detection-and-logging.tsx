import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function CloudNativeDetectionAndLogging() {
  return (
    <div className="prose-hh">
      <h1>Cloud-Native Detection & Logging</h1>
      <p>
        Every attack technique in this module leaves a trace in cloud-native logs — if those logs are actually
        enabled, retained, and monitored. This lesson covers the defensive side: what CloudTrail/Activity
        Log/Cloud Audit Logs actually capture, and the detection patterns built on top of them, extending the
        SOC modules' methodology into the cloud control plane specifically.
      </p>

      <h2>The cloud control-plane log: a fundamentally different log source</h2>
      <CodeBlock label="what CloudTrail (AWS's equivalent exists in every major cloud) actually records">{`Every single API call made against an AWS account -- not network traffic,
not application logs, but every management-plane action: who called
CreateUser, who called AssumeRole, who called GetObject on a specific S3
bucket, from what source IP, using what credential, at what timestamp.

{
  "eventName": "AssumeRole",
  "sourceIPAddress": "203.0.113.44",
  "userIdentity": { "arn": "arn:aws:iam::111111111111:user/j.alvarez" },
  "requestParameters": { "roleArn": "arn:aws:iam::222222222222:role/Admin" }
}`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This is a genuinely distinct log category from anything in the SOC modules' original material — not
          network telemetry, not host-based EDR, but a complete record of every CONTROL-PLANE action taken
          against the cloud account itself. A sophisticated attacker who never touches a single running
          instance (working entirely through the API — creating access keys, assuming roles, modifying IAM
          policies) leaves essentially no trace anywhere EXCEPT this log source.
        </p>
      </Callout>

      <h2>Common cloud-specific detection patterns</h2>
      <CodeBlock label="correlation rules built specifically on control-plane events, extending the SOC SIEM module">{`- GetCallerIdentity failures followed by SUCCESS from a new/unusual source
  IP -- classic access-key-testing pattern from a leaked credential (the
  GitHub-secret-scanning scenario from the Recon module's cloud lesson)
- CreateAccessKey or CreateLoginProfile called for an IAM user OTHER than
  the calling identity itself -- a strong backdoor-persistence indicator
- console login WITHOUT MFA from an account where MFA is normally enforced
- an unusual, high-volume sequence of ListBuckets/GetObject calls across
  MANY different buckets in a short window -- consistent with the
  systematic enumeration pattern from this module's Lesson 1 misconfigured-
  bucket material, just now viewed from the detection side`}</CodeBlock>

      <h2>GuardDuty and managed cloud threat detection</h2>
      <p>
        AWS GuardDuty (and its equivalents — Azure Defender, GCP Security Command Center) is a managed
        detection service that continuously analyzes CloudTrail, VPC flow logs, and DNS logs against both
        known threat-intelligence indicators and behavioral anomaly models — the cloud-native, largely
        pre-built version of the SOC Detection Engineering module's UEBA lesson, running with minimal setup
        effort compared to building equivalent correlation rules from scratch.
      </p>
      <CodeBlock label="a representative GuardDuty finding type">{`UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS
  -- fires when temporary credentials issued to an EC2 instance role are
     used from a source IP OUTSIDE AWS entirely -- a strong signal those
     credentials were stolen (via SSRF-to-metadata-service, this module's
     Lesson 1 technique) and are now being used by an external attacker,
     since a legitimate instance role's credentials should only ever be
     used FROM that instance`}</CodeBlock>

      <h2>The retention and enablement gap: why detection often fails before it starts</h2>
      <Callout variant="warn">
        <p>
          CloudTrail, in many AWS accounts, is NOT enabled by default for every region, and default log
          retention windows are often shorter than a realistic investigation timeline requires — meaning by the
          time a breach is discovered (frequently weeks to months after initial access, consistent with
          industry breach-report averages), the actual logs needed to reconstruct the attacker's full timeline
          may have already expired. This mirrors the SOC IR module's own investigation-methodology lesson
          exactly: the best detection tooling in the world produces nothing useful if the underlying log source
          was never actually configured to persist long enough.
        </p>
      </Callout>

      <h2>Applying this as a defensive checklist</h2>
      <CodeBlock label="the minimum viable cloud logging posture, per this lesson">{`- CloudTrail enabled in ALL regions (not just the ones actively used --
  an attacker can operate from an unused region specifically to evade
  monitoring scoped only to "the regions we normally use")
- Logs shipped to a SEPARATE account/storage location the primary
  account's own compromised credentials can't reach back into and delete
  -- the cloud-native version of this course's "logs an attacker with root
  can tamper with" concern from the Linux Logging & Auditing lesson
- Retention long enough to cover realistic dwell-time investigation windows
- At minimum the detection patterns above wired into active alerting, not
  just passively collected and never reviewed`}</CodeBlock>

      <p>
        With detection covered, the final lesson in this module ties every prior lesson's technique together
        into a Cloud Security Posture Management framework and closes with a real-world case study synthesizing
        the module.
      </p>
    </div>
  );
}
