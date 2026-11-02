import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function CloudNativeDetectionAndLogging() {
  return (
    <div className="prose-hh">
      <h1>Cloud-Native Detection & Logging</h1>
      <p>
        Some activities in this module can produce supported cloud-native audit events when the relevant collection is
        enabled, retained, and monitored. This lesson covers the defensive side: what CloudTrail/Activity
        Log/Cloud Audit Logs actually capture, and the detection patterns built on top of them, extending the
        SOC modules' methodology into the cloud control plane specifically.
      </p>

      <h2>The cloud control-plane log: a fundamentally different log source</h2>
      <CodeBlock label="what CloudTrail (AWS's equivalent exists in every major cloud) actually records">{`Supported audit events under the configured collection: management events
include operations such as CreateUser and AssumeRole. Object reads such as
GetObject require relevant data-event collection; they are not guaranteed
by event history alone. Coverage, region and retention must be checked.

{
  "eventName": "AssumeRole",
  "sourceIPAddress": "203.0.113.44",
  "userIdentity": { "arn": "arn:aws:iam::111111111111:user/j.alvarez" },
  "requestParameters": { "roleArn": "arn:aws:iam::222222222222:role/Admin" }
}`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This is a genuinely distinct log category from anything in the SOC modules' original material — not
          network telemetry, not host-based EDR, but records of supported control-plane actions within configured coverage
          against the cloud account itself. A sophisticated attacker who never touches a single running
          instance (working entirely through the API — creating access keys, assuming roles, modifying IAM
          policies) may require cloud audit evidence for attribution. Identity-provider, application and other
          service telemetry can also contribute; do not assume CloudTrail is the only possible source.
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
          CloudTrail's built-in event history is on by default, but it keeps only the last 90 days of
          management events, per region, and records no data events such as S3 object reads. Anything longer or
          broader needs a <em>trail</em> (or an event data store) that someone deliberately created, covering all
          regions and delivering to durable storage. Many accounts never create one — meaning by the
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

      <h2>Proving the logs were not altered</h2>
      <p>
        An attacker with enough privilege will try to stop the trail or delete its files. Two controls answer
        that. First, enable <strong>log file integrity validation</strong>: CloudTrail then writes signed digest
        files, and <code>aws cloudtrail validate-logs</code> reports any log file that was changed or removed
        after delivery. Second, deliver to a bucket in a separate logging account protected by S3 Object Lock,
        so even an administrator of the production account cannot delete the evidence. Alert on
        <code> StopLogging</code>, <code>DeleteTrail</code> and <code>PutEventSelectors</code> — an attacker
        reducing logging is itself one of the most reliable signals you will get.
      </p>

      <h2>Turning a pattern into a query</h2>
      <p>
        The "access key created for someone else" pattern above becomes a concrete query once the trail is
        stored. With CloudTrail logs in S3 and an Athena table over them:
      </p>
      <CodeBlock label="Athena SQL: keys created for a different user than the caller">{`SELECT eventtime,
       useridentity.arn                         AS caller,
       json_extract_scalar(requestparameters, '$.userName') AS target_user,
       sourceipaddress
FROM   cloudtrail_logs
WHERE  eventname = 'CreateAccessKey'
  AND  json_extract_scalar(requestparameters, '$.userName') IS NOT NULL
  AND  useridentity.arn NOT LIKE
       ('%/' || json_extract_scalar(requestparameters, '$.userName'))
ORDER  BY eventtime DESC;`}</CodeBlock>
      <p>
        Each row is a lead: an identity minting long-lived credentials for another identity. Some will be
        legitimate administration — record which roles are expected to do this and exclude them explicitly, so
        the rule stays quiet until something unusual happens.
      </p>

      <h2>The same ideas in Azure and Google Cloud</h2>
      <div className="lesson-table-wrap">
        <table className="lesson-table">
          <thead><tr><th scope="col">Need</th><th scope="col">Azure</th><th scope="col">Google Cloud</th></tr></thead>
          <tbody>
            <tr><th scope="row">Control-plane audit log</th><td>Activity Log (subscription operations); Entra ID sign-in and audit logs for identities</td><td>Cloud Audit Logs — Admin Activity (always on)</td></tr>
            <tr><th scope="row">Data access log</th><td>Resource diagnostic settings per service</td><td>Data Access audit logs (mostly off by default)</td></tr>
            <tr><th scope="row">Long retention</th><td>Diagnostic setting to a Log Analytics workspace or storage account</td><td>Log sink to Cloud Storage or BigQuery</td></tr>
            <tr><th scope="row">Managed detection</th><td>Microsoft Defender for Cloud</td><td>Security Command Center</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Practice exercise</h2>
      <p>
        A developer's access key leaked in a public repository 70 days ago and was revoked today. The account
        has no trail; only the default event history exists. Leadership asks whether any data in S3 was read.
      </p>
      <p><strong>Your task:</strong> say what you can and cannot answer, and what to change.</p>
      <details>
        <summary>Worked explanation</summary>
        <p>
          Event history still covers the last 90 days, so you can list the management calls the key made —
          for example <code>ListBuckets</code>, <code>CreateAccessKey</code> or <code>AssumeRole</code> — in each
          region you search. You cannot answer whether objects were read: <code>GetObject</code> is a data event
          and nothing recorded it. Say so plainly in the report rather than implying "no evidence of access".
          Then create a multi-region trail with data events for sensitive buckets, integrity validation, and
          delivery to a separate logging account.
        </p>
      </details>

      <h2>Common misconceptions</h2>
      <ul>
        <li>"CloudTrail is on, so we log everything." Default event history covers 90 days of management events only.</li>
        <li>"No alert means no attacker." Detection only covers regions, services and event types that are actually collected.</li>
        <li>"Logs in the same account are safe." Credentials that can administer the account can often delete its logs; separate the storage.</li>
        <li>"Managed detection replaces custom rules." GuardDuty-style services cover common patterns; your own architecture still needs rules only you can write.</li>
      </ul>

      <h2>References and further practice</h2>
      <ul>
        <li><a href="https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html" target="_blank" rel="noreferrer">AWS CloudTrail User Guide</a></li>
        <li><a href="https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-log-file-validation-intro.html" target="_blank" rel="noreferrer">AWS — Validating CloudTrail log file integrity</a></li>
        <li><a href="https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-active.html" target="_blank" rel="noreferrer">AWS — GuardDuty finding types</a></li>
        <li><a href="https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/activity-log" target="_blank" rel="noreferrer">Microsoft — Azure Activity Log</a></li>
        <li><a href="https://cloud.google.com/logging/docs/audit" target="_blank" rel="noreferrer">Google Cloud — Cloud Audit Logs</a></li>
      </ul>

      <p>
        With detection covered, the final lesson in this module ties every prior lesson's technique together
        into a Cloud Security Posture Management framework and closes with a real-world case study synthesizing
        the module.
      </p>
    </div>
  );
}
