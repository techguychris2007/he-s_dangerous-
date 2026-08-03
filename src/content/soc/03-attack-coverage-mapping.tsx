import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function AttackCoverageMapping() {
  return (
    <div className="prose-hh">
      <h1>MITRE ATT&amp;CK Coverage Mapping in Practice</h1>
      <p>
        The SOC Fundamentals lesson introduced ATT&amp;CK as the SOC's shared vocabulary for adversary
        behavior. This lesson goes one step further: how a real SOC uses that vocabulary not just to label
        individual alerts, but to systematically answer a much bigger question — "across the entire attack
        lifecycle, where are we actually blind?"
      </p>

      <h2>From labeling one alert to mapping an entire program</h2>
      <p>
        Tagging a single incident with a technique ID ("detected T1547.001, Registry Run Keys persistence") is
        useful for that one investigation. A <strong>coverage map</strong> does the same thing at scale: a
        matrix of every technique in the ATT&amp;CK framework against whether the SOC has a working, tested
        detection for it at all.
      </p>
      <CodeBlock label="a simplified coverage map — rows are tactics, cells show detection status">{`TACTIC                COVERAGE STATUS
Initial Access          ████████░░  (strong: email gateway + web log detections)
Execution                ██████░░░░  (moderate: process-creation logging in place)
Persistence                █████░░░░░  (moderate: registry/scheduled-task monitoring)
Privilege Escalation         ███░░░░░░░  (weak: limited coverage)
Lateral Movement                ░░░░░░░░░░  (NONE — no detection currently exists)
Exfiltration                        ██░░░░░░░░  (weak: only volume-threshold alerting)`}</CodeBlock>
      <p>
        This single view answers a question no individual alert ever could: an attacker who gets past Initial
        Access here would currently walk through Lateral Movement completely undetected, all the way to
        Exfiltration, before anything in this environment has a real chance of catching them.
      </p>

      <h2>ATT&amp;CK Navigator: the real tool behind the map</h2>
      <p>
        The colored-bar visualization above isn't just illustrative — MITRE publishes a free, purpose-built
        web tool for exactly this called the <strong>ATT&amp;CK Navigator</strong>. It renders the full
        matrix (every tactic column, every technique underneath it) and lets a team color-code, annotate, and
        score each cell directly — the same coverage-status shading shown above, produced as a real,
        shareable, exportable layer file rather than a one-off spreadsheet.
      </p>
      <CodeBlock label="a Navigator layer file — the actual JSON format a coverage map is saved as">{`{
  "name": "Q3 2026 Detection Coverage",
  "domain": "enterprise-attack",
  "techniques": [
    { "techniqueID": "T1021.001", "score": 0, "comment": "No detection — RDP lateral movement" },
    { "techniqueID": "T1566.001", "score": 100, "comment": "Covered by email gateway + EDR" }
  ]
}`}</CodeBlock>
      <p>
        Because it's a standard file format, a Navigator layer can be diffed release to release — showing
        exactly which cells moved from red to green after a quarter's detection-engineering work, and
        exported directly into a report for the budget conversation the tip below describes.
      </p>

      <h2>Why this exact gap is so common in real environments</h2>
      <p>
        SOCs naturally build the strongest detection coverage around the stages that are easiest to log and
        the noisiest to attackers — email gateways and web-facing logs for Initial Access. Lateral Movement,
        by contrast, often rides over completely legitimate admin protocols (RDP, WMI, PsExec) using
        legitimate, already-valid credentials, making it both harder to instrument and harder to distinguish
        from routine administrative activity. This is exactly the gap that let the JPMorgan Chase 2014 breach
        spread from one missed server to 76 million households' worth of data — detection existed at neither
        the initial foothold nor the subsequent lateral movement.
      </p>

      <Callout variant="incident">
        <p>
          <strong>A concrete illustration:</strong> the NotPetya 2017 outbreak spread from a single compromised
          software update to tens of thousands of hosts within hours, almost entirely via Lateral Movement
          techniques (EternalBlue exploitation plus harvested credentials) that most organizations at the time
          had little to no dedicated detection for — Initial Access alone (the M.E.Doc update itself) was
          nearly impossible to have flagged in advance, which is exactly why detection at every SUBSEQUENT
          stage matters as much as detection at the front door.
        </p>
      </Callout>

      <h2>Using the map to prioritize detection engineering work</h2>
      <p>
        A coverage map turns "we should probably improve detection somewhere" into a ranked, defensible
        backlog: close the widest, most severe gaps first, rather than continuing to add redundant coverage to
        tactics that are already well-instrumented. This is the direct link between this lesson and the
        Detection Engineering module ahead — the coverage map tells you WHERE to point the next several rules
        you write.
      </p>
      <CodeBlock label="turning a gap into a prioritized backlog item">{`GAP IDENTIFIED:   Lateral Movement — zero detections currently exist
IMPACT IF EXPLOITED: total (attacker moves freely once past initial access)
NEXT ACTION:        write and backtest a detection rule for T1021 (Remote Services)
                     abuse — anomalous RDP/WMI usage outside normal admin patterns`}</CodeBlock>

      <h2>Coverage maps are never static</h2>
      <p>
        New techniques get added to ATT&amp;CK as they are observed in the wild, your own environment's
        logging capability changes as new tools are deployed, and attacker tradecraft itself shifts over time.
        Treating a coverage map as a one-time exercise rather than something reviewed on a recurring cadence
        (quarterly is typical) is the most common reason a SOC's stated coverage silently drifts away from its
        actual coverage.
      </p>

      <Callout variant="tip">
        <p>
          A coverage map is also one of the most effective artifacts for justifying security budget and
          headcount to non-technical leadership — "we are undefended against an entire attack stage" is a far
          more concrete, decision-forcing statement than a general request for "more security tooling."
        </p>
      </Callout>

      <p>
        With alert triage, threat hunting, and now systematic ATT&amp;CK coverage mapping established, the
        next lesson puts this vocabulary to work against a specific, high-frequency category of finding:
        recognizing command-and-control activity — beaconing, DNS tunneling, and LOLBin abuse — in raw logs.
      </p>
    </div>
  );
}
