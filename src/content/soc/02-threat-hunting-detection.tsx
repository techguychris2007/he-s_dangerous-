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

      <h2>TaHiTI: giving the hunting process itself a repeatable structure</h2>
      <p>
        The hypothesis-driven approach above is the core idea, but real hunt teams usually run it inside a
        named, repeatable methodology rather than reinventing the process every time. <strong>TaHiTI</strong>{' '}
        (Targeted Hunting integrating Threat Intelligence), developed by a consortium of Dutch financial
        institutions and widely adopted since, breaks a hunt into three phases: <strong>initiate</strong>{' '}
        (turn a trigger — new threat intel, an anomaly, a colleague's finding — into a documented, testable
        hypothesis), <strong>hunt</strong> (the actual data investigation, exactly like the C2-beaconing
        example above), and <strong>finalize</strong> (document results and, whether or not anything was
        found, feed the outcome back — a confirmed technique becomes a new detection rule, a hypothesis that
        found nothing still gets recorded so the same ground isn't re-hunted from scratch next quarter).
      </p>

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
          The MITRE ATT&amp;CK framework (covered in depth in the previous lesson) is the industry-standard
          reference for attacker techniques, organized by tactic (initial access, persistence, lateral
          movement, exfiltration, etc.) — SOC teams map both detections and hunt hypotheses to it, tagging
          each with the specific technique ID it corresponds to.
        </p>
      </Callout>

      <h2>Case study: AI-accelerated ransomware and the "speed" signal</h2>
      <p>
        Threat hunters have spent years learning to spot individual techniques being used in unfamiliar
        ways. Campaigns emerging through 2026 add a different wrinkle: none of the individual steps are
        new, but an AI/LLM orchestrator is stitching them together and adapting them in real time, at a
        pace no human operator could sustain manually. A typical chain looks almost boringly familiar on
        paper — exploit an exposed internet-facing service for initial access, harvest credentials from
        memory or config files, move laterally using those credentials, abuse a default or overly permissive
        configuration to escalate privileges, then locate and destroy backup infrastructure before deploying
        the encryptor. Every one of those steps has its own well-known ATT&amp;CK technique ID. What's
        different is the orchestration layer: an AI system selecting, sequencing, and adapting these steps
        against the specific target's environment, compressing what used to take a skilled human operator
        several days of hands-on-keyboard work into a matter of hours.
      </p>
      <CodeBlock label="the same kill chain, at two very different speeds">{`Exposed service exploited (T1190)
     -> Credential harvesting (T1003 / T1552)
          -> Lateral movement (T1021 / T1570)
               -> Default-config privilege escalation (T1078 / T1548)
                    -> Backup infrastructure destroyed (T1490 Inhibit System Recovery)
                         -> Ransomware deployed (T1486 Data Encrypted for Impact)

Manual human operator (typical, pre-2023):  multiple DAYS end to end
AI-orchestrated campaign (2026):             a few HOURS end to end`}</CodeBlock>
      <p>
        This isn't an isolated anecdote either — it reflects an industry-wide trend. The median time
        between an initial-access broker handing off a compromised network and a ransomware affiliate
        actually beginning to act on it collapsed from over 8 hours in 2022 to as little as 22 seconds in
        2025. A handoff measured in seconds is not something a human triaging a target and typing commands
        can do — it's a strong indicator that automation, not just better tooling, now sits on the attacker
        side of that handoff.
      </p>

      <Callout variant="warn">
        <p>
          The teaching point to take from this: when every individual technique in an intrusion is
          "textbook" and nothing on its own looks novel, that can itself be the anomaly. A hunter should
          treat an unusually <em>fast</em>, unusually <em>clean</em> sequence of technique combinations —
          initial access, credential theft, lateral movement, and backup destruction all correlating across
          multiple log sources within an implausibly short window — as a detection signal in its own right,
          separate from whether any single step individually trips a rule. Ask "could a human have done all
          of this, this fast, without a single misstep?" If the honest answer is no, that timing anomaly
          deserves a hunt hypothesis of its own.
        </p>
      </Callout>

      <h2>Automated social engineering: personalization at machine scale</h2>
      <p>
        Social engineering used to scale badly for attackers — writing a genuinely convincing, individually
        researched pretext for each target took real human time, which naturally capped how many people any
        one campaign could realistically target well. That constraint has largely disappeared. Threat-intel
        vendors (Proofpoint and Mandiant among them) have documented a clear shift since roughly 2023 toward
        fully automated spear-phishing pipelines: a scraper harvests employee names, titles, and reporting
        lines straight from LinkedIn and a company's own public "About Us" page in seconds, a template engine
        mail-merges that scraped data into a pretext email referencing the target's actual manager and
        actual recent hire date, and a cloned login page harvests whatever credentials the personalized
        pretext convinces someone to type in. None of it requires a human to research any individual victim.
      </p>
      <CodeBlock label="what a hunter looks for in the artifacts left behind">{`cat osint-scrape-log.txt              # confirms automated harvesting, not manual research
cat generated-phishing-template.txt   # mail-merge fields (##MANAGER_NAME##, ##HIRE_DATE##) prove automation
cat credential-harvest-log.txt        # the actual impact — which accounts need an immediate forced reset`}</CodeBlock>

      <h2>Deepfake voice fraud: when the "human verification" step is the attack</h2>
      <p>
        Voice has long been treated as a reliable out-of-band verification channel — "call to confirm" was
        standard advice specifically because impersonating a real, familiar voice used to be hard. AI
        voice-cloning has removed that assumption. In a real, publicly reported March 2019 case (Wall Street
        Journal), criminals used voice-cloning software to impersonate a UK energy firm's CEO over the phone
        and convinced a subordinate to wire approximately $243,000 to a fraudulent account — one of the
        first publicly documented "deepfake audio" fraud cases, with several comparable real incidents since
        (including a 2020 case involving roughly $35 million, reported by Forbes). The technical tell in both
        was not something a listener caught in the moment — it was logged metadata: unusual call routing and
        voice-authentication systems flagging unnaturally consistent pitch and micro-timing across the call,
        both visible only in hindsight during the post-incident review.
      </p>
      <Callout variant="incident">
        <p>
          <strong>The control that actually would have stopped it:</strong> in the 2019 case, the wire was
          approved by a single approver who granted an out-of-process exception specifically because the
          request was marked urgent and claimed to come directly from the CEO. Voice authenticity was never
          the real point of failure — bypassing the standard dual-approval control because of urgency and
          seniority was. This is why modern anti-fraud guidance for high-value wire transfers focuses on
          making the approval process itself resistant to "urgent, high-authority, out-of-band" pressure,
          rather than trying to train staff to detect increasingly convincing synthetic audio by ear.
        </p>
      </Callout>

      <p>
        The labs in this module put you in the analyst's chair for exactly this kind of work: a raw log,
        a vague alert, and the job of finding — and proving — what actually happened.
      </p>
    </div>
  );
}
