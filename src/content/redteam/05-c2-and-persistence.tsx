import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function C2AndPersistence() {
  return (
    <div className="prose-hh">
      <h1>Command &amp; Control Frameworks &amp; Post-Exploitation Persistence</h1>
      <p>
        Everything in the last three lessons gets you a foothold and, eventually, Domain Admin. This lesson
        covers what a real operator does <em>during</em> that engagement to stay connected to compromised
        hosts, and how they make sure access survives a reboot — the two problems every C2 framework and
        every persistence technique exists to solve.
      </p>

      <h2>What a C2 framework actually is</h2>
      <p>
        A command-and-control (C2) framework is the operator's remote-control layer: an implant ("beacon" or
        "agent") runs on the compromised host and periodically calls home to a listener the operator
        controls, checking for new instructions and returning results. It is the same client-server shape as
        any remote-management tool — the difference is that a red team's C2 traffic is deliberately built to
        blend into ordinary network noise instead of announcing itself.
      </p>
      <CodeBlock label="the three pieces of every C2 setup">{`Operator console  — where the human red teamer issues commands ("run this," "screenshot", "pivot here")
Listener           — the server-side component the beacon calls home to (often fronted by a CDN or redirector)
Beacon / implant    — the small agent running on the compromised host, checking in on an interval`}</CodeBlock>

      <h2>The frameworks you'll actually see named in reports</h2>
      <p>
        Cobalt Strike is the long-standing commercial standard — it is also, unfortunately, the single most
        common toolkit found in real ransomware intrusions, because leaked/cracked copies circulate widely.
        Sliver, Mythic, and Havoc are open-source alternatives popular with both legitimate red teams and
        less sophisticated criminal groups precisely because they're free and actively maintained. Knowing
        these names matters less than understanding the pattern: every one of them implements the same
        beacon/listener/operator-console shape above.
      </p>
      <Callout variant="info">
        <p>
          When an incident response report says "Cobalt Strike beacon detected," that's a specific,
          fingerprintable network and process pattern — not just "the attacker used some hacking tool." This
          platform's SOC track includes a dedicated Cobalt Strike beacon-detection lab for exactly that
          reason: recognizing this pattern is a real, hireable blue-team skill.
        </p>
      </Callout>

      <h2>Jitter and malleable profiles: why beacon traffic doesn't look like a heartbeat</h2>
      <p>
        A beacon that checks in every exactly 60 seconds is trivial to spot in network logs — the interval
        alone is a giveaway. Real C2 frameworks add <strong>jitter</strong>, a random percentage variance
        around the base sleep interval, so callbacks land at irregular times. Cobalt Strike goes further with
        "malleable C2 profiles" — configuration files that reshape the beacon's HTTP traffic to mimic a
        specific real service (a fake Google Analytics request, a fake Slack API call), so the traffic
        pattern itself passes a casual glance.
      </p>
      <CodeBlock label="conceptually, a malleable profile decides">{`- What URI paths the beacon requests (e.g. /analytics/collect instead of /beacon)
- What HTTP headers and User-Agent string it sends
- How the actual C2 data gets encoded inside otherwise-normal-looking request/response bodies`}</CodeBlock>

      <h2>Post-exploitation persistence: surviving a reboot</h2>
      <p>
        A beacon only exists in memory by default — reboot the host and it's gone. Persistence mechanisms
        are how an operator (or, in a real intrusion, an attacker) makes sure their access comes back
        automatically. These are Windows-specific but the underlying idea — "make the OS launch my payload
        for me, using a legitimate-looking mechanism" — applies everywhere.
      </p>
      <CodeBlock label="the standard Windows persistence toolkit">{`Scheduled Task     — schtasks /create ... runs the payload on a timer or at logon, looks like routine automation
Registry Run key   — HKCU/HKLM ...\\Run — payload launches every time that user (or the machine) logs in
Service creation   — a new Windows service set to auto-start launches the payload with SYSTEM privileges
WMI event subscription — payload fires on a WMI event (e.g. "on logon"), leaves no scheduled-task/service artifact at all`}</CodeBlock>
      <p>
        WMI event subscriptions are the quietest of the four precisely because they don't show up in the
        places defenders check first (Task Scheduler, Services) — which is exactly why MITRE ATT&amp;CK
        tracks it as its own technique (T1546.003) rather than folding it into "scheduled task."
      </p>

      <h2>Credential-based persistence: when the persistence IS a forged credential</h2>
      <p>
        Everything above assumes persistence means "make the OS run my payload again." A second, entirely
        different persistence category doesn't touch the filesystem or the Task Scheduler at all: a forged
        or planted <em>credential</em> that keeps working indefinitely. The previous lesson's Silver Ticket
        (forged from a service account's own hash, valid until that service account's password is rotated)
        and Shadow Credentials (an attacker-planted certificate in a target's{' '}
        <code>msDS-KeyCredentialLink</code>, valid until someone specifically audits and removes it) are both
        this kind of persistence — no scheduled task for Autoruns to enumerate, no service for a defender to
        spot, because there's no auto-start artifact on disk anywhere. The "artifact" is a piece of AD state
        that looks like ordinary account configuration unless you're specifically auditing for it.
      </p>
      <Callout variant="warn">
        <p>
          This is exactly why real AD incident response, after any suspected compromise, treats a KRBTGT
          reset and a Shadow-Credentials/<code>msDS-KeyCredentialLink</code> audit as standard checklist
          items alongside the usual host-based persistence sweep — a fully remediated, malware-free host can
          still hand an attacker their access straight back if either of these is left unaudited.
        </p>
      </Callout>

      <h2>Detecting persistence and beaconing from the blue-team side</h2>
      <p>
        None of these techniques are invisible. Beaconing traffic, however well-jittered, still produces a
        statistically regular pattern over enough observations — plot inter-request timing for a single host
        over a few hours and a real beacon still stands out from genuinely random human browsing. Persistence
        mechanisms all touch a small, well-known set of locations (Run keys, the Task Scheduler store,
        Services, WMI subscriptions), which is exactly what tools like Sysinternal's Autoruns enumerate in
        one pass.
      </p>
      <CodeBlock label="the blue-team baseline, conceptually">{`autoruns.exe /accepteula   # enumerate every auto-start location in one pass, then diff it against a known-good baseline
# anything new since last week's baseline, especially anything with no valid publisher signature, gets investigated first`}</CodeBlock>
      <Callout variant="tip">
        <p>
          "New, unsigned, auto-start entry that appeared this week" is a far higher-signal alert than trying
          to catch the beacon traffic itself — this is why mature blue teams baseline persistence locations
          as aggressively as they monitor network traffic.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          C2 frameworks and persistence techniques are standard red team tooling used under explicit written
          authorization, on infrastructure the operator is contracted to test. Deploying a beacon or
          persistence mechanism on any system without that authorization is unauthorized computer access —
          the exact same techniques described here are what turn a red team engagement into a real ransomware
          intrusion when used without consent.
        </p>
      </Callout>

      <h2>Module complete</h2>
      <p>
        You now have the full internal-operations picture: foothold → lateral movement → AD enumeration →
        Kerberos-based privilege escalation → C2-based remote control and persistence. That is the complete
        narrative arc a real red team report follows, from initial access to a fully persistent domain
        compromise.
      </p>
    </div>
  );
}
