import type { AdvancedLesson } from './LessonArticle';

const references = [
  { title: 'NIST SP 800-115 — security testing and assessment', url: 'https://csrc.nist.gov/pubs/sp/800/115/final' },
  { title: 'OWASP WSTG — testing methodology', url: 'https://wstg.owasp.org/stable/' },
];

export const methodologyLessons: AdvancedLesson[] = [
  {
    id: 'adv-method-1', slug: 'scope-and-assessment-design', title: 'Assessment Design: Scope, Authority and Stop Conditions',
    summary: 'Turn a business objective into explicit assets, identities, test constraints and acceptance criteria.',
    prerequisite: 'Networking, reconnaissance and basic web testing; distinguish a hostname, service and user identity.',
    outcomes: ['Build an asset–identity–action scope matrix.', 'Define stop conditions and evidence handling before testing.', 'Separate vulnerability assessment, penetration testing and adversary emulation.'],
    introduction: 'A mature penetration test is an experiment against an agreed security claim. Its value comes from how confidently it answers a business question, not the number of tools executed. Authorization, sampling and uncertainty will still matter when today’s operating systems, identity products and application frameworks have changed.',
    sections: [
      { title: 'Start with the business claim', paragraphs: [
        '“Our customer portal is secure” is too broad to test. “A customer from tenant A cannot read tenant B invoices through the public API” identifies an actor, resource, action and boundary. Translate each business concern into such a claim, then identify the identities and fixtures needed to test it. The engagement may cover confidentiality while excluding payment integrity or availability; that exclusion must be visible in the conclusion.',
        'Different assessment types answer different questions. A configuration review can establish an excessive grant without exercising it. A penetration test demonstrates a permitted chain and its impact. An adversary-emulation exercise tests whether a particular sequence is prevented or detected. These can share tools while requiring different scope, evidence and success criteria.',
      ] },
      { title: 'Scope is more than a list of IP addresses', paragraphs: [
        'Record ownership, addresses, application paths, account roles, permitted operations and excluded dependencies. A client-owned application can call a vendor-owned identity provider; discovering that connection does not authorize testing the vendor. Shared hosting, third-party mail, production recovery systems and employee devices require explicit treatment. Where ownership is uncertain, preserve the observation and ask the designated contact before crossing that boundary.',
        'Define operational constraints that are measurable: concurrency ceiling, test window, sensitive endpoints, maximum synthetic records, approved account lockouts and emergency contact. A stop condition should describe a signal and response: unexpected real personal data means stop collection, preserve the minimum identifying evidence and contact the client. Do not quietly expand the test because an attack path is technically possible.',
      ], code: 'Claim: tenant A cannot read tenant B invoices\nActors: supplied test-a and test-b accounts\nAssets: 10.77.1.10 and client-provisioned review host\nAllowed: read two synthetic invoices; local privilege review\nExcluded: destructive writes, production records, external targets\nStop: unexpected real data or service health degradation\nEvidence: request, response, actor, resource, time and limitation', codeLabel: 'Example engagement charter' },
      { title: 'Design acceptance and handback up front', paragraphs: [
        'Acceptance criteria should say what will count as demonstrated impact and how cleanup will be checked. For administrator authority, a client-generated proof file is better than copying the customer database. For isolation, two controlled records are sufficient. Choose reversible artifacts, inventory each change and agree who removes it. A report should distinguish a completed test, an untested condition and a blocked test rather than reducing all three to pass or fail.',
      ] },
    ],
    comparison: { columns: ['Observation', 'What it supports', 'What it does not support'], rows: [
      ['Open TCP service', 'Reachability from this source', 'Authorization to attack every hosted application'],
      ['Internal synthetic manifest exposed', 'Confidentiality boundary failure', 'Shell access or production data compromise'],
      ['Protected proof read after escalation', 'Demonstrated privileged read', 'Persistence, unrestricted network access or data destruction'],
    ] },
    caseStudy: { scenario: 'Atlas permits a release-gateway assessment. An anonymous download reveals an internal deployment manifest containing a synthetic marker.', analysis: 'The first finding is unauthorized disclosure through public distribution. The manifest establishes neither a valid remote password nor code execution. Atlas separately provisions a follow-on review identity, which is an additional test input rather than a credential stolen through the finding.', decision: 'Report the exposure precisely, assess the separately scoped account, and preserve the two findings as separate edges in the final chain. Do not describe the handoff as an exploit consequence.' },
    exercise: 'A scoped web server exposes a link to a partner billing API and one real customer address. Write the next three actions and a defensible finding title.',
    answer: 'Stop collecting real customer data, preserve the minimum evidence under the agreed handling policy, and contact the client to confirm ownership and response. Do not test the partner endpoint without authorization. A title such as “Public release path discloses internal customer metadata” states the demonstrated boundary failure without claiming partner compromise.',
    mistakes: ['Treating a reachable dependency as automatically in scope.', 'Using “full compromise” when only a disclosure was demonstrated.', 'Planning cleanup only after an exploit succeeds.'],
    sources: references, labs: ['campaign-scope-to-impact'],
    quiz: [{ prompt: 'What makes a scope boundary operationally useful?', choices: ['A list of popular tools', 'Assets, permitted identities and actions, exclusions and stop conditions', 'Only the public IP addresses', 'An instruction to find as many flags as possible'], correctIndex: 1, explanation: 'The scope must tell the tester which actions are authorized and when to stop, not merely what can be reached.' }],
  },
  {
    id: 'adv-method-2', slug: 'hypothesis-driven-enumeration', title: 'Hypothesis-Driven Enumeration and Negative Controls',
    summary: 'Replace blind tool sequences with testable hypotheses, matched controls and a coverage ledger.',
    prerequisite: 'Read service scan results and issue a basic HTTP request.',
    outcomes: ['Connect a discovery observation to a security hypothesis.', 'Design positive and negative controls that differ in one meaningful variable.', 'Explain false positives, false negatives and untested paths.'],
    introduction: 'Enumeration becomes useful when it changes a decision. A long scan transcript with no hypothesis is difficult to reproduce and easy to overinterpret. The durable skill is selecting the smallest test that can distinguish competing explanations for a system’s behavior.',
    sections: [
      { title: 'Observation → hypothesis → experiment', paragraphs: [
        'Suppose a catalog endpoint returns different content for different search terms. One hypothesis is that a caller-controlled term changes the database predicate. An alternative is that the application has a documented administrative search mode. Read the endpoint contract, establish a normal public response and change only the term needed to test predicate control. Record what result would support or falsify the hypothesis before sending the probe.',
        'A banner is a lead, not proof. Version strings may be hidden, backported, spoofed or unrelated to the vulnerable code path. A scan can establish service exposure; a behavioral test establishes whether a specific precondition actually holds. If access to the relevant function is unavailable, report the condition as unverified rather than forcing it into a confirmed finding.',
      ] },
      { title: 'Controls keep interpretations honest', paragraphs: [
        'A positive control verifies that the test harness can exercise legitimate functionality: your own synthetic invoice should load. A negative control verifies a denial you expect: the same principal should not load a peer tenant’s invoice. Keep method, identity, headers and environment consistent while changing the resource. If multiple variables change at once, the observed response does not identify which boundary failed.',
        'Watch for noise from caching, expired sessions, rate limits and stale fixtures. An HTTP 200 can contain an error page; a 403 can be generated by an edge filter before application authorization is exercised. Compare response content and request context, then repeat only as needed to establish reproducibility within agreed limits. No match is not proof of absence when the harness never reached the relevant branch.',
      ], code: '# Supported in the Beacon browser campaign\nnmap -sV 10.77.2.10\ncurl "http://10.77.2.10/catalog?q=books"\ncurl "http://10.77.2.10/catalog?q=\' OR \'1\'=\'1"\n# Record normal versus restricted synthetic content.\n# This simulator matches configured triggers; it is not a SQL parser.', codeLabel: 'One-variable test with an explicit simulator limit' },
      { title: 'Maintain a coverage ledger', paragraphs: [
        'Track each claim with its prerequisites, test identity, attempted operation, observed result and limitation. Include “not tested” rows for absent accounts, disallowed destructive behavior and unavailable environments. Prioritize tests by expected information gain and plausible business impact rather than scanner severity alone. A useful next test either narrows uncertainty or validates an edge needed for the assessment objective.',
      ] },
    ],
    comparison: { columns: ['Test design', 'Useful result', 'Confounder to exclude'], rows: [
      ['Normal catalog query', 'Public titles returned', 'Error page with status 200'],
      ['Minimal predicate probe', 'Restricted synthetic title disclosed', 'Documented administrative mode'],
      ['Same principal, peer record', 'Ownership denial or controlled disclosure', 'Different token, stale cache or fixture mismatch'],
    ] },
    caseStudy: { scenario: 'Beacon’s search returns a synthetic restricted entry only when a predicate-control probe is supplied.', analysis: 'The paired response supports the configured query-boundary failure. It does not validate arbitrary SQL syntax, database permissions or a production database connection because the lab uses a deterministic response rule.', decision: 'Capture the request pair and response difference, state the simulator limitation and continue into the separately authorized review-host assessment without conflating the two proofs.' },
    exercise: 'A peer invoice test returns 200 and a page saying “session expired.” Is isolation broken, intact or untested? Design the next control.',
    answer: 'The isolation claim is untested because the session failure prevented exercising resource authorization. Renew the supplied test session, verify its own synthetic invoice loads, then repeat the peer-record request with the same valid identity. Judge content and ownership rather than status code alone.',
    mistakes: ['Equating a scan finding with demonstrated exploitability.', 'Changing identity and resource together without matched controls.', 'Reporting no vulnerability when the test harness failed.'],
    sources: references, labs: ['campaign-hypothesis-and-retest'],
    quiz: [{ prompt: 'A negative ownership test gets a session-expired page. What is the best conclusion?', choices: ['The system is secure', 'The system is vulnerable because the status is 200', 'The ownership check was not exercised', 'The response proves administrator access'], correctIndex: 2, explanation: 'Authentication failed before the relevant authorization branch; renew the harness and run matched controls.' }],
  },
  {
    id: 'adv-method-3', slug: 'attack-paths-and-minimal-impact', title: 'Attack Paths, Preconditions and Minimal Impact Proof',
    summary: 'Model a compromise chain as evidence-backed edges and prove the objective without excessive collection.',
    prerequisite: 'Understand service exposure, authentication and local privilege escalation.',
    outcomes: ['Represent a path as identities, resources, transitions and preconditions.', 'Identify the weakest unverified edge in a chain.', 'Select a minimal impact proof with a clear stopping point.'],
    introduction: 'A list of weaknesses is not an attack path. A path states how one established capability enables the next operation, under explicit preconditions. This reasoning works across servers, cloud roles, delivery systems and AI tools because each transition crosses a trust boundary.',
    sections: [
      { title: 'Nodes describe authority, not just machines', paragraphs: [
        'Represent nodes as identity–resource pairs such as “customer A at invoice API” or “reviewer at Linux host.” An edge can be read access, credential acquisition, authentication, privilege delegation or network reachability. For each edge, identify the needed capability and the observed proof. A public configuration file can expose a credential, but that credential must still be validated against the explicitly scoped service before the next node is considered established.',
        'Do not substitute a hypothetical edge for a demonstrated one. A service identity with a broad policy may be able to assume a more powerful role only if the target role’s trust policy also permits it. A reachable database does not grant authentication. A supplied client account is a new starting node, not evidence that an earlier bug produced that account. Paths must preserve these distinctions or their claimed impact will exceed the evidence.',
      ] },
      { title: 'Prove the objective, then stop collecting', paragraphs: [
        'Agree an impact target that is representative without being sensitive: an administrator-only proof record, a dedicated synthetic tenant object or an approved canary file. Capture identity before and after the transition and show the protected operation was denied at baseline. This establishes the privilege change with less data collection than dumping directories or credential stores.',
        'Different impacts need different proofs. Read access establishes confidentiality impact; it does not establish write integrity. A benign approved marker can demonstrate a scoped write while creating a cleanup obligation. A service restart or destructive transaction should not be used merely because it makes the impact vivid. Record the untested impact rather than extrapolating.',
      ], code: 'Node 1: public caller → synthetic manifest\nEvidence: internal marker disclosed by anonymous download\nNode 2: client-provided reviewer → review host\nPrecondition: separately provisioned account and reachability\nNode 3: reviewer → administrator authority\nEvidence: denied baseline; privileged execution; protected proof read\nStop: synthetic proof collected; no customer data requested', codeLabel: 'An honest path with a separate client-provided starting point' },
      { title: 'Evaluate fixes as graph cuts', paragraphs: [
        'A strong remediation breaks the unintended edge and preserves the necessary workflow. Removing a manifest from public distribution breaks the disclosure edge; rotating an exposed credential breaks dependent authentication edges. Removing a broad interpreter grant breaks the privileged execution edge. Defense in depth can break several edges, but a report should name which control fixes the root cause and which reduces downstream impact.',
      ] },
    ],
    comparison: { columns: ['Edge', 'Evidence needed', 'Missing precondition'], rows: [
      ['Exposure → disclosure', 'Read of a non-public synthetic record', 'Reachability alone is insufficient'],
      ['Credential → authenticated identity', 'Scoped successful authentication', 'A password-shaped string may be invalid'],
      ['Identity → privilege', 'Denied baseline and successful protected operation', 'A sudo listing alone does not prove the operation'],
    ] },
    caseStudy: { scenario: 'An Atlas report describes anonymous FTP as “root access” even though the only observed artifact is a deployment manifest.', analysis: 'The report collapses disclosure, authentication and privilege into a single unsupported claim. The follow-on account was supplied independently; only its later privileged proof establishes administrator access on the review host.', decision: 'Split the findings, show the preconditions for each node and prioritize removal of public internal artifacts plus the separate privileged execution grant. Preserve an explicit gap between the original finding and client-provided foothold.' },
    exercise: 'You can list bucket names and see a broad role policy, but role assumption is denied. Draw the established path and identify one unverified edge.',
    answer: 'The established capabilities are bucket enumeration and policy visibility. The transition into the powerful role is not established because the trust or authorization condition for assumption failed. Record that edge as denied under this identity; test only a separately authorized identity if the assessment design requires it.',
    mistakes: ['Claiming all graph edges are exploitable because they appear in configuration.', 'Collecting production data after a synthetic proof already establishes impact.', 'Treating a client-supplied foothold as a consequence of the preceding bug.'],
    sources: references, labs: ['campaign-scope-to-impact', 'campaign-hypothesis-and-retest'],
    quiz: [{ prompt: 'What is required to claim a demonstrated attack path?', choices: ['A diagram of every discovered host', 'A scanner severity for every service', 'Observed transitions and their preconditions, with gaps identified', 'A client-provided account described as stolen'], correctIndex: 2, explanation: 'An attack path is a chain of justified capabilities; unverified transitions must remain explicit.' }],
  },
  {
    id: 'adv-method-4', slug: 'evidence-reporting-and-regression', title: 'Evidence, Finding Quality and Regression Retesting',
    summary: 'Write reproducible findings, preserve uncertainty and test both denied abuse and legitimate functionality.',
    prerequisite: 'Complete a baseline and minimal proof pair in an earlier campaign.',
    outcomes: ['Build a finding with actor, asset, boundary, preconditions and proof.', 'Differentiate structural report validation from expert review.', 'Design a retest that confirms root-cause repair without breaking expected access.'],
    introduction: 'The report is the interface between a test and engineering action. A reproducible finding should allow a responsible owner to understand the failed control, verify the evidence and know what behavior must change. That requirement outlasts tools, exploit formats and particular vulnerability taxonomies.',
    sections: [
      { title: 'Separate facts, interpretation and uncertainty', paragraphs: [
        'Record exact request context, identity, resource, observed response and relevant environment. Keep synthetic identifiers in evidence and redact secrets using a repeatable policy. Then explain what the observation means: a tenant ownership check was absent, or an interpreter grant delegated arbitrary administrator execution. Describe prerequisites explicitly rather than burying them in a reproduction transcript.',
        'State severity in terms of affected data, authority, reachability, required access and demonstrated outcome. A numerical score can summarize a model, but it cannot replace business context. Separate confirmed impact from plausible impact that was excluded or not exercised. Include constraints such as a supplied foothold, a read-only test and a deterministic simulator.',
      ] },
      { title: 'Recommend an invariant, not a payload block', paragraphs: [
        'A repair should state the security property that must hold. For tenant isolation, the authenticated actor and tenant must be authorized for the requested object at the enforcement point. For local privilege, the account must not invoke arbitrary privileged behavior through an overly flexible program. Blocking one example string is not sufficient when many inputs can violate the same property.',
        'Name the accountable owner, required control change, dependency cleanup and retest. A credential disclosure often needs both removal of the exposed artifact and rotation of its secret; deleting the file alone leaves the acquired credential usable. An overbroad privileged grant may require a narrower service helper while preserving the legitimate support workflow.',
      ], code: '{\n  "summary": "Specific finding and observed outcome, with test preconditions",\n  "asset": "review host IP",\n  "rootCause": "Control that delegated more authority than intended",\n  "impact": "Protected synthetic read; production collection not attempted",\n  "evidence": ["observed initial proof", "observed impact proof"],\n  "remediation": "Owner, control change, dependencies and regression tests",\n  "limitations": "Simulator behavior and untested real-system conditions"\n}', codeLabel: 'The campaign report schema — values require your own analysis' },
      { title: 'Retest positive and negative behavior', paragraphs: [
        'A denied exploit after a fix can mean the control worked, the account was disabled or the service is down. Add a positive control that exercises legitimate access, then the same negative operation that previously crossed the boundary. In these campaigns, the reviewer can still log in after removal of its privilege grant, while sudo authority and administrator-file reads are denied. This paired result is stronger than failure alone.',
        'The report validator checks required fields and whether proof references were observed. It cannot assess whether the root-cause explanation is correct or the recommendation is complete. Treat its acceptance as a structural checkpoint. Have a peer or instructor assess the narrative, uncertainty and proposed regression coverage.',
      ] },
    ],
    comparison: { columns: ['Report statement', 'Quality', 'Better formulation'], rows: [
      ['“Everything is vulnerable”', 'Unbounded and unverifiable', 'Name the actor, operation, protected object and precondition'],
      ['“Block this payload”', 'Overfits one example', 'Enforce the missing authorization or execution invariant'],
      ['“The exploit failed after patching”', 'Missing positive control', 'Legitimate login works; prohibited read and privilege are denied'],
    ] },
    caseStudy: { scenario: 'Beacon’s fix removes the follow-on interpreter grant. The reviewer reconnects, can inspect its home directory, cannot use sudo and cannot read /root/impact.txt.', analysis: 'The low-privilege workflow survives and two abuse operations are denied. This verifies the follow-on control change. The catalog injection remains a separate finding and must be repaired and retested by its application owner in an appropriate environment.', decision: 'Submit a finding that cites the original disclosure and follow-on impact without claiming the original catalog flaw was repaired by the simulator’s host remediation.' },
    exercise: 'Rewrite “We got root; fix permissions” into a finding with one precondition, one proof, one limit and one regression check.',
    answer: 'With the supplied reviewer account, an unrestricted root interpreter grant permitted a protected synthetic file read after a denied baseline. No production data or arbitrary OS execution was tested in this browser simulator. Remove the broad grant or replace it with an immutable narrow helper, then verify legitimate reviewer login succeeds while privileged execution and protected-file reads fail.',
    mistakes: ['Equating a valid JSON report with a technically correct finding.', 'Calling a retest successful when normal functionality is also broken.', 'Claiming the simulator repaired the original application flaw when it repaired only the follow-on host.'],
    sources: references, labs: ['campaign-hypothesis-and-retest', 'campaign-scope-to-impact'],
    quiz: [{ prompt: 'Why does a retest need a positive control?', choices: ['To increase the number of commands', 'To show the legitimate workflow still works while abuse is denied', 'To hide a failed exploit', 'Because every fix must grant root'], correctIndex: 1, explanation: 'A denied exploit alone could result from a broken service or disabled identity, rather than a correct control.' }],
  },
];
