import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function WritingTuningDetectionRules() {
  return (
    <div className="prose-hh">
      <h1>Writing and Tuning Detection Rules</h1>
      <p>
        Detection engineering is the discipline of turning "we should probably catch this" into an actual,
        running, reliably-firing rule. It sits between threat hunting (finding a new pattern worth watching
        for) and SOAR automation (acting on a confirmed detection) — this lesson covers the craft of building
        the rule itself.
      </p>

      <h2>Start from a technique, not a tool</h2>
      <p>
        The strongest detection rules are written against a specific, named adversary technique — ideally
        mapped to a MITRE ATT&amp;CK technique ID — rather than against whatever a particular tool happens to
        flag. A rule written as "detect T1110 (Brute Force)" survives a vendor migration; a rule written as
        "alert when Product X's built-in brute-force score exceeds 80" does not.
      </p>
      <CodeBlock label="the same detection, framed both ways">{`WEAK:   alert when EDR's built-in "suspicious login" score > 80
STRONG: alert on T1110 (Brute Force): 25+ failed logins against one account within 2 minutes,
        from a source with no successful login in the preceding 30 days`}</CodeBlock>

      <h2>The detection lifecycle</h2>
      <CodeBlock label="a rule's life, start to finish">{`1. HYPOTHESIS   — "attackers doing X should produce Y observable evidence"
2. DATA CHECK    — do we actually collect the log source Y depends on?
3. DRAFT RULE     — write the query/logic
4. BACKTEST        — run it against historical data — does it fire on known-good AND known-bad periods correctly?
5. TUNE              — add narrow, justified exceptions for confirmed false positives
6. DEPLOY             — enable in production, monitoring its fire rate closely for the first weeks
7. MAINTAIN            — revisit periodically; environments and attacker techniques both drift over time`}</CodeBlock>
      <p>
        Step 2 is the one new engineers skip most often — a detection idea that depends on a log source you
        are not actually collecting is not a rule, it is a wish. Confirming data availability before writing
        any logic at all saves hours of wasted effort.
      </p>

      <h2>Backtesting: proving the rule before it goes live</h2>
      <p>
        Before a rule ever reaches production, run it against a stretch of historical data that includes both
        normal traffic and, ideally, a known past incident. A rule that fires zero times across months of
        normal data but also fires zero times against a confirmed past attack is worthless in either
        direction — it needs to distinguish the two.
      </p>

      <h2>Tuning: precision versus recall, made concrete</h2>
      <p>
        Every detection rule trades off two failure modes, and tuning is the practice of consciously choosing
        where on that spectrum a given rule should sit:
      </p>
      <ul>
        <li><strong>False positive</strong> — the rule fires on legitimate activity, wasting analyst time and
        breeding the alert fatigue that let the 2013 Target breach's own malware alerts go unactioned.</li>
        <li><strong>False negative</strong> — the rule stays silent on real attacker activity because it was
        tuned too conservatively (an exception written too broadly, or a threshold set too high).</li>
      </ul>
      <CodeBlock label="tuning a real exception narrowly instead of broadly">{`TOO BROAD:  exclude any login failure from 10.10.1.0/24  (an entire subnet — might hide a real attacker)
NARROW:     exclude login failures specifically from svc_scheduler@10.10.1.9,
            tied to open ticket INC-4471, reviewed quarterly for continued relevance`}</CodeBlock>
      <Callout variant="warn">
        <p>
          A subnet-wide or account-type-wide exclusion is almost always too broad — it silences exactly the
          kind of lateral-movement traffic (an attacker pivoting through an already-compromised host on that
          same subnet) a detection rule most needs to catch. Scope every exception to the single specific
          account or host it was actually written to explain, and put an expiration/review date on it.
        </p>
      </Callout>

      <h2>Worked example: a technique-specific rule for Kerberoasting</h2>
      <p>
        Putting "start from a technique, not a tool" into practice: Kerberoasting (MITRE ATT&amp;CK T1558.003)
        requests a Kerberos service ticket for every registered SPN on the domain, then cracks the tickets
        offline. Windows Security Event ID 4769 (Kerberos Service Ticket Request) is the data source; the
        technique-specific signal is two things happening together — a burst of requests for many unrelated
        services from one account, AND a preference for legacy RC4 encryption over AES, because RC4-encrypted
        tickets crack far faster offline.
      </p>
      <CodeBlock label="the same rule, run through the detection lifecycle above">{`HYPOTHESIS:  Kerberoasting produces a burst of 4769 events, one account, many unrelated
             SPNs, biased toward RC4 (0x17) over AES (0x12/0x18)
DATA CHECK:  Confirmed -- Security Event ID 4769 is already collected domain-wide
DRAFT RULE:  alert if one account requests RC4 tickets for 15+ distinct SPNs within 5 minutes
BACKTEST:    fired 0 times across 90 days of normal traffic; fired correctly against a
             simulated Rubeus/GetUserSPNs.py sweep
TUNE:        excluded one legitimate SPN-inventory scanning service account, reviewed quarterly
DEPLOY:      live -- the exact rule the "SOC: Detecting Kerberoasting" lab has you reconstruct
             by hand from the raw 4769 log, before ever seeing it expressed as a rule`}</CodeBlock>
      <p>
        This is also the direct blue-team counterpart to the offensive Kerberoasting technique taught in the
        Active Directory module — the same RC4 preference that makes a captured ticket crack faster offline
        is precisely what makes the request pattern detectable in the first place.
      </p>

      <h2>Detection-as-code</h2>
      <p>
        Mature detection engineering teams store rules as version-controlled files (often YAML or a
        platform-specific query language), reviewed via pull request like application code, rather than
        editing them ad hoc through a SIEM's web console. This gives every rule change a reviewable history —
        exactly the audit trail that makes it possible to answer "why did this rule stop firing three weeks
        ago" months after the fact.
      </p>

      <p>
        With rule-writing covered, the next lesson turns to a different detection approach entirely — one
        that does not require writing a specific rule for a specific technique at all: User and Entity
        Behavior Analytics, which learns what "normal" looks like and flags deviation from it directly.
      </p>
    </div>
  );
}
