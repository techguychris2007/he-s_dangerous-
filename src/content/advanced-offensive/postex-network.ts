import type { AdvancedLesson } from './LessonArticle';

const sources = [
  { title: 'MITRE ATT&CK — lateral movement', url: 'https://attack.mitre.org/tactics/TA0008/' },
  { title: 'MITRE ATT&CK — persistence', url: 'https://attack.mitre.org/tactics/TA0003/' },
  { title: 'NIST SP 800-115 — assessment execution and reporting', url: 'https://csrc.nist.gov/pubs/sp/800/115/final' },
];

export const postexNetworkLessons: AdvancedLesson[] = [
  {
    id: 'post-network-1', slug: 'reachability-and-lateral-access', title: 'Reachability, Authentication and Lateral Access',
    summary: 'Separate network paths from identity permissions and prove a scoped cross-host transition.',
    prerequisite: 'Routing, segmentation, SSH and foothold triage.',
    outcomes: ['Model source-specific reachability.', 'Distinguish a connection path from a usable credential.', 'Validate a scoped gateway-to-host transition with explicit preconditions.'],
    introduction: 'A second host can be reachable without accepting the current identity, or accept an identity only from a permitted segment. Lateral access requires both a path and an authentication/authorization decision. Post-access testing should preserve these separate gates rather than describing every internal scan as lateral movement.',
    sections: [
      { title: 'Build a source–destination access matrix', paragraphs: [
        'Identify source context, destination, service, protocol and expected control. “Review host is internal” is less useful than “review host SSH accepts traffic from the gateway, while the attacker workstation cannot reach it.” Compare the same destination from controlled source contexts. A firewall denial and an authentication rejection support different conclusions.',
        'Record routes and active session context before testing. A gateway session may provide access to a new segment, but it does not grant all identities permission to use that segment’s services. Keep discovery within scoped addresses and rate limits. Do not sweep unrelated networks merely because the supplied host has a route to them.',
      ] },
      { title: 'Validate identity separately from the path', paragraphs: [
        'Use client-provided test identities where possible. Establish which destination account is valid, its intended authority and whether it is reusable across hosts. A copied-looking password is not proof of authentication until the scoped service accepts it. A successful login still requires a separate test of resource and privilege authorization.',
        'After remediation or session closure, rebuild the authorized path before interpreting failed connectivity. Otherwise a negative result can be caused by source reachability rather than a repaired identity rule. Matched controls should keep the network source stable when testing account authority.',
      ], code: '# Northstar: workstation baseline\nnmap -sV 10.78.9.20\n# Follow-on host remains gated until initial evidence.\n# After initial proof, connect to the client-supplied gateway:\nssh reviewer-gateway@10.77.9.10\n# Enter the briefing password, then request handoff and test:\nengagement handoff\nnmap -sV 10.78.9.20\nssh reviewer@10.78.9.20\n# Only the gateway segment is permitted by this campaign.', codeLabel: 'Supported source-specific access test' },
      { title: 'Document the boundary actually tested', paragraphs: [
        'The Northstar engine enforces source-host reachability and simulated SSH authentication. It does not implement port forwarding, packet routing, SMB relay or Kerberos delegation. These are separate practical topics for disposable network environments. State the measured source and identity conditions and do not name a protocol attack that the exercise never performed.',
      ] },
    ],
    comparison: { columns: ['Failure', 'Likely boundary', 'Useful control'], rows: [
      ['Host unavailable from workstation', 'Source reachability', 'Same destination from authorized gateway'],
      ['Password rejected on reachable host', 'Authentication', 'Supplied known-valid account on same path'],
      ['Protected read denied after login', 'Resource or privilege authorization', 'Approved protected synthetic record'],
    ] },
    caseStudy: { scenario: 'Northstar’s review host is unavailable from the attacker box but accepts a supplied reviewer account from the gateway.', analysis: 'The path and identity gates are independently established. The initial ownership finding did not steal the supplied gateway credentials, and the campaign does not emulate Active Directory protocols despite its enterprise identity context.', decision: 'Report the cross-host transition with source, destination and supplied-account preconditions; continue into the local review-host privilege test as a separate boundary.' },
    exercise: 'After a fix, SSH fails from your workstation but still succeeds from the gateway. Has the credential been revoked?',
    answer: 'No such conclusion follows. The difference establishes source-dependent reachability. Test the credential from the same allowed path using a positive connectivity control, then evaluate authentication and authorization independently.',
    mistakes: ['Calling a blocked network path an invalid password.', 'Calling internal reachability authenticated lateral movement.', 'Claiming a protocol-specific technique that the simulator does not implement.'],
    sources, labs: ['campaign-lateral-trust'],
    quiz: [{ prompt: 'What are separate preconditions for a scoped lateral login?', choices: ['A familiar host name only', 'Reachable service and an accepted, authorized identity', 'Administrator authority on every host', 'A screenshot of a network map'], correctIndex: 1, explanation: 'The network path and identity decision must each be established.' }],
  },
  {
    id: 'post-network-2', slug: 'persistence-review-and-reversibility', title: 'Persistence Review and Reversible Validation',
    summary: 'Assess authority that survives sessions without deploying stealthy or uncontrolled mechanisms.',
    prerequisite: 'Host privilege boundaries, identity lifecycle and artifact ledgers.',
    outcomes: ['Distinguish session survival, credential reuse and durable configuration changes.', 'Specify persistence testing as an explicitly authorized separate objective.', 'Choose a reversible marker and verification plan.'],
    introduction: 'Persistence is authority that survives a boundary such as logout, restart or credential rotation. It is not necessary to install a covert mechanism to understand or assess that boundary. A mature test reviews existing grants and lifecycle behavior first, then validates only the agreed reversible state.',
    sections: [
      { title: 'Define the survival condition precisely', paragraphs: [
        'Ask what should terminate the capability: session close, password rotation, account disablement, token expiry or service restart. A long-lived service token can provide continued access without modifying the host. An existing scheduled job can retain authority after the human account that configured it changes. The assessment should distinguish these conditions instead of grouping them all under persistence.',
        'Inventory privileged startup and scheduled execution, service identities, authorized keys and application grants using read-only methods within scope. Establish ownership and intended purpose before declaring an artifact malicious or unnecessary. An unfamiliar task name is a lead, not proof. Where deployment of a persistence mechanism is excluded, report configuration and lifecycle evidence rather than creating one.',
      ] },
      { title: 'Use reversible state for approved validation', paragraphs: [
        'Any approved change needs a known identifier, narrow scope, expiry, removal owner and verification. A benign marker can demonstrate a write operation without creating continued executable authority. A temporary test account can support a revocation check if the client explicitly approves it. Avoid broad startup modification or hidden callbacks when the business question can be answered with a controlled fixture.',
        'These browser campaigns intentionally use a marker and a provisioned account instead of emulating stealth persistence. The marker is not auto-executed, and cleanup verifies its exact removal. Learners should not infer that a file marker is a faithful simulation of scheduled execution or a complete assessment of host persistence mechanisms.',
      ], code: 'Approval record\nObjective: validate bounded write and account lifecycle\nArtifact: /tmp/assessment-marker\nContent: approved-review-marker\nExecution: none\nRemoval: engagement cleanup\nVerification: exact marker absent, temporary account revoked\nExcluded: startup changes, hidden callbacks and production accounts', codeLabel: 'Reversible validation contract' },
      { title: 'Retest lifecycle controls without stale sessions', paragraphs: [
        'Test future access and existing authority separately. A disabled account should reject a new login, but an already established session may persist depending on the system. A rotated credential may not invalidate existing tokens. Use controlled lifecycle checkpoints and preserve the resulting distinction in the report. Do not call the whole environment clean based on one account or artifact check.',
      ] },
    ],
    comparison: { columns: ['State', 'Can survive', 'What to test'], rows: [
      ['Existing session', 'Password rotation in some designs', 'Session invalidation separately from new login'],
      ['Long-lived token', 'Human logout', 'Expiry, revocation and receiver policy'],
      ['Approved benign marker', 'Session close', 'Exact removal; no executable persistence claim'],
    ] },
    caseStudy: { scenario: 'Continuity’s tester wants to prove handback using a hidden startup task, even though the agreed objective is temporary-account revocation.', analysis: 'The proposed task introduces unnecessary executable state and a new scope boundary. The existing temporary account and marker already support a measurable lifecycle and cleanup test.', decision: 'Use the approved fixtures, verify account revocation and marker removal, and document that arbitrary persistence deployment was excluded.' },
    exercise: 'A password was rotated and a fresh login fails, but an existing session still reads a protected object. Write the finding distinction.',
    answer: 'Future authentication with the old password is revoked, but the established session retains authority. Report session invalidation as a separate lifecycle condition, state which protected operation was observed and recommend a policy consistent with the client’s intended revocation semantics.',
    mistakes: ['Deploying persistence when scope only permits read-only review.', 'Calling a marker executable persistence.', 'Assuming new-login denial proves every active capability is revoked.'],
    sources, labs: ['campaign-handback'],
    quiz: [{ prompt: 'Which proof best matches a temporary-account handback objective?', choices: ['Install a hidden startup task', 'Verify the approved account is revoked and its documented artifacts are removed', 'Collect every credential store', 'Delete unrelated scheduled tasks'], correctIndex: 1, explanation: 'The proof should match the authorized lifecycle objective with minimal reversible state.' }],
  },
  {
    id: 'post-network-3', slug: 'detection-and-purple-team-validation', title: 'Detection Evidence and Purple-Team Validation',
    summary: 'Separate exploit success from telemetry generation, alerting and response outcomes.',
    prerequisite: 'A complete campaign, basic SOC concepts and evidence reporting.',
    outcomes: ['Build a behavior-to-telemetry validation plan.', 'Distinguish event presence from useful alerting and response.', 'Coordinate controlled checks with defenders without overclaiming simulator telemetry.'],
    introduction: 'A penetration test can show a boundary failure while a detection exercise asks whether defenders can observe and respond to that behavior. These are different outcomes. A successful alert does not repair the flaw, and a blocked action does not prove that the monitoring pipeline works.',
    sections: [
      { title: 'Define the observation chain', paragraphs: [
        'For an agreed behavior, identify the expected native event, collection route, normalization, rule, alert destination and response. For example, a new privileged session may generate host audit events; a protected-resource read may generate application logs. Specify the fields needed to distinguish the test identity, resource, source and time. Without those fields, event presence may not support meaningful attribution.',
        'Distinguish no event generated, collection failure, rule mismatch, suppressed alert and response delay. A single “no alert” conclusion hides these different defects. Verify a known control event before interpreting an absent test signal. Use the client’s time synchronization and agreed correlation window to match the behavior to telemetry.',
      ] },
      { title: 'Coordinate a controlled behavior', paragraphs: [
        'Choose a small, approved action with a recognizable synthetic marker or test identity. Record start time, source, destination and expected side effects, then ask defenders to locate the signal and explain the response. Agree whether the exercise is announced or blind and who can intervene. Do not add evasion or destructive impact because the initial detection did not fire; that changes the objective.',
        'The browser campaigns provide terminal transcripts and proof references, not real operating-system audit logs or a functioning enterprise alert pipeline. They can support planning and report reasoning, but a claimed detection outcome requires a separate log-backed or real disposable-environment exercise. A transcript is evidence of simulator behavior, not proof that production telemetry exists.',
      ], code: 'Validation plan\nBehavior: supplied reviewer obtains privileged synthetic read\nExpected event: platform-specific privilege and file-access telemetry\nCorrelation: test identity + review host + agreed time window\nControl: known benign login event visible to defenders\nOutcomes: prevented / observed / alerted / responded\nLimit: browser transcript is not native host telemetry', codeLabel: 'Behavior-to-telemetry plan' },
      { title: 'Measure coverage without equating it to security', paragraphs: [
        'Report whether the exact behavior was prevented, observed, alerted and acted on. Include elapsed times and missing context only when measured. Map the behavior to a taxonomy such as ATT&CK to aid communication, while keeping the test identity and actual operation explicit. A taxonomy label does not substitute for evidence or imply coverage of every technique in the category.',
      ] },
    ],
    comparison: { columns: ['Outcome', 'Evidence required', 'Not equivalent to'], rows: [
      ['Observed', 'Relevant event reaches the analysis system', 'Useful alert or effective response'],
      ['Alerted', 'Rule produces actionable signal with context', 'Root-cause repair'],
      ['Responded', 'Agreed response executes and is verified', 'Prevention of every similar technique'],
    ] },
    caseStudy: { scenario: 'Northstar’s review-host proof succeeds. An analyst says the test was detected because the learner’s terminal transcript is visible.', analysis: 'The transcript records the simulated commands; it is not an independent native event or alert. The claimed monitoring outcome lacks the observation chain required for a detection assessment.', decision: 'Use the transcript to design a separate controlled telemetry exercise. Report the campaign’s exploit and cleanup results, and leave production detection efficacy untested.' },
    exercise: 'A native event exists on the host but never reaches the SIEM. Is this a rule failure?',
    answer: 'Not yet. The collection or transport path failed before the rule could evaluate the event. Verify ingestion and normalization first, then test the rule and alert routing separately. Preserve each result in the coverage ledger.',
    mistakes: ['Treating a simulator transcript as independent defensive telemetry.', 'Calling every absent alert a rule problem.', 'Claiming a single taxonomy-mapped test covers an entire tactic.'],
    sources, labs: ['campaign-lateral-trust', 'campaign-handback'],
    quiz: [{ prompt: 'A host event exists but was not ingested. Which layer should be tested first?', choices: ['Alert severity wording', 'Collection and transport into the analysis pipeline', 'More invasive exploitation', 'Report formatting'], correctIndex: 1, explanation: 'A rule cannot evaluate an event that never reached its input pipeline.' }],
  },
  {
    id: 'post-network-4', slug: 'cleanup-retest-and-capstone', title: 'Complete Engagement: Repair, Retest, Cleanup and Handback',
    summary: 'Integrate scope, evidence, privilege, retesting and verified closeout in a complete campaign.',
    prerequisite: 'All preceding advanced and post-exploitation lessons or equivalent practical experience.',
    outcomes: ['Complete a multi-stage assessment without conflating its trust boundaries.', 'Capture clear evidence in the notebook when notes or exports are needed.', 'Verify bounded cleanup and state the remaining real-environment work.'],
    introduction: 'A complete engagement ends when the client can act on the evidence and the agreed temporary state has been handed back. Initial access, privilege proof, retesting and cleanup each answer a different question. This capstone requires the whole chain and preserves its limitations.',
    sections: [
      { title: 'Plan the entire chain before execution', paragraphs: [
        'Write the business claim, supplied identities, synthetic resources and stop conditions. Establish the initial finding with matched controls and minimum evidence. Record when the next account is provisioned by the client rather than acquired through an exploit. For a segmented campaign, verify reachability from the allowed source and identity permission separately.',
        'At the review host, test the protected file before escalation, enumerate the granted path, verify the authority transition and read only the synthetic proof. Create exactly the approved marker. Keep a ledger of sessions, temporary account and artifact state so the cleanup operation is concrete and reviewable.',
      ] },
      { title: 'Repair and prove the intended invariant', paragraphs: [
        'Apply the follow-on privileged execution repair through the training control. The old target sessions close so the retest begins from a fresh low-privilege identity. Rebuild the gateway path when required, authenticate successfully and actually check the removed sudo grant, repeat the former privilege command and attempt the protected read. The engine does not accept a typed success assertion in place of the observed denied operations.',
        'The original application or artifact finding remains separate. Its real repair needs the owner’s implementation change and matching regression cases in an appropriate environment. The evidence notebook can preserve notes, JSON backups and PDF or Markdown exports, but the terminal path no longer requires learners to submit a separate report file.',
      ], code: 'engagement scope\n# Complete initial proof and follow-on privilege assessment.\nengagement evidence\n# Create the approved marker on the review host.\nengagement remediate\n# Reconnect through the gateway if the campaign requires it.\nsudo -l\n# Repeat the exact former privilege command named by remediation.\ncat /root/impact.txt\nengagement retest\nengagement cleanup\nengagement evidence', codeLabel: 'Supported closeout sequence; omitted steps depend on the campaign' },
      { title: 'Verify bounded handback and preserve uncertainty', paragraphs: [
        'The closeout removes the exact approved marker, revokes the temporary review identity and closes target sessions. Verification of these known items does not establish that arbitrary persistence, unrelated accounts or original service weaknesses have been removed.',
        'Use the notebook write-up when you want to practice causal reasoning, impact bounds and recommendations. Finish with a practical follow-up plan: original-root-cause regression tests, real-system rule semantics, session revocation behavior and independent telemetry validation where those were outside this simulation.',
      ] },
    ],
    comparison: { columns: ['Checkpoint', 'Engine verifies', 'Reviewer must judge'], rows: [
      ['Evidence notebook', 'Saved local notes and export package', 'Correct causal reasoning and recommendations'],
      ['Retest', 'Fresh login context and two denied operations', 'Whether real-system coverage is sufficient'],
      ['Cleanup', 'Known marker, temporary identity and sessions', 'Any broader handback obligations outside simulation'],
    ] },
    caseStudy: { scenario: 'Continuity’s learner captures the initial and impact proofs, then tries to close the engagement without a negative retest.', analysis: 'The proof chain is incomplete: exploitation alone does not establish engineering handoff or repaired behavior. The closeout control correctly rejects the request.', decision: 'Complete the fresh-session negative tests, capture optional notes in the evidence notebook, then verify marker removal, account revocation and closed sessions.' },
    exercise: 'Prepare a handback statement with one verified repair, one cleanup result and one explicitly untested condition.',
    answer: 'The follow-on broad privileged execution grant was removed; fresh reviewer login works while privileged execution and protected reads are denied. The approved marker was removed, the temporary reviewer account revoked and target sessions closed. The original application repair and production detection efficacy remain untested in this browser simulation.',
    mistakes: ['Ending the engagement at the final exploit flag.', 'Treating notebook notes as proof without observed terminal evidence.', 'Claiming cleanup of unrelated host state or repair of the original application.'],
    sources, labs: ['campaign-handback', 'campaign-lateral-trust'],
    quiz: [{ prompt: 'Which statement accurately describes a passed closeout?', choices: ['Every production weakness is repaired', 'Known temporary artifacts and account are removed; verified follow-on controls pass, with broader limits stated', 'The notebook automatically proves expert review', 'The simulator proved enterprise detection works'], correctIndex: 1, explanation: 'The conclusion must stay within the controls and state that were actually verified.' }],
  },
];
