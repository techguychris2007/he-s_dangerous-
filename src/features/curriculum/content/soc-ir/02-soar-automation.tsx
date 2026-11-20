import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

const incidentFlow = [
  'SIEM detection',
  '   |',
  '   v',
  'Normalize fields -> attach alert ID and source evidence',
  '   |',
  '   v',
  'Enrich: identity, asset owner, recent sign-ins, endpoint status',
  '   |',
  '   v',
  'Deduplicate and correlate related alerts',
  '   |',
  '   v',
  'Evaluate confidence, impact, and required approvals',
  '   |',
  '   +---- uncertain / high impact ----> analyst review',
  '   |',
  '   +---- approved low-risk action ---> execute with limits',
  '                                          |',
  '                                          v',
  '                              verify result -> audit -> close/escalate',
].join('\n');

const playbook = [
  'name: suspicious_sign_in_triage',
  'trigger: normalized identity alert with stable event_id',
  'mode: dry_run_by_default',
  'deduplication_key: tenant_id + event_id',
  '',
  'steps:',
  '  - validate_required_fields',
  '  - enrich_identity_and_device_context',
  '  - check_recent_successful_authentication',
  '  - calculate_confidence_and_business_impact',
  '  - create_or_update_incident_record',
  '  - if confidence_is_high_and_action_is_preapproved:',
  '      request_analyst_approval',
  '      perform_scoped_reversible_action',
  '      verify_action_and_record_result',
  '  - else:',
  '      route_to_analyst_with_evidence',
  '',
  'limits:',
  '  max_affected_identities: 1',
  '  production_changes_require_approval: true',
  '  retries: bounded_with_backoff',
  '  timeout: explicit',
  '  rollback: documented_and_tested',
  '  audit_log: append_only',
].join('\n');

const safeSimulation = [
  'from dataclasses import dataclass',
  'from enum import Enum',
  '',
  'class State(Enum):',
  '    RECEIVED = "received"',
  '    REVIEW = "review"',
  '    APPROVAL_REQUIRED = "approval_required"',
  '    DRY_RUN = "dry_run"',
  '    COMPLETE = "complete"',
  '    FAILED = "failed"',
  '',
  '@dataclass',
  'class Alert:',
  '    event_id: str',
  '    user_id: str',
  '    confidence: float',
  '    business_impact: str',
  '    source: str',
  '',
  'def triage(alert: Alert, seen_ids: set[str], dry_run: bool = True):',
  '    """Simulate triage only; this function has no live-system connector."""',
  '    if not alert.event_id or not alert.user_id:',
  '        return State.FAILED, "required evidence is missing"',
  '    if alert.event_id in seen_ids:',
  '        return State.REVIEW, "duplicate linked to the existing incident"',
  '    if not 0.0 <= alert.confidence <= 1.0:',
  '        return State.FAILED, "confidence must be between 0 and 1"',
  '    if alert.business_impact in {"critical", "high"}:',
  '        return State.APPROVAL_REQUIRED, "human review required"',
  '    if alert.confidence < 0.90:',
  '        return State.REVIEW, "confidence is below the approved threshold"',
  '    if dry_run:',
  '        return State.DRY_RUN, "would request a scoped action; none was executed"',
  '    return State.APPROVAL_REQUIRED, "execution is intentionally not implemented"',
  '',
  'demo = Alert("evt-1042", "user-17", 0.93, "medium", "identity-provider")',
  'state, note = triage(demo, seen_ids=set(), dry_run=True)',
  'print(state.value, note)',
].join('\n');

