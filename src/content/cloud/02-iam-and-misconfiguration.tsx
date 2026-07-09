import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function IamAndMisconfiguration() {
  return (
    <div className="prose-hh">
      <h1>IAM &amp; Common Cloud Misconfigurations</h1>
      <p>
        Identity and Access Management (IAM) is the permission system controlling who — and what service —
        can do what, to which cloud resources. Nearly every serious cloud compromise eventually runs into
        an IAM decision that was too permissive.
      </p>

      <h2>The principle IAM keeps getting wrong: least privilege</h2>
      <p>
        Least privilege means every identity — human or service — gets exactly the permissions it needs
        to do its job, nothing more. In practice, teams under deadline pressure grant broad permissions
        ("just give it admin, we'll fix it later") and the "later" never comes.
      </p>
      <CodeBlock label="an overly broad policy vs. a scoped one">{`// Overly broad — a reporting service that only needs to READ one bucket
{ "Effect": "Allow", "Action": "*", "Resource": "*" }

// Correctly scoped
{ "Effect": "Allow", "Action": ["s3:GetObject"], "Resource": "arn:aws:s3:::reports-bucket/*" }`}</CodeBlock>
      <p>
        The first policy means that if the reporting service is ever compromised (say, via the SSRF
        technique from the previous lesson), the attacker inherits full control over the entire cloud
        account — not just read access to one bucket.
      </p>

      <h2>Instance roles: convenient, and a favorite attacker target</h2>
      <p>
        Instance roles (the IAM credentials handed to a VM via the metadata service) exist specifically so
        applications don't need hardcoded secrets — a genuine security improvement over embedding access
        keys in source code. The tradeoff: any vulnerability that lets an attacker make the instance issue
        a request on their behalf (SSRF being the classic example) inherits whatever that role can do.
        This is why scoping instance roles as narrowly as possible matters even more than scoping regular
        user permissions.
      </p>

      <h2>Common misconfiguration checklist</h2>
      <CodeBlock label="what a cloud security review checks for, in priority order">{`1. Public storage buckets/containers with sensitive data
2. Overly permissive IAM policies (wildcard actions/resources)
3. Security groups/firewalls open to 0.0.0.0/0 on sensitive ports (SSH, RDP, databases)
4. Secrets in infrastructure-as-code state files or environment variables (vs. a secrets manager)
5. Unencrypted data at rest for sensitive data classes
6. Logging/monitoring disabled or not centrally reviewed (CloudTrail, Azure Activity Log, GCP Audit Logs)`}</CodeBlock>

      <h2>Using a secrets manager instead of state files or env vars</h2>
      <p>
        The fix for the Terraform state file problem from the previous lesson isn't "never use Terraform" —
        it's storing genuinely sensitive values (passwords, keys) in a dedicated secrets manager (AWS
        Secrets Manager, HashiCorp Vault, Azure Key Vault) and referencing them by name in your
        infrastructure code, rather than letting the actual secret value ever land in a state file at all.
      </p>

      <Callout variant="tip">
        <p>
          When you're testing a cloud-hosted application (in an authorized engagement or bug bounty
          program), always ask: does this app run with an attached instance role? If yes, any SSRF finding
          you make should be escalated immediately to check the metadata endpoint — it's often the single
          highest-impact next step available.
        </p>
      </Callout>

      <h2>Module complete</h2>
      <p>
        The three labs in this module let you exploit exactly the misconfigurations covered here: a public
        storage bucket, an SSRF-to-metadata credential theft, and a leaked infrastructure-as-code secret —
        the three patterns responsible for the overwhelming majority of real-world cloud security incidents.
      </p>
    </div>
  );
}
