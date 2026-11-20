import type { AdvancedLesson } from './LessonArticle';

const sources = [
  { title: 'OWASP — authorization guidance', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html' },
  { title: 'RFC 9700 — OAuth security best current practice', url: 'https://www.rfc-editor.org/rfc/rfc9700.html' },
  { title: 'OWASP — authorization regression testing', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Regression_Testing_Cheat_Sheet.html' },
];

export const identityLessons: AdvancedLesson[] = [
  {
    id: 'adv-identity-1', slug: 'actor-resource-action', title: 'Authorization as Actor, Resource, Action and Context',
    summary: 'Test horizontal, vertical and tenant boundaries using a controlled authorization matrix.',
    prerequisite: 'API authentication, IDOR fundamentals and hypothesis-driven testing.',
    outcomes: ['Create an authorization matrix from business rules.', 'Distinguish object ownership from role permissions.', 'Exercise a missing enforcement point with matched test identities.'],
    introduction: 'Authentication establishes who is making a request; authorization decides what that identity can do to a particular resource in a particular context. These decisions remain central whether the caller is a human, a service account or an autonomous agent. An identifier, an accepted token and a successful login answer different questions.',
    sections: [
      { title: 'Write the rule before testing the implementation', paragraphs: [
        'Express the rule as an actor, operation, resource and context tuple. A billing clerk may read invoices within its assigned tenant but cannot modify bank details or read a different tenant. A service may create an invoice without being able to list every existing invoice. Context can include ownership, workflow state, delegated scope and resource classification; a simple administrator/user distinction rarely captures the whole policy.',
        'Obtain controlled fixtures for permitted and denied cases. Use a customer’s own invoice as a positive control, a peer account’s synthetic invoice for horizontal isolation, a privileged action for vertical isolation and a different tenant record for tenant isolation. Predict the result of each row before testing. If the client cannot state the rule, record a policy ambiguity rather than inventing expected authorization.',
      ] },
      { title: 'Locate every enforcement point', paragraphs: [
        'Applications often authorize a browser page but forget the backing API, bulk export, background job or file-download path. Follow the operation to the component that actually reads or changes the resource. A front-end button being hidden does not constrain a directly issued request. Every route into the protected operation needs the intended check; alternate methods and asynchronous workers can create separate enforcement points.',
        'Compare response content and effect, not only status. A denied response that includes the full object is still a disclosure. A successful response with an empty synthetic fixture may not establish the intended read. For writes, use dedicated reversible objects and verify the resulting state under the agreed limits. Do not mutate another tenant’s real resource to make a proof more convincing.',
      ], code: '# Meridian controlled actor: synthetic tenant A\ncurl "http://10.77.3.10/invoice?tenant=A"\ncurl "http://10.77.3.10/invoice?tenant=B"\n# The same actor and operation; only resource ownership changes.\n# The second response demonstrates the configured ownership failure.', codeLabel: 'Supported tenant-isolation comparison' },
      { title: 'Regression coverage follows the matrix', paragraphs: [
        'After repair, repeat the allowed and denied rows rather than only the originally reported identifier. Include alternate representations of the resource, bulk operations and background paths when the real system supports them. A stable rule such as “subject tenant must be permitted for object tenant” gives engineers a stronger regression target than blocking one resource ID. Deny by default where no rule grants access.',
      ] },
    ],
    comparison: { columns: ['Boundary', 'Controlled comparison', 'Expected invariant'], rows: [
      ['Horizontal', 'Same role, different owner', 'Role equality does not imply object access'],
      ['Vertical', 'User versus privileged operation', 'Action requires the intended authority'],
      ['Tenant', 'Same principal, tenant A versus B object', 'Resource access stays inside granted tenant context'],
    ] },
    caseStudy: { scenario: 'Meridian serves invoice B-100 to the synthetic tenant-A principal when its tenant parameter changes.', analysis: 'The matched requests establish an ownership decision failure at the invoice route. They do not establish write access, enumeration of arbitrary records or gateway administrator access. Those require separate evidence.', decision: 'Report the exact actor-resource mismatch, recommend a server-side ownership rule and add matrix rows for permitted own-tenant reads and denied peer-tenant reads.' },
    exercise: 'A service account may create invoices for tenant A. Does that imply it may read all tenant A invoices? Add two matrix rows.',
    answer: 'No. Create and read are separate actions. One row should allow creation of an approved synthetic invoice; another should deny reads of existing invoices unless the policy explicitly grants that operation. If the intended rule is unknown, resolve the ambiguity with the owner before concluding a vulnerability.',
    mistakes: ['Treating a valid token as authorization for every object.', 'Using only role names and ignoring resource ownership.', 'Ignoring asynchronous and bulk enforcement points.'],
    sources, labs: ['campaign-tenant-boundary'],
    quiz: [{ prompt: 'Which comparison isolates horizontal authorization?', choices: ['Different accounts and different endpoints', 'Same role and operation, controlled objects with different owners', 'Unauthenticated scan of every port', 'A different HTTP status without response inspection'], correctIndex: 1, explanation: 'The controlled ownership change tests whether same-role peers can access each other’s resources.' }],
  },
  {
    id: 'adv-identity-2', slug: 'claims-and-token-boundaries', title: 'Claims, Tokens and the Boundary Between Identity and Authority',
    summary: 'Reason about issuer, audience, freshness, delegation and trusted identity propagation.',
    prerequisite: 'JWT structure and HTTP request headers; authorization matrix design.',
    outcomes: ['Separate token authenticity from appropriate use at a resource.', 'Identify unverified identity propagation through proxies.', 'Plan tests for audience, context and authorization without forging production tokens.'],
    introduction: 'A claim is a statement made by some component. Its security value depends on who made it, how the receiver verifies it and whether it applies to the current action. A token signed by a trusted issuer can still be inappropriate for a different resource, and a header named “trusted role” is not self-authenticating.',
    sections: [
      { title: 'Ask who attests to each property', paragraphs: [
        'For a token-based request, identify issuer, intended recipient, subject, expiry and delegated permissions. Check how the resource server validates authenticity and how it maps those claims to its local authorization policy. A token issued for one API is not automatically a credential for another. Authenticity, freshness and allowed use are distinct requirements; none eliminates the need to authorize the requested resource and action.',
        'Opaque session handles and signed tokens have different lifecycle properties. A server-side session can be revoked through its stored state, while a self-contained token may continue to be accepted until expiry unless the system implements another revocation mechanism. Evaluate the actual design instead of assuming logout invalidates all issued authority. Use supplied identities and test tokens for these lifecycle checks.',
      ] },
      { title: 'Identity propagation creates a second boundary', paragraphs: [
        'A proxy can authenticate a client and forward an identity assertion to an origin. The origin must distinguish assertions from that proxy from caller-controlled inputs. If the origin is publicly reachable or the proxy preserves an incoming identity header, a client may supply the claim itself. Determine the network path and header handling separately: stripping a header at one edge does not repair an alternative path to the origin.',
        'Authorization must still be bound to the actual operation. Even a genuine operator claim should not imply unrestricted access to every administrative object. Establish a denied baseline, then change only the claim used by the configured trust failure. Document whether the failure is unauthenticated assertion acceptance, excessive delegated authority or missing resource authorization.',
      ], code: 'curl http://10.77.4.10/admin\ncurl -H "X-Trusted-Role: operator" http://10.77.4.10/admin\n# Relay intentionally trusts a caller-supplied claim.\n# This is not a token-signature bypass or an OAuth protocol exploit.', codeLabel: 'Supported origin identity-trust test' },
      { title: 'Review protocols with current guidance', paragraphs: [
        'The long-lived concept is binding authority to issuer, receiver, identity and intended operation. Specific OAuth flows, token validation options and client protections evolve, so compare the real implementation with current protocol guidance before testing. A lesson about token boundaries should never promise that one remembered recipe will be sufficient for fifteen years. Preserve the reasoning and refresh the implementation details.',
      ] },
    ],
    comparison: { columns: ['Property', 'Question', 'Failure class'], rows: [
      ['Authenticity', 'Who attested and is the assertion intact?', 'Unverified or incorrectly verified claim'],
      ['Applicability', 'Is this receiver an intended recipient?', 'Cross-resource token acceptance'],
      ['Authorization', 'May this subject perform this action here?', 'Valid identity with excessive or missing access checks'],
    ] },
    caseStudy: { scenario: 'Relay denies a normal origin request but discloses the synthetic operator record when an unverified role header is added.', analysis: 'The origin treats attacker-controlled request data as an identity assertion. The result is not evidence that cryptography failed; no token signature was exercised.', decision: 'Bind origin identity assertions to an authenticated proxy path, remove caller-controlled assertions, restrict alternate origin exposure and retest direct and proxied paths in the real deployment.' },
    exercise: 'A signed token for API A is accepted by API B. What three independent checks should the finding discuss?',
    answer: 'Discuss issuer/signature validation, applicability to API B through the intended recipient or audience rules, and the subject’s permission for the specific resource and action. A correct signature alone answers only whether the trusted issuer made the assertion, not whether API B should honor it.',
    mistakes: ['Calling every identity-trust failure a JWT attack.', 'Assuming logout revokes every token by default.', 'Repairing only a proxy header while leaving the origin directly reachable.'],
    sources, labs: ['campaign-trusted-proxy'],
    quiz: [{ prompt: 'A valid signature on a token establishes what by itself?', choices: ['Every action is allowed', 'The configured issuer made the intact assertion', 'The token is intended for every API', 'Logout has revoked it'], correctIndex: 1, explanation: 'Recipient, freshness and resource authorization remain separate checks.' }],
  },
  {
    id: 'adv-identity-3', slug: 'delegation-and-confused-deputies', title: 'Delegation, Service Identities and Confused Deputies',
    summary: 'Trace how a low-trust request can borrow a higher-trust component’s authority.',
    prerequisite: 'SSRF, service accounts and actor-resource-action authorization.',
    outcomes: ['Model caller authority separately from worker authority.', 'Identify destination and action decisions at delegation boundaries.', 'Recommend checks that remain outside untrusted data and model output.'],
    introduction: 'A confused deputy performs an operation using its own authority when the requester was never entitled to that operation. The deputy can be a preview worker, build runner, cloud service or AI agent. Testing the delegation contract is more durable than memorizing endpoint-specific payloads.',
    sections: [
      { title: 'Map the deputy’s borrowed capability', paragraphs: [
        'Identify the caller, the requested action, the deputy’s effective identity and the protected resource. A public user can legitimately ask a preview worker to fetch a page; the worker may have network access to internal configuration that the user does not. The flaw appears when the user controls a destination or action that is executed with the worker’s broader capability without an appropriate authorization decision.',
        'Not every privileged worker is defective. A deputy can safely perform a narrowly authorized operation using a capability that the client never directly receives. Ask whether the caller can choose arbitrary objects, destinations or methods beyond the intended contract. A security boundary should limit both the resource and operation rather than relying on the caller to behave like the normal interface.',
      ] },
      { title: 'Use a minimal privileged resource as the test target', paragraphs: [
        'Choose an internal synthetic endpoint or dedicated canary whose disclosure is sufficient to prove the mismatch. Compare a legitimate public request with the one controlled privileged destination. Avoid sweeping internal ranges, probing unrelated administration services or collecting broad metadata simply because the worker can reach them. Stop once the agreed boundary failure is demonstrated.',
        'In a real URL-fetching implementation, destination validation has to account for parsing, redirects, resolved addresses and network policy. A textual block on one hostname can leave equivalent destinations or later redirects available. The durable rule is that the deputy must not exercise a forbidden capability, regardless of how the requester represents it.',
      ], code: 'Caller: public preview customer\nIntended operation: render an approved public page\nDeputy: preview-worker identity\nUnexpected operation: read internal configuration\nProof: synthetic internal record returned to caller\nRepair: authorize destination and action; constrain worker reachability', codeLabel: 'A delegation-boundary model' },
      { title: 'Transfer the model to agents and pipelines', paragraphs: [
        'An agent that reads untrusted documents and chooses tools is also a deputy. A build runner that processes a contributor’s change under a release credential is another. In both cases, content can influence a decision executed with a more powerful identity. Enforce authority at the tool or deployment boundary, preserve provenance of untrusted input and use separate identities for untrusted evaluation and privileged publication.',
      ] },
    ],
    comparison: { columns: ['Deputy', 'Low-trust influence', 'Authority to constrain'], rows: [
      ['Preview worker', 'URL and redirects', 'Destination, method and returned content'],
      ['Delivery runner', 'Change content and workflow inputs', 'Secrets, artifact publication and deployment'],
      ['Agent tool caller', 'Retrieved text or model-generated arguments', 'Action authorization and resource scope'],
    ] },
    caseStudy: { scenario: 'Courier’s public preview route returns an internal synthetic configuration marker when given the configured loopback URL.', analysis: 'The response shows that caller-selected input can cause a worker-authority read. The deterministic route does not emulate real DNS, HTTP redirects, arbitrary internal scanning or cloud metadata credentials.', decision: 'Report the caller/deputy authority mismatch, then define real-environment tests for destination validation and egress policy rather than treating this one trigger as complete SSRF coverage.' },
    exercise: 'A document-reading assistant can approve invoices using its service token. Where should permission be checked?',
    answer: 'At the invoice action boundary using a verifiable caller identity, resource and allowed operation. A document or model output must not grant new authority. Separate reading from approval, require narrowly scoped capabilities and log which principal authorized the final action.',
    mistakes: ['Giving every worker the same broad identity.', 'Treating input sanitization as the entire delegation policy.', 'Assuming model instructions can replace tool-level authorization.'],
    sources, labs: ['campaign-fetch-worker', 'campaign-trusted-proxy'],
    quiz: [{ prompt: 'Which fact best identifies a confused-deputy failure?', choices: ['The worker has any privilege', 'The worker is slow', 'A low-authority caller controls a protected operation performed under the worker’s broader authority', 'The application uses HTTPS'], correctIndex: 2, explanation: 'The mismatch is between requester entitlement and authority exercised by the deputy.' }],
  },
  {
    id: 'adv-identity-4', slug: 'identity-lifecycle-and-trust-graphs', title: 'Identity Lifecycles, Revocation and Trust Graphs',
    summary: 'Assess where authority comes from, how long it lasts and which edge a fix must remove.',
    prerequisite: 'Token and delegation boundaries; minimal impact proof.',
    outcomes: ['Separate authentication material, active sessions and authorization grants.', 'Identify lifecycle gaps left by incomplete secret rotation.', 'Design a retest around least privilege and account handback.'],
    introduction: 'An identity is more than its password. Its authority can come from groups, delegated roles, live sessions, service policies and resource-specific grants. A durable assessment follows these relationships over time: issuance, use, elevation, revocation and cleanup.',
    sections: [
      { title: 'Inventory the sources of effective authority', paragraphs: [
        'Start from the supplied principal and trace direct and inherited grants. Record role membership, resource policies, delegation edges and the application’s own authorization logic. A role display name is not a permission proof; the actual decision may combine several controls. Identify the weakest necessary edge for the business objective rather than assuming a broad-looking policy makes every downstream action possible.',
        'For each credential or token, identify storage location, issuance process, intended use and expiry. For each session, determine whether its authority is snapshotted or reevaluated. A policy change can remove future grants while an already privileged process continues operating. Treat fresh authentication and existing sessions as separate retest conditions.',
      ] },
      { title: 'Revoke the capability, not just its visible artifact', paragraphs: [
        'Deleting an exposed configuration does not invalidate a secret that was already copied. Rotating a password may not terminate existing application sessions. Removing a role may not revoke a token with previously granted scope before its expiry. The exact behavior is implementation-dependent; define a revocation test with controlled fixtures rather than assuming all three events are equivalent.',
        'Use a rotation dependency map for services that share a credential. Coordinate changes so the legitimate workflow survives, then prove that the old credential is denied and the approved replacement works. Record outstanding sessions and background jobs that could retain authority. This produces an engineering plan instead of a vague instruction to rotate everything.',
      ] },
      { title: 'Build a handback checklist from identity state', paragraphs: [
        'At closeout, inventory temporary accounts, delegated grants, approved artifacts and active sessions. Revoke the temporary identity, remove the agreed artifacts, close target sessions and retain the evidence report. In the campaign engine, remediation closes prior target sessions but preserves reviewer login for negative controls; cleanup then removes that account. Those are two separate lifecycle steps by design.',
      ], code: 'Before repair: reviewer authenticates; privileged execution allowed\nAfter repair: reviewer authenticates; protected operations denied\nAfter handback: reviewer account revoked; target sessions closed\nEvidence retained: report and synthetic proof references\nReal-system follow-up: test token expiry and session invalidation separately', codeLabel: 'Privilege repair versus identity handback' },
    ],
    comparison: { columns: ['Action', 'Capability changed', 'Separate follow-up'], rows: [
      ['Remove broad grant', 'Future privileged execution', 'Existing elevated sessions'],
      ['Rotate password', 'Future password authentication', 'Tokens, cached credentials and application sessions'],
      ['Remove exposed artifact', 'Future public disclosure', 'Already acquired credential validity'],
    ] },
    caseStudy: { scenario: 'A Relay administrator removes a dangerous grant but leaves the already elevated test session open.', analysis: 'The new grant is gone, but the old process may retain authority. A retest from that session can produce a misleading result. A fresh low-privilege session is needed to verify future access, and the elevated session must be addressed separately.', decision: 'Close prior sessions, authenticate as the unchanged low-privilege identity, confirm allowed login plus denied protected operations, and revoke the temporary test identity at handback.' },
    exercise: 'An exposed service credential is removed from a public artifact. What must be checked before calling the issue closed?',
    answer: 'Confirm the artifact is no longer publicly available, rotate or revoke the disclosed credential, verify legitimate services use the replacement, test that the old credential no longer authenticates, and consider existing tokens or sessions that may retain authority. Note any conditions that cannot be tested in scope.',
    mistakes: ['Assuming file deletion equals credential revocation.', 'Retesting only from an already elevated session.', 'Using a shared production identity for a temporary assessment.'],
    sources, labs: ['campaign-tenant-boundary', 'campaign-trusted-proxy'],
    quiz: [{ prompt: 'Why does the simulator close prior target sessions during remediation?', choices: ['To erase the report', 'To prevent stale elevated authority from confusing the fresh-login retest', 'To prove OAuth is secure', 'To bypass the initial finding'], correctIndex: 1, explanation: 'Policy repair and existing-session authority are different lifecycle concerns.' }],
  },
];
