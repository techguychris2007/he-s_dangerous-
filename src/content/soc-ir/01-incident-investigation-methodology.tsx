import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function IncidentInvestigationMethodology() {
  return (
    <div className="prose-hh">
      <h1>Incident Investigation Methodology</h1>
      <p>
        A confirmed detection is the beginning of an investigation, not the end of one. This lesson covers the
        methodology real analysts use to go from "an alert fired" to a fully-scoped, documented incident —
        who was affected, what they accessed, how they got in, and what has to happen next.
      </p>

      <h2>The core investigative questions</h2>
      <CodeBlock label="every investigation answers these, roughly in this order">{`WHO      accessed what, using which credential/account?
FROM WHERE  did the access originate (IP, device, geography)?
WHEN         exactly did each stage occur — build a timeline, not just a single timestamp?
WHAT           was actually touched, read, modified, or exfiltrated?
HOW               did the initial access happen — the root cause, not just the symptom?`}</CodeBlock>
      <p>
        Notice that "how" — root cause — comes last, not first. A common mistake under time pressure is
        jumping straight to remediation before the actual entry point is understood, which routinely leads to
        re-compromise through the exact same hole days or weeks later.
      </p>

      <h2>Building a timeline: the analyst's central artifact</h2>
      <p>
        A timeline is a single, chronologically ordered merge of every relevant event across every log
        source — authentication, process execution, network connections, file access — so the SEQUENCE
        becomes obvious instead of requiring the analyst to hold a dozen separate tool outputs in their head
        at once.
      </p>
      <CodeBlock label="the exact shape a real timeline takes (compressed from the Splunk ransomware kill-chain lab)">{`09:12  email_gateway   phishing link clicked
09:14  edr              malware detonation, C2 callback established
09:22  ad_audit         new Domain Admin account created
09:31  file_audit       mass file encryption begins across two hosts

-> five minutes of correlation work turns four isolated log lines from four
   different sources into one unambiguous kill-chain narrative.`}</CodeBlock>

      <h2>Scoping: answering "how bad is this, exactly"</h2>
      <p>
        Scoping means determining the full blast radius — every account, host, and data set touched, not just
        the first one discovered. Real incidents are frequently under-scoped initially: the JPMorgan Chase
        2014 breach started at a single server missing MFA enforcement, but the actual scope was 76 million
        households once lateral movement from that one server was fully traced.
      </p>
      <Callout variant="warn">
        <p>
          Always assume initial scoping is incomplete until proven otherwise. "We found one compromised
          account" is a starting point for the investigation, not a conclusion — the correct next question is
          always "what else did this account, or this initial foothold, actually reach."
        </p>
      </Callout>

      <h2>Evidence handling and chain of custody</h2>
      <p>
        For any incident that might result in legal action, HR proceedings, or regulatory reporting, evidence
        needs a documented chain of custody — who collected it, when, and how it has been stored since,
        exactly the same standard applied in the digital forensics module. Investigation and formal forensics
        overlap heavily; the difference is largely one of rigor and eventual audience (an internal report
        versus evidence that might be presented in court).
      </p>

      <h2>Root cause analysis: the step that actually prevents recurrence</h2>
      <p>
        A root cause is the underlying condition that made the incident possible at all — not the specific
        technique used, but the gap that let it work. The JPMorgan breach's root cause was an incomplete asset
        inventory, not a sophisticated exploit; the Colonial Pipeline ransomware's root cause was a legacy VPN
        account with no MFA and a reused password, not a novel attack technique. Fixing the SYMPTOM (this one
        malware sample, this one compromised account) without fixing the ROOT CAUSE (the missing MFA rollout
        coverage, the incomplete inventory) all but guarantees a similar incident recurs.
      </p>

      <Callout variant="tip">
        <p>
          A useful discipline: for every incident, write down the root cause in one sentence before writing
          the remediation plan. If the sentence describes a specific attacker action ("they used a phishing
          email"), keep asking "why did that work" until you reach an actual organizational gap ("this account
          had no MFA enrolled") — that gap, not the attacker's specific choice of technique, is what the fix
          needs to target.
        </p>
      </Callout>

      <p>
        With investigation methodology covered, the next lesson turns to acting on a confirmed finding
        immediately and consistently, every time — SOAR, the automation layer that turns a documented response
        plan into something that executes in seconds rather than waiting on a human being available and fast
        enough to react manually.
      </p>
    </div>
  );
}
