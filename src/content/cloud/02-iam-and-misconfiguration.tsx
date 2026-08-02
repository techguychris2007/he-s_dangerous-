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

      <h2>Cloud security auditing tools</h2>
      <p>
        Everything covered so far in this lesson describes what can go wrong. In practice, both defenders
        and authorized testers rarely check every one of these misconfigurations by hand — they run a
        scanner built specifically to check hundreds of known-bad patterns at once. It's worth knowing the
        major tools by name, since they show up constantly in real cloud security job postings and audit
        reports.
      </p>
      <CodeBlock label="Prowler — open-source AWS best-practices & compliance scanner">{`prowler aws
# checks hundreds of controls against CIS benchmarks and other frameworks
# (PCI DSS, GDPR, SOC 2, and more) — outputs a pass/fail report per check,
# e.g. "is S3 bucket versioning enabled," "is root account MFA enabled"`}</CodeBlock>
      <CodeBlock label="ScoutSuite — multi-cloud auditing (AWS / Azure / GCP / and more)">{`scout aws
scout azure
scout gcp
# produces a single browsable HTML report highlighting misconfigurations
# across every service in the account — a good first-pass overview across
# providers, where Prowler goes deeper AWS-specifically`}</CodeBlock>
      <p>
        <strong>CloudSploit</strong> is another configuration security scanner in the same category,
        historically one of the strongest open-source options specifically for AWS before being folded into
        a commercial platform — you'll still see it referenced in older audit tooling and reports.
      </p>
      <p>
        All three of the tools above are <strong>defensive/auditing</strong> tools: they read configuration
        and report on it, they don't exploit anything. <strong>Pacu</strong> is different in kind — it's an
        AWS exploitation framework for POST-compromise offensive testing, used once you already have some
        foothold (a set of credentials) inside an AWS account and want to enumerate and actually exploit IAM
        misconfigurations, privilege escalation paths, and exfiltration techniques from the inside, the same
        way a real attacker who obtained those credentials would.
      </p>
      <CodeBlock label="Pacu — conceptual usage, offensive AWS post-exploitation">{`pacu
> import_keys --all              # load discovered/compromised AWS credentials into the session
> run iam__enum_permissions       # figure out exactly what this identity can actually do
> run iam__privesc_scan           # check for known IAM privilege-escalation paths from here`}</CodeBlock>
      <Callout variant="danger">
        <p>
          Pacu is explicitly an attack tool and must only ever be run against an AWS account you own or have
          documented, written authorization to test — it is not a defensive scanner, and running it against
          an account without that authorization is unauthorized computer access, full stop. Prowler,
          ScoutSuite, and CloudSploit are safe to run against your own accounts for legitimate auditing
          purposes since they only read configuration; Pacu actively exploits.
        </p>
      </Callout>

      <h2>Containers and Kubernetes: IAM's newer, messier cousin</h2>
      <p>
        Everything above assumes a relatively static set of identities (users, roles, instances). Containers
        add a layer where the identity boundary is much easier to get wrong: by default, every pod in a
        Kubernetes cluster can often reach every other pod, the cluster's own control-plane API, and — if the
        underlying nodes have instance roles attached — potentially the exact cloud metadata endpoint covered
        earlier, unless network policies and pod-level IAM scoping are deliberately configured.
      </p>
      <CodeBlock label="the exposed-dashboard pattern — one of the most common real Kubernetes findings">{`curl http://10.10.109.2/api/v1/pods
# an unauthenticated Kubernetes API/dashboard exposes the full pod list, and often
# secrets mounted into those pods — this exact misconfiguration is common enough
# that internet-wide scans regularly turn up publicly reachable K8s dashboards`}</CodeBlock>
      <p>
        <strong>kube-hunter</strong> and <strong>kube-bench</strong> are the Kubernetes-specific equivalents
        of Prowler/ScoutSuite above: kube-hunter actively probes a cluster for exploitable misconfigurations
        (exposed dashboards, anonymous API access, privileged pod escapes), while kube-bench checks a
        cluster's configuration against the CIS Kubernetes Benchmark the same way Prowler checks AWS against
        CIS. The container-specific principle to hold onto: a pod is not a security boundary by default the
        way a full VM is — namespace isolation, network policies, and pod security standards all have to be
        deliberately configured, or a compromised low-value pod can become a path to every secret in the
        cluster.
      </p>

      <h2>One more IAM leak worth naming explicitly: credentials committed to a public repo</h2>
      <p>
        Every misconfiguration covered so far assumes the credential itself was generated and stored
        correctly, then reached by an attacker through some other flaw (SSRF, an open bucket, a state file).
        The single most common real way IAM credentials actually leak skips all of that: a developer commits
        an AWS access key directly into source code — often in a config file meant to be gitignored but
        pushed once by mistake — and pushes it to a public GitHub repository. Automated scanners (both
        GitHub's own secret-scanning and attacker-run tools scraping public commits in real time) find keys
        like this within minutes of the push, frequently faster than the developer who committed it notices.
      </p>
      <Callout variant="warn">
        <p>
          This is why AWS automatically flags and often auto-quarantines access keys it detects in public
          GitHub repos — the window between an accidental commit and automated discovery is measured in
          minutes, not the days a manual security review would take to catch the same mistake.
        </p>
      </Callout>
      <p>
        The labs in this module let you exploit exactly the misconfigurations covered here: a public storage
        bucket, an SSRF-to-metadata credential theft, a credential leaked straight into a public repo, and a
        leaked infrastructure-as-code secret — together responsible for the overwhelming majority of
        real-world cloud security incidents. The next lesson moves from storage and identity to the layer
        most modern cloud workloads actually run on: containers, Kubernetes, and infrastructure-as-code.
      </p>
    </div>
  );
}
