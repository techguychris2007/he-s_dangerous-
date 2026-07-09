import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function SecureDesignPrinciples() {
  return (
    <div className="prose-hh">
      <h1>Secure Design Principles</h1>
      <p>
        These are the design-level principles that show up, in one form or another, behind nearly every
        vulnerability you've exploited and every misconfiguration you've found across this entire course.
        Naming them explicitly turns scattered intuition into a checklist you can apply to any new system.
      </p>

      <h2>The classic principle set</h2>
      <CodeBlock label="each one mapped to a lab you've already done in this course">{`Least Privilege        — every account/process gets only what it needs
                          (violated in nearly every privesc lab: overly broad sudo rules, wildcard IAM)

Fail-Secure (fail-closed) — when a control fails, it should fail to the SAFE state, not the open one
                            (a firewall that fails OPEN on crash is a fail-open design flaw)

Defense in Depth          — no single control is trusted alone (Security+ module, lesson 4)

Economy of Mechanism        — keep security-critical code as small and simple as possible;
                              complexity is where bugs hide (why minimal, auditable crypto
                              libraries are preferred over large, feature-heavy ones)

Complete Mediation           — EVERY access to EVERY resource must be checked, every time
                              (the IDOR labs across this course are exactly a Complete
                              Mediation failure — the check happened somewhere, but not
                              consistently on every request)

Open Design                   — security should not depend on the design being secret
                              ("security through obscurity is not security" — a system should
                              stay secure even if an attacker fully understands how it works,
                              with only the KEYS/credentials remaining secret)

Psychological Acceptability    — if a secure way of doing something is more annoying than an
                                insecure shortcut, users will find and use the shortcut`}</CodeBlock>

      <h2>Fail-secure vs. fail-open — a critical distinction</h2>
      <CodeBlock label="the same failure, two very different outcomes">{`Physical door lock:
  Fail-secure  — power failure -> door stays LOCKED (safe from intruders, but a fire-safety risk)
  Fail-open    — power failure -> door UNLOCKS (safe for evacuation, but a security risk)

Firewall:
  Fail-secure  — crash -> blocks ALL traffic (availability suffers, but no unauthorized access)
  Fail-open    — crash -> allows ALL traffic (availability preserved, but zero protection)`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Notice there's no universally "correct" choice — a fire exit door SHOULD fail open for
          life-safety reasons, while a firewall protecting a payment system should almost always fail
          secure. Good security engineering means deliberately choosing which failure mode fits the actual
          risk, not defaulting to one pattern everywhere.
        </p>
      </Callout>

      <h2>The principle of least astonishment</h2>
      <p>
        A system should behave the way a reasonable user expects it to. When a security control behaves
        surprisingly — silently failing, applying inconsistently, or having a name that implies different
        behavior than it actually has — users and even other engineers build an incorrect mental model of
        the system, which is exactly where dangerous misconfigurations (like several of the cloud IAM
        labs in this course) originate.
      </p>

      <h2>Secure defaults</h2>
      <p>
        Every system should ship secure by default, requiring a deliberate action to WEAKEN security rather
        than a deliberate action to strengthen it. Nearly every "misconfiguration" lab across this entire
        course — public S3 buckets, anonymous FTP, exposed Docker APIs — exists because a system's actual
        default (or an administrator's setup shortcut) was insecure, and nobody deliberately chose to make
        it more secure afterward.
      </p>

      <h2>Applying this as a design review checklist</h2>
      <CodeBlock label="questions worth asking about any new system">{`- What is the least privilege this component actually needs to function?
- If this component fails, what state does it fail into — and is that the right choice here?
- Is access checked consistently on every path to this data, or only on the "main" one?
- Does the secure way of using this system require MORE effort than the insecure way?
- What is the default configuration, and is that default itself secure?`}</CodeBlock>

      <p>
        With the design principles established, the next lesson gives you a structured method — threat
        modeling — for applying them systematically to a specific system, rather than relying on intuition
        alone.
      </p>
    </div>
  );
}
