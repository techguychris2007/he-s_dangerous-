import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function CorrelationRules() {
  return (
    <div className="prose-hh">
      <h1>Correlation Rules: From Raw Events to Actionable Alerts</h1>
      <p>
        Event correlation is the single most powerful capability a SIEM has — and the one that separates it
        from a plain log-storage system. A correlation rule combines multiple individually-harmless-looking
        events, across different sources, into one confident finding. This lesson covers how correlation rules
        are built, and — just as importantly — how they get tuned so they catch real attacks without drowning
        analysts in false positives.
      </p>

      <h2>The core idea: no single event tells the whole story</h2>
      <CodeBlock label="the classic example">{`Individually:
  - A failed VPN login              (happens constantly, mostly typos)
  - A successful login from abroad   (business travel happens)
  - Access to a sensitive server      (normal for many roles)

Correlated together, same user, tight time window:
  -> "account compromise" — a finding no single event above would ever justify alone.`}</CodeBlock>
      <p>
        This is exactly why alert fatigue is such a persistent problem in real SOCs: if every one of those
        three events fired its own separate alert, an analyst drowning in noise would have no way to notice
        that these particular three, together, meant something. A well-built correlation rule exists
        specifically to surface the combination, not the individual pieces.
      </p>

      <h2>Writing a correlation rule</h2>
      <p>
        The simplest possible correlation rule is a threshold rule — count an event type over a time window,
        and alert if it crosses a number:
      </p>
      <CodeBlock label="the most common correlation rule in existence">{`IF 25 failed logins occur within 2 minutes
THEN generate a brute-force alert`}</CodeBlock>
      <p>
        Real correlation rules get considerably richer than a single threshold — sequence rules (event A
        followed by event B within N minutes), cross-source rules (an event in the email gateway followed by
        an event in EDR), and multi-stage kill-chain rules (phishing click → malware detonation → new admin
        account → mass file changes, the exact pattern the "Splunk: Correlating a Ransomware Kill Chain" lab
        in the SOC Portal has you reconstruct by hand) are all the same fundamental idea scaled up: combine
        weak individual signals into one strong one.
      </p>

      <h2>Tuning: the skill that actually matters day to day</h2>
      <p>
        A rule that fires correctly in a vacuum still fails in production if it also fires constantly on
        legitimate, already-explained behavior. Tuning means adding deliberate exceptions for known-noisy
        sources — a scheduled service account that retries a stale password every few seconds, for instance —
        without accidentally excluding real attack traffic that happens to resemble it.
      </p>
      <CodeBlock label="the exact false-positive vs. true-positive distinction the tuning lab has you make">{`CANDIDATE 1: user=svc_scheduler src_ip=10.10.1.9 (internal), 42 failures in 90 seconds
  -> investigated, ticketed (INC-4471), a known misconfigured retry loop
  -> correctly EXCLUDED from the rule via a documented exception

CANDIDATE 2: users=jsmith,agarcia,mwong src_ip=185.220.101.9 (external, Tor-associated)
  -> 31 failures across 3 DIFFERENT accounts in 100 seconds
  -> the TRUE POSITIVE this rule exists to catch`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Notice the distinguishing details: candidate 1 is one account, one internal source, already
          explained by an open ticket. Candidate 2 is multiple accounts, an external and reputation-flagged
          source, with no legitimate explanation on file. Tuning is the practice of encoding exactly these
          kinds of distinctions into the rule itself, so an analyst does not have to re-derive them by hand
          every single time the rule fires.
        </p>
      </Callout>

      <h2>Getting tuning wrong in both directions</h2>
      <ul>
        <li><strong>Too loose (under-tuned):</strong> the rule fires on every routine burst, analysts start
        ignoring it, and a real attack eventually hides inside the noise — the alert-fatigue failure mode.</li>
        <li><strong>Too broad an exception (over-tuned):</strong> an exclusion written to silence one specific
        known-noisy source accidentally also silences a real attacker who happens to match the same exclusion
        criteria — the opposite failure, quieter and more dangerous because nobody notices anything went
        wrong at all.</li>
      </ul>

      <Callout variant="warn">
        <p>
          Every exclusion added to a correlation rule should be as narrowly scoped as possible — tied to a
          specific account, source, and ideally an open ticket reference — rather than a broad pattern match
          that happens to be convenient today.
        </p>
      </Callout>

      <p>
        With correlation covered, the next lesson surveys the real platforms that implement all of this —
        Splunk, Microsoft Sentinel, IBM QRadar, Elastic Security, and Google Security Operations (Chronicle) —
        and how their approaches to search, correlation, and alerting differ in practice.
      </p>
    </div>
  );
}