export default function SoarAutomation() {
  return (
    <article className="prose-hh">
      <h1>SOAR: Building Safe, Auditable Security Automation</h1>
      <p>
        Security Orchestration, Automation, and Response (SOAR) connects security tools and turns repeatable
        analyst procedures into workflows. A playbook may enrich an alert with identity and asset context,
        create or update a case, ask an analyst for a decision, and call an approved integration. SOAR can reduce
        repetitive work, but speed is only useful when evidence, permission, failure handling, and accountability
        remain clear. An automated workflow can also repeat a bad assumption faster than a person.
      </p>

      <h2>What each part means</h2>
      <ul>
        <li><strong>Orchestration</strong> coordinates systems that otherwise require separate interfaces: SIEM,
          identity provider, endpoint detection, threat-intelligence service, ticketing, and chat notification.</li>
        <li><strong>Automation</strong> performs deterministic steps such as validating a field, enriching an
          alert, deduplicating a case, or collecting status without a human repeating each click.</li>
        <li><strong>Response</strong> is the decision and resulting action. Some response is informational, such
          as routing a case; other actions affect access or availability and need stronger control.</li>
      </ul>
      <p>
        SOAR is not a substitute for a SIEM, an incident response plan, or sound detections. A playbook cannot
        repair an alert that has the wrong entity mapping, stale asset inventory, unreliable timestamps, or an
        unclear owner. Good automation starts with a well-defined process and trustworthy inputs.
      </p>

      <h2>How an alert becomes a controlled workflow</h2>
      <p>
        Products use different names, but the workflow usually has a trigger, a normalized event, one or more
        enrichment and decision steps, approved actions, and a record of the result. The workflow should have a
        clear stop condition and route uncertainty to a person rather than guessing.
      </p>
      <CodeBlock label="A safe triage workflow">{incidentFlow}</CodeBlock>
      <p>
        Normalization maps different vendor fields into a consistent internal record. One source may call a
        value <code>userPrincipalName</code>, another <code>account</code>, and another <code>actor</code>.
        Before enrichment or response, define canonical fields such as event ID, tenant, user, source address,
        event time in UTC, device, detection name, and evidence links. Preserve the original event alongside
        normalized values so an analyst can trace a transformation instead of trusting a rewritten summary.
      </p>

      <h2>Design a playbook as a decision system</h2>
      <p>
        Each action should have an explicit purpose, required evidence, decision threshold, scope, permission,
        timeout, retry policy, and success check. “The alert says impossible travel” is not sufficient proof that
        an account is compromised. VPN egress, mobile-network routing, clock skew, shared credentials, and
        legitimate travel can produce confusing signals. Enrichment helps the analyst evaluate context; it
        does not convert a signal into certainty.
      </p>
      <CodeBlock label="Example playbook specification: triage first, gate consequential actions">{playbook}</CodeBlock>
      <p>
        This is a design example, not a configuration that can be imported into a particular SOAR product. A
        production playbook must map each step to the platform's supported connector, permissions, error model,
        and approval control. Keep credentials in the platform's secrets manager and grant an integration only
        the API scopes that its task requires.
      </p>

      <h2>Choosing what to automate</h2>
      <p>
        Automation risk depends on reversibility, blast radius, confidence in the trigger, and business context.
        A notification or case update is usually lower impact than changing a user's access. A broad network
        block or isolating a critical server may interrupt legitimate work or safety operations. The right
        design makes the impact visible and sets an approval boundary before an incident occurs.
      </p>
      <ul>
        <li><strong>Usually suitable for unattended automation:</strong> parse and validate evidence, enrich a
          case, add duplicate relationships, notify the assigned queue, or collect read-only status.</li>
        <li><strong>Often suitable after testing and a narrow policy:</strong> temporarily quarantine a single
          low-risk training endpoint or revoke a short-lived token, provided scope and recovery are proven.</li>
        <li><strong>Require explicit human control in many environments:</strong> disable privileged or shared
          accounts, block broad address ranges, isolate production systems, delete data, or make changes that
          can affect patient care, industrial processes, payroll, or customer availability.</li>
      </ul>
      <p>
        “Reversible” is not the same as “harmless.” A temporary account lock may prevent a shift worker from
        accessing a safety system. Human approval should include enough context to make a meaningful decision:
        affected person and asset, alert evidence, confidence and uncertainty, business owner, proposed scope,
        expected impact, expiry, and rollback steps.
      </p>

      <h2>Reliability engineering for playbooks</h2>
      <h3>Idempotency and duplicate events</h3>
      <p>
        SIEMs and connectors may deliver the same alert more than once. An idempotent playbook recognizes a
        stable event or case identifier and avoids repeating side effects. For example, a duplicate should attach
        evidence to an existing case rather than open five cases or repeat an access change. Store the action
        result and correlation ID so a retry can determine whether the earlier request succeeded.
      </p>
      <h3>Timeouts, retries, and partial failure</h3>
      <p>
        Integrations can be slow or unavailable. Set a timeout for each external call, bound retries, use
        backoff for transient failures, and stop retrying when a response is ambiguous. A timeout does not prove
        that the remote system failed to perform the action; the request might have succeeded while the response
        was lost. Query current state before retrying any consequential operation.
      </p>
      <h3>State and verification</h3>
      <p>
        A playbook should distinguish “requested” from “completed.” After requesting an action, verify the
        resulting state from an authoritative source. If a connector returns an error or verification cannot
        establish the state, report “unknown” and route the case for review; do not claim the threat was
        contained. Preserve timestamps, input evidence, connector responses, approval identity, and state
        transitions in an audit record.
      </p>
      <CodeBlock label="A small Python dry-run model with no system connector">{safeSimulation}</CodeBlock>
      <p>
        Run this example in a local Python interpreter. It accepts a small in-memory alert, checks required
        fields and duplicate IDs, routes high-impact or lower-confidence cases for review, and defaults to a
        dry run. The final branch deliberately refuses to implement a live action. In production code, input
        validation should also check timestamp format, tenant and source identifiers, field length, allowed
        enumerations, and whether evidence came from a trusted integration.
      </p>

      <h2>Testing before release</h2>
      <p>
        Treat a playbook like production software. Start with unit tests for parsing and decision rules, then
        integration tests against sandbox accounts and mock services. Include expected alerts, benign lookalikes,
        missing fields, duplicate events, stale data, rate limits, permission failures, timeouts, malformed
        responses, and events arriving out of order. Test the approval path, denial path, rollback, and recovery
        procedure—not only the happy path.
      </p>
      <ol>
        <li><strong>Review the trigger:</strong> confirm its field mappings, threshold, schedule, suppression,
          and known false positives.</li>
        <li><strong>Use a sandbox:</strong> connect test identities and simulated assets before granting
          production credentials.</li>
        <li><strong>Dry-run:</strong> calculate what the playbook would do and compare it with analyst decisions
          without making changes.</li>
        <li><strong>Canary:</strong> enable for a small, low-risk cohort and monitor every decision and failure.</li>
        <li><strong>Release with a rollback:</strong> define a disable switch, credential revocation, action
          reversal, and on-call owner.</li>
        <li><strong>Revalidate:</strong> retest after connector, detection, schema, or platform changes.</li>
      </ol>

      <h2>Measure quality, not just speed</h2>
      <p>
        A low execution time is not evidence that the playbook is effective. Measure the percentage of cases
        routed correctly, duplicate rate, enrichment completeness, action verification rate, approval override
        rate, false-positive impact, time waiting for an analyst, connector error rate, and time to recover from
        an incorrect action. Break results down by detection and asset criticality; a good average can hide a
        dangerous failure in one high-impact workflow. Compare measurements over a defined period and document
        how they were calculated instead of publishing invented “seconds versus minutes” claims.
      </p>

      <h2>Worked example: suspicious sign-in</h2>
      <p>
        An identity detection reports a sign-in from a region not recently associated with an employee. The
        playbook first validates the event timestamp and tenant, resolves the account and device, checks recent
        successful sessions, and looks for known corporate VPN egress. It groups repeated detections into one
        case, attaches the source evidence, and shows the analyst which facts support and weaken the alert.
        Because the user is privileged, the proposed access change remains behind an approval step. If approved,
        the integration performs only the documented, scoped action and verifies the new state. If the connector
        times out, the case is marked action state unknown and routed to the identity response owner.
      </p>
      <p>
        Notice the separation of responsibilities: detection identifies a pattern, enrichment adds context,
        policy decides who can approve, the connector requests a change, and verification establishes the
        outcome. This gives an incident responder enough evidence to explain why an action occurred and how to
        reverse it.
      </p>

      <h2>Common failure patterns</h2>
      <ul>
        <li><strong>Unbounded automation:</strong> broad permissions and wildcard scope turn one noisy alert into
          a large outage.</li>
        <li><strong>Alert treated as fact:</strong> a detection label is repeated as a confirmed incident even
          when supporting evidence is weak.</li>
        <li><strong>No duplicate protection:</strong> retries create repeated cases or repeat side effects.</li>
        <li><strong>Success inferred from request:</strong> the playbook reports containment when it only sent
          an API request.</li>
        <li><strong>Secrets embedded in steps:</strong> credentials appear in code, logs, exported playbooks, or
          error messages.</li>
        <li><strong>Approval without context:</strong> an analyst is asked to approve an action without seeing
          affected assets, evidence, scope, or recovery steps.</li>
        <li><strong>Workflow drift:</strong> a connector or event schema changes, but the playbook keeps running
          with stale assumptions.</li>
      </ul>
      <Callout variant="warn">
        <p>
          Every playbook that changes access, network policy, or endpoint state needs a tested recovery path and
          an owner who can disable it. Confirm the action scope, approval policy, and rollback in a sandbox
          before connecting production credentials.
        </p>
      </Callout>

      <h2>Where SOAR fits in the security operation</h2>
      <p>
        SIEM correlates and prioritizes events; SOAR coordinates repeatable case work and approved integrations;
        endpoint and identity products enforce controls; analysts investigate context and make decisions that
        require judgment. Product boundaries differ, and many platforms bundle several of these functions.
        Evaluate a tool by its supported data sources, connector permissions, auditability, testing features,
        failure handling, and fit with the team's incident process—not by the “SOAR” label alone.
      </p>
      <p>
        As an analyst, you should be able to read a playbook from trigger to outcome, identify the permission
        used at each step, explain the approval boundary, tell requested from verified actions, and find the
        record needed to reconstruct what happened. The next lesson applies that evidence discipline to
        compliance reporting: a report should demonstrate what control was tested and what evidence supports
        the result, without overstating what the data proves.
      </p>
    </article>
  );
}
