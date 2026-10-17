import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

const hardenedDockerfile = `# Training image tag for the local example. Pin the approved digest in releases.
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install only runtime dependencies in a build stage in a production image.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=10001:10001 app/ ./app/

# The process does not need root to serve the application.
USER 10001:10001

EXPOSE 8080
CMD ["python", "-m", "app"]`;

const restrictedPod = `apiVersion: v1
kind: Pod
metadata:
  name: report-worker
  namespace: training
spec:
  automountServiceAccountToken: false
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: worker
      image: report-worker:training
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
      resources:
        requests:
          cpu: 100m
          memory: 128Mi
        limits:
          cpu: 500m
          memory: 512Mi
      volumeMounts:
        - name: scratch
          mountPath: /tmp
  volumes:
    - name: scratch
      emptyDir:
        sizeLimit: 64Mi`;

const namespaceReadRole = `apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: report-config-reader
  namespace: training
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: report-config-reader
  namespace: training
subjects:
  - kind: ServiceAccount
    name: report-worker
    namespace: training
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: report-config-reader`;

const terraformBackend = `terraform {
  backend "s3" {
    bucket       = "org-terraform-state"
    key          = "production/reporting/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}

# Backend credentials come from the workload's federated/managed identity,
# not access keys embedded in this file.
# Enable bucket versioning and narrowly scope state and lock-file access.
# State and saved plan files remain sensitive even when variables are marked sensitive.`;

const localPipelineChecks = `# These examples scan local training or repository artifacts.
# Review output and tool versions before making a check a blocking CI gate.
trivy config --severity HIGH,CRITICAL ./infrastructure
trivy image --scanners vuln,secret,misconfig darkworld-report-worker:local
checkov -d ./infrastructure --framework terraform,kubernetes,dockerfile

# Produce an SBOM for the exact image build used in a release.
trivy image --format cyclonedx --output report-worker-sbom.cdx.json \
  registry.example.invalid/report-worker@sha256:<reviewed-digest>`;

const reviewSequence = `1. Identify the image digest, registry, source commit, builder, and deployment identity.
2. Compare the deployed digest with the reviewed release manifest and its provenance.
3. Review scanner findings against the exact package, layer, configuration, and runtime context.
4. Check pod identity, namespace RBAC, network policy, secret mounts, and privileged settings.
5. Preserve image digest, SBOM, policy result, deployment event ID, and owner approval.
6. Contain by the approved incident plan; preserve evidence before rebuilding or deleting artifacts.`;

