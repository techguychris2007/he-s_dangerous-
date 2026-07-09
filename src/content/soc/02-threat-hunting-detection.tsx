import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ThreatHuntingDetection() {
  return (
    <div className="prose-hh">
      <h1>Threat Hunting: Proactive Detection Beyond Alerts</h1>
      <p>
        Alert-driven SOC work is reactive — you wait for a rule to fire. Threat hunting flips that: an
        analyst proactively searches telemetry for evidence of compromise that never triggered any alert
        at all, working from a hypothesis instead of a ticket.
      </p>

      <h2>The hunting mindset: assume breach</h2>
      <p>
        A threat hunter starts from the assumption that an attacker is already inside, and existing
        detections missed them. The question isn't "did an alert fire?" — it's "if I were an attacker who
        got past our defenses, what would my activity look like in the data we already have?"
      </p>

      <h2>A basic hunting hypothesis, worked through</h2>
      <CodeBlock label="hypothesis: an attacker is using a phishing-delivered backdoor for C2">{`Hypothesis: If a workstation is compromised, it likely beacons out to a C2 server periodically.

Hunt query idea:
- Pull outbound connection logs for all workstations
- Group by destination IP/domain
- Look for connections with suspiciously REGULAR timing (every 60s, every 5 min) —
  humans browse irregularly; malware beacons on a schedule`}</CodeBlock>
      <p>
        This is exactly the kind of artifact you'll search for in the forensics module ahead — a C2 beacon
        URL sitting in extracted memory strings, easy to miss unless you specifically go looking for it.
      </p>

      <h2>Common hunting techniques</h2>
      <ul>
        <li><strong>Frequency analysis</strong> — what's rare in your environment? A process name seen
        once across 500 machines deserves a look.</li>
        <li><strong>Baseline deviation</strong> — what does "normal" look like for this user/system, and
        what's different today?</li>
        <li><strong>IOC sweeping</strong> — given a known-bad IP/hash/domain from threat intel, search
        historical logs for any prior contact with it.</li>
        <li><strong>Living-off-the-land detection</strong> — attackers increasingly use built-in OS tools
        (PowerShell, WMI, certutil) instead of custom malware specifically to blend in; hunting for unusual
        *combinations* of legitimate tool usage is how these get caught.</li>
      </ul>

      <h2>Detection engineering: closing the loop</h2>
      <p>
        Every successful hunt should produce a new detection rule so the SOC catches that technique
        automatically next time — this is what separates a mature security program from one that relies
        on the same manual hunt repeating forever.
      </p>
      <CodeBlock label="turning a hunt finding into a detection rule, conceptually">{`Finding: C2 beacon connects every 60 seconds to a rotating set of IPs on port 8443
Detection rule: Alert if any host makes >10 outbound connections to port 8443 with
                inter-connection timing variance under 2 seconds, sustained over 10+ minutes`}</CodeBlock>

      <Callout variant="tip">
        <p>
          The MITRE ATT&amp;CK framework is the industry-standard reference for attacker techniques,
          organized by tactic (initial access, persistence, lateral movement, exfiltration, etc.) — SOC
          teams map both detections and hunt hypotheses to it, and it's worth knowing by name even at a
          glance, since it comes up in nearly every blue-team job description and report template.
        </p>
      </Callout>

      <p>
        The labs in this module put you in the analyst's chair for exactly this kind of work: a raw log,
        a vague alert, and the job of finding — and proving — what actually happened.
      </p>
    </div>
  );
}
