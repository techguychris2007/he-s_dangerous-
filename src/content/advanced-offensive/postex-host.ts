import type { AdvancedLesson } from './LessonArticle';

const sources = [
  { title: 'Linux credentials — real and effective identity', url: 'https://www.man7.org/linux/man-pages/man7/credentials.7.html' },
  { title: 'Linux capabilities — process privilege model', url: 'https://www.man7.org/linux/man-pages/man7/capabilities.7.html' },
  { title: 'MITRE ATT&CK — privilege escalation', url: 'https://attack.mitre.org/tactics/TA0004/' },
  { title: 'NIST SP 800-115 — assessment planning and analysis', url: 'https://csrc.nist.gov/pubs/sp/800/115/final' },
];

export const postexHostLessons: AdvancedLesson[] = [
  {
    id: 'post-host-1', slug: 'foothold-triage', title: 'Foothold Triage: Identity, Environment and Authorized Objectives',
    summary: 'Establish what a session can actually do before selecting a post-access test.',
    prerequisite: 'Linux navigation, process permissions and an authorized supplied test account.',
    outcomes: ['Build a minimal session baseline.', 'Separate a foothold from administrator authority.', 'Choose a bounded next test instead of indiscriminate collection.'],
    introduction: 'Post-exploitation begins when a session exists, not when the assessment is complete. The first useful questions are which identity is active, what boundary has already been crossed and which objective remains authorized. A foothold is a measured capability, not permission to explore everything reachable.',
    sections: [
      { title: 'Establish a session baseline', paragraphs: [
        'Record the host, user, effective privilege, working directory and how the session was obtained. A supplied support account and an exploit-derived session have different preconditions and should be described differently. Verify identity with the platform’s native tools rather than relying on a shell prompt. In Linux, real and effective identity can differ; in a container, an apparent root user may remain constrained by namespace and host policy.',
        'Identify the legitimate account purpose before enumerating privilege. A backup identity may need to read selected paths but not execute arbitrary root commands. A deployment identity may write a release directory but not administer the host. The assessment compares effective authority with intended authority, so preserve the business purpose as part of the baseline.',
      ] },
      { title: 'Enumerate by decision value', paragraphs: [
        'Prioritize checks tied to the objective: local grant review for a privilege boundary, route information for an explicitly scoped network path, or application configuration for a delegated service action. Avoid indiscriminate dumps of credentials, browser data and user documents. Sensitive collection can create a larger handling burden without adding confidence to the finding.',
        'Use a denied baseline before the protected operation. If the supplied user can already read the proof record, it is not a valid demonstration of escalation. If the file does not exist or the session is on the wrong host, fix the harness before interpreting the result. Keep unrelated service identities and real user data out of the proof.',
      ], code: '# Harbor supplied account; password is in the lab briefing\nssh reviewer-gateway@10.77.7.10\nid\npwd\ncat /root/proof.txt\nsudo -l\n# The first proof read should be denied.\n# Enumerate the grant before exercising the configured path.', codeLabel: 'Supported foothold baseline' },
      { title: 'Set a minimal objective and stop rule', paragraphs: [
        'For administrator-read authority, collect the protected synthetic marker and stop. For a permitted write test, use one approved benign marker with a documented location and removal plan. If the host contains unexpected real secrets or personal information, follow the engagement stop condition. Discovery is not an instruction to ingest all accessible material.',
      ] },
    ],
    comparison: { columns: ['Session observation', 'Established capability', 'Next question'], rows: [
      ['Successful support login', 'Authentication as supplied account', 'Which resources and actions are authorized?'],
      ['Denied protected file', 'Baseline boundary is enforced for this session', 'Which granted transition can cross it?'],
      ['Root prompt in a container', 'Potential namespace-local privilege', 'What host or external capability is actually available?'],
    ] },
    caseStudy: { scenario: 'Harbor’s support account authenticates successfully but cannot read /root/proof.txt. Its sudo policy permits a general-purpose interpreter.', analysis: 'The session establishes ordinary access and a denied protected baseline. The interpreter grant suggests a potential authority transition, which needs its own proof.', decision: 'Exercise only the configured privilege path, verify the resulting identity and read the synthetic proof. Do not treat the supplied account as credential theft or collect production files.' },
    exercise: 'A shell prompt says root, but an administrator-only host canary is denied. What should be recorded and checked next?',
    answer: 'Record the actual identity context and the denied operation. Determine whether the shell is inside a namespace or constrained by another policy and whether the canary is on the intended host. Do not claim host administrator control solely from the prompt.',
    mistakes: ['Treating any shell as full compromise.', 'Collecting all readable credentials before defining an objective.', 'Skipping the denied baseline.'],
    sources, labs: ['campaign-postex-sudo'],
    quiz: [{ prompt: 'What is the purpose of a denied protected-file baseline?', choices: ['To waste time', 'To show the initial session lacks the capability later demonstrated', 'To prove the file is public', 'To grant administrator access'], correctIndex: 1, explanation: 'It makes the authority transition observable rather than assumed.' }],
  },
  {
    id: 'post-host-2', slug: 'privilege-delegation', title: 'Privilege Delegation: Flexible Programs and Narrow Helpers',
    summary: 'Explain why legitimate executable grants can delegate unintended administrator behavior.',
    prerequisite: 'Foothold triage, sudo policy and basic shell/interpreter behavior.',
    outcomes: ['Separate executable allowlisting from action authorization.', 'Identify interpretation, writable inputs and subprocess behavior.', 'Specify a narrow replacement that preserves the account’s intended task.'],
    introduction: 'Privilege escalation frequently comes from a legitimate mechanism used too broadly. A rule that allows a program to run as an administrator delegates everything that program is permitted to do, including behavior controlled by its inputs. The durable lesson is about authority transfer, not a catalog of binary names.',
    sections: [
      { title: 'A program name is not a constrained operation', paragraphs: [
        'Review the permitted executable, arguments, environment, input files and subprocess behavior. A general-purpose interpreter can evaluate arbitrary program logic; a file-processing utility may launch another program; an editor can write privileged files. The actual delegated capability can be much larger than the administrator’s original intent to permit a single maintenance task.',
        'Do not assume every grant is exploitable. Exact argument restrictions, immutable scripts, safe environment handling and OS policy can limit behavior. Inspect the real rule and its execution context. In the browser engine, a matching configured sudo executable opens a simulated root session; it does not evaluate the embedded program or faithfully implement every sudoers restriction.',
      ] },
      { title: 'Validate the authority change with minimal evidence', paragraphs: [
        'First record the denied protected read and the grant that appears to enable a transition. Exercise the configured path, verify identity and repeat the same protected read. The matched before/after pair supports the privilege finding. A grant listing alone is a configuration observation; an observed protected operation establishes the selected impact.',
        'Keep evidence tied to the host and identity. A sudo command on the attacker workstation does not demonstrate target privilege. A protected file from a different session may belong to a different system. Session context matters, especially when the exercise involves a gateway and follow-on host.',
      ], code: '# Harbor intentionally grants this interpreter to the supplied account\nsudo -l\nsudo /usr/bin/python3 -c \'import os; os.system("/bin/sh")\'\nid\ncat /root/proof.txt\n# The simulator models the configured grant as a session transition.\n# Verify exact rule semantics in a real disposable system separately.', codeLabel: 'Supported delegated-privilege proof' },
      { title: 'Repair the operation boundary', paragraphs: [
        'Replace broad privileged interpretation with an immutable narrow helper that accepts a constrained request and performs the necessary operation. Review ownership, writable directories, environment and subprocess use so the helper cannot regain arbitrary behavior through its dependencies. Test allowed maintenance work and denied arbitrary execution together. Removing all support access is not the same as implementing least privilege.',
      ] },
    ],
    comparison: { columns: ['Grant design', 'Authority transferred', 'Review focus'], rows: [
      ['Any interpreter invocation', 'Caller-selected program behavior', 'Arguments, execution and subprocess capabilities'],
      ['Root-owned narrow helper', 'Intended maintenance operation', 'Input validation, immutable dependencies and environment'],
      ['Writable privileged script', 'Behavior controlled by unprivileged writer', 'Ownership and write permissions along the entire path'],
    ] },
    caseStudy: { scenario: 'Harbor permits support staff to run a root interpreter for automation. The tester uses its subprocess capability and reads a synthetic administrator-only marker.', analysis: 'The flaw is excessive delegation through a flexible program. Renaming the interpreter or blocking one example snippet would leave the same underlying capability available.', decision: 'Remove the broad grant, define the actual maintenance operation and verify that a fresh support session can perform legitimate work while arbitrary privileged execution is denied.' },
    exercise: 'An allowed root script is immutable, but it imports a helper from a user-writable directory. Where is the authority boundary still broken?',
    answer: 'The unprivileged writer can change a dependency interpreted by the privileged process. The script’s own ownership is insufficient. Review the complete dependency path, fix writable search locations and test with an approved benign marker in a disposable environment.',
    mistakes: ['Assuming an executable allowlist constrains all program behavior.', 'Patching a single snippet instead of the delegated capability.', 'Ignoring writable dependencies and environment search paths.'],
    sources, labs: ['campaign-postex-sudo'],
    quiz: [{ prompt: 'What is the strongest replacement for a broad root-interpreter grant?', choices: ['Rename the interpreter', 'Block one command string', 'A narrowly designed immutable helper with constrained inputs and dependencies', 'Give the account all administrator permissions'], correctIndex: 2, explanation: 'The repair constrains the operation rather than relying on the name of a flexible program.' }],
  },
  {
    id: 'post-host-3', slug: 'execution-context-and-suid', title: 'Execution Context: SUID, Capabilities and Isolation',
    summary: 'Reason about effective privilege, program behavior and host versus workload boundaries.',
    prerequisite: 'Linux permissions, process identity and privilege delegation.',
    outcomes: ['Explain why a special file mode is a lead rather than universal exploit proof.', 'Separate process privilege from host-wide capability.', 'Design a context-aware minimal validation and repair.'],
    introduction: 'Special executable permissions can change process authority, but the effect depends on the program and operating-system context. The meaningful question is what protected action the resulting process can perform. This avoids treating a filesystem flag or a root-looking prompt as conclusive evidence.',
    sections: [
      { title: 'Inspect the executable and its environment', paragraphs: [
        'A set-user-ID executable may run with an effective identity associated with its owner, subject to platform behavior and restrictions. Some programs drop elevated authority, some restrict input and some retain capabilities useful for crossing a boundary. Mount policy, namespaces, file ownership and execution context affect the result. A SUID script is not equivalent to a SUID native executable on Linux.',
        'Capabilities divide some administrator functions into narrower process privileges, but a specific capability can still be dangerous when granted to a flexible program. Map the capability to the action it enables rather than equating every capability with full root. A scanner’s list of special executables supplies investigation candidates, not a verdict on each one.',
      ] },
      { title: 'Test the protected operation in the intended context', paragraphs: [
        'Use a synthetic protected object on the relevant host. Record identity, baseline denial, executable state and the successful or denied operation after execution. If a namespace-local process cannot affect host resources, preserve that limitation. Do not enlarge the proof into a host escape or persistence claim without an observed transition.',
        'The Foundry engine intentionally recognizes one configured SUID shell path and models its execution as a root session. It does not emulate arbitrary ELF binaries, Linux capability calculations or mount options. The lesson separates the actual operating-system concepts from this deliberately limited implementation, so learners know what needs a real disposable-system check.',
      ], code: '# Foundry simulator path\nssh reviewer-gateway@10.77.8.10\nid\ncat /root/proof.txt\nfind / -perm -4000\n/bin/bash -p\nid\ncat /root/proof.txt\n# Only the configured SUID shell path is modeled.', codeLabel: 'Supported context-aware proof sequence' },
      { title: 'Repair the source of excess authority', paragraphs: [
        'Remove an unnecessary special mode or capability and determine why it entered the image. If a legitimate task needs elevation, use a constrained mechanism with verified ownership and inputs. Check image build policy, installation scripts and update paths so the state does not reappear at the next deployment. Retest ordinary account behavior plus the formerly protected operation from a fresh session.',
      ] },
    ],
    comparison: { columns: ['Observation', 'Question to resolve', 'Evidence needed'], rows: [
      ['SUID mode', 'Does this program retain useful authority?', 'Configured execution and protected operation'],
      ['Capability grant', 'Which specific action does it permit?', 'Minimal relevant privileged operation'],
      ['Namespace root', 'Can it cross the host boundary?', 'Host-level canary or control proof, explicitly scoped'],
    ] },
    caseStudy: { scenario: 'Foundry’s maintenance image contains a SUID shell. The supplied user cannot read the root marker until the configured shell executes.', analysis: 'The paired result establishes the modeled local privilege transition. It does not establish a kernel exploit or prove that every SUID binary grants a shell.', decision: 'Remove the unnecessary mode, fix the image-production rule and validate that a fresh ordinary session still works while the protected read remains denied.' },
    exercise: 'A container reports UID 0, but no host mounts or management interfaces exist. What can you conclude about host root?',
    answer: 'You have evidence of the workload’s reported identity, not host administrator access. Review namespace, capabilities and reachable interfaces. A host-level claim requires an explicitly authorized host-boundary proof.',
    mistakes: ['Treating every SUID binary as automatically exploitable.', 'Equating container UID 0 with host administrator control.', 'Removing a mode manually while leaving the image build defect intact.'],
    sources, labs: ['campaign-postex-suid'],
    quiz: [{ prompt: 'Why is finding a SUID executable insufficient for a full privilege-escalation claim?', choices: ['SUID has no security meaning', 'Program behavior and execution context determine whether protected authority can be exercised', 'Every SUID program is identical', 'Only the filename matters'], correctIndex: 1, explanation: 'The claim needs a context-specific capability transition and proof.' }],
  },
  {
    id: 'post-host-4', slug: 'sensitive-artifacts-and-remediation', title: 'Sensitive Artifacts, Evidence Minimization and Privilege Repair',
    summary: 'Collect only what establishes impact and preserve a safe, reviewable repair and handback.',
    prerequisite: 'A completed local privilege proof and identity lifecycle reasoning.',
    outcomes: ['Distinguish reading a canary from collecting production secrets.', 'Build an artifact ledger with approved cleanup scope.', 'Verify repaired privilege from a fresh low-privilege session.'],
    introduction: 'Post-access work creates evidence and state. Both need ownership. A technically successful assessment can still leave excessive data on a workstation, an unnecessary target marker or a live privileged session. Evidence minimization and repair verification are part of the technical workflow.',
    sections: [
      { title: 'Choose representative synthetic evidence', paragraphs: [
        'Use client-generated canaries for administrator reads, dedicated tenant fixtures for access control and scoped test accounts for authentication. Record enough context to reproduce the failure without collecting a broad dataset. If the impact is already established, a second sensitive directory dump often increases handling risk without increasing confidence.',
        'Separate secrets from proof identifiers. A report can refer to a synthetic proof or a redacted credential fingerprint while the sensitive raw material stays in an agreed protected evidence store. Define retention and deletion under the engagement agreement. Do not put production secrets into publicly shareable writeups or training artifacts.',
      ] },
      { title: 'Track every approved change', paragraphs: [
        'Maintain an artifact ledger: host, path or resource identifier, purpose, creator, creation time, removal owner and verification. A benign marker demonstrates a write capability but also becomes a cleanup item. Changes to grants and accounts can affect legitimate operations, so coordinate their timing and preserve a rollback plan where appropriate.',
        'The campaigns use one exact marker path and known content. Remediation repairs the follow-on privileged execution grant and closes target sessions; cleanup later deletes that marker and revokes the temporary reviewer account. This is deliberately narrower than pretending to clean arbitrary persistence or repair the original application finding.',
      ], code: '# On the review host, after its protected proof\necho approved-review-marker > /tmp/assessment-marker\nengagement remediate\n# Reconnect using the supplied review account.\nsudo -l\n# Repeat the exact former privilege command named by remediation.\ncat /root/impact.txt\nengagement retest\n# Login works; policy, transition and protected-read checks must pass.', codeLabel: 'Supported privilege repair and negative retest' },
      { title: 'Preserve the distinction between fix and closeout', paragraphs: [
        'A privilege fix should preserve the account’s legitimate function long enough to verify its allowed behavior. Account revocation is a later handback step for a temporary assessment identity. If you revoke it first, you cannot tell whether the privilege invariant was repaired or simply bypassed by denying all access. Report the control verified and any remaining original vulnerability separately.',
      ] },
    ],
    comparison: { columns: ['Item', 'Why it exists', 'Verification at handback'], rows: [
      ['Synthetic proof', 'Establish protected access', 'Reference retained; no bulk sensitive collection'],
      ['Approved marker', 'Demonstrate bounded write and cleanup', 'Exact artifact removed'],
      ['Temporary reviewer account', 'Supply controlled test identity', 'Revoked after negative retest'],
    ] },
    caseStudy: { scenario: 'The tester removes the reviewer account before retesting an interpreter grant.', analysis: 'Login failure no longer distinguishes a repaired privilege boundary from a disabled account. The necessary positive control is missing.', decision: 'Repair the grant first, verify legitimate fresh login plus denied administrator actions, submit the evidence report, then revoke the temporary account and remove the approved marker at handback.' },
    exercise: 'A report says “cleaned the host” after deleting one marker. What should the statement actually say?',
    answer: 'Name the exact approved artifact removed, the temporary account revoked and the target sessions closed. State that no claim is made about unrelated state, arbitrary persistence or original application repair. A bounded verification is more defensible than an unqualified clean-host assertion.',
    mistakes: ['Collecting actual secrets when a synthetic proof suffices.', 'Revoking the account before testing legitimate behavior.', 'Calling a narrowly verified cleanup a complete host sanitization.'],
    sources, labs: ['campaign-postex-sudo', 'campaign-postex-suid'],
    quiz: [{ prompt: 'Which order best separates privilege repair from handback?', choices: ['Delete the account, then infer repair', 'Repair the grant, run fresh-login positive and negative controls, then revoke the temporary identity', 'Keep the elevated session forever', 'Remove all logs before writing the report'], correctIndex: 1, explanation: 'The account remains usable for the repair test and is revoked only at closeout.' }],
  },
];