export default function ContainersAndIacSecrets() {
  return (
    <article className="prose-hh">
      <h1>Container, Kubernetes, and infrastructure-as-code security</h1>
      <p>
        Containers package an application and its runtime dependencies so they can be deployed consistently.
        They are useful boundaries, but a container is not automatically a virtual machine or a security
        sandbox. Kubernetes adds an API-driven control plane that schedules and connects those containers.
        Infrastructure-as-code (IaC) describes the cloud resources and cluster configuration in reviewable
        files. The security outcome depends on the image supply chain, runtime privileges, workload identity,
        network policy, secrets handling, and the permissions of the systems that build and deploy it.
      </p>

      <h2>Before you begin: images, containers, hosts, and clusters</h2>
      <p>
        A container <strong>image</strong> is an immutable collection of filesystem layers and metadata.
        Running an image creates a <strong>container</strong> with a process, filesystem view, resource limits,
        and configuration. A container runtime asks a host kernel to isolate processes using operating-system
        primitives such as namespaces and control groups. Most containers share the host kernel, unlike a
        conventional virtual machine that runs a separate guest kernel under a hypervisor. This makes startup
        fast but means the host kernel, runtime, and daemon remain security-critical.
      </p>
      <p>
        Docker Engine commonly uses a privileged daemon to create and manage containers. The Docker socket is
        a control interface to that daemon. A process allowed to issue arbitrary requests through the socket
        may ask the daemon to create containers with powerful host access; treat write access to the socket as
        highly privileged. The socket is not an ordinary application file, and a container with it mounted
        should not be described as isolated from the host.
      </p>
      <p>
        Kubernetes organizes workloads into <strong>pods</strong>, schedules them onto <strong>nodes</strong>,
        and exposes operations through the Kubernetes API server. Kubernetes RBAC controls API actions such as
        reading a ConfigMap or creating a pod. Cloud IAM independently controls access to provider resources
        such as object storage or a key service. A Kubernetes service account and a cloud workload identity
        may be connected through federation, but they are different identities and have different permissions.
      </p>
      <p>
        IaC tools such as Terraform, OpenTofu, CloudFormation, Bicep, and Pulumi turn configuration into
        changes to real infrastructure. A plan or template can reveal intended network and identity design;
        state and saved plans can also contain resource attributes and sensitive values. The file being called
        “code” does not make it safe to publish.
      </p>

      <h2>1. Protect the container control plane</h2>
      <p>
        Keep the Docker daemon on its local Unix socket unless a managed design requires remote access.
        Remote daemon access must use authenticated, encrypted transport and a tightly controlled client
        identity. A firewall alone is not authentication, and binding a management port to a private network
        does not make the API harmless. Prefer a managed build service, rootless runtime, or isolated builder
        for untrusted build inputs rather than giving application containers control of a host daemon.
      </p>
      <p>
        Review who can read or write the socket, which services mount it, and whether those services process
        untrusted pull requests. A read-only filesystem mount of the socket path does not turn the daemon API
        into a safe read-only interface; API operations can still create or change resources. A socket proxy
        can narrow the exposed API, but its allowlist and implementation become security controls that require
        testing and maintenance.
      </p>
      <p>
        Docker's rootless mode runs the daemon and containers without a root daemon, reducing some host impact.
        It has operational and feature tradeoffs, so verify the current Docker documentation for the supported
        deployment. Rootless mode does not replace application isolation, resource limits, image verification,
        or safe handling of untrusted code.
      </p>

      <h2>2. Build a smaller, reproducible image</h2>
      <p>
        Every package in an image increases its attack surface and creates patch work. Use a maintained base
        image from a trusted publisher, pin production releases to an immutable digest, and rebuild regularly
        so security fixes are incorporated. Tags such as <code>latest</code> can move; a digest identifies the
        precise content. A digest pin alone does not prove that an image is trustworthy, so record who built it,
        from which source revision, and through which approved pipeline.
      </p>
      <p>
        Multi-stage builds separate compilers and test tooling from the final runtime image. Copy only the
        artifacts the application needs. Exclude local credentials, SSH directories, package caches, test
        fixtures, and version-control history from the build context with a carefully reviewed
        <code>.dockerignore</code>. A secret accidentally copied into an earlier image layer may remain in the
        image history even if a later layer deletes the visible file.
      </p>
      <CodeBlock label="Example Dockerfile: a minimal non-root application image">{hardenedDockerfile}</CodeBlock>
      <p>
        The example uses a tag so a learner can build and run it in a local training environment. Production
        deployment manifests should reference the reviewed image digest rather than rely on a mutable tag.
        The example sets a non-root numeric UID and copies application files with matching ownership.
        Production builds should separate dependency compilation from runtime installation, lock dependency
        versions, verify downloaded artifacts where feasible, and publish provenance with the release. Do not
        treat a version-pinned image as patched forever; a new digest is required when the publisher fixes a
        vulnerability.
      </p>

      <h2>3. Restrict runtime privileges and resources</h2>
      <p>
        A secure container starts with the least authority its process needs. Run as a non-root user; drop Linux
        capabilities not required by the application; disallow privilege escalation; use the runtime's
        default seccomp profile or a reviewed stricter profile; and make the root filesystem read-only when
        the application permits it. Mount only the specific writable directories the process needs, with
        quotas. Avoid host PID, network, or IPC namespaces, hostPath mounts, privileged mode, and devices
        unless a documented, reviewed requirement justifies them.
      </p>
      <p>
        Apply CPU, memory, process-count, and ephemeral-storage limits. These do not eliminate denial of
        service, but they constrain how much of a shared node a malfunctioning or compromised workload can
        consume. Use health checks and graceful termination correctly; a liveness probe that restarts a slow
        dependency can amplify an outage. Separate workloads with different trust levels and avoid colocating
        untrusted build code with production credentials.
      </p>

      <h2>4. Kubernetes pod security and namespace access</h2>
      <p>
        Kubernetes Pod Security Standards define Baseline and Restricted profiles. Restricted is a useful
        hardening target for ordinary workloads, but real workloads may need documented exceptions. Set
        security context at the pod and container level, validate admission policies, and test the deployed
        manifest after templating. A hardened template does not prove the live pod has the same settings if a
        chart, mutating admission webhook, or deployment overlay changes it.
      </p>
      <CodeBlock label="Example pod settings: non-root, read-only root filesystem, dropped capabilities">{restrictedPod}</CodeBlock>
      <p>
        This pod mounts a small scratch volume because a read-only root filesystem prevents writes elsewhere.
        The sample disables automatic service-account-token mounting because the worker does not call the
        Kubernetes API. If an application does need API access, use a dedicated service account and grant only
        the specific verbs and resources required. A service account token is a credential: protect its
        audience, lifetime, filesystem permissions, and exposure to logs and child processes.
      </p>
      <p>
        Keep Kubernetes permissions narrow and namespace-scoped where possible. The following example allows
        the worker to read ConfigMaps in one namespace. It grants no access to Secrets, pod creation, exec,
        impersonation, or cluster-wide resources. Even “get” can disclose configuration, so review the actual
        contents and owners of the ConfigMaps before granting this role.
      </p>
      <CodeBlock label="Example RBAC: read ConfigMaps only in the training namespace">{namespaceReadRole}</CodeBlock>
      <p>
        Wildcard RBAC rules are especially fragile because a future custom resource type can inherit the
        wildcard. Permissions that create pods, bind roles, impersonate identities, or update admission and
        webhook configuration can create indirect privilege paths. Review both the verbs and the resources,
        then periodically inspect bindings, default service accounts, and privileged workloads.
      </p>

      <h2>5. Network boundaries and secret delivery</h2>
      <p>
        Kubernetes networking is highly configurable. Do not assume that pods are isolated from one another:
        many clusters allow pod-to-pod communication unless network policy and a compatible network plugin
        enforce restrictions. Define which services need to communicate, apply default-deny ingress and
        egress where practical, and add explicit allow rules for required flows. Include DNS, identity, logging,
        and dependency endpoints in the design so a restrictive policy does not silently break operations.
      </p>
      <p>
        A Kubernetes Secret value is commonly base64-encoded in its API representation. Base64 is an encoding,
        not encryption. Protect secrets with least-privilege RBAC, encryption at rest for the cluster's
        datastore, restricted backups, and secure delivery to the process. Avoid exposing values in manifests,
        command arguments, build logs, environment dumps, crash reports, or support bundles. Environment
        variables are convenient but can be exposed through process inspection or diagnostics; mounted
        files with narrow permissions or a supported external secret integration may fit some workloads
        better.
      </p>
      <p>
        Secret managers reduce the need to commit static values, but they introduce an identity and retrieval
        path. Give each workload access only to its own secret, rotate it when exposure is suspected, audit
        reads, and verify that the CI pipeline does not print it. Do not put secret material in a container
        build argument, because it can persist in build metadata or layers. Use the build system's secret
        mount mechanism and ensure the secret is needed only during the build step.
      </p>

      <h2>6. Terraform state, plans, and secret lifecycle</h2>
      <p>
        Terraform state maps configuration addresses to real infrastructure objects and stores attributes
        needed to calculate later changes. A password marked <code>sensitive = true</code> is redacted in many
        CLI displays, but that label alone does not guarantee the value is absent from state or saved plan
        files. Protect local state, backups, remote state, plan artifacts, CI logs, and any cache that might
        hold them. Never commit <code>terraform.tfstate</code>, its backups, saved plans, or sensitive
        variable files.
      </p>
      <p>
        For team workflows, use a remote backend with access control, encryption, versioning or recovery,
        and state locking where supported. Current Terraform S3 backend guidance supports S3-based locking
        with <code>use_lockfile</code>; the older DynamoDB locking argument is deprecated. Backend
        configuration should not embed long-lived credentials. Supply credentials through the execution
        identity, such as a managed role or workload federation, and restrict who can read and write production
        state. A lock prevents conflicting state updates; it does not encrypt state or grant safe access by
        itself.
      </p>
      <CodeBlock label="Example remote backend: encryption and current S3 state locking">{terraformBackend}</CodeBlock>
      <p>
        A remote backend can still contain sensitive values. Use the provider's current backend documentation
        to configure encryption and access controls, enable versioning or equivalent recovery, and protect
        lock files as well as state objects. Terraform's <code>sensitive</code> marker helps reduce accidental
        display; where a provider supports ephemeral values or write-only resource arguments, those features
        can avoid persisting some secrets, but verify their behavior for the exact resource and tool version.
        If a secret enters state, treat the state as sensitive and rotate the secret if exposure is plausible.
      </p>
      <p>
        A pull-request review should inspect the plan as carefully as the source. Plans can reveal values,
        resource identifiers, network changes, and access grants. Limit plan-artifact access, choose a short
        retention period, avoid publishing it to untrusted build logs, and require an authorized approver for
        production changes. Do not use <code>terraform_remote_state</code> as a general secret-sharing
        mechanism: access to state can expose more than the outputs a configuration appears to consume.
      </p>

      <h2>7. Secure the image and IaC supply chain</h2>
      <p>
        Supply-chain review asks more than “does the image have a known CVE?” Track the source commit,
        dependency lockfiles, builder identity, base-image digest, generated image digest, SBOM, policy results,
        approval, and deployment. An SBOM is an inventory of components; it helps investigate exposure when a
        dependency issue is announced, but it does not prove that every component is exploitable or patched.
        Provenance and signed artifacts help establish where an image came from and whether it changed after
        the build; they do not certify that the source code is safe.
      </p>
      <p>
        Trivy can inspect local images, filesystems, and configuration for vulnerabilities, secrets, and
        supported misconfigurations. Checkov evaluates infrastructure configuration against checks and
        policy-as-code rules. Results depend on enabled scanners, rule versions, input format, and configuration.
        Build a policy that distinguishes blocking risk from advisory findings, document justified exceptions,
        pin the tool and ruleset versions in CI, and review false positives and missed categories. A green scan
        means only that the configured checks found no blocking issue in the supplied artifact.
      </p>
      <CodeBlock label="Local image and IaC checks with an SBOM artifact">{localPipelineChecks}</CodeBlock>
      <p>
        These commands analyze local training or release artifacts; they do not search the public internet or
        exploit deployed services. In a release job, scan the exact immutable image digest that will be
        deployed and retain the report alongside that digest.
        For a release pipeline, store the SBOM and scan result alongside the exact image digest, make the
        report reviewable, and define how critical findings are triaged without silently suppressing them.
      </p>

      <h2>8. A practical container and IaC review</h2>
      <p>
        Review a deployment as a chain of trust: source and dependencies create an image; a build identity
        publishes it; a deployment identity schedules it; a pod receives runtime permissions and secrets; and
        network policy determines which services it can reach. A problem in any link can invalidate controls
        in another. For instance, a non-root container can still use a powerful cloud role, and a signed image
        can still contain an unsafe configuration that was faithfully signed.
      </p>
      <CodeBlock label="Evidence sequence for a synthetic deployment review">{reviewSequence}</CodeBlock>
      <p>
        For each concern, preserve the source file and line, image digest, deployment revision, relevant
        admission decision, role or service-account binding, and audit event identifier. Separate direct
        observation from inference. State what the evidence proves, what it does not prove, and which owner
        must confirm whether the access is needed. Never reproduce customer secrets in a report; identify the
        secret by a safe reference and document the rotation decision.
      </p>

      <Callout variant="warn">
        <p>
          Run image scans against artifacts you own or are authorized to assess. Do not expose Docker daemon
          APIs, mount the host daemon socket into untrusted workloads, list cluster secrets, or deploy
          intentionally vulnerable manifests into a shared or production environment. Use a disposable local
          cluster or the platform's isolated lab environment, and verify cleanup before closing the exercise.
        </p>
      </Callout>

      <h2>Knowledge check</h2>
      <ol>
        <li>Why does access to a Docker daemon socket represent control-plane authority rather than ordinary
          container access?</li>
        <li>What security difference does a digest provide over a mutable image tag, and what does it still
          fail to prove?</li>
        <li>Why use a non-root UID, drop Linux capabilities, and set <code>allowPrivilegeEscalation</code> to
          false as separate controls?</li>
        <li>When does a workload need a Kubernetes service-account token, and how can unnecessary automatic
          mounting be disabled?</li>
        <li>Why is base64-encoded Kubernetes Secret data not confidential?</li>
        <li>What can Terraform's <code>sensitive</code> marker hide, and what files may still retain the value?</li>
        <li>What does an SBOM help an incident responder answer, and what can it not establish on its own?</li>
        <li>Why should a security scanner finding be verified against the exact artifact and runtime context?</li>
      </ol>

      <h2>References</h2>
      <ul>
        <li><a href="https://docs.docker.com/engine/security/protect-access/" target="_blank" rel="noreferrer">Docker: protect access to the daemon socket</a></li>
        <li><a href="https://docs.docker.com/engine/security/" target="_blank" rel="noreferrer">Docker Engine security</a></li>
        <li><a href="https://kubernetes.io/docs/concepts/security/pod-security-standards/" target="_blank" rel="noreferrer">Kubernetes Pod Security Standards</a></li>
        <li><a href="https://kubernetes.io/docs/concepts/security/rbac-good-practices/" target="_blank" rel="noreferrer">Kubernetes RBAC good practices</a></li>
        <li><a href="https://kubernetes.io/docs/concepts/security/secrets-good-practices/" target="_blank" rel="noreferrer">Kubernetes Secret good practices</a></li>
        <li><a href="https://developer.hashicorp.com/terraform/language/state" target="_blank" rel="noreferrer">Terraform state and sensitive data</a></li>
        <li><a href="https://developer.hashicorp.com/terraform/language/backend/s3" target="_blank" rel="noreferrer">Terraform S3 backend and state locking</a></li>
        <li><a href="https://developer.hashicorp.com/terraform/language/style" target="_blank" rel="noreferrer">Terraform style and files not to commit</a></li>
        <li><a href="https://trivy.dev/docs/latest/guide/scanner/misconfiguration/" target="_blank" rel="noreferrer">Trivy configuration scanning</a></li>
        <li><a href="https://trivy.dev/docs/latest/guide/supply-chain/sbom/" target="_blank" rel="noreferrer">Trivy SBOM generation and scanning</a></li>
      </ul>
    </article>
  );
}
