import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function Ueba() {
  return (
    <div className="prose-hh">
      <h1>User &amp; Entity Behavior Analytics (UEBA)</h1>
      <p>
        Every detection rule in the previous lesson depends on someone already having written logic for a
        specific, known technique. UEBA takes a fundamentally different approach: instead of asking "does this
        match a known-bad pattern," it asks "does this match what THIS SPECIFIC user or system normally does" —
        catching attacker behavior that never trips a signature-based rule at all, simply because it looks
        wrong for the baseline, not because it matches any documented technique.
      </p>

      <h2>Building a baseline</h2>
      <p>
        UEBA continuously learns a profile for every user and entity (a workstation, a service account, a
        server) — typical login hours, typical source locations, typical data-access volume, typical
        peer-group behavior (comparing one employee against others with the same job role). Once that baseline
        exists, a deviation from it is itself the signal, independent of whether the specific technique behind
        it has ever been seen before.
      </p>
      <CodeBlock label="the same idea from the SIEM Essentials module, applied to a user's normal pattern">{`NORMAL for this user:    logs in from Ghana, 08:00-17:00 local time, weekdays
SUSPICIOUS:               same user logs in from Russia at 02:00, on a Saturday

-> no rule anywhere says "Russia is bad" or "2 AM is bad" — the finding is entirely
   relative to what THIS user's own history establishes as normal.`}</CodeBlock>

      <h2>Impossible travel: UEBA's signature detection</h2>
      <p>
        The clearest, highest-confidence UEBA finding is "impossible travel" — two logins from the same
        account, from locations a real human could not physically travel between in the time available.
      </p>
      <CodeBlock label="the exact math a UEBA engine runs">{`Login 1: Accra, Ghana        at 08:45
Login 2: Kyiv, Ukraine       at 09:03  (18 minutes later)

Straight-line distance: ~6,000 km
Fastest theoretically possible travel in 18 minutes: not even close.

-> conclusion: these are not the same physical person traveling — the credentials
   themselves, not the device, made the "trip."`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Notice what makes this detection so reliable compared to most others: there is essentially no
          legitimate explanation for it. Unlike many behavioral anomalies (which can have false-positive
          explanations — a VPN exit node, a business trip), impossible travel by definition describes
          something that cannot physically have happened as a single person's activity.
        </p>
      </Callout>

      <h2>Beyond travel: the anomaly categories UEBA typically covers</h2>
      <ul>
        <li><strong>Access volume anomalies</strong> — a user who normally touches a handful of files a day
        suddenly downloads thousands, the exact pattern behind the Marriott/Starwood breach’s eventual
        detection, where a service account’s full-table query broke years of otherwise-normal single-record
        lookup behavior.</li>
        <li><strong>Peer-group deviation</strong> — comparing one employee against others with the same title
        and department; a single financial analyst accessing systems no other analyst on the team ever touches
        is a strong signal even with no other red flag present.</li>
        <li><strong>Privilege-use anomalies</strong> — an admin account that has never been used interactively
        suddenly logging in and running commands, rather than only being used by automation as its history
        would suggest.</li>
        <li><strong>Time-of-day anomalies</strong> — activity at hours wildly outside a user's or system's
        established pattern, without needing to hardcode "after 10 PM is suspicious" as a blanket rule for
        every account regardless of that account's actual normal schedule.</li>
      </ul>

      <h2>Why UEBA complements rules instead of replacing them</h2>
      <p>
        A written detection rule is precise but only catches what someone already thought to write it for.
        UEBA catches genuinely novel attacker behavior with zero rule-writing effort, but it trades that for
        less precision — behavioral anomalies need a real human analyst to judge context in a way a
        rule-based "this exact log line means X" alert usually does not. Mature SOCs run both layers together
        deliberately, rather than treating UEBA as a strictly superior replacement for rule-based detection.
      </p>

      <Callout variant="warn">
        <p>
          UEBA needs a real baseline period (often 30-90 days) before its output is trustworthy — a brand-new
          UEBA deployment, or one just applied to a newly-hired employee with no established history yet, will
          produce noisy, low-confidence findings until enough normal behavior has actually been observed to
          learn from.
        </p>
      </Callout>

      <p>
        With both rule-based detection and behavioral baselining covered, the final lesson in this module
        turns to a third, complementary source of detection signal that depends on neither: external threat
        intelligence — knowledge someone else already gained about a specific malicious IP, domain, or file,
        that you can match against your own environment directly.
      </p>
    </div>
  );
}
