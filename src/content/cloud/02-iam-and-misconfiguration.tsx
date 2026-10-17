import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

const scopedS3Read = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadOnlyReportsPrefix",
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::dw-training-reports/quarterly/*"
    },
    {
      "Sid": "ListOnlyReportsPrefix",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::dw-training-reports",
      "Condition": {
        "StringLike": {
          "s3:prefix": ["quarterly", "quarterly/*"]
        }
      }
    }
  ]
}`;

const githubOidcTrust = `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::111122223333:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:darkworld-labs/reporting-app:ref:refs/heads/main"
      }
    }
  }]
}`;

const accessReview = `Principal: reporting-worker (workload identity)
Purpose: generate quarterly customer reports
Observed request: GetObject from dw-training-reports/quarterly/2026-Q3.csv
Policy finding: s3:GetObject on Resource "*"; also has iam:PassRole
Recent use: S3 read observed; no approved deployment workflow uses PassRole
Trust: any repository in the training GitHub organization can request a session
Decision: narrow object read to the reports prefix; remove unused PassRole after owner review;
          bind federation to the exact repository and protected main branch; validate in staging
Evidence to preserve: policy version, role ID, CloudTrail event IDs, owner approval, test result`;

const cloudPolicyChecks = `# Read the identity currently used by this shell; does not change cloud resources.
aws sts get-caller-identity

# Validate a local JSON policy for AWS policy errors and security warnings.
aws accessanalyzer validate-policy \
  --policy-type IDENTITY_POLICY \
  --policy-document file://report-reader-policy.json

# Inspect Azure role assignments at a specific resource scope (read-only query).
az role assignment list \
  --assignee analyst@example.invalid \
  --scope /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/lab-rg \
  --include-inherited --all --output table

# Read the IAM policy attached to a Google Cloud project (replace with a lab project ID).
gcloud projects get-iam-policy darkworld-training-project --format=json`;

export default function IamAndMisconfiguration() {
  return (
    <article className="prose-hh">
      <h1>Cloud IAM: identities, policy evaluation, and misconfiguration review</h1>
      <p>
        Identity and Access Management (IAM) answers four practical questions: <em>which principal</em> is
        making a request, <em>what action</em> is requested, <em>which resource</em> is involved, and <em>under
        what conditions</em> should the request succeed? A principal can be a person, a workload, a managed
        service, or a federated identity. A cloud identity mistake can expose data or let a compromised
        workload change infrastructure, so security reviews must understand the full permission path rather
        than count policy statements or trust a scanner's severity label.
      </p>

      <h2>Prerequisites: principal, authentication, authorization, and scope</h2>
      <p>
        A <strong>principal</strong> is the identity named in an access decision. <strong>Authentication</strong>
        establishes which principal is calling. <strong>Authorization</strong> evaluates whether that principal
        may perform a requested action on a resource. These are separate checks: a valid human sign-in does not
        automatically authorize reading a storage object, and a service identity does not inherit the
        permissions of the developer who deployed it.
      </p>
      <p>
        A <strong>role</strong> is a collection of permissions that can be assigned or assumed by principals.
        Provider terminology differs: an AWS IAM role is commonly assumed to obtain temporary credentials;
        an Azure role definition is assigned to a principal at a scope; Google Cloud grants roles to principals
        through an IAM policy. When a lesson says “role,” identify which provider object it means. A
        <strong>resource</strong> is the object being accessed, such as a bucket, database, project, key, or
        virtual machine. The <strong>scope</strong> determines the set of resources affected by a grant.
      </p>
      <p>
        A <strong>policy</strong> is a machine-readable access rule. Many policies contain a principal, action,
        resource, and conditions, but the policy types and evaluation rules are provider-specific. A policy
        that looks narrow in isolation may still combine with a resource policy, group membership, inherited
        assignment, federation rule, or organization-level constraint to permit more access than expected.
      </p>

      <h2>1. The identity lifecycle: people and workloads</h2>
      <p>
        Human access should normally come through a centralized identity provider and single sign-on. Use
        individual identities rather than shared administrator accounts, require strong MFA for privileged
        work, grant administrative access just in time where the provider supports it, and remove access when
        employment or responsibility ends. A shared account makes it difficult to tell who performed an action
        and makes revocation risky because several people may depend on the same credentials.
      </p>
      <p>
        Applications also need identities. A virtual machine, container, CI job, serverless function, or
        automation process should use a dedicated <strong>workload identity</strong>. Long-lived access keys
        copied into source code or stored in environment configuration create an enduring secret that can be
        copied, forgotten, and reused. Prefer provider-managed identity or federation that exchanges a short-lived
        identity assertion for temporary credentials. Restrict which repository, branch, environment, cluster,
        or workload can request the identity, and scope its permissions to the resources it actually needs.
      </p>
      <p>
        Temporary credentials reduce the time a copied token remains useful, but they do not make an overpowered
        role safe. An attacker who can execute code inside a workload may be able to use that workload's current
        identity. Limiting the role, isolating the runtime, protecting the token endpoint, and monitoring its
        actions remain necessary.
      </p>

      <h2>2. How an access decision is composed</h2>
      <p>
        Begin with the request context: principal, action, resource, source identity, session attributes,
        network or device conditions, and time. Then identify every applicable grant and restriction. In AWS,
        requests are implicitly denied unless applicable policy evaluation allows them, and an explicit deny
        overrides an allow. Identity policies, resource policies, permissions boundaries, session policies,
        organization service control policies (SCPs), resource control policies (RCPs), and service-specific
        key policies can interact. The exact result depends on which principal and resource are involved; do
        not reduce every AWS request to a simple “intersection of all JSON files.”
      </p>
      <p>
        Azure role assignments combine a <strong>principal</strong>, a <strong>role definition</strong>, and a
        <strong> scope</strong>. A grant at a parent scope can flow to child resources, so a resource-group or
        subscription assignment may be broader than the resource that prompted it. Google Cloud similarly
        combines inherited policies with resource-level bindings and organization policy constraints. In all
        three providers, group nesting, federation, service-specific permissions, and inherited controls make
        the effective result larger than the direct assignment shown on a single screen.
      </p>
      <table>
        <thead>
          <tr><th>Review question</th><th>What to trace</th><th>Why it matters</th></tr>
        </thead>
        <tbody>
          <tr><td>Who can obtain this identity?</td><td>Role trust, federation subject and audience, group membership, managed-identity attachment</td><td>A narrow permission policy is still risky if untrusted callers can assume the identity.</td></tr>
          <tr><td>What can it do?</td><td>Actions, data actions, wildcards, conditions, inherited grants, service-specific policy</td><td>Control-plane actions can create or delegate access even when direct data reads are absent.</td></tr>
          <tr><td>Where does the grant apply?</td><td>Resource ARN, Azure scope, project/folder/organization inheritance, resource policy</td><td>A grant at a broad parent can reach resources the owner did not intend to include.</td></tr>
          <tr><td>What limits it?</td><td>Explicit deny, boundary, session policy, SCP/RCP, organization policy, conditional access</td><td>Restrictions may block access—or change the result in provider-specific ways.</td></tr>
          <tr><td>Is the permission needed now?</td><td>Observed access, owner, purpose, expiration, last-used evidence</td><td>Unused grants accumulate and enlarge the blast radius of a later compromise.</td></tr>
        </tbody>
      </table>

      <h2>3. Least privilege is a specific permission design</h2>
      <p>
        “Least privilege” is not synonymous with “read-only.” A read permission can expose regulated records,
        credentials, backups, or private source code. A permission that creates a role, attaches a policy,
        changes a trust relationship, or passes a role to a service may be more consequential than its name
        suggests. Review permissions by their actual effect, the data involved, and the identities that can
        invoke them.
      </p>
      <p>
        A sound scope starts from a concrete task. For example, a reporting worker may need to list one bucket
        prefix and read quarterly report objects. It probably does not need to delete objects, change bucket
        policy, create access keys, or pass another role. The following is an illustrative identity policy for
        a fictional training bucket; adapt and validate policies in a disposable account before deployment.
      </p>
      <CodeBlock label="AWS example: read only one reports prefix">{scopedS3Read}</CodeBlock>
      <p>
        S3 distinguishes bucket-level actions such as <code>s3:ListBucket</code> from object-level actions such
        as <code>s3:GetObject</code>, which is why the example uses separate resource ARNs. The prefix condition
        constrains listing, while the object ARN constrains reads. This example is not a universal drop-in
        policy: validate required actions for the actual application, account for encryption-key access if
        needed, and ensure no broader policy separately grants access.
      </p>
      <p>
        Prefer narrow actions, resources, and conditions. Where supported, bind permissions to tags, source
        identity, encryption state, network path, or an approved deployment context. Conditions are powerful
        but subtle: a missing key, unexpected service call, or incorrectly chosen operator can cause either an
        outage or an unintended grant. Test both the expected request and requests that should be denied.
      </p>

      <h2>4. Trust policies and federation: who may become a role?</h2>
      <p>
        A permissions policy answers what an identity may do after it has a session. A trust policy answers
        who may obtain that session. These are different questions and must be reviewed separately. A role can
        have limited permissions but still be exposed to an unintended caller; conversely, a narrowly trusted
        role can still have excessive permissions after assumption.
      </p>
      <p>
        In CI/CD, workload federation can replace static cloud secrets. The build system presents a signed
        identity token, and the cloud provider checks its issuer, audience, subject, and other claims before
        granting a temporary session. The subject should identify the intended repository and protected
        branch or environment, rather than accepting every repository from an organization. The fictional AWS
        trust policy below illustrates exact-claim matching; it grants no data permissions by itself.
      </p>
      <CodeBlock label="AWS example: trust one CI repository and protected branch">{githubOidcTrust}</CodeBlock>
      <p>
        Review federation changes as code. A wildcard subject, broad pool membership, permissive attribute
        mapping, or unreviewed workflow trigger can let a different workload impersonate the role. Protect the
        source repository, require review for workflow changes, limit which environments can request
        production identity, and monitor role sessions with a source identity that helps tie cloud events back
        to the workflow run.
      </p>

      <h2>5. Common cloud IAM failure patterns</h2>
      <ul>
        <li><strong>Wildcard permissions:</strong> <code>Action: "*"</code> or <code>Resource: "*"</code>
          often hides a grant that grew over time. Some APIs legitimately require a wildcard resource; document
          the service behavior and add supported conditions instead of assuming every wildcard is exploitable.</li>
        <li><strong>Privilege delegation:</strong> permission to create policies, attach roles, change trust,
          impersonate a service account, or pass an identity can indirectly grant access to other services.
          Trace the delegation chain and identify what the resulting identity can do.</li>
        <li><strong>Public or unintended resource policies:</strong> object-store policies, key policies,
          snapshots, image registries, database shares, and cross-account grants may authorize access outside
          the expected identity policy. Confirm the principal and condition, and determine whether exposure is
          actually reachable.</li>
        <li><strong>Overbroad trust:</strong> accepting an entire account, organization, identity pool, or
          external repository when only one workload is intended creates an identity-substitution path.</li>
        <li><strong>Static credentials:</strong> keys in a repository, build logs, container image, state file,
          or ticket are incidents. Deleting the visible copy is insufficient because history and caches may
          retain it. Revoke or rotate the key, find where it was used, and use history rewriting only as a
          coordinated cleanup after containment.</li>
        <li><strong>Stale access:</strong> departed staff, old service principals, unused keys, forgotten
          emergency accounts, and test roles persist after their owners or applications disappear.</li>
        <li><strong>Confused deputy:</strong> a trusted cloud service may be induced to use its own authority
          for an unintended caller. Restrict service trust with source account, source ARN, audience, or
          equivalent conditions when the provider and workflow support them.</li>
        <li><strong>Broken separation of duties:</strong> one identity can author, approve, and deploy a
          sensitive change. Separate routine use from administration and require independent approval for
          high-impact role or trust-policy changes.</li>
      </ul>

      <h2>6. Workload identity in containers and managed services</h2>
      <p>
        A Kubernetes service account is an identity inside a cluster; it is not automatically the same thing
        as a cloud IAM principal. Kubernetes RBAC controls actions against the Kubernetes API. Cloud IAM
        controls requests to provider services. A pod may be subject to both systems, and a compromise can
        cross the boundary if the pod can obtain a powerful cloud identity or reach a node credential source.
      </p>
      <p>
        A Kubernetes <strong>Role</strong> grants API verbs on resources in one namespace; a
        <strong> RoleBinding</strong> attaches that grant within the namespace. A <strong>ClusterRole</strong>
        can describe cluster-wide permissions or reusable permissions, while a <strong>ClusterRoleBinding</strong>
        grants those permissions across the cluster. A pod usually needs only a narrow set of API access, and
        many workloads need no Kubernetes API token at all. Disable automatic token mounting where it is not
        needed, scope RBAC, use admission controls, and audit which workloads can read Secrets or create pods.
      </p>
      <p>
        Modern clusters can federate Kubernetes workload identity to cloud IAM: AWS EKS supports IAM Roles for
        Service Accounts and EKS Pod Identity; Google Kubernetes Engine supports Workload Identity Federation
        for GKE; Azure Kubernetes Service supports Microsoft Entra Workload ID. Exact setup differs by provider
        and version. The security pattern is consistent: one identity per workload, a narrow trust condition,
        short-lived credentials, and only required actions. Do not assume node metadata is unreachable or that
        an identity is isolated merely because it is attached to a pod—verify network and provider settings.
      </p>
      <p>
        Kubernetes Secret objects are not automatically a secure secret vault. Their values are represented
        using base64 encoding, which is reversible; confidentiality depends on API authorization, encryption at
        rest, cluster configuration, backup protection, and who can read or mount the Secret. Avoid printing
        secret material in logs, events, manifests, and support bundles. Integrate a dedicated secret service
        where appropriate and review synchronization permissions as carefully as the source secret.
      </p>

      <h2>7. Read-only access review workflow</h2>
      <ol>
        <li><strong>Establish scope.</strong> Record the training or production account, subscription, project,
          environment, time window, approving owner, and the exact read-only actions authorized.</li>
        <li><strong>Identify the principal.</strong> Resolve its immutable ID, owner, purpose, source identity,
          credential type, and trust path. Display names alone can be reused or misleading.</li>
        <li><strong>Build the effective-access path.</strong> Include direct and inherited grants, group
          membership, resource policies, conditions, organization controls, and service-specific permissions.</li>
        <li><strong>Compare grant to observed use.</strong> Look at provider audit logs and last-accessed data
          over a representative period. Absence of an event is not proof that a permission is unnecessary if
          the workflow is seasonal or disaster-recovery-only.</li>
        <li><strong>Assess impact and business need.</strong> Identify sensitive resources, privilege-changing
          actions, cross-account trust, public exposure, and the service owner who can confirm intended access.</li>
        <li><strong>Propose a minimal change.</strong> Remove unnecessary actions or narrow resource/scope and
          trust. Create a rollback plan and test both allowed and denied requests in a staging environment.</li>
        <li><strong>Verify and preserve evidence.</strong> Record policy version, findings, owner approval,
          validation results, change reference, and post-change audit events. Revisit the grant after rollout.</li>
      </ol>
      <CodeBlock label="Safe provider commands: identify the session and inspect assignments">{cloudPolicyChecks}</CodeBlock>
      <p>
        These commands read the current identity or policy. They do not prove complete effective access by
        themselves: the caller's permissions can hide assignments, and provider policies may be inherited or
        service-specific. Use a dedicated read-only audit role and correlate outputs with the provider's
        policy simulator, access analyzer, organization policies, and audit history. Never paste returned
        credentials, tokens, principal email addresses, or customer resource names into public notes.
      </p>

      <h2>8. What cloud auditing tools can and cannot tell you</h2>
      <p>
        Native tools answer different questions. AWS IAM Access Analyzer can identify external, internal, and
        unused access findings and validate policy documents. AWS policy simulation can help evaluate a
        proposed request against the policies it is able to see. Azure role-assignment review and Microsoft
        Defender for Cloud surface identity and posture findings; Entra Privileged Identity Management can
        provide time-bound privileged activation. Google Cloud IAM Recommender can suggest role reductions
        from observed use, and Cloud Asset Inventory can help locate policy bindings across a scope. These
        features depend on configuration, permissions, data coverage, and service support.
      </p>
      <p>
        Cross-cloud posture tools such as Prowler or ScoutSuite can collect configuration evidence and flag
        control failures; tool behavior and provider support change, so check the project's current release
        documentation before using it. A scanner may need broad read privileges to inspect an environment,
        can incur API cost or rate limits, and can miss business context. It does not prove that a finding is
        exploitable, that a permission is unused forever, or that an account is secure when all checks pass.
        Treat its report as triage evidence, verify the underlying policy, and let the resource owner assess
        business intent.
      </p>

      <h2>Worked access review: quarterly reporting worker</h2>
      <p>
        A fictional reporting service needs to create quarterly files. The inventory says it reads a single
        report prefix, but its current identity policy grants object reads across every bucket and includes a
        role-passing action. Its federation trust accepts tokens from any repository in the organization.
        Cloud audit records show the expected report read and no observed use of the delegation action during
        the review window. The analyst does not conclude that the action is certainly unnecessary: they ask
        the owner whether a documented deployment path requires it, and account for quarter-end activity not
        represented in the log window.
      </p>
      <CodeBlock label="Example review record using synthetic evidence">{accessReview}</CodeBlock>
      <p>
        A safe remediation proposal is to scope the data read to the expected prefix, remove the delegation
        permission if the service owner confirms it is not required, bind federation to the intended repository
        and protected release path, then validate the change in staging. The reviewer records who approved the
        change and the audit event that confirms the new workload session. If the job fails, restore the
        reviewed prior policy while investigating; do not temporarily grant administrator access as a shortcut.
      </p>

      <Callout variant="warn">
        <p>
          Cloud policy changes can expose sensitive data, interrupt workloads, or grant control over an entire
          account. Practice only in a designated lab tenant or an account for which you have written
          authorization. The examples here are review and validation examples; they do not authorize active
          probing, credential theft, public-target scanning, or deployment of intentionally vulnerable cloud
          resources into a shared account.
        </p>
      </Callout>

      <h2>Knowledge check</h2>
      <ol>
        <li>How does a trust policy differ from a permissions policy?</li>
        <li>Why can a narrowly scoped role still be unsafe if its federation trust accepts too many callers?</li>
        <li>In the S3 example, why are <code>s3:ListBucket</code> and <code>s3:GetObject</code> scoped to
          different ARN forms?</li>
        <li>What does an explicit deny do in AWS policy evaluation, and why should you still consider
          resource-based policy behavior?</li>
        <li>How do a Kubernetes RoleBinding and a cloud workload identity grant control different APIs?</li>
        <li>Why is “no recent use” useful evidence but not sufficient by itself to remove a permission?</li>
        <li>What must an analyst confirm before calling a public-access finding an actual data exposure?</li>
      </ol>

      <h2>References</h2>
      <ul>
        <li><a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html" target="_blank" rel="noreferrer">AWS IAM policy evaluation logic</a></li>
        <li><a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-findings.html" target="_blank" rel="noreferrer">AWS IAM Access Analyzer findings</a></li>
        <li><a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-checks-validating-policies.html" target="_blank" rel="noreferrer">AWS policy validation checks</a></li>
        <li><a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html" target="_blank" rel="noreferrer">AWS IAM OIDC identity providers</a></li>
        <li><a href="https://learn.microsoft.com/azure/role-based-access-control/role-assignments" target="_blank" rel="noreferrer">Microsoft Azure role assignments and scope</a></li>
        <li><a href="https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview" target="_blank" rel="noreferrer">Microsoft Entra managed identities overview</a></li>
        <li><a href="https://cloud.google.com/iam/docs/overview" target="_blank" rel="noreferrer">Google Cloud IAM overview</a></li>
        <li><a href="https://cloud.google.com/iam/docs/best-practices-for-using-workload-identity-federation" target="_blank" rel="noreferrer">Google Cloud workload identity federation best practices</a></li>
        <li><a href="https://kubernetes.io/docs/reference/access-authn-authz/rbac/" target="_blank" rel="noreferrer">Kubernetes RBAC reference</a></li>
        <li><a href="https://kubernetes.io/docs/concepts/security/secrets-good-practices/" target="_blank" rel="noreferrer">Kubernetes Secret good practices</a></li>
        <li><a href="https://github.com/prowler-cloud/prowler" target="_blank" rel="noreferrer">Prowler project and current provider support</a></li>
        <li><a href="https://github.com/nccgroup/ScoutSuite" target="_blank" rel="noreferrer">ScoutSuite project documentation</a></li>
      </ul>
    </article>
  );
}
