import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function SoarAutomation() {
  return (
    <div className="prose-hh">
      <h1>SOAR: Security Orchestration, Automation &amp; Response</h1>
      <p>
        Detecting a threat and actually doing something about it are two different problems, and the gap
        between them is where a lot of real damage happens — a correct detection at 3 AM is worthless if the
        response waits eight hours for a human to wake up and act on it. SOAR platforms close that gap by
        executing a pre-approved sequence of actions automatically, the instant a high-confidence detection
        fires.
      </p>

      <h2>Orchestration, automation, and response — three different words for a reason</h2>
      <CodeBlock label="what each word in SOAR actually means">{`ORCHESTRATION  — connecting many separate security tools (SIEM, firewall, IAM, ticketing)
                  so they can be driven from one place instead of each needing manual login
AUTOMATION      — executing a sequence of actions without a human clicking each step
RESPONSE         — the actual containment/remediation actions themselves`}</CodeBlock>

      <h2>A playbook: automation with a name and a defined trigger</h2>
      <p>
        A SOAR "playbook" is a documented, pre-approved sequence of actions tied to a specific trigger
        condition — written and approved BEFORE any incident happens, so there is no ambiguity or hesitation
        about whether an automated action is authorized in the moment it fires.
      </p>
      <CodeBlock label="the exact playbook the QRadar SOAR lab has you review">{`TRIGGER:  impossible_travel_alert (high confidence)

PLAYBOOK PB-0042:
  1. Disable the affected user account
  2. Block the source IP at the perimeter firewall
  3. Force a password reset
  4. Create an incident ticket

Automated completion time:  under 8 seconds
Typical manual completion time for the same 4 steps:  ~22 minutes`}</CodeBlock>
      <Callout variant="tip">
        <p>
          That time comparison is the entire value proposition of SOAR in one line: the same four actions,
          performed identically either way, but 8 seconds versus 22 minutes of continued attacker access to a
          compromised account. In a fast-moving incident (credential-stuffing, ransomware deployment), that
          gap is frequently the difference between "contained before real damage" and "too late."
        </p>
      </Callout>

      <h2>What belongs in an automated playbook — and what doesn't</h2>
      <p>
        Not every response action is safe to fully automate. A reasonable rule of thumb: automate reversible,
        low-collateral-damage actions on very high-confidence triggers; require human approval for anything
        destructive, hard to reverse, or triggered by a detection with a meaningful false-positive rate.
      </p>
      <ul>
        <li><strong>Good automation candidates:</strong> disabling an account, blocking a single IP, forcing a
        password reset, opening a ticket — all quickly reversible if the trigger turns out to be a false
        positive.</li>
        <li><strong>Needs human approval:</strong> isolating an entire production server from the network,
        wiping a device, or anything affecting business-critical availability — the cost of a false-positive
        automated action here can exceed the cost of the incident it was meant to prevent.</li>
      </ul>

      <h2>The platforms you'll actually see named in job postings and reports</h2>
      <p>
        <strong>Splunk SOAR</strong> (formerly Phantom) and <strong>Palo Alto Cortex XSOAR</strong> (formerly
        Demisto) are the two long-standing dedicated SOAR platforms most enterprise SOCs reference by name —
        both center on exactly the visual playbook-builder concept this lesson describes, with a large
        marketplace of pre-built integrations for common tools (firewalls, EDR, ticketing). Microsoft Sentinel
        takes a different path: rather than a separate product, its <strong>Playbooks</strong> are built
        directly on Azure Logic Apps, meaning Sentinel's automation is really general-purpose cloud workflow
        automation repurposed for security — powerful and deeply integrated with the rest of Azure, at the
        cost of a steeper learning curve than a purpose-built security tool for a team not already fluent in
        Logic Apps.
      </p>

      <h2>Human-in-the-loop vs. fully automated</h2>
      <p>
        Many real SOAR deployments use a hybrid model: the playbook drafts and stages every action
        automatically, but a human analyst clicks one "approve" button to execute — keeping the speed benefit
        of pre-built automation while retaining a checkpoint against a false-positive trigger doing real
        damage. As confidence in a specific playbook's reliability grows over months of production use, teams
        often graduate it from human-approved to fully automatic.
      </p>

      <Callout variant="warn">
        <p>
          Every automated playbook needs its own rollback plan, tested in advance — if a playbook disables an
          account based on a detection that later turns out to be a false positive, "how do we quickly and
          correctly undo this" needs an answer that already exists, not one improvised under pressure with an
          angry, locked-out executive on the phone.
        </p>
      </Callout>

      <p>
        With automated response covered, the final lesson in this module turns to a less exciting but equally
        essential SIEM function: generating the compliance reports that PCI-DSS, HIPAA, SOC 2, and similar
        frameworks require — proof that all of this detection and response capability is actually being
        exercised, not just theoretically available.
      </p>
    </div>
  );
}
