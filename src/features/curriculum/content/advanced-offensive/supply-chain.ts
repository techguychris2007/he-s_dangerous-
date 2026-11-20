import type { AdvancedLesson } from './LessonArticle';

const sources = [
  { title: 'SLSA — supply chain security specification', url: 'https://slsa.dev/spec/v1.2/' },
  { title: 'GitHub — secure use of Actions', url: 'https://docs.github.com/en/actions/reference/security/secure-use' },
  { title: 'GitHub — script injection boundaries', url: 'https://docs.github.com/en/actions/concepts/security/script-injections' },
];

export const supplyChainLessons: AdvancedLesson[] = [
  {
    id: 'adv-delivery-1', slug: 'source-build-deploy-trust', title: 'Source, Build and Deployment Trust Boundaries',
    summary: 'Follow who can change source, run a build, publish an artifact and deploy it.',
    prerequisite: 'Cloud IAM, source control fundamentals and service-identity delegation.',
    outcomes: ['Map the identities and inputs at each delivery stage.', 'Separate source review from build integrity and deployment authority.', 'Choose a synthetic artifact proof with minimal operational impact.'],
    introduction: 'Software delivery turns text into running authority. A contributor, build worker, artifact publisher and deployer may all have different permissions. The assessment question is which low-trust change can influence which privileged stage, not whether the team uses a particular CI product.',
    sections: [
      { title: 'Map delivery as a series of decisions', paragraphs: [
        'Identify the repository, change review, workflow definition, build inputs, dependency sources, runner identity, artifact store and deployment policy. At each transition ask who can select the next input and who authorizes the action. A protected branch does not prove that the deployed artifact came from that branch; a signed artifact does not prove that its signer used an approved source revision.',
        'Separate the execution identity from the initiator. A read-only contributor can supply input to a runner holding a publication credential. A deployment service may accept an artifact selected by an unprivileged caller. Record these as potential authority transfers, then establish the necessary preconditions using approved fixtures. Avoid changing a production workflow solely to demonstrate a risk that can be shown with an isolated runner.',
      ] },
      { title: 'Inventory exposed delivery material', paragraphs: [
        'Published packages and release directories can accidentally include internal manifests, environment snapshots or credentials. Compare the intended distribution set with the actual package contents. Internal filenames alone are not a finding; explain the confidentiality or authority they expose. A synthetic internal manifest can establish a release-boundary failure without exporting a valid production secret.',
        'Exposure and compromise are distinct. A deployment manifest may describe an internal host without granting access. A credential may be expired or scoped to a harmless resource. Validate only what the client authorizes, then record the remaining uncertainty. Where rotation is necessary, coordinate with the delivery owner to avoid breaking dependent services.',
      ], code: '# Forge campaign: public artifact distribution boundary\nnmap -sV 10.77.5.10\nftp 10.77.5.10\nftp-get 10.77.5.10 deployment-manifest.txt\n# The file is synthetic; it establishes internal artifact disclosure.\n# The review account is separately provided by the client.', codeLabel: 'Supported delivery-artifact assessment' },
      { title: 'Use an invariant that survives tooling changes', paragraphs: [
        'The desired invariant is that untrusted source cannot directly acquire publication or deployment authority. Enforce an explicit promotion boundary, isolate the untrusted build environment and bind approval to the artifact actually deployed. Changing CI vendors does not remove an authority transfer if the same identity and artifact-selection decisions remain.',
      ] },
    ],
    comparison: { columns: ['Stage', 'Who controls input?', 'Authority to review'], rows: [
      ['Source review', 'Contributor and reviewer', 'Merge and workflow changes'],
      ['Build', 'Source plus external materials', 'Runner secrets and output integrity'],
      ['Deploy', 'Artifact selector and approver', 'Production changes and rollback'],
    ] },
    caseStudy: { scenario: 'Forge’s public release store includes a synthetic internal deployment manifest.', analysis: 'The proof establishes an unintended distribution boundary. It does not establish cloud role assumption or a compromised CI worker. The later local review-host privilege test is separately authorized and reported.', decision: 'Fix package inclusion rules, inspect similar artifacts for the same root cause and rotate any real secrets confirmed exposed in a separately scoped investigation.' },
    exercise: 'A protected main branch exists, but production deploys whichever artifact is uploaded most recently. Identify the missing binding.',
    answer: 'Deployment selection is not bound to the reviewed revision and approved build output. An assessment should inspect who can upload or select artifacts and whether the deployment policy validates the expected source revision, builder identity and artifact digest before promotion.',
    mistakes: ['Treating branch protection as proof of deployment integrity.', 'Claiming an internal manifest grants cloud authority without validation.', 'Testing a production runner when an isolated fixture answers the question.'],
    sources, labs: ['campaign-build-artifact'],
    quiz: [{ prompt: 'What does a protected source branch fail to prove on its own?', choices: ['That any source exists', 'That the deployed artifact was built from the approved source under an approved builder', 'That a reviewer can read code', 'That the repository has a name'], correctIndex: 1, explanation: 'Build provenance and deployment selection are additional trust boundaries.' }],
  },
  {
    id: 'adv-delivery-2', slug: 'untrusted-input-and-runner-authority', title: 'Untrusted Inputs and Privileged Runner Authority',
    summary: 'Identify code/data confusion and isolate contributor-controlled work from secrets and publication.',
    prerequisite: 'Shell quoting, source-to-deployment boundaries and confused deputies.',
    outcomes: ['Trace contributor-controlled values into generated commands.', 'Distinguish safe data passing from evaluating untrusted text.', 'Assess runner identity and isolation separately from input handling.'],
    introduction: 'A pipeline can become a privileged interpreter for content supplied by someone with much less authority. The same failure appears in shell command generation, template processing, document conversion and agent tools. The enduring question is when data becomes a command under a more powerful identity.',
    sections: [
      { title: 'Trace input to evaluation', paragraphs: [
        'List externally controlled fields: change titles, branch names, issue text, commit messages, repository content and dependency metadata. Follow each value into a workflow expression, shell script, template or tool argument. If a value is inserted into executable text before interpretation, it may alter program structure instead of remaining data. Examine the actual evaluation order and quoting rules; visually quoted template text can still become executable content after substitution.',
        'Prefer passing values as data to a narrowly designed operation. Even then, check whether the receiving program later evaluates that data, selects dangerous options or expands it into a shell. A safe environment-variable pattern at one layer does not make an explicit eval safe at a later layer. Keep the full interpretation chain visible.',
      ] },
      { title: 'Runner power determines the impact ceiling', paragraphs: [
        'Inventory filesystem persistence, network access, credentials, publication rights and neighboring jobs. An input execution flaw on an isolated secretless runner differs from the same flaw on a shared deployment runner. Compare both identities and reachable resources. Temporary credentials reduce lifetime but do not eliminate impact while they are valid.',
        'For testing, use a dedicated workflow that emits a benign marker or reads a synthetic canary. Do not replace release artifacts or send real credentials to an external collection service. Obtain explicit authorization for any cross-job or runner-persistence experiment, because it changes a boundary beyond a single build task.',
      ], code: 'Conceptual review checklist — not a simulator command sequence\nInput owner: external contributor\nEvaluation: workflow substitution → shell interpretation\nRunner identity: build-only or publication-capable?\nSecrets: absent from untrusted evaluation or available?\nPersistence: fresh worker or reused host?\nProof: benign marker in an isolated, approved workflow', codeLabel: 'Source-to-interpreter review' },
      { title: 'Split evaluation from privileged promotion', paragraphs: [
        'A defensible design evaluates untrusted work without production secrets, produces a constrained output and promotes that output only through an authenticated policy check. Review can approve a specific digest rather than whatever happens to be in a mutable directory later. Restore clean runner state between jobs and restrict the publication identity to its intended repository or environment. These controls address authority even when an input flaw has not yet been eliminated.',
      ] },
    ],
    comparison: { columns: ['Condition', 'Why it matters', 'Test boundary'], rows: [
      ['Generated executable text', 'Data can alter command structure', 'Use a benign marker in an isolated workflow'],
      ['Shared runner', 'Artifacts or authority may survive jobs', 'Requires explicit cross-job authorization'],
      ['Publication credential available', 'Build behavior may become release authority', 'Use synthetic canary and narrow test repository'],
    ] },
    caseStudy: { scenario: 'A proposed fix moves a change title into an environment variable, then a later step uses eval on a string containing that variable.', analysis: 'The first transition now preserves data, but the later evaluation restores the code/data confusion. The impact still depends on runner authority and the resources it can reach.', decision: 'Remove the evaluation step, pass data to a constrained operation and keep untrusted execution separate from release credentials. Retest each evaluation boundary in a disposable workflow.' },
    exercise: 'A secretless container processes untrusted changes but mounts the host container-engine socket. Is “no secrets” sufficient?',
    answer: 'No. The mounted control interface can confer host or neighboring workload authority even without an explicit environment secret. Inventory the socket’s actual capabilities and test only in an isolated approved fixture. The durable repair is to remove the unnecessary host-control capability, not merely scrub environment variables.',
    mistakes: ['Stopping at the first safe quoting layer while ignoring later evaluation.', 'Ignoring network or host-control authority because no password is visible.', 'Proving impact by altering a real release.'],
    sources, labs: ['campaign-build-artifact', 'campaign-fetch-worker'],
    quiz: [{ prompt: 'Why is a secretless runner not automatically low risk?', choices: ['Every runner has infinite authority', 'It may still have publication, host-control or network capabilities', 'Secrets never matter', 'It cannot evaluate input'], correctIndex: 1, explanation: 'Effective authority includes interfaces and permissions beyond stored credentials.' }],
  },
  {
    id: 'adv-delivery-3', slug: 'artifact-integrity-and-provenance', title: 'Artifact Integrity, Provenance and Promotion Policy',
    summary: 'Separate bytes, signer identity, source provenance and release authorization.',
    prerequisite: 'Hashing, signatures and a mapped delivery pipeline.',
    outcomes: ['Explain which property a digest, signature and provenance each establishes.', 'Identify gaps between verification and artifact use.', 'Define negative cases for deployment admission policy.'],
    introduction: 'A cryptographic check answers a precise question. A digest identifies bytes; a signature attributes an assertion to a key; provenance describes how an artifact was produced. None is a universal statement that the software is safe or appropriate to deploy.',
    sections: [
      { title: 'Separate four verification questions', paragraphs: [
        'First ask whether the artifact bytes match the expected digest. Next ask whether an attestation or signature comes from an approved identity. Then inspect whether the stated source, builder and build context satisfy the release policy. Finally ask whether this exact artifact is authorized for this environment. A correctly signed test artifact can still be inappropriate for production, and an authentic builder can faithfully build malicious approved source.',
        'Provenance is useful only if the consumer verifies it against a meaningful policy. Record what is trusted about the builder and how the attestation is tied to the artifact. Merely storing a provenance file beside a binary gives an attacker-controlled publisher two files to replace if no independent verification is enforced.',
      ] },
      { title: 'Test verification and use as one chain', paragraphs: [
        'A policy can verify artifact A but deploy artifact B if a mutable tag, shared path or late fetch changes the selected bytes. Trace the artifact reference from verification to installation. Bind promotion to an immutable identity and confirm the actual consumed digest. Consider rollback and emergency deployment paths, which can bypass the usual gate.',
        'Use controlled artifacts to test an allowed builder, an unapproved builder, a mismatched source revision and modified bytes. These negative cases exercise distinct policy predicates. A single invalid signature test does not tell you whether approved signatures are being checked for intended environment or source. Keep the test repository and deployment fixture isolated from production.',
      ], code: 'Policy model\nartifact.digest == promoted.digest\nattestation.subject == artifact.digest\nbuilder.identity in approved_builders\nsource.revision == reviewed_revision\ndeployment.environment in authorized_targets\n# Each predicate needs an allowed and a denied fixture.', codeLabel: 'Conceptual promotion invariants, not executable lab code' },
      { title: 'Describe what provenance cannot prove', paragraphs: [
        'A trustworthy build history does not prove the absence of vulnerabilities, that every dependency is safe, or that a runtime configuration is correct. Pair provenance checks with review, dependency controls and runtime identity restrictions. A report should identify a missing or bypassed predicate rather than announce that “signing is broken” when the cryptography works but deployment authorization is incomplete.',
      ] },
    ],
    comparison: { columns: ['Mechanism', 'Establishes', 'Does not establish alone'], rows: [
      ['Digest', 'Identity of bytes', 'Who approved them'],
      ['Signature', 'Assertion by a verified signing identity', 'Suitability for this deployment'],
      ['Provenance', 'Asserted production history subject to verification', 'Absence of defects or malicious source'],
    ] },
    caseStudy: { scenario: 'A release gate verifies a signed build but deployment later resolves a mutable “latest” tag.', analysis: 'The verification and consumption refer to potentially different bytes. The signer may be authentic while the verification-to-use binding is missing.', decision: 'Promote the verified digest, verify the consumed artifact identity and test mutable-tag replacement in an approved fixture. Preserve emergency and rollback paths in the assessment scope.' },
    exercise: 'A signed artifact from an approved builder contains a vulnerable dependency. Which claim was satisfied, and which was never established?',
    answer: 'Builder attribution and byte integrity may be satisfied. Safety of the dependency was not established by those checks. The assessment should examine dependency policy and runtime impact separately rather than claim that the valid signature was a cryptographic failure.',
    mistakes: ['Using signature validity as shorthand for software safety.', 'Verifying one artifact and deploying a mutable reference.', 'Collecting provenance that no consumer checks.'],
    sources, labs: ['campaign-build-artifact'],
    quiz: [{ prompt: 'What is the key verification-to-use invariant?', choices: ['The release has a familiar filename', 'The artifact consumed is the exact artifact whose identity and policy were verified', 'The signature is stored in the same directory', 'All source is public'], correctIndex: 1, explanation: 'A mutable reference between verification and use can invalidate the earlier decision.' }],
  },
  {
    id: 'adv-delivery-4', slug: 'workload-boundaries-and-credential-lifecycle', title: 'Workload Boundaries and Delivery Credential Lifecycles',
    summary: 'Assess isolation, egress, least privilege, exposed material and rotation dependencies.',
    prerequisite: 'Containers, cloud roles and identity lifecycle reasoning.',
    outcomes: ['Separate workload isolation from effective host or cloud authority.', 'Build a credential rotation and dependency map.', 'Design controls for a worker that processes untrusted requests.'],
    introduction: 'A workload boundary is defined by enforceable capabilities, not by a label such as container or serverless function. Mounts, control sockets, identities and network routes determine what the workload can actually do. The durable test follows those capabilities and their lifetime.',
    sections: [
      { title: 'Inventory the boundary from the workload outward', paragraphs: [
        'Record the process identity, mounts, writable paths, host interfaces, network destinations and credentials. A container can run as root inside a namespace without host root authority, or it can gain substantial host control through a mounted management interface. Test the relevant boundary rather than equating a prompt with host compromise. Distinguish inside-workload proof from host-level proof.',
        'Network access may expose services that the original caller cannot reach. A fetch worker with private routes becomes a deputy; a build worker with artifact-store write permission can influence releases. Ask which operations are necessary, which are inherited accidentally and which can be removed while keeping the workload useful.',
      ] },
      { title: 'Credential exposure creates a lifecycle problem', paragraphs: [
        'Track a credential from issuance to storage, job delivery, use and retirement. Long-lived material copied into images, logs or package artifacts can outlast the workload that originally needed it. Short-lived credentials narrow duration but still require scoped authority and correct trust policy. A transient worker with an excessive temporary role can cause substantial impact during its valid window.',
        'Remediation needs an inventory of dependent services, rotation order, validation and rollback. Remove the public copy, revoke or rotate the secret, update legitimate consumers and verify the old material no longer works. Preserve logs needed to understand historical use under the agreed evidence policy; scrubbing every trace can erase investigation evidence.',
      ] },
      { title: 'Separate application fixes from workload controls', paragraphs: [
        'Courier’s fetch endpoint needs a correct destination authorization rule. Egress limits and a narrower worker identity reduce the impact of future input mistakes, but they should not substitute for the application’s intended policy. Test both the legitimate preview path and forbidden synthetic internal destinations after a real repair. In the browser campaign, only the follow-on host grant is automatically repaired; describe the fetch-worker controls as recommended real-environment follow-up.',
      ], code: 'Worker review ledger\nCapability: internal HTTP fetch\nRequired: approved public preview destinations\nExcess: internal configuration read for a public caller\nRepair owner: application team + workload platform team\nRetest: public preview works; private synthetic target denied\nLifecycle: rotate any exposed credential; review prior sessions', codeLabel: 'Control ownership and retest planning' },
    ],
    comparison: { columns: ['Boundary', 'Capability to inspect', 'Minimal proof'], rows: [
      ['Workload → host', 'Mounts and host control interfaces', 'Approved host canary in a disposable fixture'],
      ['Worker → network', 'Routes and egress rules', 'Synthetic internal endpoint response'],
      ['Job → publication', 'Artifact write and deploy identities', 'Controlled test repository or artifact'],
    ] },
    caseStudy: { scenario: 'Courier rotates a worker credential but leaves the preview route able to reach internal configuration.', analysis: 'The old credential may be revoked, but the deputy can disclose replacement configuration through the same route. Rotation addressed acquired material without fixing the disclosure path.', decision: 'Repair destination authorization, constrain worker reachability and authority, rotate exposed material, then retest allowed previews and denied internal reads independently.' },
    exercise: 'A container runs as root with no host mounts but has a production deployment role. What impact claim should a test pursue first?',
    answer: 'Assess the role’s permitted deployment operations against an approved synthetic resource, not host root. The effective risk is cloud or publication authority. The root identity inside the workload does not alone establish a host boundary break.',
    mistakes: ['Calling container root host root without a host-level proof.', 'Rotating secrets while leaving the disclosure path intact.', 'Treating temporary credentials as harmless regardless of permissions.'],
    sources, labs: ['campaign-fetch-worker', 'campaign-build-artifact'],
    quiz: [{ prompt: 'Why can secret rotation alone fail to close a disclosure issue?', choices: ['Passwords cannot be changed', 'The original path may disclose the replacement secret again', 'Every exposed file grants host root', 'Rotation always removes application bugs'], correctIndex: 1, explanation: 'The disclosure boundary and the validity of acquired credentials are separate controls.' }],
  },
];
