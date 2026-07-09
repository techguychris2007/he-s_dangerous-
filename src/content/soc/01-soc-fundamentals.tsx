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

      <p>
        The lab attached to this lesson drops you into a real SOC scenario: an alert has fired, and you
        have the raw auth log. Your job is exactly what a Tier 1 analyst does every shift — read it, find
        the pattern, and confirm what happened.
      </p>
    </div>
  );
}
