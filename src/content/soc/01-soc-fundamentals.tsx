import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function SocFundamentals() {
  return (
    <div className="prose-hh">
      <h1>SOC Fundamentals: Alerts, Triage &amp; the Analyst Workflow</h1>
      <p>
        Everything covered so far in this course has been offensive. A Security Operations Center (SOC)
        analyst sits on the other side of the table — reading the same logs and traffic an attacker
        generates, trying to catch it in time. Understanding this side makes you a sharper attacker too:
        you'll know exactly what you're trying to avoid triggering.
      </p>

      <h2>What a SOC actually does all day</h2>
      <p>
        A SOC ingests telemetry from across an organization — firewall logs, endpoint detection (EDR),
        authentication logs, web server logs, DNS queries — into a SIEM (Security Information and Event
        Management platform), which correlates events and raises alerts when something matches a
        detection rule.
      </p>
      <CodeBlock label="a typical SOC alert lifecycle">{`1. TELEMETRY    — logs/events stream in from every system (auth, network, endpoint, web)
2. DETECTION     — a SIEM rule matches a pattern (e.g. "10+ failed logins in 60s from one IP")
3. ALERT          — a ticket is created for a Tier 1 analyst to triage
4. TRIAGE          — is this a true positive (real attack) or false positive (noisy but benign)?
5. INVESTIGATION    — if true positive: scope it — what else did this actor touch?
6. RESPONSE          — contain (block IP, disable account), eradicate, recover
7. DOCUMENTATION      — write up the incident for the record and for detection tuning`}</CodeBlock>

      <h2>The analyst's core tool: log correlation</h2>
      <p>
        Almost every SOC investigation boils down to the same skill exercised in the labs ahead:
        <code> grep</code>/<code>cat</code>-level reading of raw logs, correlating timestamps and IPs
        across multiple sources to build a timeline of what happened.
      </p>
      <CodeBlock label="the analyst's bread and butter">{`grep "Failed password" /var/log/auth.log          # isolate failed logins
grep <suspect-ip> /var/log/auth.log                  # everything that IP did
awk '{print $1}' access.log | sort | uniq -c | sort -rn   # count requests per IP — spot outliers
grep -E "union|select|--|<script" access.log            # quick web-attack signature sweep`}</CodeBlock>

      <h2>True positive vs. false positive</h2>
      <p>
        A huge part of Tier 1 SOC work is simply deciding whether an alert matters. A single failed login
        is normal — a typo happens. Fourteen failed logins from an unfamiliar foreign IP followed by a
        success is not. Context (volume, source reputation, timing, and what happened immediately after)
        is what separates noise from a real incident.
      </p>

      <Callout variant="tip">
        <p>
          When you triage an alert, always ask three questions: (1) Is this expected behavior for this
          system/user? (2) Did anything unusual happen immediately before or after? (3) If this is real,
          what's the blast radius — what else can this actor reach from here? You'll practice exactly this
          reasoning in the lab that follows.
        </p>
      </Callout>

      <h2>Indicators of Compromise (IOCs)</h2>
      <CodeBlock label="common IOC categories">{`Network IOCs   — malicious IPs, C2 domains, unusual outbound connections
Host IOCs        — unexpected processes, new scheduled tasks, modified system files
Email IOCs         — spoofed sender domains, malicious attachments, phishing infrastructure
Behavioral IOCs      — impossible travel (login from two countries in 5 minutes), off-hours access`}</CodeBlock>

      <h2>The MITRE ATT&amp;CK framework: the SOC's shared language</h2>
      <p>
        Once you've triaged a handful of alerts, you notice the same question keeps coming up: what stage
        of an intrusion is this, exactly? "Suspicious PowerShell" isn't precise enough to compare across
        analysts, tools, or organizations. MITRE ATT&amp;CK solves that by giving the entire industry a
        shared, numbered vocabulary for adversary behavior — a matrix of <strong>Tactics</strong> (the
        attacker's goal at a given stage, e.g. "get in," "stay persistent," "move sideways") and, under each
        tactic, specific <strong>Techniques</strong> and <strong>Procedures</strong> (the concrete way that
        goal gets achieved). It's effectively a much more granular, non-linear successor to the old
        "cyber kill chain" idea, built from real observed intrusions rather than a theoretical model.
      </p>
      <CodeBlock label="a slice of the ATT&CK Enterprise matrix — tactic columns, with example techniques underneath each">{`Initial Access        Execution           Persistence            Privilege Escalation
------------------    ----------------    -------------------    --------------------
T1195.001              T1059.001           T1547.001               T1548.002
Supply Chain           PowerShell          Registry Run Keys /      Bypass User Account
Compromise: SW                             Startup Folder           Control (UAC)

T1566.001              T1053.005           T1053.005                T1055
Phishing: Spear-       Scheduled Task      Scheduled Task/Job        Process Injection
phishing Attachment

T1078                                                                T1078
Valid Accounts                                                       Valid Accounts

Credential Access      Lateral Movement    Collection              Exfiltration
------------------    ----------------    -------------------    --------------------
T1110                  T1021.001           T1005                   T1041
Brute Force            Remote Desktop      Data from Local          Exfiltration Over
                       Protocol            System                    C2 Channel

T1003                  T1570                                        T1567.002
OS Credential          Lateral Tool                                  Exfil to Cloud
Dumping                Transfer                                      Storage`}</CodeBlock>
      <p>
        Notice <code>T1078</code> (Valid Accounts) appears under both Initial Access and Privilege
        Escalation — the same technique, stolen or reused legitimate credentials, can serve an attacker at
        multiple stages of an intrusion, which is exactly why ATT&amp;CK organizes techniques by tactic
        rather than forcing one linear sequence. A single incident is usually mapped to several technique
        IDs strung together — a "chain" of the specific rows above that the actor actually walked through.
      </p>

      <h2>How analysts use ATT&amp;CK in practice</h2>
      <p>
        In day-to-day SOC work, ATT&amp;CK shows up in two very concrete ways. First, when you write up an
        alert or incident, you tag it with the technique ID it maps to — "detected T1547.001, Registry Run
        Keys persistence, on HOST-042" communicates precisely and unambiguously what was caught, in a
        vocabulary every other analyst, vendor tool, and threat intel report already shares. Compare that to
        "found a weird registry entry" — technically true, but useless for correlating with anything else.
        Second, teams build an <strong>ATT&amp;CK coverage map</strong>: a matrix of every technique versus
        whether the SOC has a working detection for it. A coverage map that's fully green under Initial
        Access but empty under Lateral Movement and Exfiltration tells you exactly where blind spots are —
        an attacker who gets past the front door would currently walk around undetected until data actually
        leaves the network. Closing those gaps, one technique at a time, is a large part of what detection
        engineering (covered in the next lesson) actually is.
      </p>

      <Callout variant="info">
        <p>
          ATT&amp;CK IDs follow a consistent pattern worth recognizing: <code>T####</code> is a technique
          (e.g. <code>T1078</code>), and a <code>.00N</code> suffix (e.g. <code>T1547.001</code>) is a
          specific <strong>sub-technique</strong> — a more precise variant of the parent technique. You'll
          see both forms cited interchangeably in threat intel reports; the sub-technique is always the more
          useful one to cite when you know it, since it points to a narrower, more testable detection.
        </p>
      </Callout>

      <p>
        The lab attached to this lesson drops you into a real SOC scenario: an alert has fired, and you
        have the raw auth log. Your job is exactly what a Tier 1 analyst does every shift — read it, find
        the pattern, and confirm what happened.
      </p>
    </div>
  );
}
